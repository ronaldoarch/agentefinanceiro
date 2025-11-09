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
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Salvar temporariamente o áudio
    const tempPath = path.join('/tmp', filename);
    fs.writeFileSync(tempPath, audioBuffer);
    
    // Transcrever com Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
      language: "pt"
    });
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempPath);
    
    return transcription.text;
  } catch (error) {
    console.error('❌ Erro ao transcrever áudio:', error.message);
    throw error;
  }
}

// Chat conversacional com contexto financeiro
async function chatFinanceiro(mensagem, historico = []) {
  try {
    const mensagens = [
      {
        role: "system",
        content: `Você é um assistente financeiro inteligente e amigável chamado "Agente Financeiro" integrado a um sistema real.

IMPORTANTE: Você TEM ACESSO DIRETO ao sistema e PODE registrar transações automaticamente!

Suas funções:
1. Responder perguntas sobre finanças pessoais
2. REGISTRAR AUTOMATICAMENTE transações (receitas e despesas) no sistema
3. Dar conselhos financeiros práticos
4. Analisar gastos e sugerir melhorias
5. Explicar conceitos financeiros de forma simples

Estilo de comunicação:
- Seja amigável e use emojis apropriados
- Seja direto e prático
- Responda em português do Brasil
- Seja positivo e motivador

QUANDO O USUÁRIO MENCIONAR UMA TRANSAÇÃO:
- Confirme que a transação FOI REGISTRADA NO SISTEMA
- SEMPRE diga: "✅ Transação registrada! Você pode ver no Dashboard agora."
- NÃO diga que não pode acessar o sistema
- NÃO peça para o usuário registrar manualmente
- Você REGISTRA AUTOMATICAMENTE

Categorias disponíveis: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Freelance, Investimentos, Outros

IMPORTANTE: Você é parte INTEGRADA do sistema, não apenas um chatbot!`
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
          content: `Analise a mensagem do usuário e determine se é uma transação financeira (receita ou despesa).

Se for uma transação, extraia:
- isTransacao: true/false
- tipo: "receita" ou "despesa"
- valor: número decimal
- categoria: uma das categorias válidas
- descricao: descrição clara e concisa

Categorias válidas:
Despesas: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Outros
Receitas: Salário, Freelance, Investimentos, Outros

Exemplos de DESPESAS:
"Gastei 50 reais no mercado" → {"isTransacao": true, "tipo": "despesa", "valor": 50, "categoria": "Alimentação", "descricao": "Compras no mercado"}
"Paguei 150 de luz" → {"isTransacao": true, "tipo": "despesa", "valor": 150, "categoria": "Contas", "descricao": "Conta de luz"}
"Uber de 25" → {"isTransacao": true, "tipo": "despesa", "valor": 25, "categoria": "Transporte", "descricao": "Uber"}

Exemplos de RECEITAS:
"Recebi 2000 do salário" → {"isTransacao": true, "tipo": "receita", "valor": 2000, "categoria": "Salário", "descricao": "Salário mensal"}
"Freelance de 500" → {"isTransacao": true, "tipo": "receita", "valor": 500, "categoria": "Freelance", "descricao": "Pagamento freelance"}
"Ganhei 100 reais" → {"isTransacao": true, "tipo": "receita", "valor": 100, "categoria": "Outros", "descricao": "Receita"}
"Recebi 3000" → {"isTransacao": true, "tipo": "receita", "valor": 3000, "categoria": "Outros", "descricao": "Receita"}

Palavras-chave para RECEITA:
- recebi, receber, ganhei, ganhar, salário, freelance, pagamento recebido, venda, lucro

Palavras-chave para DESPESA:
- gastei, gastar, paguei, pagar, comprei, comprar, despesa, custo

Exemplos que NÃO são transações:
"Como faço para economizar?" → {"isTransacao": false}
"Quanto gastei este mês?" → {"isTransacao": false}

IMPORTANTE: 
- Responda APENAS com JSON válido, sem texto adicional
- Seja PRECISO na identificação de tipo (receita vs despesa)
- Use as palavras-chave para identificar corretamente`
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
    
    if (resultado.isTransacao && resultado.valor && resultado.tipo) {
      return {
        isTransacao: true,
        tipo: resultado.tipo,
        valor: parseFloat(resultado.valor),
        categoria: resultado.categoria || 'Outros',
        descricao: resultado.descricao || mensagem
      };
    }

    return { isTransacao: false };

  } catch (error) {
    console.error('❌ Erro ao detectar transação:', error.message);
    return { isTransacao: false };
  }
}

module.exports = {
  processarMensagemFinanceira,
  gerarResumo,
  analisarPadroesEAlertas,
  transcreverAudio,
  chatFinanceiro,
  detectarTransacao
};

