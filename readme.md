# 🌉 Analisador de Inclinações - Tabuleiros de Ponte

Sistema de análise automática de inclinações transversais e longitudinais para tabuleiros de ponte com detecção automática de zona SIRGAS 2000.

## 📋 Descrição

Este sistema permite analisar dados de levantamento topográfico de pontes para verificar conformidade técnica das inclinações, calculando automaticamente:

- **Inclinações Transversais** (≤ 5,00%): Entre LD e LE no mesmo ponto
- **Inclinações Longitudinais** (≤ 2,50%): Entre mesmo lado em pontos diferentes
- **Detecção automática da zona SIRGAS 2000**
- **Relatórios executivos detalhados**

## 🏗️ Estrutura do Projeto

```
projeto/
├── index.html                    # Página principal
├── css/
│   └── styles.css               # Estilos da aplicação
├── js/
│   ├── config/
│   │   └── constants.js         # Constantes e configurações
│   ├── modules/
│   │   ├── csvParser.js         # Parser de CSV
│   │   ├── coordinateUtils.js   # Utilitários de coordenadas
│   │   ├── calculations.js      # Módulo de cálculos
│   │   ├── visualization.js     # Módulo de visualização
│   │   ├── reporting.js         # Módulo de relatórios
│   │   └── examples.js          # Dados de exemplo
│   └── main.js                  # Controlador principal
└── README.md                    # Esta documentação
```

## 🔧 Módulos e Funcionalidades

### 📄 `constants.js`

- **TECHNICAL_LIMITS**: Limites técnicos (5% transversal, 2.5% longitudinal)
- **ZOOM_CONFIG**: Configurações de zoom e visualização
- **VISUAL_CONFIG**: Cores e configurações visuais
- **COORDINATE_CONFIG**: Configurações de coordenadas e SIRGAS

### 📊 `csvParser.js`

- **CSVParser**: Parse de dados CSV com detecção automática de cabeçalhos
- **PointFinder**: Localização de pontos de estrutura nos dados

### 🗺️ `coordinateUtils.js`

- **CoordinateUtils**: Conversão entre sistemas de coordenadas
- **determineSirgas2000Zone()**: Detecção automática da zona SIRGAS 2000
- **approximateUTMToLongitude()**: Conversão UTM para geográficas

### 🧮 `calculations.js`

- **DistanceCalculator**: Cálculo de distâncias euclidianas e transversais
- **InclinationCalculator**: Cálculo de inclinações com precisão
- **StatusCalculator**: Análise de conformidade técnica
- **ElevationCalculator**: Cálculos relacionados à elevação

### 🎨 `visualization.js`

- **CanvasRenderer**: Renderização gráfica das estruturas
- **Zoom e rotação** interativa
- **Visualização** de elevações por cores
- **Conexões** entre estruturas

### 📑 `reporting.js`

- **ReportGenerator**: Geração de relatórios técnicos detalhados
- **Resumos executivos** com análise de conformidade
- **Seções metodológicas** explicativas

### 🔬 `examples.js`

- **ExampleDataManager**: Gerenciamento de dados de exemplo
- **Validação** de dados CSV
- **Múltiplos exemplos** para teste

### 🎛️ `main.js`

- **AppController**: Controlador principal da aplicação
- **Coordenação** entre todos os módulos
- **Event listeners** e controles de interface

## 🚀 Como Usar

1. **Abrir o arquivo `index.html`** em um navegador web moderno
2. **Colar dados CSV** no campo "CSV 1" ou usar um exemplo
3. **Opcionalmente adicionar** segunda estrutura no "CSV 2"
4. **Clicar "Processar e Analisar"** para gerar o relatório
5. **Usar controles de zoom/rotação** para melhor visualização

## 📋 Formatos CSV Suportados

### Formato UTM

```csv
Ponto,Codigo,Leste,Norte,Elev
P-01,LE INICIO PONTE,187514.122,8954447.811,102.288
P-02,LD INICIO PONTE,187512.661,8954459.014,101.795
P-03,LD FINAL DE PONTE,187493.840,8954456.634,101.843
P-04,LE FINAL DE PONTE,187495.294,8954445.442,102.310
```

### Formato Geográfico

