/* ===== FUNÇÕES PARA BUSCAR PONTES DE REFERÊNCIA ===== */

// Função para buscar pontes de referência no banco
function searchPontesReference(searchTerm, callback) {
  try {
    if (!db) {
      alert("Banco de dados não está disponível.");
      return;
    }

    const transaction = db.transaction(["pontes"], "readonly");
    const objectStore = transaction.objectStore("pontes");
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
      const pontes = event.target.result;

      // Filtrar pontes com base no termo de busca
      const filteredPontes = pontes.filter(
        (ponte) =>
          (ponte.CodigoSgo && ponte.CodigoSgo.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (ponte.Identificacao && ponte.Identificacao.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (ponte.Uf && ponte.Uf.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (ponte.Br && ponte.Br.toString().includes(searchTerm))
      );

      callback(filteredPontes);
    };

    request.onerror = function (event) {
      console.error("Erro ao buscar pontes:", event.target.error);
      callback([]);
    };
  } catch (error) {
    console.error("Erro ao buscar pontes de referência:", error);
    callback([]);
  }
}

// Função para mostrar modal de busca de pontes
function showSearchPontesModal() {
  // Verificar se já existe o modal, se não, criar
  let modal = document.getElementById("search-pontes-modal");

  if (!modal) {
    // Criar o modal
    modal = document.createElement("div");
    modal.id = "search-pontes-modal";
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal" onclick="closeSearchPontesModal()">&times;</span>
        <h3>Buscar Pontes de Referência</h3>
        <p>Busque pontes no banco de dados de referência para preencher automaticamente os campos básicos.</p>
        <div class="filter-container">
          <input type="text" id="filter-pontes" placeholder="Buscar por código, nome, UF ou BR..." />
          <button onclick="performPontesSearch()">🔍 Buscar</button>
        </div>
        <div id="pontes-results" class="works-list" style="max-height:400px;">
          <!-- Resultados da busca serão exibidos aqui -->
          <div class="work-item">Digite um termo para buscar pontes</div>
        </div>
        <div class="actions">
          <button type="button" onclick="closeSearchPontesModal()">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Adicionar evento para tecla Enter no campo de busca
    const searchInput = document.getElementById("filter-pontes");
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performPontesSearch();
      }
    });
  }

  // Exibir o modal
  modal.style.display = "block";

  // Verificar se já existe um código digitado
  const codigoAtual = document.getElementById("codigo").value.trim();
  if (codigoAtual) {
    // Preencher o campo de busca com o código atual
    document.getElementById("filter-pontes").value = codigoAtual;

    // Realizar a busca automaticamente
    performPontesSearch();
  }
}

