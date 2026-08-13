const { WebSocketServer } = require("ws");
const url = require("url");
const jwt = require("jsonwebtoken");
const { pool } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "redetv_fallback_secret_key";

// Mapa de conexões ativas: wsSocket -> { id: userId, perfil, nome, email }
const activeConnections = new Map();

function initWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const parsedUrl = url.parse(request.url, true);
    // Espera o endpoint /api/v1/ws?token=...
    if (parsedUrl.pathname === "/api/v1/ws") {
      const token = parsedUrl.query.token;
      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, decoded);
        });
      } catch (err) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
      }
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
    }
  });

  wss.on("connection", (ws, userProfile) => {
    activeConnections.set(ws, userProfile);
    // console.log(`WebSocket: Cliente ${userProfile.email} conectado.`);

    ws.on("close", () => {
      activeConnections.delete(ws);
      // console.log(`WebSocket: Cliente ${userProfile.email} desconectado.`);
    });

    ws.on("error", (err) => {
      console.error("Erro na conexão WebSocket:", err);
      activeConnections.delete(ws);
    });
  });

  // Agendar rotina diária de inatividade às 08:00 da manhã
  scheduleDailyCheck();
}

// Envia uma notificação em tempo real para conexões de um usuário específico
async function notifyUser(userId, title, message, type, clientId = null) {
  try {
    // 1. Persistir notificação no banco de dados
    const dbRes = await pool.query(
      `INSERT INTO notificacoes (user_id, title, message, type, client_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at, read`,
      [userId, title, message, type, clientId]
    );
    const notification = {
      id: dbRes.rows[0].id,
      user_id: userId,
      title,
      message,
      type,
      client_id: clientId,
      read: dbRes.rows[0].read,
      created_at: dbRes.rows[0].created_at
    };

    // 2. Enviar via WebSocket se o usuário estiver online
    for (const [ws, profile] of activeConnections.entries()) {
      if (profile.id === userId && ws.readyState === 1) {
        ws.send(JSON.stringify({ event: "notification", data: notification }));
      }
    }
  } catch (err) {
    console.error(`Erro ao salvar/enviar notificação para o usuário ${userId}:`, err);
  }
}

// Envia notificação para todos os administradores
async function broadcastToAdmins(title, message, type, clientId = null) {
  try {
    const admins = await pool.query("SELECT id FROM usuarios WHERE perfil = 'admin'");
    for (const admin of admins.rows) {
      await notifyUser(admin.id, title, message, type, clientId);
    }
  } catch (err) {
    console.error("Erro ao enviar broadcast para administradores:", err);
  }
}

// Envia notificação para os diretores de um executivo específico (por nome)
async function broadcastToDirectorsOfExec(execName, title, message, type, clientId = null) {
  try {
    // Acha os diretores do executivo
    const directors = await pool.query(
      `SELECT de.diretor_id FROM diretor_executivos de 
       JOIN executivos e ON e.id = de.executivo_id 
       WHERE e.nome = $1`,
      [execName]
    );
    for (const dir of directors.rows) {
      await notifyUser(dir.diretor_id, title, message, type, clientId);
    }

    // Acha o id do próprio executivo para notificá-lo também
    const execUser = await pool.query(
      `SELECT id FROM usuarios WHERE executivo_id = (SELECT id FROM executivos WHERE nome = $1 LIMIT 1)`,
      [execName]
    );
    if (execUser.rows.length > 0) {
      await notifyUser(execUser.rows[0].id, title, message, type, clientId);
    }
  } catch (err) {
    console.error(`Erro ao enviar broadcast para diretores do executivo ${execName}:`, err);
  }
}

