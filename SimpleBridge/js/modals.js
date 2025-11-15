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
  const { isValid, missingFields } = validateForm();
  const summaryContent = document.getElementById("summary-content");
  const missingFieldsContainer = document.getElementById("missing-fields-container");
  const missingFieldsList = document.getElementById("missing-fields-list");
  const confirmSaveBtn = document.getElementById("confirm-save-btn");

  if (summaryContent) summaryContent.innerHTML = "";
  if (missingFieldsList) missingFieldsList.innerHTML = "";

  if (!isValid) {
    if (missingFieldsContainer) missingFieldsContainer.style.display = "block";
    if (confirmSaveBtn) confirmSaveBtn.style.display = "none";

    missingFields.forEach((field) => {
      const li = document.createElement("li");
      li.className = "missing-field";
      
      // Se for erro de altura, adicionar botão da calculadora
      if (field.includes("Altura deve ser") && field.includes("Calculadora")) {
        const textNode = document.createTextNode(field.replace(" - Use a Calculadora 🧮", ""));
        li.appendChild(textNode);
        
        const calcButton = document.createElement("button");
        calcButton.type = "button";
        calcButton.textContent = "🧮 Abrir Calculadora";
        calcButton.style.cssText = "margin-left: 10px; background: #3498db; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;";
        calcButton.onclick = function() {
          closeSummaryModal();
          if (typeof showHeightCalculator === 'function') {
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
    if (missingFieldsContainer) missingFieldsContainer.style.display = "none";
    if (confirmSaveBtn) confirmSaveBtn.style.display = "inline-block";

    // Gerar resumo
    const form = document.getElementById("oae-form");
    const formData = new FormData(form);
    let summaryHTML = "<h3>Resumo dos Dados</h3>";

    for (let [key, value] of formData.entries()) {
      if (value && !key.startsWith("tramo-") && !key.startsWith("apoio-")) {
        summaryHTML += `<div class="summary-row">
          <div class="summary-label">${key}:</div>
          <div class="summary-value">${value}</div>
        </div>`;
      }
    }

    if (summaryContent) summaryContent.innerHTML = summaryHTML;
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

// Expor funções globalmente
window.closeModal = closeModal;
window.closeImportModal = closeImportModal;
window.closeSummaryModal = closeSummaryModal;
window.showSummaryBeforeSave = showSummaryBeforeSave;
window.showCustomAlert = showCustomAlert;
