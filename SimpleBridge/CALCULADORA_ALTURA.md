# 🧮 CALCULADORA DE ALTURA - Manual de Uso

## 📋 O QUE É?

A **Calculadora de Altura** é uma ferramenta interativa que ajuda você a calcular corretamente as alturas dos apoios da ponte baseado na fórmula:

```
ALTURA TOTAL = ALTURA LONGARINA + ALTURA DO MAIOR APOIO
```

---

## 🎯 QUANDO USAR?

Use a calculadora quando:
- ✅ Você não tem certeza de qual altura colocar nos apoios
- ✅ Está recebendo erro de validação de altura
- ✅ Quer ajustar rapidamente as alturas para bater com o total
- ✅ Precisa encontrar qual é o maior apoio

---

## 🚀 COMO ABRIR A CALCULADORA?

### **Opção 1: Botão ao lado do campo ALTURA**
1. Vá para a aba **"CONFIGURAÇÃO"**
2. Ao lado do campo **ALTURA**, clique no botão **"🧮 Calculadora"**

### **Opção 2: Quando aparecer erro de validação**
1. Se a soma não bater, aparecerá uma mensagem de erro
2. Na mensagem de erro, clique em **"Abrir Calculadora"**

---

## 📖 COMO USAR A CALCULADORA?

### **Tela da Calculadora:**

```
┌─────────────────────────────────────────┐
│  🧮 Calculadora de Alturas          ✖   │
├─────────────────────────────────────────┤
│  Regra: ALTURA TOTAL = LONGARINA +      │
│         MAIOR APOIO                      │
├─────────────────────────────────────────┤
│  Altura Total:      [5.50] m            │
│  Altura Longarina:  [1.00] m            │
├─────────────────────────────────────────┤
│  Alturas dos Apoios:                    │
│                                          │
│  APOIO 1:  [3.00] m  Soma: 4.00m        │
│  APOIO 2:  [4.50] m  Soma: 5.50m ✓ 👑  │
│  APOIO 3:  [3.80] m  Soma: 4.80m        │
├─────────────────────────────────────────┤
│              [✅ Aplicar]  [Cancelar]   │
└─────────────────────────────────────────┘
```

---

## 🎨 ENTENDENDO AS CORES E SÍMBOLOS:

### **Verde ✓**
- **Significa:** Este apoio + longarina = altura total (CORRETO!)
- **Ação:** Pode usar este valor

### **Vermelho**
- **Significa:** Soma está MAIOR que a altura total
- **Ação:** Diminua o valor do apoio

### **Azul**
- **Significa:** Soma está MENOR que a altura total
- **Ação:** Aumente o valor do apoio

### **👑 MAIOR**
- **Significa:** Este é o maior apoio entre todos
- **Destaque:** Borda laranja e negrito
- **Importante:** Este valor será usado para calcular a altura total

### **Borda do Modal:**
- **Verde:** Pelo menos um apoio está correto ✅
- **Vermelha:** Nenhum apoio bate com a altura total ❌

---

## 📝 PASSO A PASSO COMPLETO:

### **Exemplo Prático:**

Você tem uma ponte com:
- **Altura Total:** 5.50m
- **Altura Longarina:** 1.00m
- **3 Apoios**

**Pergunta:** Qual deve ser a altura dos apoios?

### **Solução com a Calculadora:**

1. **Abra a calculadora** clicando no botão 🧮

2. **Verifique os valores:**
   - Altura Total: 5.50m ✅
   - Altura Longarina: 1.00m ✅

3. **Calcule a altura necessária:**
   ```
   Altura do Maior Apoio = 5.50 - 1.00 = 4.50m
   ```

4. **Digite as alturas dos apoios:**
   - APOIO 1: 3.00m → Soma: 4.00m (muito baixo, azul)
   - APOIO 2: 4.50m → Soma: 5.50m ✓ (PERFEITO!, verde)
   - APOIO 3: 3.80m → Soma: 4.80m (muito baixo, azul)

5. **Observe o destaque:**
   - APOIO 2 aparece com 👑 MAIOR (é o maior apoio)
   - APOIO 2 tem ✓ verde (soma está correta!)
   - Modal tem borda verde (há pelo menos um apoio correto)

6. **Clique em "✅ Aplicar Valores"**

7. **Pronto!** Os valores são aplicados automaticamente no formulário

---

## 🔧 FUNCIONALIDADES:

### **Cálculo em Tempo Real:**
- ✅ Valores são recalculados automaticamente ao digitar
- ✅ Cores mudam instantaneamente
- ✅ Maior apoio é identificado automaticamente

### **Aplicação Automática:**
- ✅ Clique em "Aplicar" para preencher todos os campos de uma vez
- ✅ Valores são arredondados para 2 casas decimais
- ✅ Validação é executada automaticamente após aplicar

### **Feedback Visual:**
- ✅ Borda do modal muda de cor (verde/vermelho)
- ✅ Campos ficam com cores diferentes baseado no resultado
- ✅ Maior apoio tem destaque especial

---

## ⚠️ REGRAS IMPORTANTES:

### **1. Pelo menos UM apoio deve bater:**
```
Um dos apoios + longarina DEVE = altura total
```
**Exemplo:**
- Se altura total = 5.50m
- E longarina = 1.00m
- Então pelo menos UM apoio deve ter 4.50m

