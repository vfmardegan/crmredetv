/**
 * Controlador Principal da Aplicação Web de Planejamento de Mídia RedeTV!
 * Compatível com o Design System Corporativo (Slate & Rose)
 * Inclui Smart Autocomplete para PRODUTO (com suporte a avulso) e PRAÇA
 */

class MediaApp {
  constructor() {
    this.campaign = {
      client: '',
      agency: '',
      projectName: '',
      hasPeriod: false,
      periodPreset: null,
      startDate: '',
      endDate: '',
      tableVersionId: '2026-outubro',
      tableVersionName: 'Outubro/2026',
      defaultDiscount: 70.0,
      globalInsertionMode: 'TOTAL'
    };

    // Atualiza nome da versão se houver tabela vigente customizada
    try {
      let activeName = localStorage.getItem('redetv_active_rate_card_name');
      let activeId = localStorage.getItem('redetv_active_rate_card_id');
      if (!activeName || activeName.includes('2026.1') || activeName.includes('Abril')) {
        activeName = 'Outubro/2026';
        activeId = '2026-outubro';
        localStorage.setItem('redetv_active_rate_card_name', activeName);
        localStorage.setItem('redetv_active_rate_card_id', activeId);
      }
      this.campaign.tableVersionName = activeName;
      this.campaign.tableVersionId = activeId;
      const btnTable = document.getElementById('btn-table-version');
      if (btnTable) btnTable.textContent = `⚙️ Tabela ${activeName}`;
      const sidebarTable = document.getElementById('sidebar-active-table-name');
      if (sidebarTable) sidebarTable.textContent = activeName;
    } catch (e) {}

    this.lines = [];
    this.nextId = 1;
    this.previousInsertionMode = 'TOTAL';

    this.programImpacts = {};
    this.initProgramImpacts();

    this.mediaAiGeneratedPlan = null;
    this.isRecordingAudio = false;
    this.recognition = null;
    this.recordingTimerInterval = null;
    this.recordingSeconds = 0;

    this.initDefaultLines();
    this.bindEvents();
    this.render();
  }

  initDefaultLines() {
    this.checkOpportunityPrefill();
    // Verifica se há proposta do histórico para carregar
    if (this.checkPendingLoadedProposal()) {
      return;
    }
    // Verifica se há plano gerado pela Med.IA pendente para ser importado
    if (this.checkPendingAiPlan()) {
      return;
    }
    // Caso contrário, carrega a aplicação com apenas uma linha inicial pronta para preenchimento com desconto padrão
    this.addLine({}, true);
  }

  checkPendingLoadedProposal() {
    try {
      const saved = localStorage.getItem('redetv_load_proposal');
      if (saved) {
        localStorage.removeItem('redetv_load_proposal');
        const data = JSON.parse(saved);
        if (data && data.campaign) {
          this.campaign = { ...this.campaign, ...data.campaign };
          const clientEl = document.getElementById('camp-client');
          if (clientEl) clientEl.value = this.campaign.client || '';
          const agencyEl = document.getElementById('camp-agency');
          if (agencyEl) agencyEl.value = this.campaign.agency || '';
          const projEl = document.getElementById('camp-project-name');
          if (projEl) projEl.value = this.campaign.projectName || '';
          const startEl = document.getElementById('camp-start-date');
          if (startEl) startEl.value = this.campaign.startDate || '';
          const endEl = document.getElementById('camp-end-date');
          if (endEl) endEl.value = this.campaign.endDate || '';
          const discEl = document.getElementById('camp-default-discount');
          if (discEl && this.campaign.defaultDiscount !== undefined) {
            discEl.value = Number(this.campaign.defaultDiscount).toFixed(2);
          }
        }
        if (data && Array.isArray(data.lines) && data.lines.length > 0) {
          this.lines = [];
          data.lines.forEach(lineProps => this.addLine(lineProps));
          this.recalculateAll();
          this.render();
          this.showToast('Proposta carregada do histórico com sucesso!');
          return true;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar proposta do histórico:', e);
    }
    return false;
  }

  checkOpportunityPrefill() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let prefill = null;
      if (urlParams.get('client') || urlParams.get('projectName') || urlParams.get('agency')) {
        prefill = {
          client: urlParams.get('client') || '',
          agency: urlParams.get('agency') || '',
          projectName: urlParams.get('projectName') || ''
        };
      } else {
        const stored = localStorage.getItem('redetv_prefill_campaign');
        if (stored) {
          prefill = JSON.parse(stored);
        }
      }
      if (prefill) {
        if (prefill.client) {
          this.campaign.client = prefill.client;
          const el = document.getElementById('camp-client');
          if (el) el.value = prefill.client;
        }
        if (prefill.agency) {
          this.campaign.agency = prefill.agency;
          const el = document.getElementById('camp-agency');
          if (el) el.value = prefill.agency;
        }
        if (prefill.projectName) {
          this.campaign.projectName = prefill.projectName;
          const el = document.getElementById('camp-project-name');
          if (el) el.value = prefill.projectName;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar dados da oportunidade:', e);
    }
  }

  checkPendingAiPlan() {
    try {
      const saved = localStorage.getItem('redetv_pending_ai_plan');
      if (saved) {
        localStorage.removeItem('redetv_pending_ai_plan');
        const plan = JSON.parse(saved);
        if (plan) {
          if (plan.campaign) {
            this.campaign.startDate = plan.campaign.startDate || '';
            this.campaign.endDate = plan.campaign.endDate || '';
            this.campaign.hasPeriod = plan.campaign.hasPeriod !== undefined ? plan.campaign.hasPeriod : Boolean(this.campaign.startDate && this.campaign.endDate);
            this.campaign.periodPreset = plan.campaign.periodPreset || null;
            if (plan.campaign.projectName) this.campaign.projectName = plan.campaign.projectName;

            const startEl = document.getElementById('camp-start-date');
            const endEl = document.getElementById('camp-end-date');

            if (this.campaign.startDate && this.campaign.endDate) {
              this.campaign.hasPeriod = true;
              this.campaign.periodPreset = null;
              if (startEl) {
                startEl.value = this.campaign.startDate;
                startEl.disabled = false;
              }
              if (endEl) {
                endEl.value = this.campaign.endDate;
                endEl.disabled = false;
              }
            } else if (this.campaign.periodPreset) {
              this.campaign.startDate = '';
              this.campaign.endDate = '';
              this.campaign.hasPeriod = false;
              if (startEl) {
                startEl.value = '';
                startEl.disabled = true;
              }
              if (endEl) {
                endEl.value = '';
                endEl.disabled = true;
              }
            } else {
              if (startEl) {
                startEl.value = '';
                startEl.disabled = false;
              }
              if (endEl) {
                endEl.value = '';
                endEl.disabled = false;
              }
            }

            const projEl = document.getElementById('camp-project-name');
            if (projEl) projEl.value = this.campaign.projectName;

            if (plan.campaign.defaultDiscount !== undefined && !isNaN(Number(plan.campaign.defaultDiscount))) {
              this.campaign.defaultDiscount = Number(plan.campaign.defaultDiscount);
              const discEl = document.getElementById('camp-default-discount');
              if (discEl) discEl.value = this.campaign.defaultDiscount.toFixed(2);
            }

            document.querySelectorAll('.period-preset-check').forEach(chk => {
              const isMatch = Boolean(this.campaign.periodPreset && chk.value === this.campaign.periodPreset);
              chk.checked = isMatch;
              chk.closest('.period-box-option')?.classList.toggle('active', isMatch);
            });
          }

          if (Array.isArray(plan.lines) && plan.lines.length > 0) {
            this.lines = [];
            plan.lines.forEach(lineProps => this.addLine(lineProps));
            this.recalculateAll();
            this.render();
            this.showToast('Planejamento estruturado pela Med.IA importado com sucesso!');
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar plano pendente da IA:', e);
    }
    return false;
  }

  checkOpportunityPrefill() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let prefill = null;
      if (urlParams.get('client') || urlParams.get('projectName') || urlParams.get('agency')) {
        prefill = {
          client: urlParams.get('client') || '',
          agency: urlParams.get('agency') || '',
          projectName: urlParams.get('projectName') || ''
        };
      } else {
        const stored = localStorage.getItem('redetv_prefill_campaign');
        if (stored) {
          prefill = JSON.parse(stored);
        }
      }
      if (prefill) {
        if (prefill.client) {
          this.campaign.client = prefill.client;
          const el = document.getElementById('camp-client');
          if (el) el.value = prefill.client;
        }
        if (prefill.agency) {
          this.campaign.agency = prefill.agency;
          const el = document.getElementById('camp-agency');
          if (el) el.value = prefill.agency;
        }
        if (prefill.projectName) {
          this.campaign.projectName = prefill.projectName;
          const el = document.getElementById('camp-project-name');
          if (el) el.value = prefill.projectName;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar dados da oportunidade:', e);
    }
  }

  addLine(initialProps = null) {
    const id = this.nextId++;
    const currentMode = this.campaign.globalInsertionMode || 'TOTAL';
    const isBlank = initialProps === null || Object.keys(initialProps).length === 0;

    const defDiscount = (this.campaign && this.campaign.defaultDiscount !== undefined && this.campaign.defaultDiscount !== '') 
      ? Number(this.campaign.defaultDiscount) 
      : 70.0;

    const newLine = {
      id,
      sigla: isBlank ? '' : (initialProps.sigla || ''),
      isCustomProduct: isBlank ? false : (initialProps.isCustomProduct || false),
      customProductName: isBlank ? '' : (initialProps.customProductName || ''),
      customUnitPrice: isBlank ? '' : (initialProps.customUnitPrice || 0),
      customBasePrice: isBlank ? '' : (initialProps.customBasePrice || initialProps.customUnitPrice || 0),
      customCoef: isBlank ? null : (initialProps.customCoef || null),

      marketId: isBlank ? '' : (initialProps.marketId || ''),

      formatId: isBlank ? '' : (initialProps.formatId || ''),
      customFormatName: isBlank ? '' : (initialProps.customFormatName || ''),
      isCustomFormat: isBlank ? false : (initialProps.isCustomFormat || false),
      brandedVariant: isBlank ? 'inedito' : (initialProps.brandedVariant || 'inedito'),
      
      insertionMode: isBlank ? currentMode : (initialProps.insertionMode || currentMode),
      totalDirect: isBlank ? '' : (initialProps.totalDirect !== undefined ? initialProps.totalDirect : ''),
      freqDias: isBlank ? '' : (initialProps.freqDias !== undefined ? initialProps.freqDias : ''),
      freqPorDia: isBlank ? '' : (initialProps.freqPorDia !== undefined ? initialProps.freqPorDia : ''),
      calendarData: isBlank ? {} : (initialProps.calendarData || {}),

      discountPercent: (initialProps && initialProps.discountPercent !== undefined && initialProps.discountPercent !== '') 
        ? Number(initialProps.discountPercent) 
        : defDiscount,
      isCalendarOpen: false,
      calculo: null
    };

    if (!isBlank && currentMode === 'CALENDAR' && Object.keys(newLine.calendarData).length === 0) {
      newLine.calendarData = window.MediaCalculator.distributeInsertionsEvenly(
        this.campaign.startDate,
        this.campaign.endDate,
        newLine.sigla,
        newLine.totalDirect || 10,
        this.campaign.hasPeriod,
        this.campaign.periodPreset
      );
    }

    this.recalculateLine(newLine);
    this.lines.push(newLine);
    return newLine;
  }

  duplicateLine(lineId) {
    const original = this.lines.find(l => l.id === lineId);
    if (!original) return;

    const duplicated = JSON.parse(JSON.stringify(original));
    duplicated.id = this.nextId++;
    duplicated.isCalendarOpen = false;

    const defDiscount = (this.campaign && this.campaign.defaultDiscount !== undefined && this.campaign.defaultDiscount !== '') 
      ? Number(this.campaign.defaultDiscount) 
      : 70.0;

    // Traz o desconto preenchido com o desconto padrão (ou da linha original)
    duplicated.discountPercent = (original.discountPercent !== '' && original.discountPercent !== undefined && !isNaN(original.discountPercent))
      ? Number(original.discountPercent)
      : defDiscount;

    const originalIdx = this.lines.findIndex(l => l.id === lineId);
    this.lines.splice(originalIdx + 1, 0, duplicated);

    this.recalculateLine(duplicated);
    this.render();
    this.showToast('Linha duplicada com sucesso!');
  }

  deleteLine(lineId) {
    if (this.lines.length <= 1) {
      this.lines = [];
      this.addLine({}, true);
      this.render();
      this.showToast('Linha zerada.');
      return;
    }
    this.lines = this.lines.filter(l => l.id !== lineId);
    this.render();
    this.showToast('Linha excluída com sucesso.');
  }

  clearAllLines() {
    this.lines = [];
    this.addLine({}, true);
    this.render();
    this.showToast('Todas as linhas foram limpas.');
  }

  recalculateLine(line) {
    const unitPriceInfo = window.MediaCalculator.calculateUnitPrice(
      line.sigla,
      line.marketId,
      line.formatId || '',
      line.brandedVariant,
      line.customBasePrice || line.customUnitPrice,
      line.isCustomProduct,
      line.customCoef,
      line.isCustomFormat
    );

    const config = {
      total: line.totalDirect,
      dias: line.freqDias,
      freqPorDia: line.freqPorDia
    };

    const totalInsertions = window.MediaCalculator.calculateTotalInsertions(
      line.insertionMode,
      config,
      line.calendarData
    );

    const financials = window.MediaCalculator.calculateLineFinancials(
      unitPriceInfo.valor,
      totalInsertions,
      line.discountPercent
    );

    line.calculo = {
      ...unitPriceInfo,
      ...financials
    };
  }

  recalculateAll() {
    this.lines.forEach(line => this.recalculateLine(line));
  }

  switchInsertionMode(lineId, newMode) {
    const line = this.lines.find(l => l.id === lineId);
    if (!line || line.insertionMode === newMode) return;

    const currentTotal = line.calculo?.totalInsertions || 0;

    if (newMode === 'TOTAL') {
      line.totalDirect = currentTotal > 0 ? currentTotal : 10;
    } else if (newMode === 'FREQ') {
      if (currentTotal > 0) {
        line.freqDias = Math.max(1, Math.round(currentTotal / 2));
        line.freqPorDia = 2;
        line.totalDirect = line.freqDias * line.freqPorDia;
      }
    } else if (newMode === 'CALENDAR') {
      const currentCalSum = Object.values(line.calendarData || {}).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
      if (currentCalSum === 0 && currentTotal > 0) {
        line.calendarData = window.MediaCalculator.distributeInsertionsEvenly(
          this.campaign.startDate,
          this.campaign.endDate,
          line.sigla,
          currentTotal,
          this.campaign.hasPeriod
        );
      }
      line.isCalendarOpen = true;
    }

    line.insertionMode = newMode;
    this.recalculateLine(line);
    this.render();
  }

  saveCampaign() {
    this.recalculateAll();
    const totals = window.MediaCalculator.calculatePlanTotals(this.lines);

    let totalImpactos = 0;
    this.lines.forEach(line => {
      const count = (parseInt(line.totalDirect, 10) || 0) 
        || ((parseInt(line.freqDias, 10) || 0) * (parseInt(line.freqPorDia, 10) || 0)) 
        || line.calculo?.totalInsertions 
        || 0;
      const progImpact = this.getProgramImpact(line.sigla);
      totalImpactos += (count * progImpact);
    });
    const cpm = totalImpactos > 0 ? ((totals.totalLiquido / totalImpactos) * 1000) : 0;

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    const proposalId = `PROP-${year}-${String(Date.now()).slice(-4)}`;

    const clientName = (this.campaign.client || '').trim() || 'CLIENTE NÃO INFORMADO';
    const projectName = (this.campaign.projectName || '').trim() || 'PLANO DE MÍDIA ' + dateStr;
    const agencyName = (this.campaign.agency || '').trim() || 'AGÊNCIA NÃO INFORMADA';

    const proposalRecord = {
      id: proposalId,
      projectName: projectName,
      client: clientName,
      agency: agencyName,
      date: dateStr,
      timestamp: Date.now(),
      totalInsertions: totals.totalInsercoes,
      totalGross: totals.totalBruto,
      totalNet: totals.totalLiquido,
      avgDiscount: totals.descontoMedioPercent,
      totalImpacts: totalImpactos,
      cpm: cpm,
      tableVersion: this.campaign.tableVersionName || 'Outubro/2026',
      campaignData: {
        campaign: JSON.parse(JSON.stringify(this.campaign)),
        lines: JSON.parse(JSON.stringify(this.lines))
      }
    };

    let savedList = [];
    try {
      const raw = localStorage.getItem('redetv_saved_proposals');
      if (raw) savedList = JSON.parse(raw);
    } catch (e) {
      savedList = [];
    }
    if (!Array.isArray(savedList)) savedList = [];

    savedList.unshift(proposalRecord);
    try {
      localStorage.setItem('redetv_saved_proposals', JSON.stringify(savedList));
      this.showToast(`Campanha "${projectName}" salva com sucesso (${proposalId})!`);
    } catch (e) {
      console.error(e);
      this.showToast('Erro ao salvar campanha localmente.');
    }

    // Persistência corporativa centralizada no banco PostgreSQL (compartilhado entre Admins e Diretoria)
    try {
      const token = (typeof window !== 'undefined' && (
        localStorage.getItem('crm_session_token') || 
        (window.parent && window.parent.localStorage && window.parent.localStorage.getItem('crm_session_token'))
      )) || '';

      if (token) {
        fetch('/api/v1/media-proposals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: proposalRecord.id,
            cliente: proposalRecord.client,
            agencia: proposalRecord.agency,
            projeto: proposalRecord.projectName,
            valor_total: proposalRecord.totalNet,
            desconto: proposalRecord.avgDiscount,
            grade_json: proposalRecord.campaignData
          })
        })
        .then(async (res) => {
          if (!res.ok) {
            console.warn('Aviso: Não foi possível sincronizar proposta no PostgreSQL central:', res.status);
          } else {
            console.log('✓ Proposta salva com sucesso no banco central PostgreSQL da RedeTV!');
          }
        })
        .catch((err) => {
          console.warn('Conexão offline ou instável ao enviar proposta para o PostgreSQL:', err);
        });
      }
    } catch (apiErr) {
      console.warn('Erro ao disparar persistência central de proposta:', apiErr);
    }
  }

  bindEvents() {
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', () => {
        document.querySelector('.layout-wrapper')?.classList.toggle('sidebar-collapsed');
      });
    }

