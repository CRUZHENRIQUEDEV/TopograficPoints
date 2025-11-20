/* ===== VALIDAÇÕES ===== */

// Campos obrigatórios
window.requiredFields = {
  lote: { type: "text", min: null, required: true },
  codigo: { type: "text", min: null, required: true },
  comprimento: { type: "number", min: 1, required: true },
  largura: { type: "number", min: 0, required: true },
  altura: { type: "number", min: 0, required: true },
  "qtd-tramos": { type: "number", min: 1, required: true },
  "cortina-altura": { type: "number", min: 0, required: true },
  "tipo-ala-paralela": {
    type: "text",
    required: function () {
      const encontroField = document.getElementById("tipo-encontro");
      const alaPerpendicularField = document.getElementById("tipo-ala-perpendicular");
      if (!encontroField || !alaPerpendicularField) return false;
      return (
        encontroField.value === "ENCONTRO - PAREDE FRONTAL PORTANTE" &&
        (alaPerpendicularField.value === "" || alaPerpendicularField.value === "Nenhum")
      );
    },
  },
  "tipo-ala-perpendicular": {
    type: "text",
    required: function () {
      const encontroField = document.getElementById("tipo-encontro");
      const alaParalelaField = document.getElementById("tipo-ala-paralela");
      if (!encontroField || !alaParalelaField) return false;
      return (
        encontroField.value === "ENCONTRO - PAREDE FRONTAL PORTANTE" &&
        (alaParalelaField.value === "" || alaParalelaField.value === "Nenhum")
      );
    },
  },
  "comprimento-ala": {
    type: "number",
    min: 0,
    required: function () {
      const alaParalelaField = document.getElementById("tipo-ala-paralela");
      const alaPerpendicularField = document.getElementById("tipo-ala-perpendicular");
      if (!alaParalelaField || !alaPerpendicularField) return false;
      return (
        (alaParalelaField.value !== "" && alaParalelaField.value !== "Nenhum") ||
        (alaPerpendicularField.value !== "" && alaPerpendicularField.value !== "Nenhum")
      );
    },
  },
  "espessura-ala": {
    type: "number",
    min: 0,
    max: 1.5,
    required: function () {
      const alaParalelaField = document.getElementById("tipo-ala-paralela");
      const alaPerpendicularField = document.getElementById("tipo-ala-perpendicular");
      if (!alaParalelaField || !alaPerpendicularField) return false;
      return (
        (alaParalelaField.value !== "" && alaParalelaField.value !== "Nenhum") ||
        (alaPerpendicularField.value !== "" && alaPerpendicularField.value !== "Nenhum")
      );
    },
  },
  "deslocamento-esquerdo-encontro-laje": {
    type: "number",
    min: 0,
    required: function () {
      const encontroField = document.getElementById("tipo-encontro");
      return encontroField && encontroField.value === "ENCONTRO LAJE";
    },
  },
  "deslocamento-direito-encontro-laje": {
    type: "number",
    min: 0,
    required: function () {
      const encontroField = document.getElementById("tipo-encontro");
      return encontroField && encontroField.value === "ENCONTRO LAJE";
    },
  },
  "comprimento-encontro-laje": {
    type: "number",
    min: 0,
    required: function () {
      const encontroField = document.getElementById("tipo-encontro");
      return encontroField && encontroField.value === "ENCONTRO LAJE";
    },
  },
  "altura-longarina": { type: "number", min: 0, required: true },
  "deslocamento-esquerdo": { type: "number", min: 0, required: true },
  "deslocamento-direito": { type: "number", min: 0, required: true },
  "qtd-longarinas": { type: "number", min: 0, required: true },
  "espessura-longarina": { type: "number", min: 0, required: true },
  "tipo-transversina": { 
    type: "text", 
    min: null, 
    required: function () {
      const qtdTransversinasField = document.getElementById("qtd-transversinas");
      const qtdTransversinas = parseInt(qtdTransversinasField ? qtdTransversinasField.value : 0) || 0;
      return qtdTransversinas > 0;
    },
  },
  "espessura-transversina": {
    type: "number",
    min: 0,
    required: function () {
      const qtdTransversinasField = document.getElementById("qtd-transversinas");
      const qtdTransversinas = parseInt(qtdTransversinasField ? qtdTransversinasField.value : 0) || 0;
      return qtdTransversinas > 0;
    },
  },
  "espessura-laje": { type: "number", min: 0, required: true },
  "qtd-pilares": { type: "number", min: 0, required: true },
  "largura-pilar": {
    type: "number",
    min: 0,
    required: function () {
      const qtdPilaresField = document.getElementById("qtd-pilares");
      const qtdPilares = parseInt(qtdPilaresField ? qtdPilaresField.value : 0) || 0;
      return qtdPilares > 0;
    },
  },
  "comprimento-pilares": {
    type: "number",
    min: 0,
    required: function () {
      const qtdPilaresField = document.getElementById("qtd-pilares");
      const qtdPilares = parseInt(qtdPilaresField ? qtdPilaresField.value : 0) || 0;
      return qtdPilares > 0;
    },
  },
  "altura-travessa": {
    type: "number",
    min: 0,
    required: function () {
      const tipoTravessaField = document.getElementById("tipo-travessa");
      return (
        tipoTravessaField &&
        tipoTravessaField.value !== "" &&
        tipoTravessaField.value !== "Nenhum"
      );
    },
  },
  "altura-bloco-sapata": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoBlocoSapataField = document.getElementById("tipo-bloco-sapata");
      return (
        tipoBlocoSapataField &&
        tipoBlocoSapataField.value !== "" &&
        tipoBlocoSapataField.value !== "Nenhum"
      );
    },
  },
  "largura-bloco-sapata": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoBlocoSapataField = document.getElementById("tipo-bloco-sapata");
      return (
        tipoBlocoSapataField &&
        tipoBlocoSapataField.value !== "" &&
        tipoBlocoSapataField.value !== "Nenhum"
      );
    },
  },
  "comprimento-bloco-sapata": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoBlocoSapataField = document.getElementById("tipo-bloco-sapata");
      return (
        tipoBlocoSapataField &&
        tipoBlocoSapataField.value !== "" &&
        tipoBlocoSapataField.value !== "Nenhum"
      );
    },
  },
  pavimento: { type: "text", required: true },
  "largura-barreira-esquerda": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoBarreiraField = document.getElementById("tipo-barreira-esquerda");
      return tipoBarreiraField && tipoBarreiraField.value !== "" && tipoBarreiraField.value !== "Nenhum";
    },
  },
  "largura-barreira-direita": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoBarreiraField = document.getElementById("tipo-barreira-direita");
      return tipoBarreiraField && tipoBarreiraField.value !== "" && tipoBarreiraField.value !== "Nenhum";
    },
  },
  "largura-guarda-rodas-esquerdo": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoGuardaRodasField = document.getElementById("guarda-rodas-esquerdo");
      return tipoGuardaRodasField && tipoGuardaRodasField.value !== "" && tipoGuardaRodasField.value !== "Nenhum";
    },
  },
  "largura-guarda-rodas-direito": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoGuardaRodasField = document.getElementById("guarda-rodas-direito");
      return tipoGuardaRodasField && tipoGuardaRodasField.value !== "" && tipoGuardaRodasField.value !== "Nenhum";
    },
  },
  "largura-calcada-esquerda": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoCalcadaField = document.getElementById("tipo-calcada-esquerda");
      return tipoCalcadaField && tipoCalcadaField.value !== "" && tipoCalcadaField.value !== "Nenhum";
    },
  },
  "largura-calcada-direita": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoCalcadaField = document.getElementById("tipo-calcada-direita");
      return tipoCalcadaField && tipoCalcadaField.value !== "" && tipoCalcadaField.value !== "Nenhum";
    },
  },
  "qtd-viga-contraventamento-pilar": {
    type: "number",
    min: 1,
    required: function () {
      const tipoContraventamentoField = document.getElementById("tipo-contraventamento-pilar");
      return tipoContraventamentoField && 
             tipoContraventamentoField.value === "VIGA DE CONTRAVENTAMENTO DE PILAR DE CONCRETO ARMADO";
    },
  },
};

