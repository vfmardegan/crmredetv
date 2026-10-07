const express = require("express");
const cors = require("cors");
const http = require("http");
const zlib = require("zlib");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const bootstrapRoutes = require("./routes/bootstrap");
const clientsRoutes = require("./routes/clients");
const contactsRoutes = require("./routes/contacts");
const opportunitiesRoutes = require("./routes/opportunities");
const proposalsRoutes = require("./routes/proposals");
const executivosRoutes = require("./routes/executivos");
const iaRoutes = require("./routes/ia");
const calendarRoutes = require("./routes/calendar");
const notificationsRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");
const intelligenceRoutes = require("./routes/intelligence");

const authRoutes = require("./routes/auth");
const requireAuth = require("./routes/authMiddleware");

const app = express();
const PORT = process.env.API_PORT || 8001;

// Confia no primeiro proxy reverso (Nginx) para extrair o IP real do cliente via X-Forwarded-For ([SEC-007])
app.set("trust proxy", 1);

// Validação de segurança do JWT_SECRET ([SEC-005])
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ [ERRO CRÍTICO] Variável de ambiente JWT_SECRET não definida!");
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
} else if (JWT_SECRET === "crm_redetv_secret_key_prod_default_2026") {
  console.warn("⚠️  [ALERTA DE SEGURANÇA] JWT_SECRET está utilizando o valor padrão público. Configure uma chave forte em produção.");
}

// 1. Headers de segurança (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Gerenciado pelo Nginx se necessário
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Limitadores de taxa (Rate Limiting)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 300, // Máximo 300 requisições por minuto por IP
  message: { error: "Muitas requisições. Por favor, tente novamente em alguns instantes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Proteção estrita contra força bruta no endpoint de login ([SEC-007])
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 10, // Máximo de 10 tentativas falhas por IP
  skipSuccessfulRequests: true, // Login bem-sucedido não consome o limite
  message: { error: "Muitas tentativas incorretas de login. Por segurança, tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Máximo 30 tentativas gerais de autenticação
  message: { error: "Muitas tentativas de autenticação. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveOpsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // Máximo 30 chamadas para IA / Envio de E-mails
  message: { error: "Limite de operações excedido para IA/Envio de e-mails. Aguarde um momento." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/ia", sensitiveOpsLimiter);
app.use("/api/v1/emails/send", sensitiveOpsLimiter);
app.use("/api/v1/proposals/send", sensitiveOpsLimiter);

// Middleware de alta compressão gzip para endpoints da API (JSON > 1KB)
app.use((req, res, next) => {
  const acceptEncoding = req.headers["accept-encoding"] || "";
  if (!acceptEncoding.includes("gzip")) return next();

  const originalJson = res.json;
  res.json = function (body) {
    const jsonStr = JSON.stringify(body);
    if (jsonStr.length > 1024) {
      zlib.gzip(Buffer.from(jsonStr), (err, buffer) => {
        if (!err) {
          res.setHeader("Content-Encoding", "gzip");
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.status(res.statusCode || 200).send(buffer);
        } else {
          originalJson.call(this, body);
        }
      });
      return;
    }
    return originalJson.call(this, body);
  };
  next();
});

// Configuração de CORS restrita ([SEC-004])
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8000",
  "http://localhost:8011",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8011",
  "http://56.125.72.234",
  "https://56.125.72.234",
  "http://56.125.72.234:8011",
  "https://56.125.72.234:8011",
  "http://crm.redetv.com.br",
  "https://crm.redetv.com.br",
];
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (como curl, mobile apps ou proxies locais Nginx)
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origem não permitida pela política de CORS do CRM RedeTV!."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Rota pública de autenticação e health check
app.get("/api/v1/health", (req, res) => res.json({ ok: true }));
app.use("/api/v1", authRoutes);

// Rotas protegidas do CRM
const protectedRouter = express.Router();
protectedRouter.use(requireAuth);
protectedRouter.use(bootstrapRoutes);
protectedRouter.use(clientsRoutes);
protectedRouter.use(contactsRoutes);
protectedRouter.use(opportunitiesRoutes);
protectedRouter.use(proposalsRoutes);
protectedRouter.use(executivosRoutes);
protectedRouter.use(iaRoutes);
protectedRouter.use(adminRoutes);
protectedRouter.use(calendarRoutes);
protectedRouter.use(notificationsRoutes);
protectedRouter.use(intelligenceRoutes);
app.use("/api/v1", protectedRouter);

// Cria o servidor HTTP e inicializa o WebSocketServer acoplado
const server = http.createServer(app);
const { initWebSocket } = require("./websocket");
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`API do CRM RedeTV! (com WebSockets) rodando na porta ${PORT}`);
});
