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


      // Versão: 5.0
// Variáveis globais - MODO INCREMENTAL

// Arrays principais (NÃO devem ser resetados em handleFiles)
let imagePoints = [];
let importedPoints = [];
let originalFiles = new Map();
let imageDataMap = new Map();
let renamedFiles = new Map();

// Variáveis de controle do LOTE ATUAL (resetadas a cada novo lote)
let processedImages = 0;      // Imagens processadas do lote atual
let imagesWithGeo = 0;        // Imagens com GPS do lote atual
let totalImages = 0;          // Total de imagens do lote atual

// Variáveis de estatísticas ACUMULADAS (NÃO resetar)
let importedCount = 0;        // Total de pontos importados (acumulado)

// Variáveis do mapa e componentes
let map;
let markersLayer;
let droneZonesLayer;
let currentTileLayer;
let previewTimeout;
let isPreviewOpen = false;

// Caches (mantidos entre lotes)
let rodoviaCache = new Map();
let droneDataCache = new Map();
let airportCache = new Map();

// Variáveis de controle de estado
let droneZonesActive = false;

// Elementos DOM (definidos uma vez)
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const resultsBody = document.getElementById("resultsBody");
const downloadKmlBtn = document.getElementById("downloadKmlBtn");
const downloadKmzBtn = document.getElementById("downloadKmzBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const downloadZipBtn = document.getElementById("downloadZipBtn");
const progressBar = document.getElementById("progressBar");
const progress = document.getElementById("progress");
const layerSelector = document.getElementById("layerSelector");
const maxZoomBtn = document.getElementById("maxZoomBtn");
const droneToggle = document.getElementById("droneToggle");
const droneLegend = document.getElementById("droneLegend");
const droneLoading = document.getElementById("droneLoading");
const imagePreview = document.getElementById("imagePreview");
      
      // Função de debug - apenas console
      function debugLog(message) {
        console.log(message);
      }

      // FUNÇÃO PARA IMPORTAR KML
      window.importKMLFile = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.kml';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        input.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (!file) {
            document.body.removeChild(input);
            return;
          }
          
          if (!file.name.toLowerCase().endsWith('.kml')) {
            alert('Por favor, selecione um arquivo KML válido.');
            document.body.removeChild(input);
            return;
          }
          
          const reader = new FileReader();
          reader.onload = async function(event) {
            try {
              const kmlContent = event.target.result;
              const points = parseKML(kmlContent);
              
              if (points.length > 0) {
                // Consultar rodovias para cada ponto importado
                debugLog(`Consultando rodovias para ${points.length} pontos importados`);
                const progressMsg = `Consultando rodovias para pontos importados...`;
                
                for (let i = 0; i < points.length; i++) {
                  const point = points[i];
                  console.log(`Consultando rodovias para ponto ${i + 1}/${points.length}: ${point.filename}`);
                  
                  try {
                    const dadosDNIT = await consultarRodoviasDNIT(point.latitude, point.longitude);
                    const dadosProcessados = processarDadosRodovias(dadosDNIT);
                    
                    // Cache das rodovias para este ponto
                    const coordKey = `${point.latitude.toFixed(6)}_${point.longitude.toFixed(6)}`;
                    rodoviaCache.set(coordKey, dadosProcessados);
                    
                    // Adicionar informações de rodovias ao ponto
                    point.rodovias = dadosProcessados;
                    
                    // Pequena pausa para não sobrecarregar a API
                    await new Promise(resolve => setTimeout(resolve, 200));
                  } catch (error) {
                    console.warn(`Erro ao consultar rodovias para ${point.filename}:`, error);
                    point.rodovias = { rodovias: [] };
                  }
                }
                
                // Adicionar pontos importados
                importedPoints.push(...points);
                importedCount = importedPoints.length;
                
                // Atualizar interface
                document.getElementById("importedPoints").textContent = importedCount;
                updateResultsTable();
                
                // Habilitar botões
                if (imagePoints.length + importedPoints.length > 0) {
                  downloadKmlBtn.disabled = false;
                  downloadCsvBtn.disabled = false;
                }
                
                // Atualizar mapa
                plotPointsOnMap();
                
                alert(`Sucesso! ${points.length} pontos importados do KML com informações de rodovias.`);
              } else {
                alert('Nenhum ponto válido encontrado no arquivo KML.');
              }
            } catch (error) {
              console.error('Erro:', error);
              alert('Erro ao processar arquivo KML: ' + error.message);
            }
            
            document.body.removeChild(input);
          };
          
          reader.onerror = function() {
            alert('Erro ao ler o arquivo.');
            document.body.removeChild(input);
          };
          
          reader.readAsText(file);
        });
        
        input.click();
      };

      // Função para parsear arquivo KML
      function parseKML(kmlContent) {
        try {
          debugLog('Iniciando parse do KML');
          const parser = new DOMParser();
          const kmlDoc = parser.parseFromString(kmlContent, "text/xml");
          
          const parseError = kmlDoc.getElementsByTagName("parsererror");
          if (parseError.length > 0) {
            throw new Error("XML inválido");
          }
          
          const placemarks = kmlDoc.getElementsByTagName("Placemark");
          debugLog(`Placemarks encontrados: ${placemarks.length}`);
          const points = [];
          
          for (let i = 0; i < placemarks.length; i++) {
            const placemark = placemarks[i];
            const nameElement = placemark.getElementsByTagName("name")[0];
            
            let coordinatesElement = null;
            const pointElement = placemark.getElementsByTagName("Point")[0];
            
            if (pointElement) {
              coordinatesElement = pointElement.getElementsByTagName("coordinates")[0];
            }
            
            if (coordinatesElement) {
              const coordsText = coordinatesElement.textContent.trim();
              const coordPairs = coordsText.split(/[\s\n]+/).filter(pair => pair.trim());
              const firstCoordPair = coordPairs[0];
              
              if (firstCoordPair) {
                const coords = firstCoordPair.split(',');
                
                if (coords.length >= 2) {
                  const lng = parseFloat(coords[0]);
                  const lat = parseFloat(coords[1]);
                  
                  if (isValidCoordinate(lat, lng)) {
                    const name = nameElement ? nameElement.textContent.trim() : `Ponto_Importado_${i + 1}`;
                    
                    const point = {
                      filename: name,
                      latitude: lat,
                      longitude: lng,
                      datetime: null,
                      imported: true,
                      description: ''
                    };
                    
                    points.push(point);
                  }
                }
              }
            }
          }
          
          debugLog(`Total de pontos parseados: ${points.length}`);
          return points;
        } catch (error) {
          debugLog(`Erro ao parsear KML: ${error.message}`);
          throw error;
        }
      }

     // 3. MÉTODO: generateKML (atualizado com informações de rodovias)
