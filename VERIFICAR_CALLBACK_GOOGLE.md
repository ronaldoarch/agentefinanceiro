# 🔍 VERIFICAR CALLBACK DO GOOGLE CALENDAR

## ❌ PROBLEMA IDENTIFICADO

Pelos logs, o callback **NÃO está sendo chamado**. Quando você autoriza no Google, o callback deveria aparecer nos logs com:

```
============================================================
📅 Google OAuth Callback recebido!
...
```

Mas isso **NÃO está aparecendo**, o que significa que o Google não está redirecionando para o seu servidor.

---

## ✅ VERIFICAÇÕES NECESSÁRIAS

### 1️⃣ **Verificar URL de Callback no Google Cloud Console**

1. Acesse: https://console.cloud.google.com/
2. Vá em **APIs & Services** > **Credentials**
3. Clique no seu **OAuth 2.0 Client ID**
4. Verifique a seção **"Authorized redirect URIs"**

**A URL DEVE SER EXATAMENTE:**
```
https://eduardo.agenciamidas.com/api/google/callback
```

**IMPORTANTE:**
- ✅ Deve começar com `https://`
- ✅ Deve terminar com `/api/google/callback`
- ✅ Deve ser EXATAMENTE igual (sem espaços, sem diferenças)
- ✅ Não pode ter `/` no final

---

### 2️⃣ **Verificar Variáveis de Ambiente no Coolify**

No Coolify, verifique se estas variáveis estão configuradas:

```env
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=https://eduardo.agenciamidas.com/api/google/callback
FRONTEND_URL=https://eduardo.agenciamidas.com
```

**IMPORTANTE:**
- ✅ `GOOGLE_REDIRECT_URI` deve ser EXATAMENTE igual à URL no Google Cloud Console
- ✅ Deve usar `https://` (não `http://`)
- ✅ Deve incluir o domínio completo

---

### 3️⃣ **Verificar se o Servidor Está Acessível**

Teste se o endpoint está acessível:

```bash
curl https://eduardo.agenciamidas.com/api/google/callback
```

Se retornar erro 404, o endpoint não está configurado corretamente.

---

### 4️⃣ **Verificar Logs Durante a Conexão**

Quando você clicar em "Conectar Google Agenda":

1. **Abra os logs do Coolify** em tempo real
2. **Clique em "Conectar Google Agenda"**
3. **Autorize no Google**
4. **Verifique se aparece nos logs:**

```
============================================================
📅 Google OAuth Callback recebido!
📅 Query params: {...}
```

**Se NÃO aparecer:**
- ❌ O callback não está sendo chamado
- ❌ URL de callback está errada no Google Cloud Console
- ❌ Redirecionamento não está funcionando

---

## 🔧 SOLUÇÃO

### Passo 1: Verificar e Corrigir URL no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Vá em **APIs & Services** > **Credentials**
3. Clique no seu **OAuth 2.0 Client ID**
4. Em **"Authorized redirect URIs"**, adicione/verifique:

```
https://eduardo.agenciamidas.com/api/google/callback
```

5. Clique em **"Save"**
6. **Aguarde 5-10 minutos** para propagação

---

### Passo 2: Verificar Variáveis no Coolify

1. No Coolify, vá em **Environment Variables**
2. Verifique se `GOOGLE_REDIRECT_URI` está exatamente:

```
https://eduardo.agenciamidas.com/api/google/callback
```

3. Se não estiver, **adicione/corrija**
4. **Faça REDEPLOY** após alterar variáveis

---

### Passo 3: Testar Novamente

1. **Aguarde 5-10 minutos** após alterar no Google Cloud Console
2. **Faça REDEPLOY** no Coolify
3. **Tente conectar novamente**
4. **Monitore os logs** em tempo real

---

## 📊 O QUE ESPERAR NOS LOGS

### ✅ **Se funcionar, você verá:**

```
============================================================
📅 Google OAuth Callback recebido!
📅 Query params: {
  "code": "...",
  "state": "1"
}
🔍 Code: presente
🔍 State (userId): 1
✅ userId convertido: 1
🔄 Trocando código por tokens...
✅ Tokens recebidos do Google!
💾 Salvando tokens no banco...
✅ UPDATE executado com sucesso!
📊 Linhas afetadas: 1
✅ Tokens salvos com sucesso!
🔍 Verificando se foi salvo corretamente...
📊 Status após salvar: CONECTADO ✅
============================================================
```

### ❌ **Se não funcionar:**

- Nenhum log do callback aparecerá
- Você será redirecionado mas não verá logs
- O token não será salvo

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Verifique se o domínio está correto** no Google Cloud Console
2. **Verifique se está usando HTTPS** (não HTTP)
3. **Aguarde 10 minutos** após alterações no Google Cloud
4. **Faça REDEPLOY** no Coolify
5. **Limpe cache do navegador** e tente novamente

---

## 📝 CHECKLIST

- [ ] URL no Google Cloud Console está correta
- [ ] URL usa HTTPS (não HTTP)
- [ ] URL termina com `/api/google/callback`
- [ ] Variável `GOOGLE_REDIRECT_URI` no Coolify está correta
- [ ] Fez REDEPLOY após alterar variáveis
- [ ] Aguardou 5-10 minutos após alterar no Google Cloud
- [ ] Logs do callback aparecem quando tenta conectar

---

**Execute este checklist e me diga o que encontrou!** 🔍

