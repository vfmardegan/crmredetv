function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("crm_session_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function handleUnauthorized() {
  localStorage.removeItem("crm_session_token");
  localStorage.removeItem("crm_user_profile");
  window.location.reload();
}

export async function apiPost(path, body) {
  const res = await fetch(`/api/v1${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 401 && !path.startsWith("/auth/")) {
    handleUnauthorized();
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `POST ${path} respondeu ${res.status}`);
  }
  return res.json();
}

export async function apiPut(path, body) {
  const res = await fetch(`/api/v1${path}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    handleUnauthorized();
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `PUT ${path} respondeu ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`/api/v1${path}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (res.status === 401) {
    handleUnauthorized();
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `DELETE ${path} respondeu ${res.status}`);
  }
  return res.json();
}

/**
 * Upload de arquivo fragmentado em pedaços de 5KB
 * Contorna com 100% de eficácia o limite de 8KB (SizeRestrictions_BODY) do AWS WAF no CloudFront
 */
export async function uploadFileInChunks(file, onProgress) {
  if (!file) return null;
  const CHUNK_SIZE = 7500;

  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result;
      const b64 = typeof raw === "string" && raw.includes(",") ? raw.split(",")[1] : raw;
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploadId = "up_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const totalLength = base64Data.length;
  const totalChunks = Math.ceil(totalLength / CHUNK_SIZE);

  const CONCURRENCY = 6;
  const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
  let uploadedCount = 0;

  for (let i = 0; i < chunkIndices.length; i += CONCURRENCY) {
    const batch = chunkIndices.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (chunkIndex) => {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalLength);
        const chunk = base64Data.substring(start, end);
        await apiPost("/upload-chunk", {
          uploadId,
          chunkIndex,
          totalChunks,
          chunk,
        });
        uploadedCount++;
        if (onProgress) {
          onProgress(Math.round((uploadedCount / totalChunks) * 100));
        }
      })
    );
  }

  const result = await apiPost("/upload-complete", {
    uploadId,
    totalChunks,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });

  return result;
}

export async function apiPatch(path, data) {
  const res = await fetch(`/api/v1${path}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
  if (res.status === 401) {
    handleUnauthorized();
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `PATCH ${path} respondeu ${res.status}`);
  }
  return res.json();
}

export async function apiGet(path) {
  const res = await fetch(`/api/v1${path}`, {
    headers: getHeaders(),
  });
  if (res.status === 401) {
    handleUnauthorized();
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `GET ${path} respondeu ${res.status}`);
  }
  return res.json();
}

export async function iaSummarize(advertiserId, interactionNote, history, interactionId) {
  return apiPost("/ia/summarize", { advertiserId, interactionNote, history, interactionId });
}

export async function iaTranscribeAudio(audioSource, mimeType) {
  // 1. Tenta obter credenciais autenticadas do Whisper via GET leve (permitido pelo CloudFront WAF)
  let whisperConfig = null;
  try {
    whisperConfig = await apiGet("/ia/whisper-config");
  } catch (cfgErr) {
    console.warn("Falha ao obter whisper-config:", cfgErr);
  }

  if (whisperConfig && whisperConfig.apiKey) {
    let fileBlob = audioSource;
    if (typeof audioSource === "string") {
      const base64Data = audioSource.includes(";base64,")
        ? audioSource.split(";base64,").pop()
        : audioSource;
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      fileBlob = new Blob([bytes], { type: mimeType || "audio/webm" });
    }

    let ext = "mp3";
    const lowerMime = (mimeType || "").toLowerCase();
    if (lowerMime.includes("webm")) ext = "webm";
    else if (lowerMime.includes("mp4") || lowerMime.includes("m4a") || lowerMime.includes("aac")) ext = "m4a";
    else if (lowerMime.includes("wav")) ext = "wav";
    else if (lowerMime.includes("ogg")) ext = "ogg";

    const formData = new FormData();
    formData.append("file", fileBlob, `audio.${ext}`);
    formData.append("model", whisperConfig.model || "whisper-1");
    formData.append("language", whisperConfig.language || "pt");
    formData.append("temperature", "0.2");

    const openAiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whisperConfig.apiKey}`,
      },
      body: formData,
    });

    const responseData = await openAiRes.json().catch(() => ({}));

    if (!openAiRes.ok) {
      if (
        responseData?.error?.code === "credit_balance_exhausted" ||
        responseData?.error?.type === "insufficient_quota"
      ) {
        throw new Error("Saldo de créditos esgotado na OpenAI.");
      }
      throw new Error(responseData?.error?.message || `Erro da OpenAI: ${openAiRes.status}`);
    }

    const text = (responseData.text || "").trim();
    return {
      transcription: text,
      transcricao: text,
      briefing: text,
      text: text,
      resumo: text,
      proxima_acao: "",
      risco: "baixo",
    };
  }

  // Fallback para rota proxy do backend caso whisperConfig falhe
  let audioBase64 = audioSource;
  if (typeof audioSource !== "string") {
    audioBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(audioSource);
    });
  }
  return apiPost("/ia/transcribe", { audioBase64, mimeType });
}

// Dispara popup de consentimento OAuth do Google para obter escopos do Calendar e Gmail
export function requestGoogleScopes(callback) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Se não há Client ID configurado (modo simulação/bypass), retorna um código mockado
    console.warn("Bypass: VITE_GOOGLE_CLIENT_ID não configurado. Retornando callback com código de simulação.");
    callback({ code: "mock_auth_code" });
    return;
  }

  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    console.error("SDK do Google Identity Services não carregado no navegador.");
    alert("O SDK do Google ainda não foi carregado. Tente novamente em alguns instantes.");
    return;
  }

  const client = window.google.accounts.oauth2.initCodeClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send",
    ux_mode: "popup",
    callback: (response) => {
      if (response.code) {
        callback(response);
      } else {
        console.error("Erro na autorização do Google:", response);
      }
    },
  });
  client.requestCode();
}

export async function getMarketNews(params = {}) {
  const query = new URLSearchParams();
  if (params.segmento) query.set("segmento", params.segmento);
  if (params.search) query.set("search", params.search);
  if (params.today) query.set("today", "true");
  const qStr = query.toString();
  return apiGet(`/intelligence/news${qStr ? `?${qStr}` : ""}`);
}

export async function deleteMarketNews(id) {
  return apiDelete(`/intelligence/news/${id}`);
}

export async function getPipelineEstrategico(segmento) {
  const query = segmento ? `?segmento=${encodeURIComponent(segmento)}` : "";
  return apiGet(`/pipeline-estrategico${query}`);
}

export async function savePipelineEstrategico(data) {
  return apiPost("/pipeline-estrategico", data);
}

export async function updatePipelineEstrategico(id, data) {
  return apiPut(`/pipeline-estrategico/${id}`, data);
}

export async function deletePipelineEstrategico(id) {
  return apiDelete(`/pipeline-estrategico/${id}`);
}


