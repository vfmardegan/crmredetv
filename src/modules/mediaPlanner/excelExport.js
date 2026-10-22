/**
 * Módulo de Exportação para Excel (.xlsx nativo via ExcelJS)
 * Gera planilhas modernas compatíveis com Microsoft Excel, Google Sheets, LibreOffice e Numbers,
 * contendo duas abas com formatação profissional, cores corporativas, linhas duplas e fórmulas reais.
 */

window.ExcelExporter = {
  colToLetter(col) {
    let letter = '';
    while (col > 0) {
      const mod = (col - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      col = Math.floor((col - mod) / 26);
    }
    return letter;
  },

  formatDateBr(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  },

  /**
   * Exporta a proposta completa para arquivo .xlsx nativo
   */
  async exportProposal(campaign, lines, totals) {
    if (window.ExcelJS) {
      await this.exportProposalXlsx(campaign, lines, totals);
    } else {
      console.warn('ExcelJS não encontrado, usando fallback XML...');
      this.exportProposalSpreadsheetXml(campaign, lines, totals);
    }
  },

  /**
   * Geração de XLSX nativo usando ExcelJS
   */
  async exportProposalXlsx(campaign, lines, totals) {
    const ExcelJS = window.ExcelJS;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema de Planejamento de Mídia • RedeTV!';
    wb.created = new Date();

    const dateRange = window.MediaCalculator.getDateRangeWithProgramFlags(
      campaign.startDate,
      campaign.endDate,
      null,
      campaign.hasPeriod,
      campaign.periodPreset
    );

    let vigenciaText = 'Período Livre';
    if (campaign.periodPreset) {
      const presetNames = {
        MENSAL: 'Mensal',
        TRIMESTRAL: 'Trimestral',
        SEMESTRAL: 'Semestral',
        ANUAL: 'Anual',
        LIVRE: 'Período Livre'
      };
      vigenciaText = presetNames[campaign.periodPreset] || campaign.periodPreset;
    } else if (campaign.hasPeriod && campaign.startDate && campaign.endDate) {
      vigenciaText = `${this.formatDateBr(campaign.startDate)} a ${this.formatDateBr(campaign.endDate)}`;
    }

    const subTitleText = `Tabela Vigente: ${campaign.tableVersionName || 'Oficial'} • Período: ${vigenciaText}`;

    // ==========================================
    // ABA 1: PROPOSTA COMERCIAL
    // ==========================================
    const ws1 = wb.addWorksheet('Proposta Comercial', {
      views: [{ showGridLines: true }]
    });

    ws1.columns = [
      { width: 6 },   // 1: Item
      { width: 26 },  // 2: Programa
      { width: 14 },  // 3: Código / Sigla
      { width: 16 },  // 4: Gênero
      { width: 18 },  // 5: Faixa/Dias
      { width: 20 },  // 6: Praça
      { width: 16 },  // 7: Formato
      { width: 15 },  // 8: Base 30"
      { width: 10 },  // 9: Coef.
      { width: 16 },  // 10: Tabela Unit.
      { width: 12 },  // 11: Desc. %
      { width: 16 },  // 12: Líquido Unit.
      { width: 12 },  // 13: Inserções
      { width: 18 },  // 14: Total Bruto
      { width: 18 }   // 15: Total Líquido
    ];

    // Título Principal
    const r1 = ws1.getRow(1);
    r1.height = 28;
    r1.getCell(1).value = 'REDETV! • PLANO DE MÍDIA';
    r1.getCell(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF0F172A' } };
    r1.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    ws1.mergeCells(1, 1, 1, 15);

    // Subtítulo
    const r2 = ws1.getRow(2);
    r2.height = 20;
    r2.getCell(1).value = subTitleText;
    r2.getCell(1).font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF64748B' } };
    r2.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    ws1.mergeCells(2, 1, 2, 15);

    // Linha vazia
    ws1.getRow(3).height = 10;

    // Metadados Linha 1 (CLIENTE / AGÊNCIA)
    const r4 = ws1.getRow(4);
    r4.height = 22;
    r4.getCell(1).value = 'CLIENTE:';
    ws1.mergeCells(4, 1, 4, 2);
    r4.getCell(3).value = campaign.client || 'Não Informado';
    ws1.mergeCells(4, 3, 4, 8);
    r4.getCell(9).value = 'AGÊNCIA:';
    ws1.mergeCells(4, 9, 4, 10);
    r4.getCell(11).value = campaign.agency || 'Venda Direta';
    ws1.mergeCells(4, 11, 4, 15);

    // Metadados Linha 2 (NOME DO PROJETO / PERÍODO)
    const r5 = ws1.getRow(5);
    r5.height = 22;
    r5.getCell(1).value = 'NOME DO PROJETO:';
    ws1.mergeCells(5, 1, 5, 2);
    r5.getCell(3).value = campaign.projectName || campaign.title || 'Projeto de Mídia';
    ws1.mergeCells(5, 3, 5, 8);
    r5.getCell(9).value = 'PERÍODO:';
    ws1.mergeCells(5, 9, 5, 10);
    r5.getCell(11).value = vigenciaText;
    ws1.mergeCells(5, 11, 5, 15);

    // Estilização dos blocos de metadados
    [r4, r5].forEach(row => {
      for (let c = 1; c <= 15; c++) {
        const cell = row.getCell(c);
        const isLabel = (c >= 1 && c <= 2) || (c >= 9 && c <= 10);
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: isLabel,
          color: { argb: isLabel ? 'FF475569' : 'FF0F172A' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isLabel ? 'FFF1F5F9' : 'FFFFFFFF' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      }
    });

    // Linha vazia
    ws1.getRow(6).height = 14;

    // Cabeçalho da Tabela
    const r7 = ws1.getRow(7);
    r7.height = 28;
    const headers = [
      'Item', 'Programa', 'Código / Sigla', 'Gênero', 'Faixa / Dias', 'Praça', 'Formato',
      'Base 30"', 'Coef.', 'Tabela Unit.', 'Desc. (%)', 'Líquido Unit.',
      'Inserções', 'Total Bruto', 'Total Líquido'
    ];
    headers.forEach((h, idx) => {
      const cell = r7.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'thin', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FF0F172A' } }
      };
    });

    // Linhas de Dados
    const startDataRow = 8;
    lines.forEach((line, idx) => {
      const rowIdx = startDataRow + idx;
      const row = ws1.getRow(rowIdx);
      row.height = 22;

      const prog = window.MediaCalculator.getProgram(line.sigla);
      const market = window.MediaCalculator.getMarket(line.marketId);
      const progName = line.isCustomProduct ? (line.customProductName || 'Projeto Especial') : (prog?.nome || line.sigla);
      const progSigla = line.sigla || (line.isCustomProduct ? 'ESP' : '-');
      const marketName = market?.nome || line.marketId;
      const generoName = line.isCustomProduct ? 'PROJETO ESPECIAL' : (prog?.genero || '-');
      const faixaDias = line.isCustomProduct ? '-' : `${prog?.diasDesc || ''} ${prog?.inicio || ''}`.trim();

      const fmt = window.MediaCalculator.getFormat(line.formatId);
      const formatLabel = fmt ? fmt.nome : (line.formatId || 'COMERCIAL 30"');

      const base30 = line.calculo?.basePrice30 || 0;
      const coef = Number(line.calculo?.coef || 1.0);
      const isCustomCoef = !!line.calculo?.isCustomCoef;
      const unitTable = line.calculo?.unitPrice || 0;
      const descRate = (line.discountPercent || 0) / 100;
      const unitNet = line.calculo?.unitarioLiquido || 0;
      const insCount = line.calculo?.totalInsertions || 0;
      const totBruto = line.calculo?.totalBruto || 0;
      const totLiquido = line.calculo?.totalLiquido || 0;

      row.getCell(1).value = idx + 1;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(2).value = progName;
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(3).value = progSigla;
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(4).value = generoName;
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(5).value = faixaDias;
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(6).value = marketName;
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(7).value = formatLabel;
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(8).value = base30;
      row.getCell(8).numFmt = '"R$" #,##0';
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(9).value = coef;
      row.getCell(9).numFmt = '0.00';
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(10).value = { formula: `H${rowIdx}*I${rowIdx}`, result: unitTable };
      row.getCell(10).numFmt = '"R$" #,##0';
      row.getCell(10).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(11).value = descRate;
      row.getCell(11).numFmt = '0.00%';
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(12).value = { formula: `J${rowIdx}*(1-K${rowIdx})`, result: unitNet };
      row.getCell(12).numFmt = '"R$" #,##0';
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(13).value = insCount;
      row.getCell(13).numFmt = '#,##0';
      row.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(14).value = { formula: `J${rowIdx}*M${rowIdx}`, result: totBruto };
      row.getCell(14).numFmt = '"R$" #,##0';
      row.getCell(14).alignment = { vertical: 'middle', horizontal: 'right' };

      row.getCell(15).value = { formula: `L${rowIdx}*M${rowIdx}`, result: totLiquido };
      row.getCell(15).numFmt = '"R$" #,##0';
      row.getCell(15).alignment = { vertical: 'middle', horizontal: 'right' };

      for (let c = 1; c <= 15; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }

      if (isCustomCoef) {
        row.getCell(9).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFEF4444' } };
        row.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
        row.getCell(9).border = {
          top: { style: 'thin', color: { argb: 'FFFCA5A5' } },
          bottom: { style: 'thin', color: { argb: 'FFFCA5A5' } },
          left: { style: 'thin', color: { argb: 'FFFCA5A5' } },
          right: { style: 'thin', color: { argb: 'FFFCA5A5' } }
        };
      }
    });

    const totRowIdx = startDataRow + lines.length;
    const rTot = ws1.getRow(totRowIdx);
    rTot.height = 24;

    rTot.getCell(1).value = 'TOTAIS DA PROPOSTA:';
    ws1.mergeCells(totRowIdx, 1, totRowIdx, 12);

    const firstData = lines.length > 0 ? startDataRow : totRowIdx;
    const lastData = lines.length > 0 ? (totRowIdx - 1) : totRowIdx;

    rTot.getCell(13).value = lines.length > 0 ? { formula: `SUM(M${firstData}:M${lastData})`, result: totals.totalInsercoes } : totals.totalInsercoes;
    rTot.getCell(13).numFmt = '#,##0';

    rTot.getCell(14).value = lines.length > 0 ? { formula: `SUM(N${firstData}:N${lastData})`, result: totals.totalBruto } : totals.totalBruto;
    rTot.getCell(14).numFmt = '"R$" #,##0';

    rTot.getCell(15).value = lines.length > 0 ? { formula: `SUM(O${firstData}:O${lastData})`, result: totals.totalLiquido } : totals.totalLiquido;
    rTot.getCell(15).numFmt = '"R$" #,##0';

    for (let c = 1; c <= 15; c++) {
      const cell = rTot.getCell(c);
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } }
      };
      if (c <= 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (c === 13) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    }

    // Linha de espaçamento
    ws1.getRow(totRowIdx + 1).height = 14;

    // ==========================================
    // RESUMO COMERCIAL (Linhas Duplas Contínuas)
    // ==========================================
    const descRowIdx = totRowIdx + 2;
    const rDesc = ws1.getRow(descRowIdx);
    rDesc.height = 22;
    rDesc.getCell(1).value = 'DESCONTO MÉDIO:';
    ws1.mergeCells(descRowIdx, 1, descRowIdx, 12);

    rDesc.getCell(13).value = {
      formula: `=(N${totRowIdx}-O${totRowIdx})/N${totRowIdx}`,
      result: (totals.descontoMedioPercent || 0) / 100
    };
    rDesc.getCell(13).numFmt = '0.00%';
    ws1.mergeCells(descRowIdx, 13, descRowIdx, 15);

    for (let c = 1; c <= 15; c++) {
      const cell = rDesc.getCell(c);
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.alignment = { vertical: 'middle', horizontal: c <= 12 ? 'right' : 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        left: (c === 1 || c === 13) ? { style: 'thin', color: { argb: 'FFCBD5E1' } } : undefined,
        right: (c === 12 || c === 15) ? { style: 'thin', color: { argb: 'FFCBD5E1' } } : undefined
      };
    }

    const impRowIdx = totRowIdx + 3;
    const rImp = ws1.getRow(impRowIdx);
    rImp.height = 22;
    rImp.getCell(1).value = 'IMPACTOS ESTIMADOS:';
    ws1.mergeCells(impRowIdx, 1, impRowIdx, 12);

    rImp.getCell(13).value = totals.totalImpactosEstimados || 0;
    rImp.getCell(13).numFmt = '#,##0';
    ws1.mergeCells(impRowIdx, 13, impRowIdx, 15);

    for (let c = 1; c <= 15; c++) {
      const cell = rImp.getCell(c);
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.alignment = { vertical: 'middle', horizontal: c <= 12 ? 'right' : 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: (c === 1 || c === 13) ? { style: 'thin', color: { argb: 'FFCBD5E1' } } : undefined,
        right: (c === 12 || c === 15) ? { style: 'thin', color: { argb: 'FFCBD5E1' } } : undefined
      };
    }

    const cpmRowIdx = totRowIdx + 4;
    const rCpm = ws1.getRow(cpmRowIdx);
    rCpm.height = 22;
    rCpm.getCell(1).value = 'CPM MÉDIO NEGOCIADO:';
    ws1.mergeCells(cpmRowIdx, 1, cpmRowIdx, 12);

    rCpm.getCell(13).value = {
      formula: `=IF(M${impRowIdx}>0,(O${totRowIdx}/M${impRowIdx})*1000,0)`,
      result: Number(totals.cpmMedio || 0)
    };
    rCpm.getCell(13).numFmt = '"R$" #,##0.00';
    ws1.mergeCells(cpmRowIdx, 13, cpmRowIdx, 15);

    for (let c = 1; c <= 15; c++) {
      const cell = rCpm.getCell(c);
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.alignment = { vertical: 'middle', horizontal: c <= 12 ? 'right' : 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        left: (c === 1 || c === 13) ? { style: 'thin', color: { argb: 'FFCBD5E1' } } : undefined,
        right: (c === 12 || c === 15) ? { style: 'thin', color: { argb: 'FFCBD5E1' } } : undefined
      };
    }

    // ==========================================
    // ABA 2: MAPA DE VEICULAÇÃO (CRONOGRAMA)
    // ==========================================
    const ws2 = wb.addWorksheet('Mapa de Veiculação', {
      views: [{ showGridLines: true }]
    });

    const numDays = dateRange.length;
    const totalColsAba2 = 5 + numDays + 1;

    const colWidthsAba2 = [
      { width: 6 },   // 1: #
      { width: 26 },  // 2: Programa
      { width: 14 },  // 3: Código / Sigla
      { width: 18 },  // 4: Praça
      { width: 16 }   // 5: Formato
    ];
    for (let i = 0; i < numDays; i++) {
      colWidthsAba2.push({ width: 5 });
    }
    colWidthsAba2.push({ width: 10 }); // Total
    ws2.columns = colWidthsAba2;

    // Título do Calendário
    const rc1 = ws2.getRow(1);
    rc1.height = 28;
    rc1.getCell(1).value = `MAPA DE VEICULAÇÃO • ${vigenciaText}`;
    rc1.getCell(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF0F172A' } };
    rc1.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    ws2.mergeCells(1, 1, 1, totalColsAba2);

    ws2.getRow(2).height = 10;

    // Cabeçalho dos dias
    const rc3 = ws2.getRow(3);
    rc3.height = 26;
    rc3.getCell(1).value = '#';
    rc3.getCell(2).value = 'Programa';
    rc3.getCell(3).value = 'Código / Sigla';
    rc3.getCell(4).value = 'Praça';
    rc3.getCell(5).value = 'Formato';

    dateRange.forEach((d, i) => {
      rc3.getCell(6 + i).value = d.formatted;
    });
    rc3.getCell(6 + numDays).value = 'TOTAL';

    for (let c = 1; c <= totalColsAba2; c++) {
      const cell = rc3.getCell(c);
      cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'thin', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FF0F172A' } }
      };
    }

    // Linhas de dados do Mapa
    const calStartRow = 4;
    lines.forEach((line, idx) => {
      const rowIdx = calStartRow + idx;
      const row = ws2.getRow(rowIdx);
      row.height = 20;

      const prog = window.MediaCalculator.getProgram(line.sigla);
      const market = window.MediaCalculator.getMarket(line.marketId);
      const progName = line.isCustomProduct ? (line.customProductName || 'Produto Avulso') : (prog?.nome || line.sigla);
      const progSigla = line.sigla || (line.isCustomProduct ? 'ESP' : '-');
      const marketName = line.isCustomMarket ? (line.customMarketName || 'Personalizado') : (market?.nome || line.marketId);

      const fmt = window.MediaCalculator.getFormat(line.formatId);
      const formatLabel = fmt ? fmt.nome : (line.formatId || 'COMERCIAL 30"');
      const cal = line.calendarData || {};

      row.getCell(1).value = idx + 1;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(2).value = progName;
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(3).value = progSigla;
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(4).value = marketName;
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(5).value = formatLabel;
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };

      dateRange.forEach((d, i) => {
        const count = cal[d.key] || cal[d.day] || 0;
        const cell = row.getCell(6 + i);
        if (count > 0) {
          cell.value = count;
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFE11D48' } };
        } else {
          cell.value = '-';
          cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' } };
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center' };

        if (!d.isBusinessDay && count === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });

      const totalColIdx = 6 + numDays;
      if (numDays > 0) {
        const firstDayLetter = this.colToLetter(6);
        const lastDayLetter = this.colToLetter(5 + numDays);
        row.getCell(totalColIdx).value = {
          formula: `SUM(${firstDayLetter}${rowIdx}:${lastDayLetter}${rowIdx})`,
          result: line.calculo?.totalInsertions || 0
        };
      } else {
        row.getCell(totalColIdx).value = line.calculo?.totalInsertions || 0;
      }
      row.getCell(totalColIdx).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      row.getCell(totalColIdx).alignment = { vertical: 'middle', horizontal: 'center' };

      for (let c = 1; c <= totalColsAba2; c++) {
        const cell = row.getCell(c);
        if (!cell.font) cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF1E293B' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }
    });

    // Linha de Totais do Mapa
    const calTotRowIdx = calStartRow + lines.length;
    const rCalTot = ws2.getRow(calTotRowIdx);
    rCalTot.height = 22;

    rCalTot.getCell(1).value = 'TOTAL DE INSERÇÕES / DIA:';
    ws2.mergeCells(calTotRowIdx, 1, calTotRowIdx, 5);

    const firstCalRow = lines.length > 0 ? calStartRow : calTotRowIdx;
    const lastCalRow = lines.length > 0 ? (calTotRowIdx - 1) : calTotRowIdx;

    dateRange.forEach((d, i) => {
      const colIdx = 6 + i;
      const colLetter = this.colToLetter(colIdx);
      const cell = rCalTot.getCell(colIdx);
      if (lines.length > 0) {
        cell.value = { formula: `SUM(${colLetter}${firstCalRow}:${colLetter}${lastCalRow})` };
      } else {
        cell.value = 0;
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const totColIdx = 6 + numDays;
    const totColLetter = this.colToLetter(totColIdx);
    const cellGrandTot = rCalTot.getCell(totColIdx);
    if (lines.length > 0) {
      cellGrandTot.value = {
        formula: `SUM(${totColLetter}${firstCalRow}:${totColLetter}${lastCalRow})`,
        result: totals.totalInsercoes
      };
    } else {
      cellGrandTot.value = totals.totalInsercoes;
    }
    cellGrandTot.alignment = { vertical: 'middle', horizontal: 'center' };

    for (let c = 1; c <= totalColsAba2; c++) {
      const cell = rCalTot.getCell(c);
      cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } }
      };
      if (c <= 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    }

    // Gravação e download do arquivo .xlsx
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);

    const sanitizedClient = (campaign.client || 'Proposta').replace(/[^a-zA-Z0-9_-]/g, '_');
    const periodLabel = campaign.hasPeriod ? `${campaign.startDate}_a_${campaign.endDate}` : 'Sem_Periodo';
    const filename = `Plano_Midia_RedeTV_${sanitizedClient}_${periodLabel}.xlsx`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Fallback: SpreadsheetML (.xls) caso ExcelJS não esteja disponível
   */
  exportProposalSpreadsheetXml(campaign, lines, totals) {
    const xmlContent = this.generateSpreadsheetXML(campaign, lines, totals);
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const sanitizedClient = (campaign.client || 'Proposta').replace(/[^a-zA-Z0-9_-]/g, '_');
    const periodLabel = campaign.hasPeriod ? `${campaign.startDate}_a_${campaign.endDate}` : 'Sem_Periodo';
    const filename = `Plano_Midia_RedeTV_${sanitizedClient}_${periodLabel}.xls`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  escapeXml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  generateSpreadsheetXML(campaign, lines, totals) {
    const dateRange = window.MediaCalculator.getDateRangeWithProgramFlags(
      campaign.startDate,
      campaign.endDate,
      null,
      campaign.hasPeriod,
      campaign.periodPreset
    );

    let vigenciaText = 'Período Livre';
    if (campaign.periodPreset) {
      const presetNames = {
        MENSAL: 'Mensal',
        TRIMESTRAL: 'Trimestral',
        SEMESTRAL: 'Semestral',
        ANUAL: 'Anual',
        LIVRE: 'Período Livre'
      };
      vigenciaText = presetNames[campaign.periodPreset] || campaign.periodPreset;
    } else if (campaign.hasPeriod && campaign.startDate && campaign.endDate) {
      vigenciaText = `${this.formatDateBr(campaign.startDate)} a ${this.formatDateBr(campaign.endDate)}`;
    }

    const subTitleText = `Tabela Vigente: ${this.escapeXml(campaign.tableVersionName)} • Período: ${vigenciaText}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Plano de Mídia RedeTV!</Title>
  <Author>Sistema de Valoração Automática</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>

 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="Subtitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#475569"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="MetaValue">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="&quot;R$&quot;\ #,##0"/>
  </Style>
  <Style ss:ID="CellPercent">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="0.0%"/>
  </Style>
  <Style ss:ID="CellNumber">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="CellCoef">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="0.00"/>
  </Style>
  <Style ss:ID="CellCoefCustom">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FCA5A5"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#EF4444"/>
   <Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="0.00"/>
  </Style>
  <Style ss:ID="TotalLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;R$&quot;\ #,##0"/>
  </Style>
  <Style ss:ID="TotalNumber">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="TotalPercent">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="0.00%"/>
  </Style>
  <Style ss:ID="TotalNumberCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="TotalCurrencyDecimalCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;R$&quot;\ #,##0.00"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Proposta Comercial">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="40"/>
   <Column ss:Width="160"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="130"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="65"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="70"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>

   <Row ss:Height="26">
    <Cell ss:MergeAcross="14" ss:StyleID="Title"><Data ss:Type="String">REDETV! • PLANO DE MÍDIA</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="14" ss:StyleID="Subtitle"><Data ss:Type="String">${subTitleText}</Data></Cell>
   </Row>
   <Row ss:Height="10"/>

   <Row ss:Height="22">
    <Cell ss:MergeAcross="1" ss:StyleID="MetaLabel"><Data ss:Type="String">CLIENTE:</Data></Cell>
    <Cell ss:MergeAcross="5" ss:StyleID="MetaValue"><Data ss:Type="String">${this.escapeXml(campaign.client || 'Não Informado')}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaLabel"><Data ss:Type="String">AGÊNCIA:</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="MetaValue"><Data ss:Type="String">${this.escapeXml(campaign.agency || 'Venda Direta')}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="1" ss:StyleID="MetaLabel"><Data ss:Type="String">NOME DO PROJETO:</Data></Cell>
    <Cell ss:MergeAcross="5" ss:StyleID="MetaValue"><Data ss:Type="String">${this.escapeXml(campaign.projectName || campaign.title || 'Projeto de Mídia')}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaLabel"><Data ss:Type="String">PERÍODO:</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="MetaValue"><Data ss:Type="String">${this.escapeXml(vigenciaText)}</Data></Cell>
   </Row>
   <Row ss:Height="14"/>

   <Row ss:Height="25">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Item</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Programa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Código / Sigla</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Gênero</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Faixa / Dias</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Praça</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Formato</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Base 30"</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Coef.</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tabela Unit.</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Desc. (%)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Líquido Unit.</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Inserções</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Bruto</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Líquido</Data></Cell>
   </Row>

   ${lines.map((line, idx) => {
     const prog = window.MediaCalculator.getProgram(line.sigla);
     const market = window.MediaCalculator.getMarket(line.marketId);
     const progName = line.isCustomProduct ? (line.customProductName || 'Projeto Especial') : (prog?.nome || line.sigla);
     const progSigla = line.sigla || (line.isCustomProduct ? 'ESP' : '-');
     const marketName = market?.nome || line.marketId;
     const generoName = line.isCustomProduct ? 'PROJETO ESPECIAL' : (prog?.genero || '-');
     const faixaDias = line.isCustomProduct ? '-' : `${prog?.diasDesc || ''} ${prog?.inicio || ''}`.trim();

     const fmt = window.MediaCalculator.getFormat(line.formatId);
     const formatLabel = fmt ? fmt.nome : (line.formatId || 'COMERCIAL 30"');

     const base30 = line.calculo?.basePrice30 || 0;
     const coef = Number(line.calculo?.coef || 1.0);
     const isCustomCoef = !!line.calculo?.isCustomCoef;
     const unitTable = line.calculo?.unitPrice || 0;
     const descRate = (line.discountPercent || 0) / 100;
     const unitNet = line.calculo?.unitarioLiquido || 0;
     const insCount = line.calculo?.totalInsertions || 0;

     return `
   <Row ss:Height="22">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${this.escapeXml(progName)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${this.escapeXml(progSigla)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${this.escapeXml(generoName)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${this.escapeXml(faixaDias)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${this.escapeXml(marketName)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${this.escapeXml(formatLabel)}</Data></Cell>
    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">${base30}</Data></Cell>
    <Cell ss:StyleID="${isCustomCoef ? 'CellCoefCustom' : 'CellCoef'}"><Data ss:Type="Number">${coef}</Data></Cell>
    <Cell ss:StyleID="CellCurrency" ss:Formula="=RC[-2]*RC[-1]"><Data ss:Type="Number">${unitTable}</Data></Cell>
    <Cell ss:StyleID="CellPercent"><Data ss:Type="Number">${descRate}</Data></Cell>
    <Cell ss:StyleID="CellCurrency" ss:Formula="=RC[-2]*(1-RC[-1])"><Data ss:Type="Number">${unitNet}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${insCount}</Data></Cell>
    <Cell ss:StyleID="CellCurrency" ss:Formula="=RC[-4]*RC[-1]"><Data ss:Type="Number">${line.calculo?.totalBruto || 0}</Data></Cell>
    <Cell ss:StyleID="CellCurrency" ss:Formula="=RC[-3]*RC[-2]"><Data ss:Type="Number">${line.calculo?.totalLiquido || 0}</Data></Cell>
   </Row>`;
   }).join('')}

   <Row ss:Height="24">
    <Cell ss:MergeAcross="11" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAIS DA PROPOSTA:</Data></Cell>
    <Cell ss:StyleID="TotalNumber" ss:Formula="=SUM(R[-${lines.length}]C:R[-1]C)"><Data ss:Type="Number">${totals.totalInsercoes}</Data></Cell>
    <Cell ss:StyleID="TotalCurrency" ss:Formula="=SUM(R[-${lines.length}]C:R[-1]C)"><Data ss:Type="Number">${totals.totalBruto}</Data></Cell>
    <Cell ss:StyleID="TotalCurrency" ss:Formula="=SUM(R[-${lines.length}]C:R[-1]C)"><Data ss:Type="Number">${totals.totalLiquido}</Data></Cell>
   </Row>

   <Row ss:Height="14"/>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="11" ss:StyleID="TotalLabel"><Data ss:Type="String">DESCONTO MÉDIO:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="TotalPercent" ss:Formula="=(R[-2]C[1]-R[-2]C[2])/R[-2]C[1]"><Data ss:Type="Number">${(totals.descontoMedioPercent / 100).toFixed(4)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="11" ss:StyleID="TotalLabel"><Data ss:Type="String">IMPACTOS ESTIMADOS:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="TotalNumberCenter"><Data ss:Type="Number">${totals.totalImpactosEstimados || 0}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="11" ss:StyleID="TotalLabel"><Data ss:Type="String">CPM MÉDIO NEGOCIADO:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="TotalCurrencyDecimalCenter" ss:Formula="=IF(R[-1]C&gt;0,(R[-4]C[2]/R[-1]C)*1000,0)"><Data ss:Type="Number">${Number(totals.cpmMedio || 0).toFixed(2)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Mapa de Veiculação">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="40"/>
   <Column ss:Width="160"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="70"/>
   ${dateRange.map(() => '<Column ss:Width="30"/>').join('\n   ')}
   <Column ss:Width="65"/>

   <Row ss:Height="25">
    <Cell ss:MergeAcross="${5 + dateRange.length - 1}" ss:StyleID="Title"><Data ss:Type="String">MAPA DE VEICULAÇÃO • ${this.escapeXml(vigenciaText)}</Data></Cell>
   </Row>
   <Row ss:Height="10"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Programa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Código / Sigla</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Praça</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Formato</Data></Cell>
    ${dateRange.map(d => `<Cell ss:StyleID="Header"><Data ss:Type="String">${d.formatted}</Data></Cell>`).join('\n    ')}
    <Cell ss:StyleID="Header"><Data ss:Type="String">TOTAL</Data></Cell>
   </Row>

   ${lines.map((line, idx) => {
     const prog = window.MediaCalculator.getProgram(line.sigla);
     const market = window.MediaCalculator.getMarket(line.marketId);
     const progName = line.isCustomProduct ? (line.customProductName || 'Produto Avulso') : (prog?.nome || line.sigla);
     const progSigla = line.sigla || (line.isCustomProduct ? 'ESP' : '-');
     const marketName = line.isCustomMarket ? (line.customMarketName || 'Personalizado') : (market?.nome || line.marketId);

     const fmt = window.MediaCalculator.getFormat(line.formatId);
     const formatLabel = fmt ? fmt.nome : (line.formatId || 'COMERCIAL 30"');
     const cal = line.calendarData || {};

     return `
   <Row ss:Height="20">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${this.escapeXml(progName)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${this.escapeXml(progSigla)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${this.escapeXml(marketName)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${this.escapeXml(formatLabel)}</Data></Cell>
    ${dateRange.map(d => {
      const count = cal[d.key] || cal[d.day] || 0;
      return `<Cell ss:StyleID="CellNumber"><Data ss:Type="${count > 0 ? 'Number' : 'String'}">${count > 0 ? count : '-'}</Data></Cell>`;
    }).join('\n    ')}
    <Cell ss:StyleID="TotalNumber" ss:Formula="=SUM(RC[-${dateRange.length}]:RC[-1])"><Data ss:Type="Number">${line.calculo?.totalInsertions || 0}</Data></Cell>
   </Row>`;
   }).join('')}

   <Row ss:Height="22">
    <Cell ss:MergeAcross="4" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL INSERÇÕES POR DIA:</Data></Cell>
    ${dateRange.map(() => `<Cell ss:StyleID="TotalNumber" ss:Formula="=SUM(R[-${lines.length}]C:R[-1]C)"/>`).join('\n    ')}
    <Cell ss:StyleID="TotalNumber" ss:Formula="=SUM(R[-${lines.length}]C:R[-1]C)"><Data ss:Type="Number">${totals.totalInsercoes}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;
  }
};