function generateKML(forKMZ = false) {
  const allPoints = [...imagePoints, ...importedPoints];
  
  if (allPoints.length === 0) return null;
  
  let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Pontos Georreferenciados</name>
    <description>Arquivo KML gerado pelo Conversor de Imagens Georreferenciadas - ZenithSolutions OAE Support</description>
`;

  allPoints.forEach((point, index) => {
    const currentName = renamedFiles.get(point.filename) || point.filename;
    const isRenamed = renamedFiles.has(point.filename);
    const isImported = point.imported || false;
    
    // Construir descrição detalhada
    let description = `<![CDATA[
<h3>${currentName}</h3>
<p><strong>Coordenadas:</strong><br/>
Latitude: ${point.latitude.toFixed(8)}<br/>
Longitude: ${point.longitude.toFixed(8)}</p>
`;

    // Data/Hora
    if (point.datetime) {
      description += `<p><strong>Data/Hora:</strong> ${point.datetime}</p>`;
    }
    
    // Imagem para KMZ
    if (forKMZ && !isImported && imageDataMap.has(point.filename)) {
      const imageFilename = (renamedFiles.get(point.filename) || point.filename).replace(/\.[^/.]+$/, ".jpg");
      description += `
<p><strong>Imagem:</strong></p>
<img src="images/${imageFilename}" width="300" alt="${currentName}"/>`;
    }
    
    // Tipo de ponto
    if (isImported) {
      description += `<p><strong>Tipo:</strong> Ponto importado de KML</p>`;
    } else {
      description += `<p><strong>Tipo:</strong> Extraído de imagem georreferenciada</p>`;
    }
    
    // SEÇÃO DE RODOVIAS
    if (point.rodovias && point.rodovias.rodovias && point.rodovias.rodovias.length > 0) {
      description += `
<div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 5px;">
  <p><strong>🛣️ Rodovias Próximas:</strong></p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
    <thead>
      <tr style="background: #e9ecef;">
        <th style="padding: 6px; border: 1px solid #dee2e6; text-align: left;">BR</th>
        <th style="padding: 6px; border: 1px solid #dee2e6; text-align: left;">KM</th>
        <th style="padding: 6px; border: 1px solid #dee2e6; text-align: left;">UF</th>
        <th style="padding: 6px; border: 1px solid #dee2e6; text-align: left;">Trecho</th>
      </tr>
    </thead>
    <tbody>`;
      
      // Adicionar cada rodovia
      point.rodovias.rodovias.forEach(rodovia => {
        const isKmZero = parseFloat(rodovia.km) === 0;
        const kmDisplay = isKmZero ? `${rodovia.km} ⚠️` : rodovia.km;
        const rowStyle = isKmZero ? 'background: #fff3cd;' : '';
        
        description += `
      <tr style="${rowStyle}">
        <td style="padding: 6px; border: 1px solid #dee2e6;">BR-${rodovia.br}</td>
        <td style="padding: 6px; border: 1px solid #dee2e6;">${kmDisplay}</td>
        <td style="padding: 6px; border: 1px solid #dee2e6;">${rodovia.uf}</td>
        <td style="padding: 6px; border: 1px solid #dee2e6;">${rodovia.tipoTrecho}</td>
      </tr>`;
      });
      
      description += `
    </tbody>
  </table>`;
      
      // Nota sobre KM zero se houver
      const temKmZero = point.rodovias.rodovias.some(r => parseFloat(r.km) === 0);
      if (temKmZero) {
        description += `
  <p style="margin-top: 8px; font-size: 12px; color: #856404;">
    <strong>⚠️ Atenção:</strong> KM 0 pode indicar imprecisão na localização ou ponto fora da rodovia mapeada.
  </p>`;
      }
      
      description += `
</div>`;
    } else if (point.rodovias) {
      // Caso tenha sido consultado mas não encontrou rodovias
      description += `
<div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-left: 4px solid #95a5a6; border-radius: 5px;">
  <p><strong>🛣️ Rodovias:</strong> Nenhuma rodovia encontrada nas proximidades</p>
</div>`;
    }
    
    description += `]]>`;
    
    // Criar placemark
    kmlContent += `
    <Placemark>
      <name>${escapeXml(currentName)}</name>
      <description>${description}</description>
      <Point>
        <coordinates>${point.longitude},${point.latitude},0</coordinates>
      </Point>
    </Placemark>`;
  });
  
  kmlContent += `
  </Document>
</kml>`;
  
  return kmlContent;
}
     // Versão: 5.2
// Nova função para gerar arquivo KMZ COM DEBUG
async function generateKMZ() {
  if (imagePoints.length === 0) {
    alert('Nenhuma imagem georreferenciada disponível para KMZ.');
    return;
  }

  try {
    debugLog('=== INICIANDO GERAÇÃO KMZ ===');
    debugLog(`Total de imagePoints: ${imagePoints.length}`);
    debugLog(`Total de entradas em imageDataMap: ${imageDataMap.size}`);
    
    // Listar todos os arquivos no imageDataMap
    debugLog('Arquivos em imageDataMap:');
    for (let [key, value] of imageDataMap.entries()) {
      debugLog(`  - ${key} (tamanho: ${value.length} chars)`);
    }
    
    // Carregar JSZip se necessário
    await new Promise((resolve, reject) => {
      if (window.JSZip) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Erro ao carregar JSZip"));
      document.head.appendChild(script);
    });

    const zip = new JSZip();
    
    // Gerar KML específico para KMZ
    debugLog('Gerando KML com forKMZ=true');
    const kmlContent = generateKML(true);
    zip.file("doc.kml", kmlContent);
    
    // Criar pasta de imagens
    const imagesFolder = zip.folder("images");
    
    debugLog('Iniciando adição de imagens ao KMZ...');
    let imagensAdicionadas = 0;
    
    // Adicionar cada imagem ao ZIP
    const imagePromises = imagePoints.map(async (point) => {
      debugLog(`Processando ponto: ${point.filename}`);
      
      if (imageDataMap.has(point.filename)) {
        const imageData = imageDataMap.get(point.filename);
        const currentName = renamedFiles.get(point.filename) || point.filename;
        
        // Converter nome para .jpg
        const imageFilename = currentName.replace(/\.[^/.]+$/, ".jpg");
        
        debugLog(`  ✓ Imagem encontrada! Nome final: ${imageFilename}`);
        debugLog(`  Tamanho do dataURL: ${imageData.length} chars`);
        
        // Converter data URL para blob
        const response = await fetch(imageData);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        debugLog(`  Tamanho do blob: ${blob.size} bytes`);
        debugLog(`  Tamanho do arrayBuffer: ${arrayBuffer.byteLength} bytes`);
        
        imagesFolder.file(imageFilename, arrayBuffer);
        imagensAdicionadas++;
        debugLog(`  ✓✓ Adicionada ao ZIP: ${imageFilename}`);
      } else {
        debugLog(`  ✗ IMAGEM NÃO ENCONTRADA no imageDataMap: ${point.filename}`);
      }
    });
    
    await Promise.all(imagePromises);
    
    debugLog(`Total de imagens adicionadas ao KMZ: ${imagensAdicionadas}`);
    
    // Gerar o arquivo KMZ
    debugLog('Gerando arquivo KMZ final...');
    const kmzBlob = await zip.generateAsync({ type: "blob" });
    debugLog(`Tamanho do KMZ gerado: ${kmzBlob.size} bytes`);
    
    // Download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(kmzBlob);
    link.download = "pontos_georreferenciados.kmz";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    debugLog('=== KMZ GERADO COM SUCESSO ===');
    debugLog(`Arquivo: pontos_georreferenciados.kmz (${kmzBlob.size} bytes)`);
    
  } catch (error) {
    debugLog(`ERRO ao gerar KMZ: ${error.message}`);
    console.error('Stack trace:', error);
    alert('Erro ao gerar arquivo KMZ: ' + error.message);
  }
}


      // Função para escapar caracteres especiais XML
      function escapeXml(text) {
        return text.replace(/[<>&'"]/g, function(match) {
          switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return match;
          }
        });
      }

      // Função para combinar pontos importados com pontos das imagens
      function combineAllPoints() {
        return [...imagePoints, ...importedPoints];
      }

      // Consulta rodovias DNIT
      async function consultarRodoviasDNIT(lat, lng) {
        try {
          const dataRef = new Date().toISOString().split('T')[0];
          const url = `https://servicos.dnit.gov.br/sgplan/apigeo/rotas/localizarkm?lng=${lng}&lat=${lat}&r=250&data=${dataRef}`;
          
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
          return data;
        } catch (error) {
          console.error(`Erro ao consultar DNIT: ${error.message}`);
          return null;
        }
      }

      // Consulta aeroportos via Overpass API
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

        try {
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });

          if (!response.ok) {
            throw new Error(`Erro na API Overpass: ${response.status}`);
          }

          const data = await response.json();
          return processarAeroportos(data.elements);
        } catch (error) {
          console.error('Erro ao consultar aeroportos:', error);
          return [];
        }
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

      // Determinar zona de restrição baseada na distância de aeroportos
      function determinarZonaRestricao(lat, lng, aeroportos) {
        let menorDistancia = Infinity;
        let aeroportoMaisProximo = null;

        aeroportos.forEach(aeroporto => {
          const distancia = calcularDistanciaHaversine(lat, lng, aeroporto.lat, aeroporto.lng);
          if (distancia < menorDistancia) {
            menorDistancia = distancia;
            aeroportoMaisProximo = aeroporto;
          }
        });

        if (menorDistancia <= 5) {
          return {
            zona: 'prohibited',
            cor: 'rgba(231, 76, 60, 0.7)',
            descricao: 'Zona Proibida',
            aeroporto: aeroportoMaisProximo,
            distancia: menorDistancia
          };
        }
        
        if (menorDistancia <= 10) {
          return {
            zona: 'restricted',
            cor: 'rgba(241, 196, 15, 0.7)',
            descricao: 'Zona Restrita',
            aeroporto: aeroportoMaisProximo,
            distancia: menorDistancia
          };
        }

        return {
          zona: 'permitted',
          cor: 'rgba(46, 204, 113, 0.7)',
          descricao: 'Zona Permitida',
          aeroporto: aeroportoMaisProximo,
          distancia: menorDistancia
        };
      }

      // Calcular distância Haversine em km
      function calcularDistanciaHaversine(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }

      // Toggle das zonas de drone
      function toggleDroneZones() {
        droneZonesActive = !droneZonesActive;
        
        if (droneZonesActive) {
          droneToggle.classList.add('active');
          droneLegend.classList.add('active');
          carregarZonasDrone();
        } else {
          droneToggle.classList.remove('active');
          droneLegend.classList.remove('active');
          if (droneZonesLayer) {
            droneZonesLayer.clearLayers();
          }
        }
      }

      // Carregar zonas de drone
      async function carregarZonasDrone() {
        if (!map) return;

        droneLoading.classList.add('active');

        try {
          const bounds = map.getBounds();
          const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
          
          const cacheKey = bbox;
          
          let aeroportos;
          if (airportCache.has(cacheKey)) {
            aeroportos = airportCache.get(cacheKey);
          } else {
            aeroportos = await consultarAeroportosOverpass(bbox);
            airportCache.set(cacheKey, aeroportos);
          }

          if (!droneZonesLayer) {
            droneZonesLayer = L.layerGroup().addTo(map);
          } else {
            droneZonesLayer.clearLayers();
          }

          // Adicionar marcadores de aeroportos
          aeroportos.forEach(aeroporto => {
            const airportIcon = L.divIcon({
              className: 'airport-marker',
              html: `<div style="background: rgba(155, 89, 182, 0.9); color: white; padding: 4px 8px; border-radius: 15px; font-size: 12px; font-weight: bold; text-align: center; min-width: 40px;">✈️</div>`,
              iconSize: [50, 25],
              iconAnchor: [25, 12]
            });

            const marker = L.marker([aeroporto.lat, aeroporto.lng], { icon: airportIcon });
            
            const popupContent = `
              <div style="min-width: 200px;">
                <h4>✈️ ${aeroporto.name}</h4>
                <p><strong>Tipo:</strong> ${aeroporto.type === 'helipad' || aeroporto.type === 'heliport' ? 'Heliponto' : 'Aeroporto'}</p>
                ${aeroporto.icao ? `<p><strong>ICAO:</strong> ${aeroporto.icao}</p>` : ''}
                ${aeroporto.iata ? `<p><strong>IATA:</strong> ${aeroporto.iata}</p>` : ''}
                <p><strong>Coordenadas:</strong><br>
                Lat: ${aeroporto.lat.toFixed(6)}<br>
                Lng: ${aeroporto.lng.toFixed(6)}</p>
                <div style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 5px; border: 1px solid #ffeaa7;">
                  <strong>⚠️ Zonas de Restrição:</strong><br>
                  <span style="color: #e74c3c;">0-5km:</span> Proibido<br>
                  <span style="color: #f1c40f;">5-10km:</span> Restrito
                </div>
              </div>
            `;
            
            marker.bindPopup(popupContent);
            droneZonesLayer.addLayer(marker);

            // Círculos de restrição
            const circle5km = L.circle([aeroporto.lat, aeroporto.lng], {
              radius: 5000,
              fillColor: 'rgba(231, 76, 60, 0.3)',
              color: 'rgba(231, 76, 60, 0.8)',
              weight: 2,
              fillOpacity: 0.3
            });

            const circle10km = L.circle([aeroporto.lat, aeroporto.lng], {
              radius: 10000,
              fillColor: 'rgba(241, 196, 15, 0.2)',
              color: 'rgba(241, 196, 15, 0.6)',
              weight: 2,
              fillOpacity: 0.2
            });

            droneZonesLayer.addLayer(circle10km);
            droneZonesLayer.addLayer(circle5km);
          });

          if (imagePoints.length > 0) {
            atualizarZonasParaPontos(aeroportos);
          }

        } catch (error) {
          console.error('Erro ao carregar zonas de drone:', error);
        } finally {
          droneLoading.classList.remove('active');
        }
      }

      // Atualizar zonas para pontos existentes
      function atualizarZonasParaPontos(aeroportos) {
        imagePoints.forEach((point, index) => {
          const zona = determinarZonaRestricao(point.latitude, point.longitude, aeroportos);
          point.droneZone = zona;
        });
      }

     // 1. MÉTODO: processarDadosRodovias (atualizado com validações robustas)
