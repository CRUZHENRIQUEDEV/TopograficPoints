/**
 * Auto-save Logic for OAE Revisor
 */
const AutoSave = {
    timer: null,
    debounceTimer: null,
    autoSaveInterval: 30000, // 30 seconds

    init() {
        this.start();
    },

    start() {
        if (this.timer) clearInterval(this.timer);

        console.log('AutoSave service started.');
        this.timer = setInterval(() => {
            this.save();
        }, this.autoSaveInterval);
    },

    // Debounced trigger for immediate saves after user actions
    trigger() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(() => {
            this.save();
        }, 1000); // 1 second debounce
    },

    async save() {
        if (!appState.work.codigo) {
            console.log('AutoSave skipped: No code provided.');
            return;
        }

        try {
            // Save complete obra state including Maps
            await DB.saveObra(appState.work.codigo, {
                work: appState.work,
                errors: appState.errors,
                elementErrors: appState.elementErrors,
                anexoErrors: appState.anexoErrors,
                mensagens: appState.mensagens,
                completionStates: appState.completionStates,
                messageResponses: appState.messageResponses
            });

            console.log('AutoSave success at', new Date().toLocaleTimeString());
        } catch (err) {
            console.error('AutoSave failed:', err);
        }
    },

    stop() {
        if (this.timer) clearInterval(this.timer);
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.timer = null;
        this.debounceTimer = null;
    }
};

window.AutoSave = AutoSave;