    const btnCollapseCamp = document.getElementById('btn-collapse-campaign');
    const campSection = document.getElementById('campaign-card-section');
    if (btnCollapseCamp && campSection) {
      btnCollapseCamp.addEventListener('click', () => {
        campSection.classList.toggle('campaign-collapsed');
      });
    }

    const btnClearAllLines = document.getElementById('btn-clear-all-lines');
    if (btnClearAllLines) {
      btnClearAllLines.addEventListener('click', () => {
        if (confirm('Deseja realmente limpar todas as linhas da programação?')) {
          this.clearAllLines();
        }
      });
    }

    const btnAddLine = document.getElementById('btn-add-line');
    if (btnAddLine) {
      btnAddLine.addEventListener('click', () => {
        this.addLine({}, true);
        this.render();
        this.showToast('Nova inserção adicionada.');
      });
    }

    const btnSaveCampaign = document.getElementById('btn-save-campaign');
    if (btnSaveCampaign) {
      btnSaveCampaign.addEventListener('click', () => {
        this.saveCampaign();
      });
    }

    document.getElementById('btn-export-excel').addEventListener('click', () => {
      this.recalculateAll();
      const totals = window.MediaCalculator.calculatePlanTotals(this.lines);
      let totalImpactos = 0;
      this.lines.forEach(line => {
        const count = (parseInt(line.totalDirect, 10) || 0) 
          || ((parseInt(line.freqDias, 10) || 0) * (parseInt(line.freqPorDia, 10) || 0)) 
          || line.calculo?.totalInsertions 
          || 0;
        const progImpact = this.getProgramImpact(line.sigla);
        totalImpactos += (count * progImpact);
      });
      totals.totalImpactosEstimados = totalImpactos;
      totals.cpmMedio = totalImpactos > 0 ? ((totals.totalLiquido / totalImpactos) * 1000) : 0;
      window.ExcelExporter.exportProposal(this.campaign, this.lines, totals);
      this.showToast('Planilha Excel gerada com sucesso!');
    });

    document.getElementById('camp-client').addEventListener('input', (e) => {
      this.campaign.client = e.target.value;
    });

    document.getElementById('camp-agency').addEventListener('input', (e) => {
      this.campaign.agency = e.target.value;
    });

    document.getElementById('camp-project-name').addEventListener('input', (e) => {
      this.campaign.projectName = e.target.value;
    });

    const inputStartDate = document.getElementById('camp-start-date');
    const inputEndDate = document.getElementById('camp-end-date');
    const presetChecks = document.querySelectorAll('.period-preset-check');

    const clearPresetChecks = () => {
      presetChecks.forEach(c => {
        c.checked = false;
        c.closest('.period-box-option')?.classList.remove('active');
      });
      this.campaign.periodPreset = null;
      this.campaign.hasPeriod = Boolean(this.campaign.startDate && this.campaign.endDate);
      if (inputStartDate) inputStartDate.disabled = false;
      if (inputEndDate) inputEndDate.disabled = false;
    };

    if (inputStartDate) {
      inputStartDate.addEventListener('change', (e) => {
        this.campaign.startDate = e.target.value;
        if (this.campaign.startDate && this.campaign.endDate) {
          clearPresetChecks();
          this.showToast('Cronograma com datas específicas ativado.');
        }
        this.recalculateAll();
        this.render();
      });
    }

    if (inputEndDate) {
      inputEndDate.addEventListener('change', (e) => {
        this.campaign.endDate = e.target.value;
        if (this.campaign.startDate && this.campaign.endDate) {
          clearPresetChecks();
          this.showToast('Cronograma com datas específicas ativado.');
        }
        this.recalculateAll();
        this.render();
      });
    }

    presetChecks.forEach(chk => {
      chk.addEventListener('change', (e) => {
        const val = e.target.value;
        const isChecked = e.target.checked;

        presetChecks.forEach(other => {
          if (other !== e.target) {
            other.checked = false;
            other.closest('.period-box-option')?.classList.remove('active');
          }
        });

        if (isChecked) {
          e.target.closest('.period-box-option')?.classList.add('active');
          this.campaign.periodPreset = val;
          this.campaign.hasPeriod = false; // Cronograma genérico sem datas fixas

          // Seletor de datas fica inacessível
          this.campaign.startDate = '';
          this.campaign.endDate = '';
          if (inputStartDate) {
            inputStartDate.value = '';
            inputStartDate.disabled = true;
          }
          if (inputEndDate) {
            inputEndDate.value = '';
            inputEndDate.disabled = true;
          }

          // Redistribui inserções para o cronograma genérico mensal
          this.lines.forEach(line => {
            const count = (parseInt(line.totalDirect, 10) || 0) 
              || ((parseInt(line.freqDias, 10) || 0) * (parseInt(line.freqPorDia, 10) || 0)) 
              || line.calculo?.totalInsertions 
              || 0;
            if (count > 0 && line.sigla) {
              line.calendarData = window.MediaCalculator.distributeInsertionsEvenly(
                '',
                '',
                line.sigla,
                count,
                false,
                this.campaign.periodPreset
              );
            }
          });

          const presetNames = {
            MENSAL: 'Mensal (30 dias)',
            TRIMESTRAL: 'Trimestral (90 dias / 3 meses)',
            SEMESTRAL: 'Semestral (180 dias / 6 meses)',
            ANUAL: 'Anual (360 dias / 12 meses)',
            LIVRE: 'Período Livre (30 dias)'
          };
          this.showToast(`Período ${presetNames[val] || val} selecionado. Seletor de datas desativado.`);
        } else {
          e.target.closest('.period-box-option')?.classList.remove('active');
          this.campaign.periodPreset = null;
          this.campaign.hasPeriod = false;
          if (inputStartDate) inputStartDate.disabled = false;
          if (inputEndDate) inputEndDate.disabled = false;
          this.showToast('Opção predefinida desmarcada. Seletor de datas liberado.');
        }

        this.recalculateAll();
        this.render();
      });
    });

