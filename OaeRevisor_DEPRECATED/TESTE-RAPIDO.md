# 🚀 Teste Rápido de Conexão P2P

## ✅ O que foi corrigido:

1. **Adicionado delay de 500ms** após `MultiPeerSync.init()` para garantir que o peer esteja pronto
2. **Adicionado delay de 2000ms** antes de solicitar dados, para dar tempo das conexões estabelecerem
3. **Logs detalhados** em todo o processo de auto-discovery e conexão
4. **Melhor tratamento de erros** nas tentativas de conexão

---

## 🧪 Como Testar Agora:

### Passo 1: Limpar Tudo (Opcional mas Recomendado)
Em **ambos** os navegadores, abra o console (F12) e execute:

```javascript
// Limpa peers conhecidos antigos
localStorage.removeItem('oae-known-peers');
for (let i = localStorage.length - 1; i >= 0; i--) {
  const key = localStorage.key(i);
  if (key && key.startsWith('oae-peer-')) {
    localStorage.removeItem(key);
  }
}
console.log('✅ Peers limpos!');
```

### Passo 2: Recarregar e Fazer Login
1. **Recarregue ambos os navegadores** (Ctrl + F5)
2. Faça login em cada navegador com **emails DIFERENTES**:
   - Navegador 1: henrique.exemplo@email.com
   - Navegador 2: maria.exemplo@email.com

### Passo 3: Verificar Logs no Console
Após o login, você DEVE ver logs como estes no console:

```
Multi-Peer iniciado: oae-xxxxxxxxxxxxx
🔍 Iniciando auto-discovery de peers...
🔍 [AUTO-DISCOVERY] Iniciando descoberta automática de peers...
📋 [AUTO-DISCOVERY] 3 usuários encontrados no localStorage
⏭️ [AUTO-DISCOVERY] Ignorando peer próprio: oae-xxxxx
✅ [AUTO-DISCOVERY] Adicionando peer: Administrador → oae-aGVucmlxdWUu
📌 [ADD_PEER] Adicionando peer conhecido: Administrador (oae-aGVucmlxdWUu)
💾 [ADD_PEER] Peer salvo no localStorage. Total de peers conhecidos: 1
🔗 [ADD_PEER] Tentando conectar com oae-aGVucmlxdWUu...
🔌 [CONNECT] Tentando conectar com: oae-aGVucmlxdWUu
✅ [AUTO-DISCOVERY] Concluído: 2 peers adicionados, 1 ignorados
📡 [AUTO-DISCOVERY] Total de peers conhecidos agora: 2
```

### Passo 4: Verificar Conexão Estabelecida
Aguarde 3-5 segundos e execute no console:

```javascript
console.log('Conexões ativas:', MultiPeerSync.connections.size);
console.log('Stats:', MultiPeerSync.getNetworkStats());
```

**Resultado esperado:**
```
Conexões ativas: 1  // ou 2, dependendo de quantos peers estão online
```

---

## 🔍 Diagnóstico de Problemas

### Se ainda mostrar 0 conexões:

#### Problema 1: Peers não se encontraram (Timeout)
**Sintoma:** Você vê logs `⏱️ [CONNECT] Timeout ao conectar com...`

**Causa:** Os peers não conseguem se "ver" no servidor PeerJS

**Solução:**
```javascript
// Execute APENAS em UM navegador para testar:
const outroPeerId = 'oae-xxxxx'; // Copie do outro navegador
MultiPeerSync.addKnownPeer(outroPeerId, 'Teste Manual');
```

#### Problema 2: PeerJS não inicializou
**Sintoma:** Você vê `⚠️ [AUTO-DISCOVERY] Peer não inicializado ainda`

**Causa:** O `MultiPeerSync.init()` falhou

**Solução:** Recarregue a página e verifique se há erros no console

#### Problema 3: Usuários não estão na lista
**Sintoma:** `📋 [AUTO-DISCOVERY] 0 usuários encontrados no localStorage`

**Causa:** A lista de usuários está vazia

