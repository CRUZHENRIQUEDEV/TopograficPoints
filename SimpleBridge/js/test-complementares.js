// ========================================
// TESTE DE SALVAMENTO E EXPORTAÇÃO - COMPLEMENTARES
// ========================================

/**
 * Função de teste para verificar se os campos de complementares
 * estão sendo coletados corretamente
 */
function testComplementaresData() {
  // console.log("=== TESTE DE COMPLEMENTARES ===");
  
  const form = document.getElementById("oae-form");
  if (!form) {
    // console.error("❌ Formulário não encontrado!");
    return;
  }
  
  const formData = new FormData(form);
  const complementaresData = {};
  
  // Lista de campos de complementares
  const complementaresFields = [
    "TIPO BARREIRA ESQUERDA",
    "LARGURA BARREIRA ESQUERDA",
    "TIPO BARREIRA DIREITA",
    "LARGURA BARREIRA DIREITA",
    "TIPO CALCADA ESQUERDA",
    "LARGURA CALCADA ESQUERDA",
    "TIPO CALCADA DIREITA",
    "LARGURA CALCADA DIREITA",
    "GUARDA RODAS ESQUERDO",
    "LARGURA GUARDA RODAS ESQUERDO",
    "GUARDA RODAS DIREITO",
    "LARGURA GUARDA RODAS DIREITO"
  ];
  
  // console.log("\n📋 Verificando campos de COMPLEMENTARES:");
  // console.log("=".repeat(60));
  
  let allFieldsFound = true;
  
  complementaresFields.forEach(fieldName => {
    const fieldValue = formData.get(fieldName);
    const fieldElement = document.querySelector(`[name="${fieldName}"]`);
    
    if (!fieldElement) {
      // console.error(`❌ Campo "${fieldName}" não existe no HTML`);
      allFieldsFound = false;
    } else {
      const elementValue = fieldElement.value || "(vazio)";
      const formDataValue = fieldValue || "(vazio)";
      
      // console.log(`\n📌 ${fieldName}:`);
      // console.log(`   Elemento: ${fieldElement.id ? '#' + fieldElement.id : 'sem ID'}`);
      // console.log(`   Tipo: ${fieldElement.tagName} ${fieldElement.type || ''}`);
      // console.log(`   Valor no elemento: "${elementValue}"`);
      // console.log(`   Valor no FormData: "${formDataValue}"`);
      
      // if (elementValue !== formDataValue) {
      //   console.warn(`⚠️ VALORES DIFERENTES!`);
      // } else {
      //   console.log(`✅ Valores consistentes`);
      // }
      
      complementaresData[fieldName] = fieldValue;
    }
  });
  
  // console.log("\n" + "=".repeat(60));
  // console.log("📦 RESUMO DOS DADOS:");
  // console.log(JSON.stringify(complementaresData, null, 2));
  
  // Testar se os campos estão no FormData geral
  // console.log("\n🔍 Verificando no FormData completo:");
  let foundInFormData = 0;
  for (let [key, value] of formData.entries()) {
    if (complementaresFields.includes(key)) {
      foundInFormData++;
      // console.log(`   ✅ ${key}: "${value}"`);
    }
  }
  
  // console.log(`\n📊 Total de campos encontrados: ${foundInFormData}/${complementaresFields.length}`);
  
  // if (foundInFormData === complementaresFields.length) {
  //   console.log("✅ TODOS OS CAMPOS ESTÃO NO FORMDATA!");
  // } else {
  //   console.error(`❌ FALTAM ${complementaresFields.length - foundInFormData} CAMPOS NO FORMDATA!`);
  // }
  
  // Testar CSV
  // console.log("\n📄 Testando geração de CSV:");
  const csvColumns = getCsvColumns();
  const hasMissingColumns = complementaresFields.filter(field => !csvColumns.includes(field));
  
  // if (hasMissingColumns.length === 0) {
  //   console.log("✅ Todas as colunas de complementares estão em getCsvColumns()");
  // } else {
  //   console.error("❌ Colunas faltando em getCsvColumns():");
  //   hasMissingColumns.forEach(col => console.error(`   - ${col}`));
  // }
  
  return {
    allFieldsFound,
    foundInFormData,
    totalFields: complementaresFields.length,
    hasMissingColumns: hasMissingColumns.length > 0,
    data: complementaresData
  };
}

/**
 * Teste rápido de exportação CSV
 */
function testCSVExport() {
  // console.log("\n🧪 TESTE DE EXPORTAÇÃO CSV");
  // console.log("=".repeat(60));
  
  try {
    const form = document.getElementById("oae-form");
    const formData = new FormData(form);
    const csvColumns = getCsvColumns();
    
    const data = {};
    csvColumns.forEach((column) => {
      data[column] = "";
    });
    
    for (let [key, value] of formData.entries()) {
      if (!key.startsWith("tramo-") && !key.startsWith("apoio-")) {
        data[key] = value;
      }
    }
    
    // Verificar campos de barreira
    // console.log("\n🔍 Campos de BARREIRA no CSV:");
    // console.log(`   TIPO BARREIRA ESQUERDA: "${data["TIPO BARREIRA ESQUERDA"] || '(vazio)'}"`);
    // console.log(`   LARGURA BARREIRA ESQUERDA: "${data["LARGURA BARREIRA ESQUERDA"] || '(vazio)'}"`);
    // console.log(`   TIPO BARREIRA DIREITA: "${data["TIPO BARREIRA DIREITA"] || '(vazio)'}"`);
    // console.log(`   LARGURA BARREIRA DIREITA: "${data["LARGURA BARREIRA DIREITA"] || '(vazio)'}"`);
    
    // console.log("\n✅ Teste de exportação CSV concluído!");
    
  } catch (error) {
    // console.error("❌ Erro no teste de exportação CSV:", error);
  }
}

// Adicionar botão de teste na página (desenvolvimento)
// COMENTADO - Descomente para ativar o botão de teste
/*
function addTestButton() {
  const testButton = document.createElement("button");
  testButton.textContent = "🧪 Testar Complementares";
  testButton.type = "button";
  testButton.style.cssText = "position: fixed; top: 10px; right: 10px; z-index: 9999; background: #ff9800; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;";
  testButton.onclick = function() {
    const result = testComplementaresData();
    testCSVExport();
    alert(`Teste concluído!\nVerifique o console (F12) para detalhes.`);
  };
  document.body.appendChild(testButton);
  console.log("🧪 Botão de teste adicionado no canto superior direito");
}

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addTestButton);
} else {
  addTestButton();
}
*/

// Expor funções globalmente
window.testComplementaresData = testComplementaresData;
window.testCSVExport = testCSVExport;
