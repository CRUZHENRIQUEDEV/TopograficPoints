/* ===== APLICAÇÃO PRINCIPAL ===== */

// Inicializar banco de dados IndexedDB
function initDB() {
  try {
    const request = window.indexedDB.open("OAEDatabase", 3);

    request.onerror = function (event) {
      console.error("Erro ao abrir o banco de dados:", event.target.errorCode);
      alert("Erro ao inicializar o banco de dados.");
    };

    request.onupgradeneeded = function (event) {
      const database = event.target.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        const objectStore = database.createObjectStore("obras", {
          keyPath: "CODIGO",
        });
        objectStore.createIndex("CODIGO", "CODIGO", { unique: true });
        objectStore.createIndex("LOTE", "LOTE", { unique: false });
      } else if (oldVersion === 1) {
        const objectStore = event.target.transaction.objectStore("obras");
        if (!objectStore.indexNames.contains("LOTE")) {
          objectStore.createIndex("LOTE", "LOTE", { unique: false });
        }
      }

      if (oldVersion < 3) {
        if (!database.objectStoreNames.contains("pontes")) {
          const pontesStore = database.createObjectStore("pontes", {
            keyPath: "Id",
          });
          pontesStore.createIndex("CodigoSgo", "CodigoSgo", { unique: true });
          pontesStore.createIndex("Uf", "Uf", { unique: false });
          pontesStore.createIndex("Br", "Br", { unique: false });
        }
      }
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      // console.log("Banco de dados inicializado com sucesso");
      loadWorksList();
      startSaveReminders();
    };
  } catch (error) {
    console.error("Erro na inicialização do banco de dados:", error);
    alert("Erro ao inicializar o banco de dados: " + error.message);
  }
}

// Carregar lista de obras
function loadWorksList() {
  if (!db) return;

  const worksList = document.getElementById("works-list");
  if (!worksList) return;

  worksList.innerHTML = '<div class="work-item">Carregando...</div>';

  const transaction = db.transaction(["obras"], "readonly");
  const objectStore = transaction.objectStore("obras");
  const request = objectStore.getAll();

  request.onsuccess = function (event) {
    const works = event.target.result;

    // Calcular contadores
    const totalWorks = works.length;
    let modeledWorks = 0;

    if (totalWorks > 0) {
      works.forEach((work) => {
        const isModelado = work.MODELADO === "TRUE" || work.MODELADO === true;
        if (isModelado) {
          modeledWorks++;
        }
      });
    }

    const pendingWorks = totalWorks - modeledWorks;

    // Atualizar contadores no DOM
    updateWorksCounter(totalWorks, modeledWorks, pendingWorks);

    if (works.length === 0) {
      worksList.innerHTML =
        '<div class="work-item">Nenhuma obra cadastrada</div>';
      return;
    }

    worksList.innerHTML = "";

    works.forEach((work) => {
      const workItem = document.createElement("div");
      workItem.className = "work-item";
      if (currentWorkCode === work.CODIGO) {
        workItem.classList.add("selected");
      }
      workItem.setAttribute("data-code", work.CODIGO);
      workItem.setAttribute("data-lote", work.LOTE || "");

      // Verificar se a obra foi modelada
      const isModelado = work.MODELADO === "TRUE" || work.MODELADO === true;
      const checkIcon = isModelado
        ? '<span class="modelado-check">✅</span>'
        : '<span class="no-check"></span>';

      // Formatar LOTE para exibição
      const loteFormatado =
        work.LOTE && typeof formatLote === "function"
          ? formatLote(work.LOTE)
          : work.LOTE || "N/A";

      workItem.innerHTML = `
        <span>${checkIcon}${work.CODIGO} - Lote: ${loteFormatado} - ${
        work.NOME || "Sem nome"
      }</span>
        <button type="button" class="delete-btn" onclick="deleteWork('${
          work.CODIGO
        }', event)">Excluir</button>
      `;

      // Adicionar evento de clique para carregar a obra
      workItem.addEventListener("click", function (e) {
        if (!e.target.classList.contains("delete-btn")) {
          loadWork(work.CODIGO);
        }
      });

      worksList.appendChild(workItem);
    });
  };

  request.onerror = function (event) {
    console.error("Erro ao carregar lista de obras:", event.target.error);
    worksList.innerHTML = '<div class="work-item">Erro ao carregar obras</div>';
  };
}

