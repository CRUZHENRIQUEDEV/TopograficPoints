# 📋 VALIDAÇÕES IMPLEMENTADAS - SimpleBridge

## ✅ TODAS AS VALIDAÇÕES DO SimpleBridgeUI.html FORAM MIGRADAS!

---

## 🔢 REGRAS PRINCIPAIS:

### **Tramos e Apoios:**
```
Quantidade Mínima de Tramos = 1
Quantidade de Apoios = Tramos - 1 (se Tramos > 1, senão 0)

Exemplos:
- 1 Tramo → 0 Apoios
- 2 Tramos → 1 Apoio
- 3 Tramos → 2 Apoios
- 5 Tramos → 4 Apoios
```

### **Comprimento dos Tramos:**
- Cada tramo deve ter no mínimo **0.5m**
- A soma de todos os tramos deve ser igual ao **COMPRIMENTO total**

---

## 📝 LISTA COMPLETA DE CAMPOS OBRIGATÓRIOS:

### **🏷️ ABA IDENTIFICAÇÃO:**
| Campo | Tipo | Validação |
|-------|------|-----------|
| LOTE | Texto | Obrigatório |
| CODIGO | Texto | Obrigatório |

---

### **⚙️ ABA CONFIGURAÇÃO:**
| Campo | Tipo | Validação |
|-------|------|-----------|
| COMPRIMENTO | Número | Obrigatório, min: 0 |
| LARGURA | Número | Obrigatório, min: 0 |
| ALTURA | Número | Obrigatório, min: 0 |
| QTD TRAMOS | Número | Obrigatório, min: 1 |
| Tramos (cada) | Número | Min: 0.5m, soma = COMPRIMENTO |
| Apoios (cada) | 3 campos | Altura, Largura, Comprimento obrigatórios |

**Validações Especiais:**
- ✅ Soma dos tramos = Comprimento total
- ✅ Todos os 3 campos de cada apoio devem estar preenchidos

---

### **🔄 ABA TRANSIÇÃO:**
| Campo | Tipo | Validação |
|-------|------|-----------|
| CORTINA ALTURA | Número | Obrigatório, min: 0 |
| TIPO ALA PARALELA | Select | Obrigatório SE encontro = "PAREDE FRONTAL PORTANTE" E não tem ala perpendicular |
| TIPO ALA PERPENDICULAR | Select | Obrigatório SE encontro = "PAREDE FRONTAL PORTANTE" E não tem ala paralela |
| COMPRIMENTO ALA | Número | Obrigatório SE ala paralela OU perpendicular selecionada |
| ESPESSURA ALA | Número | Obrigatório SE ala paralela OU perpendicular selecionada |
| DESLOCAMENTO ESQ ENCONTRO LAJE | Número | Obrigatório SE tipo encontro = "ENCONTRO LAJE" |
| DESLOCAMENTO DIR ENCONTRO LAJE | Número | Obrigatório SE tipo encontro = "ENCONTRO LAJE" |
| COMPRIMENTO ENCONTRO LAJE | Número | Obrigatório SE tipo encontro = "ENCONTRO LAJE" |

**Validações Especiais:**
- ✅ Se encontro = "PAREDE FRONTAL PORTANTE", deve ter pelo menos 1 ala (paralela OU perpendicular)
- ✅ Se ala selecionada, comprimento e espessura são obrigatórios
- ✅ Se encontro = "ENCONTRO LAJE", todos os campos específicos são obrigatórios

---

### **🏗️ ABA SUPERESTRUTURA:**
| Campo | Tipo | Validação |
|-------|------|-----------|
| ALTURA LONGARINA | Número | Obrigatório, min: 0 |
| DESLOCAMENTO ESQUERDO | Número | Obrigatório, min: 0 |
| DESLOCAMENTO DIREITO | Número | Obrigatório, min: 0 |
| QTD LONGARINAS | Número | Obrigatório, min: 0 |
| ESPESSURA LONGARINA | Número | Obrigatório, min: 0 |
| ESPESSURA TRANSVERSINA | Número | Obrigatório SE QTD TRANSVERSINAS > 0 |
| ESPESSURA LAJE | Número | Obrigatório, min: 0 |

**Validações Especiais:**
- ✅ Se existirem transversinas, a espessura é obrigatória

---

### **🔩 ABA APOIO:**
| Campo | Tipo | Validação |
|-------|------|-----------|
| QTD PILARES | Número | Obrigatório, min: 0 |
| LARGURA PILAR | Número | Obrigatório SE QTD PILARES > 0 |
| COMPRIMENTO PILARES | Número | Obrigatório SE QTD PILARES > 0 |
| ALTURA TRAVESSA | Número | Obrigatório SE TIPO TRAVESSA selecionado (diferente de "Nenhum") |
| ALTURA BLOCO SAPATA | Número | Obrigatório SE TIPO BLOCO/SAPATA selecionado (diferente de "Nenhum") |
| LARGURA BLOCO SAPATA | Número | Obrigatório SE TIPO BLOCO/SAPATA selecionado (diferente de "Nenhum") |

**Validações Especiais:**
- ✅ Se há pilares, largura e comprimento são obrigatórios
- ✅ Se há travessa, altura é obrigatória
- ✅ Se há bloco/sapata, altura e largura são obrigatórias

---

