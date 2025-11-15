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
    
    console.log('💾 Executando UPDATE no Supabase...');
    console.log('   Tabela: users');
    console.log('   WHERE id =', userId);
    console.log('   Valores a atualizar:');
    console.log('     - google_access_token:', tokens.access_token ? 'presente' : 'null');
    console.log('     - google_refresh_token:', tokens.refresh_token ? 'presente' : 'null');
    console.log('     - google_token_expiry:', expiryDate);
    console.log('     - google_calendar_connected: true');
    
    // Preparar dados para UPDATE
    const updateData = {
      google_access_token: tokens.access_token || null,
      google_refresh_token: tokens.refresh_token || null,
      google_token_expiry: expiryDate ? parseInt(expiryDate) : null,
      google_calendar_connected: true
    };
    
    console.log('💾 Dados preparados:', JSON.stringify({
      ...updateData,
      google_access_token: updateData.google_access_token ? 'presente' : 'null',
      google_refresh_token: updateData.google_refresh_token ? 'presente' : 'null'
    }, null, 2));
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Erro do Supabase ao salvar tokens:', error);
      console.error('❌ Código do erro:', error.code);
      console.error('❌ Mensagem:', error.message);
      throw error;
    }
    
    console.log('✅ UPDATE executado com sucesso!');
    console.log('📊 Linhas afetadas:', data ? data.length : 0);
    if (data && data.length > 0) {
      console.log('📊 Dados atualizados:', {
        id: data[0].id,
        google_calendar_connected: data[0].google_calendar_connected,
        tem_access_token: !!data[0].google_access_token,
        tem_refresh_token: !!data[0].google_refresh_token
      });
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

    const tokens = {
      access_token: data.google_access_token,
      refresh_token: data.google_refresh_token,
      expiry_date: data.google_token_expiry
    };
    
    // Log para debug
    if (tokens.expiry_date) {
      const expiryDate = new Date(parseInt(tokens.expiry_date));
      const agora = new Date();
      const minutosRestantes = Math.round((tokens.expiry_date - Date.now()) / 1000 / 60);
      console.log(`📊 Tokens do usuário ${userId}:`);
      console.log(`   Access token: ${tokens.access_token ? 'presente' : 'ausente'}`);
      console.log(`   Refresh token: ${tokens.refresh_token ? 'presente' : 'ausente'}`);
      console.log(`   Expiry date: ${expiryDate.toISOString()}`);
      console.log(`   Agora: ${agora.toISOString()}`);
      console.log(`   Minutos restantes: ${minutosRestantes}`);
    }
    
    return tokens;
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

  if (!tokens.access_token) {
    throw new Error('Token de acesso não encontrado');
  }

  oauth2Client.setCredentials(tokens);
  
  // Verificar se o token expirou e renovar se necessário
  const agora = Date.now();
  // Adicionar margem de 5 minutos antes de expirar
  const tokenExpirado = !tokens.expiry_date || (tokens.expiry_date - agora) < (5 * 60 * 1000);
  
  if (tokenExpirado) {
    console.log('🔄 Token do Google Calendar expirado ou próximo de expirar');
    console.log('📊 Expiry date:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'não definido');
    console.log('📊 Agora:', new Date(agora).toISOString());
    console.log('📊 Diferença:', tokens.expiry_date ? Math.round((tokens.expiry_date - agora) / 1000 / 60) : 'N/A', 'minutos');
    
    try {
      if (!tokens.refresh_token) {
        // Sem refresh token, precisa reconectar
        console.log('⚠️ Refresh token não encontrado. Usuário precisa reconectar.');
        throw new Error('Refresh token não encontrado. Usuário precisa reconectar.');
      }
      
      console.log('🔄 Iniciando renovação do token...');
      
      // Configurar tokens no cliente (incluindo refresh token)
      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });
      
      // Renovar token usando refresh token
      console.log('🔄 Chamando refreshAccessToken()...');
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log('✅ Token renovado com sucesso!');
      console.log('📊 Novo access_token:', credentials.access_token ? 'presente' : 'ausente');
      console.log('📊 Novo expiry_date:', credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'não definido');
      
      // Salvar novos tokens no banco
      console.log('💾 Salvando tokens renovados no banco...');
      await saveUserTokens(userId, credentials);
      
      // Configurar novos tokens no cliente
      oauth2Client.setCredentials(credentials);
      console.log('✅ Cliente OAuth configurado com novos tokens');
    } catch (refreshError) {
      console.error('❌ Erro ao renovar token:', refreshError.message);
      console.error('❌ Stack:', refreshError.stack);
      // Não desconectar automaticamente - apenas lançar erro
      // O erro será tratado pelo código que chama esta função
      throw new Error('Token expirado e não foi possível renovar. Por favor, reconecte o Google Calendar.');
    }
  } else {
    console.log('✅ Token ainda válido, não precisa renovar');
    console.log('📊 Expiry date:', new Date(tokens.expiry_date).toISOString());
    console.log('📊 Válido por mais:', Math.round((tokens.expiry_date - agora) / 1000 / 60), 'minutos');
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

    // Validar data de início
    if (!eventData.dataInicio) {
      throw new Error('Data de início é obrigatória');
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
    console.error('❌ Erro ao criar evento genérico no Google Calendar:', error.message);
    console.error('❌ Código do erro:', error.code);
    
    // Se o erro for de autenticação, marcar como desconectado
    if (error.code === 401 || error.code === 403 || error.status === 401 || error.status === 403) {
      console.log('🔌 Token inválido, desconectando Google Calendar...');
      await disconnectGoogleCalendar(userId);
      throw new Error('Token de autenticação inválido. Por favor, reconecte o Google Calendar.');
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
      .select('google_calendar_connected, google_access_token, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      return false;
    }
    
    if (!data) {
      console.log(`📊 Usuário ${userId} não encontrado no banco`);
      return false;
    }
    
    // Verificar se tem token E se está marcado como conectado
    const temToken = data.google_access_token && 
                     typeof data.google_access_token === 'string' && 
                     data.google_access_token.trim() !== '' &&
                     data.google_access_token !== 'null';
    const marcadoConectado = data.google_calendar_connected === true;
    
    console.log(`📊 Usuário ${userId}: temToken=${temToken}, marcadoConectado=${marcadoConectado}`);
    console.log(`📊 Dados do banco:`, {
      google_access_token: data.google_access_token ? 'presente' : 'null/undefined',
      google_calendar_connected: data.google_calendar_connected,
      tipo_access_token: typeof data.google_access_token,
      valor_access_token: data.google_access_token ? (data.google_access_token.substring(0, 20) + '...') : 'null'
    });
    
    // Retornar true apenas se tiver token E estiver marcado como conectado
    // Garantir que sempre retorna boolean
    const resultado = !!(temToken && marcadoConectado);
    console.log(`📊 Resultado isConnected: ${resultado} (tipo: ${typeof resultado})`);
    return resultado;
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
    console.log('📧 Tentando buscar email do Google Calendar...');
    const auth = await getAuthenticatedClient(userId);
    const oauth2 = google.oauth2({ version: 'v2', auth });
    
    console.log('📧 Chamando userinfo.get()...');
    const response = await oauth2.userinfo.get();
    console.log('✅ Email obtido com sucesso:', response.data.email);
    return response.data.email;
  } catch (error) {
    console.error('❌ Erro ao buscar email do Google:', error.message);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Status do erro:', error.status);
    
    // Se for erro 401, o token pode estar expirado
    if (error.code === 401 || error.status === 401) {
      console.log('⚠️ Erro 401: Token expirado ou inválido');
      console.log('⚠️ O token será renovado automaticamente na próxima tentativa de uso');
      // Não desconectar - apenas retornar null
      // O token será renovado automaticamente pelo getAuthenticatedClient na próxima vez
      return null;
    }
    
    // Para outros erros, logar mas não quebrar
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

