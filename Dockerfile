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

# Comando para iniciar
CMD ["npm", "start"]

