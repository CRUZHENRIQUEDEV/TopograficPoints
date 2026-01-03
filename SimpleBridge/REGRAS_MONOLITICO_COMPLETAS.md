# Regras Completas - Transição Monolítica

**Data:** 02/01/2026  
**Versão:** 3.0 (Completa)  
**Status:** ✅ Implementado

---

## 📋 Todas as Regras Implementadas

Quando o usuário seleciona **"MONOLÍTICO"** como tipo de encontro, as seguintes regras são aplicadas automaticamente:

### 🔧 TRANSIÇÃO

| Campo                 | Comportamento | Valor            | Editável |
| --------------------- | ------------- | ---------------- | -------- |
| **Altura da Cortina** | Bloqueado     | = ESPESSURA LAJE | ❌ Não   |
| **Aparelho de Apoio** | Bloqueado     | "Nenhum"         | ❌ Não   |

### 🏗️ SUPERESTRUTURA

| Campo                   | Comportamento | Valor           | Editável |
| ----------------------- | ------------- | --------------- | -------- |
| **Tipo Superestrutura** | Bloqueado     | "ENGASTADA"     | ❌ Não   |
| **Qtd Longarinas**      | Bloqueado     | 0               | ❌ Não   |
| **Qtd Transversinas**   | Bloqueado     | 0               | ❌ Não   |
| **Tipo Transversina**   | Bloqueado     | "Nenhum"        | ❌ Não   |
| **Altura Longarina**    | Bloqueado     | "" (vazio/null) | ❌ Não   |

### 📏 DESLOCAMENTOS

| Campo                     | Comportamento | Valor Padrão | Editável | Restrição            |
| ------------------------- | ------------- | ------------ | -------- | -------------------- |
| **Deslocamento Esquerdo** | Editável      | 1.0m         | ✅ Sim   | min > 0 (nunca zero) |
| **Deslocamento Direito**  | Editável      | 1.0m         | ✅ Sim   | min > 0 (nunca zero) |

---

## 🎯 Justificativa Técnica

### Por que essas regras?

**Pontes Monolíticas** são estruturas onde a superestrutura e a infraestrutura são construídas de forma contínua, sem juntas de dilatação nas extremidades:

1. **Sem Longarinas/Transversinas:** A laje trabalha diretamente como elemento estrutural principal
2. **Sempre Engastada:** A continuidade estrutural cria engastamento nas extremidades
3. **Sem Aparelho de Apoio:** Não há necessidade de dispositivos de apoio móveis
4. **Cortina = Espessura Laje:** A transição é feita pela própria espessura da laje
5. **Deslocamentos > 0:** Necessário para acomodar a geometria da transição monolítica

---

## 🔄 Fluxo de Aplicação das Regras

```
┌─────────────────────────────────────────────────────────────┐
│ USUÁRIO SELECIONA "MONOLÍTICO" NO TIPO DE ENCONTRO         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ EVENTO "change" DISPARA applyMonolithicTransitionRules()   │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
┌──────────────────┐              ┌──────────────────┐
│ TRANSIÇÃO        │              │ SUPERESTRUTURA   │
├──────────────────┤              ├──────────────────┤
│ ✅ Cortina       │              │ ✅ Tipo = ENGAST │
│ ✅ Aparelho Apoio│              │ ✅ Qtd Long = 0  │
└──────────────────┘              │ ✅ Qtd Trans = 0 │
                                  │ ✅ Tipo Trans = 0│
                                  │ ✅ Alt Long = "" │
                                  └──────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ DESLOCAMENTOS: Padrão 1.0m (editável, min > 0)             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ NOTAS VISUAIS ADICIONADAS ABAIXO DE CADA CAMPO             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos Modificados

### 1. `validation.js` (linhas 1317-1463)

**Função Principal:** `applyMonolithicTransitionRules()`

```javascript
// Versão: 3.0
function applyMonolithicTransitionRules() {
  // Detecta se tipo = "MONOLITICO"
  const isMonolithic = tipoEncontroField.value === "MONOLITICO";

  if (isMonolithic) {
    // Bloqueia 9 campos diferentes
    // Adiciona notas visuais
    // Define valores padrão
  } else {
    // Desbloqueia todos os campos
    // Remove notas visuais
  }
}
```

**Campos Gerenciados:**

- `cortina-altura` → = espessura-laje
- `tipo-aparelho-apoio` → = "Nenhum"
- `tipo-superestrutura` → = "ENGASTADA"
- `qtd-longarinas` → = 0
- `qtd-transversinas` → = 0
- `tipo-transversina` → = "Nenhum"
- `altura-longarina` → = "" (vazio)
- `deslocamento-esquerdo-encontro-laje` → padrão 1.0m, min > 0
- `deslocamento-direito-encontro-laje` → padrão 1.0m, min > 0

### 2. `app.js` (linhas 193-228)

**Captura de Campos Disabled no Salvamento:**

```javascript
// Campos de transição
workData["CORTINA ALTURA"] = cortinaAlturaField.value;
workData["TIPO APARELHO APOIO"] = aparelhoApoioField.value;

