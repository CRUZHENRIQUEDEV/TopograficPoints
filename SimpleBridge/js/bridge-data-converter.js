/* ===== CONVERSÃO PARA ESTRUTURA HIERÁRQUICA BRIDGEDATA ===== */

/**
 * Arredonda um número para 3 casas decimais e trata valores muito pequenos como 0
 * @param {number} value - Valor a ser arredondado
 * @returns {number} Valor arredondado
 */
function roundTo3Decimals(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return value;
  }
  
  // Trata valores muito pequenos (erros de ponto flutuante) como 0
  if (Math.abs(value) < 1e-10) {
    return 0;
  }
  
  // Arredonda para 3 casas decimais
  return Math.round(value * 1000) / 1000;
}

/**
 * Converte uma obra flat do IndexedDB para estrutura hierárquica BridgeData
 * @param {object} obra - Objeto flat com campos do IndexedDB (CODIGO, LOTE, etc.)
 * @returns {object} Objeto BridgeData com hierarquia completa
 */
function convertObraFlatToBridgeData(obra) {
  if (!obra) {
    throw new Error("Obra não pode ser nula");
  }

  return {
    BridgeProjectData: generateBridgeProjectDataFromObra(obra),
    BridgeType: 0, // Padrão: 0 (pode ser configurado depois)
    GeneralConfigData: generateGeneralConfigDataFromObra(obra),
    BridgeTransitionData: generateBridgeTransitionDataFromObra(obra),
    SuperstructureData: generateSuperstructureDataFromObra(obra),
    BridgePierData: generateBridgePierDataFromObra(obra),
    BridgeComplementaryData: generateBridgeComplementaryDataFromObra(obra),
  };
}

/**
 * Gera BridgeProjectData a partir de uma obra flat
 * @param {object} obra - Obra do IndexedDB
 * @returns {object} BridgeProjectData
 */
function generateBridgeProjectDataFromObra(obra) {
  return {
    Name: obra.NOME || "",
    Id: 0,
    Code: obra.CODIGO || "",
    State: obra.UF || "",
    Highway: obra.RODOVIA || "",
    Km: roundTo3Decimals(parseFloat(obra.KM) || 0.0),
    Date: obra.DATA || "",
    Engineer: obra.ENGENHEIRO || "",
    Technician: obra.TECNICO || "",
  };
}

/**
 * Gera GeneralConfigData a partir de uma obra flat
 * Cria objeto Spans (BridgeSpanCollection) com tramos individuais
 * @param {object} obra - Obra do IndexedDB
 * @returns {object} GeneralConfigData com estrutura BridgeSpanCollection
 */
function generateGeneralConfigDataFromObra(obra) {
  const comprimento = parseFloat(obra.COMPRIMENTO) || 0.0;
  const qtdTramos = parseInt(obra["QTD TRAMOS"]) || parseInt(obra.QTD_TRAMOS) || 1;

  console.log(`[GeneralConfig] Processando obra ${obra.CODIGO}:`);
  console.log(`  - Comprimento total: ${comprimento}m`);
  console.log(`  - Quantidade de tramos: ${qtdTramos}`);

  // Processa comprimentos dos tramos (formato: "10;9;11")
  const spanLengths = [];
  const comprimentoTramosValue = obra["COMPRIMENTO TRAMOS"] || obra.COMPRIMENTO_TRAMOS;

  console.log(`  - COMPRIMENTO TRAMOS raw:`, comprimentoTramosValue);

  if (comprimentoTramosValue) {
    const tramosStr = comprimentoTramosValue.toString().trim();

    if (tramosStr.length > 0) {
      const tramosArray = tramosStr.split(";");

      tramosArray.forEach((t, index) => {
        const trimmed = t.trim();
        if (trimmed.length > 0) {
          const valor = parseFloat(trimmed);
          if (!isNaN(valor) && valor > 0) {
            spanLengths.push(valor);
            console.log(`  - Tramo ${index + 1}: ${valor}m`);
          } else {
            console.warn(`  - Tramo ${index + 1}: valor inválido "${trimmed}"`);
          }
        }
      });
    }
  }

  // Se não houver tramos definidos, distribui igualmente
  if (spanLengths.length === 0) {
    console.warn(`  ⚠️ Nenhum tramo definido, distribuindo ${comprimento}m em ${qtdTramos} tramos iguais`);
    const spanLength = comprimento / qtdTramos;
    for (let i = 0; i < qtdTramos; i++) {
      spanLengths.push(spanLength);
    }
  }

  // Validar soma dos tramos
  const somaTramos = spanLengths.reduce((sum, length) => sum + length, 0);
  const diferenca = Math.abs(somaTramos - comprimento);

  console.log(`  - Soma dos tramos: ${somaTramos.toFixed(2)}m`);
  console.log(`  - Diferença: ${diferenca.toFixed(4)}m`);

  if (diferenca > 0.01) {
    console.warn(`  ⚠️ Soma dos tramos difere do comprimento total!`);
  }

  // Criar objeto BridgeSpanCollection compatível com C#
  const bridgeSpanCollection = createBridgeSpanCollection(spanLengths, comprimento);

  console.log(`  ✓ BridgeSpanCollection criado com ${bridgeSpanCollection.Count} tramos`);

  return {
    Length: roundTo3Decimals(comprimento),
    Width: roundTo3Decimals(parseFloat(obra.LARGURA) || 0.0),
    Height: roundTo3Decimals(parseFloat(obra.ALTURA) || 0.0),
    ExpansionJointLength: 0.02,
    Spans: bridgeSpanCollection,
    BridgeOption: createZSElementTypeFromValue(obra.BRIDGE_OPTION),
  };
}

