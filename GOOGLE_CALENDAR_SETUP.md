# 📅 CONFIGURAÇÃO DO GOOGLE CALENDAR

## 🎯 GUIA COMPLETO DE CONFIGURAÇÃO

Este guia explica como configurar a integração com Google Calendar para permitir que o Agente Financeiro crie eventos automaticamente na agenda dos usuários.

---

## 📋 PRÉ-REQUISITOS

1. ✅ Conta no Google Cloud Console
2. ✅ Projeto criado no Google Cloud
3. ✅ Acesso ao Supabase (para adicionar colunas)

---

## 🚀 PASSO A PASSO

### 1️⃣ CRIAR PROJETO NO GOOGLE CLOUD CONSOLE

1. Acesse: https://console.cloud.google.com
2. Clique em **"Selecionar projeto"** (topo da página)
3. Clique em **"Novo Projeto"**
4. Nome do projeto: **"Agente Financeiro"**
5. Clique em **"Criar"**
6. Aguarde a criação (30-60 segundos)

---

### 2️⃣ ATIVAR GOOGLE CALENDAR API

1. No menu lateral, vá em: **APIs & Services** > **Library**
2. Procure por: **"Google Calendar API"**
3. Clique na API
4. Clique em **"Enable"** (Ativar)
5. Aguarde a ativação

---

### 3️⃣ CONFIGURAR TELA DE CONSENTIMENTO OAUTH

1. Menu lateral: **APIs & Services** > **OAuth consent screen**
2. Escolha: **External** (usuários externos)
3. Clique em **"Create"**

**Preencha:**
- **App name**: Agente Financeiro
- **User support email**: seu-email@gmail.com
- **Developer contact**: seu-email@gmail.com
- **App logo** (opcional): logo do seu app
- **App domain** (opcional): seu domínio

4. Clique em **"Save and Continue"**

**Scopes (Escopos):**
- Clique em **"Add or Remove Scopes"**
- Procure e adicione:
  - `https://www.googleapis.com/auth/calendar.events`
  - `https://www.googleapis.com/auth/calendar.readonly`
- Clique em **"Update"**
- Clique em **"Save and Continue"**

**Test users (Usuários de teste):**
- Clique em **"Add Users"**
- Adicione seu email e emails de teste
- Clique em **"Save and Continue"**

5. Clique em **"Back to Dashboard"**

---

### 4️⃣ CRIAR CREDENCIAIS OAUTH 2.0

1. Menu lateral: **APIs & Services** > **Credentials**
2. Clique em **"Create Credentials"** > **"OAuth client ID"**
3. **Application type**: Web application
4. **Name**: Agente Financeiro Web Client

**Authorized JavaScript origins:**
```
http://localhost:3001
https://seu-dominio.com
```

**Authorized redirect URIs:**
```
http://localhost:3001/api/google/callback
https://seu-dominio.com/api/google/callback
```

5. Clique em **"Create"**
6. **COPIE** o Client ID e Client Secret

---

### 5️⃣ ADICIONAR CREDENCIAIS NO .ENV

Adicione no arquivo `.env`:

```env
# Google Calendar API
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback
FRONTEND_URL=http://localhost:3000
```

**PRODUÇÃO (Coolify):**
```env
GOOGLE_REDIRECT_URI=https://seu-dominio.com/api/google/callback
FRONTEND_URL=https://seu-dominio.com
```

---

### 6️⃣ INSTALAR DEPENDÊNCIA

```bash
npm install googleapis
```

---

### 7️⃣ CRIAR COLUNAS NO SUPABASE

No **Supabase Dashboard** > **SQL Editor**:

Execute o arquivo: `ADD_GOOGLE_CALENDAR_COLUMNS.sql`

Ou copie e execute:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;

ALTER TABLE lembretes
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
```

---

### 8️⃣ FAZER DEPLOY

```bash
# Commit
git add .
git commit -m "feat: integração com Google Calendar"
git push

# Redeploy no Coolify
# Não esqueça de adicionar as variáveis de ambiente!
```

---

## 🧪 TESTAR A INTEGRAÇÃO

### 1️⃣ **Conectar Conta Google**

1. Login no sistema
2. Vá em **"🔗 Integrações"**
3. Clique em **"🔗 Conectar Google Agenda"**
4. Será redirecionado para o Google
5. **Faça login** (se não estiver logado)
6. **Permita** o acesso
7. Será redirecionado de volta
8. ✅ Verá: "Conectado - seu-email@gmail.com"

### 2️⃣ **Criar Lembrete**

**Opção A - Via Interface:**
1. Vá em **"📅 Lembretes"**
2. Clique em **"➕ Novo Lembrete"**
3. Preencha os campos
4. Salve
5. ✅ Lembrete criado no sistema
6. ✅ Evento criado no Google Agenda!

**Opção B - Via Chat IA:**
1. Vá em **"💬 Chat IA"**
2. Digite: "Me lembre de pagar a internet dia 20"
3. ✅ IA cria o lembrete
4. ✅ IA cria evento no Google Agenda!

### 3️⃣ **Verificar no Google Calendar**

1. Abra: https://calendar.google.com
2. Veja o evento criado!
3. Com título, descrição, valor e notificações

---

## 🎯 COMO FUNCIONA PARA O USUÁRIO

### **Primeira vez (ONE-TIME):**

```
1. Clica "Conectar Google Agenda"      (1 clique)
2. Tela do Google aparece              (automático)
3. Clica "Permitir"                    (1 clique)
4. Volta para o app                    (automático)
5. ✅ Conectado!
```

**Total:** 2 cliques apenas! Super simples! ✅

### **Depois de conectado:**

```
Tudo AUTOMÁTICO! ✨

