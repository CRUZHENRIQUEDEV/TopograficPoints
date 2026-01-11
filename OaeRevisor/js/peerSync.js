/**
 * PeerJS Synchronization Module - OAE Revisor
 * Comunicação em tempo real entre avaliador e inspetor
 */

const PeerSync = {
  peer: null,
  connection: null,
  isConnected: false,
  isHost: false,
  remotePeerId: null,
  connectionCode: null,

  // Configuração dos servidores STUN/TURN
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
    debug: 2, // 0: none, 1: errors, 2: warnings, 3: all
  },

  /**
   * Inicializa o PeerJS
   */
  async init() {
    try {
      // Gera ID único baseado no código da obra e timestamp
      const workCode = appState.work.codigo || "sem-codigo";
      const timestamp = Date.now();
      const peerId = `oae-${workCode}-${timestamp}`;

      this.peer = new Peer(peerId, this.config);

      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        this.peer.on("open", (id) => {
          console.log("PeerJS conectado com ID:", id);
          this.connectionCode = this.generateConnectionCode(id);
          resolve(id);
        });

        this.peer.on("error", (err) => {
          console.error("Erro no PeerJS:", err);
          reject(err);
        });
      });
    } catch (error) {
      console.error("Falha ao inicializar PeerJS:", error);
      throw error;
    }
  },

  /**
   * Configura os event listeners do PeerJS
   */
  setupEventListeners() {
    // Receber conexões entrantes
    this.peer.on("connection", (conn) => {
      console.log("Conexão recebida de:", conn.peer);
      this.handleConnection(conn);
    });

    // Chamadas de voz/vídeo (futuro)
    this.peer.on("call", (call) => {
      console.log("Chamada recebida de:", call.peer);
      // Implementar se necessário no futuro
    });
  },

  /**
   * Conecta-se a outro peer usando o código de conexão
   */
  async connectToPeer(connectionCode) {
    try {
      const remotePeerId = this.decodeConnectionCode(connectionCode);

      if (!remotePeerId) {
        throw new Error("Código de conexão inválido");
      }

      console.log("Tentando conectar com:", remotePeerId);
      const conn = this.peer.connect(remotePeerId);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout de conexão"));
        }, 10000);

        conn.on("open", () => {
          clearTimeout(timeout);
          this.handleConnection(conn);
          this.isHost = false;
          resolve(conn);
        });

        conn.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    } catch (error) {
      console.error("Erro ao conectar com peer:", error);
      throw error;
    }
  },

  /**
   * Manipula conexão estabelecida
   */
  handleConnection(conn) {
    this.connection = conn;
    this.remotePeerId = conn.peer;

    // Setup event listeners da conexão
    conn.on("open", () => {
      this.isConnected = true;
      console.log("Conexão P2P estabelecida com:", conn.peer);
      this.updateConnectionStatus("connected");

      // Envia estado inicial
      this.sendState();
    });

    conn.on("data", (data) => {
      this.handleIncomingData(data);
    });

    conn.on("close", () => {
      this.isConnected = false;
      console.log("Conexão encerrada com:", conn.peer);
      this.updateConnectionStatus("disconnected");
    });

    conn.on("error", (err) => {
      console.error("Erro na conexão:", err);
      this.updateConnectionStatus("error");
    });
  },

  /**
   * Processa dados recebidos
   */
  handleIncomingData(data) {
    console.log("Dados recebidos:", data.type);

    switch (data.type) {
      case "state_update":
        this.handleStateUpdate(data.payload);
        break;
      case "message":
        this.handleRemoteMessage(data.payload);
        break;
      case "error_added":
        this.handleRemoteError(data.payload);
        break;
      case "error_resolved":
        this.handleRemoteErrorResolved(data.payload);
        break;
      case "typing":
        this.handleTypingIndicator(data.payload);
        break;
      default:
        console.warn("Tipo de mensagem desconhecido:", data.type);
    }
  },

  /**
   * Envia estado completo para o peer remoto
   */
  sendState() {
    if (!this.isConnected) return;

    const stateData = {
      type: "state_update",
      payload: {
        work: appState.work,
        errors: appState.errors,
        elementErrors: appState.elementErrors,
        anexoErrors: appState.anexoErrors,
        mensagens: appState.mensagens,
        completionStates: Array.from(appState.completionStates),
        messageResponses: Array.from(appState.messageResponses),
        role: appState.role,
        timestamp: Date.now(),
      },
    };

    this.connection.send(stateData);
  },

  /**
   * Envia mensagem em tempo real
   */
  sendMessage(messageData) {
    if (!this.isConnected) return;

    const data = {
      type: "message",
      payload: messageData,
    };

    this.connection.send(data);
  },

  /**
   * Notifica sobre novo erro adicionado
   */
  notifyErrorAdded(errorData) {
    if (!this.isConnected) return;

    const data = {
      type: "error_added",
      payload: errorData,
    };

    this.connection.send(data);
  },

  /**
   * Notifica sobre erro resolvido
   */
  notifyErrorResolved(errorId) {
    if (!this.isConnected) return;

    const data = {
      type: "error_resolved",
      payload: { errorId, timestamp: Date.now() },
    };

    this.connection.send(data);
  },

  /**
   * Envia indicador de digitação
   */
  sendTyping(isTyping) {
    if (!this.isConnected) return;

    const data = {
      type: "typing",
      payload: {
        isTyping,
        user: appState.role === "avaliador" ? "Avaliador" : "Inspetor",
        timestamp: Date.now(),
      },
    };

    this.connection.send(data);
  },

  /**
   * Processa atualização de estado remoto
   */
  handleStateUpdate(payload) {
    // Merge inteligente do estado
    if (payload.work) {
      // Preserva campos locais que não devem ser sobrescritos
      const localAvaliador = appState.work.avaliador;
      Object.assign(appState.work, payload.work);
      if (localAvaliador && !payload.work.avaliador) {
        appState.work.avaliador = localAvaliador;
      }
    }

    if (payload.errors) appState.errors = payload.errors;
    if (payload.elementErrors) appState.elementErrors = payload.elementErrors;
    if (payload.anexoErrors) appState.anexoErrors = payload.anexoErrors;
    if (payload.mensagens) appState.mensagens = payload.mensagens;
    if (payload.completionStates)
      appState.completionStates = new Map(payload.completionStates);
    if (payload.messageResponses)
      appState.messageResponses = new Map(payload.messageResponses);

    // Atualiza UI
    Sync.loadState();
    UI.renderAll();

    // Mostra notificação
    this.showNotification("Dados sincronizados com sucesso", "success");
  },

  /**
   * Processa mensagem remota
   */
  handleRemoteMessage(messageData) {
    // Adiciona mensagem ao estado local
    appState.mensagens.push(messageData);

    // Atualiza UI
    UI.renderMessages();
    AutoSave.trigger();

    // Notificação sonora (opcional)
    this.playNotificationSound();
  },

  /**
   * Processa erro remoto adicionado
   */
  handleRemoteError(errorData) {
    // Adiciona erro ao estado local
    if (errorData.fieldId) {
      appState.errors[errorData.fieldId] = errorData;
    } else if (errorData.elementId) {
      appState.elementErrors.push(errorData);
    }

    // Atualiza UI
    UI.renderAll();
    AutoSave.trigger();

    // Notificação
    this.showNotification(
      `Nova inconsistência apontada: ${errorData.label}`,
      "warning"
    );
  },

  /**
   * Processa erro remoto resolvido
   */
  handleRemoteErrorResolved(payload) {
    const { errorId } = payload;

    // Atualiza estado de conclusão
    appState.completionStates.set(errorId, true);

    // Atualiza UI
    UI.renderMessages();
    AutoSave.trigger();

    // Notificação
    this.showNotification("Inconsistência marcada como resolvida", "success");
  },

  /**
   * Processa indicador de digitação
   */
  handleTypingIndicator(payload) {
    const typingIndicator = document.getElementById("remoteTypingIndicator");
    if (typingIndicator) {
      if (payload.isTyping) {
        typingIndicator.textContent = `${payload.user} está digitando...`;
        typingIndicator.style.display = "block";

        // Auto-hide após 3 segundos
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
          typingIndicator.style.display = "none";
        }, 3000);
      } else {
        typingIndicator.style.display = "none";
      }
    }
  },

  /**
   * Gera código de conexão amigável
   */
  generateConnectionCode(peerId) {
    // Simples hash para criar código curto
    const hash = btoa(peerId)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 8);
    return hash.toUpperCase();
  },

  /**
   * Decodifica código de conexão
   */
  decodeConnectionCode(code) {
    // Implementação simplificada - em produção usar sistema robusto
    try {
      const decoded = atob(code.toLowerCase());
      if (decoded.startsWith("oae-")) {
        return decoded;
      }
    } catch (e) {
      console.error("Erro ao decodificar código:", e);
    }
    return null;
  },

  /**
   * Atualiza status da conexão na UI
   */
  updateConnectionStatus(status) {
    const statusElement = document.getElementById("peerConnectionStatus");
    const statusText = document.getElementById("peerConnectionText");

    if (!statusElement || !statusText) return;

    switch (status) {
      case "connected":
        statusElement.className = "connection-status connected";
        statusText.textContent = "Conectado";
        break;
      case "disconnected":
        statusElement.className = "connection-status disconnected";
        statusText.textContent = "Desconectado";
        break;
      case "error":
        statusElement.className = "connection-status error";
        statusText.textContent = "Erro de conexão";
        break;
      case "connecting":
        statusElement.className = "connection-status connecting";
        statusText.textContent = "Conectando...";
        break;
    }
  },

  /**
   * Mostra notificação na UI
   */
  showNotification(message, type = "info") {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = message;
      toast.className = `toast ${type}`;
      toast.style.display = "block";

      setTimeout(() => {
        toast.style.display = "none";
      }, 3000);
    }
  },

  /**
   * Reproduz som de notificação (opcional)
   */
  playNotificationSound() {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
      );
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignora erros de autoplay
    } catch (e) {
      // Silencioso se não conseguir reproduzir
    }
  },

  /**
   * Encerra conexão e limpa recursos
   */
  disconnect() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.isConnected = false;
    this.remotePeerId = null;
    this.updateConnectionStatus("disconnected");
  },

  /**
   * Verifica se está conectado
   */
  isPeerConnected() {
    return this.isConnected && this.connection && this.connection.open;
  },
};

// Export para uso global
window.PeerSync = PeerSync;
