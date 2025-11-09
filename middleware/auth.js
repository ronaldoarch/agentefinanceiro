const authService = require('../services/auth');
const db = require('../services/database');

// Middleware para verificar autenticação
function requireAuth(req, res, next) {
  try {
    // Pegar token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar token
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }

    // Buscar usuário
    const user = db.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        error: 'Usuário desativado',
        code: 'USER_INACTIVE'
      });
    }

    // Adicionar usuário ao request (sem senha)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({
      error: 'Erro na autenticação',
      code: 'AUTH_ERROR'
    });
  }
}

// Middleware para verificar se é admin
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Autenticação necessária',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores.',
      code: 'ADMIN_ONLY'
    });
  }

  next();
}

// Middleware opcional (não bloqueia se não tiver token)
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      
      if (decoded) {
        const user = db.getUserById(decoded.id);
        if (user && user.active) {
          const { password, ...userWithoutPassword } = user;
          req.user = userWithoutPassword;
        }
      }
    }
  } catch (error) {
    // Silenciosamente ignora erros para auth opcional
  }
  
  next();
}

// Middleware para verificar limites do plano
function checkPlanLimit(feature) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticação necessária',
        code: 'AUTH_REQUIRED'
      });
    }

    const plan = req.user.plan || 'free';
    
    // Definir limites
    const limits = {
      free: {
        chat_enabled: true,
        audio_enabled: false,
        whatsapp_enabled: false,
        transactions_limit: 100,
        chat_limit: 20
      },
      premium: {
        chat_enabled: true,
        audio_enabled: true,
        whatsapp_enabled: true,
        transactions_limit: 1000,
        chat_limit: 200
      },
      enterprise: {
        chat_enabled: true,
        audio_enabled: true,
        whatsapp_enabled: true,
        transactions_limit: -1, // ilimitado
        chat_limit: -1
      }
    };

    const userLimits = limits[plan] || limits.free;

    // Verificar se o recurso está disponível
    if (feature && userLimits[feature] === false) {
      return res.status(403).json({
        error: `Recurso não disponível no plano ${plan}`,
        code: 'PLAN_LIMIT',
        upgrade_required: true,
        current_plan: plan,
        feature: feature
      });
    }

    // Adicionar limites ao request
    req.planLimits = userLimits;
    
    next();
  };
}

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth,
  checkPlanLimit
};