// // Log para debug: verificar se campos de bloco sapata estão registrados
// console.log("Campos de bloco sapata registrados:", {
//   "altura-bloco-sapata": !!requiredFields["altura-bloco-sapata"],
//   "largura-bloco-sapata": !!requiredFields["largura-bloco-sapata"],
//   "comprimento-bloco-sapata": !!requiredFields["comprimento-bloco-sapata"]
// });

// Validar campo específico
function validateField(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);

  if (!field) return true;

  field.classList.remove("error");
  if (errorElement) errorElement.classList.remove("visible");

  if (requiredFields[fieldId]) {
    const config = requiredFields[fieldId];
    const isRequired = typeof config.required === "function" ? config.required() : config.required;

    if (isRequired) {
      if (config.type === "number") {
        const value = parseFloat(field.value);
        // Debug para campos de bloco sapata
        if (fieldId.includes("bloco-sapata")) {
          console.log(`Validando ${fieldId}: valor="${field.value}", parsed=${value}, min=${config.min}, isRequired=${isRequired}`);
        }
        
        // Campo vazio ou valor menor que o mínimo
        if (field.value === "" || isNaN(value) || (config.min !== null && value < config.min)) {
          field.classList.add("error");
          if (errorElement) errorElement.classList.add("visible");
          return false;
        }
        
        // Validar valor máximo
        if (config.max !== undefined && value > config.max) {
          field.classList.add("error");
          if (errorElement) {
            errorElement.textContent = `Valor máximo permitido: ${config.max}m`;
            errorElement.classList.add("visible");
          }
          return false;
        }
      } else if (config.type === "text") {
        if (!field.value.trim()) {
          field.classList.add("error");
          if (errorElement) errorElement.classList.add("visible");
          return false;
        }
      }
    }
  }
  return true;
}

