const { createClient } = require('@supabase/supabase-js');
const moment = require('moment');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;

// Inicializar Supabase
async function init() {
  console.log('🔍 Conectando ao Supabase...');
  console.log('🔍 URL:', supabaseUrl);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL ou SUPABASE_ANON_KEY não configurados!');
    throw new Error('Configuração do Supabase incompleta');
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  
  // Testar conexão
  const { data, error } = await supabase.from('categorias').select('count');
  
  if (error) {
    console.error('❌ Erro ao conectar com Supabase:', error);
    throw error;
  }
  
  console.log('✅ Supabase conectado com sucesso!');
  console.log('✅ Banco de dados PostgreSQL na nuvem ativo');
  console.log('✅ DADOS NUNCA MAIS VÃO SER PERDIDOS!');
  console.log('🔒 Seus dados estão seguros em:', supabaseUrl);
}

// ================== TRANSAÇÕES ==================

async function addTransacao(userId, tipo, valor, categoria, descricao, mensagemOriginal) {
  console.log(`💾 SALVANDO TRANSAÇÃO no Supabase`);
  console.log(`   User ID: ${userId}, Tipo: ${tipo}, Valor: R$ ${valor}`);
  
  const { data, error } = await supabase
    .from('transacoes')
    .insert({
      user_id: userId,
      tipo,
      valor,
      categoria,
      descricao,
      mensagem_original: mensagemOriginal
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao salvar transação:', error);
    throw error;
  }
  
  console.log(`✅ TRANSAÇÃO SALVA no Supabase! ID: ${data.id}`);
  
  // Verificar total
  const { count } = await supabase
    .from('transacoes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  console.log(`📊 Total de transações do usuário ${userId}: ${count}`);
  
  return data.id;
}

async function getTransacoes(userId, limit = 100) {
  console.log(`🔍 BUSCANDO transações do usuário ${userId} no Supabase`);
  
  const { data, error } = await supabase
    .from('transacoes')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Erro ao buscar transações:', error);
    return [];
  }
  
  console.log(`📊 Encontradas ${data.length} transações para usuário ${userId}`);
  
  if (data.length > 0) {
    console.log(`   Primeira transação: R$ ${data[0].valor} - ${data[0].descricao}`);
  }
  
  return data;
}

async function getTransacoesPorPeriodo(userId, dataInicio, dataFim) {
  const { data, error } = await supabase
    .from('transacoes')
    .select('*')
    .eq('user_id', userId)
    .gte('data', dataInicio)
    .lte('data', dataFim)
    .order('data', { ascending: false });
  
  if (error) return [];
  return data;
}

async function deleteTransacao(userId, transacaoId) {
  console.log(`🗑️ DELETANDO transação ID: ${transacaoId} do usuário ${userId}`);
  
  const { error } = await supabase
    .from('transacoes')
    .delete()
    .eq('id', transacaoId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('❌ Erro ao deletar:', error);
    return false;
  }
  
  console.log('✅ Transação deletada do Supabase!');
  return true;
}

async function deleteLastTransacaoByValor(userId, valor) {
  console.log(`🗑️ Buscando transação de R$ ${valor} para deletar...`);
  
  const { data, error } = await supabase
    .from('transacoes')
    .select('id')
    .eq('user_id', userId)
    .gte('valor', valor - 0.01)
    .lte('valor', valor + 0.01)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    console.log(`⚠️ Transação de R$ ${valor} não encontrada`);
    return false;
  }
  
  return await deleteTransacao(userId, data.id);
}

