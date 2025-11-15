/* ===== CALCULADORA DE ALTURA ===== */

// Função para mostrar a calculadora de alturas
function showHeightCalculator() {
  // Obter valores atuais
  const alturaTotal = parseFloat(document.getElementById("altura").value) || 0;
  const alturaLongarina = parseFloat(document.getElementById("altura-longarina").value) || 0;
  
  // Criar o modal da calculadora
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "height-calculator-modal";
  
  // HTML da calculadora
  modal.innerHTML = `
    <div class="modal-content" style="width: 500px;">
      <span class="close-modal" onclick="closeHeightCalculator()">&times;</span>
      <h3>Calculadora de Alturas</h3>
      
      <div class="calc-row" style="margin-bottom: 15px;">
        <label style="width: 150px; display: inline-block;">Altura Total:</label>
        <input type="number" id="calc-altura-total" value="${alturaTotal}" step="0.01" min="0" style="width: 100px;">
      </div>
      
      <div class="calc-row" style="margin-bottom: 15px;">
        <label style="width: 150px; display: inline-block;">Altura Longarina:</label>
        <input type="number" id="calc-altura-longarina" value="${alturaLongarina}" step="0.01" min="0" style="width: 100px;">
      </div>
      
      <hr style="margin: 15px 0;">
      
      <div id="calc-apoios-container">
        <!-- Campos de apoios serão inseridos aqui dinamicamente -->
      </div>
      
      <div class="actions" style="margin-top: 20px;">
        <button type="button" onclick="applyHeightCalculation()">Aplicar Valores</button>
        <button type="button" onclick="closeHeightCalculator()">Cancelar</button>
      </div>
    </div>
  `;
  
  // Adicionar ao documento
  document.body.appendChild(modal);
  
  // Exibir o modal
  modal.style.display = "block";
  
  // Preencher campos de apoios
  populateApoiosCalculator();
  
  // Adicionar evento para recalcular ao mudar valores
  document.getElementById("calc-altura-total").addEventListener("input", updateHeightCalculations);
  document.getElementById("calc-altura-longarina").addEventListener("input", updateHeightCalculations);
}

// Preencher campos de apoios na calculadora
function populateApoiosCalculator() {
  const container = document.getElementById("calc-apoios-container");
  const apoioAlturaFields = document.querySelectorAll(".apoio-altura-field");
  
  container.innerHTML = "";
  
  apoioAlturaFields.forEach((field, index) => {
    const valor = parseFloat(field.value) || 0;
    const div = document.createElement("div");
    div.className = "calc-row";
    div.style.marginBottom = "10px";
    
    div.innerHTML = `
      <label style="width: 150px; display: inline-block;">ALTURA APOIO ${index+1}:</label>
      <input type="number" class="calc-apoio-altura" data-index="${index}" value="${valor}" step="0.01" min="0" style="width: 100px;">
      <span class="calc-resultado" style="margin-left: 15px; font-weight: bold;"></span>
    `;
    
    container.appendChild(div);
    
    // Adicionar evento para recalcular ao mudar valor
    div.querySelector("input").addEventListener("input", updateHeightCalculations);
  });
  
  updateHeightCalculations();
}

// Atualizar cálculos na calculadora
function updateHeightCalculations() {
  const alturaTotal = parseFloat(document.getElementById("calc-altura-total").value) || 0;
  const alturaLongarina = parseFloat(document.getElementById("calc-altura-longarina").value) || 0;
  
  const apoioInputs = document.querySelectorAll(".calc-apoio-altura");
  let anyMatch = false;
  
  apoioInputs.forEach((input, index) => {
    const apoioAltura = parseFloat(input.value) || 0;
    const soma = alturaLongarina + apoioAltura;
    const resultado = input.parentNode.querySelector(".calc-resultado");
    
    // Tolerância de 1cm para comparação
    const tolerancia = 0.01;
    const match = Math.abs(soma - alturaTotal) <= tolerancia;
    
    resultado.textContent = `Soma: ${soma.toFixed(2)}m ${match ? '✓' : ''}`;
    resultado.style.color = match ? "#27ae60" : (soma > alturaTotal ? "#e74c3c" : "#3498db");
    
    if (match) anyMatch = true;
  });
  
  // Destacar se pelo menos um apoio satisfaz a condição
  const modalContent = document.querySelector("#height-calculator-modal .modal-content");
  if (modalContent) {
    if (anyMatch) {
      modalContent.style.border = "2px solid #27ae60";
    } else {
      modalContent.style.border = "2px solid #e74c3c";
    }
  }
}

// Aplicar valores da calculadora
function applyHeightCalculation() {
  const alturaTotal = parseFloat(document.getElementById("calc-altura-total").value) || 0;
  const alturaLongarina = parseFloat(document.getElementById("calc-altura-longarina").value) || 0;
  
  // Atualizar campos no formulário principal
  document.getElementById("altura").value = alturaTotal;
  document.getElementById("altura-longarina").value = alturaLongarina;
  
  // Atualizar valores dos apoios
  const apoioInputs = document.querySelectorAll(".calc-apoio-altura");
  apoioInputs.forEach((input) => {
    const index = parseInt(input.getAttribute("data-index"));
    const valor = parseFloat(input.value) || 0;
    
    const apoioField = document.querySelectorAll(".apoio-altura-field")[index];
    if (apoioField) {
      apoioField.value = valor;
    }
  });
  
  // Fechar calculadora
  closeHeightCalculator();
  
  // Executar validação
  if (typeof validateMinimumHeight === 'function') {
    validateMinimumHeight();
  }
}

// Fechar calculadora
function closeHeightCalculator() {
  const modal = document.getElementById("height-calculator-modal");
  if (modal) {
    document.body.removeChild(modal);
  }
}

// Expor funções globalmente
window.showHeightCalculator = showHeightCalculator;
window.closeHeightCalculator = closeHeightCalculator;
window.applyHeightCalculation = applyHeightCalculation;
window.populateApoiosCalculator = populateApoiosCalculator;
window.updateHeightCalculations = updateHeightCalculations;
