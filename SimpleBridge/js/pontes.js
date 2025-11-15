/* ===== FUNÇÕES PARA GERENCIAR BANCO DE PONTES DE REFERÊNCIA ===== */

// Função para importar CSV de pontes para referência
function importPontesReferenceCSV() {
  try {
    // Criar um input de arquivo oculto
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        console.log("Arquivo selecionado:", file.name, file.size);

        // Adicionar notificação visual
        const notification = document.createElement("div");
        notification.textContent = `Processando arquivo: ${file.name}`;
        notification.style.position = "fixed";
        notification.style.bottom = "20px";
        notification.style.right = "20px";
        notification.style.padding = "10px 20px";
        notification.style.background = "rgba(52, 152, 219, 0.9)";
        notification.style.color = "white";
        notification.style.borderRadius = "5px";
        notification.style.zIndex = "1000";
        document.body.appendChild(notification);

        const reader = new FileReader();

        reader.onload = function (event) {
          const csvData = event.target.result;
          processPontesReferenceCSV(csvData);
          document.body.removeChild(notification);
        };

        reader.onerror = function () {
          alert("Erro ao ler o arquivo.");
          document.body.removeChild(notification);
        };

        reader.readAsText(file);
      }

      // Remover o input após uso
      document.body.removeChild(fileInput);
    });

    // Acionar o clique para abrir o seletor de arquivos
    fileInput.click();
  } catch (error) {
    console.error("Erro ao importar referência de pontes:", error);
    alert("Erro ao importar referência de pontes: " + error.message);
  }
}

// Função para processar o conteúdo do CSV de pontes para referência
function processPontesReferenceCSV(csvData) {
  try {
    // Dividir as linhas do CSV
    const lines = csvData.split("\n");
    if (lines.length < 2) {
      alert("O arquivo CSV não contém dados válidos.");
      return;
    }

    // Verificar o separador correto (pode ser ; ou ,)
    const separator = lines[0].includes(";") ? ";" : ",";

    // Obter os cabeçalhos (primeira linha) - removendo aspas e espaços
    const headers = lines[0]
      .split(separator)
      .map((header) => header.trim().replace(/^"|"$/g, ''));

    console.log("Cabeçalhos detectados:", headers);

    // Mapeamento flexível de cabeçalhos
    const headerMap = {};
    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      // Mapear ID
      if (normalizedHeader === "id") {
        headerMap.Id = index;
      }
      // Mapear Código SGO
      else if (normalizedHeader.includes("codigo") && normalizedHeader.includes("sgo")) {
        headerMap.CodigoSgo = index;
      }
      // Mapear Identificação
      else if (normalizedHeader.includes("identificacao")) {
        headerMap.Identificacao = index;
      }
      // Mapear UF
      else if (normalizedHeader === "uf") {
        headerMap.Uf = index;
      }
      // Mapear Rodovia/BR
      else if (normalizedHeader === "rodovia" || normalizedHeader === "br") {
        headerMap.Br = index;
      }
      // Mapear Km
      else if (normalizedHeader === "km") {
        headerMap.Km = index;
      }
      // Mapear Latitude
      else if (normalizedHeader === "latitude") {
        headerMap.Latitude = index;
      }
      // Mapear Longitude
      else if (normalizedHeader === "longitude") {
        headerMap.Longitude = index;
      }
      // Mapear Município
      else if (normalizedHeader.includes("municipio")) {
        headerMap.Municipio = index;
      }
      // Mapear Natureza
      else if (normalizedHeader === "natureza") {
        headerMap.Natureza = index;
      }
      // Mapear Comprimento
      else if (normalizedHeader === "comprimento") {
        headerMap.Comprimento = index;
      }
      // Mapear Largura
      else if (normalizedHeader === "largura") {
        headerMap.Largura = index;
      }
      // Mapear Ano
      else if (normalizedHeader === "ano") {
        headerMap.Ano = index;
      }
    });

    console.log("Mapeamento de cabeçalhos:", headerMap);

    // Verificar se os campos essenciais existem
    if (headerMap.Id === undefined || headerMap.CodigoSgo === undefined || headerMap.Identificacao === undefined) {
      console.error("Campos essenciais faltando:", {
        Id: headerMap.Id,
        CodigoSgo: headerMap.CodigoSgo,
        Identificacao: headerMap.Identificacao
      });
      alert("O arquivo CSV deve conter pelo menos: ID, Código SGO e Identificação");
      return;
    }
    
    console.log("✅ Todos os campos essenciais encontrados!");

    // Array para armazenar as pontes de referência
    const pontes = [];

    console.log(`Processando ${lines.length - 1} linhas...`);

    // Processar cada linha de dados (exceto a primeira que são os cabeçalhos)
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue; // Pular linhas vazias

      try {
        const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
        
        // Criar um objeto para a ponte usando o mapeamento
        const ponte = {};
        
        // Mapear cada campo
        Object.keys(headerMap).forEach(key => {
          const index = headerMap[key];
          if (index !== undefined && index < values.length) {
            let value = values[index];
            
            // Converter números
            if (key === "Km" || key === "Latitude" || key === "Longitude" || 
                key === "Comprimento" || key === "Largura") {
              ponte[key] = parseFloat(value.replace(",", ".")) || 0;
            } 
            // Converter ano
            else if (key === "Ano") {
              ponte[key] = parseInt(value) || 0;
            }
            // Outros campos como string
            else {
              ponte[key] = value;
            }
          }
        });

        // Se houver um Id válido, adicionar à lista
        if (ponte.Id && ponte.Id.trim() !== "") {
          pontes.push(ponte);
        }
      } catch (lineError) {
        console.warn(`Erro ao processar linha ${i}:`, lineError);
        continue;
      }
      
      // Log de progresso a cada 100 linhas
      if (i % 100 === 0) {
        console.log(`Processadas ${i} linhas, ${pontes.length} pontes válidas até agora...`);
      }
    }

    console.log(`✅ Total de ${pontes.length} pontes processadas de ${lines.length - 1} linhas`);

    if (pontes.length > 0) {
      // Salvar as pontes no banco de dados
      savePontesReference(pontes);
    } else {
      alert("Nenhuma ponte válida encontrada no arquivo CSV.");
    }
  } catch (error) {
    console.error("Erro ao processar arquivo CSV de pontes:", error);
    alert("Erro ao processar arquivo CSV de pontes: " + error.message);
  }
}