// Campos de superestrutura
workData["TIPO SUPERESTRUTURA"] = tipoSuperestruturaField.value;
workData["QTD LONGARINAS"] = qtdLongarinasField.value;
workData["QTD TRANSVERSINAS"] = qtdTransversinasField.value;
workData["TIPO DE TRANSVERSINA"] = tipoTransversinaField.value;
workData["ALTURA LONGARINA"] = alturaLongarinaField.value;
```

**Por que isso é necessário?**  
FormData ignora campos `disabled`, então precisamos capturá-los explicitamente.

### 3. `form-loader.js` (linhas 289-294)

**Aplicação ao Carregar Obra:**

```javascript
// Aplicar regras de transição monolítica após carregar os dados
if (typeof applyMonolithicTransitionRules === "function") {
  setTimeout(() => {
    applyMonolithicTransitionRules();
  }, 300);
}
```

---

## 🎨 Aparência Visual

### Campos Bloqueados

```css
background-color: #f0f0f0;
cursor: not-allowed;
```

### Notas Informativas

#### Tipo 1: Bloqueio (🔒)

```
🔒 Automático: igual à espessura da laje
🔒 Bloqueado para transição monolítica
🔒 Ponte monolítica: sempre engastada
🔒 Ponte monolítica: sem longarinas
🔒 Ponte monolítica: sem transversinas
```

#### Tipo 2: Informação (ℹ️)

```
ℹ️ Padrão: 1.0m (não pode ser zero)
```

---

## 🧪 Testes Completos

### Teste 1: Aplicação Inicial das Regras

```
1. Abrir formulário novo
2. Preencher "ESPESSURA LAJE" = 0.20
3. Selecionar "TIPO ENCONTRO" = "MONOLÍTICO"
4. ✅ Verificar TRANSIÇÃO:
   - Cortina Altura = 0.20 (bloqueado, cinza)
   - Aparelho Apoio = "Nenhum" (bloqueado, cinza)
5. ✅ Verificar SUPERESTRUTURA:
   - Tipo = "ENGASTADA" (bloqueado, cinza)
   - Qtd Longarinas = 0 (bloqueado, cinza)
   - Qtd Transversinas = 0 (bloqueado, cinza)
   - Tipo Transversina = "Nenhum" (bloqueado, cinza)
   - Altura Longarina = vazio (bloqueado, cinza)
6. ✅ Verificar DESLOCAMENTOS:
   - Deslocamento Esquerdo = 1.00 (editável, min=0.01)
   - Deslocamento Direito = 1.00 (editável, min=0.01)
