/**
 * State Management Module - OAE Revisor
 */

// Error Type Taxonomy - contextualized by field category
const ERROR_TYPES = {
    default: [
        "Divergente do croqui",
        "Divergente do relatório fotográfico",
        "Erro de digitação",
        "Valor inconsistente",
        "Informação incompleta",
        "Campo obrigatório não preenchido"
    ],
    medidas: [
        "Medida divergente do croqui",
        "Unidade de medida incorreta",
        "Valor fora do padrão esperado",
        "Cálculo incorreto"
    ],
    coordenadas: [
        "Coordenada fora da região esperada",
        "Formato incorreto",
        "Ponto muito distante da estrutura"
    ],
    rotas: [
        "Rota não existe/bloqueada",
        "Acréscimo de km incorreto",
        "Descrição da rota incompleta"
    ],
    aspectos: [
        "Aspecto não se aplica à estrutura",
        "Aspecto faltando",
        "Classificação incorreta"
    ],
    tramos: [
        "Tipo de estrutura incorreto",
        "Sistema construtivo incorreto",
        "Extensão divergente do croqui",
        "Altura inconsistente",
        "Continuidade incorreta"
    ]
};

// Field Category Mapping - determines which error types to show
const FIELD_CATEGORIES = {
    comprimento: 'medidas',
    largura: 'medidas',
    local_via: 'medidas',
    latitude: 'coordenadas',
    longitude: 'coordenadas',
    altitude: 'coordenadas',
    rota: 'rotas',
    rota_km: 'rotas',
    aspecto_desc: 'aspectos',
    aspecto_sigla: 'aspectos',
    faixas: 'medidas',
    larg_faixa: 'medidas',
    acost_dir: 'medidas',
    acost_esq: 'medidas',
    calc_dir: 'medidas',
    calc_esq: 'medidas',
    gab_hor: 'medidas',
    gab_ver: 'medidas',
    vmda: 'medidas',
    vmdc: 'medidas',
    rampa: 'medidas',
    raio: 'medidas'
};

// Element Taxonomy - Comprehensive list of bridge elements
const ELEMENT_FAMILIES = {
    'Apoio': [
        "Ala de concreto armado",
        "Aparelho de apoio de neoprene fretado",
        "Aparelho de apoio de placa de chumbo",
        "Aparelho de apoio de rolo metálico",
        "Aparelho de apoio de Teflon",
        "Aparelho de apoio freyssinet",
        "Aparelho de apoio oscilante",
        "Aparelho de apoio pêndulo",
        "Aparelho de apoio tipo 'pot bearing' direcional",
        "Aparelho de apoio tipo 'pot bearing' Fixo",
        "Articulação de aço",
        "Aterro de acesso",
        "Berço, elemento ou pilarete de nivelamento",
        "Bloco ou Sapata de concreto armado",
        "Bloco ou Sapata em alvenaria de pedra",
        "Camisa metálica de revestimento para estaca",
        "Consolo auxiliar de concreto armado",
        "Contenção em cortina de estacas de concreto armado",
        "Cortina de concreto armado",
        "Escada de aço",
        "Escada de concreto armado",
        "Escada - Patamar de aço",
        "Escada - Patamar de concreto armado",
        "Estaca de aço",
        "Estaca de concreto armado",
        "Estaca de madeira",
        "Parede de contraventamento de pilar de concreto armado",
        "Pilar de aço",
        "Pilar em colunas de concreto armado",
        "Pilar parede de alvenaria de pedra",
        "Pilar parede de concreto armado",
        "Pilar vazado de concreto armado",
        "Radier de alvenaria de pedra e de concreto armado",
        "Reforço estaca - Encamisamento de trecho livre",
        "Reforço pilar - Encamisamento de pilar",
        "Revestimento de talude em concreto",
        "Torre de concreto armado para estaiamento",
        "Travessa de apoio de aço",
        "Travessa de apoio de concreto armado",
        "Travessa de apoio de concreto protendido",
        "Tubulão ou estação de concreto armado",
        "Viga de contraventamento de pilar de concreto armado",
        "Viga de ligação de fundações"
    ],
    'Superestrutura': [
        "Ancoragens de estais",
        "Arco celular de concreto armado",
        "Arco de alvenaria de pedra",
        "Arco de concreto armado",
        "Arco de concreto protendido",
        "Arco metálico",
        "Banzo inferior de aço de treliça vertical",
        "Banzo inferior de concreto de treliça vertical",
        "Banzo superior de aço de treliça vertical",
        "Banzo superior de concreto de treliça vertical",
        "Contraventamento de aço",
        "Dente Gerber de aço",
        "Dente Gerber de concreto armado",
        "Dente Gerber de concreto armado com protensão",
        "Diagonal de aço de treliça vertical",
        "Diagonal de aço horizontal de travamento",
        "Diagonal de concreto de treliça vertical",
        "Diagonal de concreto horizontal de travamento",
        "Estais",
        "Laje de concreto armado",
        "Reforço viga III - Cabo de protensão externo",
        "Reforço viga IV - Bloqueio de articulação Gerber",
        "Revestimento em chapas corrugadas de aço",
        "Transversina de aço de travamento",
        "Transversina de ligação de aço",
        "Transversina de ligação de concreto armado",
        "Transversina de ligação de concreto protendido",
        "Transversina portante de aço",
        "Transversina portante de concreto armado",
        "Transversina portante de concreto protendido",
        "Treliça de aço",
        "Treliça de concreto armado",
        "Viga caixão de aço",
        "Viga caixão de concreto armado",
        "Viga caixão de concreto protendido",
        "Viga I de aço",
        "Viga I ou T de concreto armado",
        "Viga I ou T de concreto protendido",
        "Viga secundária",
        "Viga U de concreto armado"
    ],
    'Transição': [
        "Ala de concreto armado",
        "Barreira New Jersey de concreto armado",
        "Defensa metálica",
        "Dreno",
        "Grade de proteção lateral",
        "Guarda corpo de aço",
        "Guarda corpo de concreto armado",
        "Guarda rodas de concreto armado",
        "Junta de dilatação",
        "Laje de aproximação",
        "Muro de arrimo de alvenaria de pedra",
        "Muro de arrimo de concreto",
        "Muro de gabião",
        "Muro de terra armada",
        "Passeio de concreto armado",
        "Pavimento asfáltico",
        "Pavimento de concreto armado",
        "Placa de identificação",
        "Revestimento de talude"
    ]
};

