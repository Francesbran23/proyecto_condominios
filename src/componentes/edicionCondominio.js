import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function EditoCondominio() {
  const [formulario, setFormulario] = useState({
    id_condominio: '',
    nombre_condominio: '',
    direccion_condominio: ''
  });
  const [visible, setVisible] = useState(false);

  const [condominios, setCondominios] = useState([]);

  const [errorNombre, setErrorNombre] = useState('');
  const [errorDireccion, setErrorDireccion] = useState('');

  useEffect(() => {
    axios.get('http://localhost:4001/api/getCondominios')
      .then(response => {
        setCondominios(response.data);
        if (response.data.length > 0) {
          setFormulario({
            id_condominio: response.data[0].id_condominio,
            nombre_condominio: response.data[0].nombre_condominio,
            direccion_condominio: response.data[0].direccion_condominio
          });
        }
      })
      .catch(error => {
        console.log(error);
        alert('Error al obtener los condominios');
      });
  }, []);

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

  let opciones;
  if (condominios.length === 0) {
    opciones = <option value="Defecto">No hay condominios disponibles</option>;
  } else {
    opciones = condominios.map(
      c => <option key={c.id_condominio} value={c.id_condominio}>{c.nombre_condominio}</option>
    );
  }

  const handleChangeSelect = event => {
    const elegido=parseInt(event.target.value)
    const selectedCondominio = condominios.find(c => c.id_condominio === elegido);

    if (selectedCondominio) {
      setFormulario(prevState => ({
        ...prevState,
        id_condominio: selectedCondominio.id_condominio,
        nombre_condominio: selectedCondominio.nombre_condominio,
        direccion_condominio: selectedCondominio.direccion_condominio
      }));
    }
  };


  const handleSubmit = async event => {
    event.preventDefault();
    if (!formulario.id_condominio) {
      alert('No hay un condominio seleccionado para actualizar.');
      return;
    }
    if (formulario.nombre_condominio.trim() === '') {
      setErrorNombre('*Ingrese un nombre de condominio');
    }
    if (formulario.direccion_condominio.trim() === '') {
      setErrorDireccion('*Ingrese una direccion de condominio');
    }
    if (formulario.nombre_condominio.trim() !== '' && formulario.direccion_condominio.trim() !== '') {
    try {
      const resultado = await axios.post('http://localhost:4001/api/actualizarCondominio', formulario);
      if (resultado.data === 200) {
        setVisible(true);
      } else {
        alert(resultado.data);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Error al actualizar el condominio');
    }
    }
  };

    return (
          <form onSubmit={handleSubmit}>
            <h1>Editar Condominio</h1>
            <div className="form-group">
            <label className='labelInput'>Seleccione un condominio: </label>
            <select id="opciones" onChange={handleChangeSelect}>
                {opciones}
              </select>
            </div>
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
              <div className="error-message">{errorNombre}</div>
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
              <div className="error-message">{errorDireccion}</div>
            </div>
            <div className="botones-container">
              <Link to="/EdicionyRegistro">
                <button type="button" className="mi-boton2">Regresar</button>
              </Link>
            <button className="mi-boton2" type='submit'>Actualizar</button>
            </div>
            <div style={{ display: visible ? 'block' : 'none' }}>Actualizacion exitosa</div>
          </form>   
    );
  }
  export default EditoCondominio;
  
