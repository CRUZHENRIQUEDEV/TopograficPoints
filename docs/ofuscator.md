Plano de ação: Ofuscação e proteção de código cliente

1. Objetivo

- Impedir uso simples do código ao baixar/clonar as páginas.
- Garantir que a aplicação funcione apenas quando publicada sob o domínio/usuário correto.
- Em cenários não permitidos, exibir tela em branco (comportamento similar a SPA quebrada).
- Ofuscar o JavaScript com obfuscador e aplicar contramedidas adicionais.

2. Premissas e limites

- Proteção 100% no front-end não existe; o objetivo é elevar o custo de engenharia reversa.
- O plano não inclui backend; as checagens dependem do ambiente de publicação (GitHub Pages).
- Não inserir segredos sensíveis no cliente.

3. Estratégia geral

- Ofuscar o bundle JavaScript no build.
- Verificar o ambiente de execução (origin/host/protocolo) e bloquear fora dos domínios autorizados.
- Incluir verificações redundantes (anti-tamper/anti-debug) para dificultar remoção.
- Opcional: gate de inicialização que depende de artefato remoto de mesma origem (ex.: /ping.json).

4. Domínios/ambientes permitidos (ajustar conforme publicação)

- Produção (GitHub Pages usuário): https://cruzhenriquedev.github.io/
- Produção (repositório pages): https://cruzhenriquedev.github.io/<nome-do-repo>/

5. Checagens de execução (antes de montar a SPA)

- Bloquear se:
  - location.protocol !== "https:".
  - location.origin não estiver em lista de permitidos.
  - for file:// (indica página salva/local).
- Em bloqueio: **não executar o script principal** mas manter UI visível.
- O objetivo é que a página pareça "quebrada" ou com bug natural, não que pareça intencionalmente bloqueada.
- O usuário que baixou deve achar que simplesmente "não funciona", sem saber que é proposital.
- Repetir checagem em pontos críticos (bootstrap, antes do router, após hydration).

6. Ofuscação de JavaScript (build)

- Usar JavaScript Obfuscator em pipeline de build.
- Recomendações de opções:
  - compact: true
  - controlFlowFlattening: true (dosar para evitar aumento excessivo)
  - deadCodeInjection: true (com threshold baixo)
  - stringArray: true, stringArrayRotate: true
  - stringArrayEncoding: ["rc4"]
  - renameGlobals: true (cuidado com variáveis globais necessárias)
  - selfDefending: true (pode quebrar formatação; validar pós-build)
  - debugProtection: true, debugProtectionInterval: true
  - splitStrings: true (definir chunkSize)
- Integrar via:
  - Webpack: javascript-obfuscator/esbuild/rollup plugin conforme bundler existente.
  - Sem bundler: executar CLI do obfuscator sobre o JS final (atenção a mapas de fonte).
- Desabilitar sourcemaps em produção.

7. Anti-tamper e anti-debug

- Inserir verificações:
  - Detecção de devtools abertas (debugProtection do obfuscator).
  - Verificação de integridade simples: hash embutido do bundle principal comparado em runtime.
  - Checagem de invariantes (ex.: funções críticas com assinaturas verificadas).
- Empacotar múltiplas checagens ao longo do código para tornar remoção não trivial.

8. Gate de rede opcional

- No bootstrap, efetuar fetch de /ping.json (mesma origem). Se falhar ou conter valor inesperado, não inicializar.
- Publicar ping.json apenas no domínio permitido; ao salvar a página, a ausência/valor inválido bloqueia.
- Atenção: não infalível; é uma camada adicional que dificulta o uso offline.

9. SPA: fallback de tela branca

- Implementar função initialize() que só monta a aplicação se as checagens passarem.
- Em falha: **retornar silenciosamente sem executar a lógica**, mantendo a UI visível.
- **Importante:** A página deve parecer com um bug natural ("não funciona") em vez de aparecer intencionalmente bloqueada.
- Não lançar erros no console (`throw new Error()`) para não alertar o usuário que baixou a página.
- Evitar mensagens de erro no console em produção.

10. Pipeline sugerido (exemplo genérico)

