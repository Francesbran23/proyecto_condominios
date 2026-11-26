import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api';
import { createRealtimeClient } from '@neon/realtime/client';

function formatReceiptDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }
  return String(value ?? '').slice(0, 10);
}

function VerRecibo() {

  const [registros, setRegistros] = useState([]);
  const [recibosSeleccionados, setRecibosSeleccionados] = useState([]);
  const [filtros, setFiltros] = useState({
    inquilino: '',
    fecha: '',
    concepto: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [accionProcesando, setAccionProcesando] = useState('');
  const [estadoRealtime, setEstadoRealtime] = useState('connecting');
  const [errorRealtime, setErrorRealtime] = useState('');


  useEffect(() => {
    let active = true;
    let client;
    let subscription;
    let stopListening;
    let renewalTimer;

    const renewQuery = async () => {
      try {
        const { data } = await axios.post('/api/recibos/live');
        if (!active || !subscription) return;
        await subscription.renew(data.sealedQuery);
        scheduleRenewal(data.sealedQuery);
      } catch (error) {
        if (!active) return;
        setEstadoRealtime('error');
        setErrorRealtime(error.response?.data?.error || 'No se pudo renovar la conexión en vivo.');
      }
    };

    const scheduleRenewal = sealedQuery => {
      window.clearTimeout(renewalTimer);
      renewalTimer = window.setTimeout(
        renewQuery,
        Math.max(1000, sealedQuery.expiresAt - Date.now() - 15000)
      );
    };

    const startRealtime = async () => {
      const { data } = await axios.post('/api/recibos/live');
      if (!active) return;
      if (!data.realtimeUrl || !data.sealedQuery) {
        throw new Error('Neon Realtime devolvió una configuración incompleta.');
      }
      client = createRealtimeClient({ url: data.realtimeUrl, logLevel: 'error' });
      subscription = client.subscribe(data.sealedQuery);
      stopListening = subscription.onChange(({ data: liveRows, status, error }) => {
        if (!active) return;
        setEstadoRealtime(status);
        if (error) {
          setErrorRealtime('La conexión en vivo está temporalmente indisponible.');
        } else {
          setErrorRealtime('');
        }
        if (Array.isArray(liveRows)) setRegistros(liveRows);
      });
      scheduleRenewal(data.sealedQuery);
    };

    axios.get('/api/getRecibos')
      .then(({ data }) => {
        if (active) setRegistros(data);
      })
      .catch(error => {
        console.error('Error al obtener los recibos:', error);
        if (active) setErrorEnvio('No se pudieron cargar los recibos. Inténtalo de nuevo.');
      });
    startRealtime().catch(error => {
      console.error('Error al iniciar Neon Realtime:', error);
      if (active) {
        setEstadoRealtime('error');
        setErrorRealtime(error.response?.data?.error || error.message || 'No se pudo iniciar la actualización en vivo.');
      }
    });

    return () => {
      active = false;
      window.clearTimeout(renewalTimer);
      if (stopListening) stopListening();
      if (subscription) subscription.unsubscribe();
      if (client) client.close();
    };
  }, []);

  const handleDownloadPdf = async receiptId => {
    setMensaje('');
    setErrorEnvio('');
    try {
      const response = await axios.get(`/api/recibos/${receiptId}/pdf`, { responseType: 'blob' });
      const fileURL = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `recibo-${receiptId}.pdf`;
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(fileURL), 1000);
      setMensaje(`Se descargó el recibo ${receiptId} y se guardó una copia privada en Neon Storage.`);
    } catch (error) {
      console.error('Error al descargar recibo desde Neon Storage:', error);
      setErrorEnvio(error.response?.data?.error || 'No se pudo guardar o descargar el PDF. Verifica la configuración de Neon Storage.');
    }
  };
  

  const handleSubmit = async event => {
    event.preventDefault();
    const submitButton = event.nativeEvent.submitter;
    const buttonValue = submitButton?.value;
    if (recibosSeleccionados.length === 0) {
      alert('Selecciona al menos un recibo.');
      return;
    }
    setMensaje('');
    setErrorEnvio('');
    setProcesando(true);
    setAccionProcesando(buttonValue);

    try {
      if (buttonValue === 'correo') {
        const resultado = await axios.post(
          '/api/enviarRecibosCorreoElectronico',
          recibosSeleccionados
        );
        const cantidadEnviada = resultado.data.sent;
        setMensaje(`Se enviaron ${cantidadEnviada} ${cantidadEnviada === 1 ? 'recibo' : 'recibos'} correctamente.`);
      } else {
        const response = await axios.post(
          '/api/generarPDFMasivo',
          recibosSeleccionados,
          { responseType: 'blob' }
        );
        const fileURL = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = 'recibos.pdf';
        link.click();
        window.setTimeout(() => window.URL.revokeObjectURL(fileURL), 1000);
        setMensaje('El PDF de recibos se descargó correctamente.');
      }
      setRecibosSeleccionados([]);
    } catch (error) {
      console.error(error);
      setErrorEnvio(
        error.response?.data?.error ||
        (buttonValue === 'correo' ? 'Error al enviar los recibos por correo.' : 'Error al crear el PDF.')
      );
    } finally {
      setProcesando(false);
      setAccionProcesando('');
    }
  };


  const handleCheckboxChange = (reciboId) => {
    if (recibosSeleccionados.includes(reciboId)) {
      // Si el recibo ya está seleccionado, se remueve de la lista
      setRecibosSeleccionados(prevState => prevState.filter(id => id !== reciboId));
    } else {
      // Si el recibo no está seleccionado, se agrega a la lista
      setRecibosSeleccionados(prevState => [...prevState, reciboId]);
    }
  };
  
  const handleMarkPaid = async recibo => {
    if (!window.confirm(`¿Confirmas que el recibo ${recibo.no_recibo} ya fue pagado?`)) {
      return;
    }

    try {
      const response = await axios.post('/api/marcarReciboPagado', {
        id_recibo: recibo.id_recibo,
      });
      setRegistros(prevRegistros => prevRegistros.map(registro => (
        registro.id_recibo === recibo.id_recibo
          ? { ...registro, ...response.data }
          : registro
      )));
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Error al actualizar el estado del recibo');
    }
  };

  const inquilinos = [...new Set(registros.map(recibo => recibo.nombre_completo_inquilino))]
    .sort((a, b) => a.localeCompare(b, 'es'));
  const conceptos = [...new Set(registros.map(recibo => recibo.concepto_pago))]
    .sort((a, b) => a.localeCompare(b, 'es'));
  const registrosFiltrados = registros.filter(recibo => (
    (!filtros.inquilino || recibo.nombre_completo_inquilino === filtros.inquilino) &&
    (!filtros.fecha || formatReceiptDate(recibo.fecha) === filtros.fecha) &&
    (!filtros.concepto || recibo.concepto_pago === filtros.concepto)
  ));


  let opcionesRegistro;
  if (registros.length === 0) {
    opcionesRegistro = <h2>No hay registros disponibles</h2>;
  } else if (registrosFiltrados.length === 0) {
    opcionesRegistro = <h2>No hay recibos que coincidan con los filtros</h2>;
  } else {
    opcionesRegistro = registrosFiltrados.map(c => (
  <tr key={c.id_recibo}>
    <td>{c.nombre_completo_inquilino}</td>
    <td>{formatReceiptDate(c.fecha)}</td>
    <td>{c.no_recibo}</td>
    <td>{c.concepto_pago}</td>
    <td>{c.total_pagar}</td>
    <td>
      <span className={`estado-recibo ${c.estado_pago === 'pagado' ? 'estado-pagado' : 'estado-pendiente'}`}>
        {c.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
      </span>
      {c.estado_pago !== 'pagado' && (
        <button
          type="button"
          className="button-marcar-pagado"
          onClick={() => handleMarkPaid(c)}
        >
          Marcar como pagado
        </button>
      )}
    </td>
    <td>
      <button type="button" onClick={() => handleDownloadPdf(c.id_recibo)}>
        Descargar PDF
      </button>
    </td>
    <td>
      <input
        type="checkbox"
        onChange={() => handleCheckboxChange(c.id_recibo)}
        checked={recibosSeleccionados.includes(c.id_recibo)}
      />
    </td>
  </tr>
));
  }
    return (
        <div className='div-contenedor '>
          <form className="fromRecibo" onSubmit={handleSubmit}>
            <h2>Seleccione los Recibos a enviar</h2>
            <p className="recibos-resumen" role="status">
              Recibos en vivo: {estadoRealtime === 'live' ? 'conectado' : estadoRealtime}
            </p>
            {errorRealtime && <div className="error-message" role="alert">{errorRealtime}</div>}

            <div className="recibos-filtros" aria-label="Filtros de recibos">
              <div className="select-item">
                <label htmlFor="filtro-inquilino">Inquilino</label>
                <select
                  id="filtro-inquilino"
                  value={filtros.inquilino}
                  onChange={event => setFiltros(prev => ({ ...prev, inquilino: event.target.value }))}
                >
                  <option value="">Todos los inquilinos</option>
                  {inquilinos.map(inquilino => (
                    <option key={inquilino} value={inquilino}>{inquilino}</option>
                  ))}
                </select>
              </div>
              <div className="select-item">
                <label htmlFor="filtro-fecha">Fecha</label>
                <input
                  id="filtro-fecha"
                  type="date"
                  value={filtros.fecha}
                  onChange={event => setFiltros(prev => ({ ...prev, fecha: event.target.value }))}
                />
              </div>
              <div className="select-item">
                <label htmlFor="filtro-concepto">Concepto de pago</label>
                <select
                  id="filtro-concepto"
                  value={filtros.concepto}
                  onChange={event => setFiltros(prev => ({ ...prev, concepto: event.target.value }))}
                >
                  <option value="">Todos los conceptos</option>
                  {conceptos.map(concepto => (
                    <option key={concepto} value={concepto}>{concepto}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="button-release"
                onClick={() => setFiltros({ inquilino: '', fecha: '', concepto: '' })}
                disabled={!filtros.inquilino && !filtros.fecha && !filtros.concepto}
              >
                Limpiar filtros
              </button>
            </div>
            <p className="recibos-resumen" aria-live="polite">
              Mostrando {registrosFiltrados.length} de {registros.length} recibos
              {recibosSeleccionados.length > 0 && ` · ${recibosSeleccionados.length} seleccionados`}
            </p>

            <table>
                <thead>
                  <tr>
                    <th>Inquilino</th>
                    <th>Fecha</th>
                    <th>No. de Recibo</th>
                    <th>Concepto de Pago</th>
                    <th>Total de Pago</th>
                    <th>Estado</th>
                    <th>PDF privado</th>
                    <th>Seleccionar:</th>
                  </tr>
                </thead>
                <tbody>
                {opcionesRegistro}
                </tbody>
            </table>
            {mensaje && <div className="Aceptado" role="status">{mensaje}</div>}
            {errorEnvio && <div className="error-message" role="alert">{errorEnvio}</div>}
            <div className='select-container'>
            <div className="botones-container"> 
              <Link to="/MenuPrincipal">
                <button type="button" className="mi-boton2">Regresar</button>
              </Link>
            <button className="mi-boton2" type='submit' value="correo" disabled={procesando}>
              {procesando && accionProcesando === 'correo' ? 'Enviando...' : 'Enviar por Correo'}
            </button>
            <button className="mi-boton2" type='submit' value="PDF" disabled={procesando}>
              {procesando && accionProcesando === 'PDF' ? 'Generando...' : 'Hacer PDF de Recibos'}
            </button>
            </div>
            </div>
          </form>   
        </div>
    );
  }
  export default VerRecibo;
  
