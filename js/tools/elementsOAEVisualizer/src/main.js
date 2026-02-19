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

const copiedState = {};
let globalData = {};
let columnNames = [];
let orderByType = {};
let typesWithChangedOrder = new Set();
let orderHistory = [];
let historyIndex = -1;
let hasIDColumn = false;

// Dicionário de ordenação customizada para tipos específicos (usando nomes EXATOS do CSV)
const customDimensionOrder = {
  "REFORÇO PILAR - ENCAMISAMENTO DE PILAR": [
    "COMPRIMENTO_X",
    "LARGURA_Z",
    "ESPESSURA_Z",
    "ALTURA_Y",
  ],
  "REVESTIMENTO DE TALUDE EM CONCRETO": [
    "LARGURA_X",
    "ESPESSURA_Z",
    "ALTURA_Z",
  ],
};

// Verifica se um tipo tem ordenação customizada fixa
function hasCustomOrder(typeName) {
  return customDimensionOrder.hasOwnProperty(typeName);
}

// Retorna as dimensões na ordem correta (customizada ou original)
function getOrderedDimensions(typeName, dimensions) {
  // Se não tem ordem customizada, retorna como está
  if (!hasCustomOrder(typeName)) {
    return dimensions;
  }

  // Aplica a ordem customizada
  const customOrder = customDimensionOrder[typeName];
  const orderedDimensions = [];

  // Primeiro, adiciona as dimensões na ordem customizada
  customOrder.forEach((dimensionName) => {
    const found = dimensions.find((dim) => dim.name === dimensionName);
    if (found) {
      orderedDimensions.push(found);
    }
  });

  // Depois, adiciona qualquer dimensão que não estava na ordem customizada (caso existam extras)
  dimensions.forEach((dim) => {
    if (!customOrder.includes(dim.name)) {
      orderedDimensions.push(dim);
    }
  });

  return orderedDimensions;
}

// Carrega arquivo via input
document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      document.getElementById("csvInput").value = event.target.result;
    };
    reader.readAsText(file);
  }
});

// Drag and Drop
const uploadArea = document.querySelector(".upload-area");

uploadArea.addEventListener("dragover", function (e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.add("drag-over");
});

uploadArea.addEventListener("dragleave", function (e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove("drag-over");
});

uploadArea.addEventListener("drop", function (e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove("drag-over");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (
      file.name.endsWith(".csv") ||
      file.name.endsWith(".txt") ||
      file.type === "text/plain" ||
      file.type === "text/csv"
    ) {
      const reader = new FileReader();
      reader.onload = function (event) {
        document.getElementById("csvInput").value = event.target.result;
        showToast("File loaded successfully!");
      };
      reader.readAsText(file);
    } else {
      showToast("Please drop a CSV or TXT file", "error");
    }
  }
});

// Atalhos de teclado
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key === "z") {
    e.preventDefault();
    undoOrder();
  } else if (e.ctrlKey && e.key === "y") {
    e.preventDefault();
    redoOrder();
  }
});

// Normaliza valores removendo espaços
function normalizeValue(value) {
  if (!value || typeof value !== "string") return value;
  return value.trim();
}

// Detecta separador (tab ou ponto-vírgula)
function detectSeparator(lines) {
  for (let line of lines.slice(0, 10)) {
    if (!line || line.trim() === "") continue;
    if (line.includes("\t")) return "\t";
    if (line.includes(";")) return ";";
  }
  return "\t";
}