- Cria lembrete → Google Agenda atualiza ✅
- Via interface → Google Agenda atualiza ✅
- Via Chat IA → Google Agenda atualiza ✅
- Via áudio → Google Agenda atualiza ✅

NÃO PRECISA FAZER NADA MANUALMENTE!
```

---

## 📱 BENEFÍCIOS PARA O USUÁRIO

### ✅ **Conveniência Total:**
- Lembretes no app que já usa (Google Calendar)
- Sincroniza com todos os dispositivos
- Notificações do Google (além do WhatsApp)
- Funciona offline

### ✅ **Produtividade:**
- 1 ação cria em 2 lugares
- Não precisa duplicar trabalho
- Tudo sincronizado automaticamente

### ✅ **Segurança:**
- OAuth seguro do Google
- Pode revogar acesso a qualquer momento
- Tokens criptografados no banco
- Acesso apenas ao calendário

---

## 🔐 SEGURANÇA E PRIVACIDADE

### **O que o app pode fazer:**
- ✅ Criar eventos no calendário
- ✅ Ler eventos do calendário
- ❌ NÃO pode acessar emails
- ❌ NÃO pode acessar arquivos do Drive
- ❌ NÃO pode acessar outros dados do Google

### **Como revogar acesso:**
1. Google Account: https://myaccount.google.com/permissions
2. Encontre "Agente Financeiro"
3. Clique em "Remover acesso"

Ou dentro do app:
1. Vá em **"🔗 Integrações"**
2. Clique em **"❌ Desconectar"**

---

## 🐛 TROUBLESHOOTING

### **Erro: "redirect_uri_mismatch"**
- Verifique se a URL de callback está correta no Google Cloud Console
- Deve ser exatamente: `http://localhost:3001/api/google/callback`
- Ou em produção: `https://seu-dominio.com/api/google/callback`

### **Erro: "invalid_client"**
- Verifique se o Client ID e Secret estão corretos no `.env`
- Reinicie o servidor após alterar o `.env`

### **Erro: "access_denied"**
- Usuário clicou em "Cancelar" na tela do Google
- Tente conectar novamente

### **Evento não foi criado:**
- Verifique se o usuário está conectado
- Verifique logs do servidor: `📅 Usuário conectado ao Google Calendar, criando evento...`
- Verifique se os tokens não expiraram

---

## 📊 ESTRUTURA DO BANCO DE DADOS

### **Tabela: users**
```sql
google_access_token       TEXT    -- Token de acesso
google_refresh_token      TEXT    -- Token de renovação
google_token_expiry       BIGINT  -- Timestamp de expiração
google_calendar_connected BOOLEAN -- Se está conectado
```

### **Tabela: lembretes**
```sql
google_calendar_event_id  TEXT    -- ID do evento no Google
```

---

## 🎨 MELHORIAS FUTURAS (OPCIONAL)

1. **Sincronização Bidirecional**
   - Editar no Google → Atualiza no app
   - Deletar no Google → Deleta no app

2. **Múltiplos Calendários**
   - Escolher em qual calendário criar
   - Calendários compartilhados

3. **Cores Personalizadas**
   - Categoria "Contas" → Vermelho
   - Categoria "Aluguel" → Azul
   - etc

4. **Google Tasks**
   - Integrar com Google Tasks também
   - Marcar como concluído sincroniza

---

## 📞 SUPORTE

**Documentação oficial:**
- Google Calendar API: https://developers.google.com/calendar
- OAuth 2.0: https://developers.google.com/identity/protocols/oauth2

**Quota da API:**
- Grátis: 1.000.000 requests/dia
- Mais que suficiente para qualquer uso!

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] Projeto criado no Google Cloud Console
- [ ] Google Calendar API ativada
- [ ] OAuth Consent Screen configurado
- [ ] Credenciais OAuth criadas
- [ ] Client ID e Secret copiados
- [ ] Variáveis adicionadas no `.env`
- [ ] `npm install googleapis` executado
- [ ] Colunas criadas no Supabase
- [ ] Código commitado e push feito
- [ ] Deploy realizado
- [ ] Variáveis de ambiente no Coolify configuradas
- [ ] Testado conectando conta
- [ ] Testado criando lembrete
- [ ] Evento apareceu no Google Calendar ✨

---

**Desenvolvido com 💜 para o Agente Financeiro**


