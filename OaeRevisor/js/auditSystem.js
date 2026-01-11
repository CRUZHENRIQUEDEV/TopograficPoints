/**
 * Audit System Module - OAE Revisor
 * Sistema completo de auditoria e compartilhamento de obras
 */

const AuditSystem = {
  // Usuário atual
  currentUser: null,

  /**
   * Inicializa o sistema de auditoria
   */
  init() {
    this.currentUser = this.getCurrentUser();
    console.log("Audit System initialized for user:", this.currentUser);
  },

  /**
   * Obtém o usuário atual do AuthSystem ou MultiPeerSync
   */
  getCurrentUser() {
    // Tenta primeiro do AuthSystem (mais confiável para roles)
    if (window.AuthSystem && AuthSystem.currentUser) {
      return {
        email: AuthSystem.currentUser.email,
        name: AuthSystem.currentUser.name,
        role: AuthSystem.currentUser.role,
        lote: AuthSystem.currentUser.lote || "Admin",
      };
    }

    if (window.MultiPeerSync && MultiPeerSync.userEmail) {
      return {
        email: MultiPeerSync.userEmail,
        name: MultiPeerSync.userName,
        role: "avaliador", // Default se não logado via AuthSystem
        lote: "Admin",
      };
    }

    // Fallback para localStorage
    const email = localStorage.getItem("oae-user-email");
    const name = localStorage.getItem("oae-user-name");

    if (email && name) {
      return { email, name, role: "avaliador", lote: "Admin" };
    }

    return { email: "unknown@local", name: "Usuário Local", role: "visitante", lote: "Admin" };
  },

  /**
   * Registra uma alteração no audit trail
   */
  logChange(action, details, targetField = null) {
    if (!this.currentUser) {
        this.currentUser = this.getCurrentUser();
    }
    if (!this.currentUser) return;

    // Inicializa auditTrail se não existir
    if (!appState.work.auditTrail) {
      appState.work.auditTrail = [];
    }

    const auditEntry = {
      id: "audit_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user: {
        email: this.currentUser.email,
        name: this.currentUser.name,
        role: this.currentUser.role,
        lote: this.currentUser.lote || "Admin",
      },
      action, // 'create', 'update', 'delete', 'add_error', 'resolve_error', 'add_message', 'status_change', 'visibility_toggle', 'lote_assigned'
      details,
      targetField,
      sessionId: this.getSessionId(),
      version: appState.work.metadata?.version || 1,
    };

    appState.work.auditTrail.push(auditEntry);

    // Mantém apenas os últimos 1000 registros para não sobrecarregar
    if (appState.work.auditTrail.length > 1000) {
      appState.work.auditTrail = appState.work.auditTrail.slice(-1000);
    }

    console.log("Audit log:", auditEntry);
  },

  /**
   * Obtém ID da sessão atual
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem("oae-session-id");
    if (!sessionId) {
      sessionId =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("oae-session-id", sessionId);
    }
    return sessionId;
  },

  /**
   * Inicializa metadados de uma nova obra
   */
  initializeWorkMetadata() {
    const now = new Date().toISOString();

    appState.work.metadata = {
      createdBy: this.currentUser.email,
      createdAt: now,
      lastModifiedBy: this.currentUser.email,
      lastModifiedAt: now,
      sharedWith: [],
      isPublic: false, // Por padrão, obras não são públicas
      version: 1,
      tags: [],
      status: "draft",
    };

    this.logChange("create", {
      obra: appState.work.codigo || "Nova Obra",
      nome: appState.work.nome || "Sem nome",
    });
  },

  /**
   * Atualiza metadados após modificação
   */
  updateWorkMetadata(action, details) {
    const now = new Date().toISOString();

    appState.work.metadata.lastModifiedBy = this.currentUser.email;
    appState.work.metadata.lastModifiedAt = now;
    appState.work.metadata.version += 1;

    this.logChange(action, details);
  },

  /**
   * Adiciona informação de auditoria a um objeto
   */
  addAuditInfo(obj, action = "create") {
    if (!obj) return obj;

    return {
      ...obj,
      auditInfo: {
        createdBy: this.currentUser.email,
        createdAt: new Date().toISOString(),
        lastModifiedBy: this.currentUser.email,
        lastModifiedAt: new Date().toISOString(),
        action,
      },
    };
  },

  /**
   * Obtém histórico de um campo específico
   */
  getFieldHistory(fieldId) {
    const auditTrail = appState.work.auditTrail || [];
    return auditTrail
      .filter((entry) => entry.targetField === fieldId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  /**
   * Obtém todas as alterações de um usuário
   */
  getUserChanges(userEmail) {
    const auditTrail = appState.work.auditTrail || [];
    return auditTrail
      .filter((entry) => entry.user.email === userEmail)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  /**
   * Obtém estatísticas da obra
   */
  getWorkStats() {
    const auditTrail = appState.work.auditTrail || [];
    const totalChanges = auditTrail.length;
    const uniqueUsers = new Set(auditTrail.map((e) => e.user.email)).size;
    const actions = {};

    auditTrail.forEach((entry) => {
      actions[entry.action] = (actions[entry.action] || 0) + 1;
    });

    return {
      totalChanges,
      uniqueUsers,
      actions,
      createdAt: appState.work.metadata?.createdAt || null,
      lastModifiedAt: appState.work.metadata?.lastModifiedAt || null,
      version: appState.work.metadata?.version || 1,
      status: appState.work.metadata?.status || "draft",
    };
  },

  /**
   * Compartilha obra com outros usuários
   */
  shareWorkWith(emails, makePublic = false) {
    if (!Array.isArray(emails)) {
      emails = [emails];
    }

    // Inicializa metadata se não existir
    if (!appState.work.metadata) {
      appState.work.metadata = {
        createdBy: this.currentUser.email,
        createdAt: new Date().toISOString(),
        lastModifiedBy: this.currentUser.email,
        lastModifiedAt: new Date().toISOString(),
        sharedWith: [],
        isPublic: false,
        version: 1,
        tags: [],
        status: "draft",
      };
    }

    // Remove duplicados e emails inválidos
    const validEmails = [
      ...new Set(
        emails.filter(
          (email) => email && email.includes("@") && email.includes(".")
        )
      ),
    ];

    appState.work.metadata.sharedWith = [
      ...appState.work.metadata.sharedWith,
      ...validEmails,
    ].filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicados

    if (makePublic) {
      appState.work.metadata.isPublic = true;
    }

    this.updateWorkMetadata("share", {
      sharedWith: validEmails,
      madePublic: makePublic,
    });

    console.log("Work shared with:", validEmails, "Public:", makePublic);
  },

  /**
   * Verifica se usuário pode acessar a obra
   */
  canUserAccessWork(userEmail = null) {
    const checkEmail = userEmail || this.currentUser.email;
    const metadata = appState.work.metadata || {};

    // Criador sempre pode acessar
    if (metadata.createdBy === checkEmail) {
      return { canAccess: true, reason: "creator" };
    }

    // Se for pública, todos podem acessar
    if (metadata.isPublic) {
      return { canAccess: true, reason: "public" };
    }

    // Se estiver na lista de compartilhamento
    if ((metadata.sharedWith || []).includes(checkEmail)) {
      return { canAccess: true, reason: "shared" };
    }

    return { canAccess: false, reason: "not_authorized" };
  },

  /**
   * Adiciona tags à obra
   */
  addTags(tags) {
    if (!Array.isArray(tags)) {
      tags = [tags];
    }

    // Inicializa metadata se não existir
    if (!appState.work.metadata) {
      appState.work.metadata = {
        createdBy: this.currentUser.email,
        createdAt: new Date().toISOString(),
        lastModifiedBy: this.currentUser.email,
        lastModifiedAt: new Date().toISOString(),
        sharedWith: [],
        isPublic: false,
        version: 1,
        tags: [],
        status: "draft",
      };
    }

    const validTags = tags.filter((tag) => tag && tag.trim().length > 0);

    appState.work.metadata.tags = [
      ...appState.work.metadata.tags,
      ...validTags,
    ].filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicados

    this.updateWorkMetadata("add_tags", { tags: validTags });
  },

  /**
   * Remove tags da obra
   */
  removeTags(tags) {
    if (!Array.isArray(tags)) {
      tags = [tags];
    }

    // Inicializa metadata se não existir
    if (!appState.work.metadata) {
      appState.work.metadata = {
        createdBy: this.currentUser.email,
        createdAt: new Date().toISOString(),
        lastModifiedBy: this.currentUser.email,
        lastModifiedAt: new Date().toISOString(),
        sharedWith: [],
        isPublic: false,
        version: 1,
        tags: [],
        status: "draft",
      };
    }

    appState.work.metadata.tags = appState.work.metadata.tags.filter(
      (tag) => !tags.includes(tag)
    );

    this.updateWorkMetadata("remove_tags", { tags });
  },

  /**
   * Atualiza status da obra
   */
  updateStatus(newStatus) {
    const validStatuses = ["draft", "in_progress", "completed", "archived"];

    if (!validStatuses.includes(newStatus)) {
      console.error("Invalid status:", newStatus);
      return;
    }

    // Inicializa metadata se não existir
    if (!appState.work.metadata) {
      appState.work.metadata = {
        createdBy: this.currentUser.email,
        createdAt: new Date().toISOString(),
        lastModifiedBy: this.currentUser.email,
        lastModifiedAt: new Date().toISOString(),
        sharedWith: [],
        isPublic: false,
        version: 1,
        tags: [],
        status: "draft",
      };
    }

    const oldStatus = appState.work.metadata.status;
    appState.work.metadata.status = newStatus;

    this.updateWorkMetadata("status_change", {
      from: oldStatus,
      to: newStatus,
    });
  },

  /**
   * Exporta relatório de auditoria
   */
  exportAuditReport() {
    const stats = this.getWorkStats();
    const report = {
      obra: {
        codigo: appState.work.codigo,
        nome: appState.work.nome,
        avaliador: appState.work.avaliador,
      },
      metadata: appState.work.metadata || {},
      statistics: stats,
      auditTrail: appState.work.auditTrail || [],
      generatedAt: new Date().toISOString(),
      generatedBy: this.currentUser,
    };

    return report;
  },

  /**
   * Limpa histórico antigo (manter apenas últimos N registros)
   */
  cleanupOldHistory(keepCount = 500) {
    const auditTrail = appState.work.auditTrail || [];
    const originalLength = auditTrail.length;

    if (originalLength > keepCount) {
      appState.work.auditTrail = auditTrail.slice(-keepCount);

      this.logChange("cleanup", {
        removed: originalLength - keepCount,
        kept: keepCount,
      });
    }
  },
};

// Export para uso global
window.AuditSystem = AuditSystem;