// Processa os dados do CSV
function processData() {
  const csvText = document.getElementById("csvInput").value;
  if (!csvText || csvText.trim() === "") {
    showToast("Please load or paste data first!", "error");
    return;
  }

  const lines = csvText.split("\n");
  const separator = detectSeparator(lines);

  let currentSpan = null;
  let currentGroup = null;
  const data = {};
  columnNames = [];
  hasIDColumn = false;

  lines.forEach((line, lineIndex) => {
    if (!line || line.trim() === "") return;

    const parts = line.split(separator);
    const lineUpper = line.toUpperCase();

    // Detecta cabeçalho
    if (lineUpper.includes("CODIGO") && lineUpper.includes("NOME DO TIPO")) {
      columnNames = parts.map((p) => p.trim()).filter((p) => p !== "");
      hasIDColumn = columnNames.some((col) => col.toUpperCase() === "ID");
      console.log("Header detected:", columnNames);
      return;
    }

    // Ignora linhas de cabeçalho gerais
    if (
      lineUpper.includes("ELEMENTOS SGE") ||
      lineUpper.includes("GRAND TOTAL") ||
      lineUpper.includes("EXPORTAR")
    ) {
      return;
    }

    // Detecta span COMPLEMENTAR
    const firstColumn = parts[0]?.trim().toUpperCase();
    if (firstColumn === "COMPLEMENTAR" && !lineUpper.includes("ELEMENTOS")) {
      currentSpan = "COMPLEMENTAR";
      currentGroup = null;
      return;
    }

    // Detecta spans TRAMO
    if (lineUpper.match(/^TRAMO\s+\d+/) && !lineUpper.includes("ELEMENTOS")) {
      currentSpan = lineUpper.match(/TRAMO\s+\d+/)[0];
      currentGroup = null;
      return;
    }

    // Detecta grupos de elementos
    if (
      lineUpper.includes("ELEMENTOS DE") ||
      lineUpper.includes("ELEMENTOS COMPLEMENTARES")
    ) {
      const groupText = parts.find((p) =>
        p.trim().toUpperCase().includes("ELEMENTOS"),
      );
      if (groupText) {
        currentGroup = groupText.trim().toUpperCase();
      }
      return;
    }

    // Processa elementos
    if (currentSpan && currentGroup && columnNames.length > 0) {
      let id = "";
      let mark = "";
      let code = "";
      let typeName = "";
      let transition = "";
      let dimensionsStart = 3;

      const col0 = parts[0]?.trim() || "";
      const col1 = parts[1]?.trim() || "";
      const col2 = parts[2]?.trim() || "";
      const col3 = parts[3]?.trim() || "";

      // Determina estrutura baseado no cabeçalho
      if (hasIDColumn) {
        id = col0;
        code = col1;
        typeName = col2;
        transition = col3;
        dimensionsStart = 4;
      } else {
        // Sem coluna ID - detecta estrutura dinamicamente
        if (
          col0 &&
          col1 &&
          col2 &&
          !col2.match(/^\d+(\.\d+)?$/) &&
          !col2.match(/^TRANSIÇÃO/i)
        ) {
          mark = col0;
          code = col1;
          typeName = col2;
          transition = col3;
          dimensionsStart = 4;
        } else if (!col0 && col1 && col2 && !col2.match(/^\d+(\.\d+)?$/)) {
          mark = "";
          code = col1;
          typeName = col2;
          transition = col3;
          dimensionsStart = 4;
        } else if (!col0 && col1 && !col2.match(/^\d+(\.\d+)?$/)) {
          mark = "";
          code = "";
          typeName = col1;
          transition = col2;
          dimensionsStart = 3;
        } else if (col0 && col1 && !col1.match(/^\d+(\.\d+)?$/)) {
          mark = "";
          code = col0;
          typeName = col1;
          transition = col2;
          dimensionsStart = 3;
        }
      }

      // Valida nome do tipo
      if (typeName && typeName !== "" && typeName !== "NOME DO TIPO") {
        const dimensions = [];

        // Extrai dimensões usando os nomes das colunas
        for (let i = dimensionsStart; i < parts.length; i++) {
          const rawValue = parts[i]?.trim();
          if (rawValue && rawValue !== "") {
            const value = normalizeValue(rawValue);
            const columnName = columnNames[i] || `DIM_${i}`;
            dimensions.push({
              name: columnName,
              value: value,
            });
          }
        }

        // Agrupa por transição se aplicável
        let finalGroup = currentGroup;
        if (
          currentGroup.includes("TRANSIÇÃO") &&
          transition &&
          transition.match(/TRANSIÇÃO/i)
        ) {
          finalGroup = `${currentGroup} - ${transition}`;
        }

        // Adiciona aos dados
        if (!data[currentSpan]) data[currentSpan] = {};
        if (!data[currentSpan][finalGroup]) data[currentSpan][finalGroup] = {};
        if (!data[currentSpan][finalGroup][typeName])
          data[currentSpan][finalGroup][typeName] = [];

        data[currentSpan][finalGroup][typeName].push({
          id,
          mark,
          code,
          transition,
          dimensions,
        });
      }
    }
  });

  globalData = data;
  renderData(data);
}

