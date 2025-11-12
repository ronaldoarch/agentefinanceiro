require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const multer = require('multer');
const whatsappService = require('./services/whatsapp');
const db = require('./services/database-supabase');
const openaiService = require('./services/openai');
const authService = require('./services/auth');
const abacatepayService = require('./services/abacatepay');
const lembretesScheduler = require('./services/lembretes-scheduler');
const { requireAuth, requireAdmin, checkPlanLimit } = require('./middleware/auth');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configurar multer para upload de áudios
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Servir arquivos estáticos do React
const buildPath = path.join(__dirname, 'client', 'build');
const indexPath = path.join(buildPath, 'index.html');

console.log(`📁 Servindo arquivos estáticos de: ${buildPath}`);

// Verificar se o build existe
if (fs.existsSync(indexPath)) {
  console.log(`✅ Frontend build encontrado: ${indexPath}`);
} else {
  console.log(`❌ AVISO: Frontend build não encontrado em ${indexPath}`);
  console.log(`❌ A interface web não vai funcionar!`);
}

app.use(express.static(buildPath));

// Função assíncrona de inicialização
async function startServer() {
  try {
    // Inicializar banco de dados Supabase
    console.log('🔄 Iniciando conexão com Supabase...');
    await db.init();
    console.log('✅ Supabase conectado!');

    // Criar usuário admin se não existir
    await authService.createAdminUser().catch(err => {
      console.error('Erro ao criar admin:', err);
    });

    // Iniciar scheduler de lembretes (verifica a cada 30 minutos)
    console.log('🔔 Iniciando scheduler de lembretes...');
    lembretesScheduler.start(30); // 30 minutos
    console.log('✅ Scheduler de lembretes iniciado!');

    // Criar servidor WebSocket para atualizações em tempo real
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Aguardando conexão com WhatsApp...`);
      console.log('✅ Sistema totalmente operacional!');
      console.log('🔒 Banco de dados PostgreSQL na nuvem!');
      console.log('📅 Lembretes automáticos ativos!');
    });

    return server;
  } catch (error) {
    console.error('❌ ERRO ao iniciar servidor:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Iniciar servidor
const serverPromise = startServer();
serverPromise.then(server => {
  global.server = server;
  
  // Configurar WebSocket
  const wss = new WebSocket.Server({ server });

  // Armazenar conexões WebSocket
  global.wsClients = [];

  wss.on('connection', (ws) => {
    console.log('🔌 Cliente WebSocket conectado');
    global.wsClients.push(ws);

    ws.on('close', () => {
      global.wsClients = global.wsClients.filter(client => client !== ws);
      console.log('🔌 Cliente WebSocket desconectado');
    });
  });
  
  // Inicializar WhatsApp
  // DESABILITADO TEMPORARIAMENTE - Conecte manualmente pela interface
  // whatsappService.initialize();
}).catch(error => {
  console.error('❌ Erro fatal ao iniciar servidor:', error);
  process.exit(1);
});

// ================== ROTAS API ==================

// ================== ROTAS DE AUTENTICAÇÃO ==================

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, taxId, phone } = req.body;
    
    const result = await authService.register(email, password, name, taxId, phone);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);
    
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Obter dados do usuário atual
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Logout (apenas limpa o token no cliente)
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// ================== ROTAS DE PAGAMENTO ==================

// Solicitar upgrade (criar pagamento com QR Code PIX)
app.post('/api/payments/request', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;
    const { plan } = req.body;
    
    // Definir preços
    const prices = {
      basico: 15.00,
      premium: 39.90,
      enterprise: 99.90
    };
    
    const planNames = {
      basico: 'Plano Básico',
      premium: 'Plano Premium',
      enterprise: 'Plano Enterprise'
    };
    
    if (!prices[plan]) {
      return res.status(400).json({ error: 'Plano inválido' });
    }
    
    const amount = prices[plan];
    
    // Criar pagamento pendente no banco
    const paymentId = await db.createPayment(userId, plan, amount);
    
    console.log(`💳 Criando QR Code PIX para pagamento #${paymentId}`);
    console.log(`   Plano: ${plan}`);
    console.log(`   Valor: R$ ${amount}`);
    
    // Validar se usuário tem CPF cadastrado (exceto em modo dev)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const taxId = user.tax_id || (isDevelopment ? '123.456.789-00' : null);
    
    if (!taxId) {
      console.error('❌ Usuário sem CPF cadastrado');
      return res.status(400).json({
        success: false,
        error: 'CPF não cadastrado. Por favor, atualize seu perfil com CPF antes de fazer upgrade.',
        code: 'TAX_ID_REQUIRED'
      });
    }
    
    if (isDevelopment && !user.tax_id) {
      console.log('⚠️ MODO DE DESENVOLVIMENTO: Usando CPF de teste');
    }

    // Determinar URL base (produção ou desenvolvimento)
    const baseUrl = process.env.APP_URL || 'http://localhost:3001';
    
    // Criar QR Code PIX no AbacatePay
    const pixResult = await abacatepayService.createPixCharge({
      amount: Math.round(amount * 100), // Converter para centavos
      description: `${planNames[plan]} - Agente Financeiro`,
      paymentId: paymentId.toString(),
      customerName: user.name || user.email || 'Usuário Teste',
      customerEmail: user.email || 'teste@exemplo.com',
      customerCellphone: user.phone || '(11) 99999-9999',
      customerTaxId: taxId,
      returnUrl: `${baseUrl}/`,
      completionUrl: `${baseUrl}/payment/success?plan=${plan}&amount=${amount}`
    });
    
    if (!pixResult.success) {
      console.error('❌ Erro ao criar QR Code PIX:', pixResult.error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar QR Code PIX. Tente novamente.'
      });
    }
    
    console.log('✅ QR Code PIX criado com sucesso!');
    console.log('   Billing ID:', pixResult.billingId);
    
    // Atualizar pagamento com billing_id do AbacatePay
    await db.getSupabaseClient()
      .from('payments')
      .update({ 
        transaction_id: pixResult.billingId,
        metadata: JSON.stringify(pixResult)
      })
      .eq('id', paymentId);
    
    res.json({
      success: true,
      payment_id: paymentId,
      billing_id: pixResult.billingId,
      plan: plan,
      amount: amount,
      payment_url: pixResult.url, // URL da página de pagamento AbacatePay
      dev_mode: pixResult.devMode,
      status: pixResult.status,
      message: 'Pagamento criado! Acesse a página de pagamento para ver o QR Code PIX.'
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar status de um pagamento
app.get('/api/payments/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Buscar pagamento no banco
    const payment = await db.getPaymentById(id);
    
    if (!payment || payment.user_id !== userId) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }
    
    // Se já foi pago, retornar status
    if (payment.status === 'approved') {
      return res.json({
        status: 'paid',
        paid_at: payment.approved_at
      });
    }
    
    // Verificar status no AbacatePay
    if (payment.transaction_id) {
      const statusResult = await abacatepayService.getChargeStatus(payment.transaction_id);
      
      if (statusResult.success && statusResult.status === 'PAID') {
        // Identificar plano pelo valor pago
        let planToActivate = payment.plan;
        const planByAmount = getPlanByAmount(payment.amount);
        
        if (planByAmount && planByAmount !== payment.plan) {
          console.log(`⚠️ Plano ajustado pelo valor: ${payment.plan} → ${planByAmount}`);
          planToActivate = planByAmount;
        }
        
        console.log(`✅ Confirmando pagamento - Plano: ${planToActivate} (Valor: R$ ${payment.amount})`);
        
        // Atualizar no banco
        await db.approvePayment(id, 1, payment.transaction_id); // Admin ID = 1 (sistema)
        await db.updateUserPlan(userId, planToActivate);
        
        // Criar assinatura (30 dias)
        const expiresAt = moment().add(30, 'days').toISOString();
        await db.createSubscription(userId, planToActivate, expiresAt);
        
        return res.json({
          status: 'paid',
          paid_at: statusResult.paidAt,
          plan: planToActivate
        });
      }
      
      return res.json({
        status: statusResult.status?.toLowerCase() || 'pending',
        expires_at: statusResult.expiresAt
      });
    }
    
    res.json({
      status: 'pending'
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar meus pagamentos
app.get('/api/payments/my', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await db.getPaymentsByUser(userId);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT DE TESTE: Mudar plano diretamente (apenas em desenvolvimento)
app.post('/api/test/change-plan', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;
    
    // Apenas permitir em desenvolvimento
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!isDevelopment) {
      return res.status(403).json({ 
        error: 'Endpoint de teste disponível apenas em desenvolvimento' 
      });
    }
    
    // Validar plano
    const validPlans = ['basico', 'premium', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Plano inválido' });
    }
    
    console.log(`🧪 TESTE: Mudando plano do usuário ${userId} para: ${plan}`);
    
    // Atualizar plano do usuário
    await db.updateUserPlan(userId, plan);
    
    // Criar/atualizar assinatura de teste (30 dias)
    const expiresAt = moment().add(30, 'days').toISOString();
    await db.createSubscription(userId, plan, expiresAt);
    
    console.log(`✅ TESTE: Plano alterado com sucesso para: ${plan}`);
    
    res.json({
      success: true,
      message: `✅ Plano alterado para ${plan.toUpperCase()} com sucesso!`,
      plan: plan,
      test_mode: true
    });
    
  } catch (error) {
    console.error('❌ Erro ao mudar plano:', error);
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT DE TESTE: Simular pagamento aprovado (apenas em desenvolvimento)
app.post('/api/payments/:id/simulate-payment', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Apenas permitir em desenvolvimento
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!isDevelopment) {
      return res.status(403).json({ 
        error: 'Endpoint de simulação disponível apenas em desenvolvimento' 
      });
    }
    
    console.log(`🧪 SIMULANDO pagamento aprovado para Payment ID: ${id}`);
    
    // Buscar pagamento no banco
    const payment = await db.getPaymentById(id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }
    
    if (payment.user_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (payment.status === 'approved') {
      return res.json({ 
        success: true,
        message: 'Pagamento já estava aprovado',
        status: 'paid',
        plan: payment.plan
      });
    }
    
    // Identificar plano pelo valor pago
    let planToActivate = payment.plan;
    const planByAmount = getPlanByAmount(payment.amount);
    
    if (planByAmount && planByAmount !== payment.plan) {
      console.log(`⚠️ SIMULAÇÃO: Plano ajustado pelo valor: ${payment.plan} → ${planByAmount}`);
      planToActivate = planByAmount;
    }
    
    console.log(`🧪 SIMULAÇÃO: Ativando plano ${planToActivate} (Valor: R$ ${payment.amount})`);
    
    // Aprovar pagamento
    await db.approvePayment(id, userId, 'SIMULATED_' + Date.now());
    
    // Atualizar plano do usuário com o plano correto baseado no valor
    await db.updateUserPlan(userId, planToActivate);
    
    // Criar assinatura (30 dias)
    const expiresAt = moment().add(30, 'days').toISOString();
    await db.createSubscription(userId, planToActivate, expiresAt);
    
    console.log(`✅ SIMULAÇÃO: Plano do usuário ${userId} atualizado para: ${planToActivate}`);
    
    res.json({
      success: true,
      message: `✅ Pagamento SIMULADO aprovado com sucesso! Plano ${planToActivate.toUpperCase()} ativado!`,
      status: 'paid',
      plan: planToActivate,
      amount: payment.amount,
      simulated: true
    });
    
  } catch (error) {
    console.error('❌ Erro ao simular pagamento:', error);
    res.status(500).json({ error: error.message });
  }
});

// Função auxiliar: Identificar plano pelo valor pago
function getPlanByAmount(amount) {
  const prices = {
    15.00: 'basico',
    39.90: 'premium',
    99.90: 'enterprise'
  };
  
  // Buscar plano exato
  if (prices[amount]) {
    return prices[amount];
  }
  
  // Buscar por aproximação (tolerância de R$ 0.50)
  for (const [price, plan] of Object.entries(prices)) {
    if (Math.abs(parseFloat(price) - amount) <= 0.50) {
      return plan;
    }
  }
  
  return null;
}

// Webhook do AbacatePay (confirmação de pagamento)
app.post('/api/webhooks/abacatepay', async (req, res) => {
  try {
    console.log('📥 Webhook recebido do AbacatePay');
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    console.log('   Body:', JSON.stringify(req.body, null, 2));
    
    const signature = req.headers['x-signature'] || req.headers['x-abacatepay-signature'];
    const webhookData = req.body;
    
    console.log('🔐 Signature recebida:', signature);
    
    // Validar assinatura do webhook
    const isValid = abacatepayService.validateWebhook(webhookData, signature);
    
    if (!isValid) {
      console.error('❌ Assinatura do webhook inválida');
      // Em desenvolvimento, continuar mesmo assim
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (!isDevelopment) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.warn('⚠️ Continuando em modo DEV apesar de assinatura inválida...');
    }
    
    // Processar webhook
    const result = await abacatepayService.processWebhook(webhookData);
    
    if (result.success && result.event === 'paid') {
      console.log('💰 Pagamento confirmado via webhook!');
      console.log('   Payment ID:', result.paymentId);
      console.log('   Valor pago:', result.amount);
      
      // Buscar pagamento no banco
      const payment = await db.getPaymentById(result.paymentId);
      
      if (payment && payment.status === 'pending') {
        // Identificar plano pelo valor pago (segurança adicional)
        let planToActivate = payment.plan;
        const planByAmount = getPlanByAmount(payment.amount);
        
        if (planByAmount && planByAmount !== payment.plan) {
          console.log(`⚠️ Plano ajustado pelo valor: ${payment.plan} → ${planByAmount}`);
          planToActivate = planByAmount;
        }
        
        console.log(`✅ Ativando plano: ${planToActivate} (Valor: R$ ${payment.amount})`);
        
        // Aprovar pagamento
        await db.approvePayment(result.paymentId, 1, result.billingId); // Admin ID = 1 (sistema)
        
        // Atualizar plano do usuário com o plano correto baseado no valor
        await db.updateUserPlan(payment.user_id, planToActivate);
        
        // Criar assinatura (30 dias)
        const expiresAt = moment().add(30, 'days').toISOString();
        await db.createSubscription(payment.user_id, planToActivate, expiresAt);
        
        console.log('✅ Plano atualizado automaticamente!');
        console.log('   User ID:', payment.user_id);
        console.log('   Plano:', planToActivate);
        console.log('   Valor pago: R$', payment.amount);
        
        // Notificar usuário via WebSocket
        if (global.notifyClients) {
          global.notifyClients({
            type: 'payment_confirmed',
            data: {
              userId: payment.user_id,
              plan: planToActivate,
              amount: payment.amount
            }
          });
        }
      }
    }
    
    // Retornar 200 para o AbacatePay
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================== ROTAS DE ADMINISTRADOR ==================

// Estatísticas gerais
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await db.getAdminStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos os usuários
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar plano do usuário
app.put('/api/admin/users/:id/plan', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    
    if (!['basico', 'premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Plano inválido' });
    }
    
    await db.updateUserPlan(id, plan);
    
    res.json({
      success: true,
      message: 'Plano atualizado com sucesso'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ativar/Desativar usuário
app.put('/api/admin/users/:id/toggle-active', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.toggleUserActive(id);
    
    res.json({
      success: true,
      message: 'Status do usuário atualizado'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar pagamentos pendentes
app.get('/api/admin/payments/pending', requireAuth, requireAdmin, async (req, res) => {
  try {
    const payments = await db.getPendingPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos os pagamentos
app.get('/api/admin/payments', requireAuth, requireAdmin, async (req, res) => {
  try {
    const payments = await db.getAllPayments(200);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aprovar pagamento
app.post('/api/admin/payments/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_id, plan } = req.body;
    const adminId = req.user.id;
    
    // Buscar pagamento
    const payment = await db.getPaymentById(id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }
    
    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Pagamento já foi processado' });
    }
    
    // Aprovar pagamento
    await db.approvePayment(id, adminId, transaction_id);
    
    // Atualizar plano do usuário
    await db.updateUserPlan(payment.user_id, plan || payment.plan);
    
    // Criar assinatura (30 dias)
    const expiresAt = moment().add(30, 'days').toISOString();
    await db.createSubscription(payment.user_id, plan || payment.plan, expiresAt);
    
    res.json({
      success: true,
      message: 'Pagamento aprovado e plano atualizado!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== ROTAS PROTEGIDAS (REQUEREM AUTH) ==================

// Status do WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ 
    connected: whatsappService.isConnected(),
    message: whatsappService.isConnected() ? 'Conectado' : 'Desconectado'
  });
});

// Desconectar WhatsApp
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    const result = await whatsappService.disconnect();
    res.json({ 
      success: result,
      message: result ? 'WhatsApp desconectado com sucesso' : 'Erro ao desconectar'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reconectar WhatsApp
app.post('/api/whatsapp/reconnect', async (req, res) => {
  try {
    const result = await whatsappService.reconnect();
    res.json({ 
      success: result,
      message: result ? 'Tentando reconectar WhatsApp...' : 'Erro ao reconectar'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter QR Code atual
app.get('/api/whatsapp/qr', (req, res) => {
  try {
    const qr = whatsappService.getCurrentQR();
    if (qr) {
      res.json({ qr, available: true });
    } else {
      res.json({ qr: null, available: false, message: 'QR Code não disponível' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter todas as transações
app.get('/api/transacoes', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const transacoes = await db.getTransacoes(userId);
    res.json(transacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter transações por período
app.get('/api/transacoes/periodo', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { inicio, fim } = req.query;
    const transacoes = await db.getTransacoesPorPeriodo(userId, inicio, fim);
    res.json(transacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter resumo financeiro
app.get('/api/resumo', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 API /api/resumo - Buscando resumo para usuário ${userId}`);
    
    const resumo = await db.getResumo(userId);
    console.log(`📊 Resumo calculado:`, resumo);
    console.log(`   Receitas: R$ ${resumo.receitas.toFixed(2)}`);
    console.log(`   Despesas: R$ ${resumo.despesas.toFixed(2)}`);
    console.log(`   Saldo: R$ ${resumo.saldo.toFixed(2)}`);
    
    res.json(resumo);
  } catch (error) {
    console.error('❌ Erro ao buscar resumo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter resumo mensal
app.get('/api/resumo/mensal', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mes, ano } = req.query;
    const resumo = await db.getResumoMensal(userId, mes, ano);
    res.json(resumo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter alertas
app.get('/api/alertas', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const alertas = await db.getAlertas(userId);
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marcar alerta como lido
app.put('/api/alertas/:id/lido', async (req, res) => {
  try {
    const { id } = req.params;
    await db.marcarAlertaLido(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter categorias
app.get('/api/categorias', async (req, res) => {
  try {
    const categorias = await db.getCategorias();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== ROTAS DE LEMBRETES ==================

// Criar novo lembrete
app.post('/api/lembretes', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      titulo, 
      descricao, 
      valor, 
      categoria, 
      dataVencimento, 
      recorrencia, 
      notificarWhatsApp, 
      diasAntecedencia 
    } = req.body;

    if (!titulo || !dataVencimento) {
      return res.status(400).json({ error: 'Título e data de vencimento são obrigatórios' });
    }

    const lembreteId = await db.createLembrete(
      userId,
      titulo,
      descricao,
      valor,
      categoria || 'outros',
      dataVencimento,
      recorrencia || 'unico',
      notificarWhatsApp !== false, // default true
      diasAntecedencia || 1
    );

    res.json({ 
      success: true, 
      id: lembreteId,
      message: 'Lembrete criado com sucesso!' 
    });
  } catch (error) {
    console.error('❌ Erro ao criar lembrete:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter todos os lembretes do usuário
app.get('/api/lembretes', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // filtrar por status (opcional)
    
    const lembretes = await db.getLembretes(userId, status);
    res.json(lembretes);
  } catch (error) {
    console.error('❌ Erro ao buscar lembretes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter lembretes vencidos
app.get('/api/lembretes/vencidos', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const lembretes = await db.getLembretesVencidos(userId);
    res.json(lembretes);
  } catch (error) {
    console.error('❌ Erro ao buscar lembretes vencidos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter um lembrete específico
app.get('/api/lembretes/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const lembrete = await db.getLembreteById(id, userId);
    
    if (!lembrete) {
      return res.status(404).json({ error: 'Lembrete não encontrado' });
    }
    
    res.json(lembrete);
  } catch (error) {
    console.error('❌ Erro ao buscar lembrete:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar lembrete
app.put('/api/lembretes/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;
    
    const success = await db.updateLembrete(id, userId, updates);
    
    if (!success) {
      return res.status(404).json({ error: 'Lembrete não encontrado ou você não tem permissão' });
    }
    
    res.json({ success: true, message: 'Lembrete atualizado com sucesso!' });
  } catch (error) {
    console.error('❌ Erro ao atualizar lembrete:', error);
    res.status(500).json({ error: error.message });
  }
});

// Marcar lembrete como concluído
app.put('/api/lembretes/:id/concluir', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const success = await db.marcarLembreteConcluido(id, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Lembrete não encontrado ou você não tem permissão' });
    }
    
    res.json({ success: true, message: 'Lembrete marcado como concluído!' });
  } catch (error) {
    console.error('❌ Erro ao marcar lembrete como concluído:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar lembrete
app.delete('/api/lembretes/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const success = await db.deleteLembrete(id, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Lembrete não encontrado ou você não tem permissão' });
    }
    
    res.json({ success: true, message: 'Lembrete deletado com sucesso!' });
  } catch (error) {
    console.error('❌ Erro ao deletar lembrete:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ================== ROTAS DE CHAT ==================

// Enviar mensagem de texto no chat
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    console.log('📝 Chat: Recebendo mensagem de texto');
    const { message } = req.body;
    const userId = req.user.id;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    console.log('📝 Mensagem:', message);
    console.log('👤 User ID:', userId);

    // Verificar se openaiService está disponível
    if (!openaiService || !openaiService.chatFinanceiro) {
      throw new Error('Serviço OpenAI não disponível');
    }

    // Buscar histórico do usuário
    const historico = await db.getChatHistory(userId, 20);
    console.log('📚 Histórico carregado:', historico.length, 'mensagens');
    
    // Salvar mensagem do usuário
    await db.addChatMessage(userId, 'user', message);
    
    // Verificar se quer deletar uma transação
    const delecaoDetectada = await openaiService.detectarDelecao(message);
    if (delecaoDetectada && delecaoDetectada.isDelecao) {
      console.log('🗑️ DELEÇÃO DETECTADA! Valor:', delecaoDetectada.valor);
      
      const deletado = await db.deleteLastTransacaoByValor(userId, delecaoDetectada.valor);
      
      if (deletado) {
        const confirmacao = `✅ **Transação de R$ ${delecaoDetectada.valor.toFixed(2)} removida com sucesso!**\n\n📊 Veja a atualização no Dashboard.`;
        await db.addChatMessage(userId, 'assistant', confirmacao);
        
        // Notificar WebSocket
        if (global.notifyClients) {
          global.notifyClients({
            type: 'transacao_deletada',
            data: { userId: userId, valor: delecaoDetectada.valor }
          });
        }
        
        return res.json({
          success: true,
          message: confirmacao,
          deleted: true
        });
      } else {
        const erro = `❌ Não encontrei transação de R$ ${delecaoDetectada.valor.toFixed(2)} para remover.`;
        await db.addChatMessage(userId, 'assistant', erro);
        return res.json({ success: true, message: erro });
      }
    }
    
    // Verificar se quer limpar TODAS as transações
    const limpezaDetectada = await openaiService.detectarLimpezaTotal(message);
    if (limpezaDetectada && limpezaDetectada.isLimpezaTotal) {
      console.log('🧹 LIMPEZA TOTAL DETECTADA!');
      
      try {
        // Buscar o resumo atual antes de limpar
        const resumoAntes = await db.getResumo(userId);
        const moment = require('moment');
        const mesAnoAtual = moment().format('YYYY-MM');
        
        console.log(`📊 Resumo antes de limpar:`, resumoAntes);
        console.log(`📅 Mês/Ano para limpeza: ${mesAnoAtual}`);
        
        // Deletar todas as transações do mês atual
        const resultado = await db.deleteAllTransacoes(userId, mesAnoAtual);
        
        console.log(`🔍 Resultado da limpeza:`, resultado);
        
        if (resultado.success) {
          const quantidadeDeletada = resultado.count || 0;
          const mesFormatado = moment().format('MMMM [de] YYYY');
          let confirmacao;
          
          if (quantidadeDeletada === 0) {
            confirmacao = `✅ **Dashboard zerado!**\n\nVocê não tinha nenhuma transação registrada em ${mesFormatado}.\n\n📊 **Resumo Financeiro:**\n• Receitas: R$ 0,00\n• Despesas: R$ 0,00\n• Saldo: R$ 0,00\n\n🎉 Seu dashboard está limpo e pronto! Comece a registrar suas novas transações quando quiser.`;
          } else {
            confirmacao = `✅ **Tudo apagado no Dashboard!**\n\n🗑️ Removi **${quantidadeDeletada} transação(ões)** de ${mesFormatado}.\n\nTodas as receitas, despesas e o saldo foram zerados.\n\n📊 **Resumo Financeiro Atual:**\n• Receitas: R$ 0,00\n• Despesas: R$ 0,00\n• Saldo: R$ 0,00\n\n🎉 Seu dashboard está completamente limpo! Agora você tem uma tela nova para começar de novo.\n\n💡 **Dica:** Para registrar novas transações, basta me dizer algo como "gastei 50 no supermercado" ou "recebi 3000 de salário".`;
          }
          
          await db.addChatMessage(userId, 'assistant', confirmacao);
          
          // Notificar WebSocket para atualizar Dashboard em tempo real
          if (global.notifyClients) {
            global.notifyClients({
              type: 'transacoes_limpas',
              data: { userId: userId, mesAno: mesAnoAtual, count: quantidadeDeletada }
            });
          }
          
          console.log(`✅ Dashboard limpo com sucesso! ${quantidadeDeletada} transações removidas.`);
          
          return res.json({
            success: true,
            message: confirmacao,
            cleared: true,
            count: quantidadeDeletada
          });
        } else {
          const erroDetalhado = resultado.error || 'Erro desconhecido';
          console.error('❌ Erro ao limpar transações:', erroDetalhado);
          const erro = `❌ Ocorreu um erro ao tentar limpar as transações: ${erroDetalhado}\n\nPor favor, tente novamente ou entre em contato com o suporte.`;
          await db.addChatMessage(userId, 'assistant', erro);
          return res.json({ success: true, message: erro });
        }
      } catch (error) {
        console.error('❌ Erro crítico ao processar limpeza:', error);
        const erro = `❌ Erro inesperado ao limpar transações: ${error.message}\n\nPor favor, tente novamente.`;
        await db.addChatMessage(userId, 'assistant', erro);
        return res.json({ success: true, message: erro });
      }
    }
    
    // SEMPRE tentar detectar transação PRIMEIRO
    let transacoesDetectadas = [];
    let transacoesSalvas = [];
    
    try {
      console.log('🔍 Detectando se é uma transação...');
      console.log('🔍 Mensagem recebida:', message);
      transacoesDetectadas = await openaiService.detectarTransacao(message);
      console.log('🔍 Resultado da detecção (tipo):', typeof transacoesDetectadas);
      console.log('🔍 Resultado da detecção (valor):', JSON.stringify(transacoesDetectadas, null, 2));
      
      if (transacoesDetectadas && transacoesDetectadas.length > 0) {
        console.log(`💰 ${transacoesDetectadas.length} TRANSAÇÃO(ÕES) DETECTADA(S)!`);
        
        // Salvar TODAS as transações no banco
        for (let i = 0; i < transacoesDetectadas.length; i++) {
          const transacao = transacoesDetectadas[i];
          console.log(`💰 [${i+1}/${transacoesDetectadas.length}] Salvando:`, JSON.stringify(transacao));
          
          try {
            const transacaoId = await db.addTransacao(
              userId, // IMPORTANTE: user_id do usuário autenticado
              transacao.tipo,
              transacao.valor,
              transacao.categoria,
              transacao.descricao,
              `Chat IA: ${message}`
            );
            
            console.log(`✅ TRANSAÇÃO SALVA NO BANCO! ID: ${transacaoId}`);
            transacoesSalvas.push({ id: transacaoId, ...transacao });
          } catch (saveError) {
            console.error(`❌ ERRO ao salvar transação ${i+1}:`, saveError.message);
            console.error('Stack:', saveError.stack);
          }
          
          // Notificar clientes via WebSocket
          if (global.notifyClients) {
            global.notifyClients({
              type: 'nova_transacao',
              data: { id: transacaoId, userId: userId, ...transacao }
            });
          }
        }
        
        console.log(`📡 ${transacoesSalvas.length} transações salvas e notificadas!`);
      } else {
        console.log('ℹ️ Não é uma transação, apenas conversa');
      }
    } catch (error) {
      console.error('❌ ERRO ao detectar/salvar transação:', error);
      console.error('Stack:', error.stack);
    }
    
    // DETECTAR E CRIAR LEMBRETES
    let lembretesDetectados = [];
    let lembretesCriados = [];
    
    try {
      console.log('📅 Verificando se é um lembrete...');
      lembretesDetectados = await openaiService.detectarLembrete(message);
      console.log('📅 Resultado da detecção de lembretes:', JSON.stringify(lembretesDetectados, null, 2));
      
      if (lembretesDetectados && lembretesDetectados.length > 0) {
        console.log(`📅 ${lembretesDetectados.length} LEMBRETE(S) DETECTADO(S)!`);
        
        // Criar TODOS os lembretes no banco
        for (let i = 0; i < lembretesDetectados.length; i++) {
          const lembrete = lembretesDetectados[i];
          console.log(`📅 [${i+1}/${lembretesDetectados.length}] Criando lembrete:`, JSON.stringify(lembrete));
          
          try {
            const lembreteId = await db.createLembrete(
              userId,
              lembrete.titulo,
              lembrete.descricao,
              lembrete.valor,
              lembrete.categoria,
              lembrete.dataVencimento,
              lembrete.recorrencia,
              true, // notificar WhatsApp por padrão
              lembrete.diasAntecedencia
            );
            
            console.log(`✅ LEMBRETE CRIADO! ID: ${lembreteId}`);
            lembretesCriados.push({ id: lembreteId, ...lembrete });
          } catch (saveError) {
            console.error(`❌ ERRO ao criar lembrete ${i+1}:`, saveError.message);
            console.error('Stack:', saveError.stack);
          }
        }
        
        console.log(`📅 ${lembretesCriados.length} lembretes criados!`);
      } else {
        console.log('ℹ️ Não é um lembrete');
      }
    } catch (error) {
      console.error('❌ ERRO ao detectar/criar lembrete:', error);
      console.error('Stack:', error.stack);
    }
    
    // Verificar se é APENAS uma transação (sem pergunta) ou uma pergunta real
    const mensagemLower = message.toLowerCase();
    const isTransacaoSimples = transacoesSalvas.length > 0;
    const isPerguntaSobreDados = mensagemLower.includes('?') || 
                                  mensagemLower.includes('quanto') || 
                                  mensagemLower.includes('saldo') || 
                                  mensagemLower.includes('resumo') || 
                                  mensagemLower.includes('quanto tenho') ||
                                  mensagemLower.includes('meu saldo') ||
                                  mensagemLower.includes('minhas finanças') ||
                                  mensagemLower.includes('minhas financas') ||
                                  mensagemLower.includes('balanço') ||
                                  mensagemLower.includes('balanco') ||
                                  mensagemLower.includes('total');
    
    let resposta;
    
    // Se for APENAS uma transação (não é pergunta), usar resposta simples SEM contexto
    if (isTransacaoSimples && !isPerguntaSobreDados) {
      console.log('✅ Transação detectada - usando resposta simples sem contexto');
      // Resposta simples e direta, sem mencionar saldo total
      resposta = '✅ Transação registrada com sucesso! Você já pode ver no Dashboard.';
    } else {
      // É uma pergunta ou conversa normal - buscar contexto se necessário
      let contextoDados = '';
      
      try {
        // Só buscar contexto se for uma pergunta sobre dados
        if (isPerguntaSobreDados) {
          const transacoesUsuario = await db.getTransacoes(userId, 10);
          const resumoUsuario = await db.getResumo(userId);
          
          if (transacoesUsuario.length > 0 || resumoUsuario.receitas > 0 || resumoUsuario.despesas > 0) {
            contextoDados = `\n\n=== DADOS REAIS DO USUÁRIO (USE APENAS ESTES) ===\n`;
            contextoDados += `Resumo de ${resumoUsuario.mes}:\n`;
            contextoDados += `• Receitas: R$ ${resumoUsuario.receitas.toFixed(2)}\n`;
            contextoDados += `• Despesas: R$ ${resumoUsuario.despesas.toFixed(2)}\n`;
            contextoDados += `• Saldo: R$ ${resumoUsuario.saldo.toFixed(2)}\n\n`;
            
            if (transacoesUsuario.length > 0) {
              contextoDados += `Últimas transações registradas:\n`;
              transacoesUsuario.slice(0, 5).forEach((t, index) => {
                contextoDados += `${index + 1}. ${t.tipo === 'receita' ? '💰 Receita' : '💸 Despesa'}: R$ ${t.valor.toFixed(2)} - ${t.descricao} (${t.categoria})\n`;
              });
            }
            
            contextoDados += `\n⚠️ IMPORTANTE: Use APENAS estes valores. NÃO invente outros dados!`;
          } else {
            contextoDados = `\n\n=== DADOS DO USUÁRIO ===\nNenhuma transação registrada ainda neste mês.\n`;
          }
        }
      } catch (error) {
        console.error('Erro ao buscar contexto:', error);
      }
      
      // Adicionar contexto à mensagem apenas se for pergunta
      const mensagemComContexto = message + contextoDados;
      
      // Obter resposta conversacional da IA
      console.log('🤖 Processando com IA...');
      resposta = await openaiService.chatFinanceiro(mensagemComContexto, historico);
      console.log('✅ Resposta da IA recebida');
    }
    
    // Se salvou transações ou criou lembretes, adicionar confirmação
    if (transacoesSalvas.length > 0 || lembretesCriados.length > 0) {
      let confirmacao = '';
      
      // Confirmação de transações (apenas detalhes, sem duplicar mensagem)
      if (transacoesSalvas.length > 0) {
        // Se for transação simples, não adicionar confirmação duplicada
        // (já foi confirmado na resposta acima)
        if (!isTransacaoSimples || isPerguntaSobreDados) {
          confirmacao += `\n\n✅ **${transacoesSalvas.length} transação(ões) registrada(s) automaticamente!**\n\n`;
          
          transacoesSalvas.forEach(t => {
            confirmacao += `- ${t.tipo === 'receita' ? '💰' : '💸'} R$ ${t.valor.toFixed(2)} - ${t.descricao} (${t.categoria})\n`;
          });
          
          confirmacao += `\n📊 **Veja no Dashboard agora!**`;
        } else {
          // Para transação simples, apenas mostrar os detalhes de forma limpa
          confirmacao += `\n\n`;
          transacoesSalvas.forEach(t => {
            confirmacao += `${t.tipo === 'receita' ? '💰' : '💸'} **R$ ${t.valor.toFixed(2)}** - ${t.descricao}`;
            if (t.categoria && t.categoria !== 'Outros') {
              confirmacao += ` (${t.categoria})`;
            }
            confirmacao += `\n`;
          });
        }
      }
      
      // Confirmação de lembretes
      if (lembretesCriados.length > 0) {
        if (confirmacao) confirmacao += '\n\n';
        confirmacao += `📅 **${lembretesCriados.length} lembrete(s) criado(s) automaticamente!**\n\n`;
        
        lembretesCriados.forEach(l => {
          const dataFormatada = moment(l.dataVencimento).format('DD/MM/YYYY [às] HH:mm');
          confirmacao += `- 🔔 ${l.titulo}`;
          if (l.valor) confirmacao += ` - R$ ${parseFloat(l.valor).toFixed(2)}`;
          confirmacao += ` (vence em ${dataFormatada})\n`;
        });
        
        confirmacao += `\n📱 **Você receberá notificação no WhatsApp!**\n`;
        confirmacao += `📅 **Veja todos na aba Lembretes acima!**`;
      }
      
      // Salvar resposta da IA com confirmação
      await db.addChatMessage(userId, 'assistant', resposta + confirmacao);
      
      return res.json({ 
        success: true,
        message: resposta + confirmacao,
        transacoes: transacoesSalvas,
        lembretes: lembretesCriados,
        saved: true
      });
    }
    
    // Salvar resposta da IA
    await db.addChatMessage(userId, 'assistant', resposta);
    
    res.json({ 
      success: true,
      message: resposta
    });
  } catch (error) {
    console.error('❌ Erro no chat:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Enviar áudio no chat
app.post('/api/chat/audio', requireAuth, checkPlanLimit('audio_enabled'), upload.single('audio'), async (req, res) => {
  try {
    console.log('🎤 Chat: Recebendo áudio');
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo de áudio é obrigatório' });
    }

    console.log('🎤 Áudio recebido:', req.file.originalname, req.file.size, 'bytes');
    console.log('👤 User ID:', userId);
    
    // Verificar se openaiService está disponível
    if (!openaiService || !openaiService.transcreverAudio || !openaiService.chatFinanceiro) {
      throw new Error('Serviço OpenAI não disponível');
    }
    
    // Transcrever áudio
    console.log('🎤 Transcrevendo áudio...');
    const transcricao = await openaiService.transcreverAudio(
      req.file.buffer,
      req.file.originalname
    );
    
    console.log('📝 Transcrição:', transcricao);
    
    // Buscar histórico do usuário
    const historico = await db.getChatHistory(userId, 20);
    
    // Salvar mensagem do usuário com transcrição
    await db.addChatMessage(userId, 'user', transcricao, transcricao);
    
    // Obter resposta da IA
    console.log('🤖 Processando com IA...');
    const resposta = await openaiService.chatFinanceiro(transcricao, historico);
    console.log('✅ Resposta da IA recebida');
    
    // Verificar se a mensagem contém transações
    try {
      const transacoesDetectadas = await openaiService.detectarTransacao(transcricao);
      
      if (transacoesDetectadas && transacoesDetectadas.length > 0) {
        console.log(`💰 ${transacoesDetectadas.length} transação(ões) detectada(s) (áudio)`);
        
        const transacoesSalvas = [];
        
        // Salvar TODAS as transações
        for (const transacao of transacoesDetectadas) {
          const transacaoId = await db.addTransacao(
            userId,
            transacao.tipo,
            transacao.valor,
            transacao.categoria,
            transacao.descricao,
            `Chat IA (áudio): ${transcricao}`
          );
          
          console.log('✅ Transação salva com ID:', transacaoId);
          transacoesSalvas.push({ id: transacaoId, ...transacao });
          
          // Notificar clientes via WebSocket
          if (global.notifyClients) {
            global.notifyClients({
              type: 'nova_transacao',
              data: { id: transacaoId, userId: userId, ...transacao }
            });
          }
        }
        
        // Adicionar confirmação à resposta
        let confirmacao = `\n\n✅ **${transacoesSalvas.length} transação(ões) registrada(s)!**\n\n`;
        
        transacoesSalvas.forEach(t => {
          confirmacao += `- ${t.tipo === 'receita' ? '💰' : '💸'} R$ ${t.valor.toFixed(2)} - ${t.descricao}\n`;
        });
        
        confirmacao += `\n📊 Veja no Dashboard agora!`;
        
        // Salvar resposta da IA com confirmação
        await db.addChatMessage(userId, 'assistant', resposta + confirmacao);
        
        return res.json({ 
          success: true,
          transcription: transcricao,
          message: resposta + confirmacao,
          transacoes: transacoesSalvas
        });
      }
    } catch (error) {
      console.error('⚠️ Erro ao detectar transação:', error.message);
      // Continua normalmente se falhar
    }
    
    // Salvar resposta da IA
    await db.addChatMessage(userId, 'assistant', resposta);
    
    res.json({ 
      success: true,
      transcription: transcricao,
      message: resposta
    });
  } catch (error) {
    console.error('❌ Erro ao processar áudio:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obter histórico de chat
app.get('/api/chat/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await db.getChatHistory(userId, 100);
    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: error.message });
  }
});

// Limpar histórico de chat
app.delete('/api/chat/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.clearChatHistory(userId);
    res.json({ success: true, message: 'Histórico limpo com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ROTA DE TESTE - Adicionar transação manualmente =====
app.post('/api/test/add-transaction', async (req, res) => {
  try {
    const { tipo, valor, categoria, descricao, userId } = req.body;
    
    const transacaoId = await db.addTransacao(userId || 1, tipo, valor, categoria, descricao, 'TESTE MANUAL');
    
    // Notificar clientes
    if (global.notifyClients) {
      global.notifyClients({
        type: 'nova_transacao',
        data: { id: transacaoId, tipo, valor, categoria, descricao }
      });
    }
    
    res.json({ success: true, id: transacaoId, message: 'Transação de teste adicionada!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Função para notificar clientes WebSocket
global.notifyClients = (data) => {
  global.wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Rota catch-all - Serve o index.html do React para todas as rotas não-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

console.log('✅ Servidor iniciado com sucesso!');
console.log('📊 Acesse o painel em: http://localhost:' + PORT);

