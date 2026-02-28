/* =====================================================================
   FlowEngine.js — Navegação entre perguntas com condicionais e
   suporte a questões dinâmicas (tramos, apoios)
   ===================================================================== */

class FlowEngine {
  /**
   * @param {Object} questionsData - Conteúdo de questions.json
   */
  constructor(questionsData) {
    this._sections      = questionsData.sections;
    this.answers        = {};          // { fieldId: value }
    this._queue         = [];          // Fila plana de questões
    this._currentIndex  = 0;
    this._history       = [];          // Stack de { index, questionId, value }

    this._buildBaseQueue();
  }

  // ── Construção da fila ──────────────────────────────────────────

  _buildBaseQueue() {
    this._queue = [];
    for (const section of this._sections) {
      for (const q of section.questions) {
        this._queue.push({ ...q, sectionLabel: section.label, sectionId: section.id });
      }
    }
  }

  // ── Consulta de estado ──────────────────────────────────────────

  get currentQuestion() {
    return this._queue[this._currentIndex] || null;
  }

  get currentIndex() {
    return this._currentIndex;
  }

  get totalQuestions() {
    return this._queue.length;
  }

  get answeredCount() {
    return Object.keys(this.answers).length;
  }

  get isComplete() {
    return this._currentIndex >= this._queue.length;
  }

  /** Retorna todas as questões para renderização da lista lateral. */
  get allQuestions() {
    return this._queue;
  }

  // ── Avançar ─────────────────────────────────────────────────────

  /**
   * Confirma uma resposta e avança para a próxima pergunta elegível.
   * @param {*} value - Valor confirmado
   * @returns {boolean} false se não havia questão atual
   */
  next(value) {
    const q = this.currentQuestion;
    if (!q) return false;

    // Salva resposta (normaliza inteiros/números para string quando necessário)
    this.answers[q.id] = value;

    this._history.push({
      index: this._currentIndex,
      questionId: q.id,
      value
    });

    // Callbacks de pós-confirmação (geram questões dinâmicas)
    if (q.onConfirm) {
      this._executeOnConfirm(q.onConfirm, value);
    }

    // Avança índice e pula questões inelegíveis
    this._currentIndex++;
    this._skipIneligible();

    return true;
  }

  // ── Retroceder ──────────────────────────────────────────────────

  /**
   * Volta à pergunta anterior, restaurando o estado.
   * @returns {{ question, previousValue } | null}
   */
  previous() {
    if (this._history.length === 0) return null;

    const last = this._history.pop();

    // Remove questões dinâmicas inseridas após este ponto
    this._purgeDynamicQuestionsAfter(last.index);

    // Restaura índice
    this._currentIndex = last.index;

    // Remove a resposta (campo volta a ⏳)
    delete this.answers[last.questionId];

    return {
      question: this._queue[last.index],
      previousValue: last.value
    };
  }

  // ── Avaliação de condições ──────────────────────────────────────

  _shouldAskQuestion(q) {
    if (!q.conditions) return true;
    const cond = q.conditions;

    if (cond.operator === 'anyNotEquals') {
      // Mostra se QUALQUER campo listado tiver valor diferente de "value"
      return (cond.fields || []).some(fieldId => {
        const v = this.answers[fieldId];
        return v && v !== cond.value;
      });
    }

    const answerVal = this.answers[cond.field];

    switch (cond.operator) {
      case 'equals':
        return String(answerVal) === String(cond.value);
      case 'notEquals':
        return answerVal !== undefined && answerVal !== '' &&
               String(answerVal) !== String(cond.value);
      case 'greaterThan':
        return !isNaN(Number(answerVal)) && Number(answerVal) > Number(cond.value);
      case 'lessThan':
        return !isNaN(Number(answerVal)) && Number(answerVal) < Number(cond.value);
      default:
        return true;
    }
  }

  _skipIneligible() {
    while (this._currentIndex < this._queue.length) {
      const q = this._queue[this._currentIndex];
      if (this._shouldAskQuestion(q)) break;
      // Limpa qualquer resposta anterior para campo pulado
      delete this.answers[q.id];
      this._currentIndex++;
    }
  }

  // ── Callbacks onConfirm ─────────────────────────────────────────

  _executeOnConfirm(callbackName, value) {
    switch (callbackName) {
      case 'generateTramosAndApoios':
        this._generateTramosAndApoios(parseInt(value) || 1);
        break;
      case 'handleLongarinasRules':
        this._handleLongarinasRules(parseInt(value) || 0);
        break;
    }
  }

