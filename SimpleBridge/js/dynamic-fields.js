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
    
    // Adicionar validação em tempo real para os campos de apoio
    const alturaField = apoioRow.querySelector(".apoio-altura-field");
    const compField = apoioRow.querySelector(".apoio-comp-field");
    const largField = apoioRow.querySelector(".apoio-larg-field");
    
    [alturaField, compField, largField].forEach(field => {
      if (field) {
        field.addEventListener("blur", function() {
          if (typeof validateApoios === 'function') {
            validateApoios();
          }
        });
        field.addEventListener("input", function() {
          // Remove erro ao começar a digitar
          if (this.value.trim() !== "" && parseFloat(this.value) > 0) {
            this.classList.remove("error");
          }
        });
      }
    });
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

// Atualizar visualização dos campos obrigatórios de bloco sapata
function updateBlocoSapataFieldsRequired() {
  const tipoBlocoSapataField = document.getElementById("tipo-bloco-sapata");
  if (!tipoBlocoSapataField) return;

  const isBlocoSapataSelected = tipoBlocoSapataField.value !== "" && 
                                tipoBlocoSapataField.value !== "Nenhum";

  // Lista de campos que devem ser marcados como obrigatórios
  const fields = ["altura-bloco-sapata", "largura-bloco-sapata", "comprimento-bloco-sapata"];

  fields.forEach(fieldId => {
    const label = document.querySelector(`label[for="${fieldId}"]`);
    if (label) {
      if (isBlocoSapataSelected) {
        label.classList.add("required");
      } else {
        label.classList.remove("required");
      }
    }
  });
}