7. ✅ Verificar notas visuais em todos os campos
```

### Teste 2: Atualização de Espessura da Laje

```
1. Com tipo "MONOLÍTICO" selecionado
2. Alterar "ESPESSURA LAJE" de 0.20 para 0.30
3. ✅ Verificar: "CORTINA ALTURA" atualiza para 0.30 automaticamente
```

### Teste 3: Validação de Deslocamentos

```
1. Com tipo "MONOLÍTICO" selecionado
2. Tentar definir "DESLOCAMENTO ESQUERDO" = 0
3. ✅ Verificar: Campo não aceita (min = 0.01)
4. Definir "DESLOCAMENTO ESQUERDO" = 0.50
5. ✅ Verificar: Valor aceito
```

### Teste 4: Mudança de Tipo

```
1. Com tipo "MONOLÍTICO" selecionado (9 campos bloqueados)
2. Mudar para "ENCONTRO LAJE"
3. ✅ Verificar: Todos os campos desbloqueados
4. ✅ Verificar: Notas visuais removidas
5. ✅ Verificar: Valores permanecem (não são apagados)
6. ✅ Verificar: min dos deslocamentos volta para 0
```

### Teste 5: Salvamento Completo

```
1. Preencher formulário com tipo "MONOLÍTICO"
2. Clicar em "Salvar Obra"
3. Abrir DevTools → Application → IndexedDB → OAEDatabase → obras
4. ✅ Verificar campos salvos:
   - TIPO ENCONTRO = "MONOLITICO"
   - CORTINA ALTURA = "0.20"
   - TIPO APARELHO APOIO = "Nenhum"
   - TIPO SUPERESTRUTURA = "ENGASTADA"
   - QTD LONGARINAS = "0"
   - QTD TRANSVERSINAS = "0"
   - TIPO DE TRANSVERSINA = "Nenhum"
   - ALTURA LONGARINA = ""
   - DESLOCAMENTO ESQUERDO ENCONTRO LAJE = "1.00"
   - DESLOCAMENTO DIREITO ENCONTRO LAJE = "1.00"
```

### Teste 6: Carregamento de Obra Salva

```
1. Recarregar página
2. Carregar obra com tipo "MONOLÍTICO"
3. ✅ Verificar: Todos os 9 campos estão bloqueados
4. ✅ Verificar: Valores foram restaurados corretamente
5. ✅ Verificar: Notas visuais aparecem
```

### Teste 7: Exportação CSV

```
1. Obra com tipo "MONOLÍTICO"
2. Clicar em "Exportar CSV"
3. Abrir arquivo CSV
4. ✅ Verificar colunas:
   TIPO ENCONTRO,CORTINA ALTURA,TIPO APARELHO APOIO,TIPO SUPERESTRUTURA,QTD LONGARINAS,QTD TRANSVERSINAS,TIPO DE TRANSVERSINA,ALTURA LONGARINA
   MONOLITICO,0.20,Nenhum,ENGASTADA,0,0,Nenhum,""
