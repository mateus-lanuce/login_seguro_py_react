import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../lib/api'

export default function Enable2FA() {
  const [setupData, setSetupData] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSetup = async () => {
      try {
        const response = await api.post('/api/enable-2fa')
        setSetupData(response.data)
      } catch (err) {
        setError('Não foi possível iniciar o 2FA. Pode já estar habilitado ou você não está logado.')
      } finally {
        setLoading(false)
      }
    }
    fetchSetup()
  }, [])

  const handleConfirm = async (e) => {
    e.preventDefault()
    setError('')
    setVerifying(true)

    try {
      await api.post('/api/confirm-2fa', { totp_code: code })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Código inválido. Tente novamente.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return <div className="text-slate-600">Inicializando configuração segura...</div>

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-slate-200">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Configurar App Autenticador</h1>
        <p className="mt-2 text-slate-600">Escaneie o QR Code abaixo usando Google Authenticator, Authy ou similar.</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {setupData && (
        <div className="space-y-6">
          <div className="flex justify-center p-4 bg-white border border-slate-200 rounded-xl">
            <QRCodeSVG value={setupData.qr_uri} size={200} />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-600">Ou insira este segredo manualmente:</p>
            <p className="font-mono bg-slate-100 py-2 px-4 rounded border border-slate-200 tracking-wider">
              {setupData.secret}
            </p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Digite o código de 6 dígitos</label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 text-center tracking-widest text-xl font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                placeholder="000000"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2 px-4 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="flex-1 py-2 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50"
              >
                {verifying ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
