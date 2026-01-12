/**
 * Multi-Peer Synchronization Module - OAE Revisor
 * Rede P2P multi-usuário com sincronização em cascata
 */

const MultiPeerSync = {
  // Identidade do usuário
  userId: null,
  userEmail: null,
  userName: null,

  // PeerJS principal
  peer: null,

  // Conexões ativas
  connections: new Map(), // peerId -> connection

  // Rede de pares conhecidos
  knownPeers: new Set(),

  // Estado de sincronização
  syncState: {
    lastSync: new Map(), // peerId -> timestamp
    pendingUpdates: new Map(), // peerId -> updates[]
    conflictResolution: new Map(), // dataId -> resolution
  },

  // Configuração
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
    debug: 2,
  },

  /**
   * Inicializa o sistema multi-peer
   */
  async init(userEmail, userName) {
    try {
      // Configura identidade do usuário
      this.userId = this.generateUserId(userEmail);
      this.userEmail = userEmail;
      this.userName = userName;

      // Salva identidade localmente
      localStorage.setItem("oae-user-id", this.userId);
      localStorage.setItem("oae-user-email", userEmail);
      localStorage.setItem("oae-user-name", userName);

      // Inicializa PeerJS com ID fixo
      const peerId = `oae-${this.userId}`;
      this.peer = new Peer(peerId, this.config);

      this.setupEventListeners();

      // Carrega pares conhecidos
      this.loadKnownPeers();

      // Tenta conectar com pares conhecidos
      this.connectToKnownPeers();

      return new Promise((resolve, reject) => {
        this.peer.on("open", (id) => {
          console.log("Multi-Peer iniciado:", id);
          resolve(id);
        });

        this.peer.on("error", (err) => {
          console.error("Erro no Multi-Peer:", err);
          reject(err);
        });
      });
    } catch (error) {
      console.error("Falha ao inicializar Multi-Peer:", error);
      throw error;
    }
  },

  /**
   * Gera ID fixo baseado no email
   */
  generateUserId(email) {
    // Hash simples do email para ID fixo
    const hash = btoa(email.toLowerCase())
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 12);
    return hash;
  },

  /**
   * Configura event listeners do PeerJS
   */
  setupEventListeners() {
    // Conexões entrantes
    this.peer.on("connection", (conn) => {
      console.log("Conexão recebida de:", conn.peer);
      this.handleConnection(conn);
    });

    // Chamadas (futuro)
    this.peer.on("call", (call) => {
      console.log("Chamada recebida de:", call.peer);
    });
  },

  /**
   * Manipula nova conexão
   */
  handleConnection(conn) {
    const peerId = conn.peer;
    this.connections.set(peerId, conn);
    this.knownPeers.add(peerId);

    // Setup event listeners da conexão
    conn.on("open", () => {
      console.log("Conexão aberta com:", peerId);
      this.updateConnectionStatus(peerId, "connected");

      // Envia estado inicial
      this.sendStateTo(peerId);

      // Solicita estado do peer recém-conectado (para garantir recebimento completo)
      setTimeout(() => {
        try {
          if (conn.open) {
            conn.send({ type: 'sync_request', payload: { source: this.userId, timestamp: Date.now() } });
          }
        } catch (e) {
          console.warn('Erro ao solicitar estado do peer:', e);
        }
      }, 800);

      this.notifyConnection(peerId, "connected");
    });

    conn.on("data", (data) => {
      this.handleIncomingData(peerId, data);
    });

    conn.on("close", () => {
      console.log("Conexão fechada com:", peerId);
      this.connections.delete(peerId);
      this.updateConnectionStatus(peerId, "disconnected");
      this.notifyConnection(peerId, "disconnected");
    });

    conn.on("error", (err) => {
      console.error("Erro na conexão com", peerId, ":", err);
      this.updateConnectionStatus(peerId, "error");
    });
  },

  /**
   * Processa dados recebidos
   */
  async handleIncomingData(fromPeerId, data) {
    console.log("Dados recebidos de", fromPeerId, ":", data.type);

    switch (data.type) {
      case "state_update":
        await this.handleStateUpdate(fromPeerId, data.payload);
        break;
      case "message":
        this.handleRemoteMessage(fromPeerId, data.payload);
        break;
      case "error_added":
        this.handleRemoteError(fromPeerId, data.payload);
        break;
      case "error_resolved":
        this.handleRemoteErrorResolved(fromPeerId, data.payload);
        break;
      case "typing":
        this.handleTypingIndicator(fromPeerId, data.payload);
        break;
      case "peer_discovery":
        this.handlePeerDiscovery(fromPeerId, data.payload);
        break;
      case "sync_request":
        await this.handleSyncRequest(fromPeerId, data.payload);
        break;
      case "users_sync":
        await this.handleUsersSync(fromPeerId, data.payload);
        break;
      case "user_added":
        await this.handleUserAdded(fromPeerId, data.payload);
        break;
      case "user_removed":
        await this.handleUserRemoved(fromPeerId, data.payload);
        break;
      case "user_updated":
        await this.handleUserUpdated(fromPeerId, data.payload);
        break;
      case "request_users_sync":
        await this.handleRequestUsersSync(fromPeerId);
        break;
      case "work_updated":
        await this.handleWorkUpdated(fromPeerId, data.payload);
        break;
      case "user_login":
        await this.handleUserLogin(fromPeerId, data.payload);
        break;
      default:
        console.warn("Tipo de mensagem desconhecido:", data.type);
    }

    // Atualiza timestamp de sincronização
    this.syncState.lastSync.set(fromPeerId, Date.now());
  },

  /**
   * Processa atualização de estado com merge inteligente
   */
  async handleStateUpdate(fromPeerId, payload) {
    const originalState = JSON.parse(JSON.stringify(appState));

    // Merge inteligente do estado
    await this.mergeState(payload, fromPeerId);

    // Propaga para outros pares (exceto origem)
    this.propagateUpdate(payload, fromPeerId);

    // Atualiza UI
    Sync.loadState();
    UI.renderAll();

    // Notificação
    this.showNotification(
      `Dados sincronizados de ${this.getPeerDisplayName(fromPeerId)}`,
      "success"
    );
  },

  /**
   * Merge inteligente de estados com resolução de conflitos
   */
  async mergeState(remoteState, fromPeerId) {
    // Work data
    if (remoteState.work) {
      await this.mergeWorkData(remoteState.work, fromPeerId);
    }

    // Errors
    if (remoteState.errors) {
      await this.mergeErrors(remoteState.errors, fromPeerId);
    }

    // Element errors
    if (remoteState.elementErrors) {
      await this.mergeElementErrors(remoteState.elementErrors, fromPeerId);
    }

    // Messages
    if (remoteState.mensagens) {
      await this.mergeMessages(remoteState.mensagens, fromPeerId);
    }

    // Completion states
    if (remoteState.completionStates) {
      await this.mergeCompletionStates(
        remoteState.completionStates,
        fromPeerId
      );
    }

    // Message responses
    if (remoteState.messageResponses) {
      await this.mergeMessageResponses(
        remoteState.messageResponses,
        fromPeerId
      );
    }
  },

  /**
   * Merge de dados da obra com resolução de conflitos
   */
  async mergeWorkData(remoteWork, fromPeerId) {
    // Para dados da obra, usamos "latest wins" baseado em timestamp
    if (
      !appState.work.lastModified ||
      remoteWork.lastModified > appState.work.lastModified
    ) {
      Object.assign(appState.work, remoteWork);
      appState.work.lastModified = remoteWork.lastModified || Date.now();
      appState.work.lastModifiedBy = fromPeerId;
    }
  },

  /**
   * Merge de erros de campo
   */
  async mergeErrors(remoteErrors, fromPeerId) {
    for (const [fieldId, error] of Object.entries(remoteErrors)) {
      if (!appState.errors[fieldId]) {
        appState.errors[fieldId] = { ...error, source: fromPeerId };
      } else {
        // Conflito: mantém o mais recente
        const existing = appState.errors[fieldId];
        if (!existing.timestamp || error.timestamp > existing.timestamp) {
          appState.errors[fieldId] = { ...error, source: fromPeerId };
        }
      }
    }
  },

  /**
   * Merge de erros de elemento
   */
  async mergeElementErrors(remoteElementErrors, fromPeerId) {
    const existingIds = new Set(appState.elementErrors.map((e) => e.id));

    for (const error of remoteElementErrors) {
      if (!existingIds.has(error.id)) {
        appState.elementErrors.push({ ...error, source: fromPeerId });
      }
    }
  },

  /**
   * Merge de mensagens
   */
  async mergeMessages(remoteMessages, fromPeerId) {
    const existingIds = new Set(appState.mensagens.map((m) => m.id));

    for (const message of remoteMessages) {
      if (!existingIds.has(message.id)) {
        appState.mensagens.push({ ...message, source: fromPeerId });
      }
    }
  },

  /**
   * Merge de estados de conclusão
   */
  async mergeCompletionStates(remoteStates, fromPeerId) {
    const remoteMap = new Map(remoteStates);

    for (const [id, completed] of remoteMap) {
      if (!appState.completionStates.has(id)) {
        appState.completionStates.set(id, completed);
      } else {
        // Se algum marcou como concluído, mantém concluído
        const current = appState.completionStates.get(id);
        appState.completionStates.set(id, current || completed);
      }
    }
  },

  /**
   * Merge de respostas de mensagens
   */
  async mergeMessageResponses(remoteResponses, fromPeerId) {
    const remoteMap = new Map(remoteResponses);

    for (const [id, response] of remoteMap) {
      if (!appState.messageResponses.has(id)) {
        appState.messageResponses.set(id, response);
      }
    }
  },

  /**
   * Propaga atualização para outros pares
   */
  propagateUpdate(data, excludePeerId) {
    const updateData = {
      ...data,
      propagatedFrom: excludePeerId,
      propagatedBy: this.userId,
      propagationTime: Date.now(),
    };

    for (const [peerId, conn] of this.connections) {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(updateData);
      }
    }
  },

  /**
   * Conecta-se a pares conhecidos
   */
  async connectToKnownPeers() {
    for (const peerId of this.knownPeers) {
      if (peerId !== this.peer.id && !this.connections.has(peerId)) {
        try {
          await this.connectToPeer(peerId);
        } catch (error) {
          console.warn("Falha ao conectar com", peerId, ":", error);
        }
      }
    }

    // After attempting to connect, request users and state from peers
    setTimeout(() => {
      try {
        this.requestUsersSync();
        this.requestAllStates();
      } catch (e) {
        console.warn('Error requesting initial sync:', e);
      }
    }, 1200);
  },

  /**
   * Connects to peers derived from local users list (auto-discovery by email)
   */
  connectToUsersFromLocalUsers() {
    try {
      const users = JSON.parse(localStorage.getItem('oae-users') || '[]');
      for (const user of users) {
        try {
          if (!user || !user.email) continue;
          const peerId = `oae-${this.generateUserId(user.email)}`;
          if (peerId === this.peer.id) continue;
          this.addKnownPeer(peerId, user.name || user.email);
        } catch (e) {
          console.warn('Invalid user entry when connecting to users:', e);
        }
      }
    } catch (error) {
      console.error('connectToUsersFromLocalUsers failed:', error);
    }
  },

  /**
   * Requests full state (work+errors+messages) from all connected peers
   */
  requestAllStates() {
    const data = {
      type: 'sync_request',
      payload: { source: this.userId, timestamp: Date.now() },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }

    console.log('📤 Solicitando estado completo de todos os peers conectados');
  },

  /**
   * Conecta-se a um peer específico
   */
  async connectToPeer(peerId) {
    if (this.connections.has(peerId)) {
      console.log("Já conectado com:", peerId);
      return;
    }

    try {
      console.log("Tentando conectar com:", peerId);
      const conn = this.peer.connect(peerId);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout de conexão"));
        }, 10000);

        conn.on("open", () => {
          clearTimeout(timeout);
          this.handleConnection(conn);
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
   * Adiciona peer conhecido
   */
  addKnownPeer(peerId, displayName = null) {
    this.knownPeers.add(peerId);

    // Salva informações do peer
    const peerInfo = {
      id: peerId,
      displayName: displayName || peerId,
      addedAt: Date.now(),
      lastSeen: null,
    };

    localStorage.setItem(`oae-peer-${peerId}`, JSON.stringify(peerInfo));
    this.saveKnownPeers();

    // Tenta conectar
    this.connectToPeer(peerId);
  },

  /**
   * Remove peer conhecido
   */
  removeKnownPeer(peerId) {
    this.knownPeers.delete(peerId);
    localStorage.removeItem(`oae-peer-${peerId}`);
    this.saveKnownPeers();

    // Desconecta se estiver conectado
    if (this.connections.has(peerId)) {
      this.connections.get(peerId).close();
    }
  },

  /**
   * Carrega pares conhecidos do localStorage
   */
  loadKnownPeers() {
    const stored = localStorage.getItem("oae-known-peers");
    if (stored) {
      const peers = JSON.parse(stored);
      this.knownPeers = new Set(peers);
    }
  },

  /**
   * Salva pares conhecidos no localStorage
   */
  saveKnownPeers() {
    localStorage.setItem(
      "oae-known-peers",
      JSON.stringify([...this.knownPeers])
    );
  },

  /**
   * Envia estado para peer específico
   */
  sendStateTo(peerId) {
    const conn = this.connections.get(peerId);
    if (!conn || !conn.open) return;

    const stateData = {
      type: "state_update",
      payload: {
        work: {
          ...appState.work,
          lastModified: Date.now(),
          lastModifiedBy: this.userId,
        },
        errors: appState.errors,
        elementErrors: appState.elementErrors,
        anexoErrors: appState.anexoErrors,
        mensagens: appState.mensagens,
        completionStates: Array.from(appState.completionStates),
        messageResponses: Array.from(appState.messageResponses),
        role: appState.role,
        timestamp: Date.now(),
        source: this.userId,
      },
    };

    conn.send(stateData);
  },

  /**
   * Envia estado para todos os pares conectados
   */
  broadcastState() {
    for (const peerId of this.connections.keys()) {
      this.sendStateTo(peerId);
    }
  },

  /**
   * Envia mensagem para todos os pares
   */
  broadcastMessage(messageData) {
    const data = {
      type: "message",
      payload: {
        ...messageData,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }
  },

  /**
   * Notifica sobre novo erro
   */
  broadcastErrorAdded(errorData) {
    const data = {
      type: "error_added",
      payload: {
        ...errorData,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }
  },

  /**
   * Notifica sobre erro resolvido
   */
  broadcastErrorResolved(errorId) {
    const data = {
      type: "error_resolved",
      payload: {
        errorId,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }
  },

  /**
   * Envia indicador de digitação
   */
  broadcastTyping(isTyping) {
    const data = {
      type: "typing",
      payload: {
        isTyping,
        user: this.userName,
        userId: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }
  },

  /**
   * Processa mensagem remota
   */
  handleRemoteMessage(fromPeerId, messageData) {
    // Adiciona ao estado local se não existir
    if (!appState.mensagens.find((m) => m.id === messageData.id)) {
      appState.mensagens.push({
        ...messageData,
        source: fromPeerId,
      });

      // Propaga para outros pares
      this.propagateUpdate(
        {
          type: "message",
          payload: messageData,
        },
        fromPeerId
      );

      // Atualiza UI
      UI.renderMessages();
      AutoSave.trigger();

      // Notificação
      this.playNotificationSound();
    }
  },

  /**
   * Processa erro remoto
   */
  handleRemoteError(fromPeerId, errorData) {
    // Adiciona se não existir
    if (errorData.fieldId && !appState.errors[errorData.fieldId]) {
      appState.errors[errorData.fieldId] = {
        ...errorData,
        source: fromPeerId,
      };
    } else if (
      errorData.elementId &&
      !appState.elementErrors.find((e) => e.id === errorData.elementId)
    ) {
      appState.elementErrors.push({
        ...errorData,
        source: fromPeerId,
      });
    }

    // Propaga para outros
    this.propagateUpdate(
      {
        type: "error_added",
        payload: errorData,
      },
      fromPeerId
    );

    // Atualiza UI
    UI.renderAll();
    AutoSave.trigger();

    // Notificação
    this.showNotification(
      `Nova inconsistência de ${this.getPeerDisplayName(fromPeerId)}: ${
        errorData.label
      }`,
      "warning"
    );
  },

  /**
   * Processa erro resolvido remotamente
   */
  handleRemoteErrorResolved(fromPeerId, payload) {
    const { errorId } = payload;

    // Atualiza estado
    appState.completionStates.set(errorId, true);

    // Propaga para outros
    this.propagateUpdate(
      {
        type: "error_resolved",
        payload,
      },
      fromPeerId
    );

    // Atualiza UI
    UI.renderMessages();
    AutoSave.trigger();

    // Notificação
    this.showNotification(
      `Inconsistência resolvida por ${this.getPeerDisplayName(fromPeerId)}`,
      "success"
    );
  },

  /**
   * Processa indicador de digitação
   */
  handleTypingIndicator(fromPeerId, payload) {
    const typingIndicator = document.getElementById("remoteTypingIndicator");
    if (typingIndicator) {
      if (payload.isTyping) {
        typingIndicator.textContent = `${payload.user} está digitando...`;
        typingIndicator.style.display = "block";

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
   * Processa descoberta de novos pares
   */
  handlePeerDiscovery(fromPeerId, payload) {
    for (const peerId of payload.peers) {
      if (!this.knownPeers.has(peerId) && peerId !== this.peer.id) {
        this.addKnownPeer(peerId);
      }
    }
  },

  /**
   * Processa requisição de sincronização
   */
  async handleSyncRequest(fromPeerId, payload) {
    // Envia estado completo para o peer solicitante
    this.sendStateTo(fromPeerId);
  },

  /**
   * Obtém nome de exibição do peer
   */
  getPeerDisplayName(peerId) {
    const peerInfo = localStorage.getItem(`oae-peer-${peerId}`);
    if (peerInfo) {
      const info = JSON.parse(peerInfo);
      return info.displayName || peerId;
    }
    return peerId;
  },

  /**
   * Atualiza status de conexão na UI
   */
  updateConnectionStatus(peerId, status) {
    // Implementar atualização na UI
    if (window.UI && UI.updatePeerConnectionStatus) {
      UI.updatePeerConnectionStatus(peerId, status);
    }
  },

  /**
   * Notifica sobre mudança de conexão
   */
  notifyConnection(peerId, status) {
    const displayName = this.getPeerDisplayName(peerId);
    const message =
      status === "connected"
        ? `Conectado com ${displayName}`
        : `Desconectado de ${displayName}`;

    this.showNotification(message, status === "connected" ? "success" : "info");
  },

  /**
   * Mostra notificação
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
   * Reproduz som de notificação
   */
  playNotificationSound() {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
      );
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Silencioso se não conseguir reproduzir
    }
  },

  /**
   * Obtém estatísticas da rede
   */
  getNetworkStats() {
    return {
      totalPeers: this.knownPeers.size,
      connectedPeers: this.connections.size,
      userId: this.userId,
      userName: this.userName,
      connections: [...this.connections.keys()],
      knownPeers: [...this.knownPeers],
    };
  },

  /**
   * Encerra todas as conexões
   */
  disconnect() {
    for (const [peerId, conn] of this.connections) {
      conn.close();
    }

    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  },

  /**
   * Verifica se está conectado a algum peer
   */
  hasConnections() {
    return this.connections.size > 0;
  },

  /**
   * Verifica se está conectado a um peer específico
   */
  isConnectedTo(peerId) {
    const conn = this.connections.get(peerId);
    return conn && conn.open;
  },

  // ========== SINCRONIZAÇÃO DE USUÁRIOS ==========

  /**
   * Sincroniza lista de usuários com todos os peers
   */
  broadcastUsers() {
    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");

    const data = {
      type: "users_sync",
      payload: {
        users: users,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }

    console.log("✅ Lista de usuários sincronizada com peers");
  },

  /**
   * Processa sincronização de usuários recebida
   */
  async handleUsersSync(fromPeerId, payload) {
    console.log(`📥 Recebendo sincronização de usuários de ${fromPeerId}`);

    const remoteUsers = payload.users;
    const localUsers = JSON.parse(localStorage.getItem("oae-users") || "[]");

    // Merge inteligente de usuários
    const mergedUsers = this.mergeUsers(localUsers, remoteUsers);

    // Salva usuários mesclados
    localStorage.setItem("oae-users", JSON.stringify(mergedUsers));

    console.log(
      `✅ ${mergedUsers.length} usuários sincronizados (${localUsers.length} local + ${remoteUsers.length} remoto)`
    );

    // Notificação
    this.showNotification(
      `Usuários sincronizados de ${this.getPeerDisplayName(fromPeerId)}`,
      "success"
    );
  },

  /**
   * Merge inteligente de listas de usuários
   */
  mergeUsers(localUsers, remoteUsers) {
    const merged = new Map();

    // Adiciona usuários locais (usa email em maiúsculo como chave para evitar duplicação)
    for (const user of localUsers) {
      const normalizedEmail = user.email.toUpperCase();
      merged.set(normalizedEmail, user);
    }

    // Mescla usuários remotos
    for (const remoteUser of remoteUsers) {
      const normalizedEmail = remoteUser.email.toUpperCase();
      const existingUser = merged.get(normalizedEmail);

      if (!existingUser) {
        // Novo usuário, adiciona (marca como autorizado permanentemente quando recebido via sync)
        merged.set(normalizedEmail, {
          ...remoteUser,
          syncedFrom: remoteUser.source || "remote",
          syncedAt: Date.now(),
          authorizedForever: true,
        });
      } else {
        // Usuário existe, usa o mais recente (baseado em updatedAt ou createdAt)
        const existingTime = new Date(
          existingUser.updatedAt || existingUser.createdAt || 0
        ).getTime();
        const remoteTime = new Date(
          remoteUser.updatedAt || remoteUser.createdAt || 0
        ).getTime();

        if (remoteTime > existingTime) {
          merged.set(normalizedEmail, {
            ...remoteUser,
            syncedFrom: remoteUser.source || "remote",
            syncedAt: Date.now(),
            authorizedForever: existingUser.authorizedForever || remoteUser.authorizedForever || true,
          });
        }
      }
    }

    return Array.from(merged.values());
  },

  /**
   * Notifica sobre novo usuário adicionado
   */
  broadcastUserAdded(user) {
    const data = {
      type: "user_added",
      payload: {
        user: user,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }

    console.log(`✅ Novo usuário "${user.name}" sincronizado com peers`);
  },

  /**
   * Processa novo usuário recebido
   */
  async handleUserAdded(fromPeerId, payload) {
    const newUser = payload.user;
    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");

    // Verifica se usuário já existe (case-insensitive)
    const normalizedNewEmail = newUser.email.toUpperCase();
    const exists = users.find((u) => u.email.toUpperCase() === normalizedNewEmail);

    if (!exists) {
      users.push({
        ...newUser,
        syncedFrom: fromPeerId,
        syncedAt: Date.now(),
        authorizedForever: true,
      });

      localStorage.setItem("oae-users", JSON.stringify(users));

      console.log(
        `✅ Novo usuário "${newUser.name}" adicionado de ${this.getPeerDisplayName(
          fromPeerId
        )}`
      );

      this.showNotification(
        `Novo usuário: ${newUser.name} (${newUser.email})`,
        "info"
      );

      // Propaga para outros peers
      this.propagateUpdate(
        {
          type: "user_added",
          payload: payload,
        },
        fromPeerId
      );
    }
  },

  /**
   * Notifica sobre usuário removido
   */
  broadcastUserRemoved(email) {
    const data = {
      type: "user_removed",
      payload: {
        email: email,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }

    console.log(`✅ Remoção do usuário "${email}" sincronizada com peers`);
  },

  /**
   * Processa remoção de usuário recebida
   */
  async handleUserRemoved(fromPeerId, payload) {
    const email = payload.email;
    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");

    // Remove usuário (case-insensitive)
    const normalizedEmail = email.toUpperCase();
    const filteredUsers = users.filter((u) => u.email.toUpperCase() !== normalizedEmail);

    if (filteredUsers.length < users.length) {
      localStorage.setItem("oae-users", JSON.stringify(filteredUsers));

      console.log(
        `✅ Usuário "${email}" removido por ${this.getPeerDisplayName(
          fromPeerId
        )}`
      );

      // Verifica se o usuário removido é o usuário atual logado
      if (window.AuthSystem && window.AuthSystem.currentUser) {
        const normalizedCurrentEmail = window.AuthSystem.currentUser.email.toUpperCase();

        if (normalizedCurrentEmail === normalizedEmail) {
          // Usuário atual foi removido - faz logout forçado
          this.showNotification(
            `⚠️ Sua conta foi removida pelo administrador!\nVocê será desconectado em 3 segundos...`,
            "warning"
          );

          setTimeout(() => {
            // Limpa sessão
            sessionStorage.removeItem("oae-session");
            window.AuthSystem.currentUser = null;
            window.AuthSystem.isLoggedIn = false;

            // Redireciona para login
            alert("❌ Sua conta foi removida do sistema pelo administrador.");
            window.location.reload();
          }, 3000);

          console.log("⚠️ Conta removida - logout forçado!");
          return; // Não propaga nem mostra notificação normal
        }
      }

      this.showNotification(`Usuário removido: ${email}`, "warning");

      // Propaga para outros peers
      this.propagateUpdate(
        {
          type: "user_removed",
          payload: payload,
        },
        fromPeerId
      );
    }
  },

  /**
   * Notifica sobre usuário atualizado
   */
  broadcastUserUpdated(user) {
    const data = {
      type: "user_updated",
      payload: {
        user: user,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }

    console.log(`✅ Atualização do usuário "${user.name}" sincronizada com peers`);
  },

  /**
   * Processa atualização de usuário recebida
   */
  async handleUserUpdated(fromPeerId, payload) {
    const updatedUser = payload.user;
    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");

    // Busca usuário case-insensitive
    const normalizedUpdatedEmail = updatedUser.email.toUpperCase();
    const userIndex = users.findIndex((u) => u.email.toUpperCase() === normalizedUpdatedEmail);

    if (userIndex !== -1) {
      users[userIndex] = {
        ...updatedUser,
        syncedFrom: fromPeerId,
        syncedAt: Date.now(),
      };

      localStorage.setItem("oae-users", JSON.stringify(users));

      console.log(
        `✅ Usuário "${updatedUser.name}" atualizado de ${this.getPeerDisplayName(
          fromPeerId
        )}`
      );

      // Verifica se o usuário atualizado é o usuário atual logado
      if (window.AuthSystem && window.AuthSystem.currentUser) {
        const normalizedCurrentEmail = window.AuthSystem.currentUser.email.toUpperCase();
        const normalizedUpdatedEmail = updatedUser.email.toUpperCase();

        if (normalizedCurrentEmail === normalizedUpdatedEmail) {
          // Atualiza a sessão atual com os novos dados
          const session = JSON.parse(sessionStorage.getItem("oae-session") || "{}");
          if (session.user) {
            session.user.role = updatedUser.role;
            session.user.lote = updatedUser.lote;
            session.user.name = updatedUser.name;
            sessionStorage.setItem("oae-session", JSON.stringify(session));

            // Atualiza o objeto currentUser no AuthSystem
            window.AuthSystem.currentUser.role = updatedUser.role;
            window.AuthSystem.currentUser.lote = updatedUser.lote;
            window.AuthSystem.currentUser.name = updatedUser.name;

            // Atualiza UI com novo role
            window.AuthSystem.updateUIForUser();

            this.showNotification(
              `🔄 Seu perfil foi atualizado!\nNova role: ${window.AuthSystem.getRoleDisplayName(updatedUser.role)}\nLote: ${updatedUser.lote}`,
              "warning"
            );

            console.log("🔄 Perfil do usuário atual atualizado em tempo real!");
          }
        }
      }

      this.showNotification(
        `Usuário atualizado: ${updatedUser.name}`,
        "info"
      );

      // Propaga para outros peers
      this.propagateUpdate(
        {
          type: "user_updated",
          payload: payload,
        },
        fromPeerId
      );
    }
  },

  /**
   * Solicita sincronização de usuários de um peer
   */
  requestUsersSync(peerId = null) {
    const data = {
      type: "request_users_sync",
      payload: {
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    if (peerId) {
      // Solicita de um peer específico
      const conn = this.connections.get(peerId);
      if (conn && conn.open) {
        conn.send(data);
        console.log(`📤 Solicitando usuários de ${this.getPeerDisplayName(peerId)}`);
      }
    } else {
      // Solicita de todos os peers
      for (const [pId, conn] of this.connections) {
        if (conn.open) {
          conn.send(data);
        }
      }
      console.log("📤 Solicitando usuários de todos os peers conectados");
    }
  },

  /**
   * Processa solicitação de sincronização de usuários
   */
  async handleRequestUsersSync(fromPeerId) {
    console.log(
      `📨 ${this.getPeerDisplayName(fromPeerId)} solicitou sincronização de usuários`
    );

    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");

    const data = {
      type: "users_sync",
      payload: {
        users: users,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    const conn = this.connections.get(fromPeerId);
    if (conn && conn.open) {
      conn.send(data);
      console.log(
        `✅ Enviando ${users.length} usuários para ${this.getPeerDisplayName(
          fromPeerId
        )}`
      );
    }
  },

  /**
   * Envia broadcast de mensagem genérica
   */
  broadcast(data) {
    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }
  },

  // ========== SINCRONIZAÇÃO DE OBRAS ==========

  /**
   * Notifica sobre obra atualizada/publicada
   */
  broadcastWorkUpdated(work) {
    const data = {
      type: "work_updated",
      payload: {
        work: work,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }

    console.log(`✅ Obra "${work.work.codigo}" sincronizada com peers`);
  },

  /**
   * Processa atualização de obra recebida
   */
  async handleWorkUpdated(fromPeerId, payload) {
    const updatedWork = payload.work;

    console.log(`📥 Recebendo atualização de obra de ${this.getPeerDisplayName(fromPeerId)}: ${updatedWork.work.codigo}`);

    // Salva no IndexedDB
    if (window.WorkManager) {
      await WorkManager.saveWork(updatedWork);
      WorkManager.updateWorkCache(updatedWork.work.codigo, updatedWork);

      console.log(`✅ Obra "${updatedWork.work.codigo}" atualizada de ${this.getPeerDisplayName(fromPeerId)}`);

      this.showNotification(
        `📦 Obra atualizada: ${updatedWork.work.codigo}`,
        "info"
      );

      // Propaga para outros peers
      this.propagateUpdate(
        {
          type: "work_updated",
          payload: payload,
        },
        fromPeerId
      );

      // Atualiza UI se estiver na tela de obras
      if (window.UI && typeof UI.showWorksModal === 'function') {
        // Não chama automaticamente para não incomodar o usuário
        // UI.showWorksModal();
      }
    }
  },

  // ========== NOTIFICAÇÕES DE LOGIN ==========

  /**
   * Notifica sobre login de usuário
   */
  broadcastUserLogin(loginData) {
    const data = {
      type: "user_login",
      payload: {
        ...loginData,
        source: this.userId,
        timestamp: Date.now(),
      },
    };

    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send(data);
      }
    }

    console.log(`✅ Login notificado para peers: ${loginData.name}`);
  },

  /**
   * Processa notificação de login recebida
   */
  async handleUserLogin(fromPeerId, payload) {
    console.log(`👤 Login detectado: ${payload.name} (${payload.role}) - ${payload.lote}`);

    // Apenas admin recebe notificações visuais de login
    if (window.AuthSystem && window.AuthSystem.currentUser && window.AuthSystem.currentUser.role === "admin") {
      const roleDisplay = window.AuthSystem.getRoleDisplayName(payload.role);

      this.showNotification(
        `👤 Novo login!\n${payload.name}\n${roleDisplay} - ${payload.lote}`,
        "info"
      );

      console.log(`📢 [ADMIN] Usuário conectado: ${payload.name} (${payload.email}) - ${roleDisplay} - ${payload.lote}`);
    }

    // Propaga para outros peers
    this.propagateUpdate(
      {
        type: "user_login",
        payload: payload,
      },
      fromPeerId
    );
  },
};

// Export para uso global
window.MultiPeerSync = MultiPeerSync;