/**
 * Cria um objeto BridgeSpanCollection compatível com a classe C#
 * @param {Array<number>} spanLengths - Array com comprimentos dos tramos
 * @param {number} expectedTotalLength - Comprimento total esperado
 * @returns {object} BridgeSpanCollection
 */
function createBridgeSpanCollection(spanLengths, expectedTotalLength) {
  const spans = [];

  // Criar cada BridgeSpan individual
  for (let i = 0; i < spanLengths.length; i++) {
    const bridgeSpan = {
      Index: i,
      Length: roundTo3Decimals(spanLengths[i]),
      IsManuallyDefined: true,
      IsLastSpan: i === spanLengths.length - 1,
    };
    spans.push(bridgeSpan);
  }

  // Calcular soma total dos tramos
  const totalLength = roundTo3Decimals(spanLengths.reduce((sum, length) => sum + length, 0));
  const lengthDifference = roundTo3Decimals(expectedTotalLength - totalLength);
  const remainingLength = roundTo3Decimals(Math.max(0, lengthDifference));

  // Retornar BridgeSpanCollection
  return {
    ExpectedTotalLength: roundTo3Decimals(expectedTotalLength),
    Count: spans.length,
    TotalLength: totalLength,
    RemainingLength: remainingLength,
    LengthDifference: lengthDifference,
    IsValid: Math.abs(lengthDifference) <= 0.01,
    SpanLengths: spanLengths.map(l => roundTo3Decimals(l)),
    _spans: spans, // Lista interna de BridgeSpan
  };
}

/**
 * Gera BridgeTransitionData a partir de uma obra flat
 * @param {object} obra - Obra do IndexedDB
 * @returns {object} BridgeTransitionData
 */
function generateBridgeTransitionDataFromObra(obra) {
  const cortinaAltura = parseFloat(obra["CORTINA ALTURA"] || obra.CORTINA_ALTURA) || 1.5;
  const tipoEncontro = obra["TIPO ENCONTRO"] || obra.TIPO_ENCONTRO || "";
  const isSlabAbutment =
    tipoEncontro.toUpperCase() === "ENCONTRO LAJE" || tipoEncontro.toUpperCase() === "ENCONTRO DE LAJE";

  console.log(`[Transition] Cortina Altura: ${cortinaAltura}`);
  console.log(`[Transition] Tipo Encontro: "${tipoEncontro}" → IsSlabAbutment: ${isSlabAbutment}`);

  return {
    CurtainHeight: roundTo3Decimals(cortinaAltura),
    BearingThickness: 0.05,
    IsSlabAbutment: isSlabAbutment,
    SlabAbutmentLength: roundTo3Decimals(parseFloat(obra["COMPRIMENTO ENCONTRO LAJE"] || obra.COMPRIMENTO_ENCONTRO_LAJE) || 0.0),
    SlabAbutmentLeftOffset:
      roundTo3Decimals(parseFloat(obra["DESLOCAMENTO ESQUERDO ENCONTRO LAJE"] || obra.DESLOCAMENTO_ESQUERDO_ENCONTRO_LAJE) || 0.0),
    SlabAbutmentRightOffset:
      roundTo3Decimals(parseFloat(obra["DESLOCAMENTO DIREITO ENCONTRO LAJE"] || obra.DESLOCAMENTO_DIREITO_ENCONTRO_LAJE) || 0.0),
    ParallelWing: createZSElementTypeFromValue(obra["TIPO ALA PARALELA"] || obra.TIPO_ALA_PARALELA),
    PerpendicularWing: createZSElementTypeFromValue(obra["TIPO ALA PERPENDICULAR"] || obra.TIPO_ALA_PERPENDICULAR),
    WingLength: roundTo3Decimals(parseFloat(obra["COMPRIMENTO ALA"] || obra.COMPRIMENTO_ALA) || 0.0),
    WingThickness: roundTo3Decimals(parseFloat(obra["ESPESSURA ALA"] || obra.ESPESSURA_ALA) || 0.0),
    AbutmentType: createZSElementTypeFromValue(obra["TIPO ENCONTRO"] || obra.TIPO_ENCONTRO),
    TransitionSlabType: createZSElementTypeFromValue(obra["LAJE TRANSICAO"] || obra.LAJE_TRANSICAO),
    ReinforcedEarthWallType: createZSElementTypeFromValue(obra["TIPO TERRA ARMADA"] || obra.TIPO_TERRA_ARMADA),
  };
}

