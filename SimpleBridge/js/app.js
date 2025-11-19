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
        const objectStore = database.createObjectStore("obras", { keyPath: "CODIGO" });
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
          const pontesStore = database.createObjectStore("pontes", { keyPath: "Id" });
          pontesStore.createIndex("CodigoSgo", "CodigoSgo", { unique: true });
          pontesStore.createIndex("Uf", "Uf", { unique: false });
          pontesStore.createIndex("Br", "Br", { unique: false });
        }
      }
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      console.log("Banco de dados inicializado com sucesso");
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
      worksList.innerHTML = '<div class="work-item">Nenhuma obra cadastrada</div>';
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

      workItem.innerHTML = `
        <span>${checkIcon}${work.CODIGO} - Lote: ${work.LOTE || "N/A"} - ${work.NOME || "Sem nome"}</span>
        <button type="button" class="delete-btn" onclick="deleteWork('${work.CODIGO}', event)">Excluir</button>
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
    console.log("=== TENTANDO SALVAR OBRA ===");
    const { isValid, missingFields } = validateForm();
    
    console.log(`Validação: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    console.log(`Campos faltando: ${missingFields.length}`, missingFields);
    
    if (!isValid) {
      console.error("❌ BLOQUEADO: Não é possível salvar com campos inválidos");
      alert("❌ ERRO: Não é possível salvar!\n\nCampos obrigatórios faltando:\n" + missingFields.join("\n"));
      closeSummaryModal();
      return;
    }
    
    console.log("✅ Validação passou, prosseguindo com salvamento...");

    const form = document.getElementById("oae-form");
    const formData = new FormData(form);
    const workData = {};

    for (let [key, value] of formData.entries()) {
      if (!key.startsWith("tramo-") && !key.startsWith("apoio-")) {
        workData[key] = value;
      }
    }

    workData["MODELADO"] = document.getElementById("modelado").checked ? "TRUE" : "FALSE";
    workData["REFORCO VIGA"] = document.getElementById("beam-reinforcement").checked;

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
      if (typeof clearFormSilent === 'function') {
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
      if (typeof clearFormSilent === 'function') {
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
    alert("❌ Banco de dados não disponível. Recarregue a página e tente novamente.");
    return;
  }

  try {
    console.log("Iniciando limpeza do banco de dados...");
    const transaction = db.transaction(["obras"], "readwrite");
    const objectStore = transaction.objectStore("obras");
    const request = objectStore.clear();

    request.onsuccess = function () {
      console.log("Banco de dados limpo com sucesso!");
      alert("✅ Banco de dados limpo com sucesso! Todas as obras foram removidas.");
      currentWorkCode = null;
      
      // Usar clearFormSilent para não ter confirmação dupla
      if (typeof clearFormSilent === 'function') {
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
  const codigoFilter = document.getElementById("filter-works").value.toLowerCase();
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
        work.CODIGO.toLowerCase().includes(codigoFilter) && (work.LOTE || "").toLowerCase().includes(loteFilter)
    );

    if (filtered.length === 0) {
      worksList.innerHTML = '<div class="work-item">Nenhuma obra encontrada</div>';
      return;
    }

    worksList.innerHTML = "";

    filtered.forEach((work) => {
      const workItem = document.createElement("div");
      workItem.className = "work-item";
      const modeladoIcon = work.MODELADO === "TRUE" ? '<span class="modelado-check">✓</span>' : '<span class="no-check"></span>';

      workItem.innerHTML = `
        <span>${modeladoIcon}${work.CODIGO} - Lote: ${work.LOTE || "N/A"}</span>
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

      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

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
const style = document.createElement('style');
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

// Inicialização principal
document.addEventListener("DOMContentLoaded", function () {
  initDB();
  initTabSystem();
  startSaveReminders(); // Iniciar lembretes de salvamento
});

// Expor funções globalmente
window.initDB = initDB;
window.loadWorksList = loadWorksList;
window.updateWorksCounter = updateWorksCounter;
window.trackRefreshClicks = trackRefreshClicks;
window.revealExportJsonButton = revealExportJsonButton;
window.saveCurrentWork = saveCurrentWork;
window.loadWork = loadWork;
window.deleteWork = deleteWork;
window.createNewWork = createNewWork;
window.clearDatabase = clearDatabase;
window.filterWorks = filterWorks;
window.showSaveReminder = showSaveReminder;
window.startSaveReminders = startSaveReminders;
window.initTabSystem = initTabSystem;
