const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Processar mensagem financeira com OpenAI
async function processarMensagemFinanceira(mensagem) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Você é um assistente financeiro especializado em extrair informações de transações financeiras.
          
Sua tarefa é analisar mensagens e extrair:
1. tipo: "receita" ou "despesa"
2. valor: número decimal (sem símbolo de moeda)
3. categoria: uma das categorias: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Freelance, Investimentos, Outros
4. descricao: descrição curta e clara da transação

Exemplos:
- "Gastei R$ 45,00 no supermercado" → {"tipo": "despesa", "valor": 45.00, "categoria": "Alimentação", "descricao": "Compras no supermercado"}
- "Recebi 3000 do salário" → {"tipo": "receita", "valor": 3000.00, "categoria": "Salário", "descricao": "Salário mensal"}
- "Paguei 150 de luz" → {"tipo": "despesa", "valor": 150.00, "categoria": "Contas", "descricao": "Conta de luz"}

IMPORTANTE: 
- Responda APENAS com um objeto JSON válido, sem texto adicional
- Não inclua markdown ou formatação
- Use ponto (.) como separador decimal
- Se não conseguir identificar algo, use valores padrão razoáveis`
        },
        {
          role: "user",
          content: mensagem
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const resposta = JSON.parse(completion.choices[0].message.content);
    
    // Validar resposta
    if (!resposta.tipo || !resposta.valor) {
      throw new Error('Resposta da OpenAI incompleta');
    }

    return {
      tipo: resposta.tipo,
      valor: parseFloat(resposta.valor),
      categoria: resposta.categoria || 'Outros',
      descricao: resposta.descricao || mensagem
    };

  } catch (error) {
    console.error('❌ Erro ao processar com OpenAI:', error.message);
    throw error;
  }
}

// Gerar resumo financeiro com OpenAI
async function gerarResumo(transacoes, resumo) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Você é um consultor financeiro pessoal. Analise os dados financeiros e crie um resumo amigável e informativo em português, com insights e recomendações.
          
Use emojis para tornar a mensagem mais amigável e clara. Seja direto e prático.`
        },
        {
          role: "user",
          content: `Crie um resumo financeiro baseado nestes dados:

Resumo Mensal (${resumo.mes}):
- Receitas: R$ ${resumo.receitas.toFixed(2)}
- Despesas: R$ ${resumo.despesas.toFixed(2)}
- Saldo: R$ ${resumo.saldo.toFixed(2)}

Últimas transações:
${transacoes.slice(0, 10).map(t => `- ${t.tipo === 'receita' ? '+' : '-'} R$ ${t.valor.toFixed(2)} - ${t.descricao} (${t.categoria})`).join('\n')}

Forneça insights sobre gastos, categorias com mais despesas e recomendações.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error('❌ Erro ao gerar resumo:', error.message);
    return 'Não foi possível gerar o resumo no momento.';
  }
}

// Analisar padrões e gerar alertas
async function analisarPadroesEAlertas(transacoes, resumo) {
  try {
    const alertas = [];

    // Verificar gasto alto
    const gastoAlto = parseFloat(process.env.ALERTA_GASTO_ALTO || 500);
    const despesasAltas = transacoes.filter(t => t.tipo === 'despesa' && t.valor > gastoAlto);
    
    if (despesasAltas.length > 0) {
      alertas.push({
        tipo: 'warning',
        titulo: '⚠️ Gasto Alto Detectado',
        mensagem: `Você teve ${despesasAltas.length} transação(ões) acima de R$ ${gastoAlto.toFixed(2)}`
      });
    }

    // Verificar limite mensal
    const limiteMensal = parseFloat(process.env.ALERTA_LIMITE_MENSAL || 3000);
    if (resumo.despesas > limiteMensal) {
      alertas.push({
        tipo: 'danger',
        titulo: '🚨 Limite Mensal Ultrapassado',
        mensagem: `Suas despesas (R$ ${resumo.despesas.toFixed(2)}) ultrapassaram o limite de R$ ${limiteMensal.toFixed(2)}`
      });
    }

    // Verificar saldo negativo
    if (resumo.saldo < 0) {
      alertas.push({
        tipo: 'danger',
        titulo: '⛔ Saldo Negativo',
        mensagem: `Suas despesas estão maiores que suas receitas. Saldo: R$ ${resumo.saldo.toFixed(2)}`
      });
    }

    // Alerta positivo de economia
    if (resumo.saldo > 0 && resumo.receitas > 0) {
      const percentualEconomia = (resumo.saldo / resumo.receitas) * 100;
      if (percentualEconomia > 30) {
        alertas.push({
          tipo: 'info',
          titulo: '✅ Ótima Economia!',
          mensagem: `Você está economizando ${percentualEconomia.toFixed(1)}% da sua receita. Parabéns!`
        });
      }
    }

    return alertas;

  } catch (error) {
    console.error('❌ Erro ao analisar padrões:', error.message);
    return [];
  }
}

// Transcrever áudio usando Whisper
async function transcreverAudio(audioBuffer, filename) {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  let tempPath = null;
  
  try {
    console.log('🎤 Iniciando transcrição de áudio...');
    console.log('📦 Tamanho do buffer:', audioBuffer.length, 'bytes');
    console.log('📁 Nome do arquivo:', filename);
    
    // Verificar se há API Key configurada
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada! Configure a variável de ambiente.');
    }
    
    // Validar tamanho mínimo do áudio (1KB)
    if (audioBuffer.length < 1024) {
      throw new Error('Áudio muito curto ou vazio. Grave por pelo menos 1 segundo.');
    }
    
    // Validar tamanho máximo (25MB - limite da API Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioBuffer.length > maxSize) {
      throw new Error(`Áudio muito grande (${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB). Máximo: 25MB`);
    }
    
    // Usar diretório temporário do sistema operacional
    const tempDir = os.tmpdir();
    tempPath = path.join(tempDir, filename);
    
    console.log('💾 Salvando áudio temporariamente em:', tempPath);
    fs.writeFileSync(tempPath, audioBuffer);
    
    // Verificar se o arquivo foi criado
    if (!fs.existsSync(tempPath)) {
      throw new Error('Falha ao salvar arquivo temporário');
    }
    
    const fileSize = fs.statSync(tempPath).size;
    console.log('✅ Áudio salvo! Tamanho no disco:', fileSize, 'bytes');
    
    console.log('📡 Enviando para Whisper API...');
    
    // Transcrever com Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
      language: "pt",
      response_format: "text"
    });
    
    console.log('✅ Transcrição concluída!');
    console.log('📝 Texto:', transcription);
    console.log('📏 Comprimento:', transcription.length, 'caracteres');
    
    return transcription;
  } catch (error) {
    console.error('❌ Erro ao transcrever áudio:', error.message);
    console.error('❌ Stack:', error.stack);
    
    if (error.response) {
      console.error('❌ Status HTTP:', error.response.status);
      console.error('❌ Resposta da API:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Mensagens de erro mais amigáveis
    if (error.message.includes('API_KEY')) {
      throw new Error('Configuração da OpenAI está incorreta. Contate o administrador.');
    } else if (error.message.includes('quota')) {
      throw new Error('Limite de uso da API atingido. Tente novamente mais tarde.');
    } else if (error.message.includes('Invalid file format')) {
      throw new Error('Formato de áudio não suportado. Tente gravar novamente.');
    }
    
    throw error;
  } finally {
    // Limpar arquivo temporário (mesmo se houver erro)
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
        console.log('🗑️ Arquivo temporário removido');
      } catch (cleanupError) {
        console.error('⚠️ Erro ao remover arquivo temporário:', cleanupError.message);
      }
    }
  }
}

// Chat conversacional com contexto financeiro
async function chatFinanceiro(mensagem, historico = []) {
  try {
    const mensagens = [
      {
        role: "system",
        content: `Você é um assistente financeiro inteligente e amigável chamado "Agente Financeiro" integrado a um sistema real.

IMPORTANTE: Você TEM ACESSO DIRETO ao sistema e PODE registrar transações, lembretes e eventos no Google Agenda automaticamente!

Suas funções:
1. Responder perguntas sobre finanças pessoais
2. REGISTRAR AUTOMATICAMENTE transações (receitas e despesas) no sistema
3. CRIAR AUTOMATICAMENTE lembretes financeiros (vencimentos, contas a pagar)
4. CRIAR AUTOMATICAMENTE eventos no Google Agenda (reuniões, compromissos, tarefas)
5. Dar conselhos financeiros práticos
6. Analisar gastos e sugerir melhorias
7. Explicar conceitos financeiros de forma simples

Estilo de comunicação:
- Seja amigável e use emojis apropriados
- Seja direto e prático
- Responda em português do Brasil
- Seja positivo e motivador
- NUNCA invente valores ou dados
- Use APENAS informações que foram fornecidas no contexto

QUANDO O USUÁRIO MENCIONAR UMA TRANSAÇÃO:
- Confirme APENAS a transação que ele acabou de registrar
- NÃO mencione resumos totais ou saldos a menos que seja perguntado
- SEMPRE diga: "✅ Transação registrada com sucesso!"
- Se ele perguntar sobre saldo/resumo, use APENAS os dados fornecidos no contexto
- NUNCA invente valores que não estão no contexto

QUANDO O USUÁRIO PERGUNTAR SOBRE FINANÇAS:
- Use APENAS os dados fornecidos no contexto "DADOS REAIS DO USUÁRIO"
- Se não houver dados no contexto, diga que não há transações registradas
- NUNCA invente valores, transações ou informações
- Seja preciso com os números fornecidos

QUANDO O USUÁRIO PEDIR UM LEMBRETE:
- Confirme que o lembrete FOI CRIADO NO SISTEMA
- SEMPRE diga: "📅 Lembrete criado! Você receberá notificação no WhatsApp quando chegar a hora."
- Mencione a data/hora do vencimento
- Explique que ele pode ver na aba "Lembretes"

QUANDO O USUÁRIO PEDIR PARA AGENDAR/MARCAR UM EVENTO (reunião, compromisso, tarefa, rotina):
- Confirme que o(s) evento(s) FOI/FORAM CRIADO(S) NO GOOGLE AGENDA
- SEMPRE diga: "📅 Evento(s) criado(s) no Google Agenda! Você pode ver na sua agenda do Google."
- Mencione a data/hora do evento
- Se mencionar local, confirme o local também
- Se for rotina/recorrente, mencione que é recorrente
- Exemplos: "Reunião com João amanhã às 14h", "Consulta médica dia 20", "Rotina diária de segunda a quinta"
- IMPORTANTE: Você PODE criar eventos no Google Agenda! NÃO diga que não pode!

Categorias disponíveis: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Freelance, Investimentos, Outros

REGRA DE OURO: NUNCA INVENTE DADOS! Use apenas informações reais fornecidas no contexto ou confirme apenas a ação que acabou de ser realizada.`
      }
    ];

    // Adicionar histórico
    historico.forEach(msg => {
      mensagens.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Adicionar mensagem atual
    mensagens.push({
      role: "user",
      content: mensagem
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: mensagens,
      temperature: 0.7,
      max_tokens: 800
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erro no chat:', error.message);
    throw error;
  }
}

// Detectar se a mensagem é uma transação
async function detectarTransacao(mensagem) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Analise a mensagem do usuário e extraia TODAS as transações financeiras mencionadas.

IMPORTANTE: Se houver MÚLTIPLAS transações na mensagem, retorne TODAS em um array.

Formato de resposta:
{
  "transacoes": [
    {
      "tipo": "receita" ou "despesa",
      "valor": número decimal,
      "categoria": categoria válida,
      "descricao": descrição clara,
      "conta": nome da conta/cartão mencionado (opcional, null se não mencionar)
    }
  ]
}

DETECÇÃO DE CONTA:
- Se mencionar "com o cartão X", "no cartão Y", "paguei com X" → conta: "X"
- Se mencionar banco (ex: "Nubank", "Itaú", "Inter") → conta: nome do banco
- Se mencionar "dinheiro", "carteira", "pix" → conta: null (não é cartão)
- Exemplos:
  "Gastei 50 no mercado com o Nubank" → conta: "Nubank"
  "Paguei 200 de conta com o cartão Itaú" → conta: "Itaú"
  "Comprei café com dinheiro" → conta: null

Categorias válidas:
Despesas: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Outros
Receitas: Salário, Freelance, Investimentos, Outros

Exemplos:

UMA transação:
"Gastei 50 no mercado" → {"transacoes": [{"tipo": "despesa", "valor": 50, "categoria": "Alimentação", "descricao": "Compras no mercado"}]}

MÚLTIPLAS transações:
"Aluguel 800, água 150, energia 150, babá 400" → {"transacoes": [
  {"tipo": "despesa", "valor": 800, "categoria": "Moradia", "descricao": "Aluguel"},
  {"tipo": "despesa", "valor": 150, "categoria": "Contas", "descricao": "Conta de água"},
  {"tipo": "despesa", "valor": 150, "categoria": "Contas", "descricao": "Conta de energia"},
  {"tipo": "despesa", "valor": 400, "categoria": "Outros", "descricao": "Babá"}
]}

"Recebi 3000 de salário" → {"transacoes": [{"tipo": "receita", "valor": 3000, "categoria": "Salário", "descricao": "Salário mensal"}]}

Não é transação:
"Como economizar?" → {"transacoes": []}

Palavras-chave para RECEITA: recebi, receber, ganhei, ganhar, salário, freelance
Palavras-chave para DESPESA: gastei, gastar, paguei, pagar, comprei, comprar, aluguel, conta

REGRAS:
- Se não houver transações, retorne array vazio
- Extraia TODAS as transações mencionadas
- Seja PRECISO no tipo (receita vs despesa)
- Responda APENAS com JSON válido`
        },
        {
          role: "user",
          content: mensagem
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const resultado = JSON.parse(completion.choices[0].message.content);
    
    if (resultado.transacoes && Array.isArray(resultado.transacoes) && resultado.transacoes.length > 0) {
      // Retornar array de transações
      return resultado.transacoes.map(t => ({
        tipo: t.tipo,
        valor: parseFloat(t.valor),
        categoria: t.categoria || 'Outros',
        descricao: t.descricao || mensagem
      }));
    }

    return []; // Retorna array vazio se não houver transações

  } catch (error) {
    console.error('❌ Erro ao detectar transação:', error.message);
    return [];
  }
}