function processarDadosRodovias(dadosDNIT) {
  // Validação de entrada
  if (!dadosDNIT || !Array.isArray(dadosDNIT) || dadosDNIT.length === 0) {
    return { rodovias: [] };
  }
  
  // Mapear e validar cada rodovia
  const rodovias = dadosDNIT
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      br: item.br || 'N/A',
      km: item.km !== undefined && item.km !== null ? String(item.km) : '0',
      uf: item.uf || 'N/A',
      tipoTrecho: item.tipoTrecho || 'N/A',
      versao: item.versao || 'N/A'
    }));
  
  return { rodovias };
}

      // Gerar HTML das informações de rodovias (COMPACTO)
      function gerarHtmlRodovias(dadosProcessados, coordenadas) {
        if (!dadosProcessados || !dadosProcessados.rodovias || dadosProcessados.rodovias.length === 0) {
          return `
            <div style="margin-top: 6px; padding: 4px; background: #f8f9fa; border-radius: 3px; border: 1px solid #dee2e6;">
              <div style="font-size: 10px; color: #6c757d;">
                Nenhuma rodovia encontrada
              </div>
            </div>
          `;
        }
        
        const rodovias = dadosProcessados.rodovias;
        
        const listaRodovias = rodovias.map(rodovia => {
          const isKmZero = parseFloat(rodovia.km) === 0;
          const alertIcon = isKmZero ? ' ⚠️' : '';
          
          return `BR-${rodovia.br} (Km ${rodovia.km})${alertIcon}`;
        }).join(' • ');
        
        return `
          <div style="margin-top: 6px; padding: 4px; background: #f8f9fa; border-radius: 3px; border: 1px solid #dee2e6;">
            <div style="font-size: 10px; color: #6c757d; margin-bottom: 2px;">🛣️ Rodovias:</div>
            <div style="font-size: 11px; color: #495057;">${listaRodovias}</div>
          </div>
        `;
      }

      // Definir diferentes camadas de tile
      const tileLayers = {
        osm: {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          options: {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19
          }
        },
        satellite: {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          options: {
            attribution: "© Esri, Maxar, GeoEye, Earthstar Geographics",
            maxZoom: 23
          }
        },
        topo: {
          url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          options: {
            attribution: "© OpenTopoMap (CC-BY-SA)",
            maxZoom: 17
          }
        },
        dark: {
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          options: {
            attribution: "© CARTO, © OpenStreetMap contributors",
            maxZoom: 20
          }
        }
      };

      // Inicializar o mapa
      function initMap() {
        debugLog('Inicializando mapa');
        
        map = L.map("map", {
          maxZoom: 25,
          minZoom: 2,
          zoomControl: true,
          worldCopyJump: true
        }).setView([-15.7942, -47.8825], 4);

        switchTileLayer('osm');
        markersLayer = L.layerGroup().addTo(map);

        layerSelector.addEventListener('change', function() {
          switchTileLayer(this.value);
        });

        maxZoomBtn.addEventListener('click', function() {
          if (imagePoints.length > 0) {
            let latSum = 0, lngSum = 0;
            imagePoints.forEach(point => {
              latSum += point.latitude;
              lngSum += point.longitude;
            });
            const centerLat = latSum / imagePoints.length;
            const centerLng = lngSum / imagePoints.length;
            
            map.setView([centerLat, centerLng], map.getMaxZoom());
          } else {
            map.setZoom(map.getMaxZoom());
          }
        });

        // Event listener para toggle de zonas de drone
        droneToggle.addEventListener('click', toggleDroneZones);

        // Event listener para recarregar zonas quando o mapa move
        map.on('moveend', function() {
          if (droneZonesActive) {
            carregarZonasDrone();
          }
        });

        if (imagePoints.length > 0) {
          plotPointsOnMap();
        }
        
        debugLog('Mapa inicializado com sucesso');
      }

      // Mostrar preview da imagem
      function showImagePreview(point, currentName, isRenamed) {
        if (isPreviewOpen) return;

        isPreviewOpen = true;
        
        imagePreview.classList.add('loading');
        imagePreview.style.display = 'block';
        
        document.querySelector('.preview-loading').style.display = 'block';
        document.querySelector('.preview-loaded').style.display = 'none';

        const imageData = imageDataMap.get(point.filename);
        if (imageData) {
          const img = document.getElementById('previewImg');
          img.onload = function() {
            let infoHtml = `${isRenamed ? `<div style="color: #7f8c8d; font-style: italic;">Original: ${point.filename}</div>` : ''}
               <div><strong>Data/Hora:</strong> ${point.datetime || "N/A"}</div>`;

            if (point.droneZone) {
              const zoneIcon = point.droneZone.zona === 'prohibited' ? '🚫' : 
                              point.droneZone.zona === 'restricted' ? '⚠️' : '✅';
              
              infoHtml += `
                <div style="margin-top: 10px; padding: 8px; background: rgba(${point.droneZone.zona === 'prohibited' ? '231, 76, 60' : point.droneZone.zona === 'restricted' ? '241, 196, 15' : '46, 204, 113'}, 0.1); border-radius: 5px; border: 1px solid rgba(${point.droneZone.zona === 'prohibited' ? '231, 76, 60' : point.droneZone.zona === 'restricted' ? '241, 196, 15' : '46, 204, 113'}, 0.3);">
                  <strong>${zoneIcon} Zona de Drone:</strong> ${point.droneZone.descricao}<br>
                  ${point.droneZone.aeroporto ? `<small>Aeroporto mais próximo: ${point.droneZone.aeroporto.name} (${point.droneZone.distancia.toFixed(1)}km)</small>` : ''}
                </div>
              `;
            }

            document.getElementById('previewTitle').innerHTML = 
              `📷 ${isRenamed ? '<span class="renamed-indicator">✏️ ' + currentName + '</span>' : currentName}`;
            
            document.getElementById('previewInfo').innerHTML = infoHtml;
            
            document.getElementById('previewCoords').innerHTML = 
              `<strong>Coordenadas:</strong><br>
               Latitude: ${point.latitude.toFixed(8)}<br>
               Longitude: ${point.longitude.toFixed(8)}`;

            document.querySelector('.preview-loading').style.display = 'none';
            document.querySelector('.preview-loaded').style.display = 'block';
            
            imagePreview.classList.remove('loading');
            imagePreview.classList.add('show');
          };
          
          img.onerror = function() {
            closePreview();
          };
          
          img.src = imageData;
        } else {
          closePreview();
        }
      }

      // Fechar preview
      function closePreview() {
        if (previewTimeout) {
          clearTimeout(previewTimeout);
          previewTimeout = null;
        }
        
        isPreviewOpen = false;
        imagePreview.classList.remove('show', 'loading');
        
        setTimeout(() => {
          if (!imagePreview.classList.contains('show')) {
            imagePreview.style.display = 'none';
          }
        }, 400);
      }

      // Event listeners para fechar preview
      if (imagePreview) {
        imagePreview.addEventListener('click', function(e) {
          if (e.target === this) {
            closePreview();
          }
        });
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isPreviewOpen) {
          closePreview();
        }
      });

      // Função para renomear arquivo
      function renameFile(index, originalFilename, fileExt) {
        const newNameInput = document.getElementById(`newName_${index}`);
        const newName = newNameInput.value.trim();
        
        if (!newName) {
          alert('Por favor, insira um nome válido.');
          return;
        }
        
        const fullNewName = newName + fileExt;
        
        const existingNames = Array.from(renamedFiles.values());
        const originalNames = imagePoints.map(p => p.filename);
        
        if (existingNames.includes(fullNewName) || originalNames.includes(fullNewName)) {
          if (renamedFiles.get(originalFilename) !== fullNewName) {
            alert('Este nome já está sendo usado por outro arquivo.');
            return;
          }
        }
        
        renamedFiles.set(originalFilename, fullNewName);
        updateResultsTable();
        updateStats();
        plotPointsOnMap();
        downloadZipBtn.disabled = false;
        map.closePopup();
      }

      // Função para resetar nome do arquivo
      function resetFileName(originalFilename, index) {
        renamedFiles.delete(originalFilename);
        updateResultsTable();
        updateStats();
        plotPointsOnMap();
        
        if (renamedFiles.size === 0) {
          downloadZipBtn.disabled = true;
        }
        
        map.closePopup();
      }

      // Função para remover ponto importado
      function removeImportedPoint(index) {
        if (confirm('Tem certeza que deseja remover este ponto importado?')) {
          const allPoints = combineAllPoints();
          const imagePointsCount = imagePoints.length;
          
          if (index >= imagePointsCount) {
            const importedIndex = index - imagePointsCount;
            importedPoints.splice(importedIndex, 1);
            importedCount = importedPoints.length;
            
            document.getElementById("importedPoints").textContent = importedCount;
            
            updateResultsTable();
            plotPointsOnMap();
            
            map.closePopup();
            
            const totalPoints = imagePoints.length + importedPoints.length;
            if (totalPoints === 0) {
              downloadKmlBtn.disabled = true;
              downloadCsvBtn.disabled = true;
            }
          }
        }
      }

      // Atualizar estatísticas
      function updateStats() {
        document.getElementById("renamedImages").textContent = renamedFiles.size;
        document.getElementById("importedPoints").textContent = importedCount;
      }

      // Consultar rodovias para popup
      async function consultarRodoviasParaPopup(point, index) {
        const coordKey = `${point.latitude.toFixed(6)}_${point.longitude.toFixed(6)}`;
        
        if (rodoviaCache.has(coordKey)) {
          exibirRodoviasNoPopup(rodoviaCache.get(coordKey), index, point);
          return;
        }
        
        try {
          const dadosDNIT = await consultarRodoviasDNIT(point.latitude, point.longitude);
          const dadosProcessados = processarDadosRodovias(dadosDNIT);
          
          rodoviaCache.set(coordKey, dadosProcessados);
          exibirRodoviasNoPopup(dadosProcessados, index, point);
          
        } catch (error) {
          console.error('Erro ao consultar rodovias:', error);
          exibirErroRodovias(index);
        }
      }

      // Exibir rodovias no popup
      function exibirRodoviasNoPopup(dadosProcessados, index, point) {
        const loadingDiv = document.getElementById(`rodoviaLoading_${index}`);
        const contentDiv = document.getElementById(`rodoviaContent_${index}`);
        
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (contentDiv) {
          contentDiv.innerHTML = gerarHtmlRodovias(dadosProcessados, {
            lat: point.latitude,
            lng: point.longitude
          });
          contentDiv.style.display = 'block';
        }
      }

      // Exibir erro na consulta de rodovias
      function exibirErroRodovias(index) {
        const loadingDiv = document.getElementById(`rodoviaLoading_${index}`);
        const contentDiv = document.getElementById(`rodoviaContent_${index}`);
        
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (contentDiv) {
          contentDiv.innerHTML = `
            <div style="padding: 6px; background: #ffebee; border: 1px solid #f44336; border-radius: 4px; text-align: center;">
              <div style="color: #d32f2f; font-size: 10px; font-weight: bold;">
                ❌ Erro ao consultar rodovias
              </div>
            </div>
          `;
          contentDiv.style.display = 'block';
        }
      }

      // Trocar camada de tile
      function switchTileLayer(layerType) {
        if (currentTileLayer) {
          map.removeLayer(currentTileLayer);
        }

        const layer = tileLayers[layerType];
        currentTileLayer = L.tileLayer(layer.url, layer.options).addTo(map);
        map.options.maxZoom = layer.options.maxZoom;
      }

    // Versão: 5.1
