/**
 * ANALISADOR DE INCLINAÇÕES - CONSTANTES E CONFIGURAÇÕES
 * Sistema de análise automática de inclinações transversais e longitudinais
 * para tabuleiros de ponte com detecção automática SIRGAS 2000
 */

// ===== LIMITES TÉCNICOS =====
const TECHNICAL_LIMITS = {
    TRANSVERSAL: 5.0,    // 5% - Inclinação máxima transversal
    LONGITUDINAL: 2.5    // 2.5% - Inclinação máxima longitudinal
};

// ===== CONFIGURAÇÕES DE ZOOM =====
const ZOOM_CONFIG = {
    DEFAULT: 2.0,        // Zoom padrão 200%
    MIN: 0.1,           // Zoom mínimo 10%
    MAX: 100.0,         // Zoom máximo 10000%
    STEP: 1.2           // Fator de incremento/decremento
};

// ===== CONFIGURAÇÕES DE VISUALIZAÇÃO =====
const VISUAL_CONFIG = {
    CANVAS: {
        WIDTH: 1100,
        HEIGHT: 800,
        MARGIN: 120
    },
    COLORS: {
        STRUCTURE_1: "#007bff",     // Azul para estrutura 1
        STRUCTURE_2: "#e91e63",     // Rosa para estrutura 2
        CONNECTION: "#ff9800",      // Laranja para conexão
        LD_POINT: "#dc3545",        // Vermelho para pontos LD
        LE_POINT: "#28a745",        // Verde para pontos LE
        ELEVATION: {
            LOW: "#4caf50",         // Verde - elevação baixa
            MEDIUM: "#ffeb3b",      // Amarelo - elevação média
            HIGH: "#ff9800",        // Laranja - elevação alta
            VERY_HIGH: "#f44336"    // Vermelho - elevação muito alta
        }
    },
    ROTATION_STEP: 22.5            // Incremento de rotação em graus
};

// ===== CONFIGURAÇÕES DE STATUS =====
const STATUS_CONFIG = {
    CRITICAL_THRESHOLD: 1.0,        // Acima do limite
    WARNING_THRESHOLD: 0.8,         // 80% do limite
    MODERATE_THRESHOLD: 0.5,        // 50% do limite
    ICONS: {
        CRITICAL: "🚨",
        WARNING: "⚠️",
        MODERATE: "🔶",
        GOOD: "✅"
    },
    COLORS: {
        CRITICAL: "#d32f2f",
        WARNING: "#ff5722", 
        MODERATE: "#ff9800",
        GOOD: "#4caf50"
    }
};

// ===== CONFIGURAÇÕES DE COORDENADAS =====
const COORDINATE_CONFIG = {
    GEO_BOUNDS: {
        MAX_LAT: 90,
        MAX_LON: 180
    },
    UTM: {
        FALSE_EASTING: 500000,
        METERS_PER_DEGREE: 111320
    },
    SIRGAS_ZONES: {
        MIN_ZONE: 17,
        MAX_ZONE: 25
    }
};

// ===== IDENTIFICADORES DE PONTOS =====
const POINT_IDENTIFIERS = {
    PATTERNS: [
        "LD_INICIO_OAE", "LE_INICIO_OAE", "LD_FINAL_OAE", "LE_FINAL_OAE",
        "LD INICIO PONTE", "LE INICIO PONTE", "LD FINAL PONTE", "LE FINAL PONTE",
        "LD FINAL DE PONTE", "LE FINAL DE PONTE"
    ],
    REPLACEMENTS: {
        "LD INICIO PONTE": "LD_INICIO_OAE",
        "LE INICIO PONTE": "LE_INICIO_OAE",
        "LD FINAL PONTE": "LD_FINAL_OAE",
        "LE FINAL PONTE": "LE_FINAL_OAE",
        "LD FINAL DE PONTE": "LD_FINAL_OAE",
        "LE FINAL DE PONTE": "LE_FINAL_OAE"
    }
};

// ===== CONFIGURAÇÕES DE CSV =====
const CSV_CONFIG = {
    COMMON_HEADERS: [
        "Name", "Code", "Lat", "LAT", "Long", "LONG", "x", "y", 
        "H_ORTO", "H_ORTHO", "H_GEO", "Ponto", "Codigo", 
        "Leste", "Norte", "Elev", "Northing", "Easting"
    ],
    DEFAULT_HEADERS: [
        "Name", "Code", "LAT", "LONG", "H_GEO", "OND_GEOIDAL", "H_ORTHO"
    ],
    ELEVATION_FIELDS: [
        "H_ORTHO", "H_ORTO", "Elev", "Elevation", "H_GEO", "Altura", "Z"
    ]
};

// ===== CONFIGURAÇÕES DE DEBUG =====
const DEBUG_CONFIG = {
    ENABLED: true,              // Habilitar debug
    MAX_LOG_LINES: 1000        // Máximo de linhas no log
};

// ===== MENSAGENS DO SISTEMA =====
const MESSAGES = {
    ERRORS: {
        NO_CSV1: "⚠️ Por favor, cole pelo menos os dados do CSV 1!",
        NO_POINTS: "⚠️ Nenhum ponto LD ou LE encontrado no CSV 1! Certifique-se de que existem pontos com *_OAE ou *PONTE no nome ou código.",
        PROCESSING: "❌ Erro ao processar dados:"
    },
    SUCCESS: {
        PAGE_LOADED: "🚀 Página carregada - Analisador de Inclinações ativo"
    },
    STATUS_MESSAGES: {
        ABOVE_LIMIT: "ACIMA DO LIMITE",
        NEAR_LIMIT: "Próximo ao Limite",
        MODERATE: "Moderada",
        WITHIN_LIMIT: "Dentro do Limite"
    }
};

// ===== CONFIGURAÇÕES DE RELATÓRIO =====
const REPORT_CONFIG = {
    SECTIONS: {
        COORDINATE_SYSTEM: "🗺️ SISTEMA DE COORDENADAS DETECTADO",
        COMPARATIVE_ANALYSIS: "🔍 ANÁLISE COMPARATIVA ENTRE ESTRUTURAS",
        STRUCTURE_DIMENSIONS: "🏗️ ESTRUTURA {n} ({color}) - Dimensões",
        ELEVATION_ANALYSIS: "📏 ESTRUTURA {n} - Análise de Elevação",
        COMPLIANCE_CHECK: "📐 ESTRUTURA {n} - Verificação de Conformidade",
        METHODOLOGY: "📐 Metodologia de Análise Aplicada"
    }
};

// Exportar constantes (se usando módulos ES6)
// export { TECHNICAL_LIMITS, ZOOM_CONFIG, VISUAL_CONFIG, STATUS_CONFIG, 
//          COORDINATE_CONFIG, POINT_IDENTIFIERS, CSV_CONFIG, DEBUG_CONFIG, 
//          MESSAGES, REPORT_CONFIG };