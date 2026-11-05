import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';


function VerRecibo() {

  const [registros, setRegistros] = useState([]);
  const [recibosSeleccionados, setRecibosSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [accionProcesando, setAccionProcesando] = useState('');


  useEffect(() => {
    axios.get('http://localhost:4001/api/getRecibos')
      .then(response => {
        if(response.data.length === 0){
          setRegistros([]);
        }
        else{
          setRegistros(response.data);
        }})
      .catch(error => {
        console.log(error);
        alert('Error al obtener los recibos');
      });
  }, []);
  

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
          'http://localhost:4001/api/enviarRecibosCorreoElectronico',
          recibosSeleccionados
        );
        const cantidadEnviada = resultado.data.sent;
        setMensaje(`Se enviaron ${cantidadEnviada} ${cantidadEnviada === 1 ? 'recibo' : 'recibos'} correctamente.`);
      } else {
        const response = await axios.post(
          'http://localhost:4001/api/generarPDFMasivo',
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
      const response = await axios.post('http://localhost:4001/api/marcarReciboPagado', {
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


  let opcionesRegistro;
  if (registros.length === 0) {
    opcionesRegistro = <h2>No hay registros disponibles</h2>;
  } else {
    opcionesRegistro = registros.map(c => (
  <tr key={c.id_recibo}>
    <td>{c.nombre_completo_inquilino}</td>
    <td>{c.fecha}</td>
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

            <table>
                <thead>
                  <tr>
                    <th>Inquilino</th>
                    <th>Fecha</th>
                    <th>No. de Recibo</th>
                    <th>Concepto de Pago</th>
                    <th>Total de Pago</th>
                    <th>Estado</th>
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
  
