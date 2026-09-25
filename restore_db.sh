#!/usr/bin/env bash

# Exit immediately if an unhandled command fails
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Uso: ./restore_db.sh <arquivo_backup.sql[.gz]> [--force]"
  echo "Exemplo: ./restore_db.sh ./backups/backup_crm_20260918_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
FORCE_RESTORE="${2:-}"

# Verificar se o arquivo existe
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Erro: Arquivo '${BACKUP_FILE}' não encontrado."
  exit 1
fi

# 1. Identificar o container de banco de dados ativo
if [ -z "${CRM_DB_CONTAINER:-}" ]; then
  DETECTED=$(docker ps --filter "name=crm-db" --format "{{.Names}}" | head -n 1 || true)
  if [ -n "${DETECTED}" ]; then
    CRM_DB_CONTAINER="${DETECTED}"
  else
    CRM_DB_CONTAINER="crm-db-8"
  fi
fi

DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-crm_redetv}"

echo "=========================================="
echo " Restauração de Banco de Dados — CRM      "
echo "=========================================="
echo "-> Container alvo: ${CRM_DB_CONTAINER}"
echo "-> Base de dados:  ${DB_NAME} (usuário: ${DB_USER})"
echo "-> Arquivo backup: ${BACKUP_FILE}"
echo "=========================================="

if [ "${FORCE_RESTORE}" != "--force" ]; then
  echo "ATENÇÃO: Esta operação irá sobrescrever a base de dados '${DB_NAME}' com os dados do backup."
  read -p "Deseja prosseguir com a restauração? (digite 'sim' para confirmar): " CONFIRM
  if [ "${CONFIRM}" != "sim" ]; then
    echo "Operação cancelada pelo usuário."
    exit 0
  fi
fi

TEMP_FILE=""
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "-> Descompactando arquivo temporariamente..."
  TEMP_FILE="./temp_restore.sql"
  gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
  RESTORE_TARGET="${TEMP_FILE}"
else
  RESTORE_TARGET="${BACKUP_FILE}"
fi

# Dropar conexões e recriar o banco de dados para garantir restauração limpa
echo "-> Encerrando conexões ativas na base ${DB_NAME}..."
docker exec -t "${CRM_DB_CONTAINER}" psql -U "${DB_USER}" -c "REVOKE CONNECT ON DATABASE ${DB_NAME} FROM public;" || true
docker exec -t "${CRM_DB_CONTAINER}" psql -U "${DB_USER}" -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${DB_NAME}' AND pid <> pg_backend_pid();" || true

echo "-> Recriando base de dados ${DB_NAME}..."
docker exec -t "${CRM_DB_CONTAINER}" psql -U "${DB_USER}" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec -t "${CRM_DB_CONTAINER}" psql -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};"

# Importar o backup
echo "-> Importando os dados do backup..."
cat "${RESTORE_TARGET}" | docker exec -i "${CRM_DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"

# Limpar arquivo temporário se necessário
if [ -n "${TEMP_FILE}" ] && [ -f "${TEMP_FILE}" ]; then
  rm -f "${TEMP_FILE}"
fi

echo "=========================================="
echo " Restauração Concluída com Sucesso!       "
echo "=========================================="
