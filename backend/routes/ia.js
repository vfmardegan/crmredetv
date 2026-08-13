const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const { pool } = require("../db");

const router = express.Router();

// Inicializa o cliente da Gemini API.
// Ele lê automaticamente a variável de ambiente GEMINI_API_KEY.
const ai = new GoogleGenAI({});

router.post("/ia/summarize", async (req, res) => {
  const { advertiserId, interactionNote, history, interactionId } = req.body;

  if (!advertiserId || !interactionNote) {
    return res.status(400).json({ error: "Faltando advertiserId ou interactionNote." });
  }

  try {
    // 1. Buscar informações do cliente no banco
    const clientRes = await pool.query(
      "select nome_fantasia, razao_social, segmento from clients where id = $1",
      [advertiserId]
    );

    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }

    const client = clientRes.rows[0];
    const clientName = client.nome_fantasia || client.razao_social || "Cliente";
    const clientSegment = client.segmento || "Não especificado";

    // 2. Montar prompt do usuário
    const userPrompt = `Anunciante/Agência: ${clientName} (${clientSegment})
Interação mais recente: "${interactionNote}"
Histórico anterior:
${history || "Nenhum"}

Responda apenas com um JSON válido, sem blocos de código markdown ou texto explicativo extra, no formato exato:
{"resumo": "...", "proxima_acao": "...", "risco": "baixo|médio|alto"}`;

    // 3. Fazer chamada à API Gemini
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: userPrompt,
      system_instruction: "Você é um assistente de vendas de mídia para uma emissora de TV brasileira, ajudando a equipe comercial a gerenciar o relacionamento com anunciantes e agências.",
    });

    const outputText = interaction.output_text || "";
    
    // Limpar marcações de código markdown se o modelo tiver retornado
    const cleanJsonText = outputText.replace(/```json|```/g, "").trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanJsonText);
    } catch (parseErr) {
      console.warn("Falha ao parsear JSON da IA, retornando como texto livre:", cleanJsonText);
      parsedResult = {
        resumo: cleanJsonText,
        proxima_acao: "Definir na próxima reunião.",
        risco: "baixo",
      };
    }

    if (interactionId) {
      await pool.query(
        `UPDATE client_interactions 
         SET ai_summary = $1, ai_next_action = $2, ai_risk = $3 
         WHERE id = $4`,
        [parsedResult.resumo, parsedResult.proxima_acao, parsedResult.risco, interactionId]
      );
    }

    res.json(parsedResult);
  } catch (err) {
    console.error("Erro ao resumir interação por IA:", err);
    res.status(500).json({ error: "Erro interno ao processar inteligência artificial." });
  }
});

// POST /ia/transcribe — transcreve e resume reuniões a partir de áudio base64
router.post("/ia/transcribe", async (req, res) => {
  const { audioBase64, mimeType } = req.body;

  if (!audioBase64 || !mimeType) {
    return res.status(400).json({ error: "Parâmetros audioBase64 e mimeType são obrigatórios." });
  }

  try {
    // Limpa o prefixo do dataURI se houver
    let base64Data = audioBase64;
    if (audioBase64.includes(";base64,")) {
      base64Data = audioBase64.split(";base64,").pop();
    }

    const systemInstruction = `Você é um assistente de inteligência comercial para um CRM de TV brasileira.
Sua tarefa é ouvir o áudio de uma reunião ou briefing e gerar a transcrição literal, o resumo comercial, um briefing estruturado, as próximas ações e o nível de risco.

Retorne APENAS um objeto JSON válido, sem decorações ou formatação markdown (\`\`\`json). Use o formato exato:
{
  "transcricao": "Texto integral transcrito...",
  "resumo": "Resumo executivo da conversa...",
  "briefing": "Detalhamento de produtos, verbas e escopo do briefing comercial...",
  "proxima_acao": "Próximos passos práticos...",
  "risco": "baixo|médio|alto"
}`;

    // Fazer a chamada multimodal à API Gemini
    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",
      input: [
        { text: "Analise e transcreva o áudio anexado." },
        { inlineData: { data: base64Data, mimeType: mimeType } }
      ],
      system_instruction: systemInstruction
    });

    const outputText = interaction.output_text || "";
    const cleanJsonText = outputText.replace(/```json|```/g, "").trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanJsonText);
    } catch (parseErr) {
      console.warn("Falha ao parsear JSON de áudio da IA, tentando extrair ou encapsular:", cleanJsonText);
      parsedResult = {
        transcricao: outputText,
        resumo: "Resumo executivo não pôde ser gerado em JSON.",
        briefing: outputText,
        proxima_acao: "Definir na próxima reunião.",
        risco: "baixo"
      };
    }

    res.json(parsedResult);
  } catch (err) {
    console.error("Erro na transcrição de áudio por IA:", err);
    res.status(500).json({ error: "Erro ao processar o áudio com a inteligência artificial." });
  }
});