/**
 * Gera SuperstructureData a partir de uma obra flat
 * @param {object} obra - Obra do IndexedDB
 * @returns {object} BridgeSuperstructureData
 */
function generateSuperstructureDataFromObra(obra) {
  // Parse QTD LONGARINAS - aceitar 0 como valor válido
  const qtdLongarinasValue = obra["QTD LONGARINAS"] ?? obra.QTD_LONGARINAS;
  const qtdLongarinas = qtdLongarinasValue !== null && qtdLongarinasValue !== undefined && qtdLongarinasValue !== "" 
    ? parseInt(qtdLongarinasValue) 
    : 2;

  // Parse QTD TRANSVERSINAS - aceitar 0 como valor válido
  const qtdTransversinasValue = obra["QTD TRANSVERSINAS"] ?? obra.QTD_TRANSVERSINAS;
  const qtdTransversinas = qtdTransversinasValue !== null && qtdTransversinasValue !== undefined && qtdTransversinasValue !== "" 
    ? parseInt(qtdTransversinasValue) 
    : 0; // Se vazio, salvar como 0 ao invés de 3

  return {
    LongarineHeight: roundTo3Decimals(parseFloat(obra["ALTURA LONGARINA"] || obra.ALTURA_LONGARINA) || 0.0),
    LongarineThickness: roundTo3Decimals(parseFloat(obra["ESPESSURA LONGARINA"] || obra.ESPESSURA_LONGARINA) || 0.0),
    NumberOfLongarines: qtdLongarinas,
    LongarineType: createZSElementTypeFromValue(obra["TIPO LONGARINA"] || obra.TIPO_LONGARINA),
    BeamReinforcement: Boolean(obra["REFORCO VIGA"] || obra.REFORCO_VIGA),
    TransversineHeight: roundTo3Decimals(parseFloat(obra["ALTURA TRANSVERSINA"] || obra.ALTURA_TRANSVERSINA) || 0.0),
    TransversineThickness: roundTo3Decimals(parseFloat(obra["ESPESSURA TRANSVERSINA"] || obra.ESPESSURA_TRANSVERSINA) || 0.0),
    NumberOfTransversines: qtdTransversinas,
    TransversineType: createZSElementTypeFromValue(obra["TIPO DE TRANSVERSINA"] || obra.TIPO_TRANSVERSINA),
    SlabType: createZSElementTypeFromValue(obra["TIPO LAJE"] || obra.TIPO_LAJE),
    SlabThickness: roundTo3Decimals(parseFloat(obra["ESPESSURA LAJE"] || obra.ESPESSURA_LAJE) || 0.0),
    SlabStiffeningLongarineType: createZSElementTypeFromValue(
      obra["TIPO LONGARINA ENRIJECIMENTO"] || obra.TIPO_LONGARINA_ENRIJECIMENTO
    ),
    CornerAngleType: createZSElementTypeFromValue(obra["TIPO CANTONEIRA"] || obra.TIPO_CANTONEIRA),
    LeftDisplacement: roundTo3Decimals(parseFloat(obra["DESLOCAMENTO ESQUERDO"] || obra.DESLOCAMENTO_ESQUERDO) || 0.0),
    RightDisplacement: roundTo3Decimals(parseFloat(obra["DESLOCAMENTO DIREITO"] || obra.DESLOCAMENTO_DIREITO) || 0.0),
  };
}

