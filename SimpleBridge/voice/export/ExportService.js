/* =====================================================================
   ExportService.js — Integração com os exportadores do SimpleBridge
   Depende de: ../js/bridge-data-converter.js, ../js/export.js, ../js/constants.js
   ===================================================================== */

const ExportService = (() => {

  // ── IndexedDB ────────────────────────────────────────────────────

  const DB_NAME    = 'OAEDatabase';
  const DB_VERSION = 3;
  const STORE_NAME = 'obras';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
      req.onupgradeneeded = e => {
        // Não altera schema — apenas garante que as stores existam
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'CODIGO' });
          store.createIndex('CODIGO', 'CODIGO', { unique: true });
          store.createIndex('LOTE',   'LOTE',   { unique: false });
        }
      };
    });
  }

  /**
   * Salva a obra no IndexedDB do SimpleBridge.
   * A obra aparecerá automaticamente na lista do app principal.
   * @param {Object} flatAnswers - Saída de FlowEngine.getFlatAnswers()
   */
  async function saveToDatabase(flatAnswers) {
    if (!flatAnswers.CODIGO) throw new Error('Campo CODIGO é obrigatório para salvar.');
    const db   = await openDB();
    const tx   = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.put(flatAnswers);
      req.onsuccess = () => resolve(flatAnswers.CODIGO);
      req.onerror   = e => reject(e.target.error);
    });
  }

  // ── Export JSON ──────────────────────────────────────────────────

  /**
   * Exporta a sessão atual como JSON hierárquico (formato BridgeData).
   * Usa convertObraFlatToBridgeData() de bridge-data-converter.js.
   * @param {Object} flatAnswers
   */
  function exportJSON(flatAnswers) {
    let bridgeData;
    try {
      bridgeData = convertObraFlatToBridgeData(flatAnswers);
    } catch (e) {
      console.warn('Erro na conversão para BridgeData, exportando flat:', e);
      bridgeData = flatAnswers;
    }

    const payload = {
      ExportDate:    new Date().toISOString(),
      ExportVersion: '1.0',
      ExportSource:  'SimpleBridge Voice App',
      TotalBridges:  1,
      Bridges:       [bridgeData]
    };

    const blob     = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    const codigo   = flatAnswers.CODIGO || 'obra';
    const ts       = new Date().toISOString().slice(0, 10);
    a.href         = url;
    a.download     = `OAE_${codigo}_${ts}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ── Export CSV ───────────────────────────────────────────────────

  /**
   * Exporta a sessão atual como CSV compatível com importMultipleWorks().
   * @param {Object} flatAnswers
   */
  function exportCSV(flatAnswers) {
    const keys   = Object.keys(flatAnswers);
    const values = keys.map(k => {
      const v = String(flatAnswers[k] ?? '');
      return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
    });

    const csv    = keys.join(',') + '\n' + values.join(',');
    const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    const codigo = flatAnswers.CODIGO || 'obra';
    const ts     = new Date().toISOString().slice(0, 10);
    a.href       = url;
    a.download   = `OAE_${codigo}_${ts}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return { saveToDatabase, exportJSON, exportCSV };
})();