// Renderiza os dados na tela
function renderData(data) {
  const output = document.getElementById("output");
  output.innerHTML = "";

  const groupOrder = {
    "ELEMENTOS DE TRANSIÇÃO": 1,
    "ELEMENTOS DE SUPERESTRUTURA": 2,
    "ELEMENTOS DE APOIO": 3,
    "ELEMENTOS COMPLEMENTARES": 4,
  };

  Object.keys(data).forEach((span) => {
    // Conta total de elementos no span
    let totalSpanElements = 0;
    Object.keys(data[span]).forEach((group) => {
      Object.keys(data[span][group]).forEach((typeName) => {
        totalSpanElements += data[span][group][typeName].length;
      });
    });

    // Cria card do span
    const spanCard = document.createElement("div");
    spanCard.className = "span-card";

    const spanHeader = document.createElement("div");
    spanHeader.className = "span-header";
    spanHeader.innerHTML = `
      <span>${span}</span>
      <div class="span-info">
        <span class="counter-badge">Span Subtotal: ${totalSpanElements}</span>
        <span class="collapse-icon">▼</span>
      </div>
    `;
    spanHeader.onclick = function () {
      spanCard.classList.toggle("collapsed");
    };

    const spanContent = document.createElement("div");
    spanContent.className = "span-content";

    // Ordena grupos
    const sortedGroups = Object.keys(data[span]).sort((a, b) => {
      const getOrder = (group) => {
        if (group.includes("TRANSIÇÃO - TRANSIÇÃO")) {
          const match = group.match(/TRANSIÇÃO\s+(\d+)/);
          const transitionNumber = match ? parseInt(match[1]) : 99;
          return [1, transitionNumber];
        }
        const basePriority =
          groupOrder[group.split(" - ")[0]] || groupOrder[group] || 999;
        return [basePriority, 0];
      };

      const [prioA, subA] = getOrder(a);
      const [prioB, subB] = getOrder(b);

      if (prioA !== prioB) return prioA - prioB;
      return subA - subB;
    });

    sortedGroups.forEach((group) => {
      // Conta elementos no grupo
      let totalGroupElements = 0;
      Object.keys(data[span][group]).forEach((typeName) => {
        totalGroupElements += data[span][group][typeName].length;
      });

      // Cria seção do grupo
      const groupSection = document.createElement("div");
      groupSection.className = "group-section";

      const groupTitle = document.createElement("div");
      groupTitle.className = "group-title";
      groupTitle.innerHTML = `
        <span>${group}</span>
        <div class="group-title-info">
          <span class="group-counter">Group Subtotal: ${totalGroupElements}</span>
          <span class="group-collapse-icon">▼</span>
        </div>
      `;
      groupTitle.onclick = function () {
        groupSection.classList.toggle("collapsed");
      };
      groupSection.appendChild(groupTitle);

      // Ordena tipos por ID (4 dígitos)
      const sortedTypes = Object.keys(data[span][group]).sort(
        (typeA, typeB) => {
          const elementsA = data[span][group][typeA];
          const elementsB = data[span][group][typeB];

          const idA = elementsA[0]?.id || "";
          const idB = elementsB[0]?.id || "";

          // Se ambos têm ID numérico, ordena numericamente
          if (idA.match(/^\d+$/) && idB.match(/^\d+$/)) {
            return parseInt(idA) - parseInt(idB);
          }

          // IDs numéricos vêm primeiro
          if (idA.match(/^\d+$/)) return -1;
          if (idB.match(/^\d+$/)) return 1;

          // Senão, ordena alfabeticamente
          return idA.localeCompare(idB);
        },
      );

      // Processa cada tipo de elemento
      sortedTypes.forEach((typeName) => {
        const elements = data[span][group][typeName];

        // Ordena elementos por CÓDIGO (2 dígitos) em ordem crescente
        elements.sort((a, b) => {
          const codeA = a.code || a.mark || "";
          const codeB = b.code || b.mark || "";

          // Prioridade 1: Elementos com código vêm primeiro
          if (codeA && !codeB) return -1;
          if (!codeA && codeB) return 1;

          // Prioridade 2: Se ambos têm código, ordena numericamente
          if (codeA && codeB) {
            if (codeA.match(/^\d+$/) && codeB.match(/^\d+$/)) {
              return parseInt(codeA) - parseInt(codeB);
            }
            return codeA.localeCompare(codeB);
          }

          // Prioridade 3: Se nenhum tem código, mantém ordem original
          return 0;
        });

        const elementKey = `${span}_${group}_${typeName}`;
        const isFixedOrder = hasCustomOrder(typeName);

        // Cria grupo de elementos
        const elementGroup = document.createElement("div");
        elementGroup.className = "element-group";
        if (copiedState[elementKey]) {
          elementGroup.classList.add("copied");
        }
        if (typesWithChangedOrder.has(typeName)) {
          elementGroup.classList.add("order-changed");
        }
        if (isFixedOrder) {
          elementGroup.classList.add("fixed-order");
        }

        // Header do elemento
        const elementHeader = document.createElement("div");
        elementHeader.className = "element-header";

        const elementName = document.createElement("div");
        elementName.className = "element-name";
        elementName.innerHTML = `
          <span>${typeName}</span>
          <span class="element-counter">Qty: ${elements.length}</span>
        `;

        // Controles de ordem (apenas para tipos sem ordem fixa)
        if (!isFixedOrder) {
          const orderControls = document.createElement("div");
          orderControls.className = "order-controls";

          const orderLabel = document.createElement("span");
          orderLabel.textContent = "Dimension Order:";
          orderControls.appendChild(orderLabel);

          let referenceDimensions = [...elements[0].dimensions];
          if (orderByType[typeName]) {
            const newOrder = [];
            orderByType[typeName].forEach((index) => {
              if (elements[0].dimensions[index]) {
                newOrder.push(elements[0].dimensions[index]);
              }
            });
            referenceDimensions = newOrder;
          }

          referenceDimensions.forEach((dim, idx) => {
            const btnMoveLeft = document.createElement("button");
            btnMoveLeft.className = "btn-arrow";
            btnMoveLeft.innerHTML = "←";
            btnMoveLeft.disabled = idx === 0;
            btnMoveLeft.title = `Move ${dim.name} left`;
            btnMoveLeft.onclick = () =>
              moveDimension(span, group, typeName, 0, idx, -1);

            const labelDim = document.createElement("span");
            labelDim.textContent = dim.name;
            labelDim.style.fontSize = "10px";
            labelDim.style.color = "#ecf0f1";

            const btnMoveRight = document.createElement("button");
            btnMoveRight.className = "btn-arrow";
            btnMoveRight.innerHTML = "→";
            btnMoveRight.disabled = idx === referenceDimensions.length - 1;
            btnMoveRight.title = `Move ${dim.name} right`;
            btnMoveRight.onclick = () =>
              moveDimension(span, group, typeName, 0, idx, 1);

            orderControls.appendChild(btnMoveLeft);
            orderControls.appendChild(labelDim);
            orderControls.appendChild(btnMoveRight);
          });

          elementHeader.appendChild(elementName);
          elementHeader.appendChild(orderControls);
        } else {
          // Badge de ordem fixa
          const fixedBadge = document.createElement("div");
          fixedBadge.className = "fixed-order-badge";
          fixedBadge.innerHTML = "🔒 Fixed Order";
          fixedBadge.title =
            "This element type has a predefined dimension order";

          elementHeader.appendChild(elementName);
          elementHeader.appendChild(fixedBadge);
        }

        // Botão copy
        const btnCopy = document.createElement("button");
        btnCopy.className = "btn-copy";
        if (copiedState[elementKey]) {
          btnCopy.classList.add("copied");
        }
        btnCopy.innerHTML = copiedState[elementKey]
          ? "✓ Copied"
          : "Copy Dimensions";
        btnCopy.onclick = () =>
          copyDimensions(elements, typeName, elementKey, btnCopy, elementGroup);

        elementHeader.appendChild(btnCopy);

        // Lista de itens
        const elementItems = document.createElement("div");
        elementItems.className = "element-items";

        elements.forEach((item, itemIndex) => {
          const elementItem = document.createElement("div");
          elementItem.className = "element-item";

          // ID e Code
          const idCodeDiv = document.createElement("div");
          idCodeDiv.className = "item-id-code";

          if (item.id) {
            const idSpan = document.createElement("div");
            idSpan.className = "item-id";
            idSpan.textContent = item.id;
            idCodeDiv.appendChild(idSpan);
          }

          const identifier = item.code || item.mark || "";
          if (identifier) {
            const codeSpan = document.createElement("div");
            codeSpan.className = "item-code";
            codeSpan.textContent = identifier;
            idCodeDiv.appendChild(codeSpan);
          }

          elementItem.appendChild(idCodeDiv);

          // Nome
          const infoDiv = document.createElement("div");
          infoDiv.className = "item-info";

          const name = document.createElement("div");
          name.className = "item-name";
          name.textContent = typeName;
          infoDiv.appendChild(name);

          elementItem.appendChild(infoDiv);

          // Dimensões com ordem customizada aplicada
          const dimensionsDiv = document.createElement("div");
          dimensionsDiv.className = "item-dimensions";

          let sortedDimensions = [...item.dimensions];

          // Aplica ordem customizada se existir
          if (isFixedOrder) {
            sortedDimensions = getOrderedDimensions(typeName, sortedDimensions);
          } else if (orderByType[typeName]) {
            // Aplica ordem manual se existir
            const newOrder = [];
            orderByType[typeName].forEach((index) => {
              if (sortedDimensions[index]) {
                newOrder.push(sortedDimensions[index]);
              }
            });
            sortedDimensions = newOrder;
          }

          sortedDimensions.forEach((dim, dimDisplayIndex) => {
            const wrapper = document.createElement("div");
            wrapper.className = "dimension-wrapper";

            const label = document.createElement("div");
            label.className = "dimension-label";
            label.textContent = dim.name;
            wrapper.appendChild(label);

            const originalIndex = item.dimensions.findIndex(
              (d) => d.name === dim.name && d.value === dim.value,
            );

            const dimension = document.createElement("span");
            dimension.className = "dimension";
            dimension.textContent = dim.value;
            dimension.title = "Click to edit";
            dimension.onclick = function () {
              editDimension(
                dimension,
                span,
                group,
                typeName,
                itemIndex,
                originalIndex,
              );
            };

            wrapper.appendChild(dimension);
            dimensionsDiv.appendChild(wrapper);
          });

          elementItem.appendChild(dimensionsDiv);
          elementItems.appendChild(elementItem);
        });

        elementGroup.appendChild(elementHeader);
        elementGroup.appendChild(elementItems);
        groupSection.appendChild(elementGroup);
      });

      spanContent.appendChild(groupSection);
    });

    spanCard.appendChild(spanHeader);
    spanCard.appendChild(spanContent);
    output.appendChild(spanCard);
  });

  showToast("Data processed successfully!");
}

