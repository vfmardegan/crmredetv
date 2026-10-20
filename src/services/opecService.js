// src/services/opecService.js
// Serviço de dados e regras de negócio operacional da OPEC (Projetos e Campanhas)

const STORAGE_PROJECTS_KEY = "crm_opec_projects_v2";
const STORAGE_CAMPAIGNS_KEY = "crm_opec_campaigns_v2";

// Dados operacionais preliminares estruturados com a lógica de Conta Corrente de Saldo
const DEFAULT_PROJECTS = [
  {
    id: "PROJ-2026-001",
    opportunityId: "opp-vw-01",
    codigoProjeto: "PRJ-VW-TERA",
    nomeProjeto: "Lançamento Novo Tera 2026",
    anunciante: "Volkswagen do Brasil",
    marca: "Novo Tera",
    agencia: "AlmapBBDO",
    executivo: "Vitor Mardegan",
    executivoEmail: "vitor.mardegan@redetv.com.br",
    periodoGlobal: "01/10/2026 a 31/12/2026",
    valorTotalContratado: 960000.0,
    status: "Em Veiculação / Parcial", // "Aguardando 1º P.I.", "Em Veiculação / Parcial", "Com Divergência", "Concluído"
    dataCriacao: "02/10/2026",
    // Conta corrente de inserções por programa contratado
    entregasContratadas: [
      {
        id: "ent-01",
        programa: "SuperPop",
        formato: "Spot 30\"",
        praca: "Nacional (Rede)",
        valorUnitario: 20000.0,
        insercoesContratadas: 24,
        insercoesVeiculadas: 16,
        saldoRestante: 8,
      },
      {
        id: "ent-02",
        programa: "RedeTV! News",
        formato: "Vinheta 5\"",
        praca: "Nacional (Rede)",
        valorUnitario: 12000.0,
        insercoesContratadas: 40,
        insercoesVeiculadas: 20,
        saldoRestante: 20,
      }
    ],
    // Histórico de P.Is vinculados já recebidos e validados
    pisVinculados: [
      {
        id: "PI-VW-OUT",
        numeroPi: "PI 48291/26",
        competencia: "Outubro/2026",
        dataRecebimento: "05/10/2026",
        programa: "SuperPop",
        insercoes: 16,
        valorUnitario: 20000.0,
        valorLiquido: 320000.0,
        status: "Aprovado na Grade",
        arquivoPdf: "PI_48291_VW_Outubro.pdf"
      },
      {
        id: "PI-VW-NOV",
        numeroPi: "PI 49102/26",
        competencia: "Novembro/2026",
        dataRecebimento: "18/10/2026",
        programa: "RedeTV! News",
        insercoes: 20,
        valorUnitario: 12000.0,
        valorLiquido: 240000.0,
        status: "Aprovado na Grade",
        arquivoPdf: "PI_49102_VW_Novembro.pdf"
      }
    ]
  },
  {
    id: "PROJ-2026-002",
    opportunityId: "opp-heineken-02",
    codigoProjeto: "PRJ-AMSTEL-NFL",
    nomeProjeto: "Cota Futebol & Entretenimento",
    anunciante: "Heineken Brasil",
    marca: "Amstel",
    agencia: "Publicis Brasil",
    executivo: "Patricia Silva",
    executivoEmail: "patricia.silva@redetv.com.br",
    periodoGlobal: "01/11/2026 a 28/02/2027",
    valorTotalContratado: 720000.0,
    status: "Aguardando 1º P.I.",
    dataCriacao: "19/10/2026",
    entregasContratadas: [
      {
        id: "ent-03",
        programa: "Bola na Rede / NFL",
        formato: "Spot 30\"",
        praca: "Grande SP + RJ",
        valorUnitario: 18000.0,
        insercoesContratadas: 40,
        insercoesVeiculadas: 0,
        saldoRestante: 40,
      }
    ],
    pisVinculados: []
  },
  {
    id: "PROJ-2026-003",
    opportunityId: "opp-itau-03",
    codigoProjeto: "PRJ-ITAU-EMPRESAS",
    nomeProjeto: "Crédito PJ - Noturno",
    anunciante: "Itaú Unibanco",
    marca: "Itaú Empresas",
    agencia: "Africa Creative",
    executivo: "Rodrigo Almeida",
    executivoEmail: "rodrigo.almeida@redetv.com.br",
    periodoGlobal: "15/10/2026 a 30/11/2026",
    valorTotalContratado: 450000.0,
    status: "Com Divergência",
    dataCriacao: "15/10/2026",
    entregasContratadas: [
      {
        id: "ent-04",
        programa: "Operação de Risco",
        formato: "Spot 30\"",
        praca: "Nacional (Rede)",
        valorUnitario: 15000.0,
        insercoesContratadas: 30,
        insercoesVeiculadas: 0,
        saldoRestante: 30,
      }
    ],
    pisVinculados: [
      {
        id: "PI-ITAU-DIVERGENTE",
        numeroPi: "PI 99318/26",
        competencia: "Novembro/2026",
        dataRecebimento: "19/10/2026",
        programa: "Operação de Risco",
        insercoes: 30,
        valorUnitario: 13500.0, // Divergência: contratado era 15.000
        valorLiquido: 405000.0,
        status: "Divergência de Preço",
        divergenciaDescricao: "Valor unitário veio R$ 13.500,00 no P.I., mas o contrato fechou em R$ 15.000,00 (-10% não autorizado).",
        arquivoPdf: "PI_99318_Itau.pdf"
      }
    ]
  }
];

