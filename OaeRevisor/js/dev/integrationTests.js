/* Integration Test Helpers for OAE Revisor
   Usage: open the app with ?runTests=1 and run runIntegrationTests() from the dev console.
*/
(function(){
  function createSampleEncodedWork(codigo = 'TEST-001'){
    const data = {
      version: '1.0',
      type: 'oae-work-share',
      timestamp: Date.now(),
      sharedBy: AuthSystem.currentUser?.email || 'tester',
      work: {
        work: {
          codigo: codigo,
          nome: 'Obra de Teste',
          metadata: { note: 'Teste de compartilhamento' }
        }
      }
    };
    return btoa(JSON.stringify(data));
  }

  async function testProcessWorkLinkImport(){
    console.group('IntegrationTest: processWorkLinkImport');
    try{
      const encoded = createSampleEncodedWork('INT-IMPORT-01');
      // Open import modal
      SyncMethods.showImportQRModal();
      const input = document.getElementById('importWorkLinkInput');
      input.value = window.location.origin + window.location.pathname + '?shareWork=' + encodeURIComponent(encoded);

      await SyncMethods.processWorkLinkImport();

      // Wait briefly for modal to appear
      await new Promise(r => setTimeout(r, 300));
      const autoModal = document.getElementById('autoWorkShareModal');
      if (autoModal) console.log('PASS: autoWorkShareModal appeared'); else console.error('FAIL: autoWorkShareModal did not appear');
    }catch(e){ console.error('ERROR', e); }
    console.groupEnd();
  }

  async function testPublishBroadcast(){
    console.group('IntegrationTest: publishBroadcast');
    try{
      if (!window.MultiPeerSync || !window.UI) { console.warn('MultiPeerSync/UI not available'); return; }

      // Spy on broadcast and broadcastWorkUpdated
      const calls = [];
      const origBroadcast = MultiPeerSync.broadcast;
      const origBroadcastWorkUpdated = MultiPeerSync.broadcastWorkUpdated;

      MultiPeerSync.broadcast = function(data){ calls.push({type: 'broadcast', data}); }
      MultiPeerSync.broadcastWorkUpdated = function(work){ calls.push({type: 'work_updated', work}); }

      // Ensure appState.work exists
      window.appState = window.appState || {};
      window.appState.work = window.appState.work || { codigo: 'INT-PUB-01', nome: 'Obra Publish Test', metadata: {} };

      await UI.publicarObra();
      await new Promise(r=>setTimeout(r, 300));

      const hasWorkUpdated = calls.some(c => c.type === 'work_updated');
      const hasShareLink = calls.some(c => c.type === 'broadcast' && c.data && c.data.type === 'work_share_link');

      if(hasWorkUpdated) console.log('PASS: broadcastWorkUpdated was called'); else console.error('FAIL: broadcastWorkUpdated not called');
      if(hasShareLink) console.log('PASS: work_share_link was broadcast'); else console.error('FAIL: work_share_link not broadcast');

      // restore
      MultiPeerSync.broadcast = origBroadcast;
      MultiPeerSync.broadcastWorkUpdated = origBroadcastWorkUpdated;
    }catch(e){ console.error('ERROR', e); }
    console.groupEnd();
  }

  async function testPresenceUI(){
    console.group('IntegrationTest: presenceUI');
    try{
      if (!window.MultiPeerSync || !window.UI) { console.warn('MultiPeerSync/UI not available'); return; }

      const header = document.getElementById('headerPeersCount');
      if(!header) { console.error('FAIL: headerPeersCount not found'); return; }

      // Simulate a login message from another peer
      const payload = { email: 'sim@peer.test', name: 'Peer Sim', role: 'inspetor', lote: 'A' };
      await MultiPeerSync.handleUserLogin('oae-sim', payload);

      // Allow UI update
      await new Promise(r=>setTimeout(r, 200));

      console.log('Header now reads:', header.textContent);
      console.groupEnd();
    }catch(e){ console.error('ERROR', e); }
  }

  async function testRequestWorksSync(){
    console.group('IntegrationTest: requestWorksSync');
    try{
      if (!window.MultiPeerSync || !window.WorkManager) { console.warn('MultiPeerSync/WorkManager not available'); return; }

      const sample = (function(){
        const code = 'TEST-SYNC-01';
        return {
          work: { codigo: code, nome: 'Teste Sync', metadata: { lastModifiedAt: new Date().toISOString(), createdAt: new Date().toISOString(), isPublic: true } }
        };
      })();

      // Simulate receiving works_list from a peer
      await MultiPeerSync.handleWorksList('oae-sim', { works: [sample], source: 'oae-sim', timestamp: Date.now() });

      // Allow processing
      await new Promise(r=>setTimeout(r, 300));

      const exists = WorkManager.worksCache.has('TEST-SYNC-01');
      if (exists) console.log('PASS: received work was saved'); else console.error('FAIL: received work not saved');

      console.groupEnd();
    }catch(e){ console.error('ERROR', e); }
  }

  // Expose tests
  window.runIntegrationTests = async function(){
    console.log('Running integration tests...');
    await testProcessWorkLinkImport();
    await testPublishBroadcast();
    await testPresenceUI();
    await testRequestWorksSync();
    console.log('Integration tests completed. Inspect console for pass/fail messages.');
  };

  window.runIntegrationTests = async function(){
    console.log('Running integration tests...');
    await testProcessWorkLinkImport();
    await testPublishBroadcast();
    await testPresenceUI();
    console.log('Integration tests completed. Inspect console for pass/fail messages.');
  };

  console.log('Integration tests helper loaded. Call runIntegrationTests() to execute.');
})();