// Salvar obra atual
function saveCurrentWork() {
  try {
    // console.log("=== TENTANDO SALVAR OBRA ===");
    const { isValid, missingFields } = validateForm();

    console.log(`Validação: ${isValid ? "✅ VÁLIDA" : "❌ INVÁLIDA"}`);
    // console.log(`Campos faltando: ${missingFields.length}`, missingFields);

    if (!isValid) {
      console.error("❌ BLOQUEADO: Não é possível salvar com campos inválidos");
      alert(
        "❌ ERRO: Não é possível salvar!\n\nCampos obrigatórios faltando:\n" +
          missingFields.join("\n")
      );
      closeSummaryModal();
      return;
    }

    // console.log("✅ Validação passou, prosseguindo com salvamento...");

    const form = document.getElementById("oae-form");
    const formData = new FormData(form);
    const workData = {};

    for (let [key, value] of formData.entries()) {
      if (!key.startsWith("tramo-") && !key.startsWith("apoio-")) {
        workData[key] = value;
      }
    }

    workData["MODELADO"] = document.getElementById("modelado").checked
      ? "TRUE"
      : "FALSE";
    workData["REFORCO VIGA"] =
      document.getElementById("beam-reinforcement").checked;

    // Capturar campos que podem estar disabled (FormData ignora campos disabled)
    const tipoTravessaField = document.getElementById("tipo-travessa");
    if (tipoTravessaField) {
      workData["TIPO TRAVESSA"] = tipoTravessaField.value;
    }

    const tipoApoioTransicaoField = document.getElementById(
      "tipo-apoio-transicao"
    );
    if (tipoApoioTransicaoField) {
      workData["TIPO APOIO TRANSICAO"] = tipoApoioTransicaoField.value;
    }

    // Capturar TIPO ENCONTRO (importante para identificar MONOLÍTICO, APOIO, etc)
    const tipoEncontroField = document.getElementById("tipo-encontro");
    if (tipoEncontroField) {
      workData["TIPO ENCONTRO"] = tipoEncontroField.value;
    }

    // Capturar ALTURA TRANSIÇÃO (pode estar disabled)
    const alturaTransicaoField = document.getElementById("altura-transicao");
    if (alturaTransicaoField) {
      // Se o campo estiver disabled, garantir que o valor seja 1
      if (alturaTransicaoField.disabled) {
        workData["ALTURA TRANSIÇÃO"] = "1";
      } else {
        workData["ALTURA TRANSIÇÃO"] = alturaTransicaoField.value || "1";
      }
    }

    // Capturar campos que podem estar disabled por regras de transição monolítica
    const cortinaAlturaField = document.getElementById("cortina-altura");
    if (cortinaAlturaField) {
      workData["CORTINA ALTURA"] = cortinaAlturaField.value;
    }

    const aparelhoApoioField = document.getElementById("tipo-aparelho-apoio");
    if (aparelhoApoioField) {
      workData["TIPO APARELHO APOIO"] = aparelhoApoioField.value;
    }

    // Capturar campos de superestrutura que podem estar disabled
    const tipoSuperestruturaField = document.getElementById(
      "tipo-superestrutura"
    );
    if (tipoSuperestruturaField) {
      workData["TIPO SUPERESTRUTURA"] = tipoSuperestruturaField.value;
    }

    const qtdLongarinasField = document.getElementById("qtd-longarinas");
    if (qtdLongarinasField) {
      workData["QTD LONGARINAS"] = qtdLongarinasField.value;
    }

    const qtdTransversinasField = document.getElementById("qtd-transversinas");
    if (qtdTransversinasField) {
      workData["QTD TRANSVERSINAS"] = qtdTransversinasField.value;
    }

    const tipoTransversinaField = document.getElementById("tipo-transversina");
    if (tipoTransversinaField) {
      workData["TIPO DE TRANSVERSINA"] = tipoTransversinaField.value;
    }

    const alturaLongarinaField = document.getElementById("altura-longarina");
    if (alturaLongarinaField) {
      workData["ALTURA LONGARINA"] = alturaLongarinaField.value;
    }

    // Capturar deslocamentos que podem estar disabled
    const deslocEsqEncontroField = document.getElementById(
      "deslocamento-esquerdo-encontro-laje"
    );
    if (deslocEsqEncontroField) {
      workData["DESLOCAMENTO ESQUERDO ENCONTRO LAJE"] =
        deslocEsqEncontroField.value;
    }

    const deslocDirEncontroField = document.getElementById(
      "deslocamento-direito-encontro-laje"
    );
    if (deslocDirEncontroField) {
      workData["DESLOCAMENTO DIREITO ENCONTRO LAJE"] =
        deslocDirEncontroField.value;
    }

    const deslocEsqSuperField = document.getElementById(
      "deslocamento-esquerdo"
    );
    if (deslocEsqSuperField) {
      workData["DESLOCAMENTO ESQUERDO"] = deslocEsqSuperField.value;
    }

    const deslocDirSuperField = document.getElementById("deslocamento-direito");
    if (deslocDirSuperField) {
      workData["DESLOCAMENTO DIREITO"] = deslocDirSuperField.value;
    }

    // Formatar LOTE antes de salvar
    if (workData["LOTE"] && typeof formatLote === "function") {
      workData["LOTE"] = formatLote(workData["LOTE"]);
    }

    // Tramos
    const tramosValues = [];
    document.querySelectorAll(".tramo-field").forEach((field) => {
      tramosValues.push(field.value || "0.50");
    });
    workData["COMPRIMENTO TRAMOS"] = tramosValues.join(";");

    // Apoios - altura, largura e comprimento
    const apoiosAlturas = [];
    const apoiosLarguras = [];
    const apoiosComprimentos = [];

    document.querySelectorAll(".apoio-altura-field").forEach((field) => {
      apoiosAlturas.push(field.value || "0.00");
    });

    document.querySelectorAll(".apoio-larg-field").forEach((field) => {
      apoiosLarguras.push(field.value || "0.00");
    });

    document.querySelectorAll(".apoio-comp-field").forEach((field) => {
      apoiosComprimentos.push(field.value || "0.00");
    });

    workData["ALTURA APOIO"] = apoiosAlturas.join(";");
    workData["LARGURA PILAR"] = apoiosLarguras.join(";");
    workData["COMPRIMENTO PILARES"] = apoiosComprimentos.join(";");

    // ========== CORREÇÃO AUTOMÁTICA ==========
    // Se QTD LONGARINAS = 1 (seção caixão), força ESPESSURA LONGARINA = 1
    const qtdLongarinas = parseInt(workData["QTD LONGARINAS"]) || 0;
    if (qtdLongarinas === 1) {
      workData["ESPESSURA LONGARINA"] = "1";
    }

    // Se QTD LONGARINAS = 0, aplicar regras especiais
    if (qtdLongarinas === 0) {
      workData["QTD TRANSVERSINAS"] = "0";
      workData["TIPO DE TRANSVERSINA"] = "Nenhum";
      workData["ALTURA LONGARINA"] = "0.5";
      workData["DESLOCAMENTO ESQUERDO"] = "1";
      workData["DESLOCAMENTO DIREITO"] = "1";
      workData["REFORCO VIGA"] = "FALSE";
      workData["ESPESSURA TRANSVERSINA"] = "0.25";
      workData["TIPO SUPERESTRUTURA"] = "ENGASTADA";
    }

    // Aplicar regras de monolítico (qtd transversinas = 0, altura/espessura >= 0.5)
    applyMonolithicRules(workData);
    // ==========================================

    const transaction = db.transaction(["obras"], "readwrite");
    const objectStore = transaction.objectStore("obras");
    const request = objectStore.put(workData);

    request.onsuccess = function () {
      alert("Obra salva com sucesso!");
      currentWorkCode = workData.CODIGO;
      loadWorksList();
      closeSummaryModal();
    };

    request.onerror = function (event) {
      console.error("Erro ao salvar obra:", event.target.error);
      alert("Erro ao salvar obra: " + event.target.error);
    };
  } catch (error) {
    console.error("Erro ao salvar obra:", error);
    alert("Erro ao salvar obra: " + error.message);
  }
}

// Carregar obra
function loadWork(codigo) {
  try {
    if (!db) {
      alert("Banco de dados não disponível.");
      return;
    }

    const transaction = db.transaction(["obras"], "readonly");
    const objectStore = transaction.objectStore("obras");
    const request = objectStore.get(codigo);

    request.onsuccess = function (event) {
      const work = event.target.result;
      if (!work) {
        alert("Obra não encontrada.");
        return;
      }

      // Limpar formulário antes de carregar nova obra para evitar dados de outras obras
      if (typeof clearFormSilent === "function") {
        clearFormSilent();
      }

      loadWorkToForm(work);
      currentWorkCode = codigo;

      // Marcar a obra como selecionada na lista
      const workItems = document.querySelectorAll(".work-item");
      workItems.forEach((item) => {
        if (item.getAttribute("data-code") === codigo) {
          item.classList.add("selected");
        } else {
          item.classList.remove("selected");
        }
      });
    };

    request.onerror = function (event) {
      console.error("Erro ao carregar obra:", event.target.error);
      alert("Erro ao carregar obra: " + event.target.error);
    };
  } catch (error) {
    console.error("Erro ao carregar obra:", error);
    alert("Erro ao carregar obra: " + error.message);
  }
}

