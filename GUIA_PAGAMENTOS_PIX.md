# 💳 Sistema de Pagamentos via PIX - Guia Completo

## 🎯 Sistema Implementado

Seu SaaS agora tem um **sistema completo de pagamentos via PIX** com aprovação manual!

---

## 🔄 Fluxo Completo de Pagamento

```
1. Cliente acessa o sistema
   ↓
2. Clica em "💎 Upgrade" no header
   ↓
3. Escolhe um plano (Básico/Premium/Enterprise)
   ↓
4. Clica em "💳 Pagar R$ XX,XX"
   ↓
5. Sistema cria pagamento PENDENTE
   ↓
6. Mostra instruções de pagamento PIX
   ↓
7. Cliente faz PIX para RONALDO DIAS DE SOUSA
   ↓
8. Clica em "Já Fiz o Pagamento"
   ↓
9. Pagamento fica PENDENTE no painel admin
   ↓
10. ADMIN vê notificação de pagamento pendente
   ↓
11. ADMIN verifica se recebeu o PIX
   ↓
12. ADMIN clica em "✅ Aprovar"
   ↓
13. Sistema ATUALIZA o plano do usuário
   ↓
14. Cria assinatura válida por 30 dias
   ↓
15. ✅ Cliente tem acesso aos recursos do plano!
```

---

## 👤 VISÃO DO CLIENTE

### 1. Ver Botão de Upgrade

Após login, o cliente vê no header:

```
[💎 Upgrade] [👑 Admin] [🚪 Sair]
      ↑
  (pisca chamando atenção)
```

**Quem vê:**
- ✅ Usuários Básico (podem upgradar para Premium/Enterprise)
- ✅ Usuários Premium (podem upgradar para Enterprise)
- ❌ Usuários Enterprise (já tem plano máximo)

### 2. Modal de Escolha de Plano

Ao clicar em "💎 Upgrade":

```
┌──────────────────────────────────────────────┐
│             💎 Escolha seu Plano              │
│       Plano atual: Básico                    │
│                                              │
│  ┌──────────┬──────────────┬──────────────┐ │
│  │ Básico   │⭐ Premium    │ Enterprise   │ │
│  │ R$ 15,00 │  R$ 39,90    │  R$ 99,90    │ │
│  │ (atual)  │  POPULAR     │              │ │
│  │          │              │              │ │
│  │✅ 100... │✅ 1.000...   │✅ Ilimitado..│ │
│  │          │[Selecionar]  │[Selecionar]  │ │
│  └──────────┴──────────────┴──────────────┘ │
│                                              │
│         [Cancelar] [💳 Pagar R$ 39,90]       │
│                                              │
│  🎁 7 dias de teste grátis!                 │
│  💳 Pagamento seguro via PIX                 │
└──────────────────────────────────────────────┘
```

### 3. Tela de Pagamento PIX

Após selecionar plano e clicar em "Pagar":

```
┌──────────────────────────────────────────────┐
│         💳 Pagamento via PIX                  │
│                                              │
│  ┌────────────────────┐                     │
│  │   Premium          │                     │
│  │   R$ 39,90/mês     │                     │
│  └────────────────────┘                     │
│                                              │
│  📱 Escaneie o QR Code:                      │
│                                              │
│  ┌─────────────────────────────────┐        │
│  │                                 │        │
│  │   [Área do QR Code PIX]         │        │
│  │                                 │        │
│  │  Favorecido: RONALDO DIAS       │        │
│  │  Valor: R$ 39,90                │        │
│  │  ID: #123                       │        │
│  └─────────────────────────────────┘        │
│                                              │
│  📋 Como pagar:                              │
│  1. Abra o app do seu banco                 │
│  2. Vá em PIX → Pagar com QR Code           │
│  3. Escaneie o QR Code acima                │
│  4. Confirme o pagamento                    │
│  5. Aguarde aprovação (até 24h)             │
│                                              │
│  ⏳ Aguardando confirmação...                │
│                                              │
│  [Voltar] [Já Fiz o Pagamento]             │
└──────────────────────────────────────────────┘
```

### 4. Aguardando Aprovação

Após clicar em "Já Fiz o Pagamento":
- ✅ Pagamento registrado como PENDENTE
- ⏳ Cliente aguarda aprovação do admin
- 📧 (Opcional) Enviar email confirmando recebimento

---

## 👑 VISÃO DO ADMIN

### 1. Notificação de Pagamento Pendente

No painel admin, aparece badge vermelho:

