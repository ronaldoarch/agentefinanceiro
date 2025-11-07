# 💰 Agente Financeiro com WhatsApp e OpenAI

Um agente financeiro inteligente que processa suas transações financeiras via WhatsApp, utilizando OpenAI para análise e fornecendo um painel web completo para visualização e alertas.

## 🚀 Funcionalidades

### 📱 WhatsApp
- ✅ Envie transações financeiras por mensagens naturais
- ✅ Receba confirmações instantâneas
- ✅ Consulte resumos financeiros a qualquer momento
- ✅ Alertas inteligentes sobre seus gastos

### 🤖 Inteligência Artificial (OpenAI)
- ✅ Processamento de linguagem natural para entender suas transações
- ✅ Categorização automática de gastos
- ✅ Geração de resumos financeiros personalizados
- ✅ Análise de padrões e comportamentos

### 📊 Painel Web
- ✅ Dashboard com gráficos interativos
- ✅ Visualização de todas as transações
- ✅ Estatísticas por categoria
- ✅ Central de alertas
- ✅ Atualizações em tempo real via WebSocket

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** + **Express** - Servidor API
- **Baileys** - Integração com WhatsApp
- **OpenAI API** - Processamento de linguagem natural
- **SQLite** (better-sqlite3) - Banco de dados
- **WebSocket** - Atualizações em tempo real

### Frontend
- **React** - Interface do usuário
- **Recharts** - Gráficos interativos
- **Axios** - Requisições HTTP
- **Moment.js** - Formatação de datas

## 📦 Instalação

### Pré-requisitos
- Node.js 16+ instalado
- Conta OpenAI com API Key
- Celular com WhatsApp

### Passo 1: Clonar ou navegar até o projeto
```bash
cd /Users/ronaldodiasdesousa/Desktop/agentefinanceiro
```

### Passo 2: Instalar dependências do backend
```bash
npm install
```

### Passo 3: Instalar dependências do frontend
```bash
cd client
npm install
cd ..
```

### Passo 4: Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave da OpenAI:
```env
OPENAI_API_KEY=sua_chave_openai_aqui
PORT=3001
DB_PATH=./database.sqlite
ALERTA_GASTO_ALTO=500
ALERTA_LIMITE_MENSAL=3000
```

### Passo 5: Construir o frontend
```bash
cd client
npm run build
cd ..
```

## 🚀 Como Usar

### Iniciar o Sistema Completo

#### Opção 1: Iniciar tudo de uma vez (Recomendado)
```bash
npm run dev:full
```

#### Opção 2: Iniciar separadamente

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend (modo desenvolvimento):**
```bash
cd client
npm start
```

### Conectar o WhatsApp

1. Ao iniciar o backend, um **QR Code** será exibido no terminal
2. Abra o WhatsApp no seu celular
3. Vá em **Configurações > Aparelhos Conectados**
4. Clique em **Conectar um aparelho**
5. Escaneie o QR Code exibido no terminal
6. Aguarde a confirmação de conexão

### Acessar o Painel

Abra seu navegador e acesse:
```
http://localhost:3001
```

## 📱 Como Enviar Transações pelo WhatsApp

### Exemplos de Mensagens

O agente entende mensagens naturais! Exemplos:

**Despesas:**
```
Gastei R$ 45 no supermercado
Paguei 150 da conta de luz
Comprei uma camisa por 89 reais
Almoço hoje foi 35
```

**Receitas:**
```
Recebi 3000 de salário
Freelance pagou 500
Vendi um item por 120
```

**Comandos Especiais:**
```
resumo - Ver resumo financeiro completo
ajuda - Ver lista de comandos
```

### O que o Bot Responde

Para cada transação, você receberá:
- ✅ Confirmação da transação
- 💰 Tipo (receita ou despesa)
- 💵 Valor registrado
- 📁 Categoria identificada
- 📊 Resumo mensal atualizado
- ⚠️ Alertas (se houver)

## 📊 Painel Web - Recursos

### Dashboard
- **Cards de Resumo**: Receitas, Despesas e Saldo do mês
- **Gráfico de Barras**: Últimos 7 dias de movimentação
- **Gráfico de Pizza**: Distribuição de despesas por categoria
- **Últimas Transações**: Visualização rápida das últimas operações