async function deleteAllTransacoes(userId, mesAno = null) {
  console.log(`🗑️ DELETANDO TODAS as transações do usuário ${userId}`);
  
  try {
    // Primeiro, buscar quantas transações serão deletadas
    let countQuery = supabase
      .from('transacoes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (mesAno) {
      // Calcular início e fim do mês usando moment
      const inicioMes = moment(mesAno, 'YYYY-MM').startOf('month').toISOString();
      const fimMes = moment(mesAno, 'YYYY-MM').endOf('month').toISOString();
      countQuery = countQuery.gte('data', inicioMes).lte('data', fimMes);
      console.log(`🗑️ Filtrando por período: ${inicioMes} até ${fimMes}`);
    }
    
    const { count: totalTransacoes, error: countError } = await countQuery;
    
    if (countError) {
      console.error('❌ Erro ao contar transações:', countError);
      return { success: false, count: 0, error: countError.message };
    }
    
    console.log(`📊 Total de transações a deletar: ${totalTransacoes}`);
    
    if (totalTransacoes === 0) {
      console.log('ℹ️ Nenhuma transação encontrada para deletar');
      return { success: true, count: 0 };
    }
    
    // Agora deletar as transações
    let deleteQuery = supabase
      .from('transacoes')
      .delete()
      .eq('user_id', userId);
    
    if (mesAno) {
      // Usar mesmos filtros de data
      const inicioMes = moment(mesAno, 'YYYY-MM').startOf('month').toISOString();
      const fimMes = moment(mesAno, 'YYYY-MM').endOf('month').toISOString();
      deleteQuery = deleteQuery.gte('data', inicioMes).lte('data', fimMes);
    }
    
    const { error: deleteError } = await deleteQuery;
    
    if (deleteError) {
      console.error('❌ Erro ao deletar transações:', deleteError);
      return { success: false, count: 0, error: deleteError.message };
    }
    
    console.log(`✅ ${totalTransacoes} transação(ões) deletada(s) do Supabase!`);
    return { success: true, count: totalTransacoes };
  } catch (error) {
    console.error('❌ Erro geral ao deletar transações:', error);
    return { success: false, count: 0, error: error.message };
  }
}

async function getResumo(userId) {
  const inicioMes = moment().startOf('month').toISOString();
  
  const { data, error } = await supabase
    .from('transacoes')
    .select('tipo, valor')
    .eq('user_id', userId)
    .gte('data', inicioMes);
  
  if (error) {
    console.error('❌ Erro ao buscar resumo:', error);
    return { receitas: 0, despesas: 0, saldo: 0, mes: moment().format('MMMM YYYY') };
  }
  
  let receitas = 0;
  let despesas = 0;
  
  data.forEach(item => {
    const valor = parseFloat(item.valor);
    if (item.tipo === 'receita') receitas += valor;
    if (item.tipo === 'despesa') despesas += valor;
  });
  
  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    mes: moment().format('MMMM YYYY')
  };
}

async function getResumoMensal(userId, mes, ano) {
  const { data, error } = await supabase
    .from('transacoes')
    .select('tipo, categoria, valor')
    .eq('user_id', userId)
    .ilike('data', `${ano}-${mes}%`);
  
  if (error) return [];
  
  // Agrupar por categoria
  const resultado = {};
  data.forEach(t => {
    const key = `${t.tipo}_${t.categoria}`;
    if (!resultado[key]) {
      resultado[key] = { tipo: t.tipo, categoria: t.categoria, total: 0, quantidade: 0 };
    }
    resultado[key].total += parseFloat(t.valor);
    resultado[key].quantidade++;
  });
  
  return Object.values(resultado);
}

// ================== ALERTAS ==================

async function addAlerta(userId, tipo, titulo, mensagem) {
  const { data, error } = await supabase
    .from('alertas')
    .insert({
      user_id: userId,
      tipo,
      titulo,
      mensagem
    })
    .select()
    .single();
  
  if (error) throw error;
  return data.id;
}

async function getAlertas(userId, limit = 50) {
  const { data, error } = await supabase
    .from('alertas')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .limit(limit);
  
  if (error) return [];
  return data;
}

async function marcarAlertaLido(id) {
  const { error } = await supabase
    .from('alertas')
    .update({ lido: true })
    .eq('id', id);
  
  return !error;
}

async function getCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nome');
  
  if (error) return [];
  return data;
}

