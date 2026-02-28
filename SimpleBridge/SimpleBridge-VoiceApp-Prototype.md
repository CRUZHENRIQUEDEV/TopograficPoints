# SimpleBridge Voice App — Protótipo Web

## Visão Geral

Protótipo web do assistente de voz para cadastro de OAE (Obras de Arte Especiais), construído como extensão do repositório SimpleBridge existente. Funciona inteiramente no navegador, sem dependências externas além das APIs nativas do Chrome/Edge.

O usuário abre a página, pressiona o microfone e o assistente conduz o preenchimento campo a campo — perguntando, ouvindo, confirmando e avançando automaticamente. Ao final, exporta o mesmo JSON/CSV já compatível com o SimpleBridge.

---

## Localização no Repositório

```
SimpleBridge/
├── index.html                  ← app existente (não modificar)
├── css/                        ← css existente (não modificar)
├── js/                         ← js existente (não modificar)
│
└── voice/                      ← NOVA PASTA — tudo aqui
    ├── index.html              ← entrada do Voice App
    ├── flow/
    │   └── questions.json      ← definição de todos os campos e condicionais
    ├── engine/
    │   └── FlowEngine.js       ← navegação entre perguntas
    ├── voice/
    │   ├── TTSService.js       ← text-to-speech (app fala)
    │   └── STTService.js       ← speech-to-text (usuário fala)
    ├── parsers/
    │   └── AnswerParser.js     ← interpreta respostas (número, seleção, sim/não)
    ├── export/
    │   └── ExportService.js    ← reutiliza bridge-data-converter.js e export.js
    └── css/
        └── voice.css           ← estilos exclusivos do voice app
```

> **Importante:** Os arquivos `../js/bridge-data-converter.js` e `../js/export.js` são importados diretamente via `<script src>`. Nenhuma duplicação de código.

---

## Interface — SessionScreen

### Layout Visual

```
┌─────────────────────────────────────────────────────┐
│  SimpleBridge Voice                          [✕ Sair]│
├─────────────────────────────────────────────────────┤
│                                                     │
│  SEÇÃO ATUAL                                        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░  12 / 38             │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │           Qual o comprimento da obra?         │  │
│  │                  (em metros)                  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  🎙️  Ouvindo...  "vinte e quatro vírgula cinco"│  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│         [🎙️  Falar]      [◀ Voltar]                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│  CAMPOS PREENCHIDOS                                 │
│  ✅ CODIGO          OAE-247                         │
│  ✅ NOME            Ponte sobre Rio Claro           │
│  ✅ UF              SP                              │
│  ✅ RODOVIA         381                             │
│  ✅ KM              142.5                           │
│  ✅ COMPRIMENTO     24.5   ← último confirmado      │
│  ─────────────────────────── ← campo atual abaixo  │
│  ⏳ LARGURA         ...                             │
└─────────────────────────────────────────────────────┘
```

### Comportamento dos Elementos

| Elemento | Descrição |
|---|---|
| **Barra de progresso** | Percentual de campos preenchidos no total da sessão |
| **Card de pergunta** | Exibe a pergunta em destaque + dica de formato |
| **Card de reconhecimento** | Mostra o texto reconhecido em tempo real (interim results) |
| **Botão 🎙️ Falar** | Liga/desliga o microfone. Estado visual: cinza (inativo), vermelho pulsante (ouvindo), verde (confirmado) |
| **Botão ◀ Voltar** | Retrocede ao campo anterior, restaura o valor antigo e relê a pergunta |
| **Lista de campos** | Scroll com todos os campos — preenchidos (✅) e pendentes (⏳) |

---

## Fluxo de Uso — Passo a Passo

