/**
 * State Management Module - OAE Revisor
 */

// Status do Workflow das Obras
const OBRA_STATUS = {
  CADASTRO: "cadastro",                    // Inspetor criou, está editando
  PUBLICADO_AVALIACAO: "publicado_avaliacao", // Inspetor publicou para avaliador
  EM_AVALIACAO: "em_avaliacao",            // Avaliador está avaliando
  PENDENTE_RETIFICACAO: "pendente_retificacao", // Avaliador reprovou, inspetor precisa corrigir
  APROVADO: "aprovado",                     // Avaliador aprovou
};

// Labels dos status para exibição
const OBRA_STATUS_LABELS = {
  [OBRA_STATUS.CADASTRO]: "📝 Cadastro (Inspetor)",
  [OBRA_STATUS.PUBLICADO_AVALIACAO]: "📤 Publicado para Avaliação",
  [OBRA_STATUS.EM_AVALIACAO]: "🔍 Em Avaliação",
  [OBRA_STATUS.PENDENTE_RETIFICACAO]: "⚠️ Pendente de Retificação",
  [OBRA_STATUS.APROVADO]: "✅ Aprovado",
};

// Error Type Taxonomy - contextualized by field category
const ERROR_TYPES = {
  default: [
    "Divergente do croqui",
    "Divergente do relatório fotográfico",
    "Erro de digitação",
    "Valor inconsistente",
    "Informação incompleta",
    "Campo obrigatório não preenchido",
  ],
  medidas: [
    "Medida divergente do croqui",
    "Unidade de medida incorreta",
    "Valor fora do padrão esperado",
    "Cálculo incorreto",
  ],
  coordenadas: [
    "Coordenada fora da região esperada",
    "Formato incorreto",
    "Ponto muito distante da estrutura",
  ],
  rotas: [
    "Rota não existe/bloqueada",
    "Acréscimo de km incorreto",
    "Descrição da rota incompleta",
  ],
  aspectos: [
    "Aspecto não se aplica à estrutura",
    "Aspecto faltando",
    "Classificação incorreta",
  ],
  tramos: [
    "Tipo de estrutura incorreto",
    "Sistema construtivo incorreto",
    "Extensão divergente do croqui",
    "Altura inconsistente",
    "Continuidade incorreta",
  ],
};

// Field Category Mapping - determines which error types to show
const FIELD_CATEGORIES = {
  comprimento: "medidas",
  largura: "medidas",
  local_via: "medidas",
  latitude: "coordenadas",
  longitude: "coordenadas",
  altitude: "coordenadas",
  rota: "rotas",
  rota_km: "rotas",
  aspecto_desc: "aspectos",
  aspecto_sigla: "aspectos",
  faixas: "medidas",
  larg_faixa: "medidas",
  acost_dir: "medidas",
  acost_esq: "medidas",
  calc_dir: "medidas",
  calc_esq: "medidas",
  gab_hor: "medidas",
  gab_ver: "medidas",
  vmda: "medidas",
  vmdc: "medidas",
  rampa: "medidas",
  raio: "medidas",
};

// Element Taxonomy - Comprehensive list of bridge elements
const ELEMENT_FAMILIES = {
  Apoio: [
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
    "Viga de ligação de fundações",
  ],
  Superestrutura: [
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
    "Viga U de concreto armado",
  ],
  Transição: [
    "Ala de concreto armado",
    "Aparelho de apoio de neoprene fretado",
    "Aparelho de apoio de placa de chumbo",
    "Aparelho de apoio de rolo metálico",
    "Aparelho de apoio de teflon",
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
    "Muro de arrimo de alvenaria de pedra",
    "Muro de arrimo de concreto",
    "Muro de gabião",
    "Muro de terra armada",
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
    "Travessa de apoio de aço",
    "Travessa de apoio de concreto armado",
    "Travessa de apoio de concreto protendido",
    "Tubulão ou estaca de concreto armado",
    "Viga de contraventamento de pilar de concreto armado",
    "Viga de ligação de fundações",
  ],
};

// Complementary Elements - specifically for Tramo C
const COMPLEMENTARY_ELEMENTS = [
  "Barreira New Jersey",
  "Barreira New Jersey com guarda-corpo de concreto armado",
  "Barreira qualquer de concreto armado",
  "Berço para junta de dilatação",
  "Buzinote de aço ou PVC",
  "Calçada para pedestres de concreto armado",
  "Calçada para pedestres metálica",
  "Cobertura para pedestres",
  "Guarda corpo de aço",
  "Guarda corpo de concreto armado",
  "Guarda corpo misto (concreto armado e de aço)",
  "Guarda rodas antigo do DNER",
  "Guarda rodas qualquer",
  "Junta de dilatação",
  "Junta elastomérica de dilatação",
  "Junta metálica de dilatação",
  "Pavimento asfáltico",
  "Pavimento de concreto",
  "Tela de aço",
];

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
  "Viga calha pré-moldada",
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
  "Localização incorreta",
];

