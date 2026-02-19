const fs = require("fs");

// Ler o arquivo HTML
const htmlContent = fs.readFileSync("FOTOS_PARA_GEO_PONTOS.html", "utf8");

// Encontrar a posição do script inline (que começa com <script> após o comentário de versão)
const scriptStart = htmlContent.indexOf("    <script>\n      // Versão: 5.0");
const scriptEnd = htmlContent.indexOf("    </script>\n  </body>");

if (scriptStart === -1 || scriptEnd === -1) {
  console.error(
    "Não foi possível encontrar o script inline ou as tags de fechamento",
  );
  console.log("scriptStart:", scriptStart, "scriptEnd:", scriptEnd);
  process.exit(1);
}

// Criar novo conteúdo removendo o script inline
const newContent =
  htmlContent.substring(0, scriptStart) + htmlContent.substring(scriptEnd + 15); // +15 para </script>\n  </body>

// Salvar o arquivo atualizado
fs.writeFileSync("FOTOS_PARA_GEO_PONTOS.html", newContent);

console.log("✅ JavaScript inline removido com sucesso!");
console.log("📁 Arquivo atualizado: FOTOS_PARA_GEO_PONTOS.html");
console.log(
  "📊 Tamanho reduzido em aproximadamente:",
  scriptEnd - scriptStart,
  "caracteres",
);
