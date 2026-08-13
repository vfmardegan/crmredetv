#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo " Iniciando Configuração do Servidor Linux "
echo "=========================================="

# 1. Atualizar repositórios do sistema
echo "-> Atualizando pacotes do sistema..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Instalar pacotes pré-requisitos
echo "-> Instalando pré-requisitos básicos..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# 3. Adicionar chave GPG oficial do Docker
echo "-> Configurando chave GPG do Docker..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 4. Adicionar repositório oficial do Docker
echo "-> Adicionando repositório do Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y

# 5. Instalar Docker Engine, CLI, Containerd e Compose
echo "-> Instalando Docker e Docker Compose..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Habilitar e iniciar serviço do Docker
echo "-> Habilitando serviços..."
sudo systemctl enable docker
sudo systemctl start docker

# 7. Adicionar usuário atual ao grupo docker (permite rodar docker sem sudo)
echo "-> Configurando permissões do usuário docker..."
if [ "$USER" != "root" ]; then
  sudo usermod -aG docker "$USER"
  echo "Usuário $USER adicionado ao grupo docker."
fi

echo "=========================================="
echo " Configuração Concluída com Sucesso!      "
echo " Nota: Faça logout e login novamente para  "
echo " aplicar as permissões do grupo Docker.    "
echo "=========================================="
