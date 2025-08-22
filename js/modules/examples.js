/**
 * EXAMPLES MODULE
 * Módulo que contém dados de exemplo para demonstração do sistema
 */

class ExampleDataManager {
    /**
     * Carrega exemplo 1 com coordenadas geográficas (Lat/Long)
     */
    static loadExample1() {
        const exampleData1 = `Name,Code,Lat,Long,H_GEO,H_ORTO,x,y
"05",JUSESQ,-9.8976347800,-36.4167136000,188.80925,197.1262098000,-36.4167136710,-9.8976347823
"06",JUSDIR,-9.8975431900,-36.4167583000,189.01495,197.3316011000,-36.4167583598,-9.8975431976
P-04,LD_FINAL_OAE,-9.8974730300,-36.4166092000,188.93670,197.2531865000,-36.4166092614,-9.8974730373
P-03,LE_FINAL_OAE,-9.8975631400,-36.4165642000,188.78735,197.1041407000,-36.4165642134,-9.8975631483
P-01,LE_INICIO_OAE,-9.8975029500,-36.4164419000,188.77963,197.0962773000,-36.4164419708,-9.8975029554
P-02,LD_INICIO_OAE,-9.8974121600,-36.4164865000,188.99719,197.3135310000,-36.4164865650,-9.8974121660
"07",MONDIR,-9.8972934700,-36.4162403000,188.86808,197.1841401000,-36.4162403921,-9.8972934728
"08",MONESQ,-9.8973829800,-36.4161912000,188.66533,196.9816940000,-36.4161912260,-9.8973829816`;

        document.getElementById('csvData1').value = exampleData1;
        
        // Processar automaticamente após carregar
        setTimeout(() => {
            AppController.processData();
        }, 100);
    }

    /**
     * Carrega exemplo 1 com coordenadas UTM
     */
    static loadExample1UTM() {
        const exampleDataUTM = `Ponto,Codigo,Leste,Prec,Norte,Prec,Elev,Prec,Solucao,PDOP,Sate
P-01,LE INICIO PONTE,187514.122,0.017,8954447.811,0.017,102.288,0.047,RTX,0.9,29
P-02,LD INICIO PONTE,187512.661,0.023,8954459.014,0.023,101.795,0.051,RTX,0.9,29
P-03,LD FINAL DE PONTE,187493.840,0.022,8954456.634,0.022,101.843,0.048,RTX,0.9,30
P-04,LE FINAL DE PONTE,187495.294,0.023,8954445.442,0.023,102.310,0.049,RTX,0.9,30`;

        document.getElementById('csvData1').value = exampleDataUTM;
        
        // Processar automaticamente após carregar
        setTimeout(() => {
            AppController.processData();
        }, 100);
    }

    /**
     * Carrega exemplo 2 com segunda estrutura
     */
    static loadExample2() {
        const exampleData2 = `Ponto,Codigo,Leste,Prec,Norte,Prec,Elev,Prec,Solucao,PDOP,Sate
01,LE INICIO PONTE,187514.122,0.017,8954447.811,0.017,102.288,0.047,RTX,0.9,29
02,LD INICIO PONTE,187512.661,0.023,8954459.014,0.023,101.795,0.051,RTX,0.9,29
07,LD FINAL DE PONTE,187493.840,0.022,8954456.634,0.022,101.843,0.048,RTX,0.9,30
08,LE FINAL DE PONTE,187495.294,0.023,8954445.442,0.023,102.310,0.049,RTX,0.9,30`;

        document.getElementById('csvData2').value = exampleData2;
        
        // Processar automaticamente após carregar (se já há dados no CSV1)
        setTimeout(() => {
            if (document.getElementById('csvData1').value.trim()) {
                AppController.processData();
            }
        }, 100);
    }

    /**
     * Carrega exemplo com dados de teste para debugging
     */
    static loadDebugExample() {
        const debugData = `Ponto,Codigo,Leste,Norte,Elev
P-01,LE INICIO PONTE,100000.000,5000000.000,100.000
P-02,LD INICIO PONTE,100010.000,5000000.000,100.500
P-03,LD FINAL DE PONTE,100010.000,5000030.000,101.000
P-04,LE FINAL DE PONTE,100000.000,5000030.000,101.200`;

        document.getElementById('csvData1').value = debugData;
        
        setTimeout(() => {
            AppController.processData();
        }, 100);
    }