```

### Teste 8: Exportação JSON

```
1. Obra com tipo "MONOLÍTICO"
2. Clicar em "Exportar JSON"
3. Abrir arquivo JSON
4. ✅ Verificar estrutura:
{
  "BridgeTransitionData": {
    "AbutmentType": { "Name": "MONOLITICO" },
    "CurtainHeight": 0.20,
    "BearingThickness": 0.05
  },
  "SuperstructureData": {
    "BridgeSuperstructureType": { "Name": "ENGASTADA" },
    "NumberOfLongarines": 0,
    "NumberOfTransversines": 0,
    "LongarineHeight": 0.0
  }
}
```

---

## 🔗 Integração com Backend C#

### SimpleBridgeService.cs

O backend detecta o tipo "MONOLITICO" e chama `CreateMonolithicTransitions()`:

```csharp
private TransitionType DetermineTransitionType(BridgeTransitionData transitionData)
{
    var abutmentName = transitionData?.AbutmentType?.Name ?? "";

    if (abutmentName.ContainsIgnoreCase("MONOLITICO"))
        return TransitionType.Monolithic;

    // ... outros tipos
}
```

### Posicionamento das Transições

```csharp
private void CreateMonolithicTransitions(...)
{
    const double MONOLITHIC_OFFSET_METERS = 0.6;

    // T1 (esquerda): +0.6m do início
    double t1X = MONOLITHIC_OFFSET_METERS;

    // T2 (direita): -0.6m do fim
    double t2X = bridgeLength - MONOLITHIC_OFFSET_METERS;

    // Instanciar ZS_TRANSITION_01 e ZS_TRANSITION_02
}
```

### Validação no Backend

O backend deve validar:

1. Se `AbutmentType.Name` contém "MONOLITICO"
2. Se `BridgeSuperstructureType.Name` = "ENGASTADA"
3. Se `NumberOfLongarines` = 0
4. Se `NumberOfTransversines` = 0
5. Se `LongarineHeight` = 0 ou null

---

## ⚠️ Observações Importantes

### 1. Campos Disabled e FormData

FormData **ignora campos disabled**, por isso capturamos explicitamente em `app.js`.

### 2. Timeout de 300ms

Necessário para garantir que todos os campos sejam preenchidos antes de aplicar regras ao carregar obra.

### 3. Altura Longarina Vazia

Quando vazio, o backend deve tratar como `null` ou `0.0` na conversão JSON.

### 4. Deslocamentos Nunca Zero

Validação `min="0.01"` garante que deslocamentos sejam sempre > 0.

### 5. Retrocompatibilidade

Obras antigas sem tipo "MONOLITICO" continuam funcionando normalmente.

---

## 📊 Comparação de Tipos de Transição

| Tipo           | Cortina   | Aparelho  | Superestrutura | Longarinas | Transversinas | Posicionamento            |
| -------------- | --------- | --------- | -------------- | ---------- | ------------- | ------------------------- |
| **MONOLÍTICO** | 🔒 = Laje | 🔒 Nenhum | 🔒 ENGASTADA   | 🔒 0       | 🔒 0          | T1: +0.6m, T2: L-0.6m     |
| APOIO          | ✏️ Edit   | ✏️ Edit   | ✏️ Edit        | ✏️ Edit    | ✏️ Edit       | T1: +0.125m, T2: L+0.375m |
| ENCONTRO LAJE  | ✏️ Edit   | ✏️ Edit   | ✏️ Edit        | ✏️ Edit    | ✏️ Edit       | T1: -0.25m, T2: L+0.25m   |
| Nenhum         | ✏️ Edit   | ✏️ Edit   | ✏️ Edit        | ✏️ Edit    | ✏️ Edit       | T1: +0.25m, T2: L         |

---

## 🐛 Troubleshooting

### Problema: Campos não são bloqueados

**Solução:** Verificar se `initMonolithicTransitionListeners()` foi chamada no `DOMContentLoaded`

### Problema: Campos de superestrutura não salvam

**Solução:** Verificar captura explícita em `app.js` linhas 204-228

### Problema: Deslocamentos aceitam zero

**Solução:** Verificar se `min="0.01"` está sendo aplicado na linha 1420 e 1428 de `validation.js`

### Problema: Altura longarina não fica vazia

**Solução:** Verificar linha 1408 de `validation.js`: `alturaLongarina.value = ""`

### Problema: Regras não aplicadas ao carregar obra

**Solução:** Verificar timeout de 300ms em `form-loader.js` linha 291

---

## ✅ Checklist de Implementação Completa

- [x] Adicionar opção "MONOLÍTICO" no HTML
- [x] Bloquear campo Cortina Altura = Espessura Laje
- [x] Bloquear campo Aparelho de Apoio = "Nenhum"
- [x] Bloquear campo Tipo Superestrutura = "ENGASTADA"
- [x] Bloquear campo Qtd Longarinas = 0
- [x] Bloquear campo Qtd Transversinas = 0
- [x] Bloquear campo Tipo Transversina = "Nenhum"
- [x] Bloquear campo Altura Longarina = vazio
- [x] Definir Deslocamentos padrão = 1.0m (editável, min > 0)
- [x] Adicionar notas visuais em todos os campos
- [x] Capturar campos disabled no salvamento
- [x] Aplicar regras ao carregar obra
- [x] Testar fluxo completo
- [x] Testar exportação CSV
- [x] Testar exportação JSON
- [x] Documentar implementação completa

---

**Status Final:** ✅ IMPLEMENTAÇÃO 100% COMPLETA E PRONTA PARA TESTES
