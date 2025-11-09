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
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Buscar histórico
    const historico = db.getChatHistory(20);
    
    // Salvar mensagem do usuário
    db.addChatMessage('user', message);
    
    // Obter resposta da IA
    const resposta = await openaiService.chatFinanceiro(message, historico);
    
    // Salvar resposta da IA
    db.addChatMessage('assistant', resposta);
    
    res.json({ 
      success: true,
      message: resposta
    });
  } catch (error) {
    console.error('Erro no chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar áudio no chat
app.post('/api/chat/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo de áudio é obrigatório' });
    }

    console.log('🎤 Áudio recebido:', req.file.originalname, req.file.size, 'bytes');
    
    // Transcrever áudio
    const transcricao = await openaiService.transcreverAudio(
      req.file.buffer,
      req.file.originalname
    );
    
    console.log('📝 Transcrição:', transcricao);
    
    // Buscar histórico
    const historico = db.getChatHistory(20);
    
    // Salvar mensagem do usuário com transcrição
    db.addChatMessage('user', transcricao, transcricao);
    
    // Obter resposta da IA
    const resposta = await openaiService.chatFinanceiro(transcricao, historico);
    
    // Salvar resposta da IA
    db.addChatMessage('assistant', resposta);
    
    res.json({ 
      success: true,
      transcription: transcricao,
      message: resposta
    });
  } catch (error) {
    console.error('Erro ao processar áudio:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter histórico de chat
app.get('/api/chat/history', (req, res) => {
  try {
    const history = db.getChatHistory(100);
    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: error.message });
  }
});

// Limpar histórico de chat
app.delete('/api/chat/history', (req, res) => {
  try {
    db.clearChatHistory();
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

