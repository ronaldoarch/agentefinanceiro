const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database-supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-aqui-mude-em-producao';
const JWT_EXPIRES_IN = '7d';

// Hash de senha
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Comparar senha
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Gerar JWT token
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verificar token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Registrar novo usuário
async function register(email, password, name, taxId = null, phone = null) {
  try {
    // Verificar se email já existe
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Validar dados
    if (!email || !password || !name) {
      throw new Error('Todos os campos são obrigatórios');
    }

    if (password.length < 6) {
      throw new Error('Senha deve ter no mínimo 6 caracteres');
    }

    // Validar CPF se fornecido
    if (taxId) {
      const cpfLimpo = taxId.replace(/\D/g, '');
      if (cpfLimpo.length !== 11 && cpfLimpo.length !== 14) {
        throw new Error('CPF/CNPJ inválido');
      }
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar usuário
    const userId = await db.createUser(email, hashedPassword, name, 'user', 'basico', taxId, phone);

    // Buscar usuário criado
    const user = await db.getUserById(userId);

    // Gerar token
    const token = generateToken(user);

    // Retornar sem a senha
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
}

// Login
async function login(email, password) {
  try {
    // Buscar usuário
    const user = await db.getUserByEmail(email);
    
    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar se está ativo
    if (!user.active) {
      throw new Error('Usuário desativado. Entre em contato com o suporte.');
    }

    // Comparar senha
    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Email ou senha inválidos');
    }

    // Atualizar último login
    await db.updateLastLogin(user.id);

    // Gerar token
    const token = generateToken(user);

    // Retornar sem a senha
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// Criar usuário admin (para inicialização)
async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@agentefinanceiro.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Verificar se admin já existe
    const existingAdmin = await db.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log('👤 Usuário admin já existe');
      return existingAdmin;
    }

    // Hash da senha
    const hashedPassword = await hashPassword(adminPassword);

    // Criar admin
    const adminId = await db.createUser(
      adminEmail,
      hashedPassword,
      'Administrador',
      'admin',
      'enterprise'
    );

    console.log('👤 Usuário admin criado:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log('   ⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

    return await db.getUserById(adminId);
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    throw error;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  register,
  login,
  createAdminUser
};