// Deletar obra
function deleteWork(codigo, event) {
  if (event) {
    event.stopPropagation();
  }

  if (!confirm(`Tem certeza que deseja excluir a obra ${codigo}?`)) {
    return;
  }

  if (!db) {
    alert("Banco de dados não disponível.");
    return;
  }

  const transaction = db.transaction(["obras"], "readwrite");
  const objectStore = transaction.objectStore("obras");
  const request = objectStore.delete(codigo);

  request.onsuccess = function () {
    alert("Obra excluída com sucesso!");
    if (currentWorkCode === codigo) {
      currentWorkCode = null;
      if (typeof clearFormSilent === "function") {
        clearFormSilent();
      }
    }
    loadWorksList();
  };

  request.onerror = function () {
    alert("Erro ao excluir obra.");
  };
}

// Criar nova obra
function createNewWork() {
  if (confirm("Deseja criar uma nova obra? Dados não salvos serão perdidos.")) {
    clearForm();
    currentWorkCode = null;
  }
}

// Limpar banco de dados
function clearDatabase() {
  // Primeira confirmação
  if (!confirm("⚠️ ATENÇÃO: Isso irá apagar TODAS as obras permanentemente!")) {
    return;
  }

  // Segunda confirmação para segurança
  if (!confirm("Você tem CERTEZA ABSOLUTA? Esta ação NÃO pode ser desfeita!")) {
    return;
  }

  if (!db) {
    console.error("Banco de dados não inicializado");
    alert(
      "❌ Banco de dados não disponível. Recarregue a página e tente novamente."
    );
    return;
  }

  try {
    console.log("Iniciando limpeza do banco de dados...");
    const transaction = db.transaction(["obras"], "readwrite");
    const objectStore = transaction.objectStore("obras");
    const request = objectStore.clear();

    request.onsuccess = function () {
      console.log("Banco de dados limpo com sucesso!");
      alert(
        "✅ Banco de dados limpo com sucesso! Todas as obras foram removidas."
      );
      currentWorkCode = null;

      // Usar clearFormSilent para não ter confirmação dupla
      if (typeof clearFormSilent === "function") {
        clearFormSilent();
      }

      loadWorksList();
    };

    request.onerror = function (event) {
      console.error("Erro ao limpar banco de dados:", event.target.error);
      alert("❌ Erro ao limpar banco de dados: " + event.target.error);
    };

    transaction.oncomplete = function () {
      console.log("Transação de limpeza concluída");
    };

    transaction.onerror = function (event) {
      console.error("Erro na transação:", event.target.error);
      alert("❌ Erro na transação: " + event.target.error);
    };
  } catch (error) {
    console.error("Erro ao acessar banco de dados:", error);
    alert("❌ Erro ao acessar banco de dados: " + error.message);
  }
}

// Filtrar obras
function filterWorks() {
  const codigoFilter = document
    .getElementById("filter-works")
    .value.toLowerCase();
  const loteFilter = document.getElementById("filter-lote").value.toLowerCase();

  if (!db) return;

  const transaction = db.transaction(["obras"], "readonly");
  const objectStore = transaction.objectStore("obras");
  const request = objectStore.getAll();

  request.onsuccess = function (event) {
    const works = event.target.result;
    const worksList = document.getElementById("works-list");

    if (!worksList) return;

    const filtered = works.filter(
      (work) =>
        work.CODIGO.toLowerCase().includes(codigoFilter) &&
        (work.LOTE || "").toLowerCase().includes(loteFilter)
    );

    if (filtered.length === 0) {
      worksList.innerHTML =
        '<div class="work-item">Nenhuma obra encontrada</div>';
      return;
    }

    worksList.innerHTML = "";

    filtered.forEach((work) => {
      const workItem = document.createElement("div");
      workItem.className = "work-item";
      const modeladoIcon =
        work.MODELADO === "TRUE"
          ? '<span class="modelado-check">✓</span>'
          : '<span class="no-check"></span>';

      // Formatar LOTE para exibição
      const loteFormatado =
        work.LOTE && typeof formatLote === "function"
          ? formatLote(work.LOTE)
          : work.LOTE || "N/A";

      workItem.innerHTML = `
        <span>${modeladoIcon}${work.CODIGO} - Lote: ${loteFormatado}</span>
        <div>
          <button class="copy-btn" onclick="loadWork('${work.CODIGO}')">Editar</button>
          <button class="delete-btn" onclick="deleteWork('${work.CODIGO}')">Excluir</button>
        </div>
      `;

      worksList.appendChild(workItem);
    });
  };
}

