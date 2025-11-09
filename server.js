require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const whatsappService = require('./services/whatsapp');
const db = require('./services/database');
const openaiService = require('./services/openai');
const authService = require('./services/auth');
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

// Inicializar banco de dados
db.init();

// Criar usuário admin se não existir
authService.createAdminUser().catch(err => {
  console.error('Erro ao criar admin:', err);
});

// Criar servidor WebSocket para atualizações em tempo real
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Aguardando conexão com WhatsApp...`);
});

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

// ================== ROTAS API ==================

// ================== ROTAS DE AUTENTICAÇÃO ==================

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const result = await authService.register(email, password, name);
    
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

// ================== ROTAS DE ADMINISTRADOR ==================

// Estatísticas gerais
app.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
  try {
    const stats = db.getAdminStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos os usuários
app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar plano do usuário
app.put('/api/admin/users/:id/plan', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    
    if (!['basico', 'premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Plano inválido' });
    }
    
    db.updateUserPlan(id, plan);
    
    res.json({
      success: true,
      message: 'Plano atualizado com sucesso'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ativar/Desativar usuário
app.put('/api/admin/users/:id/toggle-active', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    db.toggleUserActive(id);
    
    res.json({
      success: true,
      message: 'Status do usuário atualizado'
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
app.get('/api/transacoes', (req, res) => {
  try {
    const transacoes = db.getTransacoes();
    res.json(transacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter transações por período
app.get('/api/transacoes/periodo', (req, res) => {
  try {
    const { inicio, fim } = req.query;
    const transacoes = db.getTransacoesPorPeriodo(inicio, fim);
    res.json(transacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter resumo financeiro
app.get('/api/resumo', (req, res) => {
  try {
    const resumo = db.getResumo();
    res.json(resumo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter resumo mensal
app.get('/api/resumo/mensal', (req, res) => {
  try {
    const { mes, ano } = req.query;
    const resumo = db.getResumoMensal(mes, ano);
    res.json(resumo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter alertas
app.get('/api/alertas', (req, res) => {
  try {
    const alertas = db.getAlertas();
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marcar alerta como lido
app.put('/api/alertas/:id/lido', (req, res) => {
  try {
    const { id } = req.params;
    db.marcarAlertaLido(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter categorias
app.get('/api/categorias', (req, res) => {
  try {
    const categorias = db.getCategorias();
    res.json(categorias);
  } catch (error) {
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
    const historico = db.getChatHistory(userId, 20);
    console.log('📚 Histórico carregado:', historico.length, 'mensagens');
    
    // Salvar mensagem do usuário
    db.addChatMessage(userId, 'user', message);
    
    // Obter resposta da IA
    console.log('🤖 Processando com IA...');
    const resposta = await openaiService.chatFinanceiro(message, historico);
    console.log('✅ Resposta da IA recebida');
    
    // Verificar se a mensagem é uma transação
    try {
      const transacaoDetectada = await openaiService.detectarTransacao(message);
      
      if (transacaoDetectada && transacaoDetectada.isTransacao) {
        console.log('💰 Transação detectada:', transacaoDetectada);
        
        // Salvar transação no banco
        const transacaoId = db.addTransacao(
          transacaoDetectada.tipo,
          transacaoDetectada.valor,
          transacaoDetectada.categoria,
          transacaoDetectada.descricao,
          `Chat IA: ${message}`
        );
        
        console.log('✅ Transação salva com ID:', transacaoId);
        
        // Notificar clientes via WebSocket
        if (global.notifyClients) {
          global.notifyClients({
            type: 'nova_transacao',
            data: { id: transacaoId, ...transacaoDetectada }
          });
        }
        
        // Adicionar confirmação à resposta
        const confirmacao = `\n\n✅ **Transação registrada com sucesso!**\n- Tipo: ${transacaoDetectada.tipo}\n- Valor: R$ ${transacaoDetectada.valor.toFixed(2)}\n- Categoria: ${transacaoDetectada.categoria}\n\nVocê pode ver no Dashboard agora! 📊`;
        
        // Salvar resposta da IA com confirmação
        db.addChatMessage(userId, 'assistant', resposta + confirmacao);
        
        return res.json({ 
          success: true,
          message: resposta + confirmacao,
          transacao: transacaoDetectada
        });
      }
    } catch (error) {
      console.error('⚠️ Erro ao detectar transação:', error.message);
      // Continua normalmente se falhar
    }
    
    // Salvar resposta da IA
    db.addChatMessage(userId, 'assistant', resposta);
    
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
    const historico = db.getChatHistory(userId, 20);
    
    // Salvar mensagem do usuário com transcrição
    db.addChatMessage(userId, 'user', transcricao, transcricao);
    
    // Obter resposta da IA
    console.log('🤖 Processando com IA...');
    const resposta = await openaiService.chatFinanceiro(transcricao, historico);
    console.log('✅ Resposta da IA recebida');
    
    // Verificar se a mensagem é uma transação
    try {
      const transacaoDetectada = await openaiService.detectarTransacao(transcricao);
      
      if (transacaoDetectada && transacaoDetectada.isTransacao) {
        console.log('💰 Transação detectada (áudio):', transacaoDetectada);
        
        // Salvar transação no banco
        const transacaoId = db.addTransacao(
          transacaoDetectada.tipo,
          transacaoDetectada.valor,
          transacaoDetectada.categoria,
          transacaoDetectada.descricao,
          `Chat IA (áudio): ${transcricao}`
        );
        
        console.log('✅ Transação salva com ID:', transacaoId);
        
        // Notificar clientes via WebSocket
        if (global.notifyClients) {
          global.notifyClients({
            type: 'nova_transacao',
            data: { id: transacaoId, ...transacaoDetectada }
          });
        }
        
        // Adicionar confirmação à resposta
        const confirmacao = `\n\n✅ **Transação registrada com sucesso!**\n- Tipo: ${transacaoDetectada.tipo}\n- Valor: R$ ${transacaoDetectada.valor.toFixed(2)}\n- Categoria: ${transacaoDetectada.categoria}\n\nVocê pode ver no Dashboard agora! 📊`;
        
        // Salvar resposta da IA com confirmação
        db.addChatMessage(userId, 'assistant', resposta + confirmacao);
        
        return res.json({ 
          success: true,
          transcription: transcricao,
          message: resposta + confirmacao,
          transacao: transacaoDetectada
        });
      }
    } catch (error) {
      console.error('⚠️ Erro ao detectar transação:', error.message);
      // Continua normalmente se falhar
    }
    
    // Salvar resposta da IA
    db.addChatMessage(userId, 'assistant', resposta);
    
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
app.get('/api/chat/history', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const history = db.getChatHistory(userId, 100);
    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: error.message });
  }
});

// Limpar histórico de chat
app.delete('/api/chat/history', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    db.clearChatHistory(userId);
    res.json({ success: true, message: 'Histórico limpo com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ROTA DE TESTE - Adicionar transação manualmente =====
app.post('/api/test/add-transaction', (req, res) => {
  try {
    const { tipo, valor, categoria, descricao } = req.body;
    
    const transacaoId = db.addTransacao(tipo, valor, categoria, descricao, 'TESTE MANUAL');
    
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

