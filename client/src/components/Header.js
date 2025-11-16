import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Upgrade from './Upgrade';
import './Header.css';

function Header({ whatsappStatus, activeTab, setActiveTab }) {
  const { user, logout, isAdmin, refreshUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);

  function handleLogout() {
    if (window.confirm('Deseja realmente sair?')) {
      logout();
      navigate('/login');
    }
  }
  
  async function handlePlanChanged(newPlan) {
    console.log('✅ Header: Plano alterado para:', newPlan);
    setShowUpgrade(false);
    
    // Forçar atualização do usuário no contexto
    console.log('🔄 Header: Atualizando dados do usuário...');
    await refreshUser();
    console.log('✅ Header: Dados atualizados!');
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>💰 Agente Financeiro</h1>
          <div className="header-info">
            {isAdmin && (
              <div className={`status ${whatsappStatus ? 'connected' : 'disconnected'}`}>
                <span className="status-dot"></span>
                WhatsApp {whatsappStatus ? 'Conectado' : 'Desconectado'}
              </div>
            )}
            {user && (
              <div className="user-info">
                <span className="user-name">👤 {user.name}</span>
                <span className={`user-plan plan-${user.plan}`}>
                  {user.plan === 'basico' && '💰 Básico'}
                  {user.plan === 'premium' && '⭐ Premium'}
                  {user.plan === 'enterprise' && '🏢 Enterprise'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'transacoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('transacoes')}
          >
            💳 Transações
          </button>
          <button 
            className={`nav-tab ${activeTab === 'alertas' ? 'active' : ''}`}
            onClick={() => setActiveTab('alertas')}
          >
            🔔 Alertas
          </button>
          <button 
            className={`nav-tab ${activeTab === 'lembretes' ? 'active' : ''}`}
            onClick={() => setActiveTab('lembretes')}
          >
            📅 Lembretes
          </button>
          <button 
            className={`nav-tab ${activeTab === 'contas' ? 'active' : ''}`}
            onClick={() => setActiveTab('contas')}
          >
            💳 Contas
          </button>
          <button 
            className={`nav-tab ${activeTab === 'metas' ? 'active' : ''}`}
            onClick={() => setActiveTab('metas')}
          >
            🎯 Metas
          </button>
          <button 
            className={`nav-tab ${activeTab === 'integracoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('integracoes')}
          >
            🔗 Integrações
          </button>
          <button 
            className={`nav-tab ${activeTab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            📱 WhatsApp
          </button>
          <button 
            className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat IA
          </button>
        </nav>

        <div className="header-actions">
          <button 
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {user && user.plan !== 'enterprise' && (
            <button 
              className="btn-upgrade"
              onClick={() => setShowUpgrade(true)}
            >
              💎 Upgrade
            </button>
          )}
          {isAdmin && (
            <button 
              className="btn-admin"
              onClick={() => navigate('/admin')}
            >
              👑 Admin
            </button>
          )}
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Sair
          </button>
        </div>
      </div>

      {showUpgrade && (
        <Upgrade 
          onClose={() => setShowUpgrade(false)} 
          onPlanChanged={handlePlanChanged} 
        />
      )}
    </header>
  );
}

export default Header;

