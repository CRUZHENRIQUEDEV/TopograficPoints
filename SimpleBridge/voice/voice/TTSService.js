/* =====================================================================
   TTSService.js — Text-to-Speech (aplicativo fala)
   ===================================================================== */

class TTSService {
  constructor() {
    this._synth = window.speechSynthesis;
    this._voice = null;
    this._ready = false;
    this._queue = [];
    this._speaking = false;

    this._init();
  }

  _init() {
    const load = () => {
      const voices = this._synth.getVoices();
      if (!voices.length) return;

      // Preferência: Google PT → Microsoft PT → qualquer pt-BR/pt-PT
      this._voice =
        voices.find(v => v.lang === 'pt-BR' && v.name.includes('Google')) ||
        voices.find(v => v.lang === 'pt-BR' && v.name.includes('Microsoft')) ||
        voices.find(v => v.lang.startsWith('pt-BR')) ||
        voices.find(v => v.lang.startsWith('pt')) ||
        voices[0];

      this._ready = true;
    };

    if (this._synth.getVoices().length) {
      load();
    } else {
      this._synth.addEventListener('voiceschanged', load, { once: true });
    }
  }

  /** Fala o texto. Retorna Promise que resolve ao terminar. */
  speak(text) {
    return new Promise((resolve) => {
      this._synth.cancel();

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang    = 'pt-BR';
      utt.rate    = 0.95;
      utt.pitch   = 1.0;
      utt.volume  = 1.0;

      if (this._voice) utt.voice = this._voice;

      utt.onend  = () => resolve();
      utt.onerror = () => resolve();

      this._synth.speak(utt);
    });
  }

  /** Para imediatamente qualquer fala em andamento. */
  cancel() {
    this._synth.cancel();
  }

  /** Verifica se o browser suporta TTS. */
  static isSupported() {
    return 'speechSynthesis' in window;
  }
}
