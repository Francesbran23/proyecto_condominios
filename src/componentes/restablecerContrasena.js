import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setMensaje('');
    setError('');
    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setProcesando(true);
    try {
      const resultado = await axios.post(
        'http://localhost:4001/api/restablecerContrasena',
        { token, contraseña_administrador: contrasena }
      );
      setMensaje(resultado.data.message);
      setContrasena('');
      setConfirmacion('');
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || 'No se pudo restablecer la contraseña. Inténtalo más tarde.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Crear contraseña nueva</h1>
      {!token && <div className="error-message" role="alert">El enlace no es válido. Solicita uno nuevo.</div>}
      <div className="form-group">
        <label htmlFor="nueva_contrasena">Nueva contraseña</label>
        <input
          type="password"
          id="nueva_contrasena"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          placeholder="Mínimo 8 caracteres"
          value={contrasena}
          onChange={event => setContrasena(event.target.value)}
          required
          disabled={!token || Boolean(mensaje)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="confirmar_contrasena">Confirmar contraseña</label>
        <input
          type="password"
          id="confirmar_contrasena"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          placeholder="Confirma tu nueva contraseña"
          value={confirmacion}
          onChange={event => setConfirmacion(event.target.value)}
          required
          disabled={!token || Boolean(mensaje)}
        />
      </div>
      {mensaje && <div className="Aceptado" role="status">{mensaje}</div>}
      {error && <div className="error-message" role="alert">{error}</div>}
      {!mensaje && (
        <button type="submit" disabled={!token || procesando}>
          {procesando ? 'Guardando...' : 'Guardar contraseña nueva'}
        </button>
      )}
      <p><Link to="/">Volver a iniciar sesión</Link></p>
    </form>
  );
}

export default RestablecerContrasena;
