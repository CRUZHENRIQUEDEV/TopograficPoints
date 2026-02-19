// GATE DE PROTEÇÃO - Bloqueia execução em domínios não autorizados
(function () {
  const allowedOrigins = [
    "https://cruzhenriquedev.github.io",
    "https://cruzhenriquedev.github.io/TopograficPoints",
  ];

  const isFileProtocol = window.location.protocol === "file:";
  const isNotHttps = window.location.protocol !== "https:";
  const originNotAllowed = !allowedOrigins.some(
    (o) => window.location.origin === o || window.location.href.startsWith(o),
  );

  if (isFileProtocol || isNotHttps || originNotAllowed) {
    document.open();
    document.write("");
    document.close();
    return;
  }
})();

// === FLUXO DA APLICAÇÃO ===
// 1. Usuário seleciona arquivos
// 2. Para cada arquivo: configura nome/descrição e clica "Aplicar Atual"
// 3. Dados são SALVOS permanentemente no fileData[]
// 4. Previews são RESETADOS para o próximo arquivo
// 5. Tabela mantém os dados já aplicados
// 6. Navegação entre arquivos preserva dados salvos

// === MELHORIAS IMPLEMENTADAS ===
// ✅ "Aplicar Todos" preserva descrições existentes
// ✅ Descrição é OPCIONAL - pode baixar ZIP sem descrição (com confirmação)
// ✅ Modal customizado para confirmações (bonito e profissional)
// ✅ Suporte a ESC para fechar modal
// ✅ Botão de copiar descrição na tabela
// ✅ Aplicar texto digitado manualmente ao clicar "Aplicar Atual"
// ✅ Numeração sequencial personalizada (ex: F-20 → F-21, F-22...)
// ✅ Checkbox para manter nome original dos arquivos

// Dados dos grupos de palavras (compactados para economia de espaço)
const elementos = [
  "INFERIOR",
  "SUPERIOR",
  "DIAGONAL",
  "LD",
  "LE",
  "CRESCENTE",
  "DECRESCENTE",
  "TRAMO",
  "TRANSIÇÃO 01",
  "TRANSIÇÃO 02",
  "APOIO",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
];

