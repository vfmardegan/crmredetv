/**
 * Med.IA Planner • Serviço Oficial do Google Gemini API
 * Modelos: gemini-3.5-flash-lite (Primário) com fallback resiliente para gemini-3.8-flash
 * Chave de Acesso Oficial da RedeTV!
 */

window.GeminiService = {
  apiKey: (typeof window !== "undefined" && (window.__GEMINI_API_KEY__ || localStorage.getItem("redetv_gemini_api_key") || window.VITE_GEMINI_API_KEY)) || "",
  primaryModel: 'gemini-3.5-flash-lite',
  backupModel: 'gemini-3.8-flash',

  getSystemInstruction() {
    return `Você é o especialista sênior de inteligência comercial e planejamento de mídia da RedeTV!.
Sua missão é interpretar com máxima fidelidade e precisão os pedidos em linguagem natural e estruturá-los em um JSON rigoroso para o sistema de valoração e cronograma da emissora.

CATÁLOGO OFICIAL DE PROGRAMAS (Tabela Vigente Outubro/2026):
- RTVN: REDETV! NOTÍCIAS 1ª EDIÇÃO (Segunda a Sexta, 09h30 às 10h30)
- FGEN: FICA COM A GENTE (Segunda a Sexta, 10h30 às 12h00)
- BOLA: BOLA NA REDE (Segunda a Sexta, 12h00 às 13h00)
- TARD: A TARDE É SUA (Segunda a Sexta, 15h00 às 17h00)
- RTNO: REDETV! NOTÍCIAS 2ª EDIÇÃO (Segunda a Sexta, 18h00 às 18h30)
- BPOV: BRASIL DO POVO (Segunda a Sábado, 18h30 às 19h45)
- NEWS: REDETV! NEWS (Segunda a Sábado, 19h45 às 20h30)
- RAPF: RAPIDINHAS DA FAMA (Seg, Qua, Qui, Sex, 21h30 às 21h40 • apenas se citado 'Rapidinhas')
- FAMA: TV FAMA (Seg, Ter, Qua, Sex, 21h40 às 22h45) • IMPORTANTE: Se o usuário disser 'TV Fama' ou 'Fama', use SEMPRE a sigla FAMA. NUNCA utilize RAPF a menos que o usuário use explicitamente a palavra 'Rapidinhas'.
- SENS: SENSACIONAL (Segunda-feira, 22h45 às 00h00)
- ENOT: É NOTÍCIA (Terça-feira, 21h30 às 22h15)
- OGVE: O GRANDE VENCEDOR (Terça-feira, 23h00 às 00h00)
- SPOP: SUPERPOP (Quarta-feira, 22h45 às 00h00)
- DINC: DINHEIRO NA CONTA (Quinta-feira, 23h00 às 00h00)
- OPRR: OPERAÇÃO DE RISCO DE SEXTA (Sexta-feira, 22h45 às 23h45)
- LMSL: LIGA MONSTRO SEM LIMITES (Sexta-feira, 23h45 às 00h30)
- LMOC: LIGA MONSTRO COMBATE (Sexta-feira, 21h30 às 00h30)
- LEID: LEITURA DINÂMICA (Segunda a Sexta, 00h00 às 00h30)
- CABR: CAMP. BRASILEIRO SERIE B (Sábado, 16h00 às 18h30)
- RNEG: RODADA DE NEGÓCIOS (Sábado, 21h30 às 22h00)
- BCRI: BASTIDORES DO CRIME (Sábado, 22h00 às 22h15)
- OPRA: OPERAÇÃO DE RISCO (Sábado, 22h15 às 23h15)
- MSON: MEGA SONHO (Sábado, 23h15 às 00h30)
- MESR: MEGA SONHO - REPRISE (Domingo, 17h00 às 18h00)
- PAQU: PARA AQUI (Domingo, 19h30 às 21h30)
- VIZG: VIZINHOS EM GUERRA (Domingo, 21h30 às 22h30)
- AMRI: AMOR EM RISCO (Domingo, 22h30 às 23h30)
- OMET: O MELHOR DE TUDO (Domingo, 23h30 às 00h15)
- VSPO: VÊ SE PODE (Domingo, 00h15 às 01h00)
- ROTA: ROTATIVO (07h00 à 01h00 • Todos os dias)
- ROT1: ROTATIVO (7/12) (07h00 às 12h00 • Matutino • Seg a Sex)
- ROT2: ROTATIVO (12/18) (12h00 às 18h00 • Vespertino • Seg a Sex)
- ROT3: ROTATIVO (18/01) (18h00 à 01h00 • Noturno • Todos os dias)
- ROT4: ROTATIVO (07/18) (07h00 às 18h00 • Diurno • Seg a Sex)

FORMATOS OFICIAIS (IDs):
- VHT_INTEGRADA_ABERTURA_5: Vinheta Integrada de Abertura (5")
- VHT_INTEGRADA_ENCERRAMENTO_5: Vinheta Integrada de Encerramento (5")
- COMERCIAL_30: Comercial de 30 segundos
- COMERCIAL_15: Comercial de 15 segundos
- COMERCIAL_60: Comercial de 60 segundos
- MERCHANDISING_90: Merchandising de 90 segundos
- MERCHANDISING_60: Merchandising de 60 segundos
- ACAO_INTEGRADA_45: Ação Integrada de 45 segundos
- ACAO_INTEGRADA_60: Ação Integrada de 60 segundos
- ACAO_INTEGRADA_90: Ação Integrada de 90 segundos (USE ESTE ID quando solicitada ação integrada de 90 ou 90")
- ACAO_INTEGRADA_2M: Ação Integrada de 2 minutos
- TOP_5_SEGUNDOS: Top de 5 segundos

REGRAS CRÍTICAS DE INTERPRETAÇÃO:
1. DIAS DA SEMANA (allowedWeekdays): 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado.
   - REGRA DE OURO: Para programas onde o usuário NÃO especificou restrição de dia (ex: Superpop, Sensacional, Operação de Risco), deixe SEMPRE allowedWeekdays: null! A grade oficial da emissora já sabe o dia de cada um. NÃO invente ou adivinhe restrições de dia para programas que não pediram!
   - Atribua allowedWeekdays APENAS E EXCLUSIVAMENTE para o programa específico citado com restrição:
     * Ex: "TV Fama, somente às quartas-feiras" -> allowedWeekdays: [3] APENAS no TV Fama.
     * Ex: "Bola na Rede toda segunda-feira" -> allowedWeekdays: [1] APENAS no Bola na Rede.
     * JAMAIS passe [1] para o Sensacional ou [3] para outros programas! Deixe allowedWeekdays: null para todos os demais.
2. DISTRIBUIÇÃO E ISOLAMENTO DE FORMATOS POR PROGRAMA:
   - Se o usuário pedir um pacote geral de patrocínio para certos programas e depois adicionar cláusulas pontuais:
     * Exemplo: "Além disso, incluir comercial de 30 e merchan de 90 no TV Fama" -> O TV Fama recebe APENAS Comercial 30 e Merchandising 90 (NÃO adicione vinhetas a ele!).
     * Exemplo: "Vamos colocar também uma ação integrada de 90 no Bola na Rede" -> O Bola na Rede recebe APENAS a Ação Integrada de 90 (NÃO adicione vinhetas, comerciais ou merchandisings a ele!).
     * As vinhetas pertencem exclusivamente aos programas principais que formam o plano de patrocínio.
3. MINUTAGEM EXATA DE FORMATOS:
   - Quando o usuário especificar a duração da ação integrada (ex: 90"), use exatamente ACAO_INTEGRADA_90 (não use ACAO_INTEGRADA_60).
4. COTAS OU QUANTIDADES TOTAIS EXPLÍCITAS (totalInsertions):
   - Se o usuário especificar uma quantidade total de inserções para um formato específico (ex: "prever 8 ações de merchandising", "prever 8 merchandisings", "10 comerciais", "5 ações"):
     * Defina totalInsertions: 8 (o valor numérico exato solicitado).
     * Defina dailyFrequency: null.
   - Para os formatos que possuem entrega diária contínua no programa (ex: "entregas diárias de vinheta de abertura, encerramento e comercial de 30"):
     * Defina totalInsertions: null.
     * Defina dailyFrequency: 1.
5. DESCONTO:
   - Extraia o desconto numérico do cliente (ex: 96.85). Se não informado, utilize 70.0.
6. PERÍODO:
   - Se informado meses e ano (ex: "novembro a dezembro de 2026"):
     startDate: "2026-11-01", endDate: "2026-12-31".
   - Se informado virada de ano (ex: "novembro de 2026 a fevereiro de 2027"):
     startDate: "2026-11-01", endDate: "2027-02-28".
   - Se informado "durante o mês", "no mês", "mensal":
     periodPreset: "MENSAL", periodLabel: "Mensal".
7. PRAÇA (targetMarket):
   - "SP" se citar São Paulo/SP, senão "NACIONAL".

EXEMPLO DE ESCOPO MISTO (Diário + Cota Pontual Fechada):
Prompt: "Crie um plano de patrocínio do programa TV Fama com entregas diárias de vinheta de abertura, encerramento e comercial de 30. Além disso, prever 8 ações de merchandising de 90 durante o mes."
JSON estruturado correto:
{
  "clientDiscount": 70.0,
  "targetMarket": "NACIONAL",
  "period": { "startDate": null, "endDate": null, "periodPreset": "MENSAL", "periodLabel": "Mensal" },
  "projectName": "Plano de Patrocínio TV Fama (Mensal)",
  "items": [
    { "program": "FAMA", "format": "VHT_INTEGRADA_ABERTURA_5", "dailyFrequency": 1, "allowedWeekdays": null, "totalInsertions": null },
    { "program": "FAMA", "format": "VHT_INTEGRADA_ENCERRAMENTO_5", "dailyFrequency": 1, "allowedWeekdays": null, "totalInsertions": null },
    { "program": "FAMA", "format": "COMERCIAL_30", "dailyFrequency": 1, "allowedWeekdays": null, "totalInsertions": null },
    { "program": "FAMA", "format": "MERCHANDISING_90", "dailyFrequency": null, "allowedWeekdays": null, "totalInsertions": 8 }
  ]
}

FORMATO EXATO DO JSON DE RESPOSTA:
{
  "clientDiscount": number,
  "targetMarket": "NACIONAL" | "SP",
  "period": {
    "startDate": "YYYY-MM-DD" | null,
    "endDate": "YYYY-MM-DD" | null,
    "periodPreset": "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL" | null,
    "periodLabel": string
  },
  "projectName": string,
  "items": [
    {
      "program": string,
      "format": string,
      "dailyFrequency": number,
      "allowedWeekdays": number[] | null,
      "totalInsertions": number | null
    }
  ]
}`;
  },

  async callModelApi(model, promptText) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          generationConfig: {
            responseMimeType: 'application/json'
          },
          systemInstruction: {
            parts: [{ text: this.getSystemInstruction() }]
          },
          contents: [
            {
              parts: [{ text: promptText }]
            }
          ]
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Resposta vazia da API.');
      }

      return JSON.parse(rawText);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  /**
   * Envia o prompt para a API do Gemini com fallback resiliente
   */
  async plan(promptText) {
    let geminiData = null;
    let modelUsed = this.primaryModel;

    // 1. Tenta o modelo primário: gemini-3.5-flash-lite
    try {
      geminiData = await this.callModelApi(this.primaryModel, promptText);
    } catch (errPrim) {
      console.warn(`Aviso: ${this.primaryModel} indisponível ou instável. Acionando backup ${this.backupModel}...`, errPrim);
      // 2. Fallback automático para gemini-3.8-flash
      try {
        modelUsed = this.backupModel;
        geminiData = await this.callModelApi(this.backupModel, promptText);
      } catch (errBack) {
        console.error(`Falha em ambos os modelos Gemini:`, errBack);
        return { success: false, error: errBack.message };
      }
    }

    try {
      const plan = this.buildPlanFromGemini(geminiData, promptText, modelUsed);
      return { success: true, plan };
    } catch (buildErr) {
      console.error('Erro ao construir plano a partir dos dados do Gemini:', buildErr);
      return { success: false, error: buildErr.message };
    }
  },

  buildPlanFromGemini(geminiData, promptText, modelUsed = 'gemini-3.5-flash-lite') {
    const period = geminiData.period || {};
    const hasPeriod = Boolean(period.startDate && period.endDate);
    const startDate = period.startDate || '';
    const endDate = period.endDate || '';
    const periodPreset = period.periodPreset || null;
    const periodLabel = period.periodLabel || (hasPeriod ? `${startDate} a ${endDate}` : 'Período Livre');
    const discount = typeof geminiData.clientDiscount === 'number' ? geminiData.clientDiscount : 70.0;
    const targetMarket = geminiData.targetMarket || 'NACIONAL';

    const lines = [];

    (geminiData.items || []).forEach(item => {
      // Normalização robusta de Sigla de Programa (com prioridade estrita de correspondência exata)
      let sigla = String(item.program || '').trim().toUpperCase();
      let matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla.toUpperCase() === sigla);
      if (!matchedProg) {
        matchedProg = (window.PROGRAMS_DATA || []).find(p => p.nome.toUpperCase() === sigla);
      }
      if (!matchedProg) {
        if (sigla.includes('TV FAMA') || sigla === 'FAMA') {
          matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'FAMA');
        } else if (sigla.includes('RAPIDINHAS')) {
          matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'RAPF');
        } else if (sigla.includes('BOLA')) {
          matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'BOLA');
        } else if (sigla.includes('ROTATIVO') || sigla.includes('ROTA')) {
          if (sigla.includes('7/12') || sigla.includes('7/') || sigla.includes('MATUTINO')) {
            matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'ROT1');
          } else if (sigla.includes('12/18') || sigla.includes('VESPERTINO')) {
            matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'ROT2');
          } else if (sigla.includes('18/01') || sigla.includes('18/1') || sigla.includes('NOTURNO')) {
            matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'ROT3');
          } else if (sigla.includes('07/18') || sigla.includes('7/18') || sigla.includes('DIURNO')) {
            matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'ROT4');
          } else {
            matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'ROTA');
          }
        } else if (sigla.includes('OPERAÇÃO') || sigla.includes('OPERACAO')) {
          if (sigla.includes('SÁB') || sigla.includes('SAB')) {
            matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'OPRA');
          } else {
            matchedProg = (window.PROGRAMS_DATA || []).find(p => p.sigla === 'OPRR');
          }
        }
      }
      if (!matchedProg) {
        matchedProg = (window.PROGRAMS_DATA || []).find(p => 
          p.nome.toUpperCase().includes(sigla) || sigla.includes(p.nome.toUpperCase())
        );
      }
      if (matchedProg) {
        sigla = matchedProg.sigla;
      }

      // Normalização robusta de Formato
      let formatId = String(item.format || '').trim();
      let matchedFmt = (window.MEDIA_FORMATS || []).find(f => f.id.toUpperCase() === formatId.toUpperCase());
      if (!matchedFmt) {
        matchedFmt = (window.MEDIA_FORMATS || []).find(f => f.nome.toUpperCase() === formatId.toUpperCase());
      }
      if (!matchedFmt) {
        const fUpper = formatId.toUpperCase();
        if (/A[ÇC][ÃA]O.*90|INTEGRADA.*90/i.test(fUpper)) {
          matchedFmt = (window.MEDIA_FORMATS || []).find(f => f.id === 'ACAO_INTEGRADA_90');
        } else if (/A[ÇC][ÃA]O.*60|INTEGRADA.*60/i.test(fUpper)) {
          matchedFmt = (window.MEDIA_FORMATS || []).find(f => f.id === 'ACAO_INTEGRADA_60');
        } else if (/A[ÇC][ÃA]O.*45|INTEGRADA.*45/i.test(fUpper)) {
          matchedFmt = (window.MEDIA_FORMATS || []).find(f => f.id === 'ACAO_INTEGRADA_45');
        } else if (/MERCHAN.*90/i.test(fUpper)) {
          matchedFmt = (window.MEDIA_FORMATS || []).find(f => f.id === 'MERCHANDISING_90');
        } else if (/MERCHAN.*60/i.test(fUpper)) {
          matchedFmt = (window.MEDIA_FORMATS || []).find(f => f.id === 'MERCHANDISING_60');
        }
      }
      if (!matchedFmt) {
        matchedFmt = (window.MEDIA_FORMATS || []).find(f =>
          f.id.toUpperCase().includes(formatId.toUpperCase()) ||
          f.nome.toUpperCase().includes(formatId.toUpperCase())
        );
      }
      if (matchedFmt) {
        formatId = matchedFmt.id;
      }

      const dailyFreq = item.dailyFrequency || 1;
      const isRestricted = Array.isArray(item.allowedWeekdays) && 
        item.allowedWeekdays.length > 0 && 
        item.allowedWeekdays.length < 7;

      // Obtém o calendário de exibição conforme as regras oficiais da grade da RedeTV!
      const days = window.MediaCalculator.getDateRangeWithProgramFlags(
        startDate,
        endDate,
        sigla,
        hasPeriod,
        periodPreset
      );

      // Filtra dias válidos respeitando a grade do programa e eventuais restrições exclusivas deste item
      let validDays = days.filter(d => {
        if (!d.isValidDayForProgram) return false;
        if (isRestricted) {
          return item.allowedWeekdays.includes(d.weekday);
        }
        return true;
      });

      // Se a restrição resultou em zero dias (ex: dia hipotético enviado pela IA vs grade oficial),
      // faz fallback seguro para todos os dias válidos do próprio programa na grade
      if (validDays.length === 0) {
        validDays = days.filter(d => d.isValidDayForProgram);
      }

      const numDays = validDays.length > 0 ? validDays.length : 1;
      const hasExplicitTotal = typeof item.totalInsertions === 'number' && item.totalInsertions > 0;
      const totalInsertions = hasExplicitTotal ? item.totalInsertions : (numDays * dailyFreq);

      const calData = {};
      if (hasExplicitTotal && item.totalInsertions < validDays.length) {
        const distributed = window.MediaCalculator.distributeInsertionsEvenly(
          startDate,
          endDate,
          sigla,
          totalInsertions,
          hasPeriod,
          periodPreset
        );
        Object.assign(calData, distributed);
      } else if (validDays.length > 0) {
        validDays.forEach(d => {
          calData[d.key] = dailyFreq;
        });
      } else {
        const distributed = window.MediaCalculator.distributeInsertionsEvenly(
          startDate,
          endDate,
          sigla,
          totalInsertions,
          hasPeriod,
          periodPreset
        );
        Object.assign(calData, distributed);
      }

      lines.push({
        sigla,
        marketId: targetMarket,
        formatId,
        insertionMode: hasExplicitTotal ? 'TOTAL' : 'FREQ',
        totalDirect: totalInsertions,
        freqDias: hasExplicitTotal ? totalInsertions : numDays,
        freqPorDia: hasExplicitTotal ? 1 : dailyFreq,
        discountPercent: discount,
        calendarData: calData,
        calculo: null
      });
    });

    const progNames = Array.from(new Set(lines.map(l => {
      const p = window.MediaCalculator.getProgram(l.sigla);
      return p ? p.nome : l.sigla;
    })));

    return {
      prompt: promptText,
      modelUsed,
      campaign: {
        projectName: geminiData.projectName || `Plano de Mídia ${progNames.join(' e ')} (${periodLabel})`,
        startDate,
        endDate,
        hasPeriod,
        periodPreset,
        defaultDiscount: discount
      },
      summary: `✨ Gerado via Med.IA • ${lines.length} itens estruturados para ${progNames.join(', ')} no período ${periodLabel} (${targetMarket}) com desconto negociado de ${window.MediaCalculator.formatPercent(discount)}.`,
      lines
    };
  }
};