// Fechar modal de busca de pontes
function closeSearchPontesModal() {
  const modal = document.getElementById("search-pontes-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Realizar busca de pontes
function performPontesSearch() {
  const searchTerm = document.getElementById("filter-pontes").value.trim();
  const resultsContainer = document.getElementById("pontes-results");

  if (!searchTerm) {
    resultsContainer.innerHTML =
      '<div class="work-item">Digite um termo para buscar pontes</div>';
    return;
  }

  resultsContainer.innerHTML = '<div class="work-item">Buscando...</div>';

  searchPontesReference(searchTerm, function (results) {
    if (results.length === 0) {
      resultsContainer.innerHTML =
        '<div class="work-item">Nenhuma ponte encontrada. Verifique se o banco de dados de referência foi importado.</div>';
      return;
    }

    resultsContainer.innerHTML = "";

    // Limitar a 50 resultados
    const maxResults = 50;
    const displayResults = results.slice(0, maxResults);

    if (results.length > maxResults) {
      const infoItem = document.createElement("div");
      infoItem.className = "work-item";
      infoItem.style.backgroundColor = "rgba(52, 152, 219, 0.2)";
      infoItem.innerHTML = `<span>⚠️ Mostrando ${maxResults} de ${results.length} resultados. Refine sua busca.</span>`;
      resultsContainer.appendChild(infoItem);
    }

    displayResults.forEach((ponte) => {
      const ponteItem = document.createElement("div");
      ponteItem.className = "work-item";
      ponteItem.setAttribute("data-id", ponte.Id);

      ponteItem.innerHTML = `
        <span>
          <strong>${ponte.CodigoSgo}</strong> - ${ponte.Identificacao || 'Sem nome'}
          <br>
          <small>📍 ${ponte.Uf || 'N/A'} | BR-${ponte.Br || 'N/A'} | KM ${ponte.Km || 'N/A'}</small>
        </span>
        <button type="button" class="copy-btn" onclick="usePonteData('${ponte.Id}')">Usar</button>
      `;

      resultsContainer.appendChild(ponteItem);
    });
  });
}

// Mostrar modal com detalhes da ponte para seleção de campos
function usePonteData(ponteId) {
  showPonteDetailsModal(ponteId);
}

// Função para mostrar o modal de detalhes da ponte antes de importar
function showPonteDetailsModal(ponteId) {
  try {
    if (!db) {
      alert("Banco de dados não está disponível.");
      return;
    }

    const transaction = db.transaction(["pontes"], "readonly");
    const objectStore = transaction.objectStore("pontes");
    const request = objectStore.get(ponteId);

    request.onsuccess = function (event) {
      const ponte = event.target.result;

      if (!ponte) {
        alert("Ponte não encontrada.");
        return;
      }

      // Verificar se o modal já existe
      let modal = document.getElementById("ponte-details-modal");

      if (!modal) {
        // Criar o modal
        modal = document.createElement("div");
        modal.id = "ponte-details-modal";
        modal.className = "modal";
        document.body.appendChild(modal);
      }

      // Mapeamento entre campos da ponte e campos do formulário
      const fieldMappings = [
        { from: "CodigoSgo", to: "codigo", label: "Código SGO", type: "text" },
        { from: "Identificacao", to: "nome", label: "Nome da Ponte", type: "text" },
        { from: "Uf", to: "uf", label: "UF", type: "text" },
        { from: "Br", to: "rodovia", label: "Rodovia (BR)", type: "text" },
        { from: "Km", to: "km", label: "Quilômetro", type: "number" },
        { from: "Comprimento", to: "comprimento", label: "Comprimento (m)", type: "number" },
        { from: "Largura", to: "largura", label: "Largura (m)", type: "number" },
        { from: "Ano", to: null, label: "Ano de Construção", type: "text" },
        { from: "Municipio", to: null, label: "Município", type: "text" },
        { from: "Latitude", to: "latitude", label: "Latitude", type: "number" },
        { from: "Longitude", to: "longitude", label: "Longitude", type: "number" }
      ];

      // Construir conteúdo do modal
      let modalContent = `
        <div class="modal-content">
          <span class="close-modal" onclick="closePonteDetailsModal()">&times;</span>
          <h3>Confirmar importação de dados da ponte</h3>
          <p>Selecione os dados que deseja importar para o formulário:</p>
          
          <div class="ponte-details-container">
            <div class="ponte-header">
              <strong>${ponte.CodigoSgo || ""} - ${ponte.Identificacao || ""}</strong>
              <div>
                <button type="button" onclick="toggleAllPonteFields(true)">Marcar Todos</button>
                <button type="button" onclick="toggleAllPonteFields(false)">Desmarcar Todos</button>
              </div>
            </div>
            
            <div class="ponte-fields">`;

      // Adicionar cada campo com checkbox
      fieldMappings.forEach((field) => {
        const value = ponte[field.from] !== undefined && ponte[field.from] !== null ? ponte[field.from] : "";
        const isDisabled = value === "";
        const displayValue = value;

        modalContent += `
          <div class="ponte-field-row">
            <label class="ponte-field-checkbox">
              <input type="checkbox" name="import_${field.from}" ${isDisabled ? "disabled" : "checked"} 
                data-field-from="${field.from}" data-field-to="${field.to || ""}" 
                data-field-type="${field.type}">
              <span>${field.label}</span>
            </label>
            <div class="ponte-field-value">${displayValue || "N/A"}</div>`;

        // Adicionar botão copiar para coordenadas
        if ((field.from === "Latitude" || field.from === "Longitude") && !isDisabled) {
          modalContent += `
            <div class="ponte-field-actions">
              <button type="button" onclick="copyToClipboard('${displayValue}')">Copiar</button>
            </div>`;
        }

        modalContent += `</div>`;
      });

      // Adicionar seção para coordenadas GPS
      const hasCoords = ponte.Latitude && ponte.Longitude;
      modalContent += `
        <div class="coords-group">
          <div>
            <strong>🌍 Coordenadas GPS:</strong>
            <div>${hasCoords ? `${ponte.Latitude}, ${ponte.Longitude}` : "Não disponíveis"}</div>
          </div>
        </div>`;

      // Fechar containers e adicionar botões de ação
      modalContent += `
            </div>
          </div>
          
          <div class="actions">
            <button type="button" onclick="confirmImportPonte('${ponteId}')">✅ Importar Selecionados</button>
            <button type="button" onclick="closePonteDetailsModal()">Cancelar</button>
          </div>
        </div>
      `;

      modal.innerHTML = modalContent;

      // Exibir o modal
      modal.style.display = "block";
    };

    request.onerror = function (event) {
      console.error("Erro ao obter ponte:", event.target.error);
      alert("Erro ao obter dados da ponte.");
    };
  } catch (error) {
    console.error("Erro ao mostrar detalhes da ponte:", error);
    alert("Erro ao mostrar detalhes da ponte: " + error.message);
  }
}

// Fechar modal de detalhes da ponte
function closePonteDetailsModal() {
  const modal = document.getElementById("ponte-details-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Marcar/desmarcar todos os campos
function toggleAllPonteFields(checked) {
  const checkboxes = document.querySelectorAll(
    '#ponte-details-modal input[type="checkbox"]:not([disabled])'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = checked;
  });
}

// Confirmar a importação dos campos selecionados
function confirmImportPonte(ponteId) {
  try {
    if (!db) {
      alert("Banco de dados não está disponível.");
      return;
    }

    const transaction = db.transaction(["pontes"], "readonly");
    const objectStore = transaction.objectStore("pontes");
    const request = objectStore.get(ponteId);

    request.onsuccess = function (event) {
      const ponte = event.target.result;

      if (!ponte) {
        alert("Ponte não encontrada.");
        return;
      }

      // Coletar campos selecionados
      const selectedFields = document.querySelectorAll(
        '#ponte-details-modal input[type="checkbox"]:checked'
      );

      if (selectedFields.length === 0) {
        alert("Nenhum campo selecionado para importação.");
        return;
      }

      let importedCount = 0;

      // Preencher os campos do formulário
      selectedFields.forEach((checkbox) => {
        const fieldFrom = checkbox.getAttribute("data-field-from");
        const fieldTo = checkbox.getAttribute("data-field-to");
        const fieldType = checkbox.getAttribute("data-field-type");

        if (fieldTo && ponte[fieldFrom] !== undefined) {
          const field = document.getElementById(fieldTo);

          if (field) {
            let value = ponte[fieldFrom];

            // Formatar de acordo com o tipo de campo
            if (fieldType === "number" && value !== "") {
              value = parseFloat(value) || 0;
            }

            field.value = value;
            importedCount++;
          }
        }
      });

      alert(`✅ Dados da ponte importados com sucesso!\n\n${importedCount} campos foram preenchidos.`);
      closePonteDetailsModal();
      closeSearchPontesModal();
    };

    request.onerror = function (event) {
      console.error("Erro ao obter ponte:", event.target.error);
      alert("Erro ao obter dados da ponte.");
    };
  } catch (error) {
    console.error("Erro ao importar dados da ponte:", error);
    alert("Erro ao importar dados da ponte: " + error.message);
  }
}

// Copiar valor para a área de transferência
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("✅ Valor copiado para a área de transferência!");
    })
    .catch((err) => {
      console.error("Erro ao copiar texto: ", err);
      alert("Não foi possível copiar o texto. Por favor, copie manualmente.");
    });
}

// Expor funções globalmente
window.searchPontesReference = searchPontesReference;
window.showSearchPontesModal = showSearchPontesModal;
window.closeSearchPontesModal = closeSearchPontesModal;
window.performPontesSearch = performPontesSearch;
window.usePonteData = usePonteData;
window.showPonteDetailsModal = showPonteDetailsModal;
window.closePonteDetailsModal = closePonteDetailsModal;
window.toggleAllPonteFields = toggleAllPonteFields;
window.confirmImportPonte = confirmImportPonte;
window.copyToClipboard = copyToClipboard;
