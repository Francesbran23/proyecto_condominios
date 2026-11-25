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
                <Link to="/Asistente">
                    <button className="mi-boton">Asistente</button>
                </Link>
            </div>
            <div className="botones-container">
              <button
                type="button"
                onClick={() => {
                  window.sessionStorage.removeItem('authToken');
                  window.location.assign('/');
                }}
              >
                Cerrar Sesión
              </button>
            </div>

          </form>   
    );
  }
  export default MenuInicial;
  
