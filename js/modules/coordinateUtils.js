/**
 * COORDINATE UTILITIES MODULE
 * Módulo para manipulação e conversão de coordenadas
 */

class CoordinateUtils {
    /**
     * Determina a zona SIRGAS 2000 baseada nas coordenadas
     * @param {Object} point - Ponto com coordenadas
     * @returns {number|null} Número da zona SIRGAS ou null se não determinável
     */
    static determineSirgas2000Zone(point) {
        let longitude = null;
        
        // Se temos coordenadas geográficas diretamente
        if (point.longitude && Math.abs(point.longitude) <= COORDINATE_CONFIG.GEO_BOUNDS.MAX_LON) {
            longitude = point.longitude;
        }
        // Se temos coordenadas UTM, fazer conversão aproximada
        else if (point.easting && point.northing) {
            longitude = this.approximateUTMToLongitude(point.easting, point.northing);
        }
        
        if (longitude !== null) {
            // Fórmula padrão: Zona = PARTE_INTEIRA((Longitude + 180) / 6) + 1
            const zona = Math.floor((longitude + 180) / 6) + 1;
            
            // Verificar se está dentro do range brasileiro
            if (zona >= COORDINATE_CONFIG.SIRGAS_ZONES.MIN_ZONE && 
                zona <= COORDINATE_CONFIG.SIRGAS_ZONES.MAX_ZONE) {
                return zona;
            }
        }
        
        return null;
    }

    /**
     * Conversão aproximada de UTM para longitude (simplificada para Brasil)
     * @param {number} easting - Coordenada Leste
     * @param {number} northing - Coordenada Norte
     * @returns {number|null} Longitude estimada ou null
     */
    static approximateUTMToLongitude(easting, northing) {
        // Estimativa de zona baseada no padrão UTM brasileiro
        let estimatedZone = this.estimateUTMZone(easting, northing);
        
        if (estimatedZone) {
            // Calcular longitude do meridiano central da zona
            const centralMeridian = (estimatedZone - 1) * 6 - 180 + 3; // +3 para o centro da zona
            
            // Conversão aproximada (simplificada)
            const deltaEasting = easting - COORDINATE_CONFIG.UTM.FALSE_EASTING;
            const deltaLongitude = deltaEasting / COORDINATE_CONFIG.UTM.METERS_PER_DEGREE;
            
            return centralMeridian + deltaLongitude;
        }
        
        return null;
    }

    /**
     * Estima zona UTM baseada em coordenadas típicas do Brasil
     * @param {number} easting - Coordenada Leste
     * @param {number} northing - Coordenada Norte
     * @returns {number|null} Zona estimada
     */
    static estimateUTMZone(easting, northing) {
        // Coordenada Leste baixa (~187500) indica zona com meridiano central mais a oeste
        if (easting < 300000) {
            if (northing > 8900000 && northing < 9100000) {
                // Região nordeste com Leste baixo - provavelmente Zona 24 ou 25
                return easting < 250000 ? 25 : 24;
            }
        } else if (easting < 500000) {
            return 24;
        } else if (easting < 700000) {
            return 23;
        }
        
        // Estimativas adicionais baseadas em padrões conhecidos
        if (easting >= 100000 && easting < 900000 && northing > 1000000) {
            // Heurística baseada na posição relativa no Brasil
            if (easting < 200000) return 25;
            if (easting < 350000) return 24;
            if (easting < 550000) return 23;
            if (easting < 750000) return 22;
            return 21;
        }
        
        return null;
    }

    /**
     * Calcula código EPSG para uma zona SIRGAS 2000
     * @param {number} zone - Número da zona
     * @returns {number|null} Código EPSG ou null se inválido
     */
    static getSirgas2000EPSG(zone) {
        if (zone >= COORDINATE_CONFIG.SIRGAS_ZONES.MIN_ZONE && 
            zone <= COORDINATE_CONFIG.SIRGAS_ZONES.MAX_ZONE) {
            return 31984 + zone - 17; // Fórmula padrão SIRGAS 2000
        }
        return null;
    }

