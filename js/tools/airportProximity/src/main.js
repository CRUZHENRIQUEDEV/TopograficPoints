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


    // Versão: 2.2
    
    // Variáveis globais
    let pontesData = [];
    let aeroportosCache = new Map();
    let resultadosAnalise = [];
    let debugMessages = [];
    let formatoCSV = null; // 'tipo1' ou 'tipo2'
    let separadorCSV = ','; // Detectado automaticamente

    // Mapeamento de UF para Região
    const ufParaRegiao = {
      // Norte
      'AC': 'Norte', 'AP': 'Norte', 'AM': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte',
      // Nordeste
      'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste', 'PB': 'Nordeste', 
      'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
      // Centro-Oeste
      'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste',
      // Sudeste
      'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
      // Sul
      'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul'
    };

    // Função para adicionar mensagens de debug
    function addDebugLog(message, type = 'info') {
      const debugLog = document.getElementById('debugLog');
      const debugSection = document.getElementById('debugSection');
      
      debugSection.style.display = 'block';
      
      const line = document.createElement('div');
      line.className = `debug-line ${type}`;
      line.textContent = message;
      
      debugLog.appendChild(line);
      debugLog.scrollTop = debugLog.scrollHeight;
      
      console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Detectar separador do CSV (vírgula, ponto e vírgula ou tab)
    function detectarSeparador(primeiraLinha) {
      const separadores = [';', ',', '\t'];
      let melhorSeparador = ',';
      let maiorContagem = 0;
      
      separadores.forEach(sep => {
        const contagem = (primeiraLinha.match(new RegExp(sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        if (contagem > maiorContagem) {
          maiorContagem = contagem;
          melhorSeparador = sep;
        }
      });
      
      const nomeSeparador = melhorSeparador === ';' ? 'ponto e vírgula (;)' : 
                           melhorSeparador === '\t' ? 'tab (\\t)' : 'vírgula (,)';
      addDebugLog(`Separador detectado: ${nomeSeparador}`, 'success');
      
      return melhorSeparador;
    }

    // Event listener para upload de CSV
    document.getElementById('csvInput').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      document.getElementById('fileName').textContent = `Arquivo: ${file.name}`;
      
      // Limpar debug log anterior
      document.getElementById('debugLog').innerHTML = '';
      debugMessages = [];
      formatoCSV = null;
      
      const reader = new FileReader();
      reader.onload = function(event) {
        const csvContent = event.target.result;
        parseCSV(csvContent);
      };
      reader.readAsText(file, 'UTF-8');
    });

    // Detectar formato do CSV baseado nos headers
    function detectarFormatoCSV(headers) {
      addDebugLog('Detectando formato do CSV...', 'info');
      
      // Formato Tipo 1: Tem "Código SGO"
      const temCodigoSGO = headers.some(h => h.toLowerCase().includes('código sgo'));
      
      // Formato Tipo 2: Tem "Via / UF / km" ou similar
      const temViaUFKm = headers.some(h => 
        h.toLowerCase().includes('via') && 
        h.toLowerCase().includes('uf') && 
        h.toLowerCase().includes('km')
      );
      
      if (temCodigoSGO) {
        formatoCSV = 'tipo1';
        addDebugLog('✓ Formato detectado: CSV Tipo 1 (formato antigo)', 'success');
        return 'tipo1';
      } else if (temViaUFKm || headers.some(h => h.toLowerCase() === 'código')) {
        formatoCSV = 'tipo2';
        addDebugLog('✓ Formato detectado: CSV Tipo 2 (formato novo)', 'success');
        return 'tipo2';
      } else {
        formatoCSV = 'tipo1';
        addDebugLog('⚠️ Formato não identificado claramente - usando Tipo 1 como padrão', 'warning');
        return 'tipo1';
      }
    }

    // Extrair Rodovia, UF e Km da coluna "Via / UF / km"
    function extrairViaUFKm(texto) {
      // Padrão: "BR-319 / AM / 734,31"
      const regex = /^([A-Z]{2}-\d+)\s*\/\s*([A-Z]{2})\s*\/\s*([\d,\.]+)$/;
      const match = texto.trim().match(regex);
      
      if (match) {
        return {
          rodovia: match[1],      // BR-319
          uf: match[2],            // AM
          km: match[3]             // 734,31
        };
      }
      
      // Tentar extrair pelo menos a UF (segundo elemento)
      const partes = texto.split('/').map(p => p.trim());
      if (partes.length >= 2) {
        return {
          rodovia: partes[0] || '',
          uf: partes[1] || '',
          km: partes[2] || ''
        };
      }
      
      return { rodovia: '', uf: '', km: '' };
    }

    // Normalizar dados do CSV para formato interno único
    function normalizarDados(ponte, formato) {
      const normalizado = {};
      
      if (formato === 'tipo1') {
        // Mapeamento direto Tipo 1
        normalizado.codigo = ponte['Código SGO'] || ponte['Codigo SGO'] || '';
        normalizado.identificacao = ponte['Identificação'] || ponte['Identificacao'] || '';
        normalizado.municipio = ponte['Município'] || ponte['Municipio'] || '';
        normalizado.uf = ponte['UF'] || '';
        normalizado.regiao = ponte['Região'] || ponte['Regiao'] || '';
        normalizado.rodovia = ponte['Rodovia'] || '';
        normalizado.km = ponte['Km'] || '';
        normalizado.natureza = ponte['Natureza'] || '';
        normalizado.comprimento = ponte['Comprimento'] || '';
        normalizado.largura = ponte['Largura'] || '';
        normalizado.ano = ponte['Ano'] || '';
        normalizado.latitude = ponte['Latitude'] || '';
        normalizado.longitude = ponte['Longitude'] || '';
        
      } else if (formato === 'tipo2') {
        // Mapeamento Tipo 2 com extração
        normalizado.codigo = ponte['Código'] || ponte['Codigo'] || '';
        normalizado.identificacao = ponte['Identificação da OAE'] || ponte['Identificacao da OAE'] || '';
        normalizado.municipio = ''; // Não disponível no Tipo 2
        normalizado.regiao = ''; // Não disponível no Tipo 2
        normalizado.natureza = ''; // Não disponível no Tipo 2
        normalizado.ano = ''; // Não disponível no Tipo 2
        
        // Extrair Via/UF/Km
        const viaUFKm = ponte['Via / UF / km'] || ponte['Via / UF / Km'] || '';
        const extraido = extrairViaUFKm(viaUFKm);
        normalizado.rodovia = extraido.rodovia;
        normalizado.uf = extraido.uf;
        normalizado.km = extraido.km;
        
        // Extensão = Comprimento
        normalizado.comprimento = ponte['Extensão (m)'] || ponte['Extensao (m)'] || '';
        normalizado.largura = ponte['Largura (m)'] || '';
        
        normalizado.latitude = ponte['Latitude'] || '';
        normalizado.longitude = ponte['Longitude'] || '';
        
        // Campos extras do Tipo 2
        normalizado.codigoSNV = ponte['Código SNV'] || ponte['Codigo SNV'] || '';
        normalizado.versaoSNV = ponte['Versão SNV'] || ponte['Versao SNV'] || '';
        normalizado.dataVistoria = ponte['Data da Vistoria'] || '';
        normalizado.notaTecnica = ponte['Nota Técnica'] || ponte['Nota Tecnica'] || '';
      }
      
      return normalizado;
    }

    // Parser CSV robusto que respeita campos com aspas
    function parseCSVLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Aspas escapadas ""
            current += '"';
            i++; // Pular próximo caractere
          } else {
            // Alternar estado de aspas
            inQuotes = !inQuotes;
          }
        } else if (char === separadorCSV && !inQuotes) {
          // Separador fora de aspas = novo campo
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Adicionar último campo
      result.push(current.trim());
      
      return result;
    }

    // Parse do CSV com detecção automática de formato
    function parseCSV(csvContent) {
      addDebugLog('Iniciando parse do CSV...', 'info');
      
      const lines = csvContent.split('\n');
      addDebugLog(`Total de linhas no arquivo: ${lines.length}`, 'info');
      
      if (lines.length === 0) {
        addDebugLog('Arquivo CSV vazio!', 'error');
        alert('Arquivo CSV vazio!');
        return;
      }
      
      // Parse da primeira linha (cabeçalho) - detectar separador primeiro
      const headerLine = lines[0].trim();
      separadorCSV = detectarSeparador(headerLine);
      const headers = parseCSVLine(headerLine);
      
      addDebugLog(`Cabeçalhos encontrados: ${headers.join(', ')}`, 'success');
      
      // Detectar formato do CSV
      const formato = detectarFormatoCSV(headers);
      
      // Verificar se tem colunas Latitude e Longitude
      const hasLatitude = headers.some(h => h.toLowerCase().includes('latitude'));
      const hasLongitude = headers.some(h => h.toLowerCase().includes('longitude'));
      
      if (!hasLatitude || !hasLongitude) {
        addDebugLog('ERRO: CSV não contém colunas Latitude e Longitude!', 'error');
        alert('Erro: O CSV precisa ter colunas "Latitude" e "Longitude"');
        return;
      }
      
      pontesData = [];
      let linhasProcessadas = 0;
      let linhasComErro = 0;
      let linhasValidas = 0;
      let linhasSemCoordenadas = 0;
      
      // Processar cada linha de dados
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Pular linhas vazias
        if (!line) continue;
        
        linhasProcessadas++;
        
        try {
          const values = parseCSVLine(line);
          
          // Criar objeto da ponte
          const ponte = {};
          headers.forEach((header, index) => {
            ponte[header] = values[index] || '';
          });
          
          // Normalizar dados baseado no formato
          const ponteNormalizada = normalizarDados(ponte, formato);
          
          // Validar coordenadas
          const lat = parseFloat(ponteNormalizada.latitude.replace(',', '.'));
          const lng = parseFloat(ponteNormalizada.longitude.replace(',', '.'));
          
          if (isNaN(lat) || isNaN(lng)) {
            linhasSemCoordenadas++;
            if (linhasSemCoordenadas <= 5) {
              addDebugLog(`Linha ${i + 1}: Coordenadas inválidas (Lat: ${ponteNormalizada.latitude}, Lng: ${ponteNormalizada.longitude})`, 'warning');
            }
            continue;
          }
          
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            linhasSemCoordenadas++;
            if (linhasSemCoordenadas <= 5) {
              addDebugLog(`Linha ${i + 1}: Coordenadas fora do range (Lat: ${lat}, Lng: ${lng})`, 'warning');
            }
            continue;
          }
          
          // Adicionar coordenadas numéricas
          ponteNormalizada.latitudeNum = lat;
          ponteNormalizada.longitudeNum = lng;
          
          pontesData.push(ponteNormalizada);
          linhasValidas++;
          
        } catch (error) {
          linhasComErro++;
          if (linhasComErro <= 5) {
            addDebugLog(`Linha ${i + 1}: Erro ao processar - ${error.message}`, 'error');
          }
        }
      }
      
      // Resumo do parse
      addDebugLog('=== RESUMO DO PARSE ===', 'info');
      addDebugLog(`Formato detectado: ${formato === 'tipo1' ? 'CSV Tipo 1' : 'CSV Tipo 2'}`, 'info');
      addDebugLog(`Total de linhas processadas: ${linhasProcessadas}`, 'info');
      addDebugLog(`Linhas válidas importadas: ${linhasValidas}`, 'success');
      addDebugLog(`Linhas sem coordenadas válidas: ${linhasSemCoordenadas}`, 'warning');
      addDebugLog(`Linhas com erro: ${linhasComErro}`, linhasComErro > 0 ? 'error' : 'info');
      
      if (pontesData.length > 0) {
        addDebugLog(`✓ ${pontesData.length} pontes prontas para análise!`, 'success');
        iniciarAnalise();
      } else {
        addDebugLog('✗ Nenhuma ponte válida encontrada!', 'error');
        alert('Nenhuma ponte válida encontrada no CSV. Verifique:\n\n' +
              '1. Se as colunas Latitude e Longitude existem\n' +
              '2. Se os valores são numéricos\n' +
              '3. Se as coordenadas estão no formato correto (decimal)');
      }
    }

    // Variáveis globais para controle do modal
    let bboxAtual = null;
    let aeroportosAtuais = [];

    // Iniciar análise
    async function iniciarAnalise() {
      document.getElementById('progressBar').classList.add('active');
      document.getElementById('statsSection').style.display = 'none';
      document.getElementById('resultsSection').style.display = 'none';
      
      resultadosAnalise = [];
      
      addDebugLog('Iniciando análise de zonas de drone...', 'info');
      
      // Calcular bbox global para todas as pontes
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      
      pontesData.forEach(ponte => {
        minLat = Math.min(minLat, ponte.latitudeNum);
        maxLat = Math.max(maxLat, ponte.latitudeNum);
        minLng = Math.min(minLng, ponte.longitudeNum);
        maxLng = Math.max(maxLng, ponte.longitudeNum);
      });
      
      // Expandir bbox em 20km (~0.2 graus)
      const margem = 0.2;
      bboxAtual = `${minLat - margem},${minLng - margem},${maxLat + margem},${maxLng + margem}`;
      
      addDebugLog(`Bbox calculado: ${bboxAtual}`, 'info');
      
      // Consultar aeroportos
      updateProgress(10, 'Consultando aeroportos...');
      const resultado = await consultarAeroportosOverpass(bboxAtual);
      
      // Verificar se a API falhou
      if (!resultado.success) {
        addDebugLog('⚠️ Falha na API - exibindo modal de erro', 'error');
        mostrarModalErroAPI(resultado.error, resultado.tentativas);
        return; // Aguardar decisão do usuário
      }
      
      // API funcionou - continuar análise
      aeroportosAtuais = resultado.data;
      await processarPontesComAeroportos(aeroportosAtuais);
    }

    // Processar pontes com os aeroportos obtidos
    async function processarPontesComAeroportos(aeroportos) {
      addDebugLog(`${aeroportos.length} aeroportos encontrados na região`, aeroportos.length > 0 ? 'success' : 'warning');
      
      if (aeroportos.length === 0) {
        addDebugLog('⚠️ Nenhum aeroporto encontrado - todas as pontes serão marcadas como "Permitido"', 'warning');
      }
      
      // Processar cada ponte
      addDebugLog(`Analisando ${pontesData.length} pontes...`, 'info');
      
      for (let i = 0; i < pontesData.length; i++) {
        const ponte = pontesData[i];
        const progresso = 10 + ((i + 1) / pontesData.length) * 90;
        updateProgress(progresso, `Analisando ponte ${i + 1}/${pontesData.length}...`);
        
        const analise = analisarPonte(ponte, aeroportos);
        resultadosAnalise.push(analise);
        
        // Pequena pausa para não travar a UI
        if (i % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      updateProgress(100, 'Análise concluída!');
      addDebugLog(`✓ Análise concluída com sucesso!`, 'success');
      
      exibirResultados();
    }

    // Mostrar modal de erro da API
    function mostrarModalErroAPI(erro, tentativas) {
      document.getElementById('modalTentativas').textContent = tentativas;
      document.getElementById('modalErroDetalhe').textContent = `Erro: ${erro}`;
      document.getElementById('modalErroAPI').classList.remove('hidden');
      
      // Pausar progress bar
      updateProgress(10, 'Aguardando decisão...');
    }

    // Fechar modal de erro
    function fecharModalErroAPI() {
      document.getElementById('modalErroAPI').classList.add('hidden');
    }

    // Tentar novamente a API
    async function tentarNovamenteAPI() {
      fecharModalErroAPI();
      addDebugLog('Tentando novamente...', 'info');
      
      updateProgress(5, 'Reconectando...');
      const resultado = await consultarAeroportosOverpass(bboxAtual);
      
      if (!resultado.success) {
        mostrarModalErroAPI(resultado.error, resultado.tentativas);
        return;
      }
      
      // Sucesso! Continuar análise
      aeroportosAtuais = resultado.data;
      await processarPontesComAeroportos(aeroportosAtuais);
    }

    // Continuar sem dados da API (todas as obras liberadas)
    async function continuarSemAPI() {
      fecharModalErroAPI();
      addDebugLog('⚠️ ATENÇÃO: Usuário optou por continuar SEM dados de aeroportos!', 'warning');
      addDebugLog('⚠️ TODAS as obras serão marcadas como "Permitido" - VERIFICAR MANUALMENTE!', 'warning');
      
      // Continuar com array vazio de aeroportos
      await processarPontesComAeroportos([]);
    }

    // Cancelar análise
    function cancelarAnalise() {
      fecharModalErroAPI();
      addDebugLog('Análise cancelada pelo usuário.', 'info');
      
      document.getElementById('progressBar').classList.remove('active');
      updateProgress(0, '');
    }

    // Consultar aeroportos via Overpass API (com retry e fallback)
    async function consultarAeroportosOverpass(bbox) {
      const query = `
        [out:json][timeout:30];
        (
          node["aeroway"="aerodrome"](${bbox});
          node["aeroway"="helipad"](${bbox});
          node["aeroway"="heliport"](${bbox});
          way["aeroway"="aerodrome"](${bbox});
          relation["aeroway"="aerodrome"](${bbox});
        );
        out center;
      `;

      // Lista de servidores Overpass (principal + espelhos)
      const servidores = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
      ];

      const maxTentativas = 3;
      let ultimoErro = null;

      for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        // Alternar entre servidores a cada tentativa
        const servidor = servidores[(tentativa - 1) % servidores.length];
        
        addDebugLog(`Tentativa ${tentativa}/${maxTentativas} - Servidor: ${servidor.split('/')[2]}`, 'info');

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

          const response = await fetch(servidor, {
            method: 'POST',
            body: query,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          const aeroportos = processarAeroportos(data.elements);
          
          addDebugLog(`✓ API respondeu com sucesso! ${aeroportos.length} aeroportos encontrados.`, 'success');
          
          // Retorna objeto com status de sucesso
          return {
            success: true,
            data: aeroportos,
            error: null,
            tentativas: tentativa
          };

        } catch (error) {
          ultimoErro = error.name === 'AbortError' 
            ? 'Timeout: servidor demorou muito para responder'
            : error.message;
          
          addDebugLog(`✗ Tentativa ${tentativa} falhou: ${ultimoErro}`, 'error');
          
          // Aguardar antes de tentar novamente (exceto na última tentativa)
          if (tentativa < maxTentativas) {
            addDebugLog(`Aguardando 2s antes da próxima tentativa...`, 'warning');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      // Todas as tentativas falharam
      addDebugLog(`✗ Todas as ${maxTentativas} tentativas falharam!`, 'error');
      
      return {
        success: false,
        data: [],
        error: ultimoErro,
        tentativas: maxTentativas
      };
    }

    // Processar dados de aeroportos
    function processarAeroportos(elements) {
      const aeroportos = [];
      
      elements.forEach(element => {
        let lat, lng, name, type;
        
        if (element.type === 'node') {
          lat = element.lat;
          lng = element.lon;
        } else if (element.center) {
          lat = element.center.lat;
          lng = element.center.lon;
        } else {
          return;
        }

        name = element.tags?.name || element.tags?.ref || 'Sem nome';
        type = element.tags?.aeroway || 'aerodrome';
        
        aeroportos.push({
          lat,
          lng,
          name,
          type,
          icao: element.tags?.icao || '',
          iata: element.tags?.iata || ''
        });
      });

      return aeroportos;
    }

    // Analisar uma ponte
    function analisarPonte(ponte, aeroportos) {
      let menorDistancia = Infinity;
      let aeroportoMaisProximo = null;

      aeroportos.forEach(aeroporto => {
        const distancia = calcularDistanciaHaversine(
          ponte.latitudeNum, 
          ponte.longitudeNum, 
          aeroporto.lat, 
          aeroporto.lng
        );
        
        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          aeroportoMaisProximo = aeroporto;
        }
      });

      let zona, descricao;
      if (menorDistancia <= 9) {
        zona = 'prohibited';
        descricao = '🚫 ZAD (0-9km)';
      } else {
        zona = 'permitted';
        descricao = '✅ Permitido (>9km)';
      }

      return {
        ...ponte,
        zona,
        descricao,
        distanciaAeroporto: menorDistancia === Infinity ? null : menorDistancia,
        aeroportoProximo: aeroportoMaisProximo ? aeroportoMaisProximo.name : 'N/A'
      };
    }

    // Calcular distância Haversine em km
    function calcularDistanciaHaversine(lat1, lng1, lat2, lng2) {
      const R = 6371; // Raio da Terra em km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // Atualizar barra de progresso
    function updateProgress(percent, message) {
      const progress = document.getElementById('progress');
      progress.style.width = percent + '%';
      progress.textContent = message || `${Math.round(percent)}%`;
    }

    // Exibir resultados
    function exibirResultados() {
      // Calcular estatísticas
      const total = resultadosAnalise.length;
      const proibidas = resultadosAnalise.filter(r => r.zona === 'prohibited').length;
      const permitidas = resultadosAnalise.filter(r => r.zona === 'permitted').length;

      document.getElementById('totalPontes').textContent = total;
      document.getElementById('pontesProibidas').textContent = proibidas;
      document.getElementById('pontesPermitidas').textContent = permitidas;

      addDebugLog(`Estatísticas: ${total} total | ${proibidas} ZAD (0-9km) | ${permitidas} permitidas (>9km)`, 'success');

      // Preencher tabela
      const tbody = document.getElementById('resultsBody');
      tbody.innerHTML = '';

      resultadosAnalise.forEach((resultado, index) => {
        const row = tbody.insertRow();
        row.className = `zone-${resultado.zona}`;
        row.dataset.index = index;
        row.dataset.codigo = resultado.codigo || '';
        row.dataset.uf = resultado.uf || '';
        row.dataset.zona = resultado.zona || '';

        row.insertCell(0).textContent = resultado.codigo || '-';
        row.insertCell(1).textContent = resultado.identificacao || '-';
        row.insertCell(2).textContent = resultado.municipio || '-';
        row.insertCell(3).textContent = resultado.uf || '-';
        row.insertCell(4).textContent = resultado.rodovia || '-';
        row.insertCell(5).textContent = resultado.km || '-';
        row.insertCell(6).textContent = resultado.latitude || '-';
        row.insertCell(7).textContent = resultado.longitude || '-';
        
        const zonaCell = row.insertCell(8);
        zonaCell.innerHTML = `<span class="zone-badge badge-${resultado.zona}">${resultado.descricao}</span>`;
        
        const distanciaCell = row.insertCell(9);
        distanciaCell.textContent = resultado.distanciaAeroporto !== null 
          ? resultado.distanciaAeroporto.toFixed(2) 
          : 'N/A';
        
        row.insertCell(10).textContent = resultado.aeroportoProximo || 'N/A';
      });

      // Popular checkboxes de UFs
      popularCheckboxesUF();

      // Mostrar seções
      document.getElementById('statsSection').style.display = 'block';
      document.getElementById('resultsSection').style.display = 'block';
      
      // Atualizar contador de filtros
      atualizarContadorFiltros();
      
      // Esconder progress bar
      setTimeout(() => {
        document.getElementById('progressBar').classList.remove('active');
      }, 1000);
    }

    // Popular checkboxes de UFs com valores únicos
    function popularCheckboxesUF() {
      const ufsUnicas = [...new Set(resultadosAnalise.map(r => r.uf).filter(uf => uf))].sort();
      const container = document.getElementById('ufCheckboxList');
      
      // Limpar checkboxes existentes
      container.innerHTML = '';
      
      ufsUnicas.forEach(uf => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `uf-${uf}`;
        checkbox.value = uf;
        checkbox.onchange = aplicarFiltros;
        
        const label = document.createElement('label');
        label.htmlFor = `uf-${uf}`;
        label.textContent = uf;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
      });
    }

    // Selecionar/Desselecionar todas as regiões
    function selecionarTodosRegiao(selecionar) {
      const checkboxes = document.querySelectorAll('#regiaoContainer input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = selecionar);
      aplicarFiltros();
    }

    // Selecionar/Desselecionar todos os UFs
    function selecionarTodosUF(selecionar) {
      const checkboxes = document.querySelectorAll('#ufCheckboxList input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = selecionar);
      aplicarFiltros();
    }

    // Aplicar filtros
    function aplicarFiltros() {
      const filterCodigo = document.getElementById('filterCodigo').value.toLowerCase().trim();
      const filterZona = document.getElementById('filterZona').value;
      
      // Obter regiões selecionadas
      const regioesSelecionadas = Array.from(
        document.querySelectorAll('#regiaoContainer input[type="checkbox"]:checked')
      ).map(cb => cb.value);
      
      // Obter UFs selecionadas
      const ufsSelecionadas = Array.from(
        document.querySelectorAll('#ufCheckboxList input[type="checkbox"]:checked')
      ).map(cb => cb.value);
      
      const tbody = document.getElementById('resultsBody');
      const rows = tbody.getElementsByTagName('tr');
      let visibleCount = 0;

      for (let row of rows) {
        const codigo = row.dataset.codigo.toLowerCase();
        const uf = row.dataset.uf;
        const zona = row.dataset.zona;
        
        // Verificar se passa nos filtros
        const codigoMatch = !filterCodigo || codigo.includes(filterCodigo);
        
        // Filtro de região
        const regiaoMatch = regioesSelecionadas.length === 0 || 
                           regioesSelecionadas.includes(ufParaRegiao[uf]);
        
        // Filtro de UF
        const ufMatch = ufsSelecionadas.length === 0 || 
                       ufsSelecionadas.includes(uf);
        
        // Filtro de zona
        const zonaMatch = !filterZona || zona === filterZona;
        
        if (codigoMatch && regiaoMatch && ufMatch && zonaMatch) {
          row.classList.remove('hidden');
          visibleCount++;
        } else {
          row.classList.add('hidden');
        }
      }

      // Atualizar contador
      atualizarContadorFiltros(visibleCount);
      
      // Mostrar/ocultar mensagem de "sem resultados"
      const noResults = document.getElementById('noResults');
      if (visibleCount === 0) {
        noResults.style.display = 'block';
      } else {
        noResults.style.display = 'none';
      }
    }

    // Atualizar contador de filtros
    function atualizarContadorFiltros(visible) {
      const total = resultadosAnalise.length;
      const visibleCount = visible !== undefined ? visible : total;
      
      const filterResults = document.getElementById('filterResults');
      filterResults.textContent = `Mostrando ${visibleCount} de ${total} obras`;
      
      if (visibleCount < total) {
        filterResults.style.background = 'rgba(241, 196, 15, 0.3)';
      } else {
        filterResults.style.background = 'rgba(52, 152, 219, 0.2)';
      }
    }

    // Limpar filtros
    function limparFiltros() {
      document.getElementById('filterCodigo').value = '';
      document.getElementById('filterZona').value = '';
      
      // Desmarcar todas as regiões
      document.querySelectorAll('#regiaoContainer input[type="checkbox"]').forEach(cb => cb.checked = false);
      
      // Desmarcar todas as UFs
      document.querySelectorAll('#ufCheckboxList input[type="checkbox"]').forEach(cb => cb.checked = false);
      
      aplicarFiltros();
    }

    // Exportar CSV
    function exportarCSV() {
      if (resultadosAnalise.length === 0) return;

      // Cabeçalhos adaptados ao formato
      let headers;
      if (formatoCSV === 'tipo2') {
        headers = [
          'Código', 'Identificação da OAE', 'Via / UF / km', 'Extensão (m)', 
          'Largura (m)', 'Latitude', 'Longitude', 'Zona_Drone', 'Descrição_Zona', 
          'Distância_Aeroporto_km', 'Aeroporto_Próximo'
        ];
      } else {
        headers = [
          'Código SGO', 'Identificação', 'Município', 'UF', 'Região', 
          'Rodovia', 'Km', 'Natureza', 'Comprimento', 'Largura', 'Ano', 
          'Latitude', 'Longitude', 'Zona_Drone', 'Descrição_Zona', 
          'Distância_Aeroporto_km', 'Aeroporto_Próximo'
        ];
      }

      let csvContent = headers.join(',') + '\n';

      resultadosAnalise.forEach(resultado => {
        let row;
        
        if (formatoCSV === 'tipo2') {
          // Reconstruir coluna Via / UF / km
          const viaUFKm = `${resultado.rodovia} / ${resultado.uf} / ${resultado.km}`;
          
          row = [
            resultado.codigo || '',
            `"${(resultado.identificacao || '').replace(/"/g, '""')}"`,
            `"${viaUFKm}"`,
            resultado.comprimento || '',
            resultado.largura || '',
            resultado.latitude || '',
            resultado.longitude || '',
            resultado.zona || '',
            `"${resultado.descricao || ''}"`,
            resultado.distanciaAeroporto !== null ? resultado.distanciaAeroporto.toFixed(2) : '',
            `"${(resultado.aeroportoProximo || '').replace(/"/g, '""')}"`
          ];
        } else {
          row = [
            resultado.codigo || '',
            `"${(resultado.identificacao || '').replace(/"/g, '""')}"`,
            resultado.municipio || '',
            resultado.uf || '',
            resultado.regiao || '',
            resultado.rodovia || '',
            resultado.km || '',
            resultado.natureza || '',
            resultado.comprimento || '',
            resultado.largura || '',
            resultado.ano || '',
            resultado.latitude || '',
            resultado.longitude || '',
            resultado.zona || '',
            `"${resultado.descricao || ''}"`,
            resultado.distanciaAeroporto !== null ? resultado.distanciaAeroporto.toFixed(2) : '',
            `"${(resultado.aeroportoProximo || '').replace(/"/g, '""')}"`
          ];
        }

        csvContent += row.join(',') + '\n';
      });

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'relatorio_zonas_drone_pontes.csv');
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addDebugLog('✓ CSV exportado com sucesso!', 'success');
    }
  