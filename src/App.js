import React from 'react';
import { BrowserRouter as Router,Routes, Route } from 'react-router-dom';
import './App.css';
import Formulario from './componentes/iniciosesion.js';
import RegistrarCuenta from './componentes/registroCuenta.js';
import MenuInicial from './componentes/menuInicial.js';
import EdicionyRegistro from "./componentes/edicionyRegistro.js";
import NuevoCondominio from "./componentes/nuevoCondominio.js";
import EditoCondominio from "./componentes/edicionCondominio.js";
import NuevoEdificio from "./componentes/nuevoEdificio.js";
import EditoEdificio from "./componentes/edicionEdificio.js";
import NuevoDepartamento from "./componentes/nuevoDepa.js";
import EditoDepartamento from "./componentes/edicionDepa.js";
import NuevoInquilino from "./componentes/nuevoInquilino.js";
import MenuInquilino from "./componentes/menuInquilino.js";
import EditoInquilino from "./componentes/edicionInquilino.js";
import NuevoRecibo from "./componentes/nuevoRecibo.js";
import VerRecibo from "./componentes/verRecibos.js";



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Formulario />}  />
        <Route path="/RegistrarCuenta" element={<RegistrarCuenta />}  />
        <Route path="/MenuPrincipal" element={<MenuInicial />}  />
        <Route path="/EdicionyRegistro" element={<EdicionyRegistro />}  />
        <Route path="/NuevoCondominio" element={<NuevoCondominio />}  />
        <Route path="/EditoCondominio" element={<EditoCondominio />}  />
        <Route path="/NuevoEdificio" element={<NuevoEdificio />}  />
        <Route path="/EditoEdificio" element={<EditoEdificio />}  />
        <Route path="/NuevoDepartamento" element={<NuevoDepartamento />}  />
        <Route path="/EditoDepartamento" element={<EditoDepartamento />}  />
        <Route path="/NuevoInquilino" element={<NuevoInquilino />}  />
        <Route path="/MenuInquilino" element={<MenuInquilino />}  />
        <Route path="/EditoInquilino" element={<EditoInquilino />}  />
        <Route path="/NuevoRecibo" element={<NuevoRecibo />}  />
        <Route path="/VerRecibo" element={<VerRecibo />}  />
      </Routes>
    </Router>
  );
}

export default App;





