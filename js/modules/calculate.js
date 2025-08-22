/**
 * CALCULATIONS MODULE
 * Módulo responsável por todos os cálculos de distâncias, elevações e inclinações
 */

class DistanceCalculator {
    /**
     * Calcula distância euclidiana entre dois pontos (3D real)
     * @param {Object} point1 - Primeiro ponto
     * @param {Object} point2 - Segundo ponto
     * @returns {number} Distância em metros
     */
    static calculateDistance(point1, point2) {
        const x1 = parseFloat(point1.x);
        const y1 = parseFloat(point1.y);
        const x2 = parseFloat(point2.x);
        const y2 = parseFloat(point2.y);

        const deltaX = x2 - x1;
        const deltaY = y2 - y1;

        let distance;

        if ((point1.coordType === 'UTM' && point2.coordType === 'UTM') || 
            (point1.coordType === 'PLANE' && point2.coordType === 'PLANE')) {
            // Para coordenadas UTM ou planas, cálculo direto
            distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        } 
        else if ((point1.coordType === 'GEO' && point2.coordType === 'GEO') ||
                 (CoordinateUtils.isValidGeoCoordinate(x1, y1) && 
                  CoordinateUtils.isValidGeoCoordinate(x2, y2))) {
            // Para coordenadas geográficas, conversão para metros
            distance = this.calculateGeoDistance(x1, y1, x2, y2);
        }
        else {
            // Fallback para cálculo direto
            distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        }

        return distance;
    }

    /**
     * Calcula largura transversal (apenas componente X - sem diagonal)
     * @param {Object} point1 - Primeiro ponto
     * @param {Object} point2 - Segundo ponto
     * @returns {number} Largura transversal em metros
     */
    static calculateTransversalWidth(point1, point2) {
        const x1 = parseFloat(point1.x);
        const x2 = parseFloat(point2.x);

        let width;

        if ((point1.coordType === 'GEO' && point2.coordType === 'GEO') ||
            (CoordinateUtils.isValidGeoCoordinate(x1, 0) && 
             CoordinateUtils.isValidGeoCoordinate(x2, 0))) {
            // Para coordenadas geográficas, converter diferença de longitude para metros
            const y1 = parseFloat(point1.y);
            const y2 = parseFloat(point2.y);
            const avgLatRad = ((y1 + y2) / 2 * Math.PI) / 180;
            width = Math.abs(x2 - x1) * COORDINATE_CONFIG.UTM.METERS_PER_DEGREE * Math.cos(avgLatRad);
        } else {
            // Para UTM ou coordenadas planas, apenas a diferença em X
            width = Math.abs(x2 - x1);
        }

        return width;
    }

    /**
     * Calcula distância entre coordenadas geográficas
     * @param {number} x1 - Longitude do ponto 1
     * @param {number} y1 - Latitude do ponto 1
     * @param {number} x2 - Longitude do ponto 2
     * @param {number} y2 - Latitude do ponto 2
     * @returns {number} Distância em metros
     */
    static calculateGeoDistance(x1, y1, x2, y2) {
        const lat1Rad = (y1 * Math.PI) / 180;
        const lat2Rad = (y2 * Math.PI) / 180;
        const avgLatRad = (lat1Rad + lat2Rad) / 2;

        const deltaLatM = (y2 - y1) * COORDINATE_CONFIG.UTM.METERS_PER_DEGREE;
        const deltaLonM = (x2 - x1) * COORDINATE_CONFIG.UTM.METERS_PER_DEGREE * Math.cos(avgLatRad);

        return Math.sqrt(deltaLatM * deltaLatM + deltaLonM * deltaLonM);
    }

    /**
     * Calcula diferença de elevação entre dois pontos
     * @param {Object} point1 - Primeiro ponto
     * @param {Object} point2 - Segundo ponto
     * @returns {number} Diferença de elevação (point2 - point1)
     */
    static calculateElevationDifference(point1, point2) {
        const elev1 = parseFloat(point1.elevation);
        const elev2 = parseFloat(point2.elevation);
        return elev2 - elev1;
    }
}

class InclinationCalculator {
    /**
     * Calcula inclinação usando distância real (3D)
     * @param {Object} point1 - Primeiro ponto
     * @param {Object} point2 - Segundo ponto
     * @returns {Object} Dados da inclinação
     */
    static calculateInclination(point1, point2) {
        const distance = DistanceCalculator.calculateDistance(point1, point2);
        const elevationDiff = DistanceCalculator.calculateElevationDifference(point1, point2);
        
        return this.calculateInclinationFromValues(distance, elevationDiff);
    }