// Detectar se quer deletar uma transação
async function detectarDelecao(mensagem) {
  try {
    // Palavras-chave simples para deletar
    const keywords = ['apagar', 'apague', 'deletar', 'delete', 'remover', 'remova', 'excluir', 'exclua'];
    const temKeyword = keywords.some(k => mensagem.toLowerCase().includes(k));
    
    if (!temKeyword) {
      return { isDelecao: false };
    }
    
    // Extrair valor usando regex
    const valorMatch = mensagem.match(/(\d+[\.,]?\d*)/);
    
    if (valorMatch) {
      const valor = parseFloat(valorMatch[1].replace(',', '.'));
      return {
        isDelecao: true,
        valor: valor
      };
    }
    
    return { isDelecao: false };
  } catch (error) {
    console.error('Erro ao detectar deleção:', error);
    return { isDelecao: false };
  }
}

// Detectar se quer limpar TODAS as transações
async function detectarLimpezaTotal(mensagem) {
  try {
    const mensagemLower = mensagem.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    
    // Palavras-chave para limpar tudo
    const keywordsTudo = ['tudo', 'todas', 'todos', 'total', 'completamente', 'geral'];
    const keywordsLimpar = ['limpar', 'limpe', 'resetar', 'reset', 'zerar', 'zere', 'apagar', 'apague', 'remover', 'remova', 'remove', 'deletar', 'delete', 'excluir', 'exclua'];
    const keywordsDashboard = ['dashboard', 'dashbord', 'painel', 'dash'];
    
    const temTudo = keywordsTudo.some(k => mensagemLower.includes(k));
    const temLimpar = keywordsLimpar.some(k => mensagemLower.includes(k));
    const temDashboard = keywordsDashboard.some(k => mensagemLower.includes(k));
    
    // Verificar frases específicas (com mais variações)
    const frasesEspecificas = [
      'remove tudo',
      'remover tudo',
      'remova tudo',
      'apagar tudo',
      'apague tudo',
      'deletar tudo',
      'delete tudo',
      'limpar tudo',
      'limpe tudo',
      'zerar tudo',
      'zere tudo',
      'excluir tudo',
      'exclua tudo',
      'limpar transacoes',
      'limpe transacoes',
      'apagar transacoes',
      'apague transacoes',
      'remover transacoes',
      'remova transacoes',
      'deletar transacoes',
      'delete transacoes',
      'resetar tudo',
      'reset tudo',
      'comecar do zero',
      'comece do zero',
      'vamos limpar',
      'limpar o dashboard',
      'limpe o dashboard',
      'limpar dashboard',
      'limpe dashboard',
      'apagar dashboard',
      'apague dashboard',
      'zerar dashboard',
      'zere dashboard',
      'limpar o painel',
      'limpe o painel',
      'apagar o painel',
      'apague o painel',
      'zerar o painel',
      'zere o painel',
      'apagar no dashboard',
      'apague no dashboard',
      'remover no dashboard',
      'remova no dashboard',
      'deletar no dashboard',
      'delete no dashboard',
      'limpar no dashboard',
      'limpe no dashboard'
    ];
    
    const temFraseEspecifica = frasesEspecificas.some(f => mensagemLower.includes(f));
    
    // Retorna true se:
    // 1. Tem palavra de "limpar" + palavra de "tudo", OU
    // 2. Tem palavra de "limpar" + palavra de "dashboard", OU
    // 3. Tem uma frase específica
    return {
      isLimpezaTotal: (temTudo && temLimpar) || (temDashboard && temLimpar) || temFraseEspecifica
    };
  } catch (error) {
    console.error('Erro ao detectar limpeza total:', error);
    return { isLimpezaTotal: false };
  }
}