// Atualizar visualização dos campos obrigatórios de transversina
function updateTransversinaFieldsRequired() {
  const qtdTransversinasField = document.getElementById("qtd-transversinas");
  if (!qtdTransversinasField) return;

  const qtdTransversinas = parseInt(qtdTransversinasField.value) || 0;
  const hasTransversinas = qtdTransversinas > 0;

  // Atualizar tipo de transversina
  const tipoTransversinaLabel = document.querySelector('label[for="tipo-transversina"]');
  if (tipoTransversinaLabel) {
    if (hasTransversinas) {
      tipoTransversinaLabel.classList.add("required");
    } else {
      tipoTransversinaLabel.classList.remove("required");
    }
  }

  // Atualizar espessura de transversina
  const espessuraTransversinaLabel = document.querySelector('label[for="espessura-transversina"]');
  if (espessuraTransversinaLabel) {
    if (hasTransversinas) {
      espessuraTransversinaLabel.classList.add("required");
    } else {
      espessuraTransversinaLabel.classList.remove("required");
    }
  }
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

  // Validar campos de transversina quando a quantidade for alterada
  const qtdTransversinasField = document.getElementById("qtd-transversinas");
  if (qtdTransversinasField) {
    qtdTransversinasField.addEventListener("change", function() {
      updateTransversinaFieldsRequired();
      if (typeof validateField === 'function') {
        validateField("tipo-transversina");
        validateField("espessura-transversina");
      }
    });
    qtdTransversinasField.addEventListener("input", function() {
      updateTransversinaFieldsRequired();
    });
    // Executar ao carregar a página
    updateTransversinaFieldsRequired();
  }

  // Validar campos de bloco sapata quando o tipo for alterado
  const tipoBlocoSapataField = document.getElementById("tipo-bloco-sapata");
  if (tipoBlocoSapataField) {
    tipoBlocoSapataField.addEventListener("change", function() {
      console.log("🔄 Tipo de bloco sapata alterado para:", this.value);
      // Atualizar visualização dos campos obrigatórios
      updateBlocoSapataFieldsRequired();
      
      const isBlocoSelected = this.value !== "" && this.value !== "Nenhum";
      
      if (typeof validateField === 'function') {
        validateField("altura-bloco-sapata");
        validateField("largura-bloco-sapata");
        validateField("comprimento-bloco-sapata");
      }
      
      // Se bloco foi selecionado e campos estão vazios, destacar em vermelho
      if (isBlocoSelected) {
        const alturaField = document.getElementById("altura-bloco-sapata");
        const larguraField = document.getElementById("largura-bloco-sapata");
        const comprimentoField = document.getElementById("comprimento-bloco-sapata");
        
        setTimeout(() => {
          if (alturaField && (!alturaField.value || parseFloat(alturaField.value) <= 0)) {
            alturaField.classList.add("error");
            const errorEl = document.getElementById("altura-bloco-sapata-error");
            if (errorEl) errorEl.classList.add("visible");
          }
          if (larguraField && (!larguraField.value || parseFloat(larguraField.value) <= 0)) {
            larguraField.classList.add("error");
            const errorEl = document.getElementById("largura-bloco-sapata-error");
            if (errorEl) errorEl.classList.add("visible");
          }
          if (comprimentoField && (!comprimentoField.value || parseFloat(comprimentoField.value) <= 0)) {
            comprimentoField.classList.add("error");
            const errorEl = document.getElementById("comprimento-bloco-sapata-error");
            if (errorEl) errorEl.classList.add("visible");
          }
        }, 100);
      }
    });
    
    // Executar ao carregar a página
    updateBlocoSapataFieldsRequired();
  }

  // Adicionar event listeners diretos nos campos de dimensões do bloco sapata
  const alturaBlocoField = document.getElementById("altura-bloco-sapata");
  const larguraBlocoField = document.getElementById("largura-bloco-sapata");
  const comprimentoBlocoField = document.getElementById("comprimento-bloco-sapata");

  if (alturaBlocoField) {
    alturaBlocoField.addEventListener("blur", function() {
      console.log("Validando altura-bloco-sapata no blur");
      if (typeof validateField === 'function') {
        validateField("altura-bloco-sapata");
      }
    });
    alturaBlocoField.addEventListener("input", function() {
      // Remove erro ao digitar valor válido
      if (this.value.trim() !== "" && parseFloat(this.value) > 0) {
        this.classList.remove("error");
        const errorEl = document.getElementById("altura-bloco-sapata-error");
        if (errorEl) errorEl.classList.remove("visible");
      }
    });
  }

  if (larguraBlocoField) {
    larguraBlocoField.addEventListener("blur", function() {
      console.log("Validando largura-bloco-sapata no blur");
      if (typeof validateField === 'function') {
        validateField("largura-bloco-sapata");
      }
    });
    larguraBlocoField.addEventListener("input", function() {
      // Remove erro ao digitar valor válido
      if (this.value.trim() !== "" && parseFloat(this.value) > 0) {
        this.classList.remove("error");
        const errorEl = document.getElementById("largura-bloco-sapata-error");
        if (errorEl) errorEl.classList.remove("visible");
      }
    });
  }

  if (comprimentoBlocoField) {
    comprimentoBlocoField.addEventListener("blur", function() {
      console.log("⚠️ Validando COMPRIMENTO-BLOCO-SAPATA no blur, valor:", this.value);
      if (typeof validateField === 'function') {
        const result = validateField("comprimento-bloco-sapata");
        console.log("Resultado da validação:", result);
      }
    });
    comprimentoBlocoField.addEventListener("input", function() {
      // Remove erro ao digitar valor válido
      if (this.value.trim() !== "" && parseFloat(this.value) > 0) {
        this.classList.remove("error");
        const errorEl = document.getElementById("comprimento-bloco-sapata-error");
        if (errorEl) errorEl.classList.remove("visible");
      }
    });
  }

  // Validar campos de bloco sapata ao alterar valores
  const alturaBlocoSapataField = document.getElementById("altura-bloco-sapata");
  if (alturaBlocoSapataField) {
    alturaBlocoSapataField.addEventListener("blur", function() {
      if (typeof validateField === 'function') {
        validateField("altura-bloco-sapata");
      }
    });
  }

  const larguraBlocoSapataField = document.getElementById("largura-bloco-sapata");
  if (larguraBlocoSapataField) {
    larguraBlocoSapataField.addEventListener("blur", function() {
      if (typeof validateField === 'function') {
        validateField("largura-bloco-sapata");
      }
    });
  }

  const comprimentoBlocoSapataField = document.getElementById("comprimento-bloco-sapata");
  if (comprimentoBlocoSapataField) {
    comprimentoBlocoSapataField.addEventListener("blur", function() {
      if (typeof validateField === 'function') {
        validateField("comprimento-bloco-sapata");
      }
    });
  }

  // Event listeners para campos complementares com sugestões automáticas
  const tipoBarreiraEsqField = document.getElementById("tipo-barreira-esquerda");
  if (tipoBarreiraEsqField) {
    tipoBarreiraEsqField.addEventListener("change", function() {
      const larguraField = document.getElementById("largura-barreira-esquerda");
      if (this.value !== "" && this.value !== "Nenhum" && larguraField) {
        if (!larguraField.value || parseFloat(larguraField.value) === 0) {
          larguraField.value = "0.4";
        }
        larguraField.classList.add("required");
        const label = document.querySelector('label[for="largura-barreira-esquerda"]');
        if (label) label.classList.add("required");
      } else if (larguraField) {
        larguraField.classList.remove("required");
        const label = document.querySelector('label[for="largura-barreira-esquerda"]');
        if (label) label.classList.remove("required");
      }
      if (typeof validateField === 'function') {
        validateField("largura-barreira-esquerda");
      }
    });
  }

  const tipoBarreiraDirField = document.getElementById("tipo-barreira-direita");
  if (tipoBarreiraDirField) {
    tipoBarreiraDirField.addEventListener("change", function() {
      const larguraField = document.getElementById("largura-barreira-direita");
      if (this.value !== "" && this.value !== "Nenhum" && larguraField) {
        if (!larguraField.value || parseFloat(larguraField.value) === 0) {
          larguraField.value = "0.4";
        }
        larguraField.classList.add("required");
        const label = document.querySelector('label[for="largura-barreira-direita"]');
        if (label) label.classList.add("required");
      } else if (larguraField) {
        larguraField.classList.remove("required");
        const label = document.querySelector('label[for="largura-barreira-direita"]');
        if (label) label.classList.remove("required");
      }
      if (typeof validateField === 'function') {
        validateField("largura-barreira-direita");
      }
    });
  }

  const guardaRodasEsqField = document.getElementById("guarda-rodas-esquerdo");
  if (guardaRodasEsqField) {
    guardaRodasEsqField.addEventListener("change", function() {
      const larguraField = document.getElementById("largura-guarda-rodas-esquerdo");
      if (this.value !== "" && this.value !== "Nenhum" && larguraField) {
        if (!larguraField.value || parseFloat(larguraField.value) === 0) {
          larguraField.value = "0.9";
        }
        const label = document.querySelector('label[for="largura-guarda-rodas-esquerdo"]');
        if (label) label.classList.add("required");
      } else if (larguraField) {
        const label = document.querySelector('label[for="largura-guarda-rodas-esquerdo"]');
        if (label) label.classList.remove("required");
      }
      if (typeof validateField === 'function') {
        validateField("largura-guarda-rodas-esquerdo");
      }
    });
  }

  const guardaRodasDirField = document.getElementById("guarda-rodas-direito");
  if (guardaRodasDirField) {
    guardaRodasDirField.addEventListener("change", function() {
      const larguraField = document.getElementById("largura-guarda-rodas-direito");
      if (this.value !== "" && this.value !== "Nenhum" && larguraField) {
        if (!larguraField.value || parseFloat(larguraField.value) === 0) {
          larguraField.value = "0.9";
        }
        const label = document.querySelector('label[for="largura-guarda-rodas-direito"]');
        if (label) label.classList.add("required");
      } else if (larguraField) {
        const label = document.querySelector('label[for="largura-guarda-rodas-direito"]');
        if (label) label.classList.remove("required");
      }
      if (typeof validateField === 'function') {
        validateField("largura-guarda-rodas-direito");
      }
    });
  }

  const calcadaEsqField = document.getElementById("tipo-calcada-esquerda");
  if (calcadaEsqField) {
    calcadaEsqField.addEventListener("change", function() {
      const larguraField = document.getElementById("largura-calcada-esquerda");
      if (this.value !== "" && this.value !== "Nenhum" && larguraField) {
        if (!larguraField.value || parseFloat(larguraField.value) === 0) {
          larguraField.value = "1.5";
        }
        const label = document.querySelector('label[for="largura-calcada-esquerda"]');
        if (label) label.classList.add("required");
      } else if (larguraField) {
        const label = document.querySelector('label[for="largura-calcada-esquerda"]');
        if (label) label.classList.remove("required");
      }
      if (typeof validateField === 'function') {
        validateField("largura-calcada-esquerda");
      }
    });
  }

  const calcadaDirField = document.getElementById("tipo-calcada-direita");
  if (calcadaDirField) {
    calcadaDirField.addEventListener("change", function() {
      const larguraField = document.getElementById("largura-calcada-direita");
      if (this.value !== "" && this.value !== "Nenhum" && larguraField) {
        if (!larguraField.value || parseFloat(larguraField.value) === 0) {
          larguraField.value = "1.5";
        }
        const label = document.querySelector('label[for="largura-calcada-direita"]');
        if (label) label.classList.add("required");
      } else if (larguraField) {
        const label = document.querySelector('label[for="largura-calcada-direita"]');
        if (label) label.classList.remove("required");
      }
      if (typeof validateField === 'function') {
        validateField("largura-calcada-direita");
      }
    });
  }

  // Event listeners para validação de ala (não ambas selecionadas)
  const alaParalelaField = document.getElementById("tipo-ala-paralela");
  const alaPerpendicularField = document.getElementById("tipo-ala-perpendicular");
  
  if (alaParalelaField) {
    alaParalelaField.addEventListener("change", function() {
      if (typeof validateAlaExclusivity === 'function') {
        validateAlaExclusivity();
      }
      if (typeof validateField === 'function') {
        validateField("tipo-ala-paralela");
        validateField("comprimento-ala");
        validateField("espessura-ala");
      }
    });
  }
  
  if (alaPerpendicularField) {
    alaPerpendicularField.addEventListener("change", function() {
      if (typeof validateAlaExclusivity === 'function') {
        validateAlaExclusivity();
      }
      if (typeof validateField === 'function') {
        validateField("tipo-ala-perpendicular");
        validateField("comprimento-ala");
        validateField("espessura-ala");
      }
    });
  }

  // Event listener para espessura ala (máximo 1.5m)
  const espessuraAlaField = document.getElementById("espessura-ala");
  if (espessuraAlaField) {
    espessuraAlaField.addEventListener("blur", function() {
      if (typeof validateField === 'function') {
        validateField("espessura-ala");
      }
    });
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
window.updateBlocoSapataFieldsRequired = updateBlocoSapataFieldsRequired;
window.updateTransversinaFieldsRequired = updateTransversinaFieldsRequired;
