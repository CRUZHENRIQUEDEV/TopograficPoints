/**
 * Script de Emergência - Forçar Inicialização P2P
 *
 * Como usar:
 * 1. Abra o console (F12) no index.html
 * 2. Cole este script e pressione Enter
 * 3. Um botão vermelho aparecerá no canto superior direito
 * 4. Clique nele para forçar a inicialização do P2P
 */

(function forceP2PInitScript() {
  console.log('🔧 Carregando script de inicialização forçada do P2P...');

  // Verifica se já existe botão
  if (document.getElementById('force-p2p-btn')) {
    console.log('⚠️ Botão já existe. Removendo...');
    document.getElementById('force-p2p-btn').remove();
  }

  // Cria botão de emergência
  const btn = document.createElement('button');
  btn.id = 'force-p2p-btn';
  btn.textContent = '🔧 Inicializar P2P';
  btn.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 99999;
    padding: 12px 20px;
    background: #dc3545;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 8px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: all 0.3s;
  `;

  btn.onmouseover = function() {
    btn.style.transform = 'scale(1.05)';
  };

  btn.onmouseout = function() {
    btn.style.transform = 'scale(1)';
  };

  btn.onclick = async function() {
    console.log('\n========== INICIALIZAÇÃO FORÇADA DO P2P ==========\n');

    try {
      // 1. Verificações iniciais
      btn.textContent = '🔍 Verificando...';
      btn.style.background = '#ffc107';

      console.log('1️⃣ Verificando ambiente...');

      if (typeof MultiPeerSync === 'undefined') {
        throw new Error('MultiPeerSync não está carregado!');
      }

      if (typeof Peer === 'undefined') {
        throw new Error('PeerJS não está carregado!');
      }

      console.log('   ✅ MultiPeerSync e PeerJS carregados');

      // 2. Verifica usuário
      const email = localStorage.getItem('oae-user-email');
      const name = localStorage.getItem('oae-user-name');

      if (!email || !name) {
        throw new Error('Usuário não está logado! Faça login primeiro.');
      }

      console.log('2️⃣ Usuário identificado:');
      console.log('   Email:', email);
      console.log('   Nome:', name);

      // 3. Verifica estado atual do peer
      console.log('3️⃣ Verificando estado do peer...');

      const peerExists = !!MultiPeerSync.peer;
      const peerDestroyed = MultiPeerSync.peer?.destroyed;
      const peerDisconnected = MultiPeerSync.peer?.disconnected;

      console.log('   Peer existe?', peerExists);
      console.log('   Destroyed?', peerDestroyed);
      console.log('   Disconnected?', peerDisconnected);

      // 4. Decide se precisa reinicializar
      const needsInit = !peerExists || peerDestroyed || peerDisconnected;

      if (needsInit) {
        console.log('4️⃣ Peer precisa ser (re)inicializado...');
        btn.textContent = '🚀 Inicializando...';

        await MultiPeerSync.init(email, name);
        console.log('   ✅ Peer inicializado com sucesso!');

        // Aguarda estabilização
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('4️⃣ Peer já está inicializado e funcionando');
      }

      // 5. Auto-discovery
      console.log('5️⃣ Iniciando auto-discovery de peers...');
      btn.textContent = '🔍 Buscando peers...';

      MultiPeerSync.connectToUsersFromLocalUsers();

      // Aguarda tentativas de conexão
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 6. Verifica resultado
      console.log('6️⃣ Verificando conexões...');

      const connections = MultiPeerSync.connections.size;
      const knownPeers = MultiPeerSync.knownPeers.size;

      console.log('   Peers conhecidos:', knownPeers);
      console.log('   Conexões ativas:', connections);

      if (connections > 0) {
        console.log('   ✅ CONECTADO!');
        MultiPeerSync.connections.forEach((conn, peerId) => {
          console.log(`      - ${peerId}: ${conn.open ? 'ABERTA ✅' : 'FECHADA ❌'}`);
        });

        btn.textContent = `✅ ${connections} online`;
        btn.style.background = '#28a745';

        // Mostra notificação de sucesso
        if (window.UI && typeof UI.showNotification === 'function') {
          UI.showNotification(`✅ P2P conectado! ${connections} peer(s) online`, 'success');
        }
      } else {
        console.log('   ⚠️ Nenhuma conexão estabelecida');
        console.log('   💡 Certifique-se que outros usuários estão online');

        if (knownPeers === 0) {
          console.log('   ⚠️ Nenhum peer conhecido. Verifique se há usuários cadastrados.');
        }

        btn.textContent = '⚠️ 0 online';
        btn.style.background = '#ff9800';

        // Mostra notificação de aviso
        if (window.UI && typeof UI.showNotification === 'function') {
          UI.showNotification('⚠️ P2P inicializado mas sem conexões. Certifique-se que outros usuários estão online.', 'warning');
        }
      }

      // 7. Exibe stats
      console.log('7️⃣ Estatísticas finais:');
      console.log(MultiPeerSync.getNetworkStats());

      console.log('\n========== INICIALIZAÇÃO CONCLUÍDA ==========\n');

      // Volta ao normal após 5 segundos
      setTimeout(() => {
        btn.textContent = '🔧 Inicializar P2P';
        btn.style.background = '#dc3545';
      }, 5000);

    } catch (err) {
      console.error('❌ ERRO:', err);
      btn.textContent = '❌ Erro!';
      btn.style.background = '#dc3545';

      alert(`Erro ao inicializar P2P:\n\n${err.message}\n\nVeja o console para mais detalhes.`);

      // Volta ao normal após 3 segundos
      setTimeout(() => {
        btn.textContent = '🔧 Inicializar P2P';
      }, 3000);
    }
  };

  // Adiciona botão à página
  document.body.appendChild(btn);

  console.log('✅ Botão de inicialização forçada adicionado no canto superior direito!');
  console.log('💡 Clique nele para forçar a inicialização do P2P');

  // Auto-clica se não houver peer inicializado
  if (!MultiPeerSync.peer || MultiPeerSync.peer.destroyed || MultiPeerSync.peer.disconnected) {
    console.log('⚠️ Peer não está inicializado. Clicando automaticamente em 2 segundos...');
    setTimeout(() => {
      console.log('🤖 Clique automático...');
      btn.click();
    }, 2000);
  }
})();