// Função para salvar as pontes de referência no banco de dados
function savePontesReference(pontes) {
  try {
    console.log(`Iniciando salvamento de ${pontes.length} pontes no banco...`);
    
    if (!db) {
      console.error("Banco de dados não disponível");
      alert("Banco de dados não está disponível.");
      return;
    }

    console.log("Criando transação...");
    const transaction = db.transaction(["pontes"], "readwrite");
    const objectStore = transaction.objectStore("pontes");

    let countSuccess = 0;
    let countError = 0;
    let processed = 0;

    console.log("Limpando dados antigos...");
    // Limpar store antes de inserir novos dados
    const clearRequest = objectStore.clear();
    
    clearRequest.onsuccess = function () {
      console.log("Dados antigos limpos. Iniciando inserção...");
      
      pontes.forEach((ponte, index) => {
        const request = objectStore.add(ponte);

        request.onsuccess = function () {
          countSuccess++;
          processed++;
          
          // Log a cada 100 registros
          if (processed % 100 === 0) {
            console.log(`Salvos ${processed}/${pontes.length} registros...`);
          }
          
          checkComplete();
        };

        request.onerror = function (event) {
          countError++;
          processed++;
          console.error(
            `Erro ao salvar a ponte ${ponte.CodigoSgo} (linha ${index + 2}):`,
            event.target.error
          );
          checkComplete();
        };
      });
    };

    clearRequest.onerror = function (event) {
      console.error("Erro ao limpar dados antigos:", event.target.error);
      alert("Erro ao limpar dados antigos: " + event.target.error);
    };

    function checkComplete() {
      if (processed === pontes.length) {
        console.log(`✅ Importação concluída: ${countSuccess} sucesso, ${countError} erros`);
        alert(
          `✅ Importação concluída!\n\n${countSuccess} pontes de referência importadas com sucesso${countError > 0 ? `\n${countError} erros` : ''}.`
        );
      }
    }

    transaction.oncomplete = function () {
      console.log("✅ Transação de importação de pontes de referência concluída.");
    };

    transaction.onerror = function (event) {
      console.error("❌ Erro na transação de importação de pontes:", event.target.error);
      alert("Erro na transação: " + event.target.error);
    };
  } catch (error) {
    console.error("❌ Erro ao salvar pontes de referência:", error);
    alert("Erro ao salvar pontes de referência: " + error.message);
  }
}

// Expor funções globalmente
window.importPontesReferenceCSV = importPontesReferenceCSV;
window.processPontesReferenceCSV = processPontesReferenceCSV;
window.savePontesReference = savePontesReference;