// Functional Deficiencies - standardized list
const FUNCTIONAL_DEFICIENCIES = [
  { desc: "Alça de acesso inadequada", unit: "und" },
  { desc: "Aparelho de apoio não identificado", unit: "und" },
  { desc: "Calçada para pedestres inexistente", unit: "m" },
  { desc: "Concordância horizontal ruim", unit: "und" },
  { desc: "Concordância vertical ruim", unit: "und" },
  { desc: "Drenagem de pista insuficiente", unit: "und" },
  { desc: "Gabarito horizontal insuficiente", unit: "m" },
  { desc: "Gabarito vertical de navegação insuficiente", unit: "m" },
  { desc: "Gabarito vertical sobre ferrovia insuficiente", unit: "m" },
  { desc: "Gabarito vertical sobre rodovia insuficiente", unit: "m" },
  { desc: "Gabarito vertical sobre via urbana insuficiente", unit: "m" },
  { desc: "Guarda-rodas obsoleto", unit: "m" },
  { desc: "Junta longitudinal de dilatação", unit: "m" },
  { desc: "Laje de aproximação inexistente", unit: "und" },
  { desc: "Pilar em canal de navegação sem proteção", unit: "und" },
  { desc: "Pingadeira inexistente", unit: "m" },
  { desc: "Ponte estreita (larg pista < 7,20m)", unit: "und" },
  { desc: "Ponte muito estreita (em mão única)", unit: "und" },
  { desc: "Ponte sem acostamento", unit: "-" },
  { desc: "Seção hidráulica (greide baixo)", unit: "und" },
  { desc: "Seção hidráulica (ponte curta)", unit: "und" },
  { desc: "Trem tipo de cálculo TB 24tf", unit: "-" },
  { desc: "Trem tipo de cálculo TB 36tf", unit: "-" },
  { desc: "Viga caixão with interior inacessível", unit: "und" },
];

// Special Aspects - standardized list
const SPECIAL_ASPECTS = [
  { desc: "Desnível elevado entre greide e terreno", sigla: "Desnível Greide" },
  { desc: "Frequência elevada de carga pesada", sigla: "Carga Pesada" },
  { desc: "Fundação em solo mole", sigla: "Solo Mole" },
  { desc: "Grande variação do NA do rio na cheia", sigla: "Variação NA" },
  { desc: "Leito do rio erodível", sigla: "Rio Erodível" },
  { desc: "Meio ambiente agressivo", sigla: "Meio Agressivo" },
  { desc: "Nível de vibração elevado", sigla: "Vibração Alta" },
  { desc: "Rio com lâmina dágua normal profunda", sigla: "Rio Profundo" },
];

// Tab-to-Field Mapping for Badge Counting
const TAB_FIELD_MAP = {
  ident: [
    "ident_orig",
    "comprimento",
    "largura",
    "trem_tipo",
    "ano",
    "natureza",
    "uf",
    "via",
    "local_via",
    "cidade",
    "latitude",
    "longitude",
    "altitude",
    "snv_codigo",
    "snv_versao",
    "superintendencia",
    "unidade_local",
    "adm_dnit",
    "administrador",
    "projetista",
    "construtor",
  ],
  carac: [
    "atend_snv",
    "tipo_regiao",
    "tipo_tracado",
    "rampa",
    "raio",
    "faixas",
    "larg_faixa",
    "acost_dir",
    "acost_esq",
    "calc_dir",
    "calc_esq",
    "gab_hor",
    "gab_ver",
    "vmda",
    "vmdc",
  ],
  aspect: [], // Dynamic list
  defic: [], // Separated array
  rotas: ["rota", "rota_km"],
  obs: ["observacoes"],
};

/**
 * Returns the default initial state for the application
 */
function getDefaultAppState() {
    return {
        role: "avaliador", // 'avaliador' or 'inspetor'

        // Core data of the current work
        work: {
            // Tipo da obra
            tipo: "cadastral", // 'cadastral' or 'rotineira'

            // Dados básicos
            avaliador: "",
            nome: "",
            codigo: "",
            numTramos: 1,

            // Metadata for sharing and auditing
            metadata: {
                createdBy: null, // Email do criador
                createdAt: null, // Timestamp de criação
                lastModifiedAt: null, // Timestamp da última modificação
                lastModifiedBy: null, // Email do último modificador
                lote: null, // Lote da obra (Lote 01, Lote 02, Admin)
                sharedWith: [], // Lista de emails com quem foi compartilhado
                isPublic: false, // Se é visível para todos
                version: 1, // Versão do documento
                tags: [], // Tags para busca/filtro
                status: OBRA_STATUS.CADASTRO, // Status do workflow
                publishedBy: null, // Quem publicou a obra
                publishedAt: null, // Quando foi publicada
                evaluatedBy: null, // Quem avaliou a obra
                evaluatedAt: null, // Quando foi avaliada
            },

            // Audit trail - registro de todas as alterações
            auditTrail: [],

            // Identificação (fields with data-field)
            fields: {},

            // Tramos structure: { 1: { tipo, sistema, ext, min, max, cont }, C: { tipo, sistema, ext, min, max, cont } }
            tramos: {
                1: { tipo: "", sistema: "", ext: "", min: "", max: "", cont: "" },
                C: { tipo: "", sistema: "", ext: "", min: "", max: "", cont: "" },
            },

            // Aspects: [ { id, desc, sigla, comment } ]
            aspects: [],

            // Functional Deficiencies: [ { id, desc, unit, value } ]
            functionalDeficiencies: [],
        },

        // Auditor Markings
        errors: {}, // Field errors: { fieldId: { id, label, value, types[], obs, auditInfo } }
        elementErrors: [], // Element errors: [ { id, tramo, regiao, familia, erro, obs, responses[], auditInfo } ]
        anexoErrors: [], // Attachment errors: [ { id, nome, tipo, inconsist, obs, auditInfo } ]
        mensagens: [], // Messages: [ { id, author, text, date, auditInfo } ]

        // Field Chat System: { fieldId: [commentData] }
        fieldChats: {},

        // Message System State (Maps for completion tracking and responses)
        completionStates: new Map(), // Map<errorId, boolean>
        messageResponses: new Map(), // Map<errorId, {text, date}

        // UI state
        currentField: null,
    };
}

let appState = getDefaultAppState();

// Expor appState globalmente para permitir acesso por outros módulos
window.appState = appState;

// Listeners/Subscribers could be added here if needed
