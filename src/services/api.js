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

export async function iaTranscribeAudio(audioBase64, mimeType) {
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
