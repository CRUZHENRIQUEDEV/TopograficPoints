// TESTE DE VALIDAÇÃO - Execute no console do navegador
// Copie e cole estas funções no console para testar

function testValidation() {
  console.log("=== INICIANDO TESTE DE VALIDAÇÃO ===");
  
  // 1. Verificar se o campo existe
  const field = document.getElementById("comprimento-bloco-sapata");
  console.log("1. Campo comprimento-bloco-sapata existe?", !!field);
  if (field) {
    console.log("   Valor atual:", field.value);
    console.log("   ID:", field.id);
    console.log("   Name:", field.name);
  }
  
  // 2. Verificar se está em requiredFields
  if (typeof requiredFields !== 'undefined') {
    console.log("2. Campo está em requiredFields?", !!requiredFields["comprimento-bloco-sapata"]);
    if (requiredFields["comprimento-bloco-sapata"]) {
      console.log("   Configuração:", requiredFields["comprimento-bloco-sapata"]);
    }
  } else {
    console.log("2. ❌ requiredFields não está definido!");
  }
  
  // 3. Verificar função validateField
  if (typeof validateField !== 'undefined') {
    console.log("3. validateField existe? SIM");
    const result = validateField("comprimento-bloco-sapata");
    console.log("   Resultado da validação:", result);
  } else {
    console.log("3. ❌ validateField não está definido!");
  }
  
  // 4. Verificar tipo de bloco sapata
  const tipoField = document.getElementById("tipo-bloco-sapata");
  if (tipoField) {
    console.log("4. Tipo de bloco sapata:", tipoField.value);
    // console.log("   É obrigatório?", tipoField.value !== "" && tipoField.value !== "Nenhum");
  }
  
  // 5. Testar validateForm
  if (typeof validateForm !== 'undefined') {
    // console.log("5. Executando validateForm()...");
    const result = validateForm();
    // console.log("   isValid:", result.isValid);
    // console.log("   missingFields:", result.missingFields);
  } else {
    console.log("5. ❌ validateForm não está definido!");
  }
  
  console.log("=== TESTE CONCLUÍDO ===");
}

// Executar teste automaticamente
console.log("Execute: testValidation()");
