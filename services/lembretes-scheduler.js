const moment = require('moment');
const db = require('./database-supabase');
const whatsappService = require('./whatsapp');

/**
 * Serviço de Agendamento de Lembretes
 * Verifica periodicamente lembretes pendentes e envia notificações
 */

class LembretesScheduler {
  constructor() {
    this.intervalo = null;
    this.isRunning = false;
  }

  /**
   * Inicia o scheduler
   * @param {number} intervaloMinutos - Intervalo em minutos para verificar lembretes (padrão: 30 minutos)
   */
  start(intervaloMinutos = 30) {
    if (this.isRunning) {
      console.log('⚠️ Scheduler de lembretes já está rodando');
      return;
    }

    console.log(`🔔 Iniciando scheduler de lembretes (verifica a cada ${intervaloMinutos} minutos)`);
    
    // Executar imediatamente na primeira vez
    this.verificarLembretes();
    
    // Depois executar no intervalo definido
    this.intervalo = setInterval(() => {
      this.verificarLembretes();
    }, intervaloMinutos * 60 * 1000);
    
    this.isRunning = true;
  }

  /**
   * Para o scheduler
   */
  stop() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
      this.isRunning = false;
      console.log('🛑 Scheduler de lembretes parado');
    }
  }

  /**
   * Verifica lembretes pendentes que precisam de notificação
   */
  async verificarLembretes() {
    try {
      console.log('🔍 Verificando lembretes pendentes...');
      
      // Buscar lembretes pendentes que devem ser notificados
      const agora = moment();
      const lembretesPendentes = await db.getLembretesPendentes();
      
      console.log(`📊 Encontrados ${lembretesPendentes.length} lembretes pendentes`);
      
      for (const lembrete of lembretesPendentes) {
        await this.processarLembrete(lembrete, agora);
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar lembretes:', error);
    }
  }

  /**
   * Processa um lembrete individual
   */
  async processarLembrete(lembrete, agora) {
    try {
      const dataVencimento = moment(lembrete.data_vencimento);
      const diasRestantes = dataVencimento.diff(agora, 'days');
      const horasRestantes = dataVencimento.diff(agora, 'hours');
      
      // Verificar se já foi notificado recentemente (últimas 12 horas)
      if (lembrete.ultima_notificacao) {
        const ultimaNotificacao = moment(lembrete.ultima_notificacao);
        const horasDesdeUltimaNotificacao = agora.diff(ultimaNotificacao, 'hours');
        
        if (horasDesdeUltimaNotificacao < 12) {
          console.log(`⏭️ Lembrete ${lembrete.id} já foi notificado recentemente`);
          return;
        }
      }
      
      // Verificar se deve notificar
      let deveNotificar = false;
      let tipoNotificacao = '';
      
      if (diasRestantes < 0) {
        // Atrasado
        deveNotificar = true;
        tipoNotificacao = 'atrasado';
        
        // Atualizar status para atrasado
        await db.updateLembrete(lembrete.id, lembrete.user_id, { status: 'atrasado' });
      } else if (diasRestantes === 0 && horasRestantes > 0) {
        // Vence hoje
        deveNotificar = true;
        tipoNotificacao = 'hoje';
      } else if (diasRestantes <= lembrete.dias_antecedencia) {
        // Dentro do prazo de antecedência
        deveNotificar = true;
        tipoNotificacao = 'antecedencia';
      }
      
      if (deveNotificar && lembrete.notificar_whatsapp) {
        await this.enviarNotificacao(lembrete, tipoNotificacao, diasRestantes, horasRestantes);
        
        // Marcar como notificado
        await db.marcarLembreteNotificado(lembrete.id);
        console.log(`✅ Lembrete ${lembrete.id} notificado com sucesso`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar lembrete ${lembrete.id}:`, error);
    }
  }

  /**
   * Envia notificação via WhatsApp
   */
  async enviarNotificacao(lembrete, tipoNotificacao, diasRestantes, horasRestantes) {
    try {
      let mensagem = '';
      const emoji = tipoNotificacao === 'atrasado' ? '⚠️' : 
                    tipoNotificacao === 'hoje' ? '🔔' : '📅';
      
      // Montar mensagem
      mensagem += `${emoji} *LEMBRETE FINANCEIRO*\n\n`;
      mensagem += `📋 *${lembrete.titulo}*\n`;
      
      if (lembrete.descricao) {
        mensagem += `📝 ${lembrete.descricao}\n`;
      }
      
      if (lembrete.valor) {
        mensagem += `💰 Valor: R$ ${parseFloat(lembrete.valor).toFixed(2)}\n`;
      }
      
      mensagem += `📁 Categoria: ${lembrete.categoria}\n`;
      mensagem += `📅 Vencimento: ${moment(lembrete.data_vencimento).format('DD/MM/YYYY HH:mm')}\n\n`;
      
      // Adicionar status baseado no tipo
      if (tipoNotificacao === 'atrasado') {
        mensagem += `⚠️ *ATENÇÃO: Este lembrete está ATRASADO em ${Math.abs(diasRestantes)} dia(s)!*`;
      } else if (tipoNotificacao === 'hoje') {
        if (horasRestantes > 1) {
          mensagem += `🔔 *URGENTE: Vence hoje em ${horasRestantes} hora(s)!*`;
        } else {
          mensagem += `🔔 *URGENTE: Vence hoje em menos de 1 hora!*`;
        }
      } else {
        mensagem += `📅 Vence em ${diasRestantes} dia(s)`;
      }
      
      // Adicionar informação de recorrência se aplicável
      if (lembrete.recorrencia && lembrete.recorrencia !== 'unico') {
        mensagem += `\n🔄 Recorrência: ${lembrete.recorrencia}`;
      }
      
      // Enviar via WhatsApp se o usuário tiver telefone
      if (lembrete.user_phone) {
        // Formatar número para WhatsApp (remover caracteres especiais)
        const telefone = lembrete.user_phone.replace(/\D/g, '');
        const telefoneFormatado = telefone.startsWith('55') ? telefone : '55' + telefone;
        
        console.log(`📱 Enviando notificação para ${lembrete.user_name} (${lembrete.user_phone})`);
        
        // Verificar se o WhatsApp está conectado
        if (whatsappService.isConnected()) {
          await whatsappService.sendMessage(telefoneFormatado, mensagem);
          console.log(`✅ Notificação enviada com sucesso para ${lembrete.user_name}`);
        } else {
          console.log(`⚠️ WhatsApp não conectado, notificação não enviada para ${lembrete.user_name}`);
        }
      } else {
        console.log(`⚠️ Usuário ${lembrete.user_name} não tem telefone cadastrado`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação do lembrete ${lembrete.id}:`, error);
    }
  }

  /**
   * Processa lembretes recorrentes
   * Cria um novo lembrete quando o atual vence
   */
  async processarRecorrencia(lembrete) {
    try {
      if (lembrete.recorrencia === 'unico' || lembrete.status !== 'concluido') {
        return;
      }
      
      const proximaData = this.calcularProximaData(lembrete.data_vencimento, lembrete.recorrencia);
      
      if (proximaData) {
        console.log(`🔄 Criando lembrete recorrente para ${lembrete.titulo}`);
        
        await db.createLembrete(
          lembrete.user_id,
          lembrete.titulo,
          lembrete.descricao,
          lembrete.valor,
          lembrete.categoria,
          proximaData,
          lembrete.recorrencia,
          lembrete.notificar_whatsapp,
          lembrete.dias_antecedencia
        );
        
        console.log(`✅ Lembrete recorrente criado para ${proximaData}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar recorrência do lembrete ${lembrete.id}:`, error);
    }
  }

  /**
   * Calcula a próxima data baseada na recorrência
   */
  calcularProximaData(dataAtual, recorrencia) {
    const data = moment(dataAtual);
    
    switch (recorrencia) {
      case 'diario':
        return data.add(1, 'day').toISOString();
      case 'semanal':
        return data.add(1, 'week').toISOString();
      case 'mensal':
        return data.add(1, 'month').toISOString();
      case 'anual':
        return data.add(1, 'year').toISOString();
      default:
        return null;
    }
  }

  /**
   * Retorna o status do scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalo: this.intervalo ? 'Ativo' : 'Inativo'
    };
  }
}

// Exportar instância única (singleton)
const scheduler = new LembretesScheduler();

module.exports = scheduler;

