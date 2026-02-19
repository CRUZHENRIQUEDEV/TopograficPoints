const fs = require('fs');

// Ler o arquivo HTML
const htmlContent = fs.readFileSync('survey_points_visualizer.html', 'utf8');

// Encontrar o conteúdo entre <script> e </script>
const scriptStart = htmlContent.indexOf('<script>');
const scriptEnd = htmlContent.indexOf('</script>', scriptStart);

if (scriptStart === -1 || scriptEnd === -1) {
    console.error('Não foi possível encontrar as tags script');
    process.exit(1);
}

// Extrair o código JavaScript
let jsCode = htmlContent.substring(scriptStart + 8, scriptEnd); // +8 para pular '<script>'

// Ler o arquivo main.js existente (que já tem o gate)
const mainJsPath = 'js/tools/survey_points_visualizer/src/main.js';
const existingContent = fs.readFileSync(mainJsPath, 'utf8');

// Verificar onde termina o gate (procurar por '})();' seguido de quebra de linha)
const gateEnd = existingContent.indexOf('})();\n');
if (gateEnd === -1) {
    console.error('Não foi possível encontrar o fim do gate');
    process.exit(1);
}

const gatePart = existingContent.substring(0, gateEnd + 6); // +6 para incluir '})();\n'

// Combinar gate + código extraído
const finalContent = gatePart + '\n' + jsCode;

// Salvar o arquivo final
fs.writeFileSync(mainJsPath, finalContent);

console.log('✅ JavaScript extraído com sucesso!');
console.log('📁 Arquivo salvo em:', mainJsPath);
console.log('📊 Tamanho do código extraído:', jsCode.length, 'caracteres');