// Detectar se a mensagem é um evento para Google Calendar
async function detectarEventoGoogleCalendar(mensagem) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Analise a mensagem e identifique se o usuário quer criar EVENTO(S)/COMPROMISSO(S) no Google Agenda.

IMPORTANTE: Eventos são compromissos, reuniões, tarefas, rotinas, blocos de tempo, não necessariamente financeiros!

Palavras-chave para EVENTO:
- "reunião", "encontro", "compromisso", "evento", "tarefa", "rotina"
- "marcar", "agendar", "lembrar de", "não esquecer", "criar", "adicionar"
- "dia X", "às X horas", "amanhã", "semana que vem"
- "com [pessoa]", "no [local]"
- "rotina diária", "rotina semanal", "bloco de tempo", "horário fixo"
- "segunda a quinta", "todos os dias", "diariamente", "semanalmente"
- "das X às Y", "de X horas até Y horas"

Formato de resposta:
{
  "isEvento": true ou false,
  "eventos": [
    {
      "titulo": "título do evento",
      "descricao": "descrição opcional",
      "dataInicio": "YYYY-MM-DDTHH:mm:ss" (ISO 8601 com timezone UTC),
      "dataFim": "YYYY-MM-DDTHH:mm:ss" (ISO 8601 com timezone UTC) ou null,
      "local": "local do evento" ou null,
      "recorrencia": "DAILY|WEEKLY|MONTHLY|YEARLY" ou null (se for evento recorrente),
      "diasSemana": ["MO","TU","WE","TH","FR","SA","SU"] ou null (para eventos semanais)
    }
  ]
}

