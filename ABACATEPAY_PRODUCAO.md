# 🔄 Migrando AbacatePay para Produção

## 📋 Variáveis que PRECISAM ser alteradas no Coolify

Quando você mudar o AbacatePay para produção, você precisa atualizar estas variáveis de ambiente no Coolify:

### 1. **ABACATEPAY_API_KEY** ⚠️ OBRIGATÓRIO
- **O que é:** Chave da API do AbacatePay
- **Onde encontrar:** No painel do AbacatePay → Configurações → API Keys → **Chave de Produção**
- **Formato:** `abc_prod_xxxxxxxxxxxxx` (começa com `abc_prod_`)
- **Importante:** 
  - ❌ NÃO use a chave de desenvolvimento (`abc_dev_...`)
  - ✅ Use APENAS a chave de produção (`abc_prod_...`)

### 2. **ABACATEPAY_WEBHOOK_SECRET** ⚠️ OBRIGATÓRIO
- **O que é:** Secret para validar webhooks do AbacatePay
- **Onde encontrar:** No painel do AbacatePay → Configurações → Webhooks → **Webhook Secret**
- **Formato:** String longa (ex: `whsec_xxxxxxxxxxxxx`)
- **Importante:**
  - Em produção, webhooks SEM este secret serão REJEITADOS
  - Configure o webhook no AbacatePay apontando para: `https://seu-dominio.com/api/webhooks/abacatepay`

### 3. **NODE_ENV** ✅ JÁ DEVE ESTAR CONFIGURADO
- **Valor:** `production`
- **Onde verificar:** No Coolify, variáveis de ambiente
- **Importante:** Se não estiver como `production`, o sistema pode aceitar webhooks sem validação!

### 4. **APP_URL** ✅ JÁ DEVE ESTAR CONFIGURADO
- **Valor:** `https://seu-dominio.com` (seu domínio real)
- **Onde verificar:** No Coolify, variáveis de ambiente
- **Importante:** Deve ser a URL completa com `https://`

---

## 🔧 Passo a Passo no Coolify

### 1. Obter as Chaves no AbacatePay

1. Acesse o painel do AbacatePay: https://app.abacatepay.com
2. Vá em **Configurações** → **API Keys**
3. Copie a **Chave de Produção** (começa com `abc_prod_`)
4. Vá em **Configurações** → **Webhooks**
5. Copie o **Webhook Secret**

### 2. Configurar Webhook no AbacatePay

1. No painel do AbacatePay, vá em **Configurações** → **Webhooks**
2. Clique em **Adicionar Webhook** ou **Editar Webhook**
3. Configure:
   - **URL:** `https://seu-dominio.com/api/webhooks/abacatepay`
   - **Eventos:** Marque `billing.paid` (pagamento confirmado)
   - **Secret:** Anote o secret gerado (você vai usar na variável `ABACATEPAY_WEBHOOK_SECRET`)

### 3. Atualizar Variáveis no Coolify

1. Acesse seu projeto no Coolify
2. Vá em **Environment Variables** (Variáveis de Ambiente)
3. Atualize/Adicione estas variáveis:

```env
# AbacatePay - PRODUÇÃO
ABACATEPAY_API_KEY=abc_prod_SUA_CHAVE_AQUI
ABACATEPAY_WEBHOOK_SECRET=whsec_SEU_SECRET_AQUI

# Ambiente
NODE_ENV=production

# URL da aplicação (já deve estar configurada)
APP_URL=https://seu-dominio.com
```

### 4. Fazer Redeploy

⚠️ **IMPORTANTE:** Após alterar as variáveis, você DEVE fazer um **REDEPLOY** para que as mudanças tenham efeito!

1. No Coolify, clique em **Redeploy**
2. Aguarde o deploy completar
3. Verifique os logs para confirmar que está usando as chaves de produção

---

## ✅ Checklist de Verificação

Após configurar, verifique:

- [ ] `ABACATEPAY_API_KEY` começa com `abc_prod_` (não `abc_dev_`)
- [ ] `ABACATEPAY_WEBHOOK_SECRET` está configurado
- [ ] `NODE_ENV=production` está configurado
- [ ] `APP_URL` aponta para seu domínio real (com `https://`)
- [ ] Webhook configurado no AbacatePay apontando para `https://seu-dominio.com/api/webhooks/abacatepay`
- [ ] Redeploy foi feito após alterar as variáveis

---

## 🧪 Como Testar

### 1. Testar Criação de Pagamento

1. Acesse sua aplicação
2. Tente fazer um upgrade de plano
3. Verifique se o QR Code PIX é gerado corretamente
4. Nos logs, você deve ver:
   ```
   ✅ QR Code PIX criado com sucesso!
      Billing ID: ...
      Status: PENDING
      Dev Mode: false  ← Deve ser FALSE em produção
   ```

### 2. Testar Webhook

1. Faça um pagamento de teste (se o AbacatePay permitir)
2. Verifique os logs do servidor
3. Você deve ver:
   ```
   📥 Webhook recebido do AbacatePay
   🔐 Signature recebida: ...
   ✅ Assinatura do webhook válida
   💰 Pagamento confirmado via webhook!
   ✅ Ativando plano: ...
   ```

---

## ⚠️ Diferenças entre Dev e Produção

| Item | Desenvolvimento | Produção |
|------|----------------|----------|
| **API Key** | `abc_dev_...` | `abc_prod_...` |
| **Webhook Secret** | Opcional (aceita sem validação) | **OBRIGATÓRIO** (rejeita sem validação) |
| **NODE_ENV** | `development` | `production` |
| **Validação Webhook** | Aceita mesmo sem secret | **Rejeita** sem secret válido |
| **Dev Mode** | `true` | `false` |

---

## 🐛 Problemas Comuns

### Erro: "ABACATEPAY_API_KEY não configurada"
- **Solução:** Verifique se a variável está configurada no Coolify e se fez redeploy

### Erro: "Assinatura do webhook inválida"
- **Solução:** 
  1. Verifique se `ABACATEPAY_WEBHOOK_SECRET` está correto
  2. Verifique se o secret no AbacatePay é o mesmo
  3. Verifique se `NODE_ENV=production`

### Webhook não está chegando
- **Solução:**
  1. Verifique se a URL do webhook no AbacatePay está correta
  2. Verifique se seu servidor está acessível publicamente
  3. Verifique os logs do AbacatePay para ver se há erros

### Pagamentos não estão sendo confirmados
- **Solução:**
  1. Verifique se o webhook está configurado corretamente
  2. Verifique os logs do servidor para ver se o webhook está chegando
  3. Verifique se a validação do webhook está passando

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do servidor no Coolify
2. Verifique os logs do AbacatePay no painel
3. Verifique se todas as variáveis estão configuradas corretamente
4. Faça um redeploy após qualquer alteração

---

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- **NUNCA** compartilhe suas chaves de produção
- **NUNCA** commite as chaves no Git
- Use variáveis de ambiente no Coolify
- Mantenha o `ABACATEPAY_WEBHOOK_SECRET` seguro
- Em produção, webhooks SEM validação são REJEITADOS automaticamente

