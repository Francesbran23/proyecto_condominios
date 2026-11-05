import React from 'react';
import { Link } from 'react-router-dom';

function MenuInicial() {
    return (
          <form className='fromMenu'>
            <h1>Menu Principal</h1>
            <div className="botones-container">
                <Link to="/VerRecibo">
                    <button className="mi-boton">Enviar Recibos</button>
                </Link>
                <Link to="/EdicionyRegistro">
                    <button className="mi-boton">Registrar un nuevo Condominio/Edificio/Departamento</button>
                </Link>
            </div>
            <div className="botones-container">
                <Link to="/NuevoRecibo">
                    <button className="mi-boton">Crear un recibo</button>
                </Link>
                <Link to="/MenuInquilino">
                    <button className="mi-boton">Administrar Inquilinos</button>
                </Link>
            </div>
            <div className="botones-container">
            <Link to="/">
            <button type="submit">Cerrar Sesion</button>
            </Link>
            </div>

          </form>   
    );
  }
  export default MenuInicial;
  
