/* ===== CAMPOS DINÂMICOS ===== */

// Gerar campos de tramos
function generateTramosFields() {
  let qtdTramos = parseInt(document.getElementById("qtd-tramos").value) || 1;
  
  // Garantir mínimo de 1 tramo
  if (qtdTramos < 1) {
    qtdTramos = 1;
    document.getElementById("qtd-tramos").value = 1;
  }
  
  const container = document.getElementById("tramos-fields");
  
  if (!container) return;

  container.innerHTML = "";

  for (let i = 1; i <= qtdTramos; i++) {
    const fieldDiv = document.createElement("div");
    fieldDiv.className = "form-group";

    const label = document.createElement("label");
    label.textContent = `Tramo ${i} (m):`;

    const input = document.createElement("input");
    input.type = "number";
    input.className = "tramo-field";
    input.name = `tramo-${i}`;
    input.min = "0.5";
    input.step = "0.01";
    input.placeholder = "0.50";
    input.value = "0.50";
    input.required = true;

    fieldDiv.appendChild(label);
    fieldDiv.appendChild(input);
    container.appendChild(fieldDiv);
  }

  // Atualizar quantidade de apoios (qtdTramos - 1, mínimo 0)
  // Regra: Apoios = Tramos - 1 (se tramos > 1, senão 0)
  const qtdApoios = qtdTramos > 1 ? qtdTramos - 1 : 0;
  const qtdApoiosField = document.getElementById("qtd-apoios");
  if (qtdApoiosField) {
    qtdApoiosField.value = qtdApoios;
    generateApoiosFields();
  }
}

// Gerar campos de apoios
function generateApoiosFields() {
  const qtdApoios = parseInt(document.getElementById("qtd-apoios").value) || 0;
  const container = document.getElementById("apoios-fields");

  if (!container) return;

  container.innerHTML = "";

  if (qtdApoios === 0) {
    return;
  }

  for (let i = 1; i <= qtdApoios; i++) {
    const apoioRow = document.createElement("div");
    apoioRow.className = "apoio-row";

    apoioRow.innerHTML = `
      <div class="apoio-label">Apoio ${i}</div>
      <div class="apoio-field-wrapper">
        <input type="number" class="apoio-altura-field" name="apoio-altura-${i}" 
               step="0.01" min="0" placeholder="0.00" required />
      </div>
      <div class="apoio-field-wrapper">
        <input type="number" class="apoio-comp-field" name="apoio-comp-${i}" 
               step="0.01" min="0" placeholder="0.00" required />
      </div>
      <div class="apoio-field-wrapper">
        <input type="number" class="apoio-larg-field" name="apoio-larg-${i}" 
               step="0.01" min="0" placeholder="0.00" required />
      </div>
    `;

    container.appendChild(apoioRow);
  }
}

// Validar comprimento dos tramos
function validateTramosLength() {
  const comprimentoTotal = parseFloat(document.getElementById("comprimento").value) || 0;
  const tramosFields = document.querySelectorAll(".tramo-field");
  
  let somaTramos = 0;
  tramosFields.forEach((field) => {
    somaTramos += parseFloat(field.value) || 0;
  });

  const diferenca = Math.abs(somaTramos - comprimentoTotal);

  if (diferenca > 0.01) {
    alert(`Atenção: A soma dos tramos (${somaTramos.toFixed(2)}m) difere do comprimento total (${comprimentoTotal.toFixed(2)}m)`);
    return false;
  }

  return true;
}

// Validar alturas
function validateHeights() {
  const alturaTotal = parseFloat(document.getElementById("altura").value) || 0;
  const alturaLongarina = parseFloat(document.getElementById("altura-longarina").value) || 0;
  
  const apoiosFields = document.querySelectorAll(".apoio-altura-field");
  let maiorApoio = 0;

  apoiosFields.forEach((field) => {
    const valor = parseFloat(field.value) || 0;
    if (valor > maiorApoio) {
      maiorApoio = valor;
    }
  });

  const somaAlturas = alturaLongarina + maiorApoio;
  const diferenca = Math.abs(somaAlturas - alturaTotal);

  if (diferenca > 0.01 && alturaLongarina > 0 && maiorApoio > 0) {
    alert(
      `Atenção: Altura longarina (${alturaLongarina.toFixed(2)}m) + maior apoio (${maiorApoio.toFixed(2)}m) = ${somaAlturas.toFixed(2)}m difere da altura total (${alturaTotal.toFixed(2)}m)`
    );
    return false;
  }

  return true;
}

// Validar deslocamentos
function validateDisplacements() {
  const larguraTotal = parseFloat(document.getElementById("largura").value) || 0;
  const deslocEsq = parseFloat(document.getElementById("desloc-esquerdo").value) || 0;
  const deslocDir = parseFloat(document.getElementById("desloc-direito").value) || 0;

  const somaDeslocamentos = deslocEsq + deslocDir;

  if (somaDeslocamentos > larguraTotal) {
    alert(
      `Atenção: A soma dos deslocamentos (${somaDeslocamentos.toFixed(2)}m) é maior que a largura total (${larguraTotal.toFixed(2)}m)`
    );
    return false;
  }

  return true;
}

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  const qtdTramosField = document.getElementById("qtd-tramos");
  if (qtdTramosField) {
    qtdTramosField.addEventListener("change", generateTramosFields);
    qtdTramosField.addEventListener("input", function () {
      this.value = Math.floor(this.value);
    });
  }

  const qtdApoiosField = document.getElementById("qtd-apoios");
  if (qtdApoiosField) {
    qtdApoiosField.addEventListener("change", generateApoiosFields);
  }

  // Gerar campos iniciais
  generateTramosFields();
});

// Expor funções globalmente
window.generateTramosFields = generateTramosFields;
window.generateApoiosFields = generateApoiosFields;
window.validateTramosLength = validateTramosLength;
window.validateHeights = validateHeights;
window.validateDisplacements = validateDisplacements;
