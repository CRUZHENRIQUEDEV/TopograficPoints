/**
 * VISUALIZATION MODULE
 * Módulo responsável pela visualização gráfica das estruturas no canvas
 */

class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.currentZoom = ZOOM_CONFIG.DEFAULT;
        this.currentRotation = 0;
    }

    /**
     * Limpa o canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Desenha visualização completa das estruturas
     * @param {Object} points1 - Pontos da estrutura 1
     * @param {Object} points2 - Pontos da estrutura 2 (opcional)
     */
    drawVisualization(points1, points2 = {}) {
        debugLog("=== INICIANDO DESENHO ===");
        this.clear();

        const allPoints = this.getAllStructurePoints(points1, points2);
        if (allPoints.length === 0) {
            debugLog("ERRO: Nenhum ponto para desenhar");
            return;
        }

        const bounds = this.calculateRenderingBounds(allPoints);
        const transform = this.calculateTransform(bounds, Object.keys(points2).length > 0);

        const struct1 = this.drawStructure(points1, VISUAL_CONFIG.COLORS.STRUCTURE_1, "(1)", transform, bounds);
        const struct2 = Object.keys(points2).length > 0 ? 
            this.drawStructure(points2, VISUAL_CONFIG.COLORS.STRUCTURE_2, "(2)", transform, bounds) : null;

        if (struct1 && struct2) {
            this.drawConnectionLine(struct1, struct2, transform);
        }

        debugLog("Desenho concluído");
        return { struct1, struct2 };
    }

    /**
     * Obtém todos os pontos de estrutura
     * @param {Object} points1 - Pontos da estrutura 1
     * @param {Object} points2 - Pontos da estrutura 2
     * @returns {Array} Array com todos os pontos
     */
    getAllStructurePoints(points1, points2) {
        let allPoints = [];
        
        if (Object.keys(points1).length > 0) {
            allPoints = allPoints.concat(Object.values(points1));
        }
        
        if (Object.keys(points2).length > 0) {
            allPoints = allPoints.concat(Object.values(points2));
        }
        
        debugLog(`Total pontos para desenhar: ${allPoints.length}`);
        return allPoints;
    }

    /**
     * Calcula limites de renderização
     * @param {Array} allPoints - Todos os pontos
     * @returns {Object} Limites {minX, maxX, minY, maxY, minElev, maxElev}
     */
    calculateRenderingBounds(allPoints) {
        const xs = allPoints.map(p => p.x);
        const ys = allPoints.map(p => p.y);
        const elevs = allPoints.map(p => p.elevation);

        const bounds = {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys),
            minElev: Math.min(...elevs),
            maxElev: Math.max(...elevs)
        };

        debugLog(`Coordenadas - X: ${bounds.minX} a ${bounds.maxX}, Y: ${bounds.minY} a ${bounds.maxY}`);
        debugLog(`Elevações - Min: ${bounds.minElev}, Max: ${bounds.maxElev}`);
        
        return bounds;
    }

    /**
     * Calcula transformação para renderização
     * @param {Object} bounds - Limites de renderização
     * @param {boolean} hasTwoStructures - Se há duas estruturas
     * @returns {Object} Parâmetros de transformação
     */
    calculateTransform(bounds, hasTwoStructures) {
        const margin = VISUAL_CONFIG.CANVAS.MARGIN;
        const dataRangeX = bounds.maxX - bounds.minX;
        const dataRangeY = bounds.maxY - bounds.minY;
        
        const rotationRad = CoordinateUtils.degreesToRadians(this.currentRotation);
        const cosTheta = Math.abs(Math.cos(rotationRad));
        const sinTheta = Math.abs(Math.sin(rotationRad));
        
        const effectiveWidth = dataRangeX * cosTheta + dataRangeY * sinTheta;
        const effectiveHeight = dataRangeX * sinTheta + dataRangeY * cosTheta;
        
        const scaleX = (this.canvas.width - 2 * margin) / effectiveWidth;
        const scaleY = (this.canvas.height - 2 * margin) / effectiveHeight;
        const scaleFactor = hasTwoStructures ? 0.3 : 0.5;
        const scale = Math.min(scaleX, scaleY) * scaleFactor * this.currentZoom;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const dataCenterX = (bounds.minX + bounds.maxX) / 2;
        const dataCenterY = (bounds.minY + bounds.maxY) / 2;

        return {
            scale,
            centerX,
            centerY,
            dataCenterX,
            dataCenterY,
            rotationRad
        };
    }

    /**
     * Converte coordenadas do mundo para canvas
     * @param {Object} point - Ponto com coordenadas mundo
     * @param {Object} transform - Parâmetros de transformação
     * @returns {Object} Coordenadas canvas {x, y}
     */
    toCanvasCoords(point, transform) {
        const relX = point.x - transform.dataCenterX;
        const relY = point.y - transform.dataCenterY;
        
        const cosTheta = Math.cos(transform.rotationRad);
        const sinTheta = Math.sin(transform.rotationRad);
        
        const rotatedX = relX * cosTheta - relY * sinTheta;
        const rotatedY = relX * sinTheta + relY * cosTheta;
        
        return {
            x: transform.centerX + rotatedX * transform.scale,
            y: transform.centerY - rotatedY * transform.scale,
        };
    }

    /**
     * Desenha uma estrutura completa
     * @param {Object} points - Pontos da estrutura
     * @param {string} color - Cor da estrutura
     * @param {string} label - Rótulo da estrutura
     * @param {Object} transform - Parâmetros de transformação
     * @param {Object} bounds - Limites de renderização
     * @returns {Object|null} Estrutura desenhada ou null se erro
     */
    drawStructure(points, color, label, transform, bounds) {
        debugLog(`Desenhando estrutura ${label}`);
        
        const structurePoints = this.findStructurePoints(points);
        if (!structurePoints) {
            debugLog("ERRO: Nem todos os pontos da estrutura foram encontrados");
            return null;
        }

        const canvasCoords = this.convertToCanvasCoords(structurePoints, transform);
        
        this.drawStructureOutline(canvasCoords, color);
        this.drawStructurePoints(structurePoints, canvasCoords, bounds, label);

        return structurePoints;
    }

    /**
     * Encontra pontos específicos da estrutura
     * @param {Object} points - Todos os pontos
     * @returns {Object|null} Pontos da estrutura ou null se incompleto
     */
    findStructurePoints(points) {
        const ldInicio = Object.values(points).find(p => 
            p.code.includes("LD_INICIO_OAE") || p.name.includes("LD_INICIO_OAE") ||
            p.originalCode.includes("LD_INICIO_OAE") || p.originalName.includes("LD_INICIO_OAE")
        );
        
        const leInicio = Object.values(points).find(p => 
            p.code.includes("LE_INICIO_OAE") || p.name.includes("LE_INICIO_OAE") ||
            p.originalCode.includes("LE_INICIO_OAE") || p.originalName.includes("LE_INICIO_OAE")
        );
        
        const ldFinal = Object.values(points).find(p => 
            p.code.includes("LD_FINAL_OAE") || p.name.includes("LD_FINAL_OAE") ||
            p.originalCode.includes("LD_FINAL_OAE") || p.originalName.includes("LD_FINAL_OAE")
        );
        
        const leFinal = Object.values(points).find(p => 
            p.code.includes("LE_FINAL_OAE") || p.name.includes("LE_FINAL_OAE") ||
            p.originalCode.includes("LE_FINAL_OAE") || p.originalName.includes("LE_FINAL_OAE")
        );

        debugLog(`Pontos encontrados - LD Início: ${!!ldInicio}, LE Início: ${!!leInicio}, LD Final: ${!!ldFinal}, LE Final: ${!!leFinal}`);

        if (!ldInicio || !leInicio || !ldFinal || !leFinal) {
            return null;
        }

        return { ldInicio, leInicio, ldFinal, leFinal };
    }

    /**
     * Converte pontos da estrutura para coordenadas canvas
     * @param {Object} structurePoints - Pontos da estrutura
     * @param {Object} transform - Parâmetros de transformação
     * @returns {Object} Coordenadas canvas dos pontos
     */
    convertToCanvasCoords(structurePoints, transform) {
        return {
            ldInicio: this.toCanvasCoords(structurePoints.ldInicio, transform),
            leInicio: this.toCanvasCoords(structurePoints.leInicio, transform),
            ldFinal: this.toCanvasCoords(structurePoints.ldFinal, transform),
            leFinal: this.toCanvasCoords(structurePoints.leFinal, transform)
        };
    }

    /**
     * Desenha contorno da estrutura
     * @param {Object} canvasCoords - Coordenadas canvas
     * @param {string} color - Cor do contorno
     */
    drawStructureOutline(canvasCoords, color) {
        this.ctx.strokeStyle = color;
        const rectLineWidth = Math.max(1, Math.min(4, 2 * Math.sqrt(this.currentZoom)));
        this.ctx.lineWidth = rectLineWidth;
        
        this.ctx.beginPath();
        this.ctx.moveTo(canvasCoords.ldInicio.x, canvasCoords.ldInicio.y);
        this.ctx.lineTo(canvasCoords.leInicio.x, canvasCoords.leInicio.y);
        this.ctx.lineTo(canvasCoords.leFinal.x, canvasCoords.leFinal.y);
        this.ctx.lineTo(canvasCoords.ldFinal.x, canvasCoords.ldFinal.y);
        this.ctx.closePath();
        this.ctx.stroke();

        // Preencher com transparência
        this.fillStructureArea(canvasCoords, color);
    }

    /**
     * Preenche área da estrutura com transparência
     * @param {Object} canvasCoords - Coordenadas canvas
     * @param {string} color - Cor base
     */
    fillStructureArea(canvasCoords, color) {
        const alpha = color === VISUAL_CONFIG.COLORS.STRUCTURE_1 ? "0.08" : "0.04";
        
        if (color.startsWith("#")) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else {
            this.ctx.fillStyle = color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
        }
        
        this.ctx.fill();
    }

    /**
     * Desenha pontos da estrutura com informações
     * @param {Object} structurePoints - Pontos da estrutura
     * @param {Object} canvasCoords - Coordenadas canvas
     * @param {Object} bounds - Limites de renderização
     * @param {string} label - Rótulo da estrutura
     */
    drawStructurePoints(structurePoints, canvasCoords, bounds, label) {
        const pointsData = [
            { point: structurePoints.ldInicio, canvas: canvasCoords.ldInicio, 
              baseColor: VISUAL_CONFIG.COLORS.LD_POINT, label: `LD INÍCIO ${label}` },
            { point: structurePoints.leInicio, canvas: canvasCoords.leInicio, 
              baseColor: VISUAL_CONFIG.COLORS.LE_POINT, label: `LE INÍCIO ${label}` },
            { point: structurePoints.ldFinal, canvas: canvasCoords.ldFinal, 
              baseColor: VISUAL_CONFIG.COLORS.LD_POINT, label: `LD FINAL ${label}` },
            { point: structurePoints.leFinal, canvas: canvasCoords.leFinal, 
              baseColor: VISUAL_CONFIG.COLORS.LE_POINT, label: `LE FINAL ${label}` },
        ];

        pointsData.forEach(data => {
            this.drawPoint(data, bounds);
        });
    }

    /**
     * Desenha um ponto individual com informações
     * @param {Object} data - Dados do ponto
     * @param {Object} bounds - Limites de renderização
     */
    drawPoint(data, bounds) {
        const { point, canvas, baseColor, label } = data;
        const elevationColor = ElevationCalculator.getElevationColor(
            point.elevation, bounds.minElev, bounds.maxElev
        );
        
        // Círculo externo (cor base)
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        const pointRadius = Math.max(2, Math.min(8, 4 * Math.sqrt(this.currentZoom)));
        this.ctx.arc(canvas.x, canvas.y, pointRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Círculo interno (cor de elevação)
        this.ctx.fillStyle = elevationColor;
        this.ctx.beginPath();
        this.ctx.arc(canvas.x, canvas.y, pointRadius * 0.7, 0, 2 * Math.PI);
        this.ctx.fill();

        // Texto com informações
        this.drawPointLabels(point, canvas, bounds.maxElev, label);
    }

    /**
     * Desenha rótulos do ponto
     * @param {Object} point - Ponto
     * @param {Object} canvas - Coordenadas canvas
     * @param {number} maxElev - Elevação máxima para cálculo relativo
     * @param {string} label - Rótulo do ponto
     */
    drawPointLabels(point, canvas, maxElev, label) {
        const zoomFactor = Math.max(0.3, Math.min(2.0, 2.0 / Math.sqrt(this.currentZoom)));
        
        // Rótulo principal
        this.ctx.fillStyle = "#333";
        const fontSize = Math.max(4, 12 * zoomFactor);
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = "center";
        const labelOffset = Math.max(4, 15 * zoomFactor);
        this.ctx.fillText(label, canvas.x, canvas.y - labelOffset);
        
        // Elevação global
        const elevFontSize = Math.max(3, 9 * zoomFactor);
        this.ctx.font = `${elevFontSize}px Arial`;
        this.ctx.fillStyle = "#555";
        const elevOffset1 = Math.max(2, 8 * zoomFactor);
        const elevOffset2 = Math.max(4, 16 * zoomFactor);
        this.ctx.fillText(
            `Glob: ${point.elevation.toFixed(3)}m`, 
            canvas.x, 
            canvas.y + labelOffset + elevOffset1
        );
        
        // Elevação relativa
        const relativeElev = point.elevation - maxElev;
        if (Math.abs(relativeElev) < 0.001) {
            this.ctx.fillStyle = "#ff0000";
            this.ctx.font = `bold ${elevFontSize}px Arial`;
        } else {
            this.ctx.fillStyle = "#666";
            this.ctx.font = `${elevFontSize}px Arial`;
        }
        
        this.ctx.fillText(
            `Rel: ${relativeElev.toFixed(3)}m`, 
            canvas.x, 
            canvas.y + labelOffset + elevOffset2
        );
    }

    /**
     * Desenha linha de conexão entre estruturas
     * @param {Object} struct1 - Primeira estrutura
     * @param {Object} struct2 - Segunda estrutura
     * @param {Object} transform - Parâmetros de transformação
     */
    drawConnectionLine(struct1, struct2, transform) {
        const leInicio1Canvas = this.toCanvasCoords(struct1.leInicio, transform);
        const ldInicio2Canvas = this.toCanvasCoords(struct2.ldInicio, transform);

        // Linha tracejada
        this.ctx.strokeStyle = VISUAL_CONFIG.COLORS.CONNECTION;
        const lineWidth = Math.max(1, Math.min(6, 3 * Math.sqrt(this.currentZoom)));
        this.ctx.lineWidth = lineWidth;
        const dashLength = Math.max(4, Math.min(20, 12 * Math.sqrt(this.currentZoom)));
        this.ctx.setLineDash([dashLength, dashLength/2]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(leInicio1Canvas.x, leInicio1Canvas.y);
        this.ctx.lineTo(ldInicio2Canvas.x, ldInicio2Canvas.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Rótulo com distância
        this.drawConnectionLabel(leInicio1Canvas, ldInicio2Canvas, struct1, struct2);
    }

    /**
     * Desenha rótulo da conexão com distância
     * @param {Object} canvas1 - Coordenadas canvas ponto 1
     * @param {Object} canvas2 - Coordenadas canvas ponto 2
     * @param {Object} struct1 - Primeira estrutura
     * @param {Object} struct2 - Segunda estrutura
     */
    drawConnectionLabel(canvas1, canvas2, struct1, struct2) {
        const zoomFactor = Math.max(0.3, Math.min(2.0, 2.0 / Math.sqrt(this.currentZoom)));
        const offsetDistance = Math.max(40, Math.min(150, 80 * Math.sqrt(this.currentZoom)));
        
        const rotationRad = CoordinateUtils.degreesToRadians(this.currentRotation);
        const offsetX = offsetDistance * Math.cos(-rotationRad);
        const offsetY = offsetDistance * Math.sin(-rotationRad);
        
        const midX = (canvas1.x + canvas2.x) / 2 + offsetX;
        const midY = (canvas1.y + canvas2.y) / 2 + offsetY;
        const crossDistance = DistanceCalculator.calculateDistance(struct1.leInicio, struct2.ldInicio);
        
        // Fundo do rótulo
        const textWidth = Math.max(60, 110 * zoomFactor);
        const textHeight = Math.max(20, 35 * zoomFactor);
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        this.ctx.fillRect(midX - textWidth/2, midY - textHeight/2, textWidth, textHeight);
        
        this.ctx.strokeStyle = VISUAL_CONFIG.COLORS.CONNECTION;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(midX - textWidth/2, midY - textHeight/2, textWidth, textHeight);
        
        // Texto da distância
        this.ctx.fillStyle = VISUAL_CONFIG.COLORS.CONNECTION;
        const crossFontSize = Math.max(6, 18 * zoomFactor);
        this.ctx.font = `bold ${crossFontSize}px Arial`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(`${crossDistance.toFixed(3)}m`, midX, midY);
    }

    /**
     * Define zoom atual
     * @param {number} zoom - Novo valor de zoom
     */
    setZoom(zoom) {
        this.currentZoom = Math.max(ZOOM_CONFIG.MIN, Math.min(ZOOM_CONFIG.MAX, zoom));
    }

    /**
     * Obtém zoom atual
     * @returns {number} Zoom atual
     */
    getZoom() {
        return this.currentZoom;
    }

    /**
     * Define rotação atual
     * @param {number} rotation - Rotação em graus
     */
    setRotation(rotation) {
        this.currentRotation = rotation % 360;
    }

    /**
     * Obtém rotação atual
     * @returns {number} Rotação atual em graus
     */
    getRotation() {
        return this.currentRotation;
    }
}