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
            dateCreated: obraData.dateCreated || new Date().toISOString(),
            dateModified: new Date().toISOString()
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
                }
                resolve(result);
            };
            request.onerror = (event) => reject(event.target.error);
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
