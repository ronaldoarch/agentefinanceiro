FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm install --production=false

# Copiar código da aplicação
COPY . .

# Build do frontend
WORKDIR /app/client
RUN npm install --legacy-peer-deps
RUN npm run build

# Verificar se o build foi criado
RUN ls -la /app/client/build || echo "❌ BUILD FALHOU!"
RUN test -f /app/client/build/index.html || (echo "❌ index.html não encontrado!" && exit 1)

# Voltar para raiz
WORKDIR /app

# Criar diretório para dados e garantir permissões
RUN mkdir -p /app/data && chmod 777 /app/data

# Expor porta
EXPOSE 3005

# Variável de ambiente padrão
ENV PORT=3005
ENV NODE_ENV=production

# Copiar scripts de verificação
COPY docker-healthcheck.sh /app/
RUN chmod +x /app/docker-healthcheck.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Labels para melhor organização
LABEL maintainer="agente-financeiro"
LABEL version="1.0"
LABEL description="Agente Financeiro com WhatsApp e OpenAI"

# Comando para iniciar com verificação
CMD ["sh", "-c", "echo '🚀 Iniciando Agente Financeiro...' && npm start"]