- build: gera bundle (ex.: dist/app.js).
- obfuscate: roda obfuscator em dist/app.js → dist/app.obf.js.
- replace: referenciar app.obf.js no HTML de produção.
- validate: rodar smoke test em ambiente real (GitHub Pages).

11. Outras medidas complementares

- Minificar/otimizar HTML/CSS, remover comentários e atributos úteis à engenharia reversa.
- Watermark visual dinâmica (CSS/Canvas) vinculada ao origin.
- CSP estrita bloqueando execução inline/externa fora da origem esperada.
- Service Worker opcional que falha quando a origem não é permitida.
- Licença/termos de uso e aviso legal no site.

12. Checklist de implementação

- [ ] Listar domínios permitidos e centralizar em um módulo.
- [ ] Implementar checagem de ambiente e bloqueio com tela branca.
- [ ] Integrar obfuscator ao build com opções acima e sem sourcemaps.
- [ ] Adicionar anti-tamper/anti-debug e testes de robustez.
- [ ] (Opcional) Gate via /ping.json e CSP restritiva.
- [ ] Publicar em GitHub Pages e validar comportamento “salvar página”.

13. Validação esperada

- A página funciona normalmente nos domínios permitidos.
- Ao abrir o arquivo salvo (file://) ou em domínio não permitido, exibe branco.
- Código final ofuscado, difícil de ler e alterar.

14. Limitações e observações

- Qualquer proteção client-side pode ser contornada por agentes especializados.
- Evite depender de chaves/segredos no cliente.
- Revalide periodicamente as opções do obfuscator para evitar quebras.

15. Prompt operacional (copiar e colar para processar página a página)

- Contexto/Objetivo:
  - Aplique esta política de proteção sem alterar a experiência do usuário em GitHub Pages.
  - Se a página for aberta via file:// ou em domínio não autorizado, a aplicação não deve inicializar e a tela deve permanecer em branco.

- Entradas que vou fornecer:
  - Conteúdo da página alvo (HTML completo e, se houver, JS associado).
  - Lista de origins permitidos (ex.: https://cruzhenriquedev.github.io/ e https://cruzhenriquedev.github.io/<nome-do-repo>/).
  - Preferência sobre JS externo: separar JS do HTML? (sim/não)
  - Raiz pública (ex.: docs/) usada pelo GitHub Pages.
  - Ferramenta de build (webpack/vite/esbuild/sem bundler).

- Tarefas que você deve executar:
  - Implementar gate de execução que bloqueia file://, protocolo diferente de https:, e origins fora da lista.
  - Em bloqueio, impedir bootstrap e esvaziar o DOM (tela branca).
  - Se o JS estiver inline e a preferência for separar: extrair para arquivo .js, referenciar via <script src>, preparar para ofuscação.
  - Ofuscar o JS com as opções recomendadas neste documento, removendo sourcemaps.
  - Atualizar o HTML para apontar ao arquivo .obf.js final.
  - (Opcional) Adicionar verificação via /ping.json de mesma origem como camada extra.

- Restrições:
  - Não alterar a interface/fluxo quando a página roda em origins permitidos.
  - Não inserir comentários no JS final; não publicar sourcemaps.
  - Evitar dependências novas; preferir JavaScript puro.

- Formato de saída:
  - HTML final completo pronto para publicar em docs/.
  - Arquivo(s) .js finais ofuscados, com caminhos relativos corretos.
  - Passos claros de onde colocar cada arquivo sob docs/.
  - Pequeno diff/patch ou lista de mudanças para revisão rápida.
  - Checklist de validação (domínio permitido vs. file://).

- Checklist de validação esperada:
  - [ ] Em https://cruzhenriquedev.github.io/… a página funciona como hoje.
  - [ ] Abrindo o arquivo salvo localmente (file://), a tela fica em branco.
  - [ ] O código JS publicado está ofuscado e sem sourcemaps.

16. Guia por página (workflow prático)

- Receber a página alvo (HTML + possíveis .js).
- Definir origins permitidos e atualizar a lista neste documento ou no módulo central.
- Decidir se o JS será separado (recomendado) ou permanecerá inline.
- Inserir gate de execução no bootstrap e repetir em pontos críticos.
- Ofuscar o(s) arquivo(s) JS.
- Publicar o HTML atualizado e os .js ofuscados sob docs/.
- Testar no GitHub Pages e em file:// para confirmar comportamentos.

17. GitHub Pages: publicação sem mudanças visíveis

- Usar docs/ como raiz pública; manter apenas artefatos finais (HTML + .js ofuscado) dentro de docs/.
- Garantir que links e scripts usem caminhos relativos (./script.js) para funcionar em usuário e em repositório pages.
- Não publicar sourcemaps, arquivos fonte ou versões não ofuscadas dentro de docs/.
- Se necessário, manter fontes originais fora de docs/ (ex.: src/) e não referenciá-las no HTML publicado.

18. Separar JS do HTML?

- Recomenda-se separar:
  - Facilita a ofuscação, cache, e manutenção.
  - Permite reaplicar proteções sem mexer no HTML.
- Se permanecer inline:
  - É possível, mas menos robusto; o HTML cresce e a ofuscação inline é menos flexível.
  - Preferir extrair para um arquivo .js durante o processo e então referenciar via <script src>.

19. Estado do código original

- Manter o código legível em uma pasta de fontes (ex.: src/) fora de docs/.
- Publicar apenas os artefatos finais (HTML + .js ofuscado) em docs/.
- O HTML publicado não deve referenciar arquivos de src/; apenas os ofuscados.
- Se necessário, preservar um .src.html apenas para desenvolvimento, não servido pelo Pages.

20. Estrutura de pastas proposta (compatível com GitHub Pages)

- HTMLs públicos permanecem onde estão hoje (sem mudar o caminho da URL).
- JS por ferramenta/página organizado assim:
  - js/tools/<nome-pagina>/src/ → código-fonte legível
  - js/tools/<nome-pagina>/dist/ → saída ofuscada publicada
- Em cada HTML, referenciar apenas arquivos de dist/ em produção.
- Fontes originais ficam fora de docs/ (ou fora da publicação), publicados apenas os dist/.

21. Automação com Node (recomendada)

- Configuração:
  - Iniciar Node na raiz do repositório e instalar javascript-obfuscator.
  - Adicionar um script Node (scripts/obfuscate.js) que:
    - Varre js/tools/_/src/_.js.
    - Ofusca cada arquivo com as opções recomendadas (seção 6).
    - Escreve a saída em js/tools/\*/dist/ com sufixo .obf.js.
    - Remove sourcemaps e garante nomes estáveis dos arquivos de produção.
  - Adicionar script npm: "obfuscate": "node scripts/obfuscate.js".

- Fluxo de uso:
  - Desenvolver/ajustar JS em js/tools/<pagina>/src/.
  - Executar npm run obfuscate para gerar js/tools/<pagina>/dist/\*.obf.js.
  - Em cada HTML público, apontar para os .obf.js sob dist/.
  - Publicar normalmente via GitHub Pages; visitantes não percebem mudança.

22. Gate de execução (snippet a ser incluído)

- Incluir um pequeno bootstrap antes de carregar o restante da aplicação:
  - Verifica protocol/origin e bloqueia fora da whitelist.
  - Em bloqueio, limpar DOM (tela branca) e encerrar.
- Esse snippet também pode ser ofuscado e residir em dist/ (ex.: gate.obf.js), referenciado primeiro no HTML.

23. Migração incremental por página

- Passo 1: Identificar a(s) dependência(s) JS de uma página pública.
- Passo 2: Mover/copiar o JS para js/tools/<pagina>/src/ (mantendo backup).
- Passo 3: Ajustar o HTML para apontar para js/tools/<pagina>/dist/\*.obf.js.
- Passo 4: Rodar o obfuscador e validar em GitHub Pages e em file://.
- Passo 5: Repetir para as demais páginas.

24. Decisão: JS separado ou inline

- Separado (recomendado):
  - Facilita a automação com Node, cache e manutenção.
  - Permite reaplicar o obfuscator sem tocar o HTML.
- Inline (não recomendado):
  - É possível, mas menos flexível. Exige reprocessar o HTML ou inserir build steps específicos.
  - Preferir extrair para .js durante a migração.

25. Estado do código original (dev vs. produção)

- Original mantido em js/tools/<pagina>/src/ (legível).
- Produção carrega apenas js/tools/<pagina>/dist/\*.obf.js em HTML.
- Não publicar sourcemaps ou arquivos de src/ em docs/ nem no Pages.

26. Comandos práticos para rodar o ofuscador (Node)

- Pré-requisitos:
  - Estar na raiz do projeto: c:\Users\Henrique da Cruz\source\repos\TopograficPoints
  - Ter executado ao menos uma vez:
    - npm install

- Rodar ofuscador só para a ferramenta csvToXlsxJoin:
  - Comando:
    - npm run obfuscate:csvToXlsxJoin
  - Entrada:
    - js/tools/csvToXlsxJoin/src/main.js
  - Saída:
    - js/tools/csvToXlsxJoin/dist/main.obf.js

- Rodar ofuscador para todas as ferramentas em js/tools/:
  - Comando:
    - npm run obfuscate
  - Comportamento:
    - Detecta automaticamente js/tools/<pagina>/src com arquivos .js.
    - Gera/atualiza os arquivos \*.obf.js em js/tools/<pagina>/dist.

- Quando lembrar de rodar:
  - Sempre que alterar código em js/tools/<pagina>/src.
  - Antes de publicar no GitHub Pages, para garantir dist/ atualizado.

27. Gate duplo obrigatório (inline no HTML + dentro do JS ofuscado)

- **Obrigatório em ambos**: Gate deve existir tanto no HTML quanto no JS ofuscado.
  - Gate no HTML: bloqueia renderização e carregamento de scripts.
  - Gate no JS: bloqueia execução mesmo se o arquivo for salvo/copiado.

- Implementação aplicada (exemplo elementsOAEVisualizer):
  - Gate inline no HTML `<head>`, antes de qualquer outro script:
    ```javascript
    (function () {
      const allowedOrigins = [
        "https://cruzhenriquedev.github.io",
        "https://cruzhenriquedev.github.io/TopograficPoints",
      ];
      const isFileProtocol = location.protocol === "file:";
      const isNotHttps = location.protocol !== "https:";
      const originNotAllowed = !allowedOrigins.some(
        (o) => location.origin === o || location.href.startsWith(o),
      );
      if (isFileProtocol || isNotHttps || originNotAllowed) {
        document.write("");
        document.close();
        window.stop && window.stop();
        return; // Silencioso - sem erros no console
      }
    })();
    ```
  - Gate dentro do JS (primeira linha do src/main.js antes da lógica):
    ```javascript
    (function () {
      const allowedOrigins = [
        "https://cruzhenriquedev.github.io",
        "https://cruzhenriquedev.github.io/TopograficPoints",
      ];
      const isFileProtocol = window.location.protocol === "file:";
      const isNotHttps = window.location.protocol !== "https:";
      const originNotAllowed = !allowedOrigins.some(
        (o) =>
          window.location.origin === o || window.location.href.startsWith(o),
      );
      if (isFileProtocol || isNotHttps || originNotAllowed) {
        document.open();
        document.write("");
        document.close();
        return; // Silencioso - sem erros no console
      }
    })();
    ```

- Efeito ao baixar a página:
  - Ao abrir como file://, a tela fica em branco (document.write limpa o DOM).
  - JS não executa (return silencioso antes da lógica principal).
  - **Sem erros no console** - parece um bug natural, não bloqueio intencional.
  - Dupla proteção: mesmo removendo gate do HTML salvo, o JS ofuscado também bloqueia.

- Como replicar em outras páginas:
  1. Inserir o snippet inline no `<head>` antes de carregar qualquer script.
  2. Adicionar a mesma checagem como **primeira linha** do arquivo js/tools/<pagina>/src/\*.js.
  3. Rodar o ofuscador para gerar o dist atualizado.
  4. **Obrigatório**: ambos os gates devem estar presentes para proteção completa.
  5. **Importante**: usar `return` silencioso, **nunca** `throw new Error()` para não alertar no console.
