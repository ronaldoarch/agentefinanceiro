# 🎯 CONFIGURAÇÃO ABACATEPAY

## ✅ O QUE FOI IMPLEMENTADO:

1. ✅ Serviço de integração com AbacatePay (`services/abacatepay.js`)
2. ✅ Rota para criar QR Code PIX (`POST /api/payments/request`)
3. ✅ Rota para verificar status (`GET /api/payments/:id/status`)
4. ✅ Webhook para confirmação automática (`POST /api/webhooks/abacatepay`)
5. ✅ Atualização automática de plano após pagamento

---

## 🔧 VARIÁVEIS DE AMBIENTE NO COOLIFY:

Adicione estas variáveis no Coolify:

```bash
# AbacatePay
ABACATEPAY_API_KEY=abc_dev_akjEZbHaTeCJKc16kxWgjh6X
ABACATEPAY_WEBHOOK_SECRET=sua_chave_secreta_webhook

# URL da aplicação (para callbacks)
APP_URL=https://seu-dominio.com
```

---

## 📋 PASSOS PARA CONFIGURAR:

### 1️⃣ **No Coolify:**

1. Vá em **Environment Variables**
2. Adicione:
   - `ABACATEPAY_API_KEY` = `abc_dev_akjEZbHaTeCJKc16kxWgjh6X`
   - `APP_URL` = Sua URL do Coolify (ex: `https://agentefinanceiro.seu-dominio.com`)

### 2️⃣ **No Dashboard do AbacatePay:**

1. Acesse: https://dashboard.abacatepay.com
2. Vá em **Configurações** > **Webhooks**
3. Adicione URL do webhook:
   ```
   https://seu-dominio.com/api/webhooks/abacatepay
   ```
4. Eventos para escutar:
   - ✅ `billing.paid` (pagamento confirmado)
   - ✅ `billing.expired` (pagamento expirado)

### 3️⃣ **Configurar Chave do Webhook:**

1. No AbacatePay, copie a **Chave de Assinatura do Webhook**
2. Adicione no Coolify:
   - `ABACATEPAY_WEBHOOK_SECRET` = `chave_copiada`

---

## 🚀 COMO FUNCIONA:

### **Fluxo de Pagamento:**

1. **Usuário clica em "Upgrade"**
   - Frontend chama `POST /api/payments/request`
   - Backend cria cobrança no AbacatePay
   - Retorna QR Code PIX

2. **Usuário escaneia QR Code**
   - Paga no banco
   - AbacatePay confirma pagamento

3. **Webhook automático**
   - AbacatePay chama `/api/webhooks/abacatepay`
   - Sistema atualiza plano automaticamente
   - Usuário vê upgrade imediato

4. **Verificação manual (opcional)**
   - Frontend pode chamar `GET /api/payments/:id/status`
   - Para checar status em tempo real

---

## 🧪 TESTAR EM DEV MODE:

O AbacatePay tem **modo de desenvolvimento** que permite simular pagamentos:

1. Documentação: https://docs.abacatepay.com/pages/getting-started/dev-mode
2. Endpoint de simulação: `POST /v1/billing/simulate-payment`
3. Simule pagamento sem precisar pagar de verdade

---

## 📊 ESTRUTURA DE RESPOSTA:

### **Criar Pagamento (POST /api/payments/request):**

```json
{
  "success": true,
  "payment_id": 123,
  "billing_id": "bill_abc123",
  "plan": "premium",
  "amount": 39.90,
  "qr_code": "data:image/png;base64,...",
  "pix_copia_cola": "00020126...999",
  "payment_url": "https://pay.abacatepay.com/...",
  "expires_at": "2024-12-25T23:59:59Z"
}
```

### **Verificar Status (GET /api/payments/:id/status):**

```json
{
  "status": "paid",
  "paid_at": "2024-12-25T12:34:56Z"
}
```

---

## ⚠️ IMPORTANTE:

1. **Produção:** Trocar chave de dev (`abc_dev_...`) por chave de produção (`abc_live_...`)
2. **Webhook:** Configurar URL correta no dashboard do AbacatePay
3. **HTTPS:** Webhook só funciona com HTTPS (Coolify já tem)

---

## 🐛 TROUBLESHOOTING:

### **QR Code não aparece:**
- Verificar se `ABACATEPAY_API_KEY` está configurada
- Ver logs do servidor: erro da API aparece no console

### **Pagamento não confirma automaticamente:**
- Verificar se webhook está configurado no AbacatePay
- Verificar se `ABACATEPAY_WEBHOOK_SECRET` está correta
- Ver logs do webhook: `/api/webhooks/abacatepay`

### **Erro 401 da API:**
- Chave API inválida ou expirada
- Gerar nova chave no dashboard do AbacatePay

---

## 📚 DOCUMENTAÇÃO OFICIAL:

- **AbacatePay Docs:** https://docs.abacatepay.com
- **API Reference:** https://docs.abacatepay.com/pages/api
- **Webhooks:** https://docs.abacatepay.com/pages/webhooks
- **Dev Mode:** https://docs.abacatepay.com/pages/getting-started/dev-mode

---

**Integração completa e funcional!** 🎉

