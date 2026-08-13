#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_crm_${TIMESTAMP}.sql"

# Criar o diretório de backups se não existir
mkdir -p "${BACKUP_DIR}"

echo "=========================================="
echo " Iniciando Backup do Banco de Dados CRM   "
echo "=========================================="

# Executa o pg_dump dentro do container crm-db
echo "-> Extraindo dados do container crm-db..."
docker exec -t crm-db-v2 pg_dump -U postgres -d crm_redetv > "${BACKUP_FILE}"

echo "-> Compactando arquivo de backup..."
gzip -f "${BACKUP_FILE}"

echo "=========================================="
echo " Backup Concluído com Sucesso!            "
echo " Arquivo: ${BACKUP_FILE}.gz"
echo "=========================================="
