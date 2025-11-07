const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const db = require('./database');
const openaiService = require('./openai');

let sock;
let connected = false;
let currentQR = null; // Armazenar QR Code atual

// Número autorizado (apenas este número pode usar o bot)
const NUMERO_AUTORIZADO = '5562950734433'; // +55 62 9507-3443

// Função para verificar se o número é autorizado
function isNumeroAutorizado(remoteJid) {
  // Extrair apenas os dígitos do número
  const numeroLimpo = remoteJid.replace(/\D/g, '');
  
  // Verificar se contém o número autorizado
  return numeroLimpo.includes(NUMERO_AUTORIZADO);
}

// Inicializar conexão com WhatsApp
async function initialize(usePairingCode = false) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
      auth: state,
      browser: ['Chrome (Linux)', '', ''],
      logger: P({ level: 'silent' })
    });

    // Eventos de conexão
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr; // Armazenar QR Code
        
        console.log('\n==============================================');
        console.log('📱 QR CODE GERADO! Acesse o painel para escanear');
        console.log('🌐 http://localhost:3005 → Aba WhatsApp');
        console.log('==============================================\n');
        qrcode.generate(qr, { small: true });
        console.log('\n==============================================');
        
        // Enviar QR Code para clientes WebSocket
        if (global.notifyClients) {
          global.notifyClients({
            type: 'qr_code',
            data: { qr }
          });
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('❌ Conexão fechada.');
        console.log('Motivo:', lastDisconnect?.error);
        connected = false;
        currentQR = null;
        
        if (shouldReconnect) {
          console.log('⏳ Aguardando 10 segundos antes de tentar novamente...');
          setTimeout(() => initialize(), 10000);
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp conectado com sucesso!');
        connected = true;
        currentQR = null; // Limpar QR Code ao conectar
        
        // Notificar clientes que conectou
        if (global.notifyClients) {
          global.notifyClients({
            type: 'whatsapp_connected',
            data: { connected: true }
          });
        }
      }
    });

    // Salvar credenciais
    sock.ev.on('creds.update', saveCreds);

    // Processar mensagens recebidas
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const msg of messages) {
          await processarMensagem(msg);
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar WhatsApp:', error);
    setTimeout(() => initialize(), 5000);
  }
}