// Move dimensão (não funciona para tipos com ordem fixa)
function moveDimension(span, group, typeName, itemIndex, dimIndex, direction) {
  // Bloqueia movimento para tipos com ordem fixa
  if (hasCustomOrder(typeName)) {
    showToast(
      "Cannot reorder dimensions for this element type (fixed order)",
      "error",
    );
    return;
  }

  const newIndex = dimIndex + direction;

  const referenceItem = globalData[span][group][typeName][itemIndex];
  const totalDimensions = referenceItem.dimensions.length;

  if (!orderByType[typeName]) {
    orderByType[typeName] = Array.from(
      { length: totalDimensions },
      (_, i) => i,
    );
  }

  const previousState = {
    typeName: typeName,
    order: [...orderByType[typeName]],
    changedTypes: new Set(typesWithChangedOrder),
  };

  if (historyIndex < orderHistory.length - 1) {
    orderHistory = orderHistory.slice(0, historyIndex + 1);
  }

  orderHistory.push(previousState);
  historyIndex++;

  const tempOrder = orderByType[typeName][dimIndex];
  orderByType[typeName][dimIndex] = orderByType[typeName][newIndex];
  orderByType[typeName][newIndex] = tempOrder;

  typesWithChangedOrder.add(typeName);

  let totalAffected = 0;
  let affectedSpans = new Set();

  Object.keys(globalData).forEach((t) => {
    Object.keys(globalData[t]).forEach((g) => {
      if (globalData[t][g][typeName]) {
        globalData[t][g][typeName].forEach((element) => {
          const originalDimensions = [...element.dimensions];
          const reorderedDimensions = [];
          orderByType[typeName].forEach((originalIndex) => {
            if (originalDimensions[originalIndex]) {
              reorderedDimensions.push(originalDimensions[originalIndex]);
            }
          });
          element.dimensions = reorderedDimensions;
          totalAffected++;
        });
        affectedSpans.add(t);
      }
    });
  });

  renderData(globalData);
  showToast(
    `Order applied to ${totalAffected} elements in ${affectedSpans.size} span(s)`,
  );
}