    /**
     * Calcula inclinação transversal usando largura correta (sem diagonal)
     * @param {Object} point1 - Primeiro ponto
     * @param {Object} point2 - Segundo ponto
     * @returns {Object} Dados da inclinação transversal
     */
    static calculateTransversalInclination(point1, point2) {
        const transversalWidth = DistanceCalculator.calculateTransversalWidth(point1, point2);
        const elevationDiff = DistanceCalculator.calculateElevationDifference(point1, point2);
        
        return this.calculateInclinationFromValues(transversalWidth, elevationDiff);
    }

    /**
     * Calcula inclinação a partir de distância e diferença de elevação
     * @param {number} distance - Distância horizontal
     * @param {number} elevationDiff - Diferença de elevação
     * @returns {Object} Dados da inclinação
     */
    static calculateInclinationFromValues(distance, elevationDiff) {
        if (distance === 0) {
            return { 
                percentage: 0, 
                degrees: 0, 
                ratio: "0:1",
                direction: "➡️ Nivelado"
            };
        }
        
        const percentage = (Math.abs(elevationDiff) / distance) * 100;
        const degrees = Math.atan(Math.abs(elevationDiff) / distance) * (180 / Math.PI);
        const ratio = Math.abs(elevationDiff) > 0 ? 
            `1:${(distance / Math.abs(elevationDiff)).toFixed(1)}` : "∞:1";
        
        let direction;
        if (elevationDiff > 0.001) {
            direction = "↗️ Subida";
        } else if (elevationDiff < -0.001) {
            direction = "↘️ Descida";
        } else {
            direction = "➡️ Nivelado";
        }
        
        return { 
            percentage: percentage, 
            degrees: degrees, 
            ratio: ratio,
            direction: direction
        };
    }
}

class StatusCalculator {
    /**
     * Determina status da inclinação baseado nos limites técnicos
     * @param {Object} inclination - Dados da inclinação
     * @param {boolean} isTransversal - Se é inclinação transversal
     * @returns {Object} Status da inclinação
     */
    static getInclinationStatus(inclination, isTransversal = false) {
        const limit = isTransversal ? 
            TECHNICAL_LIMITS.TRANSVERSAL : 
            TECHNICAL_LIMITS.LONGITUDINAL;
        
        const percentage = inclination.percentage;
        
        if (percentage > limit) {
            return { 
                class: "critical-warning-card", 
                icon: STATUS_CONFIG.ICONS.CRITICAL, 
                text: `${MESSAGES.STATUS_MESSAGES.ABOVE_LIMIT} (>${limit}%)`,
                color: STATUS_CONFIG.COLORS.CRITICAL
            };
        } else if (percentage > limit * STATUS_CONFIG.WARNING_THRESHOLD) {
            return { 
                class: "warning-card", 
                icon: STATUS_CONFIG.ICONS.WARNING, 
                text: `${MESSAGES.STATUS_MESSAGES.NEAR_LIMIT} (${(limit * STATUS_CONFIG.WARNING_THRESHOLD).toFixed(1)}-${limit}%)`,
                color: STATUS_CONFIG.COLORS.WARNING
            };
        } else if (percentage > limit * STATUS_CONFIG.MODERATE_THRESHOLD) {
            return { 
                class: "acceptable-card", 
                icon: STATUS_CONFIG.ICONS.MODERATE, 
                text: `${MESSAGES.STATUS_MESSAGES.MODERATE} (${(limit * STATUS_CONFIG.MODERATE_THRESHOLD).toFixed(1)}-${(limit * STATUS_CONFIG.WARNING_THRESHOLD).toFixed(1)}%)`,
                color: STATUS_CONFIG.COLORS.MODERATE
            };
        } else {
            return { 
                class: "good-card", 
                icon: STATUS_CONFIG.ICONS.GOOD, 
                text: `${MESSAGES.STATUS_MESSAGES.WITHIN_LIMIT} (<${(limit * STATUS_CONFIG.MODERATE_THRESHOLD).toFixed(1)}%)`,
                color: STATUS_CONFIG.COLORS.GOOD
            };
        }
    }

