/**
 * Synchronization Module - OAE Revisor
 */

const Sync = {
  init() {
    this.setupBiBinding();
    this.syncFromDOM();
    this.setupAvaliadorField();
  },

  setupBiBinding() {
    // Generic binding for single fields (Identificação, Rotas, etc)
    const handleInput = (e) => {
      const target = e.target;

      // Handle data-sync (Direct properties in appState.work)
      if (target.dataset.sync) {
        appState.work[target.dataset.sync] = target.value;

        // UI Refresh for specific fields
        if (target.id === "obraCodigo" || target.id === "obraNome") {
          UI.updateReport();
          this.updateWorkTitle();
        }

        // Envia alteração via MultiPeerSync se conectado
        if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
          MultiPeerSync.broadcastState();
        }

        AutoSave.trigger();
      }

      // Handle data-field (Field inconsistencies mapping)
      if (target.dataset.field) {
        appState.work.fields[target.dataset.field] = target.value;

        // Envia alteração via MultiPeerSync se conectado
        if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
          MultiPeerSync.broadcastState();
        }

        AutoSave.trigger();
      }
    };

    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleInput);
  },

  syncFromDOM() {
    // Sync data-sync fields
    document.querySelectorAll("[data-sync]").forEach((el) => {
      if (el.value) {
        appState.work[el.dataset.sync] = el.value;
      }
    });

    // Sync data-field fields
    document.querySelectorAll("[data-field]").forEach((el) => {
      if (el.value) {
        appState.work.fields[el.dataset.field] = el.value;
      }
    });

    // Sync tramos num
    const tramosEl = document.getElementById("numTramosGlobal");
    if (tramosEl) {
      appState.work.numTramos = parseInt(tramosEl.value) || 1;
    }

    this.updateWorkTitle();
    console.log("Sync: State synchronized from DOM");
  },

  updateWorkTitle() {
    const titleEl = document.getElementById("workTitle");
    if (!titleEl) return;

    const nome = appState.work.nome || "";
    const codigo = appState.work.codigo ? `- [${appState.work.codigo}]` : "";
    titleEl.textContent = `${nome} ${codigo}`.trim();
  },

  updateTramos(num) {
    appState.work.numTramos = num;
    UI.renderTramosTable();
    AutoSave.trigger();
  },

  // Load state into DOM
  loadState() {
    // 1. Root properties
    document.querySelectorAll("[data-sync]").forEach((el) => {
      el.value = appState.work[el.dataset.sync] || "";
    });

    // 2. Complex fields
    document.querySelectorAll("[data-field]").forEach((el) => {
      el.value = appState.work.fields[el.dataset.field] || "";
    });

    // 3. Tramos Num
    document.getElementById("numTramosGlobal").value = appState.work.numTramos;

    // 4. Aspects (Checkboxes)
    if (appState.work.aspects) {
      Object.keys(appState.work.aspects).forEach((id) => {
        const cb = document.getElementById("asp_" + id);
        if (cb) cb.checked = appState.work.aspects[id].checked || false;
      });
    }

    // 5. Tramos Table
    UI.renderTramosTable();

    // 6. Badges (Red ⚠ markers)
    UI.updateFieldVisuals();

    // 7. Auto-fill avaliador name and lock for inspetores
    this.setupAvaliadorField();
  },

  /**
   * Configura o campo de Nome do Avaliador baseado no usuário logado
   */
  setupAvaliadorField() {
    const avaliadorField = document.getElementById("avaliadorNome");
    if (!avaliadorField || !window.AuthSystem || !AuthSystem.isLoggedIn) return;

    const currentUser = AuthSystem.currentUser;
    const isInspetor = currentUser.role === AuthSystem.ROLES.INSPETOR;

    // Se o campo está vazio, preenche automaticamente com o nome do usuário logado
    if (!avaliadorField.value && currentUser.name) {
      avaliadorField.value = currentUser.name;
      appState.work.avaliador = currentUser.name;
    }

    // Se for inspetor, bloqueia o campo
    if (isInspetor) {
      avaliadorField.disabled = true;
      avaliadorField.style.backgroundColor = "var(--bg-secondary)";
      avaliadorField.style.cursor = "not-allowed";
      avaliadorField.title = "Campo bloqueado para inspetores";
    } else {
      avaliadorField.disabled = false;
      avaliadorField.style.backgroundColor = "";
      avaliadorField.style.cursor = "";
      avaliadorField.title = "";
    }
  },

  syncFromDB(data) {
    if (!data) return;

    // Merge data into appState
    appState.work = data.work || appState.work;
    appState.errors = data.errors || {};
    appState.elementErrors = data.elementErrors || [];
    appState.anexoErrors = data.anexoErrors || [];
    appState.mensagens = data.mensagens || [];

    // Convert arrays/objects back to Maps (IndexedDB serializes Maps as arrays)
    if (data.completionStates) {
      if (data.completionStates instanceof Map) {
        appState.completionStates = data.completionStates;
      } else if (Array.isArray(data.completionStates)) {
        appState.completionStates = new Map(data.completionStates);
      } else {
        appState.completionStates = new Map(Object.entries(data.completionStates));
      }
    } else {
      appState.completionStates = new Map();
    }

    if (data.messageResponses) {
      if (data.messageResponses instanceof Map) {
        appState.messageResponses = data.messageResponses;
      } else if (Array.isArray(data.messageResponses)) {
        appState.messageResponses = new Map(data.messageResponses);
      } else {
        appState.messageResponses = new Map(Object.entries(data.messageResponses));
      }
    } else {
      appState.messageResponses = new Map();
    }

    this.loadState();
    UI.renderAll();
  },
};
