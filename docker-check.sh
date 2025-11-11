#!/bin/bash

# Script para verificar e corrigir problemas com containers Docker
# Uso: ./docker-check.sh

echo "🔍 Verificando estado dos containers..."

# Nome do projeto/aplicação
APP_NAME="agente-financeiro"

# Listar todos os containers (incluindo parados)
echo ""
echo "📋 Containers existentes:"
docker ps -a | grep "$APP_NAME" || echo "❌ Nenhum container encontrado com nome '$APP_NAME'"

echo ""
echo "🔍 Containers em execução:"
RUNNING=$(docker ps | grep "$APP_NAME")

if [ -z "$RUNNING" ]; then
  echo "❌ Nenhum container em execução"
  
  echo ""
  echo "🔧 Verificando containers parados..."
  STOPPED=$(docker ps -a | grep "$APP_NAME" | grep "Exited")
  
  if [ ! -z "$STOPPED" ]; then
    echo "⚠️ Container parado encontrado!"
    echo "$STOPPED"
    
    # Obter ID do container parado
    CONTAINER_ID=$(docker ps -a | grep "$APP_NAME" | grep "Exited" | awk '{print $1}' | head -1)
    
    if [ ! -z "$CONTAINER_ID" ]; then
      echo ""
      echo "🔄 Tentando reiniciar container: $CONTAINER_ID"
      docker start "$CONTAINER_ID"
      
      sleep 3
      
      if docker ps | grep "$CONTAINER_ID" > /dev/null; then
        echo "✅ Container reiniciado com sucesso!"
      else
        echo "❌ Falha ao reiniciar. Verificar logs:"
        docker logs "$CONTAINER_ID" --tail 50
      fi
    fi
  else
    echo "❌ Nenhum container encontrado. Você precisa fazer deploy/build novamente."
    echo ""
    echo "💡 Sugestões:"
    echo "   1. No Coolify: Clicar em 'Redeploy'"
    echo "   2. Ou executar: docker-compose up -d"
    echo "   3. Ou build manual: docker build -t $APP_NAME . && docker run -d $APP_NAME"
  fi
else
  echo "✅ Container em execução:"
  echo "$RUNNING"
  
  # Obter ID do container
  CONTAINER_ID=$(docker ps | grep "$APP_NAME" | awk '{print $1}' | head -1)
  
  echo ""
  echo "🏥 Verificando saúde da aplicação..."
  
  # Verificar porta
  PORT=$(docker port "$CONTAINER_ID" 2>/dev/null | grep "3005" | cut -d: -f2 || echo "3005")
  
  # Testar health endpoint
  HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/health" 2>/dev/null)
  
  if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Aplicação está saudável!"
  else
    echo "⚠️ Aplicação não está respondendo (HTTP $HEALTH_RESPONSE)"
    echo ""
    echo "📋 Últimas 20 linhas do log:"
    docker logs "$CONTAINER_ID" --tail 20
  fi
fi

echo ""
echo "📊 Uso de recursos:"
docker stats "$CONTAINER_ID" --no-stream 2>/dev/null || echo "❌ Não foi possível obter estatísticas"

echo ""
echo "✅ Verificação completa!"