// Plotar pontos no mapa
function plotPointsOnMap() {
  if (!map || !markersLayer) return;

  debugLog('Plotando pontos no mapa');
  markersLayer.clearLayers();

  const allPoints = combineAllPoints();
  if (allPoints.length === 0) return;

  let bounds = L.latLngBounds();

  allPoints.forEach((point, index) => {
    const currentName = renamedFiles.get(point.filename) || point.filename;
    const isRenamed = renamedFiles.has(point.filename);
    const isImported = point.imported || false;
    
    // Criar ícone personalizado baseado na zona de drone ou se foi importado
    let markerIcon;
    if (isImported) {
      markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #9b59b6; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px;">📍</div>`,
        iconSize: [25, 25],
        iconAnchor: [12.5, 12.5]
      });
    } else if (droneZonesActive && point.droneZone) {
      const zoneColor = point.droneZone.zona === 'prohibited' ? '#e74c3c' : 
                       point.droneZone.zona === 'restricted' ? '#f39c12' : '#27ae60';
      
      markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${zoneColor}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px;">📷</div>`,
        iconSize: [25, 25],
        iconAnchor: [12.5, 12.5]
      });
    } else if (isRenamed) {
      // Usando um marcador roxo no estilo padrão do Leaflet para fotos renomeadas
      markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #9b59b6; width: 24px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 1px solid #FFF; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [24, 40],
        iconAnchor: [12, 40]
      });
    } else {
      markerIcon = new L.Icon.Default();
    }
    
    const marker = L.marker([point.latitude, point.longitude], { icon: markerIcon });
    
    const popup = L.popup({
      maxWidth: 280,
      minWidth: 280
    });
    
    if (isImported) {
      popup.setContent(createImportedPopupContent(point, index));
    } else {
      popup.setContent(createPopupContent(point, index, currentName, isRenamed));
    }
    
    marker.bindPopup(popup);
    
    // Event listener para quando o popup é aberto (só para pontos de imagem)
    if (!isImported) {
      marker.on('popupopen', function(e) {
        setTimeout(() => {
          consultarRodoviasParaPopup(point, index);
        }, 100);
      });

      // Adicionar eventos de preview da imagem
      marker.on('mouseover', function(e) {
        if (!isPreviewOpen) {
          previewTimeout = setTimeout(() => {
            showImagePreview(point, currentName, isRenamed);
          }, 2000);
        }
      });

      marker.on('mouseout', function(e) {
        if (previewTimeout) {
          clearTimeout(previewTimeout);
          previewTimeout = null;
        }
      });
    }

    markersLayer.addLayer(marker);
    bounds.extend([point.latitude, point.longitude]);
  });

  if (allPoints.length > 0) {
    map.fitBounds(bounds, { padding: [20, 20] });
  }

  // Se zonas de drone estão ativas, recarregar
  if (droneZonesActive) {
    setTimeout(() => {
      carregarZonasDrone();
    }, 500);
  }
  
  debugLog(`Plotados ${allPoints.length} pontos no mapa`);
}
      // Criar conteúdo do popup para pontos importados (COMPACTO)
      function createImportedPopupContent(point, index) {
        let droneInfo = '';
        if (droneZonesActive && point.droneZone) {
          const zoneIcon = point.droneZone.zona === 'prohibited' ? '🚫' : 
                          point.droneZone.zona === 'restricted' ? '⚠️' : '✅';
          
          droneInfo = `
            <div style="margin-top: 3px; padding: 2px; background: rgba(${point.droneZone.zona === 'prohibited' ? '231, 76, 60' : point.droneZone.zona === 'restricted' ? '241, 196, 15' : '46, 204, 113'}, 0.1); border-radius: 3px; border: 1px solid rgba(${point.droneZone.zona === 'prohibited' ? '231, 76, 60' : point.droneZone.zona === 'restricted' ? '241, 196, 15' : '46, 204, 113'}, 0.3);">
              <div style="font-size: 7px; color: #495057;"><strong>${zoneIcon} ${point.droneZone.descricao}</strong></div>
              ${point.droneZone.aeroporto ? `<div style="font-size: 9px; color: #6c757d;">${point.droneZone.aeroporto.name} (${point.droneZone.distancia.toFixed(1)}km)</div>` : ''}
            </div>
          `;
        }

        // Informações de rodovias para pontos importados
        let rodoviaInfo = '';
        if (point.rodovias && point.rodovias.rodovias && point.rodovias.rodovias.length > 0) {
          const listaRodovias = point.rodovias.rodovias.map(rodovia => {
            const isKmZero = parseFloat(rodovia.km) === 0;
            const alertIcon = isKmZero ? ' ⚠️' : '';
            return `BR-${rodovia.br} (Km ${rodovia.km})${alertIcon}`;
          }).join(' • ');
          
          rodoviaInfo = `
            <div style="margin-top: 6px; padding: 4px; background: #f8f9fa; border-radius: 3px; border: 1px solid #dee2e6;">
              <div style="font-size: 10px; color: #6c757d; margin-bottom: 2px;">🛣️ Rodovias:</div>
              <div style="font-size: 11px; color: #495057;">${listaRodovias}</div>
            </div>
          `;
        } else if (point.rodovias) {
          rodoviaInfo = `
            <div style="margin-top: 6px; padding: 4px; background: #f8f9fa; border-radius: 3px; border: 1px solid #dee2e6;">
              <div style="font-size: 10px; color: #6c757d;">🛣️ Nenhuma rodovia encontrada</div>
            </div>
          `;
        }
        
        return `
          <div>
            <h4>📍 ${point.filename} <span style="color: #9b59b6; font-size: 10px;">(Importado)</span></h4>
            <p style="margin: 3px 0;"><strong>Lat:</strong> ${point.latitude.toFixed(8)}<br>
            <strong>Lng:</strong> ${point.longitude.toFixed(8)}</p>
            ${point.datetime ? `<p style="margin: 3px 0;"><strong>Data:</strong> ${point.datetime}</p>` : ''}
            
            ${droneInfo}
            ${rodoviaInfo}
            
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
              <div class="popup-buttons">
                <button class="popup-btn" onclick="map.setView([${point.latitude}, ${point.longitude}], map.getMaxZoom())">
                  🔍 Zoom
                </button>
                <button class="popup-btn danger" onclick="removeImportedPoint(${index})">
                  🗑️ Remover
                </button>
              </div>
            </div>
          </div>
        `;
      }

      // Criar conteúdo do popup (COMPACTO)
      function createPopupContent(point, index, currentName, isRenamed) {
        const fileNameWithoutExt = currentName.substring(0, currentName.lastIndexOf('.')) || currentName;
        const fileExt = currentName.substring(currentName.lastIndexOf('.')) || '';
        
        let droneInfo = '';
        if (droneZonesActive && point.droneZone) {
          const zoneIcon = point.droneZone.zona === 'prohibited' ? '🚫' : 
                          point.droneZone.zona === 'restricted' ? '⚠️' : '✅';
          
          droneInfo = `
            <div style="margin-top: 6px; padding: 5px; background: rgba(${point.droneZone.zona === 'prohibited' ? '231, 76, 60' : point.droneZone.zona === 'restricted' ? '241, 196, 15' : '46, 204, 113'}, 0.1); border-radius: 3px; border: 1px solid rgba(${point.droneZone.zona === 'prohibited' ? '231, 76, 60' : point.droneZone.zona === 'restricted' ? '241, 196, 15' : '46, 204, 113'}, 0.3);">
              <div style="font-size: 10px; color: #495057;"><strong>${zoneIcon} ${point.droneZone.descricao}</strong></div>
              ${point.droneZone.aeroporto ? `<div style="font-size: 9px; color: #6c757d;">${point.droneZone.aeroporto.name} (${point.droneZone.distancia.toFixed(1)}km)</div>` : ''}
            </div>
          `;
        }
        
        return `
          <div>
            <h4>📷 ${isRenamed ? '<span class="renamed-indicator">✏️ ' + currentName + '</span>' : currentName}</h4>
            ${isRenamed ? `<p class="original-name" style="font-size: 10px; margin: 2px 0;">${point.filename}</p>` : ''}
            <p style="margin: 3px 0;"><strong>Lat:</strong> ${point.latitude.toFixed(8)}<br>
            <strong>Lng:</strong> ${point.longitude.toFixed(8)}</p>
            <p style="margin: 3px 0;"><strong>Data:</strong> ${point.datetime || "N/A"}</p>
            
            ${droneInfo}
            
            <div class="rename-section">
              <p style="font-size: 11px; margin-bottom: 3px;"><strong>Renomear:</strong></p>
              <input type="text" id="newName_${index}" class="rename-input" 
                     value="${fileNameWithoutExt}" placeholder="Novo nome">
              <div class="popup-buttons">
                <button class="popup-btn success" onclick="renameFile(${index}, '${point.filename}', '${fileExt}')">
                  ✓ OK
                </button>
                <button class="popup-btn" onclick="map.setView([${point.latitude}, ${point.longitude}], map.getMaxZoom())">
                  🔍 Zoom
                </button>
                ${isRenamed ? `<button class="popup-btn danger" onclick="resetFileName('${point.filename}', ${index})">↶ Desfazer</button>` : ''}
              </div>
            </div>
            
            <!-- Seção de Rodovias -->
            <div id="rodoviaInfo_${index}">
              <div id="rodoviaLoading_${index}" style="margin-top: 6px; padding: 4px; background: #f8f9fa; border-radius: 3px; text-align: center;">
                <span style="font-size: 10px; color: #6c757d;">Consultando rodovias...</span>
              </div>
              <div id="rodoviaContent_${index}" style="display: none;"></div>
            </div>
          </div>
        `;
      }

      // Versão: 5.0
