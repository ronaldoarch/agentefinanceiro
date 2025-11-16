import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Upgrade.css';

function Upgrade({ onClose, onPlanChanged }) {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [pollingIntervalRef, setPollingIntervalRef] = useState(null);
  const { user, refreshUser } = useAuth();
  
  // Cleanup ao desmontar componente
  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef) {
        clearInterval(pollingIntervalRef);
        console.log('🧹 Upgrade desmontado - polling limpo');
      }
    };
  }, [pollingIntervalRef]);

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
    console.log('='.repeat(60));
    console.log('💳 UPGRADE: Iniciando requisição de pagamento');
    console.log('='.repeat(60));
    console.log('📋 Plano selecionado:', selectedPlan);
    console.log('💰 Valor:', plans[selectedPlan].price);
    console.log('👤 Usuário:', user?.email);
    
    setLoading(true);
    
    try {
      // Salvar informações do plano no localStorage para página de sucesso
      localStorage.setItem('payment_plan', selectedPlan);
      localStorage.setItem('payment_amount', plans[selectedPlan].price.toFixed(2));
      console.log('💾 Plano salvo no localStorage para backup');
      
      console.log('📡 Enviando requisição para /api/payments/request...');
      const response = await axios.post('/api/payments/request', {
        plan: selectedPlan
      });
      
      console.log('✅ Resposta recebida:', response.data);
      
      const { payment_url, payment_id, dev_mode, success } = response.data;
      
      if (!success && response.data.error) {
        throw new Error(response.data.error);
      }
      
      if (payment_url && payment_id) {
        console.log('✅ Pagamento criado com sucesso!');
        console.log('   Payment ID:', payment_id);
        console.log('   Payment URL:', payment_url);
        console.log('   Dev Mode:', dev_mode);
        
        // Salvar payment_id e URL
        setPaymentId(payment_id);
        setPaymentUrl(payment_url);
        
        // Mensagem diferente para modo dev
        if (dev_mode) {
          alert(`✅ Pagamento TESTE criado!\n\n🔧 MODO DE DESENVOLVIMENTO\n\nPayment ID: ${payment_id}\n\nVocê será redirecionado para a página de pagamento do AbacatePay.\n\nEste é um pagamento de teste e não será cobrado.\n\nApós "pagar", seu plano será atualizado automaticamente!`);
        } else {
          alert(`✅ Pagamento criado!\n\nPayment ID: ${payment_id}\nPlano: ${plans[selectedPlan].name}\nValor: R$ ${plans[selectedPlan].price.toFixed(2)}\n\nVocê será redirecionado para a página de pagamento PIX.\n\nApós pagar, seu plano será atualizado automaticamente!`);
        }
        
        // Abrir página do AbacatePay
        console.log('🌐 Abrindo página de pagamento...');
        const opened = window.open(payment_url, '_blank');
        
        if (!opened) {
          console.warn('⚠️ Pop-up bloqueado! Pedindo para usuário permitir.');
          alert('⚠️ Pop-up foi bloqueado!\n\nPor favor, permita pop-ups para este site e tente novamente.\n\nOu acesse manualmente: ' + payment_url);
        }
        
        // Mostrar tela de aguardando pagamento
        setShowQRCode(true);
        
        // Iniciar verificação automática de pagamento
        console.log('🔄 Iniciando polling de verificação...');
        startPaymentPolling(payment_id);
      } else {
        console.error('❌ Resposta sem payment_url ou payment_id:', response.data);
        throw new Error('URL de pagamento não foi gerada. Resposta inválida do servidor.');
      }
      
    } catch (error) {
      console.error('='.repeat(60));
      console.error('❌ ERRO ao solicitar pagamento!');
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Resposta:', error.response?.data);
      console.error('❌ Stack:', error.stack);
      console.error('='.repeat(60));
      
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
      alert(`❌ Erro ao solicitar pagamento:\n\n${errorMessage}\n\nDetalhes técnicos:\n- Plano: ${selectedPlan}\n- Valor: R$ ${plans[selectedPlan].price.toFixed(2)}\n\nPor favor, tente novamente ou entre em contato com o suporte.`);
    } finally {
      setLoading(false);
    }
  }
  
  // Verificar status do pagamento automaticamente
  function startPaymentPolling(paymentId) {
    let attempts = 0;
    const maxAttempts = 120; // 120 tentativas = 6 minutos
    
    console.log('='.repeat(60));
    console.log('🔄 POLLING: Iniciando verificação automática de pagamento');
    console.log('='.repeat(60));
    console.log('📋 Payment ID:', paymentId);
    console.log('⏱️ Intervalo: 3 segundos');
    console.log('⏰ Duração máxima: 6 minutos (120 tentativas)');
    
    const interval = setInterval(async () => {
      attempts++;
      setPollingAttempts(attempts); // Atualizar UI
      console.log(`🔍 [${attempts}/${maxAttempts}] Verificando status do pagamento #${paymentId}...`);
      
      try {
        const response = await axios.get(`/api/payments/${paymentId}/status`);
        const status = response.data.status;
        const planAprovado = response.data.plan;
        
        console.log(`📊 [${attempts}/${maxAttempts}] Status: ${status}`);
        
        if (status === 'paid') {
          clearInterval(interval);
          console.log('='.repeat(60));
          console.log('✅✅✅ PAGAMENTO CONFIRMADO! ✅✅✅');
          console.log('='.repeat(60));
          console.log('🎉 Plano aprovado:', planAprovado);
          console.log('💰 Valor pago: R$', plans[selectedPlan].price.toFixed(2));
          
          // Salvar plano no localStorage antes de redirecionar
          localStorage.setItem('user_plan', planAprovado);
          localStorage.setItem('user_plan_updated_at', new Date().toISOString());
          console.log('💾 Plano salvo no localStorage:', planAprovado);
          
          // Atualizar contexto do usuário ANTES de redirecionar
          console.log('🔄 Atualizando contexto do usuário...');
          try {
            await refreshUser();
            console.log('✅ Contexto atualizado!');
          } catch (refreshError) {
            console.warn('⚠️ Erro ao atualizar contexto:', refreshError.message);
          }
          
          // Fechar modal
          setShowQRCode(false);
          setPollingIntervalRef(null);
          
          // Pequeno delay e redirecionar
          setTimeout(() => {
            console.log('🔄 Redirecionando para /payment/success...');
            window.location.href = '/payment/success?plan=' + planAprovado + '&amount=' + plans[selectedPlan].price.toFixed(2);
          }, 500);
          
          return; // Sair da função
        }
        
        // Parar após número máximo de tentativas
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingIntervalRef(null);
          console.log('='.repeat(60));
          console.log('⏰ TIMEOUT: Parou após 6 minutos');
          console.log('='.repeat(60));
          alert('⏰ Tempo limite atingido!\n\nNão detectamos o pagamento ainda.\n\nSe você já pagou:\n- Aguarde alguns minutos e recarregue a página\n- Seu plano será atualizado automaticamente\n\nSe não pagou:\n- Você pode pagar depois\n- Acesse o link salvo ou solicite novo pagamento');
        }
        
      } catch (error) {
        console.error(`❌ [${attempts}/${maxAttempts}] Erro ao verificar status:`, error.message);
        // Não parar o polling por causa de um erro - pode ser temporário
      }
    }, 3000); // A cada 3 segundos
    
    // Armazenar referência do interval
    setPollingIntervalRef(interval);
  }

  // FUNÇÃO DE TESTE: Simular pagamento aprovado
  async function handleSimulatePayment() {
    if (!paymentId) {
      console.error('❌ Nenhum payment ID disponível');
      alert('❌ Erro: Nenhum pagamento em andamento');
      return;
    }
    
    console.log('='.repeat(60));
    console.log('🧪 SIMULAÇÃO: Simulando pagamento aprovado');
    console.log('='.repeat(60));
    console.log('📋 Payment ID:', paymentId);
    console.log('💰 Plano:', selectedPlan);
    
    try {
      setLoading(true);
      
      const response = await axios.post(`/api/payments/${paymentId}/simulate-payment`);
      
      console.log('✅ Resposta da simulação:', response.data);
      
      if (response.data.success) {
        const planAprovado = response.data.plan;
        console.log('✅ SIMULAÇÃO: Pagamento aprovado!');
        console.log('🎉 Plano aprovado:', planAprovado);
        
        // Parar polling
        if (pollingIntervalRef) {
          clearInterval(pollingIntervalRef);
          setPollingIntervalRef(null);
        }
        
        // Salvar no localStorage
        localStorage.setItem('user_plan', planAprovado);
        localStorage.setItem('user_plan_updated_at', new Date().toISOString());
        
        // Fechar modal
        setShowQRCode(false);
        
        // Redirecionar para página de sucesso
        setTimeout(() => {
          console.log('🔄 Redirecionando para página de sucesso...');
          window.location.href = '/payment/success?plan=' + planAprovado + '&amount=' + plans[selectedPlan].price.toFixed(2);
        }, 500);
      } else {
        throw new Error('Simulação não retornou sucesso');
      }
    } catch (error) {
      console.error('='.repeat(60));
      console.error('❌ ERRO na simulação:', error.message);
      console.error('='.repeat(60));
      alert('❌ Erro ao simular pagamento:\n\n' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  }
  
  // Função para reabrir página de pagamento
  function handleReopenPaymentPage() {
    if (paymentUrl) {
      console.log('🌐 Reabrindo página de pagamento:', paymentUrl);
      window.open(paymentUrl, '_blank');
    } else {
      alert('❌ URL de pagamento não disponível. Feche e solicite um novo pagamento.');
    }
  }
  
  // Função para ATIVAR o plano instantaneamente (modo teste)
  async function handleManualCheck() {
    console.log('='.repeat(60));
    console.log('✅ ATIVAÇÃO INSTANTÂNEA: Usuário clicou em Ativar Plano Agora');
    console.log('='.repeat(60));
    console.log('📋 Payment ID:', paymentId);
    console.log('💰 Plano selecionado pelo usuário:', selectedPlan);
    console.log('💵 Valor:', plans[selectedPlan].price);
    
    // Confirmar com o usuário
    const planName = plans[selectedPlan].name;
    const planPrice = plans[selectedPlan].price.toFixed(2);
    
    if (!window.confirm(`✅ ATIVAR PLANO ${planName.toUpperCase()}?\n\n💰 Valor: R$ ${planPrice}\n\n🧪 MODO TESTE - Ativação instantânea\n\nSeu plano será atualizado imediatamente sem verificação de pagamento real.\n\nDeseja continuar?`)) {
      console.log('❌ Usuário cancelou ativação');
      return;
    }
    
    setLoading(true);
    
    try {
      // MODO TESTE: Ativar o plano diretamente
      console.log('🧪 MODO TESTE: Ativando plano escolhido diretamente');
      console.log('   Plano escolhido:', selectedPlan);
      console.log('   Nome:', planName);
      
      // Parar polling
      if (pollingIntervalRef) {
        clearInterval(pollingIntervalRef);
        setPollingIntervalRef(null);
        console.log('🛑 Polling automático parado');
      }
      
      // Ativar o plano ESCOLHIDO PELO USUÁRIO via API de teste
      console.log('📡 Enviando requisição para ativar plano:', selectedPlan);
      const response = await axios.post('/api/test/change-plan', { plan: selectedPlan });
      
      console.log('📊 Resposta da API:', response.data);
      
      if (response.data.success) {
        console.log('='.repeat(60));
        console.log('✅✅✅ PLANO ATIVADO COM SUCESSO! ✅✅✅');
        console.log('='.repeat(60));
        console.log('🎉 Plano ativado:', response.data.plan);
        console.log('📋 Plano esperado:', selectedPlan);
        console.log('✅ Correspondência:', response.data.plan === selectedPlan ? 'SIM' : 'NÃO');
        
        // Salvar no localStorage
        localStorage.setItem('user_plan', selectedPlan);
        localStorage.setItem('user_plan_updated_at', new Date().toISOString());
        console.log('💾 Plano salvo no localStorage:', selectedPlan);
        
        // Atualizar contexto do usuário
        console.log('🔄 Atualizando contexto do usuário...');
        const updatedUser = await refreshUser();
        console.log('✅ Contexto atualizado!');
        console.log('   Plano no contexto:', updatedUser?.plan);
        
        // Fechar modal
        setShowQRCode(false);
        
        // Mostrar mensagem de sucesso antes de redirecionar
        alert(`🎉 PLANO ATIVADO COM SUCESSO!\n\n${planName} está ativo agora!\n\nVocê será redirecionado para a página de confirmação.`);
        
        // Redirecionar para página de sucesso
        setTimeout(() => {
          console.log('🔄 Redirecionando para /payment/success...');
          console.log('   Plano:', selectedPlan);
          console.log('   Valor:', planPrice);
          window.location.href = '/payment/success?plan=' + selectedPlan + '&amount=' + planPrice;
        }, 500);
      } else {
        console.error('❌ API não retornou sucesso:', response.data);
        throw new Error('API não confirmou ativação do plano');
      }
    } catch (error) {
      console.error('='.repeat(60));
      console.error('❌ ERRO CRÍTICO ao ativar plano!');
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Resposta:', error.response?.data);
      console.error('❌ Stack:', error.stack);
      console.error('='.repeat(60));
      
      const errorMsg = error.response?.data?.error || error.message || 'Erro desconhecido';
      alert(`❌ Erro ao ativar plano ${planName}:\n\n${errorMsg}\n\nPlano selecionado: ${selectedPlan}\nValor: R$ ${planPrice}\n\nPor favor, tente novamente.`);
    } finally {
      setLoading(false);
    }
  }

  // FUNÇÃO DE TESTE: Mudar plano diretamente (sem pagamento)
  async function handleQuickChangePlan(planKey) {
    if (window.confirm(`🧪 MODO TESTE\n\nDeseja ativar o plano ${plans[planKey].name} instantaneamente?\n\nEsta é uma função de teste que não requer pagamento.`)) {
      try {
        setLoading(true);
        console.log('🔄 Upgrade: Mudando plano para:', planKey);
        
        const response = await axios.post('/api/test/change-plan', { plan: planKey });
        
        if (response.data.success) {
          console.log('✅ Upgrade: API confirmou mudança de plano');
          
          // Salvar no localStorage para garantir
          localStorage.setItem('user_plan', planKey);
          localStorage.setItem('user_plan_updated_at', new Date().toISOString());
          console.log('💾 Upgrade: Plano salvo no localStorage');
          
          // Atualizar contexto do usuário imediatamente
          console.log('🔄 Upgrade: Chamando refreshUser...');
          const updatedUser = await refreshUser();
          console.log('✅ Upgrade: RefreshUser concluído. Plano atual:', updatedUser?.plan);
          
          // Mostrar confirmação
          alert(`✅ Plano atualizado com sucesso!\n\n${plans[planKey].name} está ativo agora!\n\nO painel será atualizado automaticamente.`);
          
          // Notificar componente pai que plano mudou (isso vai atualizar o Header)
          if (onPlanChanged) {
            console.log('🔔 Upgrade: Notificando componente pai');
            await onPlanChanged(planKey);
          }
          
          // Fechar modal
          onClose();
          
          // NÃO forçar reload completo - deixar o React atualizar
          console.log('✅ Upgrade: Processo completo!');
        }
      } catch (error) {
        console.error('❌ Erro ao mudar plano:', error);
        alert('❌ Erro ao mudar plano: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    }
  }

  if (showQRCode) {
    return ReactDOM.createPortal(
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
              
              <div className="payment-info" style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ color: '#667eea' }}>ID do Pagamento:</strong>
                    <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>#{paymentId}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#667eea' }}>Valor:</strong>
                    <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>R$ {plans[selectedPlan].price.toFixed(2)}</div>
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#667eea' }}>Plano:</strong>
                  <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{plans[selectedPlan].name}</div>
                </div>
              </div>

              <div className="payment-instructions-box">
                <h4>📱 Como Pagar:</h4>
                <ol>
                  <li>Uma nova aba foi aberta com a página de pagamento do <strong>AbacatePay</strong></li>
                  <li>Escaneie o <strong>QR Code PIX</strong> que aparece lá</li>
                  <li>Confirme o pagamento no app do seu banco</li>
                  <li>Aguarde a confirmação <strong>automática</strong></li>
                </ol>
                
                <p className="help-text">
                  💡 Se a aba não abriu, <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Por favor, permita pop-ups do site nas configurações do navegador.');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#667eea',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit'
                    }}
                  >clique aqui</button> para ver instruções.
                </p>
              </div>

              <div className="payment-status">
                <div className="status-pending">
                  <div className="spinner"></div>
                  <p><strong>Aguardando confirmação do pagamento...</strong></p>
                  {pollingAttempts > 0 && (
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                      🔄 Verificação #{pollingAttempts} - Checando automaticamente...
                    </p>
                  )}
                </div>
                <p className="status-info">
                  ✨ Seu plano será ativado <strong>automaticamente</strong> após a confirmação do PIX.<br/>
                  ⏱️ Geralmente leva apenas alguns segundos!<br/>
                  {pollingAttempts > 40 && (
                    <>
                      <br/>
                      <span style={{ color: '#ff9800' }}>
                        ⚠️ Ainda aguardando confirmação... O processo pode levar alguns minutos.
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="action-buttons" style={{ 
              display: 'flex', 
              gap: '10px', 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              marginTop: '20px'
            }}>
              <button 
                className="btn-secondary" 
                onClick={handleReopenPaymentPage}
                disabled={!paymentUrl}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  cursor: paymentUrl ? 'pointer' : 'not-allowed',
                  opacity: paymentUrl ? 1 : 0.5
                }}
              >
                🔗 Abrir Página de Pagamento
              </button>
              
              {process.env.NODE_ENV !== 'production' && (
                <button 
                  className="btn-test" 
                  onClick={handleSimulatePayment}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
                    color: 'white',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
                  }}
                >
                  {loading ? '⏳ Simulando...' : '🧪 SIMULAR Pagamento'}
                </button>
              )}
              
              <button 
                className="btn-secondary" 
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              >
                ❌ Fechar
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
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
                    <>
                      <button 
                        className={`select-btn ${selectedPlan === planKey ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(planKey);
                        }}
                      >
                        {selectedPlan === planKey ? '✓ Selecionado' : 'Selecionar'}
                      </button>
                      {process.env.NODE_ENV !== 'production' && (
                        <button 
                          className="test-quick-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickChangePlan(planKey);
                          }}
                          disabled={loading}
                          style={{
                            marginTop: '10px',
                            width: '100%',
                            padding: '10px',
                            background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1,
                            transition: 'all 0.3s'
                          }}
                          title="Ativar este plano instantaneamente para testes"
                        >
                          {loading ? '⏳...' : '🧪 ATIVAR AGORA'}
                        </button>
                      )}
                    </>
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
          {process.env.NODE_ENV !== 'production' && (
            <p style={{color: '#ff9800', fontWeight: 'bold', marginTop: '10px'}}>
              🔧 Modo de Desenvolvimento - Pagamentos de teste
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Upgrade;

