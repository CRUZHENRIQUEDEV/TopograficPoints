/**
 * IndexedDB Wrapper for OAE Revisor
 */
const DB = {
    dbName: 'OaeRevisorDB',
    dbVersion: 1,
    storeName: 'obras',

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'codigo' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    /**
     * Saves a complete obra (work + errors + messages + states) to the DB
     */
    saveObra(codigo, obraData) {
        if (!this.db) {
            console.error('DB not initialized');
            return Promise.reject('DB not initialized');
        }
        if (!codigo) {
            console.warn('Cannot save obra without a code (PK)');
            return Promise.resolve(null);
        }

        // Get current user info
        const currentUser = window.AuthSystem?.currentUser || {
            email: 'system',
            name: 'System',
            lote: 'Admin'
        };

        // Create edit history entry
        const editEntry = {
            timestamp: new Date().toISOString(),
            userEmail: currentUser.email,
            userName: currentUser.name,
            userLote: currentUser.lote,
            action: 'save',
            changes: this.detectChanges(codigo, obraData)
        };

        // Initialize or update edit history
        if (!obraData.editHistory) {
            obraData.editHistory = [];
        }
        obraData.editHistory.push(editEntry);

        // Keep only last 1000 edits to avoid performance issues
        if (obraData.editHistory.length > 1000) {
            obraData.editHistory = obraData.editHistory.slice(-1000);
        }

        // Convert Maps to plain objects for storage
        const dataToSave = {
            codigo: codigo,
            work: obraData.work,
            errors: obraData.errors,
            elementErrors: obraData.elementErrors,
            anexoErrors: obraData.anexoErrors,
            mensagens: obraData.mensagens,
            // Convert Maps to arrays for storage
            completionStates: Array.from(obraData.completionStates || new Map()),
            messageResponses: Array.from(obraData.messageResponses || new Map()),
            editHistory: obraData.editHistory,
            dateCreated: obraData.dateCreated || new Date().toISOString(),
            dateModified: new Date().toISOString(),
            lastModifiedBy: currentUser.email,
            lastModifiedByName: currentUser.name
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(dataToSave);

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    /**
     * Detects changes between existing and new obra data
     */
    detectChanges(codigo, newData) {
        // Try to get existing data from cache or DB
        const existingWork = window.WorkManager?.worksCache?.get(codigo);
        if (!existingWork) {
            return { type: 'created', fields: Object.keys(newData.work || {}) };
        }

        const changes = { type: 'updated', modifiedFields: [] };

        // Compare work fields
        const oldWork = existingWork.work || {};
        const newWork = newData.work || {};

        for (const key in newWork) {
            if (JSON.stringify(oldWork[key]) !== JSON.stringify(newWork[key])) {
                changes.modifiedFields.push(key);
            }
        }

        return changes;
    },

    /**
     * Legacy method for backward compatibility
     */
    saveWork(work) {
        return this.saveObra(work.codigo, {
            work: work,
            errors: {},
            elementErrors: [],
            anexoErrors: [],
            mensagens: [],
            completionStates: new Map(),
            messageResponses: new Map()
        });
    },

    /**
     * Loads a complete obra by codigo, converting arrays back to Maps
     */
    loadObra(codigo) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(codigo);

            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    // Convert arrays back to Maps
                    result.completionStates = new Map(result.completionStates || []);
                    result.messageResponses = new Map(result.messageResponses || []);
                    // Initialize edit history if not present
                    if (!result.editHistory) {
                        result.editHistory = [];
                    }
                }
                resolve(result);
            };
            request.onerror = (event) => reject(event.target.error);
        });
    },

    /**
     * Gets edit history for a specific obra
     */
    getEditHistory(codigo) {
        return this.loadObra(codigo).then(obra => {
            if (!obra) return [];
            return obra.editHistory || [];
        });
    },

    /**
     * Legacy method - retrieves a project by ID (backward compatibility)
     */
    getWork(codigo) {
        return this.loadObra(codigo);
    },

    /**
     * Lists all projects
     */
    listAllWorks() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    /**
     * Deletes a project
     */
    deleteWork(codigo) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(codigo);

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    }
};

window.DB = DB;
