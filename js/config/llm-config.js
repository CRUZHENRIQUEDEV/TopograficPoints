/**
 * LLM CONFIGURATION
 * Centralized settings for Large Language Models used by the application.
 *
 * Note: Do NOT commit secrets (API keys). Inject them at runtime via environment
 * variables or a secure secret store. Also ensure the provider/model is enabled
 * on the provider dashboard (e.g., OpenAI) if required.
 */

const LLM_CONFIG = {
    PROVIDER: 'openai',           // 'openai', 'local', etc.
    DEFAULT_MODEL: 'gpt-5-mini',  // default model to use for all clients
    API_KEY: null,                // injected at runtime (do not commit)
    TIMEOUT: 30000,               // ms
    RETRY: {
        MAX_ATTEMPTS: 2,
        DELAY: 1000
    }
};

// Expose for browser scripts (attach to window) and CommonJS
if (typeof window !== 'undefined') {
    window.LLM_CONFIG = LLM_CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLM_CONFIG;
}