/**
 * Gera BridgePierData a partir de uma obra flat do IndexedDB
 * Cria objetos PierConfiguration individuais para cada apoio
 * @param {object} obra - Obra do IndexedDB
 * @returns {object} BridgePierData com estrutura hierárquica
 */
function generateBridgePierDataFromObra(obra) {
  // Processa alturas dos apoios (formato: "1.45;5.9;5.9;5.9;5.9;1.45")
  const pierHeights = [];
  const alturaApoioValue = obra["ALTURA APOIO"] || obra.ALTURA_APOIO;
  if (alturaApoioValue) {
    const alturasStr = alturaApoioValue.toString();
    const alturasArray = alturasStr.split(";");
    alturasArray.forEach((a) => {
      const valor = parseFloat(a.trim());
      if (!isNaN(valor) && valor > 0) {
        pierHeights.push(roundTo3Decimals(valor));
      }
    });
  }

  // Se não há apoios, retorna estrutura vazia
  if (pierHeights.length === 0) {
    return {
      PierConfigurations: {
        _piers: [],
      },
    };
  }

  // Processa larguras dos pilares (formato: "0.6;0.6;0.6;0.6;0.6;0.6")
  const pillarWidths = [];
  const larguraPilarValue = obra["LARGURA PILAR"] || obra.LARGURA_PILAR;
  if (larguraPilarValue) {
    const largurasStr = larguraPilarValue.toString();
    const largurasArray = largurasStr.split(";");
    largurasArray.forEach((l) => {
      const valor = parseFloat(l.trim());
      if (!isNaN(valor)) {
        pillarWidths.push(roundTo3Decimals(valor));
      }
    });
  }

  // Processa comprimentos dos pilares (formato: "0.6;0.6;0.6;0.6;0.6;0.6")
  const pillarLengths = [];
  const comprimentoPilaresValue = obra["COMPRIMENTO PILARES"] || obra.COMPRIMENTO_PILARES;
  if (comprimentoPilaresValue) {
    const comprimentosStr = comprimentoPilaresValue.toString();
    const comprimentosArray = comprimentosStr.split(";");
    comprimentosArray.forEach((c) => {
      const valor = parseFloat(c.trim());
      if (!isNaN(valor)) {
        pillarLengths.push(roundTo3Decimals(valor));
      }
    });
  }

  // Dados comuns a todos os apoios (aplicados a cada PierConfiguration)
  const numberOfPillars = parseInt(obra["QTD PILARES"] || obra.QTD_PILARES) || 2;
  const isOffCenter = (obra["PILAR DESCENTRALIZADO"] || obra.PILAR_DESCENTRALIZADO) === "Sim";

  // Tipos de elementos (comuns a todos os apoios)
  const pillarType = createZSElementTypeFromValue(obra["TIPO PILAR"] || obra.TIPO_PILAR);
  const crossbeamType = createZSElementTypeFromValue(obra["TIPO TRAVESSA"] || obra.TIPO_TRAVESSA);
  const crossbeamHeight = roundTo3Decimals(parseFloat(obra["ALTURA TRAVESSA"] || obra.ALTURA_TRAVESSA) || 0.0);
  const crossbeamLength = roundTo3Decimals(parseFloat(obra["COMPRIMENTO TRAVESSA"] || obra.COMPRIMENTO_TRAVESSA) || 0.0);
  const foundationType = createZSElementTypeFromValue(obra["TIPO BLOCO SAPATA"] || obra.TIPO_BLOCO_SAPATA);
  const foundationHeight = roundTo3Decimals(parseFloat(obra["ALTURA BLOCO SAPATA"] || obra.ALTURA_BLOCO_SAPATA) || 0.0);
  const foundationWidth = roundTo3Decimals(parseFloat(obra["LARGURA BLOCO SAPATA"] || obra.LARGURA_BLOCO_SAPATA) || 0.0);
  const foundationLength = roundTo3Decimals(parseFloat(obra["COMPRIMENTO BLOCO SAPATA"] || obra.COMPRIMENTO_BLOCO_SAPATA) || 0.0);
  const bearingType = createZSElementTypeFromValue(obra["TIPO APARELHO APOIO"] || obra.TIPO_APARELHO_APOIO);
  const pillarBracingBeamType = createZSElementTypeFromValue(
    obra["TIPO CONTRAVENTAMENTO PILAR"] || obra.TIPO_CONTRAVENTAMENTO_PILAR
  );
  const pillarBracingBeamQuantity = parseInt(obra["QTD VIGA CONTRAVENTAMENTO PILAR"] || obra.QTD_VIGA_CONTRAVENTAMENTO_PILAR) || 0;
  const pillarBracingBeamHeight = roundTo3Decimals(parseFloat(obra["ALTURA VIGA CONTRAVENTAMENTO"] || obra.ALTURA_VIGA_CONTRAVENTAMENTO) || 0.0);
  const pillarBracingBeamLength =
    roundTo3Decimals(parseFloat(obra["COMPRIMENTO VIGA CONTRAVENTAMENTO"] || obra.COMPRIMENTO_VIGA_CONTRAVENTAMENTO) || 0.0);
  const connectionBeamType = createZSElementTypeFromValue(obra["TIPO VIGA LIGACAO"] || obra.TIPO_VIGA_LIGACAO);
  const pillarJacketType = createZSElementTypeFromValue(obra["TIPO ENCAMISAMENTO"] || obra.TIPO_ENCAMISAMENTO);
  const foundationConnectionBeamType = createZSElementTypeFromValue(
    obra["TIPO LIGACAO FUNDACOES"] || obra.TIPO_LIGACAO_FUNDACOES
  );
  const foundationConnectionBeamHeight =
    roundTo3Decimals(parseFloat(obra["ALTURA VIGA LIGACAO FUNDACOES"] || obra.ALTURA_VIGA_LIGACAO_FUNDACOES) || 0.0);
  const foundationConnectionBeamLength =
    roundTo3Decimals(parseFloat(obra["COMPRIMENTO VIGA LIGACAO FUNDACOES"] || obra.COMPRIMENTO_VIGA_LIGACAO_FUNDACOES) || 0.0);

  // Criar array de PierConfiguration (um objeto para cada apoio)
  const piers = [];
  for (let i = 0; i < pierHeights.length; i++) {
    const pierConfig = {
      Index: i,
      Height: pierHeights[i],
      IsManuallyDefined: true,

      // Configuração dos Pilares (pode variar por apoio)
      NumberOfPillars: numberOfPillars,
      PillarWidth: pillarWidths[i] || pillarWidths[0] || 0.7,
      PillarLength: pillarLengths[i] || pillarLengths[0] || 0.7,
      IsOffCenter: isOffCenter,

      // Tipos de Elementos (comuns a todos os apoios neste caso)
      PillarType: pillarType,
      CrossbeamType: crossbeamType,
      CrossbeamHeight: crossbeamHeight,
      CrossbeamLength: crossbeamLength,
      FoundationType: foundationType,
      FoundationHeight: foundationHeight,
      FoundationWidth: foundationWidth,
      FoundationLength: foundationLength,
      BearingType: bearingType,

      // Vigas de Contraventamento
      PillarBracingBeamType: pillarBracingBeamType,
      PillarBracingBeamQuantity: pillarBracingBeamQuantity,
      PillarBracingBeamHeight: pillarBracingBeamHeight,
      PillarBracingBeamLength: pillarBracingBeamLength,

      // Outros Elementos
      PillarJacketType: pillarJacketType,
      ConnectionBeamType: connectionBeamType,
      FoundationConnectionBeamType: foundationConnectionBeamType,
      FoundationConnectionBeamHeight: foundationConnectionBeamHeight,
      FoundationConnectionBeamLength: foundationConnectionBeamLength,
    };

    piers.push(pierConfig);
  }

  // Retorna estrutura compatível com PierConfigurationCollection
  return {
    PierConfigurations: {
      _piers: piers,
    },
  };
}

