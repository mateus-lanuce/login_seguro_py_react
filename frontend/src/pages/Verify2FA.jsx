import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import api from '../lib/api'

export default function Verify2FA() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const tempToken = location.state?.tempToken

  useEffect(() => {
    if (!tempToken) {
      navigate('/login')
    }
  }, [tempToken, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/api/verify-2fa', 
        { totp_code: code },
        { headers: { 'X-Temp-Token': tempToken } }
      )
      // On success, redirect to dashboard. Location state is cleared implicitly on navigation.
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Código de autenticação inválido')
    } finally {
      setLoading(false)
    }
  }

  if (!tempToken) return null

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-slate-200">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-4">
          <ShieldAlert className="w-6 h-6 text-slate-900" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Autenticação em Duas Etapas</h1>
        <p className="mt-2 text-slate-600">Insira o código de 6 dígitos do seu app autenticador.</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-3 text-center tracking-widest text-2xl font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            placeholder="000000"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-2 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </form>
    </div>
  )
}
