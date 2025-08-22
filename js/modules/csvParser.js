/**
 * CSV PARSER MODULE
 * Módulo responsável pelo parsing e processamento de arquivos CSV
 */

class CSVParser {
    /**
     * Faz o parse de dados CSV
     * @param {string} csvText - Texto CSV para processar
     * @returns {Array} Array de objetos representando as linhas
     */
    static parseCSV(csvText) {
        if (!csvText.trim()) return [];
        
        debugLog("=== INICIANDO PARSE CSV ===");
        const lines = csvText.trim().split("\n");
        debugLog(`Total de linhas: ${lines.length}`);
        
        const firstLine = lines[0];
        debugLog(`Primeira linha: ${firstLine}`);
        
        let headers;
        let dataStartIndex = 0;

        // Detectar se a primeira linha contém cabeçalhos
        const hasHeaders = this.detectHeaders(firstLine);
        
        if (hasHeaders) {
            headers = this.parseHeaders(lines[0]);
            dataStartIndex = 1;
            debugLog(`Cabeçalhos detectados: ${headers.join(', ')}`);
        } else {
            headers = CSV_CONFIG.DEFAULT_HEADERS;
            dataStartIndex = 0;
            debugLog("Usando cabeçalhos padrão");
        }

        const data = this.parseDataRows(lines, headers, dataStartIndex);
        
        debugLog(`Total de linhas processadas: ${data.length}`);
        return data;
    }

    /**
     * Detecta se a primeira linha contém cabeçalhos
     * @param {string} firstLine - Primeira linha do CSV
     * @returns {boolean} True se contém cabeçalhos
     */
    static detectHeaders(firstLine) {
        return CSV_CONFIG.COMMON_HEADERS.some(header => 
            firstLine.includes(header)
        );
    }

