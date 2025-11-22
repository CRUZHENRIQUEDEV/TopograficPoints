/**
 * Constantes para valores utilizados no formulário SimpleBridge
 * Similar ao arquivo Parameters.cs do projeto Core
 */

// ===== VALORES DE TIPO BLOCO SAPATA =====
const TIPO_BLOCO_SAPATA = {
  BLOCO_SAPATA_CONCRETO_ARMADO: "BLOCO SAPATA DE CONCRETO ARMADO",
  NENHUM: "Nenhum"
};

// ===== VALORES DE TIPO BARREIRA =====
const TIPO_BARREIRA = {
  BARREIRA_NEW_JERSEY: "BARREIRA NEW JERSEY",
  BARREIRA_QUALQUER_CONCRETO_ARMADO: "BARREIRA QUALQUER DE CONCRETO ARMADO",
  BARREIRA_COM_GUARDA_CORPO: "BARREIRA COM GUARDA-CORPO",
  NENHUM: "Nenhum"
};

// ===== VALORES DE TIPO GUARDA RODAS =====
const TIPO_GUARDA_RODAS = {
  GUARDA_RODAS_ANTIGO_DNER: "GUARDA-RODAS ANTIGO DO DNER",
  NENHUM: "Nenhum"
};

// ===== VALORES DE TIPO CALÇADA =====
const TIPO_CALCADA = {
  CALCADA_PEDESTRES_CONCRETO_ARMADO: "CALÇADA PARA PEDESTRES DE CONCRETO ARMADO",
  NENHUM: "Nenhum"
};

// ===== VALORES GERAIS =====
const VALORES_COMUNS = {
  SELECIONE: "Selecione",
  VAZIO: "",
  NENHUM: "Nenhum"
};

// Exportar constantes para uso global
if (typeof window !== 'undefined') {
  window.CONSTANTS = {
    TIPO_BLOCO_SAPATA,
    TIPO_BARREIRA,
    TIPO_GUARDA_RODAS,
    TIPO_CALCADA,
    VALORES_COMUNS
  };
}
