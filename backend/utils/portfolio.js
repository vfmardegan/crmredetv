const { pool } = require("../db");

/**
 * Retorna a lista de IDs de executivos sob responsabilidade do usuário.
 * Retorna null para perfis com visão irrestrita (admin e especialista).
 */
async function getAllowedExecIds(user) {
  if (!user || user.perfil === "admin" || user.perfil === "especialista") {
    return null;
  }

  const execIds = [];
  if (user.executivo_id) {
    execIds.push(user.executivo_id);
  }

  if (user.perfil === "diretor") {
    const dirRes = await pool.query(
      "SELECT executivo_id FROM diretor_executivos WHERE diretor_id = $1",
      [user.id]
    );
    for (const r of dirRes.rows) {
      if (r.executivo_id && !execIds.includes(r.executivo_id)) {
        execIds.push(r.executivo_id);
      }
    }
  }

  return execIds;
}

/**
 * Retorna a cláusula SQL WHERE e parâmetros para isolar clientes por carteira.
 */
async function getPortfolioClientCondition(user, clientTableAlias = "c", startIndex = 1) {
  const execIds = await getAllowedExecIds(user);
  if (execIds === null) {
    return { condition: null, params: [] };
  }

  if (execIds.length === 0) {
    return { condition: "1 = 0", params: [] };
  }

  const pIdx = startIndex;
  const condition = `(
    (${clientTableAlias}.type = 'Anunciante' AND (
      ${clientTableAlias}.segmento IN (SELECT segmento FROM segmento_executivo WHERE executivo_id = ANY($${pIdx}::varchar[]))
      OR ${clientTableAlias}.id IN (SELECT client_id FROM carteira_key_accounts WHERE executivo_id = ANY($${pIdx}::varchar[]))
    ))
    OR
    (${clientTableAlias}.type = 'Agência' AND ${clientTableAlias}.id IN (
      SELECT al.agency_id FROM agency_links al
      JOIN clients adv ON adv.id = al.advertiser_id
      WHERE adv.type = 'Anunciante' AND (
        adv.segmento IN (SELECT segmento FROM segmento_executivo WHERE executivo_id = ANY($${pIdx}::varchar[]))
        OR adv.id IN (SELECT client_id FROM carteira_key_accounts WHERE executivo_id = ANY($${pIdx}::varchar[]))
      )
    ))
  )`;

  return { condition, params: [execIds] };
}

/**
 * Valida se um cliente específico pertence à carteira do usuário.
 */
async function isClientAllowedForUser(user, clientId) {
  if (!user || user.perfil === "admin" || user.perfil === "especialista") {
    return true;
  }
  const { condition, params } = await getPortfolioClientCondition(user, "c", 2);
  if (condition === "1 = 0") return false;
  if (!condition) return true;

  const query = `SELECT 1 FROM clients c WHERE c.id = $1 AND ${condition} LIMIT 1`;
  const res = await pool.query(query, [clientId, ...params]);
  return res.rows.length > 0;
}

module.exports = {
  getAllowedExecIds,
  getPortfolioClientCondition,
  isClientAllowedForUser,
};