    /**
     * Faz o parse dos cabeçalhos
     * @param {string} headerLine - Linha de cabeçalhos
     * @returns {Array} Array de cabeçalhos limpos
     */
    static parseHeaders(headerLine) {
        return headerLine
            .split(",")
            .map(h => h.trim().replace(/"/g, ''));
    }

    /**
     * Faz o parse das linhas de dados
     * @param {Array} lines - Todas as linhas do CSV
     * @param {Array} headers - Cabeçalhos
     * @param {number} startIndex - Índice inicial dos dados
     * @returns {Array} Array de objetos de dados
     */
    static parseDataRows(lines, headers, startIndex) {
        const data = [];
        
        for (let i = startIndex; i < lines.length; i++) {
            if (lines[i].trim() === "") continue;

            const values = this.parseCSVLine(lines[i]);
            const row = this.createRowObject(headers, values);
            
            data.push(row);
            debugLog(`Linha ${i}: ${JSON.stringify(row)}`);
        }
        
        return data;
    }

    /**
     * Parse de uma linha CSV considerando vírgulas dentro de aspas
     * @param {string} line - Linha CSV
     * @returns {Array} Array de valores
     */
    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                if (nextChar === quoteChar) {
                    // Aspas duplas escapadas
                    current += char;
                    i++; // Pular próximo caractere
                } else {
                    inQuotes = false;
                    quoteChar = '';
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Cria objeto para uma linha de dados
     * @param {Array} headers - Cabeçalhos
     * @param {Array} values - Valores da linha
     * @returns {Object} Objeto da linha
     */
    static createRowObject(headers, values) {
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index]?.trim().replace(/^["']|["']$/g, '') || "";
        });
        return row;
    }

    /**
     * Valida estrutura do CSV
     * @param {Array} data - Dados parseados
     * @returns {Object} Resultado da validação
     */
    static validateCSVData(data) {
        if (!data || data.length === 0) {
            return { valid: false, message: "CSV vazio ou inválido" };
        }

        const firstRow = data[0];
        const requiredFields = ['coordinates', 'elevation', 'identifier'];
        
        // Verificar se tem campos de coordenadas
        const hasCoords = this.hasCoordinateFields(firstRow);
        if (!hasCoords.valid) {
            return { valid: false, message: hasCoords.message };
        }

        // Verificar se tem campo de elevação
        const hasElevation = this.hasElevationField(firstRow);
        if (!hasElevation.valid) {
            return { valid: false, message: hasElevation.message };
        }

        // Verificar se tem identificadores
        const hasIdentifier = this.hasIdentifierField(firstRow);
        if (!hasIdentifier.valid) {
            return { valid: false, message: hasIdentifier.message };
        }

        return { valid: true, message: "CSV válido" };
    }

    /**
     * Verifica se tem campos de coordenadas
     * @param {Object} row - Primeira linha de dados
     * @returns {Object} Resultado da verificação
     */
    static hasCoordinateFields(row) {
        const coordFields = [
            ['Leste', 'Norte'], ['Easting', 'Northing'], 
            ['x', 'y'], ['X', 'Y'],
            ['Lat', 'Long'], ['LAT', 'LONG'],
            ['Latitude', 'Longitude']
        ];

        for (const [field1, field2] of coordFields) {
            if (row.hasOwnProperty(field1) && row.hasOwnProperty(field2)) {
                return { valid: true, type: 'coordinate_pair', fields: [field1, field2] };
            }
        }

        return { 
            valid: false, 
            message: "CSV deve conter campos de coordenadas (Leste/Norte, X/Y, Lat/Long, etc.)" 
        };
    }

    /**
     * Verifica se tem campo de elevação
     * @param {Object} row - Primeira linha de dados
     * @returns {Object} Resultado da verificação
     */
    static hasElevationField(row) {
        const elevFields = CSV_CONFIG.ELEVATION_FIELDS;
        
        for (const field of elevFields) {
            if (row.hasOwnProperty(field)) {
                return { valid: true, field: field };
            }
        }

        return { 
            valid: false, 
            message: "CSV deve conter campo de elevação (Elev, H_ORTO, H_ORTHO, etc.)" 
        };
    }

    /**
     * Verifica se tem campo identificador
     * @param {Object} row - Primeira linha de dados
     * @returns {Object} Resultado da verificação
     */
    static hasIdentifierField(row) {
        const idFields = ['Name', 'Code', 'Ponto', 'Codigo', 'ID', 'Point'];
        
        for (const field of idFields) {
            if (row.hasOwnProperty(field)) {
                return { valid: true, field: field };
            }
        }

        return { 
            valid: false, 
            message: "CSV deve conter campo identificador (Name, Code, Ponto, etc.)" 
        };
    }

    /**
     * Detecta tipo de coordenada dos dados
     * @param {Array} data - Dados parseados
     * @returns {string} Tipo de coordenada: 'UTM', 'GEO', ou 'PLANE'
     */
    static detectCoordinateType(data) {
        if (!data || data.length === 0) return 'UNKNOWN';

        const sample = data.find(row => {
            const coords = this.extractCoordinatesFromRow(row);
            return coords && !isNaN(coords.x) && !isNaN(coords.y);
        });

        if (!sample) return 'UNKNOWN';

        const coords = this.extractCoordinatesFromRow(sample);
        
        // Verificar se são coordenadas geográficas
        if (Math.abs(coords.x) <= 180 && Math.abs(coords.y) <= 90) {
            return 'GEO';
        }
        
        // Verificar se são coordenadas UTM (valores típicos do Brasil)
        if (coords.x > 100000 && coords.x < 1000000 && 
            coords.y > 1000000 && coords.y < 10000000) {
            return 'UTM';
        }

        // Por padrão, assumir coordenadas planas
        return 'PLANE';
    }

    /**
     * Extrai coordenadas de uma linha
     * @param {Object} row - Linha de dados
     * @returns {Object|null} Coordenadas {x, y} ou null
     */
    static extractCoordinatesFromRow(row) {
        // Tentar diferentes combinações de campos
        const coordPairs = [
            ['Leste', 'Norte'], ['Easting', 'Northing'],
            ['x', 'y'], ['X', 'Y'], 
            ['Long', 'Lat'], ['LONG', 'LAT'],
            ['Longitude', 'Latitude']
        ];

        for (const [xField, yField] of coordPairs) {
            if (row[xField] && row[yField]) {
                const x = parseFloat(row[xField]);
                const y = parseFloat(row[yField]);
                
                if (!isNaN(x) && !isNaN(y)) {
                    return { x, y, xField, yField };
                }
            }
        }

        return null;
    }

    /**
     * Converte CSV para formato padrão interno
     * @param {Array} data - Dados originais
     * @returns {Array} Dados normalizados
     */
    static normalizeCSVData(data) {
        return data.map(row => {
            const normalized = {};
            
            // Normalizar identificadores
            normalized.id = row.Name || row.Code || row.Ponto || row.Codigo || row.ID || '';
            normalized.code = row.Code || row.Codigo || row.Name || row.Ponto || '';
            
            // Normalizar coordenadas
            const coords = this.extractCoordinatesFromRow(row);
            if (coords) {
                normalized.x = coords.x;
                normalized.y = coords.y;
                normalized.coordType = this.detectCoordinateType([row]);
            }
            
            // Normalizar elevação
            for (const field of CSV_CONFIG.ELEVATION_FIELDS) {
                if (row[field]) {
                    normalized.elevation = parseFloat(row[field]);
                    break;
                }
            }
            
            // Manter dados originais
            normalized._original = row;
            
            return normalized;
        });
    }

    /**
     * Exporta dados para CSV
     * @param {Array} data - Dados para exportar
     * @param {Array} fields - Campos para incluir
     * @returns {string} CSV formatado
     */
    static exportToCSV(data, fields = null) {
        if (!data || data.length === 0) return '';

        const headers = fields || Object.keys(data[0]);
        let csv = headers.join(',') + '\n';

        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header] || '';
                // Escapar vírgulas e aspas
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csv += values.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Calcula estatísticas do CSV
     * @param {Array} data - Dados do CSV
     * @returns {Object} Estatísticas
     */
    static getCSVStats(data) {
        if (!data || data.length === 0) {
            return { rows: 0, columns: 0, empty: 0, errors: 0 };
        }

        const firstRow = data[0];
        const columns = Object.keys(firstRow).length;
        let emptyRows = 0;
        let errorRows = 0;

        data.forEach(row => {
            const values = Object.values(row);
            const emptyValues = values.filter(v => !v || v.trim() === '').length;
            
            if (emptyValues === values.length) {
                emptyRows++;
            }
            
            // Verificar se há erros nos dados numéricos
            const coords = this.extractCoordinatesFromRow(row);
            if (!coords || isNaN(coords.x) || isNaN(coords.y)) {
                errorRows++;
            }
        });

        return {
            rows: data.length,
            columns: columns,
            empty: emptyRows,
            errors: errorRows,
            valid: data.length - emptyRows - errorRows,
            coordType: this.detectCoordinateType(data)
        };
    }
}

/**
 * POINT FINDER MODULE
 * Módulo para encontrar e processar pontos de estrutura nos dados CSV
 */
class PointFinder {
    /**
     * Encontra pontos de estrutura nos dados
     * @param {Array} data - Dados do CSV
     * @returns {Object} Objeto com os pontos encontrados
     */
    static findPoints(data) {
        debugLog("=== PROCURANDO PONTOS ===");
        const points = {};
        
        data.forEach((row, index) => {
            debugLog(`Processando linha ${index}: ${JSON.stringify(row)}`);
            
            const pointInfo = this.extractPointInfo(row);
            if (!pointInfo) return;

            if (this.isStructurePoint(pointInfo.name, pointInfo.code)) {
                const pointData = this.createPointData(row, pointInfo);
                if (pointData) {
                    this.storePoint(points, pointData);
                }
            }
        });
        
        debugLog(`Total de pontos encontrados: ${Object.keys(points).length}`);
        debugLog(`Pontos: ${Object.keys(points).join(', ')}`);
        
        // Validar se tem pontos suficientes
        const validation = this.validateStructurePoints(points);
        if (!validation.valid) {
            debugLog(`AVISO: ${validation.message}`);
        }
        
        return points;
    }

    /**
     * Extrai informações básicas do ponto
     * @param {Object} row - Linha de dados
     * @returns {Object|null} Informações do ponto
     */
    static extractPointInfo(row) {
        const name = row.Name || row.Ponto || row.Code || row.Codigo || "";
        const code = row.Code || row.Codigo || row.Name || row.Ponto || "";
        
        if (!name && !code) return null;
        
        debugLog(`Nome: ${name}, Código: ${code}`);
        return { name, code };
    }

    /**
     * Verifica se é um ponto de estrutura
     * @param {string} name - Nome do ponto
     * @param {string} code - Código do ponto
     * @returns {boolean} True se for ponto de estrutura
     */
    static isStructurePoint(name, code) {
        const fullText = `${name} ${code}`.toLowerCase();
        
        return POINT_IDENTIFIERS.PATTERNS.some(pattern => 
            fullText.includes(pattern.toLowerCase()) ||
            name.toLowerCase().includes(pattern.toLowerCase()) || 
            code.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    /**
     * Cria dados do ponto
     * @param {Object} row - Linha de dados
     * @param {Object} pointInfo - Informações do ponto
     * @returns {Object|null} Dados do ponto ou null se inválido
     */
    static createPointData(row, pointInfo) {
        debugLog(`Ponto de estrutura encontrado: ${pointInfo.name || pointInfo.code}`);
        
        const coordinates = this.extractCoordinates(row);
        const elevation = this.extractElevation(row);
        
        if (!coordinates || isNaN(elevation)) {
            debugLog(`Erro: coordenadas ou elevação inválidas`);
            debugLog(`Coordenadas: ${JSON.stringify(coordinates)}, Elevação: ${elevation}`);
            return null;
        }
        
        const normalizedCode = this.normalizeCode(pointInfo.code || pointInfo.name);
        const coordType = this.determineCoordinateType(coordinates);
        
        const pointData = {
            x: coordinates.x,
            y: coordinates.y,
            elevation: elevation,
            lat: parseFloat(row.Lat || row.LAT) || coordinates.y,
            long: parseFloat(row.Long || row.LONG) || coordinates.x,
            longitude: parseFloat(row.Long || row.LONG) || null,
            easting: parseFloat(row.Leste || row.Easting) || coordinates.x,
            northing: parseFloat(row.Norte || row.Northing) || coordinates.y,
            name: normalizedCode,
            code: normalizedCode,
            originalName: pointInfo.name,
            originalCode: pointInfo.code,
            coordType: coordType
        };
        
        // Adicionar zona SIRGAS se possível
        const sirgas = CoordinateUtils.determineSirgas2000Zone(pointData);
        if (sirgas) {
            pointData.sirgasZone = sirgas;
            debugLog(`Zona SIRGAS determinada: ${sirgas}S`);
        }
        
        debugLog(`Ponto criado: ${JSON.stringify(pointData)}`);
        return pointData;
    }

    /**
     * Extrai coordenadas da linha
     * @param {Object} row - Linha de dados
     * @returns {Object|null} Coordenadas x, y
     */
    static extractCoordinates(row) {
        return CSVParser.extractCoordinatesFromRow(row);
    }

    /**
     * Extrai elevação da linha
     * @param {Object} row - Linha de dados
     * @returns {number} Elevação
     */
    static extractElevation(row) {
        for (const field of CSV_CONFIG.ELEVATION_FIELDS) {
            const value = parseFloat(row[field]);
            if (!isNaN(value)) {
                debugLog(`Elevação encontrada: ${value} (campo: ${field})`);
                return value;
            }
        }
        debugLog(`Nenhuma elevação encontrada nos campos: ${CSV_CONFIG.ELEVATION_FIELDS.join(', ')}`);
        return 0;
    }

    /**
     * Normaliza código do ponto para compatibilidade
     * @param {string} code - Código original
     * @returns {string} Código normalizado
     */
    static normalizeCode(code) {
        let normalized = code;
        
        for (const [pattern, replacement] of Object.entries(POINT_IDENTIFIERS.REPLACEMENTS)) {
            normalized = normalized.replace(new RegExp(pattern, 'gi'), replacement);
        }
        
        return normalized;
    }

    /**
     * Determina o tipo de coordenada
     * @param {Object} coordinates - Coordenadas x, y
     * @returns {string} Tipo: 'UTM', 'GEO', ou 'PLANE'
     */
    static determineCoordinateType(coordinates) {
        const { x, y } = coordinates;
        
        if (Math.abs(x) < COORDINATE_CONFIG.GEO_BOUNDS.MAX_LON && 
            Math.abs(y) < COORDINATE_CONFIG.GEO_BOUNDS.MAX_LAT) {
            return 'GEO';
        }
        
        // Heurística para UTM (valores típicos do Brasil)
        if (x > 100000 && x < 1000000 && y > 1000000 && y < 10000000) {
            return 'UTM';
        }
        
        return 'PLANE';
    }

    /**
     * Armazena ponto no objeto de pontos
     * @param {Object} points - Objeto de pontos
     * @param {Object} pointData - Dados do ponto
     */
    static storePoint(points, pointData) {
        if (pointData.name) points[pointData.name] = pointData;
        if (pointData.code && pointData.code !== pointData.name) {
            points[pointData.code] = pointData;
        }
        if (pointData.originalName && 
            pointData.originalName !== pointData.code && 
            pointData.originalName !== pointData.name) {
            points[pointData.originalName] = pointData;
        }
        if (pointData.originalCode &&
            pointData.originalCode !== pointData.originalName &&
            pointData.originalCode !== pointData.code &&
            pointData.originalCode !== pointData.name) {
            points[pointData.originalCode] = pointData;
        }
    }

    /**
     * Valida se há pontos suficientes para formar uma estrutura
     * @param {Object} points - Pontos encontrados
     * @returns {Object} Resultado da validação
     */
    static validateStructurePoints(points) {
        const pointNames = Object.keys(points);
        const requiredPatterns = ['LD_INICIO', 'LE_INICIO', 'LD_FINAL', 'LE_FINAL'];
        
        const foundPatterns = requiredPatterns.filter(pattern => 
            pointNames.some(name => name.includes(pattern))
        );

        if (foundPatterns.length < 4) {
            return {
                valid: false,
                message: `Estrutura incompleta. Encontrados: ${foundPatterns.join(', ')}. Necessários: ${requiredPatterns.join(', ')}`
            };
        }

        return { valid: true, message: 'Estrutura completa encontrada' };
    }
}