// Desfazer ordem
function undoOrder() {
  if (historyIndex < 0) {
    showToast("Nothing to undo", "error");
    return;
  }

  const previousState = orderHistory[historyIndex];
  orderByType[previousState.typeName] = [...previousState.order];
  typesWithChangedOrder = new Set(previousState.changedTypes);

  historyIndex--;

  applyGlobalOrder(previousState.typeName);
  renderData(globalData);

  showToast("Undone");
}

// Refazer ordem
function redoOrder() {
  if (historyIndex >= orderHistory.length - 1) {
    showToast("Nothing to redo", "error");
    return;
  }

  historyIndex++;
  const nextState = orderHistory[historyIndex + 1];

  if (nextState) {
    orderByType[nextState.typeName] = [...nextState.order];
    typesWithChangedOrder = new Set(nextState.changedTypes);

    applyGlobalOrder(nextState.typeName);
    renderData(globalData);

    showToast("Redone");
  }
}

// Aplica ordem global
function applyGlobalOrder(typeName) {
  Object.keys(globalData).forEach((t) => {
    Object.keys(globalData[t]).forEach((g) => {
      if (globalData[t][g][typeName]) {
        globalData[t][g][typeName].forEach((element) => {
          const originalDimensions = [...element.dimensions];
          const reorderedDimensions = [];

          orderByType[typeName].forEach((originalIndex) => {
            if (originalDimensions[originalIndex]) {
              reorderedDimensions.push(originalDimensions[originalIndex]);
            }
          });

          element.dimensions = reorderedDimensions;
        });
      }
    });
  });
}