### Transações
- **Filtros**: Todas, Receitas ou Despesas
- **Busca**: Pesquise por descrição ou categoria
- **Agrupamento**: Transações agrupadas por data
- **Estatísticas**: Totais de receitas e despesas filtradas

### Alertas
- **Central de Alertas**: Todos os alertas em um só lugar
- **Tipos de Alerta**:
  - 🚨 **Crítico**: Limites ultrapassados, saldo negativo
  - ⚠️ **Aviso**: Gastos altos detectados
  - ✅ **Positivo**: Metas alcançadas, boa economia
- **Marcar como Lido**: Gerencie seus alertas

## 🎯 Categorias Disponíveis

### Despesas
- 🍔 Alimentação
- 🚗 Transporte
- 🏠 Moradia
- 🏥 Saúde
- 📚 Educação
- 🎮 Lazer
- 🛒 Compras
- 📝 Contas
- 📦 Outros

### Receitas
- 💰 Salário
- 💼 Freelance
- 📈 Investimentos

## ⚙️ Configurações de Alertas

Você pode personalizar os limites de alertas no arquivo `.env`:

```env
# Alerta quando uma transação única for maior que este valor
ALERTA_GASTO_ALTO=500

# Alerta quando o total de despesas do mês ultrapassar este valor
ALERTA_LIMITE_MENSAL=3000
```

## 🔒 Segurança e Privacidade

- ✅ Todas as mensagens são processadas localmente
- ✅ Banco de dados SQLite local (não há servidor externo)
- ✅ Conexão WhatsApp criptografada (Baileys usa o mesmo protocolo do WhatsApp Web)
- ✅ API da OpenAI usa HTTPS
- ⚠️ **Importante**: Mantenha seu arquivo `.env` seguro e nunca compartilhe sua API Key

## 🐛 Solução de Problemas

### WhatsApp não conecta
- Certifique-se de que o QR Code está sendo exibido corretamente
- Verifique sua conexão com a internet
- Tente deletar a pasta `auth_info_baileys` e reconectar

### Erro na OpenAI
- Verifique se sua API Key está correta no `.env`
- Confirme se você tem créditos disponíveis na sua conta OpenAI
- Verifique se o modelo `gpt-4-turbo-preview` está disponível para sua conta

### Frontend não carrega
- Certifique-se de ter executado `npm run build` na pasta `client`
- Verifique se o backend está rodando na porta 3001
- Limpe o cache do navegador

### Banco de dados
- O arquivo `database.sqlite` é criado automaticamente
- Para resetar o banco, apenas delete o arquivo e reinicie o servidor

## 📝 Estrutura do Projeto

```
agentefinanceiro/
├── server.js                 # Servidor principal
├── services/
│   ├── whatsapp.js          # Integração WhatsApp
│   ├── openai.js            # Processamento OpenAI
│   └── database.js          # Gerenciamento do banco
├── client/                   # Frontend React
│   ├── public/
│   └── src/
│       ├── components/      # Componentes React
│       ├── App.js
│       └── index.js
├── package.json
├── .env                      # Configurações (criar)
└── README.md
```

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas!

## 📄 Licença

ISC License

## 🎉 Pronto para Usar!

Seu agente financeiro está configurado e pronto para uso. Comece enviando suas transações pelo WhatsApp e acompanhe suas finanças no painel!

## 💡 Dicas de Uso

1. **Seja específico**: Quanto mais detalhes você fornecer, melhor será a categorização
2. **Use regularmente**: O agente aprende com seus padrões de uso
3. **Verifique os alertas**: Fique atento aos alertas para manter suas finanças saudáveis
4. **Consulte o resumo**: Peça o resumo periodicamente para acompanhar sua situação

## 📞 Suporte

Se precisar de ajuda:
1. Verifique a seção de Solução de Problemas
2. Revise as configurações do `.env`
3. Certifique-se de que todas as dependências estão instaladas

---

Desenvolvido com ❤️ usando Node.js, React e OpenAI