```
1. Usuário abre voice/index.html
         │
         ▼
2. HomeScreen: botão "Iniciar Cadastro"
   (opcionalmente: carregar obra existente do IndexedDB)
         │
         ▼
3. SessionScreen carrega
   FlowEngine inicializa com questions.json
   TTSService fala a primeira pergunta
         │
         ▼
4. LOOP por campo:
   ┌─────────────────────────────────────────────────┐
   │  a) TTSService.speak("Qual o código da obra?")  │
   │  b) Usuário pressiona 🎙️ Falar                  │
   │  c) STTService.listen() — reconhece fala        │
   │  d) Texto aparece no card em tempo real         │
   │  e) STTService detecta fim da fala (silêncio)   │
   │  f) AnswerParser.parse(texto, tipoCampo)        │
   │  g) TTSService.speak("Vinte e quatro vírgula    │
   │     cinco metros, correto?")                    │
   │  h) Usuário responde "sim" ou "não"             │
   │     → "sim": salva valor, avança campo          │
   │     → "não": TTSService relê a pergunta         │
   │  i) Campo marcado ✅ na lista lateral           │
   │  j) FlowEngine.next() → aplica condicionais     │
   └─────────────────────────────────────────────────┘
         │
         ▼ (todos os campos obrigatórios preenchidos)
         │
5. Tela de Resumo
   Lista todos os valores preenchidos
   Botões: [Exportar JSON] [Exportar CSV] [Salvar no Banco] [Corrigir]
         │
         ▼
6. ExportService gera arquivo
   Reutiliza convertObraFlatToBridgeData() e exportToJSON() existentes
```

---

## Botão Voltar — Comportamento Detalhado

```
Estado atual: campo "LARGURA" (índice 6)
Histórico:    [..., {campo: "COMPRIMENTO", valor: "24.5"}, {campo: "LARGURA", valor: ""}]

Usuário pressiona ◀ Voltar:

1. FlowEngine.previous()
   → Remove "LARGURA" do histórico de navegação
   → Restaura {campo: "COMPRIMENTO", valor: "24.5"}

2. Campo "COMPRIMENTO" volta a ser o ativo
   → Lista lateral: COMPRIMENTO volta de ✅ para ⏳ (editável)

3. TTSService.speak("Comprimento da obra. Valor atual: vinte e quatro vírgula cinco metros. Deseja manter ou corrigir?")

4. Usuário pode:
   → Dizer "manter" → confirma o valor atual e volta para LARGURA
   → Dizer novo valor → substitui e avança para LARGURA
```

---

## questions.json — Estrutura

Cada campo é um objeto com metadados suficientes para o FlowEngine conduzir a sessão sem lógica hardcoded.

```json
{
  "sections": [
    {
      "id": "info",
      "label": "Informações Gerais",
      "questions": [
        {
          "id": "CODIGO",
          "label": "CODIGO",
          "question": "Qual é o código da obra?",
          "hint": "Por exemplo: OAE 247 ou BR 381 KM 142",
          "confirmTemplate": "Código {value}, correto?",
          "type": "text",
          "required": true,
          "conditions": null
        },
        {
          "id": "COMPRIMENTO",
          "label": "COMPRIMENTO",
          "question": "Qual é o comprimento total da obra?",
          "hint": "Responda em metros. Por exemplo: vinte e quatro vírgula cinco",
          "confirmTemplate": "{value} metros, correto?",
          "type": "number",
          "required": true,
          "conditions": null
        },
        {
          "id": "QTD TRAMOS",
          "label": "QTD TRAMOS",
          "question": "Quantos tramos tem a obra?",
          "hint": "Responda com um número inteiro",
          "confirmTemplate": "{value} tramos, correto?",
          "type": "integer",
          "required": true,
          "conditions": null,
          "onConfirm": "generateTramosQuestions"
        }
      ]
    },
    {
      "id": "transicao",
      "label": "Transição",
      "questions": [
        {
          "id": "TIPO ENCONTRO",
          "label": "TIPO ENCONTRO",
          "question": "Qual é o tipo de encontro?",
          "hint": "Opções: Nenhum, Parede Frontal Portante, Encontro Laje, Monolítico, Apoio",
          "confirmTemplate": "{value}, correto?",
          "type": "select",
          "required": false,
          "options": [
            "Nenhum",
            "ENCONTRO - PAREDE FRONTAL PORTANTE",
            "ENCONTRO LAJE",
            "MONOLITICO",
            "APOIO"
          ],
          "conditions": null
        },
        {
          "id": "DESLOCAMENTO ESQUERDO ENCONTRO LAJE",
          "label": "DESLOCAMENTO ESQUERDO ENCONTRO LAJE",
          "question": "Qual é o deslocamento esquerdo do encontro laje?",
          "hint": "Responda em metros",
          "confirmTemplate": "{value} metros, correto?",
          "type": "number",
          "required": false,
          "conditions": {
            "field": "TIPO ENCONTRO",
            "operator": "equals",
            "value": "ENCONTRO LAJE"
          }
        }
      ]
    }
  ]
}
```