**Solução:**
1. Acesse o gerenciamento de usuários (se for admin)
2. Adicione os usuários manualmente
3. Ou importe via link de compartilhamento

#### Problema 4: Mesmos emails
**Sintoma:** Apenas 1 peer é ignorado no auto-discovery, mas não é adicionado nenhum

**Causa:** Todos os usuários na lista têm o mesmo email

**Solução:** Certifique-se que cada usuário tem um email ÚNICO

---

## 📊 Script de Diagnóstico Completo

Execute este script em **ambos** navegadores após fazer login:

```javascript
(async function() {
  console.log('\n========== DIAGNÓSTICO P2P ==========\n');

  // 1. Identidade
  const myEmail = localStorage.getItem('oae-user-email');
  const myUserId = localStorage.getItem('oae-user-id');
  const myPeerId = `oae-${myUserId}`;

  console.log('👤 MEU PERFIL:');
  console.log('   Email:', myEmail);
  console.log('   User ID:', myUserId);
  console.log('   Peer ID:', myPeerId);

  // 2. Usuários cadastrados
  const users = JSON.parse(localStorage.getItem('oae-users') || '[]');
  console.log('\n📋 USUÁRIOS CADASTRADOS:', users.length);
  users.forEach(u => {
    const pid = `oae-${btoa(u.email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12)}`;
    console.log(`   - ${u.name} (${u.email}) → ${pid}`);
  });

  // 3. Peers conhecidos
  console.log('\n🌐 PEERS CONHECIDOS:', MultiPeerSync.knownPeers.size);
  MultiPeerSync.knownPeers.forEach(p => console.log('   -', p));

  // 4. Conexões ativas
  console.log('\n🔗 CONEXÕES ATIVAS:', MultiPeerSync.connections.size);
  MultiPeerSync.connections.forEach((conn, peerId) => {
    console.log(`   - ${peerId} (${conn.open ? 'ABERTA' : 'FECHADA'})`);
  });

  // 5. Status do Peer
  console.log('\n📡 STATUS DO PEER:');
  console.log('   Inicializado?', !!MultiPeerSync.peer);
  console.log('   ID:', MultiPeerSync.peer?.id);
  console.log('   Destruído?', MultiPeerSync.peer?.destroyed);
  console.log('   Desconectado?', MultiPeerSync.peer?.disconnected);

  // 6. Teste de reconexão
  console.log('\n🔄 FORÇANDO RECONEXÃO...');
  MultiPeerSync.connectToUsersFromLocalUsers();

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n📊 RESULTADO APÓS 5 SEGUNDOS:');
  console.log('   Conexões:', MultiPeerSync.connections.size);
  console.log('   Stats:', MultiPeerSync.getNetworkStats());

  console.log('\n========== FIM DO DIAGNÓSTICO ==========\n');
})();
```

---

## ✅ Teste de Sincronização de Obra

Depois que as conexões estiverem estabelecidas (connections.size > 0):

### No Navegador 1:
1. Crie ou edite uma obra
2. Clique em "Publicar Obra"
3. Verifique no console: `Obra "XXX-XXX" sincronizada com peers`

### No Navegador 2:
1. Aguarde 2-3 segundos
2. Abra o modal de obras (botão "📦 Obras Salvas")
3. A obra do Navegador 1 deve aparecer na lista
4. Verifique no console: `📦 1 obras importadas de...`

---

## 🆘 Solução Emergencial (Se NADA funcionar)

Se após todos os testes as conexões não estabelecerem, pode ser um problema de rede/firewall. Use o método alternativo:

### Compartilhamento por Link (Sempre Funciona):
1. No Navegador 1: Clique em "Gerar Link" na obra
2. Copie o link
3. No Navegador 2: Cole o link no navegador
4. A obra será importada automaticamente

Este método não depende de P2P e sempre funciona!

---

## 📞 Contato para Suporte

Se ainda tiver problemas, envie:
1. Output completo do script de diagnóstico (de ambos navegadores)
2. Screenshots dos logs do console
3. Versões dos navegadores
