const { google } = require('googleapis');
const db = require('./database-supabase');

/**
 * Serviço de Integração com Google Calendar API
 * Permite criar eventos automaticamente no calendário do usuário
 */

// Configuração OAuth2 (será preenchida com as credenciais do Google Cloud Console)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback'
);

/**
 * Gera URL de autorização para o usuário conectar sua conta Google
 * @param {number} userId - ID do usuário que está conectando
 */
function getAuthUrl(userId) {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events', // Criar/editar eventos
    'https://www.googleapis.com/auth/calendar.readonly' // Ler calendário
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Para obter refresh token
    scope: scopes,
    prompt: 'consent', // Força mostrar tela de consentimento
    state: userId.toString() // Passa o userId no state para recuperar no callback
  });

  console.log('📅 URL de autorização gerada para usuário:', userId);
  return url;
}

/**
 * Troca o código de autorização por tokens de acesso
 */
async function getTokensFromCode(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('❌ Erro ao obter tokens do Google:', error);
    throw error;
  }
}

/**
 * Salva os tokens do Google no banco de dados
 */
async function saveUserTokens(userId, tokens) {
  try {
    const supabase = db.getSupabaseClient();
    
    // Calcular data de expiração (access tokens do Google expiram em 1 hora)
    // Se tokens.expiry_date vier undefined, calcular manualmente
    let expiryDate = tokens.expiry_date;
    if (!expiryDate || expiryDate === 'undefined') {
      expiryDate = Date.now() + (3600 * 1000); // 1 hora a partir de agora
    }
    
    console.log('💾 Salvando tokens do Google:');
    console.log('   User ID:', userId);
    console.log('   Access Token:', tokens.access_token ? 'presente' : 'ausente');
    console.log('   Refresh Token:', tokens.refresh_token ? 'presente' : 'ausente');
    console.log('   Expiry Date:', expiryDate);
    
    const { error } = await supabase
      .from('users')
      .update({
        google_access_token: tokens.access_token || null,
        google_refresh_token: tokens.refresh_token || null,
        google_token_expiry: expiryDate ? parseInt(expiryDate) : null,
        google_calendar_connected: true
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Erro do Supabase ao salvar tokens:', error);
      throw error;
    }
    
    console.log(`✅ Tokens do Google salvos para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar tokens:', error);
    throw error;
  }
}

/**
 * Busca os tokens do usuário no banco
 */
async function getUserTokens(userId) {
  try {
    const supabase = db.getSupabaseClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token, google_token_expiry')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    if (!data.google_access_token) {
      return null;
    }

    return {
      access_token: data.google_access_token,
      refresh_token: data.google_refresh_token,
      expiry_date: data.google_token_expiry
    };
  } catch (error) {
    console.error('❌ Erro ao buscar tokens:', error);
    return null;
  }
}

/**
 * Configura o cliente OAuth com os tokens do usuário
 */
async function getAuthenticatedClient(userId) {
  const tokens = await getUserTokens(userId);
  
  if (!tokens) {
    throw new Error('Usuário não conectou Google Calendar');
  }

  oauth2Client.setCredentials(tokens);
  
  // Verificar se o token expirou e renovar se necessário
  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    console.log('🔄 Token expirado, renovando...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    await saveUserTokens(userId, credentials);
    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

/**
 * Cria um evento no Google Calendar do usuário (para lembretes financeiros)
 */
async function createCalendarEvent(userId, eventData) {
  try {
    console.log(`📅 Criando evento no Google Calendar para usuário ${userId}`);
    
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: eventData.titulo,
      description: eventData.descricao || '',
      start: {
        dateTime: eventData.dataVencimento,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: eventData.dataVencimento,
        timeZone: 'America/Sao_Paulo'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: eventData.diasAntecedencia * 24 * 60 || 1440 }, // 1 dia antes
          { method: 'popup', minutes: 30 } // 30 min antes
        ]
      }
    };

    // Adicionar valor na descrição se existir
    if (eventData.valor) {
      event.description = `Valor: R$ ${parseFloat(eventData.valor).toFixed(2)}\n\n${event.description}`;
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    console.log(`✅ Evento criado no Google Calendar! ID: ${response.data.id}`);
    
    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink
    };
  } catch (error) {
    console.error('❌ Erro ao criar evento no Google Calendar:', error);
    
    // Se o erro for de autenticação, marcar como desconectado
    if (error.code === 401 || error.code === 403) {
      await disconnectGoogleCalendar(userId);
    }
    
    throw error;
  }
}

/**
 * Cria um evento genérico no Google Calendar (para eventos/compromissos)
 * @param {number} userId - ID do usuário
 * @param {Object} eventData - Dados do evento { titulo, descricao, dataInicio, dataFim, local }
 */
async function createGenericCalendarEvent(userId, eventData) {
  try {
    console.log(`📅 Criando evento genérico no Google Calendar para usuário ${userId}`);
    console.log('📅 Dados do evento:', JSON.stringify(eventData, null, 2));
    
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    // Se dataFim não foi fornecida, usar 1 hora depois do início
    let dataFim = eventData.dataFim;
    if (!dataFim && eventData.dataInicio) {
      const inicio = new Date(eventData.dataInicio);
      inicio.setHours(inicio.getHours() + 1);
      dataFim = inicio.toISOString();
    }

    const event = {
      summary: eventData.titulo,
      description: eventData.descricao || '',
      start: {
        dateTime: eventData.dataInicio,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: dataFim || eventData.dataInicio,
        timeZone: 'America/Sao_Paulo'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 1440 }, // 1 dia antes
          { method: 'popup', minutes: 30 } // 30 min antes
        ]
      }
    };

    // Adicionar local se fornecido
    if (eventData.local) {
      event.location = eventData.local;
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    console.log(`✅ Evento genérico criado no Google Calendar! ID: ${response.data.id}`);
    
    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink
    };
  } catch (error) {
    console.error('❌ Erro ao criar evento genérico no Google Calendar:', error);
    
    // Se o erro for de autenticação, marcar como desconectado
    if (error.code === 401 || error.code === 403) {
      await disconnectGoogleCalendar(userId);
    }
    
    throw error;
  }
}

/**
 * Atualiza um evento no Google Calendar
 */
async function updateCalendarEvent(userId, eventId, eventData) {
  try {
    console.log(`📅 Atualizando evento ${eventId} no Google Calendar`);
    
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: eventData.titulo,
      description: eventData.descricao || '',
      start: {
        dateTime: eventData.dataVencimento,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: eventData.dataVencimento,
        timeZone: 'America/Sao_Paulo'
      }
    };

    if (eventData.valor) {
      event.description = `Valor: R$ ${parseFloat(eventData.valor).toFixed(2)}\n\n${event.description}`;
    }

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event
    });

    console.log(`✅ Evento atualizado no Google Calendar!`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao atualizar evento:', error);
    throw error;
  }
}

/**
 * Deleta um evento do Google Calendar
 */
async function deleteCalendarEvent(userId, eventId) {
  try {
    console.log(`📅 Deletando evento ${eventId} do Google Calendar`);
    
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });

    console.log(`✅ Evento deletado do Google Calendar!`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao deletar evento:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário está conectado ao Google Calendar
 */
async function isConnected(userId) {
  try {
    const supabase = db.getSupabaseClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('google_calendar_connected, email')
      .eq('id', userId)
      .single();

    if (error) return false;
    
    return data.google_calendar_connected || false;
  } catch (error) {
    console.error('❌ Erro ao verificar conexão:', error);
    return false;
  }
}

/**
 * Desconecta o Google Calendar do usuário
 */
async function disconnectGoogleCalendar(userId) {
  try {
    const supabase = db.getSupabaseClient();
    
    const { error } = await supabase
      .from('users')
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expiry: null,
        google_calendar_connected: false
      })
      .eq('id', userId);

    if (error) throw error;
    
    console.log(`✅ Google Calendar desconectado para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
    throw error;
  }
}

/**
 * Busca o email conectado ao Google Calendar
 */
async function getConnectedEmail(userId) {
  try {
    const auth = await getAuthenticatedClient(userId);
    const oauth2 = google.oauth2({ version: 'v2', auth });
    
    const response = await oauth2.userinfo.get();
    return response.data.email;
  } catch (error) {
    console.error('❌ Erro ao buscar email:', error);
    return null;
  }
}

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  saveUserTokens,
  getUserTokens,
  createCalendarEvent,
  createGenericCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  isConnected,
  disconnectGoogleCalendar,
  getConnectedEmail
};

