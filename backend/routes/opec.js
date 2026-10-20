// backend/routes/opec.js
// Rotas operacionais da Mesa de Operações da OPEC (Projetos e Campanhas)
const express = require("express");
const router = express.Router();

// Mock in-memory ou persistência de projetos OPEC
let opecProjects = [];
let opecCampaigns = [];

// GET /api/v1/opec/projects
router.get("/opec/projects", (req, res) => {
  res.json(opecProjects);
});

// POST /api/v1/opec/projects
router.post("/opec/projects", (req, res) => {
  const project = {
    ...req.body,
    id: req.body.id || `PROJ-${Date.now()}`,
    dataCriacao: new Date().toLocaleDateString("pt-BR")
  };
  opecProjects.unshift(project);
  res.status(201).json(project);
});

// POST /api/v1/opec/projects/:id/reconcile-pi
router.post("/opec/projects/:id/reconcile-pi", (req, res) => {
  const { id } = req.params;
  const piInput = req.body;
  const project = opecProjects.find((p) => p.id === id);

  if (!project) {
    return res.status(404).json({ error: "Projeto OPEC não encontrado." });
  }

  const programaContratado = project.entregasContratadas?.find(
    (e) => e.programa.toLowerCase() === (piInput.programa || "").toLowerCase()
  );

  const errors = [];
  if (!programaContratado) {
    errors.push(`O programa "${piInput.programa}" não consta nas entregas contratadas deste projeto.`);
  } else {
    const valorUnitarioPi = Number(piInput.valorUnitario) || 0;
    if (valorUnitarioPi < programaContratado.valorUnitario - 0.01) {
      errors.push(
        `Divergência de Preço: Valor unitário no P.I. (R$ ${valorUnitarioPi}) menor que o contrato (R$ ${programaContratado.valorUnitario}).`
      );
    }
    const qtdInsercoes = Number(piInput.insercoes) || 0;
    if (qtdInsercoes > programaContratado.saldoRestante) {
      errors.push(
        `Estouro de Saldo: O P.I. pede ${qtdInsercoes} inserções, mas o saldo restante é de ${programaContratado.saldoRestante}.`
      );
    }
  }

  const hasDivergence = errors.length > 0;
  const newPi = {
    id: `PI-${Date.now()}`,
    ...piInput,
    dataRecebimento: new Date().toLocaleDateString("pt-BR"),
    status: hasDivergence ? "Com Divergência" : "Aprovado na Grade",
    divergenciaDescricao: hasDivergence ? errors.join(" ") : null
  };

  if (!hasDivergence && programaContratado) {
    programaContratado.insercoesVeiculadas += Number(piInput.insercoes) || 0;
    programaContratado.saldoRestante = Math.max(0, programaContratado.insercoesContratadas - programaContratado.insercoesVeiculadas);
  }

  project.pisVinculados = project.pisVinculados || [];
  project.pisVinculados.unshift(newPi);

  res.json({ success: !hasDivergence, errors, piRecord: newPi, project });
});

// GET /api/v1/opec/campaigns
router.get("/opec/campaigns", (req, res) => {
  res.json(opecCampaigns);
});

// POST /api/v1/opec/campaigns
router.post("/opec/campaigns", (req, res) => {
  const campaign = {
    ...req.body,
    id: req.body.id || `CAMP-${Date.now()}`
  };
  opecCampaigns.unshift(campaign);
  res.status(201).json(campaign);
});

module.exports = router;