/**
 * Gera BridgeComplementaryData a partir de uma obra flat
 * @param {object} obra - Obra do IndexedDB
 * @returns {object} BridgeComplementaryData
 */
function generateBridgeComplementaryDataFromObra(obra) {
  return {
    LeftBarrierType: createZSElementTypeFromValue(obra["TIPO BARREIRA ESQUERDA"] || obra.TIPO_BARREIRA_ESQUERDA),
    LeftBarrierWidth: roundTo3Decimals(parseFloat(obra["LARGURA BARREIRA ESQUERDA"] || obra.LARGURA_BARREIRA_ESQUERDA) || 0.0),
    RightBarrierType: createZSElementTypeFromValue(obra["TIPO BARREIRA DIREITA"] || obra.TIPO_BARREIRA_DIREITA),
    RightBarrierWidth: roundTo3Decimals(parseFloat(obra["LARGURA BARREIRA DIREITA"] || obra.LARGURA_BARREIRA_DIREITA) || 0.0),
    LeftSidewalkType: createZSElementTypeFromValue(obra["TIPO CALCADA ESQUERDA"] || obra.TIPO_CALCADA_ESQUERDA),
    LeftSidewalkWidth: roundTo3Decimals(parseFloat(obra["LARGURA CALCADA ESQUERDA"] || obra.LARGURA_CALCADA_ESQUERDA) || 0.0),
    RightSidewalkType: createZSElementTypeFromValue(obra["TIPO CALCADA DIREITA"] || obra.TIPO_CALCADA_DIREITA),
    RightSidewalkWidth: roundTo3Decimals(parseFloat(obra["LARGURA CALCADA DIREITA"] || obra.LARGURA_CALCADA_DIREITA) || 0.0),
    LeftGuardRailType: createZSElementTypeFromValue(obra["GUARDA RODAS ESQUERDO"] || obra.GUARDA_RODAS_ESQUERDO),
    LeftGuardRailWidth: roundTo3Decimals(parseFloat(obra["LARGURA GUARDA RODAS ESQUERDO"] || obra.LARGURA_GUARDA_RODAS_ESQUERDO) || 0.0),
    RightGuardRail: createZSElementTypeFromValue(obra["GUARDA RODAS DIREITO"] || obra.GUARDA_RODAS_DIREITO),
    RightGuardRailWidth: roundTo3Decimals(parseFloat(obra["LARGURA GUARDA RODAS DIREITO"] || obra.LARGURA_GUARDA_RODAS_DIREITO) || 0.0),
    LeftGuardBodyType: createZSElementTypeFromValue(obra["GUARDA CORPO ESQUERDO"] || obra.GUARDA_CORPO_ESQUERDO),
    LeftGuardBodyWidth: roundTo3Decimals(parseFloat(obra["LARGURA GUARDA CORPO ESQUERDO"] || obra.LARGURA_GUARDA_CORPO_ESQUERDO) || 0.0),
    RightGuardBodyType: createZSElementTypeFromValue(obra["GUARDA CORPO DIREITO"] || obra.GUARDA_CORPO_DIREITO),
    RightGuardBodyWidth: roundTo3Decimals(parseFloat(obra["LARGURA GUARDA CORPO DIREITO"] || obra.LARGURA_GUARDA_CORPO_DIREITO) || 0.0),
    PavementType: createZSElementTypeFromValue(obra["TIPO PAVIMENTO"] || obra.TIPO_PAVIMENTO),
    ExpansionJointType: createZSElementTypeFromValue(obra["TIPO JUNTA DILATACAO"] || obra.TIPO_JUNTA_DILATACAO),
    CradleType: createZSElementTypeFromValue(obra["TIPO BERCO"] || obra.TIPO_BERCO),
    NumberOfBuzinotes: parseInt(obra["QTD BUZINOTES"] || obra.QTD_BUZINOTES) || 0,
  };
}

