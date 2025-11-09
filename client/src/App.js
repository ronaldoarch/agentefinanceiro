import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import Transacoes from './components/Transacoes';
import Alertas from './components/Alertas';
import Header from './components/Header';
import WhatsAppControl from './components/WhatsAppControl';
import Chat from './components/Chat';

function App() {
  const [resumo, setResumo] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Carregar dados
  const carregarDados = useCallback(async () => {
    try {
      const [resumoRes, transacoesRes, alertasRes, statusRes] = await Promise.all([
        axios.get('/api/resumo'),
        axios.get('/api/transacoes'),
        axios.get('/api/alertas'),
        axios.get('/api/whatsapp/status')
      ]);

      setResumo(resumoRes.data);
      setTransacoes(transacoesRes.data);
      setAlertas(alertasRes.data.filter(a => !a.lido));
      setWhatsappStatus(statusRes.data.connected);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();

    // Atualizar dados a cada 30 segundos
    const interval = setInterval(carregarDados, 30000);

    // WebSocket para atualizações em tempo real
    // Usar wss:// se a página estiver em https://, senão ws://
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Conectar através do mesmo host/porta que a aplicação web (através do proxy)
    const wsUrl = `${protocol}//${window.location.host}`;
    console.log('Conectando WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket conectado');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket mensagem:', data);
      
      if (data.type === 'nova_transacao') {
        carregarDados();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket erro:', error);
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [carregarDados]);

  const marcarAlertaLido = async (id) => {
    try {
      await axios.put(`/api/alertas/${id}/lido`);
      setAlertas(alertas.filter(a => a.id !== id));
    } catch (error) {
      console.error('Erro ao marcar alerta:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Header 
        whatsappStatus={whatsappStatus} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <div className="container">
        {activeTab === 'dashboard' && (
          <Dashboard 
            resumo={resumo} 
            transacoes={transacoes}
          />
        )}
        
        {activeTab === 'transacoes' && (
          <Transacoes transacoes={transacoes} />
        )}
        
        {activeTab === 'alertas' && (
          <Alertas 
            alertas={alertas} 
            marcarLido={marcarAlertaLido}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppControl 
            whatsappStatus={whatsappStatus}
            onStatusChange={carregarDados}
          />
        )}

        {activeTab === 'chat' && (
          <Chat />
        )}
      </div>
    </div>
  );
}

export default App;