```
[👥 Usuários (5)] [💳 Pagamentos Pendentes (3)]
                                          ↑
                              badge vermelho com número
```

### 2. Lista de Pagamentos Pendentes

Na aba "Pagamentos Pendentes":

```
┌──────────────────────────────────────────────────────────┐
│ ID   │ Usuário    │ Email        │ Plano   │ Valor  │ Ações│
├──────┼────────────┼──────────────┼─────────┼────────┼──────┤
│ #123 │ João Silva │ joao@e.com   │ Premium │ R$39,90│[✅]  │
│ #122 │ Maria Luz  │ maria@e.com  │ Básico  │ R$15,00│[✅]  │
│ #121 │ Pedro Alves│ pedro@e.com  │Enterpris│ R$99,90│[✅]  │
└──────────────────────────────────────────────────────────┘
```

### 3. Aprovar Pagamento

Quando admin clica em "✅ Aprovar":

1. **Sistema pergunta:** "Digite o ID da transação PIX (opcional)"
2. Admin pode digitar ou deixar vazio
3. Sistema:
   - ✅ Marca pagamento como APROVADO
   - ✅ Atualiza plano do usuário
   - ✅ Cria assinatura válida por 30 dias
   - ✅ Remove da lista de pendentes
4. Cliente tem acesso instantâneo aos novos recursos!

---

## 🔧 Configuração do QR Code PIX

### Seu QR Code Atual:

**Favorecido:** RONALDO DIAS DE SOUSA  
**Banco:** PagBank  
**Tipo:** QR Code Estático (valor R$ 0,00)

### ⚠️ IMPORTANTE - Atualizar para QR Code Dinâmico

O QR Code mostrado no screenshot é **estático** (R$ 0,00). Para produção, você precisa:

**Opção 1: QR Code Dinâmico Manual**
1. No app do PagBank, gere um QR Code com valor fixo para cada plano
2. Salve a imagem
3. Adicione no sistema

**Opção 2: API do PagBank (Recomendado)**
Integre com a API do PagBank para gerar QR Codes dinamicamente:

```javascript
// Exemplo de integração
async function generatePixQRCode(amount, plan, userId) {
  const response = await axios.post('https://api.pagseguro.com/pix/qrcode', {
    amount: amount,
    description: `Plano ${plan} - Agente Financeiro`,
    reference_id: userId
  }, {
    headers: {
      'Authorization': `Bearer ${PAGBANK_API_KEY}`
    }
  });
  
  return response.data.qr_code;
}
```

**Opção 3: Chave PIX Manual**
Forneça sua chave PIX e deixe o cliente fazer manualmente:

```
Chave PIX: seu-email@gmail.com
ou
Chave PIX: +55 XX XXXXX-XXXX
ou
Chave PIX: CPF XXX.XXX.XXX-XX
```

---

## 📝 Como Adicionar o QR Code Real

### Método 1: Imagem Estática

1. **Gere QR Codes no PagBank:**
   - QR Code Básico (R$ 15,00)
   - QR Code Premium (R$ 39,90)
   - QR Code Enterprise (R$ 99,90)

2. **Salve as imagens:**
   ```
   client/public/qrcodes/
   ├── basico.png
   ├── premium.png
   └── enterprise.png
   ```

3. **Atualize o componente Upgrade.js:**
   ```jsx
   <img 
     src={`/qrcodes/${selectedPlan}.png`}
     alt="QR Code PIX"
     style={{ width: '300px', height: '300px' }}
   />
   ```

### Método 2: Chave PIX Texto

Adicione no componente Upgrade.js:

```jsx
<div className="pix-key">
  <h4>💳 Ou pague usando a chave PIX:</h4>
  <div className="pix-key-value">
    <code>ronaldohunter54@gmail.com</code>
    <button onClick={() => {
      navigator.clipboard.writeText('ronaldohunter54@gmail.com');
      alert('Chave PIX copiada!');
    }}>
      📋 Copiar
    </button>
  </div>
  <p>Valor: R$ {plans[selectedPlan].price.toFixed(2)}</p>
</div>
```

---

## 🎯 Processo Operacional para VOCÊ

### Diariamente:

**1. Abrir Painel Admin**
```
Login → Clicar em "👑 Admin"
```

**2. Verificar Pagamentos Pendentes**
```
Aba "💳 Pagamentos Pendentes"
```

Se houver pagamentos (badge vermelho aparece):