// Validar tramos
function validateTramos() {
  const tramosFields = document.querySelectorAll(".tramo-field");
  const errorElement = document.getElementById("tramos-error");
  let valid = true;

  tramosFields.forEach((field) => {
    field.classList.remove("error");
    const value = parseFloat(field.value) || 0;
    if (value < 0.5) {
      field.classList.add("error");
      valid = false;
    }
  });

  if (!valid && errorElement) {
    errorElement.classList.add("visible");
  } else if (errorElement) {
    errorElement.classList.remove("visible");
  }

  return valid;
}

// Validar apoios
function validateApoios() {
  const apoiosRows = document.querySelectorAll(".apoio-row");
  const errorElement = document.getElementById("apoios-error");
  let valid = true;
  const emptyFields = [];

  apoiosRows.forEach((row, index) => {
    const alturaField = row.querySelector(".apoio-altura-field");
    const compField = row.querySelector(".apoio-comp-field");
    const largField = row.querySelector(".apoio-larg-field");

    if (alturaField) alturaField.classList.remove("error");
    if (compField) compField.classList.remove("error");
    if (largField) largField.classList.remove("error");

    const alturaVazia = !alturaField || !alturaField.value.trim() || parseFloat(alturaField.value) === 0;
    const compVazio = !compField || !compField.value.trim() || parseFloat(compField.value) === 0;
    const largVazio = !largField || !largField.value.trim() || parseFloat(largField.value) === 0;

    if (alturaVazia || compVazio || largVazio) {
      valid = false;
      if (alturaVazia && alturaField) {
        alturaField.classList.add("error");
        emptyFields.push(`Apoio ${index + 1} - Altura`);
      }
      if (compVazio && compField) {
        compField.classList.add("error");
        emptyFields.push(`Apoio ${index + 1} - Comprimento`);
      }
      if (largVazio && largField) {
        largField.classList.add("error");
        emptyFields.push(`Apoio ${index + 1} - Largura`);
      }
    }
  });

  if (!valid && errorElement) {
    errorElement.textContent = `Campos obrigatórios vazios: ${emptyFields.join(", ")}`;
    errorElement.classList.add("visible");
    errorElement.style.display = "block";
  } else if (errorElement) {
    errorElement.classList.remove("visible");
    errorElement.style.display = "none";
  }

  return valid;
}

