# 🚀 Roadmap: Transformação em SaaS Multi-Tenant

## 📋 Visão Geral

Transformar o Agente Financeiro em um **SaaS completo** com:
- ✅ Sistema de login/registro
- ✅ Multi-tenant (cada usuário vê só seus dados)
- ✅ Painel de administrador
- ✅ Dashboard admin com estatísticas
- ✅ Gerenciamento de usuários
- ✅ Planos (Free, Premium, Enterprise)

---

## ✅ Progresso Atual

### Etapa 1: Banco de Dados ✅ COMPLETO

**Tabelas Criadas:**
- ✅ `users` - Usuários do sistema
- ✅ `transacoes` - Atualizada com `user_id`
- ✅ `alertas` - Atualizada com `user_id`
- ✅ `chat_messages` - Atualizada com `user_id`

**Funções do Banco:**
- ✅ `createUser()` - Criar novo usuário
- ✅ `getUserByEmail()` - Buscar por email
- ✅ `getUserById()` - Buscar por ID
- ✅ `updateLastLogin()` - Atualizar último login
- ✅ `getAllUsers()` - Listar usuários (admin)
- ✅ `updateUserPlan()` - Atualizar plano
- ✅ `toggleUserActive()` - Ativar/Desativar
- ✅ `getAdminStats()` - Estatísticas para admin

**Dependências Adicionadas:**
- ✅ `bcryptjs` - Hash de senhas
- ✅ `jsonwebtoken` - JWT para autenticação
- ✅ `express-session` - Gerenciamento de sessões
- ✅ `cookie-parser` - Parse de cookies

---

## 🔄 Próximas Etapas

### Etapa 2: Sistema de Autenticação (Backend)

**Arquivos a criar:**
- [ ] `services/auth.js` - Serviço de autenticação
- [ ] `middleware/auth.js` - Middleware de verificação

**Funcionalidades:**
```javascript
// services/auth.js
- hashPassword(password)
- comparePassword(password, hash)
- generateToken(userId)
- verifyToken(token)
- createAdminUser() // Criar admin padrão

// middleware/auth.js
- requireAuth // Middleware para rotas protegidas
- requireAdmin // Middleware apenas para admin
```

**Rotas de Autenticação:**
```javascript
// server.js
POST /api/auth/register  // Registrar novo usuário
POST /api/auth/login     // Login
POST /api/auth/logout    // Logout
GET  /api/auth/me        // Dados do usuário atual
POST /api/auth/refresh   // Refresh token
```

---

### Etapa 3: Atualizar Rotas Existentes

**Todas as rotas precisam:**
1. Adicionar middleware `requireAuth`
2. Pegar `userId` do token
3. Filtrar dados por `userId`

**Exemplo:**
```javascript
// ANTES
app.get('/api/transacoes', (req, res) => {
  const transacoes = db.getTransacoes();
  res.json(transacoes);
});

// DEPOIS
app.get('/api/transacoes', requireAuth, (req, res) => {
  const userId = req.user.id;
  const transacoes = db.getTransacoes(userId);
  res.json(transacoes);
});
```

**Rotas a atualizar:**
- [ ] `/api/transacoes`
- [ ] `/api/transacoes/periodo`
- [ ] `/api/resumo`
- [ ] `/api/alertas`
- [ ] `/api/chat`
- [ ] `/api/chat/audio`
- [ ] `/api/chat/history`

---

### Etapa 4: Painel de Administrador (Backend)

**Rotas Admin:**
```javascript
// Estatísticas
GET /api/admin/stats
{
  "total_users": 150,
  "active_users": 145,
  "free_users": 120,
  "premium_users": 25,
  "enterprise_users": 5
}

// Listar usuários
GET /api/admin/users
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "João Silva",
    "plan": "free",
    "active": true,
    "created_at": "2025-11-01",
    "last_login": "2025-11-09"
  }
]

// Atualizar plano
PUT /api/admin/users/:id/plan
{ "plan": "premium" }

// Ativar/Desativar
PUT /api/admin/users/:id/toggle-active

// Deletar usuário
DELETE /api/admin/users/:id
```

---

### Etapa 5: Frontend - Tela de Login/Registro

**Componentes a criar:**
```
client/src/
├── components/
│   ├── Login.js          // Tela de login
│   ├── Login.css
│   ├── Register.js       // Tela de registro
│   ├── Register.css
│   └── PrivateRoute.js   // Proteção de rotas
├── context/
│   └── AuthContext.js    // Context API para auth
└── utils/
    └── api.js            // Axios com interceptors
```