IMPORTANTE SOBRE EVENTOS RECORRENTES:
- Se mencionar "rotina diária", "todos os dias", "diariamente" → recorrencia: "DAILY"
- Se mencionar "segunda a quinta", "toda segunda" → recorrencia: "WEEKLY", diasSemana: ["MO","TU","WE","TH"]
- Se mencionar "todo mês" → recorrencia: "MONTHLY"
- Se for evento único (sem repetição) → recorrencia: null

IMPORTANTE SOBRE ROTINAS COM MÚLTIPLOS BLOCOS:
- Se o usuário mencionar uma rotina com vários blocos/tarefas (ex: "bloco 1", "bloco 2", lista numerada)
- Crie UM evento SEPARADO para CADA bloco/tarefa
- Cada evento deve ter seu próprio horário de início e fim
- Todos os eventos devem ter a mesma recorrencia e diasSemana
- Exemplo: "Rotina de segunda a quinta às 9h: 1. Abertura (9h-9:15), 2. Análise (9:15-9:40)"
  → Crie 2 eventos: um para "Abertura" e outro para "Análise", ambos recorrentes segunda a quinta

REGRAS PARA DATA (CRÍTICO - CALCULE CORRETAMENTE):
- DATA ATUAL (America/Sao_Paulo): ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
- DATA ATUAL (UTC): ${new Date().toISOString()}
- Se mencionar "amanhã": adicione 1 dia à data atual
- Se mencionar "dia X": use o dia X do mês atual (se já passou, use próximo mês)
- Se mencionar "semana que vem": adicione 7 dias à data atual
- Se mencionar hora (ex: "14h", "14:00", "às 2 da tarde"): use essa hora NO TIMEZONE America/Sao_Paulo
- Se mencionar "por volta das Xh" ou "flex entre X e Y": use a hora inicial (ex: "por volta das 9h" → 09:00)
- Se não mencionar hora: use 09:00 como padrão
- Se não mencionar data fim: calcule baseado na duração mencionada (ex: "15 min" → adicione 15 minutos)
- Se mencionar duração (ex: "10 a 15 min", "20 a 30 min"): use a duração MÁXIMA para calcular dataFim
- IMPORTANTE: As horas mencionadas pelo usuário são SEMPRE no timezone America/Sao_Paulo (GMT-3)
- Para calcular a data correta:
  1. Pegue a data/hora desejada no timezone America/Sao_Paulo
  2. Converta para UTC (adicione 3 horas se for horário de verão, ou use offset correto)
  3. Retorne no formato ISO 8601: "YYYY-MM-DDTHH:mm:ss.000Z"
