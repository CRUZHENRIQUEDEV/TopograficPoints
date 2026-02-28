/* =====================================================================
   STTService.js — Speech-to-Text (usuário fala)
   ===================================================================== */

class STTService {
  constructor() {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      this.supported = false;
      return;
    }

    this.supported = true;
    this._rec = new SpeechRec();
    this._rec.lang             = 'pt-BR';
    this._rec.continuous       = false;
    this._rec.interimResults   = true;
    this._rec.maxAlternatives  = 3;

    this._listening   = false;
    this._onInterim   = null;   // callback(text) — texto parcial
    this._onResult    = null;   // callback(text, alternatives[]) — resultado final
    this._onError     = null;   // callback(errorCode)
    this._onEnd       = null;   // callback() — microfone encerrado

    this._silenceTimer = null;
    this._SILENCE_MS   = 10000; // 10s sem fala → encerra automaticamente

    this._bindEvents();
  }

  _bindEvents() {
    this._rec.onresult = (event) => {
      this._resetSilenceTimer();

      let interim = '';
      const alternatives = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Coleta todas as alternativas do resultado final
          for (let j = 0; j < result.length; j++) {
            alternatives.push(result[j].transcript.trim());
          }
        } else {
          interim += result[0].transcript;
        }
      }

      if (alternatives.length) {
        this._clearSilenceTimer();
        if (this._onResult) this._onResult(alternatives[0], alternatives);
      } else if (interim && this._onInterim) {
        this._onInterim(interim);
      }
    };

    this._rec.onerror = (event) => {
      this._clearSilenceTimer();
      this._listening = false;
      if (this._onError) this._onError(event.error);
    };

    this._rec.onend = () => {
      this._clearSilenceTimer();
      this._listening = false;
      if (this._onEnd) this._onEnd();
    };
  }

  /**
   * Inicia a escuta.
   * @param {Object} callbacks - { onInterim, onResult, onError, onEnd }
   */
  listen({ onInterim, onResult, onError, onEnd } = {}) {
    if (!this.supported) {
      if (onError) onError('not-supported');
      return;
    }

    if (this._listening) this.stop();

    this._onInterim = onInterim || null;
    this._onResult  = onResult  || null;
    this._onError   = onError   || null;
    this._onEnd     = onEnd     || null;

    try {
      this._rec.start();
      this._listening = true;
      this._resetSilenceTimer();
    } catch (e) {
      if (onError) onError('start-failed');
    }
  }

  /** Para a escuta. */
  stop() {
    this._clearSilenceTimer();
    if (!this._listening) return;
    try { this._rec.stop(); } catch (_) {}
    this._listening = false;
  }

  get isListening() {
    return this._listening;
  }

  _resetSilenceTimer() {
    this._clearSilenceTimer();
    this._silenceTimer = setTimeout(() => {
      this.stop();
    }, this._SILENCE_MS);
  }

  _clearSilenceTimer() {
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer);
      this._silenceTimer = null;
    }
  }

  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}