**Login.js - Estrutura:**
```jsx
- Email input
- Password input
- "Lembrar-me" checkbox
- Botão "Entrar"
- Link "Criar conta"
- Link "Esqueci senha"
```

**Register.js - Estrutura:**
```jsx
- Nome input
- Email input
- Password input
- Confirm password input
- Termos e condições checkbox
- Botão "Criar conta"
- Link "Já tem conta? Login"
```

---

### Etapa 6: Frontend - Painel Admin

**Componentes a criar:**
```
client/src/components/admin/
├── AdminDashboard.js     // Dashboard principal
├── AdminDashboard.css
├── UserList.js           // Lista de usuários
├── UserList.css
├── UserStats.js          // Estatísticas
├── UserStats.css
└── UserModal.js          // Modal para editar
```

**AdminDashboard.js - Estrutura:**
```jsx
<div className="admin-dashboard">
  {/* Estatísticas */}
  <div className="stats-grid">
    <Card title="Total Usuários" value={stats.total} />
    <Card title="Usuários Ativos" value={stats.active} />
    <Card title="Plano Free" value={stats.free} />
    <Card title="Plano Premium" value={stats.premium} />
  </div>

  {/* Gráficos */}
  <div className="charts">
    <LineChart data={growthData} />
    <PieChart data={planDistribution} />
  </div>

  {/* Lista de Usuários */}
  <UserList users={users} onEdit={handleEdit} />
</div>
```

---

### Etapa 7: Planos e Limites

**Definir Limites por Plano:**
```javascript
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      transactions_per_month: 100,
      chat_messages_per_day: 20,
      whatsapp_enabled: false,
      audio_transcription: false
    }
  },
  premium: {
    name: 'Premium',
    price: 29.90,
    limits: {
      transactions_per_month: 1000,
      chat_messages_per_day: 200,
      whatsapp_enabled: true,
      audio_transcription: true
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 99.90,
    limits: {
      transactions_per_month: -1, // ilimitado
      chat_messages_per_day: -1,
      whatsapp_enabled: true,
      audio_transcription: true,
      priority_support: true
    }
  }
};
```

**Middleware de Verificação:**
```javascript
function checkPlanLimits(feature) {
  return async (req, res, next) => {
    const user = req.user;
    const plan = PLANS[user.plan];
    
    // Verificar limite da feature
    if (!plan.limits[feature]) {
      return res.status(403).json({
        error: 'Recurso não disponível no seu plano',
        upgrade_required: true
      });
    }
    
    next();
  };
}
```

---

### Etapa 8: Página de Preços

**Componente:**
```
client/src/components/
├── Pricing.js
└── Pricing.css
```

**Estrutura:**
```jsx
<div className="pricing">
  <h1>Escolha seu Plano</h1>
  
  <div className="plans-grid">
    <PlanCard 
      name="Free"
      price="R$ 0"
      features={[
        "100 transações/mês",
        "20 mensagens IA/dia",
        "Suporte por email"
      ]}
    />
    
    <PlanCard 
      name="Premium"
      price="R$ 29,90"
      features={[
        "1000 transações/mês",
        "200 mensagens IA/dia",
        "WhatsApp integrado",
        "Transcrição de áudio",
        "Suporte prioritário"
      ]}
      popular={true}
    />
    
    <PlanCard 
      name="Enterprise"
      price="R$ 99,90"
      features={[
        "Transações ilimitadas",
        "Mensagens IA ilimitadas",
        "WhatsApp integrado",
        "Transcrição de áudio",
        "Suporte 24/7",
        "API personalizada"
      ]}
    />
  </div>
</div>
```

---

## 📊 Estrutura Final do Sistema

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
├─────────────────────────────────────────┤
│  Login/Register                         │
│  ├─ Email + Password                    │
│  └─ JWT Token Storage                   │
│                                         │
│  User Dashboard                         │
│  ├─ Transações (filtered by user_id)   │
│  ├─ Alertas (filtered by user_id)      │
│  ├─ Chat IA (filtered by user_id)      │
│  └─ WhatsApp (filtered by user_id)     │
│                                         │
│  Admin Panel (role=admin only)          │
│  ├─ User Stats                          │
│  ├─ User Management                     │
│  └─ Plan Management                     │
└─────────────────────────────────────────┘
              ↕ JWT Token
