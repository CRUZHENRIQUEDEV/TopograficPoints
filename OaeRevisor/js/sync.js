/**
 * Synchronization Module - OAE Revisor
 */

const Sync = {
    init() {
        this.setupBiBinding();
    },

    setupBiBinding() {
        // Generic binding for single fields (Identificação, Rotas, etc)
        document.addEventListener('input', (e) => {
            const target = e.target;
            
            // Handle data-sync (Direct properties in appState.work)
            if (target.dataset.sync) {
                appState.work[target.dataset.sync] = target.value;
                if (target.id === 'obraCodigo') UI.updateReport(); // Quick update for header
                AutoSave.trigger();
            }

            // Handle data-field (Field inconsistencies mapping)
            if (target.dataset.field) {
                appState.work.fields[target.dataset.field] = target.value;
                AutoSave.trigger();
            }
        });
    },

    updateTramos(num) {
        appState.work.numTramos = num;
        UI.renderTramosTable();
        AutoSave.trigger();
    },

    // Load state into DOM
    loadState() {
        // 1. Root properties
        document.querySelectorAll('[data-sync]').forEach(el => {
            el.value = appState.work[el.dataset.sync] || '';
        });

        // 2. Complex fields
        document.querySelectorAll('[data-field]').forEach(el => {
            el.value = appState.work.fields[el.dataset.field] || '';
        });

        // 3. Tramos Num
        document.getElementById('numTramosGlobal').value = appState.work.numTramos;

        // 4. Badges (Red ⚠ markers)
        UI.updateFieldVisuals();
    }
};
