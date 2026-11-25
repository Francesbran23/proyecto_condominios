import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api';

function Asistente() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState('');
  const [recoveryUrl, setRecoveryUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get('/api/ai/models')
      .then(({ data }) => {
        if (!active) return;
        setModels(data.models);
        setModel(data.models[0]?.id || '');
        setRecoveryUrl(data.recoveryUrl || '');
      })
      .catch(requestError => {
        if (active) setError(requestError.response?.data?.error || 'No se pudo consultar el AI Gateway.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setAnswer('');
    setSending(true);
    try {
      const { data } = await axios.post('/api/ai/assistant', { question, model });
      setAnswer(data.answer);
      setQuestion('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo obtener una respuesta del asistente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Asistente de Bureau-Manager</h1>
      <p>Resuelve dudas generales sobre el uso del sistema. No tiene acceso a recibos ni a datos de tus cuentas.</p>
      {loading && <p role="status">Consultando modelos disponibles...</p>}
      {!loading && models.length === 0 && (
        <div className="error-message" role="status">
          No hay modelos de IA habilitados en Neon.
          {recoveryUrl && <> <a href={recoveryUrl} target="_blank" rel="noreferrer">Configurar créditos en Neon Billing</a></>}
        </div>
      )}
      {models.length > 0 && (
        <>
          <div className="form-group">
            <label htmlFor="assistant-model">Modelo</label>
            <select id="assistant-model" value={model} onChange={event => setModel(event.target.value)}>
              {models.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="assistant-question">Pregunta</label>
            <textarea
              id="assistant-question"
              value={question}
              onChange={event => setQuestion(event.target.value)}
              maxLength={2000}
              rows={4}
              required
              placeholder="¿Cómo registro un recibo?"
            />
          </div>
          <button type="submit" disabled={sending || !question.trim()}>
            {sending ? 'Consultando...' : 'Preguntar'}
          </button>
        </>
      )}
      {answer && <p role="status">{answer}</p>}
      {error && <div className="error-message" role="alert">{error}</div>}
      <div className="botones-container">
        <Link to="/MenuPrincipal"><button type="button" className="button-release">Regresar</button></Link>
      </div>
    </form>
  );
}

export default Asistente;
