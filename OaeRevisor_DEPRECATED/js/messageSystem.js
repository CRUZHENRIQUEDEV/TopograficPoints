/**
 * Message System - OAE Revisor
 * Sistema de chat de inconsistências com rota completa
 */

const MessageSystem = {
  currentFilter: 'all',
  searchQuery: '',

  init() {
    console.log('MessageSystem initialized');
    this.renderMessages();
  },

  /**
   * Gera uma mensagem formatada com rota completa
   * @param {Object} error - Objeto de erro com tab, field, description
   * @returns {Object} - Objeto de mensagem formatada
   */
  generateMessageWithRoute(error) {
    const tabNames = {
      ident: '📋 Identificação',
      carac: '🚦 Características Funcionais',
      elem: '🏗️ Elementos Componentes',
      aspect: '💎 Aspectos Especiais',
      defic: '⚠️ Deficiências Funcionais',
      rotas: '🔄 Rotas Alternativas',
      obs: '📝 Observações',
      anexos: '📎 Anexos'
    };

    const fieldNames = {
      // Identificação
      codigo: 'Código OAE',
      nome: 'Nome da OAE',
      avaliador: 'Nome do Avaliador',
      municipio: 'Município',
      rodovia: 'Rodovia',
      segmento: 'Segmento',
      km: 'KM',
      latitude: 'Latitude',
      longitude: 'Longitude',
      tipo: 'Tipo de OAE',
      material: 'Material Predominante',

      // Características Funcionais
      comprimento: 'Comprimento Total (m)',
      numFaixas: 'Número de Faixas',
      numTramos: 'Número de Tramos',
      classe: 'Classe da Rodovia (atual)',
      cargaMaxima: 'Carga Máxima Permitida (t)',
      larguraPista: 'Largura Total da Pista (m)',
      larguraPasseio: 'Largura do Passeio (m)',
      galiboVertical: 'Galibo Vertical Livre (m)',
      galiboHorizontal: 'Galibo Horizontal Livre (m)',
      vmp: 'VMP (km/h)',
      acessoInspecao: 'Acesso para Inspeção',

      // Observações
      observacoesGerais: 'Observações Gerais',

      // Anexos
      anexo: 'Anexo/Foto'
    };

    const tabName = tabNames[error.tab] || error.tab;
    const fieldName = fieldNames[error.field] || error.field;

    // Monta a rota completa
    const route = {
      tab: error.tab,
      tabName: tabName,
      field: error.field,
      fieldName: fieldName,
      fieldNumber: error.fieldNumber || null,
      tramNumber: error.tramNumber || null
    };

    // Monta o texto completo da rota
    let routeText = `${tabName}`;
    if (error.tramNumber) {
      routeText += ` > Tramo ${error.tramNumber}`;
    }
    if (error.fieldNumber) {
      routeText += ` > Campo ${error.fieldNumber}`;
    }
    routeText += ` > ${fieldName}`;

    return {
      id: error.id || Date.now().toString(),
      text: error.description || error.mensagem || '',
      route: route,
      routeText: routeText,
      author: error.nomeUsuario || error.author || 'Sistema',
      role: error.perfil || error.role || 'Avaliador',
      date: this.formatDateTime(error.dataHistorico || error.date || new Date()),
      timestamp: error.timestamp || Date.now(),
      completed: error.completed || false,
      response: error.response || null
    };
  },

  /**
   * Formata data/hora para exibição
   */
  formatDateTime(dateInput) {
    try {
      const date = new Date(dateInput);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  },

  /**
   * Renderiza todas as mensagens
   */
  renderMessages() {
    const container = document.getElementById('messagesListContainer');
    if (!container) {
      return;
    }

    // Obtém mensagens do appState
    const messages = this.getAllMessages();

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="empty-messages">
          <div class="empty-messages-icon">💬</div>
          <div class="empty-messages-text">Nenhuma inconsistência registrada ainda</div>
        </div>
      `;
      this.updateStatusCounters();
      return;
    }

    // Renderiza cada mensagem
    container.innerHTML = '';
    messages.forEach((message, index) => {
      const messageCard = this.createMessageCard(message, index);
      container.appendChild(messageCard);
    });

    this.updateStatusCounters();
    this.applyFilters();
  },

  /**
   * Cria um card de mensagem
   */
  createMessageCard(message, index) {
    const card = document.createElement('div');
    card.className = 'message-card';
    card.setAttribute('data-message-id', index);

    const currentUser = window.AuthSystem?.currentUser?.name || '';
    const isOwnMessage = message.author === currentUser;
    const isCompleted = message.completed || false;
    const hasResponse = message.response && message.response.text;

    // Adiciona classes
    if (isOwnMessage) {
      card.classList.add('own-message');
    } else {
      card.classList.add('other-message');
      if (isCompleted) {
        card.classList.add('completed');
      }
    }

    // Monta o HTML do card
    let html = '<div class="message-header">';

    // Checkbox (apenas para mensagens de outros)
    if (!isOwnMessage) {
      html += `
        <div class="checkbox-container">
          <input
            type="checkbox"
            class="message-checkbox"
            ${isCompleted ? 'checked' : ''}
            onchange="MessageSystem.toggleCompletion(${index})"
            title="Marcar como corrigida"
          >
        </div>
      `;
    }

    html += '<div class="message-content">';

    // Informações de rota
    html += '<div class="message-route-info">';
    html += `<span class="message-route-badge">${message.route.tabName}</span>`;
    if (message.route.tramNumber) {
      html += `<span class="message-field-badge">Tramo ${message.route.tramNumber}</span>`;
    }
    if (message.route.fieldNumber) {
      html += `<span class="message-field-badge">Campo ${message.route.fieldNumber}</span>`;
    }
    html += `<span class="message-field-badge">${message.route.fieldName}</span>`;
    html += '</div>';

    // Texto da mensagem
    html += `<div class="message-text">${this.escapeHtml(message.text)}</div>`;

    // Meta informações
    html += '<div class="message-meta">';
    html += '<div>';
    html += `<span class="message-author">${this.escapeHtml(message.author)}</span>`;
    html += ` - ${message.role}<br>`;
    html += `<span class="message-date">${message.date}</span>`;
    html += '</div>';

    // Badge de status
    if (isOwnMessage) {
      html += '<span class="message-status-badge own">📤 Sua Mensagem</span>';
    } else {
      html += `<span class="message-status-badge ${isCompleted ? 'completed' : 'pending'}">`;
      html += isCompleted ? '✅ Corrigido' : '⏳ Pendente';
      html += '</span>';
    }

    html += '</div>'; // fim message-meta

    // Seção de resposta (apenas para mensagens de outros)
    if (!isOwnMessage) {
      html += '<div class="response-section">';

      // Se já tem resposta salva
      if (hasResponse) {
        html += `
          <div class="saved-response">
            <div class="saved-response-header">
              <span style="font-size: 12px; font-weight: 600; color: var(--ui-success);">✅ Sua Resposta ${message.response.edited ? '(editado)' : ''}</span>
              <div style="display: flex; gap: 8px;">
                <span style="font-size: 11px; color: var(--ui-text-muted);">${message.response.date}</span>
                <button class="response-action-btn" onclick="MessageSystem.editResponse(${index})" title="Editar resposta">
                  ✏️
                </button>
                <button class="response-action-btn" onclick="MessageSystem.copyResponse(${index})" title="Copiar resposta">
                  📋
                </button>
              </div>
            </div>
            <div class="saved-response-text" id="response-text-${index}">${this.escapeHtml(message.response.text)}</div>
          </div>
        `;
      } else {
        // Campo para responder
        html += `
          <div class="response-input-section" id="response-input-${index}">
            <label class="response-label">💬 Responder:</label>
            <textarea
              class="response-textarea"
              id="response-textarea-${index}"
              placeholder="Digite sua correção ou resposta aqui..."
              rows="3"
            ></textarea>
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
              <button class="btn btn-success" onclick="MessageSystem.saveResponse(${index})">
                💾 Salvar Resposta
              </button>
            </div>
          </div>
        `;
      }

      html += '</div>'; // fim response-section
    }

    // Botão de copiar
    html += `
      <div class="message-actions">
        <button class="message-copy-btn" onclick="MessageSystem.copyMessage(${index})">
          📋 Copiar Mensagem
        </button>
      </div>
    `;

    html += '</div>'; // fim message-content
    html += '</div>'; // fim message-header

    card.innerHTML = html;
    return card;
  },

  /**
   * Obtém todas as mensagens do appState
   */
  getAllMessages() {
    if (!window.appState) {
      return [];
    }

    const messages = [];

    // Erros de campos simples
    Object.keys(appState.errors || {}).forEach(field => {
      const error = appState.errors[field];
      if (error && error.description) {
        const message = this.generateMessageWithRoute({
          tab: this.getTabForField(field),
          field: field,
          description: error.description,
          nomeUsuario: error.nomeUsuario || 'Avaliador',
          perfil: error.perfil || 'Avaliador',
          dataHistorico: error.dataHistorico || new Date(),
          id: `error-${field}`
        });
        messages.push(message);
      }
    });

    // Erros de elementos (tramos)
    (appState.elementErrors || []).forEach((error, index) => {
      const message = this.generateMessageWithRoute({
        tab: 'elem',
        field: error.field || 'elemento',
        fieldNumber: error.fieldNumber,
        tramNumber: error.tramNumber,
        description: error.description,
        nomeUsuario: error.nomeUsuario || 'Avaliador',
        perfil: error.perfil || 'Avaliador',
        dataHistorico: error.dataHistorico || new Date(),
        id: `element-${index}`
      });
      messages.push(message);
    });

    // Erros de anexos
    (appState.anexoErrors || []).forEach((error, index) => {
      const message = this.generateMessageWithRoute({
        tab: 'anexos',
        field: 'anexo',
        description: error.description,
        nomeUsuario: error.nomeUsuario || 'Avaliador',
        perfil: error.perfil || 'Avaliador',
        dataHistorico: error.dataHistorico || new Date(),
        id: `anexo-${index}`
      });
      messages.push(message);
    });

    // Mensagens gerais
    (appState.mensagens || []).forEach((msg, index) => {
      const message = {
        id: `msg-${index}`,
        text: msg.texto || msg.mensagem || '',
        route: {
          tab: 'msgs',
          tabName: '💬 Mensagens',
          field: 'mensagem',
          fieldName: 'Mensagem Geral'
        },
        routeText: '💬 Mensagens > Mensagem Geral',
        author: msg.nomeUsuario || msg.author || 'Usuário',
        role: msg.perfil || msg.role || 'Sistema',
        date: this.formatDateTime(msg.dataHistorico || msg.date || new Date()),
        timestamp: new Date(msg.dataHistorico || msg.date || new Date()).getTime(),
        completed: msg.completed || false,
        response: msg.response || null
      };
      messages.push(message);
    });

    // Ordena por timestamp
    messages.sort((a, b) => b.timestamp - a.timestamp);

    return messages;
  },

  /**
   * Determina a tab de um campo
   */
  getTabForField(field) {
    const fieldToTabMap = {
      // Identificação
      codigo: 'ident',
      nome: 'ident',
      avaliador: 'ident',
      municipio: 'ident',
      rodovia: 'ident',
      segmento: 'ident',
      km: 'ident',
      latitude: 'ident',
      longitude: 'ident',
      tipo: 'ident',
      material: 'ident',

      // Características
      comprimento: 'carac',
      numFaixas: 'carac',
      numTramos: 'carac',
      classe: 'carac',
      cargaMaxima: 'carac',
      larguraPista: 'carac',
      larguraPasseio: 'carac',
      galiboVertical: 'carac',
      galiboHorizontal: 'carac',
      vmp: 'carac',
      acessoInspecao: 'carac',

      // Observações
      observacoesGerais: 'obs'
    };

    return fieldToTabMap[field] || 'ident';
  },

  /**
   * Copia uma mensagem individual
   */
  copyMessage(index) {
    const messages = this.getAllMessages();
    const message = messages[index];

    if (!message) return;

    let text = '';
    text += '═══════════════════════════════════════════\n';
    text += `📍 ROTA: ${message.routeText}\n`;
    text += '═══════════════════════════════════════════\n\n';
    text += `${message.text}\n\n`;
    text += '───────────────────────────────────────────\n';
    text += `👤 ${message.author} (${message.role})\n`;
    text += `📅 ${message.date}\n`;

    if (message.response) {
      text += '\n✅ RESPOSTA:\n';
      text += `${message.response.text}\n`;
      text += `📅 ${message.response.date}\n`;
    }

    text += '═══════════════════════════════════════════\n';

    navigator.clipboard.writeText(text).then(() => {
      this.showAlert('Mensagem copiada!', 'success');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      this.showAlert('Erro ao copiar mensagem', 'error');
    });
  },

  /**
   * Copia todas as mensagens juntas
   */
  copyAllMessages() {
    const messages = this.getAllMessages();

    if (messages.length === 0) {
      this.showAlert('Nenhuma mensagem para copiar', 'error');
      return;
    }

    const workTitle = appState.work?.nome || 'Sem título';
    const workCode = appState.work?.codigo || '---';

    let text = '';
    text += '╔════════════════════════════════════════════════════════════╗\n';
    text += '║         RELATÓRIO DE INCONSISTÊNCIAS - OAE REVISOR        ║\n';
    text += '╚════════════════════════════════════════════════════════════╝\n\n';
    text += `OBRA: ${workTitle}\n`;
    text += `CÓDIGO: ${workCode}\n`;
    text += `DATA: ${new Date().toLocaleString('pt-BR')}\n`;
    text += `TOTAL DE MENSAGENS: ${messages.length}\n`;
    text += '\n══════════════════════════════════════════════════════════════\n\n';

    messages.forEach((message, index) => {
      text += `${index + 1}. `;
      text += '═══════════════════════════════════════════\n';
      text += `📍 ROTA: ${message.routeText}\n`;
      text += '═══════════════════════════════════════════\n\n';
      text += `${message.text}\n\n`;
      text += '───────────────────────────────────────────\n';
      text += `👤 ${message.author} (${message.role})\n`;
      text += `📅 ${message.date}\n`;
      text += `🏷️ Status: ${message.completed ? '✅ Corrigido' : '⏳ Pendente'}\n`;

      if (message.response) {
        text += '\n✅ RESPOSTA:\n';
        text += `${message.response.text}\n`;
        text += `📅 ${message.response.date}\n`;
      }

      text += '\n\n';
    });

    text += '══════════════════════════════════════════════════════════════\n';
    text += '║ OAE Revisor - Sistema de Auditoria Profissional           ║\n';
    text += '╚════════════════════════════════════════════════════════════╝';

    navigator.clipboard.writeText(text).then(() => {
      this.showAlert(`${messages.length} mensagens copiadas!`, 'success');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      this.showAlert('Erro ao copiar mensagens', 'error');
    });
  },

  /**
   * Salva uma resposta para uma mensagem
   */
  saveResponse(index) {
    const textarea = document.getElementById(`response-textarea-${index}`);
    if (!textarea || !textarea.value.trim()) {
      this.showAlert('Digite uma resposta antes de salvar', 'error');
      return;
    }

    const messages = this.getAllMessages();
    const message = messages[index];

    if (!message) return;

    // Cria objeto de resposta
    const response = {
      text: textarea.value.trim(),
      date: this.formatDateTime(new Date()),
      timestamp: Date.now(),
      author: window.AuthSystem?.currentUser?.name || 'Inspetor',
      edited: false
    };

    // Salva no appState baseado no tipo de mensagem
    this.saveResponseToAppState(message, response);

    // Marca automaticamente como corrigida
    this.setCompletionStatus(message, true);

    this.renderMessages();
    AutoSave?.trigger();
    this.showAlert('Resposta salva com sucesso!', 'success');
  },

  /**
   * Edita uma resposta existente
   */
  editResponse(index) {
    const messages = this.getAllMessages();
    const message = messages[index];

    if (!message || !message.response) return;

    const savedResponse = document.querySelector(`#response-text-${index}`).closest('.saved-response');
    if (!savedResponse) return;

    // Substitui a resposta salva por um textarea editável
    const editSection = document.createElement('div');
    editSection.className = 'response-edit-section';
    editSection.innerHTML = `
      <label class="response-label">✏️ Editar Resposta:</label>
      <textarea
        class="response-textarea"
        id="response-edit-textarea-${index}"
        rows="3"
      >${this.escapeHtml(message.response.text)}</textarea>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
        <button class="btn btn-secondary" onclick="MessageSystem.cancelEdit(${index})">
          ❌ Cancelar
        </button>
        <button class="btn btn-success" onclick="MessageSystem.updateResponse(${index})">
          💾 Atualizar
        </button>
      </div>
    `;

    savedResponse.replaceWith(editSection);
  },

  /**
   * Atualiza uma resposta editada
   */
  updateResponse(index) {
    const textarea = document.getElementById(`response-edit-textarea-${index}`);
    if (!textarea || !textarea.value.trim()) {
      this.showAlert('A resposta não pode estar vazia', 'error');
      return;
    }

    const messages = this.getAllMessages();
    const message = messages[index];

    if (!message) return;

    // Atualiza objeto de resposta
    const response = {
      text: textarea.value.trim(),
      date: this.formatDateTime(new Date()),
      timestamp: Date.now(),
      author: window.AuthSystem?.currentUser?.name || 'Inspetor',
      edited: true
    };

    // Salva no appState
    this.saveResponseToAppState(message, response);

    this.renderMessages();
    AutoSave?.trigger();
    this.showAlert('Resposta atualizada com sucesso!', 'success');
  },

  /**
   * Cancela a edição de uma resposta
   */
  cancelEdit(index) {
    this.renderMessages();
  },

  /**
   * Copia uma resposta específica
   */
  copyResponse(index) {
    const messages = this.getAllMessages();
    const message = messages[index];

    if (!message || !message.response) return;

    const text = message.response.text;

    navigator.clipboard.writeText(text).then(() => {
      this.showAlert('Resposta copiada!', 'success');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      this.showAlert('Erro ao copiar resposta', 'error');
    });
  },

  /**
   * Salva resposta no appState apropriado
   */
  saveResponseToAppState(message, response) {
    const id = message.id;

    // Erros de campos simples
    if (id.startsWith('error-')) {
      const field = id.replace('error-', '');
      if (appState.errors[field]) {
        appState.errors[field].response = response;
        appState.errors[field].completed = true;
      }
    }
    // Erros de elementos
    else if (id.startsWith('element-')) {
      const elemIndex = parseInt(id.replace('element-', ''));
      if (appState.elementErrors[elemIndex]) {
        appState.elementErrors[elemIndex].response = response;
        appState.elementErrors[elemIndex].completed = true;
      }
    }
    // Erros de anexos
    else if (id.startsWith('anexo-')) {
      const anexoIndex = parseInt(id.replace('anexo-', ''));
      if (appState.anexoErrors[anexoIndex]) {
        appState.anexoErrors[anexoIndex].response = response;
        appState.anexoErrors[anexoIndex].completed = true;
      }
    }
    // Mensagens gerais
    else if (id.startsWith('msg-')) {
      const msgIndex = parseInt(id.replace('msg-', ''));
      if (appState.mensagens[msgIndex]) {
        appState.mensagens[msgIndex].response = response;
        appState.mensagens[msgIndex].completed = true;
      }
    }
  },

  /**
   * Define status de conclusão de uma mensagem
   */
  setCompletionStatus(message, status) {
    const id = message.id;

    // Erros de campos simples
    if (id.startsWith('error-')) {
      const field = id.replace('error-', '');
      if (appState.errors[field]) {
        appState.errors[field].completed = status;
      }
    }
    // Erros de elementos
    else if (id.startsWith('element-')) {
      const elemIndex = parseInt(id.replace('element-', ''));
      if (appState.elementErrors[elemIndex]) {
        appState.elementErrors[elemIndex].completed = status;
      }
    }
    // Erros de anexos
    else if (id.startsWith('anexo-')) {
      const anexoIndex = parseInt(id.replace('anexo-', ''));
      if (appState.anexoErrors[anexoIndex]) {
        appState.anexoErrors[anexoIndex].completed = status;
      }
    }
    // Mensagens gerais
    else if (id.startsWith('msg-')) {
      const msgIndex = parseInt(id.replace('msg-', ''));
      if (appState.mensagens[msgIndex]) {
        appState.mensagens[msgIndex].completed = status;
      }
    }
  },

  /**
   * Alterna status de conclusão
   */
  toggleCompletion(index) {
    const messages = this.getAllMessages();
    const message = messages[index];

    if (!message) return;

    // Atualiza no appState
    const newStatus = !message.completed;
    this.setCompletionStatus(message, newStatus);

    this.renderMessages();
    AutoSave?.trigger();
  },

  /**
   * Define filtro
   */
  setFilter(filter) {
    this.currentFilter = filter;

    // Atualiza botões
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    this.applyFilters();
  },

  /**
   * Aplica filtros de busca e status
   */
  applyFilters() {
    this.searchQuery = document.getElementById('messageSearchInput')?.value.toLowerCase() || '';

    const cards = document.querySelectorAll('.message-card');

    cards.forEach(card => {
      const index = parseInt(card.getAttribute('data-message-id'));
      const messages = this.getAllMessages();
      const message = messages[index];

      if (!message) return;

      const currentUser = window.AuthSystem?.currentUser?.name || '';
      const isOwn = message.author === currentUser;
      const isCompleted = message.completed;

      let show = true;

      // Filtro por status
      if (this.currentFilter === 'pending' && (isOwn || isCompleted)) show = false;
      if (this.currentFilter === 'completed' && !isCompleted) show = false;
      if (this.currentFilter === 'own' && !isOwn) show = false;

      // Filtro por busca
      if (this.searchQuery) {
        const searchableText = `${message.text} ${message.routeText} ${message.author}`.toLowerCase();
        if (!searchableText.includes(this.searchQuery)) {
          show = false;
        }
      }

      card.classList.toggle('hidden', !show);
    });
  },

  /**
   * Atualiza contadores de status
   */
  updateStatusCounters() {
    const messages = this.getAllMessages();
    const currentUser = window.AuthSystem?.currentUser?.name || '';

    let total = messages.length;
    let completed = 0;
    let pending = 0;

    messages.forEach(msg => {
      if (msg.author !== currentUser) {
        if (msg.completed) {
          completed++;
        } else {
          pending++;
        }
      }
    });

    // Atualiza UI
    const totalEl = document.getElementById('msgsTotalCount');
    const completedEl = document.getElementById('msgsCompletedCount');
    const pendingEl = document.getElementById('msgsPendingCount');

    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (pendingEl) pendingEl.textContent = pending;
  },

  /**
   * Escapa HTML para evitar XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Mostra alerta
   */
  showAlert(message, type) {
    // Usa o sistema de alertas existente se disponível
    if (window.UI && typeof UI.showAlert === 'function') {
      UI.showAlert(message, type);
    } else {
      // Cria toast temporário
      const toast = document.createElement('div');
      toast.className = 'toast show';
      toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--ui-card-bg);
        color: var(--ui-text);
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border-left: 4px solid ${type === 'success' ? 'var(--ui-success)' : 'var(--ui-error)'};
        z-index: 10000;
        animation: slideInUp 0.3s ease;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100px)';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  },

  /**
   * Exporta relatório de mensagens em formato estruturado
   */
  exportReport() {
    const messages = this.getAllMessages();

    if (messages.length === 0) {
      this.showAlert('Nenhuma mensagem para exportar', 'error');
      return;
    }

    const workTitle = appState.work?.nome || 'Sem título';
    const workCode = appState.work?.codigo || '---';
    const currentUser = window.AuthSystem?.currentUser?.name || 'Usuário';

    // Agrupa mensagens por tab
    const groupedByTab = {};
    messages.forEach(msg => {
      const tabName = msg.route.tabName;
      if (!groupedByTab[tabName]) {
        groupedByTab[tabName] = [];
      }
      groupedByTab[tabName].push(msg);
    });

    // Estatísticas
    const stats = {
      total: messages.length,
      completed: messages.filter(m => m.completed).length,
      pending: messages.filter(m => !m.completed && m.author !== currentUser).length,
      own: messages.filter(m => m.author === currentUser).length
    };

    let report = '';
    report += '╔═══════════════════════════════════════════════════════════════╗\n';
    report += '║          RELATÓRIO DE INCONSISTÊNCIAS - OAE REVISOR          ║\n';
    report += '╚═══════════════════════════════════════════════════════════════╝\n\n';
    report += `📋 OBRA: ${workTitle}\n`;
    report += `🔢 CÓDIGO: ${workCode}\n`;
    report += `📅 DATA DO RELATÓRIO: ${new Date().toLocaleString('pt-BR')}\n`;
    report += `👤 GERADO POR: ${currentUser}\n\n`;

    report += '┌───────────────────────────────────────────────────────────────┐\n';
    report += '│                        ESTATÍSTICAS                           │\n';
    report += '├───────────────────────────────────────────────────────────────┤\n';
    report += `│ Total de Inconsistências:    ${stats.total.toString().padStart(3)} mensagens             │\n`;
    report += `│ ✅ Corrigidas:                ${stats.completed.toString().padStart(3)} mensagens             │\n`;
    report += `│ ⏳ Pendentes:                 ${stats.pending.toString().padStart(3)} mensagens             │\n`;
    report += `│ 📤 Suas Mensagens:            ${stats.own.toString().padStart(3)} mensagens             │\n`;
    report += '└───────────────────────────────────────────────────────────────┘\n\n';

    report += '═══════════════════════════════════════════════════════════════\n';
    report += '                    DETALHAMENTO POR SEÇÃO                     \n';
    report += '═══════════════════════════════════════════════════════════════\n\n';

    Object.keys(groupedByTab).sort().forEach(tabName => {
      const tabMessages = groupedByTab[tabName];

      report += `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      report += `┃ ${tabName.padEnd(60)}┃\n`;
      report += `┃ ${`${tabMessages.length} inconsistência(s)`.padEnd(60)}┃\n`;
      report += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

      tabMessages.forEach((msg, idx) => {
        report += `  ${idx + 1}. `;
        report += '─'.repeat(58) + '\n';
        report += `     📍 ROTA: ${msg.routeText}\n`;
        report += `     👤 AUTOR: ${msg.author} (${msg.role})\n`;
        report += `     📅 DATA: ${msg.date}\n`;
        report += `     🏷️ STATUS: ${msg.completed ? '✅ Corrigido' : '⏳ Pendente'}\n`;
        report += `     ${msg.author === currentUser ? '📤 (Sua Mensagem)' : ''}\n\n`;
        report += `     💬 INCONSISTÊNCIA:\n`;
        report += `     ${msg.text.split('\n').join('\n     ')}\n\n`;

        if (msg.response && msg.response.text) {
          report += `     ✅ RESPOSTA:\n`;
          report += `     ${msg.response.text.split('\n').join('\n     ')}\n`;
          report += `     📅 Respondido em: ${msg.response.date}\n`;
          report += `     ${msg.response.edited ? '✏️ (Editado)' : ''}\n\n`;
        }

        report += '\n';
      });
    });

    report += '═══════════════════════════════════════════════════════════════\n';
    report += '║ OAE Revisor V4.3 - Sistema de Auditoria Profissional       ║\n';
    report += '╚═══════════════════════════════════════════════════════════════╝\n';

    // Copia para clipboard
    navigator.clipboard.writeText(report).then(() => {
      this.showAlert(`Relatório completo copiado! (${stats.total} mensagens)`, 'success');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      this.showAlert('Erro ao copiar relatório', 'error');
    });
  }
};

// Expor MessageSystem globalmente
window.MessageSystem = MessageSystem;

// Inicialização manual via initializeApp() no index.html
// Removida a auto-inicialização para garantir que appState esteja disponível primeiro