### **🛡️ ABA COMPLEMENTARES:**
| Campo | Tipo | Validação |
|-------|------|-----------|
| TIPO PAVIMENTO | Select | Obrigatório |
| PROTEÇÃO LATERAL | Múltipla | Pelo menos 1 tipo em CADA lado |

**Validações Especiais - PROTEÇÃO LATERAL:**
- ✅ **Lado ESQUERDO:** Deve ter pelo menos 1 dos 3:
  - Barreira Esquerda (diferente de "Nenhum")
  - Guarda-rodas Esquerdo (diferente de "Nenhum")
  - Calçada Esquerda (diferente de "Nenhum")

- ✅ **Lado DIREITO:** Deve ter pelo menos 1 dos 3:
  - Barreira Direita (diferente de "Nenhum")
  - Guarda-rodas Direito (diferente de "Nenhum")
  - Calçada Direita (diferente de "Nenhum")

---

## 🎯 COMO AS VALIDAÇÕES FUNCIONAM:

### **1. Validação em Tempo Real:**
- Campos são validados ao sair do campo (evento `blur`)
- Marcação visual com classe `.error` em vermelho
- Mensagens de erro específicas abaixo de cada campo

### **2. Validação ao Salvar:**
- Função `validateForm()` verifica TODOS os campos obrigatórios
- Lista de campos faltantes é apresentada ao usuário
- Sistema muda automaticamente para a aba com erro

### **3. Validações Condicionais:**
- Campos se tornam obrigatórios baseado em outros campos
- Exemplo: Se seleciona "ENCONTRO LAJE", campos específicos tornam-se obrigatórios

### **4. Validações de Soma:**
- Tramos: Soma deve ser igual ao comprimento total
- Tolerância numérica para evitar erros de arredondamento

---

## 📂 ARQUIVOS MODIFICADOS:

### **1. `js/validation.js`**
- ✅ 29 campos obrigatórios configurados
- ✅ Validações condicionais implementadas
- ✅ Função `validateForm()` completa
- ✅ Validação de proteção lateral
- ✅ Validação de ala com encontro

### **2. `js/dynamic-fields.js`**
- ✅ Regra de apoios corrigida: **Apoios = Tramos - 1**
- ✅ Mínimo de 1 tramo garantido
- ✅ Validação automática ao gerar campos

---

## 🧪 COMO TESTAR:

### **Teste 1: Tramos e Apoios**
1. Vá para aba "CONFIGURAÇÃO"
2. Mude QTD TRAMOS para 1 → Deve gerar 0 apoios
3. Mude para 3 → Deve gerar 2 apoios
4. Mude para 5 → Deve gerar 4 apoios
5. ✅ **Confirme: Apoios = Tramos - 1**

### **Teste 2: Validação de Soma**
1. Configure COMPRIMENTO = 10m
2. Configure 2 tramos
3. Digite Tramo 1 = 5m, Tramo 2 = 4m
4. Tente salvar
5. ❌ **Deve dar erro:** Soma (9m) ≠ Comprimento (10m)

### **Teste 3: Validação Condicional**
1. Vá para aba "TRANSIÇÃO"
2. Selecione TIPO ENCONTRO = "ENCONTRO - PAREDE FRONTAL PORTANTE"
3. Tente salvar
4. ❌ **Deve dar erro:** Ala obrigatória
5. Selecione qualquer ala (paralela OU perpendicular)
6. ✅ **Agora deve aceitar**

### **Teste 4: Proteção Lateral**
1. Vá para aba "COMPLEMENTARES"
2. Deixe todos os campos de proteção como "Nenhum"
3. Tente salvar
4. ❌ **Deve dar erro:** Proteção lateral obrigatória em ambos os lados
5. Selecione algo no lado esquerdo E no lado direito
6. ✅ **Agora deve aceitar**

### **Teste 5: Campos Dependentes**
1. Configure QTD PILARES = 0
2. Campos LARGURA PILAR e COMPRIMENTO PILARES não são obrigatórios
3. Configure QTD PILARES = 3
4. ✅ **Agora** LARGURA PILAR e COMPRIMENTO PILARES são obrigatórios

---

## 🎨 FEEDBACK VISUAL:

### **Campos com Erro:**
```css
.error {
  border: 2px solid #e74c3c !important;
  background-color: rgba(231, 76, 60, 0.1) !important;
}
```

### **Mensagens de Erro:**
```css
.error-message.visible {
  display: block;
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
}
```

### **Label Obrigatório:**
```css
label.required::after {
  content: " *";
  color: #e74c3c;
  font-weight: bold;
}
```

---

## ✅ RESUMO:

| Categoria | Quantidade |
|-----------|------------|
| **Campos Obrigatórios** | 29 campos |
| **Validações Condicionais** | 11 validações |
| **Validações Especiais** | 5 validações |
| **Regras de Negócio** | 2 regras |

---

## 🎯 PRÓXIMOS PASSOS SUGERIDOS:

- [ ] Adicionar validação de formato de CODIGO (ex: OAE-XXX)
- [ ] Implementar validação de coordenadas GPS
- [ ] Adicionar máscara para campos numéricos
- [ ] Implementar salvamento automático de rascunho
- [ ] Adicionar indicador de progresso de preenchimento

---

**Todas as validações do SimpleBridgeUI.html foram migradas com sucesso!** ✅
