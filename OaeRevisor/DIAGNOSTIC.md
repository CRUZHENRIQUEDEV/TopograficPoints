# 🔍 DIAGNÓSTICO DE PROBLEMAS - OAE Revisor

## PASSO 1: Limpar Cache do Navegador

### Opção A - Recarregamento Forçado (MAIS RÁPIDO)
1. Pressione `Ctrl + Shift + R` (ou `Ctrl + F5`)
2. Isso força o navegador a recarregar todos os arquivos

### Opção B - Limpar Cache Completo
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Imagens e arquivos em cache"
3. Clique em "Limpar dados"
4. Recarregue a página com `F5`

---

## PASSO 2: Executar Diagnóstico no Console

1. **Abra o Console** (pressione `F12`)
2. **Cole e execute este código:**

```javascript
console.log("=== DIAGNÓSTICO OAE REVISOR ===");

// 1. Verificar se funções existem
console.log("\n1. FUNÇÕES CRÍTICAS:");
console.log("- toggleWorkVisibility:", typeof UI.toggleWorkVisibility);
console.log("- editWorkMetadata:", typeof UI.editWorkMetadata);
console.log("- saveWorkMetadata:", typeof UI.saveWorkMetadata);
console.log("- showToast:", typeof UI.showToast);

// 2. Verificar estado atual
console.log("\n2. ESTADO ATUAL:");
console.log("- Usuário logado:", AuthSystem.isLoggedIn);
console.log("- Usuário atual:", AuthSystem.currentUser);
console.log("- completionStates é Map?:", appState.completionStates instanceof Map);
console.log("- messageResponses é Map?:", appState.messageResponses instanceof Map);

// 3. Verificar obras no cache
console.log("\n3. OBRAS CARREGADAS:");
console.log("- Total de obras:", WorkManager.worksCache.size);
WorkManager.worksCache.forEach((work, codigo) => {
  console.log(`  - ${codigo}:`, {
    status: work.work?.metadata?.status,
    isPublic: work.work?.metadata?.isPublic,
    permissions: WorkManager.getUserPermissions(codigo)
  });
});

// 4. Testar conversão de Maps
console.log("\n4. TESTE DE MAPS:");
const testObj = { "key1": true, "key2": false };
const testMap = new Map(Object.entries(testObj));
console.log("- Objeto:", testObj);
console.log("- Map convertido:", testMap);
console.log("- testMap.get('key1'):", testMap.get('key1'));

console.log("\n=== FIM DO DIAGNÓSTICO ===");
```

---

## PASSO 3: Verificar Botões no Gestor de Obras

1. Vá em **📂 Gerenciar Obras**
2. **Inspecione o HTML** da tabela:
   - Clique direito em uma linha da tabela
   - Selecione "Inspecionar elemento"
   - Procure pela coluna "Visibilidade"
   - Veja se o botão está renderizado no HTML

3. **Tire um print** da tabela e me mostre

---

## PASSO 4: Se Nada Funcionar - Reset Completo

Execute no console:

```javascript
// ATENÇÃO: Isso vai LIMPAR TUDO!
if (confirm("Tem certeza que deseja LIMPAR TODOS OS DADOS?\n\nIsso vai apagar:\n- Todas as obras\n- Configurações\n- Sessão de login\n\nVocê terá que fazer login novamente.")) {
  localStorage.clear();
  sessionStorage.clear();
  indexedDB.deleteDatabase('OAERevisorDB');
  location.reload();
}
```

---

## PASSO 5: Verificar Versão dos Arquivos

Execute no console para verificar se os arquivos foram atualizados:

```javascript
// Verifica última modificação dos arquivos JS
fetch('js/ui.js').then(r => r.text()).then(t => {
  console.log("ui.js contém toggleWorkVisibility?", t.includes("toggleWorkVisibility"));
  console.log("ui.js contém editWorkMetadata?", t.includes("editWorkMetadata"));
});

fetch('js/sync.js').then(r => r.text()).then(t => {
  console.log("sync.js contém 'Convert objects back to Maps'?", t.includes("Convert objects back to Maps"));
});
```

---

## 📊 RESULTADOS ESPERADOS

Se tudo estiver funcionando:
- ✅ `toggleWorkVisibility: function`
- ✅ `editWorkMetadata: function`
- ✅ `saveWorkMetadata: function`
- ✅ `showToast: function`
- ✅ `completionStates é Map?: true`
- ✅ `messageResponses é Map?: true`

---

## 🆘 AINDA COM PROBLEMAS?

Me envie:
1. **Print da tabela** do Gestor de Obras
2. **Resultado completo** do diagnóstico do console
3. **Mensagens de erro** se houver alguma

Com essas informações, posso identificar exatamente o que está errado!
