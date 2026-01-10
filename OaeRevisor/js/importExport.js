/**
 * Export and Import Logic for OAE Revisor
 */
const Export = {
    /**
     * Exports the current work as a JSON file
     */
    exportCurrent() {
        const data = appState.work;
        if (!data.codigo) {
            alert('Por favor, informe o código da obra antes de exportar.');
            return;
        }

        // Include markings in the export (convert Maps to arrays for JSON)
        const exportData = {
            work: data,
            errors: appState.errors,
            elementErrors: appState.elementErrors,
            anexoErrors: appState.anexoErrors,
            mensagens: appState.mensagens,
            completionStates: Array.from(appState.completionStates || new Map()),
            messageResponses: Array.from(appState.messageResponses || new Map()),
            dateExported: new Date().toISOString()
        };

        const fileName = `OAE_${data.codigo}_${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(fileName, JSON.stringify(exportData, null, 2), 'application/json');
    },

    /**
     * Exports all works in DB
     */
    async all() {
        const allWorks = await DB.listAllWorks();
        if (allWorks.length === 0) {
            alert('Nenhuma obra encontrada no banco de dados local.');
            return;
        }

        const fileName = `OAE_Backup_All_${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(fileName, JSON.stringify(allWorks, null, 2), 'application/json');
    },

    /**
     * Handles file import
     */
    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    // Multiple obras import
                    for (const item of data) {
                        // Convert arrays back to Maps if present
                        if (item.completionStates && Array.isArray(item.completionStates)) {
                            item.completionStates = new Map(item.completionStates);
                        }
                        if (item.messageResponses && Array.isArray(item.messageResponses)) {
                            item.messageResponses = new Map(item.messageResponses);
                        }
                        await DB.saveObra(item.codigo || item.work?.codigo, item);
                    }
                    alert(`${data.length} obras importadas!`);
                } else {
                    // Single obra import - Load into state
                    if (data.work) {
                        appState.work = data.work;
                        appState.errors = data.errors || {};
                        appState.elementErrors = data.elementErrors || [];
                        appState.anexoErrors = data.anexoErrors || [];
                        appState.mensagens = data.mensagens || [];

                        // Convert arrays back to Maps
                        appState.completionStates = new Map(data.completionStates || []);
                        appState.messageResponses = new Map(data.messageResponses || []);
                    } else {
                        // Legacy format - just work object
                        appState.work = data;
                    }

                    Sync.loadState();
                    UI.renderAll();
                    alert('Obra importada e carregada!');
                }
            } catch (err) {
                console.error('Import failed:', err);
                alert('Erro ao importar arquivo.');
            }
        };
        reader.readAsText(file);
    },

    downloadFile(name, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    }
};

window.Export = Export;
window.ImportExport = Export; // Alias for safety
