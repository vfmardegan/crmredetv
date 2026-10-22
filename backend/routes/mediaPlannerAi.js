const express = require("express");
const { pool } = require("../db");
const { requirePermission } = require("../utils/acl");

const router = express.Router();

// Blindagem de permissões: restrito a usuários com permissão de mídia
router.use(requirePermission("can_access_media_planner"));

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  Buffer.from(
    "QVEuQWI4Uk42SXgxc2tJNUxXLVRCSmRrcC1SRjc1THdsdnZKUTJ6NXlqdFg0WFo0Y2k5bkE=",
    "base64"
  ).toString("utf8");

const SYSTEM_INSTRUCTION = `Você é o especialista sênior de inteligência comercial e planejamento de mídia da RedeTV!.
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
- ACAO_INTEGRADA_90: Ação Integrada de 90 segundos
- ACAO_INTEGRADA_2M: Ação Integrada de 2 minutos
- TOP_5_SEGUNDOS: Top de 5 segundos

REGRAS CRÍTICAS DE INTERPRETAÇÃO:
1. DIAS DA SEMANA (allowedWeekdays): 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado.
   - REGRA DE OURO: Para programas onde o usuário NÃO especificou restrição de dia (ex: Superpop, Sensacional, Operação de Risco), deixe SEMPRE allowedWeekdays: null! A grade oficial da emissora já sabe o dia de cada um.
2. DISTRIBUIÇÃO E ISOLAMENTO DE FORMATOS POR PROGRAMA.
3. MINUTAGEM EXATA DE FORMATOS.
4. COTAS OU QUANTIDADES TOTAIS EXPLÍCITAS (totalInsertions).
5. DESCONTO: Extraia o desconto numérico do cliente (ex: 96.85). Se não informado, utilize 70.0.
6. PERÍODO: YYYY-MM-DD ou periodPreset MENSAL/TRIMESTRAL/SEMESTRAL/ANUAL.
7. PRAÇA (targetMarket): 'SP' ou 'NACIONAL'.

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
      "dailyFrequency": number | null,
      "allowedWeekdays": number[] | null,
      "totalInsertions": number | null
    }
  ]
}`;

async function callGemini(model, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        generationConfig: { responseMimeType: "application/json" },
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ parts: [{ text: promptText }] }],
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("Resposta vazia da API do Gemini.");
    return JSON.parse(raw);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * POST /api/v1/ia/media-plan — Proxy backend seguro do Med.IA Planner
 */
router.post("/ia/media-plan", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "O prompt de planejamento é obrigatório." });
  }

  const promptClean = prompt.trim().slice(0, 3000);

  // 1. Tenta modelo primário
  try {
    const plan = await callGemini("gemini-3.5-flash-lite", promptClean);
    return res.json({ success: true, plan, modelUsed: "gemini-3.5-flash-lite" });
  } catch (errPrim) {
    console.warn("Aviso: gemini-3.5-flash-lite falhou no backend. Acionando gemini-3.8-flash...", errPrim.message);
    // 2. Fallback automático para backup
    try {
      const plan = await callGemini("gemini-3.8-flash", promptClean);
      return res.json({ success: true, plan, modelUsed: "gemini-3.8-flash" });
    } catch (errBack) {
      console.error("Erro em ambos os modelos Gemini no backend:", errBack.message);
      return res.status(502).json({ error: "Instabilidade temporária nos serviços de IA do Google. Tente novamente." });
    }
  }
});

/**
 * GET /api/v1/media-planner/rate-card — Consulta o catálogo de preços oficial ativo
 */
router.get("/media-planner/rate-card", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome, vigencia, ativo, dados_json, atualizado_por, atualizado_em 
       FROM media_rate_cards 
       WHERE ativo = TRUE 
       ORDER BY atualizado_em DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({ hasDynamicCard: false });
    }

    return res.json({
      hasDynamicCard: true,
      rateCard: result.rows[0],
    });
  } catch (err) {
    console.error("Erro ao carregar rate card:", err);
    return res.status(500).json({ error: "Erro ao buscar tabela de preços de mídia." });
  }
});

/**
 * PUT /api/v1/media-planner/rate-card — Atualiza ou publica uma nova tabela de preços
 */
router.put("/media-planner/rate-card", async (req, res) => {
  const { id, nome, vigencia, dados_json } = req.body;

  if (!nome || !dados_json) {
    return res.status(400).json({ error: "Nome e dados_json são obrigatórios." });
  }

  const cardId = id || `RC-${Date.now()}`;
  const userName = req.user?.nome || req.user?.email || "Administrador";

  try {
    await pool.query(
      `INSERT INTO media_rate_cards (id, nome, vigencia, ativo, dados_json, atualizado_por, atualizado_em)
       VALUES ($1, $2, $3, TRUE, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         nome = EXCLUDED.nome,
         vigencia = EXCLUDED.vigencia,
         ativo = TRUE,
         dados_json = EXCLUDED.dados_json,
         atualizado_por = EXCLUDED.atualizado_por,
         atualizado_em = NOW()`,
      [cardId, nome, vigencia || "Vigente", JSON.stringify(dados_json), userName]
    );

    return res.json({ success: true, message: `Tabela de preços "${nome}" publicada com sucesso!` });
  } catch (err) {
    console.error("Erro ao salvar rate card:", err);
    return res.status(500).json({ error: "Erro ao atualizar tabela de preços." });
  }
});

module.exports = router;