// Validar proteção lateral
function validateLateralProtection() {
  const hasLeftProtection =
    (document.getElementById("tipo-barreira-esquerda").value !== "" &&
      document.getElementById("tipo-barreira-esquerda").value !== "Nenhum") ||
    (document.getElementById("guarda-rodas-esquerdo").value !== "" &&
      document.getElementById("guarda-rodas-esquerdo").value !== "Nenhum") ||
    (document.getElementById("tipo-calcada-esquerda").value !== "" &&
      document.getElementById("tipo-calcada-esquerda").value !== "Nenhum");

  const hasRightProtection =
    (document.getElementById("tipo-barreira-direita").value !== "" &&
      document.getElementById("tipo-barreira-direita").value !== "Nenhum") ||
    (document.getElementById("guarda-rodas-direito").value !== "" &&
      document.getElementById("guarda-rodas-direito").value !== "Nenhum") ||
    (document.getElementById("tipo-calcada-direita").value !== "" &&
      document.getElementById("tipo-calcada-direita").value !== "Nenhum");

  if (!hasLeftProtection) {
    document.getElementById("tipo-barreira-esquerda").classList.add("error");
    document.getElementById("guarda-rodas-esquerdo").classList.add("error");
    document.getElementById("tipo-calcada-esquerda").classList.add("error");
  } else {
    document.getElementById("tipo-barreira-esquerda").classList.remove("error");
    document.getElementById("guarda-rodas-esquerdo").classList.remove("error");
    document.getElementById("tipo-calcada-esquerda").classList.remove("error");
  }

  if (!hasRightProtection) {
    document.getElementById("tipo-barreira-direita").classList.add("error");
    document.getElementById("guarda-rodas-direito").classList.add("error");
    document.getElementById("tipo-calcada-direita").classList.add("error");
  } else {
    document.getElementById("tipo-barreira-direita").classList.remove("error");
    document.getElementById("guarda-rodas-direito").classList.remove("error");
    document.getElementById("tipo-calcada-direita").classList.remove("error");
  }

  const errorMessage = document.getElementById("lateral-protection-error");
  if (!hasLeftProtection || !hasRightProtection) {
    if (errorMessage) errorMessage.style.display = "block";
  } else {
    if (errorMessage) errorMessage.style.display = "none";
  }

  return hasLeftProtection && hasRightProtection;
}

// Validar ala com encontro
function validateAlaWithEncountro() {
  const encontroField = document.getElementById("tipo-encontro");
  if (!encontroField) return true;

  const encontroValue = encontroField.value;
  
  // PAREDE FRONTAL PORTANTE ou ALVENARIA DE PEDRA exigem ala
  if (encontroValue !== "ENCONTRO - PAREDE FRONTAL PORTANTE" && 
      encontroValue !== "ENCONTRO DE ALVENARIA DE PEDRA") {
    return true;
  }

  const alaParalelaField = document.getElementById("tipo-ala-paralela");
  const alaPerpendicularField = document.getElementById("tipo-ala-perpendicular");

  const hasAlaParalela = alaParalelaField && alaParalelaField.value !== "" && alaParalelaField.value !== "Nenhum";
  const hasAlaPerpendicular = alaPerpendicularField && alaPerpendicularField.value !== "" && alaPerpendicularField.value !== "Nenhum";

  return hasAlaParalela || hasAlaPerpendicular;
}

// Validar largura mínima (deslocamento esq + dir + 0.5)
function validateMinimumWidth() {
  const largura = parseFloat(document.getElementById("largura").value) || 0;
  const deslocEsq = parseFloat(document.getElementById("deslocamento-esquerdo").value) || 0;
  const deslocDir = parseFloat(document.getElementById("deslocamento-direito").value) || 0;
  
  const larguraMinima = deslocEsq + deslocDir + 0.5;
  
  if (largura < larguraMinima) {
    document.getElementById("largura").classList.add("error");
    document.getElementById("deslocamento-esquerdo").classList.add("error");
    document.getElementById("deslocamento-direito").classList.add("error");
    return false;
  }
  
  document.getElementById("largura").classList.remove("error");
  document.getElementById("deslocamento-esquerdo").classList.remove("error");
  document.getElementById("deslocamento-direito").classList.remove("error");
  return true;
}