### Tipos de Campo Suportados

| Tipo | Descrição | Exemplo de Fala |
|---|---|---|
| `text` | Texto livre | "OAE dois quarenta e sete" |
| `number` | Número decimal | "vinte e quatro vírgula cinco" |
| `integer` | Número inteiro | "três" |
| `select` | Seleção de opção | "monolítico" / "parede frontal" |
| `boolean` | Sim/Não | "sim" / "não" / "verdadeiro" |
| `date` | Data | "quinze de março de dois mil e vinte e quatro" |

---

## AnswerParser.js — Lógica de Interpretação

```javascript
// Exemplos de interpretação por tipo:

// type: "number"
// entrada: "vinte e quatro vírgula cinco"
// saída:   24.5

// entrada: "vinte e quatro ponto cinco"
// saída:   24.5

// entrada: "24.5"  (usuário digitou no campo)
// saída:   24.5

// type: "select" — fuzzy match nas opções
// entrada: "monolitico" / "monolítica" / "mono"
// opções:  ["Nenhum", "MONOLITICO", "ENCONTRO LAJE", ...]
// saída:   "MONOLITICO"

// type: "boolean"
// entrada: "sim" / "yes" / "correto" / "pode ser" / "isso"
// saída:   true
// entrada: "não" / "errado" / "negativo" / "corrige"
// saída:   false
```

---

## TTSService.js — Configuração

```javascript
// Configuração recomendada para PT-BR
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang    = 'pt-BR';
utterance.rate    = 0.95;   // levemente mais lento que padrão
utterance.pitch   = 1.0;
utterance.volume  = 1.0;

// Voz preferida (quando disponível no sistema)
// Prioridade: Google português → Microsoft → qualquer pt-BR
```

---

## STTService.js — Configuração

```javascript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang           = 'pt-BR';
recognition.continuous     = false;  // para após silêncio
recognition.interimResults = true;   // mostra texto em tempo real
recognition.maxAlternatives = 3;     // pega top 3 alternativas para o parser escolher
```

### Estados do Microfone

| Estado | Visual do Botão | Cor |
|---|---|---|
| Inativo | 🎙️ Falar | Cinza |
| Ouvindo | 🔴 Ouvindo... | Vermelho pulsante |
| Processando | ⏳ Processando | Amarelo |
| Confirmando | ✅ Confirmado | Verde |
| Erro | ⚠️ Tente novamente | Laranja |

---

## FlowEngine.js — Condicionais

O engine avalia condicionais **após cada confirmação** para decidir o próximo campo. Isso replica as regras do SimpleBridge existente:

```javascript
// Exemplos de condicionais implementadas:

// "Encontro Laje" → habilita campos de deslocamento
if (answers["TIPO ENCONTRO"] === "ENCONTRO LAJE") {
  // adiciona à fila: DESLOCAMENTO ESQUERDO ENCONTRO LAJE
  //                  DESLOCAMENTO DIREITO ENCONTRO LAJE
  //                  COMPRIMENTO ENCONTRO LAJE
}

// "QTD LONGARINAS = 1" → seção caixão (pula ESPESSURA LONGARINA)
if (parseInt(answers["QTD LONGARINAS"]) === 1) {
  // força ESPESSURA LONGARINA = "1"
  // não pergunta (campo automático)
}

// "MONOLITICO" → bloqueia campos de superestrutura
if (answers["TIPO ENCONTRO"] === "MONOLITICO") {
  // pula: QTD LONGARINAS, ALTURA LONGARINA, QTD TRANSVERSINAS
  // força: TIPO SUPERESTRUTURA = "ENGASTADA"
}

// "BARREIRA" → exclui GUARDA RODAS
if (answers["TIPO BARREIRA ESQUERDA"] !== "Nenhum") {
  // força GUARDA RODAS ESQUERDO = "Nenhum"
  // não pergunta guarda rodas desse lado
}
```

