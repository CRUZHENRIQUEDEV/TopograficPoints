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
    "TIPO SUPERESTRUTURA",
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
    "TIPO APOIO TRANSICAO",
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
  document
    .querySelectorAll(".error")
    .forEach((el) => el.classList.remove("error"));
  document
    .querySelectorAll(".error-message.visible")
    .forEach((el) => el.classList.remove("visible"));

  // Ocultar mensagem informativa de altura-travessa
  const alturaTravessaInfo = document.getElementById("altura-travessa-info");
  if (alturaTravessaInfo) {
    alturaTravessaInfo.style.display = "none";
  }
}

// Formatar LOTE com pelo menos 2 dígitos (padding de zeros à esquerda)
function formatLote(value) {
  if (!value) return value;

  // Remover espaços
  value = value.trim();

  // Se for apenas números, adicionar padding
  if (/^\d+$/.test(value)) {
    return value.padStart(2, "0");
  }

  // Se começar com números seguidos de texto, formatar a parte numérica
  const match = value.match(/^(\d+)(.*)$/);
  if (match) {
    const numero = match[1].padStart(2, "0");
    const resto = match[2];
    return numero + resto;
  }

  // Retornar como está se não for formato numérico
  return value;
}

// Calcular e exibir soma dos tramos em tempo real
function updateTramosSum() {
  const comprimentoField = document.getElementById("comprimento");
  const displayElement = document.getElementById("tramos-sum-display");
  const valueElement = document.getElementById("tramos-sum-value");

  if (!displayElement || !valueElement) return;

  // Pegar todos os campos de tramo
  const tramosFields = document.querySelectorAll(".tramo-field");

  // Se não há campos de tramo, ocultar o display
  if (tramosFields.length === 0) {
    displayElement.style.display = "none";
    return;
  }

  // Calcular soma
  let soma = 0;
  tramosFields.forEach((field) => {
    const valor = parseFloat(field.value) || 0;
    soma += valor;
  });

  // Comparar com comprimento total
  const comprimentoTotal = parseFloat(comprimentoField?.value) || 0;

  // Tolerância para erros de ponto flutuante (0.001m = 1mm)
  const diferenca = comprimentoTotal - soma;
  const diferencaAbsoluta = Math.abs(diferenca);
  const valoresBatem = diferencaAbsoluta < 0.001;

  // Construir texto com diferença
  let textoSoma = soma.toFixed(2) + "m";
  if (comprimentoTotal > 0 && !valoresBatem) {
    if (diferenca > 0) {
      textoSoma += ` (Falta: ${diferenca.toFixed(2)}m)`;
    } else {
      textoSoma += ` (Sobra: ${Math.abs(diferenca).toFixed(2)}m)`;
    }
  }

  // Exibir soma com diferença
  valueElement.textContent = textoSoma;
  displayElement.style.display = "block";

  // Aplicar estilo baseado na comparação
  if (comprimentoTotal > 0) {
    if (valoresBatem) {
      displayElement.style.background =
        "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)";
      displayElement.style.borderLeft = "4px solid #28a745";
      displayElement.style.color = "#155724";
    } else {
      displayElement.style.background =
        "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)";
      displayElement.style.borderLeft = "4px solid #dc3545";
      displayElement.style.color = "#721c24";
    }
  } else {
    // Sem comprimento total definido, usar estilo neutro
    displayElement.style.background =
      "linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%)";
    displayElement.style.borderLeft = "4px solid #6c757d";
    displayElement.style.color = "#383d41";
  }
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
window.formatLote = formatLote;
window.updateTramosSum = updateTramosSum;
window.clearFormSilent = clearFormSilent;
