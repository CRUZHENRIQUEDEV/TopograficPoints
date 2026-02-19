const fs = require('fs');

// Ler o arquivo HTML
const htmlContent = fs.readFileSync('airportProximity.html', 'utf8');

// Encontrar a última ocorrência de <script> antes do </body>
const bodyEndIndex = htmlContent.indexOf('</body>');
if (bodyEndIndex === -1) {
    console.error('❌ Tag </body> não encontrada');
    process.exit(1);
}

// Procurar o <script> que vem antes do </body>
const contentBeforeBody = htmlContent.substring(0, bodyEndIndex);
const lastScriptStart = contentBeforeBody.lastIndexOf('<script>');
const lastScriptEnd = contentBeforeBody.lastIndexOf('</script>');

if (lastScriptStart === -1 || lastScriptEnd === -1 || lastScriptEnd < lastScriptStart) {
    console.error('❌ Script block não encontrado corretamente');
    console.log('lastScriptStart:', lastScriptStart);
    console.log('lastScriptEnd:', lastScriptEnd);
    process.exit(1);
}

// Verificar se este script contém "Versão: 2.2"
const scriptContent = contentBeforeBody.substring(lastScriptStart, lastScriptEnd + 9);
if (!scriptContent.includes('Versão: 2.2')) {
    console.error('⚠️ Script encontrado mas não contém "Versão: 2.2"');
    
    // Verificar se já foi processado
    if (scriptContent.includes('main.obf.js')) {
        console.log('✅ Parece que o arquivo já foi atualizado com o carregamento dinâmico!');
        process.exit(0);
    }
    process.exit(1);
}

// Criar novo conteúdo
const beforeScript = htmlContent.substring(0, lastScriptStart);
const afterScriptEnd = htmlContent.substring(lastScriptEnd + 9); // +9 para </script>

const newContent = beforeScript + `  <!-- Script principal carregado dinamicamente -->
  <script>
    window.addEventListener("DOMContentLoaded", function () {
      const script = document.createElement("script");
      script.src = "./js/tools/airportProximity/dist/main.obf.js";
      document.body.appendChild(script);
    });
  </script>` + afterScriptEnd;

// Salvar o arquivo atualizado
fs.writeFileSync('airportProximity.html', newContent);

console.log('✅ JavaScript inline removido com sucesso!');
console.log('📁 Arquivo atualizado: airportProximity.html');
console.log('💾 Agora carrega main.obf.js dinamicamente');
console.log('📊 Script removido tinha:', scriptContent.length, 'caracteres');
