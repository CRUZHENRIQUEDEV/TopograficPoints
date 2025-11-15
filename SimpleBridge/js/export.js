/* ===== EXPORTAÇÃO E IMPORTAÇÃO ===== */

// Exportar para CSV
function exportToCSV() {
  try {
    const { isValid, missingFields } = validateForm();
    if (!isValid) {
      alert("Por favor, preencha todos os campos obrigatórios antes de exportar para CSV.");
      return;
    }

    const form = document.getElementById("oae-form");
    const formData = new FormData(form);
    const csvColumns = getCsvColumns();

    // Coletar campos personalizados
    document.querySelectorAll(".custom-field").forEach((field) => {
      const name = field.getAttribute("name");
      if (!csvColumns.includes(name)) {
        csvColumns.push(name);
      }
    });

    const data = {};
    csvColumns.forEach((column) => {
      data[column] = "";
    });

    for (let [key, value] of formData.entries()) {
      if (!key.startsWith("tramo-") && !key.startsWith("apoio-")) {
        data[key] = value;
      }
    }

    // Checkbox MODELADO
    data["MODELADO"] = document.getElementById("modelado").checked ? "TRUE" : "FALSE";

    // Coletar valores dos tramos
    const tramosValues = [];
    document.querySelectorAll(".tramo-field").forEach((field) => {
      tramosValues.push(field.value || "0.50");
    });
    data["COMPRIMENTO TRAMOS"] = tramosValues.join(";");

    // Coletar valores dos apoios
    const apoiosValues = [];
    document.querySelectorAll(".apoio-altura-field").forEach((field) => {
      apoiosValues.push(field.value || "0.00");
    });
    data["ALTURA APOIO"] = apoiosValues.join(";");

    // Construir CSV
    const csvContent =
      csvColumns.join(",") +
      "\n" +
      csvColumns
        .map((column) => {
          const value = data[column] || "";
          // Tratamento especial para CODIGO
          if (column === "CODIGO") {
            return `"${value}"`;
          }
          return value && value.includes(",") ? `"${value}"` : value;
        })
        .join(",");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OAE_${data["CODIGO"] || "nova"}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    alert("Erro ao exportar CSV: " + error.message);
  }
}

// Exportar todas as obras para CSV
function exportAllWorks() {
  try {
    if (!db) {
      alert("Banco de dados não está disponível.");
      return;
    }

    const transaction = db.transaction(["obras"], "readonly");
    const objectStore = transaction.objectStore("obras");
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
      const works = event.target.result;

      if (works.length === 0) {
        alert("Não há obras para exportar.");
        return;
      }

      const csvColumns = getCsvColumns();

      // Verificar campos personalizados
      works.forEach((work) => {
        Object.keys(work).forEach((field) => {
          if (!csvColumns.includes(field)) {
            csvColumns.push(field);
          }
        });
      });

      let csvContent = csvColumns.join("\t") + "\n";

      works.forEach((work) => {
        const row = csvColumns.map((column) => {
          const value = work[column] || "";
          if (column === "CODIGO") {
            return `"${value}"`;
          }
          return value && value.includes("\t") ? `"${value}"` : value;
        });
        csvContent += row.join("\t") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Todas_OAEs_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    request.onerror = function (event) {
      console.error("Erro ao exportar obras:", event.target.error);
      alert(`Erro ao exportar obras: ${event.target.error}`);
    };
  } catch (error) {
    console.error("Erro ao exportar todas as obras:", error);
    alert("Erro ao exportar todas as obras: " + error.message);
  }
}

// Importar múltiplas obras
function importMultipleWorks() {
  try {
    console.log("Iniciando função importMultipleWorks...");

    const oldInput = document.getElementById("import-multiple-works-input");
    if (oldInput) {
      document.body.removeChild(oldInput);
    }

    const fileInput = document.createElement("input");
    fileInput.id = "import-multiple-works-input";
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", function (event) {
      try {
        if (!this.files || this.files.length === 0) {
          console.warn("Nenhum arquivo selecionado");
          return;
        }

        const file = this.files[0];
        if (!file.name.toLowerCase().endsWith(".csv")) {
          alert("Por favor, selecione um arquivo CSV válido.");
          return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
          try {
            const csvData = e.target.result;
            if (!csvData || csvData.trim() === "") {
              alert("O arquivo CSV está vazio.");
              return;
            }

            const lines = csvData.split(/\r?\n/);
            if (lines.length < 2) {
              alert("O arquivo CSV não contém dados suficientes.");
              return;
            }

            const headerLine = lines[0];
            let separator = ",";
            if (headerLine.includes("\t")) separator = "\t";
            else if (headerLine.includes(";")) separator = ";";

            const headers = headerLine.split(separator).map((header) => header.trim());

            if (!headers.includes("CODIGO")) {
              alert("O arquivo CSV não contém o cabeçalho obrigatório 'CODIGO'.");
              return;
            }

            const works = [];

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;

              const values = parseCSVLine(line, separator);
              const workData = {};

              for (let j = 0; j < headers.length; j++) {
                if (j < values.length) {
                  workData[headers[j]] = values[j];
                }
              }

              if (workData["CODIGO"] && workData["CODIGO"].trim() !== "") {
                works.push(workData);
              }
            }

            if (works.length > 0) {
              if (confirm(`O arquivo contém ${works.length} obras. Deseja importar todas para o banco de dados?`)) {
                saveMultipleWorks(works);
              }
            } else {
              alert("Nenhuma obra válida encontrada no arquivo CSV.");
            }
          } catch (parseError) {
            console.error("Erro ao processar CSV:", parseError);
            alert("Erro ao processar o arquivo CSV: " + parseError.message);
          }
        };

        reader.onerror = function (errorEvent) {
          console.error("Erro na leitura do arquivo:", errorEvent);
          alert("Erro ao ler o arquivo.");
        };

        reader.readAsText(file);
      } catch (innerError) {
        console.error("Erro no evento change:", innerError);
        alert("Erro ao processar arquivo: " + innerError.message);
      }
    });

    fileInput.click();
  } catch (mainError) {
    console.error("Erro crítico em importMultipleWorks:", mainError);
    alert("Erro ao importar obras: " + mainError.message);
  }
}

