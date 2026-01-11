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

  // Usuários padrão
  DEFAULT_USERS: [
    {
      email: "admin@oae.com",
      password: "HENRIQUECRUZ",
      name: "Administrador",
      role: "admin",
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
    if (stored) {
      return;
    }

    // Se não há usuários, cria o admin padrão
    localStorage.setItem("oae-users", JSON.stringify(this.DEFAULT_USERS));
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
      const user = users.find(
        (u) => u.email === email && u.password === password && u.active
      );

      if (!user) {
        throw new Error("Email ou senha inválidos");
      }

      // Remove senha do objeto de usuário
      const userSession = {
        email: user.email,
        name: user.name,
        role: user.role,
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
   */
  canViewWork(work) {
    // Admin pode ver tudo
    if (this.hasPermission("view_all_works")) return true;

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
   * Atualiza interface baseado no usuário
   */
  updateUIForUser() {
    if (!this.isLoggedIn) return;

    // Atualiza informações do usuário na UI
    const userInfo = document.getElementById("currentUserInfo");
    if (userInfo) {
      userInfo.innerHTML = `
        <div class="user-info">
          <span class="user-name">${this.currentUser.name}</span>
          <span class="user-role ${
            this.currentUser.role
          }">${this.getRoleDisplayName(this.currentUser.role)}</span>
          <span class="user-email">${this.currentUser.email}</span>
          <div class="user-logout">
            <button class="btn" onclick="AuthSystem.logout()">
              🚪 Sair do Sistema
            </button>
          </div>
        </div>
      `;
    }

    // Mostra/esconde elementos baseado no role
    this.toggleElementsByRole();

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
        document.getElementById("currentUserInfo").style.display = "block";
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
      const user = users.find((u) => u.email === email && u.active);

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
};

// Export para uso global
window.AuthSystem = AuthSystem;