const danos = [
  "01 ANCORAGEM INADEQUADA DA DEFENSA METÁLICA",
  "02 APARELHO DE APOIO COM DISTORÇÃO EXAGERADA",
  "03 APARELHO DE APOIO DANIFICADO",
  "04 APARELHO DE APOIO DESLOCADO DA POSIÇÃO",
  "05 ARMADURA SEM COBRIMENTO",
  "06 BERÇO PARA JUNTA DANIFICADO",
  "07 BURACO NA PISTA (ACESSO)",
  "08 BUZINOTE DANIFICADO OU INEFICIENTE",
  "09 CALÇADA DESTRUÍDA",
  "10 CONCRETO DESAGREGADO COM ARMADURA EXPOSTA E OXIDADA",
  "11 CONCRETO DESAGREGADO SEM ARMADURA EXPOSTA",
  "12 CORROSÃO",
  "13 CORROSÃO AVANÇADA E LIGAÇÕES ROMPIDAS",
  "14 CRESCIMENTO DE VEGETAÇÃO",
  "15 DESAGREGAÇÃO",
  "16 DESNÍVEL NA PISTA (ACESSO)",
  "17 DESPLACAMENTO DE CONCRETO COM ARMADURA EXPOSTA",
  "18 DESPLACAMENTO DE CONCRETO SEM ARMADURA EXPOSTA",
  "19 ELEMENTO DE LIGAÇÃO DANIFICADO OU INEXISTENTE",
  "20 ELEMENTO METÁLICO ROMPIDO",
  "21 EROSÃO DO TALUDE DE ATERRO",
  "22 ESTACA COM SEÇÃO REDUZIDA",
  "23 ESTACA DESCONFINADA",
  "24 ESTACA ESBELTA COM DESCONFINAMENTO LATERAL",
  "25 FERRAGEM PRINCIPAL EXPOSTA EM PONTOS LOCALIZADOS",
  "26 FERRAGEM PRINCIPAL MUITO OXIDADA EM PONTOS LOCALIZADOS",
  "27 FISSURA PROFUNDA ABERTA (W > 0,2 MM)",
  "28 FISSURA PROFUNDA ABERTA (W > 0,3 MM)",
  "29 FISSURA PROFUNDA FINA",
  "30 FISSURA SUPERFICIAL",
  "31 FLAMBAGEM",
  "32 FRAGMENTAÇÃO POR FOGO",
  "33 GUARDA RODAS OU BARREIRA DESTRUÍDO(A)",
  "34 GUARDA-CORPO DESTRUÍDO",
  "35 INFILTRAÇÃO NO CONCRETO",
  "36 JUNTA DANIFICADA OU INEXISTENTE OU EXPELIDA",
  "37 LIXIVIAÇÃO E MANCHA DE CARBONATAÇÃO",
  "38 MADEIRA DETERIORADA",
  "39 MANCHA DE FOGO",
  "40 MANCHA DE UMIDADE",
  "41 MANCHA DEVIDO AÇÃO BIOLÓGICA",
  "42 NICHO DE CONCRETAGEM",
  "43 PAVIMENTO ASFÁLTICO DANIFICADO",
  "44 PAVIMENTO DE CONCRETO DANIFICADO",
  "45 PÊNDULO COM DESAPRUMO EXAGERADO",
  "46 PINGADEIRA DANIFICADA OU INEFICIENTE",
  "47 RACHADURA OU TRINCA MUITO ABERTA",
  "48 RECALQUE DO ATERRO DE APROXIMAÇÃO",
  "49 REGIÃO COM CONCRETO ESMAGADO OU ROMPIDO",
  "50 VIGA COM LIGEIRA CORROSÃO",
];

const localizacao = ["SUPERESTRUTURA", "MESOESTRUTURA", "INFRAESTRUTURA"];