// Construction System Options for Tramos
const CONSTRUCTION_SYSTEMS = [
    "Aduelas pré-moldadas",
    "Balanços progressivos c/articulações",
    "Balanços progressivos c/continuidade",
    "Estaiado em avanços progressivos",
    "Moldado no local",
    "Não informado",
    "Ponte empurrada",
    "Pré-moldado de concreto armado",
    "Pré-moldado protendido (pós-tensão)",
    "Pré-moldado protendido (pré-tensão)",
    "Treliça metálica",
    "Viga calha pré-moldada"
];

// Element Error Types
const ELEMENT_ERROR_TYPES = [
    "Medidas inconsistentes com o croqui",
    "Quantidade errada",
    "Tipo de elemento errado",
    "Material incorreto",
    "Elemento não identificado nas fotos",
    "Elemento faltando no cadastro",
    "Código do elemento incorreto",
    "Localização incorreta"
];

// Tab-to-Field Mapping for Badge Counting
const TAB_FIELD_MAP = {
    ident: ['ident_orig', 'comprimento', 'largura', 'trem_tipo', 'ano', 'natureza',
            'uf', 'via', 'local_via', 'cidade', 'latitude', 'longitude', 'altitude',
            'snv_codigo', 'snv_versao', 'superintendencia', 'unidade_local',
            'adm_dnit', 'administrador', 'projetista', 'construtor'],
    carac: ['atend_snv', 'tipo_regiao', 'tipo_tracado', 'rampa', 'raio',
            'faixas', 'larg_faixa', 'acost_dir', 'acost_esq', 'calc_dir', 'calc_esq',
            'gab_hor', 'gab_ver', 'vmda', 'vmdc'],
    aspect: ['aspecto_desc', 'aspecto_sigla'],
    defic: ['deficiencias'],
    rotas: ['rota', 'rota_km'],
    obs: ['observacoes']
};

let appState = {
    role: 'avaliador', // 'avaliador' or 'inspetor'

    // Core data of the current work
    work: {
        avaliador: '',
        nome: '',
        codigo: '',
        numTramos: 1,

        // Identificação (fields with data-field)
        fields: {},

        // Tramos structure: { 1: { tipo, sistema, ext, min, max, cont }, C: { tipo, sistema, ext, min, max, cont } }
        tramos: {
            '1': { tipo: '', sistema: '', ext: '', min: '', max: '', cont: '' },
            'C': { tipo: '', sistema: '', ext: '', min: '', max: '', cont: '' }
        },

        // Aspects: { id: { checked: true/false, comment: "" } }
        aspects: {}
    },

    // Auditor Markings
    errors: {},        // Field errors: { fieldId: { id, label, value, types[], obs } }
    elementErrors: [], // Element errors: [ { id, tramo, regiao, familia, erro, obs, responses[] } ]
    anexoErrors: [],   // Attachment errors: [ { id, nome, tipo, inconsist, obs } ]
    mensagens: [],     // Messages: [ { id, author, text, date } ]

    // Message System State (Maps for completion tracking and responses)
    completionStates: new Map(),  // Map<errorId, boolean>
    messageResponses: new Map(),  // Map<errorId, {text, date}>

    // UI state
    currentField: null
};

// Listeners/Subscribers could be added here if needed