// Validar altura mínima (altura longarina + maior apoio)
function validateMinimumHeight() {
  const alturaTotal = parseFloat(document.getElementById("altura").value) || 0;
  const alturaLongarina = parseFloat(document.getElementById("altura-longarina").value) || 0;
  
  const errorElement = document.getElementById("altura-sum-error");
  
  if (alturaTotal === 0 || alturaLongarina === 0) {
    if (errorElement) errorElement.style.display = "none";
    return true;
  }
  
  const apoioAlturaFields = document.querySelectorAll(".apoio-altura-field");
  if (apoioAlturaFields.length === 0) {
    if (errorElement) errorElement.style.display = "none";
    return true;
  }
  
  // Encontrar o maior apoio
  let maiorApoio = 0;
  let indexMaiorApoio = -1;
  apoioAlturaFields.forEach((field, index) => {
    const altura = parseFloat(field.value) || 0;
    if (altura > maiorApoio) {
      maiorApoio = altura;
      indexMaiorApoio = index;
    }
  });
  
  const alturaMinima = alturaLongarina + maiorApoio;
  const tolerancia = 0.01;
  
  if (Math.abs(alturaTotal - alturaMinima) > tolerancia) {
    document.getElementById("altura").classList.add("error");
    document.getElementById("altura-longarina").classList.add("error");
    
    // Destacar o maior apoio em vermelho
    apoioAlturaFields.forEach((field, index) => {
      if (index === indexMaiorApoio) {
        field.classList.add("error");
      }
    });
    
    // Mostrar mensagem de erro com botão da calculadora
    if (errorElement) {
      errorElement.style.display = "block";
    }
    
    return false;
  }
  
  document.getElementById("altura").classList.remove("error");
  document.getElementById("altura-longarina").classList.remove("error");
  apoioAlturaFields.forEach(field => field.classList.remove("error"));
  
  if (errorElement) {
    errorElement.style.display = "none";
  }
  
  return true;
}

// Validar ALA: OU paralela OU perpendicular, não ambas
function validateAlaExclusivity() {
  const alaParalelaField = document.getElementById("tipo-ala-paralela");
  const alaPerpendicularField = document.getElementById("tipo-ala-perpendicular");
  
  if (!alaParalelaField || !alaPerpendicularField) return true;
  
  const hasParalela = alaParalelaField.value !== "" && alaParalelaField.value !== "Nenhum";
  const hasPerpendicular = alaPerpendicularField.value !== "" && alaPerpendicularField.value !== "Nenhum";
  
  // Se ambas estiverem selecionadas, é erro
  if (hasParalela && hasPerpendicular) {
    alaParalelaField.classList.add("error");
    alaPerpendicularField.classList.add("error");
    return false;
  }
  
  alaParalelaField.classList.remove("error");
  alaPerpendicularField.classList.remove("error");
  return true;
}

// Validar comprimento máximo do pilar (2m)
function validatePilarMaxLength() {
  const apoiosCompFields = document.querySelectorAll(".apoio-comp-field");
  let valid = true;
  
  apoiosCompFields.forEach((field, index) => {
    const valor = parseFloat(field.value) || 0;
    if (valor > 2) {
      field.classList.add("error");
      valid = false;
    } else {
      field.classList.remove("error");
    }
  });
  
  return valid;
}

// Validar soma dos tramos
function validateTramosSum() {
  const comprimento = parseFloat(document.getElementById("comprimento").value) || 0;
  const tramosFields = document.querySelectorAll(".tramo-field");
  
  if (tramosFields.length === 0) return true;
  
  let somaTramos = 0;
  tramosFields.forEach(field => {
    somaTramos += parseFloat(field.value) || 0;
  });
  
  const tolerancia = 0.01;
  if (Math.abs(somaTramos - comprimento) > tolerancia) {
    document.getElementById("comprimento").classList.add("error");
    tramosFields.forEach(f => f.classList.add("error"));
    return false;
  }
  
  document.getElementById("comprimento").classList.remove("error");
  tramosFields.forEach(f => f.classList.remove("error"));
  return true;
}