// Mídia Avulsa (Campanhas Pontuais de Varejo / Spots Avulsos)
const DEFAULT_CAMPAIGNS = [
  {
    id: "CAMP-2026-001",
    numeroPi: "PI 55410/26",
    anunciante: "Casas Bahia",
    marca: "Mega Saldão de Quinta",
    agencia: "VML",
    programa: "A Tarde é Sua",
    praca: "Grande SP",
    periodo: "24/10/2026 a 26/10/2026",
    totalInsercoes: 6,
    formato: "Spot 30\"",
    valorLiquido: 78000.0,
    status: "Aprovado na Grade",
    materialTecnico: "Recebido (OK)",
    analistaOpec: "Mesa SP"
  },
  {
    id: "CAMP-2026-002",
    numeroPi: "PI 55489/26",
    anunciante: "Ultrafarma",
    marca: "Linha Sidney Oliveira",
    agencia: "Direto",
    programa: "SuperPop / Sensacional",
    praca: "Nacional (Rede)",
    periodo: "01/11/2026 a 05/11/2026",
    totalInsercoes: 10,
    formato: "Merchandising 60\"",
    valorLiquido: 140000.0,
    status: "Em Análise de Bloco",
    materialTecnico: "Aguardando Engenharia",
    analistaOpec: "Mesa Rede"
  }
];

function getStored(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

export function getOpecProjects() {
  return getStored(STORAGE_PROJECTS_KEY, DEFAULT_PROJECTS);
}

export function getOpecProjectById(id) {
  const projects = getOpecProjects();
  return projects.find((p) => p.id === id) || null;
}

export function saveOpecProject(project) {
  const projects = getOpecProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.unshift(project);
  }
  setStored(STORAGE_PROJECTS_KEY, projects);
  return project;
}

// Criação de Projeto a partir do Fechamento de uma Oportunidade Comercial
export function createProjectFromOpportunity({ opportunity, anuncianteNome, agenciaNome, entregas }) {
  const projects = getOpecProjects();
  const idSeq = String(projects.length + 1).padStart(3, "0");
  const newId = `PROJ-2026-${idSeq}`;

  const entregasFormatadas = entregas.map((item, idx) => {
    const contratadas = Number(item.insercoesContratadas) || 1;
    const unitario = Number(item.valorUnitario) || 0;
    return {
      id: `ent-${Date.now()}-${idx}`,
      programa: item.programa || "Programa a Definir",
      formato: item.formato || "Spot 30\"",
      praca: item.praca || "Nacional (Rede)",
      valorUnitario: unitario,
      insercoesContratadas: contratadas,
      insercoesVeiculadas: 0,
      saldoRestante: contratadas,
    };
  });

  const valorTotal = entregasFormatadas.reduce(
    (acc, it) => acc + it.insercoesContratadas * it.valorUnitario,
    0
  );

  const newProject = {
    id: newId,
    opportunityId: opportunity.id,
    codigoProjeto: `PRJ-${(anuncianteNome || "PROJ").substring(0, 8).toUpperCase()}`,
    nomeProjeto: opportunity.title || "Projeto Comercial Fechado",
    anunciante: anuncianteNome || "Anunciante",
    marca: opportunity.brand || anuncianteNome || "Marca",
    agencia: agenciaNome || "Agência Direta",
    executivo: opportunity.executivo || "Executivo Comercial",
    executivoEmail: opportunity.executivoEmail || "",
    periodoGlobal: opportunity.periodMonths?.length
      ? `${opportunity.periodMonths[0]} a ${opportunity.periodMonths[opportunity.periodMonths.length - 1]}`
      : "A Definir",
    valorTotalContratado: valorTotal || Number(opportunity.value) || 0,
    status: "Aguardando 1º P.I.",
    dataCriacao: new Date().toLocaleDateString("pt-BR"),
    entregasContratadas: entregasFormatadas,
    pisVinculados: []
  };

  projects.unshift(newProject);
  setStored(STORAGE_PROJECTS_KEY, projects);
  return newProject;
}