    /**
     * Carrega exemplo com inclinações problemáticas para teste
     */
    static loadProblematicExample() {
        const problematicData = `Ponto,Codigo,Leste,Norte,Elev
P-01,LE INICIO PONTE,200000.000,6000000.000,100.000
P-02,LD INICIO PONTE,200015.000,6000000.000,102.000
P-03,LD FINAL DE PONTE,200015.000,6000040.000,105.000
P-04,LE FINAL DE PONTE,200000.000,6000040.000,104.500`;

        document.getElementById('csvData1').value = problematicData;
        
        setTimeout(() => {
            AppController.processData();
        }, 100);
    }

    /**
     * Carrega exemplo de duas estruturas com dados completos
     */
    static loadTwoStructuresExample() {
        const struct1Data = `Ponto,Codigo,Leste,Norte,Elev
P-01,LE INICIO PONTE,300000.000,7000000.000,95.000
P-02,LD INICIO PONTE,300012.000,7000000.000,95.200
P-03,LD FINAL DE PONTE,300012.000,7000035.000,95.800
P-04,LE FINAL DE PONTE,300000.000,7000035.000,95.600`;

        const struct2Data = `Ponto,Codigo,Leste,Norte,Elev
S2-01,LE INICIO PONTE,300050.000,7000000.000,96.000
S2-02,LD INICIO PONTE,300062.000,7000000.000,96.150
S2-03,LD FINAL DE PONTE,300062.000,7000035.000,96.700
S2-04,LE FINAL DE PONTE,300050.000,7000035.000,96.550`;

        document.getElementById('csvData1').value = struct1Data;
        document.getElementById('csvData2').value = struct2Data;
        
        setTimeout(() => {
            AppController.processData();
        }, 100);
    }

    /**
     * Gera dados aleatórios para teste
     * @param {number} baseX - Coordenada X base
     * @param {number} baseY - Coordenada Y base
     * @param {number} baseElev - Elevação base
     * @param {number} variation - Variação máxima
     * @returns {string} Dados CSV gerados
     */
    static generateRandomData(baseX = 400000, baseY = 8000000, baseElev = 100, variation = 5) {
        const points = [
            { code: "LE INICIO PONTE", x: baseX, y: baseY },
            { code: "LD INICIO PONTE", x: baseX + 10 + Math.random() * 5, y: baseY },
            { code: "LD FINAL DE PONTE", x: baseX + 10 + Math.random() * 5, y: baseY + 30 + Math.random() * 10 },
            { code: "LE FINAL DE PONTE", x: baseX, y: baseY + 30 + Math.random() * 10 }
        ];

        let csv = "Ponto,Codigo,Leste,Norte,Elev\n";
        
        points.forEach((point, index) => {
            const elevation = baseElev + (Math.random() - 0.5) * variation;
            csv += `P-${String(index + 1).padStart(2, '0')},${point.code},${point.x.toFixed(3)},${point.y.toFixed(3)},${elevation.toFixed(3)}\n`;
        });

        return csv.trim();
    }

    /**
     * Carrega exemplo com dados aleatórios
     */
    static loadRandomExample() {
        const randomData = this.generateRandomData();
        document.getElementById('csvData1').value = randomData;
        
        setTimeout(() => {
            AppController.processData();
        }, 100);
    }

    /**
     * Obtém lista de todos os exemplos disponíveis
     * @returns {Array} Array com informações dos exemplos
     */
    static getAvailableExamples() {
        return [
            {
                id: 'example1',
                name: 'Exemplo 1 (Lat/Long)',
                description: 'Dados com coordenadas geográficas',
                method: this.loadExample1
            },
            {
                id: 'example1utm',
                name: 'Exemplo 1 (UTM)',
                description: 'Dados com coordenadas UTM',
                method: this.loadExample1UTM
            },
            {
                id: 'example2',
                name: 'Exemplo 2',
                description: 'Segunda estrutura para comparação',
                method: this.loadExample2
            },
            {
                id: 'debug',
                name: 'Exemplo Debug',
                description: 'Dados simples para debugging',
                method: this.loadDebugExample
            },
            {
                id: 'problematic',
                name: 'Exemplo Problemático',
                description: 'Dados com inclinações acima dos limites',
                method: this.loadProblematicExample
            },
            {
                id: 'twostructures',
                name: 'Duas Estruturas',
                description: 'Exemplo completo com duas estruturas',
                method: this.loadTwoStructuresExample
            },
            {
                id: 'random',
                name: 'Dados Aleatórios',
                description: 'Gera dados aleatórios para teste',
                method: this.loadRandomExample
            }
        ];
    }

