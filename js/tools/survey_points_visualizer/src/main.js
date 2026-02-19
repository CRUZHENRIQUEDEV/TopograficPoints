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


      // Versão: 2.0 - Rodovias com múltiplas opções
      // Variáveis globais para zoom, dados e rotação
      let currentZoom = 2.0; // Zoom padrão 200%
      let currentPoints1 = {};
      let currentPoints2 = {};
      let currentRotation = 0; // Rotação em graus
      
      // Limites técnicos
      const LIMIT_TRANSVERSAL = 5.0; // 5%
      const LIMIT_LONGITUDINAL = 2.5; // 2.5%
      
      // Função para consultar API do DNIT
      async function consultarRodoviasDNIT(lat, lng) {
        try {
          const dataRef = new Date().toISOString().split('T')[0];
          const url = `https://servicos.dnit.gov.br/sgplan/apigeo/rotas/localizarkm?lng=${lng}&lat=${lat}&r=250&data=${dataRef}`;
          
          debugLog(`Consultando DNIT: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors'
          });
          
          if (!response.ok) {
            throw new Error(`Erro na API DNIT: ${response.status}`);
          }
          
          const data = await response.json();
          debugLog(`Resposta DNIT: ${JSON.stringify(data)}`);
          
          return data;
        } catch (error) {
          debugLog(`Erro ao consultar DNIT: ${error.message}`);
          return [];
        }
      }
      
      // Função para processar dados das rodovias
      function processarDadosRodovias(dadosRodovias) {
        if (!dadosRodovias || dadosRodovias.length === 0) {
          return null;
        }
        
        // Processar todos os dados sem agrupar, mantendo informações completas
        const rodovias = dadosRodovias.map(rodovia => ({
          br: rodovia.br,
          km: parseFloat(rodovia.km).toFixed(3),
          kmOriginal: parseFloat(rodovia.km),
          uf: rodovia.uf,
          tipoTrecho: rodovia.sg_tp_trecho,
          versao: rodovia.versao,
          id: rodovia.id
        }));
        
        // Ordenar por BR e depois por KM
        rodovias.sort((a, b) => {
          if (a.br !== b.br) return a.br.localeCompare(b.br);
          return a.kmOriginal - b.kmOriginal;
        });
        
        return {
          rodovias: rodovias,
          totalRodovias: rodovias.length
        };
      }
      
     // Função para exibir informações das rodovias
      function exibirInformacoesRodovias(dadosProcessados, pontoReferencia) {
        const rodoviaInfo = document.getElementById('rodoviaInfo');
        const rodoviaContent = document.getElementById('rodoviaContent');
        
        if (!dadosProcessados || !dadosProcessados.rodovias || dadosProcessados.rodovias.length === 0) {
          rodoviaInfo.style.display = 'none';
          return;
        }
        
        const rodovias = dadosProcessados.rodovias;
        
        // Header do card
        const headerHtml = `
          <div style="text-align: center; margin-bottom: 15px; padding: 15px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 8px; border: 2px solid #1976d2;">
            <div style="font-weight: bold; color: #1976d2; font-size: 18px; margin-bottom: 8px;">
              🗺️ RODOVIAS ENCONTRADAS (${rodovias.length})
            </div>
            <div style="font-size: 14px; color: #1565c0;">
              📌 Referência: ${pontoReferencia}
            </div>
          </div>
        `;
        
        // Criar cards organizados para cada rodovia
        const rodoviaCards = rodovias.map(rodovia => {
          const tipoTrechoTexto = rodovia.tipoTrecho === 'B' ? 'Bidirecional' : 
                                 rodovia.tipoTrecho === 'U' ? 'Unidirecional' : 
                                 rodovia.tipoTrecho || 'N/A';
          
          const isKmZero = parseFloat(rodovia.km) === 0;
          const borderColor = isKmZero ? '#ff5722' : '#1976d2';
          const bgColor = isKmZero ? '#ffebee' : '#e3f2fd';
          
          return `
            <div class="limit-item" style="
              background: ${bgColor}; 
              border: 2px solid ${borderColor}; 
              border-radius: 8px; 
              padding: 15px; 
              margin: 10px 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              min-height: 60px;
            ">
              <div style="flex: 1;">
                <div style="font-weight: bold; color: ${borderColor}; font-size: 20px; margin-bottom: 5px;">
                  🛣️ BR-${rodovia.br} ${isKmZero ? '⚠️' : ''}
                </div>
                <div style="font-size: 16px; color: ${borderColor}; font-weight: 600;">
                  📍 Km ${rodovia.km} ${isKmZero ? '<span style="color: #d32f2f; font-weight: bold;">(VERIFICAR)</span>' : ''}
                </div>
              </div>
              <div style="text-align: right; padding-left: 20px;">
                <div style="font-size: 14px; color: #666; font-weight: 600;">
                  ${rodovia.uf} - ${tipoTrechoTexto}
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 3px;">
                  Versão: ${rodovia.versao}
                </div>
              </div>
            </div>
          `;
        }).join('');
        
        // Footer com aviso se houver KMs zerados
        const footerHtml = rodovias.some(r => parseFloat(r.km) === 0) ? `
          <div style="
            margin-top: 15px; 
            padding: 12px; 
            background: #fff3e0; 
            border: 2px solid #ff9800; 
            border-radius: 8px; 
            text-align: center;
          ">
            <div style="font-size: 14px; color: #e65100; font-weight: bold;">
              ⚠️ Atenção: Rodovias com KM zerado podem indicar imprecisão na localização
            </div>
          </div>
        ` : '';
        
        // Fonte
        const fonteHtml = `
          <div style="margin-top: 15px; text-align: center;">
            <div style="font-size: 11px; color: #999; font-style: italic;">
              <strong>Fonte:</strong> API DNIT - Consulta automática baseada nas coordenadas do ponto ${pontoReferencia}
            </div>
          </div>
        `;
        
        // Montar HTML completo
        rodoviaContent.innerHTML = headerHtml + rodoviaCards + footerHtml + fonteHtml;
        
        // Exibir a seção
        rodoviaInfo.style.display = 'block';
      }

      
      // Função para obter coordenada de referência (preferencialmente LD_INICIO_OAE)
      function obterCoordenadaReferencia(points) {
        // Prioridade: LD_INICIO_OAE
        let pontoReferencia = Object.values(points).find(p => 
          (p.code && p.code.includes("LD_INICIO_OAE")) || 
          (p.name && p.name.includes("LD_INICIO_OAE"))
        );
        
        // Se não encontrou LD_INICIO, tenta LE_INICIO
        if (!pontoReferencia) {
          pontoReferencia = Object.values(points).find(p => 
            (p.code && p.code.includes("LE_INICIO_OAE")) || 
            (p.name && p.name.includes("LE_INICIO_OAE"))
          );
        }
        
        // Se ainda não encontrou, pega o primeiro ponto com coordenadas válidas
        if (!pontoReferencia) {
          pontoReferencia = Object.values(points).find(p => p.lat && p.long);
        }
        
        if (!pontoReferencia || !pontoReferencia.lat || !pontoReferencia.long) {
          return null;
        }
        
        return {
          lat: parseFloat(pontoReferencia.lat),
          lng: parseFloat(pontoReferencia.long),
          nomePonto: pontoReferencia.code || pontoReferencia.name || 'Ponto não identificado'
        };
      }
      
      function debugLog(message) {
        console.log(message);
        const debugDiv = document.getElementById('debugInfo');
        if (debugDiv) {
          debugDiv.innerHTML += message + '<br>';
          debugDiv.style.display = 'block';
        }
      }
      
      // FUNÇÃO CORRIGIDA: Conversão de coordenadas geográficas para UTM
      function geographicToUTM(lat, lng) {
        const a = 6378137.0; // Semi-eixo maior WGS84
        const f = 1/298.257223563; // Achatamento WGS84
        const k0 = 0.9996; // Fator de escala UTM
        
        // Determinar zona UTM
        const zone = Math.floor((lng + 180) / 6) + 1;
        const centralMeridian = (zone - 1) * 6 - 180 + 3;
        
        // Converter para radianos
        const latRad = lat * Math.PI / 180;
        const lngRad = lng * Math.PI / 180;
        const centralMeridianRad = centralMeridian * Math.PI / 180;
        
        // Cálculos UTM simplificados
        const deltaLng = lngRad - centralMeridianRad;
        
        const N = a / Math.sqrt(1 - (f * (2 - f) * Math.sin(latRad) * Math.sin(latRad)));
        const T = Math.tan(latRad) * Math.tan(latRad);
        const C = (f * (2 - f)) / (1 - f * (2 - f)) * Math.cos(latRad) * Math.cos(latRad);
        const A = deltaLng * Math.cos(latRad);
        
        // Coordenadas UTM
        const easting = k0 * N * (A + (1 - T + C) * A * A * A / 6) + 500000;
        
        // Para o hemisfério sul (Brasil), adicionar 10.000.000m
        const M = a * ((1 - f/4 - 3*f*f/64) * latRad - 
                      (3*f/8 + 3*f*f/32) * Math.sin(2*latRad) + 
                      (15*f*f/256) * Math.sin(4*latRad));
        const northing = lat < 0 ? k0 * M + 10000000 : k0 * M;
        
        return { easting, northing, zone };
      }
      
      // Função para determinar zona SIRGAS 2000
      function determineSirgas2000Zone(point) {
        let longitude = null;
        
        // Se temos coordenadas geográficas diretamente
        if (point.longitude && Math.abs(point.longitude) <= 180) {
          longitude = point.longitude;
        }
        // Se temos coordenadas UTM, fazer conversão aproximada
        else if (point.easting && point.northing) {
          longitude = approximateUTMToLongitude(point.easting, point.northing);
        }
        
        if (longitude !== null) {
          // Fórmula: Zona = PARTE_INTEIRA((Longitude + 180) / 6) + 1
          const zona = Math.floor((longitude + 180) / 6) + 1;
          return zona;
        }
        
        return null;
      }
      
      // Conversão aproximada de UTM para longitude (simplificada para Brasil)
      function approximateUTMToLongitude(easting, northing) {
        // Para o Brasil, estimativa baseada em coordenadas típicas
        let estimatedZone = null;
        
        // Coordenada Leste baixa (~187500) indica zona com meridiano central mais a oeste
        if (easting < 300000) {
          if (northing > 8900000 && northing < 9100000) {
            // Região nordeste com Leste baixo - provavelmente Zona 24 ou 25
            estimatedZone = easting < 250000 ? 25 : 24;
          }
        } else if (easting < 500000) {
          estimatedZone = 24;
        } else if (easting < 700000) {
          estimatedZone = 23;
        }
        
        if (estimatedZone) {
          // Calcular longitude do meridiano central da zona
          const centralMeridian = (estimatedZone - 1) * 6 - 180 + 3; // +3 para o centro da zona
          
          // Conversão aproximada (simplificada)
          const deltaEasting = easting - 500000; // 500000 é o false easting padrão
          const deltaLongitude = deltaEasting / 111320; // aprox metros por grau
          
          return centralMeridian + deltaLongitude;
        }
        
        return null;
      }
      
      function loadExample1() {
        const exampleData1 = `Name,Code,Lat,Long,H_GEO,H_ORTO,x,y
"05",JUSESQ,-9.8976347800,-36.4167136000,188.80925,197.1262098000,-36.4167136710,-9.8976347823
"06",JUSDIR,-9.8975431900,-36.4167583000,189.01495,197.3316011000,-36.4167583598,-9.8975431976
P-04,LD_FINAL_OAE,-9.8974730300,-36.4166092000,188.93670,197.2531865000,-36.4166092614,-9.8974730373
P-03,LE_FINAL_OAE,-9.8975631400,-36.4165642000,188.78735,197.1041407000,-36.4165642134,-9.8975631483
P-01,LE_INICIO_OAE,-9.8975029500,-36.4164419000,188.77963,197.0962773000,-36.4164419708,-9.8975029554
P-02,LD_INICIO_OAE,-9.8974121600,-36.4164865000,188.99719,197.3135310000,-36.4164865650,-9.8974121660
"07",MONDIR,-9.8972934700,-36.4162403000,188.86808,197.1841401000,-36.4162403921,-9.8972934728
"08",MONESQ,-9.8973829800,-36.4161912000,188.66533,196.9816940000,-36.4161912260,-9.8973829816`;

        document.getElementById('csvData1').value = exampleData1;
        processData();
      }
      
      function loadExample1NewFormat() {
        const exampleDataNewFormat = `Ponto,CODE,Prec,Prec_1,Prec_2,Solucao,PDOP,Sate,LAT,LONG,H_GEO,OND_GEO,PREC_HOR
1,MONTANTE DIREITA,0.019,0.019,0.047,RTX,0.8,38,-10.9959903361,-37.3016382834,8.908,-10.4325819199854,0.027
2,MONTANTE ESQUERDA,0.032,0.032,0.055,RTX,0.9,34,-10.9960561613,-37.3015627305,8.961,-10.4329074211096,0.045
3,LD_INICIO_OAE,0.03,0.03,0.067,RTX,0.9,37,-10.9962461189,-37.3018609293,8.854,-10.4326416447749,0.042
4,LE_INICIO_OAE,0.023,0.023,0.055,RTX,0.9,36,-10.9963072759,-37.3017912499,8.846,-10.4329428645818,0.033
5,APOIO,0.029,0.029,0.06,RTX,0.9,29,-10.9964489698,-37.3019151530,8.842,-10.4329745616281,0.041
6,APOIO,0.03,0.03,0.06,RTX,0.9,37,-10.9963880456,-37.3019876858,8.794,-10.4326672037356,0.042
23,LD_FINAL_OAE,0.017,0.017,0.043,RTX,0.9,38,-10.9978877404,-37.3033001911,9.004,-10.4329969535235,0.024
24,LE_FINAL_OAE,0.025,0.025,0.048,RTX,0.9,38,-10.9979497785,-37.3032279719,8.987,-10.4333061411939,0.035
25,JUSANTE ESQUERDA,0.021,0.021,0.062,RTX,0.9,38,-10.9981799561,-37.3034194465,8.873,-10.4333795659563,0.030
26,JUSANTE DIREITA,0.028,0.028,0.072,RTX,0.9,39,-10.9981165396,-37.3034990302,9.175,-10.4330500394367,0.040`;

        document.getElementById('csvData1').value = exampleDataNewFormat;
        processData();
      }

      function loadExample1UTM() {
        const exampleDataUTM = `Ponto,Codigo,Leste,Prec,Norte,Prec,Elev,Prec,Solucao,PDOP,Sate
P-01,LE INICIO PONTE,187514.122,0.017,8954447.811,0.017,102.288,0.047,RTX,0.9,29
P-02,LD INICIO PONTE,187512.661,0.023,8954459.014,0.023,101.795,0.051,RTX,0.9,29
P-03,LD FINAL DE PONTE,187493.840,0.022,8954456.634,0.022,101.843,0.048,RTX,0.9,30
P-04,LE FINAL DE PONTE,187495.294,0.023,8954445.442,0.023,102.310,0.049,RTX,0.9,30`;

        document.getElementById('csvData1').value = exampleDataUTM;
        processData();
      }

      function loadExample2() {
        const exampleData2 = `Ponto,Codigo,Leste,Prec,Norte,Prec,Elev,Prec,Solucao,PDOP,Sate
01,LE INICIO PONTE,187514.122,0.017,8954447.811,0.017,102.288,0.047,RTX,0.9,29
02,LD INICIO PONTE,187512.661,0.023,8954459.014,0.023,101.795,0.051,RTX,0.9,29
07,LD FINAL DE PONTE,187493.840,0.022,8954456.634,0.022,101.843,0.048,RTX,0.9,30
08,LE FINAL DE PONTE,187495.294,0.023,8954445.442,0.023,102.310,0.049,RTX,0.9,30`;

        document.getElementById('csvData2').value = exampleData2;
        processData();
      }

      // Funções de zoom
      function zoomIn() {
        currentZoom = Math.min(currentZoom * 1.2, 100.0); // Zoom máximo 10000%
        updateZoomDisplay();
        redrawVisualization();
      }
      
      function zoomOut() {
        currentZoom = Math.max(currentZoom / 1.2, 0.1); // Zoom mínimo 10%
        updateZoomDisplay();
        redrawVisualization();
      }
      
      function resetZoom() {
        currentZoom = 2.0; // Reset para zoom padrão 200%
        updateZoomDisplay();
        redrawVisualization();
      }
      
      function updateZoomDisplay() {
        const zoomPercent = Math.round(currentZoom * 100);
        document.getElementById('zoomLevel').textContent = `Zoom: ${zoomPercent}%`;
      }
      
      // Função de rotação
      function rotate45() {
        currentRotation = (currentRotation + 22.5) % 360;
        redrawVisualization();
      }
      
      function redrawVisualization() {
        if (Object.keys(currentPoints1).length > 0) {
          drawVisualization(currentPoints1, currentPoints2);
        }
      }

      function clearAll() {
        document.getElementById('csvData1').value = '';
        document.getElementById('csvData2').value = '';
        document.getElementById('infoPanel').style.display = 'none';
        document.getElementById('rodoviaInfo').style.display = 'none';
        document.getElementById('errorMsg').innerHTML = '';
        document.getElementById('debugInfo').innerHTML = '';
        document.getElementById('debugInfo').style.display = 'none';
        
        currentZoom = 2.0;
        currentRotation = 0;
        currentPoints1 = {};
        currentPoints2 = {};
        updateZoomDisplay();
        
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      function parseCSV(csvText) {
        if (!csvText.trim()) return [];
        
        debugLog("=== INICIANDO PARSE CSV ===");
        const lines = csvText.trim().split("\n");
        debugLog(`Total de linhas: ${lines.length}`);
        
        const firstLine = lines[0];
        debugLog(`Primeira linha: ${firstLine}`);
        
        let headers;
        let dataStartIndex = 0;

        // Detectar se a primeira linha contém cabeçalhos - VERSÃO EXPANDIDA
        const commonHeaders = [
          "Name", "Code", "CODE", "codigo", "CODIGO", "Código", "Ponto",
          "Lat", "LAT", "Long", "LONG", "Longitude", "LONGITUDE", 
          "x", "y", "X", "Y", "Leste", "Norte", "Easting", "Northing",
          "H_ORTO", "H_ORTHO", "H_GEO", "Elev", "Elevation", "Altura", "Z",
          "Prec", "Solucao", "PDOP", "Sate", "OND_GEO", "PREC_HOR"
        ];
        const hasHeaders = commonHeaders.some(header => firstLine.includes(header));
        
        if (hasHeaders) {
          headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ''));
          dataStartIndex = 1;
          debugLog(`Cabeçalhos detectados: ${headers.join(', ')}`);
        } else {
          headers = ["Ponto", "CODE", "Prec", "Prec_1", "Prec_2", "Solucao", "PDOP", "Sate", "LAT", "LONG", "H_GEO", "OND_GEO", "PREC_HOR"];
          dataStartIndex = 0;
          debugLog("Usando cabeçalhos padrão");
        }

        const data = [];
        for (let i = dataStartIndex; i < lines.length; i++) {
          if (lines[i].trim() === "") continue;

          const values = lines[i].split(",");
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.trim().replace(/"/g, '') || "";
          });
          data.push(row);
          debugLog(`Linha ${i}: ${JSON.stringify(row)}`);
        }
        
        debugLog(`Total de linhas processadas: ${data.length}`);
        return data;
      }

      function calculateDistance(point1, point2) {
        // CORREÇÃO: Se ambos os pontos são geográficos, usar cálculo adequado
        if (point1.coordType === 'GEO' && point2.coordType === 'GEO') {
          const lat1Rad = point1.lat * Math.PI / 180;
          const lat2Rad = point2.lat * Math.PI / 180;
          const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
          const deltaLng = (point2.long - point1.long) * Math.PI / 180;

          const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                    Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

          return 6371000 * c; // Raio da Terra em metros
        }

        // Para coordenadas UTM ou se temos coordenadas convertidas
        let x1, y1, x2, y2;
        
        if (point1.utmX && point1.utmY) {
          x1 = point1.utmX;
          y1 = point1.utmY;
        } else {
          x1 = parseFloat(point1.x);
          y1 = parseFloat(point1.y);
        }
        
        if (point2.utmX && point2.utmY) {
          x2 = point2.utmX;
          y2 = point2.utmY;
        } else {
          x2 = parseFloat(point2.x);
          y2 = parseFloat(point2.y);
        }

        const deltaX = x2 - x1;
        const deltaY = y2 - y1;

        let distance;

        if ((point1.coordType === 'UTM' && point2.coordType === 'UTM') || 
            (point1.coordType === 'PLANE' && point2.coordType === 'PLANE')) {
          distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        } 
        else if ((point1.coordType === 'GEO' && point2.coordType === 'GEO') ||
                 (Math.abs(x1) < 180 && Math.abs(y1) < 90 && Math.abs(x2) < 180 && Math.abs(y2) < 90)) {
          const lat1Rad = (y1 * Math.PI) / 180;
          const lat2Rad = (y2 * Math.PI) / 180;
          const avgLatRad = (lat1Rad + lat2Rad) / 2;

          const deltaLatM = deltaY * 111320;
          const deltaLonM = deltaX * 111320 * Math.cos(avgLatRad);

          distance = Math.sqrt(deltaLatM * deltaLatM + deltaLonM * deltaLonM);
        }
        else {
          distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        }

        return distance;
      }

      function calculateElevationDifference(point1, point2) {
        const elev1 = parseFloat(point1.elevation);
        const elev2 = parseFloat(point2.elevation);
        return elev2 - elev1;
      }

      function calculateInclination(point1, point2) {
        const distance = calculateDistance(point1, point2);
        const elevationDiff = calculateElevationDifference(point1, point2);
        
        if (distance === 0) return { percentage: 0, degrees: 0, ratio: "0:1" };
        
        const percentage = (Math.abs(elevationDiff) / distance) * 100;
        const degrees = Math.atan(Math.abs(elevationDiff) / distance) * (180 / Math.PI);
        const ratio = `1:${(distance / Math.abs(elevationDiff)).toFixed(1)}`;
        
        return { 
          percentage: percentage, 
          degrees: degrees, 
          ratio: ratio,
          direction: elevationDiff > 0 ? "↗️ Subida" : elevationDiff < 0 ? "↘️ Descida" : "➡️ Nivelado"
        };
      }

      // FUNÇÃO CORRIGIDA: Calcular esconsidade da ponte
      function calculateSkewAnalysis(struct) {
        if (!struct || !struct.ldInicio || !struct.leInicio || !struct.ldFinal || !struct.leFinal) {
          return null;
        }

        debugLog("=== CÁLCULO DE ESCONSIDADE CORRIGIDO ===");

        // CORREÇÃO: Converter coordenadas para UTM se necessário
        let points = [struct.ldInicio, struct.leInicio, struct.ldFinal, struct.leFinal];
        
        points.forEach(point => {
          if (point.coordType === 'GEO') {
            const utm = geographicToUTM(point.lat, point.long);
            point.utmX = utm.easting;
            point.utmY = utm.northing;
            point.utmZone = utm.zone;
            debugLog(`Convertido ${point.name}: LAT=${point.lat.toFixed(8)}, LONG=${point.long.toFixed(8)} -> UTM X=${utm.easting.toFixed(3)}, Y=${utm.northing.toFixed(3)}`);
          } else {
            point.utmX = parseFloat(point.x);
            point.utmY = parseFloat(point.y);
          }
        });

        // Usar coordenadas UTM para cálculos
        const ldInicio = { x: struct.ldInicio.utmX, y: struct.ldInicio.utmY };
        const leInicio = { x: struct.leInicio.utmX, y: struct.leInicio.utmY };
        const ldFinal = { x: struct.ldFinal.utmX, y: struct.ldFinal.utmY };
        const leFinal = { x: struct.leFinal.utmX, y: struct.leFinal.utmY };

        // Distâncias em X e Y entre LD_INÍCIO e LE_INÍCIO
        const deltaX_Inicio = Math.abs(leInicio.x - ldInicio.x);
        const deltaY_Inicio = Math.abs(leInicio.y - ldInicio.y);
        
        // Distâncias em X e Y entre LD_FINAL e LE_FINAL
        const deltaX_Final = Math.abs(leFinal.x - ldFinal.x);
        const deltaY_Final = Math.abs(leFinal.y - ldFinal.y);

        // Vetores dos eixos da ponte
        const vetorLD = {
          x: ldFinal.x - ldInicio.x,
          y: ldFinal.y - ldInicio.y
        };
        
        const vetorLE = {
          x: leFinal.x - leInicio.x,
          y: leFinal.y - leInicio.y
        };

        // Ângulo do eixo longitudinal da ponte (média dos dois lados)
        const anguloLD = Math.atan2(vetorLD.y, vetorLD.x) * (180 / Math.PI);
        const anguloLE = Math.atan2(vetorLE.y, vetorLE.x) * (180 / Math.PI);
        const anguloEixo = (anguloLD + anguloLE) / 2;

        // Vetor transversal (início da ponte)
        const vetorTransversal = {
          x: leInicio.x - ldInicio.x,
          y: leInicio.y - ldInicio.y
        };
        
        const anguloTransversal = Math.atan2(vetorTransversal.y, vetorTransversal.x) * (180 / Math.PI);

        // CORREÇÃO: Cálculo correto do ângulo de esconsidade
        // O ângulo de esconsidade é a diferença entre o ângulo transversal e 90° em relação ao eixo
        let anguloEsconsidade = Math.abs(anguloTransversal - (anguloEixo + 90));
        
        // CORREÇÃO: Normalizar corretamente para o menor ângulo (0° a 90°)
        if (anguloEsconsidade > 90) {
          anguloEsconsidade = 180 - anguloEsconsidade;
        }
        
        // CORREÇÃO: Garantir que o ângulo esteja entre 0° e 90°
        anguloEsconsidade = Math.abs(anguloEsconsidade);
        if (anguloEsconsidade > 90) {
          anguloEsconsidade = 180 - anguloEsconsidade;
        }

        debugLog(`Ângulo LD: ${anguloLD.toFixed(2)}°`);
        debugLog(`Ângulo LE: ${anguloLE.toFixed(2)}°`);
        debugLog(`Ângulo Eixo: ${anguloEixo.toFixed(2)}°`);
        debugLog(`Ângulo Transversal: ${anguloTransversal.toFixed(2)}°`);
        debugLog(`Ângulo Esconsidade: ${anguloEsconsidade.toFixed(2)}°`);

        // Larguras medidas usando coordenadas UTM
        const larguraInicio = Math.sqrt(Math.pow(leInicio.x - ldInicio.x, 2) + Math.pow(leInicio.y - ldInicio.y, 2));
        const larguraFinal = Math.sqrt(Math.pow(leFinal.x - ldFinal.x, 2) + Math.pow(leFinal.y - ldFinal.y, 2));
        const larguraMedia = (larguraInicio + larguraFinal) / 2;

        // Largura efetiva (útil para passagem de veículos)
        const larguraEfetiva = larguraMedia * Math.cos(anguloEsconsidade * Math.PI / 180);

        // Comprimentos dos lados
        const comprimentoLD = Math.sqrt(Math.pow(vetorLD.x, 2) + Math.pow(vetorLD.y, 2));
        const comprimentoLE = Math.sqrt(Math.pow(vetorLE.x, 2) + Math.pow(vetorLE.y, 2));
        
        // Diferença de comprimentos (indicador de esconsidade)
        const diferencaComprimentos = Math.abs(comprimentoLD - comprimentoLE);
        
        // Análise da geometria
        let tipoGeometria = "Retângulo";
        let statusEsconsidade = "Não Esconsa";
        
        if (anguloEsconsidade > 5) {
          statusEsconsidade = "Esconsa";
          if (diferencaComprimentos > 0.5) {
            tipoGeometria = "Quadrilátero Irregular";
          } else {
            tipoGeometria = "Paralelogramo";
          }
        } else if (diferencaComprimentos > 0.5) {
          statusEsconsidade = "Levemente Esconsa";
          tipoGeometria = "Trapézio";
        }

        return {
          deltaX_Inicio,
          deltaY_Inicio,
          deltaX_Final,
          deltaY_Final,
          anguloEsconsidade,
          anguloEixo,
          anguloTransversal,
          larguraInicio,
          larguraFinal,
          larguraMedia,
          larguraEfetiva,
          comprimentoLD,
          comprimentoLE,
          diferencaComprimentos,
          tipoGeometria,
          statusEsconsidade,
          perdaLargura: larguraMedia - larguraEfetiva,
          percentualPerda: ((larguraMedia - larguraEfetiva) / larguraMedia) * 100
        };
      }

      function getElevationColor(elevation, minElev, maxElev) {
        const normalized = (elevation - minElev) / (maxElev - minElev);
        
        if (normalized < 0.25) return "#4caf50"; // Verde - baixo
        else if (normalized < 0.5) return "#ffeb3b"; // Amarelo - médio
        else if (normalized < 0.75) return "#ff9800"; // Laranja - alto
        else return "#f44336"; // Vermelho - muito alto
      }

    
      

      // Versão: 2.1 - Suporte expandido para variações de nomes de colunas
function findPoints(data) {
  debugLog("=== PROCURANDO PONTOS ===");
  const points = {};
  
  data.forEach((row, index) => {
    debugLog(`Processando linha ${index}: ${JSON.stringify(row)}`);
    
    // CORREÇÃO: Suporte expandido para variações de nome/código
    const name = row.Name || row.name || row.Ponto || row.ponto || 
                 row.Code || row.code || row.CODE || row.Codigo || row.codigo || "";
    const code = row.Code || row.code || row.CODE || row.Codigo || row.codigo || 
                 row.Name || row.name || row.Ponto || row.ponto || "";

    debugLog(`Nome: ${name}, Código: ${code}`);

    // Verificar se é um ponto de estrutura (OAE ou PONTE)
    const isStructurePoint = 
      code.includes("LD_INICIO_OAE") ||
      code.includes("LE_INICIO_OAE") ||
      code.includes("LD_FINAL_OAE") ||
      code.includes("LE_FINAL_OAE") ||
      name.includes("LD_INICIO_OAE") ||
      name.includes("LE_INICIO_OAE") ||
      name.includes("LD_FINAL_OAE") ||
      name.includes("LE_FINAL_OAE") ||
      // Novos formatos com PONTE
      code.includes("LD INICIO PONTE") ||
      code.includes("LE INICIO PONTE") ||
      code.includes("LD FINAL PONTE") ||
      code.includes("LE FINAL PONTE") ||
      code.includes("LD FINAL DE PONTE") ||
      code.includes("LE FINAL DE PONTE") ||
      name.includes("LD INICIO PONTE") ||
      name.includes("LE INICIO PONTE") ||
      name.includes("LD FINAL PONTE") ||
      name.includes("LE FINAL PONTE") ||
      name.includes("LD FINAL DE PONTE") ||
      name.includes("LE FINAL DE PONTE");

    if (isStructurePoint) {
      debugLog(`Ponto de estrutura encontrado: ${name || code}`);
      
      let xCoord, yCoord, elevation, lat, lng;

      // CORREÇÃO: Detectar coordenadas geográficas com mais variações
      if (row.LAT && row.LONG) {
        lat = parseFloat(row.LAT);
        lng = parseFloat(row.LONG);
        xCoord = lng;
        yCoord = lat;
      } else if (row.Lat && row.Long) {
        lat = parseFloat(row.Lat);
        lng = parseFloat(row.Long);
        xCoord = lng;
        yCoord = lat;
      } else if (row.lat && row.long) {
        lat = parseFloat(row.lat);
        lng = parseFloat(row.long);
        xCoord = lng;
        yCoord = lat;
      } else if (row.LATITUDE && row.LONGITUDE) {
        lat = parseFloat(row.LATITUDE);
        lng = parseFloat(row.LONGITUDE);
        xCoord = lng;
        yCoord = lat;
      } else if (row.Latitude && row.Longitude) {
        lat = parseFloat(row.Latitude);
        lng = parseFloat(row.Longitude);
        xCoord = lng;
        yCoord = lat;
      } else if (row.latitude && row.longitude) {
        lat = parseFloat(row.latitude);
        lng = parseFloat(row.longitude);
        xCoord = lng;
        yCoord = lat;
      } else if (row.Norte && row.Leste) {
        xCoord = parseFloat(row.Leste);
        yCoord = parseFloat(row.Norte);
      } else if (row.norte && row.leste) {
        xCoord = parseFloat(row.leste);
        yCoord = parseFloat(row.norte);
      } else if (row.Northing && row.Easting) {
        xCoord = parseFloat(row.Easting);
        yCoord = parseFloat(row.Northing);
      } else if (row.northing && row.easting) {
        xCoord = parseFloat(row.easting);
        yCoord = parseFloat(row.northing);
      } else if (row.x && row.y) {
        xCoord = parseFloat(row.x);
        yCoord = parseFloat(row.y);
      } else if (row.X && row.Y) {
        xCoord = parseFloat(row.X);
        yCoord = parseFloat(row.Y);
      } else if (row.Long || row.LONG || row.long) {
        xCoord = parseFloat(row.Long || row.LONG || row.long);
        yCoord = parseFloat(row.Lat || row.LAT || row.lat);
        lat = parseFloat(row.Lat || row.LAT || row.lat);
        lng = parseFloat(row.Long || row.LONG || row.long);
      }

      // CORREÇÃO: Elevação com suporte expandido para variações
      elevation = parseFloat(row.H_ORTHO) || 
                 parseFloat(row.H_ORTO) || 
                 parseFloat(row.H_GEO) ||
                 parseFloat(row.h_ortho) ||
                 parseFloat(row.h_orto) ||
                 parseFloat(row.h_geo) ||
                 parseFloat(row.Elev) || 
                 parseFloat(row.elev) ||
                 parseFloat(row.Elevation) || 
                 parseFloat(row.elevation) ||
                 parseFloat(row.Altura) || 
                 parseFloat(row.altura) ||
                 parseFloat(row.Z) || 
                 parseFloat(row.z) || 0;

      debugLog(`Coordenadas: x=${xCoord}, y=${yCoord}, elevação=${elevation}`);

      if (!isNaN(xCoord) && !isNaN(yCoord) && !isNaN(elevation)) {
        // Normalizar nomes para compatibilidade
        let normalizedCode = code || name;
        
        // Converter formatos de PONTE para OAE para compatibilidade
        normalizedCode = normalizedCode
          .replace("LD INICIO PONTE", "LD_INICIO_OAE")
          .replace("LE INICIO PONTE", "LE_INICIO_OAE")
          .replace("LD FINAL PONTE", "LD_FINAL_OAE")
          .replace("LE FINAL PONTE", "LE_FINAL_OAE")
          .replace("LD FINAL DE PONTE", "LD_FINAL_OAE")
          .replace("LE FINAL DE PONTE", "LE_FINAL_OAE");

        const pointData = {
          x: xCoord,
          y: yCoord,
          elevation: elevation,
          lat: lat || yCoord,
          long: lng || xCoord,
          longitude: lng || null,
          easting: parseFloat(row.Leste || row.leste || row.Easting || row.easting) || xCoord,
          northing: parseFloat(row.Norte || row.norte || row.Northing || row.northing) || yCoord,
          name: normalizedCode,
          code: normalizedCode,
          originalName: name,
          originalCode: code,
          // Detecção mais precisa do tipo de coordenada
          coordType: (lat && lng && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) ? 'GEO' :
                    ((row.Norte || row.norte || row.Leste || row.leste || row.Northing || row.northing || row.Easting || row.easting)) ? 'UTM' : 'PLANE'
        };
        
        // Determinar zona SIRGAS
        const sirgas = determineSirgas2000Zone(pointData);
        if (sirgas) {
          pointData.sirgasZone = sirgas;
          debugLog(`Zona SIRGAS determinada: ${sirgas}S`);
        }
        
        debugLog(`Ponto criado: ${JSON.stringify(pointData)}`);
        debugLog(`Tipo de coordenada: ${pointData.coordType}`);
        
        if (normalizedCode) points[normalizedCode] = pointData;
        if (code && code !== normalizedCode) points[code] = pointData;
        if (name && name !== code && name !== normalizedCode) points[name] = pointData;
      } else {
        debugLog(`Erro: coordenadas ou elevação inválidas`);
      }
    }
  });
  
  debugLog(`Total de pontos encontrados: ${Object.keys(points).length}`);
  debugLog(`Pontos: ${Object.keys(points).join(', ')}`);
  return points;
}

      // Função para determinar se inclinações são problemáticas (com novos limites)
      function getInclinationStatus(inclination, isTransversal = false) {
        const limit = isTransversal ? LIMIT_TRANSVERSAL : LIMIT_LONGITUDINAL;
        
        if (inclination.percentage > limit) {
          return { 
            class: "critical-warning-card", 
            icon: "🚨", 
            text: `ACIMA DO LIMITE (>${limit}%)`,
            color: "#d32f2f"
          };
        } else if (inclination.percentage > limit * 0.8) {
          return { 
            class: "warning-card", 
            icon: "⚠️", 
            text: `Próximo ao Limite (${(limit * 0.8).toFixed(1)}-${limit}%)`,
            color: "#ff5722"
          };
        } else if (inclination.percentage > limit * 0.5) {
          return { 
            class: "acceptable-card", 
            icon: "🔶", 
            text: `Moderada (${(limit * 0.5).toFixed(1)}-${(limit * 0.8).toFixed(1)}%)`,
            color: "#ff9800"
          };
        } else {
          return { 
            class: "good-card", 
            icon: "✅", 
            text: `Dentro do Limite (<${(limit * 0.5).toFixed(1)}%)`,
            color: "#4caf50"
          };
        }
      }

      function drawVisualization(points1, points2 = {}) {
        debugLog("=== INICIANDO DESENHO ===");
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let allStructurePoints = [];
        
        if (Object.keys(points1).length > 0) {
          allStructurePoints = allStructurePoints.concat(Object.values(points1));
        }
        
        if (Object.keys(points2).length > 0) {
          allStructurePoints = allStructurePoints.concat(Object.values(points2));
        }
        
        debugLog(`Total pontos para desenhar: ${allStructurePoints.length}`);
        
        if (allStructurePoints.length === 0) {
          debugLog("ERRO: Nenhum ponto para desenhar");
          return;
        }

        // CORREÇÃO: Converter coordenadas geográficas para UTM para visualização
        allStructurePoints.forEach(point => {
          if (point.coordType === 'GEO' && !point.utmX) {
            const utm = geographicToUTM(point.lat, point.long);
            point.utmX = utm.easting;
            point.utmY = utm.northing;
          }
        });

        // Calcular min/max para coordenadas (usar UTM se disponível)
        const getX = (p) => p.utmX || p.x;
        const getY = (p) => p.utmY || p.y;
        
        const minX = Math.min(...allStructurePoints.map(getX));
        const maxX = Math.max(...allStructurePoints.map(getX));
        const minY = Math.min(...allStructurePoints.map(getY));
        const maxY = Math.max(...allStructurePoints.map(getY));
        
        const minElev = Math.min(...allStructurePoints.map((p) => p.elevation));
        const maxElev = Math.max(...allStructurePoints.map((p) => p.elevation));
        
        debugLog(`Coordenadas - X: ${minX} a ${maxX}, Y: ${minY} a ${maxY}`);
        debugLog(`Elevações - Min: ${minElev}, Max: ${maxElev}`);

        const margin = 120;
        
        const dataRangeX = maxX - minX;
        const dataRangeY = maxY - minY;
        
        const rotationRad = (currentRotation * Math.PI) / 180;
        const cosTheta = Math.abs(Math.cos(rotationRad));
        const sinTheta = Math.abs(Math.sin(rotationRad));
        
        const effectiveWidth = dataRangeX * cosTheta + dataRangeY * sinTheta;
        const effectiveHeight = dataRangeX * sinTheta + dataRangeY * cosTheta;
        
        const scaleX = (canvas.width - 2 * margin) / effectiveWidth;
        const scaleY = (canvas.height - 2 * margin) / effectiveHeight;
        const scaleFactor = Object.keys(points2).length > 0 ? 0.3 : 0.5;
        const scale = Math.min(scaleX, scaleY) * scaleFactor * currentZoom;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        function toCanvasCoords(point) {
          const x = getX(point);
          const y = getY(point);
          
          const relX = x - (minX + maxX) / 2;
          const relY = y - (minY + maxY) / 2;
          
          const rotationRad = (currentRotation * Math.PI) / 180;
          const cosTheta = Math.cos(rotationRad);
          const sinTheta = Math.sin(rotationRad);
          
          const rotatedX = relX * cosTheta - relY * sinTheta;
          const rotatedY = relX * sinTheta + relY * cosTheta;
          
          return {
            x: centerX + rotatedX * scale,
            y: centerY - rotatedY * scale,
          };
        }

        function drawStructure(points, color, label) {
          debugLog(`Desenhando estrutura ${label}`);
          
          const ldInicio = Object.values(points).find(p => 
            p.code.includes("LD_INICIO_OAE") || 
            p.name.includes("LD_INICIO_OAE") ||
            p.originalCode.includes("LD_INICIO_OAE") ||
            p.originalName.includes("LD_INICIO_OAE")
          );
          
          const leInicio = Object.values(points).find(p => 
            p.code.includes("LE_INICIO_OAE") || 
            p.name.includes("LE_INICIO_OAE") ||
            p.originalCode.includes("LE_INICIO_OAE") ||
            p.originalName.includes("LE_INICIO_OAE")
          );
          
          const ldFinal = Object.values(points).find(p => 
            p.code.includes("LD_FINAL_OAE") || 
            p.name.includes("LD_FINAL_OAE") ||
            p.originalCode.includes("LD_FINAL_OAE") ||
            p.originalName.includes("LD_FINAL_OAE")
          );
          
          const leFinal = Object.values(points).find(p => 
            p.code.includes("LE_FINAL_OAE") || 
            p.name.includes("LE_FINAL_OAE") ||
            p.originalCode.includes("LE_FINAL_OAE") ||
            p.originalName.includes("LE_FINAL_OAE")
          );

          debugLog(`Pontos encontrados - LD Início: ${!!ldInicio}, LE Início: ${!!leInicio}, LD Final: ${!!ldFinal}, LE Final: ${!!leFinal}`);

          if (!ldInicio || !leInicio || !ldFinal || !leFinal) {
            debugLog("ERRO: Nem todos os pontos da estrutura foram encontrados");
            return null;
          }

          const ldInicioCanvas = toCanvasCoords(ldInicio);
          const leInicioCanvas = toCanvasCoords(leInicio);
          const ldFinalCanvas = toCanvasCoords(ldFinal);
          const leFinalCanvas = toCanvasCoords(leFinal);

          // Desenhar retângulo
          ctx.strokeStyle = color;
          const rectLineWidth = Math.max(1, Math.min(4, 2 * Math.sqrt(currentZoom)));
          ctx.lineWidth = rectLineWidth;
          ctx.beginPath();
          ctx.moveTo(ldInicioCanvas.x, ldInicioCanvas.y);
          ctx.lineTo(leInicioCanvas.x, leInicioCanvas.y);
          ctx.lineTo(leFinalCanvas.x, leFinalCanvas.y);
          ctx.lineTo(ldFinalCanvas.x, ldFinalCanvas.y);
          ctx.closePath();
          ctx.stroke();

          // Preencher retângulo com transparência
          const alpha = color === "#007bff" ? "0.08" : "0.04";
          ctx.fillStyle = color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
          if (color.startsWith("#")) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }
          ctx.fill();

          // Desenhar pontos com cores baseadas na elevação
          const pointData = [
            { point: ldInicio, canvas: ldInicioCanvas, baseColor: "#dc3545", label: `LD INÍCIO ${label}` },
            { point: leInicio, canvas: leInicioCanvas, baseColor: "#28a745", label: `LE INÍCIO ${label}` },
            { point: ldFinal, canvas: ldFinalCanvas, baseColor: "#dc3545", label: `LD FINAL ${label}` },
            { point: leFinal, canvas: leFinalCanvas, baseColor: "#28a745", label: `LE FINAL ${label}` },
          ];

          pointData.forEach(({ point, canvas, baseColor, label }) => {
            const elevationColor = getElevationColor(point.elevation, minElev, maxElev);
            
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            const pointRadius = Math.max(2, Math.min(8, 4 * Math.sqrt(currentZoom)));
            ctx.arc(canvas.x, canvas.y, pointRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = elevationColor;
            ctx.beginPath();
            ctx.arc(canvas.x, canvas.y, pointRadius * 0.7, 0, 2 * Math.PI);
            ctx.fill();

            const zoomFactor = Math.max(0.3, Math.min(2.0, 2.0 / Math.sqrt(currentZoom)));
            
            ctx.fillStyle = "#333";
            const fontSize = Math.max(4, 12 * zoomFactor);
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = "center";
            const labelOffset = Math.max(4, 15 * zoomFactor);
            ctx.fillText(label, canvas.x, canvas.y - labelOffset);
            
            const relativeElev = point.elevation - maxElev;
            
            const elevFontSize = Math.max(3, 9 * zoomFactor);
            ctx.font = `${elevFontSize}px Arial`;
            
            ctx.fillStyle = "#555";
            const elevOffset1 = Math.max(2, 8 * zoomFactor);
            const elevOffset2 = Math.max(4, 16 * zoomFactor);
            ctx.fillText(`Glob: ${point.elevation.toFixed(3)}m`, canvas.x, canvas.y + labelOffset + elevOffset1);
            
            if (Math.abs(relativeElev) < 0.001) {
              ctx.fillStyle = "#ff0000";
              ctx.font = `bold ${elevFontSize}px Arial`;
            } else {
              ctx.fillStyle = "#666";
              ctx.font = `${elevFontSize}px Arial`;
            }
            
            ctx.fillText(`Rel: ${relativeElev.toFixed(3)}m`, canvas.x, canvas.y + labelOffset + elevOffset2);
          });

          return { ldInicio, leInicio, ldFinal, leFinal };
        }

        const struct1 = drawStructure(points1, "#007bff", "(1)");
        const struct2 = Object.keys(points2).length > 0 ? drawStructure(points2, "#e91e63", "(2)") : null;

        // Desenhar linha de conexão
        if (struct1 && struct2) {
          const leInicio1Canvas = toCanvasCoords(struct1.leInicio);
          const ldInicio2Canvas = toCanvasCoords(struct2.ldInicio);

          ctx.strokeStyle = "#ff9800";
          const lineWidth = Math.max(1, Math.min(6, 3 * Math.sqrt(currentZoom)));
          ctx.lineWidth = lineWidth;
          const dashLength = Math.max(4, Math.min(20, 12 * Math.sqrt(currentZoom)));
          ctx.setLineDash([dashLength, dashLength/2]);
          ctx.beginPath();
          ctx.moveTo(leInicio1Canvas.x, leInicio1Canvas.y);
          ctx.lineTo(ldInicio2Canvas.x, ldInicio2Canvas.y);
          ctx.stroke();
          ctx.setLineDash([]);

          const zoomFactor = Math.max(0.3, Math.min(2.0, 2.0 / Math.sqrt(currentZoom)));
          const offsetDistance = Math.max(40, Math.min(150, 80 * Math.sqrt(currentZoom)));
          
          const rotationRad = (currentRotation * Math.PI) / 180;
          const offsetX = offsetDistance * Math.cos(-rotationRad);
          const offsetY = offsetDistance * Math.sin(-rotationRad);
          
          const midX = (leInicio1Canvas.x + ldInicio2Canvas.x) / 2 + offsetX;
          const midY = (leInicio1Canvas.y + ldInicio2Canvas.y) / 2 + offsetY;
          const crossDistance = calculateDistance(struct1.leInicio, struct2.ldInicio);
          
          const textWidth = Math.max(60, 110 * zoomFactor);
          const textHeight = Math.max(20, 35 * zoomFactor);
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.fillRect(midX - textWidth/2, midY - textHeight/2, textWidth, textHeight);
          
          ctx.strokeStyle = "#ff9800";
          ctx.lineWidth = 1;
          ctx.strokeRect(midX - textWidth/2, midY - textHeight/2, textWidth, textHeight);
          
          ctx.fillStyle = "#ff9800";
          const crossFontSize = Math.max(6, 18 * zoomFactor);
          ctx.font = `bold ${crossFontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${crossDistance.toFixed(3)}m`, midX, midY);
        }

        debugLog("Desenho concluído, chamando showDistanceInfo");
        showDistanceInfo(struct1, struct2);
      }

      function showDistanceInfo(struct1, struct2) {
        debugLog("=== GERANDO RELATÓRIO DE CONFORMIDADE ===");
        const infoPanel = document.getElementById("infoPanel");
        const distanceInfo = document.getElementById("distanceInfo");

        if (!struct1) {
          debugLog("ERRO: struct1 é null, não é possível gerar relatório");
          return;
        }

        let html = '';

        // INFORMAÇÕES DO SISTEMA DE COORDENADAS E ZONA SIRGAS
        const ldInicio1 = Object.values(struct1).find(p => 
          p && (p.code.includes("LD_INICIO_OAE") || p.name.includes("LD_INICIO_OAE"))
        );
        
        let struct2LdInicio = null;
        if (struct2) {
          struct2LdInicio = Object.values(struct2).find(p => 
            p && (p.code.includes("LD_INICIO_OAE") || p.name.includes("LD_INICIO_OAE"))
          );
        }

        if (ldInicio1) {
          html += `
            <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f8f9fa); border: 3px solid #1976d2; margin-bottom: 20px; grid-column: 1 / -1;">
              <div><strong>🗺️ SISTEMA DE COORDENADAS DETECTADO</strong></div>
              <div style="margin-top: 10px;">
                <div style="font-size: 16px; font-weight: bold; color: #1976d2;">
                  ${ldInicio1.sirgasZone ? `SIRGAS 2000 / UTM Zone ${ldInicio1.sirgasZone}S` : 'Sistema não identificado automaticamente'}
                </div>
                ${ldInicio1.sirgasZone ? `
                <div style="font-size: 14px; color: #1565c0; margin-top: 5px;">
                  📍 Código EPSG: ${31984 + ldInicio1.sirgasZone - 17} (Zona ${ldInicio1.sirgasZone}S)
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 8px;">
                  <strong>Estrutura 1:</strong> Tipo: ${ldInicio1.coordType} | ${ldInicio1.coordType === 'GEO' ? `LAT: ${ldInicio1.lat.toFixed(8)}, LONG: ${ldInicio1.long.toFixed(8)}` : `E: ${ldInicio1.easting?.toFixed(3)}m, N: ${ldInicio1.northing?.toFixed(3)}m`}
                  ${struct2LdInicio && struct2LdInicio.sirgasZone ? `<br><strong>Estrutura 2:</strong> Zona ${struct2LdInicio.sirgasZone}S detectada` : ''}
                </div>
                ` : `
                <div style="font-size: 12px; color: #ff9800; margin-top: 5px;">
                  ⚠️ Para determinação automática da zona SIRGAS, utilize coordenadas geográficas ou UTM
                </div>
                `}
              </div>
            </div>
          `;
        }



        // Cálculos estrutura 01


        const dist1Inicio = calculateDistance(struct1.ldInicio, struct1.leInicio);
        const dist1Final = calculateDistance(struct1.ldFinal, struct1.leFinal);
        const dist1LD = calculateDistance(struct1.ldInicio, struct1.ldFinal);
        const dist1LE = calculateDistance(struct1.leInicio, struct1.leFinal);
        const media1Largura = (dist1Inicio + dist1Final) / 2;
        const media1Comprimento = (dist1LD + dist1LE) / 2;

        // ANÁLISES DE ELEVAÇÃO ESTRUTURA 1
        const elev1_LD_LE_Inicio = calculateElevationDifference(struct1.ldInicio, struct1.leInicio);
        const elev1_LD_LE_Final = calculateElevationDifference(struct1.ldFinal, struct1.leFinal);
        const elev1_Inicio_Final_LD = calculateElevationDifference(struct1.ldInicio, struct1.ldFinal);
        const elev1_Inicio_Final_LE = calculateElevationDifference(struct1.leInicio, struct1.leFinal);

        // ANÁLISE DE ESCONSIDADE ESTRUTURA 1
        const skew1 = calculateSkewAnalysis(struct1);

        // INCLINAÇÕES ESTRUTURA 1
        const incl1_LD_LE_Inicio = calculateInclination(struct1.ldInicio, struct1.leInicio);
        const incl1_LD_LE_Final = calculateInclination(struct1.ldFinal, struct1.leFinal);
        const incl1_Inicio_Final_LD = calculateInclination(struct1.ldInicio, struct1.ldFinal);
        const incl1_Inicio_Final_LE = calculateInclination(struct1.leInicio, struct1.leFinal);

        // ANÁLISE COMPARATIVA PRIMEIRO se tiver 2 estruturas
        if (struct2) {
          const dist2Inicio = calculateDistance(struct2.ldInicio, struct2.leInicio);
          const dist2Final = calculateDistance(struct2.ldFinal, struct2.leFinal);
          const dist2LD = calculateDistance(struct2.ldInicio, struct2.ldFinal);
          const dist2LE = calculateDistance(struct2.leInicio, struct2.leFinal);
          const media2Largura = (dist2Inicio + dist2Final) / 2;
          const media2Comprimento = (dist2LD + dist2LE) / 2;

          // ANÁLISES ENTRE ESTRUTURAS
          const crossDistance = calculateDistance(struct1.leInicio, struct2.ldInicio);
          const crossElevation = calculateElevationDifference(struct1.leInicio, struct2.ldInicio);
          const crossInclination = calculateInclination(struct1.leInicio, struct2.ldInicio);
          
          // Análises comparativas
          const diferencaLargura = Math.abs(media1Largura - media2Largura);
          const diferencaComprimento = Math.abs(media1Comprimento - media2Comprimento);
          
          // Médias gerais entre as duas estruturas
          const mediaGeralLargura = (media1Largura + media2Largura) / 2;
          const mediaGeralComprimento = (media1Comprimento + media2Comprimento) / 2;

          // Cálculos estrutura 2 para elevação
          const elev2_LD_LE_Inicio = calculateElevationDifference(struct2.ldInicio, struct2.leInicio);
          const elev2_LD_LE_Final = calculateElevationDifference(struct2.ldFinal, struct2.leFinal);
          const elev2_Inicio_Final_LD = calculateElevationDifference(struct2.ldInicio, struct2.ldFinal);
          const elev2_Inicio_Final_LE = calculateElevationDifference(struct2.leInicio, struct2.leFinal);

          const incl2_LD_LE_Inicio = calculateInclination(struct2.ldInicio, struct2.leInicio);
          const incl2_LD_LE_Final = calculateInclination(struct2.ldFinal, struct2.leFinal);
          const incl2_Inicio_Final_LD = calculateInclination(struct2.ldInicio, struct2.ldFinal);
          const incl2_Inicio_Final_LE = calculateInclination(struct2.leInicio, struct2.leFinal);

          // ANÁLISE DE ESCONSIDADE ESTRUTURA 2
          const skew2 = calculateSkewAnalysis(struct2);

          // Calcular distâncias X e Y
          let deltaX = 0;
          let deltaY = 0;
          
          if (struct1.leInicio && struct2.ldInicio) {
            const x1 = parseFloat(struct1.leInicio.x);
            const y1 = parseFloat(struct1.leInicio.y);
            const x2 = parseFloat(struct2.ldInicio.x);
            const y2 = parseFloat(struct2.ldInicio.y);
            
            if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
              deltaX = Math.abs(x2 - x1);
              deltaY = Math.abs(y2 - y1);
              
              if ((struct1.leInicio.coordType === 'UTM' && struct2.ldInicio.coordType === 'UTM') || 
                  (struct1.leInicio.coordType === 'PLANE' && struct2.ldInicio.coordType === 'PLANE')) {
                // deltaX e deltaY já estão em metros
              }
              else if ((struct1.leInicio.coordType === 'GEO' && struct2.ldInicio.coordType === 'GEO') ||
                       (Math.abs(x1) < 180 && Math.abs(y1) < 90 && Math.abs(x2) < 180 && Math.abs(y2) < 90)) {
                const avgLatRad = ((y1 + y2) / 2 * Math.PI) / 180;
                deltaX = deltaX * 111320 * Math.cos(avgLatRad);
                deltaY = deltaY * 111320;
              }
            }
          }
          
          // Status da inclinação entre estruturas (considerar como longitudinal)
          const crossStatus = getInclinationStatus(crossInclination, false);
          
          html += `
            <div class="distance-card cross-section">
              <div><strong>🔍 ANÁLISE COMPARATIVA ENTRE ESTRUTURAS</strong></div>
            </div>
            <div class="distance-card cross-distance-card">
              <div><strong>🌉 Distância Entre Estruturas</strong></div>
              <div class="distance-value cross-distance-value">${crossDistance.toFixed(3)} m</div>
              <small>LE_INÍCIO (1) ↔ LD_INÍCIO (2)</small>
            </div>
            <div class="distance-card elevation-analysis-card">
              <div><strong>📏 Diferença de Elevação</strong></div>
              <div class="elevation-value" style="color: ${crossElevation >= 0 ? '#4caf50' : '#f44336'};">${crossElevation >= 0 ? '+' : ''}${crossElevation.toFixed(3)} m</div>
              <small>Entre estruturas (LE1→LD2)</small>
            </div>
            <div class="distance-card ${crossStatus.class}">
              <div><strong>${crossStatus.icon} Inclinação Entre Estruturas</strong></div>
              <div class="inclination-value" style="color: ${crossStatus.color};">${crossInclination.percentage.toFixed(2)}% (${crossInclination.degrees.toFixed(1)}°)</div>
              <small>${crossInclination.direction} - ${crossStatus.text}</small>
              <div style="font-size: 11px; margin-top: 5px; color: #666;">Limite longitudinal: ≤${LIMIT_LONGITUDINAL}%</div>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
              <div><strong>📐 Distância em X</strong></div>
              <div class="distance-value" style="color: #6c757d;">${deltaX.toFixed(3)} m</div>
              <small>Diferença horizontal</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
              <div><strong>📐 Distância em Y</strong></div>
              <div class="distance-value" style="color: #6c757d;">${deltaY.toFixed(3)} m</div>
              <small>Diferença vertical</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid #9c27b0;">
              <div><strong>📏 Média Geral Largura</strong></div>
              <div class="distance-value" style="color: #9c27b0;">${mediaGeralLargura.toFixed(3)} m</div>
              <small>(Est.1 + Est.2) ÷ 2</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e8f5e8, #fff3e0); border: 2px solid #ff9800;">
              <div><strong>📐 Média Geral Comprimento</strong></div>
              <div class="distance-value" style="color: #ff9800;">${mediaGeralComprimento.toFixed(3)} m</div>
              <small>(Est.1 + Est.2) ÷ 2</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #ffebee, #f3e5f5); border: 2px solid #e91e63;">
              <div><strong>Diferença de Larguras</strong></div>
              <div class="distance-value" style="color: #e91e63;">${diferencaLargura.toFixed(3)} m</div>
              <small>|Estrutura 1 - Estrutura 2|</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e8f5e8, #e0f2f1); border: 2px solid #4caf50;">
              <div><strong>Diferença de Comprimentos</strong></div>
              <div class="distance-value" style="color: #4caf50;">${diferencaComprimento.toFixed(3)} m</div>
              <small>|Estrutura 1 - Estrutura 2|</small>
            </div>
          `;
        }

        // ESTRUTURA 1 - DISTÂNCIAS E ELEVAÇÕES
        html += `
          <div class="section-divider"></div>
          <div class="distance-card structure-section">
            <div><strong>🏗️ ESTRUTURA 1 (AZUL) - Dimensões</strong></div>
          </div>
          <div class="distance-card">
            <div><strong>Largura Início</strong></div>
            <div class="distance-value">${dist1Inicio.toFixed(3)} m</div>
            <small>LD_INÍCIO ↔ LE_INÍCIO</small>
          </div>
          <div class="distance-card">
            <div><strong>Largura Final</strong></div>
            <div class="distance-value">${dist1Final.toFixed(3)} m</div>
            <small>LD_FINAL ↔ LE_FINAL</small>
          </div>
          <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid #9c27b0;">
            <div><strong>📏 Média Largura</strong></div>
            <div class="distance-value" style="color: #9c27b0;">${media1Largura.toFixed(3)} m</div>
            <small>Estrutura 1</small>
          </div>
          <div class="distance-card">
            <div><strong>Comprimento LD</strong></div>
            <div class="distance-value">${dist1LD.toFixed(3)} m</div>
            <small>LD_INÍCIO ↔ LD_FINAL</small>
          </div>
          <div class="distance-card">
            <div><strong>Comprimento LE</strong></div>
            <div class="distance-value">${dist1LE.toFixed(3)} m</div>
            <small>LE_INÍCIO ↔ LE_FINAL</small>
          </div>
          <div class="distance-card" style="background: linear-gradient(135deg, #e8f5e8, #fff3e0); border: 2px solid #ff9800;">
            <div><strong>📐 Média Comprimento</strong></div>
            <div class="distance-value" style="color: #ff9800;">${media1Comprimento.toFixed(3)} m</div>
            <small>Estrutura 1</small>
          </div>
          
          <div class="distance-card structure-section">
            <div><strong>📐 ESTRUTURA 1 (AZUL) - Análise de Esconsidade</strong></div>
          </div>
          <div class="distance-card" style="background: linear-gradient(135deg, #fff3e0, #e8f5e8); border: 2px solid #ff9800;">
            <div><strong>📏 Ângulo de Esconsidade</strong></div>
            <div class="distance-value" style="color: #ff9800;">${skew1.anguloEsconsidade.toFixed(2)}°</div>
            <small>${skew1.statusEsconsidade} - ${skew1.tipoGeometria}</small>
          </div>
          <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid #2196f3;">
            <div><strong>📐 Largura Útil (Efetiva)</strong></div>
            <div class="distance-value" style="color: #2196f3;">${skew1.larguraEfetiva.toFixed(3)} m</div>
            <small>Largura real para passagem de veículos</small>
          </div>
          <div class="distance-card" style="background: linear-gradient(135deg, #ffebee, #fff3e0); border: 2px solid #f44336;">
            <div><strong>📉 Perda de Largura</strong></div>
            <div class="distance-value" style="color: #f44336;">${skew1.perdaLargura.toFixed(3)} m (${skew1.percentualPerda.toFixed(1)}%)</div>
            <small>Redução devido à esconsidade</small>
          </div>
          <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
            <div><strong>📏 Distância em X (LD↔LE Início)</strong></div>
            <div class="distance-value" style="color: #6c757d;">${skew1.deltaX_Inicio.toFixed(3)} m</div>
            <small>Componente horizontal</small>
          </div>
          <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
            <div><strong>📐 Distância em Y (LD↔LE Início)</strong></div>
            <div class="distance-value" style="color: #6c757d;">${skew1.deltaY_Inicio.toFixed(3)} m</div>
            <small>Componente vertical</small>
          </div>
          <div class="distance-card" style="background: linear-gradient(135deg, #e8f5e8, #fff3e0); border: 2px solid #4caf50;">
            <div><strong>⚖️ Diferença de Comprimentos</strong></div>
            <div class="distance-value" style="color: #4caf50;">${skew1.diferencaComprimentos.toFixed(3)} m</div>
            <small>|Comprimento LD - Comprimento LE|</small>
          </div>
          
          <div class="distance-card elevation-section">
            <div><strong>📏 ESTRUTURA 1 - Análise de Elevação</strong></div>
          </div>
          <div class="distance-card elevation-analysis-card">
            <div><strong>Diferença LD↔LE (Início com Início)</strong></div>
            <div class="elevation-value" style="color: ${elev1_LD_LE_Inicio >= 0 ? '#4caf50' : '#f44336'};">${elev1_LD_LE_Inicio >= 0 ? '+' : ''}${elev1_LD_LE_Inicio.toFixed(3)} m</div>
            <small>Inclinação transversal - mesmo ponto</small>
          </div>
          <div class="distance-card elevation-analysis-card">
            <div><strong>Diferença LD↔LE (Final com Final)</strong></div>
            <div class="elevation-value" style="color: ${elev1_LD_LE_Final >= 0 ? '#4caf50' : '#f44336'};">${elev1_LD_LE_Final >= 0 ? '+' : ''}${elev1_LD_LE_Final.toFixed(3)} m</div>
            <small>Inclinação transversal - mesmo ponto</small>
          </div>
          <div class="distance-card elevation-analysis-card">
            <div><strong>Diferença LD: Início↔Final (Direito com Direito)</strong></div>
            <div class="elevation-value" style="color: ${elev1_Inicio_Final_LD >= 0 ? '#4caf50' : '#f44336'};">${elev1_Inicio_Final_LD >= 0 ? '+' : ''}${elev1_Inicio_Final_LD.toFixed(3)} m</div>
            <small>Inclinação longitudinal - mesmo lado</small>
          </div>
          <div class="distance-card elevation-analysis-card">
            <div><strong>Diferença LE: Início↔Final (Esquerdo com Esquerdo)</strong></div>
            <div class="elevation-value" style="color: ${elev1_Inicio_Final_LE >= 0 ? '#4caf50' : '#f44336'};">${elev1_Inicio_Final_LE >= 0 ? '+' : ''}${elev1_Inicio_Final_LE.toFixed(3)} m</div>
            <small>Inclinação longitudinal - mesmo lado</small>
          </div>
          
          <div class="distance-card elevation-section">
            <div><strong>📐 ESTRUTURA 1 - Verificação de Conformidade</strong></div>
          </div>
        `;

        // Verificação de conformidade para estrutura 1
        const status1_LD_LE_Inicio = getInclinationStatus(incl1_LD_LE_Inicio, true);
        const status1_LD_LE_Final = getInclinationStatus(incl1_LD_LE_Final, true);
        const status1_Inicio_Final_LD = getInclinationStatus(incl1_Inicio_Final_LD, false);
        const status1_Inicio_Final_LE = getInclinationStatus(incl1_Inicio_Final_LE, false);

        html += `
          <div class="distance-card ${status1_LD_LE_Inicio.class}">
            <div><strong>${status1_LD_LE_Inicio.icon} Transversal: LD↔LE (Início com Início)</strong></div>
            <div class="inclination-value" style="color: ${status1_LD_LE_Inicio.color};">${incl1_LD_LE_Inicio.percentage.toFixed(2)}% (${incl1_LD_LE_Inicio.degrees.toFixed(1)}°)</div>
            <small>${incl1_LD_LE_Inicio.direction} - ${status1_LD_LE_Inicio.text}</small>
            <div style="font-size: 11px; margin-top: 5px; color: #666;">
              📏 Distância: ${dist1Inicio.toFixed(3)}m | Desnível: ${Math.abs(elev1_LD_LE_Inicio).toFixed(3)}m<br>
              📐 Cálculo: ${Math.abs(elev1_LD_LE_Inicio).toFixed(3)}m ÷ ${dist1Inicio.toFixed(3)}m × 100 = ${incl1_LD_LE_Inicio.percentage.toFixed(2)}%<br>
              Limite transversal: ≤${LIMIT_TRANSVERSAL}%
            </div>
          </div>
          <div class="distance-card ${status1_LD_LE_Final.class}">
            <div><strong>${status1_LD_LE_Final.icon} Transversal: LD↔LE (Final com Final)</strong></div>
            <div class="inclination-value" style="color: ${status1_LD_LE_Final.color};">${incl1_LD_LE_Final.percentage.toFixed(2)}% (${incl1_LD_LE_Final.degrees.toFixed(1)}°)</div>
            <small>${incl1_LD_LE_Final.direction} - ${status1_LD_LE_Final.text}</small>
            <div style="font-size: 11px; margin-top: 5px; color: #666;">
              📏 Distância: ${dist1Final.toFixed(3)}m | Desnível: ${Math.abs(elev1_LD_LE_Final).toFixed(3)}m<br>
              📐 Cálculo: ${Math.abs(elev1_LD_LE_Final).toFixed(3)}m ÷ ${dist1Final.toFixed(3)}m × 100 = ${incl1_LD_LE_Final.percentage.toFixed(2)}%<br>
              Limite transversal: ≤${LIMIT_TRANSVERSAL}%
            </div>
          </div>
          <div class="distance-card ${status1_Inicio_Final_LD.class}">
            <div><strong>${status1_Inicio_Final_LD.icon} Longitudinal: LD (Direito com Direito)</strong></div>
            <div class="inclination-value" style="color: ${status1_Inicio_Final_LD.color};">${incl1_Inicio_Final_LD.percentage.toFixed(2)}% (${incl1_Inicio_Final_LD.degrees.toFixed(1)}°)</div>
            <small>${incl1_Inicio_Final_LD.direction} - ${status1_Inicio_Final_LD.text}</small>
            <div style="font-size: 11px; margin-top: 5px; color: #666;">
              📏 Distância: ${dist1LD.toFixed(3)}m | Desnível: ${Math.abs(elev1_Inicio_Final_LD).toFixed(3)}m<br>
              📐 Cálculo: ${Math.abs(elev1_Inicio_Final_LD).toFixed(3)}m ÷ ${dist1LD.toFixed(3)}m × 100 = ${incl1_Inicio_Final_LD.percentage.toFixed(2)}%<br>
              Limite longitudinal: ≤${LIMIT_LONGITUDINAL}%
            </div>
          </div>
          <div class="distance-card ${status1_Inicio_Final_LE.class}">
            <div><strong>${status1_Inicio_Final_LE.icon} Longitudinal: LE (Esquerdo com Esquerdo)</strong></div>
            <div class="inclination-value" style="color: ${status1_Inicio_Final_LE.color};">${incl1_Inicio_Final_LE.percentage.toFixed(2)}% (${incl1_Inicio_Final_LE.degrees.toFixed(1)}°)</div>
            <small>${incl1_Inicio_Final_LE.direction} - ${status1_Inicio_Final_LE.text}</small>
            <div style="font-size: 11px; margin-top: 5px; color: #666;">
              📏 Distância: ${dist1LE.toFixed(3)}m | Desnível: ${Math.abs(elev1_Inicio_Final_LE).toFixed(3)}m<br>
              📐 Cálculo: ${Math.abs(elev1_Inicio_Final_LE).toFixed(3)}m ÷ ${dist1LE.toFixed(3)}m × 100 = ${incl1_Inicio_Final_LE.percentage.toFixed(2)}%<br>
              Limite longitudinal: ≤${LIMIT_LONGITUDINAL}%
            </div>
          </div>
        `;

        // ESTRUTURA 2 (se existir)
        if (struct2) {
          const dist2Inicio = calculateDistance(struct2.ldInicio, struct2.leInicio);
          const dist2Final = calculateDistance(struct2.ldFinal, struct2.leFinal);
          const dist2LD = calculateDistance(struct2.ldInicio, struct2.ldFinal);
          const dist2LE = calculateDistance(struct2.leInicio, struct2.leFinal);
          const media2Largura = (dist2Inicio + dist2Final) / 2;
          const media2Comprimento = (dist2LD + dist2LE) / 2;

          const elev2_LD_LE_Inicio = calculateElevationDifference(struct2.ldInicio, struct2.leInicio);
          const elev2_LD_LE_Final = calculateElevationDifference(struct2.ldFinal, struct2.leFinal);
          const elev2_Inicio_Final_LD = calculateElevationDifference(struct2.ldInicio, struct2.ldFinal);
          const elev2_Inicio_Final_LE = calculateElevationDifference(struct2.leInicio, struct2.leFinal);

          const incl2_LD_LE_Inicio = calculateInclination(struct2.ldInicio, struct2.leInicio);
          const incl2_LD_LE_Final = calculateInclination(struct2.ldFinal, struct2.leFinal);
          const incl2_Inicio_Final_LD = calculateInclination(struct2.ldInicio, struct2.ldFinal);
          const incl2_Inicio_Final_LE = calculateInclination(struct2.leInicio, struct2.leFinal);

          // ANÁLISE DE ESCONSIDADE ESTRUTURA 2
          const skew2 = calculateSkewAnalysis(struct2);

          html += `
            <div class="section-divider"></div>
            <div class="distance-card structure-section">
              <div><strong>🏗️ ESTRUTURA 2 (ROSA) - Dimensões</strong></div>
            </div>
            <div class="distance-card">
              <div><strong>Largura Início</strong></div>
              <div class="distance-value">${dist2Inicio.toFixed(3)} m</div>
              <small>LD_INÍCIO ↔ LE_INÍCIO</small>
            </div>
            <div class="distance-card">
              <div><strong>Largura Final</strong></div>
              <div class="distance-value">${dist2Final.toFixed(3)} m</div>
              <small>LD_FINAL ↔ LE_FINAL</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid #9c27b0;">
              <div><strong>📏 Média Largura</strong></div>
              <div class="distance-value" style="color: #9c27b0;">${media2Largura.toFixed(3)} m</div>
              <small>Estrutura 2</small>
            </div>
            <div class="distance-card">
              <div><strong>Comprimento LD</strong></div>
              <div class="distance-value">${dist2LD.toFixed(3)} m</div>
              <small>LD_INÍCIO ↔ LD_FINAL</small>
            </div>
            <div class="distance-card">
              <div><strong>Comprimento LE</strong></div>
              <div class="distance-value">${dist2LE.toFixed(3)} m</div>
              <small>LE_INÍCIO ↔ LE_FINAL</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e8f5e8, #fff3e0); border: 2px solid #ff9800;">
              <div><strong>📐 Média Comprimento</strong></div>
              <div class="distance-value" style="color: #ff9800;">${media2Comprimento.toFixed(3)} m</div>
              <small>Estrutura 2</small>
            </div>
            
            <div class="distance-card structure-section">
              <div><strong>📐 ESTRUTURA 2 (ROSA) - Análise de Esconsidade</strong></div>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #fff3e0, #e8f5e8); border: 2px solid #ff9800;">
              <div><strong>📏 Ângulo de Esconsidade</strong></div>
              <div class="distance-value" style="color: #ff9800;">${skew2.anguloEsconsidade.toFixed(2)}°</div>
              <small>${skew2.statusEsconsidade} - ${skew2.tipoGeometria}</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid #2196f3;">
              <div><strong>📐 Largura Útil (Efetiva)</strong></div>
              <div class="distance-value" style="color: #2196f3;">${skew2.larguraEfetiva.toFixed(3)} m</div>
              <small>Largura real para passagem de veículos</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #ffebee, #fff3e0); border: 2px solid #f44336;">
              <div><strong>📉 Perda de Largura</strong></div>
              <div class="distance-value" style="color: #f44336;">${skew2.perdaLargura.toFixed(3)} m (${skew2.percentualPerda.toFixed(1)}%)</div>
              <small>Redução devido à esconsidade</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
              <div><strong>📏 Distância em X (LD↔LE Início)</strong></div>
              <div class="distance-value" style="color: #6c757d;">${skew2.deltaX_Inicio.toFixed(3)} m</div>
              <small>Componente horizontal</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
              <div><strong>📐 Distância em Y (LD↔LE Início)</strong></div>
              <div class="distance-value" style="color: #6c757d;">${skew2.deltaY_Inicio.toFixed(3)} m</div>
              <small>Componente vertical</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e8f5e8, #fff3e0); border: 2px solid #4caf50;">
              <div><strong>⚖️ Diferença de Comprimentos</strong></div>
              <div class="distance-value" style="color: #4caf50;">${skew2.diferencaComprimentos.toFixed(3)} m</div>
              <small>|Comprimento LD - Comprimento LE|</small>
            </div>
            
            <div class="distance-card elevation-section">
              <div><strong>📏 ESTRUTURA 2 - Análise de Elevação</strong></div>
            </div>
            <div class="distance-card elevation-analysis-card">
              <div><strong>Diferença LD↔LE (Início)</strong></div>
              <div class="elevation-value" style="color: ${elev2_LD_LE_Inicio >= 0 ? '#4caf50' : '#f44336'};">${elev2_LD_LE_Inicio >= 0 ? '+' : ''}${elev2_LD_LE_Inicio.toFixed(3)} m</div>
              <small>Inclinação transversal início</small>
            </div>
            <div class="distance-card elevation-analysis-card">
              <div><strong>Diferença LD↔LE (Final)</strong></div>
              <div class="elevation-value" style="color: ${elev2_LD_LE_Final >= 0 ? '#4caf50' : '#f44336'};">${elev2_LD_LE_Final >= 0 ? '+' : ''}${elev2_LD_LE_Final.toFixed(3)} m</div>
              <small>Inclinação transversal final</small>
            </div>
            <div class="distance-card elevation-analysis-card">
              <div><strong>Diferença Início↔Final (LD)</strong></div>
              <div class="elevation-value" style="color: ${elev2_Inicio_Final_LD >= 0 ? '#4caf50' : '#f44336'};">${elev2_Inicio_Final_LD >= 0 ? '+' : ''}${elev2_Inicio_Final_LD.toFixed(3)} m</div>
              <small>Inclinação longitudinal LD</small>
            </div>
            <div class="distance-card elevation-analysis-card">
              <div><strong>Diferença Início↔Final (LE)</strong></div>
              <div class="elevation-value" style="color: ${elev2_Inicio_Final_LE >= 0 ? '#4caf50' : '#f44336'};">${elev2_Inicio_Final_LE >= 0 ? '+' : ''}${elev2_Inicio_Final_LE.toFixed(3)} m</div>
              <small>Inclinação longitudinal LE</small>
            </div>
            
            <div class="distance-card elevation-section">
              <div><strong>📐 ESTRUTURA 2 - Verificação de Conformidade</strong></div>
            </div>
          `;

          // Verificação de conformidade para estrutura 2
          const status2_LD_LE_Inicio = getInclinationStatus(incl2_LD_LE_Inicio, true);
          const status2_LD_LE_Final = getInclinationStatus(incl2_LD_LE_Final, true);
          const status2_Inicio_Final_LD = getInclinationStatus(incl2_Inicio_Final_LD, false);
          const status2_Inicio_Final_LE = getInclinationStatus(incl2_Inicio_Final_LE, false);

          html += `
            <div class="distance-card ${status2_LD_LE_Inicio.class}">
              <div><strong>${status2_LD_LE_Inicio.icon} Transversal: LD↔LE (Início com Início)</strong></div>
              <div class="inclination-value" style="color: ${status2_LD_LE_Inicio.color};">${incl2_LD_LE_Inicio.percentage.toFixed(2)}% (${incl2_LD_LE_Inicio.degrees.toFixed(1)}°)</div>
              <small>${incl2_LD_LE_Inicio.direction} - ${status2_LD_LE_Inicio.text}</small>
              <div style="font-size: 11px; margin-top: 5px; color: #666;">Limite transversal: ≤${LIMIT_TRANSVERSAL}%</div>
            </div>
            <div class="distance-card ${status2_LD_LE_Final.class}">
              <div><strong>${status2_LD_LE_Final.icon} Transversal: LD↔LE (Final com Final)</strong></div>
              <div class="inclination-value" style="color: ${status2_LD_LE_Final.color};">${incl2_LD_LE_Final.percentage.toFixed(2)}% (${incl2_LD_LE_Final.degrees.toFixed(1)}°)</div>
              <small>${incl2_LD_LE_Final.direction} - ${status2_LD_LE_Final.text}</small>
              <div style="font-size: 11px; margin-top: 5px; color: #666;">Limite transversal: ≤${LIMIT_TRANSVERSAL}%</div>
            </div>
            <div class="distance-card ${status2_Inicio_Final_LD.class}">
              <div><strong>${status2_Inicio_Final_LD.icon} Longitudinal: LD (Direito com Direito)</strong></div>
              <div class="inclination-value" style="color: ${status2_Inicio_Final_LD.color};">${incl2_Inicio_Final_LD.percentage.toFixed(2)}% (${incl2_Inicio_Final_LD.degrees.toFixed(1)}°)</div>
              <small>${incl2_Inicio_Final_LD.direction} - ${status2_Inicio_Final_LD.text}</small>
              <div style="font-size: 11px; margin-top: 5px; color: #666;">Limite longitudinal: ≤${LIMIT_LONGITUDINAL}%</div>
            </div>
            <div class="distance-card ${status2_Inicio_Final_LE.class}">
              <div><strong>${status2_Inicio_Final_LE.icon} Longitudinal: LE (Esquerdo com Esquerdo)</strong></div>
              <div class="inclination-value" style="color: ${status2_Inicio_Final_LE.color};">${incl2_Inicio_Final_LE.percentage.toFixed(2)}% (${incl2_Inicio_Final_LE.degrees.toFixed(1)}°)</div>
              <small>${incl2_Inicio_Final_LE.direction} - ${status2_Inicio_Final_LE.text}</small>
              <div style="font-size: 11px; margin-top: 5px; color: #666;">Limite longitudinal: ≤${LIMIT_LONGITUDINAL}%</div>
            </div>
          `;

          // Verificar problemas de inclinação com novos limites
          const problemasTransversais = [];
          const problemasLongitudinais = [];
          
          if (incl1_LD_LE_Inicio.percentage > LIMIT_TRANSVERSAL) problemasTransversais.push("Est.1 Transversal Início (LD↔LE)");
          if (incl1_LD_LE_Final.percentage > LIMIT_TRANSVERSAL) problemasTransversais.push("Est.1 Transversal Final (LD↔LE)");
          if (incl2_LD_LE_Inicio.percentage > LIMIT_TRANSVERSAL) problemasTransversais.push("Est.2 Transversal Início (LD↔LE)");
          if (incl2_LD_LE_Final.percentage > LIMIT_TRANSVERSAL) problemasTransversais.push("Est.2 Transversal Final (LD↔LE)");
          
          if (incl1_Inicio_Final_LD.percentage > LIMIT_LONGITUDINAL) problemasLongitudinais.push("Est.1 Longitudinal LD (Direito)");
          if (incl1_Inicio_Final_LE.percentage > LIMIT_LONGITUDINAL) problemasLongitudinais.push("Est.1 Longitudinal LE (Esquerdo)");
          if (incl2_Inicio_Final_LD.percentage > LIMIT_LONGITUDINAL) problemasLongitudinais.push("Est.2 Longitudinal LD (Direito)");
          if (incl2_Inicio_Final_LE.percentage > LIMIT_LONGITUDINAL) problemasLongitudinais.push("Est.2 Longitudinal LE (Esquerdo)");
          const crossInclination = calculateInclination(struct1.leInicio, struct2.ldInicio);
          if (crossInclination.percentage > LIMIT_LONGITUDINAL) problemasLongitudinais.push("Entre estruturas (Longitudinal)");
          
          const totalProblemas = problemasTransversais.length + problemasLongitudinais.length;
          
          const summaryHtml = `
            <h4 style="margin-bottom: 15px; color: #495057;">📋 Resumo Executivo - Análise Técnica</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; text-align: center;">
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: #007bff;">🌉 Distância Total</div>
                <div style="font-size: 16px; font-weight: bold; color: #007bff; margin: 5px 0;">${crossDistance.toFixed(3)}m</div>
                <div style="font-size: 12px; color: #6c757d;">LE(1) ↔ LD(2)</div>
            </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: ${crossElevation >= 0 ? '#4caf50' : '#f44336'};">📏 Diferença Elevação</div>
                <div style="font-size: 16px; font-weight: bold; color: ${crossElevation >= 0 ? '#4caf50' : '#f44336'}; margin: 5px 0;">${crossElevation >= 0 ? '+' : ''}${crossElevation.toFixed(3)}m</div>
                <div style="font-size: 12px; color: #6c757d;">Entre estruturas</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: ${crossInclination.percentage > LIMIT_LONGITUDINAL ? '#f44336' : crossInclination.percentage > LIMIT_LONGITUDINAL * 0.8 ? '#ff9800' : '#4caf50'};">📐 Inclinação Entre Estru.</div>
                <div style="font-size: 16px; font-weight: bold; color: ${crossInclination.percentage > LIMIT_LONGITUDINAL ? '#f44336' : crossInclination.percentage > LIMIT_LONGITUDINAL * 0.8 ? '#ff9800' : '#4caf50'}; margin: 5px 0;">${crossInclination.percentage.toFixed(2)}%</div>
                <div style="font-size: 12px; color: #6c757d;">Limite: ≤${LIMIT_LONGITUDINAL}%</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: #9c27b0;">📏 Largura Média</div>
                <div style="font-size: 16px; font-weight: bold; color: #9c27b0; margin: 5px 0;">${mediaGeralLargura.toFixed(3)}m</div>
                <div style="font-size: 12px; color: #6c757d;">Geral (Est.1+2)</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: #ff9800;">📐 Comprimento Médio</div>
                <div style="font-size: 16px; font-weight: bold; color: #ff9800; margin: 5px 0;">${mediaGeralComprimento.toFixed(3)}m</div>
                <div style="font-size: 12px; color: #6c757d;">Geral (Est.1+2)</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: #ff9800;">📐 Esconsidade Geral</div>
                <div style="font-size: 16px; font-weight: bold; color: #ff9800; margin: 5px 0;">${((skew1.anguloEsconsidade + skew2.anguloEsconsidade) / 2).toFixed(1)}°</div>
                <div style="font-size: 12px; color: #6c757d;">Média das estruturas</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: #2196f3;">📐 Largura Útil Média</div>
                <div style="font-size: 16px; font-weight: bold; color: #2196f3; margin: 5px 0;">${((skew1.larguraEfetiva + skew2.larguraEfetiva) / 2).toFixed(3)}m</div>
                <div style="font-size: 12px; color: #6c757d;">Efetiva para veículos</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid ${totalProblemas > 0 ? '#f44336' : '#4caf50'};">
                <div style="font-weight: bold; color: ${totalProblemas > 0 ? '#f44336' : '#4caf50'};">${totalProblemas > 0 ? '🚨' : '✅'} Status Conformidade</div>
                <div style="font-size: 16px; font-weight: bold; color: ${totalProblemas > 0 ? '#f44336' : '#4caf50'}; margin: 5px 0;">${totalProblemas > 0 ? `${totalProblemas} Não Conformidades` : 'CONFORME'}</div>
                <div style="font-size: 12px; color: #6c757d;">${totalProblemas > 0 ? 'Revisar inclinações' : 'Todas inclinações OK'}</div>
              </div>
            </div>
            <div style="margin-top: 15px; padding: 12px; background: #e3f2fd; border: 2px solid #2196f3; border-radius: 6px;">
              <div style="font-weight: bold; color: #1976d2; margin-bottom: 8px;">📐 Análise de Esconsidade:</div>
              <div style="font-size: 14px; color: #1565c0;">
                🔺 Estrutura 1: ${skew1.anguloEsconsidade.toFixed(2)}° (${skew1.statusEsconsidade}) | Largura Útil: ${skew1.larguraEfetiva.toFixed(3)}m (Perda: ${skew1.perdaLargura.toFixed(3)}m)
                <br>🔺 Estrutura 2: ${skew2.anguloEsconsidade.toFixed(2)}° (${skew2.statusEsconsidade}) | Largura Útil: ${skew2.larguraEfetiva.toFixed(3)}m (Perda: ${skew2.perdaLargura.toFixed(3)}m)
              </div>
              <div style="font-size: 12px; color: #1976d2; margin-top: 5px;">
                Esconsidade média: ${((skew1.anguloEsconsidade + skew2.anguloEsconsidade) / 2).toFixed(1)}° | Largura útil média: ${((skew1.larguraEfetiva + skew2.larguraEfetiva) / 2).toFixed(3)}m
              </div>
            </div>
            ${totalProblemas > 0 ? `
            <div style="margin-top: 15px; padding: 12px; background: #ffebee; border: 2px solid #f44336; border-radius: 6px;">
              <div style="font-weight: bold; color: #d32f2f; margin-bottom: 8px;">🚨 INCLINAÇÕES ACIMA DOS LIMITES TÉCNICOS:</div>
              ${problemasTransversais.length > 0 ? `<div style="font-size: 14px; color: #c62828; margin-bottom: 5px;"><strong>Transversais (>${LIMIT_TRANSVERSAL}%):</strong> ${problemasTransversais.join(', ')}</div>` : ''}
              ${problemasLongitudinais.length > 0 ? `<div style="font-size: 14px; color: #c62828;"><strong>Longitudinais (>${LIMIT_LONGITUDINAL}%):</strong> ${problemasLongitudinais.join(', ')}</div>` : ''}
              <div style="font-size: 12px; color: #d32f2f; margin-top: 8px; font-weight: bold;">⚠️ RECOMENDA-SE ANÁLISE ESTRUTURAL ESPECÍFICA</div>
            </div>
            ` : `
            <div style="margin-top: 15px; padding: 12px; background: #e8f5e8; border: 2px solid #4caf50; border-radius: 6px;">
              <div style="font-weight: bold; color: #2e7d32; margin-bottom: 8px;">✅ ESTRUTURAS DENTRO DOS LIMITES TÉCNICOS</div>
              <div style="font-size: 14px; color: #388e3c;">Todas as inclinações estão dentro dos limites recomendados</div>
              <div style="font-size: 12px; color: #2e7d32; margin-top: 5px;">Transversais: ≤${LIMIT_TRANSVERSAL}% | Longitudinais: ≤${LIMIT_LONGITUDINAL}%</div>
            </div>
            `}
          `;
          document.getElementById('executiveSummary').innerHTML = summaryHtml;
        } else {
          // Para estrutura única
          const allPointsForAnalysis = [struct1.ldInicio, struct1.leInicio, struct1.ldFinal, struct1.leFinal];
          const maxElevForAnalysis = Math.max(...allPointsForAnalysis.map(p => p.elevation));
          const minElevForAnalysis = Math.min(...allPointsForAnalysis.map(p => p.elevation));
          
          // Análise de esconsidade para estrutura única
          const skew1 = calculateSkewAnalysis(struct1);
          
          // Adicionar seção de esconsidade para estrutura única
          html += `
            <div class="section-divider"></div>
            <div class="distance-card structure-section">
              <div><strong>📐 ESTRUTURA ÚNICA - Análise de Esconsidade</strong></div>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #fff3e0, #e8f5e8); border: 2px solid #ff9800;">
              <div><strong>📏 Ângulo de Esconsidade</strong></div>
              <div class="distance-value" style="color: #ff9800;">${skew1.anguloEsconsidade.toFixed(2)}°</div>
              <small>${skew1.statusEsconsidade} - ${skew1.tipoGeometria}</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border: 2px solid #2196f3;">
              <div><strong>📐 Largura Útil (Efetiva)</strong></div>
              <div class="distance-value" style="color: #2196f3;">${skew1.larguraEfetiva.toFixed(3)} m</div>
              <small>Largura real para passagem de veículos</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #ffebee, #fff3e0); border: 2px solid #f44336;">
              <div><strong>📉 Perda de Largura</strong></div>
              <div class="distance-value" style="color: #f44336;">${skew1.perdaLargura.toFixed(3)} m (${skew1.percentualPerda.toFixed(1)}%)</div>
              <small>Redução devido à esconsidade</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
              <div><strong>📏 Distância em X (LD↔LE Início)</strong></div>
              <div class="distance-value" style="color: #6c757d;">${skew1.deltaX_Inicio.toFixed(3)} m</div>
              <small>Componente horizontal</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px solid #6c757d;">
              <div><strong>📐 Distância em Y (LD↔LE Início)</strong></div>
              <div class="distance-value" style="color: #6c757d;">${skew1.deltaY_Inicio.toFixed(3)} m</div>
              <small>Componente vertical</small>
            </div>
            <div class="distance-card" style="background: linear-gradient(135deg, #e8f5e8, #fff3e0); border: 2px solid #4caf50;">
              <div><strong>⚖️ Diferença de Comprimentos</strong></div>
              <div class="distance-value" style="color: #4caf50;">${skew1.diferencaComprimentos.toFixed(3)} m</div>
              <small>|Comprimento LD - Comprimento LE|</small>
            </div>
          `;
          
          // Verificar problemas de inclinação para estrutura única
          const problemasTransversais = [];
          const problemasLongitudinais = [];
          
          if (incl1_LD_LE_Inicio.percentage > LIMIT_TRANSVERSAL) problemasTransversais.push("Transversal Início (LD↔LE)");
          if (incl1_LD_LE_Final.percentage > LIMIT_TRANSVERSAL) problemasTransversais.push("Transversal Final (LD↔LE)");
          
          if (incl1_Inicio_Final_LD.percentage > LIMIT_LONGITUDINAL) problemasLongitudinais.push("Longitudinal LD (Direito)");
          if (incl1_Inicio_Final_LE.percentage > LIMIT_LONGITUDINAL) problemasLongitudinais.push("Longitudinal LE (Esquerdo)");
          
          const totalProblemasUnica = problemasTransversais.length + problemasLongitudinais.length;
          
          const summaryHtml = `
            <h4 style="margin-bottom: 15px; color: #495057;">📋 Resumo Executivo - Análise Técnica (Estrutura Única)</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; text-align: center;">
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: #9c27b0;">📏 Largura Média</div>
                <div style="font-size: 18px; font-weight: bold; color: #9c27b0; margin: 5px 0;">${media1Largura.toFixed(3)} m</div>
            </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: #ff9800;">📐 Comprimento Médio</div>
                <div style="font-size: 18px; font-weight: bold; color: #ff9800; margin: 5px 0;">${media1Comprimento.toFixed(3)} m</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: #ff9800;">📐 Ângulo Esconsidade</div>
                <div style="font-size: 18px; font-weight: bold; color: #ff9800; margin: 5px 0;">${skew1.anguloEsconsidade.toFixed(1)}°</div>
                <small>${skew1.statusEsconsidade}</small>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: #2196f3;">📐 Largura Útil</div>
                <div style="font-size: 18px; font-weight: bold; color: #2196f3; margin: 5px 0;">${skew1.larguraEfetiva.toFixed(3)} m</div>
                <small>Efetiva para veículos</small>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: ${incl1_Inicio_Final_LD.percentage > LIMIT_LONGITUDINAL || incl1_Inicio_Final_LE.percentage > LIMIT_LONGITUDINAL ? '#f44336' : '#4caf50'};">↕️ Status Longitudinal</div>
                <div style="font-size: 14px; font-weight: bold; color: ${incl1_Inicio_Final_LD.percentage > LIMIT_LONGITUDINAL || incl1_Inicio_Final_LE.percentage > LIMIT_LONGITUDINAL ? '#f44336' : '#4caf50'}; margin: 5px 0;">${incl1_Inicio_Final_LD.percentage > LIMIT_LONGITUDINAL || incl1_Inicio_Final_LE.percentage > LIMIT_LONGITUDINAL ? 'ACIMA DO LIMITE' : 'DENTRO DO LIMITE'}</div>
                <div style="font-size: 12px; color: #6c757d;">Limite: ≤${LIMIT_LONGITUDINAL}%</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; color: ${incl1_LD_LE_Inicio.percentage > LIMIT_TRANSVERSAL || incl1_LD_LE_Final.percentage > LIMIT_TRANSVERSAL ? '#f44336' : '#4caf50'};">🔄 Status Transversal</div>
                <div style="font-size: 14px; font-weight: bold; color: ${incl1_LD_LE_Inicio.percentage > LIMIT_TRANSVERSAL || incl1_LD_LE_Final.percentage > LIMIT_TRANSVERSAL ? '#f44336' : '#4caf50'}; margin: 5px 0;">${incl1_LD_LE_Inicio.percentage > LIMIT_TRANSVERSAL || incl1_LD_LE_Final.percentage > LIMIT_TRANSVERSAL ? 'ACIMA DO LIMITE' : 'DENTRO DO LIMITE'}</div>
                <div style="font-size: 12px; color: #6c757d;">Limite: ≤${LIMIT_TRANSVERSAL}%</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid ${totalProblemasUnica > 0 ? '#f44336' : '#4caf50'};">
                <div style="font-weight: bold; color: ${totalProblemasUnica > 0 ? '#f44336' : '#4caf50'};">${totalProblemasUnica > 0 ? '🚨' : '✅'} Status Geral</div>
                <div style="font-size: 16px; font-weight: bold; color: ${totalProblemasUnica > 0 ? '#f44336' : '#4caf50'}; margin: 5px 0;">${totalProblemasUnica > 0 ? `${totalProblemasUnica} Acima dos Limites` : 'DENTRO DOS LIMITES'}</div>
                <div style="font-size: 12px; color: #6c757d;">${totalProblemasUnica > 0 ? 'Revisar inclinações' : 'Todas inclinações OK'}</div>
              </div>
            </div>
            <div style="margin-top: 15px; padding: 12px; background: #e3f2fd; border: 2px solid #2196f3; border-radius: 6px;">
              <div style="font-weight: bold; color: #1976d2; margin-bottom: 8px;">📐 Análise de Esconsidade:</div>
              <div style="font-size: 14px; color: #1565c0;">
                🔺 Estrutura 1: ${skew1.anguloEsconsidade.toFixed(2)}° (${skew1.statusEsconsidade}) | Largura Útil: ${skew1.larguraEfetiva.toFixed(3)}m (Perda: ${skew1.perdaLargura.toFixed(3)}m)
              </div>
              <div style="font-size: 12px; color: #1976d2; margin-top: 5px;">
                Geometria: ${skew1.tipoGeometria} | Diferença de comprimentos: ${skew1.diferencaComprimentos.toFixed(3)}m
              </div>
            </div>
            <div style="margin-top: 15px; padding: 12px; background: #e8f5e8; border: 2px solid #4caf50; border-radius: 6px;">
              <div style="font-weight: bold; color: #2e7d32; margin-bottom: 8px;">📏 Análise de Elevações Relativas:</div>
              <div style="font-size: 14px; color: #388e3c;">
                🔺 Ponto mais alto: ${maxElevForAnalysis.toFixed(3)}m (referência 0,00m) | 
                🔻 Ponto mais baixo: ${minElevForAnalysis.toFixed(3)}m (${(minElevForAnalysis - maxElevForAnalysis).toFixed(3)}m relativo)
              </div>
              <div style="font-size: 12px; color: #2e7d32; margin-top: 5px;">Amplitude total: ${(maxElevForAnalysis - minElevForAnalysis).toFixed(3)}m</div>
            </div>
            ${totalProblemasUnica > 0 ? `
            <div style="margin-top: 15px; padding: 12px; background: #ffebee; border: 2px solid #f44336; border-radius: 6px;">
              <div style="font-weight: bold; color: #d32f2f; margin-bottom: 8px;">🚨 INCLINAÇÕES ACIMA DOS LIMITES TÉCNICOS:</div>
              ${problemasTransversais.length > 0 ? `<div style="font-size: 14px; color: #c62828; margin-bottom: 5px;"><strong>Transversais (>${LIMIT_TRANSVERSAL}%):</strong> ${problemasTransversais.join(', ')}</div>` : ''}
              ${problemasLongitudinais.length > 0 ? `<div style="font-size: 14px; color: #c62828;"><strong>Longitudinais (>${LIMIT_LONGITUDINAL}%):</strong> ${problemasLongitudinais.join(', ')}</div>` : ''}
              <div style="font-size: 12px; color: #d32f2f; margin-top: 8px; font-weight: bold;">⚠️ RECOMENDA-SE ANÁLISE ESTRUTURAL ESPECÍFICA</div>
            </div>
            ` : `
            <div style="margin-top: 15px; padding: 12px; background: #e8f5e8; border: 2px solid #4caf50; border-radius: 6px;">
              <div style="font-weight: bold; color: #2e7d32; margin-bottom: 8px;">✅ ESTRUTURA DENTRO DOS LIMITES TÉCNICOS</div>
              <div style="font-size: 14px; color: #388e3c;">Todas as inclinações estão dentro dos limites recomendados</div>
              <div style="font-size: 12px; color: #2e7d32; margin-top: 5px;">Transversais: ≤${LIMIT_TRANSVERSAL}% | Longitudinais: ≤${LIMIT_LONGITUDINAL}%</div>
            </div>
            `}
          `;
          document.getElementById('executiveSummary').innerHTML = summaryHtml;
        }

        distanceInfo.innerHTML = html;
        
        debugLog("Relatório de análise técnica gerado com sucesso");
        
        // Adicionar seção explicativa da metodologia
        const metodologiaHtml = `
          <div style="margin-top: 25px; padding: 15px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px; border: 2px solid #6c757d;">
            <h4 style="margin: 0 0 15px 0; color: #495057; text-align: center;">📐 Metodologia de Análise Aplicada</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
              <div style="background: white; padding: 12px; border-radius: 6px; border: 2px solid #d32f2f;">
                <div style="font-weight: bold; color: #d32f2f; margin-bottom: 8px;">🔄 INCLINAÇÕES TRANSVERSAIS (≤5%)</div>
                <div style="font-size: 13px; color: #666; line-height: 1.4;">
                  <strong>✓ LD_INÍCIO ↔ LE_INÍCIO</strong><br>
                  <em>Lado direito com lado esquerdo no mesmo ponto</em><br><br>
                  <strong>✓ LD_FINAL ↔ LE_FINAL</strong><br>
                  <em>Lado direito com lado esquerdo no mesmo ponto</em>
                </div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 2px solid #ff9800;">
                <div style="font-weight: bold; color: #ff9800; margin-bottom: 8px;">↕️ INCLINAÇÕES LONGITUDINAIS (≤2,5%)</div>
                <div style="font-size: 13px; color: #666; line-height: 1.4;">
                  <strong>✓ LD_INÍCIO ↔ LD_FINAL</strong><br>
                  <em>Mesmo lado direito entre pontos</em><br><br>
                  <strong>✓ LE_INÍCIO ↔ LE_FINAL</strong><br>
                  <em>Mesmo lado esquerdo entre pontos</em>
                </div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 2px solid #2196f3;">
                <div style="font-weight: bold; color: #2196f3; margin-bottom: 8px;">📐 ANÁLISE DE ESCONSIDADE</div>
                <div style="font-size: 13px; color: #666; line-height: 1.4;">
                  <strong>✓ Ângulo de Esconsidade</strong><br>
                  <em>Desvio da perpendicularidade</em><br><br>
                  <strong>✓ Largura Útil = Largura × cos(θ)</strong><br>
                  <em>Largura efetiva para veículos</em>
                </div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 12px; font-size: 12px; color: #6c757d;">
              <strong>Boas Práticas da Engenharia de Pontes</strong> - Sistema automatizado de análise técnica de tabuleiros com detecção de esconsidade
            </div>
          </div>
        `;
        
        document.getElementById('executiveSummary').insertAdjacentHTML('afterend', metodologiaHtml);
        
        infoPanel.style.display = "block";
      }

      function processData() {
        debugLog("=== PROCESSANDO DADOS ===");
        const csvData1 = document.getElementById("csvData1").value;
        const csvData2 = document.getElementById("csvData2").value;
        const errorMsg = document.getElementById("errorMsg");
        
        // Limpar debug anterior
        document.getElementById('debugInfo').innerHTML = '';
        document.getElementById('debugInfo').style.display = 'none';
        
        errorMsg.innerHTML = "";

        if (!csvData1.trim()) {
          errorMsg.innerHTML = '<div class="error">⚠️ Por favor, cole pelo menos os dados do CSV 1!</div>';
          return;
        }

        try {
          debugLog("Processando CSV 1...");
          const data1 = parseCSV(csvData1);
          debugLog("Processando CSV 2...");
          const data2 = parseCSV(csvData2);

          debugLog("Procurando pontos no CSV 1...");
          const points1 = findPoints(data1);
          debugLog("Procurando pontos no CSV 2...");
          const points2 = findPoints(data2);
          
          currentPoints1 = points1;
          currentPoints2 = points2;

          if (Object.keys(points1).length === 0) {
            errorMsg.innerHTML = `
              <div class="error" style="background: linear-gradient(135deg, #ffebee, #fff3e0); border: 3px solid #f44336; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; animation: pulse 2s infinite;">
                <h3 style="color: #d32f2f; margin: 0 0 15px 0;">🚨 NENHUM PONTO LD OU LE ENCONTRADO NO CSV 1!</h3>
                <div style="color: #c62828; font-size: 16px; margin-bottom: 15px;">
                  Certifique-se de que existem pontos com identificadores válidos:
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border: 2px solid #ff9800;">
                  <strong style="color: #e65100;">📍 Formatos Aceitos:</strong><br>
                  <div style="color: #666; font-size: 14px; margin-top: 8px;">
                    ✅ *_OAE (Ex: LD_INICIO_OAE, LE_FINAL_OAE)<br>
                    ✅ *PONTE (Ex: LD INICIO PONTE, LE FINAL PONTE)<br>
                    ✅ Deve estar no campo <strong>Name</strong>, <strong>Code</strong>, <strong>CODE</strong> ou <strong>Codigo</strong>
                  </div>
                </div>
                <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin-top: 15px; border: 2px solid #2196f3;">
                  <strong style="color: #1976d2;">💡 Teste os exemplos disponíveis acima para verificar o funcionamento!</strong>
                </div>
              </div>
            `;
            return;
          }

          // Consultar informações da rodovia DNIT
          consultarInformacoesRodovia(points1);

          debugLog("Iniciando visualização...");
          drawVisualization(points1, points2);
        } catch (error) {
          console.error("Erro:", error);
          debugLog(`ERRO: ${error.message}`);
          errorMsg.innerHTML = `<div class="error">❌ Erro ao processar dados: ${error.message}</div>`;
        }
      }
      
      // Função para consultar informações da rodovia
      async function consultarInformacoesRodovia(points) {
        try {
          const coordRef = obterCoordenadaReferencia(points);
          
          if (!coordRef) {
            debugLog("Não foi possível obter coordenada de referência para consulta DNIT");
            exibirInformacoesRodovias(null, null);
            return;
          }
          
          debugLog(`Usando ponto de referência: ${coordRef.nomePonto} (${coordRef.lat}, ${coordRef.lng})`);
          
          const dadosRodovias = await consultarRodoviasDNIT(coordRef.lat, coordRef.lng);
          const dadosProcessados = processarDadosRodovias(dadosRodovias);
          
          exibirInformacoesRodovias(dadosProcessados, coordRef.nomePonto);
          
        } catch (error) {
          debugLog(`Erro ao consultar informações da rodovia: ${error.message}`);
          exibirInformacoesRodovias(null, null);
        }
      }

      // Pré-carregar dados de exemplo
      window.onload = function () {
        console.log("🚀 Página carregada - Analisador de Inclinações e Esconsidade ativo");
        updateZoomDisplay();
        loadExample1NewFormat();
      };
    