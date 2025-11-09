import React from 'react';
import './Header.css';

function Header({ whatsappStatus, activeTab, setActiveTab }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>💰 Agente Financeiro</h1>
          <div className={`status ${whatsappStatus ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            WhatsApp {whatsappStatus ? 'Conectado' : 'Desconectado'}
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
      </div>
    </header>
  );
}

export default Header;