// Toggle painel de obras
document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggle-works-panel");
  const worksPanel = document.getElementById("works-panel");

  if (toggleBtn && worksPanel) {
    toggleBtn.addEventListener("click", function () {
      if (worksPanel.style.display === "none") {
        worksPanel.style.display = "block";
        toggleBtn.textContent = "Esconder Obras";
      } else {
        worksPanel.style.display = "none";
        toggleBtn.textContent = "Mostrar Obras";
      }
    });
  }

  // Inicializar campo altura transição ao carregar a página
  if (typeof updateAlturaTransicaoField === "function") {
    setTimeout(() => {
      updateAlturaTransicaoField();
    }, 100);
  }

  // Adicionar event listeners para validar altura quando campos relevantes mudarem
  const alturaLongarinaField = document.getElementById("altura-longarina");
  if (alturaLongarinaField) {
    alturaLongarinaField.addEventListener("input", function() {
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
    });
    alturaLongarinaField.addEventListener("blur", function() {
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
    });
  }

  const alturaTransicaoField = document.getElementById("altura-transicao");
  if (alturaTransicaoField) {
    alturaTransicaoField.addEventListener("input", function() {
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
    });
    alturaTransicaoField.addEventListener("blur", function() {
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
    });
  }

  const tipoAparelhoApoioField = document.getElementById("tipo-aparelho-apoio");
  if (tipoAparelhoApoioField) {
    tipoAparelhoApoioField.addEventListener("change", function() {
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
    });
  }

  const alturaField = document.getElementById("altura");
  if (alturaField) {
    alturaField.addEventListener("input", function() {
      // VALIDAÇÃO: Altura nunca pode ser zero
      const altura = parseFloat(alturaField.value) || 0;
      if (altura === 0 || altura < 0.01) {
        alturaField.value = "";
        return;
      }
      
      // Sincronizar altura transição quando tipo for MONOLÍTICO e houver tramo
      const tipoEncontroField = document.getElementById("tipo-encontro");
      const qtdTramosField = document.getElementById("qtd-tramos");
      const alturaTransicaoField = document.getElementById("altura-transicao");
      
      if (tipoEncontroField && qtdTramosField && alturaTransicaoField) {
        const tipoEncontro = tipoEncontroField.value;
        const qtdTramos = parseInt(qtdTramosField.value) || 0;
        
        if (tipoEncontro === "MONOLITICO" && qtdTramos > 0) {
          if (altura > 0) {
            alturaTransicaoField.value = altura.toFixed(2);
          }
        }
      }
      
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
    });
    alturaField.addEventListener("blur", function() {
      // VALIDAÇÃO: Altura nunca pode ser zero
      const altura = parseFloat(alturaField.value) || 0;
      if (altura === 0 || altura < 0.01) {
        alturaField.value = "";
        alturaField.classList.add("error");
        const errorElement = document.getElementById("altura-sum-error");
        if (errorElement) {
          errorElement.innerHTML = "A altura não pode ser zero. Por favor, informe um valor válido (mínimo 0.01m).";
          errorElement.style.display = "block";
        }
        return;
      }
      
      // Sincronizar altura transição quando tipo for MONOLÍTICO e houver tramo
      const tipoEncontroField = document.getElementById("tipo-encontro");
      const qtdTramosField = document.getElementById("qtd-tramos");
      const alturaTransicaoField = document.getElementById("altura-transicao");
      
      if (tipoEncontroField && qtdTramosField && alturaTransicaoField) {
        const tipoEncontro = tipoEncontroField.value;
        const qtdTramos = parseInt(qtdTramosField.value) || 0;
        
        if (tipoEncontro === "MONOLITICO" && qtdTramos > 0) {
          if (altura > 0) {
            alturaTransicaoField.value = altura.toFixed(2);
          }
        }
      }
      
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
    });
  }

  // Listener para qtd-tramos (quando mudar, recalcular validação de altura)
  const qtdTramosField = document.getElementById("qtd-tramos");
  if (qtdTramosField) {
    qtdTramosField.addEventListener("change", function() {
      setTimeout(() => {
        // Sincronizar alturas quando tipo for MONOLÍTICO e houver tramo
        const tipoEncontroField = document.getElementById("tipo-encontro");
        const alturaField = document.getElementById("altura");
        const alturaTransicaoField = document.getElementById("altura-transicao");
        
        if (tipoEncontroField && alturaField && alturaTransicaoField) {
          const tipoEncontro = tipoEncontroField.value;
          const qtdTramos = parseInt(qtdTramosField.value) || 0;
          
          if (tipoEncontro === "MONOLITICO" && qtdTramos > 0) {
            // Se altura transição já tiver valor, sincronizar para altura
            const alturaTransicao = parseFloat(alturaTransicaoField.value) || 0;
            if (alturaTransicao > 0 && alturaTransicao >= 0.01) {
              alturaField.value = alturaTransicao.toFixed(2);
            } else {
              // Se altura já tiver valor, sincronizar para altura transição
              const altura = parseFloat(alturaField.value) || 0;
              if (altura > 0 && altura >= 0.01) {
                alturaTransicaoField.value = altura.toFixed(2);
              }
            }
          }
        }
        
        if (typeof validateMinimumHeight === "function") {
          validateMinimumHeight();
        }
      }, 150); // Aguardar campos serem regenerados
    });
  }

  // Listener para tipo-encontro (já tem onchange no HTML, mas garantir validação de altura)
  const tipoEncontroField = document.getElementById("tipo-encontro");
  if (tipoEncontroField) {
    tipoEncontroField.addEventListener("change", function() {
      // Sincronizar alturas quando tipo for MONOLÍTICO e houver tramo
      const qtdTramosField = document.getElementById("qtd-tramos");
      const alturaField = document.getElementById("altura");
      const alturaTransicaoField = document.getElementById("altura-transicao");
      
      if (qtdTramosField && alturaField && alturaTransicaoField) {
        const tipoEncontro = tipoEncontroField.value;
        const qtdTramos = parseInt(qtdTramosField.value) || 0;
        
        if (tipoEncontro === "MONOLITICO" && qtdTramos > 0) {
          // Se altura transição já tiver valor, sincronizar para altura
          const alturaTransicao = parseFloat(alturaTransicaoField.value) || 0;
          if (alturaTransicao > 0 && alturaTransicao >= 0.01) {
            alturaField.value = alturaTransicao.toFixed(2);
          } else {
            // Se altura já tiver valor, sincronizar para altura transição
            const altura = parseFloat(alturaField.value) || 0;
            if (altura > 0 && altura >= 0.01) {
              alturaTransicaoField.value = altura.toFixed(2);
            }
          }
        }
      }
      
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
      if (typeof validateTransitionMinimumHeight === "function") {
        validateTransitionMinimumHeight();
      }
    });
  }

  // Listener para validar altura mínima da transição quando tipo for APOIO
  // E sincronizar altura quando tipo for MONOLÍTICO e houver tramo
  if (alturaTransicaoField) {
    alturaTransicaoField.addEventListener("input", function() {
      // Sincronizar altura quando tipo for MONOLÍTICO e houver tramo
      const tipoEncontroField = document.getElementById("tipo-encontro");
      const qtdTramosField = document.getElementById("qtd-tramos");
      const alturaField = document.getElementById("altura");
      
      if (tipoEncontroField && qtdTramosField && alturaField) {
        const tipoEncontro = tipoEncontroField.value;
        const qtdTramos = parseInt(qtdTramosField.value) || 0;
        
        if (tipoEncontro === "MONOLITICO" && qtdTramos > 0) {
          const alturaTransicao = parseFloat(alturaTransicaoField.value) || 0;
          if (alturaTransicao > 0 && alturaTransicao >= 0.01) {
            alturaField.value = alturaTransicao.toFixed(2);
          }
        }
      }
      
      if (typeof validateTransitionMinimumHeight === "function") {
        validateTransitionMinimumHeight();
      }
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
    });
    alturaTransicaoField.addEventListener("blur", function() {
      // Sincronizar altura quando tipo for MONOLÍTICO e houver tramo
      const tipoEncontroField = document.getElementById("tipo-encontro");
      const qtdTramosField = document.getElementById("qtd-tramos");
      const alturaField = document.getElementById("altura");
      
      if (tipoEncontroField && qtdTramosField && alturaField) {
        const tipoEncontro = tipoEncontroField.value;
        const qtdTramos = parseInt(qtdTramosField.value) || 0;
        
        if (tipoEncontro === "MONOLITICO" && qtdTramos > 0) {
          const alturaTransicao = parseFloat(alturaTransicaoField.value) || 0;
          if (alturaTransicao > 0 && alturaTransicao >= 0.01) {
            alturaField.value = alturaTransicao.toFixed(2);
          }
        }
      }
      
      if (typeof validateTransitionMinimumHeight === "function") {
        validateTransitionMinimumHeight();
      }
      if (typeof validateMinimumHeight === "function") {
        validateMinimumHeight();
      }
    });
  }

  const cortinaAlturaField = document.getElementById("cortina-altura");
  if (cortinaAlturaField) {
    cortinaAlturaField.addEventListener("input", function() {
      if (typeof validateTransitionMinimumHeight === "function") {
        validateTransitionMinimumHeight();
      }
    });
    cortinaAlturaField.addEventListener("blur", function() {
      if (typeof validateTransitionMinimumHeight === "function") {
        validateTransitionMinimumHeight();
      }
    });
  }

  const alturaTravessaField = document.getElementById("altura-travessa");
  if (alturaTravessaField) {
    alturaTravessaField.addEventListener("input", function() {
      if (typeof validateTransitionMinimumHeight === "function") {
        validateTransitionMinimumHeight();
      }
    });
    alturaTravessaField.addEventListener("blur", function() {
      if (typeof validateTransitionMinimumHeight === "function") {
        validateTransitionMinimumHeight();
      }
    });
  }
});

