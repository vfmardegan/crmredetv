const express = require("express");
const cors = require("cors");
const http = require("http");

const bootstrapRoutes = require("./routes/bootstrap");
const clientsRoutes = require("./routes/clients");
const contactsRoutes = require("./routes/contacts");
const opportunitiesRoutes = require("./routes/opportunities");
const proposalsRoutes = require("./routes/proposals");
const executivosRoutes = require("./routes/executivos");
const iaRoutes = require("./routes/ia");
const calendarRoutes = require("./routes/calendar");
const notificationsRoutes = require("./routes/notifications");

const authRoutes = require("./routes/auth");
const requireAuth = require("./routes/authMiddleware");

const app = express();
const PORT = process.env.API_PORT || 8001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const adminRoutes = require("./routes/admin");

// Rota pública de autenticação
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
app.use("/api/v1", protectedRouter);

app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

// Cria o servidor HTTP e inicializa o WebSocketServer acoplado
const server = http.createServer(app);
const { initWebSocket } = require("./websocket");
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`API do CRM RedeTV! (com WebSockets) rodando na porta ${PORT}`);
});