async function getEstatisticasPorCategoria(userId, mes, ano) {
  return await getResumoMensal(userId, mes, ano);
}

// ================== USUÁRIOS ==================

async function createUser(email, password, name, role = 'user', plan = 'basico', taxId = null, phone = null) {
  const { data, error } = await supabase
    .from('users')
    .insert({ 
      email, 
      password, 
      name, 
      role, 
      plan,
      tax_id: taxId,
      phone: phone
    })
    .select()
    .single();
  
  if (error) throw error;
  return data.id;
}

async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) return null;
  return data;
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data;
}

async function updateLastLogin(userId) {
  const { error } = await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);
  
  return !error;
}

async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, plan, active, created_at, last_login')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data;
}

async function updateUserPlan(userId, plan) {
  const { error } = await supabase
    .from('users')
    .update({ plan })
    .eq('id', userId);
  
  return !error;
}

async function toggleUserActive(userId) {
  const user = await getUserById(userId);
  const { error } = await supabase
    .from('users')
    .update({ active: !user.active })
    .eq('id', userId);
  
  return !error;
}

async function getAdminStats() {
  const { data, error } = await supabase
    .from('users')
    .select('plan, active');
  
  if (error) {
    return {
      total_users: 0,
      active_users: 0,
      basico_users: 0,
      premium_users: 0,
      enterprise_users: 0
    };
  }
  
  return {
    total_users: data.length,
    active_users: data.filter(u => u.active).length,
    basico_users: data.filter(u => u.plan === 'basico').length,
    premium_users: data.filter(u => u.plan === 'premium').length,
    enterprise_users: data.filter(u => u.plan === 'enterprise').length
  };
}

// ================== CHAT ==================

async function addChatMessage(userId, role, content, audioTranscription = null) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      role,
      content,
      audio_transcription: audioTranscription
    })
    .select()
    .single();
  
  if (error) throw error;
  return data.id;
}

async function getChatHistory(userId, limit = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) return [];
  return data;
}

async function clearChatHistory(userId) {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId);
  
  return !error;
}

// ================== LEMBRETES ==================

async function createLembrete(userId, titulo, descricao, valor, categoria, dataVencimento, recorrencia = 'unico', notificarWhatsApp = true, diasAntecedencia = 1) {
  console.log(`📝 CRIANDO lembrete para usuário ${userId}: ${titulo}`);
  
  const { data, error } = await supabase
    .from('lembretes')
    .insert({
      user_id: userId,
      titulo,
      descricao,
      valor,
      categoria,
      data_vencimento: dataVencimento,
      recorrencia,
      notificar_whatsapp: notificarWhatsApp,
      dias_antecedencia: diasAntecedencia
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao criar lembrete:', error);
    throw error;
  }
  
  console.log(`✅ Lembrete criado! ID: ${data.id}`);
  return data.id;
}

async function getLembretes(userId, status = null) {
  console.log(`🔍 Buscando lembretes do usuário ${userId}`);
  
  let query = supabase
    .from('lembretes')
    .select('*')
    .eq('user_id', userId)
    .order('data_vencimento', { ascending: true });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Erro ao buscar lembretes:', error);
    return [];
  }
  
  console.log(`📊 Encontrados ${data.length} lembretes`);
  return data;
}

async function getLembreteById(lembreteId, userId) {
  const { data, error } = await supabase
    .from('lembretes')
    .select('*')
    .eq('id', lembreteId)
    .eq('user_id', userId)
    .single();
  
  if (error) return null;
  return data;
}

async function updateLembrete(lembreteId, userId, updates) {
  console.log(`✏️ Atualizando lembrete ${lembreteId}`);
  
  const { error } = await supabase
    .from('lembretes')
    .update(updates)
    .eq('id', lembreteId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('❌ Erro ao atualizar lembrete:', error);
    return false;
  }
  
  console.log('✅ Lembrete atualizado!');
  return true;
}