// Validar formulário completo
function validateForm() {
  let isValid = true;
  const missingFields = [];

  console.log("=== Iniciando validação completa do formulário ===");
  
  for (const fieldId in requiredFields) {
    const isFieldValid = validateField(fieldId);
    if (!isFieldValid) {
      isValid = false;
      const field = document.getElementById(fieldId);
      const label = document.querySelector(`label[for="${fieldId}"]`);
      const fieldName = label ? label.textContent.replace(":", "") : fieldId;
      missingFields.push(fieldName);
      console.log(`❌ Campo inválido: ${fieldId} (${fieldName})`);

      const tabContent = field.closest(".tab-content");
      if (tabContent && !tabContent.classList.contains("active")) {
        const tabId = tabContent.id.replace("-content", "");
        const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
        if (tab) tab.click();
      }
    }
  }

  const tramosValid = validateTramos();
  if (!tramosValid) {
    isValid = false;
    missingFields.push("Comprimento dos Tramos (mínimo 0.5m)");
  }
  
  const tramosSumValid = validateTramosSum();
  if (!tramosSumValid) {
    isValid = false;
    missingFields.push("Soma dos tramos deve ser igual ao comprimento total");
  }

  const apoiosValid = validateApoios();
  if (!apoiosValid) {
    isValid = false;
    missingFields.push("Dados dos Apoios");
  }
  
  const widthValid = validateMinimumWidth();
  if (!widthValid) {
    isValid = false;
    const deslocEsq = parseFloat(document.getElementById("deslocamento-esquerdo").value) || 0;
    const deslocDir = parseFloat(document.getElementById("deslocamento-direito").value) || 0;
    const minWidth = deslocEsq + deslocDir + 0.5;
    missingFields.push(`Largura mínima deve ser ${minWidth.toFixed(2)}m (DESLOCAMENTO ESQUERDO + DESLOCAMENTO DIREITO + 0.5)`);
  }
  
  const heightValid = validateMinimumHeight();
  if (!heightValid) {
    isValid = false;
    const alturaLong = parseFloat(document.getElementById("altura-longarina").value) || 0;
    const apoioFields = document.querySelectorAll(".apoio-altura-field");
    let maiorApoio = 0;
    apoioFields.forEach(f => {
      const h = parseFloat(f.value) || 0;
      if (h > maiorApoio) maiorApoio = h;
    });
    const minHeight = alturaLong + maiorApoio;
    missingFields.push(`Altura deve ser ${minHeight.toFixed(2)}m (Altura Longarina + Maior Apoio) - Use a Calculadora 🧮`);
  }

  const lateralProtectionValid = validateLateralProtection();
  if (!lateralProtectionValid) {
    isValid = false;
    missingFields.push("Proteção Lateral em ambos os lados");
  }

  const alaWithEncontroValid = validateAlaWithEncountro();
  if (!alaWithEncontroValid) {
    isValid = false;
    missingFields.push("Ala obrigatória quando o encontro é Parede Frontal Portante ou Alvenaria de Pedra");
  }

  const alaExclusivityValid = validateAlaExclusivity();
  if (!alaExclusivityValid) {
    isValid = false;
    missingFields.push("Ala: Selecione APENAS uma opção (Paralela OU Perpendicular), não ambas");
  }

  const pilarMaxLengthValid = validatePilarMaxLength();
  if (!pilarMaxLengthValid) {
    isValid = false;
    missingFields.push("Comprimento dos pilares não pode ser maior que 2m");
  }

  console.log(`=== Validação concluída: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'} ===`);
  console.log(`Campos faltando (${missingFields.length}):`, missingFields);

  return { isValid, missingFields };
}

// Função para mostrar/ocultar campo de quantidade de viga de contraventamento
function togglePillarBracingQuantityField() {
  const tipoContraventamentoField = document.getElementById("tipo-contraventamento-pilar");
  const qtdVigaGroup = document.getElementById("qtd-viga-contraventamento-group");
  const qtdVigaField = document.getElementById("qtd-viga-contraventamento-pilar");
  
  if (!tipoContraventamentoField || !qtdVigaGroup || !qtdVigaField) return;
  
  const isVigaContraventamento = tipoContraventamentoField.value === "VIGA DE CONTRAVENTAMENTO DE PILAR DE CONCRETO ARMADO";
  
  if (isVigaContraventamento) {
    qtdVigaGroup.style.display = "";
    qtdVigaField.setAttribute("required", "required");
  } else {
    qtdVigaGroup.style.display = "none";
    qtdVigaField.removeAttribute("required");
    qtdVigaField.value = "";
    qtdVigaField.classList.remove("error");
    const errorElement = document.getElementById("qtd-viga-contraventamento-pilar-error");
    if (errorElement) errorElement.classList.remove("visible");
  }
}

// Expor funções globalmente
window.validateField = validateField;
window.validateTramos = validateTramos;
window.validateApoios = validateApoios;
window.validateLateralProtection = validateLateralProtection;
window.validateAlaWithEncountro = validateAlaWithEncountro;
window.validateAlaExclusivity = validateAlaExclusivity;
window.validatePilarMaxLength = validatePilarMaxLength;
window.validateMinimumWidth = validateMinimumWidth;
window.validateMinimumHeight = validateMinimumHeight;
window.validateTramosSum = validateTramosSum;
window.validateForm = validateForm;
window.togglePillarBracingQuantityField = togglePillarBracingQuantityField;
