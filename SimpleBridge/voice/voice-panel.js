/* =====================================================================
   voice-panel.js — Assistente de voz integrado ao SimpleBridge
   Funciona em: localhost / Live Server (contexto seguro para Web Speech API)
   ===================================================================== */

(function () {
  'use strict';

  /* ==================================================================
     1. MAPA DE CAMPOS
     Ordem = sequência do formulário (tabs: info → configuracao → transicao
             → superestrutura → apoio → complementares)
     ================================================================== */

  const FIELDS = [
    // ── Informações Gerais ──────────────────────────────────────────
    { name: 'LOTE',       q: 'Lote?',                        type: 'text',    required: true,  tab: 'info' },
    { name: 'CODIGO',     q: 'Código da obra?',              type: 'text',    required: true,  tab: 'info' },
    { name: 'NOME',       q: 'Nome da obra?',                type: 'text',    tab: 'info' },
    { name: 'UF',         q: 'Estado (UF)?',                 type: 'text',    tab: 'info',   autoFill: 'uf' },
    { name: 'RODOVIA',    q: 'Número da rodovia?',           type: 'integer', tab: 'info',   autoFill: 'rodovia' },
    { name: 'DATA',       q: 'Data da vistoria?',            type: 'date',    tab: 'info',   autoFill: 'date' },
    { name: 'ENGENHEIRO', q: 'Engenheiro responsável?',      type: 'text',    tab: 'info' },
    { name: 'TECNICO',    q: 'Técnico?',                     type: 'text',    tab: 'info' },

    // ── Configurações / Dimensões ───────────────────────────────────
    { name: 'COMPRIMENTO', q: 'Comprimento total (metros)?', type: 'number',  required: true, tab: 'configuracao' },
    { name: 'LARGURA',     q: 'Largura (metros)?',           type: 'number',  tab: 'configuracao' },
    { name: 'ALTURA',      q: 'Altura (metros)?',            type: 'number',  tab: 'configuracao' },
    {
      name: 'QTD TRAMOS',  q: 'Quantos tramos?',             type: 'integer', required: true, tab: 'configuracao',
      onFill: injectTramosAndApoios
    },
    // → tramos e apoios são injetados dinamicamente por injectTramosAndApoios()

    // ── Transição ───────────────────────────────────────────────────
    { name: 'ALTURA TRANSIÇÃO', q: 'Altura da transição (metros)?',  type: 'number', tab: 'transicao' },
    { name: 'CORTINA ALTURA',   q: 'Altura da cortina (metros)?',    type: 'number', tab: 'transicao' },
    { name: 'TIPO ALA PARALELA',      q: 'Tipo da ala paralela?',      type: 'select', tab: 'transicao' },
    { name: 'TIPO ALA PERPENDICULAR', q: 'Tipo da ala perpendicular?', type: 'select', tab: 'transicao' },
    {
      name: 'COMPRIMENTO ALA', q: 'Comprimento da ala (metros)?', type: 'number', tab: 'transicao',
      cond: () => hasValue('TIPO ALA PARALELA', 'Nenhum', false) || hasValue('TIPO ALA PERPENDICULAR', 'Nenhum', false)
    },
    {
      name: 'ESPESSURA ALA', q: 'Espessura da ala (metros)?', type: 'number', tab: 'transicao',
      cond: () => hasValue('TIPO ALA PARALELA', 'Nenhum', false) || hasValue('TIPO ALA PERPENDICULAR', 'Nenhum', false)
    },
    { name: 'TIPO ENCONTRO', q: 'Tipo de encontro?', type: 'select', tab: 'transicao' },
    {
      name: 'DESLOCAMENTO ESQUERDO ENCONTRO LAJE', q: 'Deslocamento esquerdo do encontro laje (metros)?',
      type: 'number', tab: 'transicao',
      cond: () => fieldVal('TIPO ENCONTRO') === 'ENCONTRO LAJE'
    },
    {
      name: 'DESLOCAMENTO DIREITO ENCONTRO LAJE', q: 'Deslocamento direito do encontro laje (metros)?',
      type: 'number', tab: 'transicao',
      cond: () => fieldVal('TIPO ENCONTRO') === 'ENCONTRO LAJE'
    },
    {
      name: 'COMPRIMENTO ENCONTRO LAJE', q: 'Comprimento do encontro laje (metros)?',
      type: 'number', tab: 'transicao',
      cond: () => fieldVal('TIPO ENCONTRO') === 'ENCONTRO LAJE'
    },
    { name: 'LAJE TRANSICAO', q: 'Laje de transição?', type: 'select', tab: 'transicao' },

    // ── Superestrutura ──────────────────────────────────────────────
    { name: 'TIPO SUPERESTRUTURA',   q: 'Tipo de superestrutura?',       type: 'select', tab: 'superestrutura' },
    { name: 'QTD LONGARINAS',        q: 'Quantidade de longarinas?',     type: 'integer', tab: 'superestrutura' },
    { name: 'ALTURA LONGARINA',      q: 'Altura da longarina (metros)?', type: 'number',  tab: 'superestrutura' },
    {
      name: 'ESPESSURA LONGARINA',   q: 'Espessura da longarina (metros)?', type: 'number', tab: 'superestrutura',
      cond: () => parseInt(fieldVal('QTD LONGARINAS')) !== 1
    },
    { name: 'DESLOCAMENTO ESQUERDO', q: 'Deslocamento esquerdo (metros)?', type: 'number', tab: 'superestrutura' },
    { name: 'DESLOCAMENTO DIREITO',  q: 'Deslocamento direito (metros)?',  type: 'number', tab: 'superestrutura' },
    { name: 'QTD TRANSVERSINAS',     q: 'Quantidade de transversinas?',   type: 'integer', tab: 'superestrutura' },
    {
      name: 'TIPO DE TRANSVERSINA', q: 'Tipo de transversina?', type: 'select', tab: 'superestrutura',
      cond: () => parseInt(fieldVal('QTD TRANSVERSINAS')) > 0
    },
    {
      name: 'ESPESSURA TRANSVERSINA', q: 'Espessura da transversina (metros)?', type: 'number', tab: 'superestrutura',
      cond: () => parseInt(fieldVal('QTD TRANSVERSINAS')) > 0
    },
    { name: 'ESPESSURA LAJE', q: 'Espessura da laje (metros)?', type: 'number', tab: 'superestrutura' },
    { name: 'REFORCO VIGA',   q: 'Possui reforço de viga?',     type: 'checkbox', tab: 'superestrutura' },

    // ── Apoio / Pilares ─────────────────────────────────────────────
    {
      name: 'QTD PILARES', q: 'Quantidade de pilares por apoio?', type: 'integer', tab: 'apoio',
      cond: () => parseInt(fieldVal('QTD TRAMOS')) > 1
    },
    {
      name: 'PILAR DESCENTRALIZADO', q: 'Pilar descentralizado?', type: 'select', tab: 'apoio',
      cond: () => parseInt(fieldVal('QTD TRAMOS')) > 1
    },
    {
      name: 'TIPO APARELHO APOIO', q: 'Tipo de aparelho de apoio?', type: 'select', tab: 'apoio',
      cond: () => parseInt(fieldVal('QTD TRAMOS')) > 1
    },
    // → apoios dinâmicos injetados antes desta linha por injectTramosAndApoios()
    { name: 'TIPO TRAVESSA', q: 'Tipo de travessa?', type: 'select', tab: 'apoio' },
    {
      name: 'ALTURA TRAVESSA', q: 'Altura da travessa (metros)?', type: 'number', tab: 'apoio',
      cond: () => fieldVal('TIPO TRAVESSA') === 'TRAVESSA DE APOIO DE CONCRETO ARMADO'
    },
    {
      name: 'TIPO ENCAMISAMENTO', q: 'Tipo de encamisamento?', type: 'select', tab: 'apoio',
      cond: () => parseInt(fieldVal('QTD TRAMOS')) > 1
    },
    { name: 'TIPO APOIO TRANSICAO', q: 'Berço ou pilarete?', type: 'select', tab: 'apoio' },
    { name: 'TIPO BLOCO SAPATA',    q: 'Tipo de bloco sapata?', type: 'select', tab: 'apoio' },
    {
      name: 'ALTURA BLOCO SAPATA', q: 'Altura do bloco sapata (metros)?', type: 'number', tab: 'apoio',
      cond: () => fieldVal('TIPO BLOCO SAPATA') === 'BLOCO SAPATA DE CONCRETO ARMADO'
    },
    {
      name: 'LARGURA BLOCO SAPATA', q: 'Largura do bloco sapata (metros)?', type: 'number', tab: 'apoio',
      cond: () => fieldVal('TIPO BLOCO SAPATA') === 'BLOCO SAPATA DE CONCRETO ARMADO'
    },
    {
      name: 'COMPRIMENTO BLOCO SAPATA', q: 'Comprimento do bloco sapata (metros)?', type: 'number', tab: 'apoio',
      cond: () => fieldVal('TIPO BLOCO SAPATA') === 'BLOCO SAPATA DE CONCRETO ARMADO'
    },
    {
      name: 'TIPO CONTRAVENTAMENTO PILAR', q: 'Tipo de contraventamento de pilar?', type: 'select', tab: 'apoio',
      cond: () => parseInt(fieldVal('QTD TRAMOS')) > 1
    },
    {
      name: 'QTD VIGA CONTRAVENTAMENTO PILAR', q: 'Quantidade de vigas de contraventamento?', type: 'integer', tab: 'apoio',
      cond: () => { const v = fieldVal('TIPO CONTRAVENTAMENTO PILAR'); return v && v !== 'Nenhum'; }
    },

    // ── Complementares ──────────────────────────────────────────────
    { name: 'TIPO BARREIRA ESQUERDA', q: 'Tipo de barreira esquerda?', type: 'select', tab: 'complementares' },
    {
      name: 'LARGURA BARREIRA ESQUERDA', q: 'Largura da barreira esquerda (metros)?', type: 'number', tab: 'complementares',
      cond: () => { const v = fieldVal('TIPO BARREIRA ESQUERDA'); return v && v !== 'Nenhum'; }
    },
    { name: 'TIPO BARREIRA DIREITA', q: 'Tipo de barreira direita?', type: 'select', tab: 'complementares' },
    {
      name: 'LARGURA BARREIRA DIREITA', q: 'Largura da barreira direita (metros)?', type: 'number', tab: 'complementares',
      cond: () => { const v = fieldVal('TIPO BARREIRA DIREITA'); return v && v !== 'Nenhum'; }
    },
    { name: 'TIPO CALCADA ESQUERDA', q: 'Tipo de calçada esquerda?', type: 'select', tab: 'complementares' },
    {
      name: 'LARGURA CALCADA ESQUERDA', q: 'Largura da calçada esquerda (metros)?', type: 'number', tab: 'complementares',
      cond: () => { const v = fieldVal('TIPO CALCADA ESQUERDA'); return v && v !== 'Nenhum'; }
    },
    { name: 'TIPO CALCADA DIREITA', q: 'Tipo de calçada direita?', type: 'select', tab: 'complementares' },
    {
      name: 'LARGURA CALCADA DIREITA', q: 'Largura da calçada direita (metros)?', type: 'number', tab: 'complementares',
      cond: () => { const v = fieldVal('TIPO CALCADA DIREITA'); return v && v !== 'Nenhum'; }
    },
    {
      name: 'GUARDA RODAS ESQUERDO', q: 'Guarda-rodas esquerdo?', type: 'select', tab: 'complementares',
      cond: () => { const v = fieldVal('TIPO BARREIRA ESQUERDA'); return !v || v === 'Nenhum'; }
    },
    {
      name: 'LARGURA GUARDA RODAS ESQUERDO', q: 'Largura do guarda-rodas esquerdo (metros)?', type: 'number', tab: 'complementares',
      cond: () => fieldVal('GUARDA RODAS ESQUERDO') === 'GUARDA-RODAS ANTIGO DO DNER'
    },
    {
      name: 'GUARDA RODAS DIREITO', q: 'Guarda-rodas direito?', type: 'select', tab: 'complementares',
      cond: () => { const v = fieldVal('TIPO BARREIRA DIREITA'); return !v || v === 'Nenhum'; }
    },
    {
      name: 'LARGURA GUARDA RODAS DIREITO', q: 'Largura do guarda-rodas direito (metros)?', type: 'number', tab: 'complementares',
      cond: () => fieldVal('GUARDA RODAS DIREITO') === 'GUARDA-RODAS ANTIGO DO DNER'
    },
    { name: 'PAVIMENTO',    q: 'Tipo de pavimento?',    type: 'select',  tab: 'complementares' },
    { name: 'QTD BUZINOTES', q: 'Quantidade de buzinotes?', type: 'integer', tab: 'complementares' },
  ];

  /* ==================================================================
     2. ESTADO
     ================================================================== */
  let queue    = [];   // cópia mutável de FIELDS + dinâmicos
  let qIdx     = 0;   // índice atual na queue
  let muted    = false;
  let listening = false;
  let rec      = null;
  let synth    = window.speechSynthesis;
  let ttsVoice = null;
  let hlTimeout = null;
  let _sessionFilled = new Set();  // campos preenchidos pelo assistente nesta sessão
  let _ttsPlaying    = false;      // true enquanto TTS está falando (para evitar eco)

  /* ==================================================================
     3. HELPERS DE CAMPO
     ================================================================== */

  function fieldEl(name) {
    return document.querySelector(`[name="${CSS.escape(name)}"]`);
  }

  function fieldVal(name) {
    const el = fieldEl(name);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? 'TRUE' : 'FALSE';
    return el.value || '';
  }

  /** Retorna true se campo tem valor diferente de 'Nenhum' (se notNone=true) */
  function hasValue(name, excludeVal = null, notNone = true) {
    const v = fieldVal(name);
    if (!v || v === '') return false;
    if (notNone && v === 'Nenhum') return false;
    if (excludeVal && v === excludeVal) return false;
    return true;
  }

  function isFieldFilled(f) {
    // Só pula campos que o assistente preencheu nesta sessão
    return _sessionFilled.has(f.name);
  }

  function isFieldEligible(f) {
    // Pula se disabled no DOM
    const el = fieldEl(f.name);
    if (el && el.disabled) return false;
    // Avalia condição
    if (f.cond && !f.cond()) return false;
    return true;
  }

  /** Preenche um campo do formulário e dispara eventos para o app reagir */
  function fillField(name, value) {
    const el = fieldEl(name);
    if (!el) return;

    if (el.type === 'checkbox') {
      el.checked = (value === true || value === 'TRUE' || value === 'true');
    } else {
      el.value = value;
    }

    _sessionFilled.add(name);  // marca como preenchido nesta sessão
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ==================================================================
     4. INJEÇÃO DE CAMPOS DINÂMICOS (tramos + apoios)
     ================================================================== */

  function injectTramosAndApoios(qtdStr) {
    const qtd = parseInt(qtdStr) || 1;

    // Aguarda dynamic-fields.js gerar os inputs
    setTimeout(() => {
      const tramoEls = document.querySelectorAll('.tramo-field');
      const tramosQ = Array.from(tramoEls).map((el, i) => ({
        name: el.name || `tramo-${i + 1}`,
        q: `Comprimento do tramo ${i + 1} (metros)?`,
        type: 'number',
        tab: 'configuracao',
        _domEl: el   // referência direta
      }));

      // Apoios (QTD TRAMOS - 1)
      const qtdApoios = qtd > 1 ? qtd - 1 : 0;
      const apoiosQ = [];
      for (let i = 0; i < qtdApoios; i++) {
        const altEl  = document.querySelectorAll('.apoio-altura-field')[i];
        const largEl = document.querySelectorAll('.apoio-larg-field')[i];
        const compEl = document.querySelectorAll('.apoio-comp-field')[i];
        if (altEl)  apoiosQ.push({ name: altEl.name  || `apoio-h-${i}`, q: `Altura do apoio ${i + 1} (metros)?`,           type: 'number', tab: 'apoio', _domEl: altEl });
        if (largEl) apoiosQ.push({ name: largEl.name || `apoio-l-${i}`, q: `Largura do pilar ${i + 1} (metros)?`,          type: 'number', tab: 'apoio', _domEl: largEl });
        if (compEl) apoiosQ.push({ name: compEl.name || `apoio-c-${i}`, q: `Comprimento do pilar ${i + 1} (metros)?`,      type: 'number', tab: 'apoio', _domEl: compEl });
      }

      // Insere APÓS o índice atual (advance() ainda não rodou aqui — roda 300ms depois)
      const insertAt = qIdx + 1;
      queue.splice(insertAt, 0, ...tramosQ);

      // Apoios: insere antes do QTD PILARES
      const pilIdx = queue.findIndex(f => f.name === 'QTD PILARES');
      const apoioInsert = pilIdx !== -1 ? pilIdx : queue.length;
      queue.splice(apoioInsert, 0, ...apoiosQ);

      updateProgress();
    }, 200);
  }

  /* ==================================================================
     5. AUTO-FILL (data, UF, rodovia)
     ================================================================== */

  const STATES = {
    'Acre':'AC','Alagoas':'AL','Amapá':'AP','Amazonas':'AM','Bahia':'BA',
    'Ceará':'CE','Distrito Federal':'DF','Espírito Santo':'ES','Goiás':'GO',
    'Maranhão':'MA','Mato Grosso':'MT','Mato Grosso do Sul':'MS',
    'Minas Gerais':'MG','Pará':'PA','Paraíba':'PB','Paraná':'PR',
    'Pernambuco':'PE','Piauí':'PI','Rio de Janeiro':'RJ',
    'Rio Grande do Norte':'RN','Rio Grande do Sul':'RS','Rondônia':'RO',
    'Roraima':'RR','Santa Catarina':'SC','São Paulo':'SP','Sergipe':'SE',
    'Tocantins':'TO'
  };

  async function runAutoFills() {
    // DATA → hoje
    const today = new Date();
    const dd = String(today.getDate()).padStart(2,'0');
    const mm = String(today.getMonth() + 1).padStart(2,'0');
    const yyyy = today.getFullYear();
    fillField('DATA', `${dd}/${mm}/${yyyy}`);

    // Geolocalização → UF + RODOVIA
    if (!navigator.geolocation) return;
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude, longitude } = pos.coords;
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'SimpleBridge/1.0' } });
      const data = await resp.json();

      // UF
      const state = data.address?.state || '';
      const uf    = STATES[state] || '';
      if (uf) fillField('UF', uf);

      // Rodovia: tenta extrair número da estrada
      const road = data.address?.road || data.address?.highway || '';
      const match = road.match(/\b(\d{3,4})\b/);
      if (match) fillField('RODOVIA', match[1]);
    } catch (_) {
      // sem geolocalização — campo ficará em branco para o usuário preencher
    }
  }

  /* ==================================================================
     6. PARSER (inline, sem dependências externas)
     ================================================================== */

  const NUM_WORDS = {
    zero:0,um:1,uma:1,dois:2,duas:2,'três':3,quatro:4,cinco:5,seis:6,
    sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,quatorze:14,
    catorze:14,quinze:15,dezesseis:16,dezasseis:16,dezessete:17,dezoito:18,
    dezenove:19,dezanove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,
    sessenta:60,setenta:70,oitenta:80,noventa:90,cem:100,cento:100,
    duzentos:200,duzentas:200,trezentos:300,trezentas:300,
    quatrocentos:400,quinhentos:500,seiscentos:600,setecentos:700,
    oitocentos:800,novecentos:900,mil:1000
  };

  const BOOL_TRUE  = ['sim','yes','correto','certo','pode','isso','afirmativo','verdadeiro','manter','ok','positivo'];
  const BOOL_FALSE = ['não','nao','errado','negativo','corrige','corrigir','falso','trocar'];

  function norm(t) {
    return (t||'').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[,;:!?]/g,' ').replace(/\s+/g,' ').trim();
  }

  function wordsToNum(text) {
    const s = norm(text)
      .replace(/\bvirgula\b/g,'.').replace(/\bponto\b/g,'.')
      .replace(/\be\b/g,'').replace(/\bde\b/g,'')
      .replace(/\bmenos\b/g,'-');
    const direct = parseFloat(s.replace(',','.'));
    if (!isNaN(direct) && /^-?[\d.]+$/.test(s.trim())) return direct;
    let neg = false, clean = s.trim();
    if (clean.startsWith('-')) { neg = true; clean = clean.slice(1).trim(); }
    let intP = clean, decP = '';
    const di = clean.indexOf('.');
    if (di !== -1) { intP = clean.slice(0,di).trim(); decP = clean.slice(di+1).trim(); }
    const intV = seqToNum(intP.split(' ').filter(Boolean));
    if (isNaN(intV)) return NaN;
    if (!decP) return neg ? -intV : intV;
    const decV = seqToNum(decP.split(' ').filter(Boolean));
    if (!isNaN(decV)) {
      const r = intV + decV / Math.pow(10, String(decV).length);
      return neg ? -r : r;
    }
    return neg ? -intV : intV;
  }

  function seqToNum(words) {
    let total = 0, cur = 0;
    for (const w of words) {
      const v = NUM_WORDS[w];
      if (v === undefined) { const n = parseFloat(w); if (!isNaN(n)) { cur += n; continue; } return NaN; }
      if (v === 1000) { cur = cur||1; total += cur*1000; cur = 0; }
      else if (v >= 100) { cur = (cur||1)*v; }
      else cur += v;
    }
    return total + cur;
  }

  function fuzzySelect(input, el) {
    const n = norm(input);
    const opts = Array.from(el.options).map(o => o.value).filter(v => v);
    // Exato
    for (const o of opts) if (norm(o) === n) return o;
    // Substring
    for (const o of opts) if (norm(o).includes(n) || n.includes(norm(o))) return o;
    // Palavras comuns
    const iw = n.split(' ').filter(w => w.length > 2);
    let best = null, score = 0;
    for (const o of opts) {
      const ow = norm(o).split(' ').filter(w => w.length > 2);
      let s = 0;
      for (const a of iw) for (const b of ow) if (a.includes(b)||b.includes(a)) s++;
      if (s > score) { score = s; best = o; }
    }
    return score > 0 ? best : null;
  }

  function parseAnswer(text, f) {
    const n = norm(text);
    const el = f._domEl || fieldEl(f.name);

    switch (f.type) {
      case 'text': {
        if (!text.trim()) return { val: '', ok: false };
        // Se o que foi falado for inteiramente um número por extenso, converte para dígitos
        const nv = wordsToNum(norm(text));
        if (!isNaN(nv)) return { val: String(nv), ok: true };
        return { val: text.trim(), ok: true };
      }

      case 'number': {
        // Normaliza "ponto"/"vírgula" (palavra ou símbolo) como separador decimal
        // "1 ponto 9" → "1.9", "ponto quatro" → "0.4", "0,4" → "0.4"
        const raw = text.trim()
          .replace(/\bponto\b/gi, '.')
          .replace(/\bv[ií]rgula\b/gi, '.')
          .replace(',', '.');
        // Colapsa espaços entre dígito-ponto-dígito e trata ".N" como "0.N"
        const prepped = raw
          .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
          .replace(/^\s*\.\s*(\d)/, '0.$1');
        const d = parseFloat(prepped);
        if (!isNaN(d)) return { val: d, ok: true };
        const v = wordsToNum(n);
        return isNaN(v) ? { val: '', ok: false } : { val: v, ok: true };
      }

      case 'integer': {
        const d = parseInt(text.trim().replace(',', '.'));
        if (!isNaN(d)) return { val: d, ok: true };
        const v = wordsToNum(n);
        return isNaN(v) ? { val: '', ok: false } : { val: Math.round(v), ok: true };
      }

      case 'select': {
        if (!el || el.tagName !== 'SELECT') return { val: text.trim(), ok: true };
        const m = fuzzySelect(text, el);
        return m ? { val: m, ok: true } : { val: '', ok: false };
      }

      case 'checkbox': {
        const nw = n.split(' ');
        for (const w of nw) {
          if (BOOL_TRUE.some(t  => w.startsWith(t)||t.startsWith(w)))  return { val: true,  ok: true };
          if (BOOL_FALSE.some(t => w.startsWith(t)||t.startsWith(w)))  return { val: false, ok: true };
        }
        return { val: null, ok: false };
      }

      case 'date': {
        // Aceita dd/mm/aaaa direto
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text.trim())) return { val: text.trim(), ok: true };
        // Tenta extrair números
        const nums = text.match(/\d+/g);
        if (nums && nums.length >= 3) {
          const [d,m,y] = nums;
          return { val: `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`, ok: true };
        }
        // Mantém como texto
        return { val: text.trim(), ok: text.trim().length > 0 };
      }

      default:
        return { val: text.trim(), ok: !!text.trim() };
    }
  }

  function isBoolResponse(text) {
    const n = norm(text);
    const w = n.split(' ');
    for (const x of w) {
      if (BOOL_TRUE.some(t  => x.startsWith(t)||t.startsWith(x))) return 'yes';
      if (BOOL_FALSE.some(t => x.startsWith(t)||t.startsWith(x))) return 'no';
    }
    return null;
  }

  function isRepeat(text) {
    return ['repete','repetir','nao entendi','nao ouvi','oque','o que','como'].some(k => norm(text).includes(k));
  }

  /* ==================================================================
     7. TTS
     ================================================================== */

  function initTTS() {
    const load = () => {
      const vs = synth.getVoices();
      if (!vs.length) return;
      ttsVoice =
        vs.find(v => v.lang==='pt-BR' && v.name.includes('Google')) ||
        vs.find(v => v.lang==='pt-BR' && v.name.includes('Microsoft')) ||
        vs.find(v => v.lang.startsWith('pt-BR')) ||
        vs.find(v => v.lang.startsWith('pt')) || vs[0];
    };
    if (synth.getVoices().length) load();
    else synth.addEventListener('voiceschanged', load, { once: true });
  }

  function speak(text) {
    if (muted) return Promise.resolve();
    return speakForced(text);
  }

  /** Fala sempre, mesmo com mudo ativo (para avisos de opções) */
  function speakForced(text) {
    return new Promise(res => {
      _ttsPlaying = true;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR'; u.rate = 0.95; u.pitch = 1; u.volume = 1;
      if (ttsVoice) u.voice = ttsVoice;
      u.onend = u.onerror = () => { _ttsPlaying = false; res(); };
      synth.speak(u);
    });
  }

  /* ==================================================================
     8. STT
     ================================================================== */

  function initSTT() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = 'pt-BR';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 3;
    return r;
  }

  let _userStoppedMic = false;  // true só quando o usuário clicou para parar
  let _lastInterim    = '';     // último texto interim (usado se onend chegar sem isFinal)
  let _gotFinal       = false;  // true quando isFinal já foi processado nesta sessão

  function startListening() {
    if (!rec) {
      setMicState('error');
      setTranscript('Reconhecimento de voz não suportado. Use o campo de texto.', 'error');
      return;
    }
    // Toggle: se já está ouvindo, para (por ação do usuário)
    if (listening) {
      _userStoppedMic = true;
      rec.stop();
      return;
    }
    _userStoppedMic = false;
    _doStart();
  }

  function _doStart() {
    if (!rec || listening) return;
    // Aguarda TTS terminar para não capturar eco do próprio site
    if (_ttsPlaying || synth.speaking) {
      setTimeout(_doStart, 150);
      return;
    }
    setMicState('listening');
    setTranscript('Ouvindo...', 'active');
    _lastInterim = '';
    _gotFinal    = false;

    rec.onresult = (e) => {
      let interim = '', finals = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) { for (let j=0;j<r.length;j++) finals.push(r[j].transcript.trim()); }
        else interim += r[0].transcript;
      }
      if (finals.length) {
        _gotFinal = true;
        _lastInterim = '';
        setTranscript(finals[0], 'active');
        handleAnswer(finals[0], finals.slice(1));
      } else if (interim) {
        _lastInterim = interim;
        setTranscript(interim, 'active');
      }
    };

    rec.onerror = () => {
      listening = false;
      if (!_userStoppedMic) setTimeout(_doStart, 400);
      else setMicState('idle');
    };

    // Ao terminar: se não houve isFinal mas havia interim, usa o interim como resposta
    rec.onend = () => {
      listening = false;
      if (!_gotFinal && _lastInterim) {
        const saved = _lastInterim;
        _lastInterim = '';
        handleAnswer(saved, []);   // trata o interim como resposta final
        // handleAnswer pode ter setado _userStoppedMic=true se aceitou — onend decide abaixo
      }
      if (!_userStoppedMic) {
        setTimeout(_doStart, 200);
      } else {
        setMicState('idle');
      }
    };

    try { rec.start(); listening = true; setMicState('listening'); }
    catch (_) {
      // rec já estava iniciando, aguarda e tenta
      setTimeout(_doStart, 300);
    }
  }

  /* ==================================================================
     9. LÓGICA DE RESPOSTA
     ================================================================== */

  let _failCount = 0;   // falhas consecutivas na pergunta atual

  function handleAnswer(text, alternatives) {
    const f = queue[qIdx];
    if (!f) return;

    if (isRepeat(text)) { speakForced(f.q); return; }

    // Parse da resposta
    let result = parseAnswer(text, f);

    // Tenta alternativas STT se a principal falhou
    if (!result.ok) {
      for (const alt of alternatives) {
        result = parseAnswer(alt, f);
        if (result.ok) break;
      }
    }

    if (!result.ok) {
      _failCount++;
      setTranscript('Não entendi. Tente de novo.', 'error');

      // Na 2ª falha: fala as opções sempre (ignora mudo)
      if (_failCount >= 2) {
        _failCount = 0;
        const el = f._domEl || fieldEl(f.name);
        const opts = el && el.tagName === 'SELECT'
          ? Array.from(el.options).map(o => o.value).filter(v => v && v !== 'Selecione').join(', ')
          : '';
        speakForced(opts ? 'Opções: ' + opts : f.q);
      }
      return;   // mic continua ligado pelo _userStoppedMic = false
    }

    // Preenche diretamente — sem confirmação
    _failCount = 0;
    setTranscript('✓ ' + result.val, 'confirmed');
    fillField(f.name, result.val);
    highlightField(f.name, f._domEl);
    if (f.onFill) f.onFill(result.val);

    // Para o mic ANTES do advance para que rec.onend não tente reiniciar
    // durante a janela em que o TTS da próxima pergunta ainda não iniciou (evita eco)
    _userStoppedMic = true;
    if (rec && listening) rec.stop();

    setTimeout(() => advance(), 300);
  }

  function handleManualInput() {
    const input = document.getElementById('vp-manual-input');
    const text  = input.value.trim();
    if (!text) return;

    const f = queue[qIdx];
    if (!f) return;

    const result = parseAnswer(text, f);
    input.value = '';

    if (!result.ok) {
      setTranscript('Valor inválido para este campo.', 'error');
      return;
    }

    fillField(f.name, result.val);
    highlightField(f.name, f._domEl);
    if (f.onFill) f.onFill(result.val);
    setTranscript('✓ ' + result.val, 'confirmed');

    // Mesmo cuidado: para mic antes de avançar
    _userStoppedMic = true;
    if (rec && listening) rec.stop();

    advance();
  }

  /* ==================================================================
     10. NAVEGAÇÃO
     ================================================================== */

  function buildQueue() {
    queue = FIELDS.map(f => ({ ...f }));
    qIdx  = 0;
    _sessionFilled.clear();
  }

  function advance() {
    qIdx++;
    skipIneligible();
    showCurrentField();
  }

  function skipField() {
    advance();  // showCurrentField cuida do estado do mic
  }

  function goBack() {
    if (qIdx <= 0) return;

    // Para mic e TTS imediatamente
    _userStoppedMic = true;
    if (rec && listening) rec.stop();
    synth.cancel();
    _ttsPlaying = false;

    // Volta para o campo anterior elegível
    qIdx--;
    while (qIdx > 0 && !isFieldEligible(queue[qIdx])) qIdx--;

    // Remove do sessionFilled para perguntar novamente
    _sessionFilled.delete(queue[qIdx].name);

    showCurrentField();
  }

  function skipIneligible() {
    while (qIdx < queue.length) {
      const f = queue[qIdx];
      if (isFieldFilled(f)) { qIdx++; continue; }   // já preenchido → pula
      if (!isFieldEligible(f)) { qIdx++; continue; } // condição não satisfeita → pula
      break;
    }
  }

  function showCurrentField() {
    updateProgress();

    if (qIdx >= queue.length) {
      panelDone();
      return;
    }

    const f = queue[qIdx];
    setQuestion(f.q);
    setTranscript('', false);
    setMicState('idle');

    // Troca de tab se necessário
    if (f.tab) switchTab(f.tab);

    // Scroll para o campo
    const el = f._domEl || fieldEl(f.name);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }

    // Habilita/desabilita botão Voltar
    const backBtn = document.getElementById('vp-btn-back');
    if (backBtn) backBtn.disabled = (qIdx === 0);
    const micBtn  = document.getElementById('vp-btn-mic');
    const skipBtn = document.getElementById('vp-btn-skip');
    if (micBtn)  micBtn.disabled  = false;
    if (skipBtn) skipBtn.disabled = false;

    // Fala a pergunta; _doStart aguarda o TTS terminar antes de ativar o mic (evita eco)
    _userStoppedMic = false;
    _failCount = 0;
    speak(f.q);   // se não mudo: seta _ttsPlaying=true
    _doStart();   // polling: aguarda _ttsPlaying=false antes de iniciar STT
  }

  function panelDone() {
    setQuestion('Todos os campos preenchidos!');
    setTranscript('', false);
    setMicState('idle');
    document.getElementById('vp-btn-mic').disabled  = true;
    document.getElementById('vp-btn-skip').disabled = true;
    document.getElementById('vp-btn-back').disabled = false;
    speak('Preenchimento concluído!');
    updateProgress();
  }

  /* ==================================================================
     11. UI HELPERS
     ================================================================== */

  function setQuestion(text) {
    document.getElementById('vp-question').textContent = text;
  }

  function setTranscript(text, state) {
    const el = document.getElementById('vp-transcript');
    el.textContent = text;
    el.className   = 'vp-transcript' + (state ? ' ' + state : '');
  }

  function setMicState(state) {
    const btn   = document.getElementById('vp-btn-mic');
    if (!btn) return;
    btn.className = 'vp-btn-mic ' + state;
    switch (state) {
      case 'idle':       btn.innerHTML = '🎙️ Falar';       break;
      case 'listening':  btn.innerHTML = '🔴 Ouvindo...';  break;
      case 'processing': btn.innerHTML = '⏳ Processando'; break;
      case 'confirmed':  btn.innerHTML = '✅ Confirmado';  break;
      case 'error':      btn.innerHTML = '⚠️ Erro';        break;
    }
  }

  function updateProgress() {
    const total   = queue.length;
    const filled  = queue.filter(f => isFieldFilled(f)).length;
    const current = Math.min(qIdx + 1, total);
    const pct     = total ? Math.round((filled / total) * 100) : 0;
    const txt     = document.getElementById('vp-progress-text');
    const bar     = document.getElementById('vp-progress-fill');
    if (txt) txt.textContent = `Campo ${current} / ${total}`;
    if (bar) bar.style.width = pct + '%';
  }

  function highlightField(name, el) {
    const target = el || fieldEl(name);
    if (!target) return;
    clearTimeout(hlTimeout);
    target.classList.add('vp-field-highlight');
    hlTimeout = setTimeout(() => target.classList.remove('vp-field-highlight'), 2500);
  }

  function switchTab(tabId) {
    // Tenta chamar a função showTab() do app.js se existir
    const tabEl = document.querySelector(`[data-tab="${tabId}"]`);
    if (!tabEl) return;
    if (!tabEl.classList.contains('active')) {
      tabEl.click();
    }
  }

  function toggleMute() {
    muted = !muted;
    const btn = document.getElementById('vp-btn-mute');
    if (btn) btn.textContent = muted ? '🔇' : '🔊';
    if (muted) synth.cancel();
  }

  function openPanel() {
    document.getElementById('vp-panel').classList.add('open');
    document.getElementById('vp-fab').style.display = 'none';

    if (qIdx === 0 && _sessionFilled.size === 0) {
      // Primeira abertura: auto-preenche DATA, UF e RODOVIA
      runAutoFills().then(() => {
        skipIneligible();
        showCurrentField();
      });
    } else {
      skipIneligible();
      showCurrentField();
    }
  }

  function closePanel() {
    document.getElementById('vp-panel').classList.remove('open');
    document.getElementById('vp-fab').style.display = 'flex';
    synth.cancel();
    if (rec && listening) rec.stop();
  }

  /* ==================================================================
     12. INJEÇÃO DO HTML
     ================================================================== */

  function injectHTML() {
    // FAB
    const fab = document.createElement('button');
    fab.id = 'vp-fab';
    fab.title = 'Assistente de Voz';
    fab.innerHTML = '🎙️';
    fab.onclick = openPanel;
    document.body.appendChild(fab);

    // Painel
    const panel = document.createElement('div');
    panel.id = 'vp-panel';
    panel.innerHTML = `
      <!-- Barra de progresso -->
      <div class="vp-progress-bar-wrap">
        <div class="vp-progress-bar-fill" id="vp-progress-fill" style="width:0%"></div>
      </div>

      <!-- Header -->
      <div class="vp-header">
        <button class="vp-btn-icon" id="vp-btn-mute"  title="Mudo/Som"  onclick="window._vp.toggleMute()">🔊</button>
        <span class="vp-progress-text" id="vp-progress-text">Campo 1 / …</span>
        <button class="vp-btn-icon" title="Fechar" onclick="window._vp.closePanel()">✕</button>
      </div>

      <!-- Corpo -->
      <div class="vp-body">
        <div class="vp-question" id="vp-question">Iniciando...</div>
        <div class="vp-transcript" id="vp-transcript">Pressione o microfone para falar</div>
        <div class="vp-input-row">
          <input
            class="vp-manual-input"
            id="vp-manual-input"
            type="text"
            placeholder="Escreva aqui..."
            autocomplete="off"
            onkeydown="if(event.key==='Enter') window._vp.handleManualInput()"
          />
          <button class="vp-btn-ok" onclick="window._vp.handleManualInput()">OK</button>
        </div>
      </div>

      <!-- Footer -->
      <div class="vp-footer">
        <button class="vp-btn-back" id="vp-btn-back" onclick="window._vp.goBack()">← Voltar</button>
        <button class="vp-btn-mic" id="vp-btn-mic" onclick="window._vp.startListening()">🎙️ Falar</button>
        <button class="vp-btn-skip" id="vp-btn-skip" onclick="window._vp.skipField()">Pular →</button>
      </div>
    `;
    document.body.appendChild(panel);
  }

  /* ==================================================================
     13. ATALHOS DE TECLADO
     ================================================================== */

  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!document.getElementById('vp-panel')?.classList.contains('open')) return;
      if (e.target.id === 'vp-manual-input') return;
      if (e.code === 'Space') { e.preventDefault(); startListening(); }
      if (e.code === 'Escape') closePanel();
    });
  }

  /* ==================================================================
     14. INIT
     ================================================================== */

  function init() {
    initTTS();
    rec = initSTT();
    injectHTML();
    buildQueue();
    setupKeyboard();

    // Expõe API global para os onclick inline do painel
    window._vp = { toggleMute, closePanel, startListening, handleManualInput, skipField, goBack };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
