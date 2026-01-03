/* ===== GERENCIAMENTO DE MODAIS ===== */

// Fechar modal genérico
function closeModal() {
  const modal = document.getElementById("add-field-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Fechar modal de importação
function closeImportModal() {
  const modal = document.getElementById("import-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Fechar modal de resumo
function closeSummaryModal() {
  const modal = document.getElementById("summary-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Mostrar resumo antes de salvar
function showSummaryBeforeSave() {
  // console.log("=== ABRINDO MODAL DE RESUMO ===");
  const { isValid, missingFields } = validateForm();
  const warnings = typeof getWarnings === "function" ? getWarnings() : [];
  const summaryContent = document.getElementById("summary-content");
  const missingFieldsContainer = document.getElementById(
    "missing-fields-container"
  );
  const missingFieldsList = document.getElementById("missing-fields-list");
  const confirmSaveBtn = document.getElementById("confirm-save-btn");

  if (summaryContent) summaryContent.innerHTML = "";
  if (missingFieldsList) missingFieldsList.innerHTML = "";

  // Container de avisos (antes do resumo)
  let warningsHTML = "";
  if (warnings.length > 0) {
    warningsHTML = '<div id="warnings-container" style="margin-bottom: 20px;">';
    warningsHTML +=
      '<h3 style="color: #d35400; font-weight: bold; margin-bottom: 10px; font-size: 1.1rem;">⚠️ Avisos e Recomendações</h3>';

    warnings.forEach((warning) => {
      const bgColor = warning.type === "critical" ? "#fff5f5" : "#fffbf0";
      const borderColor = warning.type === "critical" ? "#c0392b" : "#d68910";
      const textColor = warning.type === "critical" ? "#5a1a1a" : "#6b4f0a";

      warningsHTML += `<div class="warning-message" style="
        background-color: ${bgColor};
        border-left: 5px solid ${borderColor};
        padding: 15px;
        margin: 10px 0;
        border-radius: 6px;
        color: ${textColor};
        font-size: 0.95rem;
        line-height: 1.6;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        ${warning.message}
      </div>`;
    });

    warningsHTML +=
      '<p style="color: #555; font-size: 0.9rem; margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 3px solid #95a5a6;"><em>💡 Estes são avisos informativos. Você pode salvar mesmo assim, mas recomendamos revisar os valores.</em></p>';
    warningsHTML += "</div>";
  }

  // SEMPRE mostrar o resumo
  const summaryHTML = warningsHTML + generateSummaryByTabs();
  if (summaryContent) summaryContent.innerHTML = summaryHTML;

  if (!isValid) {
    console.error("❌ FORMULÁRIO INVÁLIDO - Botão de salvar será DESABILITADO");

    if (missingFieldsContainer) missingFieldsContainer.style.display = "block";

    // DESABILITAR o botão ao invés de esconder
    if (confirmSaveBtn) {
      confirmSaveBtn.disabled = true;
      confirmSaveBtn.style.opacity = "0.5";
      confirmSaveBtn.style.cursor = "not-allowed";
      confirmSaveBtn.title = "Corrija os erros antes de salvar";
      confirmSaveBtn.textContent = "❌ Corrija os Erros Primeiro";
    }

    missingFields.forEach((field) => {
      const li = document.createElement("li");
      li.className = "missing-field";
      li.style.cssText =
        "color: #721c24; background: #f8d7da; padding: 8px; margin: 5px 0; border-radius: 4px; border-left: 4px solid #c82333;";

      // Se for erro de altura, adicionar botão da calculadora
      if (field.includes("Altura deve ser") && field.includes("Calculadora")) {
        const textNode = document.createTextNode(
          field.replace(" - Use a Calculadora 🧮", "")
        );
        li.appendChild(textNode);

        const calcButton = document.createElement("button");
        calcButton.type = "button";
        calcButton.textContent = "🧮 Abrir Calculadora";
        calcButton.style.cssText =
          "margin-left: 10px; background: #3498db; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;";
        calcButton.onclick = function () {
          closeSummaryModal();
          if (typeof showHeightCalculator === "function") {
            showHeightCalculator();
          }
        };
        li.appendChild(calcButton);
      } else {
        li.textContent = field;
      }

      if (missingFieldsList) missingFieldsList.appendChild(li);
    });
  } else {
    // console.log("✅ FORMULÁRIO VÁLIDO - Botão de salvar HABILITADO");

    if (missingFieldsContainer) missingFieldsContainer.style.display = "none";

    // HABILITAR o botão (mesmo com avisos, pois avisos não bloqueiam)
    if (confirmSaveBtn) {
      confirmSaveBtn.disabled = false;
      confirmSaveBtn.style.opacity = "1";
      confirmSaveBtn.style.cursor = "pointer";
      confirmSaveBtn.title = "";

      // Mudar texto do botão se houver avisos
      if (warnings.length > 0) {
        confirmSaveBtn.textContent = "✅ Salvar Mesmo Assim";
      } else {
        confirmSaveBtn.textContent = "✅ Confirmar e Salvar";
      }
    }
  }

  const modal = document.getElementById("summary-modal");
  if (modal) modal.style.display = "block";
}

// Mostrar alerta customizado
function showCustomAlert(message) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "block";

  modal.innerHTML = `
    <div class="modal-content" style="width: 400px;">
      <p>${message}</p>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <button onclick="this.closest('.modal').remove();">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// Gerar resumo organizado por abas
function generateSummaryByTabs() {
  // Verificar se é obra MONOLÍTICA
  const tipoEncontroField = document.getElementById("tipo-encontro");
  const isMonolithic =
    tipoEncontroField && tipoEncontroField.value === "MONOLITICO";

  // Verificar quantidade de tramos
  const qtdTramosField = document.getElementById("qtd-tramos");
  const qtdTramos = parseInt(qtdTramosField?.value) || 1;
  const isUmTramo = qtdTramos === 1;

  // Lista de campos obrigatórios (campos com class="required" no HTML)
  let requiredFields = [
    "LOTE",
    "CODIGO",
    "COMPRIMENTO",
    "LARGURA",
    "ALTURA",
    "QTD TRAMOS",
    "CORTINA ALTURA",
    "ALTURA LONGARINA",
    "DESLOCAMENTO ESQUERDO",
    "DESLOCAMENTO DIREITO",
    "QTD LONGARINAS",
    "ESPESSURA LONGARINA",
    "ESPESSURA LAJE",
    "QTD PILARES",
    "TIPO PAVIMENTO",
  ];

  // Se for MONOLÍTICO, remover campos que devem estar vazios/zerados
  if (isMonolithic) {
    requiredFields = requiredFields.filter(
      (field) =>
        field !== "ALTURA LONGARINA" &&
        field !== "QTD LONGARINAS" &&
        field !== "ESPESSURA LONGARINA" &&
        field !== "QTD PILARES"
    );
  }

  const tabs = [
    {
      id: "info",
      title: "INFORMAÇÕES",
      fields: [
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
      ],
    },
    {
      id: "configuracao",
      title: "CONFIGURAÇÕES",
      fields: [
        "COMPRIMENTO",
        "LARGURA",
        "ALTURA",
        "QTD TRAMOS",
        "COMPRIMENTO TRAMOS",
      ],
    },
    {
      id: "transicao",
      title: "TRANSIÇÃO",
      fields: [
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
      ],
    },
    {
      id: "superestrutura",
      title: "SUPERESTRUTURA",
      fields: [
        "ALTURA LONGARINA",
        "DESLOCAMENTO ESQUERDO",
        "DESLOCAMENTO DIREITO",
        "QTD LONGARINAS",
        "QTD TRANSVERSINAS",
        "ESPESSURA LONGARINA",
        "ESPESSURA TRANSVERSINA",
        "ESPESSURA LAJE",
        "REFORCO VIGA",
        "TIPO DE TRANSVERSINA",
      ],
    },
    {
      id: "apoio",
      title: "APOIO",
      fields: [
        "QTD PILARES",
        "PILAR DESCENTRALIZADO",
        "TIPO APARELHO APOIO",
        "ALTURA APOIO",
        "LARGURA PILAR",
        "COMPRIMENTO PILARES",
        "TIPO TRAVESSA",
        "ALTURA TRAVESSA",
        "TIPO ENCAMISAMENTO",
        "TIPO BLOCO SAPATA",
        "ALTURA BLOCO SAPATA",
        "LARGURA BLOCO SAPATA",
        "COMPRIMENTO BLOCO SAPATA",
        "TIPO CONTRAVENTAMENTO PILAR",
        "TIPO LIGACAO FUNDACOES",
      ],
    },
    {
      id: "complementares",
      title: "COMPLEMENTARES",
      fields: [
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
      ],
    },
  ];

  const form = document.getElementById("oae-form");
  const formData = new FormData(form);

  // Criar mapa de valores do formulário
  const formValues = {};
  for (let [key, value] of formData.entries()) {
    if (!key.startsWith("tramo-") && !key.startsWith("apoio-")) {
      formValues[key] = value;
    }
  }

  // Adicionar checkboxes
  formValues["MODELADO"] = document.getElementById("modelado")?.checked
    ? "Sim"
    : "Não";
  formValues["GPS"] = document.getElementById("gps")?.checked ? "Sim" : "Não";
  formValues["REFORCO VIGA"] = document.getElementById("beam-reinforcement")
    ?.checked
    ? "Sim"
    : "Não";

  // Se for MONOLÍTICO e CORTINA ALTURA estiver vazia, preencher com ESPESSURA LAJE
  if (isMonolithic) {
    const cortinaAlturaValue = formValues["CORTINA ALTURA"];
    const espessuraLajeValue = formValues["ESPESSURA LAJE"];

    if (!cortinaAlturaValue && espessuraLajeValue) {
      formValues["CORTINA ALTURA"] = espessuraLajeValue;
    }
  }

  // Adicionar tramos
  const tramosFields = document.querySelectorAll(".tramo-field");
  if (tramosFields.length > 0) {
    const tramosValues = Array.from(tramosFields)
      .map((f) => f.value || "0.50")
      .join("; ");
    formValues["COMPRIMENTO TRAMOS"] = tramosValues;
  }

  // Adicionar apoios
  const apoiosAlturaFields = document.querySelectorAll(".apoio-altura-field");
  const apoiosLargFields = document.querySelectorAll(".apoio-larg-field");
  const apoiosCompFields = document.querySelectorAll(".apoio-comp-field");

  if (apoiosAlturaFields.length > 0) {
    formValues["ALTURA APOIO"] = Array.from(apoiosAlturaFields)
      .map((f) => f.value || "0.00")
      .join("; ");
    formValues["LARGURA PILAR"] = Array.from(apoiosLargFields)
      .map((f) => f.value || "0.00")
      .join("; ");
    formValues["COMPRIMENTO PILARES"] = Array.from(apoiosCompFields)
      .map((f) => f.value || "0.00")
      .join("; ");
  }

  // // Debug: Log dos valores dos campos de bloco sapata
  // console.log("=== DEBUG MODAL - Campos de Bloco Sapata ===");
  // console.log("TIPO BLOCO SAPATA:", formValues['TIPO BLOCO SAPATA']);
  // console.log("ALTURA BLOCO SAPATA:", formValues['ALTURA BLOCO SAPATA']);
  // console.log("LARGURA BLOCO SAPATA:", formValues['LARGURA BLOCO SAPATA']);
  // console.log("COMPRIMENTO BLOCO SAPATA:", formValues['COMPRIMENTO BLOCO SAPATA']);
  // console.log("Todos os formValues:", formValues);

  let summaryHTML = '<div class="summary-tabs-container">';

  tabs.forEach((tab) => {
    // Contar campos preenchidos e vazios
    let filledCount = 0;
    let emptyCount = 0;

    tab.fields.forEach((field) => {
      const value = formValues[field];
      if (value !== undefined && value !== null && value !== "") {
        filledCount++;
      } else {
        emptyCount++;
      }
    });

    const totalFields = tab.fields.length;
    const percentage = Math.round((filledCount / totalFields) * 100);

    summaryHTML += `<div class="summary-tab-section">`;
    summaryHTML += `<h3 class="summary-tab-title">
      ${tab.title} 
      <span style="font-size: 0.85rem; font-weight: normal; color: #95a5a6;">
        (${filledCount}/${totalFields} preenchidos - ${percentage}%)
      </span>
    </h3>`;
    summaryHTML += `<div class="summary-fields">`;

    tab.fields.forEach((field) => {
      const value = formValues[field];
      const isEmpty = value === undefined || value === null || value === "";
      const isRequired = requiredFields.includes(field);

      // Definir classe e mensagem com base se é obrigatório ou não
      let rowClass = "summary-row";
      let displayValue = value;

      if (isEmpty) {
        // Se for MONOLÍTICO e campo relacionado a longarinas/pilares, mostrar como "N/A"
        // TIPO APARELHO APOIO: só marcar como N/A se for 1 tramo
        const isAparelhoApoioNA = field === "TIPO APARELHO APOIO" && isUmTramo;

        if (
          isMonolithic &&
          (field === "ALTURA LONGARINA" ||
            field === "QTD LONGARINAS" ||
            field === "ESPESSURA LONGARINA" ||
            field === "QTD TRANSVERSINAS" ||
            field === "TIPO DE TRANSVERSINA" ||
            field === "ESPESSURA TRANSVERSINA" ||
            field === "QTD PILARES" ||
            isAparelhoApoioNA)
        ) {
          rowClass = "summary-row";
          displayValue =
            '<span style="color: #95a5a6; font-style: italic;">🔒 N/A (Monolítico)</span>';
        } else if (isRequired) {
          // Campo obrigatório vazio - VERMELHO (erro)
          rowClass = "summary-row summary-row-empty";
          displayValue =
            '<span style="color: #e74c3c; font-style: italic;">⚠️ Obrigatório - Não preenchido</span>';
        } else {
          // Campo não obrigatório vazio - LARANJA (lembrete)
          rowClass = "summary-row summary-row-optional-empty";
          displayValue =
            '<span style="color: #f39c12; font-style: italic;">💡 Não preenchido (opcional)</span>';
        }
      } else if (
        isMonolithic &&
        value === "0" &&
        (field === "QTD LONGARINAS" ||
          field === "QTD TRANSVERSINAS" ||
          field === "QTD PILARES")
      ) {
        // Se for MONOLÍTICO e valor for 0 para esses campos, mostrar como "N/A"
        displayValue =
          '<span style="color: #95a5a6; font-style: italic;">🔒 N/A (Monolítico)</span>';
      }

      summaryHTML += `<div class="${rowClass}">
        <div class="summary-label">${field}:</div>
        <div class="summary-value">${displayValue}</div>
      </div>`;
    });

    summaryHTML += `</div></div>`;
  });

  summaryHTML += "</div>";
  return summaryHTML;
}

// Função para fechar modal com tecla ESC
function handleEscapeKey(event) {
  if (event.key === "Escape" || event.key === "Esc") {
    // Lista de modais em ordem de prioridade (último aberto fecha primeiro)
    const modals = [
      { id: "height-calculator-modal", closeFunc: "closeHeightCalculator" },
      { id: "ponte-details-modal", closeFunc: "closePonteDetailsModal" },
      { id: "search-pontes-modal", closeFunc: "closeSearchPontesModal" },
      { id: "summary-modal", closeFunc: "closeSummaryModal" },
      { id: "import-modal", closeFunc: "closeImportModal" },
      { id: "add-field-modal", closeFunc: "closeModal" },
    ];

    // Procurar o primeiro modal visível e fechá-lo
    for (const modal of modals) {
      const element = document.getElementById(modal.id);
      if (
        element &&
        (element.style.display === "block" ||
          window.getComputedStyle(element).display === "block")
      ) {
        // Chamar a função de fechamento correspondente se existir
        if (typeof window[modal.closeFunc] === "function") {
          window[modal.closeFunc]();
          event.preventDefault();
          break;
        }
      }
    }
  }
}

// Adicionar listener para tecla ESC quando o documento estiver pronto
document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("keydown", handleEscapeKey);
});

// Se o documento já estiver carregado, adicionar o listener imediatamente
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("keydown", handleEscapeKey);
  });
} else {
  document.addEventListener("keydown", handleEscapeKey);
}

// Expor funções globalmente
window.closeModal = closeModal;
window.closeImportModal = closeImportModal;
window.closeSummaryModal = closeSummaryModal;
window.showSummaryBeforeSave = showSummaryBeforeSave;
window.showCustomAlert = showCustomAlert;
window.generateSummaryByTabs = generateSummaryByTabs;