router.post("/ia/client-summary", async (req, res) => {
  const { clientId } = req.body;
  if (!clientId) {
    return res.status(400).json({ error: "Faltando o parâmetro clientId." });
  }

  try {
    // 1. Busca informações do cliente e interações
    const clientRes = await pool.query(
      "SELECT nome_fantasia, razao_social, segmento FROM clients WHERE id = $1",
      [clientId]
    );

    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }

    const client = clientRes.rows[0];
    const clientName = client.nome_fantasia || client.razao_social || "Cliente";
    const clientSegment = client.segmento || "Não especificado";

    const interactionsRes = await pool.query(
      "SELECT date, note, type FROM client_interactions WHERE client_id = $1 ORDER BY date DESC, created_at DESC",
      [clientId]
    );

    const interactions = interactionsRes.rows;

    if (interactions.length === 0) {
      return res.json({ summary: "Este cliente ainda não possui histórico de interações registrado para consolidar um resumo." });
    }

    // 2. Formata o histórico
    const historyText = interactions.map(i => {
      const typeLabel = i.type === "meeting" ? "Reunião" : i.type === "call" ? "Ligação" : i.type === "email" ? "E-mail" : "Anotação";
      const dateStr = new Date(i.date).toLocaleDateString("pt-BR");
      return `[${dateStr}] - ${typeLabel}: ${i.note}`;
    }).join("\n\n");

    // 3. Prompt para o Gemini
    const userPrompt = `Você é um analista comercial sênior da RedeTV!. Abaixo está o histórico completo de interações comerciais com o cliente ${clientName} (${clientSegment}).

Histórico de interações:
${historyText}

Sua tarefa é ler todas as interações e gerar um Resumo Executivo da relação comercial de forma profissional, fluida e clara (em português). 
O resumo deve sintetizar as principais negociações, o estado atual do relacionamento, eventuais atritos/riscos detectados e as próximas etapas estratégicas recomendadas.
Seja conciso (máximo de 3 parágrafos) e direto ao ponto. Não use formatação markdown de código, nem comece com 'Aqui está o resumo...'. Vá direto ao texto.`;

    // 4. Executa a chamada do Gemini
    const response = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: userPrompt,
      system_instruction: "Você é um assistente de inteligência comercial experiente em vendas de mídia para televisão aberta brasileira.",
    });

    const summary = response.output_text?.trim() || "Não foi possível gerar o resumo.";

    // 5. Salva o resumo na coluna ai_summary do cliente
    await pool.query(
      "UPDATE clients SET ai_summary = $1 WHERE id = $2",
      [summary, clientId]
    );

    res.json({ summary });

  } catch (err) {
    console.error("Erro ao gerar resumo global do cliente por IA:", err);
    res.status(500).json({ error: "Erro interno ao processar resumo de IA do cliente." });
  }
});

module.exports = router;