// Atualiza a tabela de resultados com TODOS os pontos (acumulado)
function updateResultsTable() {
  // Limpar tabela para reconstruir com todos os pontos
  resultsBody.innerHTML = "";
  
  // Combinar TODOS os pontos (imagens + importados)
  const allPoints = combineAllPoints();
  
  debugLog(`Atualizando tabela com ${allPoints.length} pontos totais`);
  
  // Adicionar cada ponto à tabela
  allPoints.forEach((point) => {
    const currentName = renamedFiles.get(point.filename) || point.filename;
    const isRenamed = renamedFiles.has(point.filename);
    const isImported = point.imported || false;
    
    const row = resultsBody.insertRow();
    
    // Célula do nome
    const nameCell = row.insertCell(0);
    if (isImported) {
      nameCell.innerHTML = `<span style="color: #9b59b6;">${currentName}</span><br><small style="color: #9b59b6; font-style: italic; font-size: 10px;">(Importado)</small>`;
    } else if (isRenamed) {
      nameCell.innerHTML = `<span class="renamed-indicator">${currentName}</span><br><small class="original-name" style="font-size: 10px;">${point.filename}</small>`;
    } else {
      nameCell.textContent = currentName;
    }
    
    // Células de dados
    row.insertCell(1).textContent = point.latitude.toFixed(8);
    row.insertCell(2).textContent = point.longitude.toFixed(8);
    row.insertCell(3).textContent = point.datetime || "N/A";
  });
  
  debugLog(`Tabela atualizada com sucesso`);
}
      // Setup de eventos
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = "rgba(52, 152, 219, 0.2)";
      });

      dropZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = "rgba(52, 152, 219, 0.1)";
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = "rgba(52, 152, 219, 0.1)";
        handleFiles(e.dataTransfer.files);
      });

      fileInput.addEventListener("change", (e) => {
        handleFiles(e.target.files);
      });

     // Versão: 5.0
