#!/usr/bin/env bash

# Exit immediately if an unhandled command fails
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_crm_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

echo "=========================================="
echo " Iniciando Backup do Banco de Dados CRM   "
echo "=========================================="

# 1. Identificar o container de banco de dados ativo
if [ -z "${CRM_DB_CONTAINER:-}" ]; then
  # Tenta autodetectar o container crm-db em execução
  DETECTED=$(docker ps --filter "name=crm-db" --format "{{.Names}}" | head -n 1 || true)
  if [ -n "${DETECTED}" ]; then
    CRM_DB_CONTAINER="${DETECTED}"
  else
    CRM_DB_CONTAINER="crm-db-8"
  fi
fi

DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-crm_redetv}"

echo "-> Container alvo: ${CRM_DB_CONTAINER}"
echo "-> Base de dados:  ${DB_NAME} (usuário: ${DB_USER})"

# 2. Executa o pg_dump dentro do container
echo "-> Extraindo dump SQL do PostgreSQL..."
docker exec -t "${CRM_DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "${BACKUP_FILE}"

# Validação do arquivo gerado
if [ ! -s "${BACKUP_FILE}" ]; then
  echo "ERRO CRÍTICO: O arquivo de backup gerado está vazio!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi

FILE_SIZE_RAW=$(wc -c < "${BACKUP_FILE}")
echo "-> Dump gerado com sucesso (${FILE_SIZE_RAW} bytes)."

# 3. Compactação com gzip
echo "-> Compactando arquivo de backup..."
gzip -f "${BACKUP_FILE}"

GZ_FILE="${BACKUP_FILE}.gz"

# 4. Validação de integridade do arquivo compactado
echo "-> Validando integridade do arquivo GZIP..."
gunzip -t "${GZ_FILE}"

GZ_SIZE=$(du -h "${GZ_FILE}" | cut -f1)

# 5. Política de retenção de backups (remove arquivos mais antigos que 14 dias)
echo "-> Aplicando política de retenção (expurgando backups com mais de 14 dias)..."
find "${BACKUP_DIR}" -name "backup_crm_*.sql.gz" -type f -mtime +14 -delete 2>/dev/null || true

# 6. Sincronização / Cópia externa para AWS S3 ([INF-004])
# Carrega variáveis de ambiente de .env se existir
ENV_FILE=""
if [ -f "/home/ubuntu/CRM/.env" ]; then
  ENV_FILE="/home/ubuntu/CRM/.env"
elif [ -f "./.env" ]; then
  ENV_FILE="./.env"
fi

if [ -n "${ENV_FILE}" ]; then
  ENV_VARS=$(grep -v '^#' "${ENV_FILE}" | grep -E '^(S3_BUCKET|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_DEFAULT_REGION)=' || true)
  if [ -n "${ENV_VARS}" ]; then
    # shellcheck disable=SC2046
    export $(echo "${ENV_VARS}" | xargs) 2>/dev/null || true
  fi
fi

S3_BUCKET="${S3_BUCKET:-}"
if [ -n "${S3_BUCKET}" ]; then
  echo "-> Enviando backup para o bucket AWS S3: s3://${S3_BUCKET}/backups/..."
  if command -v aws >/dev/null 2>&1; then
    if aws s3 cp "${GZ_FILE}" "s3://${S3_BUCKET}/backups/$(basename "${GZ_FILE}")"; then
      echo "✔ [INF-004] Backup replicado para o AWS S3 com sucesso."
    else
      echo "AVISO [INF-004]: Falha no envio para o S3. Verifique as credenciais ou permissões do bucket."
    fi
  else
    echo "AVISO [INF-004]: Utilitário aws-cli não encontrado no host."
  fi
else
  echo "-> [INF-004]: S3_BUCKET não configurado em .env. Para ativar a cópia para a nuvem, configure S3_BUCKET=seu-bucket."
fi

echo "=========================================="
echo " Backup Concluído e Validado com Sucesso! "
echo " Arquivo: ${GZ_FILE} (${GZ_SIZE})"
echo "=========================================="