// Rotina diária de clientes inativos (há mais de 15 dias sem interações)
// Rotina diária de clientes inativos (flag amarelo com 10+ dias, vermelho com 20+ dias, bomba com 30+ dias)
async function checkInactiveClients() {
  // console.log("Iniciando rotina de inatividade de clientes...");
  try {
    const dbRes = await pool.query(`
      SELECT c.id, c.nome_fantasia, c.razao_social, c.type, c.segmento,
             MAX(ci.date) as last_interaction,
             (CURRENT_DATE - COALESCE(MAX(ci.date), c.created_at::date))::integer as days_inactive
      FROM clients c
      LEFT JOIN client_interactions ci ON ci.client_id = c.id
      GROUP BY c.id, c.nome_fantasia, c.razao_social, c.type, c.segmento
      HAVING (CURRENT_DATE - COALESCE(MAX(ci.date), c.created_at::date))::integer >= 10
    `);

    for (const client of dbRes.rows) {
      const clientName = client.nome_fantasia || client.razao_social || "Cliente";
      const lastIntStr = client.last_interaction 
        ? `última interação em ${new Date(client.last_interaction).toLocaleDateString("pt-BR")}`
        : "nenhuma interação registrada";

      const days = client.days_inactive;
      let type, title, message;

      if (days >= 30) {
        type = "inactive_30";
        title = `💣 ${clientName} +30`;
        message = `Cliente sem interação há ${days} dias (${lastIntStr}).`;
      } else if (days >= 20) {
        type = "inactive_20";
        title = `🔴 ${clientName} +20`;
        message = `Cliente sem interação há ${days} dias (${lastIntStr}).`;
      } else {
        type = "inactive_10";
        title = `🟡 ${clientName} +10`;
        message = `Cliente sem interação há ${days} dias (${lastIntStr}).`;
      }

      // Evita spammer: só gera notificação se não houver alerta igual na última semana
      const dupRes = await pool.query(
        `SELECT COUNT(*) FROM notificacoes 
         WHERE type = $1 AND client_id = $2 AND created_at > NOW() - INTERVAL '7 days'`,
        [type, client.id]
      );

      if (parseInt(dupRes.rows[0].count, 10) === 0) {
        // Envia para Admins
        await broadcastToAdmins(title, message, type, client.id);

        // Localiza executivos responsáveis (Carteiras de Segmento ou Key Account)
        let execsRes = await pool.query(
          `SELECT executivo_id FROM carteira_key_accounts WHERE client_id = $1`,
          [client.id]
        );
        if (execsRes.rows.length === 0 && client.type === "Anunciante" && client.segmento) {
          execsRes = await pool.query(
            `SELECT executivo_id FROM segmento_executivo WHERE segmento = $1`,
            [client.segmento]
          );
        }

        const execIds = execsRes.rows.map(r => r.executivo_id);
        if (execIds.length > 0) {
          // Busca diretores dos executivos
          const directorsRes = await pool.query(
            `SELECT DISTINCT de.diretor_id FROM diretor_executivos de 
             WHERE de.executivo_id = ANY($1)`,
            [execIds]
          );
          for (const dirRow of directorsRes.rows) {
            await notifyUser(dirRow.diretor_id, title, message, type, client.id);
          }

          // Busca usuários vinculados aos executivos
          const usersRes = await pool.query(
            `SELECT id FROM usuarios WHERE executivo_id = ANY($1)`,
            [execIds]
          );
          for (const userRow of usersRes.rows) {
            await notifyUser(userRow.id, title, message, type, client.id);
          }
        }
      }
    }
  } catch (err) {
    console.error("Erro na rotina de verificação de clientes inativos:", err);
  }
}

let lastCheckDate = "";
function scheduleDailyCheck() {
  // Roda uma verificação inicial curta ao subir o servidor (5 segundos)
  setTimeout(checkInactiveClients, 5000);

  // Agenda checagem a cada minuto, disparando somente às 08:00 AM de cada dia
  setInterval(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (now.getHours() === 8 && lastCheckDate !== today) {
      lastCheckDate = today;
      checkInactiveClients();
    }
  }, 60000);
}

module.exports = {
  initWebSocket,
  notifyUser,
  broadcastToAdmins,
  broadcastToDirectorsOfExec
};
