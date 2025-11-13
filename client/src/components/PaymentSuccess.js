import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [planUpdated, setPlanUpdated] = useState(false);

  // Obter informações do plano da URL ou localStorage
  const plan = searchParams.get('plan') || localStorage.getItem('payment_plan') || user?.plan || 'premium';

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
    // Atualizar plano do usuário baseado na URL
    const updatePlanFromUrl = async () => {
      console.log('='.repeat(60));
      console.log('🎉 PAYMENT SUCCESS: Iniciando atualização de plano');
      console.log('='.repeat(60));
      console.log('📋 Plan da URL:', plan);
      console.log('👤 Usuário atual:', user?.email, '- Plano:', user?.plan);
      
      // 1. Persistir no localStorage (backup para garantir)
      localStorage.setItem('user_plan', plan);
      localStorage.setItem('user_plan_updated_at', new Date().toISOString());
      console.log('💾 Plano salvo no localStorage:', plan);
      
      // 2. SEMPRE atualizar no backend (não apenas em dev)
      try {
        console.log('📡 Chamando API para confirmar/atualizar plano no backend...');
        
        const response = await axios.post('/api/test/change-plan', { plan: plan });
        
        if (response.data.success) {
          console.log('✅ BACKEND: API confirmou atualização do plano para:', response.data.plan);
        } else {
          console.warn('⚠️ BACKEND: Resposta não indicou sucesso:', response.data);
        }
      } catch (error) {
        console.error('❌ BACKEND: Erro ao chamar API de atualização:', error.message);
        // Continuar mesmo com erro - o localStorage já tem o plano
      }
      
      // 3. Atualizar estado global via refreshUser
      console.log('🔄 UI: Atualizando estado global do usuário...');
      try {
        const updatedUser = await refreshUser();
        
        if (updatedUser) {
          console.log('✅ UI: Estado global atualizado!');
          console.log('   Email:', updatedUser.email);
          console.log('   Plano atual:', updatedUser.plan);
          console.log('   Plano esperado:', plan);
          
          setPlanUpdated(true);
          
          // Verificar se o plano no banco corresponde ao da URL
          if (updatedUser.plan === plan) {
            console.log('✅ SUCESSO COMPLETO: Plano no banco corresponde ao plano pago!');
          } else {
            console.warn('⚠️ DISCREPÂNCIA: Plano no banco diferente do plano pago');
            console.warn('   Plano pago (URL):', plan);
            console.warn('   Plano no banco:', updatedUser.plan);
            console.warn('   Usando localStorage como fallback...');
          }
        } else {
          console.error('❌ UI: refreshUser retornou null');
          setPlanUpdated(false);
        }
      } catch (error) {
        console.error('❌ UI: Erro ao atualizar estado global:', error.message);
        setPlanUpdated(false);
      }
      
      console.log('='.repeat(60));
      console.log('✅ PAYMENT SUCCESS: Processo de atualização concluído');
      console.log('='.repeat(60));
    };
    
    updatePlanFromUrl();
    
    // Limpar localStorage de dados temporários de pagamento
    localStorage.removeItem('payment_plan');
    localStorage.removeItem('payment_amount');

    // Countdown para redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirecionar para home (não reload, usar navigate)
          console.log('🔄 PaymentSuccess: Redirecionando para home...');
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <p className="success-subtitle">
          {planUpdated ? (
            <>
              ✅ Seu plano foi ativado e atualizado com sucesso!
              <br/>
              <strong style={{color: currentPlan.color, fontSize: '1.1em'}}>
                Agora você é {currentPlan.name}
              </strong>
            </>
          ) : (
            <>
              🔄 Atualizando seu plano para {currentPlan.name}...
            </>
          )}
        </p>

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

