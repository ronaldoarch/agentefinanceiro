# 🔒 SOLUÇÃO DEFINITIVA - Persistência de Dados

## 🚨 PROBLEMA IDENTIFICADO

```
🆕 Criando novo banco: /app/data/database.sqlite
📊 Tamanho do banco: 0.00 KB
📊 Registros: Usuários: 0, Transações: 0
```

**Banco sendo RECRIADO a cada deploy!**

---

## ⚠️ CAUSA RAIZ

O Coolify está **DESTRUINDO os volumes** quando você clica em **"Redeploy"**.

**Por que acontece:**
- "Redeploy" = Reconstruir tudo do zero
- Volumes podem ser destruídos no processo
- Banco de dados volta ao estado inicial
- Todos os dados são perdidos

---

## ✅ SOLUÇÃO DEFINITIVA

### REGRA DE OURO:

```
❌ NUNCA use "Redeploy" após ter dados!
✅ SEMPRE use "Restart" para manter volumes!
```

### Fluxo Correto:

**Quando atualizar código:**

```
1. git add .
2. git commit -m "..."
3. git push
   ↓
4. No Coolify: STOP (não Redeploy!)
5. Aguardar status "Stopped"
6. Deploy (vai pegar código novo)
7. Aguardar "Running"
   ↓
✅ Volumes mantidos!
✅ Dados preservados!
```

**Para mudanças SEM atualizar código:**

```
Coolify → Restart
✅ Mantém tudo!
```

---

## 🛠️ CONFIGURAÇÃO DE VOLUMES NO COOLIFY

### Passo a Passo Detalhado:

**1. Acessar Volumes:**
```
Seu App → Configuration → Storage (ou Volumes ou Persistent Storage)
```

**2. Verificar Se Existe:**

Se JÁ existe um volume em `/app/data`:
- ✅ Verificar que Type = "Volume" ou "Persistent"
- ✅ Verificar que NÃO tem "Temporary" ou "Destroy on redeploy"
- ✅ Se tiver essas opções ruins, DELETAR e recriar

**3. Criar Volume Correto:**

Clique em "Add Volume" ou "+":

```
Name/Label: database (ou agente-data)
Source: [deixe vazio - Coolify cria automaticamente]
Mount Path: /app/data
Type: Volume (NÃO Bind Mount, NÃO Temporary)
```

**4. Criar Volume para WhatsApp (Opcional):**

```
Name: whatsapp-session
Mount Path: /app/auth_info_baileys
Type: Volume
```

**5. Salvar e NÃO fazer Redeploy ainda!**

---

## 🎯 RESETAR SISTEMA CORRETAMENTE

Como o banco foi recriado, você precisa:

**1. Parar Aplicação:**
```
Coolify → Stop
```

**2. Verificar/Criar Volumes:**
```
Configuration → Storage → Verificar /app/data
```

**3. Deploy Limpo:**
```
Deploy (vai criar banco novo nos volumes)
```

**4. Aguardar Iniciar:**
```
Logs → Ver "Usuário admin criado"
```

**5. Login Inicial:**
```
Email: ronaldohunter54@gmail.com
Senha: 491653Auror@
```

**6. A PARTIR DE AGORA:**

```
✅ Use RESTART (não Redeploy!)
✅ Ou Stop → Deploy (não Redeploy!)
✅ NUNCA mais use Redeploy!
```

---

## 📊 DIFERENÇA ENTRE COMANDOS

### RESTART (✅ Use Este):
```
✅ Mantém volumes
✅ Mantém dados
✅ Apenas reinicia container
✅ Rápido (30 segundos)
✅ Seguro
```

### STOP → DEPLOY (✅ Use Para Atualizar Código):
```
✅ Mantém volumes (se configurados)
✅ Mantém dados
✅ Pega código novo do GitHub
✅ Rebuild da imagem
✅ Demora mais (3-5 min)
```

### REDEPLOY (❌ NUNCA Use!):
```
❌ Pode destruir volumes
❌ Pode perder dados
❌ Reconstrói TUDO
❌ Só use se quiser resetar TUDO
❌ EVITE!
```

---

