#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

if [ -z "$1" ]; then
  echo "Erro: Você deve especificar o arquivo de backup (.sql ou .sql.gz) como argumento."
  echo "Exemplo: ./restore_db.sh ./backups/backup_crm_20260714_100000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

# Verificar se o arquivo existe
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Erro: Arquivo '${BACKUP_FILE}' não encontrado."
  exit 1
fi

echo "=========================================="
echo " Iniciando Restauração do Banco de Dados  "
echo "=========================================="

TEMP_FILE=""
# Se estiver compactado, descompactar temporariamente
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "-> Descompactando arquivo temporariamente..."
  TEMP_FILE="./temp_restore.sql"
  gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
  RESTORE_TARGET="${TEMP_FILE}"
else
  RESTORE_TARGET="${BACKUP_FILE}"
fi

# Dropar conexões e recriar o banco de dados para garantir restauração limpa
echo "-> Reiniciando o banco de dados crm_redetv..."
docker exec -t crm-db-v2 psql -U postgres -c "REVOKE CONNECT ON DATABASE crm_redetv FROM public;" || true
docker exec -t crm-db-v2 psql -U postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'crm_redetv' AND pid <> pg_backend_pid();" || true
docker exec -t crm-db-v2 psql -U postgres -c "DROP DATABASE IF EXISTS crm_redetv;"
docker exec -t crm-db-v2 psql -U postgres -c "CREATE DATABASE crm_redetv;"

# Importar o backup
echo "-> Importando os dados do backup..."
cat "${RESTORE_TARGET}" | docker exec -i crm-db-v2 psql -U postgres -d crm_redetv

# Limpar arquivo temporário se necessário
if [ -n "${TEMP_FILE}" ] && [ -f "${TEMP_FILE}" ]; then
  rm "${TEMP_FILE}"
fi

echo "=========================================="
echo " Restauração Concluída com Sucesso!       "
echo "=========================================="