// Sistema de abas
function initTabSystem() {
  const tabs = document.querySelectorAll(".tab");

  if (tabs.length === 0) {
    console.error("Nenhuma aba encontrada na página!");
    return;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function (event) {
      event.preventDefault();

      const tabId = this.getAttribute("data-tab");

      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      this.classList.add("active");

      const tabContent = document.getElementById(tabId + "-content");
      if (tabContent) {
        tabContent.classList.add("active");
      }
    });
  });

  const activeTab = document.querySelector(".tab.active");
  if (!activeTab && tabs.length > 0) {
    tabs[0].click();
  }
}

// Lembrete de salvamento
function showSaveReminder() {
  try {
    const reminder = document.getElementById("save-reminder");
    if (reminder) {
      reminder.style.display = "block";

      // Ocultar o lembrete após 5 segundos
      setTimeout(function () {
        reminder.style.display = "none";
      }, 5000);
    }
  } catch (error) {
    console.error("Erro ao mostrar lembrete:", error);
  }
}

function startSaveReminders() {
  try {
    // Mostrar lembrete a cada 5 minutos
    saveReminderInterval = setInterval(showSaveReminder, 5 * 60 * 1000);
  } catch (error) {
    console.error("Erro ao iniciar lembretes:", error);
  }
}

// Atualizar contadores de obras
function updateWorksCounter(total, modeled, pending) {
  const totalElement = document.getElementById("total-works");
  const modeledElement = document.getElementById("modeled-works");
  const pendingElement = document.getElementById("pending-works");

  if (totalElement) totalElement.textContent = total;
  if (modeledElement) modeledElement.textContent = modeled;
  if (pendingElement) pendingElement.textContent = pending;
}

// ===== EASTER EGG: BOTÃO EXPORTAR JSON =====
let refreshClickCount = 0;
let refreshClickTimeout = null;

function trackRefreshClicks() {
  refreshClickCount++;

  // Resetar contador após 3 segundos de inatividade
  if (refreshClickTimeout) {
    clearTimeout(refreshClickTimeout);
  }

  refreshClickTimeout = setTimeout(() => {
    if (refreshClickCount < 5) {
      refreshClickCount = 0;
    }
  }, 3000);

  // Revelar botão após 5 cliques
  if (refreshClickCount >= 5) {
    revealExportJsonButton();
    refreshClickCount = 0; // Resetar contador
  }
}

function revealExportJsonButton() {
  const exportJsonBtn = document.getElementById("export-json-btn");

  if (exportJsonBtn && exportJsonBtn.classList.contains("hidden-feature")) {
    exportJsonBtn.classList.remove("hidden-feature");

    // Adicionar animação de revelação
    exportJsonBtn.style.animation = "fadeInScale 0.5s ease-out";
  }
}

// Adicionar animação CSS dinamicamente
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;
document.head.appendChild(style);

// Controlar visibilidade dos campos de bloco sapata
function initBlocoSapataVisibility() {
  const tipoSelect = document.getElementById("tipo-bloco-sapata");
  const alturaGroup = document.getElementById("altura-bloco-sapata-group");
  const larguraGroup = document.getElementById("largura-bloco-sapata-group");
  const comprimentoGroup = document.getElementById(
    "comprimento-bloco-sapata-group"
  );

  if (!tipoSelect || !alturaGroup || !larguraGroup || !comprimentoGroup) {
    return;
  }

  function toggleBlocoSapataFields() {
    const selectedValue = tipoSelect.value;
    const shouldShow =
      selectedValue ===
      window.CONSTANTS.TIPO_BLOCO_SAPATA.BLOCO_SAPATA_CONCRETO_ARMADO;

    alturaGroup.style.display = shouldShow ? "block" : "none";
    larguraGroup.style.display = shouldShow ? "block" : "none";
    comprimentoGroup.style.display = shouldShow ? "block" : "none";

    // Limpar valores dos campos quando ocultados
    if (!shouldShow) {
      document.getElementById("altura-bloco-sapata").value = "";
      document.getElementById("largura-bloco-sapata").value = "";
      document.getElementById("comprimento-bloco-sapata").value = "";
    }
  }

  // Aplicar visibilidade inicial
  toggleBlocoSapataFields();

  // Adicionar listener para mudanças no select
  tipoSelect.addEventListener("change", toggleBlocoSapataFields);
}

