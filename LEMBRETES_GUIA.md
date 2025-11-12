# 📅 SISTEMA DE LEMBRETES FINANCEIROS

## 🎯 IMPLEMENTAÇÃO COMPLETA

### ✅ O QUE FOI IMPLEMENTADO:

1. **✅ Tabela no Supabase** (`lembretes`)
2. **✅ Backend API completo** (CRUD de lembretes)
3. **✅ Interface React** (componente visual completo)
4. **✅ Notificações WhatsApp** (automáticas)
5. **✅ Scheduler automático** (verifica a cada 30 minutos)
6. **✅ Sistema de recorrência** (diário, semanal, mensal, anual)

---

## 📋 PASSO A PASSO PARA CONFIGURAR

### 1️⃣ CRIAR TABELA NO SUPABASE

No **Supabase Dashboard** > **SQL Editor** > **New Query**:

```sql
-- Execute o arquivo: CREATE_LEMBRETES_TABLE.sql
```

Ou copie e execute o SQL completo do arquivo `CREATE_LEMBRETES_TABLE.sql`.

### 2️⃣ FAZER DEPLOY DO BACKEND

```bash
# As alterações já estão no código:
# - services/database-supabase.js (funções de lembretes)
# - services/lembretes-scheduler.js (scheduler automático)
# - server.js (rotas da API + inicialização do scheduler)

# Commit e push
git add .
git commit -m "feat: sistema completo de lembretes financeiros com notificações"
git push

# Redeploy no Coolify
```

### 3️⃣ FAZER DEPLOY DO FRONTEND

```bash
cd client
npm install  # caso precise
npm run build

# Commit e push
cd ..
git add client/build
git commit -m "build: frontend com sistema de lembretes"
git push

# Redeploy no Coolify
```

---

## 🚀 FUNCIONALIDADES

### ✅ Para o Usuário:

1. **Criar Lembretes**
   - Título e descrição
   - Valor (opcional)
   - Categoria (contas, aluguel, impostos, etc)
   - Data e hora de vencimento
   - Recorrência (único, diário, semanal, mensal, anual)
   - Notificação via WhatsApp (ativar/desativar)
   - Dias de antecedência para notificar

2. **Visualizar Lembretes**
   - Filtrar por status (todos, pendentes, concluídos, atrasados)
   - Ver cards coloridos com informações completas
   - Status visual (pendente, urgente, atrasado, concluído)
   - Contagem regressiva de dias

3. **Gerenciar Lembretes**
   - Marcar como concluído
   - Deletar lembrete
   - Ver todos os detalhes

4. **Notificações Automáticas**
   - Via WhatsApp no telefone cadastrado
   - Enviadas automaticamente conforme configuração
   - Mensagens personalizadas com todos os detalhes

---

## 📱 NOTIFICAÇÕES VIA WHATSAPP

### Como Funciona:

1. **Scheduler Automático**
   - Verifica lembretes a cada 30 minutos
   - Identifica lembretes que precisam de notificação
   - Envia mensagem via WhatsApp

2. **Tipos de Notificação**
   - ⚠️ **Atrasado**: Quando passou da data de vencimento
   - 🔔 **Hoje**: Quando vence no dia atual
   - 📅 **Antecedência**: X dias antes do vencimento

3. **Exemplo de Mensagem**:
```
🔔 LEMBRETE FINANCEIRO

📋 Pagar Conta de Luz

💰 Valor: R$ 150.00
📁 Categoria: contas
📅 Vencimento: 15/11/2025 09:00

📅 Vence em 3 dia(s)
```

### Configurações:

- **Telefone**: Usuário deve ter telefone cadastrado
- **WhatsApp**: Deve estar conectado no sistema
- **Ativar**: Checkbox no formulário do lembrete

---

## 🔧 CONFIGURAÇÕES DO SCHEDULER

### No arquivo `server.js`:

```javascript
// Inicia o scheduler verificando a cada 30 minutos
lembretesScheduler.start(30);
```

Para mudar o intervalo:
```javascript
// Verificar a cada 15 minutos
lembretesScheduler.start(15);

// Verificar a cada 1 hora
lembretesScheduler.start(60);
```

### Comandos do Scheduler:

```javascript
// Parar o scheduler
lembretesScheduler.stop();

// Iniciar o scheduler
lembretesScheduler.start(30);

// Ver status
lembretesScheduler.getStatus();
```

---

## 📊 CATEGORIAS DISPONÍVEIS

1. 💸 **Contas** - Contas de consumo (luz, água, internet)
2. 🏠 **Aluguel** - Pagamento de aluguel
3. 📝 **Impostos** - IPTU, IPVA, IR, etc
4. 📱 **Assinaturas** - Netflix, Spotify, etc
5. 💳 **Parcelas** - Compras parceladas
6. 📈 **Investimentos** - Aportes, resgates
7. 📌 **Outros** - Diversos

---

## 🔄 RECORRÊNCIA

### Tipos:

- **Único**: Lembrete acontece apenas uma vez
- **Diário**: Repete todos os dias
- **Semanal**: Repete toda semana
- **Mensal**: Repete todo mês
- **Anual**: Repete todo ano

### Como Funciona:

