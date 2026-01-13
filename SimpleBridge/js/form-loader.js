// Versão: 1.1
/* ===== FUNÇÃO PARA CARREGAR DADOS NO FORMULÁRIO ===== */

// Função para carregar dados de uma obra no formulário
function loadWorkToForm(work) {
  try {
    // Resetar flag de tentativa de salvamento (para não mostrar erros ao carregar obra)
    window.formSubmitAttempted = false;

    // ========== CORREÇÃO AUTOMÁTICA DE OBRAS ANTIGAS ==========
    // Se QTD LONGARINAS = 1 (seção caixão), força ESPESSURA LONGARINA = 1
    const qtdLongarinas = parseInt(work["QTD LONGARINAS"]) || 0;
    if (qtdLongarinas === 1) {
      work["ESPESSURA LONGARINA"] = "1";
    }

    // Se QTD LONGARINAS = 0, aplicar regras especiais
    if (qtdLongarinas === 0) {
      work["QTD TRANSVERSINAS"] = "0";
      work["TIPO DE TRANSVERSINA"] = "Nenhum";
      work["ALTURA LONGARINA"] = "0.5";
      work["DESLOCAMENTO ESQUERDO"] = "1";
      work["DESLOCAMENTO DIREITO"] = "1";
      work["REFORCO VIGA"] = "FALSE";
      work["ESPESSURA TRANSVERSINA"] = "0.25";
      work["TIPO SUPERESTRUTURA"] = "ENGASTADA";
    }

    // Se TIPO SUPERESTRUTURA não existe ou está vazio, define como ENGASTADA (padrão)
    if (!work["TIPO SUPERESTRUTURA"] || work["TIPO SUPERESTRUTURA"] === "") {
      work["TIPO SUPERESTRUTURA"] = "ENGASTADA";
    }

    // CORREÇÃO: Se 1 tramo + transição APOIO, limpar alturas dos apoios salvos
    const qtdTramos = parseInt(work["QTD TRAMOS"]) || 1;
    const tipoEncontro = work["TIPO ENCONTRO"] || "";
    if (qtdTramos === 1 && tipoEncontro === "APOIO") {
      // Limpar todas as alturas de apoios que possam estar salvas
      for (let key in work) {
        if (key.startsWith("APOIO") && key.includes("ALTURA")) {
          work[key] = "0.00";
        }
      }
      console.log(
        "✅ Correção automática: Alturas dos apoios zeradas (1 tramo + transição APOIO)"
      );
    }
    // ===========================================================

    // Processar campo MODELADO
    if (work["MODELADO"] === "TRUE" || work["MODELADO"] === true) {
      document.getElementById("modelado").checked = true;
    } else {
      document.getElementById("modelado").checked = false;
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
        if (typeof generateTramosFields === "function") {
          generateTramosFields();
        }

        // Aguardar um pouco para os campos serem gerados
        setTimeout(() => {
          const tramosFields = document.querySelectorAll(".tramo-field");

          // Limpar erros dos campos antes de preencher
          tramosFields.forEach((field) => {
            field.classList.remove("error");
          });
          const tramosError = document.getElementById("tramos-error");
          if (tramosError) {
            tramosError.classList.remove("visible");
          }

          // Preencher valores
          for (let i = 0; i < tramosFields.length && i < tramos.length; i++) {
            tramosFields[i].value = tramos[i];
          }

          // Atualizar soma dos tramos APÓS preencher os valores
          if (typeof updateTramosSum === "function") {
            setTimeout(() => updateTramosSum(), 50);
          }
        }, 100);
      }
    }

    // Processar APOIOS - 3 campos: altura, largura e comprimento
    if (
      work["ALTURA APOIO"] ||
      work["LARGURA PILAR"] ||
      work["COMPRIMENTO PILARES"]
    ) {
      const alturas = work["ALTURA APOIO"]
        ? work["ALTURA APOIO"].split(";")
        : [];
      const larguras = work["LARGURA PILAR"]
        ? work["LARGURA PILAR"].split(";")
        : [];
      const comprimentos = work["COMPRIMENTO PILARES"]
        ? work["COMPRIMENTO PILARES"].split(";")
        : [];

      // Verificar se é pilar parede (QTD PILARES = 1)
      const qtdPilares = parseInt(work["QTD PILARES"]) || 0;
      const isPilarParede = qtdPilares === 1;

      // Aguardar um pouco para os campos serem gerados
      setTimeout(() => {
        const apoiosAlturaFields = document.querySelectorAll(
          ".apoio-altura-field"
        );
        const apoiosLargFields = document.querySelectorAll(".apoio-larg-field");
        const apoiosCompFields = document.querySelectorAll(".apoio-comp-field");

        for (let i = 0; i < apoiosAlturaFields.length; i++) {
          // Preencher altura
          if (i < alturas.length) apoiosAlturaFields[i].value = alturas[i];

          // LARGURA: Não preencher se for pilar parede (deixar bloqueado com "Cálculo automático")
          if (!isPilarParede && i < larguras.length) {
            apoiosLargFields[i].value = larguras[i];
          }

          // Preencher comprimento
          if (i < comprimentos.length)
            apoiosCompFields[i].value = comprimentos[i];
        }
      }, 100);
    }

    // Processar outros campos normais (incluindo ALTURA TRANSIÇÃO)
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
            // Aplicar formatação especial para LOTE
            if (key === "LOTE" && value && typeof formatLote === "function") {
              field.value = formatLote(value);
            } else {
              field.value = value || "";
            }
          }
        }
      }
    }

    // Atualizar visualização de campos obrigatórios condicionais
    if (typeof updateBlocoSapataFieldsRequired === "function") {
      setTimeout(() => {
        updateBlocoSapataFieldsRequired();
      }, 100);
    }

    // Disparar evento change no campo tipo-bloco-sapata para atualizar visibilidade
    setTimeout(() => {
      const tipoBlocoSapataField = document.getElementById("tipo-bloco-sapata");
      if (tipoBlocoSapataField && tipoBlocoSapataField.value) {
        // Disparar evento change para acionar os listeners registrados
        tipoBlocoSapataField.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }
    }, 50);

    // Atualizar visibilidade do campo de quantidade de viga de contraventamento
    if (typeof togglePillarBracingQuantityField === "function") {
      setTimeout(() => {
        togglePillarBracingQuantityField();
      }, 100);
    }

    // Atualizar campos de longarina (desbloquear se QTD LONGARINAS > 0)
    if (typeof updateLongarinaFieldsRequired === "function") {
      setTimeout(() => {
        updateLongarinaFieldsRequired();
      }, 100);
    }

    // Atualizar campos de transversina
    if (typeof updateTransversinaFieldsRequired === "function") {
      setTimeout(() => {
        updateTransversinaFieldsRequired();
      }, 100);
    }

    // Atualizar campo altura transição baseado no tipo encontro
    if (typeof updateAlturaTransicaoField === "function") {
      setTimeout(() => {
        updateAlturaTransicaoField();
      }, 100);
    }

    // Regenerar campos de apoio para garantir que largura fique bloqueada se for pilar parede
    if (typeof generateApoiosFields === "function") {
      setTimeout(() => {
        generateApoiosFields();

        // Recarregar valores após regenerar os campos
        if (
          work["ALTURA APOIO"] ||
          work["LARGURA PILAR"] ||
          work["COMPRIMENTO PILARES"]
        ) {
          const alturas = work["ALTURA APOIO"]
            ? work["ALTURA APOIO"].split(";")
            : [];
          const larguras = work["LARGURA PILAR"]
            ? work["LARGURA PILAR"].split(";")
            : [];
          const comprimentos = work["COMPRIMENTO PILARES"]
            ? work["COMPRIMENTO PILARES"].split(";")
            : [];
          const qtdPilares = parseInt(work["QTD PILARES"]) || 0;
          const isPilarParede = qtdPilares === 1;

          setTimeout(() => {
            const apoiosAlturaFields = document.querySelectorAll(
              ".apoio-altura-field"
            );
            const apoiosLargFields =
              document.querySelectorAll(".apoio-larg-field");
            const apoiosCompFields =
              document.querySelectorAll(".apoio-comp-field");

            for (let i = 0; i < apoiosAlturaFields.length; i++) {
              if (i < alturas.length) apoiosAlturaFields[i].value = alturas[i];
              if (!isPilarParede && i < larguras.length)
                apoiosLargFields[i].value = larguras[i];
              if (i < comprimentos.length)
                apoiosCompFields[i].value = comprimentos[i];
            }
          }, 50);
        }
      }, 120);
    }

    // Atualizar exclusividades de elementos complementares (guarda rodas, barreiras, calçadas)
    if (typeof manageComplementaryElements === "function") {
      setTimeout(() => {
        manageComplementaryElements();
        // Garantir que guarda-rodas não fique bloqueado incorretamente
        // Esta função deve ser executada após manageComplementaryElements para corrigir
        // qualquer bloqueio incorreto que possa ter sido aplicado
        ensureGuardaRodasEnabled();
      }, 150);
      
      // Chamada adicional com delay maior para garantir que não há bloqueios incorretos
      setTimeout(() => {
        ensureGuardaRodasEnabled();
      }, 300);
    }

    // REMOVIDO: Não validar ao carregar obra (para evitar mostrar erros prematuramente)
    // A validação só deve ocorrer quando o usuário tentar salvar
    // if (typeof validateForm === "function") {
    //   setTimeout(() => {
    //     validateForm();
    //   }, 250);
    // }

    // REMOVIDO: Não validar ao carregar obra (para evitar mostrar erros prematuramente)
    // if (typeof validateTransitionMinimumHeight === "function") {
    //   setTimeout(() => {
    //     validateTransitionMinimumHeight();
    //   }, 300);
    // }

    // REMOVIDO: Não validar ao carregar obra (para evitar mostrar erros prematuramente)
    // if (typeof validateSuperstructureType === "function") {
    //   setTimeout(() => {
    //     validateSuperstructureType();
    //   }, 260);
    // }

    // Atualizar link do Google Maps com as coordenadas carregadas
    // Disparar eventos de input para garantir que os listeners sejam acionados
    const latInput = document.getElementById("latitude");
    const longInput = document.getElementById("longitude");

    if (latInput && latInput.value) {
      latInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (longInput && longInput.value) {
      longInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // Chamada direta como backup
    if (typeof updateGoogleMapsLink === "function") {
      updateGoogleMapsLink();
    }

    // Atualizar visibilidade da mensagem informativa de altura-travessa
    const tipoTravessaField = document.getElementById("tipo-travessa");
    const infoMessage = document.getElementById("altura-travessa-info");
    if (tipoTravessaField && infoMessage) {
      const hasTravessa =
        tipoTravessaField.value !== "" && tipoTravessaField.value !== "Nenhum";
      infoMessage.style.display = hasTravessa ? "block" : "none";
    }

    // Atualizar soma dos tramos (com delay para garantir que todos os campos foram preenchidos)
    if (typeof updateTramosSum === "function") {
      setTimeout(() => updateTramosSum(), 200);
    }

    // Aplicar restrições de single tramo se necessário
    if (typeof handleSingleTramoRestrictions === "function") {
      const qtdTramos = parseInt(work["QTD TRAMOS"]) || 1;
      setTimeout(() => {
        handleSingleTramoRestrictions(qtdTramos);
      }, 150);
    }

    // Aplicar regras de transição monolítica após carregar os dados
    if (typeof applyMonolithicTransitionRules === "function") {
      setTimeout(() => {
        applyMonolithicTransitionRules();
      }, 300);
    }

    // Aplicar regras de longarinas = 0 após carregar os dados
    if (typeof applyZeroLongarinaRules === "function") {
      setTimeout(() => {
        applyZeroLongarinaRules();
      }, 310);
    }
  } catch (error) {
    console.error("Erro ao carregar dados no formulário:", error);
    alert("Erro ao carregar dados no formulário: " + error.message);
  }
}