async function deleteLembrete(lembreteId, userId) {
  console.log(`🗑️ Deletando lembrete ${lembreteId}`);
  
  const { error } = await supabase
    .from('lembretes')
    .delete()
    .eq('id', lembreteId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('❌ Erro ao deletar lembrete:', error);
    return false;
  }
  
  console.log('✅ Lembrete deletado!');
  return true;
}

async function marcarLembreteConcluido(lembreteId, userId) {
  return await updateLembrete(lembreteId, userId, { status: 'concluido' });
}

async function getLembretesPendentes(dataLimite = null) {
  console.log('🔍 Buscando lembretes pendentes para notificação...');
  
  let query = supabase
    .from('lembretes')
    .select('*, users!inner(name, email, phone)')
    .eq('status', 'pendente')
    .eq('notificar_whatsapp', true);
  
  if (dataLimite) {
    query = query.lte('data_vencimento', dataLimite);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Erro ao buscar lembretes pendentes:', error);
    return [];
  }
  
  return data.map(l => ({
    ...l,
    user_name: l.users.name,
    user_email: l.users.email,
    user_phone: l.users.phone
  }));
}

async function marcarLembreteNotificado(lembreteId) {
  const { error } = await supabase
    .from('lembretes')
    .update({ ultima_notificacao: new Date().toISOString() })
    .eq('id', lembreteId);
  
  return !error;
}

async function getLembretesVencidos(userId) {
  const { data, error } = await supabase
    .from('lembretes')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pendente')
    .lt('data_vencimento', new Date().toISOString())
    .order('data_vencimento', { ascending: false });
  
  if (error) return [];
  return data;
}

// ================== PAGAMENTOS ==================

async function createPayment(userId, plan, amount) {
  const { data, error } = await supabase
    .from('payments')
    .insert({ user_id: userId, plan, amount })
    .select()
    .single();
  
  if (error) throw error;
  return data.id;
}

async function approvePayment(paymentId, adminId, transactionId = null) {
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      transaction_id: transactionId
    })
    .eq('id', paymentId);
  
  return !error;
}

async function getPendingPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      users!inner(name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  
  // Flatten user data
  return data.map(p => ({
    ...p,
    name: p.users.name,
    email: p.users.email
  }));
}

async function getAllPayments(limit = 100) {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      users!inner(name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) return [];
  
  return data.map(p => ({
    ...p,
    name: p.users.name,
    email: p.users.email
  }));
}

async function getPaymentsByUser(userId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data;
}

async function getPaymentById(paymentId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();
  
  if (error) return null;
  return data;
}

async function createSubscription(userId, plan, expiresAt) {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan,
      expires_at: expiresAt
    })
    .select()
    .single();
  
  if (error) throw error;
  return data.id;
}

async function getActiveSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) return null;
  return data;
}

// Expor o cliente Supabase para queries customizadas
function getSupabaseClient() {
  return supabase;
}

module.exports = {
  init,
  addTransacao,
  getTransacoes,
  getTransacoesPorPeriodo,
  deleteTransacao,
  deleteLastTransacaoByValor,
  deleteAllTransacoes,
  getResumo,
  getResumoMensal,
  addAlerta,
  getAlertas,
  marcarAlertaLido,
  getCategorias,
  getEstatisticasPorCategoria,
  addChatMessage,
  getChatHistory,
  clearChatHistory,
  createUser,
  getUserByEmail,
  getUserById,
  updateLastLogin,
  getAllUsers,
  updateUserPlan,
  toggleUserActive,
  getAdminStats,
  createPayment,
  approvePayment,
  getPendingPayments,
  getAllPayments,
  getPaymentsByUser,
  getPaymentById,
  createSubscription,
  getActiveSubscription,
  // Lembretes
  createLembrete,
  getLembretes,
  getLembreteById,
  updateLembrete,
  deleteLembrete,
  marcarLembreteConcluido,
  getLembretesPendentes,
  marcarLembreteNotificado,
  getLembretesVencidos,
  getSupabaseClient
};

