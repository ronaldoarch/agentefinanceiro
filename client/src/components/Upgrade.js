import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Upgrade.css';

function Upgrade({ onClose }) {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const { user } = useAuth();

  const plans = {
    basico: {
      name: '💰 Básico',
      price: 15.00,
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
      popular: true,
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
      features: [
        'Transações ilimitadas',
        'Mensagens IA ilimitadas',
        'Todos recursos Premium',
        'API personalizada',
        'Suporte 24/7'
      ]
    }
  };

  async function handleRequestPayment() {
    setLoading(true);
    
    try {
      const response = await axios.post('/api/payments/request', {
        plan: selectedPlan
      });
      
      const { payment_url, payment_id } = response.data;
      
      if (payment_url) {
        // Salvar payment_id para verificação posterior
        setPaymentId(payment_id);
        
        // Redirecionar para página de pagamento do AbacatePay
        alert(`✅ Pagamento criado!\n\nVocê será redirecionado para a página de pagamento PIX do AbacatePay.\n\nApós pagar, seu plano será atualizado automaticamente!`);
        
        // Abrir página do AbacatePay
        window.open(payment_url, '_blank');
        
        // Mostrar tela de aguardando pagamento
        setShowQRCode(true);
        
        // Iniciar verificação automática de pagamento
        startPaymentPolling(payment_id);
      } else {
        alert('Erro: URL de pagamento não foi gerada. Tente novamente.');
      }
      
    } catch (error) {
      alert('Erro ao solicitar pagamento: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  }
  
  // Verificar status do pagamento automaticamente
  function startPaymentPolling(paymentId) {
    let attempts = 0;
    const maxAttempts = 60; // 60 tentativas = 3 minutos
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await axios.get(`/api/payments/${paymentId}/status`);
        
        if (response.data.status === 'paid') {
          clearInterval(interval);
          alert('🎉 PAGAMENTO CONFIRMADO!\n\nSeu plano foi atualizado com sucesso!\n\nRecarregando página...');
          window.location.reload();
        }
        
        // Parar após número máximo de tentativas
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.log('⏰ Timeout: parou de verificar pagamento após 3 minutos');
        }
        
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000); // A cada 3 segundos
  }

  if (showQRCode) {
    return (
      <div className="upgrade-modal">
        <div className="upgrade-content pix-payment">
          <button className="close-btn" onClick={onClose}>✕</button>
          
          <h2>⏳ Aguardando Pagamento PIX</h2>
          
          <div className="payment-details">
            <div className="plan-selected">
              <h3>{plans[selectedPlan].name}</h3>
              <p className="price">R$ {plans[selectedPlan].price.toFixed(2)}/mês</p>
            </div>

            <div className="payment-waiting">
              <div className="success-icon">✅</div>
              
              <h3>Pagamento Criado com Sucesso!</h3>
              
              <p className="payment-info">
                <strong>ID do Pagamento:</strong> #{paymentId}<br/>
                <strong>Valor:</strong> R$ {plans[selectedPlan].price.toFixed(2)}<br/>
                <strong>Plano:</strong> {plans[selectedPlan].name}
              </p>

              <div className="payment-instructions-box">
                <h4>📱 Como Pagar:</h4>
                <ol>
                  <li>Uma nova aba foi aberta com a página de pagamento do <strong>AbacatePay</strong></li>
                  <li>Escaneie o <strong>QR Code PIX</strong> que aparece lá</li>
                  <li>Confirme o pagamento no app do seu banco</li>
                  <li>Aguarde a confirmação <strong>automática</strong></li>
                </ol>
                
                <p className="help-text">
                  💡 Se a aba não abriu, <a href="#" onClick={(e) => {
                    e.preventDefault();
                    alert('Por favor, permita pop-ups do site nas configurações do navegador.');
                  }}>clique aqui</a> para ver instruções.
                </p>
              </div>

              <div className="payment-status">
                <div className="status-pending">
                  <div className="spinner"></div>
                  <p><strong>Aguardando confirmação do pagamento...</strong></p>
                </div>
                <p className="status-info">
                  ✨ Seu plano será ativado <strong>automaticamente</strong> após a confirmação do PIX.<br/>
                  ⏱️ Geralmente leva apenas alguns segundos!
                </p>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={onClose}>
                Fechar
              </button>
              <button className="btn-primary" onClick={() => window.location.reload()}>
                ✓ Já Fiz o Pagamento
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upgrade-modal">
      <div className="upgrade-content">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <h2>💎 Escolha seu Plano</h2>
        <p className="subtitle">Plano atual: <strong>{plans[user.plan].name}</strong></p>

        <div className="plans-grid">
          {Object.keys(plans).map(planKey => {
            const plan = plans[planKey];
            const isCurrentPlan = user.plan === planKey;
            
            return (
              <div 
                key={planKey}
                className={`plan-card ${selectedPlan === planKey ? 'selected' : ''} ${plan.popular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}`}
                onClick={() => !isCurrentPlan && setSelectedPlan(planKey)}
              >
                {plan.popular && <div className="popular-badge">⭐ MAIS POPULAR</div>}
                {isCurrentPlan && <div className="current-badge">✅ SEU PLANO</div>}
                
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price-container">
                    <span className="price-value">R$ {plan.price.toFixed(2)}</span>
                    <span className="price-period">/mês</span>
                  </div>
                </div>

                <ul className="features-list">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="plan-footer">
                  {!isCurrentPlan ? (
                    <button 
                      className={`select-btn ${selectedPlan === planKey ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(planKey);
                      }}
                    >
                      {selectedPlan === planKey ? '✓ Selecionado' : 'Selecionar'}
                    </button>
                  ) : (
                    <div className="current-plan-label">Plano Atual</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="checkout-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button 
            className="btn-checkout" 
            onClick={handleRequestPayment}
            disabled={loading || selectedPlan === user.plan}
          >
            {loading ? '⏳ Processando...' : `💳 Pagar R$ ${plans[selectedPlan].price.toFixed(2)}`}
          </button>
        </div>

        <div className="payment-info">
          <p>🎁 <strong>7 dias de teste grátis</strong> para todos os planos!</p>
          <p>💳 Pagamento seguro via PIX</p>
          <p>🔒 Cancele quando quiser</p>
        </div>
      </div>
    </div>
  );
}

export default Upgrade;

