/**
 * REPORTING MODULE
 * Módulo responsável pela geração de relatórios técnicos de análise
 */

class ReportGenerator {
    /**
     * Gera relatório completo de análise
     * @param {Object} struct1 - Primeira estrutura
     * @param {Object} struct2 - Segunda estrutura (opcional)
     */
    static generateReport(struct1, struct2 = null) {
        debugLog("=== GERANDO RELATÓRIO DE CONFORMIDADE ===");
        
        if (!struct1) {
            debugLog("ERRO: struct1 é null, não é possível gerar relatório");
            return;
        }

        const reportData = this.calculateReportData(struct1, struct2);
        const html = this.buildReportHTML(reportData);
        
        this.displayReport(html, reportData);
        this.generateExecutiveSummary(reportData);
        this.addMethodologySection();
        
        debugLog("Relatório de análise técnica gerado com sucesso");
    }

    /**
     * Calcula todos os dados necessários para o relatório
     * @param {Object} struct1 - Primeira estrutura
     * @param {Object} struct2 - Segunda estrutura
     * @returns {Object} Dados calculados
     */
    static calculateReportData(struct1, struct2) {
        const data = {
            struct1: this.calculateStructureData(struct1, 1),
            struct2: struct2 ? this.calculateStructureData(struct2, 2) : null,
            comparison: null,
            problems: {
                struct1: this.analyzeStructureProblems(struct1),
                struct2: struct2 ? this.analyzeStructureProblems(struct2) : null,
                crossStructure: null
            }
        };

        if (struct2) {
            data.comparison = this.calculateComparisonData(struct1, struct2);
            data.problems.crossStructure = this.analyzeCrossStructureProblems(struct1, struct2);
        }

        return data;
    }

    /**
     * Calcula dados de uma estrutura
     * @param {Object} struct - Estrutura
     * @param {number} structNum - Número da estrutura
     * @returns {Object} Dados da estrutura
     */
    static calculateStructureData(struct, structNum) {
        // Distâncias
        const distances = {
            larguraInicio: DistanceCalculator.calculateTransversalWidth(struct.ldInicio, struct.leInicio),
            larguraFinal: DistanceCalculator.calculateTransversalWidth(struct.ldFinal, struct.leFinal),
            comprimentoLD: DistanceCalculator.calculateDistance(struct.ldInicio, struct.ldFinal),
            comprimentoLE: DistanceCalculator.calculateDistance(struct.leInicio, struct.leFinal)
        };

        distances.mediaLargura = (distances.larguraInicio + distances.larguraFinal) / 2;
        distances.mediaComprimento = (distances.comprimentoLD + distances.comprimentoLE) / 2;

        // Diferenças de elevação
        const elevations = {
            transversalInicio: DistanceCalculator.calculateElevationDifference(struct.ldInicio, struct.leInicio),
            transversalFinal: DistanceCalculator.calculateElevationDifference(struct.ldFinal, struct.leFinal),
            longitudinalLD: DistanceCalculator.calculateElevationDifference(struct.ldInicio, struct.ldFinal),
            longitudinalLE: DistanceCalculator.calculateElevationDifference(struct.leInicio, struct.leFinal)
        };

        // Inclinações
        const inclinations = {
            transversalInicio: InclinationCalculator.calculateTransversalInclination(struct.ldInicio, struct.leInicio),
            transversalFinal: InclinationCalculator.calculateTransversalInclination(struct.ldFinal, struct.leFinal),
            longitudinalLD: InclinationCalculator.calculateInclination(struct.ldInicio, struct.ldFinal),
            longitudinalLE: InclinationCalculator.calculateInclination(struct.leInicio, struct.leFinal)
        };

        // Status das inclinações
        const status = {
            transversalInicio: StatusCalculator.getInclinationStatus(inclinations.transversalInicio, true),
            transversalFinal: StatusCalculator.getInclinationStatus(inclinations.transversalFinal, true),
            longitudinalLD: StatusCalculator.getInclinationStatus(inclinations.longitudinalLD, false),
            longitudinalLE: StatusCalculator.getInclinationStatus(inclinations.longitudinalLE, false)
        };

        return {
            number: structNum,
            distances,
            elevations,
            inclinations,
            status,
            points: struct,
            sirgasZone: struct.ldInicio.sirgasZone
        };
    }

