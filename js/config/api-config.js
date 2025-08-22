/**
 * API CONFIGURATION
 * Configurações para integrações com APIs externas
 */

const API_CONFIG = {
    // Configurações de endpoints
    ENDPOINTS: {
        // API do IBGE para dados geodésicos
        IBGE_GEODESIA: "https://servicodados.ibge.gov.br/api/v1/geodesia",
        
        // API para conversão de coordenadas (se necessário futuramente)
        COORDINATE_CONVERTER: "https://api.proj4.org/",
        
        // API para dados de elevação (futuro)
        ELEVATION_API: "https://api.opentopodata.org/v1/",
        
        // Webhook para salvar relatórios (futuro)
        SAVE_REPORTS: "/api/reports/save",
        
        // API para exportar dados
        EXPORT_API: "/api/export/"
    },

    // Configurações de timeout
    TIMEOUTS: {
        DEFAULT: 5000,      // 5 segundos
        UPLOAD: 30000,      // 30 segundos para upload
        EXPORT: 15000       // 15 segundos para export
    },

    // Headers padrão para requisições
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Analisador-Inclinacoes-Ponte/2.0'
    },

    // Configurações de retry
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY: 1000,        // 1 segundo entre tentativas
        BACKOFF_MULTIPLIER: 2
    },

    // Configurações para SIRGAS 2000
    SIRGAS_API: {
        ENABLED: false,     // Habilitar API externa para SIRGAS
        BASE_URL: "https://www.sirgas.org/api/",
        ENDPOINTS: {
            ZONE_INFO: "zones/",
            TRANSFORMATIONS: "transform/",
            VALIDATION: "validate/"
        }
    },

    // Configurações para geocoding (futuro)
    GEOCODING: {
        ENABLED: false,
        PROVIDER: "nominatim", // nominatim, google, mapbox
        API_KEY: null,
        BASE_URL: "https://nominatim.openstreetmap.org/"
    },

    // Configurações para export em nuvem
    CLOUD_EXPORT: {
        ENABLED: false,
        PROVIDERS: {
            GOOGLE_DRIVE: {
                CLIENT_ID: null,
                API_KEY: null,
                DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
            },
            DROPBOX: {
                APP_KEY: null
            }
        }
    },

    // Rate limiting
    RATE_LIMIT: {
        REQUESTS_PER_MINUTE: 60,
        BURST_LIMIT: 10
    }
};

// Funções utilitárias para API
const APIUtils = {
    /**
     * Faz requisição HTTP com retry automático
     * @param {string} url - URL da requisição
     * @param {Object} options - Opções da requisição
     * @returns {Promise} Resposta da requisição
     */
    async fetchWithRetry(url, options = {}) {
        const config = {
            timeout: API_CONFIG.TIMEOUTS.DEFAULT,
            headers: API_CONFIG.DEFAULT_HEADERS,
            ...options
        };

        for (let attempt = 1; attempt <= API_CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);

                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                console.warn(`Tentativa ${attempt} falhou:`, error.message);
                
                if (attempt === API_CONFIG.RETRY.MAX_ATTEMPTS) {
                    throw error;
                }

                // Wait before retry with exponential backoff
                const delay = API_CONFIG.RETRY.DELAY * Math.pow(API_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },

    /**
     * Valida zona SIRGAS via API (se habilitada)
     * @param {number} zone - Número da zona
     * @returns {Promise<Object>} Informações da zona
     */
    async validateSirgas2000Zone(zone) {
        if (!API_CONFIG.SIRGAS_API.ENABLED) {
            return { valid: true, source: 'local' };
        }

        const url = `${API_CONFIG.SIRGAS_API.BASE_URL}${API_CONFIG.SIRGAS_API.ENDPOINTS.VALIDATION}${zone}`;
        
        try {
            const response = await this.fetchWithRetry(url);
            return {
                valid: response.valid,
                zone: response.zone,
                epsg: response.epsg_code,
                source: 'api'
            };
        } catch (error) {
            console.warn('Falha na validação SIRGAS via API, usando validação local');
            return { valid: true, source: 'local_fallback' };
        }
    },

    /**
     * Upload de arquivo CSV para processamento em nuvem
     * @param {File} file - Arquivo CSV
     * @returns {Promise<Object>} Resultado do processamento
     */
    async uploadCSV(file) {
        const formData = new FormData();
        formData.append('csv', file);

        return await this.fetchWithRetry('/api/csv/process', {
            method: 'POST',
            body: formData,
            timeout: API_CONFIG.TIMEOUTS.UPLOAD
        });
    },

    /**
     * Exporta relatório para diferentes formatos
     * @param {Object} reportData - Dados do relatório
     * @param {string} format - Formato (pdf, xlsx, dwg)
     * @returns {Promise<Blob>} Arquivo exportado
     */
    async exportReport(reportData, format = 'pdf') {
        const url = `${API_CONFIG.ENDPOINTS.EXPORT_API}${format}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: API_CONFIG.DEFAULT_HEADERS,
            body: JSON.stringify(reportData),
            timeout: API_CONFIG.TIMEOUTS.EXPORT
        });

        if (!response.ok) {
            throw new Error(`Erro ao exportar: ${response.statusText}`);
        }

        return await response.blob();
    },

    /**
     * Salva relatório na nuvem
     * @param {Object} reportData - Dados do relatório
     * @returns {Promise<Object>} Informações do arquivo salvo
     */
    async saveToCloud(reportData) {
        if (!API_CONFIG.CLOUD_EXPORT.ENABLED) {
            throw new Error('Export em nuvem não habilitado');
        }

        return await this.fetchWithRetry(API_CONFIG.ENDPOINTS.SAVE_REPORTS, {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
    },

    /**
     * Obtém dados de elevação via API externa
     * @param {Array} coordinates - Array de coordenadas [lat, lon]
     * @returns {Promise<Array>} Elevações correspondentes
     */
    async getElevationData(coordinates) {
        const url = `${API_CONFIG.ENDPOINTS.ELEVATION_API}aster30m`;
        
        const locations = coordinates.map(coord => `${coord[0]},${coord[1]}`).join('|');
        
        return await this.fetchWithRetry(`${url}?locations=${locations}`);
    }
};

// Rate limiter simples
const RateLimiter = {
    requests: [],
    
    /**
     * Verifica se pode fazer requisição
     * @returns {boolean} Se pode fazer a requisição
     */
    canMakeRequest() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove requisições antigas
        this.requests = this.requests.filter(time => time > oneMinuteAgo);
        
        // Verifica limite
        return this.requests.length < API_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE;
    },
    
    /**
     * Registra nova requisição
     */
    recordRequest() {
        this.requests.push(Date.now());
    }
};