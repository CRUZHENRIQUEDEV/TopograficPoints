/* ===== VALIDAÇÕES ===== */

// Campos obrigatórios
window.requiredFields = {
  lote: { type: "text", min: null, required: true },
  codigo: { type: "text", min: null, required: true },
  comprimento: { type: "number", min: 1, required: true },
  largura: { type: "number", min: 0, required: true },
  altura: { type: "number", min: 0, required: true },
  "qtd-tramos": { type: "number", min: 1, required: true },
  "tipo-superestrutura": { type: "text", min: null, required: true },
  "cortina-altura": {
    type: "number",
    min: function () {
      const espessuraLajeField = document.getElementById("espessura-laje");
      return parseFloat(espessuraLajeField ? espessuraLajeField.value : 0) || 0;
    },
    required: true,
  },
  "tipo-ala-paralela": {
    type: "text",
    required: function () {
      const encontroField = document.getElementById("tipo-encontro");
      const alaPerpendicularField = document.getElementById(
        "tipo-ala-perpendicular"
      );
      if (!encontroField || !alaPerpendicularField) return false;
      return (
        encontroField.value === "ENCONTRO - PAREDE FRONTAL PORTANTE" &&
        (alaPerpendicularField.value === "" ||
          alaPerpendicularField.value === "Nenhum")
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
      const alaPerpendicularField = document.getElementById(
        "tipo-ala-perpendicular"
      );
      if (!alaParalelaField || !alaPerpendicularField) return false;
      return (
        (alaParalelaField.value !== "" &&
          alaParalelaField.value !== "Nenhum") ||
        (alaPerpendicularField.value !== "" &&
          alaPerpendicularField.value !== "Nenhum")
      );
    },
  },
  "espessura-ala": {
    type: "number",
    min: 0,
    max: 1.5,
    required: function () {
      const alaParalelaField = document.getElementById("tipo-ala-paralela");
      const alaPerpendicularField = document.getElementById(
        "tipo-ala-perpendicular"
      );
      if (!alaParalelaField || !alaPerpendicularField) return false;
      return (
        (alaParalelaField.value !== "" &&
          alaParalelaField.value !== "Nenhum") ||
        (alaPerpendicularField.value !== "" &&
          alaPerpendicularField.value !== "Nenhum")
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
  "altura-longarina": {
    type: "number",
    min: 0,
    required: function () {
      const qtdLongarinaField = document.getElementById("qtd-longarinas");
      const qtdLongarinas =
        parseInt(qtdLongarinaField ? qtdLongarinaField.value : 0) || 0;
      return qtdLongarinas > 0;
    },
  },
  "deslocamento-esquerdo": {
    type: "number",
    min: function () {
      // Mínimo = metade da espessura da longarina
      const espessuraLongarina =
        parseFloat(document.getElementById("espessura-longarina")?.value) || 0;
      return espessuraLongarina / 2;
    },
    required: true,
  },
  "deslocamento-direito": {
    type: "number",
    min: function () {
      // Mínimo = metade da espessura da longarina
      const espessuraLongarina =
        parseFloat(document.getElementById("espessura-longarina")?.value) || 0;
      return espessuraLongarina / 2;
    },
    required: true,
  },
  "qtd-longarinas": { type: "number", min: 0, required: true },
  "espessura-longarina": {
    type: "number",
    min: 0,
    required: function () {
      const qtdLongarinaField = document.getElementById("qtd-longarinas");
      const qtdLongarinas =
        parseInt(qtdLongarinaField ? qtdLongarinaField.value : 0) || 0;
      // Só é obrigatório quando há mais de 1 longarina (quando há 1, é seção caixão com cálculo automático)
      return qtdLongarinas > 1;
    },
  },
  "tipo-transversina": {
    type: "text",
    min: null,
    required: function () {
      const qtdTransversinasField =
        document.getElementById("qtd-transversinas");
      const qtdTransversinas =
        parseInt(qtdTransversinasField ? qtdTransversinasField.value : 0) || 0;
      return qtdTransversinas > 0;
    },
  },
  "espessura-transversina": {
    type: "number",
    min: 0,
    required: function () {
      const qtdTransversinasField =
        document.getElementById("qtd-transversinas");
      const qtdTransversinas =
        parseInt(qtdTransversinasField ? qtdTransversinasField.value : 0) || 0;
      return qtdTransversinas > 0;
    },
  },
  "espessura-laje": { type: "number", min: 0, required: true },
  "qtd-pilares": { type: "number", min: 0, required: true },
  "largura-pilar": {
    type: "number",
    min: 0,
    max: function () {
      // Se há mais de 1 pilar, largura máxima é 2 metros
      const qtdPilaresField = document.getElementById("qtd-pilares");
      const qtdPilares =
        parseInt(qtdPilaresField ? qtdPilaresField.value : 0) || 0;
      return qtdPilares > 1 ? 2 : null;
    },
    required: function () {
      const qtdPilaresField = document.getElementById("qtd-pilares");
      const qtdPilares =
        parseInt(qtdPilaresField ? qtdPilaresField.value : 0) || 0;
      return qtdPilares > 0;
    },
  },
  "comprimento-pilares": {
    type: "number",
    min: 0,
    required: function () {
      const qtdPilaresField = document.getElementById("qtd-pilares");
      const qtdPilares =
        parseInt(qtdPilaresField ? qtdPilaresField.value : 0) || 0;
      return qtdPilares > 0;
    },
  },
  "altura-travessa": {
    type: "number",
    min: 0,
    max: function () {
      // Altura máxima da travessa = MENOR altura de apoio - 0.10m
      // (para garantir que não ultrapasse nenhum apoio)
      const apoioAlturaFields = document.querySelectorAll(
        ".apoio-altura-field"
      );
      if (apoioAlturaFields.length === 0) return null; // Sem limite se não há apoios

      let menorApoio = Infinity;
      apoioAlturaFields.forEach((field) => {
        const altura = parseFloat(field.value) || 0;
        if (altura > 0 && altura < menorApoio) {
          menorApoio = altura;
        }
      });

      // Se não há apoios válidos, não há limite
      if (menorApoio === Infinity || menorApoio === 0) return null;

      // Altura máxima = menor apoio - 10cm
      return menorApoio - 0.1;
    },
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
      const tipoBarreiraField = document.getElementById(
        "tipo-barreira-esquerda"
      );
      return (
        tipoBarreiraField &&
        tipoBarreiraField.value !== "" &&
        tipoBarreiraField.value !== "Nenhum"
      );
    },
  },
  "largura-barreira-direita": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoBarreiraField = document.getElementById(
        "tipo-barreira-direita"
      );
      return (
        tipoBarreiraField &&
        tipoBarreiraField.value !== "" &&
        tipoBarreiraField.value !== "Nenhum"
      );
    },
  },
  "largura-guarda-rodas-esquerdo": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoGuardaRodasField = document.getElementById(
        "guarda-rodas-esquerdo"
      );
      return (
        tipoGuardaRodasField &&
        tipoGuardaRodasField.value !== "" &&
        tipoGuardaRodasField.value !== "Nenhum"
      );
    },
  },
  "largura-guarda-rodas-direito": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoGuardaRodasField = document.getElementById(
        "guarda-rodas-direito"
      );
      return (
        tipoGuardaRodasField &&
        tipoGuardaRodasField.value !== "" &&
        tipoGuardaRodasField.value !== "Nenhum"
      );
    },
  },
  "largura-calcada-esquerda": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoCalcadaField = document.getElementById("tipo-calcada-esquerda");
      return (
        tipoCalcadaField &&
        tipoCalcadaField.value !== "" &&
        tipoCalcadaField.value !== "Nenhum"
      );
    },
  },
  "largura-calcada-direita": {
    type: "number",
    min: 0.01,
    required: function () {
      const tipoCalcadaField = document.getElementById("tipo-calcada-direita");
      return (
        tipoCalcadaField &&
        tipoCalcadaField.value !== "" &&
        tipoCalcadaField.value !== "Nenhum"
      );
    },
  },
  "qtd-viga-contraventamento-pilar": {
    type: "number",
    min: 1,
    required: function () {
      const tipoContraventamentoField = document.getElementById(
        "tipo-contraventamento-pilar"
      );
      return (
        tipoContraventamentoField &&
        tipoContraventamentoField.value ===
          "VIGA DE CONTRAVENTAMENTO DE PILAR DE CONCRETO ARMADO"
      );
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
    const isRequired =
      typeof config.required === "function"
        ? config.required()
        : config.required;

    if (isRequired) {
      if (config.type === "number") {
        const value = parseFloat(field.value);
        // Debug para campos de bloco sapata
        if (fieldId.includes("bloco-sapata")) {
        }

        // Obter o valor mínimo (pode ser número ou função)
        const minValue =
          typeof config.min === "function" ? config.min() : config.min;

        // Campo vazio ou valor menor que o mínimo
        if (
          field.value === "" ||
          isNaN(value) ||
          (minValue !== null && value < minValue)
        ) {
          field.classList.add("error");
          if (errorElement) {
            // Mensagem customizada para cortina-altura
            if (fieldId === "cortina-altura" && minValue > 0) {
              errorElement.textContent = `A altura mínima deve ser ${minValue.toFixed(
                2
              )}m (ESPESSURA LAJE)`;
            }
            // Mensagem customizada para deslocamento esquerdo/direito
            if (
              (fieldId === "deslocamento-esquerdo" ||
                fieldId === "deslocamento-direito") &&
              minValue > 0
            ) {
              const espessuraLong =
                parseFloat(
                  document.getElementById("espessura-longarina")?.value
                ) || 0;
              errorElement.textContent = `Mínimo ${minValue.toFixed(
                2
              )}m (metade da ESPESSURA LONGARINA ${espessuraLong.toFixed(2)}m)`;
            }
            errorElement.classList.add("visible");
          }
          return false;
        }

        // Validar valor máximo
        const maxValue =
          typeof config.max === "function" ? config.max() : config.max;
        if (maxValue !== undefined && maxValue !== null && value > maxValue) {
          field.classList.add("error");
          if (errorElement) {
            // Mensagem customizada para altura-travessa
            if (fieldId === "altura-travessa") {
              const menorApoio = maxValue + 0.1; // Recupera o menor apoio
              errorElement.textContent = `A altura máxima da travessa é ${maxValue.toFixed(
                2
              )}m (Menor Apoio ${menorApoio.toFixed(2)}m - 0.10m)`;
            } else {
              errorElement.textContent = `Valor máximo permitido: ${maxValue.toFixed(
                2
              )}m`;
            }
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

    const alturaVazia =
      !alturaField ||
      !alturaField.value.trim() ||
      parseFloat(alturaField.value) < 0.1;
    const compVazio =
      !compField ||
      !compField.value.trim() ||
      parseFloat(compField.value) < 0.1;
    const largVazio =
      !largField ||
      !largField.value.trim() ||
      parseFloat(largField.value) < 0.1;

    if (alturaVazia || compVazio || largVazio) {
      valid = false;
      if (alturaVazia && alturaField) {
        alturaField.classList.add("error");
        emptyFields.push(`Apoio ${index + 1} - Altura (mín. 0.1m)`);
      }
      if (compVazio && compField) {
        compField.classList.add("error");
        emptyFields.push(`Apoio ${index + 1} - Comprimento (mín. 0.1m)`);
      }
      if (largVazio && largField) {
        largField.classList.add("error");
        emptyFields.push(`Apoio ${index + 1} - Largura (mín. 0.1m)`);
      }
    }
  });

  if (!valid && errorElement) {
    errorElement.textContent = `Campos obrigatórios vazios: ${emptyFields.join(
      ", "
    )}`;
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
  if (
    encontroValue !== "ENCONTRO - PAREDE FRONTAL PORTANTE" &&
    encontroValue !== "ENCONTRO DE ALVENARIA DE PEDRA"
  ) {
    return true;
  }

  const alaParalelaField = document.getElementById("tipo-ala-paralela");
  const alaPerpendicularField = document.getElementById(
    "tipo-ala-perpendicular"
  );

  const hasAlaParalela =
    alaParalelaField &&
    alaParalelaField.value !== "" &&
    alaParalelaField.value !== "Nenhum";
  const hasAlaPerpendicular =
    alaPerpendicularField &&
    alaPerpendicularField.value !== "" &&
    alaPerpendicularField.value !== "Nenhum";

  return hasAlaParalela || hasAlaPerpendicular;
}

// Validar largura mínima (deslocamento esq + dir + 0.5)
function validateMinimumWidth() {
  const largura = parseFloat(document.getElementById("largura").value) || 0;
  const deslocEsq =
    parseFloat(document.getElementById("deslocamento-esquerdo").value) || 0;
  const deslocDir =
    parseFloat(document.getElementById("deslocamento-direito").value) || 0;

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
  const alturaLongarina =
    parseFloat(document.getElementById("altura-longarina").value) || 0;

  const errorElement = document.getElementById("altura-sum-error");

  // Se não há longarinas, não validar altura
  const qtdLongarinasField = document.getElementById("qtd-longarinas");
  const qtdLongarinas =
    parseInt(qtdLongarinasField ? qtdLongarinasField.value : 0) || 0;
  if (qtdLongarinas === 0) {
    if (errorElement) errorElement.style.display = "none";
    return true;
  }

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
  apoioAlturaFields.forEach((field) => field.classList.remove("error"));

  if (errorElement) {
    errorElement.style.display = "none";
  }

  return true;
}

// Validar ALA: OU paralela OU perpendicular, não ambas
function validateAlaExclusivity() {
  const alaParalelaField = document.getElementById("tipo-ala-paralela");
  const alaPerpendicularField = document.getElementById(
    "tipo-ala-perpendicular"
  );

  if (!alaParalelaField || !alaPerpendicularField) return true;

  const hasParalela =
    alaParalelaField.value !== "" && alaParalelaField.value !== "Nenhum";
  const hasPerpendicular =
    alaPerpendicularField.value !== "" &&
    alaPerpendicularField.value !== "Nenhum";

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
  const comprimento =
    parseFloat(document.getElementById("comprimento").value) || 0;
  const tramosFields = document.querySelectorAll(".tramo-field");

  if (tramosFields.length === 0) return true;

  let somaTramos = 0;
  tramosFields.forEach((field) => {
    somaTramos += parseFloat(field.value) || 0;
  });

  const tolerancia = 0.01;
  if (Math.abs(somaTramos - comprimento) > tolerancia) {
    document.getElementById("comprimento").classList.add("error");
    tramosFields.forEach((f) => f.classList.add("error"));
    return false;
  }

  document.getElementById("comprimento").classList.remove("error");
  tramosFields.forEach((f) => f.classList.remove("error"));
  return true;
}

// Validar altura longarina quando há APOIO na transição
function validateAlturaLongarinaComApoioTransicao() {
  const tipoEncontroField = document.getElementById("tipo-encontro");
  const alturaLongarinaField = document.getElementById("altura-longarina");
  const cortinaAlturaField = document.getElementById("cortina-altura");
  const errorElement = document.getElementById("altura-longarina-apoio-error");

  if (!tipoEncontroField || !alturaLongarinaField || !cortinaAlturaField) {
    return true;
  }

  const hasApoioTransicao = tipoEncontroField.value === "APOIO";

  if (!hasApoioTransicao) {
    if (errorElement) errorElement.style.display = "none";
    alturaLongarinaField.classList.remove("error");
    cortinaAlturaField.classList.remove("error");
    return true;
  }

  const alturaLongarina = parseFloat(alturaLongarinaField.value) || 0;
  const cortinaAltura = parseFloat(cortinaAlturaField.value) || 0;
  const diferencaMinima = 0.06; // 6cm = 0.06m

  const diferencaAtual = cortinaAltura - alturaLongarina;

  if (diferencaAtual < diferencaMinima) {
    if (errorElement) {
      errorElement.style.display = "block";
      const diferencaNecessaria = (diferencaMinima - diferencaAtual).toFixed(2);
      errorElement.innerHTML = `<strong>⚠️ APOIO na Transição:</strong> ALTURA CORTINA deve ser pelo menos <strong>6cm maior</strong> que ALTURA LONGARINA (para aparelho de apoio 5cm + berço 1cm).<br>Diferença atual: <strong>${(
        diferencaAtual * 100
      ).toFixed(
        1
      )}cm</strong> | Necessário: <strong>6cm</strong><br>💡 Aumente a altura cortina em <strong>${(
        diferencaNecessaria * 100
      ).toFixed(1)}cm</strong> ou diminua a altura longarina.`;
    }
    alturaLongarinaField.classList.add("error");
    cortinaAlturaField.classList.add("error");
    return false;
  }

  if (errorElement) errorElement.style.display = "none";
  alturaLongarinaField.classList.remove("error");
  cortinaAlturaField.classList.remove("error");
  return true;
}

// Validar formulário completo
function validateForm() {
  let isValid = true;
  const missingFields = [];

  for (const fieldId in requiredFields) {
    const isFieldValid = validateField(fieldId);
    if (!isFieldValid) {
      isValid = false;
      const field = document.getElementById(fieldId);
      const label = document.querySelector(`label[for="${fieldId}"]`);
      let fieldName = label ? label.textContent.replace(":", "") : fieldId;

      // Mensagem explicativa para deslocamento esquerdo/direito
      if (
        fieldId === "deslocamento-esquerdo" ||
        fieldId === "deslocamento-direito"
      ) {
        const espessuraLong =
          parseFloat(document.getElementById("espessura-longarina")?.value) ||
          0;
        const minValue = espessuraLong / 2;
        if (minValue > 0) {
          fieldName = `${fieldName} (mínimo ${minValue.toFixed(
            2
          )}m = metade da ESPESSURA LONGARINA)`;
        }
      }

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
    const deslocEsq =
      parseFloat(document.getElementById("deslocamento-esquerdo").value) || 0;
    const deslocDir =
      parseFloat(document.getElementById("deslocamento-direito").value) || 0;
    const minWidth = deslocEsq + deslocDir + 0.5;
    missingFields.push(
      `Largura mínima deve ser ${minWidth.toFixed(
        2
      )}m (DESLOCAMENTO ESQUERDO + DESLOCAMENTO DIREITO + 0.5)`
    );
  }

  const heightValid = validateMinimumHeight();
  if (!heightValid) {
    isValid = false;
    const alturaLong =
      parseFloat(document.getElementById("altura-longarina").value) || 0;
    const apoioFields = document.querySelectorAll(".apoio-altura-field");
    let maiorApoio = 0;
    apoioFields.forEach((f) => {
      const h = parseFloat(f.value) || 0;
      if (h > maiorApoio) maiorApoio = h;
    });
    const minHeight = alturaLong + maiorApoio;
    missingFields.push(
      `Altura deve ser ${minHeight.toFixed(
        2
      )}m (Altura Longarina + Maior Apoio) - Use a Calculadora 🧮`
    );
  }

  const lateralProtectionValid = validateLateralProtection();
  if (!lateralProtectionValid) {
    isValid = false;
    missingFields.push("Proteção Lateral em ambos os lados");
  }

  const alaWithEncontroValid = validateAlaWithEncountro();
  if (!alaWithEncontroValid) {
    isValid = false;
    missingFields.push(
      "Ala obrigatória quando o encontro é Parede Frontal Portante ou Alvenaria de Pedra"
    );
  }

  const alaExclusivityValid = validateAlaExclusivity();
  if (!alaExclusivityValid) {
    isValid = false;
    missingFields.push(
      "Ala: Selecione APENAS uma opção (Paralela OU Perpendicular), não ambas"
    );
  }

  const pilarMaxLengthValid = validatePilarMaxLength();
  if (!pilarMaxLengthValid) {
    isValid = false;
    missingFields.push("Comprimento dos pilares não pode ser maior que 2m");
  }

  const alturaLongarinaApoioValid = validateAlturaLongarinaComApoioTransicao();
  if (!alturaLongarinaApoioValid) {
    isValid = false;
    missingFields.push(
      "APOIO na Transição: ALTURA CORTINA deve ser 6cm maior que ALTURA LONGARINA"
    );
  }

  const superstructureTypeValid = validateSuperstructureType();
  if (!superstructureTypeValid) {
    isValid = false;
    missingFields.push(
      "Tipo de Superestrutura inválido ou ROTULADA sem mínimo de 2 transversinas"
    );
  }

  // console.log(`Campos faltando (${missingFields.length}):`, missingFields);

  return { isValid, missingFields };
}

// Função para mostrar/ocultar campo de quantidade de viga de contraventamento
function togglePillarBracingQuantityField() {
  const tipoContraventamentoField = document.getElementById(
    "tipo-contraventamento-pilar"
  );
  const qtdVigaGroup = document.getElementById(
    "qtd-viga-contraventamento-group"
  );
  const qtdVigaField = document.getElementById(
    "qtd-viga-contraventamento-pilar"
  );

  if (!tipoContraventamentoField || !qtdVigaGroup || !qtdVigaField) return;

  const isVigaContraventamento =
    tipoContraventamentoField.value ===
    "VIGA DE CONTRAVENTAMENTO DE PILAR DE CONCRETO ARMADO";

  if (isVigaContraventamento) {
    qtdVigaGroup.style.display = "";
    qtdVigaField.setAttribute("required", "required");
  } else {
    qtdVigaGroup.style.display = "none";
    qtdVigaField.removeAttribute("required");
    qtdVigaField.value = "";
    qtdVigaField.classList.remove("error");
    const errorElement = document.getElementById(
      "qtd-viga-contraventamento-pilar-error"
    );
    if (errorElement) errorElement.classList.remove("visible");
  }
}

// Validar altura da longarina em relação ao maior tramo (aviso, não impede salvamento)
function checkLongarinaHeightWarning() {
  // Se for MONOLÍTICO, não gerar aviso de longarina
  const tipoEncontroField = document.getElementById("tipo-encontro");
  if (tipoEncontroField && tipoEncontroField.value === "MONOLITICO") {
    return null; // Monolítico não tem longarinas
  }

  const tramosFields = document.querySelectorAll(".tramo-field");
  const alturaLongarinaField = document.getElementById("altura-longarina");

  // Se não há longarinas, não gerar aviso
  const qtdLongarinasField = document.getElementById("qtd-longarinas");
  const qtdLongarinas =
    parseInt(qtdLongarinasField ? qtdLongarinasField.value : 0) || 0;
  if (qtdLongarinas === 0) {
    return null; // Sem longarinas, não validar
  }

  if (!alturaLongarinaField || tramosFields.length === 0) {
    return null; // Sem dados para validar
  }

  const alturaLongarina = parseFloat(alturaLongarinaField.value) || 0;

  // Encontrar o maior tramo
  let maiorTramo = 0;
  tramosFields.forEach((field) => {
    const comprimento = parseFloat(field.value) || 0;
    if (comprimento > maiorTramo) {
      maiorTramo = comprimento;
    }
  });

  if (maiorTramo === 0 || alturaLongarina === 0) {
    return null; // Sem dados para validar
  }

  // Quando há apenas 1 longarina, será uma seção caixão protendida, ideal é 5%
  // Quando há mais de 1 longarina, referência comum é 10%
  const isSecaoCaixao = qtdLongarinas === 1;
  const percentualMinimo = 0.05; // 5%
  const percentualReferencia = isSecaoCaixao ? 0.05 : 0.1; // 5% para caixão, 10% para múltiplas longarinas
  const alturaMinima = maiorTramo * percentualMinimo;
  const alturaReferencia = maiorTramo * percentualReferencia;

  const percentualAtual = (alturaLongarina / maiorTramo) * 100;

  // Se a altura for menor que 5%, retorna aviso crítico
  if (alturaLongarina < alturaMinima) {
    const tipoSecao = isSecaoCaixao ? "(Seção Caixão Protendida)" : "";
    return {
      type: "critical",
      message: `⚠️ <strong>POSSÍVEL ERRO DE PREENCHIMENTO:</strong> A altura da longarina (${alturaLongarina.toFixed(
        2
      )}m) parece muito baixa em relação ao maior tramo (${maiorTramo.toFixed(
        2
      )}m). ${tipoSecao}<br>
                • <strong>Percentual atual:</strong> ${percentualAtual.toFixed(
                  1
                )}% do vão<br>
                • <strong>Referência comum:</strong> Em torno de ${(
                  percentualReferencia * 100
                ).toFixed(0)}% do vão (${alturaReferencia.toFixed(2)}m)<br>
                • <strong>Mínimo estrutural típico:</strong> ${alturaMinima.toFixed(
                  2
                )}m (5% do vão)<br>
                <strong>Verifique se a medição está correta antes de salvar.</strong>`,
    };
  }

  // Se a altura for menor que a referência mas maior que 5%, retorna aviso moderado
  // Para seção caixão (1 longarina), a referência é 5%, então este aviso não aparecerá
  if (alturaLongarina < alturaReferencia && !isSecaoCaixao) {
    return {
      type: "moderate",
      message: `💡 <strong>VERIFICAÇÃO:</strong> A altura da longarina (${alturaLongarina.toFixed(
        2
      )}m) está abaixo do comum para o maior tramo (${maiorTramo.toFixed(
        2
      )}m).<br>
                • <strong>Percentual atual:</strong> ${percentualAtual.toFixed(
                  1
                )}% do vão<br>
                • <strong>Referência comum:</strong> Em torno de 10% do vão (${alturaReferencia.toFixed(
                  2
                )}m)<br>
                <strong>Confirme se a medição foi realizada corretamente.</strong>`,
    };
  }

  return null; // Tudo OK
}

// Validar altura da cortina em relação à longarina quando há aparelho de apoio (aviso, não impede salvamento)
function checkCortinaHeightWarning() {
  const tipoEncontroField = document.getElementById("tipo-encontro");
  const tipoAparelhoApoioField = document.getElementById("tipo-aparelho-apoio");
  const cortinaAlturaField = document.getElementById("cortina-altura");
  const alturaLongarinaField = document.getElementById("altura-longarina");

  if (
    !tipoEncontroField ||
    !tipoAparelhoApoioField ||
    !cortinaAlturaField ||
    !alturaLongarinaField
  ) {
    return null; // Campos não existem
  }

  const tipoEncontro = tipoEncontroField.value;

  // Se for MONOLÍTICO ou APOIO, não gerar aviso de cortina
  if (tipoEncontro === "MONOLITICO" || tipoEncontro.includes("APOIO")) {
    return null; // Monolítico e Apoio não têm cortina
  }

  const tipoAparelhoApoio = tipoAparelhoApoioField.value;
  const cortinaAltura = parseFloat(cortinaAlturaField.value) || 0;
  const alturaLongarina = parseFloat(alturaLongarinaField.value) || 0;

  // Verificar se tem parede frontal portante OU encontro laje
  const temParedeFrontal =
    tipoEncontro === "ENCONTRO - PAREDE FRONTAL PORTANTE";
  const temEncontroLaje = tipoEncontro === "ENCONTRO LAJE";

  // Verificar se tem aparelho de apoio
  const temAparelhoApoio =
    tipoAparelhoApoio !== "" && tipoAparelhoApoio !== "Nenhum";

  // Se tem (parede frontal OU encontro laje) E tem aparelho de apoio
  if ((temParedeFrontal || temEncontroLaje) && temAparelhoApoio) {
    const alturaCortinaMinima = alturaLongarina + 0.05; // 5cm = 0.05m
    const diferenca = alturaCortinaMinima - cortinaAltura;

    // Usar tolerância de 1mm para evitar problemas de precisão de ponto flutuante
    if (diferenca > 0.001) {
      return {
        type: "critical",
        message: `⚠️ <strong>ATENÇÃO:</strong> Quando há ${tipoEncontro} com aparelho de apoio, a altura da cortina deve ter pelo menos 5cm a mais que a longarina.<br>
                  • <strong>Altura da longarina:</strong> ${alturaLongarina.toFixed(
                    2
                  )}m<br>
                  • <strong>Altura da cortina atual:</strong> ${cortinaAltura.toFixed(
                    2
                  )}m<br>
                  • <strong>Altura mínima recomendada:</strong> ${alturaCortinaMinima.toFixed(
                    2
                  )}m<br>
                  <strong>Deseja revisar a altura da cortina ou da longarina?</strong>`,
      };
    }
  }

  return null; // Tudo OK
}

// Verificar se o checkbox de reforço de viga pode ser marcado
function checkBeamReinforcementAllowed() {
  const tipoSuperestruturaField = document.getElementById(
    "tipo-superestrutura"
  );
  if (!tipoSuperestruturaField) return true;

  const tipoSuperestrutura = tipoSuperestruturaField.value;

  // Se for ROTULADA, não permitir marcar o checkbox
  if (tipoSuperestrutura === "ROTULADA") {
    return false;
  }

  return true;
}

// Validar tipo de superestrutura e regras associadas
function validateSuperstructureType() {
  const tipoSuperestruturaField = document.getElementById(
    "tipo-superestrutura"
  );
  const qtdTransversinasField = document.getElementById("qtd-transversinas");
  const qtdLongarinaField = document.getElementById("qtd-longarinas");
  const beamReinforcementCheckbox =
    document.getElementById("beam-reinforcement");
  const errorElement = document.getElementById("tipo-superestrutura-error");

  if (!tipoSuperestruturaField) return true;

  const tipoSuperestrutura = tipoSuperestruturaField.value;
  console.log("validateSuperstructureType chamado - Tipo:", tipoSuperestrutura);

  // Validar que não está vazio
  if (!tipoSuperestrutura || tipoSuperestrutura === "") {
    tipoSuperestruturaField.classList.add("error");
    if (errorElement) {
      errorElement.textContent = "Este campo é obrigatório";
      errorElement.classList.add("visible");
    }
    return false;
  }

  // Se for ROTULADA, aplicar regras específicas
  if (tipoSuperestrutura === "ROTULADA") {
    let isValid = true;
    let errorMessages = [];

    // Regra 1: Desabilitar REFORÇO VIGA
    if (beamReinforcementCheckbox) {
      console.log(
        "Desabilitando REFORÇO VIGA - checkbox encontrado:",
        beamReinforcementCheckbox
      );
      beamReinforcementCheckbox.disabled = true;
      beamReinforcementCheckbox.checked = false;
      beamReinforcementCheckbox.style.cursor = "not-allowed";
      beamReinforcementCheckbox.style.opacity = "0.5";
      // Desabilitar também o label pai
      const parentLabel = beamReinforcementCheckbox.closest("label");
      if (parentLabel) {
        parentLabel.style.cursor = "not-allowed";
        parentLabel.style.opacity = "0.5";
      }
      console.log(
        "REFORÇO VIGA desabilitado - disabled:",
        beamReinforcementCheckbox.disabled
      );
    } else {
      console.log("ERRO: Checkbox beam-reinforcement não encontrado!");
    }

    // Regra 2: Validar que tem pelo menos 2 transversinas
    const qtdTransversinas = parseInt(qtdTransversinasField?.value) || 0;
    if (qtdTransversinas < 2) {
      if (qtdTransversinasField) qtdTransversinasField.classList.add("error");
      errorMessages.push("mínimo 2 transversinas");
      isValid = false;
    } else {
      if (qtdTransversinasField)
        qtdTransversinasField.classList.remove("error");
    }

    // Regra 3: Validar que quantidade de longarinas > 1
    const qtdLongarinas = parseInt(qtdLongarinaField?.value) || 0;
    if (qtdLongarinas <= 1) {
      if (qtdLongarinaField) qtdLongarinaField.classList.add("error");
      errorMessages.push("mais de 1 longarina");
      isValid = false;
    } else {
      if (qtdLongarinaField) qtdLongarinaField.classList.remove("error");
    }

    // Mostrar mensagens de erro
    if (!isValid) {
      tipoSuperestruturaField.classList.add("error");
      if (errorElement) {
        errorElement.textContent =
          "ROTULADA requer: " + errorMessages.join(" e ");
        errorElement.classList.add("visible");
      }
    } else {
      tipoSuperestruturaField.classList.remove("error");
      if (errorElement) {
        errorElement.classList.remove("visible");
      }
    }

    return isValid;
  } else {
    // Se não for ROTULADA, habilitar REFORÇO VIGA
    if (beamReinforcementCheckbox) {
      beamReinforcementCheckbox.disabled = false;
      beamReinforcementCheckbox.style.cursor = "pointer";
      beamReinforcementCheckbox.style.opacity = "1";
      // Reabilitar também o label pai
      const parentLabel = beamReinforcementCheckbox.closest("label");
      if (parentLabel) {
        parentLabel.style.cursor = "pointer";
        parentLabel.style.opacity = "1";
      }
    }
  }

  // Tudo OK
  tipoSuperestruturaField.classList.remove("error");
  if (qtdTransversinasField) qtdTransversinasField.classList.remove("error");
  if (qtdLongarinaField) qtdLongarinaField.classList.remove("error");
  if (errorElement) {
    errorElement.classList.remove("visible");
  }

  return true;
}

// Obter todos os avisos (não bloqueadores)
function getWarnings() {
  const warnings = [];

  const longarinaWarning = checkLongarinaHeightWarning();
  if (longarinaWarning) {
    warnings.push(longarinaWarning);
  }

  const cortinaWarning = checkCortinaHeightWarning();
  if (cortinaWarning) {
    warnings.push(cortinaWarning);
  }

  return warnings;
}

/**
 * Aplica regras específicas quando o tipo de transição é MONOLÍTICO
 * TRANSIÇÃO:
 * - Cortina Altura = Espessura Laje (bloqueado)
 * - Aparelho de Apoio = Nenhum (bloqueado)
 * - Deslocamento Esquerdo Encontro Laje = vazio/null (bloqueado)
 * - Deslocamento Direito Encontro Laje = vazio/null (bloqueado)
 * SUPERESTRUTURA:
 * - Tipo Superestrutura = ENGASTADA (bloqueado)
 * - Qtd Longarinas = 0 (bloqueado)
 * - Qtd Transversinas = 0 (bloqueado)
 * - Tipo Transversina = Nenhum (bloqueado)
 * - Altura Longarina = vazio/null (bloqueado)
 * - Deslocamento Esquerdo = 1.0m (padrão, editável, min > 0)
 * - Deslocamento Direito = 1.0m (padrão, editável, min > 0)
 */
function applyMonolithicTransitionRules() {
  const tipoEncontroField = document.getElementById("tipo-encontro");
  const cortinaAlturaField = document.getElementById("cortina-altura");
  const espessuraLajeField = document.getElementById("espessura-laje");
  const aparelhoApoioField = document.getElementById("tipo-aparelho-apoio");

  // Campos de superestrutura
  const tipoSuperestrutura = document.getElementById("tipo-superestrutura");
  const qtdLongarinas = document.getElementById("qtd-longarinas");
  const qtdTransversinas = document.getElementById("qtd-transversinas");
  const tipoTransversina = document.getElementById("tipo-transversina");
  const alturaLongarina = document.getElementById("altura-longarina");

  // Campos de deslocamento
  const deslocamentoEsquerdo = document.getElementById(
    "deslocamento-esquerdo-encontro-laje"
  );
  const deslocamentoDireito = document.getElementById(
    "deslocamento-direito-encontro-laje"
  );

  if (!tipoEncontroField) {
    return;
  }

  const isMonolithic = tipoEncontroField.value === "MONOLITICO";

  // Verificar quantidade de tramos
  const qtdTramosField = document.getElementById("qtd-tramos");
  const qtdTramos = parseInt(qtdTramosField?.value) || 1;
  const isUmTramo = qtdTramos === 1;

  if (isMonolithic) {
    // ========== REGRAS DE TRANSIÇÃO ==========
    if (cortinaAlturaField && espessuraLajeField) {
      const espessuraLaje = parseFloat(espessuraLajeField.value) || 0;
      cortinaAlturaField.value = espessuraLaje.toFixed(2);
      cortinaAlturaField.disabled = true;
      cortinaAlturaField.style.backgroundColor = "#f0f0f0";
      cortinaAlturaField.style.cursor = "not-allowed";
      addMonolithicNote(
        cortinaAlturaField,
        "🔒 Automático: igual à espessura da laje"
      );
    }

    // APARELHO DE APOIO: Bloquear apenas se for 1 tramo
    if (aparelhoApoioField) {
      if (isUmTramo) {
        aparelhoApoioField.value = "Nenhum";
        aparelhoApoioField.disabled = true;
        aparelhoApoioField.style.backgroundColor = "#f0f0f0";
        aparelhoApoioField.style.cursor = "not-allowed";
        addMonolithicNote(
          aparelhoApoioField,
          "🔒 Bloqueado: ponte de 1 tramo não tem aparelho de apoio"
        );
      } else {
        // Mais de 1 tramo: liberar o campo
        aparelhoApoioField.disabled = false;
        aparelhoApoioField.style.backgroundColor = "";
        aparelhoApoioField.style.cursor = "";
        removeMonolithicNote(aparelhoApoioField);
      }
    }

    // ========== REGRAS DE SUPERESTRUTURA ==========
    if (tipoSuperestrutura) {
      tipoSuperestrutura.value = "ENGASTADA";
      tipoSuperestrutura.disabled = true;
      tipoSuperestrutura.style.backgroundColor = "#f0f0f0";
      tipoSuperestrutura.style.cursor = "not-allowed";
      addMonolithicNote(
        tipoSuperestrutura,
        "🔒 Ponte monolítica: sempre engastada"
      );
    }

    if (qtdLongarinas) {
      qtdLongarinas.value = "0";
      qtdLongarinas.disabled = true;
      qtdLongarinas.style.backgroundColor = "#f0f0f0";
      qtdLongarinas.style.cursor = "not-allowed";
      addMonolithicNote(qtdLongarinas, "🔒 Ponte monolítica: sem longarinas");
    }

    if (qtdTransversinas) {
      qtdTransversinas.value = "0";
      qtdTransversinas.disabled = true;
      qtdTransversinas.style.backgroundColor = "#f0f0f0";
      qtdTransversinas.style.cursor = "not-allowed";
      addMonolithicNote(
        qtdTransversinas,
        "🔒 Ponte monolítica: sem transversinas"
      );
    }

    if (tipoTransversina) {
      tipoTransversina.value = "Nenhum";
      tipoTransversina.disabled = true;
      tipoTransversina.style.backgroundColor = "#f0f0f0";
      tipoTransversina.style.cursor = "not-allowed";
      addMonolithicNote(
        tipoTransversina,
        "🔒 Ponte monolítica: sem transversinas"
      );
    }

    if (alturaLongarina) {
      alturaLongarina.value = "";
      alturaLongarina.disabled = true;
      alturaLongarina.style.backgroundColor = "#f0f0f0";
      alturaLongarina.style.cursor = "not-allowed";
      addMonolithicNote(alturaLongarina, "🔒 Ponte monolítica: sem longarinas");
    }

    // ========== REGRAS DE DESLOCAMENTO ENCONTRO LAJE (TRANSIÇÃO) ==========
    // Deslocamentos do encontro laje devem ser bloqueados e nulos
    if (deslocamentoEsquerdo) {
      deslocamentoEsquerdo.value = "";
      deslocamentoEsquerdo.disabled = true;
      deslocamentoEsquerdo.style.backgroundColor = "#f0f0f0";
      deslocamentoEsquerdo.style.cursor = "not-allowed";
      addMonolithicNote(
        deslocamentoEsquerdo,
        "🔒 Ponte monolítica: sem deslocamento no encontro"
      );
    }

    if (deslocamentoDireito) {
      deslocamentoDireito.value = "";
      deslocamentoDireito.disabled = true;
      deslocamentoDireito.style.backgroundColor = "#f0f0f0";
      deslocamentoDireito.style.cursor = "not-allowed";
      addMonolithicNote(
        deslocamentoDireito,
        "🔒 Ponte monolítica: sem deslocamento no encontro"
      );
    }

    // ========== REGRAS DE DESLOCAMENTO SUPERESTRUTURA ==========
    // Deslocamentos da superestrutura devem ser 1.0m (editáveis, nunca zero)
    const deslocamentoEsquerdoSuper = document.getElementById(
      "deslocamento-esquerdo"
    );
    const deslocamentoDireitoSuper = document.getElementById(
      "deslocamento-direito"
    );

    if (deslocamentoEsquerdoSuper) {
      if (
        !deslocamentoEsquerdoSuper.value ||
        parseFloat(deslocamentoEsquerdoSuper.value) === 0
      ) {
        deslocamentoEsquerdoSuper.value = "1.00";
      }
      deslocamentoEsquerdoSuper.min = "0.01"; // Nunca pode ser 0
      addMonolithicNote(
        deslocamentoEsquerdoSuper,
        "ℹ️ Padrão: 1.0m (não pode ser zero)"
      );
    }

    if (deslocamentoDireitoSuper) {
      if (
        !deslocamentoDireitoSuper.value ||
        parseFloat(deslocamentoDireitoSuper.value) === 0
      ) {
        deslocamentoDireitoSuper.value = "1.00";
      }
      deslocamentoDireitoSuper.min = "0.01"; // Nunca pode ser 0
      addMonolithicNote(
        deslocamentoDireitoSuper,
        "ℹ️ Padrão: 1.0m (não pode ser zero)"
      );
    }
  } else {
    // ========== DESBLOQUEAR TODOS OS CAMPOS ==========
    const deslocamentoEsquerdoSuper = document.getElementById(
      "deslocamento-esquerdo"
    );
    const deslocamentoDireitoSuper = document.getElementById(
      "deslocamento-direito"
    );

    const fieldsToUnlock = [
      cortinaAlturaField,
      aparelhoApoioField,
      tipoSuperestrutura,
      qtdLongarinas,
      qtdTransversinas,
      tipoTransversina,
      alturaLongarina,
      deslocamentoEsquerdo,
      deslocamentoDireito,
    ];

    fieldsToUnlock.forEach((field) => {
      if (field) {
        field.disabled = false;
        field.style.backgroundColor = "";
        field.style.cursor = "";
        removeMonolithicNote(field);
      }
    });

    // Remover notas e restrições dos deslocamentos da superestrutura
    if (deslocamentoEsquerdoSuper) {
      deslocamentoEsquerdoSuper.min = "0";
      removeMonolithicNote(deslocamentoEsquerdoSuper);
    }
    if (deslocamentoDireitoSuper) {
      deslocamentoDireitoSuper.min = "0";
      removeMonolithicNote(deslocamentoDireitoSuper);
    }
  }
}

/**
 * Adiciona nota visual informativa abaixo do campo
 */
function addMonolithicNote(field, message) {
  const parentGroup = field.closest(".form-group");
  if (!parentGroup) return;

  // Remove nota existente se houver
  const existingNote = parentGroup.querySelector(".monolithic-note");
  if (existingNote) {
    existingNote.remove();
  }

  // Cria nova nota
  const note = document.createElement("div");
  note.className = "monolithic-note";
  note.style.cssText = `
    margin-top: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    border-left: 4px solid #f39c12;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: #856404;
    font-weight: 500;
  `;
  note.textContent = message;
  parentGroup.appendChild(note);
}

/**
 * Remove nota visual do campo
 */
function removeMonolithicNote(field) {
  const parentGroup = field.closest(".form-group");
  if (!parentGroup) return;

  const existingNote = parentGroup.querySelector(".monolithic-note");
  if (existingNote) {
    existingNote.remove();
  }
}

/**
 * Inicializa listeners para regras de transição monolítica
 */
function initMonolithicTransitionListeners() {
  const tipoEncontroField = document.getElementById("tipo-encontro");
  const espessuraLajeField = document.getElementById("espessura-laje");
  const qtdTramosField = document.getElementById("qtd-tramos");

  if (tipoEncontroField) {
    tipoEncontroField.addEventListener(
      "change",
      applyMonolithicTransitionRules
    );
  }

  if (espessuraLajeField) {
    // Quando espessura da laje mudar, atualizar cortina se for MONOLÍTICO
    espessuraLajeField.addEventListener("input", function () {
      const tipoEncontro = document.getElementById("tipo-encontro");
      if (tipoEncontro && tipoEncontro.value === "MONOLITICO") {
        applyMonolithicTransitionRules();
      }
    });
  }

  if (qtdTramosField) {
    // Quando quantidade de tramos mudar, reaplicar regras (afeta aparelho de apoio)
    qtdTramosField.addEventListener("change", function () {
      const tipoEncontro = document.getElementById("tipo-encontro");
      if (tipoEncontro && tipoEncontro.value === "MONOLITICO") {
        applyMonolithicTransitionRules();
      }
    });
  }

  // Aplicar regras ao carregar a página (caso já tenha dados)
  applyMonolithicTransitionRules();
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
window.validateSuperstructureType = validateSuperstructureType;
window.checkBeamReinforcementAllowed = checkBeamReinforcementAllowed;
window.validateAlturaLongarinaComApoioTransicao =
  validateAlturaLongarinaComApoioTransicao;
window.validateForm = validateForm;
window.togglePillarBracingQuantityField = togglePillarBracingQuantityField;
window.checkLongarinaHeightWarning = checkLongarinaHeightWarning;
window.checkCortinaHeightWarning = checkCortinaHeightWarning;
window.getWarnings = getWarnings;
window.applyMonolithicTransitionRules = applyMonolithicTransitionRules;
window.initMonolithicTransitionListeners = initMonolithicTransitionListeners;
