#!/bin/bash
# Script de Inicialização da Aplicação Web de Valoração de Mídia RedeTV!

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo " Sistema de Valoração e Planejamento de Mídia - RedeTV!"
echo "=========================================================="
echo "Iniciando servidor local e abrindo o navegador..."

# Tenta abrir o arquivo diretamente no navegador padrão do macOS
open "$DIR/index.html"

echo "Aplicação aberta no seu navegador!"
