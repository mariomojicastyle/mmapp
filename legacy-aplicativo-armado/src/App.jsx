import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Páginas
import AssemblyPage from './pages/AssemblyPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/M01536" />} />
        <Route path="/:id" element={<AssemblyPage />} />
      </Routes>
    </Router>
  )
}

export default App