```csv
Name,Code,Lat,Long,H_ORTO
P-01,LE_INICIO_OAE,-9.8975029500,-36.4164419000,197.0962773000
P-02,LD_INICIO_OAE,-9.8974121600,-36.4164865000,197.3135310000
P-03,LE_FINAL_OAE,-9.8975631400,-36.4165642000,197.1041407000
P-04,LD_FINAL_OAE,-9.8974730300,-36.4166092000,197.2531865000
```

## 🎯 Pontos Obrigatórios

O sistema identifica automaticamente pontos com os seguintes padrões:

- `LD_INICIO_OAE` ou `LD INICIO PONTE`
- `LE_INICIO_OAE` ou `LE INICIO PONTE`
- `LD_FINAL_OAE` ou `LD FINAL DE PONTE`
- `LE_FINAL_OAE` ou `LE FINAL DE PONTE`

## 🔍 Funcionalidades Avançadas

### ✅ **Correção da Largura Transversal**

- Calcula largura como distância **transversal pura** (só componente X)
- **Elimina diagonal** para medição estrutural precisa
- Mantém comprimento como **distância real** (3D)

### 🗺️ **Detecção Automática SIRGAS 2000**

- Identifica automaticamente a **zona UTM SIRGAS 2000**
- Suporte para **coordenadas geográficas e UTM**
- Calcula **código EPSG** correspondente

### 📊 **Análise de Conformidade**

- Verifica limites técnicos: **5% transversal, 2.5% longitudinal**
- Status visual: ✅ Conforme, ⚠️ Próximo ao limite, 🚨 Acima do limite
- **Relatórios executivos** com recomendações

### 🎨 **Visualização Interativa**

- **Zoom** de 10% até 10000%
- **Rotação** em incrementos de 22.5°
- **Cores** baseadas na elevação relativa
- **Conexão** visual entre estruturas

## 🔧 Configurações Técnicas

### Limites de Inclinação

```javascript
const TECHNICAL_LIMITS = {
  TRANSVERSAL: 5.0, // 5%
  LONGITUDINAL: 2.5, // 2.5%
};
```

### Zoom e Visualização

```javascript
const ZOOM_CONFIG = {
  DEFAULT: 2.0, // 200%
  MIN: 0.1, // 10%
  MAX: 100.0, // 10000%
  STEP: 1.2, // Incremento
};
```

## 🐛 Debug e Desenvolvimento

### Ativar Debug

```javascript
const DEBUG_CONFIG = {
  ENABLED: true,
  MAX_LOG_LINES: 1000,
};
```

### Funções de Debug Disponíveis

- `debugLog(message)`: Log personalizado
- `AppController.toggleDebug()`: Alternar painel debug
- `AppController.getSystemInfo()`: Informações do sistema

## 📱 Compatibilidade

- **Navegadores modernos** com suporte a HTML5 Canvas
- **Design responsivo** para diferentes tamanhos de tela
- **Controles de teclado**: Ctrl + (+/-/0) para zoom

## 🔄 Melhorias Implementadas

### v2.0.0 - Versão Modular

- ✅ **Código totalmente reorganizado** em módulos
- ✅ **Correção da largura transversal** (sem diagonal)
- ✅ **Melhoria na detecção SIRGAS 2000**
- ✅ **Relatórios mais detalhados**
- ✅ **Sistema de debug avançado**
- ✅ **Validação em tempo real** de CSV
- ✅ **Event listeners** para controles de teclado

## 📝 Notas Técnicas

### Metodologia de Cálculo

- **Transversal**: Usa `calculateTransversalWidth()` - apenas componente X
- **Longitudinal**: Usa `calculateDistance()` - distância euclidiana real
- **Elevações**: Diferença absoluta entre pontos
- **Inclinações**: `(desnível / distância) × 100`

### Sistema de Coordenadas

- **Automático**: Detecta UTM, geográfico ou plano
- **SIRGAS 2000**: Cálculo automático da zona (17-25)
- **Conversões**: Suporte para múltiplos formatos

## 📄 Licença

Este projeto é de **propriedade exclusiva da ZenithSolutions**.

**© 2025 ZenithSolutions - Todos os direitos reservados.**

É proibida qualquer reprodução, distribuição ou modificação sem autorização expressa.
