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

      // Marca disponibilidade P2P
      this.p2pAvailable = true;

      this.setupEventListeners();

      // Carrega pares conhecidos
      this.loadKnownPeers();

      // Tenta conectar com pares conhecidos
      this.connectToKnownPeers();

      // Tenta reconectar periodicamente para manter as conexões vivas
      if (!this._reconnectInterval) {
        this._reconnectInterval = setInterval(() => {
          try { this.connectToKnownPeers(); } catch (e) { console.warn('Reconnect attempt failed:', e); }
        }, 30 * 1000);
      }

      // Periodically attempt to flush any pending work broadcasts when connections are available
      if (!this._flushInterval) {
        this._flushInterval = setInterval(() => {
          try {
            const pending = this.getPendingWorkBroadcasts ? this.getPendingWorkBroadcasts() : [];
            if (pending && pending.length && this.connections && this.connections.size > 0) {
              try { this.flushPendingBroadcasts(); } catch (e) { console.warn('Periodic flush failed:', e); }
            }
          } catch (e) {
            console.warn('Error during periodic pending-flush check:', e);
          }
        }, 15 * 1000);
      }

      return new Promise((resolve, reject) => {
        this.peer.on("open", (id) => {
          console.log("Multi-Peer iniciado:", id);
          // Atualiza UI para refletir nova disponibilidade
          if (window.UI && typeof UI.updateNetworkUI === 'function') {
            UI.updateNetworkUI();
          }
          resolve(id);
        });

        this.peer.on("error", (err) => {
          console.error("Erro no Multi-Peer:", err);
          reject(err);
        });
      });
    } catch (error) {
      console.error("Falha ao inicializar Multi-Peer:", error);

      // Mostra mensagem amigável para o usuário (pode ser Tracking Prevention ou falta do PeerJS)
      if (window.UI && typeof UI.showNotification === 'function') {
        UI.showNotification('⚠️ Falha ao inicializar P2P: verifique se o PeerJS foi carregado ou se o modo de prevenção de rastreamento bloqueou recursos do site. O compartilhamento em arquivo/por link ainda funciona.', 'warning');
      } else {
        console.warn('P2P init failed - UI not available to show notification');
      }

      // Marca flag para indicar que P2P não está disponível
      this.p2pAvailable = false;

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

      // Envia informação de login para o peer recém-conectado
      try {
        if (window.AuthSystem && AuthSystem.currentUser && conn.open) {
          conn.send({
            type: 'user_login',
            payload: {
              email: AuthSystem.currentUser.email,
              name: AuthSystem.currentUser.name,
              role: AuthSystem.currentUser.role,
              lote: AuthSystem.currentUser.lote || '',
              timestamp: new Date().toISOString(),
              source: this.userId,
            },
          });
        } else if (conn.open) {
          // Envia descoberta de peers como fallback
          conn.send({ type: 'peer_discovery', payload: { peers: [...this.knownPeers] } });
        }
      } catch (e) {
        console.warn('Não foi possível enviar login ao peer:', e);
      }

      // Atualiza UI de rede
      if (window.UI && typeof UI.updateNetworkUI === 'function') {
        UI.updateNetworkUI();
      }

      // After a short delay, request works and flush any pending broadcasts to this peer
      setTimeout(() => {
        try {
          if (conn.open) {
            // Request works from this peer to ensure we receive any new/updated items
            conn.send({ type: 'request_works', payload: { source: this.userId, timestamp: Date.now() } });

            // Flush any pending broadcasts specifically to this peer
            try {
              if (typeof this.flushPendingBroadcasts === 'function') {
                this.flushPendingBroadcasts(peerId);
              }
            } catch (e) {
              console.warn('Failed to flush pending broadcasts to', peerId, e);
            }
          }
        } catch (e) {
          console.warn('Erro ao solicitar lista de obras/flush para o peer:', e);
        }
      }, 1200);
    });

    conn.on("data", (data) => {
      this.handleIncomingData(peerId, data);
    });

    conn.on("close", () => {
      console.log("Conexão fechada com:", peerId);
      this.connections.delete(peerId);
      this.updateConnectionStatus(peerId, "disconnected");
      this.notifyConnection(peerId, "disconnected");

      // Atualiza UI de rede quando um peer desconecta
      if (window.UI && typeof UI.updateNetworkUI === 'function') {
        UI.updateNetworkUI();
      }
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
      case "request_works":
        await this.handleRequestWorks(fromPeerId);
        break;
      case "works_list":
        await this.handleWorksList(fromPeerId, data.payload);
        break;
      case "work_updated":
        await this.handleWorkUpdated(fromPeerId, data.payload);
        break;
      case "user_login":
        await this.handleUserLogin(fromPeerId, data.payload);
        break;
      case "work_share_link":
        await this.handleWorkShareLink(fromPeerId, data.payload);
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
      console.log('🔍 [AUTO-DISCOVERY] Iniciando descoberta automática de peers...');

      if (!this.peer || !this.peer.id) {
        console.warn('⚠️ [AUTO-DISCOVERY] Peer não inicializado ainda. Abortando auto-discovery.');
        return;
      }

      const users = JSON.parse(localStorage.getItem('oae-users') || '[]');
      console.log(`📋 [AUTO-DISCOVERY] ${users.length} usuários encontrados no localStorage`);

      let peersAdded = 0;
      let peersSkipped = 0;

      for (const user of users) {
        try {
          if (!user || !user.email) {
            peersSkipped++;
            continue;
          }

          const peerId = `oae-${this.generateUserId(user.email)}`;

          if (peerId === this.peer.id) {
            console.log(`⏭️ [AUTO-DISCOVERY] Ignorando peer próprio: ${peerId} (${user.email})`);
            peersSkipped++;
            continue;
          }

          console.log(`✅ [AUTO-DISCOVERY] Adicionando peer: ${user.name || user.email} → ${peerId}`);
          this.addKnownPeer(peerId, user.name || user.email);
          peersAdded++;
        } catch (e) {
          console.warn('⚠️ [AUTO-DISCOVERY] Entrada de usuário inválida:', e);
          peersSkipped++;
        }
      }

      console.log(`✅ [AUTO-DISCOVERY] Concluído: ${peersAdded} peers adicionados, ${peersSkipped} ignorados`);
      console.log(`📡 [AUTO-DISCOVERY] Total de peers conhecidos agora: ${this.knownPeers.size}`);
    } catch (error) {
      console.error('❌ [AUTO-DISCOVERY] Falha completa:', error);
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
      console.log("✓ [CONNECT] Já conectado com:", peerId);
      return;
    }

    try {
      console.log(`🔌 [CONNECT] Tentando conectar com: ${peerId}`);
      const conn = this.peer.connect(peerId);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn(`⏱️ [CONNECT] Timeout ao conectar com ${peerId} (10s)`);
          reject(new Error("Timeout de conexão"));
        }, 10000);

        conn.on("open", () => {
          clearTimeout(timeout);
          console.log(`✅ [CONNECT] Conexão estabelecida com ${peerId}`);
          this.handleConnection(conn);
          resolve(conn);
        });

        conn.on("error", (err) => {
          clearTimeout(timeout);
          console.error(`❌ [CONNECT] Erro ao conectar com ${peerId}:`, err);
          reject(err);
        });
      });
    } catch (error) {
      console.error(`❌ [CONNECT] Falha ao conectar com peer ${peerId}:`, error);
      throw error;
    }
  },

  /**
   * Adiciona peer conhecido
   */
  addKnownPeer(peerId, displayName = null) {
    console.log(`📌 [ADD_PEER] Adicionando peer conhecido: ${displayName || peerId} (${peerId})`);

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

    console.log(`💾 [ADD_PEER] Peer salvo no localStorage. Total de peers conhecidos: ${this.knownPeers.size}`);

    // Atualiza UI de rede
    if (window.UI && typeof UI.updateNetworkUI === 'function') {
      UI.updateNetworkUI();
    }

    // Tenta conectar
    console.log(`🔗 [ADD_PEER] Tentando conectar com ${peerId}...`);
    this.connectToPeer(peerId).catch(err => {
      console.warn(`⚠️ [ADD_PEER] Falha ao conectar com ${peerId}:`, err.message);
    });
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
   * Solicita lista completa de obras dos peers conectados
   */
  requestWorksSync(peerId = null) {
    const data = {
      type: 'request_works',
      payload: {
        source: this.userId,
        timestamp: Date.now(),
      }
    };

    if (peerId) {
      const conn = this.connections.get(peerId);
      if (conn && conn.open) conn.send(data);
    } else {
      for (const [pId, conn] of this.connections) {
        if (conn.open) conn.send(data);
      }
    }

    console.log('📤 Solicitando lista de obras dos peers conectados');
  },

  /**
   * Envia lista de obras em resposta à solicitação
   */
  async handleRequestWorks(fromPeerId) {
    try {
      const conn = this.connections.get(fromPeerId);
      if (!conn || !conn.open) return;

      // Prepara lista de obras a partir do cache
      const works = Array.from(WorkManager.worksCache.values()).map(w => ({ ...w }));

      conn.send({ type: 'works_list', payload: { works, source: this.userId, timestamp: Date.now() } });

      console.log(`✅ Enviando ${works.length} obras para ${this.getPeerDisplayName(fromPeerId)}`);
    } catch (e) {
      console.error('Erro ao enviar lista de obras:', e);
    }
  },

  /**
   * Processa lista de obras recebida de um peer
   */
  async handleWorksList(fromPeerId, payload) {
    try {
      const remoteWorks = payload.works || [];
      console.log(`📥 Recebendo ${remoteWorks.length} obras de ${this.getPeerDisplayName(fromPeerId)}`);

      let imported = 0, skipped = 0;

      for (const w of remoteWorks) {
        try {
          const code = w.work.codigo;
          const existing = WorkManager.worksCache.get(code);

          const incomingTime = (w.work.metadata && w.work.metadata.lastModifiedAt) ? new Date(w.work.metadata.lastModifiedAt).getTime() : (payload.timestamp || Date.now());
          const existingTime = existing && existing.work && existing.work.metadata && existing.work.metadata.lastModifiedAt ? new Date(existing.work.metadata.lastModifiedAt).getTime() : 0;

          if (!existing || incomingTime > existingTime) {
            // Save without re-broadcasting (to avoid echo)
            await WorkManager.saveWork(w, { broadcast: false });
            WorkManager.worksCache.set(code, w);
            imported++;
          } else {
            skipped++;
          }
        } catch (e) {
          console.warn('Erro ao importar obra:', e);
        }
      }

      if (imported > 0) {
        this.showNotification(`📦 ${imported} obras importadas de ${this.getPeerDisplayName(fromPeerId)}`,'success');
        if (window.WorkManager) WorkManager.updateWorkCache();
        if (window.UI && typeof UI.showWorksModal === 'function') UI.updateNetworkUI();
      }

      console.log(`✅ Works import summary: ${imported} imported, ${skipped} skipped.`);
    } catch (e) {
      console.error('Erro ao processar works_list:', e);
    }
  },

  /**
   * Processa atualização de obra recebida
   */
  async handleWorkUpdated(fromPeerId, payload) {
    const updatedWork = payload.work;

    try {
      const code = updatedWork.work.codigo;
      const existing = WorkManager.worksCache.get(code);

      const incomingTime = (updatedWork.work.metadata && updatedWork.work.metadata.lastModifiedAt) ? new Date(updatedWork.work.metadata.lastModifiedAt).getTime() : (payload.timestamp || Date.now());
      const existingTime = existing && existing.work && existing.work.metadata && existing.work.metadata.lastModifiedAt ? new Date(existing.work.metadata.lastModifiedAt).getTime() : 0;

      console.log(`📥 Recebendo atualização de obra de ${this.getPeerDisplayName(fromPeerId)}: ${code}`);

      // If it's new or newer, save; else ignore
      if (!existing || incomingTime > existingTime) {
        // Atualiza metadados locais
        updatedWork.work.metadata = updatedWork.work.metadata || {};
        updatedWork.work.metadata.lastModifiedBy = payload.source || fromPeerId;
        updatedWork.work.metadata.lastModifiedAt = updatedWork.work.metadata.lastModifiedAt || new Date().toISOString();

        // Save without broadcasting to avoid cycles
        await WorkManager.saveWork(updatedWork, { broadcast: false });
        WorkManager.worksCache.set(code, updatedWork);

        console.log(`✅ Obra "${code}" atualizada e salva locally`);

        this.showNotification(
          `📦 Obra atualizada: ${code}`,
          "info"
        );

        // Propaga para outros peers (exceto origem)
        this.propagateUpdate(
          {
            type: "work_updated",
            payload: payload,
          },
          fromPeerId
        );

        // Atualiza UI se necessário
        if (window.UI && typeof UI.showWorksModal === 'function') {
          UI.showWorksModal();
        }
      } else {
        console.log(`ℹ️ Obra ${code} ignorada (server copy older or equal)`);
      }
    } catch (err) {
      console.error('Erro ao processar work_updated:', err);
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

    // If no active connections, queue for later
    if (!this.hasConnections()) {
      try {
        if (typeof this.queuePendingWorkBroadcast === 'function') {
          this.queuePendingWorkBroadcast(work);
          console.log('No peers available — queued work for later broadcast:', work.work.codigo);
          return;
        }
      } catch (e) {
        console.warn('Failed to queue when no peers available:', e);
      }
    }

    let sent = 0;
    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        try {
          conn.send(data);
          sent++;
        } catch (e) {
          console.warn('Failed to send work update to', peerId, e);
          // On failure, make sure it's queued for eventual delivery
          try {
            if (typeof this.queuePendingWorkBroadcast === 'function') {
              this.queuePendingWorkBroadcast(work);
            }
          } catch (err) {
            console.warn('Failed to queue pending work after send error:', err);
          }
        }
      }
    }

    console.log(`✅ Obra "${work.work.codigo}" sincronizada com peers (enviadas: ${sent})`);
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

  // ========== GERENCIAMENTO DE BROADCASTS PENDENTES ==========

  /**
   * Recupera broadcasts pendentes do armazenamento local
   */
  getPendingWorkBroadcasts() {
    try {
      const raw = localStorage.getItem('oae-pending-works');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to read pending work broadcasts:', e);
      return [];
    }
  },

  /**
   * Salva lista de broadcasts pendentes no armazenamento local
   */
  savePendingWorkBroadcasts(list) {
    try {
      localStorage.setItem('oae-pending-works', JSON.stringify(list || []));
    } catch (e) {
      console.warn('Failed to save pending work broadcasts:', e);
    }
  },

  /**
   * Adiciona uma obra à fila de broadcasts pendentes
   */
  queuePendingWorkBroadcast(work) {
    try {
      const list = this.getPendingWorkBroadcasts();
      // Store minimal necessary payload to re-broadcast later
      const item = {
        id: `${work.work.codigo}-${Date.now()}`,
        work: work,
        queuedAt: Date.now(),
      };
      list.push(item);
      // Keep list bounded
      if (list.length > 200) list.splice(0, list.length - 200);
      this.savePendingWorkBroadcasts(list);
      console.log('Queued pending work broadcast:', work.work.codigo);
      return item.id;
    } catch (e) {
      console.warn('Failed to queue pending work broadcast:', e);
      return null;
    }
  },

  /**
   * Envia todos os broadcasts pendentes para um peer específico ou para todos os conectados
   */
  async flushPendingBroadcasts(targetPeerId = null) {
    try {
      const list = this.getPendingWorkBroadcasts();
      if (!list || !list.length) return 0;

      const toSend = [...list];
      let sentCount = 0;

      if (targetPeerId) {
        const conn = this.connections.get(targetPeerId);
        if (conn && conn.open) {
          for (const item of toSend) {
            try {
              conn.send({ type: 'work_updated', payload: { work: item.work, source: this.userId, timestamp: Date.now() } });
              sentCount++;
            } catch (e) {
              console.warn('Failed to send pending work to peer', targetPeerId, e);
            }
          }
          // Remove sent items
          if (sentCount > 0) {
            const remaining = list.slice(sentCount);
            this.savePendingWorkBroadcasts(remaining);
          }
          return sentCount;
        }
        return 0;
      }

      // Broadcast to all connected peers
      for (const [peerId, conn] of this.connections) {
        if (!conn || !conn.open) continue;
        for (const item of toSend) {
          try {
            conn.send({ type: 'work_updated', payload: { work: item.work, source: this.userId, timestamp: Date.now() } });
            sentCount++;
          } catch (e) {
            console.warn('Failed to broadcast pending work to', peerId, e);
          }
        }
      }

      // If we managed to send to at least one peer, clear queue
      if (sentCount > 0) {
        this.savePendingWorkBroadcasts([]);
      }

      console.log(`Flushed ${sentCount} pending work broadcasts`);
      return sentCount;
    } catch (e) {
      console.error('Error flushing pending work broadcasts:', e);
      return 0;
    }
  },

  // ========== NOTIFICAÇÕES DE LOGIN ==========

  /**
   * Recebe link de obra compartilhada diretamente por outro peer e pergunta para o usuário se deseja importar
   */
  async handleWorkShareLink(fromPeerId, payload) {
    try {
      const encoded = payload && (payload.encoded || payload.link || payload.share);
      if (!encoded) return;

      // Tenta decodificar para obter informações resumidas
      try {
        const jsonString = atob(decodeURIComponent(encoded));
        const data = JSON.parse(jsonString);
        const obra = data.work && (data.work.work || data.work);
        const title = obra ? `${obra.codigo} - ${obra.nome}` : 'Obra compartilhada';
        const by = data.sharedBy || payload.sharedBy || 'remoto';

        const wants = confirm(`${title}\nCompartilhado por: ${by}\n\nDeseja importar esta obra agora?`);
        if (wants) {
          // Reutiliza fluxo de importação via link
          if (window.SyncMethods && typeof SyncMethods.showAutoWorkImportNotification === 'function') {
            SyncMethods.showAutoWorkImportNotification(encodeURIComponent(encoded));
          } else {
            alert('Importação via link não disponível no momento.');
          }
        }
      } catch (err) {
        console.warn('Não foi possível decodificar link de obra recebido:', err);
        // Pergunta genérica
        const wants = confirm('Uma obra foi compartilhada por outro usuário. Deseja importá-la?');
        if (wants && window.SyncMethods && typeof SyncMethods.showAutoWorkImportNotification === 'function') {
          SyncMethods.showAutoWorkImportNotification(encodeURIComponent(encoded));
        }
      }
    } catch (e) {
      console.error('Erro ao processar work_share_link:', e);
    }
  },

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

    // Atualiza UI de rede para refletir novo login
    if (window.UI && typeof UI.updateNetworkUI === 'function') {
      UI.updateNetworkUI();
    }

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