// Processar mensagem recebida
async function processarMensagem(msg) {
  try {
    // Ignorar mensagens do próprio bot
    if (msg.key.fromMe) return;

    // Ignorar mensagens de grupo
    if (msg.key.remoteJid.endsWith('@g.us')) return;

    // ⚠️ VERIFICAR SE O NÚMERO É AUTORIZADO
    if (!isNumeroAutorizado(msg.key.remoteJid)) {
      console.log(`🚫 Mensagem ignorada de número não autorizado: ${msg.key.remoteJid}`);
      return;
    }

    const mensagemTexto = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text || '';

    if (!mensagemTexto) return;

    console.log(`\n📩 Mensagem recebida de número autorizado: "${mensagemTexto}"`);

    // Verificar comandos especiais
    if (mensagemTexto.toLowerCase().includes('resumo')) {
      await enviarResumo(msg.key.remoteJid);
      return;
    }

    if (mensagemTexto.toLowerCase().includes('ajuda') || mensagemTexto.toLowerCase().includes('help')) {
      await enviarAjuda(msg.key.remoteJid);
      return;
    }

    // Processar como transação financeira
    try {
      const dadosTransacao = await openaiService.processarMensagemFinanceira(mensagemTexto);
      
      // Adicionar ao banco de dados
      const transacaoId = db.addTransacao(
        dadosTransacao.tipo,
        dadosTransacao.valor,
        dadosTransacao.categoria,
        dadosTransacao.descricao,
        mensagemTexto
      );

      console.log(`✅ Transação ${transacaoId} adicionada:`, dadosTransacao);

      // Verificar alertas
      const resumo = db.getResumo();
      const transacoes = db.getTransacoes(30);
      const alertas = await openaiService.analisarPadroesEAlertas(transacoes, resumo);
      
      // Salvar alertas no banco
      alertas.forEach(alerta => {
        db.addAlerta(alerta.tipo, alerta.titulo, alerta.mensagem);
      });

      // Notificar clientes WebSocket
      if (global.notifyClients) {
        global.notifyClients({
          type: 'nova_transacao',
          data: {
            id: transacaoId,
            ...dadosTransacao,
            mensagem_original: mensagemTexto
          }
        });
      }

      // Enviar confirmação ao usuário
      let resposta = `✅ *Transação Registrada!*\n\n`;
      resposta += `💰 Tipo: ${dadosTransacao.tipo === 'receita' ? '📈 Receita' : '📉 Despesa'}\n`;
      resposta += `💵 Valor: R$ ${dadosTransacao.valor.toFixed(2)}\n`;
      resposta += `📁 Categoria: ${dadosTransacao.categoria}\n`;
      resposta += `📝 Descrição: ${dadosTransacao.descricao}\n\n`;
      resposta += `📊 *Resumo do Mês:*\n`;
      resposta += `Receitas: R$ ${resumo.receitas.toFixed(2)}\n`;
      resposta += `Despesas: R$ ${resumo.despesas.toFixed(2)}\n`;
      resposta += `Saldo: R$ ${resumo.saldo.toFixed(2)}`;

      // Adicionar alertas à resposta
      if (alertas.length > 0) {
        resposta += `\n\n⚠️ *Alertas:*\n`;
        alertas.forEach(alerta => {
          resposta += `${alerta.titulo}\n`;
        });
      }

      await enviarMensagem(msg.key.remoteJid, resposta);

    } catch (error) {
      console.error('❌ Erro ao processar transação:', error);
      await enviarMensagem(
        msg.key.remoteJid, 
        '❌ Desculpe, não consegui processar essa transação. Tente novamente com mais detalhes.\n\nExemplo: "Gastei R$ 50 no supermercado"'
      );
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
}

// Enviar mensagem
async function enviarMensagem(numero, texto) {
  try {
    if (!connected || !sock) {
      console.log('⚠️ WhatsApp não conectado');
      return;
    }

    await sock.sendMessage(numero, { text: texto });
    console.log('✅ Mensagem enviada');
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
  }
}

// Enviar resumo financeiro
async function enviarResumo(numero) {
  try {
    const resumo = db.getResumo();
    const transacoes = db.getTransacoes(10);
    
    const resumoTexto = await openaiService.gerarResumo(transacoes, resumo);
    
    await enviarMensagem(numero, resumoTexto);
  } catch (error) {
    console.error('❌ Erro ao enviar resumo:', error);
  }
}

// Enviar mensagem de ajuda
async function enviarAjuda(numero) {
  const ajuda = `🤖 *Agente Financeiro - Comandos*\n\n` +
    `📝 *Registrar Transação:*\n` +
    `Apenas envie a mensagem naturalmente:\n` +
    `- "Gastei R$ 45 no supermercado"\n` +
    `- "Recebi 3000 de salário"\n` +
    `- "Paguei 150 da conta de luz"\n\n` +
    `📊 *Resumo:*\n` +
    `Envie "resumo" para ver seu resumo financeiro completo\n\n` +
    `💡 *Dica:* Seja específico com valores e categorias para melhor análise!`;
  
  await enviarMensagem(numero, ajuda);
}

// Verificar se está conectado
function isConnected() {
  return connected;
}

// Obter QR Code atual
function getCurrentQR() {
  return currentQR;
}

// Desconectar WhatsApp
async function disconnect() {
  try {
    if (sock) {
      await sock.logout();
      connected = false;
      console.log('🔌 WhatsApp desconectado pelo usuário');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
    return false;
  }
}

// Reconectar WhatsApp
async function reconnect() {
  try {
    console.log('🔄 Tentando reconectar WhatsApp...');
    await initialize();
    return true;
  } catch (error) {
    console.error('❌ Erro ao reconectar:', error);
    return false;
  }
}

module.exports = {
  initialize,
  isConnected,
  enviarMensagem,
  disconnect,
  reconnect,
  getCurrentQR
};

