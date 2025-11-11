# 🐛 Troubleshooting - Container Docker

## Erro: "No such container"

### **Sintoma:**
```
Error response from daemon: No such container: sowwoo08cs8004gwowcoogkw-010120767659
```

### **Causa:**
O container Docker foi removido, parou de funcionar ou o ID mudou após um rebuild.

---

## 🔧 Soluções

### **Solução 1: Redeploy no Coolify (Recomendado)**

1. **Acessar Coolify:**
   ```
   http://147.93.147.33:8000
   ```

2. **Navegar até a aplicação:**
   - Projects → Seu projeto
   - Environments → Seu environment
   - Applications → agente-financeiro

3. **Fazer Redeploy:**
   - Clicar em "Redeploy" ou "Force Rebuild & Redeploy"
   - Aguardar o build completar
   - Verificar logs em tempo real

4. **Verificar:**
   - Container novo será criado
   - Novo ID será gerado automaticamente
   - Logs devem aparecer normalmente

---

### **Solução 2: Via Terminal SSH**

Se tiver acesso SSH ao servidor:

```bash
# 1. Conectar ao servidor
ssh user@147.93.147.33

# 2. Listar todos os containers
docker ps -a

# 3. Encontrar o container do agente-financeiro
docker ps -a | grep agente

# 4. Se estiver parado, reiniciar
docker start CONTAINER_ID

# 5. Verificar logs
docker logs -f CONTAINER_ID

# 6. Se não existir, recriar
cd /caminho/do/projeto
docker-compose up -d --build
```

---

### **Solução 3: Script Automático de Verificação**

Use o script `docker-check.sh` incluído no projeto:

```bash
# Dar permissão de execução
chmod +x docker-check.sh

# Executar
./docker-check.sh
```

**O script faz:**
- ✅ Lista todos os containers
- ✅ Verifica se está rodando
- ✅ Tenta reiniciar se parado
- ✅ Mostra logs se houver erro
- ✅ Testa health endpoint
- ✅ Mostra uso de recursos

---

## 🔍 Verificações Manuais

### **1. Verificar se container existe:**
```bash
docker ps -a | grep agente
```

**Se aparecer:**
```
CONTAINER ID   IMAGE              STATUS
abc123def456   agente-financeiro  Up 2 hours
```
→ Container existe e está rodando ✅

**Se não aparecer:**
→ Container foi removido, precisa rebuild ❌

---

### **2. Verificar logs do container:**
```bash
# Pegar ID do container
CONTAINER_ID=$(docker ps | grep agente | awk '{print $1}')

# Ver logs
docker logs -f $CONTAINER_ID
```

**Deve mostrar:**
```
✅ Supabase conectado com sucesso!
🚀 Servidor rodando na porta 3005
✅ Sistema totalmente operacional!
```

---

### **3. Verificar health da aplicação:**
```bash
curl http://localhost:3005/api/health
```

**Deve retornar:**
```json
{"status":"ok","timestamp":"2024-11-11T..."}
```

---

## 🆘 Problemas Comuns

### **Container não inicia:**

**Verificar logs de erro:**
```bash
docker logs CONTAINER_ID --tail 50
```

**Causas comuns:**
- ❌ Porta 3005 já em uso
- ❌ Variáveis de ambiente faltando
- ❌ Erro no código (verificar último commit)
- ❌ Falta de memória

**Soluções:**
```bash
# Liberar porta
docker stop $(docker ps -q --filter "expose=3005")

# Recriar com variáveis corretas
docker-compose down
docker-compose up -d

# Verificar memória disponível
free -h
```

---

### **Container reinicia constantemente:**

**Verificar ciclo de reinicializações:**
```bash
docker ps -a | grep agente
```

Se STATUS mostrar "Restarting", há erro fatal.

**Verificar causa:**
```bash
docker logs CONTAINER_ID --tail 100
```

**Causas comuns:**
- ❌ Erro no código (exception não tratada)
- ❌ Supabase inacessível
- ❌ OpenAI API key inválida
- ❌ Dependências faltando

---

### **Container existe mas logs não aparecem:**

**Forçar rebuild completo:**

No Coolify:
1. Stop application
2. Delete containers
3. Force Rebuild & Redeploy

Ou via terminal:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📋 Checklist de Diagnóstico

Execute em ordem:

- [ ] 1. Container existe? `docker ps -a | grep agente`
- [ ] 2. Container está rodando? `docker ps | grep agente`
- [ ] 3. Aplicação responde? `curl localhost:3005/api/health`
- [ ] 4. Logs mostram erro? `docker logs CONTAINER_ID`
- [ ] 5. Variáveis configuradas? Verificar no Coolify
- [ ] 6. Porta acessível? `netstat -tuln | grep 3005`
- [ ] 7. Memória suficiente? `free -h`
- [ ] 8. Disco suficiente? `df -h`

---

## 🔄 Fluxo de Recreação

### **Se o container foi completamente perdido:**

```bash
# 1. Limpar containers antigos
docker ps -a | grep agente
docker rm -f CONTAINER_ID_ANTIGO

# 2. Limpar imagens antigas (opcional)
docker images | grep agente
docker rmi IMAGE_ID_ANTIGO

# 3. Rebuild do zero
docker build -t agente-financeiro .

# 4. Criar e iniciar novo container
docker run -d \
  --name agente-financeiro \
  -p 3005:3005 \
  -e OPENAI_API_KEY=sua_key \
  -e SUPABASE_URL=sua_url \
  -e SUPABASE_ANON_KEY=sua_key \
  -e JWT_SECRET=seu_secret \
  -e APP_URL=https://eduardo.agenciamidas.com \
  -e NODE_ENV=production \
  agente-financeiro

# 5. Verificar
docker ps
docker logs -f agente-financeiro
```

---

## 🚀 No Coolify Especificamente

### **Quando ver "No such container":**

1. **Ir em "Deployments"**
   - Ver histórico de deploys
   - Identificar último deploy bem sucedido

2. **Clicar em "Redeploy"**
   - Isso cria um NOVO container
   - Novo ID será gerado automaticamente
   - Coolify atualiza referências

3. **Aguardar build:**
   - Cloning repository...
   - Building image...
   - Creating container...
   - Starting container...
   - ✅ Running

4. **Logs devem aparecer:**
   - Com o novo container
   - Sem erro "No such container"

---

## 📊 Monitoramento Contínuo

### **Script de Monitoramento (opcional):**

Criar arquivo `monitor.sh`:

```bash
#!/bin/bash
while true; do
  clear
  echo "🔍 Monitoramento - $(date)"
  echo ""
  docker ps | grep agente || echo "❌ Container não encontrado"
  echo ""
  curl -s http://localhost:3005/api/health | jq . || echo "❌ API não responde"
  echo ""
  sleep 10
done
```

---

## ✅ Após Resolver

Quando o container estiver funcionando novamente:

1. ✅ `docker ps` mostra container rodando
2. ✅ Logs aparecem normalmente no Coolify
3. ✅ https://eduardo.agenciamidas.com funciona
4. ✅ `/api/health` retorna 200
5. ✅ Sistema totalmente operacional

---

## 🔗 Referências

- **Documentação Docker:** https://docs.docker.com
- **Coolify Docs:** https://coolify.io/docs
- **Script de verificação:** `./docker-check.sh`
- **Configuração:** `COOLIFY_SETUP.md`

---

**A solução é fazer REDEPLOY no Coolify!**

O código da aplicação está correto. O problema é apenas o container Docker que precisa ser recriado.

