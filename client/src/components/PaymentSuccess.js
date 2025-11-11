import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(5);

  // Obter informações do plano da URL ou localStorage
  const plan = searchParams.get('plan') || localStorage.getItem('payment_plan') || user?.plan || 'premium';
  const amount = searchParams.get('amount') || localStorage.getItem('payment_amount') || '39.90';

  const plans = {
    basico: {
      name: '💰 Básico',
      price: 15.00,
      color: '#4caf50',
      features: [
        '100 transações/mês',
        '30 mensagens IA/dia',
        'Dashboard completo',
        'Alertas inteligentes'
      ]
    },
    premium: {
      name: '⭐ Premium',
      price: 39.90,
      color: '#667eea',
      features: [
        '1.000 transações/mês',
        '200 mensagens IA/dia',
        'WhatsApp integrado',
        'Transcrição de áudio',
        'Análises avançadas'
      ]
    },
    enterprise: {
      name: '🏢 Enterprise',
      price: 99.90,
      color: '#764ba2',
      features: [
        'Transações ilimitadas',
        'Mensagens IA ilimitadas',
        'Todos recursos Premium',
        'API personalizada',
        'Suporte 24/7'
      ]
    }
  };

  const currentPlan = plans[plan] || plans.premium;

  useEffect(() => {
    // Limpar localStorage
    localStorage.removeItem('payment_plan');
    localStorage.removeItem('payment_amount');

    // Countdown para redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="payment-success-container">
      <div className="success-content">
        <div className="success-animation">
          <div className="checkmark-circle">
            <div className="checkmark"></div>
          </div>
        </div>

        <h1 className="success-title">🎉 Pagamento Confirmado!</h1>
        <p className="success-subtitle">Seu plano foi ativado com sucesso</p>

        <div className="plan-activated" style={{ borderColor: currentPlan.color }}>
          <div className="plan-badge" style={{ background: currentPlan.color }}>
            Plano Ativado
          </div>
          <h2 className="plan-name">{currentPlan.name}</h2>
          <div className="plan-price">R$ {currentPlan.price.toFixed(2)}/mês</div>
          
          <div className="plan-features-success">
            {currentPlan.features.map((feature, idx) => (
              <div key={idx} className="feature-item-success">
                <span className="feature-check">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="success-info">
          <div className="info-item">
            <span className="info-icon">📧</span>
            <div className="info-text">
              <strong>Confirmação enviada</strong>
              <p>Verifique seu email para mais detalhes</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📅</span>
            <div className="info-text">
              <strong>Assinatura ativa</strong>
              <p>Válida por 30 dias a partir de hoje</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">💳</span>
            <div className="info-text">
              <strong>Renovação automática</strong>
              <p>Você será notificado antes da renovação</p>
            </div>
          </div>
        </div>

        <div className="success-actions">
          <button 
            className="btn-primary-success" 
            onClick={() => navigate('/')}
          >
            🚀 Ir para o Dashboard
          </button>
          <p className="redirect-info">
            Redirecionando automaticamente em {countdown}s...
          </p>
        </div>

        <div className="success-footer">
          <p>💰 Obrigado por escolher o Agente Financeiro!</p>
          <p>Se tiver alguma dúvida, entre em contato com nosso suporte.</p>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;