// Elementos DOM
const fileInput = document.getElementById("fileInput");
const fileCounter = document.getElementById("fileCounter");
const currentFileSection = document.getElementById("currentFileSection");
const currentFileName = document.getElementById("currentFileName");
const keepOriginalName = document.getElementById("keepOriginalName");
const prefixInput = document.getElementById("prefixInput");
const suffixInput = document.getElementById("suffixInput");
const addNumbering = document.getElementById("addNumbering");
const separatorSelect = document.getElementById("separatorSelect");
const namePreview = document.getElementById("namePreview");
const namePreviewBox = document.getElementById("namePreviewBox");
const descriptionPreview = document.getElementById("descriptionPreview");
const progressInfo = document.getElementById("progressInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const applyCurrentBtn = document.getElementById("applyCurrentBtn");
const applyAllBtn = document.getElementById("applyAllBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const editableTableBody = document.getElementById("editableTableBody");
const messageDiv = document.getElementById("message");
const modalOverlay = document.getElementById("modalOverlay");
const modalMessage = document.getElementById("modalMessage");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");

// Variáveis globais
let files = [];
let fileData = [];
let currentFileIndex = -1;
let currentCell = { row: 0, col: 1 }; // Para navegação Excel
let selectedOrder = []; // Array para rastrear ordem de seleção

// Variáveis para numeração personalizada
let customNumberingPattern = null; // Armazena padrão detectado: {prefix: "F-", startNumber: 20}

// Event listeners
fileInput.addEventListener("change", handleFileSelect);
keepOriginalName.addEventListener("change", toggleNameControls);
prefixInput.addEventListener("input", updatePreviews);
suffixInput.addEventListener("input", updatePreviews);
addNumbering.addEventListener("change", updatePreviews);
separatorSelect.addEventListener("change", updatePreviews);
prevBtn.addEventListener("click", () => navigateFile(-1));
nextBtn.addEventListener("click", () => navigateFile(1));
applyCurrentBtn.addEventListener("click", applyToCurrent);
applyAllBtn.addEventListener("click", applyToAll);
exportCsvBtn.addEventListener("click", exportToCsv);
downloadBtn.addEventListener("click", downloadFiles);
resetBtn.addEventListener("click", resetAll);

// Event listeners do modal
modalCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Teclas de navegação
document.addEventListener("keydown", handleKeyNavigation);

// Toggle dos controles de nomenclatura
function toggleNameControls() {
  const isKeepOriginal = keepOriginalName.checked;

  // Habilitar/desabilitar controles de nomenclatura
  prefixInput.disabled = isKeepOriginal;
  suffixInput.disabled = isKeepOriginal;
  addNumbering.disabled = isKeepOriginal;
  separatorSelect.disabled = isKeepOriginal;

  // Mudar visual do preview
  if (isKeepOriginal) {
    namePreviewBox.classList.add("original-name");
  } else {
    namePreviewBox.classList.remove("original-name");
  }

  updatePreviews();
}

// Detectar padrão de numeração personalizada
function detectAndSetNumberingPattern(manualName) {
  // Se está mantendo nome original, não detectar padrão
  if (keepOriginalName.checked) return;

  // Remover extensão para análise
  const nameWithoutExt =
    manualName.substring(0, manualName.lastIndexOf(".")) || manualName;

  // Regex para detectar padrões como: F-20, IMG-001, Photo_15, etc.
  const patterns = [
    /^(.+?)[-_\s](\d+)$/, // F-20, IMG_001, Photo 15
    /^(.+?)(\d+)$/, // F20, IMG001
  ];

  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      const prefix = match[1];
      const number = parseInt(match[2]);

      if (!isNaN(number)) {
        customNumberingPattern = {
          prefix: prefix,
          startNumber: number,
          separator: match[0].includes("-")
            ? "-"
            : match[0].includes("_")
              ? "_"
              : match[0].includes(" ")
                ? " "
                : "",
        };

        showMessage(
          `Padrão detectado: ${prefix}${customNumberingPattern.separator}${number}+`,
          "info",
        );
        return;
      }
    }
  }

  // Se não detectou padrão, manter null
  customNumberingPattern = null;
}

// Inicialização
initializeWordsGrids();
updatePreviews();

// Criar grades de palavras
function initializeWordsGrids() {
  createWordGrid(
    document.getElementById("elementosGrid"),
    elementos,
    "elemento",
  );
  createWordGrid(document.getElementById("danosGrid"), danos, "dano");
  createWordGrid(
    document.getElementById("localizacaoGrid"),
    localizacao,
    "localizacao",
  );
}

function createWordGrid(container, words, prefix) {
  container.innerHTML = "";
  words.forEach((palavra) => {
    const div = document.createElement("div");
    div.className = "word-checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `${prefix}_${palavra}`;
    checkbox.value = palavra;
    checkbox.addEventListener("change", (e) => {
      handleCheckboxChange(e.target);
      updatePreviews();
    });
    const label = document.createElement("label");
    label.htmlFor = `${prefix}_${palavra}`;
    label.textContent = palavra.replace(/_/g, " ");
    div.appendChild(checkbox);
    div.appendChild(label);
    container.appendChild(div);
  });
}

// Atualizar previews
function updatePreviews() {
  updateNamePreview();
  updateDescriptionPreview();
}

// Manipular mudanças nos checkboxes para rastrear ordem
function handleCheckboxChange(checkbox) {
  const value = checkbox.value;

  if (checkbox.checked) {
    // Adicionar à ordem se não existir
    if (!selectedOrder.includes(value)) {
      selectedOrder.push(value);
    }
  } else {
    // Remover da ordem
    selectedOrder = selectedOrder.filter((item) => item !== value);
  }
}

function updateNamePreview() {
  if (currentFileIndex === -1) {
    namePreview.textContent = "Selecione um arquivo";
    return;
  }

  const name = generateName(currentFileIndex);
  namePreview.textContent = name;
}

