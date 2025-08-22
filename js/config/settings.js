/**
 * USER SETTINGS MANAGER
 * Gerenciamento de configurações e preferências do usuário
 */

const USER_SETTINGS = {
    // Configurações padrão
    defaults: {
        theme: 'default',
        zoom: 2.0,
        rotation: 0,
        debugMode: false,
        autoProcess: true,
        showTooltips: true,
        language: 'pt-BR',
        units: 'metric',
        precision: 3,
        reportFormat: 'detailed',
        colorBlind: false,
        highContrast: false,
        animations: true,
        sounds: false
    },

    // Configurações atuais
    current: {},

    // Chave para localStorage
    storageKey: 'bridgeAnalyzerSettings'
};

class SettingsManager {
    constructor() {
        this.settings = { ...USER_SETTINGS.defaults };
        this.loadSettings();
        this.applySettings();
    }

    /**
     * Carrega configurações do localStorage
     */
    loadSettings() {
        try {
            if (typeof(Storage) !== "undefined") {
                const saved = localStorage.getItem(USER_SETTINGS.storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this.settings = { ...this.settings, ...parsed };
                }
            }
        } catch (error) {
            console.warn('Erro ao carregar configurações:', error);
        }
    }

    /**
     * Salva configurações no localStorage
     */
    saveSettings() {
        try {
            if (typeof(Storage) !== "undefined") {
                localStorage.setItem(USER_SETTINGS.storageKey, JSON.stringify(this.settings));
            }
        } catch (error) {
            console.warn('Erro ao salvar configurações:', error);
        }
    }

    /**
     * Obtém valor de uma configuração
     * @param {string} key - Chave da configuração
     * @returns {*} Valor da configuração
     */
    get(key) {
        return this.settings[key] !== undefined ? this.settings[key] : USER_SETTINGS.defaults[key];
    }

