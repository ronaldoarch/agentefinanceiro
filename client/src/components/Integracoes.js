import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Integracoes.css';

function Integracoes() {
  const [googleStatus, setGoogleStatus] = useState({
    connected: false,
    email: null,
    loading: true
  });

  const token = localStorage.getItem('token');
  const apiUrl = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    verificarStatus();
    
    // Verificar se voltou do OAuth do Google
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_connected') === 'true') {
      alert('✅ Google Agenda conectado com sucesso!');
      window.history.replaceState({}, '', '/');
      verificarStatus();
    }
    if (urlParams.get('google_error') === 'true') {
      alert('❌ Erro ao conectar Google Agenda. Tente novamente.');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const verificarStatus = async () => {
    try {
      setGoogleStatus(prev => ({ ...prev, loading: true }));
      
      const response = await axios.get(`${apiUrl}/api/google/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGoogleStatus({
        connected: response.data.connected,
        email: response.data.email,
        loading: false
      });
    } catch (error) {
      console.error('Erro ao verificar status do Google:', error);
      setGoogleStatus({ connected: false, email: null, loading: false });
    }
  };

  const conectarGoogle = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/google/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Redirecionar para URL de autorização do Google
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Erro ao obter URL de autorização:', error);
      alert('❌ Erro ao conectar com Google. Tente novamente.');
    }
  };

  const desconectarGoogle = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar do Google Agenda?')) {
      return;
    }

    try {
      await axios.post(`${apiUrl}/api/google/disconnect`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('✅ Google Agenda desconectado!');
      verificarStatus();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      alert('❌ Erro ao desconectar. Tente novamente.');
    }
  };

  return (
    <div className="integracoes-container">
      <div className="integracoes-header">
        <h2>🔗 Integrações</h2>
        <p className="integracoes-subtitle">
          Conecte o Agente Financeiro com seus apps favoritos
        </p>
      </div>

      {/* Google Calendar */}
      <div className="integracao-card google-calendar">
        <div className="integracao-icon">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" 
            alt="Google Calendar"
            className="service-logo"
          />
        </div>
        
        <div className="integracao-content">
          <h3>📅 Google Agenda</h3>
          <p className="integracao-descricao">
            Crie lembretes automaticamente no seu Google Agenda. 
            Receba notificações do Google além do WhatsApp!
          </p>
          
          <div className="integracao-recursos">
            <div className="recurso-item">✅ Cria eventos automaticamente</div>
            <div className="recurso-item">✅ Sincroniza com todos os dispositivos</div>
            <div className="recurso-item">✅ Notificações do Google</div>
            <div className="recurso-item">✅ Funciona offline</div>
          </div>

          {googleStatus.loading ? (
            <div className="status-loading">
              ⏳ Verificando conexão...
            </div>
          ) : googleStatus.connected ? (
            <div className="status-conectado">
              <div className="status-info">
                <span className="status-badge conectado">✅ Conectado</span>
                <span className="status-email">{googleStatus.email}</span>
              </div>
              <div className="status-acoes">
                <button className="btn-desconectar" onClick={desconectarGoogle}>
                  ❌ Desconectar
                </button>
              </div>
            </div>
          ) : (
            <div className="status-desconectado">
              <span className="status-badge desconectado">❌ Não conectado</span>
              <button className="btn-conectar" onClick={conectarGoogle}>
                🔗 Conectar Google Agenda
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Outras Integrações (Em Breve) */}
      <div className="integracao-card em-breve">
        <div className="integracao-icon">
          📊
        </div>
        
        <div className="integracao-content">
          <h3>📊 Google Sheets</h3>
          <p className="integracao-descricao">
            Exporte suas transações automaticamente para uma planilha do Google Sheets.
          </p>
          
          <div className="em-breve-badge">
            🚧 Em Breve
          </div>
        </div>
      </div>

      <div className="integracao-card em-breve">
        <div className="integracao-icon">
          🏦
        </div>
        
        <div className="integracao-content">
          <h3>🏦 Open Banking</h3>
          <p className="integracao-descricao">
            Importe transações bancárias automaticamente usando Open Banking.
          </p>
          
          <div className="em-breve-badge">
            🚧 Em Breve
          </div>
        </div>
      </div>

      <div className="integracao-card em-breve">
        <div className="integracao-icon">
          📧
        </div>
        
        <div className="integracao-content">
          <h3>📧 Email</h3>
          <p className="integracao-descricao">
            Receba relatórios financeiros mensais por email automaticamente.
          </p>
          
          <div className="em-breve-badge">
            🚧 Em Breve
          </div>
        </div>
      </div>
    </div>
  );
}

export default Integracoes;