function updateDescriptionPreview() {
  const description = generateDescription();
  descriptionPreview.textContent =
    description || "Selecione elementos/danos/localização";

  // Atualizar na tabela também
  if (currentFileIndex !== -1 && fileData[currentFileIndex]) {
    fileData[currentFileIndex].description = description;
    updateTableRow(currentFileIndex);
  }
}

// Gerar nome (com suporte a numeração personalizada e nome original)
// Gerar nome (com suporte a numeração personalizada, nome original e CONTINUIDADE)
function generateName(index) {
  // Se deve manter nome original
  if (keepOriginalName.checked) {
    return files[index].name;
  }

  // Se há padrão personalizado detectado, usar ele
  if (customNumberingPattern) {
    const currentNumber = customNumberingPattern.startNumber + index;
    const name =
      customNumberingPattern.prefix +
      customNumberingPattern.separator +
      String(currentNumber).padStart(
        String(customNumberingPattern.startNumber).length,
        "0",
      );

    // Adicionar extensão original
    const originalFile = files[index];
    const extension = originalFile.name.substring(
      originalFile.name.lastIndexOf("."),
    );
    return name + extension;
  }

  // Lógica original se não há padrão personalizado
  const prefix = prefixInput.value.trim();
  const suffix = suffixInput.value.trim();
  const shouldAddNumber = addNumbering.checked;

  let name = "";
  if (prefix) name += prefix;
  if (shouldAddNumber) name += String(index + 1).padStart(2, "0");
  if (suffix) name += suffix;
  if (!name) name = "arquivo" + String(index + 1).padStart(2, "0");

  // Adicionar extensão original (não editável)
  const originalFile = files[index];
  const extension = originalFile.name.substring(
    originalFile.name.lastIndexOf("."),
  );
  return name + extension;
}
// Gerar descrição
function generateDescription() {
  const separator = separatorSelect.value;

  // Usar apenas os itens que ainda estão selecionados, na ordem de clique
  const validSelected = selectedOrder.filter((item) => {
    const checkbox = document.querySelector(`input[value="${item}"]`);
    return checkbox && checkbox.checked;
  });

  return validSelected.join(separator);
}

// Manipular seleção de arquivos
// Manipular seleção de arquivos (VERSÃO COM ADIÇÃO INCREMENTAL)
function handleFileSelect(e) {
  const newFiles = Array.from(e.target.files);

  // Se não há arquivos existentes, comportamento normal
  if (files.length === 0) {
    files = newFiles;
    fileData = files.map((file, index) => ({
      originalName: file.name,
      newName: "",
      description: "",
      file: file,
      keepOriginal: false,
    }));

    fileCounter.textContent = `${files.length} arquivo(s)`;

    if (files.length > 0) {
      currentFileIndex = 0;
      currentFileSection.style.display = "block";
      selectCurrentFile();
    }

    updateTable();
    updateButtonStates();
    return;
  }

  // JÁ EXISTEM ARQUIVOS - ADICIONAR INCREMENTALMENTE
  const existingNames = new Set(files.map((f) => f.name));
  const uniqueFiles = [];
  const duplicates = [];

  // Verificar duplicatas
  newFiles.forEach((file) => {
    if (existingNames.has(file.name)) {
      duplicates.push(file.name);
    } else {
      uniqueFiles.push(file);
    }
  });

  // Se todos são duplicados, mostrar aviso e sair
  if (uniqueFiles.length === 0) {
    showMessage(
      `Todos os ${newFiles.length} arquivo(s) já existem na lista!`,
      "error",
    );
    fileInput.value = ""; // Resetar input
    return;
  }

  // Adicionar arquivos únicos aos arrays existentes
  const startIndex = files.length; // Guardar índice inicial para os novos

  uniqueFiles.forEach((file, idx) => {
    files.push(file);
    fileData.push({
      originalName: file.name,
      newName: "",
      description: "",
      file: file,
      keepOriginal: false,
    });
  });

  // Atualizar contador
  fileCounter.textContent = `${files.length} arquivo(s)`;

  // Atualizar interface
  updateTable();
  updateButtonStates();

  // Mostrar mensagem de sucesso
  let message = `${uniqueFiles.length} arquivo(s) adicionado(s)!`;
  if (duplicates.length > 0) {
    message += ` (${duplicates.length} duplicado(s) ignorado(s))`;
  }
  showMessage(message, "success");

  // Resetar input para permitir selecionar os mesmos arquivos novamente depois
  fileInput.value = "";
}

