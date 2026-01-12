/**
 * Authentication System - OAE Revisor
 * Sistema de autenticação e controle de perfis
 */

const AuthSystem = {
  // Usuário atual logado
  currentUser: null,
  isLoggedIn: false,

  // Roles disponíveis
  ROLES: {
    ADMIN: "admin",
    AVALIADOR: "avaliador",
    INSPETOR: "inspetor",
  },

  // Lotes disponíveis
  LOTES: {
    LOTE_01: "Lote 01",
    LOTE_02: "Lote 02",
    LOTE_03: "Lote 03",
    ADMIN: "Admin",
  },

  // Usuários padrão
  DEFAULT_USERS: [
    {
      email: "HENRIQUE.SILVA@GRUPOENGEMAP.COM",
      password: "12345",
      name: "Administrador",
      role: "admin",
      lote: "Admin",
      active: true,
    },
  ],

  /**
   * Inicializa o sistema de autenticação
   */
  async init() {
    await this.loadUsers();
    this.checkExistingSession();
    console.log("Auth System initialized");
  },

  /**
   * Carrega usuários do localStorage
   */
  async loadUsers() {
    const stored = localStorage.getItem("oae-users");
    if (!stored) {
      // Se não há usuários, cria o admin padrão
      localStorage.setItem("oae-users", JSON.stringify(this.DEFAULT_USERS));
      console.log("✅ Usuário admin criado:", this.DEFAULT_USERS[0].email);
      return;
    }

    // Remove duplicados automaticamente na inicialização
    let users = JSON.parse(stored);
    const uniqueUsers = new Map();

    for (const user of users) {
      const normalizedEmail = user.email.toUpperCase();
      const existing = uniqueUsers.get(normalizedEmail);

      if (!existing) {
        uniqueUsers.set(normalizedEmail, user);
      } else {
        // Mantém o mais recente
        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const currentTime = new Date(user.updatedAt || user.createdAt || 0).getTime();

        if (currentTime > existingTime) {
          uniqueUsers.set(normalizedEmail, user);
        }
      }
    }

    // Atualiza lista com usuários únicos
    users = Array.from(uniqueUsers.values());
    const hadDuplicates = users.length !== JSON.parse(stored).length;

    if (hadDuplicates) {
      console.log(`🧹 Removidos ${JSON.parse(stored).length - users.length} usuários duplicados`);
      localStorage.setItem("oae-users", JSON.stringify(users));
    }

    // Verifica se o admin padrão existe (case-insensitive)
    const defaultAdminEmail = this.DEFAULT_USERS[0].email.toUpperCase();
    const adminExists = users.some(
      (u) => u.email.toUpperCase() === defaultAdminEmail && u.role === "admin"
    );

    if (!adminExists) {
      // Adiciona o admin se não existir
      users.push(this.DEFAULT_USERS[0]);
      localStorage.setItem("oae-users", JSON.stringify(users));
      console.log("✅ Usuário admin restaurado");
    }
  },

  /**
   * Verifica se já existe uma sessão ativa
   */
  checkExistingSession() {
    const session = sessionStorage.getItem("oae-session");
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        if (sessionData.expiresAt > Date.now()) {
          this.currentUser = sessionData.user;
          this.isLoggedIn = true;
          this.updateUIForUser();
          return true;
        } else {
          sessionStorage.removeItem("oae-session");
        }
      } catch (e) {
        sessionStorage.removeItem("oae-session");
      }
    }
    return false;
  },

  /**
   * Realiza login
   */
  async login(email, password) {
    try {
      const users = JSON.parse(localStorage.getItem("oae-users") || "[]");

      // Normaliza email para case-insensitive
      const normalizedEmail = email.toUpperCase();

      // Verifica se usuário existe (case-insensitive)
      const userExists = users.find((u) => u.email.toUpperCase() === normalizedEmail);

      if (!userExists) {
        throw new Error(`❌ Usuário não encontrado!\n\n💡 DICA: Se este usuário foi criado em outro dispositivo, você precisa:\n1. Conectar via PeerJS usando o email do admin\n2. Aguardar sincronização\n3. Depois fazer login`);
      }

      const user = users.find(
        (u) => u.email.toUpperCase() === normalizedEmail && u.password === password && u.active
      );

      if (!user) {
        throw new Error("❌ Senha incorreta!");
      }

      // Remove senha do objeto de usuário
      const userSession = {
        email: user.email,
        name: user.name,
        role: user.role,
        lote: user.lote || "Admin",
      };

      // Cria sessão
      const sessionData = {
        user: userSession,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
        loginTime: new Date().toISOString(),
      };

      sessionStorage.setItem("oae-session", JSON.stringify(sessionData));

      this.currentUser = userSession;
      this.isLoggedIn = true;

      this.updateUIForUser();

      // Registra no audit trail se existir
      if (window.AuditSystem) {
        AuditSystem.logChange("login", {
          email: user.email,
          role: user.role,
        });
      }

      // Initialize MultiPeerSync automatically for logged users so they join the P2P network
      (async () => {
        try {
          if (window.MultiPeerSync && (!MultiPeerSync.peer || !MultiPeerSync.hasConnections())) {
            await MultiPeerSync.init(user.email, user.name);

            // After init, request users and state from connected peers
            MultiPeerSync.requestUsersSync();
            MultiPeerSync.requestAllStates();

            // Connect to peers inferred from existing local users
            if (typeof MultiPeerSync.connectToUsersFromLocalUsers === "function") {
              MultiPeerSync.connectToUsersFromLocalUsers();
            }

            // Broadcast login to peers
            MultiPeerSync.broadcastUserLogin({
              email: user.email,
              name: user.name,
              role: user.role,
              lote: user.lote || "Admin",
              timestamp: new Date().toISOString(),
            });
          } else if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
            // If already initialized and has connections, still request fresh data
            MultiPeerSync.requestUsersSync();
            MultiPeerSync.requestAllStates();
            MultiPeerSync.broadcastUserLogin({
              email: user.email,
              name: user.name,
              role: user.role,
              lote: user.lote || "Admin",
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn("MultiPeerSync auto-init failed:", err);
        }
      })();

      // Notifica peers sobre o login (para que admin veja) - kept for backward compatibility
      if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
        MultiPeerSync.broadcastUserLogin({
          email: user.email,
          name: user.name,
          role: user.role,
          lote: user.lote || "Admin",
          timestamp: new Date().toISOString(),
        });
      }

      return { success: true, user: userSession };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Realiza logout
   */
  logout() {
    if (window.AuditSystem && this.currentUser) {
      AuditSystem.logChange("logout", {
        email: this.currentUser.email,
        role: this.currentUser.role,
      });
    }

    sessionStorage.removeItem("oae-session");
    this.currentUser = null;
    this.isLoggedIn = false;

    // Redireciona para login
    this.showLoginModal();
  },

  /**
   * Verifica se usuário tem permissão específica
   */
  hasPermission(permission) {
    if (!this.isLoggedIn) return false;

    const permissions = {
      [this.ROLES.ADMIN]: [
        "delete_any_work",
        "view_all_works",
        "manage_users",
        "configure_system",
        "view_private_works",
      ],
      [this.ROLES.AVALIADOR]: [
        "create_work",
        "edit_own_work",
        "delete_own_work",
        "point_field_errors",
        "view_public_works",
        "view_shared_works",
        "chat_in_fields",
      ],
      [this.ROLES.INSPETOR]: [
        "view_public_works",
        "view_shared_works",
        "chat_in_fields",
        "view_field_comments",
        "suggest_corrections",
      ],
    };

    return permissions[this.currentUser.role]?.includes(permission) || false;
  },

  /**
   * Verifica se usuário pode apagar obra específica
   */
  canDeleteWork(workCreatedBy) {
    // Admin pode apagar qualquer obra
    if (this.hasPermission("delete_any_work")) return true;

    // Avaliador pode apagar qualquer obra
    if (this.currentUser.role === this.ROLES.AVALIADOR) return true;

    // Usuário pode apagar suas próprias obras
    if (
      this.hasPermission("delete_own_work") &&
      workCreatedBy === this.currentUser.email
    ) {
      return true;
    }

    return false;
  },

  /**
   * Verifica se usuário pode ver obra específica
   * REGRAS:
   * - Admin: vê tudo
   * - Avaliador: vê obras de todos os lotes
   * - Inspetor: vê apenas obras do próprio lote
   */
  canViewWork(work) {
    // Admin pode ver tudo
    if (this.hasPermission("view_all_works")) return true;

    const workLote = work.work?.metadata?.lote || work.metadata?.lote;

    // Avaliador vê obras de qualquer lote
    if (this.currentUser.role === this.ROLES.AVALIADOR) {
      return true;
    }

    // Inspetor só vê obras do próprio lote
    if (this.currentUser.role === this.ROLES.INSPETOR) {
      if (workLote && workLote !== this.currentUser.lote) {
        return false;
      }
    }

    // Obras públicas todos podem ver
    if (work.metadata?.isPublic) return true;

    // Obras compartilhadas
    if (work.metadata?.sharedWith?.includes(this.currentUser.email))
      return true;

    // Próprias obras
    if (work.work?.avaliador === this.currentUser.email) return true;

    return false;
  },

  /**
   * Verifica se usuário pode ver obra de outro lote (apenas admin)
   */
  canViewOtherLote() {
    return this.currentUser.lote === "Admin";
  },

  /**
   * Atualiza interface baseado no usuário
   */
  updateUIForUser() {
    if (!this.isLoggedIn) return;

    this.toggleElementsByRole();

    // Inicializa toggle de lote
    if (window.UI && UI.initLoteToggle) {
      UI.initLoteToggle();
    }

    // Atualiza MultiPeerSync com dados do usuário
    if (window.MultiPeerSync) {
      MultiPeerSync.userEmail = this.currentUser.email;
      MultiPeerSync.userName = this.currentUser.name;
    }
  },

  /**
   * Mostra/esconde elementos baseado no role
   */
  toggleElementsByRole() {
    // Elementos que só admin pode ver
    const adminOnly = document.querySelectorAll(".admin-only");
    adminOnly.forEach((el) => {
      el.style.display = this.hasPermission("manage_users") ? "block" : "none";
    });

    // Elementos que só avaliador pode ver
    const avaliadorOnly = document.querySelectorAll(".avaliador-only");
    avaliadorOnly.forEach((el) => {
      el.style.display =
        this.currentUser.role === this.ROLES.AVALIADOR ? "block" : "none";
    });

    // Elementos que inspetor não pode ver
    const notInspetor = document.querySelectorAll(".not-inspetor");
    notInspetor.forEach((el) => {
      el.style.display =
        this.currentUser.role === this.ROLES.INSPETOR ? "none" : "block";
    });

    // Elementos que só usuários logados podem ver
    const loggedInOnly = document.querySelectorAll(".logged-in-only");
    loggedInOnly.forEach((el) => {
      el.style.display = this.isLoggedIn ? "block" : "none";
    });
  },

  /**
   * Obtém nome para exibição do role
   */
  getRoleDisplayName(role) {
    const names = {
      [this.ROLES.ADMIN]: "Administrador",
      [this.ROLES.AVALIADOR]: "Avaliador",
      [this.ROLES.INSPETOR]: "Inspetor",
    };
    return names[role] || "Desconhecido";
  },

  /**
   * Mostra modal de login
   */
  showLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) {
      modal.classList.add("show");
      // Limpa campos
      document.getElementById("loginEmail").value = "";
      document.getElementById("loginPassword").value = "";
      document.getElementById("loginError").textContent = "";
    }
  },

  /**
   * Esconde modal de login
   */
  hideLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) {
      modal.classList.remove("show");
    }
  },

  /**
   * Login a partir do formulário
   */
  async loginFromForm() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      document.getElementById("loginError").textContent =
        "Preencha todos os campos";
      return;
    }

    try {
      const result = await this.login(email, password);
      if (result.success) {
        this.hideLoginModal();
        location.reload(); // Recarrega para inicializar o sistema
      } else {
        document.getElementById("loginError").textContent = result.error;
      }
    } catch (error) {
      document.getElementById("loginError").textContent = "Erro ao fazer login";
    }
  },

  /**
   * Mostra modal de alteração de senha
   */
  showChangePasswordModal() {
    const modal = document.getElementById("changePasswordModal");
    if (modal) {
      modal.style.display = "flex";
      modal.classList.add("show");
      // Limpa campos
      document.getElementById("changeEmail").value = "";
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
      document.getElementById("changePasswordError").textContent = "";
    }
  },

  /**
   * Esconde modal de alteração de senha
   */
  hideChangePasswordModal() {
    const modal = document.getElementById("changePasswordModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("show");
    }
  },

  /**
   * Altera senha do usuário
   */
  async changePassword(email, currentPassword, newPassword) {
    try {
      const users = JSON.parse(localStorage.getItem("oae-users") || "[]");
      // Normaliza email para case-insensitive
      const normalizedEmail = email.toUpperCase();
      const user = users.find((u) => u.email.toUpperCase() === normalizedEmail && u.active);

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      // Verifica senha atual
      if (user.password !== currentPassword) {
        throw new Error("Senha atual incorreta");
      }

      // Valida nova senha
      if (!newPassword || newPassword.length < 4) {
        throw new Error("Nova senha deve ter pelo menos 4 caracteres");
      }

      // Atualiza senha
      user.password = newPassword;
      user.updatedAt = new Date().toISOString();
      user.updatedBy = email; // Usuário alterando própria senha

      // Salva no localStorage
      localStorage.setItem("oae-users", JSON.stringify(users));

      // Registra no audit trail se existir
      if (window.AuditSystem) {
        AuditSystem.logChange("password_changed", {
          email: user.email,
          role: user.role,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Password change error:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Altera senha a partir do formulário
   */
  async changePasswordFromForm() {
    const email = document.getElementById("changeEmail").value.trim();
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validações
    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      document.getElementById("changePasswordError").textContent =
        "Preencha todos os campos";
      return;
    }

    if (newPassword !== confirmPassword) {
      document.getElementById("changePasswordError").textContent =
        "Nova senha e confirmação não coincidem";
      return;
    }

    if (newPassword.length < 4) {
      document.getElementById("changePasswordError").textContent =
        "Nova senha deve ter pelo menos 4 caracteres";
      return;
    }

    try {
      const result = await this.changePassword(
        email,
        currentPassword,
        newPassword
      );
      if (result.success) {
        this.hideChangePasswordModal();
        this.hideLoginModal();
        alert("Senha alterada com sucesso! Faça login novamente.");
        // Mostra login novamente
        this.showLoginModal();
      } else {
        document.getElementById("changePasswordError").textContent =
          result.error;
      }
    } catch (error) {
      document.getElementById("changePasswordError").textContent =
        "Erro ao alterar senha";
    }
  },

  /**
   * Conecta e sincroniza usuários via PeerJS
   */
  async connectAndSyncUsers() {
    const peerEmail = document.getElementById("peerIdToConnect").value.trim();
    const syncStatus = document.getElementById("syncStatus");

    if (!peerEmail) {
      syncStatus.textContent = "❌ Digite o email do peer para conectar";
      syncStatus.style.color = "var(--danger)";
      return;
    }

    try {
      syncStatus.textContent = "🔄 Conectando...";
      syncStatus.style.color = "var(--primary)";

      // Inicializa MultiPeerSync se ainda não foi inicializado
      if (!window.MultiPeerSync || !MultiPeerSync.peer) {
        // Usa identidade do usuário logado se disponível, senão fallback temporário
        const emailToUse = this.currentUser?.email || "temp@sync.com";
        const nameToUse = this.currentUser?.name || "Temp Sync";
        await MultiPeerSync.init(emailToUse, nameToUse);
      }

      // Gera ID do peer baseado no email
      const peerId = `oae-${MultiPeerSync.generateUserId(peerEmail)}`;

      syncStatus.textContent = `🔄 Conectando com ${peerEmail}...`;

      // Conecta ao peer
      await MultiPeerSync.connectToPeer(peerId);

      syncStatus.textContent = "✅ Conectado! Solicitando usuários...";

      // Solicita sincronização de usuários
      MultiPeerSync.requestUsersSync(peerId);

      // Aguarda 3 segundos para receber os usuários
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem("oae-users") || "[]");
        syncStatus.textContent = `✅ ${users.length} usuários sincronizados!`;
        syncStatus.style.color = "var(--success)";

        // Atualiza a interface
        setTimeout(() => {
          syncStatus.textContent = "👍 Agora você pode fazer login!";
        }, 2000);
      }, 3000);
    } catch (error) {
      console.error("Erro ao conectar e sincronizar:", error);
      syncStatus.textContent = `❌ Erro: ${error.message}`;
      syncStatus.style.color = "var(--danger)";
    }
  },

  /**
   * Mostra modal com opções de sincronização
   */
  showSyncOptionsModal() {
    const modal = document.getElementById("syncOptionsModal");
    if (modal) {
      modal.classList.add("show");
    }
  },

  /**
   * Esconde modal de opções de sincronização
   */
  hideSyncOptionsModal() {
    const modal = document.getElementById("syncOptionsModal");
    if (modal) {
      modal.classList.remove("show");
    }
  },
};

// Export para uso global
window.AuthSystem = AuthSystem;
