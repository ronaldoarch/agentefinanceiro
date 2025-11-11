# 🚀 Configuração para Produção

## Configuração da URL da Aplicação

Para que os redirects de pagamento funcionem corretamente em produção, você precisa configurar a variável de ambiente `APP_URL`.

### 📝 Variável de Ambiente Necessária

```bash
APP_URL=https://eduardo.agenciamidas.com
```

### 🔧 Como Configurar

#### No servidor de produção:

1. **Criar arquivo `.env` na raiz do projeto:**

```bash
# Application URL - IMPORTANTE para redirects de pagamento
APP_URL=https://eduardo.agenciamidas.com

# Outras variáveis necessárias
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sua_chave_aqui
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui
ABACATEPAY_API_KEY=sua_chave_aqui
JWT_SECRET=seu_secret_aqui
```

2. **Ou configurar variáveis de ambiente no painel de hospedagem:**
   - Coolify, Heroku, Vercel, etc.
   - Adicionar: `APP_URL=https://eduardo.agenciamidas.com`

### ✅ O Que Essa Configuração Faz

Quando configurado corretamente, o sistema irá:

1. ✅ Redirecionar para `https://eduardo.agenciamidas.com/payment/success` após pagamento aprovado
2. ✅ Passar o plano ativado na URL: `?plan=premium&amount=39.90`
3. ✅ Exibir a página de sucesso com informações corretas
4. ✅ Atualizar o plano do usuário automaticamente

### 🎯 Fluxo Completo de Pagamento

```
1. Usuário seleciona plano
   ↓
2. Sistema cria pagamento no AbacatePay
   ↓
3. Usuário paga via PIX
   ↓
4. AbacatePay confirma pagamento
   ↓
5. Sistema atualiza plano do usuário
   ↓
6. Redireciona para: https://eduardo.agenciamidas.com/payment/success?plan=premium
   ↓
7. Página de sucesso mostra:
   - ✓ Checkmark animado
   - 💎 Plano ativado
   - 📋 Features do plano
   - ⏱️ Countdown 5s
   ↓
8. Redireciona automaticamente para Dashboard
```

### 🧪 Testar em Desenvolvimento

Em desenvolvimento (localhost), o sistema usa automaticamente:
```
http://localhost:3001/payment/success
```

### 📌 Importante

- ⚠️ **SEM** a barra final: `https://eduardo.agenciamidas.com` ✅
- ❌ **COM** barra final: `https://eduardo.agenciamidas.com/` ❌

### 🔍 Verificar se está Funcionando

1. Fazer um pagamento de teste
2. Após aprovação, deve redirecionar para:
   ```
   https://eduardo.agenciamidas.com/payment/success?plan=premium&amount=39.90
   ```
3. Página de sucesso deve carregar com animação
4. Plano do usuário deve ser atualizado

### 🆘 Troubleshooting

**Problema:** Não redireciona após pagamento
- ✅ Verificar se `APP_URL` está configurado
- ✅ Verificar se não tem barra final
- ✅ Reiniciar servidor após configurar

**Problema:** Página de sucesso não carrega
- ✅ Verificar se frontend foi buildado: `cd client && npm run build`
- ✅ Verificar se rota está configurada no `App.js`

**Problema:** Plano não atualiza
- ✅ Verificar logs do servidor
- ✅ Verificar webhook do AbacatePay
- ✅ Verificar conexão com Supabase

### 📊 URLs de Callback

O sistema configura automaticamente:

- **returnUrl:** `${APP_URL}/` - Onde voltar se cancelar
- **completionUrl:** `${APP_URL}/payment/success?plan=${plan}&amount=${amount}` - Após sucesso

---

✅ **Configuração concluída!**

Para qualquer dúvida, verifique os logs do servidor ou entre em contato com o suporte técnico.