// Controlar exclusão mútua entre barreiras e guarda rodas
function initBarreiraGuardaRodasExclusion() {
  const barreiraEsquerda = document.getElementById("tipo-barreira-esquerda");
  const guardaRodasEsquerdo = document.getElementById("guarda-rodas-esquerdo");
  const barreiraDireita = document.getElementById("tipo-barreira-direita");
  const guardaRodasDireito = document.getElementById("guarda-rodas-direito");

  if (
    !barreiraEsquerda ||
    !guardaRodasEsquerdo ||
    !barreiraDireita ||
    !guardaRodasDireito
  ) {
    return;
  }

  // Função para verificar se uma barreira impede guarda rodas
  function isBarreiraExcludente(value) {
    return (
      value === window.CONSTANTS.TIPO_BARREIRA.BARREIRA_NEW_JERSEY ||
      value === window.CONSTANTS.TIPO_BARREIRA.BARREIRA_COM_GUARDA_CORPO
    );
  }

  // Lado ESQUERDO
  barreiraEsquerda.addEventListener("change", function () {
    if (isBarreiraExcludente(this.value)) {
      // Barreira excludente selecionada: bloquear guarda-rodas
      guardaRodasEsquerdo.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
      guardaRodasEsquerdo.disabled = true;
      guardaRodasEsquerdo.style.opacity = "0.6";
      guardaRodasEsquerdo.style.cursor = "not-allowed";
    } else {
      // Barreira removida ou não-excludente: reabilitar guarda-rodas se não houver calçada
      const calcadaEsquerda = document.getElementById("tipo-calcada-esquerda");
      const hasCalcadaSelecionada =
        calcadaEsquerda &&
        calcadaEsquerda.value ===
          window.CONSTANTS.TIPO_CALCADA.CALCADA_PEDESTRES_CONCRETO_ARMADO;

      if (!hasCalcadaSelecionada) {
        guardaRodasEsquerdo.disabled = false;
        guardaRodasEsquerdo.style.opacity = "1";
        guardaRodasEsquerdo.style.cursor = "pointer";
      }
    }
  });

  guardaRodasEsquerdo.addEventListener("change", function () {
    if (
      this.value !== window.CONSTANTS.VALORES_COMUNS.VAZIO &&
      this.value !== window.CONSTANTS.VALORES_COMUNS.NENHUM
    ) {
      if (isBarreiraExcludente(barreiraEsquerda.value)) {
        barreiraEsquerda.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
      }
      barreiraEsquerda.disabled = true;
      barreiraEsquerda.style.opacity = "0.6";
      barreiraEsquerda.style.cursor = "not-allowed";
      // Remover opções excludentes temporariamente
      Array.from(barreiraEsquerda.options).forEach((option) => {
        if (isBarreiraExcludente(option.value)) {
          option.disabled = true;
        }
      });
    } else {
      barreiraEsquerda.disabled = false;
      barreiraEsquerda.style.opacity = "1";
      barreiraEsquerda.style.cursor = "pointer";
      // Reabilitar opções
      Array.from(barreiraEsquerda.options).forEach((option) => {
        option.disabled = false;
      });
    }
  });

  // Lado DIREITO
  barreiraDireita.addEventListener("change", function () {
    if (isBarreiraExcludente(this.value)) {
      guardaRodasDireito.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
      guardaRodasDireito.disabled = true;
      guardaRodasDireito.style.opacity = "0.6";
      guardaRodasDireito.style.cursor = "not-allowed";
    } else {
      // Só reabilitar se não houver calçada selecionada
      const calcadaDireita = document.getElementById("tipo-calcada-direita");
      const hasCalcadaSelecionada =
        calcadaDireita &&
        calcadaDireita.value ===
          window.CONSTANTS.TIPO_CALCADA.CALCADA_PEDESTRES_CONCRETO_ARMADO;

      if (!hasCalcadaSelecionada) {
        guardaRodasDireito.disabled = false;
        guardaRodasDireito.style.opacity = "1";
        guardaRodasDireito.style.cursor = "pointer";
      }
    }
  });

  guardaRodasDireito.addEventListener("change", function () {
    if (
      this.value !== window.CONSTANTS.VALORES_COMUNS.VAZIO &&
      this.value !== window.CONSTANTS.VALORES_COMUNS.NENHUM
    ) {
      if (isBarreiraExcludente(barreiraDireita.value)) {
        barreiraDireita.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
      }
      barreiraDireita.disabled = true;
      barreiraDireita.style.opacity = "0.6";
      barreiraDireita.style.cursor = "not-allowed";
      // Remover opções excludentes temporariamente
      Array.from(barreiraDireita.options).forEach((option) => {
        if (isBarreiraExcludente(option.value)) {
          option.disabled = true;
        }
      });
    } else {
      barreiraDireita.disabled = false;
      barreiraDireita.style.opacity = "1";
      barreiraDireita.style.cursor = "pointer";
      // Reabilitar opções
      Array.from(barreiraDireita.options).forEach((option) => {
        option.disabled = false;
      });
    }
  });

  // Aplicar estado inicial
  if (isBarreiraExcludente(barreiraEsquerda.value)) {
    guardaRodasEsquerdo.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
    guardaRodasEsquerdo.disabled = true;
    guardaRodasEsquerdo.style.opacity = "0.6";
    guardaRodasEsquerdo.style.cursor = "not-allowed";
  }

  if (isBarreiraExcludente(barreiraDireita.value)) {
    guardaRodasDireito.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
    guardaRodasDireito.disabled = true;
    guardaRodasDireito.style.opacity = "0.6";
    guardaRodasDireito.style.cursor = "not-allowed";
  }

  if (
    guardaRodasEsquerdo.value !== window.CONSTANTS.VALORES_COMUNS.VAZIO &&
    guardaRodasEsquerdo.value !== window.CONSTANTS.VALORES_COMUNS.NENHUM
  ) {
    if (isBarreiraExcludente(barreiraEsquerda.value)) {
      barreiraEsquerda.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
    }
    barreiraEsquerda.disabled = true;
    barreiraEsquerda.style.opacity = "0.6";
    barreiraEsquerda.style.cursor = "not-allowed";
    Array.from(barreiraEsquerda.options).forEach((option) => {
      if (isBarreiraExcludente(option.value)) {
        option.disabled = true;
      }
    });
  }

  if (
    guardaRodasDireito.value !== window.CONSTANTS.VALORES_COMUNS.VAZIO &&
    guardaRodasDireito.value !== window.CONSTANTS.VALORES_COMUNS.NENHUM
  ) {
    if (isBarreiraExcludente(barreiraDireita.value)) {
      barreiraDireita.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
    }
    barreiraDireita.disabled = true;
    barreiraDireita.style.opacity = "0.6";
    barreiraDireita.style.cursor = "not-allowed";
    Array.from(barreiraDireita.options).forEach((option) => {
      if (isBarreiraExcludente(option.value)) {
        option.disabled = true;
      }
    });
  }
}

