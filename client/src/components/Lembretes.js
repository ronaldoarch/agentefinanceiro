import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Lembretes.css';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

function Lembretes() {
  const [lembretes, setLembretes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState(''); // '', 'pendente', 'concluido', 'atrasado'
  const [loading, setLoading] = useState(false);
  
  // Estado do formulário
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    categoria: 'contas',
    dataVencimento: '',
    recorrencia: 'unico',
    notificarWhatsApp: true,
    diasAntecedencia: 1
  });

  const token = localStorage.getItem('token');
  const apiUrl = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    carregarLembretes();
  }, [filtroStatus]);

  const carregarLembretes = async () => {
    try {
      setLoading(true);
      const params = filtroStatus ? { status: filtroStatus } : {};
      const response = await axios.get(`${apiUrl}/api/lembretes`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setLembretes(response.data);
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.titulo || !form.dataVencimento) {
      alert('Título e data de vencimento são obrigatórios!');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${apiUrl}/api/lembretes`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('✅ Lembrete criado com sucesso!');
      setMostrarForm(false);
      resetForm();
      carregarLembretes();
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
      alert('❌ Erro ao criar lembrete: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const marcarConcluido = async (id) => {
    try {
      await axios.put(`${apiUrl}/api/lembretes/${id}/concluir`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Lembrete concluído!');
      carregarLembretes();
    } catch (error) {
      console.error('Erro ao marcar lembrete:', error);
      alert('❌ Erro ao marcar lembrete como concluído');
    }
  };

  const deletarLembrete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este lembrete?')) {
      return;
    }

    try {
      await axios.delete(`${apiUrl}/api/lembretes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('🗑️ Lembrete deletado!');
      carregarLembretes();
    } catch (error) {
      console.error('Erro ao deletar lembrete:', error);
      alert('❌ Erro ao deletar lembrete');
    }
  };

  const resetForm = () => {
    setForm({
      titulo: '',
      descricao: '',
      valor: '',
      categoria: 'contas',
      dataVencimento: '',
      recorrencia: 'unico',
      notificarWhatsApp: true,
      diasAntecedencia: 1
    });
  };

  const getStatusBadge = (lembrete) => {
    const dataVencimento = moment(lembrete.data_vencimento);
    const agora = moment();
    
    if (lembrete.status === 'concluido') {
      return <span className="badge badge-concluido">✅ Concluído</span>;
    }
    
    if (lembrete.status === 'cancelado') {
      return <span className="badge badge-cancelado">❌ Cancelado</span>;
    }
    
    if (dataVencimento.isBefore(agora)) {
      return <span className="badge badge-atrasado">⚠️ Atrasado</span>;
    }
    
    const diasRestantes = dataVencimento.diff(agora, 'days');
    if (diasRestantes <= lembrete.dias_antecedencia) {
      return <span className="badge badge-urgente">🔔 Urgente</span>;
    }
    
    return <span className="badge badge-pendente">⏳ Pendente</span>;
  };

  const formatarData = (data) => {
    return moment(data).format('DD/MM/YYYY');
  };

  const getDiasRestantes = (dataVencimento) => {
    const dias = moment(dataVencimento).diff(moment(), 'days');
    if (dias < 0) {
      return `${Math.abs(dias)} dias atrasado`;
    } else if (dias === 0) {
      return 'Vence hoje!';
    } else if (dias === 1) {
      return 'Vence amanhã';
    } else {
      return `Vence em ${dias} dias`;
    }
  };

  const categorias = [
    { value: 'contas', label: '💸 Contas' },
    { value: 'aluguel', label: '🏠 Aluguel' },
    { value: 'impostos', label: '📝 Impostos' },
    { value: 'assinaturas', label: '📱 Assinaturas' },
    { value: 'parcelas', label: '💳 Parcelas' },
    { value: 'investimentos', label: '📈 Investimentos' },
    { value: 'outros', label: '📌 Outros' }
  ];

  const recorrencias = [
    { value: 'unico', label: 'Único' },
    { value: 'diario', label: 'Diário' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'anual', label: 'Anual' }
  ];

  return (
    <div className="lembretes-container">
      <div className="lembretes-header">
        <h2>📅 Lembretes Financeiros</h2>
        <button 
          className="btn-novo-lembrete"
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? '❌ Cancelar' : '➕ Novo Lembrete'}
        </button>
      </div>

      {/* Filtros */}
      <div className="lembretes-filtros">
        <button 
          className={`filtro-btn ${filtroStatus === '' ? 'ativo' : ''}`}
          onClick={() => setFiltroStatus('')}
        >
          📋 Todos
        </button>
        <button 
          className={`filtro-btn ${filtroStatus === 'pendente' ? 'ativo' : ''}`}
          onClick={() => setFiltroStatus('pendente')}
        >
          ⏳ Pendentes
        </button>
        <button 
          className={`filtro-btn ${filtroStatus === 'concluido' ? 'ativo' : ''}`}
          onClick={() => setFiltroStatus('concluido')}
        >
          ✅ Concluídos
        </button>
        <button 
          className={`filtro-btn ${filtroStatus === 'atrasado' ? 'ativo' : ''}`}
          onClick={() => setFiltroStatus('atrasado')}
        >
          ⚠️ Atrasados
        </button>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <form className="lembrete-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Título *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Pagar conta de luz"
                required
              />
            </div>

            <div className="form-group">
              <label>Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Valor (Opcional)</label>
              <input
                type="number"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Data de Vencimento *</label>
              <input
                type="datetime-local"
                value={form.dataVencimento}
                onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Recorrência</label>
              <select
                value={form.recorrencia}
                onChange={(e) => setForm({ ...form, recorrencia: e.target.value })}
              >
                {recorrencias.map(rec => (
                  <option key={rec.value} value={rec.value}>
                    {rec.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Notificar com antecedência (dias)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={form.diasAntecedencia}
                onChange={(e) => setForm({ ...form, diasAntecedencia: parseInt(e.target.value) })}
              />
            </div>

            <div className="form-group full-width">
              <label>Descrição</label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Detalhes adicionais sobre o lembrete..."
                rows="3"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.notificarWhatsApp}
                  onChange={(e) => setForm({ ...form, notificarWhatsApp: e.target.checked })}
                />
                📱 Enviar notificação via WhatsApp
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-salvar" disabled={loading}>
              {loading ? '⏳ Salvando...' : '💾 Salvar Lembrete'}
            </button>
            <button 
              type="button" 
              className="btn-cancelar"
              onClick={() => {
                setMostrarForm(false);
                resetForm();
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de Lembretes */}
      {loading && !mostrarForm ? (
        <div className="loading">⏳ Carregando lembretes...</div>
      ) : lembretes.length === 0 ? (
        <div className="lembretes-vazio">
          <p>📭 Nenhum lembrete encontrado</p>
          <p className="hint">Crie seu primeiro lembrete para nunca mais esquecer de pagar uma conta!</p>
        </div>
      ) : (
        <div className="lembretes-lista">
          {lembretes.map(lembrete => (
            <div key={lembrete.id} className="lembrete-card">
              <div className="lembrete-header">
                <h3>{lembrete.titulo}</h3>
                {getStatusBadge(lembrete)}
              </div>
              
              {lembrete.descricao && (
                <p className="lembrete-descricao">{lembrete.descricao}</p>
              )}
              
              <div className="lembrete-info">
                <div className="info-item">
                  <span className="info-label">📅 Vencimento:</span>
                  <span className="info-value">
                    {formatarData(lembrete.data_vencimento)}
                  </span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">⏰</span>
                  <span className="info-value">
                    {getDiasRestantes(lembrete.data_vencimento)}
                  </span>
                </div>
                
                {lembrete.valor && (
                  <div className="info-item">
                    <span className="info-label">💰 Valor:</span>
                    <span className="info-value">
                      R$ {parseFloat(lembrete.valor).toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="info-item">
                  <span className="info-label">📁 Categoria:</span>
                  <span className="info-value">
                    {categorias.find(c => c.value === lembrete.categoria)?.label || lembrete.categoria}
                  </span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">🔄 Recorrência:</span>
                  <span className="info-value">
                    {recorrencias.find(r => r.value === lembrete.recorrencia)?.label || lembrete.recorrencia}
                  </span>
                </div>
                
                {lembrete.notificar_whatsapp && (
                  <div className="info-item">
                    <span className="info-value">
                      📱 Notificação WhatsApp ativa
                    </span>
                  </div>
                )}
              </div>
              
              <div className="lembrete-acoes">
                {lembrete.status === 'pendente' && (
                  <button
                    className="btn-concluir"
                    onClick={() => marcarConcluido(lembrete.id)}
                  >
                    ✅ Concluir
                  </button>
                )}
                <button
                  className="btn-deletar"
                  onClick={() => deletarLembrete(lembrete.id)}
                >
                  🗑️ Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Lembretes;