// Conciliação de P.I. dentro de um Projeto Contratado
export function reconcilePiToProject(projectId, piInput) {
  const project = getOpecProjectById(projectId);
  if (!project) throw new Error("Projeto não encontrado.");

  const programaContratado = project.entregasContratadas.find(
    (e) => e.programa.toLowerCase() === (piInput.programa || "").toLowerCase()
  );

  const errors = [];
  const warnings = [];

  // Checagem 1: Programa contratado existe?
  if (!programaContratado) {
    errors.push(
      `O programa "${piInput.programa}" não consta nas entregas contratadas deste projeto comercial.`
    );
  } else {
    // Checagem 2: Valor unitário confere?
    const valorUnitarioPi = Number(piInput.valorUnitario) || 0;
    const diferencaUnitario = valorUnitarioPi - programaContratado.valorUnitario;

    if (diferencaUnitario < -0.01) {
      errors.push(
        `Divergência de Preço: O valor unitário no P.I. (R$ ${valorUnitarioPi.toLocaleString("pt-BR")}) veio MENOR que o valor fechado no contrato comercial (R$ ${programaContratado.valorUnitario.toLocaleString("pt-BR")}).`
      );
    } else if (diferencaUnitario > 0.01) {
      warnings.push(
        `O valor unitário no P.I. (R$ ${valorUnitarioPi.toLocaleString("pt-BR")}) veio maior que o contratado.`
      );
    }

    // Checagem 3: Saldo de inserções comporta o P.I.?
    const qtdInsercoesPi = Number(piInput.insercoes) || 0;
    if (qtdInsercoesPi > programaContratado.saldoRestante) {
      errors.push(
        `Estouro de Saldo: O P.I. solicita ${qtdInsercoesPi} inserções, mas o saldo restante contratado no ${programaContratado.programa} é de apenas ${programaContratado.saldoRestante} inserções.`
      );
    }
  }

  const hasDivergence = errors.length > 0;

  const newPiRecord = {
    id: `PI-${Date.now()}`,
    numeroPi: piInput.numeroPi,
    competencia: piInput.competencia || "Mês Atual",
    dataRecebimento: new Date().toLocaleDateString("pt-BR"),
    programa: piInput.programa,
    insercoes: Number(piInput.insercoes) || 0,
    valorUnitario: Number(piInput.valorUnitario) || 0,
    valorLiquido: Number(piInput.valorLiquido) || 0,
    status: hasDivergence ? "Com Divergência" : "Aprovado na Grade",
    divergenciaDescricao: hasDivergence ? errors.join(" ") : null,
    warnings: warnings.length ? warnings.join(" ") : null,
    arquivoPdf: piInput.arquivoNome || "Pedido_de_Insercao.pdf"
  };

  // Se aprovado sem divergência, debita da conta corrente do projeto
  if (!hasDivergence && programaContratado) {
    programaContratado.insercoesVeiculadas += newPiRecord.insercoes;
    programaContratado.saldoRestante = Math.max(
      0,
      programaContratado.insercoesContratadas - programaContratado.insercoesVeiculadas
    );

    // Atualiza status do projeto
    const totalSaldoRestante = project.entregasContratadas.reduce(
      (acc, it) => acc + it.saldoRestante,
      0
    );
    project.status = totalSaldoRestante === 0 ? "Concluído" : "Em Veiculação / Parcial";
  } else if (hasDivergence) {
    project.status = "Com Divergência";
  }

  project.pisVinculados.unshift(newPiRecord);
  saveOpecProject(project);

  return {
    success: !hasDivergence,
    errors,
    warnings,
    piRecord: newPiRecord,
    updatedProject: project
  };
}

export function getOpecCampaigns() {
  return getStored(STORAGE_CAMPAIGNS_KEY, DEFAULT_CAMPAIGNS);
}

export function saveOpecCampaign(campaign) {
  const campaigns = getOpecCampaigns();
  campaigns.unshift({
    ...campaign,
    id: `CAMP-${Date.now()}`
  });
  setStored(STORAGE_CAMPAIGNS_KEY, campaigns);
  return campaign;
}
