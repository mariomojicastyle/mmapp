import "./style.css";
import ReactDOM from "react-dom/client";
import React from "react";
import {
  RouterProvider,
} from "react-router-dom";

import {router} from "./router/index.js";

//Se crea el root, el cual renderizara el cuerpo del elemento.
const root = ReactDOM.createRoot(document.querySelector("#root"));

//Funcion encargada de reajustar el tamaño de la ventana
window.addEventListener('resize', () => {
  root.configure({ 
    size: { width: window.innerWidth, height: window.innerHeight }, 
  })
})

root.render(
  <>

    <React.StrictMode>
      {/* Componente router, principal para el funcionamiento de la app */}
      <RouterProvider router={router} />
    </React.StrictMode>

  </>
);
