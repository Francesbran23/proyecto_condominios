import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';


function NuevoEdificio() {
  const [formulario, setFormulario] = useState({
    id_condominio: '',
    nombre_edificio: ''
  });
  const [visible, setVisible] = useState(false);
  const [condominios, setCondominios] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:4001/api/getCondominios')
      .then(response => {
        setCondominios(response.data);
        setFormulario(prevState => ({
          ...prevState,
          id_condominio: response.data[0]?.id_condominio || ''
        }));
      })
      .catch(error => {
        console.log(error);
        alert('Error al obtener los condominios');
      });
  }, []);

  const handleChange = event => {
    const { name, value } = event.target;
    setFormulario(prevState => ({ ...prevState, [name]: value }));
  };

  let opciones;
  if (condominios.length === 0) {
    opciones = <option value="Defecto">No hay condominios disponibles</option>;
  } else {
    opciones = condominios.map(c => <option key={c.id_condominio} value={c.id_condominio}>{c.nombre_condominio}</option>);
  }

  const handleChangeSelect = event => {
    const elegido=parseInt(event.target.value)
    const selectedCondominio = condominios.find(c => c.id_condominio === elegido);

    if (selectedCondominio) {
      setFormulario(prevState => ({
        ...prevState,
        id_condominio: selectedCondominio.id_condominio
      }));
    }
  };


  const handleSubmit = async event => {
    event.preventDefault();
    if (!formulario.id_condominio || !formulario.nombre_edificio.trim()) {
      alert('Selecciona un condominio e indica el nombre del edificio.');
      return;
    }
    try {
      const resultado = await axios.post('http://localhost:4001/api/registrarEdificio', formulario);
      if (resultado.data === 200) {
        setVisible(true);
      } else {
        alert(resultado.data);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Error al registrar el edificio');
    }
  };

  return (

          <form onSubmit={handleSubmit}>
            <h1>Registro de nuevo Edificio</h1>
            <div className="form-group">
            <label className='labelInput'>Seleccione un condominio: </label>
            <select id="opciones"  onChange={handleChangeSelect}>
                {opciones}
              </select>
            </div>
            <div className="form-group">
              <label className='labelInput'>Nombre del Edificio: </label>
              <input
                type="text"
                id="nombre_edificio"
                name="nombre_edificio"
                placeholder="Nombre del Edificio"
                value={formulario.nombre_edificio}
                onChange={handleChange}
              />
            </div>
            <div className="botones-container">
              <Link to="/EdicionyRegistro">
                <button type="button" className="mi-boton2">Regresar</button>
              </Link>
            <button className="mi-boton2" type='submit'>Registrar</button>
            </div>
            <div style={{ display: visible ? 'block' : 'none' }} >Registro exitoso</div>
          </form>   
    );
  }
  export default NuevoEdificio;
  
