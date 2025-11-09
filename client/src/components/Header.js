import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function Header({ whatsappStatus, activeTab, setActiveTab }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    if (window.confirm('Deseja realmente sair?')) {
      logout();
      navigate('/login');
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>💰 Agente Financeiro</h1>
          <div className="header-info">
            <div className={`status ${whatsappStatus ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              WhatsApp {whatsappStatus ? 'Conectado' : 'Desconectado'}
            </div>
            {user && (
              <div className="user-info">
                <span className="user-name">👤 {user.name}</span>
                <span className={`user-plan plan-${user.plan}`}>
                  {user.plan === 'free' && '🆓 Free'}
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
    </header>
  );
}

export default Header;

