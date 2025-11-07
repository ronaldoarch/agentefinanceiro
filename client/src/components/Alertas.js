import React from 'react';
import './Alertas.css';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

function Alertas({ alertas, marcarLido }) {
  const getAlertaClass = (tipo) => {
    switch (tipo) {
      case 'danger': return 'alerta-danger';
      case 'warning': return 'alerta-warning';
      case 'info': return 'alerta-info';
      default: return 'alerta-info';
    }
  };

  const getAlertaIcon = (tipo) => {
    switch (tipo) {
      case 'danger': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="alertas">
      <div className="alertas-header card">
        <h2>🔔 Central de Alertas</h2>
        <p className="alertas-subtitle">
          {alertas.length === 0 
            ? 'Você não tem alertas pendentes' 
            : `Você tem ${alertas.length} alerta${alertas.length > 1 ? 's' : ''} pendente${alertas.length > 1 ? 's' : ''}`
          }
        </p>
      </div>

      {alertas.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <h3>Tudo tranquilo!</h3>
            <p>Você não tem nenhum alerta no momento.</p>
          </div>
        </div>
      ) : (
        <div className="alertas-lista">
          {alertas.map((alerta, index) => (
            <div key={index} className={`alerta-card ${getAlertaClass(alerta.tipo)}`}>
              <div className="alerta-icon">
                {getAlertaIcon(alerta.tipo)}
              </div>
              <div className="alerta-content">
                <h3 className="alerta-titulo">{alerta.titulo}</h3>
                <p className="alerta-mensagem">{alerta.mensagem}</p>
                <div className="alerta-footer">
                  <span className="alerta-data">
                    {moment(alerta.data).fromNow()}
                  </span>
                  <button 
                    className="alerta-btn-lido"
                    onClick={() => marcarLido(alerta.id)}
                  >
                    ✓ Marcar como lido
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Alertas;

