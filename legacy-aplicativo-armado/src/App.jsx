import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Páginas
import AssemblyPage from './pages/AssemblyPage'

function App() {
  const basename = window.location.pathname.startsWith('/embed/armado') ? '/embed/armado' : '';

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<Navigate to="/M00001" />} />
        <Route path="/:id" element={<AssemblyPage />} />
      </Routes>
    </Router>
  )
}

export default App