    /**
     * Analisa problemas de conformidade em uma estrutura
     * @param {Object} inclinations - Objeto com todas as inclinações
     * @returns {Object} Análise de problemas
     */
    static analyzeComplianceProblems(inclinations) {
        const problems = {
            transversais: [],
            longitudinais: [],
            total: 0
        };

        // Verificar inclinações transversais
        if (inclinations.transversalInicio && 
            inclinations.transversalInicio.percentage > TECHNICAL_LIMITS.TRANSVERSAL) {
            problems.transversais.push("Transversal Início (LD↔LE)");
        }

        if (inclinations.transversalFinal && 
            inclinations.transversalFinal.percentage > TECHNICAL_LIMITS.TRANSVERSAL) {
            problems.transversais.push("Transversal Final (LD↔LE)");
        }

        // Verificar inclinações longitudinais
        if (inclinations.longitudinalLD && 
            inclinations.longitudinalLD.percentage > TECHNICAL_LIMITS.LONGITUDINAL) {
            problems.longitudinais.push("Longitudinal LD (Direito)");
        }

        if (inclinations.longitudinalLE && 
            inclinations.longitudinalLE.percentage > TECHNICAL_LIMITS.LONGITUDINAL) {
            problems.longitudinais.push("Longitudinal LE (Esquerdo)");
        }

        problems.total = problems.transversais.length + problems.longitudinais.length;
        return problems;
    }
}

class ElevationCalculator {
    /**
     * Calcula cor baseada na elevação relativa
     * @param {number} elevation - Elevação do ponto
     * @param {number} minElev - Elevação mínima
     * @param {number} maxElev - Elevação máxima
     * @returns {string} Cor hexadecimal
     */
    static getElevationColor(elevation, minElev, maxElev) {
        if (maxElev === minElev) return VISUAL_CONFIG.COLORS.ELEVATION.LOW;
        
        const normalized = (elevation - minElev) / (maxElev - minElev);
        
        if (normalized < 0.25) return VISUAL_CONFIG.COLORS.ELEVATION.LOW;
        else if (normalized < 0.5) return VISUAL_CONFIG.COLORS.ELEVATION.MEDIUM;
        else if (normalized < 0.75) return VISUAL_CONFIG.COLORS.ELEVATION.HIGH;
        else return VISUAL_CONFIG.COLORS.ELEVATION.VERY_HIGH;
    }

    /**
     * Calcula estatísticas de elevação para um conjunto de pontos
     * @param {Array} points - Array de pontos
     * @returns {Object} Estatísticas de elevação
     */
    static calculateElevationStats(points) {
        if (!points || points.length === 0) {
            return { min: 0, max: 0, avg: 0, range: 0 };
        }

        const elevations = points.map(p => p.elevation);
        const min = Math.min(...elevations);
        const max = Math.max(...elevations);
        const avg = elevations.reduce((sum, elev) => sum + elev, 0) / elevations.length;
        const range = max - min;

        return { min, max, avg, range };
    }
}

/**
 * GEOMETRY CALCULATOR
 * Calculadora para operações geométricas avançadas
 */
class GeometryCalculator {
    /**
     * Calcula área de um polígono definido por pontos
     * @param {Array} points - Array de pontos definindo o polígono
     * @returns {number} Área em metros quadrados
     */
    static calculatePolygonArea(points) {
        if (!points || points.length < 3) return 0;
        
        let area = 0;
        const n = points.length;
        
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        
        return Math.abs(area) / 2;
    }

    /**
     * Calcula perímetro de um polígono
     * @param {Array} points - Array de pontos
     * @returns {number} Perímetro em metros
     */
    static calculatePolygonPerimeter(points) {
        if (!points || points.length < 2) return 0;
        
        let perimeter = 0;
        
        for (let i = 0; i < points.length - 1; i++) {
            perimeter += DistanceCalculator.calculateDistance(points[i], points[i + 1]);
        }
        
        // Fechar o polígono
        perimeter += DistanceCalculator.calculateDistance(
            points[points.length - 1], 
            points[0]
        );
        
        return perimeter;
    }

    /**
     * Verifica se um quadrilátero é aproximadamente retangular
     * @param {Object} structure - Estrutura com 4 pontos
     * @param {number} tolerance - Tolerância em percentual (padrão 5%)
     * @returns {boolean} True se for aproximadamente retangular
     */
    static isApproximatelyRectangular(structure, tolerance = 0.05) {
        const { ldInicio, leInicio, ldFinal, leFinal } = structure;
        
        // Calcular as 4 distâncias dos lados
        const lado1 = DistanceCalculator.calculateDistance(ldInicio, leInicio);
        const lado2 = DistanceCalculator.calculateDistance(leInicio, leFinal);
        const lado3 = DistanceCalculator.calculateDistance(leFinal, ldFinal);
        const lado4 = DistanceCalculator.calculateDistance(ldFinal, ldInicio);
        
        // Lados opostos devem ser aproximadamente iguais
        const diffLados12 = Math.abs(lado1 - lado3) / Math.max(lado1, lado3);
        const diffLados34 = Math.abs(lado2 - lado4) / Math.max(lado2, lado4);
        
        return diffLados12 <= tolerance && diffLados34 <= tolerance;
    }
}