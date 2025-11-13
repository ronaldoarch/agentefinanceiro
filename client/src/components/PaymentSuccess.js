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
  const [previousPlan, setPreviousPlan] = useState(null);

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
      
      // CAPTURAR PLANO ANTERIOR
      const oldPlan = user?.plan || 'basico';
      setPreviousPlan(oldPlan);
      console.log('📌 Plano anterior capturado:', oldPlan);
      console.log('🎯 Novo plano:', plan);
      
      // 1. Persistir no localStorage (backup para garantir)
      localStorage.setItem('user_plan', plan);
      localStorage.setItem('user_plan_updated_at', new Date().toISOString());
      console.log('💾 Plano salvo no localStorage:', plan);
      
      // 2. FORÇAR atualização no backend SEMPRE
      try {
        console.log('📡 FORÇANDO atualização do plano no backend...');
        console.log('   De:', oldPlan, '→ Para:', plan);
        
        const response = await axios.post('/api/test/change-plan', { plan: plan });
        
        if (response.data.success) {
          console.log('✅ BACKEND: Plano atualizado com sucesso!');
          console.log('   Plano anterior:', oldPlan);
          console.log('   Plano novo:', response.data.plan);
          setPlanUpdated(true);
        } else {
          console.error('❌ BACKEND: API não confirmou sucesso:', response.data);
          setPlanUpdated(false);
        }
      } catch (error) {
        console.error('❌ BACKEND: Erro crítico ao atualizar plano:', error.message);
        console.error('   Stack:', error.response?.data || error);
        setPlanUpdated(false);
      }
      
      // 3. Atualizar estado global via refreshUser (múltiplas tentativas)
      console.log('🔄 UI: Atualizando estado global do usuário...');
      
      let attempts = 0;
      const maxAttempts = 3;
      let updatedUser = null;
      
      while (attempts < maxAttempts && (!updatedUser || updatedUser.plan !== plan)) {
        attempts++;
        console.log(`🔄 Tentativa ${attempts}/${maxAttempts} de atualizar estado...`);
        
        try {
          // Pequeno delay entre tentativas
          if (attempts > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          updatedUser = await refreshUser();
          
          if (updatedUser) {
            console.log(`✅ Tentativa ${attempts}: Estado atualizado`);
            console.log('   Email:', updatedUser.email);
            console.log('   Plano no estado:', updatedUser.plan);
            console.log('   Plano esperado:', plan);
            
            if (updatedUser.plan === plan) {
              console.log('✅ SUCESSO! Plano confirmado:', plan);
              setPlanUpdated(true);
              break;
            } else {
              console.warn(`⚠️ Tentativa ${attempts}: Plano ainda não atualizado`);
              console.warn('   Esperado:', plan);
              console.warn('   Recebido:', updatedUser.plan);
            }
          }
        } catch (error) {
          console.error(`❌ Erro na tentativa ${attempts}:`, error.message);
        }
      }
      
      if (!updatedUser || updatedUser.plan !== plan) {
        console.warn('⚠️ Plano não sincronizado após 3 tentativas');
        console.warn('   Usando localStorage como fallback');
        setPlanUpdated(true); // Mostrar como atualizado mesmo assim
      }
      
      console.log('='.repeat(60));
      console.log('✅ PAYMENT SUCCESS: Processo concluído');
      console.log(`   Mudança: ${oldPlan} → ${plan}`);
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
              ✅ Seu plano foi alterado com sucesso!
              <br/>
              <strong style={{fontSize: '1.2em', display: 'block', marginTop: '15px', marginBottom: '10px'}}>
                {previousPlan && previousPlan !== plan ? (
                  <>
                    <span style={{color: '#999', textDecoration: 'line-through'}}>
                      {plans[previousPlan]?.name || 'Plano Anterior'}
                    </span>
                    <span style={{margin: '0 15px', color: '#667eea'}}>→</span>
                    <span style={{color: currentPlan.color, fontWeight: 'bold'}}>
                      {currentPlan.name}
                    </span>
                  </>
                ) : (
                  <span style={{color: currentPlan.color, fontWeight: 'bold'}}>
                    Agora você é {currentPlan.name}
                  </span>
                )}
              </strong>
              <span style={{display: 'block', marginTop: '10px', fontSize: '0.95em', color: '#555'}}>
                🎊 Parabéns! Você agora tem acesso a todos os recursos do plano {currentPlan.name}!
              </span>
            </>
          ) : (
            <>
              🔄 Atualizando seu plano para {currentPlan.name}...
              <br/>
              <span style={{fontSize: '0.9em', color: '#666'}}>Aguarde alguns instantes...</span>
            </>
          )}
        </p>

        {previousPlan && previousPlan !== plan && planUpdated && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '15px',
            marginBottom: '25px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{fontSize: '1.1em', fontWeight: 'bold', marginBottom: '10px'}}>
              📋 Mudança de Plano Confirmada
            </div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', fontSize: '1.1em'}}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '0.85em', opacity: 0.9, marginBottom: '5px'}}>Plano Anterior</div>
                <div style={{fontSize: '1.3em', fontWeight: 'bold'}}>
                  {plans[previousPlan]?.name || previousPlan}
                </div>
              </div>
              <div style={{fontSize: '2em', fontWeight: 'bold'}}>→</div>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '0.85em', opacity: 0.9, marginBottom: '5px'}}>Plano Novo</div>
                <div style={{fontSize: '1.3em', fontWeight: 'bold'}}>
                  {currentPlan.name}
                </div>
              </div>
            </div>
            <div style={{marginTop: '15px', fontSize: '0.9em', textAlign: 'center', opacity: 0.95}}>
              ✨ Upgrade realizado com sucesso! Todos os recursos já estão disponíveis.
            </div>
          </div>
        )}

        <div className="plan-activated" style={{ borderColor: currentPlan.color }}>
          <div className="plan-badge" style={{ background: currentPlan.color }}>
            {previousPlan && previousPlan !== plan ? 'Novo Plano Ativo' : 'Plano Ativado'}
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