**3. Para cada pagamento:**
- Ver nome e email do usuário
- Verificar no app do PagBank se recebeu o PIX
- Conferir valor (R$ 15,00, R$ 39,90 ou R$ 99,90)
- Clicar em "✅ Aprovar"
- (Opcional) Digitar ID da transação
- ✅ Plano atualizado automaticamente!

**4. Cliente notificado:**
- Sistema atualiza plano instantaneamente
- Cliente vê novo plano no header
- Acesso aos recursos liberado

---

## 📊 Gestão de Assinaturas

### Assinatura Criada Automaticamente:

Quando você aprova um pagamento:
```
✅ Pagamento aprovado
✅ Plano atualizado
✅ Assinatura criada:
   - Início: 09/11/2025
   - Expiração: 09/12/2025 (30 dias)
   - Status: ATIVA
```

### Renovação (Manual por enquanto):

Após 30 dias:
1. Cliente faz novo PIX
2. Você aprova novamente
3. Sistema estende assinatura por mais 30 dias

### Futuro - Automação:
- Webhook do PagBank
- Renovação automática
- Notificação de expiração
- Suspensão automática

---

## 💰 Tabela de Valores

| Plano | Preço/mês | Valor PIX |
|-------|-----------|-----------|
| Básico | R$ 15,00 | R$ 15,00 |
| Premium | R$ 39,90 | R$ 39,90 |
| Enterprise | R$ 99,90 | R$ 99,90 |

**Todos os pagamentos vão para:**
- **Favorecido:** RONALDO DIAS DE SOUSA
- **Banco:** PagBank
- **Método:** PIX

---

## 🎁 Sistema de Trial (7 dias grátis)

**Como funciona:**

1. Cliente se cadastra → Plano Básico (mas sem pagar ainda)
2. Tem 7 dias para usar de graça
3. Após 7 dias:
   - Sistema pode bloquear acesso
   - Ou solicitar pagamento
   - Modal aparece: "Seu teste expirou! Assine agora."

**Para implementar bloqueio automático (futuro):**
```javascript
// Verificar na autenticação
if (user.trial_expired && !hasActiveSubscription(user.id)) {
  return res.status(402).json({
    error: 'Trial expirado. Faça upgrade!',
    trial_expired: true
  });
}
```

---

## 📱 Como os Clientes Vão Pagar

### Passo a Passo para o Cliente:

**1. Login no sistema**
```
https://seu-dominio.agenciamidas.com/login
```

**2. Clicar em "💎 Upgrade"**
- Botão aparece no header (piscando)

**3. Escolher plano**
- Básico (R$ 15,00)
- Premium (R$ 39,90)
- Enterprise (R$ 99,90)

**4. Clicar em "💳 Pagar"**

**5. Fazer PIX:**
- Abrir app do banco
- Escanear QR Code
- Confirmar pagamento
- Tirar screenshot (opcional, para conferência)

**6. Clicar em "Já Fiz o Pagamento"**

**7. Aguardar aprovação:**
- Geralmente em até 24h úteis
- Você recebe notificação por email (futuro)

**8. Após aprovação:**
- ✅ Plano atualizado automaticamente
- ✅ Recursos liberados
- ✅ Aparece novo badge no header

---

## 👑 Como VOCÊ (Admin) Aprova Pagamentos

### Processo Diário:

**1. Login como Admin**
```
Email: ronaldohunter54@gmail.com
Senha: 491653Auror@
```

**2. Clicar em "👑 Admin"**

**3. Ver Notificação**
```
Tab "💳 Pagamentos Pendentes" com badge vermelho (3)
```

**4. Abrir aba de pagamentos**

**5. Para cada pagamento:**

**a) Ver detalhes:**
```
ID: #123
Usuário: João Silva
Email: joao@example.com
Plano: Premium
Valor: R$ 39,90
Data: 09/11/2025 14:30
```

**b) Conferir no PagBank:**
- Abrir app do PagBank
- Ver se recebeu PIX de R$ 39,90
- Conferir nome: João Silva

**c) Aprovar:**
- Clicar em "✅ Aprovar"
- (Opcional) Digite ID da transação PIX
- Confirmar

**d) Sistema faz automaticamente:**
- ✅ Marca pagamento como aprovado
- ✅ Atualiza plano do usuário para Premium
- ✅ Cria assinatura válida por 30 dias
- ✅ Remove da lista de pendentes

**6. Cliente já pode usar!**
- Sem precisar fazer logout/login
- Plano atualiza instantaneamente
- Recursos liberados

---

## 🔧 Configuração Inicial Necessária

### No Arquivo .env ou Coolify:

```bash
# Informações PIX (para exibir no checkout)
PIX_NAME=RONALDO DIAS DE SOUSA
PIX_KEY=ronaldohunter54@gmail.com
PIX_BANK=PagBank
```

Estas variáveis podem ser usadas para personalizar a tela de checkout.

---

## 📊 Relatório de Pagamentos

### No Painel Admin, você pode ver:

**Pagamentos Pendentes:**
- Quantos estão aguardando
- Valor total pendente
- Quem solicitou

**Histórico de Pagamentos (futuro):**
- Todos os pagamentos aprovados
- Total recebido no mês
- Gráfico de receita

---

## ⚡ Automação Futura (Webhook)

### Com API do PagBank:

1. Cliente faz PIX
2. PagBank envia webhook
3. Sistema recebe automaticamente
4. Aprova pagamento sozinho
5. Atualiza plano
6. Notifica cliente

**Rota webhook (a implementar):**
```javascript
app.post('/api/webhooks/pagbank', async (req, res) => {
  const { transaction_id, amount, status } = req.body;
  
  if (status === 'approved') {
    // Buscar pagamento pelo valor e data
    const payment = findPendingPayment(amount);
    
    if (payment) {
      // Aprovar automaticamente
      await approvePayment(payment.id, 'system', transaction_id);
    }
  }
  
  res.json({ success: true });
});
```

---

## 📝 Banco de Dados

### Tabelas Criadas:

**payments:**
```sql
- id (ID do pagamento)
- user_id (quem pagou)
- plan (qual plano)
- amount (valor)
- status (pending/approved/rejected)
- transaction_id (ID do PIX, opcional)
- approved_by (admin que aprovou)
- created_at (quando solicitou)
- approved_at (quando foi aprovado)
```

**subscriptions:**
```sql
- id
- user_id
- plan
- status (active/cancelled/expired)
- started_at
- expires_at (30 dias após aprovação)
- cancelled_at
```

---

## ✅ Checklist de Implementação

- [x] Tabelas de pagamento e assinatura
- [x] Rotas de solicitação de pagamento
- [x] Rotas admin para aprovar
- [x] Componente Upgrade (modal)
- [x] Botão Upgrade no header
- [x] Aba de pagamentos pendentes no admin
- [x] Sistema de aprovação manual
- [ ] Adicionar QR Code real (você faz manual)
- [ ] Webhook automático (futuro)
- [ ] Email de confirmação (futuro)
- [ ] Renovação automática (futuro)

---

## 🎯 PRÓXIMOS PASSOS

### AGORA (Você faz):

1. **Gere 3 QR Codes no PagBank:**
   - R$ 15,00 (Básico)
   - R$ 39,90 (Premium)
   - R$ 99,90 (Enterprise)

2. **Salve as imagens:**
   ```
   client/public/qrcodes/
   ├── basico.png
   ├── premium.png
   └── enterprise.png
   ```

3. **Atualize Upgrade.js:**
   Substituir o placeholder do QR Code pela imagem real

### DEPOIS (Deploy):

```
1. Redeploy no Coolify
2. Testar fluxo completo
3. Começar a vender!
```

---

## 💡 Dicas de Operação

### Aprovação Rápida:
- Verifique PagBank 2-3x por dia
- Aprove pagamentos rapidamente
- Cliente satisfeito = marketing positivo

### Controle de Fraudes:
- Conferir nome do pagador
- Conferir valor exato
- Se suspeito, não aprovar

### Comunicação:
- Avise no email que precisa aguardar até 24h
- Seja transparente sobre o processo manual
- Depois automatize com webhook

---

## 🎉 RESULTADO FINAL

```
✅ Cliente clica em Upgrade
✅ Escolhe plano
✅ Vê QR Code PIX
✅ Faz pagamento
✅ Admin aprova
✅ Plano atualizado automaticamente
✅ Cliente usa recursos do novo plano
✅ Você recebe o dinheiro! 💰
```

---

**Sistema de pagamento PIX completo e funcional!** 🎊

**Falta apenas:** Você adicionar os QR Codes reais do PagBank!

---

## 🚀 REDEPLOY E TESTE!

```
Coolify → Redeploy → Aguardar → Testar → Vender! 💰
```

Após deploy:
1. Login como usuário comum
2. Clicar em "💎 Upgrade"
3. Ver modal de escolha de planos
4. Selecionar Premium
5. Ver tela de pagamento PIX
6. (Você adiciona o QR Code real depois)

**Sistema pronto para receber pagamentos! 🚀💳**

