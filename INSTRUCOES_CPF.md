# 📋 ADICIONAR CAMPO CPF NO CADASTRO

## ✅ O QUE FOI FEITO NO BACKEND:

1. ✅ Coluna `tax_id` (CPF/CNPJ) adicionada na tabela `users`
2. ✅ Coluna `phone` (telefone) adicionada na tabela `users`
3. ✅ Serviço de autenticação atualizado para aceitar CPF
4. ✅ Validação de CPF implementada
5. ✅ Upgrade exige CPF cadastrado (mais seguro)

---

## 🚀 PASSOS PARA CONCLUIR:

### 1️⃣ **EXECUTAR SQL NO SUPABASE:**

Vá no Supabase SQL Editor e execute:

```sql
-- Adicionar colunas CPF e telefone
ALTER TABLE users 
ADD COLUMN tax_id VARCHAR(20),
ADD COLUMN phone VARCHAR(20);
```

---

### 2️⃣ **ATUALIZAR FRONTEND:**

Você precisa adicionar 2 campos no formulário de registro:

**Arquivo:** `client/src/components/Login.js`

**Adicionar no formulário de registro:**

```jsx
// Adicionar nos estados
const [taxId, setTaxId] = useState('');
const [phone, setPhone] = useState('');

// Adicionar nos campos do formulário
<div className="form-group">
  <label>CPF/CNPJ</label>
  <input
    type="text"
    placeholder="000.000.000-00"
    value={taxId}
    onChange={(e) => setTaxId(formatCPF(e.target.value))}
    maxLength="14"
  />
</div>

<div className="form-group">
  <label>Telefone (opcional)</label>
  <input
    type="tel"
    placeholder="(11) 99999-9999"
    value={phone}
    onChange={(e) => setPhone(formatPhone(e.target.value))}
  />
</div>

// Atualizar chamada da API
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name,
    email,
    password,
    taxId,   // ← NOVO
    phone    // ← NOVO
  })
});
```

---

### 3️⃣ **FUNÇÕES AUXILIARES (Formatação):**

Adicione estas funções no frontend:

```javascript
// Formatar CPF (000.000.000-00)
function formatCPF(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Formatar telefone ((11) 99999-9999)
function formatPhone(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
}
```

---

## 📊 FLUXO ATUALIZADO:

### **ANTES:**
```
Usuário → Registra (nome, email, senha)
         ↓
      Banco (sem CPF)
         ↓
      Upgrade → ❌ Erro (CPF inválido)
```

### **AGORA:**
```
Usuário → Registra (nome, email, senha, CPF, telefone)
         ↓
      Banco (com CPF real)
         ↓
      Upgrade → ✅ QR Code gerado automaticamente!
```

---

## ⚠️ IMPORTANTE:

### **CPF Obrigatório para Upgrade:**

Se usuário tentar fazer upgrade SEM CPF cadastrado, vai receber erro:

```json
{
  "success": false,
  "error": "CPF não cadastrado. Por favor, atualize seu perfil com CPF antes de fazer upgrade.",
  "code": "TAX_ID_REQUIRED"
}
```

**Solução:** Frontend deve mostrar mensagem pedindo para atualizar perfil.

---

## 🔐 VALIDAÇÃO DE CPF:

O backend valida automaticamente:
- ✅ CPF: 11 dígitos
- ✅ CNPJ: 14 dígitos
- ❌ Rejeita formatos inválidos

---

## 🧪 TESTAR:

### **1. Novo Usuário:**
1. Registrar com CPF válido
2. Fazer login
3. Clicar em Upgrade
4. ✅ QR Code deve aparecer

### **2. Usuário Antigo (sem CPF):**
1. Login com usuário antigo
2. Tentar Upgrade
3. ❌ Erro: "CPF não cadastrado"
4. Implementar tela de atualização de perfil

---

## 📝 PRÓXIMOS PASSOS (OPCIONAL):

1. **Tela de Perfil:**
   - Permitir usuário atualizar CPF depois
   - Rota: `PUT /api/users/profile`

2. **Validação Avançada:**
   - Validar dígitos verificadores do CPF
   - Biblioteca: `cpf-cnpj-validator`

3. **Máscara de Input:**
   - Usar biblioteca `react-input-mask`
   - Formatação automática

---

## ✅ RESULTADO FINAL:

- ✅ CPF coletado no cadastro
- ✅ Dados reais no AbacatePay
- ✅ Upgrade funciona perfeitamente
- ✅ Mais profissional e seguro
- ✅ Melhor experiência do usuário

---

**Backend está PRONTO! Só falta atualizar o formulário de registro no frontend!** 🚀

