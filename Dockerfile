FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código da aplicação
COPY . .

# Build do frontend
WORKDIR /app/client
RUN npm install
RUN npm run build

# Voltar para raiz
WORKDIR /app

# Expor porta
EXPOSE 3005

# Comando para iniciar
CMD ["npm", "start"]

