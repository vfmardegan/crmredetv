#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo " Iniciando Implantação (Deploy) do CRM    "
echo "=========================================="

# 1. Verificar se o arquivo .env existe, caso contrário criar um de exemplo
if [ ! -f .env ]; then
  echo "-> Criando arquivo .env padrão..."
  echo "PORT=8000" > .env
  echo "NODE_ENV=production" >> .env
fi

# 2. Atualizar código do repositório (opcional se for feito pull automático)
# echo "-> Buscando alterações mais recentes do git..."
# git pull origin main

# 3. Parar containers antigos e inicializar a nova versão
echo "-> Inicializando containers via Docker Compose..."
docker compose down
docker compose up -d --build

# 4. Limpar imagens/volumes órfãos para evitar falta de espaço em disco
echo "-> Limpando recursos não utilizados do Docker..."
docker system prune -f

echo "=========================================="
echo " Deploy Concluído com Sucesso!            "
echo " Acesse a aplicação na porta configurada. "
echo "=========================================="
