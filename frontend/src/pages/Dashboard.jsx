import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, LogOut } from 'lucide-react'
import api from '../lib/api'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/api/me')
        setUser(response.data)
      } catch (err) {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await api.post('/api/logout')
    } catch (err) {
      console.error(err)
    } finally {
      // Clear all state and redirect
      setUser(null)
      // Force reload to completely clear any memory cache as per secure web skills
      window.location.href = '/login'
    }
  }

  if (loading) return <div className="text-slate-600">Carregando ambiente seguro...</div>

  if (!user) return null

  return (
    <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow-lg border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-green-600 w-8 h-8" />
          Dashboard Seguro
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      <div className="py-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Visão Geral da Conta</h2>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Autenticado como</p>
          <p className="font-mono text-slate-900 bg-slate-200 inline-block px-2 py-1 rounded">
            {user.email}
          </p>
        </div>
      </div>

      <div className="py-4 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Configurações de Segurança</h2>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="font-medium text-slate-900">Autenticação em Duas Etapas (2FA)</p>
            <p className="text-sm text-slate-600">
              {user.totp_enabled
                ? 'Sua conta está protegida com 2FA.'
                : 'Adicione uma camada extra de segurança à sua conta.'}
            </p>
          </div>
          {!user.totp_enabled && (
            <button
              onClick={() => navigate('/enable-2fa')}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Habilitar 2FA
            </button>
          )}
          {user.totp_enabled && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">
              Ativo
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
