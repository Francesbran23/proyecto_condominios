import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api';
import logo from '../img/logo2.png';

function Formulario() {
    const [formulario, setFormulario] = useState({
      correo_administrador: '',
      contraseña_administrador: ''
    });
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    
    const [errorCorreo, setErrorCorreo] = useState('');
    const [errorContraseña, setErrorContraseña] = useState('');

    const handleChange = event => {
      const { name, value } = event.target;
      setFormulario(prevState => ({ ...prevState, [name]: value }));

      if (name === 'correo_administrador') {
        if (value.trim() === '') {
          setErrorCorreo('*Ingrese un correo electrónico');
        } else {
          setErrorCorreo('');
        }
      }
    
      // Validación de contraseña
      if (name === 'contraseña_administrador') {
        if (value.trim() === '') {
          setErrorContraseña('*Ingrese una contraseña');
        } else {
          setErrorContraseña('');
        }
      }
    };
    
    const handleSubmit = async event => {
      event.preventDefault();

      if (formulario.correo_administrador.trim() === '') {
        setErrorCorreo('*Ingrese un correo electrónico');
      }
      if (formulario.contraseña_administrador.trim() === '') {
        setErrorContraseña('*Ingrese una contraseña');
      }
      if (formulario.correo_administrador.trim() !== '' && formulario.contraseña_administrador.trim() !== '') {
        try {
          const resultado = await axios.post('/api/getAdmin', formulario);
          if (resultado.data?.token) {
            window.sessionStorage.setItem('authToken', resultado.data.token);
            navigate('/MenuPrincipal', { replace: true });
          } else {
            setVisible(true);
          }
        } catch (error) {
          console.error(error);
          alert('Error al enviar los datos');
        }
      }
    };
    
    return (
          <form onSubmit={handleSubmit}>
            <div className='divCenter'>
              <img className='imgLogo' src={logo} alt="Logo de la empresa" />
            </div>
            <h1>Bureau-Manager</h1>
            <h2>Iniciar Sesión</h2>
            <div className="form-group">
            <input
                type="email"
                id="correo_administrador"
                name="correo_administrador"
                placeholder="Correo Electrónico"
                value={formulario.correo_administrador}
                onChange={handleChange}
              />
            {<div className="error-message">{errorCorreo}</div>}
            </div>
            <div className="form-group">
            <input
                type="password"
                id="contraseña_administrador"
                name="contraseña_administrador"
                placeholder="Contraseña"
                value={formulario.contraseña_administrador}
                onChange={handleChange}
              />
            {<div className="error-message">{errorContraseña}</div>}
            </div>
            <button type="submit">Iniciar Sesión</button>
            <div className="error-message" style={{ display: visible ? 'block' : 'none' }}>Correo electrónico o contraseña incorrectos</div>
            <p><Link to="/RecuperarContrasena">Olvidé mi contraseña</Link></p>
            <p>¿No te has registrado? <Link to="/RegistrarCuenta">Crear Cuenta</Link></p>
          </form>   
    );
  }
  export default Formulario;
  
