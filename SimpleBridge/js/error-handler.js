// ========================================
// ERROR HANDLER - Gerenciamento de Avisos de Erro
// ========================================

/**
 * Inicializa listeners para ocultar avisos de erro quando campos são preenchidos
 */
function initErrorHandlers() {
  // Buscar todos os campos que têm mensagens de erro associadas
  const errorMessages = document.querySelectorAll('.error-message');
  
  errorMessages.forEach(errorMessage => {
    const errorId = errorMessage.id;
    if (!errorId) return;
    
    // Derivar o ID do campo a partir do ID da mensagem de erro
    // Exemplo: "lote-error" -> "lote"
    const fieldId = errorId.replace('-error', '');
    const field = document.getElementById(fieldId);
    
    if (!field) return;
    
    // Adicionar listeners para ocultar erro quando campo é preenchido
    field.addEventListener('input', function() {
      validateAndHideError(field, errorMessage);
    });
    
    field.addEventListener('change', function() {
      validateAndHideError(field, errorMessage);
    });
    
    field.addEventListener('blur', function() {
      validateAndHideError(field, errorMessage);
    });
  });
}

/**
 * Valida o campo e oculta o erro se o valor for válido
 */
function validateAndHideError(field, errorMessage) {
  const fieldType = field.type;
  const fieldValue = field.value.trim();
  
  // Verificar se o campo é obrigatório
  const isRequired = field.hasAttribute('required') || field.classList.contains('required');
  
  // Determinar se o campo está válido
  let isValid = false;
  
  if (fieldType === 'checkbox' || fieldType === 'radio') {
    // Para checkboxes e radios, não precisa validar (geralmente não têm erro de obrigatório)
    isValid = true;
  } else if (fieldType === 'number') {
    // Para números, verificar se há valor e se é um número válido
    const numValue = parseFloat(fieldValue);
    const min = field.getAttribute('min');
    const max = field.getAttribute('max');
    
    if (fieldValue === '') {
      isValid = !isRequired;
    } else if (isNaN(numValue)) {
      isValid = false;
    } else {
      // Verificar limites min/max se existirem
      let withinLimits = true;
      if (min !== null && numValue < parseFloat(min)) {
        withinLimits = false;
      }
      if (max !== null && numValue > parseFloat(max)) {
        withinLimits = false;
      }
      isValid = withinLimits;
    }
  } else if (field.tagName === 'SELECT') {
    // Para selects, verificar se há uma opção selecionada válida
    isValid = fieldValue !== '' && fieldValue !== 'Selecione';
  } else {
    // Para text, textarea, etc.
    isValid = fieldValue !== '';
  }
  
  // Ocultar ou mostrar mensagem de erro
  if (isValid) {
    errorMessage.classList.remove('visible');
    field.classList.remove('error');
  }
}

/**
 * Mostra mensagem de erro para um campo específico
 */
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorMessage = document.getElementById(fieldId + '-error');
  
  if (field) {
    field.classList.add('error');
  }
  
  if (errorMessage) {
    if (message) {
      errorMessage.textContent = message;
    }
    errorMessage.classList.add('visible');
  }
}

/**
 * Oculta mensagem de erro para um campo específico
 */
function hideFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorMessage = document.getElementById(fieldId + '-error');
  
  if (field) {
    field.classList.remove('error');
  }
  
  if (errorMessage) {
    errorMessage.classList.remove('visible');
  }
}

/**
 * Oculta todas as mensagens de erro
 */
function hideAllErrors() {
  document.querySelectorAll('.error-message.visible').forEach(el => {
    el.classList.remove('visible');
  });
  document.querySelectorAll('.error').forEach(el => {
    el.classList.remove('error');
  });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  initErrorHandlers();
});

// Expor funções globalmente
window.initErrorHandlers = initErrorHandlers;
window.validateAndHideError = validateAndHideError;
window.showFieldError = showFieldError;
window.hideFieldError = hideFieldError;
window.hideAllErrors = hideAllErrors;
