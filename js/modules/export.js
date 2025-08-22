/**
 * EXPORT MODULE
 * Módulo para exportação de dados e relatórios em diferentes formatos
 */

class ExportManager {
    /**
     * Exporta dados para diferentes formatos
     * @param {Object} data - Dados para exportar
     * @param {string} format - Formato (csv, json, xlsx, pdf, txt)
     * @param {string} filename - Nome do arquivo
     * @returns {Promise} Promise da operação de export
     */
    static async exportData(data, format = 'json', filename = null) {
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:.]/g, '-');
        const defaultFilename = `relatorio_inclinacoes_${timestamp}`;
        const finalFilename = filename || defaultFilename;

        try {
            switch (format.toLowerCase()) {
                case 'csv':
                    return this.exportToCSV(data, finalFilename);
                case 'json':
                    return this.exportToJSON(data, finalFilename);
                case 'xlsx':
                case 'excel':
                    return this.exportToExcel(data, finalFilename);
                case 'pdf':
                    return this.exportToPDF(data, finalFilename);
                case 'txt':
                case 'text':
                    return this.exportToText(data, finalFilename);
                case 'xml':
                    return this.exportToXML(data, finalFilename);
                case 'dxf':
                    return this.exportToDXF(data, finalFilename);
                default:
                    throw new Error(`Formato não suportado: ${format}`);
            }
        } catch (error) {
            console.error('Erro na exportação:', error);
            throw error;
        }
    }

    /**
     * Exporta para CSV
     * @param {Object} data - Dados do relatório
     * @param {string} filename - Nome do arquivo
     */
    static exportToCSV(data, filename) {
        let csvContent = '';

        // Cabeçalho do relatório
        csvContent += `Relatório de Análise de Inclinações - Tabuleiros de Ponte\n`;
        csvContent += `Data/Hora,${new Date().toLocaleString('pt-BR')}\n`;
        csvContent += `Sistema,${data.struct1?.sirgasZone ? `SIRGAS 2000 / UTM Zona ${data.struct1.sirgasZone}S` : 'Não identificado'}\n\n`;

        // Estrutura 1
        if (data.struct1) {
            csvContent += `ESTRUTURA 1 - DIMENSÕES\n`;
            csvContent += `Métrica,Valor,Unidade\n`;
            csvContent += `Largura Início,${data.struct1.distances.larguraInicio.toFixed(3)},m\n`;
            csvContent += `Largura Final,${data.struct1.distances.larguraFinal.toFixed(3)},m\n`;
            csvContent += `Média Largura,${data.struct1.distances.mediaLargura.toFixed(3)},m\n`;
            csvContent += `Comprimento LD,${data.struct1.distances.comprimentoLD.toFixed(3)},m\n`;
            csvContent += `Comprimento LE,${data.struct1.distances.comprimentoLE.toFixed(3)},m\n`;
            csvContent += `Média Comprimento,${data.struct1.distances.mediaComprimento.toFixed(3)},m\n\n`;

            csvContent += `ESTRUTURA 1 - INCLINAÇÕES\n`;
            csvContent += `Tipo,Localização,Inclinação_%,Graus,Status\n`;
            csvContent += `Transversal,Início,${data.struct1.inclinations.transversalInicio.percentage.toFixed(2)},${data.struct1.inclinations.transversalInicio.degrees.toFixed(1)},${data.struct1.status.transversalInicio.text}\n`;
            csvContent += `Transversal,Final,${data.struct1.inclinations.transversalFinal.percentage.toFixed(2)},${data.struct1.inclinations.transversalFinal.degrees.toFixed(1)},${data.struct1.status.transversalFinal.text}\n`;
            csvContent += `Longitudinal,LD,${data.struct1.inclinations.longitudinalLD.percentage.toFixed(2)},${data.struct1.inclinations.longitudinalLD.degrees.toFixed(1)},${data.struct1.status.longitudinalLD.text}\n`;
            csvContent += `Longitudinal,LE,${data.struct1.inclinations.longitudinalLE.percentage.toFixed(2)},${data.struct1.inclinations.longitudinalLE.degrees.toFixed(1)},${data.struct1.status.longitudinalLE.text}\n\n`;
        }

        // Estrutura 2 (se houver)
        if (data.struct2) {
            csvContent += `ESTRUTURA 2 - DIMENSÕES\n`;
            csvContent += `Métrica,Valor,Unidade\n`;
            csvContent += `Largura Início,${data.struct2.distances.larguraInicio.toFixed(3)},m\n`;
            csvContent += `Largura Final,${data.struct2.distances.larguraFinal.toFixed(3)},m\n`;
            csvContent += `Média Largura,${data.struct2.distances.mediaLargura.toFixed(3)},m\n`;
            csvContent += `Comprimento LD,${data.struct2.distances.comprimentoLD.toFixed(3)},m\n`;
            csvContent += `Comprimento LE,${data.struct2.distances.comprimentoLE.toFixed(3)},m\n`;
            csvContent += `Média Comprimento,${data.struct2.distances.mediaComprimento.toFixed(3)},m\n\n`;

            // Comparação entre estruturas
            if (data.comparison) {
                csvContent += `COMPARAÇÃO ENTRE ESTRUTURAS\n`;
                csvContent += `Métrica,Valor,Unidade\n`;
                csvContent += `Distância Total,${data.comparison.crossDistance.toFixed(3)},m\n`;
                csvContent += `Diferença Elevação,${data.comparison.crossElevation.toFixed(3)},m\n`;
                csvContent += `Inclinação Entre Estruturas,${data.comparison.crossInclination.percentage.toFixed(2)},%\n`;
                csvContent += `Média Geral Largura,${data.comparison.mediaGeralLargura.toFixed(3)},m\n`;
                csvContent += `Média Geral Comprimento,${data.comparison.mediaGeralComprimento.toFixed(3)},m\n\n`;
            }
        }

        // Conformidade
        csvContent += `ANÁLISE DE CONFORMIDADE\n`;
        csvContent += `Limite Transversal,${TECHNICAL_LIMITS.TRANSVERSAL},%\n`;
        csvContent += `Limite Longitudinal,${TECHNICAL_LIMITS.LONGITUDINAL},%\n`;
        
        const totalProblems = (data.problems?.struct1?.total || 0) + 
                             (data.problems?.struct2?.total || 0) + 
                             (data.problems?.crossStructure?.total || 0);
        csvContent += `Status Geral,${totalProblems > 0 ? 'NÃO CONFORME' : 'CONFORME'}\n`;
        csvContent += `Total Não Conformidades,${totalProblems}\n`;

        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }

    /**
     * Exporta para JSON
     * @param {Object} data - Dados do relatório
     * @param {string} filename - Nome do arquivo
     */
    static exportToJSON(data, filename) {
        const exportData = {
            metadata: {
                generated: new Date().toISOString(),
                version: '2.0.0',
                system: 'Analisador de Inclinações - Tabuleiros de Ponte',
                limits: {
                    transversal: TECHNICAL_LIMITS.TRANSVERSAL,
                    longitudinal: TECHNICAL_LIMITS.LONGITUDINAL
                }
            },
            data: data
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }

    /**
     * Exporta para Excel (simulado com CSV formatado)
     * @param {Object} data - Dados do relatório
     * @param {string} filename - Nome do arquivo
     */
    static exportToExcel(data, filename) {
        // Simulação de Excel usando CSV com separador de abas
        let excelContent = '';

        // Planilha 1: Resumo
        excelContent += `PLANILHA: RESUMO EXECUTIVO\n`;
        excelContent += `Métrica\tEstrutura 1\tEstrutura 2\tUnidade\n`;
        
        if (data.struct1) {
            excelContent += `Largura Média\t${data.struct1.distances.mediaLargura.toFixed(3)}`;
            if (data.struct2) {
                excelContent += `\t${data.struct2.distances.mediaLargura.toFixed(3)}`;
            }
            excelContent += `\tm\n`;
            
            excelContent += `Comprimento Médio\t${data.struct1.distances.mediaComprimento.toFixed(3)}`;
            if (data.struct2) {
                excelContent += `\t${data.struct2.distances.mediaComprimento.toFixed(3)}`;
            }
            excelContent += `\tm\n`;
        }

        excelContent += `\n\nPLANILHA: INCLINAÇÕES\n`;
        excelContent += `Tipo\tLocalização\tEstrutura\tInclinação %\tGraus\tStatus\n`;

        if (data.struct1) {
            excelContent += `Transversal\tInício\t1\t${data.struct1.inclinations.transversalInicio.percentage.toFixed(2)}\t${data.struct1.inclinations.transversalInicio.degrees.toFixed(1)}\t${data.struct1.status.transversalInicio.text}\n`;
            excelContent += `Transversal\tFinal\t1\t${data.struct1.inclinations.transversalFinal.percentage.toFixed(2)}\t${data.struct1.inclinations.transversalFinal.degrees.toFixed(1)}\t${data.struct1.status.transversalFinal.text}\n`;
            excelContent += `Longitudinal\tLD\t1\t${data.struct1.inclinations.longitudinalLD.percentage.toFixed(2)}\t${data.struct1.inclinations.longitudinalLD.degrees.toFixed(1)}\t${data.struct1.status.longitudinalLD.text}\n`;
            excelContent += `Longitudinal\tLE\t1\t${data.struct1.inclinations.longitudinalLE.percentage.toFixed(2)}\t${data.struct1.inclinations.longitudinalLE.degrees.toFixed(1)}\t${data.struct1.status.longitudinalLE.text}\n`;
        }

        if (data.struct2) {
            excelContent += `Transversal\tInício\t2\t${data.struct2.inclinations.transversalInicio.percentage.toFixed(2)}\t${data.struct2.inclinations.transversalInicio.degrees.toFixed(1)}\t${data.struct2.status.transversalInicio.text}\n`;
            excelContent += `Transversal\tFinal\t2\t${data.struct2.inclinations.transversalFinal.percentage.toFixed(2)}\t${data.struct2.inclinations.transversalFinal.degrees.toFixed(1)}\t${data.struct2.status.transversalFinal.text}\n`;
        }

        this.downloadFile(excelContent, `${filename}.xls`, 'application/vnd.ms-excel');
    }

    /**
     * Exporta para PDF (simulado com HTML)
     * @param {Object} data - Dados do relatório
     * @param {string} filename - Nome do arquivo
     */
    static exportToPDF(data, filename) {
        const htmlContent = this.generateHTMLReport(data);
        
        // Para PDF real seria necessário usar uma biblioteca como jsPDF
        // Por enquanto, vamos simular abrindo uma nova janela para impressão
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
    }

    /**
     * Exporta para texto simples
     * @param {Object} data - Dados do relatório
     * @param {string} filename - Nome do arquivo
     */
    static exportToText(data, filename) {
        let textContent = '';

        textContent += `RELATÓRIO DE ANÁLISE DE INCLINAÇÕES - TABULEIROS DE PONTE\n`;
        textContent += `${'='.repeat(60)}\n\n`;
        textContent += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`;
        textContent += `Sistema: ${data.struct1?.sirgasZone ? `SIRGAS 2000 / UTM Zona ${data.struct1.sirgasZone}S` : 'Não identificado'}\n\n`;

        // Limites técnicos
        textContent += `LIMITES TÉCNICOS:\n`;
        textContent += `- Inclinação Transversal: ≤ ${TECHNICAL_LIMITS.TRANSVERSAL}%\n`;
        textContent += `- Inclinação Longitudinal: ≤ ${TECHNICAL_LIMITS.LONGITUDINAL}%\n\n`;

        // Estrutura 1
        if (data.struct1) {
            textContent += `ESTRUTURA 1 - DIMENSÕES:\n`;
            textContent += `-${''.repeat(30)}\n`;
            textContent += `Largura Início: ${data.struct1.distances.larguraInicio.toFixed(3)} m\n`;
            textContent += `Largura Final: ${data.struct1.distances.larguraFinal.toFixed(3)} m\n`;
            textContent += `Largura Média: ${data.struct1.distances.mediaLargura.toFixed(3)} m\n`;
            textContent += `Comprimento LD: ${data.struct1.distances.comprimentoLD.toFixed(3)} m\n`;
            textContent += `Comprimento LE: ${data.struct1.distances.comprimentoLE.toFixed(3)} m\n`;
            textContent += `Comprimento Médio: ${data.struct1.distances.mediaComprimento.toFixed(3)} m\n\n`;

            textContent += `ESTRUTURA 1 - INCLINAÇÕES:\n`;
            textContent += `-${''.repeat(30)}\n`;
            textContent += `Transversal Início: ${data.struct1.inclinations.transversalInicio.percentage.toFixed(2)}% (${data.struct1.status.transversalInicio.text})\n`;
            textContent += `Transversal Final: ${data.struct1.inclinations.transversalFinal.percentage.toFixed(2)}% (${data.struct1.status.transversalFinal.text})\n`;
            textContent += `Longitudinal LD: ${data.struct1.inclinations.longitudinalLD.percentage.toFixed(2)}% (${data.struct1.status.longitudinalLD.text})\n`;
            textContent += `Longitudinal LE: ${data.struct1.inclinations.longitudinalLE.percentage.toFixed(2)}% (${data.struct1.status.longitudinalLE.text})\n\n`;
        }

        // Estrutura 2
        if (data.struct2) {
            textContent += `ESTRUTURA 2 - DIMENSÕES:\n`;
            textContent += `-${''.repeat(30)}\n`;
            textContent += `Largura Média: ${data.struct2.distances.mediaLargura.toFixed(3)} m\n`;
            textContent += `Comprimento Médio: ${data.struct2.distances.mediaComprimento.toFixed(3)} m\n\n`;

            // Comparação
            if (data.comparison) {
                textContent += `COMPARAÇÃO ENTRE ESTRUTURAS:\n`;
                textContent += `-${''.repeat(35)}\n`;
                textContent += `Distância Total: ${data.comparison.crossDistance.toFixed(3)} m\n`;
                textContent += `Diferença de Elevação: ${data.comparison.crossElevation.toFixed(3)} m\n`;
                textContent += `Inclinação Entre Estruturas: ${data.comparison.crossInclination.percentage.toFixed(2)}%\n`;
                textContent += `Média Geral Largura: ${data.comparison.mediaGeralLargura.toFixed(3)} m\n`;
                textContent += `Média Geral Comprimento: ${data.comparison.mediaGeralComprimento.toFixed(3)} m\n\n`;
            }
        }

        // Conformidade
        const totalProblems = (data.problems?.struct1?.total || 0) + 
                             (data.problems?.struct2?.total || 0) + 
                             (data.problems?.crossStructure?.total || 0);

        textContent += `ANÁLISE DE CONFORMIDADE:\n`;
        textContent += `-${''.repeat(25)}\n`;
        textContent += `Status Geral: ${totalProblems > 0 ? 'NÃO CONFORME' : 'CONFORME'}\n`;
        textContent += `Total de Não Conformidades: ${totalProblems}\n`;

        if (totalProblems > 0) {
            textContent += `\nRECOMENDAÇÃO: Análise estrutural específica necessária.\n`;
        }

        textContent += `\n${'='.repeat(60)}\n`;
        textContent += `Relatório gerado automaticamente pelo Sistema de Análise de Inclinações v2.0\n`;

        this.downloadFile(textContent, `${filename}.txt`, 'text/plain');
    }

    /**
     * Exporta para XML
     * @param {Object} data - Dados do relatório
     * @param {string} filename - Nome do arquivo
     */
    static exportToXML(data, filename) {
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xmlContent += '<relatorio_inclinacoes>\n';
        xmlContent += `  <metadata>\n`;
        xmlContent += `    <gerado>${new Date().toISOString()}</gerado>\n`;
        xmlContent += `    <versao>2.0.0</versao>\n`;
        xmlContent += `    <sistema>Analisador de Inclinações - Tabuleiros de Ponte</sistema>\n`;
        xmlContent += `  </metadata>\n`;

        xmlContent += `  <limites_tecnicos>\n`;
        xmlContent += `    <transversal>${TECHNICAL_LIMITS.TRANSVERSAL}</transversal>\n`;
        xmlContent += `    <longitudinal>${TECHNICAL_LIMITS.LONGITUDINAL}</longitudinal>\n`;
        xmlContent += `  </limites_tecnicos>\n`;

        if (data.struct1) {
            xmlContent += `  <estrutura id="1">\n`;
            xmlContent += `    <dimensoes>\n`;
            xmlContent += `      <largura_media>${data.struct1.distances.mediaLargura.toFixed(3)}</largura_media>\n`;
            xmlContent += `      <comprimento_medio>${data.struct1.distances.mediaComprimento.toFixed(3)}</comprimento_medio>\n`;
            xmlContent += `    </dimensoes>\n`;
            xmlContent += `    <inclinacoes>\n`;
            xmlContent += `      <transversal_inicio percentual="${data.struct1.inclinations.transversalInicio.percentage.toFixed(2)}" graus="${data.struct1.inclinations.transversalInicio.degrees.toFixed(1)}" />\n`;
            xmlContent += `      <longitudinal_ld percentual="${data.struct1.inclinations.longitudinalLD.percentage.toFixed(2)}" graus="${data.struct1.inclinations.longitudinalLD.degrees.toFixed(1)}" />\n`;
            xmlContent += `    </inclinacoes>\n`;
            xmlContent += `  </estrutura>\n`;
        }

        if (data.struct2) {
            xmlContent += `  <estrutura id="2">\n`;
            xmlContent += `    <dimensoes>\n`;
            xmlContent += `      <largura_media>${data.struct2.distances.mediaLargura.toFixed(3)}</largura_media>\n`;
            xmlContent += `      <comprimento_medio>${data.struct2.distances.mediaComprimento.toFixed(3)}</comprimento_medio>\n`;
            xmlContent += `    </dimensoes>\n`;
            xmlContent += `  </estrutura>\n`;
        }

        if (data.comparison) {
            xmlContent += `  <comparacao>\n`;
            xmlContent += `    <distancia_total>${data.comparison.crossDistance.toFixed(3)}</distancia_total>\n`;
            xmlContent += `    <inclinacao_entre_estruturas>${data.comparison.crossInclination.percentage.toFixed(2)}</inclinacao_entre_estruturas>\n`;
            xmlContent += `  </comparacao>\n`;
        }

        xmlContent += '</relatorio_inclinacoes>';

        this.downloadFile(xmlContent, `${filename}.xml`, 'application/xml');
    }

    /**
     * Exporta para DXF (formato básico para CAD)
     * @param {Object} data - Dados do relatório
     * @param {string} filename - Nome do arquivo
     */
    static exportToDXF(data, filename) {
        let dxfContent = '';
        
        // Cabeçalho DXF básico
        dxfContent += '0\nSECTION\n2\nHEADER\n';
        dxfContent += '0\nENDSEC\n';
        
        // Seção de entidades
        dxfContent += '0\nSECTION\n2\nENTITIES\n';

        // Desenhar estruturas como linhas se tiver coordenadas
        if (data.struct1 && data.struct1.points) {
            const points = data.struct1.points;
            
            // Linha LD_INICIO para LE_INICIO
            dxfContent += '0\nLINE\n8\n0\n';
            dxfContent += `10\n${points.ldInicio.x}\n20\n${points.ldInicio.y}\n30\n${points.ldInicio.elevation}\n`;
            dxfContent += `11\n${points.leInicio.x}\n21\n${points.leInicio.y}\n31\n${points.leInicio.elevation}\n`;
            
            // Linha LE_INICIO para LE_FINAL
            dxfContent += '0\nLINE\n8\n0\n';
            dxfContent += `10\n${points.leInicio.x}\n20\n${points.leInicio.y}\n30\n${points.leInicio.elevation}\n`;
            dxfContent += `11\n${points.leFinal.x}\n21\n${points.leFinal.y}\n31\n${points.leFinal.elevation}\n`;
            
            // Linha LE_FINAL para LD_FINAL
            dxfContent += '0\nLINE\n8\n0\n';
            dxfContent += `10\n${points.leFinal.x}\n20\n${points.leFinal.y}\n30\n${points.leFinal.elevation}\n`;
            dxfContent += `11\n${points.ldFinal.x}\n21\n${points.ldFinal.y}\n31\n${points.ldFinal.elevation}\n`;
            
            // Linha LD_FINAL para LD_INICIO
            dxfContent += '0\nLINE\n8\n0\n';
            dxfContent += `10\n${points.ldFinal.x}\n20\n${points.ldFinal.y}\n30\n${points.ldFinal.elevation}\n`;
            dxfContent += `11\n${points.ldInicio.x}\n21\n${points.ldInicio.y}\n31\n${points.ldInicio.elevation}\n`;
        }

        dxfContent += '0\nENDSEC\n';
        dxfContent += '0\nEOF\n';

        this.downloadFile(dxfContent, `${filename}.dxf`, 'application/dxf');
    }

    /**
     * Gera relatório HTML para impressão/PDF
     * @param {Object} data - Dados do relatório
     * @returns {string} HTML do relatório
     */
    static generateHTMLReport(data) {
        const totalProblems = (data.problems?.struct1?.total || 0) + 
                             (data.problems?.struct2?.total || 0) + 
                             (data.problems?.crossStructure?.total || 0);

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Análise de Inclinações</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; text-align: center; }
                h2 { color: #007bff; border-bottom: 1px solid #ddd; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f8f9fa; }
                .status-ok { color: #28a745; font-weight: bold; }
                .status-warning { color: #ffc107; font-weight: bold; }
                .status-error { color: #dc3545; font-weight: bold; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🌉 Relatório de Análise de Inclinações</h1>
                <p><strong>Tabuleiros de Ponte</strong></p>
                <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                ${data.struct1?.sirgasZone ? `<p>Sistema: SIRGAS 2000 / UTM Zona ${data.struct1.sirgasZone}S</p>` : ''}
            </div>

            <div class="section">
                <h2>📋 Resumo Executivo</h2>
                <p><strong>Status Geral:</strong> 
                <span class="${totalProblems > 0 ? 'status-error' : 'status-ok'}">
                    ${totalProblems > 0 ? 'NÃO CONFORME' : 'CONFORME'}
                </span></p>
                <p><strong>Total de Não Conformidades:</strong> ${totalProblems}</p>
            </div>

            ${data.struct1 ? `
            <div class="section">
                <h2>🏗️ Estrutura 1 - Análise Técnica</h2>
                <table>
                    <tr><th>Métrica</th><th>Valor</th><th>Unidade</th></tr>
                    <tr><td>Largura Média</td><td>${data.struct1.distances.mediaLargura.toFixed(3)}</td><td>m</td></tr>
                    <tr><td>Comprimento Médio</td><td>${data.struct1.distances.mediaComprimento.toFixed(3)}</td><td>m</td></tr>
                </table>

                <h3>Inclinações</h3>
                <table>
                    <tr><th>Tipo</th><th>Localização</th><th>Inclinação (%)</th><th>Status</th></tr>
                    <tr><td>Transversal</td><td>Início</td><td>${data.struct1.inclinations.transversalInicio.percentage.toFixed(2)}</td><td class="status-${data.struct1.status.transversalInicio.class.includes('good') ? 'ok' : data.struct1.status.transversalInicio.class.includes('critical') ? 'error' : 'warning'}">${data.struct1.status.transversalInicio.text}</td></tr>
                    <tr><td>Transversal</td><td>Final</td><td>${data.struct1.inclinations.transversalFinal.percentage.toFixed(2)}</td><td class="status-${data.struct1.status.transversalFinal.class.includes('good') ? 'ok' : data.struct1.status.transversalFinal.class.includes('critical') ? 'error' : 'warning'}">${data.struct1.status.transversalFinal.text}</td></tr>
                    <tr><td>Longitudinal</td><td>LD</td><td>${data.struct1.inclinations.longitudinalLD.percentage.toFixed(2)}</td><td class="status-${data.struct1.status.longitudinalLD.class.includes('good') ? 'ok' : data.struct1.status.longitudinalLD.class.includes('critical') ? 'error' : 'warning'}">${data.struct1.status.longitudinalLD.text}</td></tr>
                    <tr><td>Longitudinal</td><td>LE</td><td>${data.struct1.inclinations.longitudinalLE.percentage.toFixed(2)}</td><td class="status-${data.struct1.status.longitudinalLE.class.includes('good') ? 'ok' : data.struct1.status.longitudinalLE.class.includes('critical') ? 'error' : 'warning'}">${data.struct1.status.longitudinalLE.text}</td></tr>
                </table>
            </div>
            ` : ''}

            <div class="section">
                <h2>📐 Metodologia Aplicada</h2>
                <p><strong>Limites Técnicos:</strong></p>
                <ul>
                    <li>Inclinação Transversal: ≤ ${TECHNICAL_LIMITS.TRANSVERSAL}%</li>
                    <li>Inclinação Longitudinal: ≤ ${TECHNICAL_LIMITS.LONGITUDINAL}%</li>
                </ul>
                <p><strong>Cálculo de Largura:</strong> Distância transversal pura (sem diagonal)</p>
                <p><strong>Cálculo de Comprimento:</strong> Distância real entre pontos</p>
            </div>

            <hr style="margin-top: 30px;">
            <p style="text-align: center; color: #666; font-size: 12px;">
                Relatório gerado automaticamente pelo Sistema de Análise de Inclinações v2.0<br>
                Baseado em boas práticas da engenharia de pontes
            </p>
        </body>
        </html>
        `;
    }

    /**
     * Faz download de arquivo
     * @param {string} content - Conteúdo do arquivo
     * @param {string} filename - Nome do arquivo
     * @param {string} mimeType - Tipo MIME
     */
    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        window.URL.revokeObjectURL(url);
    }

    /**
     * Obtém formatos disponíveis
     * @returns {Array} Lista de formatos suportados
     */
    static getSupportedFormats() {
        return [
            { id: 'csv', name: 'CSV', description: 'Arquivo de valores separados por vírgula' },
            { id: 'json', name: 'JSON', description: 'Formato de dados JavaScript' },
            { id: 'xlsx', name: 'Excel', description: 'Planilha Microsoft Excel' },
            { id: 'pdf', name: 'PDF', description: 'Documento PDF (via impressão)' },
            { id: 'txt', name: 'Texto', description: 'Arquivo de texto simples' },
            { id: 'xml', name: 'XML', description: 'Documento XML estruturado' },
            { id: 'dxf', name: 'DXF', description: 'Formato AutoCAD (básico)' }
        ];
    }
}