    /**
     * Valida se os dados CSV contêm os campos necessários
     * @param {string} csvData - Dados CSV
     * @returns {Object} Resultado da validação
     */
    static validateCSVData(csvData) {
        if (!csvData.trim()) {
            return { valid: false, message: "Dados CSV vazios" };
        }

        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            return { valid: false, message: "CSV deve ter pelo menos 2 linhas (cabeçalho + dados)" };
        }

        const header = lines[0].toLowerCase();
        const requiredFields = ['ponto', 'codigo', 'leste', 'norte', 'elev'];
        const hasRequiredFields = requiredFields.some(field => 
            header.includes(field) || 
            header.includes(field.replace('leste', 'easting')) ||
            header.includes(field.replace('norte', 'northing')) ||
            header.includes(field.replace('elev', 'elevation'))
        );

        if (!hasRequiredFields) {
            return { 
                valid: false, 
                message: "CSV deve conter campos de identificação, coordenadas e elevação" 
            };
        }

        // Verificar se há pontos de estrutura
        const dataLines = lines.slice(1);
        const hasStructurePoints = dataLines.some(line => {
            const lowerLine = line.toLowerCase();
            return POINT_IDENTIFIERS.PATTERNS.some(pattern => 
                lowerLine.includes(pattern.toLowerCase())
            );
        });

        if (!hasStructurePoints) {
            return { 
                valid: false, 
                message: "CSV deve conter pontos de estrutura (LD_INICIO, LE_INICIO, LD_FINAL, LE_FINAL)" 
            };
        }

        return { valid: true, message: "CSV válido" };
    }

    /**
     * Converte dados CSV entre diferentes formatos
     * @param {string} csvData - Dados CSV originais
     * @param {string} targetFormat - Formato de destino ('utm', 'geo', 'simple')
     * @returns {string} Dados CSV convertidos
     */
    static convertCSVFormat(csvData, targetFormat = 'simple') {
        // Esta função seria implementada para converter entre formatos
        // Por enquanto, retorna os dados originais
        console.log(`Conversão para formato ${targetFormat} não implementada ainda`);
        return csvData;
    }

    /**
     * Exporta dados processados para diferentes formatos
     * @param {Object} reportData - Dados do relatório processado
     * @param {string} format - Formato de exportação ('csv', 'json', 'xml')
     * @returns {string} Dados formatados
     */
    static exportData(reportData, format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(reportData, null, 2);
            case 'csv':
                return this.convertToCSV(reportData);
            case 'xml':
                return this.convertToXML(reportData);
            default:
                return JSON.stringify(reportData, null, 2);
        }
    }

    /**
     * Converte dados para formato CSV
     * @param {Object} reportData - Dados do relatório
     * @returns {string} Dados em formato CSV
     */
    static convertToCSV(reportData) {
        let csv = "Estrutura,Ponto,Coordenada_X,Coordenada_Y,Elevacao,Largura_m,Comprimento_m,Inclinacao_Transversal_%,Inclinacao_Longitudinal_%\n";
        
        // Implementação simplificada
        if (reportData.struct1) {
            const struct = reportData.struct1;
            csv += `1,LD_INICIO,${struct.points.ldInicio.x},${struct.points.ldInicio.y},${struct.points.ldInicio.elevation},${struct.distances.mediaLargura.toFixed(3)},${struct.distances.mediaComprimento.toFixed(3)},${struct.inclinations.transversalInicio.percentage.toFixed(2)},${struct.inclinations.longitudinalLD.percentage.toFixed(2)}\n`;
        }
        
        return csv;
    }

    /**
     * Converte dados para formato XML
     * @param {Object} reportData - Dados do relatório
     * @returns {string} Dados em formato XML
     */
    static convertToXML(reportData) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<relatorio_inclinacoes>\n';
        
        if (reportData.struct1) {
            xml += '  <estrutura id="1">\n';
            xml += `    <largura_media>${reportData.struct1.distances.mediaLargura.toFixed(3)}</largura_media>\n`;
            xml += `    <comprimento_medio>${reportData.struct1.distances.mediaComprimento.toFixed(3)}</comprimento_medio>\n`;
            xml += '  </estrutura>\n';
        }
        
        xml += '</relatorio_inclinacoes>';
        return xml;
    }
}

// Funções globais para compatibilidade com o HTML existente
function loadExample1() {
    ExampleDataManager.loadExample1();
}

function loadExample1UTM() {
    ExampleDataManager.loadExample1UTM();
}

function loadExample2() {
    ExampleDataManager.loadExample2();
}