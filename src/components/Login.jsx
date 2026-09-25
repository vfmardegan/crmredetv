import React, { useState } from "react";
import { LogIn, ShieldAlert, Loader2, X, Mail, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { apiPost } from "../services/api";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  async function handleEmailPasswordSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Por favor, informe seu e-mail corporativo e sua senha.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/auth/login", {
        email: email.trim(),
        password: password,
      });
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message || "Erro ao efetuar login corporativo.");
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
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg shadow-rose-500/20">
              R!
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              CRM Comercial
            </h1>
            <p className="text-xs text-slate-400 mt-1">RedeTV! Comercial e OPEC</p>
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-lg p-3.5 mb-5 text-sm flex gap-3 items-start animate-shake">
              <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* Formulário de login corporativo por e-mail e senha */}
            <form onSubmit={handleEmailPasswordSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@redetv.com.br"
                    className="w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 transition hover:underline cursor-pointer"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition disabled:opacity-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 px-0.5">
                  1º acesso? Digite a senha desejada para cadastrá-la automaticamente.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.99] text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 text-sm transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Entrar no CRM</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-[11px] text-slate-500 text-center border-t border-slate-800/60 pt-3.5 flex flex-col items-center gap-1">
              <span>Uso restrito e monitorado. Apenas colaboradores autorizados da RedeTV!.</span>
              <button
                type="button"
                onClick={() => setShowLgpdModal(true)}
                className="text-rose-400/80 hover:text-rose-300 underline text-[10px] transition cursor-pointer"
              >
                Termos de Uso e Privacidade Corporativa (LGPD)
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLgpdModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-300 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-500" />
                Aviso de Privacidade e Conformidade LGPD
              </h3>
              <button onClick={() => setShowLgpdModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs space-y-3 leading-relaxed text-slate-400 max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong className="text-slate-200">1. Finalidade do Tratamento:</strong> Os dados cadastrais de clientes, agências e contatos comerciais armazenados neste CRM destinam-se estritamente à execução de relações comerciais, prospecção e atendimento institucional da RedeTV! (Art. 7º, incisos V e IX da Lei Geral de Proteção de Dados - Lei nº 13.709/2018).
              </p>
              <p>
                <strong className="text-slate-200">2. Segurança e Acesso Restrito:</strong> O acesso ao sistema é restrito a colaboradores autorizados mediante autenticação corporativa única. Todas as consultas, alterações e exportações são auditadas e registradas em log.
              </p>
              <p>
                <strong className="text-slate-200">3. Direitos dos Titulares:</strong> O titular dos dados possui o direito de confirmar a existência de tratamento, acessar seus dados e solicitar correção ou exclusão de dados pessoais não essenciais à obrigação regulatória e fiscal.
              </p>
              <p>
                <strong className="text-slate-200">4. Confidencialidade:</strong> É expressamente proibida a extração, compartilhamento ou cópia não autorizada de carteiras e contatos corporativos para fins alheios às atividades comerciais da emissora.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLgpdModal(false)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-slate-300 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <KeyRound size={18} className="text-amber-400" />
                Recuperação de Senha
              </h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs space-y-3 leading-relaxed text-slate-300">
              <p className="text-slate-400">
                Por motivos de segurança corporativa da RedeTV!, a redefinição de acesso é realizada com validação do administrador:
              </p>
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2.5">
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-slate-300">
                    <strong className="text-white">Solicite o Reset:</strong> Comunique o administrador do CRM informando seu e-mail institucional RedeTV!.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-slate-300">
                    <strong className="text-white">Liberação no Painel:</strong> O administrador acessa a aba <em>Gestão e Acessos</em> e clica em <em>Resetar Senha</em> no seu cadastro.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-slate-300">
                    <strong className="text-white">Cadastre a Nova Senha:</strong> Retorne a esta tela, digite seu e-mail e a nova senha desejada. Ela será gravada automaticamente no sistema!
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