- Para rotinas semanais (ex: "segunda a quinta"): use a PRÓXIMA segunda-feira como dataInicio
- EXEMPLO: Se usuário pedir "9h" e hoje é 18/11/2024 → retorne "2024-11-18T12:00:00.000Z" (9h SP = 12h UTC)

Exemplos CORRETOS (data atual: ${new Date().toISOString()}):

"Reunião com João amanhã às 14h" → 
{
  "isEvento": true,
  "eventos": [{
    "titulo": "Reunião com João",
    "descricao": "",
    "dataInicio": "${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T14:00:00.000Z",
    "dataFim": null,
    "local": null
  }]
}

"Marcar consulta médica dia 20 às 9h" → 
{
  "isEvento": true,
  "eventos": [{
    "titulo": "Consulta Médica",
    "descricao": "",
    "dataInicio": "${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-20T09:00:00.000Z",
    "dataFim": null,
    "local": null
  }]
}

"Evento de aniversário no dia 15 às 19h no restaurante" → 
{
  "isEvento": true,
  "eventos": [{
    "titulo": "Evento de Aniversário",
    "descricao": "",
    "dataInicio": "${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15T19:00:00.000Z",
    "dataFim": null,
    "local": "restaurante"
  }]
}

"Gastei 50 no mercado" → 
{
  "isEvento": false,
  "eventos": []
}

