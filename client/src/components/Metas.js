import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Metas.css';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

function Metas() {
  const [metas, setMetas] = useState([]);
  const [contas, setContas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estado do formulário
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'economizar',
    categoria: '',
    valor_meta: '',
    periodo: 'mensal',
    data_inicio: moment().format('YYYY-MM-DD'),
    data_fim: '',
    conta_id: ''
  });

  const tiposMeta = [
    { value: 'economizar', label: '💰 Economizar', desc: 'Economizar um valor específico' },
    { value: 'gastar_menos', label: '📉 Gastar Menos', desc: 'Gastar menos que um valor' },
    { value: 'receber_mais', label: '📈 Receber Mais', desc: 'Receber mais que um valor' },
    { value: 'gastar_mais', label: '💸 Gastar Mais', desc: 'Investir/gastar mais que um valor' }
  ];

  const periodos = [
    { value: 'diario', label: '📅 Diário' },
    { value: 'semanal', label: '📅 Semanal' },
    { value: 'mensal', label: '📅 Mensal' },
    { value: 'anual', label: '📅 Anual' }
  ];

  const categorias = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 
    'Lazer', 'Compras', 'Contas', 'Salário', 'Freelance', 
    'Investimentos', 'Outros'
  ];

  const token = localStorage.getItem('token');
  const apiUrl = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    carregarMetas();
    carregarContas();
  }, []);

  const carregarMetas = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/metas`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { apenas_ativas: 'true' }
      });
      setMetas(response.data);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      alert('❌ Erro ao carregar metas: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const carregarContas = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/contas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContas(response.data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.titulo || !form.valor_meta || !form.data_inicio) {
      alert('Título, valor da meta e data de início são obrigatórios!');
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...form,
        valor_meta: parseFloat(form.valor_meta),
        conta_id: form.conta_id || null,
        categoria: form.categoria || null,
        data_fim: form.data_fim || null
      };

      if (editingMeta) {
        await axios.put(`${apiUrl}/api/metas/${editingMeta.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Meta atualizada com sucesso!');
      } else {
        await axios.post(`${apiUrl}/api/metas`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Meta criada com sucesso!');
      }
      
      setMostrarForm(false);
      setEditingMeta(null);
      resetForm();
      carregarMetas();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('❌ Erro ao salvar meta: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (meta) => {
    setEditingMeta(meta);
    setForm({
      titulo: meta.titulo || '',
      tipo: meta.tipo || 'economizar',
      categoria: meta.categoria || '',
      valor_meta: meta.valor_meta || '',
      periodo: meta.periodo || 'mensal',
      data_inicio: meta.data_inicio ? moment(meta.data_inicio).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      data_fim: meta.data_fim ? moment(meta.data_fim).format('YYYY-MM-DD') : '',
      conta_id: meta.conta_id || ''
    });
    setMostrarForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta meta?')) {
      return;
    }

    try {
      await axios.delete(`${apiUrl}/api/metas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Meta deletada com sucesso!');
      carregarMetas();
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
      alert('❌ Erro ao deletar meta: ' + (error.response?.data?.error || error.message));
    }
  };

  const recalcularProgresso = async () => {
    try {
      setLoading(true);
      await axios.post(`${apiUrl}/api/metas/recalcular`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Progresso das metas recalculado!');
      carregarMetas();
    } catch (error) {
      console.error('Erro ao recalcular:', error);
      alert('❌ Erro ao recalcular: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      titulo: '',
      tipo: 'economizar',
      categoria: '',
      valor_meta: '',
      periodo: 'mensal',
      data_inicio: moment().format('YYYY-MM-DD'),
      data_fim: '',
      conta_id: ''
    });
  };

  const calcularProgresso = (meta) => {
    const valorAtual = parseFloat(meta.valor_atual || 0);
    const valorMeta = parseFloat(meta.valor_meta || 1);
    const percentual = Math.min((valorAtual / valorMeta) * 100, 100);
    return {
      percentual: Math.max(0, percentual),
      valorAtual,
      valorMeta,
      restante: Math.max(0, valorMeta - valorAtual)
    };
  };

  const getStatusMeta = (meta) => {
    if (meta.concluida) return 'concluida';
    const progresso = calcularProgresso(meta);
    if (progresso.percentual >= 90) return 'quase';
    if (progresso.percentual >= 50) return 'em-andamento';
    return 'iniciada';
  };

  return (
    <div className="metas-container">
      <div className="metas-header">
        <h2>🎯 Metas Financeiras</h2>
        <div className="metas-actions">
          <button 
            className="btn-secondary"
            onClick={recalcularProgresso}
            disabled={loading}
          >
            🔄 Recalcular Progresso
          </button>
          <button 
            className="btn-primary"
            onClick={() => {
              setEditingMeta(null);
              resetForm();
              setMostrarForm(true);
            }}
          >
            ➕ Nova Meta
          </button>
        </div>
      </div>

      {mostrarForm && (
        <div className="meta-form-container">
          <div className="meta-form">
            <div className="form-header">
              <h3>{editingMeta ? '✏️ Editar Meta' : '➕ Nova Meta'}</h3>
              <button className="btn-close" onClick={() => {
                setMostrarForm(false);
                setEditingMeta(null);
                resetForm();
              }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título da Meta *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Economizar para viagem, Gastar menos em alimentação"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo de Meta *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  required
                >
                  {tiposMeta.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label} - {tipo.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor da Meta (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_meta}
                    onChange={(e) => setForm({ ...form, valor_meta: e.target.value })}
                    placeholder="1000.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Período *</label>
                  <select
                    value={form.periodo}
                    onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                    required
                  >
                    {periodos.map(periodo => (
                      <option key={periodo.value} value={periodo.value}>
                        {periodo.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data de Início *</label>
                  <input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Data de Término (opcional)</label>
                  <input
                    type="date"
                    value={form.data_fim}
                    onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoria (opcional)</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    <option value="">Todas as categorias</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Conta Específica (opcional)</label>
                  <select
                    value={form.conta_id}
                    onChange={(e) => setForm({ ...form, conta_id: e.target.value })}
                  >
                    <option value="">Todas as contas</option>
                    {contas.map(conta => (
                      <option key={conta.id} value={conta.id}>
                        {conta.icone} {conta.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setMostrarForm(false);
                  setEditingMeta(null);
                  resetForm();
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : (editingMeta ? 'Atualizar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && !mostrarForm && (
        <div className="loading-metas">
          <div className="spinner"></div>
          <p>Carregando metas...</p>
        </div>
      )}

      {!loading && !mostrarForm && metas.length === 0 && (
        <div className="no-metas">
          <p>🎯 Você ainda não tem metas cadastradas.</p>
          <p>Clique em "Nova Meta" para começar!</p>
        </div>
      )}

      {!loading && !mostrarForm && metas.length > 0 && (
        <div className="metas-grid">
          {metas.map(meta => {
            const progresso = calcularProgresso(meta);
            const status = getStatusMeta(meta);
            const tipoMeta = tiposMeta.find(t => t.value === meta.tipo);
            const contaMeta = meta.conta_id ? contas.find(c => c.id === meta.conta_id) : null;
            
            return (
              <div key={meta.id} className={`meta-card status-${status}`}>
                <div className="meta-header">
                  <div className="meta-icon">
                    {tipoMeta?.label.split(' ')[0] || '🎯'}
                  </div>
                  <div className="meta-info">
                    <h3>{meta.titulo}</h3>
                    <p className="meta-tipo">{tipoMeta?.label || meta.tipo}</p>
                  </div>
                  {meta.concluida && (
                    <div className="meta-badge concluida">✅ Concluída</div>
                  )}
                </div>

                <div className="meta-progress">
                  <div className="progress-info">
                    <div className="progress-values">
                      <span className="valor-atual">
                        R$ {progresso.valorAtual.toFixed(2)}
                      </span>
                      <span className="valor-meta">
                        de R$ {progresso.valorMeta.toFixed(2)}
                      </span>
                    </div>
                    <div className="progress-percent">
                      {progresso.percentual.toFixed(1)}%
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progresso.percentual}%` }}
                    />
                  </div>
                  {progresso.restante > 0 && (
                    <div className="progress-restante">
                      Faltam R$ {progresso.restante.toFixed(2)} para alcançar a meta
                    </div>
                  )}
                </div>

                <div className="meta-details">
                  <div className="meta-detail">
                    <span className="label">Período:</span>
                    <span className="value">
                      {periodos.find(p => p.value === meta.periodo)?.label || meta.periodo}
                    </span>
                  </div>
                  {meta.categoria && (
                    <div className="meta-detail">
                      <span className="label">Categoria:</span>
                      <span className="value">{meta.categoria}</span>
                    </div>
                  )}
                  {contaMeta && (
                    <div className="meta-detail">
                      <span className="label">Conta:</span>
                      <span className="value">
                        {contaMeta.icone} {contaMeta.nome}
                      </span>
                    </div>
                  )}
                  <div className="meta-detail">
                    <span className="label">Início:</span>
                    <span className="value">
                      {moment(meta.data_inicio).format('DD/MM/YYYY')}
                    </span>
                  </div>
                  {meta.data_fim && (
                    <div className="meta-detail">
                      <span className="label">Término:</span>
                      <span className="value">
                        {moment(meta.data_fim).format('DD/MM/YYYY')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="meta-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(meta)}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(meta.id)}
                  >
                    🗑️ Deletar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Metas;

