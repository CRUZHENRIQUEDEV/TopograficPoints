/**
 * MAIN APPLICATION CONTROLLER
 * Controlador principal que coordena todos os módulos da aplicação
 * Analisador de Inclinações - Tabuleiros de Ponte
 */

class AppController {
    constructor() {
        this.renderer = null;
        this.currentPoints1 = {};
        this.currentPoints2 = {};
        this.debugMode = DEBUG_CONFIG.ENABLED;
        
        this.initializeApplication();
    }

    /**
     * Inicializa a aplicação
     */
    initializeApplication() {
        debugLog(MESSAGES.SUCCESS.PAGE_LOADED);
        
        this.renderer = new CanvasRenderer('canvas');
        this.setupEventListeners();
        this.updateZoomDisplay();
        
        // Carregar exemplo padrão ao inicializar
        setTimeout(() => {
            ExampleDataManager.loadExample1UTM();
        }, 500);
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Event listeners para controles de zoom
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key) {
                    case '=':
                    case '+':
                        e.preventDefault();
                        this.zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        this.zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        this.resetZoom();
                        break;
                }
            }
        });

        // Event listener para validação em tempo real dos CSVs
        document.getElementById('csvData1').addEventListener('input', (e) => {
            this.validateCSVInput(e.target, 1);
        });

        document.getElementById('csvData2').addEventListener('input', (e) => {
            this.validateCSVInput(e.target, 2);
        });
    }

    /**
     * Valida entrada de CSV em tempo real
     * @param {HTMLElement} input - Elemento de input
     * @param {number} csvNumber - Número do CSV (1 ou 2)
     */
    validateCSVInput(input, csvNumber) {
        if (!input.value.trim()) return;

        const validation = ExampleDataManager.validateCSVData(input.value);
        
        if (validation.valid) {
            input.style.borderColor = '#28a745';
            input.title = validation.message;
        } else {
            input.style.borderColor = '#dc3545';
            input.title = validation.message;
        }
    }

    /**
     * Processa os dados CSV e gera análise
     */
    static processData() {
        debugLog("=== PROCESSANDO DADOS ===");
        
        const app = new AppController();
        const csvData1 = document.getElementById("csvData1").value;
        const csvData2 = document.getElementById("csvData2").value;
        const errorMsg = document.getElementById("errorMsg");
        
        // Limpar estado anterior
        app.clearPreviousState();
        errorMsg.innerHTML = "";

        if (!csvData1.trim()) {
            errorMsg.innerHTML = `<div class="error">${MESSAGES.ERRORS.NO_CSV1}</div>`;
            return;
        }

        try {
            debugLog("Processando CSV 1...");
            const data1 = CSVParser.parseCSV(csvData1);
            debugLog("Processando CSV 2...");
            const data2 = CSVParser.parseCSV(csvData2);

            debugLog("Procurando pontos no CSV 1...");
            const points1 = PointFinder.findPoints(data1);
            debugLog("Procurando pontos no CSV 2...");
            const points2 = PointFinder.findPoints(data2);
            
            app.currentPoints1 = points1;
            app.currentPoints2 = points2;

            if (Object.keys(points1).length === 0) {
                errorMsg.innerHTML = `<div class="error">${MESSAGES.ERRORS.NO_POINTS}</div>`;
                return;
            }

            debugLog("Iniciando visualização...");
            const structures = app.renderer.drawVisualization(points1, points2);
            
            if (structures.struct1) {
                debugLog("Gerando relatório...");
                ReportGenerator.generateReport(structures.struct1, structures.struct2);
            }

        } catch (error) {
            console.error("Erro:", error);
            debugLog(`ERRO: ${error.message}`);
            errorMsg.innerHTML = `<div class="error">${MESSAGES.ERRORS.PROCESSING} ${error.message}</div>`;
        }
    }

    /**
     * Limpa estado anterior da aplicação
     */
    clearPreviousState() {
        const debugDiv = document.getElementById('debugInfo');
        if (debugDiv) {
            debugDiv.innerHTML = '';
            debugDiv.style.display = 'none';
        }
    }

    /**
     * Limpa todos os dados e reinicia
     */
    static clearAll() {
        const app = new AppController();
        
        document.getElementById('csvData1').value = '';
        document.getElementById('csvData2').value = '';
        document.getElementById('infoPanel').style.display = 'none';
        document.getElementById('errorMsg').innerHTML = '';
        
        const debugDiv = document.getElementById('debugInfo');
        if (debugDiv) {
            debugDiv.innerHTML = '';
            debugDiv.style.display = 'none';
        }
        
        // Reset das propriedades
        app.renderer.setZoom(ZOOM_CONFIG.DEFAULT);
        app.renderer.setRotation(0);
        app.currentPoints1 = {};
        app.currentPoints2 = {};
        app.updateZoomDisplay();
        
        // Limpar canvas
        app.renderer.clear();

        // Reset da validação visual dos inputs
        document.getElementById('csvData1').style.borderColor = '';
        document.getElementById('csvData2').style.borderColor = '';
        document.getElementById('csvData1').title = '';
        document.getElementById('csvData2').title = '';
    }

    /**
     * Aumenta o zoom
     */
    static zoomIn() {
        const app = new AppController();
        const currentZoom = app.renderer.getZoom();
        const newZoom = Math.min(currentZoom * ZOOM_CONFIG.STEP, ZOOM_CONFIG.MAX);
        app.renderer.setZoom(newZoom);
        app.updateZoomDisplay();
        app.redrawVisualization();
    }
    
    /**
     * Diminui o zoom
     */
    static zoomOut() {
        const app = new AppController();
        const currentZoom = app.renderer.getZoom();
        const newZoom = Math.max(currentZoom / ZOOM_CONFIG.STEP, ZOOM_CONFIG.MIN);
        app.renderer.setZoom(newZoom);
        app.updateZoomDisplay();
        app.redrawVisualization();
    }
    
    /**
     * Reseta o zoom para padrão
     */
    static resetZoom() {
        const app = new AppController();
        app.renderer.setZoom(ZOOM_CONFIG.DEFAULT);
        app.updateZoomDisplay();
        app.redrawVisualization();
    }

    /**
     * Rotaciona a visualização
     */
    static rotate45() {
        const app = new AppController();
        const currentRotation = app.renderer.getRotation();
        const newRotation = (currentRotation + VISUAL_CONFIG.ROTATION_STEP) % 360;
        app.renderer.setRotation(newRotation);
        app.redrawVisualization();
    }
    
    /**
     * Atualiza display do zoom
     */
    updateZoomDisplay() {
        const zoomPercent = Math.round(this.renderer.getZoom() * 100);
        const zoomElement = document.getElementById('zoomLevel');
        if (zoomElement) {
            zoomElement.textContent = `Zoom: ${zoomPercent}%`;
        }
    }
    
    /**
     * Redesenha a visualização
     */
    redrawVisualization() {
        if (Object.keys(this.currentPoints1).length > 0) {
            const structures = this.renderer.drawVisualization(this.currentPoints1, this.currentPoints2);
            
            // Regenerar relatório se necessário
            if (structures.struct1) {
                ReportGenerator.generateReport(structures.struct1, structures.struct2);
            }
        }
    }

    /**
     * Exporta dados do relatório
     * @param {string} format - Formato de exportação ('json', 'csv', 'xml')
     */
    static exportReport(format = 'json') {
        // Esta funcionalidade seria implementada para exportar dados
        console.log(`Exportação em formato ${format} não implementada ainda`);
        
        // Exemplo de implementação futura:
        // const reportData = { ... };
        // const exportedData = ExampleDataManager.exportData(reportData, format);
        // downloadFile(exportedData, `relatorio_inclinacoes.${format}`);
    }

    /**
     * Alterna modo debug
     */
    static toggleDebug() {
        const debugDiv = document.getElementById('debugInfo');
        if (debugDiv) {
            debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Salva configurações no localStorage (se disponível)
     */
    saveSettings() {
        try {
            const settings = {
                zoom: this.renderer.getZoom(),
                rotation: this.renderer.getRotation(),
                debugMode: this.debugMode
            };
            
            if (typeof(Storage) !== "undefined") {
                localStorage.setItem('bridgeAnalyzerSettings', JSON.stringify(settings));
            }
        } catch (e) {
            console.log('Não foi possível salvar configurações:', e);
        }
    }

    /**
     * Carrega configurações do localStorage (se disponível)
     */
    loadSettings() {
        try {
            if (typeof(Storage) !== "undefined") {
                const settings = localStorage.getItem('bridgeAnalyzerSettings');
                if (settings) {
                    const parsed = JSON.parse(settings);
                    if (parsed.zoom) this.renderer.setZoom(parsed.zoom);
                    if (parsed.rotation) this.renderer.setRotation(parsed.rotation);
                    if (typeof parsed.debugMode === 'boolean') this.debugMode = parsed.debugMode;
                    this.updateZoomDisplay();
                }
            }
        } catch (e) {
            console.log('Não foi possível carregar configurações:', e);
        }
    }

    /**
     * Obtém informações do sistema
     * @returns {Object} Informações do sistema
     */
    static getSystemInfo() {
        return {
            version: "2.0.0",
            modules: [
                'CSVParser', 'PointFinder', 'DistanceCalculator', 
                'InclinationCalculator', 'StatusCalculator', 
                'CanvasRenderer', 'ReportGenerator', 'ExampleDataManager'
            ],
            features: [
                'Detecção automática SIRGAS 2000',
                'Cálculo de largura transversal correta',
                'Análise de conformidade técnica',
                'Visualização interativa',
                'Relatórios executivos',
                'Múltiplos formatos CSV'
            ],
            limits: {
                transversal: `${TECHNICAL_LIMITS.TRANSVERSAL}%`,
                longitudinal: `${TECHNICAL_LIMITS.LONGITUDINAL}%`
            }
        };
    }
}

/**
 * Função de debug global
 * @param {string} message - Mensagem para log
 */
function debugLog(message) {
    if (!DEBUG_CONFIG.ENABLED) return;
    
    console.log(message);
    const debugDiv = document.getElementById('debugInfo');
    
    if (debugDiv) {
        const lines = debugDiv.innerHTML.split('<br>');
        if (lines.length > DEBUG_CONFIG.MAX_LOG_LINES) {
            lines.splice(0, lines.length - DEBUG_CONFIG.MAX_LOG_LINES);
        }
        
        lines.push(message);
        debugDiv.innerHTML = lines.join('<br>');
        debugDiv.style.display = 'block';
        debugDiv.scrollTop = debugDiv.scrollHeight;
    }
}

// Funções globais para compatibilidade com HTML
function processData() {
    AppController.processData();
}

function clearAll() {
    AppController.clearAll();
}

function zoomIn() {
    AppController.zoomIn();
}

function zoomOut() {
    AppController.zoomOut();
}

function resetZoom() {
    AppController.resetZoom();
}

function rotate45() {
    AppController.rotate45();
}

// Inicialização quando a página carregar
window.onload = function () {
    new AppController();
};

// Tratamento de erros globais
window.onerror = function(message, source, lineno, colno, error) {
    debugLog(`ERRO GLOBAL: ${message} em ${source}:${lineno}:${colno}`);
    console.error('Erro global capturado:', { message, source, lineno, colno, error });
    return false;
};

// Exportar classes principais para uso global se necessário
window.AppController = AppController;
window.debugLog = debugLog;