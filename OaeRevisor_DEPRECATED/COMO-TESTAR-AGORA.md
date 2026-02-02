# 🚀 Como Testar a Conexão P2P AGORA

## ⚠️ Problema que Estava Acontecendo:
O erro `ID "oae-dGVvZ2VuZXMu" is taken` indica que você estava tentando fazer login **duas vezes com o mesmo usuário** (provavelmente recarregando a página sem fazer logout).

## ✅ Correções Aplicadas:

1. **Detecção e destruição de peer duplicado** antes de criar um novo
2. **Validação de peer ativo** antes de tentar conectar
3. **Tratamento especial para erro de ID duplicado** com tentativa de reconexão
4. **Verificação de inicialização** para evitar múltiplas inicializações

---

## 📋 Procedimento de Teste (PASSO A PASSO):

### Passo 1: Fechar Tudo e Limpar
1. **Feche TODAS as abas** do OAE Revisor em todos os navegadores
2. Aguarde 5 segundos (para o servidor PeerJS liberar os IDs)

### Passo 2: Navegador 1 (Primeira Conta)
1. Abra o navegador 1 (ex: Chrome)
2. Acesse `index.html`
3. **Abra o console** (F12)
4. Faça login com a **primeira conta** (ex: henrique@email.com)
5. **AGUARDE** ver no console:
   ```
   ✅ [INIT] Multi-Peer iniciado com sucesso: oae-xxxxx
   🔍 [AUTH] Iniciando auto-discovery de peers...
   📋 [AUTO-DISCOVERY] 3 usuários encontrados
   ✅ [AUTO-DISCOVERY] Concluído: X peers adicionados
   ```

### Passo 3: Navegador 2 (Segunda Conta)
1. Abra o navegador 2 (ex: Edge ou Firefox)
2. Acesse `index.html`
3. **Abra o console** (F12)
4. Faça login com a **segunda conta DIFERENTE** (ex: maria@email.com)
5. **AGUARDE** ver no console:
   ```
   ✅ [INIT] Multi-Peer iniciado com sucesso: oae-yyyyy
   🔍 [AUTH] Iniciando auto-discovery de peers...
   📋 [AUTO-DISCOVERY] 3 usuários encontrados
   🔌 [CONNECT] Tentando conectar com: oae-xxxxx
   ✅ [CONNECT] Conexão estabelecida com oae-xxxxx
   ```

### Passo 4: Verificar Conexão
**No navegador 2**, execute no console:
```javascript
MultiPeerSync.connections.size
```

**Resultado esperado:** `1` (ou mais, se houver outros peers online)

**No navegador 1**, execute no console:
```javascript
MultiPeerSync.connections.size
```

**Resultado esperado:** `1` (ou mais)

---

## ✅ Se Tudo Funcionar:

Você verá em **ambos** navegadores:
```javascript
MultiPeerSync.getNetworkStats()
```

Retornará algo como:
```javascript
{
  totalPeers: 2,
  connectedPeers: 1,
  userId: "aGVucmlxdWUu",
  userName: "Henrique",
  connections: ["oae-bWFyaWEu"],
  knownPeers: ["oae-bWFyaWEu", "oae-dGVvZ2VuZXMu"]
}
```

---

## 🧪 Testar Sincronização de Obra:

### No Navegador 1:
1. Crie uma obra nova ou edite uma existente
2. Clique em **"Publicar Obra"**
3. Verifique no console:
   ```
   ✅ Obra "XXX-XXX" sincronizada com peers (enviadas: 1)
   ```

### No Navegador 2:
1. Aguarde 2-3 segundos
2. Clique no botão **"📦 Obras Salvas"**
3. A obra criada no Navegador 1 deve aparecer!
4. Verifique no console:
   ```
   📥 Recebendo atualização de obra de...
   ✅ Obra "XXX-XXX" atualizada
   ```

---

## ❌ Se AINDA Não Funcionar:

### Diagnóstico 1: Verificar se peers estão online ao mesmo tempo
```javascript
// Execute em AMBOS navegadores ao mesmo tempo
console.log('Meu ID:', MultiPeerSync.peer?.id);
console.log('Peer OK?', !MultiPeerSync.peer?.destroyed && !MultiPeerSync.peer?.disconnected);
```

### Diagnóstico 2: Verificar se os usuários estão na lista
```javascript
// Execute em AMBOS navegadores
const users = JSON.parse(localStorage.getItem('oae-users') || '[]');
console.log('Usuários cadastrados:', users.map(u => u.email));
```

**IMPORTANTE:** Os dois emails devem aparecer na lista de AMBOS navegadores!

### Diagnóstico 3: Forçar reconexão manual
Se os peers não conectarem automaticamente, force manualmente:

**No Navegador 2:**
```javascript
// 1. Pegue o ID do Navegador 1 (copie do console dele)
const idDoNavegador1 = 'oae-aGVucmlxdWUu'; // SUBSTITUA pelo ID real

// 2. Force a conexão
MultiPeerSync.addKnownPeer(idDoNavegador1, 'Navegador 1');

// 3. Aguarde 3 segundos e verifique
setTimeout(() => {
  console.log('Conectado?', MultiPeerSync.connections.size > 0);
}, 3000);
```

