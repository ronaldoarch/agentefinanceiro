# 🚀 Configuração do Coolify - Agente Financeiro

## 📋 Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel do Coolify:

### Obrigatórias:

```bash
# OpenAI
OPENAI_API_KEY=sua_chave_openai_aqui

# Supabase
SUPABASE_URL=sua_url_supabase_aqui
SUPABASE_ANON_KEY=sua_chave_supabase_aqui

# JWT
JWT_SECRET=seu_secret_jwt_aqui_minimo_32_caracteres

# Aplicação
APP_URL=https://eduardo.agenciamidas.com
NODE_ENV=production
PORT=3005
```

### Opcionais (AbacatePay):

```bash
ABACATEPAY_API_KEY=sua_chave_abacatepay_aqui
ABACATEPAY_STORE_ID=seu_store_id_aqui
ABACATEPAY_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

### Alertas (Opcionais):

```bash
ALERTA_GASTO_ALTO=500
ALERTA_LIMITE_MENSAL=3000
```

---

## 🐳 Configuração do Container

### Porta Exposta:
```
3005
```

### Porta Interna:
```
3005
```

### Healthcheck:
```
/api/health
```

---

## 📁 Volumes Persistentes

Se usar volumes no Coolify, configure:

```
/app/data - Para persistir dados (se usar SQLite local)
/app/auth_info_baileys - Para sessão do WhatsApp
```

**Nota:** Como estamos usando Supabase, os volumes não são críticos, mas ajudam com a sessão do WhatsApp.

---

## 🔧 Comandos de Build

### Build Command (se necessário):
```bash
npm install && cd client && npm install --legacy-peer-deps && npm run build && cd ..
```

### Start Command:
```bash
npm start
```

---

## 🔍 Troubleshooting

### Erro: "No such container"

**Causa:** Container Docker foi removido ou falhou ao iniciar.

**Solução:**
1. No Coolify, vá em "Actions"
2. Clique em "Redeploy" ou "Rebuild"
3. Aguarde o build completar
4. Verifique os logs

### Erro: "EADDRINUSE"

**Causa:** Porta já em uso.

**Solução:**
1. Certifique-se de que apenas uma instância está rodando
2. No Coolify, pare a aplicação
3. Inicie novamente

### Erro: "Cannot find module"

**Causa:** Dependências não instaladas.

**Solução:**
1. Verifique se o Dockerfile está correto
2. Certifique-se de que `npm install` foi executado
3. Faça rebuild completo

### Build Falha

**Causa:** Problemas com frontend build.

**Solução:**
1. Verifique logs do build
2. Certifique-se de que `client/package.json` existe
3. Verifique se tem memória suficiente (mínimo 2GB)

### Container Reinicia Constantemente

**Causa:** Erro no código ou variáveis de ambiente faltando.

**Solução:**
1. Verifique logs: `docker logs container_name`
2. Certifique-se de que todas as variáveis obrigatórias estão configuradas
3. Verifique se Supabase está acessível

---

## 🎯 Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] ✅ Todas as variáveis de ambiente configuradas
- [ ] ✅ `APP_URL` apontando para o domínio correto
- [ ] ✅ Supabase configurado e acessível
- [ ] ✅ OpenAI API Key válida
- [ ] ✅ JWT_SECRET com mínimo 32 caracteres
- [ ] ✅ Porta 3005 disponível
- [ ] ✅ Domínio apontando para o servidor
- [ ] ✅ SSL configurado (HTTPS)

---

## 🔄 Redeploy Após Atualização do Código

Sempre que fizer `git push`:

1. **No Coolify:**
   - Vá em "Deployments"
   - Clique em "Redeploy"
   - Ou configure "Auto Deploy" para fazer automaticamente

2. **Aguarde:**
   - Build do backend
   - Build do frontend
   - Start do container
   - Health check passar

3. **Verifique:**
   - Logs não mostram erros
   - `/api/health` retorna 200
   - Aplicação está acessível

---

## 📊 Monitoramento

### Endpoints para Verificar:

```bash
# Health check
curl https://eduardo.agenciamidas.com/api/health

# Deve retornar:
{"status":"ok","timestamp":"2024-..."}
```

### Logs:

```bash
# Ver logs do container
docker logs -f container_name

# Procurar por:
✅ Servidor rodando na porta 3005
✅ Supabase conectado com sucesso
✅ Sistema totalmente operacional
```

---

## 🆘 Suporte

Se o problema persistir:

1. **Verifique logs completos do Coolify**
2. **Verifique se o container está rodando:**
   ```bash
   docker ps | grep agente
   ```
3. **Force rebuild:**
   - No Coolify: "Force Rebuild & Redeploy"

4. **Última opção - Recreate:**
   - Deletar aplicação no Coolify
   - Criar novamente do zero
   - Reconfigurar variáveis de ambiente

---

## ✅ Deploy Bem Sucedido

Quando tudo estiver funcionando, você verá:

```
✅ Container rodando
✅ /api/health retorna 200
✅ https://eduardo.agenciamidas.com carrega
✅ Login funciona
✅ Dashboard carrega
✅ Upgrade funciona
✅ Página de sucesso funciona
```

---

**Última atualização:** Commit b7d8d6f
**Repositório:** https://github.com/ronaldoarch/agentefinanceiro

