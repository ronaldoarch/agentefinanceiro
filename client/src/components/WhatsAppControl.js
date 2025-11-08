import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import './WhatsAppControl.css';

function WhatsAppControl({ whatsappStatus, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const canvasRef = useRef(null);

  // WebSocket e polling para receber QR Code
  useEffect(() => {
    // Usar wss:// se a página estiver em https://, senão ws://
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    console.log('WhatsApp WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'qr_code' && data.data && data.data.qr) {
          setQrCode(data.data.qr);
          setMessage('✅ QR Code gerado! Escaneie agora!');
        } else if (data.type === 'whatsapp_connected') {
          setQrCode(null);
          onStatusChange();
        } else if (data.type === 'nova_transacao') {
          onStatusChange();
        }
      } catch (error) {
        console.error('Erro ao processar WebSocket:', error);
      }
    };

    // Polling para buscar QR Code via API (fallback)
    const interval = setInterval(async () => {
      if (!whatsappStatus && !qrCode) {
        try {
          const response = await fetch('/api/whatsapp/qr');
          const data = await response.json();
          if (data.available && data.qr) {
            setQrCode(data.qr);
            setMessage('✅ QR Code gerado! Escaneie agora!');
          }
        } catch (error) {
          // Silencioso - apenas tenta buscar
        }
      }
    }, 3000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [onStatusChange, whatsappStatus, qrCode]);

  // Gerar QR Code no canvas quando receber
  useEffect(() => {
    if (qrCode && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(err => {
        console.error('Erro ao gerar QR Code:', err);
      });
    }
  }, [qrCode]);

  const handleDisconnect = async () => {
    if (!window.confirm('Deseja realmente desconectar o WhatsApp?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST'
      });
      const data = await response.json();
      
      setMessage(data.message);
      
      if (data.success) {
        setTimeout(() => {
          onStatusChange();
        }, 1000);
      }
    } catch (error) {
      setMessage('Erro ao desconectar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    setMessage('');
    setQrCode(null);

    try {
      const response = await fetch('/api/whatsapp/reconnect', {
        method: 'POST'
      });
      const data = await response.json();
      
      setMessage(data.message + ' Aguarde o QR Code aparecer abaixo...');
      
      setTimeout(() => {
        onStatusChange();
      }, 2000);
    } catch (error) {
      setMessage('Erro ao reconectar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whatsapp-control-card card">
      <h2 className="card-title">📱 Controle do WhatsApp</h2>
      
      <div className="whatsapp-status-section">
        <div className="status-display">
          <div className={`status-indicator ${whatsappStatus ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span className="status-text">
              {whatsappStatus ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          <div className="status-info">
            {whatsappStatus ? (
              <p>✅ WhatsApp conectado e funcionando normalmente</p>
            ) : (
              <p>⚠️ WhatsApp desconectado. Clique em "Conectar" para gerar o QR Code</p>
            )}
          </div>
        </div>

        <div className="control-buttons">
          {whatsappStatus ? (
            <button 
              className="btn-disconnect"
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? '⏳ Processando...' : '🔌 Desconectar'}
            </button>
          ) : (
            <button 
              className="btn-connect"
              onClick={handleReconnect}
              disabled={loading}
            >
              {loading ? '⏳ Conectando...' : '📱 Conectar WhatsApp'}
            </button>
          )}
        </div>

        {message && (
          <div className={`message ${message.includes('Erro') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {qrCode && !whatsappStatus && (
          <div className="qrcode-container">
            <h4>📱 Escaneie o QR Code:</h4>
            <div className="qrcode-wrapper">
              <canvas ref={canvasRef}></canvas>
            </div>
            <p className="qrcode-instructions">
              ⚡ O QR Code expira em alguns segundos. Se expirar, clique em "Conectar" novamente.
            </p>
          </div>
        )}

        {!whatsappStatus && !qrCode && (
          <div className="instructions">
            <h4>📋 Como Conectar:</h4>
            <ol>
              <li>Clique no botão "📱 Conectar WhatsApp" acima</li>
              <li>Aguarde o QR Code aparecer aqui</li>
              <li>Abra o WhatsApp no celular</li>
              <li>Vá em Configurações → Aparelhos Conectados</li>
              <li>Toque em "Conectar um aparelho"</li>
              <li>Escaneie o QR Code que aparecerá acima</li>
            </ol>
          </div>
        )}
      </div>

      <div className="security-info">
        <p>🔒 <strong>Número Autorizado:</strong> +55 62 9507-3443</p>
        <p className="security-note">
          Apenas este número pode enviar transações para o bot
        </p>
      </div>
    </div>
  );
}

export default WhatsAppControl;