// Selecionar arquivo atual
function selectCurrentFile() {
  if (currentFileIndex < 0 || currentFileIndex >= files.length) return;

  currentFileName.textContent = files[currentFileIndex].name;
  progressInfo.textContent = `Arquivo ${currentFileIndex + 1} de ${files.length}`;

  // Atualizar navegação
  prevBtn.disabled = currentFileIndex === 0;
  nextBtn.disabled = currentFileIndex === files.length - 1;

  // Destacar linha na tabela
  updateTableHighlight();

  // Atualizar previews (mas não sobrescrever dados salvos)
  updatePreviews();
}

// Navegar entre arquivos
function navigateFile(direction) {
  const newIndex = currentFileIndex + direction;
  if (newIndex >= 0 && newIndex < files.length) {
    currentFileIndex = newIndex;
    selectCurrentFile();
  }
}

// Aplicar ao arquivo atual
function applyToCurrent() {
  if (currentFileIndex === -1) return;

  // Verificar se há texto digitado manualmente na tabela
  const currentRow = document.querySelector(
    `tr[data-index="${currentFileIndex}"]`,
  );
  let manualName = "";
  let manualDescription = "";

  if (currentRow) {
    const nameInput = currentRow.querySelector(
      'input[data-field="newName"]',
    );
    const descInput = currentRow.querySelector(
      'input[data-field="description"]',
    );
    manualName = nameInput ? nameInput.value.trim() : "";
    manualDescription = descInput ? descInput.value.trim() : "";
  }

  // Usar texto manual se existir, senão gerar automaticamente
  fileData[currentFileIndex].newName =
    manualName || generateName(currentFileIndex);
  fileData[currentFileIndex].description =
    manualDescription || generateDescription();
  fileData[currentFileIndex].keepOriginal = keepOriginalName.checked;

  // Detectar padrão de numeração se foi digitado manualmente
  if (manualName && currentFileIndex === 0 && !keepOriginalName.checked) {
    detectAndSetNumberingPattern(manualName);
  }

  // Atualizar a linha da tabela com os dados salvos
  updateTableRow(currentFileIndex);
  updateButtonStates();

  showMessage("Aplicado ao arquivo atual!", "success");

  // Resetar seleções da descrição para o próximo arquivo (mas manter nome)
  document
    .querySelectorAll(
      'input[type="checkbox"][id^="elemento_"], input[type="checkbox"][id^="dano_"], input[type="checkbox"][id^="localizacao_]',
    )
    .forEach((cb) => (cb.checked = false));

  // Limpar ordem de seleção para o próximo arquivo
  selectedOrder = [];

  // Atualizar apenas o preview (não a tabela)
  descriptionPreview.textContent = "Selecionar itens para ver preview";

  // Ir para próximo arquivo automaticamente
  if (currentFileIndex < files.length - 1) {
    navigateFile(1);
  }
}