## 🧪 TESTE DE PERSISTÊNCIA

Após configurar volumes corretamente:

**1. Deploy inicial**
```
Coolify → Deploy
Aguardar → Ver logs
```

**2. Criar transação de teste**
```
Login → Chat: "Gastei 100 reais"
Dashboard → Ver transação
```

**3. TESTE CRÍTICO - Restart**
```
Coolify → Restart
Aguardar 30 segundos
```

**4. Verificar dados**
```
Login novamente
Dashboard
✅ Transação de R$ 100 DEVE estar lá!
```

**5. Verificar logs**
```
✅ Banco de dados encontrado (não criando novo!)
📊 Registros: Transações: 1
```

**✅ Se transação permaneceu** = RESOLVIDO!  
**❌ Se sumiu** = Volumes ainda não persistindo

---

## 🎯 COMANDOS NO TERMINAL DO COOLIFY

Se quiser verificar manualmente:

**Ver se volume está montado:**
```bash
df -h | grep data
mount | grep data
```

**Criar arquivo de teste:**
```bash
echo "teste-persistencia-$(date)" > /app/data/teste.txt
cat /app/data/teste.txt
```

**Restart e verificar:**
```bash
# Após Restart no Coolify:
cat /app/data/teste.txt
# ✅ Se mostrar = Volume persistindo!
# ❌ Se erro = Volume não persistindo!
```

**Ver conteúdo do volume:**
```bash
ls -lah /app/data/
du -sh /app/data/
```

---

## 💡 ALTERNATIVA: Usar Bind Mount

Se volumes do Coolify não funcionarem:

**No Coolify:**

```
Storage → Add Storage

Type: Bind Mount (ao invés de Volume)
Host Path: /var/lib/coolify/storage/agente-financeiro
Container Path: /app/data
```

Isso garante que os dados ficam no host, não no volume Docker.

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [ ] Volumes configurados em /app/data
- [ ] Type = "Volume" ou "Persistent" (NÃO Temporary)
- [ ] Destroy on redeploy = NO ou disabled
- [ ] Fazer Deploy inicial (não Redeploy)
- [ ] Adicionar dados de teste
- [ ] Fazer RESTART (não Redeploy)
- [ ] Verificar se dados permanecem
- [ ] ✅ A partir de agora, SEMPRE usar Restart!

---

## 🚀 AÇÃO IMEDIATA

**FAÇA AGORA:**

1. **No Coolify:**
   - Configuration → Storage/Volumes
   - Verificar se `/app/data` está como "Volume" (não Temporary)

2. **Stop** a aplicação

3. **Verificar novamente** volumes (importante!)

4. **Deploy** (vai criar banco limpo nos volumes)

5. **Aguardar logs:**
   ```
   🆕 Criando novo banco (normal na primeira vez)
   👤 Usuário admin criado
   ```

6. **Login e adicionar transação teste:**
   ```
   Chat: "Gastei 50 reais de teste"
   ```

7. **TESTE CRÍTICO - RESTART (não Redeploy!):**
   ```
   Coolify → Restart
   ```

8. **Ver logs após Restart:**
   ```
   ✅ Banco de dados encontrado (NÃO criando novo!)
   📊 Transações: 1 (manteve!)
   ```

9. **Login e verificar:**
   ```
   ✅ Transação de R$ 50 deve estar lá!
   ```

**Se isso funcionar** = Problema resolvido, basta usar Restart!  
**Se ainda perder dados** = Volumes não estão persistindo (me avise)

---

## 📞 ME ENVIE

Após fazer Stop → Deploy → Adicionar Teste → Restart:

**Me diga:**
1. Volume está configurado como "Volume" ou "Persistent"?
2. Após Restart, os logs mostram "Banco encontrado" ou "Criando novo"?
3. Transação teste permaneceu após Restart?

---

## 🎯 RESUMO

```
PROBLEMA: Redeploy destrói volumes
SOLUÇÃO: Usar Restart ao invés de Redeploy
TESTE: Stop → Deploy → Teste → Restart → Verificar
```

---

**Configure os volumes, faça Deploy limpo, teste com Restart e me avise!** 🚀