// Controlar exclusão mútua entre calçada e guarda rodas
function initCalcadaGuardaRodasExclusion() {
  const calcadaEsquerda = document.getElementById("tipo-calcada-esquerda");
  const guardaRodasEsquerdo = document.getElementById("guarda-rodas-esquerdo");
  const calcadaDireita = document.getElementById("tipo-calcada-direita");
  const guardaRodasDireito = document.getElementById("guarda-rodas-direito");

  if (
    !calcadaEsquerda ||
    !guardaRodasEsquerdo ||
    !calcadaDireita ||
    !guardaRodasDireito
  ) {
    return;
  }

  // Função para verificar se calçada está selecionada
  function hasCalcada(value) {
    return (
      value === window.CONSTANTS.TIPO_CALCADA.CALCADA_PEDESTRES_CONCRETO_ARMADO
    );
  }

  // Lado ESQUERDO
  calcadaEsquerda.addEventListener("change", function () {
    if (hasCalcada(this.value)) {
      guardaRodasEsquerdo.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
      guardaRodasEsquerdo.disabled = true;
      guardaRodasEsquerdo.style.opacity = "0.6";
      guardaRodasEsquerdo.style.cursor = "not-allowed";
    } else {
      // Só reabilitar se não houver barreira excludente selecionada
      const barreiraEsquerda = document.getElementById(
        "tipo-barreira-esquerda"
      );
      const isBarreiraExcludente = (value) => {
        return (
          value === window.CONSTANTS.TIPO_BARREIRA.BARREIRA_NEW_JERSEY ||
          value === window.CONSTANTS.TIPO_BARREIRA.BARREIRA_COM_GUARDA_CORPO
        );
      };
      const hasBarreiraExcludente =
        barreiraEsquerda && isBarreiraExcludente(barreiraEsquerda.value);

      if (!hasBarreiraExcludente) {
        guardaRodasEsquerdo.disabled = false;
        guardaRodasEsquerdo.style.opacity = "1";
        guardaRodasEsquerdo.style.cursor = "pointer";
      }
    }
  });

  guardaRodasEsquerdo.addEventListener("change", function () {
    if (
      this.value !== window.CONSTANTS.VALORES_COMUNS.VAZIO &&
      this.value !== window.CONSTANTS.VALORES_COMUNS.NENHUM
    ) {
      if (hasCalcada(calcadaEsquerda.value)) {
        calcadaEsquerda.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
      }
      calcadaEsquerda.disabled = true;
      calcadaEsquerda.style.opacity = "0.6";
      calcadaEsquerda.style.cursor = "not-allowed";
      // Desabilitar opção de calçada
      Array.from(calcadaEsquerda.options).forEach((option) => {
        if (hasCalcada(option.value)) {
          option.disabled = true;
        }
      });
    } else {
      calcadaEsquerda.disabled = false;
      calcadaEsquerda.style.opacity = "1";
      calcadaEsquerda.style.cursor = "pointer";
      // Reabilitar opções
      Array.from(calcadaEsquerda.options).forEach((option) => {
        option.disabled = false;
      });
    }
  });

  // Lado DIREITO
  calcadaDireita.addEventListener("change", function () {
    if (hasCalcada(this.value)) {
      guardaRodasDireito.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
      guardaRodasDireito.disabled = true;
      guardaRodasDireito.style.opacity = "0.6";
      guardaRodasDireito.style.cursor = "not-allowed";
    } else {
      // Só reabilitar se não houver barreira excludente selecionada
      const barreiraDireita = document.getElementById("tipo-barreira-direita");
      const isBarreiraExcludente = (value) => {
        return (
          value === window.CONSTANTS.TIPO_BARREIRA.BARREIRA_NEW_JERSEY ||
          value === window.CONSTANTS.TIPO_BARREIRA.BARREIRA_COM_GUARDA_CORPO
        );
      };
      const hasBarreiraExcludente =
        barreiraDireita && isBarreiraExcludente(barreiraDireita.value);

      if (!hasBarreiraExcludente) {
        guardaRodasDireito.disabled = false;
        guardaRodasDireito.style.opacity = "1";
        guardaRodasDireito.style.cursor = "pointer";
      }
    }
  });

  guardaRodasDireito.addEventListener("change", function () {
    if (
      this.value !== window.CONSTANTS.VALORES_COMUNS.VAZIO &&
      this.value !== window.CONSTANTS.VALORES_COMUNS.NENHUM
    ) {
      if (hasCalcada(calcadaDireita.value)) {
        calcadaDireita.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
      }
      calcadaDireita.disabled = true;
      calcadaDireita.style.opacity = "0.6";
      calcadaDireita.style.cursor = "not-allowed";
      // Desabilitar opção de calçada
      Array.from(calcadaDireita.options).forEach((option) => {
        if (hasCalcada(option.value)) {
          option.disabled = true;
        }
      });
    } else {
      calcadaDireita.disabled = false;
      calcadaDireita.style.opacity = "1";
      calcadaDireita.style.cursor = "pointer";
      // Reabilitar opções
      Array.from(calcadaDireita.options).forEach((option) => {
        option.disabled = false;
      });
    }
  });

  // Aplicar estado inicial
  if (hasCalcada(calcadaEsquerda.value)) {
    guardaRodasEsquerdo.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
    guardaRodasEsquerdo.disabled = true;
    guardaRodasEsquerdo.style.opacity = "0.6";
    guardaRodasEsquerdo.style.cursor = "not-allowed";
  }

  if (hasCalcada(calcadaDireita.value)) {
    guardaRodasDireito.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
    guardaRodasDireito.disabled = true;
    guardaRodasDireito.style.opacity = "0.6";
    guardaRodasDireito.style.cursor = "not-allowed";
  }

  if (
    guardaRodasEsquerdo.value !== window.CONSTANTS.VALORES_COMUNS.VAZIO &&
    guardaRodasEsquerdo.value !== window.CONSTANTS.VALORES_COMUNS.NENHUM
  ) {
    if (hasCalcada(calcadaEsquerda.value)) {
      calcadaEsquerda.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
    }
    calcadaEsquerda.disabled = true;
    calcadaEsquerda.style.opacity = "0.6";
    calcadaEsquerda.style.cursor = "not-allowed";
    Array.from(calcadaEsquerda.options).forEach((option) => {
      if (hasCalcada(option.value)) {
        option.disabled = true;
      }
    });
  }

  if (
    guardaRodasDireito.value !== window.CONSTANTS.VALORES_COMUNS.VAZIO &&
    guardaRodasDireito.value !== window.CONSTANTS.VALORES_COMUNS.NENHUM
  ) {
    if (hasCalcada(calcadaDireita.value)) {
      calcadaDireita.value = window.CONSTANTS.VALORES_COMUNS.NENHUM;
    }
    calcadaDireita.disabled = true;
    calcadaDireita.style.opacity = "0.6";
    calcadaDireita.style.cursor = "not-allowed";
    Array.from(calcadaDireita.options).forEach((option) => {
      if (hasCalcada(option.value)) {
        option.disabled = true;
      }
    });
  }
}

// Atualizar link do Google Maps baseado nas coordenadas
function updateGoogleMapsLink() {
  const latInput = document.getElementById("latitude");
  const longInput = document.getElementById("longitude");
  const mapsLink = document.getElementById("google-maps-link");

  if (!latInput || !longInput || !mapsLink) return;

  const lat = latInput.value;
  const long = longInput.value;

  // Verificar se ambos os valores existem e não são strings vazias
  // Aceita 0 como valor válido
  const hasValidLat = lat !== null && lat !== undefined && lat !== "";
  const hasValidLong = long !== null && long !== undefined && long !== "";

  if (hasValidLat && hasValidLong) {
    // Atualizar href e mostrar link
    mapsLink.href = `https://www.google.com.br/maps?q=${lat},${long}`;
    mapsLink.style.display = "inline-block";
  } else {
    // Ocultar link
    mapsLink.href = "#";
    mapsLink.style.display = "none";
  }
}

// Inicializar monitoramento de coordenadas para Google Maps
function initGoogleMapsListener() {
  const latInput = document.getElementById("latitude");
  const longInput = document.getElementById("longitude");

  if (latInput && longInput) {
    latInput.addEventListener("input", updateGoogleMapsLink);
    longInput.addEventListener("input", updateGoogleMapsLink);

    // Atualizar link inicial
    updateGoogleMapsLink();
  }
}

// Inicializar formatação automática do campo LOTE
function initLoteFormatting() {
  const loteField = document.getElementById("lote");

  if (loteField) {
    loteField.addEventListener("blur", function () {
      if (this.value && typeof formatLote === "function") {
        this.value = formatLote(this.value);
      }
    });
  }
}

