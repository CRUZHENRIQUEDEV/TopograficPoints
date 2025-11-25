// Versão: 1.1
/* ===== FUNÇÃO PARA CARREGAR DADOS NO FORMULÁRIO ===== */

// Função para carregar dados de uma obra no formulário
function loadWorkToForm(work) {
  try {
    // Processar campo MODELADO
    if (work["MODELADO"] === "TRUE" || work["MODELADO"] === true) {
      document.getElementById("modelado").checked = true;
    } else {
      document.getElementById("modelado").checked = false;
    }

    // Processar GPS
    if (work["GPS"] === "TRUE" || work["GPS"] === true) {
      document.getElementById("gps").checked = true;
    } else {
      document.getElementById("gps").checked = false;
    }

    // Processar REFORCO VIGA
    if (work["REFORCO VIGA"] === "TRUE" || work["REFORCO VIGA"] === true) {
      document.getElementById("beam-reinforcement").checked = true;
    } else {
      document.getElementById("beam-reinforcement").checked = false;
    }

    // Processar TRAMOS
    if (work["COMPRIMENTO TRAMOS"]) {
      const tramos = work["COMPRIMENTO TRAMOS"].split(";");
      const qtdTramosField = document.getElementById("qtd-tramos");
      if (qtdTramosField) {
        qtdTramosField.value = tramos.length;
        
        // Chamar função para gerar campos de tramos se existir
        if (typeof generateTramosFields === 'function') {
          generateTramosFields();
        }

        // Aguardar um pouco para os campos serem gerados
        setTimeout(() => {
          const tramosFields = document.querySelectorAll(".tramo-field");
          for (let i = 0; i < tramosFields.length && i < tramos.length; i++) {
            tramosFields[i].value = tramos[i];
          }
        }, 100);
      }
    }

    // Processar APOIOS - 3 campos: altura, largura e comprimento
    if (work["ALTURA APOIO"] || work["LARGURA PILAR"] || work["COMPRIMENTO PILARES"]) {
      const alturas = work["ALTURA APOIO"] ? work["ALTURA APOIO"].split(";") : [];
      const larguras = work["LARGURA PILAR"] ? work["LARGURA PILAR"].split(";") : [];
      const comprimentos = work["COMPRIMENTO PILARES"] ? work["COMPRIMENTO PILARES"].split(";") : [];

      // Aguardar um pouco para os campos serem gerados
      setTimeout(() => {
        const apoiosAlturaFields = document.querySelectorAll(".apoio-altura-field");
        const apoiosLargFields = document.querySelectorAll(".apoio-larg-field");
        const apoiosCompFields = document.querySelectorAll(".apoio-comp-field");

        for (let i = 0; i < apoiosAlturaFields.length; i++) {
          if (i < alturas.length) apoiosAlturaFields[i].value = alturas[i];
          if (i < larguras.length) apoiosLargFields[i].value = larguras[i];
          if (i < comprimentos.length) apoiosCompFields[i].value = comprimentos[i];
        }
      }, 100);
    }

    // Processar outros campos normais
    for (const [key, value] of Object.entries(work)) {
      if (
        key !== "MODELADO" &&
        key !== "GPS" &&
        key !== "REFORCO VIGA" &&
        key !== "COMPRIMENTO TRAMOS" &&
        key !== "ALTURA APOIO" &&
        key !== "LARGURA PILAR" &&
        key !== "COMPRIMENTO PILARES"
      ) {
        const field = document.querySelector(`[name="${key}"]`);
        if (field) {
          if (field.type === "checkbox") {
            field.checked = value === "TRUE" || value === true;
          } else if (field.type === "number") {
            field.value = value || "";
          } else {
            field.value = value || "";
          }
        }
      }
    }

    // Atualizar visualização de campos obrigatórios condicionais
    if (typeof updateBlocoSapataFieldsRequired === 'function') {
      setTimeout(() => {
        updateBlocoSapataFieldsRequired();
      }, 100);
    }

    // Atualizar visibilidade do campo de quantidade de viga de contraventamento
    if (typeof togglePillarBracingQuantityField === 'function') {
      setTimeout(() => {
        togglePillarBracingQuantityField();
      }, 100);
    }

    // Atualizar campos de longarina (desbloquear se QTD LONGARINAS > 0)
    if (typeof updateLongarinaFieldsRequired === 'function') {
      setTimeout(() => {
        updateLongarinaFieldsRequired();
      }, 100);
    }

    // Atualizar campos de transversina
    if (typeof updateTransversinaFieldsRequired === 'function') {
      setTimeout(() => {
        updateTransversinaFieldsRequired();
      }, 100);
    }

    // Executar validação após carregar (se a função existir)
    if (typeof validateForm === 'function') {
      setTimeout(() => {
        validateForm();
      }, 200);
    }

    // Atualizar link do Google Maps com as coordenadas carregadas
    // Disparar eventos de input para garantir que os listeners sejam acionados
    setTimeout(() => {
      const latInput = document.getElementById("latitude");
      const longInput = document.getElementById("longitude");
      
      if (latInput && latInput.value) {
        latInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (longInput && longInput.value) {
        longInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Chamada direta como backup
      if (typeof updateGoogleMapsLink === 'function') {
        updateGoogleMapsLink();
      }
    }, 250);

  } catch (error) {
    console.error("Erro ao carregar dados no formulário:", error);
    alert("Erro ao carregar dados no formulário: " + error.message);
  }
}

// Expor função globalmente
window.loadWorkToForm = loadWorkToForm;