// Aplicar a todos
function applyToAll() {
  if (files.length === 0) return;

  const currentDescription = generateDescription();
  const keepOriginal = keepOriginalName.checked;
  let appliedCount = 0;

  fileData.forEach((item, index) => {
    // Verificar se há texto digitado manualmente na tabela para este arquivo
    const row = document.querySelector(`tr[data-index="${index}"]`);
    let manualName = "";
    let manualDescription = "";

    if (row) {
      const nameInput = row.querySelector('input[data-field="newName"]');
      const descInput = row.querySelector(
        'input[data-field="description"]',
      );
      manualName = nameInput ? nameInput.value.trim() : "";
      manualDescription = descInput ? descInput.value.trim() : "";
    }

    // Para nome: usar manual se existir, senão gerar baseado na configuração
    if (manualName) {
      item.newName = manualName;
    } else {
      item.newName = keepOriginal
        ? item.originalName
        : generateName(index);
    }

    item.keepOriginal = keepOriginal;

    // Para descrição: só aplicar se não existir ainda OU se houver uma seleção atual
    if (!item.description || currentDescription || manualDescription) {
      if (manualDescription) {
        item.description = manualDescription;
        appliedCount++;
      } else if (currentDescription) {
        item.description = currentDescription;
        appliedCount++;
      }
    }
  });

  // Atualizar toda a tabela de uma vez
  updateTable();
  updateButtonStates();

  if (keepOriginal) {
    showMessage(
      `Nomes originais mantidos! Descrição aplicada para ${appliedCount} arquivo(s).`,
      "success",
    );
  } else {
    if (appliedCount > 0) {
      showMessage(
        `Nomes aplicados para todos! Descrição aplicada para ${appliedCount} arquivo(s).`,
        "success",
      );
    } else {
      showMessage(
        "Nomes aplicados para todos! Descrições existentes preservadas.",
        "success",
      );
    }
  }
}

