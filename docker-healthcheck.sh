#!/bin/bash

# Script de Health Check para Docker
# Verifica se a aplicação está respondendo corretamente

echo "🔍 Verificando saúde da aplicação..."

# Verificar se a aplicação está respondendo
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT:-3005}/api/health)

if [ "$response" = "200" ]; then
  echo "✅ Aplicação está saudável (HTTP 200)"
  exit 0
else
  echo "❌ Aplicação não está respondendo (HTTP $response)"
  exit 1
fi