// Edita dimensão
function editDimension(
  spanElement,
  span,
  group,
  typeName,
  itemIndex,
  dimIndex,
) {
  const currentValue = spanElement.textContent;

  const input = document.createElement("input");
  input.type = "text";
  input.value = currentValue;
  input.style.width = "80px";

  spanElement.textContent = "";
  spanElement.appendChild(input);
  spanElement.classList.add("editing");

  input.focus();
  input.select();

  input.addEventListener("input", (e) => {
    const typedValue = e.target.value;
    const cleanValue = typedValue.replace(/[^0-9.,]/g, "");
    if (typedValue !== cleanValue) {
      e.target.value = cleanValue;
    }
  });

  const save = () => {
    const newValue = input.value.trim();
    if (newValue && /^[0-9.,]+$/.test(newValue)) {
      const normalizedValue = normalizeValue(newValue);
      globalData[span][group][typeName][itemIndex].dimensions[dimIndex].value =
        normalizedValue;
      spanElement.textContent = normalizedValue;
      spanElement.classList.remove("editing");
      showToast("Dimension updated!");
    } else if (newValue === "") {
      showToast("Empty value not allowed", "error");
      spanElement.textContent = currentValue;
      spanElement.classList.remove("editing");
    } else {
      showToast("Only numbers, comma and period allowed", "error");
      spanElement.textContent = currentValue;
      spanElement.classList.remove("editing");
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      save();
    } else if (e.key === "Escape") {
      spanElement.textContent = currentValue;
      spanElement.classList.remove("editing");
    }
  });

  input.addEventListener("blur", save);
}

// Copia dimensões (aplica ordem customizada se existir)
function copyDimensions(elements, typeName, key, btnElement, groupElement) {
  const lines = elements.map((item) => {
    // Aplica a ordem customizada antes de copiar
    const orderedDims = hasCustomOrder(typeName)
      ? getOrderedDimensions(typeName, item.dimensions)
      : item.dimensions;

    return orderedDims.map((d) => d.value).join("\t");
  });
  const allDimensions = lines.join("\n");

  navigator.clipboard
    .writeText(allDimensions)
    .then(() => {
      copiedState[key] = true;
      btnElement.classList.add("copied");
      btnElement.innerHTML = "✓ Copied";
      groupElement.classList.add("copied");
      showToast("Dimensions copied (Excel format)!");
    })
    .catch((err) => {
      showToast("Copy error!", "error");
    });
}

// Mostra toast
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.background =
    type === "error"
      ? "linear-gradient(45deg, #e74c3c, #c0392b)"
      : "linear-gradient(45deg, #2ecc71, #27ae60)";
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