/**
 * Cria um objeto ZSElementType a partir de um valor do IndexedDB
 * @param {string} fieldValue - Valor do campo (geralmente string)
 * @returns {object|null} Objeto ZSElementType ou null se vazio
 */
function createZSElementTypeFromValue(fieldValue) {
  if (
    !fieldValue ||
    fieldValue === "" ||
    fieldValue === "Selecione" ||
    fieldValue === "Nenhum" ||
    fieldValue === "NULL" ||
    fieldValue === "null"
  ) {
    return null;
  }

  return {
    Name: fieldValue.toString(),
    Id: 0,
    Category: 0,
    TypeMark: "",
    FamilyName: "",
    IsActive: true,
    TypeComments: "",
    IsSystemFamily: false,
    CanBeTransferred: true,
  };
}

// Expor funções globalmente
window.roundTo3Decimals = roundTo3Decimals;
window.convertObraFlatToBridgeData = convertObraFlatToBridgeData;
window.generateBridgeProjectDataFromObra = generateBridgeProjectDataFromObra;
window.generateGeneralConfigDataFromObra = generateGeneralConfigDataFromObra;
window.createBridgeSpanCollection = createBridgeSpanCollection;
window.generateBridgeTransitionDataFromObra = generateBridgeTransitionDataFromObra;
window.generateSuperstructureDataFromObra = generateSuperstructureDataFromObra;
window.generateBridgePierDataFromObra = generateBridgePierDataFromObra;
window.generateBridgeComplementaryDataFromObra = generateBridgeComplementaryDataFromObra;
window.createZSElementTypeFromValue = createZSElementTypeFromValue;