    /**
     * Define valor de uma configuração
     * @param {string} key - Chave da configuração
     * @param {*} value - Novo valor
     */
    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySetting(key, value);
    }

    /**
     * Define múltiplas configurações
     * @param {Object} settings - Objeto com as configurações
     */
    setMultiple(settings) {
        Object.assign(this.settings, settings);
        this.saveSettings();
        this.applySettings();
    }

    /**
     * Reseta configurações para o padrão
     */
    reset() {
        this.settings = { ...USER_SETTINGS.defaults };
        this.saveSettings();
        this.applySettings();
        
        // Recarregar página para garantir reset completo
        if (confirm('Configurações resetadas. Deseja recarregar a página?')) {
            window.location.reload();
        }
    }

    /**
     * Aplica todas as configurações
     */
    applySettings() {
        Object.keys(this.settings).forEach(key => {
            this.applySetting(key, this.settings[key]);
        });
    }

    /**
     * Aplica uma configuração específica
     * @param {string} key - Chave da configuração
     * @param {*} value - Valor da configuração
     */
    applySetting(key, value) {
        switch (key) {
            case 'theme':
                this.applyTheme(value);
                break;
            case 'zoom':
                this.applyZoom(value);
                break;
            case 'rotation':
                this.applyRotation(value);
                break;
            case 'debugMode':
                this.applyDebugMode(value);
                break;
            case 'colorBlind':
                this.applyColorBlind(value);
                break;
            case 'highContrast':
                this.applyHighContrast(value);
                break;
            case 'animations':
                this.applyAnimations(value);
                break;
            case 'language':
                this.applyLanguage(value);
                break;
        }
    }

    /**
     * Aplica tema
     * @param {string} theme - Nome do tema
     */
    applyTheme(theme) {
        const root = document.documentElement;
        if (theme && theme !== 'default') {
            root.setAttribute('data-theme', theme);
        } else {
            root.removeAttribute('data-theme');
        }
    }

    /**
     * Aplica zoom
     * @param {number} zoom - Valor do zoom
     */
    applyZoom(zoom) {
        if (window.AppController && window.AppController.renderer) {
            window.AppController.renderer.setZoom(zoom);
        }
    }

    /**
     * Aplica rotação
     * @param {number} rotation - Rotação em graus
     */
    applyRotation(rotation) {
        if (window.AppController && window.AppController.renderer) {
            window.AppController.renderer.setRotation(rotation);
        }
    }

    /**
     * Aplica modo debug
     * @param {boolean} enabled - Se debug está habilitado
     */
    applyDebugMode(enabled) {
        const debugDiv = document.getElementById('debugInfo');
        if (debugDiv) {
            debugDiv.style.display = enabled ? 'block' : 'none';
        }
    }

    /**
     * Aplica modo para daltônicos
     * @param {boolean} enabled - Se modo daltônico está habilitado
     */
    applyColorBlind(enabled) {
        document.body.classList.toggle('color-blind-mode', enabled);
    }

    /**
     * Aplica alto contraste
     * @param {boolean} enabled - Se alto contraste está habilitado
     */
    applyHighContrast(enabled) {
        if (enabled) {
            this.applyTheme('high-contrast');
        }
        document.body.classList.toggle('high-contrast-mode', enabled);
    }

    /**
     * Aplica configuração de animações
     * @param {boolean} enabled - Se animações estão habilitadas
     */
    applyAnimations(enabled) {
        document.body.classList.toggle('no-animations', !enabled);
    }

    /**
     * Aplica idioma
     * @param {string} language - Código do idioma
     */
    applyLanguage(language) {
        document.documentElement.lang = language;
        // Aqui seria implementado sistema de i18n futuramente
    }

    /**
     * Exporta configurações
     * @returns {string} JSON das configurações
     */
    export() {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * Importa configurações
     * @param {string} jsonSettings - JSON das configurações
     */
    import(jsonSettings) {
        try {
            const imported = JSON.parse(jsonSettings);
            this.setMultiple(imported);
            return true;
        } catch (error) {
            console.error('Erro ao importar configurações:', error);
            return false;
        }
    }

    /**
     * Obtém informações das configurações
     * @returns {Object} Informações das configurações
     */
    getInfo() {
        return {
            current: this.settings,
            defaults: USER_SETTINGS.defaults,
            storage: typeof(Storage) !== "undefined",
            storageUsed: this.getStorageSize()
        };
    }

    /**
     * Calcula tamanho usado no localStorage
     * @returns {number} Tamanho em bytes
     */
    getStorageSize() {
        try {
            const data = localStorage.getItem(USER_SETTINGS.storageKey);
            return data ? new Blob([data]).size : 0;
        } catch (error) {
            return 0;
        }
    }
}

// Instância global do gerenciador de configurações
const settingsManager = new SettingsManager();

// Funções utilitárias globais
function getSetting(key) {
    return settingsManager.get(key);
}

function setSetting(key, value) {
    settingsManager.set(key, value);
}

function resetSettings() {
    settingsManager.reset();
}

// Event listeners para mudanças automáticas
document.addEventListener('DOMContentLoaded', () => {
    // Aplicar configurações quando a página carregar
    settingsManager.applySettings();
    
    // Salvar zoom quando mudar
    const zoomElement = document.getElementById('zoomLevel');
    if (zoomElement) {
        const observer = new MutationObserver(() => {
            const zoomText = zoomElement.textContent;
            const zoomMatch = zoomText.match(/(\d+)%/);
            if (zoomMatch) {
                const zoomPercent = parseInt(zoomMatch[1]);
                const zoomValue = zoomPercent / 100;
                if (Math.abs(zoomValue - getSetting('zoom')) > 0.01) {
                    setSetting('zoom', zoomValue);
                }
            }
        });
        observer.observe(zoomElement, { childList: true, subtree: true });
    }
});

// Salvar configurações antes de sair da página
window.addEventListener('beforeunload', () => {
    settingsManager.saveSettings();
});

// CSS para modos especiais
const specialModesCSS = `
.color-blind-mode .good-card { background: #004d40 !important; }
.color-blind-mode .warning-card { background: #ff6f00 !important; }
.color-blind-mode .critical-warning-card { background: #b71c1c !important; }

.no-animations * {
    animation: none !important;
    transition: none !important;
}

.high-contrast-mode {
    filter: contrast(1.5);
}
`;

// Adicionar CSS especial
const styleSheet = document.createElement('style');
styleSheet.textContent = specialModesCSS;
document.head.appendChild(styleSheet);