"Rotina diária de segunda a quinta às 9h: 1. Abertura (10-15 min), 2. Verificar saldos (15-25 min)" →
{
  "isEvento": true,
  "eventos": [
    {
      "titulo": "Abertura do dia",
      "descricao": "Rotina diária - Abertura do dia",
      "dataInicio": "[próxima segunda às 09:00]",
      "dataFim": "[próxima segunda às 09:15]",
      "local": null,
      "recorrencia": "WEEKLY",
      "diasSemana": ["MO","TU","WE","TH"]
    },
    {
      "titulo": "Verificar saldos das contas de anúncios",
      "descricao": "Rotina diária - Verificar saldos das contas de anúncios",
      "dataInicio": "[próxima segunda às 09:15]",
      "dataFim": "[próxima segunda às 09:40]",
      "local": null,
      "recorrencia": "WEEKLY",
      "diasSemana": ["MO","TU","WE","TH"]
    }
  ]
}

IMPORTANTE: Se o usuário listar vários blocos numerados, crie um evento para cada um, calculando os horários sequencialmente!

IMPORTANTE:
- Se NÃO for um evento, retorne isEvento: false
- Se for evento, CALCULE a data corretamente em formato ISO 8601 UTC
- Se for rotina com múltiplos blocos, crie UM evento para CADA bloco
- Para eventos recorrentes, use a PRIMEIRA ocorrência como dataInicio
- Responda APENAS com JSON válido`
        },
        {
          role: "user",
          content: mensagem
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const resultado = JSON.parse(completion.choices[0].message.content);
    
    if (resultado.isEvento && resultado.eventos && resultado.eventos.length > 0) {
      return resultado.eventos.map(e => ({
        titulo: e.titulo,
        descricao: e.descricao || '',
        dataInicio: e.dataInicio,
        dataFim: e.dataFim || null,
        local: e.local || null,
        recorrencia: e.recorrencia || null,
        diasSemana: e.diasSemana || null
      }));
    }

    return []; // Retorna array vazio se não houver eventos

  } catch (error) {
    console.error('❌ Erro ao detectar evento Google Calendar:', error.message);
    return [];
  }
}

// Detectar se a mensagem é um lembrete financeiro
async function detectarLembrete(mensagem) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Analise a mensagem e identifique se o usuário está pedindo para criar um LEMBRETE financeiro.

IMPORTANTE: Lembretes são sobre COMPROMISSOS FUTUROS, não transações passadas!

Palavras-chave para LEMBRETE:
- "lembrar", "lembre", "lembrete", "me avise", "aviso", "notificar"
- "vence", "vencimento", "pagar dia", "todo dia", "toda semana", "todo mês"
- "não esquecer", "anotar", "programar"

Formato de resposta:
{
  "isLembrete": true ou false,
  "lembretes": [
    {
      "titulo": "título curto e claro",
      "descricao": "descrição opcional",
      "valor": número decimal ou null,
      "categoria": "contas|aluguel|impostos|assinaturas|parcelas|investimentos|outros",
      "dataVencimento": "YYYY-MM-DDTHH:mm:ss" (ISO 8601),
      "recorrencia": "unico|diario|semanal|mensal|anual",
      "diasAntecedencia": número de dias (1-30)
    }
  ]
}

REGRAS PARA DATA:
- Se mencionar "dia X": usar o dia X do mês atual ou próximo mês
- Se mencionar "amanhã": usar data de amanhã
- Se mencionar "semana que vem": usar próxima semana
- Se mencionar "mês que vem": usar próximo mês
- Se mencionar "todo dia X": recorrencia = "mensal"
- Se mencionar "toda semana": recorrencia = "semanal"
- Se mencionar "todo ano": recorrencia = "anual"
- Se não mencionar hora: usar 09:00 como padrão
- DATA ATUAL PARA REFERÊNCIA: ${new Date().toISOString()}

CATEGORIAS:
- Contas: luz, água, internet, telefone, gás
- Aluguel: aluguel, condomínio
- Impostos: IPTU, IPVA, IR, impostos
- Assinaturas: Netflix, Spotify, academia, streaming
- Parcelas: compras parceladas, financiamentos
- Investimentos: aportes, aplicações
- Outros: qualquer outro tipo

Exemplos:

"Me lembre de pagar a internet dia 20" → 
{
  "isLembrete": true,
  "lembretes": [{
    "titulo": "Pagar Internet",
    "descricao": "Pagamento mensal da internet",
    "valor": null,
    "categoria": "contas",
    "dataVencimento": "[próximo dia 20 às 09:00]",
    "recorrencia": "mensal",
    "diasAntecedencia": 1
  }]
}

"Lembrete: conta de luz vence dia 15, são 150 reais" → 
{
  "isLembrete": true,
  "lembretes": [{
    "titulo": "Conta de Luz",
    "descricao": "Vencimento da conta de luz",
    "valor": 150,
    "categoria": "contas",
    "dataVencimento": "[próximo dia 15 às 09:00]",
    "recorrencia": "mensal",
    "diasAntecedencia": 3
  }]
}

"Me avise 2 dias antes do aluguel de 800 que vence todo dia 5" → 
{
  "isLembrete": true,
  "lembretes": [{
    "titulo": "Aluguel",
    "descricao": "Pagamento mensal do aluguel",
    "valor": 800,
    "categoria": "aluguel",
    "dataVencimento": "[próximo dia 5 às 09:00]",
    "recorrencia": "mensal",
    "diasAntecedencia": 2
  }]
}

"Gastei 50 no mercado" → 
{
  "isLembrete": false,
  "lembretes": []
}

IMPORTANTE:
- Se NÃO for um lembrete, retorne isLembrete: false
- Se for lembrete, calcule a data corretamente
- Responda APENAS com JSON válido`
        },
        {
          role: "user",
          content: mensagem
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const resultado = JSON.parse(completion.choices[0].message.content);
    
    if (resultado.isLembrete && resultado.lembretes && resultado.lembretes.length > 0) {
      return resultado.lembretes.map(l => ({
        titulo: l.titulo,
        descricao: l.descricao || '',
        valor: l.valor ? parseFloat(l.valor) : null,
        categoria: l.categoria || 'outros',
        dataVencimento: l.dataVencimento,
        recorrencia: l.recorrencia || 'unico',
        diasAntecedencia: l.diasAntecedencia || 1
      }));
    }

    return []; // Retorna array vazio se não houver lembretes

  } catch (error) {
    console.error('❌ Erro ao detectar lembrete:', error.message);
    return [];
  }
}

module.exports = {
  processarMensagemFinanceira,
  gerarResumo,
  analisarPadroesEAlertas,
  transcreverAudio,
  chatFinanceiro,
  detectarTransacao,
  detectarDelecao,
  detectarLimpezaTotal,
  detectarLembrete,
  detectarEventoGoogleCalendar
};

