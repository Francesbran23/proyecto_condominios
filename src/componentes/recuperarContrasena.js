import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function RecuperarContrasena() {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setMensaje('');
    setError('');
    setProcesando(true);

    try {
      const resultado = await axios.post(
        'http://localhost:4001/api/solicitarRestablecimiento',
        { correo_administrador: correo }
      );
      setMensaje(resultado.data.message);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || 'No se pudo procesar la solicitud. Inténtalo más tarde.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Recuperar contraseña</h1>
      <p>Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.</p>
      <div className="form-group">
        <label htmlFor="correo_recuperacion">Correo electrónico</label>
        <input
          type="email"
          id="correo_recuperacion"
          name="correo_administrador"
          autoComplete="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={event => setCorreo(event.target.value)}
          required
        />
      </div>
      {mensaje && <div className="Aceptado" role="status">{mensaje}</div>}
      {error && <div className="error-message" role="alert">{error}</div>}
      <button type="submit" disabled={procesando}>
        {procesando ? 'Enviando...' : 'Enviar enlace'}
      </button>
      <p><Link to="/">Volver a iniciar sesión</Link></p>
    </form>
  );
}

export default RecuperarContrasena;