---

## ExportService.js — Integração com SimpleBridge

O Voice App **não reimplementa** a exportação. Ele importa diretamente:

```html
<!-- No voice/index.html -->
<script src="../js/bridge-data-converter.js"></script>
<script src="../js/export.js"></script>
<script src="../js/constants.js"></script>
```

```javascript
// ExportService.js — apenas orquestra o que já existe
function exportSession(answers) {
  // "answers" é o mesmo formato flat que o IndexedDB já usa
  // { "CODIGO": "OAE-247", "COMPRIMENTO": "24.5", ... }

  // Opção 1: exportar JSON hierárquico
  // Reutiliza convertObraFlatToBridgeData() de bridge-data-converter.js

  // Opção 2: salvar no IndexedDB do SimpleBridge
  // A obra aparece na lista do app principal automaticamente

  // Opção 3: exportar CSV
  // Reutiliza exportToCSV() de export.js
}
```

---

## Compatibilidade de Navegadores

| Navegador | TTS | STT | Status |
|---|---|---|---|
| Chrome 90+ | ✅ | ✅ | **Recomendado** |
| Edge 90+ | ✅ | ✅ | Compatível |
| Firefox | ✅ | ⚠️ Parcial | STT instável |
| Safari 15+ | ✅ | ⚠️ Parcial | STT requer interação prévia |
| Mobile Chrome | ✅ | ✅ | Compatível |

> **Requisito:** HTTPS ou `localhost`. A API de STT é bloqueada em HTTP por questões de segurança.

---

## Estimativa de Implementação

| Etapa | Arquivo(s) | Complexidade |
|---|---|---|
| Estrutura HTML + CSS | `index.html`, `voice.css` | Baixa |
| Mapeamento de perguntas | `questions.json` | Média — requer mapear todos os campos |
| TTS + STT básico | `TTSService.js`, `STTService.js` | Baixa |
| Parser de respostas | `AnswerParser.js` | Média |
| Engine de fluxo + condicionais | `FlowEngine.js` | Alta |
| Botão Voltar + histórico | `FlowEngine.js` | Média |
| Integração com exportação | `ExportService.js` | Baixa (reutilização) |
| Testes e ajustes de UX | — | Média |
| **Total estimado** | | **~5–7 dias** |

---

## Considerações para a IA que Implementar

### O que NÃO recriar
- `bridge-data-converter.js` — importar via `<script src="../js/">`
- `export.js` — importar via `<script src="../js/">`
- `constants.js` — importar via `<script src="../js/">`
- Lógica de IndexedDB — reutilizar `db` global já inicializado pelo app principal (ou reabrir a mesma base `OAEDatabase`)

### Convenções do projeto existente
- Campos salvos com chaves em maiúsculas com espaços: `"QTD TRAMOS"`, `"TIPO ENCONTRO"`
- Valores de checkbox salvos como `"TRUE"` / `"FALSE"` (string)
- Tramos separados por ponto-e-vírgula: `"10;9;11"`
- Apoios separados por ponto-e-vírgula: `"1.45;5.9;1.45"`

### Tratamento de erros de STT
- Se o reconhecimento falhar 2x seguidas → oferecer campo de texto manual como fallback
- Se o usuário disser "não entendi" ou "repete" → TTSService relê a pergunta
- Timeout de 10s sem fala → desativar microfone e aguardar ação do usuário

### Acessibilidade
- Todos os controles devem funcionar também por teclado (fallback sem voz)
- `Space` = acionar microfone
- `Backspace` ou `←` = botão Voltar
- `Enter` = confirmar valor atual
