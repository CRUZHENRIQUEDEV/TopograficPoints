/**
 * Sistema de Renomeação de Arquivos - Main Module
 * Protegido com gate de execução
 */

// GATE DE PROTEÇÃO - Executar antes de qualquer lógica
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

// Elementos DOM
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const newNamesTextarea = document.getElementById("newNames");
const previewBtn = document.getElementById("previewBtn");
const previewBody = document.getElementById("previewBody");
const renameBtn = document.getElementById("renameBtn");
const messageDiv = document.getElementById("message");

// Array para armazenar arquivos
let files = [];

// Event listeners
fileInput.addEventListener("change", handleFileSelect);
previewBtn.addEventListener("click", generatePreview);
renameBtn.addEventListener("click", renameAndDownload);

// Variáveis para drag and drop
let draggedItem = null;

// Função para lidar com a seleção de arquivos
function handleFileSelect(e) {
  // Limpar array de arquivos
  files = [];

  // Adicionar novos arquivos
  Array.from(e.target.files).forEach((file) => {
    files.push(file);
  });

  // Atualizar a lista de arquivos
  updateFileList();
}

// Função para atualizar a lista de arquivos
function updateFileList() {
  // Limpar a lista
  fileList.innerHTML = "";

  // Mostrar mensagem se não houver arquivos
  if (files.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-message";
    emptyMessage.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
      <p>Nenhum arquivo selecionado</p>
      <p>Clique no botão acima para escolher arquivos</p>
    `;
    fileList.appendChild(emptyMessage);
    return;
  }

  // Adicionar cada arquivo à lista
  files.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "file-item";
    item.draggable = true;
    item.dataset.index = index;

    // Adicionar eventos de drag and drop
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("dragenter", handleDragEnter);
    item.addEventListener("dragleave", handleDragLeave);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);

    const fileIcon = document.createElement("div");
    fileIcon.className = "file-icon";
    fileIcon.innerHTML = "≡";

    const fileName = document.createElement("div");
    fileName.className = "file-name";
    fileName.textContent = file.name;

    const fileControls = document.createElement("div");
    fileControls.className = "file-controls";

    const moveUpBtn = document.createElement("button");
    moveUpBtn.className = "btn-move";
    moveUpBtn.innerHTML = "↑";
    moveUpBtn.title = "Mover para cima";
    moveUpBtn.disabled = index === 0;
    moveUpBtn.addEventListener("click", () => moveFile(index, "up"));

    const moveDownBtn = document.createElement("button");
    moveDownBtn.className = "btn-move";
    moveDownBtn.innerHTML = "↓";
    moveDownBtn.title = "Mover para baixo";
    moveDownBtn.disabled = index === files.length - 1;
    moveDownBtn.addEventListener("click", () => moveFile(index, "down"));

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove";
    removeBtn.innerHTML = "×";
    removeBtn.title = "Remover";
    removeBtn.addEventListener("click", () => removeFile(index));

    fileControls.appendChild(moveUpBtn);
    fileControls.appendChild(moveDownBtn);
    fileControls.appendChild(removeBtn);

    item.appendChild(fileIcon);
    item.appendChild(fileName);
    item.appendChild(fileControls);

    fileList.appendChild(item);
  });
}

// Função para mover um arquivo para cima ou para baixo
function moveFile(index, direction) {
  if (direction === "up" && index > 0) {
    // Trocar com o arquivo acima
    const temp = files[index];
    files[index] = files[index - 1];
    files[index - 1] = temp;
  } else if (direction === "down" && index < files.length - 1) {
    // Trocar com o arquivo abaixo
    const temp = files[index];
    files[index] = files[index + 1];
    files[index + 1] = temp;
  }

  // Atualizar a lista
  updateFileList();
}

// Função para remover um arquivo
function removeFile(index) {
  // Remover do array
  files.splice(index, 1);

  // Atualizar a lista
  updateFileList();
}

// Função para gerar a visualização
function generatePreview() {
  // Limpar a tabela
  previewBody.innerHTML = "";

  // Verificar se há arquivos
  if (files.length === 0) {
    showMessage("Adicione arquivos primeiro.", "error");
    return;
  }

  // Obter novos nomes
  const namesText = newNamesTextarea.value.trim();
  if (!namesText) {
    showMessage("Adicione os novos nomes na área de texto.", "error");
    return;
  }

  // Processar os nomes (pegando a primeira coluna se forem dados tabulados)
  const newNames = namesText.split("\n").map((line) => {
    const parts = line.split("\t");
    return parts[0].trim();
  });

  // Verificar se há nomes suficientes
  if (newNames.length < files.length) {
    showMessage(
      `Nomes insuficientes: ${files.length} arquivos, mas apenas ${newNames.length} nomes.`,
      "error",
    );
    return;
  }

  // Gerar a visualização
  files.forEach((file, index) => {
    const ext = file.name.substring(file.name.lastIndexOf("."));
    const newName = newNames[index] + ext;

    const row = document.createElement("tr");

    const oldNameCell = document.createElement("td");
    oldNameCell.textContent = file.name;

    const newNameCell = document.createElement("td");
    newNameCell.textContent = newName;

    row.appendChild(oldNameCell);
    row.appendChild(newNameCell);

    previewBody.appendChild(row);
  });

  // Habilitar o botão de renomear
  renameBtn.disabled = false;

  // Mostrar mensagem de sucesso
  showMessage("Visualização gerada com sucesso!", "success");
}

// Função para renomear e baixar arquivos
function renameAndDownload() {
  // Verificar se há arquivos
  if (files.length === 0) {
    showMessage("Adicione arquivos primeiro.", "error");
    return;
  }

  // Verificar se há visualização
  if (previewBody.children.length === 0) {
    showMessage("Gere a visualização primeiro.", "error");
    return;
  }

  // Carregar JSZip dinamicamente
  loadJSZip(() => {
    // Obter novos nomes
    const namesText = newNamesTextarea.value.trim();
    const newNames = namesText.split("\n").map((line) => {
      const parts = line.split("\t");
      return parts[0].trim();
    });

    // Criar o ZIP
    const zip = new JSZip();

    // Adicionar cada arquivo ao ZIP com o novo nome
    const promises = files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const ext = file.name.substring(file.name.lastIndexOf("."));
          const newName = newNames[index] + ext;
          zip.file(newName, e.target.result);
          resolve();
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    });

    // Quando todos os arquivos forem adicionados
    Promise.all(promises)
      .then(() => {
        return zip.generateAsync({ type: "blob" });
      })
      .then((blob) => {
        // Criar um link para download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "arquivos_renomeados.zip";

        // Clicar no link
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Mostrar mensagem de sucesso
        showMessage("Arquivos renomeados e baixados com sucesso!", "success");
      })
      .catch((error) => {
        showMessage("Erro ao criar o ZIP: " + error.message, "error");
      });
  });
}

// Função para carregar JSZip dinamicamente
function loadJSZip(callback) {
  // Verificar se JSZip já está carregado
  if (window.JSZip) {
    callback();
    return;
  }

  // Criar script para carregar JSZip
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
  script.onload = callback;
  script.onerror = () => {
    showMessage(
      "Erro ao carregar JSZip. Verifique sua conexão com a internet.",
      "error",
    );
  };

  // Adicionar o script à página
  document.head.appendChild(script);
}

// Funções para drag and drop
function handleDragStart(e) {
  draggedItem = this;
  this.classList.add("dragging");

  // Definir os dados a serem transferidos
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.dataset.index);

  // Para melhorar a aparência do elemento arrastado
  setTimeout(() => {
    this.style.opacity = "0.5";
  }, 0);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleDragEnter(e) {
  this.classList.add("drag-over");
}

function handleDragLeave(e) {
  this.classList.remove("drag-over");
}

function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();

  // Remover a classe de highlight
  this.classList.remove("drag-over");

  // Não fazer nada se arrastar sobre si mesmo
  if (draggedItem === this) {
    return;
  }

  // Obter o índice de origem e destino
  const fromIndex = parseInt(draggedItem.dataset.index);
  const toIndex = parseInt(this.dataset.index);

  // Reorganizar o array de arquivos
  const temp = files[fromIndex];

  if (fromIndex < toIndex) {
    // Movendo para baixo
    for (let i = fromIndex; i < toIndex; i++) {
      files[i] = files[i + 1];
    }
  } else {
    // Movendo para cima
    for (let i = fromIndex; i > toIndex; i--) {
      files[i] = files[i - 1];
    }
  }

  files[toIndex] = temp;

  // Atualizar a interface
  updateFileList();
}

function handleDragEnd(e) {
  // Restaurar a aparência do item
  this.style.opacity = "1";

  // Remover a classe de todos os itens
  document.querySelectorAll(".file-item").forEach((item) => {
    item.classList.remove("dragging");
    item.classList.remove("drag-over");
  });

  draggedItem = null;
}

// Função para mostrar mensagens
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = "block";

  // Ocultar após 5 segundos
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 5000);
}

// Inicializar a lista vazia
updateFileList();
