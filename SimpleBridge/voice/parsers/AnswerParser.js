/* =====================================================================
   AnswerParser.js — Interpreta respostas faladas por tipo de campo
   ===================================================================== */

const AnswerParser = (() => {

  // ── Mapas de palavras PT-BR para dígitos ─────────────────────────

  const UNITS = {
    'zero':0,'um':1,'uma':1,'dois':2,'duas':2,'três':3,'quatro':4,
    'cinco':5,'seis':6,'sete':7,'oito':8,'nove':9,'dez':10,
    'onze':11,'doze':12,'treze':13,'quatorze':14,'catorze':14,
    'quinze':15,'dezesseis':16,'dezasseis':16,'dezessete':17,
    'dezoito':18,'dezenove':19,'dezanove':19,'vinte':20,
    'trinta':30,'quarenta':40,'cinquenta':50,'sessenta':60,
    'setenta':70,'oitenta':80,'noventa':90,
    'cem':100,'cento':100,'duzentos':200,'duzentas':200,
    'trezentos':300,'trezentas':300,'quatrocentos':400,'quatrocentas':400,
    'quinhentos':500,'quinhentas':500,'seiscentos':600,'seiscentas':600,
    'setecentos':700,'setecentas':700,'oitocentos':800,'oitocentas':800,
    'novecentos':900,'novecentas':900,'mil':1000
  };

  const MONTHS = {
    'janeiro':1,'fevereiro':2,'março':3,'abril':4,'maio':5,'junho':6,
    'julho':7,'agosto':8,'setembro':9,'outubro':10,'novembro':11,'dezembro':12,
    'marco':3
  };

  const BOOLEAN_TRUE  = ['sim','yes','correto','certo','pode','isso','afirmativo','verdadeiro','manter','ok'];
  const BOOLEAN_FALSE = ['não','nao','errado','negativo','errar','corrige','corrigir','falso','trocar','mudar'];

  // ── Normalização ──────────────────────────────────────────────────

  function normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // remove acentos
      .replace(/[,;:!?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ── Parser de número por extenso ─────────────────────────────────

  function wordsToNumber(text) {
    const norm = normalize(text)
      .replace(/\be\b/g, '')          // remove "e" conjuntivo
      .replace(/\bde\b/g, '')
      .replace(/\bponto\b/g, '.')
      .replace(/\bvirgula\b/g, '.')
      .replace(/\bponto\b/g, '.')
      .replace(/\bmenos\b/g, '-');    // sinal negativo

    // Tenta parse direto (já veio como número)
    const direct = parseFloat(norm.replace(',', '.').replace(/[^\d.\-]/g, '').replace(/\.(?=.*\.)/g, ''));
    if (!isNaN(direct) && norm.match(/^-?[\d.,]+$/)) return direct;

    let negative = false;
    let cleaned = norm.trim();
    if (cleaned.startsWith('-')) {
      negative = true;
      cleaned = cleaned.slice(1).trim();
    }

    // Separa parte decimal se houver "."
    let intPart = cleaned, decPart = '';
    const dotIdx = cleaned.indexOf('.');
    if (dotIdx !== -1) {
      intPart  = cleaned.slice(0, dotIdx).trim();
      decPart  = cleaned.slice(dotIdx + 1).trim();
    }

    const intVal = parseWordSequence(intPart.split(' ').filter(Boolean));
    if (isNaN(intVal)) return NaN;

    if (!decPart) return negative ? -intVal : intVal;

    // Parte decimal: tenta converter como número ou como dígitos
    const decNum = parseWordSequence(decPart.split(' ').filter(Boolean));
    if (!isNaN(decNum)) {
      const decStr = String(decNum);
      const result = intVal + decNum / Math.pow(10, decStr.length);
      return negative ? -result : result;
    }

    return negative ? -intVal : intVal;
  }

  function parseWordSequence(words) {
    let total = 0, current = 0;
    for (const w of words) {
      const v = UNITS[w];
      if (v === undefined) {
        const n = parseFloat(w);
        if (!isNaN(n)) { current += n; continue; }
        return NaN;
      }
      if (v === 1000) {
        current = current === 0 ? 1 : current;
        total += current * 1000;
        current = 0;
      } else if (v >= 100) {
        current = (current === 0 ? 1 : current) * v;
      } else {
        current += v;
      }
    }
    return total + current;
  }

  // ── Fuzzy match para opções de select ────────────────────────────

  function fuzzyMatch(input, options) {
    const normInput = normalize(input);

    // Match exato normalizado
    for (const opt of options) {
      if (normalize(opt) === normInput) return opt;
    }

    // Contém como substring
    for (const opt of options) {
      if (normalize(opt).includes(normInput) || normInput.includes(normalize(opt))) {
        return opt;
      }
    }

    // Melhor score de palavras em comum
    const inputWords = normInput.split(' ').filter(w => w.length > 2);
    let bestOpt = null, bestScore = 0;

    for (const opt of options) {
      const optWords = normalize(opt).split(' ').filter(w => w.length > 2);
      let score = 0;
      for (const iw of inputWords) {
        for (const ow of optWords) {
          if (ow.includes(iw) || iw.includes(ow)) score++;
        }
      }
      if (score > bestScore) { bestScore = score; bestOpt = opt; }
    }

    return bestScore > 0 ? bestOpt : null;
  }

  // ── Parser de data ────────────────────────────────────────────────

  function parseDate(text) {
    const norm = normalize(text);

    // "15/03/2024"
    const numericMatch = norm.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (numericMatch) {
      const [, d, m, y] = numericMatch;
      return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
    }

    // "quinze de março de dois mil e vinte e quatro"
    const words = norm.split(' ');
    let day = NaN, month = NaN, year = NaN;

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (MONTHS[w]) {
        month = MONTHS[w];
        // Dia: palavras antes
        const dayWords = [];
        for (let j = i - 1; j >= 0 && words[j] !== 'de'; j--) {
          dayWords.unshift(words[j]);
        }
        if (dayWords.length) day = wordsToNumber(dayWords.join(' '));
        // Ano: palavras depois
        const afterMonth = words.slice(i + 1).filter(w => w !== 'de');
        year = wordsToNumber(afterMonth.join(' '));
        break;
      }
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
    }

    // Retorna texto original como fallback
    return text.trim();
  }

  // ── API Pública ───────────────────────────────────────────────────

  /**
   * Parse de confirmação sim/não.
   * Retorna true, false, ou null se não reconheceu.
   */
  function parseBoolean(text) {
    const norm = normalize(text);
    const words = norm.split(' ');

    for (const w of words) {
      if (BOOLEAN_TRUE.some(t => w.startsWith(t) || t.startsWith(w))) return true;
      if (BOOLEAN_FALSE.some(f => w.startsWith(f) || f.startsWith(w))) return false;
    }
    return null;
  }

  /**
   * Verifica se o usuário pediu para repetir.
   */
  function isRepeatRequest(text) {
    const norm = normalize(text);
    return ['repete','repetir','nao entendi','nao entendeu','nao ouvi','oque','o que'].some(k => norm.includes(k));
  }

  /**
   * Parse principal por tipo de campo.
   * @param {string} text - Texto reconhecido
   * @param {string} type - "text" | "number" | "integer" | "select" | "boolean" | "date"
   * @param {string[]} [options] - Para type="select"
   * @param {string[]} [alternatives] - Outras alternativas STT para tentar
   * @returns {{ value: any, display: string, valid: boolean }}
   */
  function parse(text, type, options = [], alternatives = []) {
    if (!text || !text.trim()) {
      return { value: '', display: '', valid: false };
    }

    switch (type) {

      case 'text': {
        const val = text.trim();
        return { value: val, display: val, valid: val.length > 0 };
      }

      case 'number': {
        // Tenta o texto principal e as alternativas
        for (const t of [text, ...alternatives]) {
          const norm = normalize(t);
          // Tenta parse direto primeiro
          const direct = parseFloat(norm.replace(',', '.'));
          if (!isNaN(direct)) {
            return { value: direct, display: String(direct), valid: true };
          }
          // Tenta por extenso
          const v = wordsToNumber(norm);
          if (!isNaN(v)) {
            return { value: v, display: String(v), valid: true };
          }
        }
        return { value: '', display: text, valid: false };
      }

      case 'integer': {
        for (const t of [text, ...alternatives]) {
          const norm = normalize(t);
          const direct = parseInt(norm, 10);
          if (!isNaN(direct)) return { value: direct, display: String(direct), valid: true };
          const v = wordsToNumber(norm);
          if (!isNaN(v)) {
            const int = Math.round(v);
            return { value: int, display: String(int), valid: true };
          }
        }
        return { value: '', display: text, valid: false };
      }

      case 'select': {
        for (const t of [text, ...alternatives]) {
          const match = fuzzyMatch(t, options);
          if (match) return { value: match, display: match, valid: true };
        }
        return { value: '', display: text, valid: false };
      }

      case 'boolean': {
        const boolVal = parseBoolean(text);
        if (boolVal === true)  return { value: 'TRUE',  display: 'Sim',  valid: true };
        if (boolVal === false) return { value: 'FALSE', display: 'Não', valid: true };
        return { value: '', display: text, valid: false };
      }

      case 'date': {
        const dateStr = parseDate(text);
        return { value: dateStr, display: dateStr, valid: dateStr.length > 0 };
      }

      default:
        return { value: text.trim(), display: text.trim(), valid: true };
    }
  }

  return { parse, parseBoolean, isRepeatRequest, normalize };
})();