// Função principal para processar os arquivos de forma INCREMENTAL
function handleFiles(files) {
  if (!files || files.length === 0) {
    debugLog('Nenhum arquivo selecionado');
    return;
  }

  debugLog(`Processando ${files.length} arquivos de forma incremental`);

  // IMPORTANTE: NÃO resetar mais estas variáveis (modo incremental)
  // imagePoints = [];
  // originalFiles.clear();
  // imageDataMap.clear();
  // renamedFiles.clear();

  // Reset apenas das variáveis de controle do LOTE ATUAL
  processedImages = 0;
  imagesWithGeo = 0;
  const currentBatchSize = files.length;
  totalImages = currentBatchSize; // agora representa apenas o lote atual

  // Atualizar estatística total (incremental)
  const totalImagesCount = imagePoints.length + importedPoints.length + currentBatchSize;
  document.getElementById("totalImages").textContent = totalImagesCount;

  // NÃO limpar a tabela - ela será atualizada incrementalmente
  // resultsBody.innerHTML = "";

  // Mostrar barra de progresso
  progressBar.style.display = "block";
  progress.style.width = "0%";
  progress.textContent = "0%";

  // NÃO desabilitar botões se já tiverem pontos
  if (imagePoints.length === 0 && importedPoints.length === 0) {
    downloadKmlBtn.disabled = true;
    downloadKmzBtn.disabled = true;
    downloadCsvBtn.disabled = true;
    downloadZipBtn.disabled = true;
  }

  // NÃO limpar os marcadores - serão atualizados ao final
  // if (markersLayer) {
  //   markersLayer.clearLayers();
  // }

  // Verificar se EXIF está disponível
  if (typeof EXIF === 'undefined') {
    debugLog('ERRO: Biblioteca EXIF não carregada');
    alert('Erro: Biblioteca EXIF não foi carregada. Recarregue a página.');
    return;
  }

  Array.from(files).forEach((file, index) => {
    if (!file.type.startsWith("image/")) {
      debugLog(`Arquivo ${file.name} não é uma imagem`);
      updateProgress();
      return;
    }

    debugLog(`Processando imagem: ${file.name}`);
    originalFiles.set(file.name, file);

    const reader = new FileReader();
    reader.onload = function (e) {
      processImage(file, e.target.result);
    };
    reader.onerror = function() {
      debugLog(`Erro ao ler arquivo: ${file.name}`);
      updateProgress();
    };
    reader.readAsDataURL(file);
  });
}
     