1. Usuário cria lembrete recorrente
2. Quando marca como concluído
3. Sistema cria automaticamente o próximo lembrete
4. Com a mesma configuração
5. Na próxima data calculada

---

## 🎨 INTERFACE

### Design:

- ✅ Cards coloridos e modernos
- ✅ Badges de status visual
- ✅ Filtros intuitivos
- ✅ Formulário completo
- ✅ Animações suaves
- ✅ Responsivo (mobile e desktop)

### Cores por Status:

- 🟦 **Pendente**: Azul claro
- 🟩 **Concluído**: Verde
- 🟥 **Atrasado**: Vermelho
- 🟧 **Urgente**: Laranja (animação pulsante)
- ⬜ **Cancelado**: Cinza

---

## 🔒 SEGURANÇA

- ✅ Todas as rotas protegidas com autenticação
- ✅ Usuário só vê seus próprios lembretes
- ✅ Não há acesso cruzado entre usuários
- ✅ Dados isolados por `user_id`

---

## 📝 ROTAS DA API

### Criar Lembrete
```http
POST /api/lembretes
Authorization: Bearer {token}

{
  "titulo": "Pagar Internet",
  "descricao": "Vencimento da Vivo Fibra",
  "valor": 99.90,
  "categoria": "contas",
  "dataVencimento": "2025-11-20T09:00:00",
  "recorrencia": "mensal",
  "notificarWhatsApp": true,
  "diasAntecedencia": 3
}
```

### Listar Lembretes
```http
GET /api/lembretes
Authorization: Bearer {token}

# Com filtro
GET /api/lembretes?status=pendente
```

### Obter Lembrete Específico
```http
GET /api/lembretes/:id
Authorization: Bearer {token}
```

### Atualizar Lembrete
```http
PUT /api/lembretes/:id
Authorization: Bearer {token}

{
  "titulo": "Novo título",
  "valor": 150.00
}
```

### Marcar como Concluído
```http
PUT /api/lembretes/:id/concluir
Authorization: Bearer {token}
```

### Deletar Lembrete
```http
DELETE /api/lembretes/:id
Authorization: Bearer {token}
```

### Obter Lembretes Vencidos
```http
GET /api/lembretes/vencidos
Authorization: Bearer {token}
```

---

## 🧪 COMO TESTAR

### 1. Criar Lembrete de Teste

1. Login no sistema
2. Ir em **📅 Lembretes**
3. Clicar em **➕ Novo Lembrete**
4. Preencher:
   - Título: "Teste de Lembrete"
   - Valor: 50.00
   - Categoria: "Outros"
   - Vencimento: (data/hora daqui 1 hora)
   - Recorrência: "Único"
   - Notificar WhatsApp: ✅
   - Antecedência: 0 dias
5. Salvar

### 2. Verificar Notificação

- Aguardar até 30 minutos (próxima execução do scheduler)
- Ou: Reiniciar o servidor (scheduler executa imediatamente)
- Verificar WhatsApp cadastrado

### 3. Testar Funcionalidades

- ✅ Criar lembrete
- ✅ Listar lembretes
- ✅ Filtrar por status
- ✅ Marcar como concluído
- ✅ Deletar lembrete
- ✅ Receber notificação WhatsApp

---

## 🐛 TROUBLESHOOTING

### Notificações não estão sendo enviadas:

1. Verificar se WhatsApp está conectado
2. Verificar se usuário tem telefone cadastrado
3. Verificar logs do servidor: `🔍 Verificando lembretes pendentes...`
4. Verificar se o scheduler está rodando: `✅ Scheduler de lembretes iniciado!`

### Lembretes não aparecem:

1. Verificar token de autenticação
2. Verificar `user_id` no banco
3. Consultar diretamente no Supabase:
```sql
SELECT * FROM lembretes WHERE user_id = 1;
```

### Tabela não existe:

1. Executar o SQL em `CREATE_LEMBRETES_TABLE.sql` no Supabase
2. Verificar se RLS está desabilitado
3. Reiniciar o servidor

---

## 📈 PRÓXIMAS MELHORIAS (OPCIONAL)

1. ✨ **Notificações por Email**
2. ✨ **Dashboard de lembretes** (gráficos)
3. ✨ **Integração com calendário** (Google Calendar)
4. ✨ **Lembretes por voz** (via IA)
5. ✨ **Templates de lembretes** (pré-configurados)
6. ✨ **Histórico de lembretes concluídos**
7. ✨ **Estatísticas** (quantos atrasados, quantos concluídos)

---

## 🎉 SISTEMA COMPLETO E FUNCIONAL!

### Recursos Implementados:

✅ **Backend completo** (API REST)  
✅ **Frontend completo** (React UI)  
✅ **Banco de dados** (Supabase PostgreSQL)  
✅ **Notificações** (WhatsApp automático)  
✅ **Scheduler** (verificação periódica)  
✅ **Recorrência** (lembretes repetitivos)  
✅ **Multi-tenant** (isolamento por usuário)  
✅ **Segurança** (autenticação JWT)  

---

## 📞 SUPORTE

Se tiver dúvidas ou problemas:
1. Verificar logs do servidor
2. Consultar banco de dados Supabase
3. Revisar este guia
4. Verificar console do navegador (erros frontend)

---

**Desenvolvido com 💜 para o Agente Financeiro**

