import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { login, register } = useAuth();
  
  // Formatar CPF (000.000.000-00)
  function formatCPF(value) {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  }
  
  // Formatar telefone ((11) 99999-9999)
  function formatPhone(value) {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validar CPF
    const cpfLimpo = taxId.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setError('CPF inválido. Digite os 11 dígitos.');
      setLoading(false);
      return;
    }

    const result = await register(email, password, name, taxId, phone);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>💰 Agente Financeiro</h1>
          <p>Seu assistente financeiro inteligente</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {!showRegister ? (
          // Formulário de Login
          <form onSubmit={handleLogin} className="login-form">
            <h2>Entrar</h2>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Entrando...' : '🚀 Entrar'}
            </button>

            <div className="form-footer">
              <p>
                Não tem conta?{' '}
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setShowRegister(true)}
                  disabled={loading}
                >
                  Criar conta
                </button>
              </p>
            </div>
          </form>
        ) : (
          // Formulário de Registro
          <form onSubmit={handleRegister} className="login-form">
            <h2>Criar Conta</h2>
            
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>CPF <span className="required">*</span></label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                required
                disabled={loading}
              />
              <small className="field-help">Necessário para pagamentos via PIX</small>
            </div>
            
            <div className="form-group">
              <label>Telefone <span className="optional">(opcional)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength="6"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Criando...' : '✨ Criar Conta'}
            </button>

            <div className="form-footer">
              <p>
                Já tem conta?{' '}
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setShowRegister(false)}
                  disabled={loading}
                >
                  Fazer login
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="login-info">
          <h3>💰 Plano Básico - R$ 15,00/mês</h3>
          <ul>
            <li>✅ 100 transações por mês</li>
            <li>✅ Chat com IA (30 mensagens/dia)</li>
            <li>✅ Dashboard financeiro completo</li>
            <li>✅ Alertas inteligentes</li>
          </ul>
          <p className="trial-info">🎁 7 dias de teste grátis!</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