// Versão: 5.1
// Processa uma imagem individual
function processImage(file, dataUrl) {
  debugLog(`Processando imagem: ${file.name}`);
  
  const img = new Image();
  img.onload = function () {
    debugLog(`Imagem carregada: ${file.name}`);
    
    try {
      EXIF.getData(img, function () {
        let lat = null;
        let lng = null;
        let datetime = null;

        const gpsLat = EXIF.getTag(this, "GPSLatitude");
        const gpsLng = EXIF.getTag(this, "GPSLongitude");
        
        debugLog(`GPS Latitude: ${gpsLat}, GPS Longitude: ${gpsLng}`);

        if (gpsLat && gpsLng) {
          lat = convertDMSToDD(
            gpsLat,
            EXIF.getTag(this, "GPSLatitudeRef")
          );

          lng = convertDMSToDD(
            gpsLng,
            EXIF.getTag(this, "GPSLongitudeRef")
          );

          const dateTimeOriginal = EXIF.getTag(this, "DateTimeOriginal");
          if (dateTimeOriginal) {
            datetime = dateTimeOriginal;
          }

          debugLog(`Coordenadas convertidas: Lat=${lat}, Lng=${lng}`);

          if (isValidCoordinate(lat, lng)) {
            imagesWithGeo++;

            // Criar versão redimensionada da imagem para economizar memória
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const maxSize = 800;
            let { width, height } = img;
            
            if (width > height && width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            imageDataMap.set(file.name, canvas.toDataURL('image/jpeg', 0.85));

            imagePoints.push({
              filename: file.name,
              latitude: lat,
              longitude: lng,
              datetime: datetime,
            });

            // *** REMOVIDO: Não adicionar linha aqui ***
            // A tabela será atualizada pelo updateResultsTable() no final
            
            debugLog(`Ponto adicionado: ${file.name}`);
          } else {
            debugLog(`Coordenadas inválidas para: ${file.name}`);
          }
        } else {
          debugLog(`Sem coordenadas GPS em: ${file.name}`);
        }

        updateProgress();
      });
    } catch (error) {
      debugLog(`Erro ao processar EXIF de ${file.name}: ${error.message}`);
      updateProgress();
    }
  };
  
  img.onerror = function() {
    debugLog(`Erro ao carregar imagem: ${file.name}`);
    updateProgress();
  };
  
  img.src = dataUrl;
}


// Versão: 5.0
// Atualiza o progresso do processamento do LOTE ATUAL
async function updateProgress() {
  processedImages++;
  const percentage = Math.round((processedImages / totalImages) * 100);
  progress.style.width = percentage + "%";
  progress.textContent = percentage + "%";

  debugLog(`Progresso: ${processedImages}/${totalImages} (${percentage}%)`);

  // Quando todas as imagens DO LOTE ATUAL forem processadas
  if (processedImages === totalImages) {
    
    // Atualizar estatística de imagens com geo (TOTAL acumulado)
    const totalGeoImages = imagePoints.length;
    document.getElementById("geoImages").textContent = totalGeoImages;
    
    // Contar quantas imagens NOVAS têm geolocalização
    const novasImagensComGeo = imagesWithGeo;
    
    // Se há NOVAS imagens com geolocalização, consultar rodovias
    if (novasImagensComGeo > 0) {
      debugLog(`Iniciando consulta de rodovias para ${novasImagensComGeo} novos pontos`);
      
      // Atualizar UI para mostrar consulta de rodovias
      progress.textContent = "Consultando rodovias...";
      progress.style.background = "linear-gradient(45deg, #9b59b6, #8e44ad)";
      
      let consultasRealizadas = 0;
      
      // Percorrer apenas os NOVOS pontos (últimos adicionados)
      const pontosNovos = imagePoints.slice(-novasImagensComGeo);
      
      for (let i = 0; i < pontosNovos.length; i++) {
        const point = pontosNovos[i];
        const coordKey = `${point.latitude.toFixed(6)}_${point.longitude.toFixed(6)}`;
        
        // Verificar se já existe no cache
        if (rodoviaCache.has(coordKey)) {
          point.rodovias = rodoviaCache.get(coordKey);
          debugLog(`Rodovia do cache para: ${point.filename}`);
        } else {
          try {
            // Consultar API DNIT
            const dadosDNIT = await consultarRodoviasDNIT(point.latitude, point.longitude);
            const dadosProcessados = processarDadosRodovias(dadosDNIT);
            
            // Armazenar no cache e no ponto
            rodoviaCache.set(coordKey, dadosProcessados);
            point.rodovias = dadosProcessados;
            
            debugLog(`Rodovia consultada para: ${point.filename}`);
            
            // Pausa para não sobrecarregar API (200ms)
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (error) {
            console.warn(`Erro ao consultar rodovias para ${point.filename}:`, error);
            point.rodovias = { rodovias: [] };
          }
        }
        
        // Atualizar progresso visual
        consultasRealizadas++;
        const percentualRodovias = Math.round((consultasRealizadas / pontosNovos.length) * 100);
        progress.textContent = `Rodovias: ${percentualRodovias}%`;
      }
      
      // Restaurar aparência da barra de progresso
      progress.style.background = "linear-gradient(45deg, #3498db, #2ecc71)";
      progress.textContent = "100% - Concluído!";
      
      debugLog(`Consulta de rodovias concluída para ${pontosNovos.length} novos pontos`);
    }
    
    // Atualizar tabela com TODOS os pontos (incluindo os novos)
    updateResultsTable();
    
    // Habilitar botões (se ainda não estiverem)
    const totalPoints = imagePoints.length + importedPoints.length;
    if (totalPoints > 0) {
      downloadKmlBtn.disabled = false;
      downloadCsvBtn.disabled = false;
      
      if (imagePoints.length > 0) {
        downloadKmzBtn.disabled = false;
      }
      
      // Atualizar mapa com TODOS os pontos
      plotPointsOnMap();
    }
    
    debugLog(`Processamento do lote concluído: ${novasImagensComGeo} novas imagens com GPS de ${totalImages} processadas`);
    debugLog(`Total acumulado: ${imagePoints.length} imagens com GPS`);
  }
}
      
      // Converter coordenadas DMS para Decimal Degrees
      function convertDMSToDD(dms, ref) {
        if (!dms || dms.length !== 3) return null;

        let dd = Number(dms[0]) + Number(dms[1]) / 60 + Number(dms[2]) / 3600;

        if (ref === "S" || ref === "W") {
          dd = -dd;
        }

        return dd;
      }

      // Verifica se as coordenadas são válidas
      function isValidCoordinate(lat, lng) {
        return (
          lat !== null &&
          lng !== null &&
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        );
      }

      // Event listeners dos botões de download
      downloadKmlBtn.addEventListener("click", () => {
        const allPoints = combineAllPoints();
        if (allPoints.length === 0) return;

        const kmlContent = generateKML();
        if (!kmlContent) return;

        const dataStr =
          "data:application/vnd.google-earth.kml+xml;charset=utf-8," +
          encodeURIComponent(kmlContent);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "pontos_georreferenciados.kml");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });

      downloadKmzBtn.addEventListener("click", () => {
        generateKMZ();
      });

      downloadCsvBtn.addEventListener("click", () => {
        const allPoints = combineAllPoints();
        if (allPoints.length === 0) return;

        let csvContent = "Nome do Arquivo,Nome Original,Latitude,Longitude,Data/Hora,Tipo\n";

        allPoints.forEach((point) => {
          const currentName = renamedFiles.get(point.filename) || point.filename;
          const isImported = point.imported || false;
          const tipo = isImported ? 'Importado' : 'Imagem';
          const originalName = point.filename;
          
          csvContent += `"${currentName}","${originalName}",${String(point.latitude)},${String(
            point.longitude
          )},"${point.datetime || ""}","${tipo}"\n`;
        });

        const dataStr =
          "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "pontos_georreferenciados.csv");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });

      // Função para carregar JSZip dinamicamente
      function loadJSZip(callback) {
        if (window.JSZip) {
          callback();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = callback;
        script.onerror = () => {
          alert("Erro ao carregar JSZip. Verifique sua conexão com a internet.");
        };

        document.head.appendChild(script);
      }

      downloadZipBtn.addEventListener("click", () => {
        if (imagePoints.length === 0) return;

        loadJSZip(() => {
          const zip = new JSZip();
          let promises = [];

          imagePoints.forEach((point) => {
            const originalFile = originalFiles.get(point.filename);
            if (originalFile) {
              const currentName = renamedFiles.get(point.filename) || point.filename;
              
              const promise = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  zip.file(currentName, e.target.result);
                  resolve();
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(originalFile);
              });
              
              promises.push(promise);
            }
          });

          Promise.all(promises)
            .then(() => {
              return zip.generateAsync({ type: "blob" });
            })
            .then((blob) => {
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "fotos_georreferenciadas.zip";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            })
            .catch((error) => {
              alert("Erro ao criar o ZIP: " + error.message);
            });
        });
      });

      // Inicializar o mapa — o script é carregado dinamicamente após DOMContentLoaded,
      // então o evento já disparou. Chamamos diretamente se o DOM estiver pronto.
      function inicializarApp() {
        debugLog('DOM carregado, inicializando aplicação');
        initMap();

        if (typeof EXIF === 'undefined') {
          debugLog('ERRO: EXIF não carregado');
        } else {
          debugLog('EXIF carregado com sucesso');
        }

        if (typeof L === 'undefined') {
          debugLog('ERRO: Leaflet não carregado');
        } else {
          debugLog('Leaflet carregado com sucesso');
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarApp);
      } else {
        inicializarApp();
      }
    