// Salvar múltiplas obras
function saveMultipleWorks(works) {
  if (!db) {
    alert("Banco de dados não disponível.");
    return;
  }

  const transaction = db.transaction(["obras"], "readwrite");
  const objectStore = transaction.objectStore("obras");
  let saved = 0;
  let errors = 0;

  works.forEach((work) => {
    try {
      const request = objectStore.put(work);
      request.onsuccess = function () {
        saved++;
      };
      request.onerror = function () {
        errors++;
        console.error(`Erro ao salvar obra ${work.CODIGO}`);
      };
    } catch (error) {
      errors++;
      console.error(`Erro ao processar obra ${work.CODIGO}:`, error);
    }
  });

  transaction.oncomplete = function () {
    alert(`Importação concluída!\n${saved} obras salvas.\n${errors} erros.`);
    loadWorksList();
  };

  transaction.onerror = function () {
    alert("Erro na transação do banco de dados.");
  };
}

// Exportar para JSON
function exportToJSON() {
  const request = indexedDB.open("OAEDatabase");

  request.onerror = function () {
    console.error("Erro ao abrir IndexedDB:", request.error);
    alert("❌ Erro ao acessar o banco de dados: " + request.error);
  };

  request.onsuccess = function (event) {
    const database = event.target.result;

    if (!database.objectStoreNames.contains("obras")) {
      alert("❌ Tabela 'obras' não encontrada no banco de dados!");
      database.close();
      return;
    }

    const transaction = database.transaction(["obras"], "readonly");
    const objectStore = transaction.objectStore("obras");
    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function () {
      const obras = getAllRequest.result;

      if (!obras || obras.length === 0) {
        alert("Nenhuma obra encontrada para exportar!");
        database.close();
        return;
      }

      const exportData = {
        ExportDate: new Date().toISOString(),
        ExportVersion: "1.0",
        ExportSource: "OAEDatabase",
        TotalWorks: obras.length,
        Works: obras,
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      link.href = url;
      link.download = `obras_export_${timestamp}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`✅ ${obras.length} obra(s) exportada(s) com sucesso para JSON!`);
      database.close();
    };

    getAllRequest.onerror = function () {
      console.error("Erro ao buscar obras:", getAllRequest.error);
      alert("❌ Erro ao buscar obras do banco de dados!");
      database.close();
    };
  };
}

// Expor funções globalmente
window.exportToCSV = exportToCSV;
window.exportAllWorks = exportAllWorks;
window.importMultipleWorks = importMultipleWorks;
window.saveMultipleWorks = saveMultipleWorks;
window.exportToJSON = exportToJSON;
