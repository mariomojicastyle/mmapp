import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // <--- Aquí está la magia: Importamos tu nuevo App
import './index.css'

// Renderizamos App dentro de StrictMode.
// NOTA: El AuthProvider y el Router ya están DENTRO de App.jsx, 
// así que no necesitamos ponerlos aquí.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)