import React, { useEffect, useState } from "react";
import { LogIn, ShieldAlert, KeyRound, Loader2 } from "lucide-react";
import { apiPost } from "../services/api";

export default function Login({ onLoginSuccess }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mockEmail, setMockEmail] = useState("bruno.camargo@redetv.com.br");

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Inicializa o Google Identity Services SDK
    /* global google */
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
          shape: "rectangular",
        }
      );
    }
  }, [GOOGLE_CLIENT_ID]);

  async function handleCredentialResponse(response) {
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/auth/google", { credential: response.credential });
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || "Erro ao fazer login com o Google.");
    } finally {
      setLoading(false);
    }
  }

  // Gera um token fake para simular o fluxo sem precisar configurar o Google Cloud Console imediatamente
  async function handleMockLogin(e) {
    e.preventDefault();
    if (!mockEmail.trim() || !mockEmail.includes("@")) {
      setError("Por favor, digite um e-mail válido para o teste.");
      return;
    }
    setLoading(true);
    setError("");

    // Constrói um JWT falso contendo o e-mail inserido
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: "mock_user_" + mockEmail.replace(/[^a-zA-Z0-9]/g, ""),
      email: mockEmail.trim(),
      name: mockEmail.split("@")[0].replace(".", " ").replace(/\b\w/g, c => c.toUpperCase()),
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${mockEmail}`
    }));
    const mockCredential = `${header}.${payload}.signature`;

    try {
      const res = await apiPost("/auth/google", { credential: mockCredential });
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || "Erro ao realizar login simulado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Luzes de neon dinâmicas no fundo */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-4 z-10">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-rose-500/20">
              R!
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              CRM Comercial
            </h1>
            <p className="text-sm text-slate-400 mt-1">RedeTV! Comercial e OPEC</p>
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-lg p-3.5 mb-6 text-sm flex gap-3 items-start animate-shake">
              <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="animate-spin text-rose-500" size={28} />
              <span className="text-sm text-slate-400">Autenticando sessão...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {GOOGLE_CLIENT_ID ? (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-3 tracking-wider uppercase">
                    Entrar com conta corporativa
                  </div>
                  <div id="google-signin-btn" className="w-full min-h-[40px] flex items-center justify-center" />
                </div>
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-xs text-slate-400 flex flex-col gap-2">
                  <span className="font-semibold text-slate-200 flex items-center gap-1">
                    <KeyRound size={14} className="text-amber-500" />
                    Chave Google não configurada
                  </span>
                  <span>
                    A variável `VITE_GOOGLE_CLIENT_ID` não está no `.env`.
                    Você pode usar o painel abaixo para simular um login e testar o sistema.
                  </span>
                </div>
              )}

              {/* Seção de Bypass de Desenvolvimento */}
              <form onSubmit={handleMockLogin} className="border-t border-slate-800/85 pt-6 flex flex-col gap-3">
                <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Simulação / Teste Local
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">E-mail para teste</label>
                  <input
                    type="email"
                    value={mockEmail}
                    onChange={(e) => setMockEmail(e.target.value)}
                    placeholder="nome@redetv.com.br"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-700"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-white rounded-lg py-2.5 transition-colors font-medium border border-slate-700/50"
                >
                  <LogIn size={14} />
                  Entrar com e-mail de teste
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
