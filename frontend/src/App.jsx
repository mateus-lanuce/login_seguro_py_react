import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Enable2FA from './pages/Enable2FA'
import Verify2FA from './pages/Verify2FA'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/enable-2fa" element={<Enable2FA />} />
          <Route path="/verify-2fa" element={<Verify2FA />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