┌─────────────────────────────────────────┐
│         Backend (Express)               │
├─────────────────────────────────────────┤
│  Auth Middleware                        │
│  ├─ Verify JWT                          │
│  ├─ Extract user_id                     │
│  └─ Check permissions                   │
│                                         │
│  Routes                                 │
│  ├─ /api/auth/* (public)                │
│  ├─ /api/* (requireAuth)                │
│  └─ /api/admin/* (requireAdmin)         │
└─────────────────────────────────────────┘
              ↕
┌─────────────────────────────────────────┐
│         Database (SQLite)               │
├─────────────────────────────────────────┤
│  users                                  │
│  ├─ id, email, password, role, plan     │
│  └─ active, created_at, last_login      │
│                                         │
│  transacoes (user_id FK)                │
│  alertas (user_id FK)                   │
│  chat_messages (user_id FK)             │
│  categorias                             │
└─────────────────────────────────────────┘
```

---

## 🔐 Fluxo de Autenticação

```
1. Registro
   Usuario → /api/auth/register
   ├─ Valida dados
   ├─ Hash password (bcrypt)
   ├─ Cria user no banco
   └─ Retorna JWT token

2. Login
   Usuario → /api/auth/login
   ├─ Busca user por email
   ├─ Compara password
   ├─ Gera JWT token
   ├─ Atualiza last_login
   └─ Retorna token + user data

3. Requisição Protegida
   Usuario → /api/transacoes (com token no header)
   ├─ Middleware verifica token
   ├─ Extrai user_id
   ├─ Busca transações WHERE user_id = ?
   └─ Retorna dados do usuário
```

---

## 💰 Modelo de Negócio Sugerido

### Planos

| Recurso | Free | Premium | Enterprise |
|---------|------|---------|------------|
| **Preço** | R$ 0 | R$ 29,90 | R$ 99,90 |
| Transações/mês | 100 | 1.000 | ∞ |
| Chat IA/dia | 20 | 200 | ∞ |
| WhatsApp | ❌ | ✅ | ✅ |
| Áudio → Texto | ❌ | ✅ | ✅ |
| Usuários | 1 | 1 | 5 |
| Suporte | Email | Prioritário | 24/7 |

### Receita Estimada (100 usuários)

```
70 usuários Free:     R$ 0
25 usuários Premium:  R$ 747,50
5 usuários Enterprise: R$ 499,50
─────────────────────────────────
Total/mês:            R$ 1.247,00
```

---

## ⏱️ Tempo de Implementação Estimado

| Etapa | Tempo | Complexidade |
|-------|-------|--------------|
| 1. Banco de Dados | ✅ Feito | Médio |
| 2. Auth Backend | 4h | Médio |
| 3. Atualizar Rotas | 3h | Baixo |
| 4. Admin Backend | 2h | Baixo |
| 5. Frontend Login | 4h | Médio |
| 6. Frontend Admin | 6h | Alto |
| 7. Planos e Limites | 3h | Médio |
| 8. Página Preços | 2h | Baixo |
| **TOTAL** | **~24h** | - |

---

## 🚀 Próximos Passos

**Opção 1: Implementação Completa**
- Continuar implementando todas as etapas
- Tempo estimado: 2-3 dias
- Resultado: SaaS completo e funcional

**Opção 2: MVP Rápido**
- Implementar apenas login/registro
- Multi-tenant básico
- Admin simplificado
- Tempo estimado: 1 dia

**Opção 3: Por Etapas**
- Implementar e testar etapa por etapa
- Fazer deploy incremental
- Validar cada funcionalidade

---

## 📝 Checklist de Implementação

### Backend
- [x] Tabela users
- [x] Funções de usuário no database.js
- [x] Dependências (bcrypt, jwt, express-session)
- [ ] services/auth.js
- [ ] middleware/auth.js
- [ ] Rotas de autenticação
- [ ] Atualizar todas as rotas existentes
- [ ] Rotas admin
- [ ] Sistema de limites por plano

### Frontend
- [ ] AuthContext
- [ ] Login component
- [ ] Register component
- [ ] PrivateRoute
- [ ] Atualizar Header com user info
- [ ] Admin Dashboard
- [ ] User Management
- [ ] Pricing Page

### Deploy
- [ ] Variáveis de ambiente (JWT_SECRET)
- [ ] Criar usuário admin inicial
- [ ] Testar autenticação
- [ ] Testar multi-tenant
- [ ] Testar admin panel

---

## 🎯 Resultado Final

Após implementação completa, você terá:

✅ **Sistema SaaS Completo**
- Login/Registro
- Multi-tenant seguro
- Painel admin profissional
- 3 planos de pagamento
- Limites por plano
- Gestão de usuários

✅ **Pronto para Vender**
- Landing page com preços
- Checkout integrado
- Dashboard por usuário
- Admin para gerenciar tudo

✅ **Escalável**
- Arquitetura multi-tenant
- Fácil adicionar recursos
- Pronto para crescer

---

**Quer que eu continue implementando? Escolha uma opção acima!** 🚀