  /** Gera questões de comprimento de cada tramo + dimensões de cada apoio. */
  _generateTramosAndApoios(qtdTramos) {
    const tramos = [];
    for (let i = 1; i <= qtdTramos; i++) {
      tramos.push({
        id: `tramo-${i}`,
        label: `TRAMO ${i}`,
        question: `Qual é o comprimento do tramo ${i}?`,
        hint: 'Responda em metros',
        confirmTemplate: `{value} metros para o tramo ${i}, correto?`,
        type: 'number',
        required: true,
        dynamic: true,
        sectionLabel: 'Dimensões',
        sectionId: 'dimensoes'
      });
    }

    const apoios = [];
    const qtdApoios = qtdTramos > 1 ? qtdTramos - 1 : 0;
    for (let i = 1; i <= qtdApoios; i++) {
      apoios.push(
        {
          id: `apoio-altura-${i}`,
          label: `ALTURA APOIO ${i}`,
          question: `Qual é a altura do apoio ${i}?`,
          hint: 'Responda em metros',
          confirmTemplate: `{value} metros para o apoio ${i}, correto?`,
          type: 'number',
          required: false,
          dynamic: true,
          dynamicGroup: 'apoios',
          sectionLabel: 'Pilares',
          sectionId: 'pilares'
        },
        {
          id: `apoio-larg-${i}`,
          label: `LARGURA PILAR ${i}`,
          question: `Qual é a largura do pilar no apoio ${i}?`,
          hint: 'Responda em metros',
          confirmTemplate: `{value} metros, correto?`,
          type: 'number',
          required: false,
          dynamic: true,
          dynamicGroup: 'apoios',
          sectionLabel: 'Pilares',
          sectionId: 'pilares'
        },
        {
          id: `apoio-comp-${i}`,
          label: `COMPRIMENTO PILAR ${i}`,
          question: `Qual é o comprimento do pilar no apoio ${i}?`,
          hint: 'Responda em metros',
          confirmTemplate: `{value} metros, correto?`,
          type: 'number',
          required: false,
          dynamic: true,
          dynamicGroup: 'apoios',
          sectionLabel: 'Pilares',
          sectionId: 'pilares'
        }
      );
    }

    // Tramos: inserir logo após a questão atual (QTD TRAMOS)
    const insertAt = this._currentIndex + 1;
    this._queue.splice(insertAt, 0, ...tramos);

    // Apoios: inserir antes de QTD PILARES (ou ao final da seção pilares)
    if (apoios.length) {
      const qtdPilaresIdx = this._queue.findIndex(q => q.id === 'QTD PILARES');
      const apoiosInsertAt = qtdPilaresIdx !== -1
        ? qtdPilaresIdx
        : this._queue.findIndex(q => q.sectionId === 'pilares') || this._queue.length;
      this._queue.splice(apoiosInsertAt, 0, ...apoios);
    }
  }

  /** Se QTD LONGARINAS = 1 (seção caixão), força ESPESSURA LONGARINA = "1". */
  _handleLongarinasRules(qtd) {
    if (qtd === 1) {
      this.answers['ESPESSURA LONGARINA'] = '1';
    }
  }

  /** Remove questões dinâmicas inseridas após o índice fornecido. */
  _purgeDynamicQuestionsAfter(afterIndex) {
    // Remove questões dinâmicas que foram inseridas após este ponto
    // e limpa suas respostas
    const toRemove = [];
    for (let i = afterIndex + 1; i < this._queue.length; i++) {
      if (this._queue[i].dynamic) {
        toRemove.push(i);
        delete this.answers[this._queue[i].id];
      }
    }
    // Remove de trás para frente para não alterar índices
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._queue.splice(toRemove[i], 1);
    }
  }

  // ── Exportação de dados planos ──────────────────────────────────

  /**
   * Retorna o objeto flat de respostas compatível com o formato
   * do IndexedDB do SimpleBridge, incluindo a agregação de tramos e apoios.
   */
  getFlatAnswers() {
    const flat = { ...this.answers };

    // Agrega tramos em "COMPRIMENTO TRAMOS" = "10;9;11"
    const qtdTramos = parseInt(flat['QTD TRAMOS']) || 0;
    if (qtdTramos > 0) {
      const tramosVals = [];
      for (let i = 1; i <= qtdTramos; i++) {
        const v = flat[`tramo-${i}`];
        tramosVals.push(v !== undefined ? String(v) : '0');
        delete flat[`tramo-${i}`];
      }
      flat['COMPRIMENTO TRAMOS'] = tramosVals.join(';');
    }

    // Agrega apoios
    const qtdApoios = qtdTramos > 1 ? qtdTramos - 1 : 0;
    if (qtdApoios > 0) {
      const alturas = [], larguras = [], comprimentos = [];
      for (let i = 1; i <= qtdApoios; i++) {
        alturas.push(flat[`apoio-altura-${i}`] !== undefined ? String(flat[`apoio-altura-${i}`]) : '0');
        larguras.push(flat[`apoio-larg-${i}`]  !== undefined ? String(flat[`apoio-larg-${i}`])  : '0');
        comprimentos.push(flat[`apoio-comp-${i}`] !== undefined ? String(flat[`apoio-comp-${i}`]) : '0');
        delete flat[`apoio-altura-${i}`];
        delete flat[`apoio-larg-${i}`];
        delete flat[`apoio-comp-${i}`];
      }
      flat['ALTURA APOIO']        = alturas.join(';');
      flat['LARGURA PILAR']       = larguras.join(';');
      flat['COMPRIMENTO PILARES'] = comprimentos.join(';');
    }

    // Garante que campos booleanos usam "TRUE"/"FALSE" strings
    const boolFields = ['REFORCO VIGA'];
    for (const f of boolFields) {
      if (flat[f] === true)  flat[f] = 'TRUE';
      if (flat[f] === false) flat[f] = 'FALSE';
    }

    // Garante TIPO SUPERESTRUTURA nunca vazio
    if (!flat['TIPO SUPERESTRUTURA']) {
      flat['TIPO SUPERESTRUTURA'] = 'ENGASTADA';
    }

    // Remove campos de tramo/apoio auxiliares que possam ter sobrado
    Object.keys(flat).forEach(k => {
      if (/^tramo-\d+$/.test(k) || /^apoio-(altura|larg|comp)-\d+$/.test(k)) {
        delete flat[k];
      }
    });

    return flat;
  }
}
