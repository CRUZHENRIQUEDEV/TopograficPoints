# SimpleBridge - Sistema de Cadastro de OAE

Sistema modularizado para cadastro e gerenciamento de Obras de Arte Especiais (pontes).

## 📁 Estrutura do Projeto

```
SimpleBridge/
├── index.html                   # Arquivo HTML principal (limpo, sem CSS/JS inline)
├── SimpleBridgeUI.html          # Arquivo original (backup)
├── SimpleBridgeUI.BACKUP.html   # Backup automático
├── README.md                    # Este arquivo
│
├── css/                         # Arquivos CSS modularizados
│   ├── variables.css            # Variáveis CSS (cores, espaçamentos, etc)
│   ├── base.css                 # Estilos base (layout, abas, containers)
│   ├── forms.css                # Estilos de formulários (inputs, botões)
│   └── modals.css               # Estilos de modais e notificações
│
└── js/                          # Arquivos JavaScript modularizados
    ├── utils.js                 # Funções utilitárias gerais
    ├── validation.js            # Validações de formulário
    ├── dynamic-fields.js        # Geração de campos dinâmicos (tramos/apoios)
    ├── modals.js                # Gerenciamento de modais
    ├── export.js                # Exportação/Importação (CSV/JSON)
    └── app.js                   # Inicialização e lógica principal
```

## 🚀 Funcionalidades Principais

### ✅ Gerenciamento de Obras
- **Criar** novas obras
- **Editar** obras existentes
- **Excluir** obras
- **Filtrar** por código ou lote
- **Salvar** automaticamente no IndexedDB (banco local do navegador)

### 📊 Importação/Exportação
- **Importar CSV**: Importar múltiplas obras de um arquivo CSV
- **Exportar CSV Individual**: Exportar obra atual para CSV
- **Exportar CSV Completo**: Exportar todas as obras em um único arquivo
- **Exportar JSON**: Exportar todas as obras em formato JSON estruturado

### 📝 Formulário Organizado por Abas
1. **Informações**: Dados gerais da obra (código, lote, localização)
2. **Configurações**: Dimensões gerais (comprimento, largura, altura, tramos)
3. **Transição**: Elementos de transição (cortina, alas, encontro)
4. **Superestrutura**: Laje, longarinas, transversinas
5. **Mesoestrutura**: Apoios e pilares
6. **Complementar**: Pavimento, barreiras, calçadas

### ✓ Validações Inteligentes
- Campos obrigatórios destacados
- Validação de proteção lateral obrigatória em ambos os lados
- Validação de relação entre encontro e alas
- Validação de comprimentos de tramos
- Mensagens de erro contextuais

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilização modular com variáveis CSS
- **JavaScript Vanilla**: Lógica sem dependências externas
- **IndexedDB**: Armazenamento local persistente

## 📖 Como Usar

### Primeira Utilização
1. Abra o arquivo `index.html` em um navegador moderno (Chrome, Firefox, Edge)
2. O sistema criará automaticamente o banco de dados local IndexedDB
3. Clique em "+ Nova Obra" para começar a cadastrar

### Criar uma Nova Obra
1. Clique no botão **+ Nova Obra**
2. Preencha os campos obrigatórios (marcados com *)
3. Navegue pelas abas para preencher todos os dados
4. Clique em **Salvar Obra**
5. Revise o resumo e confirme

### Importar Obras de CSV
1. Prepare um arquivo CSV com as colunas corretas
2. Clique em **Importar Obras**
3. Selecione o arquivo CSV
4. Confirme a importação

### Exportar Obras
- **CSV Individual**: Preencha o formulário e clique em "Exportar CSV"
- **CSV Completo**: Clique em "Exportar CSV" no painel lateral
- **JSON**: Clique em "Exportar JSON" no painel lateral

## 🎨 Personalização

### Alterar Cores
Edite o arquivo `css/variables.css` para modificar:
- Cores primárias
- Cores de erro/sucesso
- Espaçamentos
- Sombras e bordas

### Adicionar Novos Campos
1. Adicione o campo HTML no `index.html`
2. Configure validação em `js/validation.js` se necessário
3. Atualize a função `getCsvColumns()` em `js/utils.js` se for exportável

## 🐛 Resolução de Problemas

### Obras não carregam
- Verifique se o navegador suporta IndexedDB
- Limpe o cache do navegador
- Verifique o console do navegador (F12) para erros

### Importação CSV falha
- Verifique se o arquivo tem o cabeçalho "CODIGO"
- Certifique-se de que o separador está correto (vírgula, ponto-e-vírgula ou tab)
- Verifique se não há caracteres especiais quebrados

### Exportação não funciona
- Verifique se há obras cadastradas
- Confirme que todos os campos obrigatórios estão preenchidos
- Verifique permissões de download do navegador

## 📋 Requisitos de CSV para Importação

O arquivo CSV deve conter no mínimo a coluna:
- **CODIGO** (obrigatório)

Colunas recomendadas:
```
CODIGO,LOTE,COMPRIMENTO,LARGURA,ALTURA,QTD TRAMOS,COMPRIMENTO TRAMOS,...
```

Para múltiplos tramos/apoios, use ponto-e-vírgula (;) como separador:
```
COMPRIMENTO TRAMOS: "10.5;12.0;9.5"
ALTURA APOIO: "1.5;3.2;3.2;1.5"
```

## 🔒 Segurança e Privacidade

- Todos os dados são armazenados **localmente** no navegador
- Nenhum dado é enviado para servidores externos
- O banco de dados pode ser limpo a qualquer momento
- Exporte regularmente seus dados como backup

## 📞 Suporte

Para bugs ou sugestões, verifique:
1. Console do navegador (F12) para mensagens de erro
2. Versão do navegador (recomendado: última versão)
3. Verifique se JavaScript está habilitado

## 📝 Notas de Versão

### Versão 2.0 (Refatoração Modular)
- ✅ Separação completa de HTML, CSS e JavaScript
- ✅ CSS organizado em 4 arquivos temáticos
- ✅ JavaScript modularizado em 6 arquivos funcionais
- ✅ Estrutura de pastas organizada (css/ e js/)
- ✅ Mantidas todas as funcionalidades originais
- ✅ Melhor manutenibilidade e extensibilidade
- ✅ Código mais limpo e reutilizável

### Versão 1.0 (Original)
- Sistema monolítico em um único arquivo HTML
- Todas as funcionalidades básicas implementadas

## 🎯 Próximos Passos Sugeridos

- [ ] Adicionar testes automatizados
- [ ] Implementar sistema de backup automático
- [ ] Criar modo escuro
- [ ] Adicionar gráficos e relatórios
- [ ] Implementar sincronização em nuvem (opcional)
- [ ] Adicionar histórico de alterações
- [ ] Melhorar responsividade mobile

---

**SimpleBridge** - Sistema de Cadastro de OAE v2.0  
Refatorado com boas práticas de programação