// Inicializar listener no campo comprimento para atualizar soma dos tramos
function initComprimentoListener() {
  const comprimentoField = document.getElementById("comprimento");

  if (comprimentoField) {
    comprimentoField.addEventListener("input", function () {
      if (typeof updateTramosSum === "function") {
        updateTramosSum();
      }
    });

    comprimentoField.addEventListener("blur", function () {
      if (typeof updateTramosSum === "function") {
        updateTramosSum();
      }
    });
  }
}

// Inicializar validação de altura-travessa em tempo real
function initAlturaTravessaValidation() {
  const alturaTravessaField = document.getElementById("altura-travessa");
  const tipoTravessaField = document.getElementById("tipo-travessa");
  const infoMessage = document.getElementById("altura-travessa-info");

  // Controlar visibilidade da mensagem informativa
  function toggleTravessaInfoMessage() {
    if (!tipoTravessaField || !infoMessage) return;

    const hasTravessa =
      tipoTravessaField.value !== "" && tipoTravessaField.value !== "Nenhum";
    infoMessage.style.display = hasTravessa ? "block" : "none";
  }

  // Adicionar listener ao select de tipo-travessa
  if (tipoTravessaField) {
    tipoTravessaField.addEventListener("change", function () {
      toggleTravessaInfoMessage();
      if (typeof validateField === "function") {
        validateField("altura-travessa");
      }
    });

    // Aplicar estado inicial
    toggleTravessaInfoMessage();
  }

  // Validação em tempo real no campo altura-travessa
  if (alturaTravessaField) {
    alturaTravessaField.addEventListener("input", function () {
      if (typeof validateField === "function") {
        validateField("altura-travessa");
      }
    });

    alturaTravessaField.addEventListener("blur", function () {
      if (typeof validateField === "function") {
        validateField("altura-travessa");
      }
    });
  }
}

// Inicialização principal
document.addEventListener("DOMContentLoaded", function () {
  initDB();
  initTabSystem();
  startSaveReminders(); // Iniciar lembretes de salvamento
  initBlocoSapataVisibility(); // Inicializar controle de visibilidade do bloco sapata
  initBarreiraGuardaRodasExclusion(); // Inicializar exclusão mútua entre barreiras e guarda rodas
  initCalcadaGuardaRodasExclusion(); // Inicializar exclusão mútua entre calçada e guarda rodas
  initGoogleMapsListener(); // Inicializar monitoramento de coordenadas para Google Maps
  initAlturaTravessaValidation(); // Inicializar validação de altura-travessa em tempo real
  initLoteFormatting(); // Inicializar formatação automática do campo LOTE
  initComprimentoListener(); // Inicializar listener de comprimento para soma dos tramos
  if (typeof validateSuperstructureType === "function") {
    validateSuperstructureType(); // Inicializar validação de tipo de superestrutura
  }

  // Inicializar regras de transição monolítica
  if (typeof initMonolithicTransitionListeners === "function") {
    initMonolithicTransitionListeners();
  }
});

// Expor funções globalmente
window.initDB = initDB;
window.loadWorksList = loadWorksList;
window.updateWorksCounter = updateWorksCounter;
window.trackRefreshClicks = trackRefreshClicks;
window.revealExportJsonButton = revealExportJsonButton;
window.saveCurrentWork = saveCurrentWork;
window.loadWork = loadWork;
window.updateGoogleMapsLink = updateGoogleMapsLink;
window.initGoogleMapsListener = initGoogleMapsListener;
window.initAlturaTravessaValidation = initAlturaTravessaValidation;
window.initLoteFormatting = initLoteFormatting;
window.initComprimentoListener = initComprimentoListener;
window.deleteWork = deleteWork;
window.createNewWork = createNewWork;
window.clearDatabase = clearDatabase;
window.filterWorks = filterWorks;
window.showSaveReminder = showSaveReminder;
window.startSaveReminders = startSaveReminders;
window.initTabSystem = initTabSystem;

// Controlar campo ALTURA TRANSIÇÃO baseado no TIPO ENCONTRO
function updateAlturaTransicaoField() {
  try {
    const tipoEncontroField = document.getElementById("tipo-encontro");
    const alturaTransicaoField = document.getElementById("altura-transicao");
    const alturaTransicaoLabel = document.getElementById("altura-transicao-label");
    const alturaTransicaoError = document.getElementById("altura-transicao-error");

    if (!tipoEncontroField || !alturaTransicaoField) return;

    const tipoEncontro = tipoEncontroField.value;

    // Se for "Nenhum" ou vazio, bloquear campo e definir como 1 metro
    if (tipoEncontro === "Nenhum" || tipoEncontro === "") {
      alturaTransicaoField.disabled = true;
      alturaTransicaoField.value = "1";
      
      // Remover classe required do label
      if (alturaTransicaoLabel) {
        alturaTransicaoLabel.classList.remove("required");
      }
      
      // Esconder mensagem de erro
      if (alturaTransicaoError) {
        alturaTransicaoError.classList.remove("visible");
        alturaTransicaoField.classList.remove("error");
      }
    } else {
      // Se for diferente de "Nenhum", desbloquear campo
      alturaTransicaoField.disabled = false;
      
      // Adicionar classe required ao label
      if (alturaTransicaoLabel) {
        alturaTransicaoLabel.classList.add("required");
      }
      
      // Sincronizar alturas quando tipo for MONOLÍTICO e houver tramo
      const qtdTramosField = document.getElementById("qtd-tramos");
      const alturaField = document.getElementById("altura");
      
      if (tipoEncontro === "MONOLITICO" && qtdTramosField && alturaField) {
        const qtdTramos = parseInt(qtdTramosField.value) || 0;
        
        if (qtdTramos > 0) {
          // Se altura transição já tiver valor, sincronizar para altura
          const alturaTransicao = parseFloat(alturaTransicaoField.value) || 0;
          if (alturaTransicao > 0 && alturaTransicao >= 0.01) {
            alturaField.value = alturaTransicao.toFixed(2);
          } else {
            // Se altura já tiver valor, sincronizar para altura transição
            const altura = parseFloat(alturaField.value) || 0;
            if (altura > 0 && altura >= 0.01) {
              alturaTransicaoField.value = altura.toFixed(2);
            }
          }
        }
      }
      
      // Se o campo estiver vazio, manter vazio (será validado como obrigatório)
      // Se já tiver valor, manter o valor
    }

    // Atualizar validação de altura quando altura transição mudar
    // (mas sem ativar a flag de formSubmitAttempted)
    if (typeof validateMinimumHeight === "function") {
      validateMinimumHeight();
    }

    // REMOVIDO: Não validar formulário completo ao alterar campo
    // A validação só deve ocorrer quando o usuário tentar salvar
    // if (typeof validateForm === "function") {
    //   validateForm();
    // }
  } catch (error) {
    console.error("Erro ao atualizar campo altura transição:", error);
  }
}

window.updateAlturaTransicaoField = updateAlturaTransicaoField;