// Função para garantir que guarda-rodas não fique bloqueado incorretamente
function ensureGuardaRodasEnabled() {
  const guardaRodasEsquerdo = document.getElementById("guarda-rodas-esquerdo");
  const guardaRodasDireito = document.getElementById("guarda-rodas-direito");
  const barreiraEsquerda = document.getElementById("tipo-barreira-esquerda");
  const barreiraDireita = document.getElementById("tipo-barreira-direita");
  const calcadaEsquerda = document.getElementById("tipo-calcada-esquerda");
  const calcadaDireita = document.getElementById("tipo-calcada-direita");

  // Função para verificar se uma barreira é excludente
  function isBarreiraExcludente(value) {
    return (
      value === "BARREIRA NEW JERSEY" ||
      value === "BARREIRA COM GUARDA-CORPO" ||
      (window.CONSTANTS &&
        (value === window.CONSTANTS.TIPO_BARREIRA?.BARREIRA_NEW_JERSEY ||
          value === window.CONSTANTS.TIPO_BARREIRA?.BARREIRA_COM_GUARDA_CORPO))
    );
  }

  // Função para verificar se calçada está selecionada
  function hasCalcada(value) {
    return (
      value === "CALÇADA PARA PEDESTRES DE CONCRETO ARMADO" ||
      (window.CONSTANTS &&
        value === window.CONSTANTS.TIPO_CALCADA?.CALCADA_PEDESTRES_CONCRETO_ARMADO)
    );
  }

  // LADO ESQUERDO
  if (guardaRodasEsquerdo) {
    const hasGuardaRodasEsq =
      guardaRodasEsquerdo.value !== "" &&
      guardaRodasEsquerdo.value !== "Nenhum";
    const hasBarreiraEsq =
      barreiraEsquerda &&
      barreiraEsquerda.value !== "" &&
      barreiraEsquerda.value !== "Nenhum" &&
      isBarreiraExcludente(barreiraEsquerda.value);
    const hasCalcadaEsq =
      calcadaEsquerda && hasCalcada(calcadaEsquerda.value);

    // Se guarda-rodas está selecionado, deve estar habilitado
    if (hasGuardaRodasEsq && !hasBarreiraEsq && !hasCalcadaEsq) {
      guardaRodasEsquerdo.disabled = false;
      guardaRodasEsquerdo.style.opacity = "1";
      guardaRodasEsquerdo.style.cursor = "pointer";
      guardaRodasEsquerdo.removeAttribute("data-locked");
      guardaRodasEsquerdo.style.pointerEvents = "";
    }
    // Se guarda-rodas não está selecionado e não há barreira/calçada bloqueando, deve estar habilitado
    else if (!hasGuardaRodasEsq && !hasBarreiraEsq && !hasCalcadaEsq) {
      guardaRodasEsquerdo.disabled = false;
      guardaRodasEsquerdo.style.opacity = "1";
      guardaRodasEsquerdo.style.cursor = "pointer";
      guardaRodasEsquerdo.removeAttribute("data-locked");
      guardaRodasEsquerdo.style.pointerEvents = "";
    }
  }

  // LADO DIREITO
  if (guardaRodasDireito) {
    const hasGuardaRodasDir =
      guardaRodasDireito.value !== "" &&
      guardaRodasDireito.value !== "Nenhum";
    const hasBarreiraDir =
      barreiraDireita &&
      barreiraDireita.value !== "" &&
      barreiraDireita.value !== "Nenhum" &&
      isBarreiraExcludente(barreiraDireita.value);
    const hasCalcadaDir =
      calcadaDireita && hasCalcada(calcadaDireita.value);

    // Se guarda-rodas está selecionado, deve estar habilitado
    if (hasGuardaRodasDir && !hasBarreiraDir && !hasCalcadaDir) {
      guardaRodasDireito.disabled = false;
      guardaRodasDireito.style.opacity = "1";
      guardaRodasDireito.style.cursor = "pointer";
      guardaRodasDireito.removeAttribute("data-locked");
      guardaRodasDireito.style.pointerEvents = "";
    }
    // Se guarda-rodas não está selecionado e não há barreira/calçada bloqueando, deve estar habilitado
    else if (!hasGuardaRodasDir && !hasBarreiraDir && !hasCalcadaDir) {
      guardaRodasDireito.disabled = false;
      guardaRodasDireito.style.opacity = "1";
      guardaRodasDireito.style.cursor = "pointer";
      guardaRodasDireito.removeAttribute("data-locked");
      guardaRodasDireito.style.pointerEvents = "";
    }
  }
}

// Expor função globalmente
window.loadWorkToForm = loadWorkToForm;