    /**
     * Converte coordenadas geográficas para projeção de Mercator (aproximada)
     * @param {number} lat - Latitude em graus
     * @param {number} lon - Longitude em graus
     * @returns {Object} Coordenadas projetadas {x, y}
     */
    static geoToMercator(lat, lon) {
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        
        const x = lonRad * COORDINATE_CONFIG.UTM.METERS_PER_DEGREE;
        const y = Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * COORDINATE_CONFIG.UTM.METERS_PER_DEGREE;
        
        return { x, y };
    }

    /**
     * Verifica se coordenadas são geográficas válidas
     * @param {number} x - Coordenada X (longitude)
     * @param {number} y - Coordenada Y (latitude)
     * @returns {boolean} True se são coordenadas geográficas válidas
     */
    static isValidGeoCoordinate(x, y) {
        return Math.abs(x) <= COORDINATE_CONFIG.GEO_BOUNDS.MAX_LON && 
               Math.abs(y) <= COORDINATE_CONFIG.GEO_BOUNDS.MAX_LAT;
    }

    /**
     * Verifica se coordenadas parecem ser UTM
     * @param {number} x - Coordenada X (easting)
     * @param {number} y - Coordenada Y (northing)
     * @returns {boolean} True se parecem ser coordenadas UTM
     */
    static isLikelyUTM(x, y) {
        // Valores típicos para UTM no Brasil
        return x > 100000 && x < 1000000 && y > 1000000 && y < 10000000;
    }

    /**
     * Formata coordenadas para exibição
     * @param {Object} point - Ponto com coordenadas
     * @returns {string} String formatada das coordenadas
     */
    static formatCoordinates(point) {
        if (point.coordType === 'GEO') {
            return `Lat: ${point.y.toFixed(6)}°, Lon: ${point.x.toFixed(6)}°`;
        } else if (point.coordType === 'UTM') {
            return `E: ${point.x.toFixed(3)}m, N: ${point.y.toFixed(3)}m`;
        } else {
            return `X: ${point.x.toFixed(3)}, Y: ${point.y.toFixed(3)}`;
        }
    }

    /**
     * Calcula centro geométrico de um conjunto de pontos
     * @param {Array} points - Array de pontos
     * @returns {Object} Centro geométrico {x, y}
     */
    static calculateCentroid(points) {
        if (!points || points.length === 0) return { x: 0, y: 0 };
        
        const sum = points.reduce((acc, point) => ({
            x: acc.x + point.x,
            y: acc.y + point.y
        }), { x: 0, y: 0 });
        
        return {
            x: sum.x / points.length,
            y: sum.y / points.length
        };
    }

    /**
     * Calcula bounding box de um conjunto de pontos
     * @param {Array} points - Array de pontos
     * @returns {Object} Bounding box {minX, maxX, minY, maxY}
     */
    static calculateBoundingBox(points) {
        if (!points || points.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        }
        
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        };
    }

    /**
     * Rotaciona um ponto em torno de um centro
     * @param {Object} point - Ponto a ser rotacionado
     * @param {Object} center - Centro de rotação
     * @param {number} angleRadians - Ângulo em radianos
     * @returns {Object} Ponto rotacionado
     */
    static rotatePoint(point, center, angleRadians) {
        const cosTheta = Math.cos(angleRadians);
        const sinTheta = Math.sin(angleRadians);
        
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        
        return {
            x: center.x + (dx * cosTheta - dy * sinTheta),
            y: center.y + (dx * sinTheta + dy * cosTheta)
        };
    }

    /**
     * Converte graus para radianos
     * @param {number} degrees - Ângulo em graus
     * @returns {number} Ângulo em radianos
     */
    static degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Converte radianos para graus
     * @param {number} radians - Ângulo em radianos
     * @returns {number} Ângulo em graus
     */
    static radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }
}