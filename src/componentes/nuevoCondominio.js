import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';


function NuevoCondominio() {
  const [formulario, setFormulario] = useState({
    nombre_condominio: '',
    direccion_condominio: ''
  });

  const [errorNombre, setErrorNombre] = useState('');
  const [errorDireccion, setErrorDireccion] = useState('');

  const [visible, setVisible] = useState(false);

  const handleChange = event => {
    const { name, value } = event.target;
    setFormulario(prevState => ({ ...prevState, [name]: value }));
    if (name === 'nombre_condominio') {
      if (value.trim() === '') {
        setErrorNombre('*Ingrese un nombre de condominio');
      } else {
        setErrorNombre('');
      }
    }
    // Validación de contraseña
    if (name === 'direccion_condominio') {
      if (value.trim() === '') {
        setErrorDireccion('*Ingrese una direccion de condominio');
      } else {
        setErrorDireccion('');
      }
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (formulario.nombre_condominio.trim() === '') {
      setErrorNombre('*Ingrese un nombre de condominio');
    }
    if (formulario.direccion_condominio.trim() === '') {
      setErrorDireccion('*Ingrese una direccion de condominio');
    }
    if (formulario.nombre_condominio.trim() !== '' && formulario.direccion_condominio.trim() !== '') {
      try {
        const resultado = await axios.post('http://localhost:4001/api/registrarCondominio', formulario);
        if (resultado.data === 200) {
          setVisible(true);
          setFormulario({ nombre_condominio: '', direccion_condominio: '' });
        } else {
          alert(resultado.data);
        }
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.error || 'Error al registrar el condominio');
      }
    }
  };

    return (
          <form onSubmit={handleSubmit}>
            <h1>Registro de nuevo Condominio</h1>
            <div className="form-group">
              <label className='labelInput'>Nombre del condominio: </label>
              <input
                type="text"
                id="nombre_condominio"
                name="nombre_condominio"
                placeholder="Nombre del Condominio"
                value={formulario.nombre_condominio}
                onChange={handleChange}
              />
            {<div className="error-message">{errorNombre}</div>}
            </div>
            <div className="form-group">
              <label className='labelInput'>Direccion del condominio: </label>
              <input
                type="text"
                id="direccion_condominio"
                name="direccion_condominio"
                placeholder="Direccion del Condominio"
                value={formulario.direccion_condominio}
                onChange={handleChange}
              />
            {<div className="error-message">{errorDireccion}</div>}
            </div>
            <div className="botones-container">
              <Link to="/EdicionyRegistro">
                <button type="button" className="mi-boton2">Regresar</button>
              </Link>
            <button className="mi-boton2" type='submit'>Registrar</button>
            </div>
            <div className='Aceptado' style={{ display: visible ? 'block' : 'none' }}>Registro exitoso</div>
          </form>   
    );
  }
  export default NuevoCondominio;
  