---

## 🔍 Logs que Você DEVE Ver (Sucesso):

### Navegador 1 (Login):
```
🚀 [AUTH] Inicializando MultiPeerSync...
🚀 [INIT] Inicializando peer com ID: oae-aGVucmlxdWUu
✅ [INIT] Multi-Peer iniciado com sucesso: oae-aGVucmlxdWUu
🔍 [AUTH] Iniciando auto-discovery de peers...
🔍 [AUTO-DISCOVERY] Iniciando descoberta automática de peers...
📋 [AUTO-DISCOVERY] 3 usuários encontrados no localStorage
⏭️ [AUTO-DISCOVERY] Ignorando peer próprio: oae-aGVucmlxdWUu (henrique@email.com)
✅ [AUTO-DISCOVERY] Adicionando peer: Maria → oae-bWFyaWEu
📌 [ADD_PEER] Adicionando peer conhecido: Maria (oae-bWFyaWEu)
💾 [ADD_PEER] Peer salvo no localStorage. Total de peers conhecidos: 1
🔗 [ADD_PEER] Tentando conectar com oae-bWFyaWEu...
🔌 [CONNECT] Tentando conectar com: oae-bWFyaWEu
✅ [AUTO-DISCOVERY] Concluído: 2 peers adicionados, 1 ignorados
```

### Navegador 2 (Quando conecta):
```
✅ [CONNECT] Conexão estabelecida com oae-bWFyaWEu
Conexão aberta com: oae-bWFyaWEu
```

---

## 🆘 Erros Comuns e Soluções:

### Erro: `ID "oae-xxxxx" is taken`
**Causa:** Mesmo usuário tentando conectar duas vezes

**Solução:**
1. Feche todas as abas
2. Aguarde 10 segundos
3. Reabra UMA aba por vez
4. Use emails DIFERENTES em cada navegador

### Erro: `Cannot connect to new Peer after disconnecting`
**Causa:** Peer foi destruído mas código tentou usar ele

**Solução:**
- **Já foi corrigido!** Recarregue a página (Ctrl+F5)

### Erro: `Timeout ao conectar com...`
**Causa:** O outro peer não está online ou não está acessível

**Solução:**
1. Verifique se os dois navegadores estão abertos **ao mesmo tempo**
2. Verifique se não há firewall bloqueando
3. Tente adicionar manualmente (código acima)

---

## 📊 Script de Verificação Completa:

Cole este script no console de **ambos** navegadores após fazer login:

```javascript
(async function verificarP2P() {
  console.log('\n========== VERIFICAÇÃO P2P ==========\n');

  // 1. Status do Peer
  console.log('1️⃣ STATUS DO PEER:');
  console.log('   ID:', MultiPeerSync.peer?.id || 'NÃO INICIALIZADO');
  console.log('   Destroyed?', MultiPeerSync.peer?.destroyed);
  console.log('   Disconnected?', MultiPeerSync.peer?.disconnected);
  console.log('   Válido?', !!(MultiPeerSync.peer && !MultiPeerSync.peer.destroyed && !MultiPeerSync.peer.disconnected));

  // 2. Usuários
  const users = JSON.parse(localStorage.getItem('oae-users') || '[]');
  console.log('\n2️⃣ USUÁRIOS CADASTRADOS:', users.length);
  users.forEach(u => console.log('   -', u.name, '→', `oae-${btoa(u.email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12)}`));

  // 3. Peers Conhecidos
  console.log('\n3️⃣ PEERS CONHECIDOS:', MultiPeerSync.knownPeers.size);
  MultiPeerSync.knownPeers.forEach(p => console.log('   -', p));

  // 4. Conexões Ativas
  console.log('\n4️⃣ CONEXÕES ATIVAS:', MultiPeerSync.connections.size);
  if (MultiPeerSync.connections.size > 0) {
    console.log('   ✅ CONECTADO!');
    MultiPeerSync.connections.forEach((conn, peerId) => {
      console.log(`   - ${peerId} (${conn.open ? 'ABERTA ✅' : 'FECHADA ❌'})`);
    });
  } else {
    console.log('   ❌ Nenhuma conexão ativa');
    console.log('   💡 Certifique-se que outro navegador está online');
  }

  // 5. Stats
  console.log('\n5️⃣ ESTATÍSTICAS:');
  console.log(MultiPeerSync.getNetworkStats());

  console.log('\n========== FIM DA VERIFICAÇÃO ==========\n');

  if (MultiPeerSync.connections.size > 0) {
    console.log('✅ TUDO FUNCIONANDO! Pode testar a sincronização de obras.');
  } else {
    console.log('⚠️ Sem conexões. Verifique se outro navegador está online e tente:');
    console.log('   MultiPeerSync.connectToUsersFromLocalUsers();');
  }
})();
```

---

## 🎯 Resultado Final Esperado:

Quando tudo estiver funcionando, você verá:

- ✅ `MultiPeerSync.connections.size` retorna **1 ou mais**
- ✅ Interface mostra **"X usuários online"**
- ✅ Obras criadas em um navegador aparecem no outro automaticamente
- ✅ Console mostra logs de conexão bem-sucedida

---

**TESTE AGORA e me diga o resultado!** 🚀
