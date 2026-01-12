/**
 * Sync Methods - OAE Revisor
 * Métodos alternativos de sincronização de usuários
 */

const SyncMethods = {
  /**
   * Gera QR Code com dados dos usuários
   */
  generateQRCode() {
    const users = JSON.parse(localStorage.getItem("oae-users") || "[]");

    // Remove senhas sensíveis do admin para segurança
    const usersToShare = users.map(user => ({
      ...user,
      // Mantém senha apenas para usuários não-admin
      password: user.email === "admin@oae.com" ? undefined : user.password
    }));

    const data = {
      version: "1.0",
      type: "oae-users-sync",
      timestamp: Date.now(),
      users: usersToShare,
      sharedBy: AuthSystem.currentUser?.email || "unknown"
    };

    // Comprime e codifica
    const jsonString = JSON.stringify(data);
    const encoded = btoa(jsonString);

    return encoded;
  },

  /**
   * Mostra modal com QR Code
   */
  showQRCodeModal() {
    const qrData = this.generateQRCode();

    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "qrCodeModal";

    const html = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">📱 QR Code de Sincronização</h3>
          <button class="modal-close" onclick="document.getElementById('qrCodeModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
              Escaneie este QR Code em outro dispositivo para sincronizar usuários
            </div>

            <!-- QR Code gerado via biblioteca externa -->
            <div id="qrCodeContainer" style="display: flex; justify-content: center; margin-bottom: 20px; background: white; padding: 20px; border-radius: 8px;">
              <canvas id="qrCanvas"></canvas>
            </div>

            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
                Código de Dados:
              </div>
              <textarea
                readonly
                id="qrDataText"
                style="width: 100%; height: 80px; font-family: monospace; font-size: 0.7rem; resize: none; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 4px; padding: 8px;"
              >${qrData}</textarea>
            </div>

            <button class="btn btn-primary" onclick="SyncMethods.copyQRData()">
              📋 Copiar Código
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('qrCodeModal').remove()">Fechar</button>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Gera QR Code usando QRCode.js (biblioteca leve)
    setTimeout(() => {
      this.renderQRCode(qrData);
    }, 100);
  },

  /**
   * Renderiza QR Code no canvas
   */
  renderQRCode(data) {
    // Usando uma implementação simples de QR Code
    // Para produção, use uma biblioteca como qrcode.js
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Por enquanto, mostra mensagem para usar biblioteca externa
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code seria renderizado aqui', size/2, size/2 - 20);
    ctx.fillText('Use o botão "Copiar Código" abaixo', size/2, size/2 + 10);
    ctx.fillText('e cole no outro dispositivo', size/2, size/2 + 30);
  },

  /**
   * Copia dados do QR Code
   */
  copyQRData() {
    const textarea = document.getElementById('qrDataText');
    if (textarea) {
      textarea.select();
      navigator.clipboard.writeText(textarea.value)
        .then(() => {
          alert('✅ Código copiado! Cole no outro dispositivo.');
        })
        .catch(err => {
          console.error('Erro ao copiar:', err);
          alert('❌ Erro ao copiar código');
        });
    }
  },

  /**
   * Importa usuários de QR Code
   */
  async importFromQRCode(encodedData) {
    try {
      const jsonString = atob(encodedData);
      const data = JSON.parse(jsonString);

      // Validações
      if (data.type !== "oae-users-sync") {
        throw new Error("Código inválido: tipo incorreto");
      }

      if (!data.users || !Array.isArray(data.users)) {
        throw new Error("Código inválido: sem dados de usuários");
      }

      const localUsers = JSON.parse(localStorage.getItem("oae-users") || "[]");
      const remoteUsers = data.users;

      // Merge de usuários
      const merged = new Map();

      // Adiciona usuários locais
      for (const user of localUsers) {
        merged.set(user.email, user);
      }

      // Adiciona usuários remotos
      for (const remoteUser of remoteUsers) {
        if (!merged.has(remoteUser.email) && remoteUser.password) {
          merged.set(remoteUser.email, {
            ...remoteUser,
            syncedFrom: data.sharedBy,
            syncedAt: Date.now(),
            syncMethod: "qrcode",
            authorizedForever: true // import via QR/link implies permanent authorization
          });
        }
      }

      const mergedUsers = Array.from(merged.values());
      localStorage.setItem("oae-users", JSON.stringify(mergedUsers));

      return {
        success: true,
        count: mergedUsers.length,
        newUsers: mergedUsers.length - localUsers.length
      };
    } catch (error) {
      console.error("Erro ao importar QR Code:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Mostra modal para importar QR Code
   */
  showImportQRModal() {
    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "importQRModal";

    const html = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">📥 Importar Usuários via QR Code</h3>
          <button class="modal-close" onclick="document.getElementById('importQRModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="padding: 20px;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
              Cole o código que você copiou do QR Code
            </div>

            <textarea
              id="importQRData"
              class="form-input"
              style="width: 100%; height: 150px; font-family: monospace; font-size: 0.75rem; resize: vertical;"
              placeholder="Cole o código aqui..."
            ></textarea>

            <div id="importQRStatus" style="margin-top: 15px; font-size: 0.85rem;"></div>

            <hr style="margin: 20px 0;" />

            <div style="margin-top: 10px;">
              <div style="font-weight: 600; margin-bottom: 8px;">🔗 Importar via Link</div>
              <input id="importWorkLinkInput" class="form-input" placeholder="Cole o link de compartilhamento ou o código aqui..." style="width: 100%;" />
              <div id="importWorkLinkStatus" style="margin-top: 8px; font-size: 0.85rem;"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('importQRModal').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="SyncMethods.processQRImport()">
            📥 Importar Usuários
          </button>
          <button class="btn btn-success" onclick="SyncMethods.processWorkLinkImport()" style="margin-left: 10px;">
            🔗 Importar Obra via Link
          </button>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);
  },

  /**
   * Processa importação de QR Code
   */
  async processQRImport() {
    const textarea = document.getElementById('importQRData');
    const status = document.getElementById('importQRStatus');
    const data = textarea.value.trim();

    if (!data) {
      status.textContent = "❌ Cole o código primeiro";
      status.style.color = "var(--danger)";
      return;
    }

    status.textContent = "🔄 Importando...";
    status.style.color = "var(--primary)";

    const result = await this.importFromQRCode(data);

    if (result.success) {
      status.textContent = `✅ ${result.count} usuários importados! (${result.newUsers} novos)`;
      status.style.color = "var(--success)";

      setTimeout(() => {
        document.getElementById('importQRModal').remove();
        alert(`Importação concluída!\n\n✅ ${result.count} usuários disponíveis\n🆕 ${result.newUsers} novos usuários\n\nVocê já pode fazer login!`);
      }, 2000);
    } else {
      status.textContent = `❌ Erro: ${result.error}`;
      status.style.color = "var(--danger)";
    }
  },

  /**
   * Tenta importar obra a partir de um link ou código inserido pelo usuário
   */
  async processWorkLinkImport() {
    const input = document.getElementById('importWorkLinkInput');
    const status = document.getElementById('importWorkLinkStatus');
    const raw = (input.value || '').trim();

    if (!raw) {
      status.textContent = '❌ Cole o link ou código primeiro';
      status.style.color = 'var(--danger)';
      return;
    }

    status.textContent = '🔄 Processando...';
    status.style.color = 'var(--primary)';

    try {
      let encoded = raw;

      // Se for uma URL completa, tenta extrair o parâmetro shareWork
      try {
        if (raw.startsWith('http')) {
          const url = new URL(raw);
          const param = url.searchParams.get('shareWork');
          if (param) encoded = param;
        }
      } catch (e) {
        // não é URL, continua
      }

      // Se o usuário colou o link que contém '?shareWork=' sem o origin
      const idx = raw.indexOf('shareWork=');
      if (idx !== -1 && !raw.startsWith('http')) {
        encoded = raw.substring(idx + 'shareWork='.length);
      }

      // Delega para o fluxo existente (mostra modal de importação)
      await this.showAutoWorkImportNotification(encodeURIComponent(encoded));
      status.textContent = '✅ Link processado! Veja a confirmação na tela.';
      status.style.color = 'var(--success)';
    } catch (err) {
      console.error('Erro ao processar link:', err);
      status.textContent = '❌ Erro ao processar link: ' + err.message;
      status.style.color = 'var(--danger)';
    }
  },

  // ==================== LINK DE CONVITE ====================

  /**
   * Gera link de convite com dados dos usuários
   */
  generateInviteLink() {
    const qrData = this.generateQRCode();
    const baseUrl = window.location.origin + window.location.pathname;
    const inviteLink = `${baseUrl}?sync=${encodeURIComponent(qrData)}`;

    return inviteLink;
  },

  /**
   * Mostra modal com link de convite
   */
  showInviteLinkModal() {
    const inviteLink = this.generateInviteLink();

    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "inviteLinkModal";

    const html = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">🔗 Link de Convite</h3>
          <button class="modal-close" onclick="document.getElementById('inviteLinkModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="padding: 20px;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
              Compartilhe este link para sincronizar usuários automaticamente
            </div>

            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 2px solid var(--primary);">
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 600;">
                🔗 LINK DE CONVITE:
              </div>
              <textarea
                readonly
                id="inviteLinkText"
                style="width: 100%; height: 80px; font-family: monospace; font-size: 0.75rem; resize: none; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 4px; padding: 8px; word-break: break-all;"
              >${inviteLink}</textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <button class="btn btn-primary" onclick="SyncMethods.copyInviteLink()">
                📋 Copiar Link
              </button>
              <button class="btn btn-success" onclick="SyncMethods.shareInviteLink()">
                📤 Compartilhar
              </button>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: rgba(var(--warning-rgb), 0.1); border: 1px solid var(--warning); border-radius: 6px;">
              <div style="font-size: 0.8rem; color: var(--warning);">
                ⚠️ <strong>Atenção:</strong> Este link contém dados sensíveis. Compartilhe apenas com pessoas autorizadas.
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('inviteLinkModal').remove()">Fechar</button>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);
  },

  /**
   * Copia link de convite
   */
  copyInviteLink() {
    const textarea = document.getElementById('inviteLinkText');
    if (textarea) {
      textarea.select();
      navigator.clipboard.writeText(textarea.value)
        .then(() => {
          alert('✅ Link copiado! Compartilhe com outros usuários.');
        })
        .catch(err => {
          console.error('Erro ao copiar:', err);
          alert('❌ Erro ao copiar link');
        });
    }
  },

  /**
   * Compartilha link via Web Share API
   */
  async shareInviteLink() {
    const inviteLink = this.generateInviteLink();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Convite OAE Revisor',
          text: 'Acesse este link para sincronizar usuários do OAE Revisor',
          url: inviteLink
        });
        console.log('Link compartilhado com sucesso');
      } catch (error) {
        console.log('Compartilhamento cancelado ou erro:', error);
        this.copyInviteLink(); // Fallback: copia link
      }
    } else {
      alert('Navegador não suporta compartilhamento.\nO link foi copiado para a área de transferência.');
      this.copyInviteLink();
    }
  },

  /**
   * Verifica se há parâmetro de sincronização na URL (usuários ou obra)
   */
  checkUrlSyncParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const syncData = urlParams.get('sync');
    const shareWorkData = urlParams.get('shareWork');

    if (syncData) {
      this.showAutoSyncNotification(decodeURIComponent(syncData));
    }

    if (shareWorkData) {
      this.showAutoWorkImportNotification(decodeURIComponent(shareWorkData));
    }

    // shareUser param imports a single user
    const shareUserData = urlParams.get('shareUser');
    if (shareUserData) {
      this.showAutoUserImportNotification(decodeURIComponent(shareUserData));
    }

    // Import of full users list
    const shareUsersData = urlParams.get('shareUsers');
    if (shareUsersData) {
      this.showAutoUsersImportNotification(decodeURIComponent(shareUsersData));
    }
  },

  /**
   * Gera link de compartilhamento de uma obra específica
   */
  async generateWorkShareLink(codigo) {
    try {
      // Usa DB para carregar a obra
      const work = await DB.loadObra(codigo);
      if (!work) throw new Error('Obra não encontrada');

      const data = {
        version: '1.0',
        type: 'oae-work-share',
        timestamp: Date.now(),
        sharedBy: AuthSystem.currentUser?.email || 'unknown',
        work: work,
      };

      const jsonString = JSON.stringify(data);
      const encoded = btoa(jsonString);
      const baseUrl = window.location.origin + window.location.pathname;
      const inviteLink = `${baseUrl}?shareWork=${encodeURIComponent(encoded)}`;

      return inviteLink;
    } catch (error) {
      console.error('Erro ao gerar link de obra:', error);
      throw error;
    }
  },

  /**
   * Gera link para um usuário específico (somente seus dados)
   */
  generateUserInviteLink(identifier) {
    try {
      const users = JSON.parse(localStorage.getItem('oae-users') || '[]');
      const param = (identifier || '').toString().trim();
      if (!param) throw new Error('Email/nome do usuário não fornecido');

      // Try exact email match (case-insensitive)
      let user = users.find(u => (u.email || '').toLowerCase() === param.toLowerCase());

      // Try exact name match
      if (!user) user = users.find(u => (u.name || '').toLowerCase() === param.toLowerCase());

      // Try substring match on email or name
      if (!user) user = users.find(u => ((u.email || '').toLowerCase().includes(param.toLowerCase()) || (u.name || '').toLowerCase().includes(param.toLowerCase())));

      if (!user) {
        throw new Error(`Usuário não encontrado: ${identifier}`);
      }

      // Remove campos sensíveis quando necessário
      const userToShare = { ...user };
      if (userToShare.email === 'admin@oae.com') {
        userToShare.password = undefined;
      }

      const data = {
        version: '1.0',
        type: 'oae-user-share',
        timestamp: Date.now(),
        sharedBy: AuthSystem.currentUser?.email || 'unknown',
        user: userToShare,
      };

      const encoded = btoa(JSON.stringify(data));
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}?shareUser=${encodeURIComponent(encoded)}`;
    } catch (err) {
      console.error('Erro ao gerar link de usuário:', err);
      throw err;
    }
  },

  /**
   * Mostra modal para compartilhar apenas um usuário via link
   */
  showUserInviteLinkModal(email, name) {
    try {
      const inviteLink = this.generateUserInviteLink(email);

      const modal = document.createElement('div');
      modal.className = 'modal-backdrop show';
      modal.id = 'userInviteModal';

      modal.innerHTML = `
        <div class="modal" style="max-width:600px;">
          <div class="modal-header">
            <h3 class="modal-title">🔗 Link de Convite (Usuário)</h3>
            <button class="modal-close" onclick="document.getElementById('userInviteModal').remove()">×</button>
          </div>
          <div class="modal-body" style="padding:20px;">
            <div style="font-weight:600; margin-bottom:8px;">${name} &nbsp; <span style="font-size:0.85rem; color:var(--text-muted);">${email}</span></div>

            <div style="background: var(--bg-secondary); border-radius:6px; padding:12px; margin-bottom:12px;">
              <textarea id="userInviteLinkText" readonly style="width:100%; height:80px; font-family:monospace;">${inviteLink}</textarea>
            </div>

            <div style="display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn btn-primary" onclick="(async ()=>{ navigator.clipboard.writeText(document.getElementById('userInviteLinkText').value); alert('✅ Link copiado!') })()">📋 Copiar</button>
              <button class="btn btn-success" onclick="(async ()=>{ const url = document.getElementById('userInviteLinkText').value; if(navigator.share){ try{ await navigator.share({ title: 'Convite OAE', text: 'Abra este link para importar este usuário', url }); }catch(e){ alert('Compartilhamento cancelado ou falhou'); } } else { navigator.clipboard.writeText(url); alert('Link copiado para área de transferência'); } })()">📤 Compartilhar</button>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('userInviteModal').remove()">Fechar</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    } catch (err) {
      console.error('Erro ao abrir modal de convite de usuário:', err);

      // Show a friendly modal with options to help the admin recover
      try {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop show';
        modal.id = 'userInviteErrorModal';

        modal.innerHTML = `
          <div class="modal" style="max-width:500px;">
            <div class="modal-header">
              <h3 class="modal-title">❌ Não foi possível gerar o link</h3>
              <button class="modal-close" onclick="document.getElementById('userInviteErrorModal').remove()">×</button>
            </div>
            <div class="modal-body" style="padding:20px;">
              <p><strong>Erro:</strong> ${err.message}</p>
              <p>Verifique se o usuário existe ou escolha compartilhar todos os usuários do sistema.</p>
              <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
                <button class="btn btn-secondary" onclick="document.getElementById('userInviteErrorModal').remove()">Fechar</button>
                <button class="btn btn-primary" onclick="(function(){ document.getElementById('userInviteErrorModal').remove(); UserManager.showUserManagementModal(); })()">Abrir Gerenciamento de Usuários</button>
                <button class="btn btn-success" onclick="(function(){ document.getElementById('userInviteErrorModal').remove(); SyncMethods.showUsersInviteLinkModal('Todos os Usuários'); })()">Compartilhar Lista Completa</button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);
      } catch (uiErr) {
        // Fallback to simple alert if building modal fails
        console.error('Erro ao mostrar modal de falha de convite de usuário:', uiErr);
        alert('Erro ao gerar link de usuário: ' + err.message);
      }
    }
  },

  /**
   * Gera link para compartilhar TODOS os usuários (lista)
   */
  generateUsersShareLink() {
    try {
      const users = JSON.parse(localStorage.getItem('oae-users') || '[]');
      if (!users || !users.length) throw new Error('Nenhum usuário disponível para compartilhar');

      // Remove dados sensíveis
      const sanitized = users.map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });

      const data = {
        version: '1.0',
        type: 'oae-users-share',
        timestamp: Date.now(),
        sharedBy: AuthSystem.currentUser?.email || 'unknown',
        users: sanitized,
      };

      const encoded = btoa(JSON.stringify(data));
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}?shareUsers=${encodeURIComponent(encoded)}`;
    } catch (err) {
      console.error('Erro ao gerar link de compartilhamento de usuários:', err);
      throw err;
    }
  },

  /**
   * Mostra modal com link/QR para compartilhar TODOS os usuários
   */
  showUsersInviteLinkModal(name) {
    try {
      const inviteLink = this.generateUsersShareLink();

      const modal = document.createElement('div');
      modal.className = 'modal-backdrop show';
      modal.id = 'usersInviteModal';

      modal.innerHTML = `
        <div class="modal" style="max-width:700px;">
          <div class="modal-header">
            <h3 class="modal-title">🔗 Link de Convite (Lista de Usuários)</h3>
            <button class="modal-close" onclick="document.getElementById('usersInviteModal').remove()">×</button>
          </div>
          <div class="modal-body" style="padding:20px;">
            <div style="font-weight:600; margin-bottom:8px;">${name}</div>

            <div style="background: var(--bg-secondary); border-radius:6px; padding:12px; margin-bottom:12px;">
              <textarea id="usersInviteLinkText" readonly style="width:100%; height:120px; font-family:monospace;">${inviteLink}</textarea>
            </div>

            <div style="display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn btn-primary" onclick="(async ()=>{ navigator.clipboard.writeText(document.getElementById('usersInviteLinkText').value); alert('✅ Link copiado!') })()">📋 Copiar</button>
              <button class="btn btn-success" onclick="(async ()=>{ const url = document.getElementById('usersInviteLinkText').value; if(navigator.share){ try{ await navigator.share({ title: 'Convite OAE - Usuários', text: 'Abra este link para importar a lista de usuários', url }); }catch(e){ alert('Compartilhamento cancelado ou falhou'); } } else { navigator.clipboard.writeText(url); alert('Link copiado para área de transferência'); } })()">📤 Compartilhar</button>
            </div>

            <div style="margin-top:12px; font-size:0.9rem; color:var(--text-muted);">Ao importar este link, os usuários serão adicionados à lista local (sem sobrescrever usuários existentes).</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('usersInviteModal').remove()">Fechar</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    } catch (err) {
      console.error('Erro ao abrir modal de convite de usuários:', err);
      alert('Erro ao gerar link de usuários: ' + err.message);
    }
  },

  /**
   * Importa lista de usuários a partir do link (param shareUsers)
   */
  async showAutoUsersImportNotification(encodedData) {
    try {
      const jsonString = atob(decodeURIComponent(encodedData));
      const data = JSON.parse(jsonString);

      if (data.type !== 'oae-users-share' || !Array.isArray(data.users)) {
        throw new Error('Link inválido: não contém lista de usuários válida');
      }

      const localUsers = JSON.parse(localStorage.getItem('oae-users') || '[]');
      let imported = 0;
      let skipped = 0;

      for (const u of data.users) {
        const norm = (u.email || '').toUpperCase();
        const exists = localUsers.find(x => (x.email || '').toUpperCase() === norm);
        if (exists) {
          skipped++;
          continue;
        }
        localUsers.push({ ...u, syncedFrom: data.sharedBy, syncedAt: Date.now(), authorizedForever: true });
        imported++;
      }

      localStorage.setItem('oae-users', JSON.stringify(localUsers));

      alert(`✅ Importação concluída: ${imported} importados, ${skipped} ignorados.`);

      // Remove param
      const url = new URL(window.location);
      url.searchParams.delete('shareUsers');
      window.history.replaceState({}, '', url);
    } catch (err) {
      console.error('Erro ao importar lista de usuários via link:', err);
      alert('Erro ao importar lista de usuários: ' + err.message);
    }
  },

  /**
   * Mostra modal para importar obra a partir do parâmetro de URL (preview + opções)
   */
  async showAutoWorkImportNotification(encodedData) {
    try {
      const jsonString = atob(decodeURIComponent(encodedData));
      const data = JSON.parse(jsonString);

      if (data.type !== 'oae-work-share' || !data.work) {
        throw new Error('Link inválido: não contém obra válida');
      }

      // Cria modal de confirmação similar ao importSharedWork flow
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop show';
      modal.id = 'autoWorkShareModal';

      const obra = data.work.work;

      modal.innerHTML = `
        <div class="modal" style="max-width:600px;">
          <div class="modal-header">
            <h3 class="modal-title">🔗 Obra Compartilhada Detectada</h3>
            <button class="modal-close" onclick="document.getElementById('autoWorkShareModal').remove()">×</button>
          </div>
          <div class="modal-body" style="padding:20px;">
            <div style="font-weight:600; margin-bottom:8px;">${obra.codigo} - ${obra.nome}</div>
            <div style="margin-bottom:12px; color:var(--text-muted);">Compartilhado por: ${data.sharedBy}</div>

            <div style="margin-bottom:12px;">
              <label><input type="checkbox" id="importOverwrite" /> Sobrescrever se já existir</label>
            </div>

            <div style="margin-top:12px; text-align:right;">
              <button class="btn btn-secondary" onclick="document.getElementById('autoWorkShareModal').remove()">Cancelar</button>
              <button class="btn btn-primary" id="btnAutoImport">📥 Importar Obra</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Handler
      document.getElementById('btnAutoImport').onclick = async () => {
        try {
          const overwrite = document.getElementById('importOverwrite').checked;
          const codigo = data.work.work.codigo;

          const existing = await DB.loadObra(codigo);
          if (existing && !overwrite) {
            alert(`Obra ${codigo} já existe. Marque 'Sobrescrever' para substituir.`);
            return;
          }

          // Atualiza metadados da importação
          data.work.work.metadata = data.work.work.metadata || {};
          data.work.work.metadata.lastModifiedBy = AuthSystem.currentUser?.email || 'import';
          data.work.work.metadata.lastModifiedAt = new Date().toISOString();
          data.work.work.metadata.importedFrom = data.sharedBy;
          data.work.work.metadata.importedAt = new Date().toISOString();

          await DB.saveObra(codigo, data.work);

          if (window.WorkManager) await WorkManager.loadAllWorks();

          alert(`✅ Obra ${codigo} importada com sucesso!`);
          document.getElementById('autoWorkShareModal').remove();

          // Remove param from URL
          const url = new URL(window.location);
          url.searchParams.delete('shareWork');
          window.history.replaceState({}, '', url);
        } catch (err) {
          console.error('Erro ao importar obra via link:', err);
          alert('Erro ao importar obra: ' + err.message);
        }
      };
    } catch (error) {
      console.error('Erro ao processar link de obra:', error);
      alert('Erro ao processar link de obra: ' + error.message);
    }
  },

  /**
   * Mostra notificação de sincronização automática
   */
  async showAutoSyncNotification(syncData) {
    const result = await this.importFromQRCode(syncData);

    if (result.success) {
      alert(`🎉 Sincronização Automática!\n\n✅ ${result.count} usuários importados\n🆕 ${result.newUsers} novos usuários\n\nVocê já pode fazer login!`);

      // Remove parâmetro da URL
      const url = new URL(window.location);
      url.searchParams.delete('sync');
      window.history.replaceState({}, '', url);
    } else {
      alert(`❌ Erro na sincronização automática:\n${result.error}`);
    }
  },
  /**
   * Importa (automático) um usuário a partir do link de convite
   */
  async showAutoUserImportNotification(encodedData) {
    try {
      const jsonString = atob(decodeURIComponent(encodedData));
      const data = JSON.parse(jsonString);

      if (data.type !== 'oae-user-share' || !data.user) {
        throw new Error('Link inválido: não contém usuário válido');
      }

      const localUsers = JSON.parse(localStorage.getItem('oae-users') || '[]');
      const normalized = data.user.email.toUpperCase();
      const exists = localUsers.find(u => u.email.toUpperCase() === normalized);

      if (exists) {
        alert(`Usuário ${data.user.email} já existe na sua lista.`);
      } else {
        // Marca autorização permanente e salva
        const toSave = { ...data.user, syncedFrom: data.sharedBy, syncedAt: Date.now(), authorizedForever: true };
        localUsers.push(toSave);
        localStorage.setItem('oae-users', JSON.stringify(localUsers));

        alert(`✅ Usuário ${data.user.email} importado com sucesso! Você já pode fazer login.`);
      }

      // Remove param
      const url = new URL(window.location);
      url.searchParams.delete('shareUser');
      window.history.replaceState({}, '', url);
    } catch (err) {
      console.error('Erro ao importar usuário via link:', err);
      alert('Erro ao importar usuário: ' + err.message);
    }
  },
  // ==================== CÓDIGO DE 6 DÍGITOS ====================

  /**
   * Gera código de 6 dígitos para sincronização
   */
  generateSyncCode() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrData = this.generateQRCode();

    // Salva temporariamente no localStorage com expiração de 10 minutos
    const syncCodeData = {
      code: code,
      data: qrData,
      createdAt: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutos
      createdBy: AuthSystem.currentUser?.email || "unknown"
    };

    localStorage.setItem(`sync-code-${code}`, JSON.stringify(syncCodeData));

    return code;
  },

  /**
   * Mostra modal com código de sincronização
   */
  showSyncCodeModal() {
    const code = this.generateSyncCode();

    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "syncCodeModal";

    const html = `
      <div class="modal" style="max-width: 450px;">
        <div class="modal-header">
          <h3 class="modal-title">🔢 Código de Sincronização</h3>
          <button class="modal-close" onclick="document.getElementById('syncCodeModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
              Digite este código no outro dispositivo
            </div>

            <div style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); border-radius: 12px; padding: 30px; margin-bottom: 20px; box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.3);">
              <div style="font-size: 3rem; font-weight: 700; color: white; letter-spacing: 8px; font-family: 'JetBrains Mono', monospace;">
                ${code}
              </div>
            </div>

            <div style="background: rgba(var(--warning-rgb), 0.1); border: 1px solid var(--warning); border-radius: 6px; padding: 12px; margin-bottom: 15px;">
              <div style="font-size: 0.8rem; color: var(--warning);">
                ⏰ Código expira em 10 minutos
              </div>
            </div>

            <button class="btn btn-primary" onclick="SyncMethods.copySyncCode('${code}')">
              📋 Copiar Código
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('syncCodeModal').remove()">Fechar</button>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);
  },

  /**
   * Copia código de sincronização
   */
  copySyncCode(code) {
    navigator.clipboard.writeText(code)
      .then(() => {
        alert('✅ Código copiado!');
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
        alert('❌ Erro ao copiar código');
      });
  },

  /**
   * Mostra modal para inserir código
   */
  showEnterCodeModal() {
    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "enterCodeModal";

    const html = `
      <div class="modal" style="max-width: 450px;">
        <div class="modal-header">
          <h3 class="modal-title">🔢 Digite o Código</h3>
          <button class="modal-close" onclick="document.getElementById('enterCodeModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="padding: 20px;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px; text-align: center;">
              Digite o código de 6 dígitos que você recebeu
            </div>

            <input
              type="text"
              id="syncCodeInput"
              class="form-input"
              maxlength="6"
              placeholder="XXXXXX"
              style="text-align: center; font-size: 2rem; font-weight: 700; letter-spacing: 8px; text-transform: uppercase; font-family: 'JetBrains Mono', monospace;"
              oninput="this.value = this.value.toUpperCase()"
            />

            <div id="codeValidationStatus" style="margin-top: 15px; text-align: center; font-size: 0.85rem;"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('enterCodeModal').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="SyncMethods.validateAndImportCode()">
            ✅ Validar e Importar
          </button>
        </div>
      </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Foco no input
    setTimeout(() => {
      document.getElementById('syncCodeInput').focus();
    }, 100);
  },

  /**
   * Valida e importa usando código
   */
  async validateAndImportCode() {
    const input = document.getElementById('syncCodeInput');
    const status = document.getElementById('codeValidationStatus');
    const code = input.value.trim().toUpperCase();

    if (code.length !== 6) {
      status.textContent = "❌ Código deve ter 6 caracteres";
      status.style.color = "var(--danger)";
      return;
    }

    status.textContent = "🔄 Validando...";
    status.style.color = "var(--primary)";

    // Busca código no localStorage
    const storedData = localStorage.getItem(`sync-code-${code}`);

    if (!storedData) {
      status.textContent = "❌ Código inválido ou expirado";
      status.style.color = "var(--danger)";
      return;
    }

    try {
      const syncCodeData = JSON.parse(storedData);

      // Verifica expiração
      if (Date.now() > syncCodeData.expiresAt) {
        localStorage.removeItem(`sync-code-${code}`);
        status.textContent = "❌ Código expirado (válido por 10 minutos)";
        status.style.color = "var(--danger)";
        return;
      }

      // Importa dados
      const result = await this.importFromQRCode(syncCodeData.data);

      if (result.success) {
        status.textContent = `✅ ${result.count} usuários importados!`;
        status.style.color = "var(--success)";

        // Remove código usado
        localStorage.removeItem(`sync-code-${code}`);

        setTimeout(() => {
          document.getElementById('enterCodeModal').remove();
          alert(`Importação concluída!\n\n✅ ${result.count} usuários disponíveis\n🆕 ${result.newUsers} novos usuários\n\nVocê já pode fazer login!`);
        }, 2000);
      } else {
        status.textContent = `❌ Erro: ${result.error}`;
        status.style.color = "var(--danger)";
      }
    } catch (error) {
      status.textContent = `❌ Erro ao processar código`;
      status.style.color = "var(--danger)";
      console.error("Erro ao validar código:", error);
    }
  },

  /**
   * Limpa códigos expirados
   */
  cleanExpiredCodes() {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    for (const key of keys) {
      if (key.startsWith('sync-code-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.expiresAt < now) {
            localStorage.removeItem(key);
            console.log(`Código expirado removido: ${key}`);
          }
        } catch (e) {
          // Remove chave corrompida
          localStorage.removeItem(key);
        }
      }
    }
  }
};

// Verifica sincronização por URL ao carregar
window.addEventListener('DOMContentLoaded', () => {
  SyncMethods.checkUrlSyncParam();
  SyncMethods.cleanExpiredCodes();
});

// Limpa códigos expirados a cada 5 minutos
setInterval(() => {
  SyncMethods.cleanExpiredCodes();
}, 5 * 60 * 1000);

// Export para uso global
window.SyncMethods = SyncMethods;
