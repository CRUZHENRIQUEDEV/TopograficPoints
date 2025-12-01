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
  
  // Reinicializar handlers de erro para os novos campos
  if (typeof initErrorHandlers === 'function') {
    initErrorHandlers();
  }
}

// Gerar campos de apoios
function generateApoiosFields() {
  const qtdApoios = parseInt(document.getElementById("qtd-apoios").value) || 0;
  const qtdPilares = parseInt(document.getElementById("qtd-pilares")?.value) || 0;
  const container = document.getElementById("apoios-fields");

  if (!container) return;

  container.innerHTML = "";

  if (qtdApoios === 0) {
    return;
  }

  // Se há apenas 1 pilar, será um pilar parede com largura calculada automaticamente
  const isPilarParede = qtdPilares === 1;

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
        <input type="${isPilarParede ? 'text' : 'number'}" class="apoio-larg-field" name="apoio-larg-${i}" 
               step="0.01" min="0" placeholder="${isPilarParede ? 'Cálculo automático' : '0.00'}" 
               ${isPilarParede ? 'disabled readonly' : 'required'} 
               value="${isPilarParede ? 'Cálculo automático' : ''}" 
               style="${isPilarParede ? 'background-color: #f0f0f0; cursor: not-allowed;' : ''}" />
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
  
  // Reinicializar handlers de erro para os novos campos
  if (typeof initErrorHandlers === 'function') {
    initErrorHandlers();
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

// Atualizar visualização dos campos obrigatórios de longarina
function updateLongarinaFieldsRequired() {
  const qtdLongarinasField = document.getElementById("qtd-longarinas");
  if (!qtdLongarinasField) return;

  const qtdLongarinas = parseInt(qtdLongarinasField.value) || 0;
  const hasLongarinas = qtdLongarinas > 0;

  // Atualizar altura longarina
  const alturaLongarinaLabel = document.querySelector('label[for="altura-longarina"]');
  const alturaLongarinaField = document.getElementById("altura-longarina");
  if (alturaLongarinaField) {
    if (hasLongarinas) {
      alturaLongarinaField.disabled = false;
      if (alturaLongarinaLabel) alturaLongarinaLabel.classList.add("required");
    } else {
      alturaLongarinaField.disabled = true;
      alturaLongarinaField.value = ""; // Limpar o valor
      if (alturaLongarinaLabel) alturaLongarinaLabel.classList.remove("required");
      alturaLongarinaField.classList.remove("error");
      const errorEl = document.getElementById("altura-longarina-error");
      if (errorEl) errorEl.classList.remove("visible");
    }
  }

  // Atualizar espessura longarina
  const espessuraLongarinaLabel = document.querySelector('label[for="espessura-longarina"]');
  const espessuraLongarinaField = document.getElementById("espessura-longarina");
  if (espessuraLongarinaField) {
    // Se há apenas 1 longarina, bloquear o campo (será uma seção caixão protendida com cálculo automático)
    if (qtdLongarinas === 1) {
      espessuraLongarinaField.disabled = true;
      espessuraLongarinaField.value = ""; // Limpar o valor
      if (espessuraLongarinaLabel) espessuraLongarinaLabel.classList.remove("required");
      espessuraLongarinaField.classList.remove("error");
      const errorEl = document.getElementById("espessura-longarina-error");
      if (errorEl) errorEl.classList.remove("visible");
    } else if (hasLongarinas) {
      // Se há mais de 1 longarina, habilitar o campo
      espessuraLongarinaField.disabled = false;
      if (espessuraLongarinaLabel) espessuraLongarinaLabel.classList.add("required");
    } else {
      // Se não há longarinas, bloquear e limpar
      espessuraLongarinaField.disabled = true;
      espessuraLongarinaField.value = ""; // Limpar o valor
      if (espessuraLongarinaLabel) espessuraLongarinaLabel.classList.remove("required");
      espessuraLongarinaField.classList.remove("error");
      const errorEl = document.getElementById("espessura-longarina-error");
      if (errorEl) errorEl.classList.remove("visible");
    }
  }

  // Bloquear/desbloquear checkbox de reforço viga
  const beamReinforcementCheckbox = document.getElementById("beam-reinforcement");
  if (beamReinforcementCheckbox) {
    if (!hasLongarinas) {
      beamReinforcementCheckbox.checked = false;
      beamReinforcementCheckbox.disabled = true;
    } else {
      beamReinforcementCheckbox.disabled = false;
    }
  }

  // SE NÃO HÁ LONGARINAS OU HÁ APENAS 1 LONGARINA (SEÇÃO CAIXÃO), NÃO PODE HAVER TRANSVERSINAS
  const qtdTransversinasField = document.getElementById("qtd-transversinas");
  const tipoTransversinaField = document.getElementById("tipo-transversina");
  const espessuraTransversinaField = document.getElementById("espessura-transversina");

  if (!hasLongarinas || qtdLongarinas === 1) {
    // Limpar e desabilitar QTD TRANSVERSINAS
    if (qtdTransversinasField) {
      qtdTransversinasField.value = "0";
      qtdTransversinasField.disabled = true;
      qtdTransversinasField.classList.remove("error");
    }

    // Setar como "Nenhum" e desabilitar TIPO DE TRANSVERSINA
    if (tipoTransversinaField) {
      tipoTransversinaField.value = "Nenhum";
      tipoTransversinaField.disabled = true;
      tipoTransversinaField.classList.remove("error");
      const errorEl = document.getElementById("tipo-transversina-error");
      if (errorEl) errorEl.classList.remove("visible");
    }

    // Limpar e desabilitar ESPESSURA TRANSVERSINA
    if (espessuraTransversinaField) {
      espessuraTransversinaField.value = "";
      espessuraTransversinaField.disabled = true;
      espessuraTransversinaField.classList.remove("error");
      const errorEl = document.getElementById("espessura-transversina-error");
      if (errorEl) errorEl.classList.remove("visible");
    }
  } else {
    // Habilitar campos de transversina quando há mais de 1 longarina
    if (qtdTransversinasField) {
      qtdTransversinasField.disabled = false;
    }
    if (tipoTransversinaField) {
      tipoTransversinaField.disabled = false;
    }
    if (espessuraTransversinaField) {
      espessuraTransversinaField.disabled = false;
    }
  }
}

// Função chamada quando a quantidade de longarinas muda
function handleLongarinaChange() {
  updateLongarinaFieldsRequired();
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

// Função para gerenciar exclusividades de elementos complementares
function manageComplementaryElements() {
  // Lado ESQUERDO
  const guardaRodasEsq = document.getElementById("guarda-rodas-esquerdo");
  const tipoBarreiraEsq = document.getElementById("tipo-barreira-esquerda");
  const larguraBarreiraEsq = document.getElementById("largura-barreira-esquerda");
  const larguraGuardaRodasEsq = document.getElementById("largura-guarda-rodas-esquerdo");
  const tipoCalcadaEsq = document.getElementById("tipo-calcada-esquerda");
  const larguraCalcadaEsq = document.getElementById("largura-calcada-esquerda");

  // Lado DIREITO
  const guardaRodasDir = document.getElementById("guarda-rodas-direito");
  const tipoBarreiraDir = document.getElementById("tipo-barreira-direita");
  const larguraBarreiraDir = document.getElementById("largura-barreira-direita");
  const larguraGuardaRodasDir = document.getElementById("largura-guarda-rodas-direito");
  const tipoCalcadaDir = document.getElementById("tipo-calcada-direita");
  const larguraCalcadaDir = document.getElementById("largura-calcada-direita");

  // ========== LADO ESQUERDO ==========
  
  // Verificar se há guarda rodas ESQUERDO
  const hasGuardaRodasEsq = guardaRodasEsq && guardaRodasEsq.value !== "" && guardaRodasEsq.value !== "Nenhum";
  
  // Verificar se há barreira ESQUERDA
  const hasBarreiraEsq = tipoBarreiraEsq && tipoBarreiraEsq.value !== "" && tipoBarreiraEsq.value !== "Nenhum";
  
  if (hasGuardaRodasEsq) {
    // GUARDA RODAS só pode sozinho - bloqueia BARREIRA e CALÇADA
    if (tipoBarreiraEsq) {
      tipoBarreiraEsq.value = "Nenhum";
      tipoBarreiraEsq.setAttribute('data-locked', 'true');
      tipoBarreiraEsq.style.opacity = "0.5";
      tipoBarreiraEsq.style.pointerEvents = "none";
    }
    if (larguraBarreiraEsq) {
      larguraBarreiraEsq.value = "";
      larguraBarreiraEsq.setAttribute('readonly', true);
      larguraBarreiraEsq.style.opacity = "0.5";
      larguraBarreiraEsq.style.pointerEvents = "none";
    }
    if (tipoCalcadaEsq) {
      tipoCalcadaEsq.value = "Nenhum";
      tipoCalcadaEsq.setAttribute('data-locked', 'true');
      tipoCalcadaEsq.style.opacity = "0.5";
      tipoCalcadaEsq.style.pointerEvents = "none";
    }
    if (larguraCalcadaEsq) {
      larguraCalcadaEsq.value = "";
      larguraCalcadaEsq.setAttribute('readonly', true);
      larguraCalcadaEsq.style.opacity = "0.5";
      larguraCalcadaEsq.style.pointerEvents = "none";
    }
  } else if (hasBarreiraEsq) {
    // BARREIRA bloqueia apenas GUARDA RODAS (CALÇADA pode coexistir)
    if (guardaRodasEsq) {
      guardaRodasEsq.value = "Nenhum";
      guardaRodasEsq.setAttribute('data-locked', 'true');
      guardaRodasEsq.style.opacity = "0.5";
      guardaRodasEsq.style.pointerEvents = "none";
    }
    if (larguraGuardaRodasEsq) {
      larguraGuardaRodasEsq.value = "";
      larguraGuardaRodasEsq.setAttribute('readonly', true);
      larguraGuardaRodasEsq.style.opacity = "0.5";
      larguraGuardaRodasEsq.style.pointerEvents = "none";
    }
    // CALÇADA permanece livre quando há BARREIRA
    if (tipoCalcadaEsq) {
      tipoCalcadaEsq.removeAttribute('data-locked');
      tipoCalcadaEsq.style.opacity = "";
      tipoCalcadaEsq.style.pointerEvents = "";
    }
    if (larguraCalcadaEsq) {
      larguraCalcadaEsq.removeAttribute('readonly');
      larguraCalcadaEsq.style.opacity = "";
      larguraCalcadaEsq.style.pointerEvents = "";
    }
  } else {
    // Nenhum elemento selecionado - liberar todos os campos
    if (tipoBarreiraEsq) {
      tipoBarreiraEsq.removeAttribute('data-locked');
      tipoBarreiraEsq.style.opacity = "";
      tipoBarreiraEsq.style.pointerEvents = "";
    }
    if (larguraBarreiraEsq) {
      larguraBarreiraEsq.removeAttribute('readonly');
      larguraBarreiraEsq.style.opacity = "";
      larguraBarreiraEsq.style.pointerEvents = "";
    }
    if (guardaRodasEsq) {
      guardaRodasEsq.removeAttribute('data-locked');
      guardaRodasEsq.style.opacity = "";
      guardaRodasEsq.style.pointerEvents = "";
    }
    if (larguraGuardaRodasEsq) {
      larguraGuardaRodasEsq.removeAttribute('readonly');
      larguraGuardaRodasEsq.style.opacity = "";
      larguraGuardaRodasEsq.style.pointerEvents = "";
    }
    if (tipoCalcadaEsq) {
      tipoCalcadaEsq.removeAttribute('data-locked');
      tipoCalcadaEsq.style.opacity = "";
      tipoCalcadaEsq.style.pointerEvents = "";
    }
    if (larguraCalcadaEsq) {
      larguraCalcadaEsq.removeAttribute('readonly');
      larguraCalcadaEsq.style.opacity = "";
      larguraCalcadaEsq.style.pointerEvents = "";
    }
  }

  // ========== LADO DIREITO ==========
  
  // Verificar se há guarda rodas DIREITO
  const hasGuardaRodasDir = guardaRodasDir && guardaRodasDir.value !== "" && guardaRodasDir.value !== "Nenhum";
  
  // Verificar se há barreira DIREITA
  const hasBarreiraDir = tipoBarreiraDir && tipoBarreiraDir.value !== "" && tipoBarreiraDir.value !== "Nenhum";
  
  if (hasGuardaRodasDir) {
    // GUARDA RODAS só pode sozinho - bloqueia BARREIRA e CALÇADA
    if (tipoBarreiraDir) {
      tipoBarreiraDir.value = "Nenhum";
      tipoBarreiraDir.setAttribute('data-locked', 'true');
      tipoBarreiraDir.style.opacity = "0.5";
      tipoBarreiraDir.style.pointerEvents = "none";
    }
    if (larguraBarreiraDir) {
      larguraBarreiraDir.value = "";
      larguraBarreiraDir.setAttribute('readonly', true);
      larguraBarreiraDir.style.opacity = "0.5";
      larguraBarreiraDir.style.pointerEvents = "none";
    }
    if (tipoCalcadaDir) {
      tipoCalcadaDir.value = "Nenhum";
      tipoCalcadaDir.setAttribute('data-locked', 'true');
      tipoCalcadaDir.style.opacity = "0.5";
      tipoCalcadaDir.style.pointerEvents = "none";
    }
    if (larguraCalcadaDir) {
      larguraCalcadaDir.value = "";
      larguraCalcadaDir.setAttribute('readonly', true);
      larguraCalcadaDir.style.opacity = "0.5";
      larguraCalcadaDir.style.pointerEvents = "none";
    }
  } else if (hasBarreiraDir) {
    // BARREIRA bloqueia apenas GUARDA RODAS (CALÇADA pode coexistir)
    if (guardaRodasDir) {
      guardaRodasDir.value = "Nenhum";
      guardaRodasDir.setAttribute('data-locked', 'true');
      guardaRodasDir.style.opacity = "0.5";
      guardaRodasDir.style.pointerEvents = "none";
    }
    if (larguraGuardaRodasDir) {
      larguraGuardaRodasDir.value = "";
      larguraGuardaRodasDir.setAttribute('readonly', true);
      larguraGuardaRodasDir.style.opacity = "0.5";
      larguraGuardaRodasDir.style.pointerEvents = "none";
    }
    // CALÇADA permanece livre quando há BARREIRA
    if (tipoCalcadaDir) {
      tipoCalcadaDir.removeAttribute('data-locked');
      tipoCalcadaDir.style.opacity = "";
      tipoCalcadaDir.style.pointerEvents = "";
    }
    if (larguraCalcadaDir) {
      larguraCalcadaDir.removeAttribute('readonly');
      larguraCalcadaDir.style.opacity = "";
      larguraCalcadaDir.style.pointerEvents = "";
    }
  } else {
    // Nenhum elemento selecionado - liberar todos os campos
    if (tipoBarreiraDir) {
      tipoBarreiraDir.removeAttribute('data-locked');
      tipoBarreiraDir.style.opacity = "";
      tipoBarreiraDir.style.pointerEvents = "";
    }
    if (larguraBarreiraDir) {
      larguraBarreiraDir.removeAttribute('readonly');
      larguraBarreiraDir.style.opacity = "";
      larguraBarreiraDir.style.pointerEvents = "";
    }
    if (guardaRodasDir) {
      guardaRodasDir.removeAttribute('data-locked');
      guardaRodasDir.style.opacity = "";
      guardaRodasDir.style.pointerEvents = "";
    }
    if (larguraGuardaRodasDir) {
      larguraGuardaRodasDir.removeAttribute('readonly');
      larguraGuardaRodasDir.style.opacity = "";
      larguraGuardaRodasDir.style.pointerEvents = "";
    }
    if (tipoCalcadaDir) {
      tipoCalcadaDir.removeAttribute('data-locked');
      tipoCalcadaDir.style.opacity = "";
      tipoCalcadaDir.style.pointerEvents = "";
    }
    if (larguraCalcadaDir) {
      larguraCalcadaDir.removeAttribute('readonly');
      larguraCalcadaDir.style.opacity = "";
      larguraCalcadaDir.style.pointerEvents = "";
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

  // Regenerar campos de apoios quando a quantidade de pilares mudar (para bloquear largura se pilar parede)
  const qtdPilaresField = document.getElementById("qtd-pilares");
  if (qtdPilaresField) {
    qtdPilaresField.addEventListener("change", generateApoiosFields);
    qtdPilaresField.addEventListener("input", generateApoiosFields);
  }

  // Validar campos de longarina quando a quantidade for alterada
  const qtdLongarinasField = document.getElementById("qtd-longarinas");
  if (qtdLongarinasField) {
    qtdLongarinasField.addEventListener("change", function() {
      updateLongarinaFieldsRequired();
      if (typeof validateField === 'function') {
        validateField("altura-longarina");
        validateField("espessura-longarina");
      }
    });
    qtdLongarinasField.addEventListener("input", function() {
      updateLongarinaFieldsRequired();
    });
    // Executar ao carregar a página
    updateLongarinaFieldsRequired();
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
      // console.log("🔄 Tipo de bloco sapata alterado para:", this.value);
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
      // Gerenciar exclusividades de elementos complementares
      manageComplementaryElements();
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
      // Gerenciar exclusividades de elementos complementares
      manageComplementaryElements();
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
      // Gerenciar exclusividades de elementos complementares
      manageComplementaryElements();
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
      // Gerenciar exclusividades de elementos complementares
      manageComplementaryElements();
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

  // Event listener para espessura laje - valida cortina-altura quando muda
  const espessuraLajeField = document.getElementById("espessura-laje");
  if (espessuraLajeField) {
    espessuraLajeField.addEventListener("input", function() {
      // Revalidar cortina-altura quando espessura laje mudar
      const cortinaAlturaField = document.getElementById("cortina-altura");
      if (cortinaAlturaField && cortinaAlturaField.value) {
        if (typeof validateField === 'function') {
          validateField("cortina-altura");
        }
      }
    });
    espessuraLajeField.addEventListener("blur", function() {
      // Revalidar cortina-altura quando espessura laje mudar
      const cortinaAlturaField = document.getElementById("cortina-altura");
      if (cortinaAlturaField && cortinaAlturaField.value) {
        if (typeof validateField === 'function') {
          validateField("cortina-altura");
        }
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
window.updateLongarinaFieldsRequired = updateLongarinaFieldsRequired;
window.manageComplementaryElements = manageComplementaryElements;