    /**
     * Calcula dados de comparação entre estruturas
     * @param {Object} struct1 - Primeira estrutura
     * @param {Object} struct2 - Segunda estrutura
     * @returns {Object} Dados de comparação
     */
    static calculateComparisonData(struct1, struct2) {
        const data1 = this.calculateStructureData(struct1, 1);
        const data2 = this.calculateStructureData(struct2, 2);

        const crossDistance = DistanceCalculator.calculateDistance(struct1.leInicio, struct2.ldInicio);
        const crossElevation = DistanceCalculator.calculateElevationDifference(struct1.leInicio, struct2.ldInicio);
        const crossInclination = InclinationCalculator.calculateInclination(struct1.leInicio, struct2.ldInicio);
        const crossStatus = StatusCalculator.getInclinationStatus(crossInclination, false);

        // Diferenças entre estruturas
        const diferencaLargura = Math.abs(data1.distances.mediaLargura - data2.distances.mediaLargura);
        const diferencaComprimento = Math.abs(data1.distances.mediaComprimento - data2.distances.mediaComprimento);

        // Médias gerais
        const mediaGeralLargura = (data1.distances.mediaLargura + data2.distances.mediaLargura) / 2;
        const mediaGeralComprimento = (data1.distances.mediaComprimento + data2.distances.mediaComprimento) / 2;

        // Distâncias X e Y
        const deltaXY = this.calculateDeltaXY(struct1.leInicio, struct2.ldInicio);

        return {
            crossDistance,
            crossElevation,
            crossInclination,
            crossStatus,
            diferencaLargura,
            diferencaComprimento,
            mediaGeralLargura,
            mediaGeralComprimento,
            deltaX: deltaXY.deltaX,
            deltaY: deltaXY.deltaY
        };
    }

    /**
     * Calcula diferenças em X e Y entre pontos
     * @param {Object} point1 - Primeiro ponto
     * @param {Object} point2 - Segundo ponto
     * @returns {Object} Diferenças deltaX e deltaY
     */
    static calculateDeltaXY(point1, point2) {
        const x1 = parseFloat(point1.x);
        const y1 = parseFloat(point1.y);
        const x2 = parseFloat(point2.x);
        const y2 = parseFloat(point2.y);
        
        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
            return { deltaX: 0, deltaY: 0 };
        }

        let deltaX = Math.abs(x2 - x1);
        let deltaY = Math.abs(y2 - y1);
        
        if ((point1.coordType === 'UTM' && point2.coordType === 'UTM') || 
            (point1.coordType === 'PLANE' && point2.coordType === 'PLANE')) {
            // deltaX e deltaY já estão em metros
        }
        else if ((point1.coordType === 'GEO' && point2.coordType === 'GEO') ||
                 (CoordinateUtils.isValidGeoCoordinate(x1, y1) && 
                  CoordinateUtils.isValidGeoCoordinate(x2, y2))) {
            const avgLatRad = ((y1 + y2) / 2 * Math.PI) / 180;
            deltaX = deltaX * COORDINATE_CONFIG.UTM.METERS_PER_DEGREE * Math.cos(avgLatRad);
            deltaY = deltaY * COORDINATE_CONFIG.UTM.METERS_PER_DEGREE;
        }
        