### **2. O maior apoio é o mais importante:**
```
ALTURA TOTAL = LONGARINA + MAIOR APOIO
```
**Não importa** quantos apoios você tem, o que vale é o MAIOR!

### **3. Tolerância de ±0.01m:**
```
Diferença de até 1cm é aceita
```
Isso evita erros de arredondamento.

---

## 💡 DICAS:

### **Dica 1: Comece pelo maior apoio**
Se você sabe que um apoio é mais alto:
1. Calcule: Altura Total - Altura Longarina
2. Use esse valor no maior apoio
3. Coloque valores menores nos outros apoios

### **Dica 2: Use a calculadora para ajustar**
Se já tem valores aproximados:
1. Digite-os na calculadora
2. Veja qual está mais próximo (cor azul)
3. Ajuste gradualmente até ficar verde

### **Dica 3: Verifique o destaque 👑**
- O apoio com 👑 é o que será usado na validação
- Certifique-se que ele tem o símbolo ✓ verde
- Se não tiver, aumente esse apoio

---

## 🎯 CASOS DE USO:

### **Caso 1: Todos os apoios iguais**
```
Ponte com 3 apoios de mesma altura
```
**Solução:**
- Calcule: Altura necessária = Total - Longarina
- Digite o mesmo valor nos 3 apoios
- Todos ficarão verdes ✓

### **Caso 2: Apoios diferentes**
```
Ponte em terreno irregular
```
**Solução:**
- Identifique qual é o maior (👑)
- Ajuste o maior para ter ✓ verde
- Outros podem ter valores menores

### **Caso 3: Não sei as alturas**
```
Começando do zero
```
**Solução:**
1. Abra a calculadora
2. Digite altura total e longarina
3. No apoio 1, digite: Total - Longarina
4. Veja aparecer o ✓ verde
5. Ajuste outros conforme necessário
6. Aplique valores

---

## ❌ ERROS COMUNS:

### **Erro 1: Nenhum apoio bate**
**Sintoma:** Modal com borda vermelha, nenhum ✓ verde

**Solução:**
- Encontre o apoio com 👑 MAIOR
- Ajuste-o para: Total - Longarina
- Deve aparecer ✓ verde

### **Erro 2: Soma muito alta**
**Sintoma:** Campos em vermelho

**Solução:**
- Reduza os valores dos apoios
- Especialmente o maior (👑)

### **Erro 3: Soma muito baixa**
**Sintoma:** Campos em azul

**Solução:**
- Aumente os valores dos apoios
- Especialmente o maior (👑)

---

## 🔍 EXEMPLO DETALHADO:

### **Cenário:**
```
Ponte de 3 tramos (portanto 2 apoios)
Altura Total: 6.00m
Altura Longarina: 1.20m
```

### **Cálculo Manual:**
```
Altura do maior apoio = 6.00 - 1.20 = 4.80m
```

### **Na Calculadora:**

**Passo 1:** Abrir calculadora
- Altura Total: 6.00m (já preenchido)
- Longarina: 1.20m (já preenchido)

**Passo 2:** Analisar apoios
- APOIO 1: 0.00m → Soma: 1.20m (vermelho, muito baixo)
- APOIO 2: 0.00m → Soma: 1.20m (vermelho, muito baixo)

**Passo 3:** Ajustar valores
- APOIO 1: 4.00m → Soma: 5.20m (azul, falta 0.80m)
- APOIO 2: 4.80m → Soma: 6.00m ✓ 👑 (verde, perfeito!)

**Passo 4:** Aplicar
- Clique em "✅ Aplicar Valores"
- Valores salvos no formulário
- Validação passa com sucesso! ✅

---

## 📊 RESUMO:

| Item | O que fazer |
|------|-------------|
| **Abrir** | Clicar no botão 🧮 Calculadora |
| **Verde ✓** | Valor correto, pode usar |
| **Vermelho** | Diminuir o valor |
| **Azul** | Aumentar o valor |
| **👑 MAIOR** | Apoio mais importante |
| **Borda verde** | Pelo menos um apoio correto |
| **Aplicar** | Salvar valores no formulário |

---

## 🎓 FÓRMULA COMPLETA:

```javascript
ALTURA TOTAL = ALTURA LONGARINA + max(ALTURA APOIO 1, ALTURA APOIO 2, ..., ALTURA APOIO N)

Onde:
- max() = função que retorna o MAIOR valor
- N = número de apoios (sempre = número de tramos - 1)
```

**Exemplo com 3 apoios:**
```
Apoios: 3.0m, 4.5m, 3.8m
Maior = 4.5m
Longarina = 1.0m
Altura Total = 1.0 + 4.5 = 5.5m
```

---

## ✅ CHECKLIST DE USO:

Antes de aplicar os valores, verifique:

- [ ] Pelo menos um apoio tem ✓ verde?
- [ ] O apoio com 👑 está correto?
- [ ] Borda do modal está verde?
- [ ] Valores fazem sentido para sua ponte?
- [ ] Nenhum campo em vermelho?

Se todas as respostas forem SIM, pode aplicar! ✅

---

## 🆘 PRECISA DE AJUDA?

Se a calculadora não está funcionando:
1. Verifique se configurou a quantidade de tramos
2. Certifique-se que há apoios gerados
3. Recarregue a página (Ctrl + F5)
4. Tente novamente

---

**CALCULADORA COPIADA COM SUCESSO DO SimpleBridgeUI.html!** 🎉
