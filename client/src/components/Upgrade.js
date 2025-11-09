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
      
      setPaymentId(response.data.payment_id);
      setShowQRCode(true);
    } catch (error) {
      alert('Erro ao solicitar pagamento: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  }

  if (showQRCode) {
    return (
      <div className="upgrade-modal">
        <div className="upgrade-content pix-payment">
          <button className="close-btn" onClick={onClose}>✕</button>
          
          <h2>💳 Pagamento via PIX</h2>
          
          <div className="payment-details">
            <div className="plan-selected">
              <h3>{plans[selectedPlan].name}</h3>
              <p className="price">R$ {plans[selectedPlan].price.toFixed(2)}/mês</p>
            </div>

            <div className="qr-code-container">
              <h4>📱 Escaneie o QR Code:</h4>
              
              {/* QR Code do PagBank - RONALDO DIAS DE SOUSA */}
              <div className="qr-code-display">
                <div className="qr-code-placeholder">
                  <p>🔄 Carregando QR Code...</p>
                  <p className="instructions">
                    Use este QR Code para pagar R$ {plans[selectedPlan].price.toFixed(2)}
                  </p>
                  <div className="pix-info">
                    <p><strong>Favorecido:</strong> RONALDO DIAS DE SOUSA</p>
                    <p><strong>Valor:</strong> R$ {plans[selectedPlan].price.toFixed(2)}</p>
                    <p><strong>ID Pagamento:</strong> #{paymentId}</p>
                  </div>
                </div>
              </div>

              <div className="payment-instructions">
                <h4>📋 Como pagar:</h4>
                <ol>
                  <li>Abra o app do seu banco</li>
                  <li>Vá em "PIX" → "Pagar com QR Code"</li>
                  <li>Escaneie o QR Code acima</li>
                  <li>Confirme o pagamento de R$ {plans[selectedPlan].price.toFixed(2)}</li>
                  <li>Aguarde a aprovação (até 24h úteis)</li>
                </ol>
              </div>

              <div className="payment-status">
                <p className="status-pending">
                  ⏳ Aguardando confirmação do pagamento...
                </p>
                <p className="status-info">
                  Seu plano será ativado automaticamente após a confirmação.
                  Você receberá um email de confirmação.
                </p>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={onClose}>
                Voltar
              </button>
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Já Fiz o Pagamento
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
                {isCurrentPlan && <div className="current-badge">✅ PLANO ATUAL</div>}
                
                <h3>{plan.name}</h3>
                <p className="price">
                  R$ {plan.price.toFixed(2)}
                  <span className="period">/mês</span>
                </p>

                <ul className="features">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>✅ {feature}</li>
                  ))}
                </ul>

                {!isCurrentPlan && (
                  <button 
                    className={`select-btn ${selectedPlan === planKey ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(planKey);
                    }}
                  >
                    {selectedPlan === planKey ? 'Selecionado' : 'Selecionar'}
                  </button>
                )}
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

