import "./rateCard";
import { PROGRAMS_DATA, REGIONAL_MARKETS, MEDIA_FORMATS } from "./rateCard";

/**
 * Motor de Cálculo para Planejamento de Mídia RedeTV!
 * Trata coeficientes, praças, branded studio, modos de inserção e totais financeiros.
 */

if (typeof window !== 'undefined') {
  if (!window.PROGRAMS_DATA) window.PROGRAMS_DATA = PROGRAMS_DATA;
  if (!window.REGIONAL_MARKETS) window.REGIONAL_MARKETS = REGIONAL_MARKETS;
  if (!window.MEDIA_FORMATS) window.MEDIA_FORMATS = MEDIA_FORMATS;
}

window.MediaCalculator = {
  /**
   * Obtém os dados completos de um programa pela sigla
   */
  getProgram(sigla) {
    return window.PROGRAMS_DATA.find(p => p.sigla === sigla) || null;
  },

  /**
   * Obtém os dados de uma praça pelo id
   */
  getMarket(marketId) {
    return window.REGIONAL_MARKETS.find(m => m.id === marketId) || null;
  },

  /**
   * Obtém os dados completos de um formato pelo id ou nome
   */
  getFormat(formatIdOrName) {
    if (!formatIdOrName) return null;
    const clean = String(formatIdOrName).trim().toLowerCase();
    return (window.MEDIA_FORMATS || []).find(f => 
      f.id.toLowerCase() === clean || 
      f.nome.toLowerCase() === clean
    ) || null;
  },

  /**
   * Verifica se o formato é permitido para o programa consultando a matriz salva ou regras padrão
   */
  isFormatAllowed(sigla, formatId) {
    if (!sigla || !formatId) return true;
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('redetv_program_allowed_formats') : null;
      if (saved) {
        const matrix = JSON.parse(saved);
        if (matrix && matrix[sigla] && matrix[sigla][formatId] !== undefined) {
          return Boolean(matrix[sigla][formatId]);
        }
      }
    } catch (e) {}

    const program = this.getProgram(sigla);
    if (!program) return true;

    // Regras padrão oficiais
    if (program.genero === 'ROTATIVO') {
      if (formatId.startsWith('ACAO_') || formatId.startsWith('MERCHAN') || formatId.startsWith('VHT_') || formatId.startsWith('TOP_') || formatId.startsWith('ASSINATURA')) {
        return false;
      }
    } else {
      const isBrandedAvailable = program.branded && program.branded.disponivel !== false;
      if (!isBrandedAvailable && (formatId.startsWith('ACAO_') || formatId.startsWith('MERCHANDISING'))) {
        return false;
      }
    }
    return true;
  },

  /**
   * Obtém o coeficiente padrão oficial conforme o formato e programa
   */
  getDefaultCoef(sigla, formatIdOrType, formatDuration) {
    const fmt = this.getFormat(formatIdOrType);
    if (fmt) {
      const program = this.getProgram(sigla);
      if (formatIdOrType === 'COMERCIAL_15' && program?.coef15) return program.coef15;
      if (formatIdOrType === 'COMERCIAL_10' && program?.coef10) return program.coef10;
      return fmt.defaultCoef;
    }

    if (formatIdOrType === 'BRANDED' || formatIdOrType === 'TESTEMUNHAL') {
      return formatDuration === 90 ? 3.00 : 2.00;
    }
    const program = this.getProgram(sigla);
    if (formatDuration === 5) return 0.50;
    if (formatDuration === 10) return program?.coef10 || 0.50;
    if (formatDuration === 15) return program?.coef15 || 0.75;
    if (formatDuration === 30) return 1.00;
    if (formatDuration === 45) return 1.50;
    if (formatDuration === 60) return 2.00;
    if (formatDuration === 90) return 3.00;
    if (formatDuration === 120) return 4.00;
    return Number(((formatDuration || 30) / 30).toFixed(2));
  },

  /**
   * Calcula o preço unitário de tabela para uma combinação de programa, praça e formato
   * Retorna { valor, unitPrice, disponivel, motivo, coef, defaultCoef, isCustomCoef, basePrice30 }
   */
  calculateUnitPrice(sigla, marketId, formatId = '', brandedVariant = 'inedito', customUnitPrice = 0, isCustom = false, customCoef = null, isCustomFormat = false) {
    if (!sigla && !isCustom) {
      return { valor: 0, unitPrice: 0, disponivel: true, motivo: '', coef: null, defaultCoef: null, isCustomCoef: false, basePrice30: 0 };
    }

    if (isCustom) {
      const basePrice30 = Math.max(0, parseInt(customUnitPrice, 10) || 0);
      const fmt = this.getFormat(formatId);
      const defaultCoef = fmt ? fmt.defaultCoef : null;
      const hasCustomCoef = (customCoef !== null && customCoef !== undefined && customCoef !== '' && !isNaN(customCoef));
      const coef = hasCustomCoef ? parseFloat(customCoef) : defaultCoef;
      const valor = (coef !== null && coef !== undefined) ? Math.round(basePrice30 * coef) : 0;
      return {
        valor,
        unitPrice: valor,
        disponivel: true,
        motivo: '',
        coef,
        defaultCoef,
        isCustomCoef: defaultCoef !== null ? Math.abs(coef - defaultCoef) > 0.0001 : hasCustomCoef,
        basePrice30
      };
    }

    const program = this.getProgram(sigla);
    if (!program) {
      return { valor: 0, unitPrice: 0, disponivel: false, motivo: 'Produto não tabelado', coef: null, defaultCoef: null, isCustomCoef: false, basePrice30: 0 };
    }

    // 1. Obter o valor Base de 30" na praça
    let basePrice30 = 0;
    if (!marketId) {
      return {
        valor: 0,
        unitPrice: 0,
        disponivel: true,
        motivo: '',
        coef: null,
        defaultCoef: null,
        isCustomCoef: false,
        basePrice30: 0
      };
    }
    if (marketId === 'NACIONAL') {
      basePrice30 = program.nacional30;
    } else if (marketId === 'SAT') {
      basePrice30 = program.sat30;
    } else {
      const regPrice = program.regional30?.[marketId];
      if (regPrice === null || regPrice === undefined) {
        return {
          valor: 0,
          unitPrice: 0,
          disponivel: false,
          motivo: `Não exibido na praça selecionada (${this.getMarket(marketId)?.nome || marketId})`,
          coef: null,
          defaultCoef: null,
          isCustomCoef: false,
          basePrice30: 0
        };
      }
      basePrice30 = regPrice;
    }

    // 2. Determinar o Coeficiente conforme o Formato
    const fmt = this.getFormat(formatId);
    const isCustomFmt = isCustomFormat || formatId === 'CUSTOM' || (!fmt && formatId !== '');
    let defaultCoef = null;

    if (fmt && !isCustomFormat && formatId !== 'CUSTOM') {
      if (!this.isFormatAllowed(sigla, fmt.id)) {
        return {
          valor: 0,
          unitPrice: 0,
          disponivel: false,
          motivo: 'Formato Inválido',
          coef: null,
          defaultCoef: null,
          isCustomCoef: false,
          basePrice30
        };
      }
      defaultCoef = this.getDefaultCoef(sigla, fmt.id);
    }

    // 3. Aplicar Coeficiente Ativo (Padrão ou Customizado)
    const hasCustomCoef = (customCoef !== null && customCoef !== undefined && customCoef !== '' && !isNaN(customCoef));
    let coef = null;
    let isCustomCoefFlag = false;

    if (hasCustomCoef) {
      coef = parseFloat(customCoef);
      isCustomCoefFlag = (defaultCoef !== null) ? (Math.abs(coef - defaultCoef) > 0.0001) : true;
    } else if (defaultCoef !== null) {
      coef = defaultCoef;
      isCustomCoefFlag = false;
    } else {
      // Formato customizado ou não preenchido: não traz coeficiente
      coef = null;
      isCustomCoefFlag = false;
    }

    // 4. Calcular Valor Unitário: Base 30" × Coeficiente
    const valorUnitario = (coef !== null && coef !== undefined) ? Math.round(basePrice30 * coef) : 0;

    return {
      valor: valorUnitario,
      unitPrice: valorUnitario,
      disponivel: true,
      motivo: '',
      coef,
      defaultCoef,
      isCustomCoef: isCustomCoefFlag,
      basePrice30
    };
  },

  /**
   * Calcula o total de inserções de uma linha conforme o modo ativo
   */
  calculateTotalInsertions(mode, config, calendarData) {
    if (mode === 'TOTAL') {
      return Math.max(0, parseInt(config.total || 0, 10));
    }

    if (mode === 'FREQ') {
      const dias = Math.max(0, parseInt(config.dias || 0, 10));
      const freq = Math.max(0, parseInt(config.freqPorDia || 0, 10));
      return dias * freq;
    }

    if (mode === 'CALENDAR') {
      if (!calendarData || typeof calendarData !== 'object') return 0;
      return Object.values(calendarData).reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
    }

    return 0;
  },

  /**
   * Calcula todos os valores financeiros de uma linha
   */
  calculateLineFinancials(unitPrice, totalInsertions, discountPercent) {
    const discount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));
    const totalBruto = unitPrice * totalInsertions;
    const totalLiquido = Math.round(totalBruto * (1 - discount / 100));
    const unitarioLiquido = Math.round(unitPrice * (1 - discount / 100));
    const descontoReais = totalBruto - totalLiquido;

    return {
      unitPrice,
      totalInsertions,
      discountPercent: discount,
      totalBruto,
      totalLiquido,
      unitarioLiquido,
      descontoReais
    };
  },

  /**
   * Calcula os totais e KPIs do plano inteiro
   */
  calculatePlanTotals(lines) {
    let totalInsercoes = 0;
    let totalBruto = 0;
    let totalLiquido = 0;

    lines.forEach(line => {
      if (line.calculo && line.calculo.disponivel) {
        totalInsercoes += line.calculo.totalInsertions;
        totalBruto += line.calculo.totalBruto;
        totalLiquido += line.calculo.totalLiquido;
      }
    });

    const descontoTotalReais = totalBruto - totalLiquido;
    const descontoMedioPercent = totalBruto > 0 ? ((descontoTotalReais / totalBruto) * 100) : 0;

    return {
      totalInsercoes,
      totalBruto,
      totalLiquido,
      descontoTotalReais,
      descontoMedioPercent: Math.round(descontoMedioPercent * 100) / 100
    };
  },

  /**
   * Gera os dias dentro de um intervalo de datas (podendo ser em meses diferentes)
   * e identifica quais são dias válidos de exibição do programa.
   */
  getDateRangeWithProgramFlags(startDateStr, endDateStr, sigla, hasPeriod = true, periodPreset = null) {
    const program = this.getProgram(sigla);
    const validWeekdays = program ? program.diasSemana : [1, 2, 3, 4, 5];
    const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const result = [];

    // 1. Se temos datas explícitas de início e fim válidas
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr + 'T00:00:00');
      const end = new Date(endDateStr + 'T00:00:00');

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const current = new Date(start);
        let count = 0;
        // Suporta até 366 dias (1 ano completo)
        while (current <= end && count < 366) {
          const year = current.getFullYear();
          const month = current.getMonth() + 1;
          const day = current.getDate();
          const weekday = current.getDay();
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isValidDayForProgram = validWeekdays.includes(weekday);

          result.push({
            key: dateKey,
            day,
            month,
            year,
            weekday,
            weekdayName: weekDayNames[weekday],
            isWeekend: weekday === 0 || weekday === 6,
            isValidDayForProgram,
            formatted: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
          });

          current.setDate(current.getDate() + 1);
          count++;
        }
        return result;
      }
    }

    // 2. Se não há datas explícitas, define o escopo pelo preset de período
    let totalDays = 30;
    if (periodPreset === 'TRIMESTRAL') totalDays = 90;
    else if (periodPreset === 'SEMESTRAL') totalDays = 180;
    else if (periodPreset === 'ANUAL') totalDays = 360;
    else totalDays = 30; // MENSAL ou padrão

    for (let day = 1; day <= totalDays; day++) {
      // dia 1 % 7 = 1 (Segunda-feira), dia 2 = Terça ... dia 6 = Sábado, dia 7 = Domingo
      const weekday = (day % 7);
      const isValidDayForProgram = validWeekdays.includes(weekday);
      const periodMonth = Math.floor((day - 1) / 30) + 1;
      const dayInMonth = ((day - 1) % 30) + 1;

      result.push({
        key: `D${day}`,
        day: totalDays > 30 ? dayInMonth : day,
        totalDayIdx: day,
        periodMonth,
        periodMonthLabel: `Mês ${periodMonth}`,
        weekday,
        weekdayName: weekDayNames[weekday],
        isWeekend: (weekday === 0 || weekday === 6),
        isValidDayForProgram,
        formatted: totalDays > 30 ? `M${periodMonth}-D${String(dayInMonth).padStart(2, '0')}` : `Dia ${String(day).padStart(2, '0')}`
      });
    }

    return result;
  },

  /**
   * Gera os dias do mês de veiculação e identifica quais são dias válidos do programa (compatibilidade)
   */
  getMonthDaysWithProgramFlags(year, month, sigla) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return this.getDateRangeWithProgramFlags(startDate, endDate, sigla, true);
  },

  /**
   * Distribui automaticamente N inserções nos dias válidos do programa no período
   */
  distributeInsertionsEvenly(startDateStr, endDateStr, sigla, totalTarget, hasPeriod = true, periodPreset = null) {
    const days = this.getDateRangeWithProgramFlags(startDateStr, endDateStr, sigla, hasPeriod, periodPreset);
    const validDays = days.filter(d => d.isValidDayForProgram);
    const calendar = {};

    if (validDays.length === 0 || totalTarget <= 0) return calendar;

    // Inicializar com zeros
    validDays.forEach(d => { calendar[d.key] = 0; });

    let remaining = totalTarget;
    let idx = 0;

    while (remaining > 0) {
      const targetDayKey = validDays[idx % validDays.length].key;
      calendar[targetDayKey] = (calendar[targetDayKey] || 0) + 1;
      remaining--;
      idx++;
    }

    return calendar;
  },

  /**
   * Formata número para moeda Real Brasileiro R$
   */
  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  },

  /**
   * Formata percentual
   */
  formatPercent(value) {
    if (value === null || value === undefined || isNaN(value)) return '0,00%';
    return `${Number(value).toFixed(2).replace('.', ',')}%`;
  }
};

export const MediaCalculator = typeof window !== 'undefined' ? window.MediaCalculator : null;
