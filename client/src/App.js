import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transacoes from './components/Transacoes';
import Alertas from './components/Alertas';
import Lembretes from './components/Lembretes';
import Contas from './components/Contas';
import Metas from './components/Metas';
import Integracoes from './components/Integracoes';
import Header from './components/Header';
import WhatsAppControl from './components/WhatsAppControl';
import Chat from './components/Chat';
import AdminDashboard from './components/admin/AdminDashboard';
import PaymentSuccess from './components/PaymentSuccess';

// Componente para proteger rotas
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verificando autenticação...</p>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Componente para rotas de admin
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verificando autenticação...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function MainApp() {
  const { refreshUser, isAdmin } = useAuth();
  const [resumo, setResumo] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Carregar dados
  const carregarDados = useCallback(async () => {
    try {
      const promises = [
        axios.get('/api/resumo'),
        axios.get('/api/transacoes'),
        axios.get('/api/alertas')
      ];

      // Só buscar status do WhatsApp se for admin
      if (isAdmin) {
        promises.push(axios.get('/api/whatsapp/status'));
      }

      const results = await Promise.all(promises);

      setResumo(results[0].data);
      setTransacoes(results[1].data);
      setAlertas(results[2].data.filter(a => !a.lido));
      
      // Só atualizar status do WhatsApp se for admin
      if (isAdmin && results[3]) {
        setWhatsappStatus(results[3].data.connected);
      } else {
        setWhatsappStatus(false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    // Recarregar usuário e dados ao montar o componente
    const initializeData = async () => {
      await refreshUser(); // Atualizar dados do usuário primeiro
      await carregarDados(); // Depois carregar dados financeiros
    };
    
    initializeData();

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
      
      // Recarregar dados quando houver qualquer atualização
      if (data.type === 'nova_transacao') {
        console.log('✅ Nova transação detectada, recarregando dados...');
        carregarDados();
      } else if (data.type === 'transacao_deletada') {
        console.log('🗑️ Transação deletada, recarregando dados...');
        carregarDados();
      } else if (data.type === 'transacoes_limpas') {
        console.log('🧹 Transações limpas, recarregando dados...');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        {activeTab === 'lembretes' && (
          <Lembretes />
        )}

        {activeTab === 'contas' && (
          <Contas />
        )}

        {activeTab === 'metas' && (
          <Metas />
        )}

        {activeTab === 'integracoes' && (
          <Integracoes />
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

// Componente principal com rotas
function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" /> : <Login />
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      
      <Route 
        path="/payment/success" 
        element={
          <PrivateRoute>
            <PaymentSuccess />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <MainApp />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

export default App;

