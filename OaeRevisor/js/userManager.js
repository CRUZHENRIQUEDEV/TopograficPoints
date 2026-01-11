/**
 * User Manager - OAE Revisor
 * Gerenciamento de usuários (apenas admin)
 */

const UserManager = {
  /**
   * Obtém todos os usuários cadastrados
   */
  getAllUsers() {
    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");
    return users.map((user) => ({
      ...user,
      password: undefined, // Não retorna senha
    }));
  },

  /**
   * Adiciona novo usuário (apenas admin)
   */
  addUser(userData) {
    if (!AuthSystem.hasPermission("manage_users")) {
      throw new Error("Apenas administradores podem gerenciar usuários");
    }

    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");

    // Verifica se email já existe
    if (users.find((u) => u.email === userData.email)) {
      throw new Error("Email já cadastrado");
    }

    // Valida dados
    if (
      !userData.email ||
      !userData.name ||
      !userData.role ||
      !userData.password
    ) {
      throw new Error("Todos os campos são obrigatórios");
    }

    // Valida role
    if (!Object.values(AuthSystem.ROLES).includes(userData.role)) {
      throw new Error("Role inválido");
    }

    // Valida email
    if (!userData.email.includes("@") || !userData.email.includes(".")) {
      throw new Error("Email inválido");
    }

    const newUser = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      password: userData.password,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: AuthSystem.currentUser.email,
    };

    users.push(newUser);
    localStorage.setItem("oae-users", JSON.stringify(users));

    // Registra no audit trail
    if (window.AuditSystem) {
      AuditSystem.logChange("user_created", {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      });
    }

    return newUser;
  },

  /**
   * Remove usuário (apenas admin)
   */
  removeUser(email) {
    if (!AuthSystem.hasPermission("manage_users")) {
      throw new Error("Apenas administradores podem gerenciar usuários");
    }

    // Não permite remover admin principal
    if (email === "admin@oae.com") {
      throw new Error("Não é possível remover o administrador principal");
    }

    // Não permite remover a si mesmo
    if (email === AuthSystem.currentUser.email) {
      throw new Error("Não é possível remover seu próprio usuário");
    }

    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");
    const userIndex = users.findIndex((u) => u.email === email);

    if (userIndex === -1) {
      throw new Error("Usuário não encontrado");
    }

    const removedUser = users[userIndex];
    users.splice(userIndex, 1);
    localStorage.setItem("oae-users", JSON.stringify(users));

    // Registra no audit trail
    if (window.AuditSystem) {
      AuditSystem.logChange("user_removed", {
        email: removedUser.email,
        name: removedUser.name,
        role: removedUser.role,
      });
    }

    return removedUser;
  },

  /**
   * Atualiza usuário (apenas admin)
   */
  updateUser(email, updates) {
    if (!AuthSystem.hasPermission("manage_users")) {
      throw new Error("Apenas administradores podem gerenciar usuários");
    }

    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");
    const userIndex = users.findIndex((u) => u.email === email);

    if (userIndex === -1) {
      throw new Error("Usuário não encontrado");
    }

    // Não permite alterar role do admin principal
    if (
      email === "admin@oae.com" &&
      updates.role &&
      updates.role !== AuthSystem.ROLES.ADMIN
    ) {
      throw new Error(
        "Não é possível alterar o role do administrador principal"
      );
    }

    const user = users[userIndex];

    // Atualiza apenas campos permitidos
    if (updates.name) user.name = updates.name;
    if (updates.role) user.role = updates.role;
    if (updates.password) user.password = updates.password;
    if (updates.active !== undefined) user.active = updates.active;

    user.updatedAt = new Date().toISOString();
    user.updatedBy = AuthSystem.currentUser.email;

    users[userIndex] = user;
    localStorage.setItem("oae-users", JSON.stringify(users));

    // Registra no audit trail
    if (window.AuditSystem) {
      AuditSystem.logChange("user_updated", {
        email: user.email,
        updates: Object.keys(updates),
      });
    }

    return {
      ...user,
      password: undefined, // Não retorna senha
    };
  },

  /**
   * Obtém usuários por role
   */
  getUsersByRole(role) {
    const users = this.getAllUsers();
    return users.filter((u) => u.role === role);
  },

  /**
   * Obtém estatísticas dos usuários
   */
  getUserStats() {
    const users = this.getAllUsers();
    const stats = {
      total: users.length,
      byRole: {},
      active: 0,
      inactive: 0,
    };

    users.forEach((user) => {
      // Por role
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;

      // Por status
      if (user.active) {
        stats.active++;
      } else {
        stats.inactive++;
      }
    });

    return stats;
  },

  /**
   * Verifica se usuário existe
   */
  userExists(email) {
    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");
    return users.some((u) => u.email === email);
  },

  /**
   * Obtém usuário por email
   */
  getUserByEmail(email) {
    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");
    const user = users.find((u) => u.email === email);

    if (user) {
      return {
        ...user,
        password: undefined, // Não retorna senha
      };
    }

    return null;
  },

  /**
   * Mostra modal de gerenciamento de usuários
   */
  showUserManagementModal() {
    if (!AuthSystem.hasPermission("manage_users")) {
      alert("Acesso negado");
      return;
    }

    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "userManagementModal";

    const users = this.getAllUsers();
    const stats = this.getUserStats();

    const html = `
      <div class="modal" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 class="modal-title">👥 Gerenciamento de Usuários</h3>
          <button class="modal-close" onclick="document.getElementById('userManagementModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <!-- Estatísticas -->
          <div class="section">
            <div class="section-title">📊 Estatísticas</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px;">
              <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <div style="font-size: 1.2rem; font-weight: 700;">${
                  stats.total
                }</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Total</div>
              </div>
              <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <div style="font-size: 1.2rem; font-weight: 700;">${
                  stats.active
                }</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Ativos</div>
              </div>
              <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <div style="font-size: 1.2rem; font-weight: 700;">${
                  stats.byRole.admin || 0
                }</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Admins</div>
              </div>
              <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <div style="font-size: 1.2rem; font-weight: 700;">${
                  stats.byRole.avaliador || 0
                }</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Avaliadores</div>
              </div>
              <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                <div style="font-size: 1.2rem; font-weight: 700;">${
                  stats.byRole.inspetor || 0
                }</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Inspetores</div>
              </div>
            </div>
          </div>

          <!-- Adicionar Novo Usuário -->
          <div class="section">
            <div class="section-title">➕ Adicionar Novo Usuário</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <input type="text" class="form-input" id="newUserName" placeholder="Nome completo">
              <input type="email" class="form-input" id="newUserEmail" placeholder="Email">
              <select class="form-input" id="newUserRole">
                <option value="">Selecione o role</option>
                <option value="avaliador">Avaliador</option>
                <option value="inspetor">Inspetor</option>
              </select>
              <input type="password" class="form-input" id="newUserPassword" placeholder="Senha">
              <button class="btn btn-primary" onclick="UserManager.addUserFromForm()">➕ Adicionar</button>
            </div>
            <div id="userAddError" style="color: var(--danger); margin-top: 10px;"></div>
          </div>

          <!-- Lista de Usuários -->
          <div class="section">
            <div class="section-title">📋 Usuários Cadastrados</div>
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 4px;">
              <table style="width: 100%; font-size: 0.85rem;">
                <thead style="position: sticky; top: 0; background: var(--bg-secondary);">
                  <tr>
                    <th style="padding: 8px; text-align: left;">Nome</th>
                    <th style="padding: 8px; text-align: left;">Email</th>
                    <th style="padding: 8px; text-align: left;">Role</th>
                    <th style="padding: 8px; text-align: left;">Status</th>
                    <th style="padding: 8px; text-align: left;">Criado em</th>
                    <th style="padding: 8px; text-align: center;">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${users
                    .map(
                      (user) => `
                    <tr style="border-bottom: 1px solid var(--border);">
                      <td style="padding: 8px;">${user.name}</td>
                      <td style="padding: 8px;">${user.email}</td>
                      <td style="padding: 8px;">
                        <span class="role-badge ${
                          user.role
                        }">${AuthSystem.getRoleDisplayName(user.role)}</span>
                      </td>
                      <td style="padding: 8px;">
                        <span class="status-badge ${
                          user.active ? "active" : "inactive"
                        }">
                          ${user.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td style="padding: 8px;">${new Date(
                        user.createdAt || Date.now()
                      ).toLocaleDateString("pt-BR")}</td>
                      <td style="padding: 8px; text-align: center;">
                        ${
                          user.email !== "admin@oae.com"
                            ? `
                          <button class="btn btn-sm btn-danger" onclick="UserManager.removeUser('${user.email}')">🗑️</button>
                        `
                            : '<span style="color: var(--text-muted);">🔒</span>'
                        }
                      </td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Ações Administrativas -->
          <div class="section">
            <div class="section-title">⚠️ AÇÕES ADMINISTRATIVAS</div>
            <div style="background: rgba(var(--danger-rgb), 0.1); border: 2px solid var(--danger); border-radius: 8px; padding: 20px;">
              <div style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 10px;">☠️</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--danger); margin-bottom: 10px;">
                  PODER ADMINISTRATIVO EXTREMO
                </div>
                <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px;">
                  Esta ação irá deletar TODAS as obras do sistema (local + peers)
                </div>
                <button class="btn btn-danger" onclick="UserManager.initiateDeleteAllWorks()" style="background: linear-gradient(135deg, var(--danger) 0%, #000 100%);">
                  ☠️ DELETAR TODAS AS OBRAS
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('userManagementModal').remove()">Fechar</button>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);
  },

  /**
   * Adiciona usuário a partir do formulário
   */
  async addUserFromForm() {
    try {
      const name = document.getElementById("newUserName").value.trim();
      const email = document.getElementById("newUserEmail").value.trim();
      const role = document.getElementById("newUserRole").value;
      const password = document.getElementById("newUserPassword").value;

      const user = await this.addUser({ name, email, role, password });

      // Limpa formulário
      document.getElementById("newUserName").value = "";
      document.getElementById("newUserEmail").value = "";
      document.getElementById("newUserRole").value = "";
      document.getElementById("newUserPassword").value = "";
      document.getElementById("userAddError").textContent = "";

      // Atualiza lista
      this.showUserManagementModal();

      alert(`Usuário "${user.name}" adicionado com sucesso!`);
    } catch (error) {
      document.getElementById("userAddError").textContent = error.message;
    }
  },

  /**
   * Inicia processo de deleção de todas as obras (apenas admin)
   */
  initiateDeleteAllWorks() {
    if (!AuthSystem.hasPermission("manage_users")) {
      alert("Acesso negado: Apenas administradores podem executar esta ação.");
      return;
    }

    this.showDeleteAllWorksConfirmation(1);
  },

  /**
   * Mostra confirmação de deleção de todas as obras
   */
  showDeleteAllWorksConfirmation(step) {
    if (step > 5) {
      // Confirmação final com timer
      this.showFinalDeleteConfirmation();
      return;
    }

    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "deleteAllWorksModal";

    const warnings = [
      "⚠️ Esta ação irá deletar TODAS as obras do banco de dados local.",
      "🚨 Esta ação é IRREVERSÍVEL e afetará TODOS os dados salvos.",
      "💀 Você está prestes a PERDER TODAS as obras cadastradas.",
      "☠️ Esta é sua ÚLTIMA chance de cancelar esta ação destrutiva.",
      "⚡ ESTÁ CERTO? Não há volta após este ponto!",
    ];

    const html = `
      <div class="modal" style="max-width: 500px; border: 3px solid var(--danger);">
        <div class="modal-header" style="background: linear-gradient(135deg, var(--danger) 0%, #c44569 100%);">
          <h3 class="modal-title">⚠️ CONFIRMAÇÃO DE DELEÇÃO MASSIVA</h3>
        </div>
        <div class="modal-body">
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 3rem; margin-bottom: 20px;">💀</div>
            <div style="font-size: 1.2rem; font-weight: 700; color: var(--danger); margin-bottom: 15px;">
              ETAPA ${step} DE 5
            </div>
            <div style="background: rgba(var(--danger-rgb), 0.1); border: 2px solid var(--danger); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              ${warnings[step - 1]}
            </div>
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
              Digite "DELETAR" para continuar para a próxima etapa:
            </div>
            <input type="text" class="form-input" id="deleteConfirmationInput" placeholder="Digite DELETAR" style="text-align: center; text-transform: uppercase; margin-bottom: 15px;">
            <div id="deleteError" style="color: var(--danger); margin-bottom: 15px;"></div>
            <div style="display: flex; gap: 10px; justify-content: center;">
              <button class="btn btn-danger" onclick="UserManager.confirmDeleteStep(${step})">
                ⚠️ Continuar (Etapa ${step + 1})
              </button>
              <button class="btn btn-secondary" onclick="document.getElementById('deleteAllWorksModal').remove()">
                ❌ CANCELAR
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Foco no input
    setTimeout(() => {
      document.getElementById("deleteConfirmationInput").focus();
    }, 100);
  },

  /**
   * Confirma etapa de deleção
   */
  confirmDeleteStep(step) {
    const input = document.getElementById("deleteConfirmationInput");
    const errorDiv = document.getElementById("deleteError");

    if (input.value.trim().toUpperCase() !== "DELETAR") {
      errorDiv.textContent =
        '❌ Você deve digitar exatamente "DELETAR" para continuar';
      input.value = "";
      input.focus();
      return;
    }

    // Remove modal atual
    document.getElementById("deleteAllWorksModal").remove();

    // Próxima etapa
    this.showDeleteAllWorksConfirmation(step + 1);
  },

  /**
   * Mostra confirmação final com timer
   */
  showFinalDeleteConfirmation() {
    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "finalDeleteModal";

    let countdown = 5;

    const html = `
      <div class="modal" style="max-width: 600px; border: 3px solid var(--danger);">
        <div class="modal-header" style="background: linear-gradient(135deg, #000 0%, var(--danger) 100%);">
          <h3 class="modal-title">☠️ CONFIRMAÇÃO FINAL - DELEÇÃO TOTAL</h3>
        </div>
        <div class="modal-body">
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 1s infinite;">💀</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger); margin-bottom: 15px;">
              ⚡ ÚLTIMA OPORTUNIDADE ⚡
            </div>
            <div style="background: #000; color: #fff; border: 2px solid var(--danger); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <div style="font-size: 1.1rem; margin-bottom: 10px;">
                🚨 ESTA AÇÃO IRÁ:
              </div>
              <ul style="text-align: left; margin: 0; padding-left: 20px;">
                <li>💀 DELETAR TODAS as obras do banco local</li>
                <li>🗑️ LIMPAR completamente o IndexedDB</li>
                <li>📡 ENVIAR ordem de deleção para todos os peers conectados</li>
                <li>☠️ DESTRUIR todos os dados IRREVERSIVELMENTE</li>
              </ul>
            </div>
            <div style="font-size: 1.2rem; font-weight: 700; color: var(--danger); margin-bottom: 15px;">
              ⏰ AGUARDANDO ${countdown} SEGUNDOS...
            </div>
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
              Use este tempo para CANCELAR se tiver qualquer dúvida
            </div>
            <div id="finalDeleteError" style="color: var(--danger); margin-bottom: 15px;"></div>
            <div style="display: flex; gap: 10px; justify-content: center;">
              <button class="btn btn-danger" id="finalDeleteBtn" disabled>
                ☠️ DELETAR TUDO (Aguarde ${countdown}s)
              </button>
              <button class="btn btn-success" onclick="document.getElementById('finalDeleteModal').remove()">
                🛡️ CANCELAR E SALVAR
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Timer de 5 segundos
    const timer = setInterval(() => {
      countdown--;
      const btn = document.getElementById("finalDeleteBtn");
      const countdownDiv = modal.querySelector('div[style*="AGUARDANDO"]');

      if (countdown > 0) {
        btn.textContent = `☠️ DELETAR TUDO (Aguarde ${countdown}s)`;
        btn.disabled = true;
        countdownDiv.innerHTML = `⏰ AGUARDANDO ${countdown} SEGUNDOS...`;
      } else {
        clearInterval(timer);
        btn.textContent = "☠️ DELETAR TUDO (CONFIRMADO)";
        btn.disabled = false;
        btn.style.background =
          "linear-gradient(135deg, #000 0%, var(--danger) 100%)";
        btn.style.animation = "pulse 1s infinite";
        countdownDiv.innerHTML =
          "⚡ PRONTO PARA DELETAR - CLIQUE PARA CONFIRMAR";
        countdownDiv.style.color = "#ff0000";
      }
    }, 1000);

    // Evento do botão final
    document.getElementById("finalDeleteBtn").onclick = () => {
      if (countdown === 0) {
        clearInterval(timer);
        this.executeDeleteAllWorks();
      }
    };
  },

  /**
   * Executa deleção de todas as obras
   */
  async executeDeleteAllWorks() {
    try {
      // Remove modal
      document.getElementById("finalDeleteModal").remove();

      // Mostra modal de progresso
      const progressModal = document.createElement("div");
      progressModal.className = "modal-backdrop show";
      progressModal.id = "deleteProgressModal";
      progressModal.innerHTML = `
        <div class="modal" style="max-width: 400px;">
          <div class="modal-header" style="background: linear-gradient(135deg, var(--danger) 0%, #000 100%);">
            <h3 class="modal-title">💀 DELETANDO TUDO...</h3>
          </div>
          <div class="modal-body">
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 2rem; margin-bottom: 15px;">🗑️</div>
              <div id="deleteProgress" style="font-size: 1rem; margin-bottom: 15px;">
                Iniciando deleção massiva...
              </div>
              <div style="width: 100%; height: 20px; background: var(--bg-secondary); border-radius: 10px; overflow: hidden; margin-bottom: 15px;">
                <div id="deleteProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--danger) 0%, #000 100%); transition: width 0.3s ease;"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(progressModal);

      // 1. Deleta banco local
      this.updateProgress("Deletando banco de dados local...", 20);
      await this.deleteLocalDatabase();

      // 2. Envia ordem para peers
      this.updateProgress("Enviando ordem para peers conectados...", 50);
      await this.sendDeleteOrderToPeers();

      // 3. Limpa localStorage relacionado
      this.updateProgress("Limpando dados locais...", 80);
      this.clearRelatedData();

      // 4. Finaliza
      this.updateProgress("Deleção completa!", 100);

      setTimeout(() => {
        document.getElementById("deleteProgressModal").remove();
        alert(
          "☠️ TODAS as obras foram deletadas com sucesso!\n\nO sistema será recarregado."
        );
        location.reload();
      }, 2000);
    } catch (error) {
      console.error("Delete all works error:", error);
      document.getElementById("deleteProgressModal").remove();
      alert("❌ Erro durante a deleção: " + error.message);
    }
  },

  /**
   * Atualiza progresso da deleção
   */
  updateProgress(message, percentage) {
    const progressDiv = document.getElementById("deleteProgress");
    const progressBar = document.getElementById("deleteProgressBar");

    if (progressDiv) progressDiv.textContent = message;
    if (progressBar) progressBar.style.width = percentage + "%";
  },

  /**
   * Deleta banco de dados local
   */
  async deleteLocalDatabase() {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase("OaeRevisorDB");

      deleteRequest.onsuccess = () => {
        console.log("Local database deleted successfully");
        resolve();
      };

      deleteRequest.onerror = (event) => {
        console.error("Error deleting local database:", event.target.error);
        reject(new Error("Erro ao deletar banco local"));
      };

      deleteRequest.onblocked = () => {
        console.log("Database deletion blocked");
        // Força deleção mesmo se bloqueado
        resolve();
      };
    });
  },

  /**
   * Envia ordem de deleção para peers
   */
  async sendDeleteOrderToPeers() {
    if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
      const deleteOrder = {
        type: "DELETE_ALL_WORKS",
        sender: AuthSystem.currentUser.email,
        timestamp: Date.now(),
        message: "DELETE_ALL_WORKS_CONFIRMED",
      };

      // Envia para todos os peers conectados
      MultiPeerSync.broadcast(deleteOrder);
      console.log("Delete order sent to all peers");
    }
  },

  /**
   * Limpa dados relacionados
   */
  clearRelatedData() {
    // Limpa localStorage relacionado a obras
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes("obra") || key.includes("work") || key.includes("audit"))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Limpa sessionStorage
    sessionStorage.clear();

    console.log("Related data cleared");
  },
};

// Export para uso global
window.UserManager = UserManager;