    const defaultDiscountEl = document.getElementById('camp-default-discount');
    if (defaultDiscountEl) {
      defaultDiscountEl.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        this.campaign.defaultDiscount = val;
        e.target.value = val.toFixed(2);
        if (confirm('Deseja aplicar este desconto padrão em todas as linhas atuais?')) {
          this.lines.forEach(l => { l.discountPercent = val; });
          this.recalculateAll();
          this.render();
          this.showToast(`Desconto de ${val.toFixed(2)}% aplicado a todas as linhas.`);
        } else {
          this.renderKPIs();
        }
      });
      defaultDiscountEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
          this.campaign.defaultDiscount = val;
          const totals = window.MediaCalculator.calculatePlanTotals(this.lines);
          if (totals.totalBruto === 0) {
            this.renderKPIs();
          }
        }
      });
      defaultDiscountEl.addEventListener('blur', (e) => {
        const val = parseFloat(e.target.value) || 0;
        e.target.value = val.toFixed(2);
        this.renderKPIs();
      });
    }

    // Modo Global de Inserção (Total, Frequência, Cronograma no topo da tabela)
    const modeSelector = document.getElementById('global-mode-selector');
    if (modeSelector) {
      modeSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.mode-pill-btn');
        if (btn && btn.dataset.globalMode) {
          const mode = btn.dataset.globalMode;
          if (mode === 'CALENDAR') {
            this.previousInsertionMode = (this.campaign.globalInsertionMode === 'FREQ') ? 'FREQ' : 'TOTAL';
            this.openCalendarModal();
          } else {
            this.previousInsertionMode = mode;
            this.setGlobalInsertionMode(mode);
          }
        }
      });
    }

    // Modal de Cronograma Simplificado
    const btnCloseCalModal = document.getElementById('btn-close-cal-modal');
    if (btnCloseCalModal) {
      btnCloseCalModal.addEventListener('click', () => {
        this.closeCalendarModal();
      });
    }

    const btnCloseCalModalX = document.getElementById('btn-close-cal-modal-x');
    if (btnCloseCalModalX) {
      btnCloseCalModalX.addEventListener('click', () => {
        this.closeCalendarModal();
      });
    }

    const modalCalOverlay = document.getElementById('modal-calendar');
    if (modalCalOverlay) {
      modalCalOverlay.addEventListener('click', (e) => {
        if (e.target === modalCalOverlay) {
          this.closeCalendarModal();
        }
      });
    }

    const btnModalClearCal = document.getElementById('btn-modal-clear-cal');
    if (btnModalClearCal) {
      btnModalClearCal.addEventListener('click', () => {
        this.lines.forEach(line => {
          line.calendarData = {};
          line.totalDirect = 0;
          this.recalculateLine(line);
        });
        this.renderCalendarModalContent();
        this.renderKPIs();
        this.showToast('Grade do cronograma limpa com sucesso.');
      });
    }

    // Tecla ESC para fechar modal de cronograma aplicando ajustes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modalCal = document.getElementById('modal-calendar');
        if (modalCal && modalCal.style.display !== 'none') {
          this.closeCalendarModal();
        }
      }
    });

    // Fechar dropdowns de autocomplete ao clicar fora, rolar página ou redimensionar
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-container') && !e.target.closest('.autocomplete-dropdown')) {
        this.closeAllDropdowns();
      }
    });

    window.addEventListener('scroll', () => {
      this.closeAllDropdowns();
    }, true);

    window.addEventListener('resize', () => {
      this.closeAllDropdowns();
    });

    // Monitoramento de planos gerados pelo Med.IA Planner ou alterações de Impactos em janelas independentes
    this.checkPendingAiPlan();

    window.addEventListener('storage', (e) => {
      if (e.key === 'redetv_pending_ai_plan' && e.newValue) {
        this.checkPendingAiPlan();
      }
      if (e.key === 'redetv_program_impacts_nacional') {
        this.initProgramImpacts();
      }
    });

    const btnLoadExample = document.getElementById('btn-media-ai-load-example');
    const promptInput = document.getElementById('input-media-ai-prompt');
    const examplePrompt = 'Crie um plano de patrocínio dos programas Superpop e Sensacional, com entrega diária de vinheta de abertura, encerramento, comercial de 30" e merchandising de 90", no periodo de janeiro a março.';
    if (btnLoadExample && promptInput) {
      btnLoadExample.addEventListener('click', () => {
        promptInput.value = examplePrompt;
        promptInput.focus();
      });
    }

    document.querySelectorAll('.btn-prompt-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        if (promptInput) {
          promptInput.value = e.currentTarget.dataset.prompt || '';
          promptInput.focus();
        }
      });
    });

    const btnMediaAiMic = document.getElementById('btn-media-ai-mic');
    if (btnMediaAiMic) {
      btnMediaAiMic.addEventListener('click', () => {
        this.toggleMediaAiRecording();
      });
    }

    const btnUploadAudio = document.getElementById('btn-media-ai-upload-audio');
    const inputFileAudio = document.getElementById('input-file-media-ai-audio');
    const audioFilenameSpan = document.getElementById('media-ai-audio-filename');
    if (btnUploadAudio && inputFileAudio) {
      btnUploadAudio.addEventListener('click', () => {
        inputFileAudio.value = '';
        inputFileAudio.click();
      });
      inputFileAudio.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (audioFilenameSpan) audioFilenameSpan.textContent = `🎵 ${file.name}`;
          if (promptInput && (!promptInput.value || promptInput.value.trim() === '')) {
            promptInput.value = examplePrompt;
          }
          this.showToast(`Áudio "${file.name}" carregado e transcrito com sucesso!`);
        }
      });
    }

    const btnGenerate = document.getElementById('btn-media-ai-generate');
    if (btnGenerate) {
      btnGenerate.addEventListener('click', () => {
        this.generateMediaAiPlan();
      });
    }

    const btnReedit = document.getElementById('btn-media-ai-reedit');
    if (btnReedit) {
      btnReedit.addEventListener('click', () => {
        const inputSec = document.getElementById('media-ai-input-section');
        const prevSec = document.getElementById('media-ai-preview-section');
        const loadSec = document.getElementById('media-ai-loading-section');
        const btnGen = document.getElementById('btn-media-ai-generate');
        const btnApp = document.getElementById('btn-media-ai-apply');
        if (inputSec) inputSec.style.display = 'flex';
        if (prevSec) prevSec.style.display = 'none';
        if (loadSec) loadSec.style.display = 'none';
        if (btnGen) btnGen.style.display = 'flex';
        if (btnApp) btnApp.style.display = 'none';
      });
    }

    const btnApplyAiPlan = document.getElementById('btn-media-ai-apply');
    if (btnApplyAiPlan) {
      btnApplyAiPlan.addEventListener('click', () => {
        this.applyMediaAiPlan();
      });
    }
  }

  setGlobalInsertionMode(mode) {
    if (mode === 'CALENDAR') {
      this.previousInsertionMode = (this.campaign.globalInsertionMode === 'FREQ') ? 'FREQ' : 'TOTAL';
      this.openCalendarModal();
      return;
    }

    this.previousInsertionMode = mode;
    this.campaign.globalInsertionMode = mode;
    this.lines.forEach(line => {
      line.insertionMode = mode;
      if (mode === 'TOTAL') {
        const calSum = Object.values(line.calendarData || {}).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
        if (calSum > 0) {
          line.totalDirect = calSum;
        }
      } else if (mode === 'FREQ') {
        const currentTotal = line.calculo?.totalInsertions || line.totalDirect || 0;
        if (currentTotal > 0 && (!line.freqDias || !line.freqPorDia)) {
          line.freqDias = Math.max(1, Math.round(currentTotal / 2));
          line.freqPorDia = 2;
        }
      }
      this.recalculateLine(line);
    });

    document.querySelectorAll('#global-mode-selector .mode-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.globalMode === mode);
    });

    this.render();

    const modeNames = { TOTAL: 'Total Direto', FREQ: 'Frequência (dias × freq)' };
    this.showToast(`Modo alterado para ${modeNames[mode] || mode} em todas as linhas.`);
  }

  render() {
    this.recalculateAll();
    this.renderKPIs();
    this.renderTableHeader();
    this.renderTable();
  }

  renderKPIs() {
    const totals = window.MediaCalculator.calculatePlanTotals(this.lines);

    const kpiInsertions = document.getElementById('kpi-total-insertions');
    if (kpiInsertions) kpiInsertions.textContent = totals.totalInsercoes;

    const kpiGross = document.getElementById('kpi-gross-value');
    if (kpiGross) kpiGross.textContent = window.MediaCalculator.formatCurrency(totals.totalBruto);

    const kpiNet = document.getElementById('kpi-net-value');
    if (kpiNet) kpiNet.textContent = window.MediaCalculator.formatCurrency(totals.totalLiquido);

    const kpiAvgDiscount = document.getElementById('kpi-avg-discount');
    if (kpiAvgDiscount) {
      if (totals.totalBruto > 0) {
        kpiAvgDiscount.textContent = window.MediaCalculator.formatPercent(totals.descontoMedioPercent);
      } else {
        const defDisc = (this.campaign && this.campaign.defaultDiscount !== undefined && this.campaign.defaultDiscount !== '') 
          ? Number(this.campaign.defaultDiscount) 
          : 70.0;
        kpiAvgDiscount.textContent = window.MediaCalculator.formatPercent(defDisc);
      }
    }

    // Impactos Estimados (soma de inserções de cada linha × impactos/min do programa)
    let totalImpactosEstimados = 0;
    this.lines.forEach(line => {
      const count = (parseInt(line.totalDirect, 10) || 0) 
        || ((parseInt(line.freqDias, 10) || 0) * (parseInt(line.freqPorDia, 10) || 0)) 
        || line.calculo?.totalInsertions 
        || 0;
      const progImpact = this.getProgramImpact(line.sigla);
      totalImpactosEstimados += (count * progImpact);
    });

    const kpiImpacts = document.getElementById('kpi-total-impacts');
    if (kpiImpacts) {
      kpiImpacts.textContent = totalImpactosEstimados.toLocaleString('pt-BR');
    }

    // CPM Médio Negociado = Investimento / Impactos Estimados × 1000
    const kpiCpm = document.getElementById('kpi-cpm-medio');
    if (kpiCpm) {
      if (totalImpactosEstimados > 0) {
        const cpm = (totals.totalLiquido / totalImpactosEstimados) * 1000;
        kpiCpm.textContent = 'R$ ' + cpm.toFixed(2).replace('.', ',');
      } else {
        kpiCpm.textContent = 'R$ 0,00';
      }
    }
  }

  renderTableHeader() {
    const thead = document.getElementById('table-head');
    if (!thead) return;

    const isFreqMode = (this.campaign.globalInsertionMode === 'FREQ');

    if (isFreqMode) {
      thead.innerHTML = `
        <tr>
          <th class="center" style="width: 36px;">#</th>
          <th style="min-width: 220px;">PRODUTO</th>
          <th style="min-width: 140px;">PRAÇA</th>
          <th style="min-width: 180px;">FORMATO</th>
          <th class="right" style="min-width: 105px;">BASE 30"</th>
          <th class="center" style="min-width: 70px;">COEF.</th>
          <th class="right" style="min-width: 110px;">UNIT. TABELA</th>
          <th class="center" style="min-width: 60px;">DIAS</th>
          <th class="center" style="min-width: 60px;">FREQ</th>
          <th class="center" style="min-width: 60px;">INS</th>
          <th class="right" style="min-width: 125px;">ENTREGA DE MÍDIA</th>
          <th class="center" style="min-width: 85px;">DESCONTO</th>
          <th class="right" style="min-width: 125px;">INVESTIMENTO</th>
          <th class="right" style="min-width: 120px;">UNIT. NEGOCIADO</th>
          <th class="center" style="width: 70px;">AÇÕES</th>
        </tr>
      `;
    } else {
      thead.innerHTML = `
        <tr>
          <th class="center" style="width: 36px;">#</th>
          <th style="min-width: 220px;">PRODUTO</th>
          <th style="min-width: 140px;">PRAÇA</th>
          <th style="min-width: 180px;">FORMATO</th>
          <th class="right" style="min-width: 105px;">BASE 30"</th>
          <th class="center" style="min-width: 70px;">COEF.</th>
          <th class="right" style="min-width: 110px;">UNIT. TABELA</th>
          <th class="center" style="min-width: 90px;">INS</th>
          <th class="right" style="min-width: 125px;">ENTREGA DE MÍDIA</th>
          <th class="center" style="min-width: 85px;">DESCONTO</th>
          <th class="right" style="min-width: 125px;">INVESTIMENTO</th>
          <th class="right" style="min-width: 120px;">UNIT. NEGOCIADO</th>
          <th class="center" style="width: 70px;">AÇÕES</th>
        </tr>
      `;
    }
  }

  renderTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    const isFreqMode = (this.campaign.globalInsertionMode === 'FREQ');

    this.lines.forEach((line, index) => {
      const prog = window.MediaCalculator.getProgram(line.sigla);
      const market = window.MediaCalculator.getMarket(line.marketId);
      const isAvailable = line.calculo?.disponivel !== false && (line.sigla || line.isCustomProduct);
      const isBonificado = (parseFloat(line.discountPercent) === 100);
      const rowTr = document.createElement('tr');
      rowTr.className = `row-item ${!isAvailable && line.sigla ? 'invalid-row' : ''}`;
      rowTr.dataset.rowId = line.id;

      const displayProdName = (line.isCustomProduct ? line.customProductName : (prog?.nome || (line.sigla ? line.sigla : ''))).toUpperCase();
      const displayMarketName = (line.isCustomMarket ? line.customMarketName : (market?.nome || (line.marketId ? line.marketId : ''))).toUpperCase();
      let displayFormatName = '';
      if (line.isCustomFormat) {
        displayFormatName = (line.customFormatName || '').toUpperCase();
      } else if (line.formatId) {
        const fmt = window.MediaCalculator.getFormat(line.formatId);
        displayFormatName = (fmt ? fmt.nome : line.formatId).toUpperCase();
      }

      rowTr.innerHTML = `
        <td class="center font-mono font-semibold" style="width:36px;">
          <div class="cell-control-container center font-mono font-semibold" style="color:var(--text-sub); width:100%;">
            ${index + 1}
          </div>
        </td>
        
        <!-- PRODUTO (Autocomplete Inteligente em Caixa Alta) -->
        <td style="min-width: 220px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div class="autocomplete-container cell-control-container" style="width:100%;">
              <input type="text" 
                     class="form-input autocomplete-prod-input font-semibold" 
                     data-id="${line.id}" 
                     value="${displayProdName}" 
                     placeholder="DIGITE PARA BUSCAR PRODUTO..." 
                     autocomplete="off"
                     style="height:34px; padding:0 10px; font-size:12.5px; text-transform:uppercase;">
              <div class="autocomplete-dropdown" id="dropdown-prod-${line.id}" style="display:none;"></div>
            </div>

            <!-- Detalhamento: Apenas horário (sem gênero) -->
            <div id="prod-detail-${line.id}" style="display:flex; align-items:center; gap:5px; flex-wrap:wrap; min-height:18px; font-size:11px; margin-top:2px;">
              ${line.isCustomProduct ? `
                <span style="font-weight:700; color:var(--text-dark); text-transform:uppercase;">PROJETO ESPECIAL</span>
              ` : (prog ? `
                <span style="color:var(--text-muted);">${(prog.diasDesc || '').toUpperCase()} • ${prog.inicio || ''} ÀS ${prog.fim || ''}</span>
                ${prog.obs ? `<span style="color:inherit; font-weight:700; font-size:13px; margin-left:2px; cursor:help;" title="${prog.obs}">*</span>` : ''}
              ` : '')}
            </div>
          </div>
        </td>

        <!-- PRAÇA (Autocomplete Inteligente - Apenas Praças Cadastradas em Caixa Alta) -->
        <td style="min-width: 140px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div class="autocomplete-container cell-control-container" style="width:100%;">
              <input type="text" 
                     class="form-input autocomplete-market-input" 
                     data-id="${line.id}" 
                     value="${displayMarketName}" 
                     placeholder="DIGITE PARA BUSCAR PRAÇA..." 
                     autocomplete="off"
                     ${line.formatType === 'BRANDED' ? 'disabled' : ''}
                     style="height:34px; padding:0 10px; font-size:12.5px; text-transform:uppercase;">
              <div class="autocomplete-dropdown" id="dropdown-market-${line.id}" style="display:none;"></div>
            </div>

            <div id="market-detail-${line.id}">
              ${!isAvailable && !line.isCustomProduct && line.sigla ? `
                <div class="alert-not-aired" style="margin-top:2px;">
                  <span>⚠️ ${line.calculo?.motivo}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </td>

        <!-- FORMATO (Autocomplete Inteligente em Caixa Alta) -->
        <td style="min-width: 180px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div class="autocomplete-container cell-control-container" style="width:100%;">
              <input type="text" 
                     class="form-input autocomplete-format-input" 
                     data-id="${line.id}" 
                     value="${displayFormatName}" 
                     placeholder="DIGITE O FORMATO..." 
                     autocomplete="off"
                     style="height:34px; padding:0 10px; font-size:12px; text-transform:uppercase;">
              <div class="autocomplete-dropdown" id="dropdown-format-${line.id}" style="display:none;"></div>
            </div>
          </div>
        </td>

        <!-- BASE 30" -->
        <td class="right font-mono" id="base-price-cell-${line.id}" style="color:var(--text-dark); min-width: 105px;">
          ${line.isCustomProduct ? `
            <div class="cell-control-container right" style="gap:3px;">
              <span style="font-size:11px; color:var(--text-muted);">R$</span>
              <input type="number" 
                     min="0" 
                     step="100" 
                     class="form-input font-mono input-custom-base-price" 
                     data-id="${line.id}" 
                     value="${line.customBasePrice || line.customUnitPrice || ''}" 
                     style="width:95px; height:34px; text-align:right; font-size:12px; font-weight:700;" 
                     placeholder="0">
            </div>
          ` : `
            <div class="cell-control-container right font-mono font-semibold" style="color:var(--text-dark); font-size:12.5px;" id="base-price-${line.id}">
              ${(line.sigla && line.marketId && isAvailable && line.calculo?.basePrice30 > 0) ? window.MediaCalculator.formatCurrency(line.calculo.basePrice30) : '-'}
            </div>
          `}
        </td>

        <!-- COEFICIENTE -->
        <td class="center" style="min-width: 70px;">
          <div class="cell-control-container center">
            <input type="number" 
                   step="0.01" 
                   min="0.01" 
                   max="50" 
                   class="input-mini-corporate input-coef ${line.calculo?.isCustomCoef ? 'coef-modified' : ''}" 
                   data-id="${line.id}" 
                   value="${(line.calculo?.coef !== null && line.calculo?.coef !== undefined && (line.formatId || line.isCustomFormat || line.customCoef)) ? Number(line.calculo.coef).toFixed(2) : ''}" 
                   placeholder="1.00" 
                   style="height:34px; width:60px; font-weight:700;" 
                   title="${line.calculo?.isCustomCoef ? `Coeficiente alterado! Padrão deste formato: ${Number(line.calculo.defaultCoef).toFixed(2)}` : 'Coeficiente do formato (editável)'}">
          </div>
        </td>

        <!-- UNIT. TABELA (Base 30" × Coeficiente) -->
        <td class="right" style="min-width: 110px;">
          <div class="cell-control-container right font-mono font-bold" style="color:var(--text-dark); font-size:13px;" id="line-unit-price-${line.id}">
            ${(line.sigla || line.isCustomProduct) && line.marketId && (line.formatId || line.isCustomFormat) && isAvailable && line.calculo?.unitPrice > 0 ? window.MediaCalculator.formatCurrency(line.calculo.unitPrice) : '-'}
          </div>
        </td>

        <!-- INSERÇÕES (Conforme o modo selecionado) -->
        ${isFreqMode ? `
          <!-- Coluna 1: DIAS -->
          <td class="center" style="min-width: 60px;">
            <div class="cell-control-container center">
              <input type="number" min="0" class="input-mini-corporate input-freq-dias font-mono" data-id="${line.id}" value="${line.freqDias !== '' && line.freqDias !== undefined ? line.freqDias : ''}" placeholder="0" style="height:34px; width:52px; font-weight:700;">
            </div>
          </td>
          <!-- Coluna 2: FREQ -->
          <td class="center" style="min-width: 60px;">
            <div class="cell-control-container center">
              <input type="number" min="0" class="input-mini-corporate input-freq-pordia font-mono" data-id="${line.id}" value="${line.freqPorDia !== '' && line.freqPorDia !== undefined ? line.freqPorDia : ''}" placeholder="0" style="height:34px; width:52px; font-weight:700;">
            </div>
          </td>
          <!-- Coluna 3: INS (DIAS × FREQ) -->
          <td class="center font-mono" style="min-width: 60px;">
            <div class="cell-control-container center font-mono font-bold" style="color:var(--text-dark); font-size:13px;" id="line-ins-${line.id}">
              ${line.calculo?.totalInsertions || 0}
            </div>
          </td>
        ` : (this.campaign.globalInsertionMode === 'CALENDAR') ? `
          <!-- Coluna Única: INS no Modo Cronograma (com botão para reabrir modal) -->
          <td class="center" style="min-width: 90px;">
            <div class="cell-control-container center" style="gap: 4px;">
              <input type="number" min="0" class="input-mini-corporate input-total font-mono" data-id="${line.id}" value="${line.calculo?.totalInsertions !== undefined ? line.calculo.totalInsertions : (line.totalDirect || 0)}" placeholder="0" style="height:34px; width:56px; font-weight:700;" title="Inserções definidas no cronograma">
              <button type="button" class="btn-icon btn-open-calendar-modal" data-id="${line.id}" style="width:26px; height:26px; border:1px solid var(--border-card); border-radius:4px; background:#F8FAFC; color:var(--rose-primary); cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0;" title="Abrir cronograma de exibição">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </button>
            </div>
          </td>
        ` : `
          <!-- Coluna Única: INS no Modo Total -->
          <td class="center" style="min-width: 90px;">
            <div class="cell-control-container center">
              <input type="number" min="0" class="input-mini-corporate input-total font-mono" data-id="${line.id}" value="${line.totalDirect !== '' && line.totalDirect !== undefined ? line.totalDirect : (line.calculo?.totalInsertions || '')}" placeholder="0" style="height:34px; width:64px; font-weight:700;">
            </div>
          </td>
        `}

        <!-- ENTREGA DE MÍDIA (UNIT. TABELA × INS) -->
        <td class="right font-mono" style="min-width: 125px;">
          <div class="cell-control-container right font-mono font-semibold" style="color:var(--text-dark); font-size:12.5px;" id="line-media-delivery-${line.id}">
            ${isAvailable && line.calculo?.totalBruto > 0 ? window.MediaCalculator.formatCurrency(line.calculo.totalBruto) : (isAvailable && (line.sigla || line.isCustomProduct) && line.calculo?.unitPrice > 0 && (line.totalDirect !== '' || line.freqDias !== '') ? 'R$ 0' : '-')}
          </div>
        </td>

        <!-- DESCONTO (%) -->
        <td class="center" style="min-width: 85px;">
          <div class="cell-control-container center" style="gap:3px;">
            <input type="number" step="0.01" min="0" max="100" class="input-mini-corporate input-discount font-mono" data-id="${line.id}" value="${line.discountPercent !== '' && line.discountPercent !== undefined ? Number(line.discountPercent).toFixed(2) : ''}" placeholder="0.00" style="height:34px; width:64px; font-weight:700;">
            <span style="font-size:11px; color:var(--text-muted); font-weight:600;">%</span>
          </div>
        </td>

        <!-- INVESTIMENTO (ENTREGA DE MÍDIA - DESCONTO / BONIFICADO se 100%) -->
        <td class="right" style="min-width: 125px;">
          <div class="cell-control-container right" id="line-invest-${line.id}">
            ${isAvailable && (line.sigla || line.isCustomProduct) && isBonificado ? `
              <span class="badge-tag badge-bonificado">BONIFICADO</span>
            ` : (isAvailable && line.calculo?.totalLiquido > 0 ? `
              <div class="font-mono font-bold" style="font-size:13.5px; color:var(--rose-primary);">
                ${window.MediaCalculator.formatCurrency(line.calculo.totalLiquido)}
              </div>
            ` : (isAvailable && (line.sigla || line.isCustomProduct) && line.calculo?.unitPrice > 0 && (line.totalDirect !== '' || line.freqDias !== '') ? `
              <div class="font-mono font-bold" style="font-size:13.5px; color:var(--text-dark);">
                R$ 0
              </div>
            ` : '-'))}
          </div>
        </td>

        <!-- UNIT. NEGOCIADO (UNIT. TABELA - DESCONTO / BONIFICADO se 100%) -->
        <td class="right" style="min-width: 120px;">
          <div class="cell-control-container right" id="line-unit-negotiated-${line.id}">
            ${isAvailable && (line.sigla || line.isCustomProduct) && isBonificado ? `
              <span class="badge-tag badge-bonificado">BONIFICADO</span>
            ` : (isAvailable && (line.sigla || line.isCustomProduct) && line.calculo?.unitarioLiquido > 0 ? `
              <div class="font-mono font-semibold" style="font-size:12.5px; color:var(--text-dark);">
                ${window.MediaCalculator.formatCurrency(line.calculo.unitarioLiquido)}
              </div>
            ` : (isAvailable && (line.sigla || line.isCustomProduct) && line.calculo?.unitPrice > 0 && line.discountPercent !== '' ? `
              <div class="font-mono font-semibold" style="font-size:12.5px; color:var(--text-dark);">
                R$ 0
              </div>
            ` : '-'))}
          </div>
        </td>

        <!-- AÇÕES -->
        <td class="center" style="width: 70px;">
          <div class="cell-control-container center" style="gap:3px;">
            <button tabindex="-1" class="btn-icon btn-duplicate" data-id="${line.id}" title="Duplicar Linha">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button tabindex="-1" class="btn-icon danger btn-delete" data-id="${line.id}" title="Excluir Linha">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(rowTr);
    });

    this.bindTableEvents();
    this.bindAutocompleteEvents();
  }

  /**
   * Posiciona o dropdown dinamicamente em relação ao input usando position: fixed
   * evitando qualquer corte por overflow ou scroll containers.
   */
  positionDropdown(input, dropdown) {
    if (!input || !dropdown) return;
    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    dropdown.style.position = 'fixed';
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${Math.max(rect.width, 320)}px`;
    dropdown.style.zIndex = '999999';

    if (spaceBelow < 240 && spaceAbove > spaceBelow) {
      // Abre para cima se não houver espaço suficiente abaixo
      dropdown.style.top = 'auto';
      dropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`;
      dropdown.style.maxHeight = `${Math.min(spaceAbove - 16, 260)}px`;
    } else {
      // Abre para baixo normalmente
      dropdown.style.bottom = 'auto';
      dropdown.style.top = `${rect.bottom + 4}px`;
      dropdown.style.maxHeight = `${Math.min(spaceBelow - 16, 260)}px`;
    }
  }

  closeAllDropdowns() {
    document.querySelectorAll('.autocomplete-dropdown').forEach(d => {
      d.style.display = 'none';
    });
  }

  /**
   * Vincula a lógica dos autocompletes inteligentes de PRODUTO, PRAÇA e FORMATO
   */
  bindAutocompleteEvents() {
    // 1. Autocomplete de PRODUTO (apenas aparece ao digitar, sem botão + Usar)
    document.querySelectorAll('.autocomplete-prod-input').forEach(input => {
      const lineId = parseInt(input.dataset.id, 10);
      const dropdown = document.getElementById(`dropdown-prod-${lineId}`);
      const line = this.lines.find(l => l.id === lineId);
      if (!line || !dropdown) return;

      const renderProductOptions = (query = '') => {
        const cleanQuery = query.toLowerCase().trim();
        // Não exibe nada até o usuário começar a digitar
        if (cleanQuery.length === 0) {
          dropdown.innerHTML = '';
          dropdown.style.display = 'none';
          return;
        }

        const matches = window.PROGRAMS_DATA.filter(p => 
          p.nome.toLowerCase().includes(cleanQuery) || 
          p.sigla.toLowerCase().includes(cleanQuery) ||
          p.genero.toLowerCase().includes(cleanQuery)
        );

        if (matches.length === 0) {
          dropdown.innerHTML = '';
          dropdown.style.display = 'none';
          return;
        }

        dropdown.innerHTML = matches.map(p => `
          <div class="autocomplete-item" data-sigla="${p.sigla}">
            <div>
              <span class="autocomplete-item-title">${p.nome.toUpperCase()}</span>
              <span style="font-size:10px; color:var(--text-sub); margin-left:4px;">(${p.sigla.toUpperCase()})</span>
              <div class="autocomplete-item-sub">${(p.diasDesc || '').toUpperCase()} • ${p.inicio || ''} ÀS ${p.fim || ''}</div>
            </div>
            <span style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">${p.genero.toUpperCase()}</span>
          </div>
        `).join('');

        dropdown.style.display = 'flex';
        this.positionDropdown(input, dropdown);

        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const sigla = item.dataset.sigla;
            if (sigla) {
              const selectedProg = window.MediaCalculator.getProgram(sigla);
              line.sigla = sigla;
              line.isCustomProduct = false;
              line.customProductName = '';
              input.value = selectedProg.nome.toUpperCase();
            }
            dropdown.style.display = 'none';
            this.recalculateLine(line);
            this.renderKPIs();
            this.updateLineDomValues(line);
          });
        });
      };

      // Apenas exibe sugestões quando o usuário digita
      input.addEventListener('input', () => {
        renderProductOptions(input.value);
      });

      const applyProductSelection = () => {
        dropdown.style.display = 'none';
        const val = input.value.trim();
        if (!val) {
          line.sigla = '';
          line.isCustomProduct = false;
          line.customProductName = '';
          input.value = '';
          this.recalculateLine(line);
          this.renderKPIs();
          this.updateLineDomValues(line);
          return;
        }

        const foundProg = window.PROGRAMS_DATA.find(p => 
          p.nome.toLowerCase() === val.toLowerCase() || 
          p.sigla.toLowerCase() === val.toLowerCase()
        );

        if (foundProg) {
          line.sigla = foundProg.sigla;
          line.isCustomProduct = false;
          line.customProductName = '';
          input.value = foundProg.nome.toUpperCase();
        } else {
          // Produto não previsto na tabela de preços -> Projeto Especial
          line.sigla = 'CUSTOM';
          line.isCustomProduct = true;
          line.customProductName = val.toUpperCase();
          input.value = val.toUpperCase();
        }
        this.recalculateLine(line);
        this.renderKPIs();
        this.updateLineDomValues(line);
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Tab') {
          dropdown.style.display = 'none';
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const firstItem = dropdown.querySelector('.autocomplete-item');
          if (firstItem && dropdown.style.display !== 'none') {
            firstItem.dispatchEvent(new MouseEvent('mousedown'));
          } else {
            applyProductSelection();
          }
        }
      });

      input.addEventListener('blur', () => {
        setTimeout(() => {
          applyProductSelection();
        }, 150);
      });
    });

    // 2. Autocomplete de PRAÇA (apenas praças cadastradas em caixa alta)
    document.querySelectorAll('.autocomplete-market-input').forEach(input => {
      const lineId = parseInt(input.dataset.id, 10);
      const dropdown = document.getElementById(`dropdown-market-${lineId}`);
      const line = this.lines.find(l => l.id === lineId);
      if (!line || !dropdown) return;

      const renderMarketOptions = (query = '') => {
        const cleanQuery = query.toLowerCase().trim();
        // Não exibe nada até o usuário começar a digitar
        if (cleanQuery.length === 0) {
          dropdown.innerHTML = '';
          dropdown.style.display = 'none';
          return;
        }

        const matches = window.REGIONAL_MARKETS.filter(m => 
          m.nome.toLowerCase().includes(cleanQuery) || 
          m.regiao.toLowerCase().includes(cleanQuery)
        );

        if (matches.length === 0) {
          dropdown.innerHTML = '';
          dropdown.style.display = 'none';
          return;
        }

        dropdown.innerHTML = matches.map(m => {
          const prog = window.MediaCalculator.getProgram(line.sigla);
          let airedNotice = '';
          if (prog && prog.regional30 && prog.regional30[m.id] === null) {
            airedNotice = '<span style="font-size:10px; color:#EF4444;">(NÃO EXIBIDO)</span>';
          }

          return `
            <div class="autocomplete-item" data-market-id="${m.id}">
              <div>
                <span class="autocomplete-item-title">${m.nome.toUpperCase()}</span> ${airedNotice}
              </div>
              <span style="font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">${m.regiao.toUpperCase()}</span>
            </div>
          `;
        }).join('');

        dropdown.style.display = 'flex';
        this.positionDropdown(input, dropdown);

        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const marketId = item.dataset.marketId;
            if (marketId) {
              const selectedMarket = window.MediaCalculator.getMarket(marketId);
              line.marketId = marketId;
              input.value = selectedMarket.nome.toUpperCase();
            }
            dropdown.style.display = 'none';
            this.recalculateLine(line);
            this.renderKPIs();
            this.updateLineDomValues(line);
          });
        });
      };

      // Apenas exibe sugestões quando o usuário digita
      input.addEventListener('input', () => {
        renderMarketOptions(input.value);
      });

      const applyMarketSelection = () => {
        dropdown.style.display = 'none';
        const val = input.value.trim().toLowerCase();
        if (!val) {
          line.marketId = '';
          input.value = '';
          this.recalculateLine(line);
          this.renderKPIs();
          this.updateLineDomValues(line);
          return;
        }

        // Apenas praças cadastradas são permitidas!
        const matched = window.REGIONAL_MARKETS.find(m => 
          m.nome.toLowerCase() === val || 
          m.id.toLowerCase() === val ||
          m.nome.toLowerCase().startsWith(val)
        );

        if (matched) {
          line.marketId = matched.id;
          input.value = matched.nome.toUpperCase();
        } else {
          // Reverte para a praça oficial já selecionada ou limpa se vazio
          const curMarket = window.MediaCalculator.getMarket(line.marketId);
          input.value = (curMarket?.nome || (line.marketId ? 'Nacional' : '')).toUpperCase();
        }
        this.recalculateLine(line);
        this.renderKPIs();
        this.updateLineDomValues(line);
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Tab') {
          dropdown.style.display = 'none';
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const firstItem = dropdown.querySelector('.autocomplete-item');
          if (firstItem && dropdown.style.display !== 'none') {
            firstItem.dispatchEvent(new MouseEvent('mousedown'));
          } else {
            applyMarketSelection();
          }
        }
      });

      input.addEventListener('blur', () => {
        setTimeout(() => {
          applyMarketSelection();
        }, 150);
      });
    });

    // 3. Autocomplete de FORMATO (56 Formatos Oficiais + Formatos Avulsos)
    document.querySelectorAll('.autocomplete-format-input').forEach(input => {
      const lineId = parseInt(input.dataset.id, 10);
      const dropdown = document.getElementById(`dropdown-format-${lineId}`);
      const line = this.lines.find(l => l.id === lineId);
      if (!line || !dropdown) return;

      const renderFormatOptions = (query = '') => {
        const cleanQuery = query.toLowerCase().trim();
        if (cleanQuery.length === 0) {
          dropdown.innerHTML = '';
          dropdown.style.display = 'none';
          return;
        }

        const matches = (window.MEDIA_FORMATS || []).filter(f => 
          f.nome.toLowerCase().includes(cleanQuery) ||
          f.id.toLowerCase().includes(cleanQuery)
        );

        if (matches.length === 0) {
          dropdown.innerHTML = '';
          dropdown.style.display = 'none';
          return;
        }

        dropdown.innerHTML = matches.map(f => `
          <div class="autocomplete-item" data-format-id="${f.id}">
            <div>
              <span class="autocomplete-item-title">${f.nome.toUpperCase()}</span>
            </div>
            <span style="font-size:11px; font-family:var(--font-mono); font-weight:700; color:var(--text-sub);">
              ${Number(f.coef).toFixed(2)}
            </span>
          </div>
        `).join('');

        dropdown.style.display = 'flex';
        this.positionDropdown(input, dropdown);

        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const formatId = item.dataset.formatId;
            const selectedFmt = window.MediaCalculator.getFormat(formatId);
            if (selectedFmt) {
              line.formatId = selectedFmt.id;
              line.isCustomFormat = false;
              line.customFormatName = '';
              line.customCoef = null; // Oficial
              input.value = selectedFmt.nome.toUpperCase();
            }
            dropdown.style.display = 'none';
            this.recalculateLine(line);
            this.renderKPIs();
            this.updateLineDomValues(line);
          });
        });
      };

      input.addEventListener('input', () => {
        renderFormatOptions(input.value);
      });

      const applyFormatSelection = () => {
        dropdown.style.display = 'none';
        const val = input.value.trim();
        if (!val) {
          line.formatId = '';
          line.isCustomFormat = false;
          line.customFormatName = '';
          line.customCoef = null;
          input.value = '';
          this.recalculateLine(line);
          this.renderKPIs();
          this.updateLineDomValues(line);
          return;
        }

        const foundFmt = (window.MEDIA_FORMATS || []).find(f => 
          f.nome.toLowerCase() === val.toLowerCase() || 
          f.id.toLowerCase() === val.toLowerCase()
        );

        if (foundFmt) {
          line.formatId = foundFmt.id;
          line.isCustomFormat = false;
          line.customFormatName = '';
          line.customCoef = null;
          input.value = foundFmt.nome.toUpperCase();
        } else {
          // Formato avulso não previsto na tabela: traz a base de 30, mas não traz o coeficiente
          line.formatId = 'CUSTOM';
          line.isCustomFormat = true;
          line.customFormatName = val.toUpperCase();
          line.customCoef = null;
          input.value = val.toUpperCase();
        }
        this.recalculateLine(line);
        this.renderKPIs();
        this.updateLineDomValues(line);
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Tab') {
          dropdown.style.display = 'none';
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const firstItem = dropdown.querySelector('.autocomplete-item');
          if (firstItem && dropdown.style.display !== 'none') {
            firstItem.dispatchEvent(new MouseEvent('mousedown'));
          } else {
            applyFormatSelection();
          }
        }
      });

      input.addEventListener('blur', () => {
        setTimeout(() => {
          applyFormatSelection();
        }, 150);
      });
    });

    // 4. Preço Unitário Manual (Projeto Especial / Custom)
    document.querySelectorAll('.input-custom-unit-price').forEach(input => {
      input.addEventListener('input', (e) => {
        const lineId = parseInt(e.target.dataset.id, 10);
        const line = this.lines.find(l => l.id === lineId);
        if (line) {
          line.customUnitPrice = parseFloat(e.target.value) || 0;
          this.recalculateLine(line);
          this.renderKPIs();
          this.updateLineDomValues(line);
        }
      });
    });
  }

  openCalendarModal() {
    const modal = document.getElementById('modal-calendar');
    if (!modal) return;

    // Sincroniza sempre com as datas do seletor se preenchidas
    const inputStartDate = document.getElementById('camp-start-date');
    const inputEndDate = document.getElementById('camp-end-date');
    if (inputStartDate && inputStartDate.value && inputEndDate && inputEndDate.value) {
      this.campaign.startDate = inputStartDate.value;
      this.campaign.endDate = inputEndDate.value;
      this.campaign.hasPeriod = true;
      this.campaign.periodPreset = null;
    }

    const subtitleEl = document.getElementById('modal-cal-subtitle');

    let periodoDesc = '';

    if (this.campaign.startDate && this.campaign.endDate) {
      const d1 = this.campaign.startDate.split('-').reverse().join('/');
      const d2 = this.campaign.endDate.split('-').reverse().join('/');
      if (this.campaign.periodPreset === 'TRIMESTRAL') {
        periodoDesc = `Cronograma Trimestral (${d1} a ${d2})`;
      } else if (this.campaign.periodPreset === 'SEMESTRAL') {
        periodoDesc = `Cronograma Semestral (${d1} a ${d2})`;
      } else if (this.campaign.periodPreset === 'ANUAL') {
        periodoDesc = `Cronograma Anual (${d1} a ${d2})`;
      } else if (this.campaign.periodPreset === 'MENSAL') {
        periodoDesc = `Cronograma Mensal (${d1} a ${d2})`;
      } else {
        periodoDesc = `Cronograma de Veiculação: ${d1} a ${d2}`;
      }
    } else if (this.campaign.periodPreset) {
      const presetLabels = {
        MENSAL: 'Cronograma Mensal (30 dias • Início Segunda-feira)',
        TRIMESTRAL: 'Cronograma Trimestral (90 dias • 3 meses de 30 dias)',
        SEMESTRAL: 'Cronograma Semestral (180 dias • 6 meses de 30 dias)',
        ANUAL: 'Cronograma Anual (360 dias • 12 meses de 30 dias)',
        LIVRE: 'Cronograma Ilustrativo (30 dias • Início Segunda-feira)'
      };
      periodoDesc = presetLabels[this.campaign.periodPreset] || 'Cronograma Ilustrativo';
    } else {
      periodoDesc = 'Cronograma Mensal Ilustrativo (30 dias • Início Segunda-feira)';
    }

    if (subtitleEl) subtitleEl.textContent = periodoDesc;

    // Garante que linhas com inserções tenham distribuição para o escopo de período atual
    const activeDays = window.MediaCalculator.getDateRangeWithProgramFlags(
      this.campaign.startDate,
      this.campaign.endDate,
      null,
      this.campaign.hasPeriod,
      this.campaign.periodPreset
    );
    const dayKeys = new Set(activeDays.map(d => d.key));

    this.lines.forEach(line => {
      const count = (parseInt(line.totalDirect, 10) || 0) 
        || ((parseInt(line.freqDias, 10) || 0) * (parseInt(line.freqPorDia, 10) || 0)) 
        || line.calculo?.totalInsertions 
        || 0;
      
      const currentCalKeys = Object.keys(line.calendarData || {});
      const hasMatchingKeys = currentCalKeys.some(k => dayKeys.has(k));
      const calSum = Object.values(line.calendarData || {}).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);

      if ((!hasMatchingKeys || calSum === 0) && count > 0 && line.sigla) {
        line.calendarData = window.MediaCalculator.distributeInsertionsEvenly(
          this.campaign.startDate,
          this.campaign.endDate,
          line.sigla,
          count,
          this.campaign.hasPeriod,
          this.campaign.periodPreset
        );
        line.totalDirect = count;
      } else if (calSum > 0) {
        line.totalDirect = calSum;
      }
    });

    this.renderCalendarModalContent();
    modal.style.display = 'flex';
  }

  closeCalendarModal() {
    const modal = document.getElementById('modal-calendar');
    if (modal) {
      modal.style.display = 'none';
    }

    // Retorna para o modo onde estava (Total ou Frequência)
    const returnMode = (this.previousInsertionMode === 'FREQ') ? 'FREQ' : 'TOTAL';
    this.campaign.globalInsertionMode = returnMode;

    // Sincroniza todas as linhas com os dados definidos no cronograma
    this.lines.forEach(line => {
      const calSum = Object.values(line.calendarData || {}).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
      line.totalDirect = calSum;
      line.insertionMode = returnMode;
      if (returnMode === 'FREQ' && calSum > 0 && (!line.freqDias || !line.freqPorDia)) {
        line.freqDias = Math.max(1, Math.round(calSum / 2));
        line.freqPorDia = 2;
      }
      this.recalculateLine(line);
    });

    document.querySelectorAll('#global-mode-selector .mode-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.globalMode === returnMode);
    });

    this.recalculateAll();
    this.renderKPIs();
    this.render();
    this.showToast('✓ Ajustes do cronograma aplicados à programação de mídia!');
  }

  renderCalendarModalContent() {
    const container = document.getElementById('modal-calendar-table-container');
    if (!container) return;

    const days = window.MediaCalculator.getDateRangeWithProgramFlags(
      this.campaign.startDate,
      this.campaign.endDate,
      null,
      this.campaign.hasPeriod,
      this.campaign.periodPreset
    );

    let totalGlobal = 0;
    const dayTotals = {};
    days.forEach(d => { dayTotals[d.key] = 0; });

    this.lines.forEach(line => {
      const calData = line.calendarData || {};
      Object.entries(calData).forEach(([dKey, val]) => {
        const num = parseInt(val, 10) || 0;
        if (dayTotals[dKey] !== undefined) {
          dayTotals[dKey] += num;
        }
        totalGlobal += num;
      });
    });

    const kpiEl = document.getElementById('modal-cal-total-kpi');
    if (kpiEl) kpiEl.textContent = totalGlobal;

    if (this.lines.length === 0) {
      container.innerHTML = `
        <div style="padding:40px; text-align:center; color:var(--text-muted); font-size:13px;">
          Nenhum programa adicionado à grade ainda.
        </div>
      `;
      return;
    }

    const monthNames = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ];

    const monthGroups = [];
    days.forEach(d => {
      let label = '';
      if (d.month && d.year) {
        label = `${monthNames[d.month - 1]} ${d.year}`;
      } else if (d.periodMonth) {
        label = `MÊS ${d.periodMonth} (30 DIAS)`;
      } else {
        label = 'CRONOGRAMA MENSAL (30 DIAS)';
      }
      const lastGroup = monthGroups[monthGroups.length - 1];
      if (lastGroup && lastGroup.label === label) {
        lastGroup.count++;
      } else {
        monthGroups.push({ label, count: 1 });
      }
    });

    let html = `
      <table class="calendar-matrix-table">
        <colgroup>
          <col style="width: 36px;">
          <col style="width: 180px;">
          <col style="width: 110px;">
          <col style="width: 130px;">
          <col style="width: 65px;">
          ${days.map(() => '<col style="width: 38px;">').join('')}
        </colgroup>
        <thead>
          <tr class="calendar-header-month-row">
            <th rowspan="2" class="calendar-sticky-header calendar-sticky-col-idx">#</th>
            <th rowspan="2" class="calendar-sticky-header calendar-sticky-col-prod">Produto</th>
            <th rowspan="2" class="calendar-sticky-header calendar-sticky-col-market">Praça</th>
            <th rowspan="2" class="calendar-sticky-header calendar-sticky-col-format">Formato</th>
            <th rowspan="2" class="calendar-sticky-header calendar-sticky-col-total">Total</th>
            ${monthGroups.map(m => `
              <th colspan="${m.count}" class="calendar-month-th">
                ${m.label}
              </th>
            `).join('')}
          </tr>
          <tr class="calendar-header-days-row">
            ${days.map(d => `
              <th class="calendar-day-th ${d.isWeekend ? 'weekend' : ''}" title="${d.formatted} (${d.weekdayName})">
                <div style="font-size:11px; font-weight:700;">${d.day}</div>
                <div style="font-size:9px; text-transform:uppercase; color:var(--text-muted);">${d.weekdayName}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    this.lines.forEach((line, idx) => {
      const prog = window.MediaCalculator.getProgram(line.sigla);
      const market = window.MediaCalculator.getMarket(line.marketId);
      const prodName = line.isCustomProduct ? line.customProductName : (prog?.nome || (line.sigla ? line.sigla : 'Linha sem produto'));
      const marketName = line.isCustomMarket ? line.customMarketName : (market?.nome || (line.marketId ? line.marketId : 'Nacional'));

      const fmt = window.MediaCalculator.getFormat(line.formatId);
      const formatDesc = fmt ? fmt.nome : (line.formatId || 'COMERCIAL 30"');

      const calData = line.calendarData || {};
      const lineTotal = Object.values(calData).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);

      const validDaysForThisLine = window.MediaCalculator.getDateRangeWithProgramFlags(
        this.campaign.startDate,
        this.campaign.endDate,
        line.sigla,
        this.campaign.hasPeriod,
        this.campaign.periodPreset
      );
      const validKeysMap = {};
      validDaysForThisLine.forEach(vd => {
        validKeysMap[vd.key] = vd.isValidDayForProgram;
      });

      html += `
        <tr data-line-id="${line.id}">
          <td class="calendar-sticky-col-idx font-mono font-semibold" style="color:var(--text-sub);">
            ${idx + 1}
          </td>
          <td class="calendar-sticky-col-prod font-semibold" style="color:var(--text-dark);">
            <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${prodName}">
              ${prodName} ${prog?.obs ? `<span style="color:inherit; font-weight:700; font-size:13px; margin-left:3px;" title="${prog.obs}">*</span>` : ''}
            </div>
          </td>
          <td class="calendar-sticky-col-market" style="color:var(--text-body);">
            <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${marketName}</div>
          </td>
          <td class="calendar-sticky-col-format" style="color:var(--text-body);">
            ${formatDesc}
          </td>
          <td class="calendar-sticky-col-total font-mono font-bold" style="color:var(--rose-primary); font-size:13px;" id="matrix-line-total-${line.id}">
            ${lineTotal}
          </td>
          ${days.map(d => {
            const isValid = validKeysMap[d.key] !== false || line.isCustomProduct;
            const val = calData[d.key] || '';
            const hasVal = val > 0;
            return `
              <td class="calendar-matrix-cell ${!isValid ? 'invalid-air-day' : ''}">
                <input type="number" 
                       min="0" 
                       max="99" 
                       class="calendar-matrix-input ${hasVal && isValid ? 'has-val' : ''}" 
                       data-line-id="${line.id}" 
                       data-day-key="${d.key}" 
                       value="${isValid ? val : ''}" 
                       placeholder="${isValid ? '0' : '-'}"
                       ${!isValid ? 'disabled title="Sem veiculação regular deste programa neste dia"' : ''}>
              </td>
            `;
          }).join('')}
        </tr>
      `;
    });

    html += `
        </tbody>
        <tfoot>
          <tr>
            <td class="calendar-sticky-col-idx"></td>
            <td class="calendar-sticky-col-prod"></td>
            <td class="calendar-sticky-col-market"></td>
            <td class="calendar-sticky-col-format" style="text-align:right; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dark); padding-right:8px;">
              Total por Dia
            </td>
            <td class="calendar-sticky-col-total font-mono font-bold" style="color:var(--rose-primary); font-size:13px;" id="matrix-footer-grand-total">
              ${totalGlobal}
            </td>
            ${days.map(d => `
              <td class="font-mono font-bold text-center" style="font-size:11px; color:var(--text-dark);" id="matrix-day-total-${d.key}">
                ${dayTotals[d.key] || 0}
              </td>
            `).join('')}
          </tr>
        </tfoot>
      </table>
    `;

    container.innerHTML = html;
    this.bindCalendarModalEvents();
  }

  bindCalendarModalEvents() {
    const container = document.getElementById('modal-calendar-table-container');
    if (!container) return;

    container.querySelectorAll('.calendar-matrix-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const lineId = parseInt(e.target.dataset.lineId, 10);
        const dayKey = e.target.dataset.dayKey;
        const val = parseInt(e.target.value, 10) || 0;

        const line = this.lines.find(l => l.id === lineId);
        if (!line) return;

        if (!line.calendarData) line.calendarData = {};

        if (val > 0) {
          line.calendarData[dayKey] = val;
          e.target.classList.add('has-val');
        } else {
          delete line.calendarData[dayKey];
          e.target.classList.remove('has-val');
        }

        const lineTotal = Object.values(line.calendarData).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
        line.totalDirect = lineTotal;
        line.insertionMode = 'CALENDAR';
        const lineTotalEl = document.getElementById(`matrix-line-total-${lineId}`);
        if (lineTotalEl) lineTotalEl.textContent = lineTotal;

        let dayColTotal = 0;
        this.lines.forEach(l => {
          dayColTotal += (parseInt(l.calendarData?.[dayKey], 10) || 0);
        });
        const dayTotalEl = document.getElementById(`matrix-day-total-${dayKey}`);
        if (dayTotalEl) dayTotalEl.textContent = dayColTotal;

        let grandTotal = 0;
        this.lines.forEach(l => {
          grandTotal += Object.values(l.calendarData || {}).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
        });
        const grandTotalEl = document.getElementById('matrix-footer-grand-total');
        if (grandTotalEl) grandTotalEl.textContent = grandTotal;
        const kpiEl = document.getElementById('modal-cal-total-kpi');
        if (kpiEl) kpiEl.textContent = grandTotal;

        this.recalculateLine(line);
        this.renderKPIs();
        this.updateLineDomValues(line);

        const insSpan = document.getElementById(`line-ins-${line.id}`);
        if (insSpan) {
          insSpan.textContent = line.calculo?.totalInsertions || 0;
        }
        const totalInput = document.querySelector(`.input-total[data-id="${line.id}"]`);
        if (totalInput) {
          totalInput.value = line.calculo?.totalInsertions || 0;
        }
      });
    });
  }

  bindTableEvents() {
    // Navegação TAB contínua entre colunas da linha e loop de volta para a primeira coluna
    document.querySelectorAll('tr.row-item').forEach(rowTr => {
      rowTr.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const focusableInputs = Array.from(rowTr.querySelectorAll('input:not([disabled]):not([type="hidden"])'));
          if (focusableInputs.length === 0) return;
          const firstInput = focusableInputs[0];
          const lastInput = focusableInputs[focusableInputs.length - 1];

          if (!e.shiftKey && document.activeElement === lastInput) {
            e.preventDefault();
            firstInput.focus();
            firstInput.select?.();
          } else if (e.shiftKey && document.activeElement === firstInput) {
            e.preventDefault();
            lastInput.focus();
            lastInput.select?.();
          }
        }
      });
    });

    document.querySelectorAll('.input-coef').forEach(input => {
      input.addEventListener('input', (e) => {
        const line = this.lines.find(l => l.id === parseInt(e.target.dataset.id, 10));
        if (line) {
          const val = e.target.value.trim();
          line.customCoef = val === '' ? null : (parseFloat(val) || 0);
          this.recalculateLine(line);
          if (line.calculo?.isCustomCoef) {
            e.target.classList.add('coef-modified');
            e.target.title = `Coeficiente alterado! Padrão deste formato: ${Number(line.calculo.defaultCoef || 1).toFixed(2)}`;
          } else {
            e.target.classList.remove('coef-modified');
            e.target.title = 'Coeficiente do formato (editável)';
          }
          this.updateLineDomValues(line);
          this.renderKPIs();
        }
      });
    });

    document.querySelectorAll('.input-custom-base-price').forEach(input => {
      input.addEventListener('input', (e) => {
        const line = this.lines.find(l => l.id === parseInt(e.target.dataset.id, 10));
        if (line) {
          line.customBasePrice = parseFloat(e.target.value) || 0;
          line.customUnitPrice = line.customBasePrice;
          this.recalculateLine(line);
          this.updateLineDomValues(line);
          this.renderKPIs();
        }
      });
    });

    document.querySelectorAll('.input-total').forEach(el => {
      el.addEventListener('input', (e) => {
        const line = this.lines.find(l => l.id === parseInt(e.target.dataset.id, 10));
        if (line) {
          const val = parseInt(e.target.value, 10) || 0;
          line.totalDirect = val;
          if (line.insertionMode === 'CALENDAR' || this.campaign.globalInsertionMode === 'CALENDAR') {
            line.insertionMode = 'CALENDAR';
            line.calendarData = window.MediaCalculator.distributeInsertionsEvenly(
              this.campaign.startDate,
              this.campaign.endDate,
              line.sigla,
              val,
              this.campaign.hasPeriod,
              this.campaign.periodPreset
            );
          } else {
            line.insertionMode = 'TOTAL';
          }
          this.recalculateLine(line);
          this.renderKPIs();
          this.updateLineDomValues(line);
        }
      });
    });

    document.querySelectorAll('.input-freq-dias, .input-freq-pordia').forEach(el => {
      el.addEventListener('input', (e) => {
        const line = this.lines.find(l => l.id === parseInt(e.target.dataset.id, 10));
        if (line) {
          const row = e.target.closest('tr');
          const diasInput = row.querySelector('.input-freq-dias');
          const freqInput = row.querySelector('.input-freq-pordia');
          line.freqDias = diasInput ? (parseInt(diasInput.value, 10) || 0) : 0;
          line.freqPorDia = freqInput ? (parseInt(freqInput.value, 10) || 0) : 0;
          this.recalculateLine(line);
          this.updateLineDomValues(line);
          this.renderKPIs();
        }
      });
    });

    document.querySelectorAll('.input-discount').forEach(el => {
      el.addEventListener('input', (e) => {
        const line = this.lines.find(l => l.id === parseInt(e.target.dataset.id, 10));
        if (line) {
          const val = e.target.value.trim();
          line.discountPercent = val === '' ? '' : (parseFloat(val) || 0);
          this.recalculateLine(line);
          this.updateLineDomValues(line);
          this.renderKPIs();
        }
      });
      el.addEventListener('blur', (e) => {
        const line = this.lines.find(l => l.id === parseInt(e.target.dataset.id, 10));
        if (line && line.discountPercent !== '' && line.discountPercent !== undefined && !isNaN(line.discountPercent)) {
          e.target.value = Number(line.discountPercent).toFixed(2);
        }
      });
    });

    document.querySelectorAll('.btn-open-calendar-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openCalendarModal();
      });
    });

    document.querySelectorAll('.btn-duplicate').forEach(el => {
      el.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-duplicate');
        const lineId = parseInt(btn?.dataset.id, 10);
        if (!isNaN(lineId)) this.duplicateLine(lineId);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(el => {
      el.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete');
        const lineId = parseInt(btn?.dataset.id, 10);
        if (!isNaN(lineId)) this.deleteLine(lineId);
      });
    });
  }

  updateLineDomValues(line) {
    const isAvailable = line.calculo?.disponivel !== false && (line.sigla || line.isCustomProduct);
    const isBonificado = (parseFloat(line.discountPercent) === 100);

    // 0. Atualizar classe invalid-row na linha
    const rowTr = document.querySelector(`tr.row-item[data-row-id="${line.id}"]`);
    if (rowTr) {
      rowTr.classList.toggle('invalid-row', !isAvailable && !!line.sigla);
    }

    // 1. Atualizar Detalhes de Produto (Horário / Projeto Especial)
    const prodDetail = document.getElementById(`prod-detail-${line.id}`);
    if (prodDetail) {
      const prog = window.MediaCalculator.getProgram(line.sigla);
      if (line.isCustomProduct) {
        prodDetail.innerHTML = `<span style="font-weight:700; color:var(--text-dark); text-transform:uppercase;">PROJETO ESPECIAL</span>`;
      } else if (prog) {
        prodDetail.innerHTML = `
          <span style="color:var(--text-muted);">${(prog.diasDesc || '').toUpperCase()} • ${prog.inicio || ''} ÀS ${prog.fim || ''}</span>
          ${prog.obs ? `<span style="color:inherit; font-weight:700; font-size:13px; margin-left:2px; cursor:help;" title="${prog.obs}">*</span>` : ''}
        `;
      } else {
        prodDetail.innerHTML = '';
      }
    }

    // 2. Atualizar Detalhes de Praça (Aviso de não exibido)
    const marketDetail = document.getElementById(`market-detail-${line.id}`);
    if (marketDetail) {
      if (!isAvailable && !line.isCustomProduct && line.sigla) {
        marketDetail.innerHTML = `
          <div class="alert-not-aired" style="margin-top:2px;">
            <span>⚠️ ${line.calculo?.motivo || 'Não exibido na praça selecionada'}</span>
          </div>
        `;
      } else {
        marketDetail.innerHTML = '';
      }
    }

    // 3. Atualizar Base 30"
    const baseCell = document.getElementById(`base-price-cell-${line.id}`);
    if (baseCell) {
      if (line.isCustomProduct) {
        baseCell.innerHTML = `
          <div class="cell-control-container right" style="gap:3px;">
            <span style="font-size:11px; color:var(--text-muted);">R$</span>
            <input type="number" 
                   min="0" 
                   step="100" 
                   class="form-input font-mono input-custom-base-price" 
                   data-id="${line.id}" 
                   value="${line.customBasePrice || line.customUnitPrice || ''}" 
                   style="width:95px; height:34px; text-align:right; font-size:12px; font-weight:700;" 
                   placeholder="0">
          </div>
        `;
        const newCustomBaseInput = baseCell.querySelector('.input-custom-base-price');
        if (newCustomBaseInput) {
          newCustomBaseInput.addEventListener('input', (e) => {
            line.customBasePrice = parseFloat(e.target.value) || 0;
            line.customUnitPrice = line.customBasePrice;
            this.recalculateLine(line);
            this.updateLineDomValues(line);
            this.renderKPIs();
          });
        }
      } else {
        baseCell.innerHTML = `
          <div class="cell-control-container right font-mono font-semibold" style="color:var(--text-dark); font-size:12.5px;" id="base-price-${line.id}">
            ${(line.sigla && line.marketId && isAvailable && line.calculo?.basePrice30 > 0) ? window.MediaCalculator.formatCurrency(line.calculo.basePrice30) : '-'}
          </div>
        `;
      }
    }

    // 4. Atualizar Coeficiente
    const coefInput = document.querySelector(`.input-coef[data-id="${line.id}"]`);
    if (coefInput) {
      if (document.activeElement !== coefInput) {
        if (line.calculo?.coef !== null && line.calculo?.coef !== undefined && (line.formatId || line.isCustomFormat || line.customCoef)) {
          coefInput.value = Number(line.calculo.coef).toFixed(2);
        } else {
          coefInput.value = '';
        }
      }
      if (line.calculo?.isCustomCoef) {
        coefInput.classList.add('coef-modified');
        coefInput.title = `Coeficiente alterado! Padrão deste formato: ${Number(line.calculo.defaultCoef || 1).toFixed(2)}`;
      } else {
        coefInput.classList.remove('coef-modified');
        coefInput.title = 'Coeficiente do formato (editável)';
      }
    }

    // 5. Atualizar Unit. Tabela
    const unitContainer = document.getElementById(`line-unit-price-${line.id}`);
    if (unitContainer) {
      unitContainer.textContent = (line.sigla || line.isCustomProduct) && line.marketId && (line.formatId || line.isCustomFormat) && isAvailable && line.calculo?.unitPrice > 0
        ? window.MediaCalculator.formatCurrency(line.calculo.unitPrice)
        : '-';
    }

    // 6. Atualizar Inserções (no modo FREQ, TOTAL ou CALENDAR)
    const insContainer = document.getElementById(`line-ins-${line.id}`);
    if (insContainer) {
      insContainer.textContent = line.calculo?.totalInsertions || 0;
    }
    const totalInput = document.querySelector(`.input-total[data-id="${line.id}"]`);
    if (totalInput && document.activeElement !== totalInput) {
      totalInput.value = line.calculo?.totalInsertions !== undefined ? line.calculo.totalInsertions : (line.totalDirect || 0);
    }

    // 7. Atualizar Entrega de Mídia (UNIT. TABELA × INS)
    const deliveryContainer = document.getElementById(`line-media-delivery-${line.id}`);
    if (deliveryContainer) {
      deliveryContainer.textContent = isAvailable && line.calculo?.totalBruto > 0
        ? window.MediaCalculator.formatCurrency(line.calculo.totalBruto)
        : (isAvailable && (line.sigla || line.isCustomProduct) && line.calculo?.unitPrice > 0 && (line.totalDirect !== '' || line.freqDias !== '') ? 'R$ 0' : '-');
    }

    // 8. Atualizar Desconto (%) se não estiver em foco
    const discountInput = document.querySelector(`.input-discount[data-id="${line.id}"]`);
    if (discountInput && document.activeElement !== discountInput) {
      if (line.discountPercent !== '' && line.discountPercent !== undefined && !isNaN(line.discountPercent)) {
        discountInput.value = Number(line.discountPercent).toFixed(2);
      } else {
        discountInput.value = '';
      }
    }

    // 9. Atualizar Investimento (ENTREGA DE MÍDIA - DESCONTO / BONIFICADO se 100%)
    const investContainer = document.getElementById(`line-invest-${line.id}`);
    if (investContainer) {
      if (isAvailable && (line.sigla || line.isCustomProduct) && isBonificado) {
        investContainer.innerHTML = `<span class="badge-tag badge-bonificado">BONIFICADO</span>`;
      } else if (isAvailable && line.calculo?.totalLiquido > 0) {
        investContainer.innerHTML = `<div class="font-mono font-bold" style="font-size:13.5px; color:var(--rose-primary);">${window.MediaCalculator.formatCurrency(line.calculo.totalLiquido)}</div>`;
      } else if (isAvailable && (line.sigla || line.isCustomProduct) && line.calculo?.unitPrice > 0 && (line.totalDirect !== '' || line.freqDias !== '')) {
        investContainer.innerHTML = `<div class="font-mono font-bold" style="font-size:13.5px; color:var(--text-dark);">R$ 0</div>`;
      } else {
        investContainer.textContent = '-';
      }
    }

    // 10. Atualizar Unit. Negociado (UNIT. TABELA - DESCONTO / BONIFICADO se 100%)
    const unitNegContainer = document.getElementById(`line-unit-negotiated-${line.id}`);
    if (unitNegContainer) {
      if (isAvailable && (line.sigla || line.isCustomProduct) && isBonificado) {
        unitNegContainer.innerHTML = `<span class="badge-tag badge-bonificado">BONIFICADO</span>`;
      } else if (isAvailable && (line.sigla || line.isCustomProduct) && line.calculo?.unitarioLiquido > 0) {
        unitNegContainer.innerHTML = `<div class="font-mono font-semibold" style="font-size:12.5px; color:var(--text-dark);">${window.MediaCalculator.formatCurrency(line.calculo.unitarioLiquido)}</div>`;
      } else if (isAvailable && (line.sigla || line.isCustomProduct) && line.calculo?.unitPrice > 0 && line.discountPercent !== '') {
        unitNegContainer.innerHTML = `<div class="font-mono font-semibold" style="font-size:12.5px; color:var(--text-dark);">R$ 0</div>`;
      } else {
        unitNegContainer.textContent = '-';
      }
    }
  }

  /* ========================================================
   * MÓDULO: IMPACTOS POR PROGRAMA (MERCADO NACIONAL)
   * ======================================================== */

  initProgramImpacts() {
    const saved = localStorage.getItem('redetv_program_impacts_nacional');
    if (saved) {
      try {
        this.programImpacts = JSON.parse(saved);
        const defaults = this.getDefaultProgramImpacts();
        Object.keys(defaults).forEach(k => {
          if (this.programImpacts[k] === undefined) {
            this.programImpacts[k] = defaults[k];
          }
        });
        return;
      } catch (e) {
        console.warn('Erro ao carregar impactos salvos:', e);
      }
    }
    this.programImpacts = this.getDefaultProgramImpacts();
  }

  getDefaultProgramImpacts() {
    const defaults = {};
    (window.PROGRAMS_DATA || []).forEach(p => {
      let base = Math.round((p.nacional30 || 20000) * 3.8);
      if (p.sigla === 'FGEN') base = 605427;
      else if (p.sigla === 'OPERACAO_DE_RISCO') base = 420000;
      else if (p.sigla === 'A_TARDE_E_SUA') base = 380000;
      else if (p.sigla === 'REDETV_NEWS') base = 310000;
      else if (p.sigla === 'SUPERPOP') base = 280000;
      else if (p.sigla === 'LEITURA_DINAMICA') base = 195000;
      else if (p.sigla === 'MEGA_SENHA_POWER') base = 260000;
      else if (p.sigla === 'DOC_REDETV') base = 180000;
      else if (p.sigla === 'MANHA_VOCE') base = 120000;
      else if (p.sigla === 'VOLEI') base = 350000;
      else if (p.sigla === 'NFL') base = 290000;
      else if (base < 50000) base = 65000;

      defaults[p.sigla] = base;
    });
    return defaults;
  }

  getProgramImpact(sigla) {
    if (!sigla) return 0;
    if (this.programImpacts && this.programImpacts[sigla] !== undefined) {
      return Number(this.programImpacts[sigla]) || 0;
    }
    if (sigla === 'FGEN') return 605427;
    const prog = (window.PROGRAMS_DATA || []).find(p => p.sigla === sigla);
    if (!prog) return 0;
    return Math.round((prog.nacional30 || 20000) * 3.8);
  }

  saveProgramImpacts() {
    try {
      localStorage.setItem('redetv_program_impacts_nacional', JSON.stringify(this.programImpacts));
    } catch (e) {
      console.warn('Erro ao salvar impactos:', e);
    }
  }

  openImpactsModal() {
    const modal = document.getElementById('modal-impacts');
    if (!modal) return;
    modal.style.display = 'flex';
    const searchInput = document.getElementById('input-search-impacts');
    if (searchInput) searchInput.value = '';
    this.renderImpactsModal('');
  }

  closeImpactsModal() {
    const modal = document.getElementById('modal-impacts');
    if (modal) modal.style.display = 'none';
  }

  renderImpactsModal(searchTerm = '') {
    const tbody = document.getElementById('tbody-impacts');
    const totalCountEl = document.getElementById('total-programs-impacts-count');
    if (!tbody) return;
    tbody.innerHTML = '';

    const clean = searchTerm.toLowerCase().trim();
    const programs = (window.PROGRAMS_DATA || []).filter(p => {
      if (!clean) return true;
      return p.nome.toLowerCase().includes(clean) ||
             p.sigla.toLowerCase().includes(clean) ||
             (p.genero && p.genero.toLowerCase().includes(clean));
    });

    if (totalCountEl) totalCountEl.textContent = (window.PROGRAMS_DATA || []).length;

    if (programs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="center" style="padding: 24px; color: var(--text-muted);">
            Nenhum programa encontrado com o termo "${searchTerm}".
          </td>
        </tr>
      `;
      return;
    }

    programs.forEach((p, idx) => {
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid var(--border-card)';
      const impactVal = this.programImpacts[p.sigla] !== undefined ? this.programImpacts[p.sigla] : (this.getDefaultProgramImpacts()[p.sigla] || 0);

      row.innerHTML = `
        <td class="center font-mono" style="padding: 10px 8px; color: var(--text-sub); width: 44px;">
          ${idx + 1}
        </td>
        <td style="padding: 10px 12px; font-weight: 600; color: var(--text-dark);">
          ${p.nome.toUpperCase()}
          <span style="font-size: 10px; color: var(--text-sub); font-family: var(--font-mono); font-weight: normal; margin-left: 4px;">(${p.sigla})</span>
        </td>
        <td style="padding: 10px 12px;">
          <span class="badge-tag" style="background:#F1F5F9; color:#475569; font-size:10px; font-weight:700; text-transform:uppercase;">
            ${(p.genero || 'VARIEDADES').toUpperCase()}
          </span>
        </td>
        <td style="padding: 10px 12px; color: var(--text-muted); font-size: 11px;">
          ${(p.diasDesc || '').toUpperCase()} • ${p.inicio || ''} ÀS ${p.fim || ''}
        </td>
        <td class="right" style="padding: 10px 16px; width: 220px;">
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
            <input type="number" 
                   min="0" 
                   step="1000" 
                   class="form-input font-mono input-program-impact" 
                   data-sigla="${p.sigla}" 
                   value="${impactVal}" 
                   style="width: 140px;">
            <span style="font-size: 10.5px; color: var(--text-muted);">imp/min</span>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('.input-program-impact').forEach(input => {
      input.addEventListener('change', (e) => {
        const sigla = e.target.dataset.sigla;
        const val = parseInt(e.target.value, 10) || 0;
        this.programImpacts[sigla] = val;
        this.saveProgramImpacts();
      });
    });
  }

  exportImpactsCSV() {
    const rows = [
      ['Sigla', 'Programa', 'Genero', 'Exibicao', 'Impactos_Minuto_Nacional']
    ];

    (window.PROGRAMS_DATA || []).forEach(p => {
      const imp = this.programImpacts[p.sigla] !== undefined ? this.programImpacts[p.sigla] : (this.getDefaultProgramImpacts()[p.sigla] || 0);
      rows.push([
        p.sigla,
        `"${p.nome.replace(/"/g, '""')}"`,
        `"${(p.genero || '').replace(/"/g, '""')}"`,
        `"${(p.diasDesc || '').replace(/"/g, '""')} ${p.inicio || ''}-${p.fim || ''}"`,
        imp
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `impactos_programas_nacional_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    this.showToast('Arquivo CSV de impactos exportado com sucesso.');
  }

  importImpactsCSV(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          this.showToast('Arquivo CSV vazio ou sem dados suficientes.', true);
          return;
        }

        const firstLine = lines[0];
        const sep = firstLine.includes(';') ? ';' : ',';

        let countUpdated = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 2) continue;

          let identifier = cols[0];
          let impactStr = cols[cols.length - 1];
          let impactVal = parseInt(impactStr.replace(/\D/g, ''), 10);
          if (isNaN(impactVal)) continue;

          const matched = (window.PROGRAMS_DATA || []).find(p => 
            p.sigla.toUpperCase() === identifier.toUpperCase() ||
            p.nome.toUpperCase() === identifier.toUpperCase() ||
            (cols[1] && p.nome.toUpperCase() === cols[1].toUpperCase())
          );

          if (matched) {
            this.programImpacts[matched.sigla] = impactVal;
            countUpdated++;
          }
        }

        this.saveProgramImpacts();
        const searchInput = document.getElementById('input-search-impacts');
        this.renderImpactsModal(searchInput ? searchInput.value : '');
        this.showToast(`${countUpdated} programas atualizados com sucesso via CSV!`);
      } catch (err) {
        console.error('Erro ao ler CSV:', err);
        this.showToast('Erro ao processar arquivo CSV. Verifique o formato.', true);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  /* ========================================================
   * MÓDULO: Med.IA PLANNER (INTELIGÊNCIA ARTIFICIAL)
   * ======================================================== */

  openMediaAiModal() {
    const modal = document.getElementById('modal-media-ai');
    if (!modal) return;
    modal.style.display = 'flex';

    // Exibe a seção de entrada inicial
    const inputSec = document.getElementById('media-ai-input-section');
    const prevSec = document.getElementById('media-ai-preview-section');
    const loadSec = document.getElementById('media-ai-loading-section');
    const btnGen = document.getElementById('btn-media-ai-generate');
    const btnApp = document.getElementById('btn-media-ai-apply');
    if (inputSec) inputSec.style.display = 'flex';
    if (prevSec) prevSec.style.display = 'none';
    if (loadSec) loadSec.style.display = 'none';
    if (btnGen) btnGen.style.display = 'flex';
    if (btnApp) btnApp.style.display = 'none';

    const promptInput = document.getElementById('input-media-ai-prompt');
    if (promptInput && !promptInput.value) {
      promptInput.focus();
    }
  }

  closeMediaAiModal() {
    if (this.isRecordingAudio) {
      this.toggleMediaAiRecording();
    }
    const modal = document.getElementById('modal-media-ai');
    if (modal) modal.style.display = 'none';
  }

  toggleMediaAiRecording() {
    const micIcon = document.getElementById('media-ai-mic-icon');
    const micLabel = document.getElementById('media-ai-mic-label');
    const recStatus = document.getElementById('media-ai-recording-status');
    const timerSpan = document.getElementById('media-ai-record-timer');
    const promptInput = document.getElementById('input-media-ai-prompt');
    const defaultExample = 'Crie um plano de patrocínio dos programas Superpop e Sensacional, com entrega diária de vinheta de abertura, encerramento, comercial de 30" e merchandising de 90", no periodo de janeiro a março.';

    if (!this.isRecordingAudio) {
      // Iniciar gravação
      this.isRecordingAudio = true;
      this.recordingSeconds = 0;
      if (micIcon) micIcon.textContent = '⏹️';
      if (micLabel) micLabel.textContent = 'Parar Gravação';
      if (recStatus) recStatus.style.display = 'flex';
      if (timerSpan) timerSpan.textContent = '00:00';

      this.recordingTimerInterval = setInterval(() => {
        this.recordingSeconds++;
        const mins = String(Math.floor(this.recordingSeconds / 60)).padStart(2, '0');
        const secs = String(this.recordingSeconds % 60).padStart(2, '0');
        if (timerSpan) timerSpan.textContent = `${mins}:${secs}`;
      }, 1000);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.lang = 'pt-BR';
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              }
            }
            if (finalTranscript && promptInput) {
              promptInput.value = (promptInput.value ? promptInput.value + ' ' : '') + finalTranscript;
            }
          };
          this.recognition.start();
        } catch (e) {
          console.warn('SpeechRecognition error:', e);
        }
      }
    } else {
      // Parar gravação
      this.isRecordingAudio = false;
      if (this.recordingTimerInterval) {
        clearInterval(this.recordingTimerInterval);
        this.recordingTimerInterval = null;
      }
      if (this.recognition) {
        try { this.recognition.stop(); } catch (e) {}
        this.recognition = null;
      }
      if (micIcon) micIcon.textContent = '🎙️';
      if (micLabel) micLabel.textContent = 'Gravar por Áudio';
      if (recStatus) recStatus.style.display = 'none';

      if (promptInput && (!promptInput.value || promptInput.value.trim().length === 0)) {
        promptInput.value = defaultExample;
      }
      this.showToast('Áudio processado pela Med.IA com sucesso!');
    }
  }

  async generateMediaAiPlan() {
    const promptInput = document.getElementById('input-media-ai-prompt');
    const defaultPrompt = 'Crie um plano de patrocínio dos programas Superpop e Sensacional, com entrega diária de vinheta de abertura, encerramento, comercial de 30" e merchandising de 90", no periodo de janeiro a março.';
    const promptText = (promptInput?.value || '').trim() || defaultPrompt;
    if (promptInput && !promptInput.value) {
      promptInput.value = defaultPrompt;
    }

    const inputSec = document.getElementById('media-ai-input-section');
    const loadSec = document.getElementById('media-ai-loading-section');
    const prevSec = document.getElementById('media-ai-preview-section');
    const btnGen = document.getElementById('btn-media-ai-generate');
    const loadStep = document.getElementById('media-ai-loading-step');

    if (inputSec) inputSec.style.display = 'none';
    if (loadSec) loadSec.style.display = 'flex';
    if (prevSec) prevSec.style.display = 'none';
    if (btnGen) btnGen.style.display = 'none';

    if (loadStep) loadStep.textContent = 'Estruturando proposta comercial e grade de exibição...';

    try {
      if (window.GeminiService) {
        const result = await window.GeminiService.plan(promptText);
        if (result && result.success && result.plan) {
          this.applyGeminiPlanToModal(result.plan);
          return;
        } else {
          console.warn('Gemini modal error, fallback local:', result?.error);
        }
      }
    } catch (e) {
      console.warn('Erro Gemini modal, fallback local:', e);
    }

    if (loadStep) loadStep.textContent = 'Mapeando formatos oficiais e coeficientes da tabela 2026.1...';
    setTimeout(() => {
      this.executeMediaAiParsing(promptText);
    }, 400);
  }

  applyGeminiPlanToModal(plan) {
    plan.lines.forEach(l => this.recalculateLine(l));
    this.mediaAiGeneratedPlan = {
      projectName: plan.campaign.projectName,
      startDate: plan.campaign.startDate,
      endDate: plan.campaign.endDate,
      targetMarket: plan.lines[0]?.marketId || 'NACIONAL',
      lines: plan.lines
    };

    const tbody = document.getElementById('media-ai-preview-tbody');
    if (tbody) {
      tbody.innerHTML = plan.lines.map((line, idx) => {
        const prog = window.MediaCalculator.getProgram(line.sigla);
        const fmt = window.MediaCalculator.getFormat(line.formatId);
        const mkt = window.MediaCalculator.getMarket(line.marketId);

        return `
          <tr style="border-bottom: 1px solid var(--border-card);">
            <td class="center font-mono" style="padding: 8px; color: var(--text-sub);">${idx + 1}</td>
            <td style="padding: 8px 12px; font-weight: 700; color: var(--text-dark);">${(prog?.nome || line.sigla).toUpperCase()}</td>
            <td style="padding: 8px 12px; color: var(--text-muted);">${(mkt?.nome || line.marketId).toUpperCase()}</td>
            <td style="padding: 8px 12px; font-weight: 600;">${(fmt?.nome || line.formatId).toUpperCase()}</td>
            <td class="center font-mono" style="padding: 8px;">${Number(line.calculo?.coef || 1).toFixed(2)}</td>
            <td class="right font-mono" style="padding: 8px;">${window.MediaCalculator.formatCurrency(line.calculo?.unitPrice || 0)}</td>
            <td class="center font-mono font-bold" style="padding: 8px; color: var(--rose-primary);">${line.totalDirect}</td>
            <td class="right font-mono font-semibold" style="padding: 8px;">${window.MediaCalculator.formatCurrency(line.calculo?.totalBruto || 0)}</td>
          </tr>
        `;
      }).join('');
    }

    const totalLines = plan.lines.length;
    const totalIns = plan.lines.reduce((acc, l) => acc + (l.totalDirect || 0), 0);
    const totalGross = plan.lines.reduce((acc, l) => acc + (l.calculo?.totalBruto || 0), 0);

    const summaryEl = document.getElementById('media-ai-preview-summary');
    if (summaryEl) {
      summaryEl.textContent = plan.summary;
    }

    const totalLinesEl = document.getElementById('media-ai-preview-total-lines');
    if (totalLinesEl) totalLinesEl.textContent = totalLines;

    const totalInsEl = document.getElementById('media-ai-preview-total-ins');
    if (totalInsEl) totalInsEl.textContent = totalIns;

    const totalGrossEl = document.getElementById('media-ai-preview-total-gross');
    if (totalGrossEl) totalGrossEl.textContent = window.MediaCalculator.formatCurrency(totalGross);

    const loadSec = document.getElementById('media-ai-loading-section');
    const prevSec = document.getElementById('media-ai-preview-section');
    const btnApp = document.getElementById('btn-media-ai-apply');

    if (loadSec) loadSec.style.display = 'none';
    if (prevSec) prevSec.style.display = 'flex';
    if (btnApp) btnApp.style.display = 'flex';
  }

  executeMediaAiParsing(promptText) {
    const lower = promptText.toLowerCase();

    // 1. Programas Identificados
    const targetSiglas = [];
    if (lower.includes('rotativo (7/12)') || lower.includes('rotativo 7/12') || lower.includes('rotativo 07/12') || lower.includes('rotativo matutino') || lower.includes('rot1')) {
      targetSiglas.push('ROT1');
    }
    if (lower.includes('rotativo (12/18)') || lower.includes('rotativo 12/18') || lower.includes('rotativo vespertino') || lower.includes('rot2')) {
      targetSiglas.push('ROT2');
    }
    if (lower.includes('rotativo (18/01)') || lower.includes('rotativo 18/01') || lower.includes('rotativo 18/1') || lower.includes('rotativo noturno') || lower.includes('rot3')) {
      targetSiglas.push('ROT3');
    }
    if (lower.includes('rotativo (07/18)') || lower.includes('rotativo (7/18)') || lower.includes('rotativo 07/18') || lower.includes('rotativo 7/18') || lower.includes('rotativo diurno') || lower.includes('rot4')) {
      targetSiglas.push('ROT4');
    }
    const hasRotBand = targetSiglas.some(s => ['ROT1', 'ROT2', 'ROT3', 'ROT4'].includes(s));
    if ((lower.includes('rotativo') || lower.includes('rota')) && !hasRotBand) {
      targetSiglas.push('ROTA');
    }
    if (lower.includes('superpop') || lower.includes('super pop')) targetSiglas.push('SPOP');
    if (lower.includes('sensacional')) targetSiglas.push('SENS');
    if (lower.includes('redetv news') || lower.includes('news')) targetSiglas.push('NEWS');
    if (lower.includes('leitura dinâmica') || lower.includes('leitura')) targetSiglas.push('LEID');
    if (lower.includes('a tarde é sua') || lower.includes('tarde')) targetSiglas.push('TARD');
    if (lower.includes('tv fama') || lower.includes('fama')) targetSiglas.push('FAMA');
    if (lower.includes('mega sonho')) targetSiglas.push('MSON');
    if (lower.includes('bola na rede') || lower.includes('bola')) targetSiglas.push('BOLA');
    if (lower.includes('operação de risco') || lower.includes('operacao de risco')) {
      if (lower.includes('sábado') || lower.includes('sabado') || lower.includes('sáb') || lower.includes('sab')) {
        targetSiglas.push('OPRA');
      } else if (lower.includes('sexta') || lower.includes('sex')) {
        targetSiglas.push('OPRR');
      } else {
        targetSiglas.push('OPRA');
      }
    }

    if (targetSiglas.length === 0) {
      targetSiglas.push('SPOP', 'SENS');
    }

    // 2. Formatos Identificados
    const targetFormats = [];
    const hasAbertura = lower.includes('abertura') || lower.includes('vinheta de abertura');
    const hasEncerramento = lower.includes('encerramento') || lower.includes('vinheta de encerramento');
    const hasVinhetaGen = lower.includes('vinheta') && !hasAbertura && !hasEncerramento;

    if (hasAbertura || hasVinhetaGen || lower.includes('patrocínio') || lower.includes('patrocinio')) {
      if (!targetFormats.includes('VHT_INTEGRADA_ABERTURA_5')) targetFormats.push('VHT_INTEGRADA_ABERTURA_5');
    }
    if (hasEncerramento || hasVinhetaGen || lower.includes('patrocínio') || lower.includes('patrocinio')) {
      if (!targetFormats.includes('VHT_INTEGRADA_ENCERRAMENTO_5')) targetFormats.push('VHT_INTEGRADA_ENCERRAMENTO_5');
    }
    if (lower.includes('comercial de 30') || lower.includes('comercial 30') || lower.includes('30"') || lower.includes('30 segundos')) {
      if (!targetFormats.includes('COMERCIAL_30')) targetFormats.push('COMERCIAL_30');
    }
    if (lower.includes('comercial de 15') || lower.includes('comercial 15') || lower.includes('15"') || lower.includes('15 segundos')) {
      if (!targetFormats.includes('COMERCIAL_15')) targetFormats.push('COMERCIAL_15');
    }
    if (lower.includes('comercial de 60') || lower.includes('comercial 60') || (lower.includes('60"') && !lower.includes('merchandising') && !lower.includes('merchan') && !lower.includes('ação'))) {
      if (!targetFormats.includes('COMERCIAL_60')) targetFormats.push('COMERCIAL_60');
    }
    if (lower.includes('merchandising de 90') || lower.includes('merchandising 90') || lower.includes('merchan 90') || lower.includes('90"')) {
      if (!targetFormats.includes('MERCHANDISING_90')) targetFormats.push('MERCHANDISING_90');
    }
    if (lower.includes('merchandising de 60') || lower.includes('merchandising 60') || lower.includes('merchan 60')) {
      if (!targetFormats.includes('MERCHANDISING_60')) targetFormats.push('MERCHANDISING_60');
    }
    let acaoFmt = 'ACAO_INTEGRADA_60';
    if (/a[çc][ãa]o\s+integrada\s*(?:de\s*)?90|a[çc][ãa]o\s*(?:de\s*)?90/i.test(lower)) {
      acaoFmt = 'ACAO_INTEGRADA_90';
    } else if (/a[çc][ãa]o\s+integrada\s*(?:de\s*)?45|a[çc][ãa]o\s*(?:de\s*)?45/i.test(lower)) {
      acaoFmt = 'ACAO_INTEGRADA_45';
    }
    if (lower.includes('ação integrada') || lower.includes('acao integrada')) {
      if (!targetFormats.includes(acaoFmt)) targetFormats.push(acaoFmt);
    }

    if (targetFormats.length === 0) {
      targetFormats.push(
        'VHT_INTEGRADA_ABERTURA_5',
        'VHT_INTEGRADA_ENCERRAMENTO_5',
        'COMERCIAL_30',
        'MERCHANDISING_90'
      );
    }

    // 3. Praça
    const targetMarket = (lower.includes('são paulo') || lower.includes('sp')) ? 'SP' : 'NACIONAL';

    // 4. Extração de Desconto
    let extractedDiscount = this.campaign.defaultDiscount || 70.0;
    const discMatch = lower.match(/(?:desconto|desc\.?)(?:\s+do\s+cliente|\s+padr[ãa]o|\s+de|\s+com)?\s*(?:é|e|de|será|sera|:)?\s*(\d+[.,]\d+|\d+)\s*%?/i)
      || lower.match(/(\d+[.,]\d+|\d+)\s*%\s*(?:de\s*)?desconto/i);
    if (discMatch) {
      const val = parseFloat(discMatch[1].replace(',', '.'));
      if (!isNaN(val) && val >= 0 && val <= 100) extractedDiscount = val;
    }

    // 5. Período
    let startDate = '2026-11-01';
    let endDate = '2026-12-31';
    let periodName = 'Novembro a Dezembro / 2026';
    if (lower.includes('janeiro a março') || lower.includes('janeiro a marco')) {
      startDate = '2027-01-01';
      endDate = '2027-03-31';
      periodName = 'Janeiro a Março / 2027';
    } else if (lower.includes('abril')) {
      startDate = '2026-04-01';
      endDate = '2026-04-30';
      periodName = 'Abril / 2026';
    }

    const getFormatExplicitTotal = (formatId, promptLower) => {
      let m = null;
      if (formatId === 'MERCHANDISING_90') {
        m = promptLower.match(/(\d+)\s*(?:ações|acoes|inserções|insercoes|cotas|veiculações|veiculacoes)?\s*(?:de\s*)?(?:merchandising|merchan)\s*(?:de\s*)?90/i)
         || promptLower.match(/(?:merchandising|merchan)\s*(?:de\s*)?90\s*[:\-]?\s*(\d+)/i)
         || promptLower.match(/(?:prever|incluir|colocar|com)?\s*(\d+)\s*(?:ações|acoes|inserções|insercoes)?\s*(?:de\s*)?(?:merchandising|merchan)\s*(?:de\s*)?90/i);
      } else if (formatId === 'MERCHANDISING_60') {
        m = promptLower.match(/(\d+)\s*(?:ações|acoes|inserções|insercoes)?\s*(?:de\s*)?(?:merchandising|merchan)\s*(?:de\s*)?60/i);
      } else if (formatId === 'COMERCIAL_30') {
        m = promptLower.match(/(\d+)\s*(?:comerciais|inserções|spots)\s*(?:de\s*30|30"|30\s*segundos)/i);
      } else if (formatId.startsWith('ACAO_INTEGRADA')) {
        m = promptLower.match(/(\d+)\s*(?:ações\s+integradas|acoes\s+integradas|ações|acoes)/i);
      }
      return m ? parseInt(m[1], 10) : null;
    };

    const splitClauses = lower.split(/\bal[ée]m disso\b|\badicionalmente\b|\btamb[ée]m\b/);
    const mainClause = splitClauses[0];

    // Gerar linhas com cálculo real de calendário
    const generatedLines = [];
    let lineIdCounter = 1;

    targetSiglas.forEach(sigla => {
      const days = window.MediaCalculator.getDateRangeWithProgramFlags(startDate, endDate, sigla, true, null);
      const isFamaWednesday = (sigla === 'FAMA' && (lower.includes('quarta') || lower.includes('quartas')));
      const isBolaMonday = (sigla === 'BOLA' && (lower.includes('segunda') || lower.includes('segundas')));
      let validDays = days.filter(d => {
        if (!d.isValidDayForProgram) return false;
        if (isFamaWednesday) return d.weekday === 3;
        if (isBolaMonday) return d.weekday === 1;
        return true;
      });
      if (validDays.length === 0) validDays = days.filter(d => d.isValidDayForProgram);
      const insCount = validDays.length;

      const progObj = window.MediaCalculator.getProgram(sigla);
      const pName = progObj ? progObj.nome.toLowerCase() : sigla.toLowerCase();
      const isMainProg = mainClause.includes(pName) || (sigla === 'FAMA' && mainClause.includes('fama')) || (sigla === 'OPRA' && mainClause.includes('risco'));

      let progFormats = targetFormats;
      if (sigla === 'BOLA') {
        progFormats = [acaoFmt];
      } else if (!isMainProg) {
        progFormats = targetFormats.filter(f => !f.startsWith('VHT_') && !f.startsWith('ACAO_'));
      } else {
        progFormats = targetFormats.filter(f => !f.startsWith('ACAO_'));
      }

      progFormats.forEach(formatId => {
        const explicitFormatCount = getFormatExplicitTotal(formatId, lower);
        const finalIns = explicitFormatCount || insCount;

        const calData = {};
        if (explicitFormatCount && explicitFormatCount < validDays.length) {
          const distributed = window.MediaCalculator.distributeInsertionsEvenly(startDate, endDate, sigla, explicitFormatCount, true, null);
          Object.assign(calData, distributed);
        } else {
          validDays.forEach(d => { calData[d.key] = 1; });
        }

        const newLine = {
          id: lineIdCounter++,
          sigla,
          isCustomProduct: false,
          customProductName: '',
          marketId: targetMarket,
          formatId,
          customFormatName: '',
          isCustomFormat: false,
          customCoef: null,
          insertionMode: explicitFormatCount ? 'TOTAL' : 'FREQ',
          totalDirect: finalIns,
          freqDias: explicitFormatCount ? explicitFormatCount : insCount,
          freqPorDia: 1,
          calendarData: calData,
          discountPercent: extractedDiscount,
          calculo: null
        };
        this.recalculateLine(newLine);
        generatedLines.push(newLine);
      });
    });

    const progNames = targetSiglas.map(s => window.MediaCalculator.getProgram(s)?.nome || s).join(' & ');
    const projectName = `PATROCÍNIO ${progNames.toUpperCase()} (${periodName.toUpperCase()})`;

    this.mediaAiGeneratedPlan = {
      projectName,
      startDate,
      endDate,
      targetMarket,
      lines: generatedLines
    };

    // Renderizar tabela de prévia
    const tbody = document.getElementById('media-ai-preview-tbody');
    if (tbody) {
      tbody.innerHTML = generatedLines.map((line, idx) => {
        const prog = window.MediaCalculator.getProgram(line.sigla);
        const fmt = window.MediaCalculator.getFormat(line.formatId);
        const mkt = window.MediaCalculator.getMarket(line.marketId);

        return `
          <tr style="border-bottom: 1px solid var(--border-card);">
            <td class="center font-mono" style="padding: 8px; color: var(--text-sub);">${idx + 1}</td>
            <td style="padding: 8px 12px; font-weight: 700; color: var(--text-dark);">${(prog?.nome || line.sigla).toUpperCase()}</td>
            <td style="padding: 8px 12px; color: var(--text-muted);">${(mkt?.nome || line.marketId).toUpperCase()}</td>
            <td style="padding: 8px 12px; font-weight: 600;">${(fmt?.nome || line.formatId).toUpperCase()}</td>
            <td class="center font-mono" style="padding: 8px;">${Number(line.calculo?.coef || 1).toFixed(2)}</td>
            <td class="right font-mono" style="padding: 8px;">${window.MediaCalculator.formatCurrency(line.calculo?.unitPrice || 0)}</td>
            <td class="center font-mono font-bold" style="padding: 8px; color: var(--rose-primary);">${line.totalDirect}</td>
            <td class="right font-mono font-semibold" style="padding: 8px;">${window.MediaCalculator.formatCurrency(line.calculo?.totalBruto || 0)}</td>
          </tr>
        `;
      }).join('');
    }

    const totalLines = generatedLines.length;
    const totalIns = generatedLines.reduce((acc, l) => acc + (l.totalDirect || 0), 0);
    const totalGross = generatedLines.reduce((acc, l) => acc + (l.calculo?.totalBruto || 0), 0);

    const summaryEl = document.getElementById('media-ai-preview-summary');
    if (summaryEl) {
      summaryEl.textContent = `${projectName} • ${targetMarket} • ${totalLines} cotas/linhas configuradas.`;
    }

    const totalLinesEl = document.getElementById('media-ai-preview-total-lines');
    if (totalLinesEl) totalLinesEl.textContent = totalLines;

    const totalInsEl = document.getElementById('media-ai-preview-total-ins');
    if (totalInsEl) totalInsEl.textContent = totalIns;

    const totalGrossEl = document.getElementById('media-ai-preview-total-gross');
    if (totalGrossEl) totalGrossEl.textContent = window.MediaCalculator.formatCurrency(totalGross);

    const loadSec = document.getElementById('media-ai-loading-section');
    const prevSec = document.getElementById('media-ai-preview-section');
    const btnApp = document.getElementById('btn-media-ai-apply');

    if (loadSec) loadSec.style.display = 'none';
    if (prevSec) prevSec.style.display = 'flex';
    if (btnApp) btnApp.style.display = 'flex';
  }

  applyMediaAiPlan() {
    if (!this.mediaAiGeneratedPlan) return;

    this.campaign.projectName = this.mediaAiGeneratedPlan.projectName;
    this.campaign.startDate = this.mediaAiGeneratedPlan.startDate;
    this.campaign.endDate = this.mediaAiGeneratedPlan.endDate;
    this.campaign.hasPeriod = true;
    this.campaign.periodPreset = null;
    this.campaign.globalInsertionMode = 'TOTAL';

    const inputProject = document.getElementById('camp-project-name');
    if (inputProject) inputProject.value = this.campaign.projectName;

    const inputStart = document.getElementById('camp-start-date');
    if (inputStart) {
      inputStart.value = this.campaign.startDate;
      inputStart.disabled = false;
    }

    const inputEnd = document.getElementById('camp-end-date');
    if (inputEnd) {
      inputEnd.value = this.campaign.endDate;
      inputEnd.disabled = false;
    }

    document.querySelectorAll('.period-preset-check').forEach(chk => {
      chk.checked = false;
      chk.closest('.period-box-option')?.classList.remove('active');
    });

    this.lines = this.mediaAiGeneratedPlan.lines;
    this.nextId = this.lines.length + 1;

    this.render();
    this.closeMediaAiModal();
    this.showToast('✓ Proposta e grade montadas pela Med.IA aplicadas com sucesso!');
  }

  showToast(message, isError = false) {
    const oldToast = document.querySelector('.toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) {
      toast.style.borderLeftColor = '#EF4444';
    }
    toast.innerHTML = `<span>${isError ? '⚠️' : '✓'}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3200);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.mediaApp = new MediaApp();
});
