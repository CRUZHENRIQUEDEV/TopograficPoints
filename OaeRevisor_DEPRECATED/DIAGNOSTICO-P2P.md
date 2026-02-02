# 🔍 Diagnóstico: Problema de Conexão P2P

## Problema Relatado
- Dois navegadores diferentes na mesma máquina
- Duas contas diferentes logadas
- Mostra **0 peers online**
- Sincronização não está funcionando

## ✅ Como o Sistema DEVERIA Funcionar

### Quando você faz login:
1. `AuthSystem` inicializa o `MultiPeerSync` ([authSystem.js:185](authSystem.js#L185))
2. `MultiPeerSync.connectToUsersFromLocalUsers()` é chamado ([authSystem.js:197](authSystem.js#L197))
3. Sistema lê lista de usuários do `localStorage` → `oae-users`
4. Para cada usuário, gera o `peerId = oae-{hash do email}`
5. Tenta conectar com cada peer automaticamente

### Quando uma obra é salva:
1. Obra é salva no IndexedDB
2. `MultiPeerSync.broadcastWorkUpdated()` envia para peers conectados
3. Se não há peers → obra é enfileirada em `oae-pending-works`
4. Quando alguém conecta → fila é esvaziada automaticamente

---

## 🐛 Possíveis Causas do Problema

### 1. **Lista de Usuários Vazia**
Se a lista `oae-users` no localStorage estiver vazia, não há peers para conectar.

**Como verificar:**
```javascript
// No console do navegador (F12)
JSON.parse(localStorage.getItem('oae-users') || '[]')
```

**Solução:**
- Adicione os usuários através do sistema de gerenciamento
- Ou importe usuários via link de compartilhamento

---

### 2. **PeerJS Bloqueado**
Navegadores com "Tracking Prevention" ativo podem bloquear PeerJS.

**Como verificar:**
```javascript
// No console do navegador
typeof Peer !== 'undefined' // Deve retornar true
```

**Solução:**
- Firefox: Desabilitar "Enhanced Tracking Protection" para localhost
- Edge: Desabilitar "Tracking prevention" para localhost
- Chrome: Geralmente não tem problemas

---

### 3. **MultiPeerSync Não Inicializado**
O sistema P2P pode não ter inicializado corretamente.

**Como verificar:**
```javascript
// No console do navegador
MultiPeerSync.peer // Deve retornar objeto Peer
MultiPeerSync.userId // Deve retornar seu ID
MultiPeerSync.knownPeers // Deve mostrar lista de peers
```

**Solução:**
- Recarregue a página com Ctrl+F5
- Verifique console por erros

---

### 4. **Peers Não se Conhecem**
Os dois navegadores podem não ter os peer IDs um do outro.

**Como verificar:**
```javascript
// Navegador 1
localStorage.getItem('oae-user-id') // Anote este ID

// Navegador 2
MultiPeerSync.knownPeers // Deve conter oae-{ID do navegador 1}
```

**Solução:**
- Execute `MultiPeerSync.connectToUsersFromLocalUsers()` manualmente
- Ou adicione manualmente: `MultiPeerSync.addKnownPeer('oae-xxxxx', 'Nome')`

---

### 5. **Mesmo LocalStorage Compartilhado**
Se os navegadores estão compartilhando o mesmo localStorage, vão gerar o MESMO peer ID.

**Como verificar:**
```javascript
// Navegador 1
localStorage.getItem('oae-user-email')
localStorage.getItem('oae-user-id')

// Navegador 2
localStorage.getItem('oae-user-email')
localStorage.getItem('oae-user-id')

// Se forem IGUAIS → PROBLEMA!
```

**Explicação:**
- Cada usuário precisa ter um email DIFERENTE
- O peer ID é gerado a partir do email
- Se os emails são iguais → peer IDs iguais → não conectam

---

## 🧪 Passo a Passo para Diagnosticar

### Teste 1: Página de Diagnóstico
1. Abra em cada navegador: `test-p2p-connection.html`
2. Clique em "🔍 Testar Auto-Discovery"
3. Verifique se encontra peers potenciais

### Teste 2: Console do Navegador
Execute em cada navegador (F12 → Console):

```javascript
// === INFORMAÇÕES BÁSICAS ===
console.log('Email:', localStorage.getItem('oae-user-email'));
console.log('User ID:', localStorage.getItem('oae-user-id'));
console.log('Peer ID:', 'oae-' + localStorage.getItem('oae-user-id'));

// === USUÁRIOS CADASTRADOS ===
console.log('Usuários:', JSON.parse(localStorage.getItem('oae-users') || '[]'));

// === PEERS CONHECIDOS ===
console.log('Known Peers:', MultiPeerSync.knownPeers);

// === CONEXÕES ATIVAS ===
console.log('Conexões:', MultiPeerSync.connections);

// === STATUS GERAL ===
console.log('Stats:', MultiPeerSync.getNetworkStats());
```

### Teste 3: Forçar Reconexão
Execute em UM dos navegadores:

```javascript
// Força reconexão com usuários locais
MultiPeerSync.connectToUsersFromLocalUsers();

// Aguarde 5 segundos e verifique:
setTimeout(() => {
  console.log('Conexões após tentativa:', MultiPeerSync.connections);
  console.log('Stats:', MultiPeerSync.getNetworkStats());
}, 5000);
```

### Teste 4: Conexão Manual
Se souber o peer ID do outro navegador:

```javascript
// Navegador 2 (substitua pelo ID correto)
MultiPeerSync.addKnownPeer('oae-bWFyaWFAbG9j', 'Maria');

// Aguarde e verifique
setTimeout(() => {
  console.log('Conexões:', MultiPeerSync.connections);
}, 3000);
```

---

## 🔧 Soluções Comuns

### Solução 1: Garantir Usuários Diferentes
```javascript
// Navegador 1
// Certifique-se de estar logado como: user1@example.com

// Navegador 2
// Certifique-se de estar logado como: user2@example.com

// NUNCA use o mesmo email nos dois navegadores!
```

### Solução 2: Adicionar Usuário Manualmente
Se um usuário não está na lista do outro:

**No navegador do Admin:**
1. Vá para a tela de gerenciamento de usuários
2. Adicione o outro usuário
3. Isso dispara automaticamente o `broadcastUserAdded()`

### Solução 3: Limpar e Reconfigurar
Se tudo mais falhar:

```javascript
// Em AMBOS navegadores, execute:
localStorage.removeItem('oae-known-peers');

// Depois, force reconexão:
MultiPeerSync.connectToUsersFromLocalUsers();
```

### Solução 4: Verificar Firewall/Antivírus
- PeerJS usa STUN servers (porta UDP)
- Alguns firewalls bloqueiam isso
- Teste em rede diferente ou desabilite temporariamente

---

## 📊 Checklist de Verificação

- [ ] PeerJS está carregado? (`typeof Peer !== 'undefined'`)
- [ ] Usuários têm emails DIFERENTES?
- [ ] Lista `oae-users` contém ambos usuários?
- [ ] Cada navegador tem seu próprio `oae-user-id`?
- [ ] `MultiPeerSync.peer` está inicializado?
- [ ] `MultiPeerSync.knownPeers` contém o outro peer?
- [ ] Console não mostra erros de conexão?
- [ ] Tracking Prevention está desabilitado?

---

## 🆘 Se Nada Funcionar

Execute este script de diagnóstico completo:

```javascript
async function diagnosticoCompleto() {
  console.log('=== DIAGNÓSTICO COMPLETO P2P ===');

  // 1. PeerJS
  console.log('1. PeerJS carregado?', typeof Peer !== 'undefined');

  // 2. Identidade
  const email = localStorage.getItem('oae-user-email');
  const userId = localStorage.getItem('oae-user-id');
  console.log('2. Email:', email);
  console.log('   User ID:', userId);
  console.log('   Peer ID:', 'oae-' + userId);

  // 3. Usuários
  const users = JSON.parse(localStorage.getItem('oae-users') || '[]');
  console.log('3. Total usuários:', users.length);
  users.forEach(u => console.log('   -', u.email, '→ oae-' + btoa(u.email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12)));

  // 4. MultiPeerSync
  console.log('4. Peer inicializado?', !!MultiPeerSync.peer);
  console.log('   Peer ID atual:', MultiPeerSync.peer?.id);
  console.log('   Known peers:', [...MultiPeerSync.knownPeers]);
  console.log('   Conexões ativas:', MultiPeerSync.connections.size);

  // 5. Teste de conexão
  console.log('5. Tentando reconectar...');
  MultiPeerSync.connectToUsersFromLocalUsers();

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('6. Resultado após 5 segundos:');
  console.log('   Conexões:', MultiPeerSync.connections.size);
  console.log('   Stats:', MultiPeerSync.getNetworkStats());

  console.log('=== FIM DO DIAGNÓSTICO ===');
}

diagnosticoCompleto();
```

---

## 📝 Relatório de Bug

Se após todos os testes o problema persistir, forneça:

1. Output do `diagnosticoCompleto()` de AMBOS navegadores
2. Screenshots do teste de auto-discovery
3. Erros no console (se houver)
4. Navegadores e versões utilizadas
5. Sistema operacional

---

## 💡 Dica Rápida

**Para testar AGORA mesmo:**

**Navegador 1 (Admin):**
```javascript
// 1. Verifique seu peer ID
console.log('Meu Peer ID:', MultiPeerSync.peer.id);
```

**Navegador 2 (Outro usuário):**
```javascript
// 2. Adicione manualmente o peer do navegador 1
MultiPeerSync.addKnownPeer('COLE_O_PEER_ID_AQUI', 'Admin');

// 3. Aguarde 3 segundos e verifique
setTimeout(() => console.log('Conectado?', MultiPeerSync.hasConnections()), 3000);
```

Se isso funcionar → problema está no auto-discovery
Se não funcionar → problema está no PeerJS/rede
