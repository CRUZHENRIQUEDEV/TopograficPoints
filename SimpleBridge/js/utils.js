// Versão: 1.1
/* ===== FUNÇÕES UTILITÁRIAS ===== */

// Variáveis globais
var db;
var saveReminderInterval;
var currentWorkCode = null;

// Debug log
function debugLog(message) {
  if (window.console && window.console.log) {
    console.log(message);
  }
}

// Forçar apenas inteiros
function forceIntegerOnly(input) {
  input.value = Math.floor(input.value);
}

// Obter valor de campo
function getFieldValue(fieldId) {
  const field = document.getElementById(fieldId);
  return field ? field.value : "";
}

// Parser de linha CSV
function parseCSVLine(line, separator) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Detectar separador CSV
function detectSeparator(headerLine) {
  const separators = [",", ";", "\t", "|"];
  let bestSeparator = ",";
  let maxCount = 0;

  for (const sep of separators) {
    const count = (headerLine.match(new RegExp("\\" + sep, "g")) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestSeparator = sep;
    }
  }

  return maxCount > 0 ? bestSeparator : null;
}

// Obter timestamp
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// Obter colunas CSV
function getCsvColumns() {
  return [
    "MODELADO",
    "GPS",
    "LOTE",
    "CODIGO",
    "FOTOS SUPERIORES",
    "FOTOS INFERIORES",
    "NOME",
    "UF",
    "RODOVIA",
    "KM",
    "DATA",
    "ENGENHEIRO",
    "TECNICO",
    "LATITUDE",
    "LONGITUDE",
    "COMPRIMENTO",
    "LARGURA",
    "ALTURA",
    "QTD TRAMOS",
    "COMPRIMENTO TRAMOS",
    "CORTINA ALTURA",
    "TIPO ALA PARALELA",
    "TIPO ALA PERPENDICULAR",
    "COMPRIMENTO ALA",
    "ESPESSURA ALA",
    "TIPO ENCONTRO",
    "DESLOCAMENTO ESQUERDO ENCONTRO LAJE",
    "DESLOCAMENTO DIREITO ENCONTRO LAJE",
    "COMPRIMENTO ENCONTRO LAJE",
    "LAJE TRANSICAO",
    "ALTURA LONGARINA",
    "DESLOCAMENTO ESQUERDO",
    "DESLOCAMENTO DIREITO",
    "QTD LONGARINAS",
    "QTD TRANSVERSINAS",
    "ESPESSURA LONGARINA",
    "ESPESSURA TRANSVERSINA",
    "ESPESSURA LAJE",
    "REFORCO VIGA",
    "QTD PILARES",
    "PILAR DESCENTRALIZADO",
    "TIPO APARELHO APOIO",
    "ALTURA APOIO",
    "LARGURA PILAR",
    "COMPRIMENTO PILARES",
    "QTD APOIOS",
    "TIPO TRAVESSA",
    "ALTURA TRAVESSA",
    "TIPO ENCAMISAMENTO",
    "TIPO BLOCO SAPATA",
    "ALTURA BLOCO SAPATA",
    "LARGURA BLOCO SAPATA",
    "COMPRIMENTO BLOCO SAPATA",
    "TIPO CONTRAVENTAMENTO PILAR",
    "QTD VIGA CONTRAVENTAMENTO PILAR",
    "TIPO LIGACAO FUNDACOES",
    "TIPO BARREIRA ESQUERDA",
    "LARGURA BARREIRA ESQUERDA",
    "TIPO BARREIRA DIREITA",
    "LARGURA BARREIRA DIREITA",
    "TIPO CALCADA ESQUERDA",
    "LARGURA CALCADA ESQUERDA",
    "TIPO CALCADA DIREITA",
    "LARGURA CALCADA DIREITA",
    "GUARDA RODAS ESQUERDO",
    "LARGURA GUARDA RODAS ESQUERDO",
    "GUARDA RODAS DIREITO",
    "LARGURA GUARDA RODAS DIREITO",
    "TIPO PAVIMENTO",
    "QTD BUZINOTES",
  ];
}

// Limpar formulário (com confirmação)
function clearForm() {
  if (confirm("Tem certeza que deseja limpar todos os campos?")) {
    clearFormSilent();
    alert("Formulário limpo com sucesso!");
  }
}

// Limpar formulário (sem confirmação)
function clearFormSilent() {
  const form = document.getElementById("oae-form");
  if (form) {
    form.reset();
  }
  
  currentWorkCode = null;
  
  // Limpar campos dinâmicos se existirem
  const tramosContainer = document.getElementById("tramos-fields");
  if (tramosContainer) {
    tramosContainer.innerHTML = "";
  }
  
  const apoiosContainer = document.getElementById("apoios-fields");
  if (apoiosContainer) {
    apoiosContainer.innerHTML = "";
  }
  
  // Remover marcações de erro
  document.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
  document.querySelectorAll(".error-message.visible").forEach((el) => el.classList.remove("visible"));
}

// Expor funções globalmente
window.debugLog = debugLog;
window.forceIntegerOnly = forceIntegerOnly;
window.getFieldValue = getFieldValue;
window.parseCSVLine = parseCSVLine;
window.detectSeparator = detectSeparator;
window.getTimestamp = getTimestamp;
window.getCsvColumns = getCsvColumns;
window.clearForm = clearForm;
window.clearFormSilent = clearFormSilent;