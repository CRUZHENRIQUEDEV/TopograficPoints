/**
 * Field Chat System - OAE Revisor
 * Sistema de comunicação por campo entre avaliador e inspetor
 */

const FieldChat = {
  // Chat ativo por campo
  activeChats: new Map(),

  /**
   * Inicializa o sistema de chat por campo
   */
  init() {
    console.log("Field Chat System initialized");
  },

  /**
   * Adiciona comentário a um campo
   */
  addFieldComment(fieldId, comment, type = "error") {
    if (!AuthSystem.isLoggedIn) {
      throw new Error("Usuário não logado");
    }

    // Verifica permissões
    if (type === "error" && !AuthSystem.hasPermission("point_field_errors")) {
      throw new Error("Apenas avaliadores podem apontar erros");
    }

    if (
      type === "suggestion" &&
      !AuthSystem.hasPermission("suggest_corrections")
    ) {
      throw new Error("Apenas inspetores podem sugerir correções");
    }

    // Inicializa chat do campo se não existir
    if (!appState.work.fieldChats) {
      appState.work.fieldChats = {};
    }

    if (!appState.work.fieldChats[fieldId]) {
      appState.work.fieldChats[fieldId] = [];
    }

    const commentData = {
      id:
        "comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      fieldId,
      type, // 'error', 'suggestion', 'reply'
      comment,
      author: {
        email: AuthSystem.currentUser.email,
        name: AuthSystem.currentUser.name,
        role: AuthSystem.currentUser.role,
      },
      timestamp: new Date().toISOString(),
      resolved: false,
      replies: [],
    };

    appState.work.fieldChats[fieldId].push(commentData);

    // Registra no audit trail
    if (window.AuditSystem) {
      AuditSystem.logChange("field_comment", {
        fieldId,
        commentId: commentData.id,
        type,
        author: commentData.author,
      });
    }

    // Atualiza UI do campo
    this.updateFieldUI(fieldId);

    // Envia via MultiPeerSync se conectado
    if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
      MultiPeerSync.broadcastFieldComment(commentData);
    }

    return commentData;
  },

  /**
   * Responde a um comentário
   */
  replyToComment(fieldId, commentId, reply) {
    if (!AuthSystem.isLoggedIn) {
      throw new Error("Usuário não logado");
    }

    if (!appState.work.fieldChats || !appState.work.fieldChats[fieldId]) {
      throw new Error("Campo não possui comentários");
    }

    const fieldComments = appState.work.fieldChats[fieldId];
    const parentComment = fieldComments.find((c) => c.id === commentId);

    if (!parentComment) {
      throw new Error("Comentário não encontrado");
    }

    const replyData = {
      id: "reply_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      comment: reply,
      author: {
        email: AuthSystem.currentUser.email,
        name: AuthSystem.currentUser.name,
        role: AuthSystem.currentUser.role,
      },
      timestamp: new Date().toISOString(),
    };

    parentComment.replies.push(replyData);

    // Registra no audit trail
    if (window.AuditSystem) {
      AuditSystem.logChange("field_reply", {
        fieldId,
        commentId,
        replyId: replyData.id,
        author: replyData.author,
      });
    }

    // Atualiza UI do campo
    this.updateFieldUI(fieldId);

    // Envia via MultiPeerSync
    if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
      MultiPeerSync.broadcastFieldReply({
        fieldId,
        commentId,
        reply: replyData,
      });
    }

    return replyData;
  },

  /**
   * Resolve um comentário
   */
  resolveComment(fieldId, commentId) {
    if (!AuthSystem.isLoggedIn) {
      throw new Error("Usuário não logado");
    }

    if (!appState.work.fieldChats || !appState.work.fieldChats[fieldId]) {
      throw new Error("Campo não possui comentários");
    }

    const fieldComments = appState.work.fieldChats[fieldId];
    const comment = fieldComments.find((c) => c.id === commentId);

    if (!comment) {
      throw new Error("Comentário não encontrado");
    }

    // Apenas quem criou ou admin pode resolver
    if (
      comment.author.email !== AuthSystem.currentUser.email &&
      !AuthSystem.hasPermission("manage_users")
    ) {
      throw new Error(
        "Apenas o autor ou administrador pode resolver o comentário"
      );
    }

    comment.resolved = true;
    comment.resolvedBy = {
      email: AuthSystem.currentUser.email,
      name: AuthSystem.currentUser.name,
    };
    comment.resolvedAt = new Date().toISOString();

    // Registra no audit trail
    if (window.AuditSystem) {
      AuditSystem.logChange("field_resolved", {
        fieldId,
        commentId,
        resolvedBy: comment.resolvedBy,
      });
    }

    // Atualiza UI do campo
    this.updateFieldUI(fieldId);

    return comment;
  },

  /**
   * Obtém comentários de um campo
   */
  getFieldComments(fieldId) {
    if (!appState.work.fieldChats || !appState.work.fieldChats[fieldId]) {
      return [];
    }

    return appState.work.fieldChats[fieldId].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  },

  /**
   * Obtém estatísticas de comentários
   */
  getCommentStats() {
    if (!appState.work.fieldChats) {
      return {
        total: 0,
        unresolved: 0,
        byType: { error: 0, suggestion: 0, reply: 0 },
        byAuthor: {},
      };
    }

    const stats = {
      total: 0,
      unresolved: 0,
      byType: { error: 0, suggestion: 0, reply: 0 },
      byAuthor: {},
    };

    Object.values(appState.work.fieldChats).forEach((fieldComments) => {
      fieldComments.forEach((comment) => {
        stats.total++;
        if (!comment.resolved) stats.unresolved++;
        stats.byType[comment.type] = (stats.byType[comment.type] || 0) + 1;

        const authorKey = comment.author.email;
        stats.byAuthor[authorKey] = (stats.byAuthor[authorKey] || 0) + 1;

        // Conta replies
        comment.replies.forEach((reply) => {
          stats.total++;
          stats.byType.reply = (stats.byType.reply || 0) + 1;
          const replyAuthorKey = reply.author.email;
          stats.byAuthor[replyAuthorKey] =
            (stats.byAuthor[replyAuthorKey] || 0) + 1;
        });
      });
    });

    return stats;
  },

  /**
   * Atualiza UI de um campo com indicadores de chat
   */
  updateFieldUI(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const comments = this.getFieldComments(fieldId);
    const unresolvedCount = comments.filter((c) => !c.resolved).length;

    // Remove indicadores antigos
    const oldIndicator = field.parentNode.querySelector(
      ".field-chat-indicator"
    );
    if (oldIndicator) {
      oldIndicator.remove();
    }

    // Adiciona indicador se houver comentários
    if (comments.length > 0) {
      const indicator = document.createElement("div");
      indicator.className = "field-chat-indicator";
      indicator.innerHTML = `
        <span class="chat-icon" onclick="FieldChat.showFieldChatModal('${fieldId}')">
          💬 ${comments.length}
        </span>
        ${
          unresolvedCount > 0
            ? `<span class="unresolved-count">${unresolvedCount}</span>`
            : ""
        }
      `;

      field.parentNode.style.position = "relative";
      field.parentNode.appendChild(indicator);
    }
  },

  /**
   * Mostra modal de chat do campo
   */
  showFieldChatModal(fieldId) {
    const comments = this.getFieldComments(fieldId);
    const fieldLabel = this.getFieldLabel(fieldId);

    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "fieldChatModal";

    const html = `
      <div class="modal" style="max-width: 700px; max-height: 80vh;">
        <div class="modal-header">
          <h3 class="modal-title">💬 Chat do Campo - ${fieldLabel}</h3>
          <button class="modal-close" onclick="document.getElementById('fieldChatModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <!-- Área de Comentários -->
          <div class="field-chat-comments" style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
            ${
              comments.length === 0
                ? `
              <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                Nenhum comentário neste campo ainda.
              </div>
            `
                : comments
                    .map(
                      (comment) => `
              <div class="chat-comment ${
                comment.resolved ? "resolved" : ""
              }" style="margin-bottom: 15px; padding: 15px; border: 1px solid var(--border); border-radius: 8px; ${
                        comment.resolved
                          ? "background: var(--bg-secondary); opacity: 0.7;"
                          : ""
                      }">
                <div class="comment-header" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <div>
                    <strong>${comment.author.name}</strong>
                    <span class="role-badge ${
                      comment.author.role
                    }" style="margin-left: 8px; font-size: 0.7rem;">${AuthSystem.getRoleDisplayName(
                        comment.author.role
                      )}</span>
                    <span class="comment-type ${
                      comment.type
                    }" style="margin-left: 8px; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">
                      ${comment.type === "error" ? "❌ Erro" : "💡 Sugestão"}
                    </span>
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">
                    ${new Date(comment.timestamp).toLocaleString("pt-BR")}
                    ${
                      comment.resolved
                        ? '<span style="color: var(--success); margin-left: 8px;">✅ Resolvido</span>'
                        : ""
                    }
                  </div>
                </div>
                <div class="comment-content" style="margin-bottom: 10px;">
                  ${comment.comment}
                </div>
                
                <!-- Replies -->
                ${
                  comment.replies.length > 0
                    ? `
                  <div class="comment-replies" style="margin-left: 20px; border-left: 2px solid var(--border); padding-left: 15px;">
                    ${comment.replies
                      .map(
                        (reply) => `
                      <div class="comment-reply" style="margin-bottom: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 4px;">
                        <div style="font-size: 0.8rem; margin-bottom: 4px;">
                          <strong>${reply.author.name}</strong>
                          <span class="role-badge ${
                            reply.author.role
                          }" style="margin-left: 4px; font-size: 0.6rem;">${AuthSystem.getRoleDisplayName(
                          reply.author.role
                        )}</span>
                          <span style="color: var(--text-muted); margin-left: 8px;">${new Date(
                            reply.timestamp
                          ).toLocaleString("pt-BR")}</span>
                        </div>
                        <div>${reply.comment}</div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }
                
                <!-- Ações -->
                <div class="comment-actions" style="margin-top: 10px;">
                  <input type="text" class="form-input" id="replyInput_${
                    comment.id
                  }" placeholder="Responder..." style="width: 70%; margin-right: 8px;">
                  <button class="btn btn-sm btn-primary" onclick="FieldChat.replyToComment('${fieldId}', '${
                        comment.id
                      }', document.getElementById('replyInput_${
                        comment.id
                      }').value); FieldChat.showFieldChatModal('${fieldId}');">Responder</button>
                  ${
                    !comment.resolved &&
                    (comment.author.email === AuthSystem.currentUser.email ||
                      AuthSystem.hasPermission("manage_users"))
                      ? `
                    <button class="btn btn-sm btn-success" onclick="FieldChat.resolveComment('${fieldId}', '${comment.id}'); FieldChat.showFieldChatModal('${fieldId}');">Resolver</button>
                  `
                      : ""
                  }
                </div>
              </div>
            `
                    )
                    .join("")
            }
          </div>
          
          <!-- Novo Comentário -->
          ${
            AuthSystem.hasPermission("point_field_errors") ||
            AuthSystem.hasPermission("suggest_corrections")
              ? `
            <div class="new-comment">
              <div class="form-field">
                <label class="form-label">Novo Comentário</label>
                <textarea class="form-input" id="newComment_${fieldId}" rows="3" placeholder="Descreva o erro ou sugestão..."></textarea>
              </div>
              ${
                AuthSystem.hasPermission("point_field_errors")
                  ? `
                <button class="btn btn-danger" onclick="FieldChat.addErrorComment('${fieldId}')">❌ Apontar Erro</button>
              `
                  : ""
              }
              ${
                AuthSystem.hasPermission("suggest_corrections")
                  ? `
                <button class="btn btn-warning" onclick="FieldChat.addSuggestionComment('${fieldId}')">💡 Sugerir Correção</button>
              `
                  : ""
              }
            </div>
          `
              : ""
          }
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('fieldChatModal').remove()">Fechar</button>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);
  },

  /**
   * Adiciona comentário de erro
   */
  addErrorComment(fieldId) {
    const comment = document
      .getElementById(`newComment_${fieldId}`)
      .value.trim();
    if (!comment) {
      alert("Digite um comentário");
      return;
    }

    try {
      this.addFieldComment(fieldId, comment, "error");
      this.showFieldChatModal(fieldId);
    } catch (error) {
      alert(error.message);
    }
  },

  /**
   * Adiciona comentário de sugestão
   */
  addSuggestionComment(fieldId) {
    const comment = document
      .getElementById(`newComment_${fieldId}`)
      .value.trim();
    if (!comment) {
      alert("Digite uma sugestão");
      return;
    }

    try {
      this.addFieldComment(fieldId, comment, "suggestion");
      this.showFieldChatModal(fieldId);
    } catch (error) {
      alert(error.message);
    }
  },

  /**
   * Obtém label do campo
   */
  getFieldLabel(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return fieldId;

    const label = document.querySelector(`label[for="${fieldId}"]`);
    return label ? label.textContent : fieldId;
  },

  /**
   * Atualiza todos os indicadores de chat
   */
  updateAllFieldIndicators() {
    if (!appState.work.fieldChats) return;

    Object.keys(appState.work.fieldChats).forEach((fieldId) => {
      this.updateFieldUI(fieldId);
    });
  },
};

// Export para uso global
window.FieldChat = FieldChat;