        return { deltaX, deltaY };
    }

    /**
     * Analisa problemas de uma estrutura
     * @param {Object} struct - Estrutura
     * @returns {Object} Problemas encontrados
     */
    static analyzeStructureProblems(struct) {
        const inclinations = {
            transversalInicio: InclinationCalculator.calculateTransversalInclination(struct.ldInicio, struct.leInicio),
            transversalFinal: InclinationCalculator.calculateTransversalInclination(struct.ldFinal, struct.leFinal),
            longitudinalLD: InclinationCalculator.calculateInclination(struct.ldInicio, struct.ldFinal),
            longitudinalLE: InclinationCalculator.calculateInclination(struct.leInicio, struct.leFinal)
        };

        return StatusCalculator.analyzeComplianceProblems(inclinations);
    }

    /**
     * Analisa problemas entre estruturas
     * @param {Object} struct1 - Primeira estrutura
     * @param {Object} struct2 - Segunda estrutura
     * @returns {Object} Problemas entre estruturas
     */
    static analyzeCrossStructureProblems(struct1, struct2) {
        const crossInclination = InclinationCalculator.calculateInclination(struct1.leInicio, struct2.ldInicio);
        
        const problems = {
            longitudinais: [],
            total: 0
        };

        if (crossInclination.percentage > TECHNICAL_LIMITS.LONGITUDINAL) {
            problems.longitudinais.push("Entre estruturas (Longitudinal)");
        }

        problems.total = problems.longitudinais.length;
        return problems;
    }

    /**
     * Constrói HTML do relatório
     * @param {Object} reportData - Dados do relatório
     * @returns {string} HTML do relatório
     */
    static buildReportHTML(reportData) {
        let html = '';

        // Seção do sistema de coordenadas
        html += this.buildCoordinateSystemSection(reportData.struct1);

        // Seção de análise comparativa (se há duas estruturas)
        if (reportData.struct2) {
            html += this.buildComparativeSection(reportData.comparison);
        }

        // Seções das estruturas
        html += this.buildStructureSection(reportData.struct1, reportData.struct2 ? 'AZUL' : '');
        
        if (reportData.struct2) {
            html += this.buildStructureSection(reportData.struct2, 'ROSA');
        }

        return html;
    }

    /**
     * Constrói seção do sistema de coordenadas
     * @param {Object} struct1Data - Dados da estrutura 1
     * @returns {string} HTML da seção
     */
    static buildCoordinateSystemSection(struct1Data) {
        if (!struct1Data.sirgasZone) return '';

        return `
            <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f8f9fa); border: 3px solid #1976d2; margin-bottom: 20px; grid-column: 1 / -1;">
                <div><strong>🗺️ SISTEMA DE COORDENADAS DETECTADO</strong></div>
                <div style="margin-top: 10px;">
                    <div style="font-size: 16px; font-weight: bold; color: #1976d2;">
                        SIRGAS 2000 / UTM Zone ${struct1Data.sirgasZone}S
                    </div>
                    <div style="font-size: 14px; color: #1565c0; margin-top: 5px;">
                        📍 Código EPSG: ${CoordinateUtils.getSirgas2000EPSG(struct1Data.sirgasZone)} (Zona ${struct1Data.sirgasZone}S)
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 8px;">
                        <strong>Estrutura 1:</strong> LD_INÍCIO → E: ${struct1Data.points.ldInicio.easting?.toFixed(3)}m, N: ${struct1Data.points.ldInicio.northing?.toFixed(3)}m
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Constrói seção de análise comparativa
     * @param {Object} comparison - Dados de comparação
     * @returns {string} HTML da seção
     */
    static buildComparativeSection(comparison) {
        return `
            <div class="distance-card cross-section">
                <div><strong>🔍 ANÁLISE COMPARATIVA ENTRE ESTRUTURAS</strong></div>
            </div>
            <div class="distance-card cross-distance-card">
                <div><strong>🌉 Distância Entre Estruturas</strong></div>
                <div class="distance-value cross-distance-value">${comparison.crossDistance.toFixed(3)} m</div>
                <small>LE_INÍCIO (1) ↔ LD_INÍCIO (2)</small>
            </div>
            <div class="distance-card elevation-analysis-card">
                <div><strong>📏 Diferença de Elevação</strong></div>
                <div class="elevation-value" style="color: ${comparison.crossElevation >= 0 ? '#4caf50' : '#f44336'};">${comparison.crossElevation >= 0 ? '+' : ''}${comparison.crossElevation.toFixed(3)} m</div>
                <small>Entre estruturas (LE1→LD2)</small>
            </div>
            <div class="distance-card ${comparison.crossStatus.class}">
                <div><strong>${comparison.crossStatus.icon} Inclinação Entre Estruturas</strong></div>
                <div class="inclination-value" style="color: ${comparison.crossStatus.color};">${comparison.crossInclination.percentage.toFixed(2)}% (${comparison.crossInclination.degrees.toFixed(1)}°)</div>
                <small>${comparison.crossInclination.direction} - ${comparison.crossStatus.text}</small>
                <div style="font-size: 11px; margin-top: 5px; color: #666;">Limite longitudinal: ≤${TECHNICAL_LIMITS.LONGITUDINAL}%</div>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
                <div><strong>📐 Distância em X</strong></div>
                <div class="distance-value" style="color: #6c757d;">${comparison.deltaX.toFixed(3)} m</div>
                <small>Diferença horizontal</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
                <div><strong>📐 Distância em Y</strong></div>
                <div class="distance-value" style="color: #6c757d;">${comparison.deltaY.toFixed(3)} m</div>
                <small>Diferença vertical</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid #9c27b0;">
                <div><strong>📏 Média Geral Largura</strong></div>
                <div class="distance-value" style="color: #9c27b0;">${comparison.mediaGeralLargura.toFixed(3)} m</div>
                <small>(Est.1 + Est.2) ÷ 2</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e8f5e8, #fff3e0); border: 2px solid #ff9800;">
                <div><strong>📐 Média Geral Comprimento</strong></div>
                <div class="distance-value" style="color: #ff9800;">${comparison.mediaGeralComprimento.toFixed(3)} m</div>
                <small>(Est.1 + Est.2) ÷ 2</small>
            </div>
        `;
    }

    /**
     * Constrói seção de uma estrutura
     * @param {Object} structData - Dados da estrutura
     * @param {string} colorName - Nome da cor da estrutura
     * @returns {string} HTML da seção
     */
    static buildStructureSection(structData, colorName) {
        const structLabel = `ESTRUTURA ${structData.number}${colorName ? ` (${colorName})` : ''}`;
        
        let html = `
            <div class="section-divider"></div>
            <div class="distance-card structure-section">
                <div><strong>🏗️ ${structLabel} - Dimensões</strong></div>
            </div>
        `;

        // Dimensões
        html += this.buildDimensionsCards(structData);
        
        // Análise de elevação
        html += `
            <div class="distance-card elevation-section">
                <div><strong>📏 ${structLabel} - Análise de Elevação</strong></div>
            </div>
        `;
        html += this.buildElevationCards(structData);

        // Verificação de conformidade
        html += `
            <div class="distance-card elevation-section">
                <div><strong>📐 ${structLabel} - Verificação de Conformidade</strong></div>
            </div>
        `;
        html += this.buildComplianceCards(structData);

        return html;
    }

    /**
     * Constrói cards de dimensões
     * @param {Object} structData - Dados da estrutura
     * @returns {string} HTML dos cards
     */
    static buildDimensionsCards(structData) {
        const { distances } = structData;
        
        return `
            <div class="distance-card">
                <div><strong>Largura Início</strong></div>
                <div class="distance-value">${distances.larguraInicio.toFixed(3)} m</div>
                <small>LD_INÍCIO ↔ LE_INÍCIO</small>
            </div>
            <div class="distance-card">
                <div><strong>Largura Final</strong></div>
                <div class="distance-value">${distances.larguraFinal.toFixed(3)} m</div>
                <small>LD_FINAL ↔ LE_FINAL</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid #9c27b0;">
                <div><strong>📏 Média Largura</strong></div>
                <div class="distance-value" style="color: #9c27b0;">${distances.mediaLargura.toFixed(3)} m</div>
                <small>Estrutura ${structData.number}</small>
            </div>
            <div class="distance-card">
                <div><strong>Comprimento LD</strong></div>
                <div class="distance-value">${distances.comprimentoLD.toFixed(3)} m</div>
                <small>LD_INÍCIO ↔ LD_FINAL</small>
            </div>
            <div class="distance-card">
                <div><strong>Comprimento LE</strong></div>
                <div class="distance-value">${distances.comprimentoLE.toFixed(3)} m</div>
                <small>LE_INÍCIO ↔ LE_FINAL</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e8f5e8, #fff3e0); border: 2px solid #ff9800;">
                <div><strong>📐 Média Comprimento</strong></div>
                <div class="distance-value" style="color: #ff9800;">${distances.mediaComprimento.toFixed(3)} m</div>
                <small>Estrutura ${structData.number}</small>
            </div>
        `;
    }

    /**
     * Constrói cards de análise de elevação
     * @param {Object} structData - Dados da estrutura
     * @returns {string} HTML dos cards
     */
    static buildElevationCards(structData) {
        const { elevations } = structData;
        
        return `
            <div class="distance-card elevation-analysis-card">
                <div><strong>Diferença LD↔LE (Início com Início)</strong></div>
                <div class="elevation-value" style="color: ${elevations.transversalInicio >= 0 ? '#4caf50' : '#f44336'};">${elevations.transversalInicio >= 0 ? '+' : ''}${elevations.transversalInicio.toFixed(3)} m</div>
                <small>Inclinação transversal - mesmo ponto</small>
            </div>
            <div class="distance-card elevation-analysis-card">
                <div><strong>Diferença LD↔LE (Final com Final)</strong></div>
                <div class="elevation-value" style="color: ${elevations.transversalFinal >= 0 ? '#4caf50' : '#f44336'};">${elevations.transversalFinal >= 0 ? '+' : ''}${elevations.transversalFinal.toFixed(3)} m</div>
                <small>Inclinação transversal - mesmo ponto</small>
            </div>
            <div class="distance-card elevation-analysis-card">
                <div><strong>Diferença LD: Início↔Final (Direito com Direito)</strong></div>
                <div class="elevation-value" style="color: ${elevations.longitudinalLD >= 0 ? '#4caf50' : '#f44336'};">${elevations.longitudinalLD >= 0 ? '+' : ''}${elevations.longitudinalLD.toFixed(3)} m</div>
                <small>Inclinação longitudinal - mesmo lado</small>
            </div>
            <div class="distance-card elevation-analysis-card">
                <div><strong>Diferença LE: Início↔Final (Esquerdo com Esquerdo)</strong></div>
                <div class="elevation-value" style="color: ${elevations.longitudinalLE >= 0 ? '#4caf50' : '#f44336'};">${elevations.longitudinalLE >= 0 ? '+' : ''}${elevations.longitudinalLE.toFixed(3)} m</div>
                <small>Inclinação longitudinal - mesmo lado</small>
            </div>
        `;
    }

    /**
     * Constrói cards de verificação de conformidade
     * @param {Object} structData - Dados da estrutura
     * @returns {string} HTML dos cards
     */
    static buildComplianceCards(structData) {
        const { inclinations, status, distances, elevations } = structData;
        
        return `
            <div class="distance-card ${status.transversalInicio.class}">
                <div><strong>${status.transversalInicio.icon} Transversal: LD↔LE (Início com Início)</strong></div>
                <div class="inclination-value" style="color: ${status.transversalInicio.color};">${inclinations.transversalInicio.percentage.toFixed(2)}% (${inclinations.transversalInicio.degrees.toFixed(1)}°)</div>
                <small>${inclinations.transversalInicio.direction} - ${status.transversalInicio.text}</small>
                <div style="font-size: 11px; margin-top: 5px; color: #666;">
                    📏 Largura Transversal: ${distances.larguraInicio.toFixed(3)}m | Desnível: ${Math.abs(elevations.transversalInicio).toFixed(3)}m<br>
                    📐 Cálculo: ${Math.abs(elevations.transversalInicio).toFixed(3)}m ÷ ${distances.larguraInicio.toFixed(3)}m × 100 = ${inclinations.transversalInicio.percentage.toFixed(2)}%<br>
                    Limite transversal: ≤${TECHNICAL_LIMITS.TRANSVERSAL}%
                </div>
            </div>
            <div class="distance-card ${status.transversalFinal.class}">
                <div><strong>${status.transversalFinal.icon} Transversal: LD↔LE (Final com Final)</strong></div>
                <div class="inclination-value" style="color: ${status.transversalFinal.color};">${inclinations.transversalFinal.percentage.toFixed(2)}% (${inclinations.transversalFinal.degrees.toFixed(1)}°)</div>
                <small>${inclinations.transversalFinal.direction} - ${status.transversalFinal.text}</small>
                <div style="font-size: 11px; margin-top: 5px; color: #666;">
                    📏 Largura Transversal: ${distances.larguraFinal.toFixed(3)}m | Desnível: ${Math.abs(elevations.transversalFinal).toFixed(3)}m<br>
                    📐 Cálculo: ${Math.abs(elevations.transversalFinal).toFixed(3)}m ÷ ${distances.larguraFinal.toFixed(3)}m × 100 = ${inclinations.transversalFinal.percentage.toFixed(2)}%<br>
                    Limite transversal: ≤${TECHNICAL_LIMITS.TRANSVERSAL}%
                </div>
            </div>
            <div class="distance-card ${status.longitudinalLD.class}">
                <div><strong>${status.longitudinalLD.icon} Longitudinal: LD (Direito com Direito)</strong></div>
                <div class="inclination-value" style="color: ${status.longitudinalLD.color};">${inclinations.longitudinalLD.percentage.toFixed(2)}% (${inclinations.longitudinalLD.degrees.toFixed(1)}°)</div>
                <small>${inclinations.longitudinalLD.direction} - ${status.longitudinalLD.text}</small>
                <div style="font-size: 11px; margin-top: 5px; color: #666;">
                    📏 Distância: ${distances.comprimentoLD.toFixed(3)}m | Desnível: ${Math.abs(elevations.longitudinalLD).toFixed(3)}m<br>
                    📐 Cálculo: ${Math.abs(elevations.longitudinalLD).toFixed(3)}m ÷ ${distances.comprimentoLD.toFixed(3)}m × 100 = ${inclinations.longitudinalLD.percentage.toFixed(2)}%<br>
                    Limite longitudinal: ≤${TECHNICAL_LIMITS.LONGITUDINAL}%
                </div>
            </div>
            <div class="distance-card ${status.longitudinalLE.class}">
                <div><strong>${status.longitudinalLE.icon} Longitudinal: LE (Esquerdo com Esquerdo)</strong></div>
                <div class="inclination-value" style="color: ${status.longitudinalLE.color};">${inclinations.longitudinalLE.percentage.toFixed(2)}% (${inclinations.longitudinalLE.degrees.toFixed(1)}°)</div>
                <small>${inclinations.longitudinalLE.direction} - ${status.longitudinalLE.text}</small>
                <div style="font-size: 11px; margin-top: 5px; color: #666;">
                    📏 Distância: ${distances.comprimentoLE.toFixed(3)}m | Desnível: ${Math.abs(elevations.longitudinalLE).toFixed(3)}m<br>
                    📐 Cálculo: ${Math.abs(elevations.longitudinalLE).toFixed(3)}m ÷ ${distances.comprimentoLE.toFixed(3)}m × 100 = ${inclinations.longitudinalLE.percentage.toFixed(2)}%<br>
                    Limite longitudinal: ≤${TECHNICAL_LIMITS.LONGITUDINAL}%
                </div>
            </div>
        `;
    }

    /**
     * Exibe o relatório na interface
     * @param {string} html - HTML do relatório
     * @param {Object} reportData - Dados do relatório
     */
    static displayReport(html, reportData) {
        const distanceInfo = document.getElementById("distanceInfo");
        const infoPanel = document.getElementById("infoPanel");
        
        distanceInfo.innerHTML = html;
        infoPanel.style.display = "block";
    }

    /**
     * Gera resumo executivo
     * @param {Object} reportData - Dados do relatório
     */
    static generateExecutiveSummary(reportData) {
        const summaryElement = document.getElementById('executiveSummary');
        
        if (reportData.struct2) {
            summaryElement.innerHTML = this.buildTwoStructuresSummary(reportData);
        } else {
            summaryElement.innerHTML = this.buildSingleStructureSummary(reportData);
        }
    }

    /**
     * Constrói resumo para duas estruturas
     * @param {Object} reportData - Dados do relatório
     * @returns {string} HTML do resumo
     */
    static buildTwoStructuresSummary(reportData) {
        const totalProblems = 
            reportData.problems.struct1.total + 
            reportData.problems.struct2.total + 
            reportData.problems.crossStructure.total;

        const allTransversalProblems = [
            ...reportData.problems.struct1.transversais.map(p => `Est.1 ${p}`),
            ...reportData.problems.struct2.transversais.map(p => `Est.2 ${p}`)
        ];

        const allLongitudinalProblems = [
            ...reportData.problems.struct1.longitudinais.map(p => `Est.1 ${p}`),
            ...reportData.problems.struct2.longitudinais.map(p => `Est.2 ${p}`),
            ...reportData.problems.crossStructure.longitudinais
        ];

        return `
            <h4 style="margin-bottom: 15px; color: #495057;">📋 Resumo Executivo - Análise Técnica</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; text-align: center;">
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                    <div style="font-weight: bold; color: #007bff;">🌉 Distância Total</div>
                    <div style="font-size: 16px; font-weight: bold; color: #007bff; margin: 5px 0;">${reportData.comparison.crossDistance.toFixed(3)}m</div>
                    <div style="font-size: 12px; color: #6c757d;">LE(1) ↔ LD(2)</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                    <div style="font-weight: bold; color: ${reportData.comparison.crossElevation >= 0 ? '#4caf50' : '#f44336'};">📏 Diferença Elevação</div>
                    <div style="font-size: 16px; font-weight: bold; color: ${reportData.comparison.crossElevation >= 0 ? '#4caf50' : '#f44336'}; margin: 5px 0;">${reportData.comparison.crossElevation >= 0 ? '+' : ''}${reportData.comparison.crossElevation.toFixed(3)}m</div>
                    <div style="font-size: 12px; color: #6c757d;">Entre estruturas</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                    <div style="font-weight: bold; color: ${reportData.comparison.crossStatus.color};">📐 Inclinação Entre Estru.</div>
                    <div style="font-size: 16px; font-weight: bold; color: ${reportData.comparison.crossStatus.color}; margin: 5px 0;">${reportData.comparison.crossInclination.percentage.toFixed(2)}%</div>
                    <div style="font-size: 12px; color: #6c757d;">Limite: ≤${TECHNICAL_LIMITS.LONGITUDINAL}%</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                    <div style="font-weight: bold; color: #9c27b0;">📏 Largura Média</div>
                    <div style="font-size: 16px; font-weight: bold; color: #9c27b0; margin: 5px 0;">${reportData.comparison.mediaGeralLargura.toFixed(3)}m</div>
                    <div style="font-size: 12px; color: #6c757d;">Geral (Est.1+2)</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                    <div style="font-weight: bold; color: #ff9800;">📐 Comprimento Médio</div>
                    <div style="font-size: 16px; font-weight: bold; color: #ff9800; margin: 5px 0;">${reportData.comparison.mediaGeralComprimento.toFixed(3)}m</div>
                    <div style="font-size: 12px; color: #6c757d;">Geral (Est.1+2)</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid ${totalProblems > 0 ? '#f44336' : '#4caf50'};">
                    <div style="font-weight: bold; color: ${totalProblems > 0 ? '#f44336' : '#4caf50'};">${totalProblems > 0 ? '🚨' : '✅'} Status Conformidade</div>
                    <div style="font-size: 16px; font-weight: bold; color: ${totalProblems > 0 ? '#f44336' : '#4caf50'}; margin: 5px 0;">${totalProblems > 0 ? `${totalProblems} Não Conformidades` : 'CONFORME'}</div>
                    <div style="font-size: 12px; color: #6c757d;">${totalProblems > 0 ? 'Revisar inclinações' : 'Todas inclinações OK'}</div>
                </div>
            </div>
            ${this.buildProblemsSection(totalProblems, allTransversalProblems, allLongitudinalProblems)}
        `;
    }

    /**
     * Constrói resumo para estrutura única
     * @param {Object} reportData - Dados do relatório
     * @returns {string} HTML do resumo
     */
    static buildSingleStructureSummary(reportData) {
        const problems = reportData.problems.struct1;
        
        return `
            <h4 style="margin-bottom: 15px; color: #495057;">📋 Resumo Executivo - Análise Técnica (Estrutura Única)</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; text-align: center;">
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                    <div style="font-weight: bold; color: #9c27b0;">📏 Largura Média</div>
                    <div style="font-size: 18px; font-weight: bold; color: #9c27b0; margin: 5px 0;">${reportData.struct1.distances.mediaLargura.toFixed(3)} m</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                    <div style="font-weight: bold; color: #ff9800;">📐 Comprimento Médio</div>
                    <div style="font-size: 18px; font-weight: bold; color: #ff9800; margin: 5px 0;">${reportData.struct1.distances.mediaComprimento.toFixed(3)} m</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                    <div style="font-weight: bold; color: ${problems.transversais.length > 0 ? '#f44336' : '#4caf50'};">🔄 Status Transversal</div>
                    <div style="font-size: 14px; font-weight: bold; color: ${problems.transversais.length > 0 ? '#f44336' : '#4caf50'}; margin: 5px 0;">${problems.transversais.length > 0 ? 'ACIMA DO LIMITE' : 'DENTRO DO LIMITE'}</div>
                    <div style="font-size: 12px; color: #6c757d;">Limite: ≤${TECHNICAL_LIMITS.TRANSVERSAL}%</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                    <div style="font-weight: bold; color: ${problems.longitudinais.length > 0 ? '#f44336' : '#4caf50'};">↕️ Status Longitudinal</div>
                    <div style="font-size: 14px; font-weight: bold; color: ${problems.longitudinais.length > 0 ? '#f44336' : '#4caf50'}; margin: 5px 0;">${problems.longitudinais.length > 0 ? 'ACIMA DO LIMITE' : 'DENTRO DO LIMITE'}</div>
                    <div style="font-size: 12px; color: #6c757d;">Limite: ≤${TECHNICAL_LIMITS.LONGITUDINAL}%</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid ${problems.total > 0 ? '#f44336' : '#4caf50'};">
                    <div style="font-weight: bold; color: ${problems.total > 0 ? '#f44336' : '#4caf50'};">${problems.total > 0 ? '🚨' : '✅'} Status Geral</div>
                    <div style="font-size: 16px; font-weight: bold; color: ${problems.total > 0 ? '#f44336' : '#4caf50'}; margin: 5px 0;">${problems.total > 0 ? `${problems.total} Acima dos Limites` : 'DENTRO DOS LIMITES'}</div>
                    <div style="font-size: 12px; color: #6c757d;">${problems.total > 0 ? 'Revisar inclinações' : 'Todas inclinações OK'}</div>
                </div>
            </div>
            ${this.buildProblemsSection(problems.total, problems.transversais, problems.longitudinais)}
        `;
    }

    /**
     * Constrói seção de problemas
     * @param {number} totalProblems - Total de problemas
     * @param {Array} transversalProblems - Problemas transversais
     * @param {Array} longitudinalProblems - Problemas longitudinais
     * @returns {string} HTML da seção
     */
    static buildProblemsSection(totalProblems, transversalProblems, longitudinalProblems) {
        if (totalProblems > 0) {
            return `
                <div style="margin-top: 15px; padding: 12px; background: #ffebee; border: 2px solid #f44336; border-radius: 6px;">
                    <div style="font-weight: bold; color: #d32f2f; margin-bottom: 8px;">🚨 INCLINAÇÕES ACIMA DOS LIMITES TÉCNICOS:</div>
                    ${transversalProblems.length > 0 ? `<div style="font-size: 14px; color: #c62828; margin-bottom: 5px;"><strong>Transversais (>${TECHNICAL_LIMITS.TRANSVERSAL}%):</strong> ${transversalProblems.join(', ')}</div>` : ''}
                    ${longitudinalProblems.length > 0 ? `<div style="font-size: 14px; color: #c62828;"><strong>Longitudinais (>${TECHNICAL_LIMITS.LONGITUDINAL}%):</strong> ${longitudinalProblems.join(', ')}</div>` : ''}
                    <div style="font-size: 12px; color: #d32f2f; margin-top: 8px; font-weight: bold;">⚠️ RECOMENDA-SE ANÁLISE ESTRUTURAL ESPECÍFICA</div>
                </div>
            `;
        } else {
            return `
                <div style="margin-top: 15px; padding: 12px; background: #e8f5e8; border: 2px solid #4caf50; border-radius: 6px;">
                    <div style="font-weight: bold; color: #2e7d32; margin-bottom: 8px;">✅ ESTRUTURA${totalProblems > 1 ? 'S' : ''} DENTRO DOS LIMITES TÉCNICOS</div>
                    <div style="font-size: 14px; color: #388e3c;">Todas as inclinações estão dentro dos limites recomendados</div>
                    <div style="font-size: 12px; color: #2e7d32; margin-top: 5px;">Transversais: ≤${TECHNICAL_LIMITS.TRANSVERSAL}% | Longitudinais: ≤${TECHNICAL_LIMITS.LONGITUDINAL}%</div>
                </div>
            `;
        }
    }

    /**
     * Adiciona seção de metodologia
     */
    static addMethodologySection() {
        const metodologiaHtml = `
            <div style="margin-top: 25px; padding: 15px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px; border: 2px solid #6c757d;">
                <h4 style="margin: 0 0 15px 0; color: #495057; text-align: center;">📐 Metodologia de Análise Aplicada</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: white; padding: 12px; border-radius: 6px; border: 2px solid #d32f2f;">
                        <div style="font-weight: bold; color: #d32f2f; margin-bottom: 8px;">🔄 INCLINAÇÕES TRANSVERSAIS (≤${TECHNICAL_LIMITS.TRANSVERSAL}%)</div>
                        <div style="font-size: 13px; color: #666; line-height: 1.4;">
                            <strong>✓ LD_INÍCIO ↔ LE_INÍCIO</strong><br>
                            <em>Lado direito com lado esquerdo no mesmo ponto</em><br><br>
                            <strong>✓ LD_FINAL ↔ LE_FINAL</strong><br>
                            <em>Lado direito com lado esquerdo no mesmo ponto</em>
                        </div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border: 2px solid #ff9800;">
                        <div style="font-weight: bold; color: #ff9800; margin-bottom: 8px;">↕️ INCLINAÇÕES LONGITUDINAIS (≤${TECHNICAL_LIMITS.LONGITUDINAL}%)</div>
                        <div style="font-size: 13px; color: #666; line-height: 1.4;">
                            <strong>✓ LD_INÍCIO ↔ LD_FINAL</strong><br>
                            <em>Mesmo lado direito entre pontos</em><br><br>
                            <strong>✓ LE_INÍCIO ↔ LE_FINAL</strong><br>
                            <em>Mesmo lado esquerdo entre pontos</em>
                        </div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 12px; font-size: 12px; color: #6c757d;">
                    <strong>Boas Práticas da Engenharia de Pontes</strong> - Sistema automatizado de análise técnica de tabuleiros<br>
                    <em style="color: #007bff;">✓ Largura calculada como distância transversal pura (sem diagonal) | Comprimento calculado como distância real</em>
                </div>
            </div>
        `;
        
        document.getElementById('executiveSummary').insertAdjacentHTML('afterend', metodologiaHtml);
    }
}