// Atualizar tabela
function updateTable() {
  editableTableBody.innerHTML = "";

  if (files.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="4" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.6); font-style: italic;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.8rem;">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          <p>Selecione arquivos para começar</p>
        </div>
      </td>
    `;
    editableTableBody.appendChild(emptyRow);
    return;
  }

  fileData.forEach((item, index) => {
    const row = document.createElement("tr");
    row.dataset.index = index;

    // Status do arquivo
    let status = "pending";
    let statusText = "○";

    if (index === currentFileIndex) {
      status = "current";
      statusText = "Atual";
    } else if (item.keepOriginal) {
      status = "original";
      statusText = "Original";
    } else if (item.newName && item.description) {
      status = "done";
      statusText = "✓";
    }

    // Determinar se o campo de nome deve estar desabilitado
    const nameDisabled = item.keepOriginal ? "disabled" : "";

    row.innerHTML = `
      <td>
        <div class="original-name" title="${item.originalName}">
          ${item.originalName}
          <span class="file-status ${status}">
            ${statusText}
          </span>
        </div>
      </td>
      <td>
        <input 
          type="text" 
          class="editable-input" 
          value="${item.keepOriginal ? item.originalName : item.newName}" 
          data-index="${index}" 
          data-field="newName"
          data-row="${index}"
          data-col="1"
          placeholder="${item.keepOriginal ? "Nome original mantido" : "Nome do arquivo..."}"
          ${nameDisabled}
        />
      </td>
      <td>
        <input 
          type="text" 
          class="editable-input" 
          value="${item.description}" 
          data-index="${index}" 
          data-field="description"
          data-row="${index}"
          data-col="2"
          placeholder="Descrição do arquivo..."
        />
      </td>
      <td style="text-align: center;">
        <button 
          class="btn btn-small" 
          onclick="copyDescription(${index})"
          title="Copiar descrição"
          style="padding: 4px 8px; font-size: 9px;"
          ${!item.description ? "disabled" : ""}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </td>
    `;

    editableTableBody.appendChild(row);
  });

  // Event listeners para inputs
  document.querySelectorAll(".editable-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const index = parseInt(e.target.dataset.index);
      const field = e.target.dataset.field;

      // Só atualizar o fileData se não for um campo desabilitado
      if (!e.target.disabled) {
        fileData[index][field] = e.target.value;
        updateButtonStates();
      }

      // Atualizar estado do botão de copiar quando descrição muda
      if (field === "description") {
        const row = e.target.closest("tr");
        const copyBtn = row.querySelector(
          'button[onclick*="copyDescription"]',
        );
        if (copyBtn) {
          copyBtn.disabled = !e.target.value.trim();
        }
      }
    });

    input.addEventListener("focus", (e) => {
      currentCell.row = parseInt(e.target.dataset.row);
      currentCell.col = parseInt(e.target.dataset.col);
    });
  });

  updateTableHighlight();
}

// Atualizar linha específica da tabela (APENAS quando dados são efetivamente salvos)
function updateTableRow(index) {
  const row = document.querySelector(`tr[data-index="${index}"]`);
  if (!row) return;

  const nameInput = row.querySelector('input[data-field="newName"]');
  const descInput = row.querySelector('input[data-field="description"]');
  const copyBtn = row.querySelector('button[onclick*="copyDescription"]');

  // Atualizar com os dados salvos no fileData
  if (nameInput && !fileData[index].keepOriginal) {
    nameInput.value = fileData[index].newName || "";
    nameInput.disabled = false;
  } else if (nameInput && fileData[index].keepOriginal) {
    nameInput.value = fileData[index].originalName;
    nameInput.disabled = true;
  }

  if (descInput) descInput.value = fileData[index].description || "";

  // Atualizar estado do botão de copiar
  if (copyBtn) {
    copyBtn.disabled = !fileData[index].description;
  }
}

// Destacar linha atual
function updateTableHighlight() {
  document.querySelectorAll("tr[data-index]").forEach((row) => {
    row.classList.remove("current-row");
  });

  if (currentFileIndex !== -1) {
    const currentRow = document.querySelector(
      `tr[data-index="${currentFileIndex}"]`,
    );
    if (currentRow) currentRow.classList.add("current-row");
  }
}

// Navegação tipo Excel
function handleKeyNavigation(e) {
  const activeElement = document.activeElement;
  if (!activeElement.classList.contains("editable-input")) return;

  if (e.key === "Tab") {
    e.preventDefault();
    navigateCell(e.shiftKey ? -1 : 1, 0);
  } else if (e.key === "Enter") {
    e.preventDefault();
    navigateCell(0, 1);
  } else if (e.key === "Escape") {
    closeModal();
  }
}

function navigateCell(colDelta, rowDelta) {
  let newRow = currentCell.row + rowDelta;
  let newCol = currentCell.col + colDelta;

  // Ajustar limites
  if (newCol < 1) {
    newCol = 2;
    newRow--;
  }
  if (newCol > 2) {
    newCol = 1;
    newRow++;
  }
  if (newRow < 0) newRow = fileData.length - 1;
  if (newRow >= fileData.length) newRow = 0;

  // Focar nova célula
  const newInput = document.querySelector(
    `input[data-row="${newRow}"][data-col="${newCol}"]`,
  );
  if (newInput && !newInput.disabled) {
    newInput.focus();
    currentCell = { row: newRow, col: newCol };
  }
}

// Estados dos botões
function updateButtonStates() {
  const hasFiles = files.length > 0;
  const hasAllNames =
    fileData.length > 0 &&
    fileData.every(
      (item) => item.newName.trim() !== "" || item.keepOriginal,
    );

  applyCurrentBtn.disabled = currentFileIndex === -1;
  applyAllBtn.disabled = !hasFiles;
  exportCsvBtn.disabled = !hasFiles;
  downloadBtn.disabled = !hasAllNames;
}

// Copiar descrição
function copyDescription(index) {
  const description = fileData[index].description;
  if (!description) {
    showMessage("Não há descrição para copiar.", "error");
    return;
  }

  navigator.clipboard
    .writeText(description)
    .then(() => {
      showMessage(
        "Descrição copiada para a área de transferência!",
        "success",
      );
    })
    .catch(() => {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea");
      textArea.value = description;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showMessage(
          "Descrição copiada para a área de transferência!",
          "success",
        );
      } catch (err) {
        showMessage("Erro ao copiar descrição.", "error");
      }
      document.body.removeChild(textArea);
    });
}

// Exportar CSV
function exportToCsv() {
  if (files.length === 0) {
    showMessage("Não há arquivos para exportar.", "error");
    return;
  }

  let csvContent = "Nome Original\tNovo Nome\tDescrição\tTipo\n";
  fileData.forEach((item) => {
    const type = item.keepOriginal
      ? "Nome Original Mantido"
      : "Renomeado";
    const newName = item.keepOriginal ? item.originalName : item.newName;
    csvContent += `${item.originalName}\t${newName}\t${item.description}\t${type}\n`;
  });

  const blob = new Blob([csvContent], {
    type: "text/plain;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "lista_arquivos_renomeados.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showMessage("CSV exportado com sucesso!", "success");
}

// Download ZIP
function downloadFiles() {
  const hasAllNames = fileData.every(
    (item) => item.newName.trim() !== "" || item.keepOriginal,
  );

  if (!hasAllNames) {
    showMessage(
      "Todos os arquivos precisam ter um nome definido.",
      "error",
    );
    return;
  }

  // Verificar arquivos sem descrição
  const filesWithoutDescription = fileData.filter(
    (item) => !item.description.trim(),
  );

  if (filesWithoutDescription.length > 0) {
    const plural = filesWithoutDescription.length > 1 ? "s" : "";
    const message = `${filesWithoutDescription.length} arquivo${plural} sem descrição.\n\nDeseja continuar mesmo assim?`;

    showModal(message, () => {
      proceedWithDownload();
    });
    return;
  }

  // Prosseguir diretamente se todos têm descrição
  proceedWithDownload();
}

// Função separada para fazer o download
function proceedWithDownload() {
  loadJSZip(() => {
    const zip = new JSZip();
    const promises = fileData.map((item) => {
      return new Promise((resolve) => {
        const finalName = item.keepOriginal
          ? item.originalName
          : item.newName.trim() || item.originalName;

        const reader = new FileReader();
        reader.onload = (e) => {
          zip.file(finalName, e.target.result);
          resolve();
        };
        reader.readAsArrayBuffer(item.file);
      });
    });

    Promise.all(promises)
      .then(() => zip.generateAsync({ type: "blob" }))
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "arquivos_processados.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showMessage("ZIP baixado com sucesso!", "success");
      })
      .catch((error) => {
        showMessage("Erro ao criar ZIP: " + error.message, "error");
      });
  });
}

// Mostrar modal de confirmação
function showModal(message, onConfirm) {
  modalMessage.textContent = message;
  modalOverlay.style.display = "flex";

  // Atualizar referência para o botão de confirmação
  const confirmBtn = document.getElementById("modalConfirm");

  // Remover listeners anteriores e adicionar novo
  confirmBtn.onclick = () => {
    closeModal();
    onConfirm();
  };
}

// Fechar modal
function closeModal() {
  modalOverlay.style.display = "none";
}

// Carregar JSZip
function loadJSZip(callback) {
  if (window.JSZip) {
    callback();
    return;
  }
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
  script.onload = callback;
  script.onerror = () => showMessage("Erro ao carregar JSZip.", "error");
  document.head.appendChild(script);
}

// Reset
function resetAll() {
  files = [];
  fileData = [];
  currentFileIndex = -1;
  customNumberingPattern = null;
  fileInput.value = "";
  prefixInput.value = "";
  suffixInput.value = "";
  addNumbering.checked = true;
  separatorSelect.value = ", ";
  keepOriginalName.checked = false;

  // Reabilitar controles
  toggleNameControls();

  document
    .querySelectorAll(
      'input[type="checkbox"][id^="elemento_"], input[type="checkbox"][id^="dano_"], input[type="checkbox"][id^="localizacao_]',
    )
    .forEach((cb) => (cb.checked = false));

  selectedOrder = [];
  fileCounter.textContent = "0 arquivos";
  currentFileSection.style.display = "none";
  progressInfo.textContent = "-";

  updateTable();
  updatePreviews();
  updateButtonStates();
  showMessage("Sistema resetado!", "success");
}

// Mostrar mensagens
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = "block";
  setTimeout(() => (messageDiv.style.display = "none"), 3000);
}
