import { useState } from 'react'
import { supabase } from './supabaseClient'

function FingerprintReader() {
  const [scanning, setScanning] = useState(false)
  const [matchedUser, setMatchedUser] = useState(null)
  const [error, setError] = useState('')

  const getInitials = (name) => {
    if (!name) return '??'
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const simulateScan = async () => {
    setScanning(true)
    setMatchedUser(null)
    setError('')

    const { data: fingerprints } = await supabase
      .from('usuarios')
      .select('huella_id')
      .not('huella_id', 'is', null)

    const ids = fingerprints
      ? fingerprints.filter(u => u.huella_id).map(u => u.huella_id)
      : []

    if (ids.length === 0) {
      setError('No hay huellas registradas. Ve al Panel Admin para registrar una.')
      setScanning(false)
      return
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    const randomId = ids[Math.floor(Math.random() * ids.length)]

    const { data: user } = await supabase
      .from('usuarios')
      .select('*')
      .eq('huella_id', randomId)
      .maybeSingle()

    if (user) {
      setMatchedUser(user)
    } else {
      setError('No se encontró un usuario con esa huella.')
    }

    setScanning(false)
  }

  return (
    <section className="admin-section fingerprint-section">
      <div className="admin-card fingerprint-card">
        <h2 className="admin-title">Lector de Huella</h2>
        <p className="admin-subtitle">
          Presiona el botón para simular la lectura de una huella digital.
        </p>

        <div className="fingerprint-reader-area">
          <button
            className={`fingerprint-btn ${scanning ? 'scanning' : ''}`}
            onClick={simulateScan}
            disabled={scanning}
          >
            <svg
              className="fingerprint-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 0 0-10 10c0 1.5.33 2.93.92 4.22" />
              <path d="M12 6a6 6 0 0 0-6 6c0 .9.16 1.76.46 2.56" />
              <path d="M12 10a2 2 0 0 0-2 2c0 .3.04.59.12.87" />
              <path d="M19.08 16.22A10 10 0 0 0 22 12a10 10 0 0 0-10-10" />
              <path d="M17.54 14.56A6 6 0 0 0 18 12a6 6 0 0 0-6-6" />
              <path d="M13.88 12.87A2 2 0 0 0 14 12a2 2 0 0 0-2-2" />
              <path d="M12 22a10 10 0 0 0 10-10" />
              <path d="M12 18a6 6 0 0 0 5.08-2.78" />
              <path d="M12 14a2 2 0 0 0 1.39-.56" />
              <path d="M2 12a10 10 0 0 0 10 10" />
              <path d="M6.92 15.22A6 6 0 0 0 12 18" />
              <path d="M10.61 13.44A2 2 0 0 0 12 14" />
            </svg>
            <span className="fingerprint-label">
              {scanning ? 'Escaneando...' : 'Leer Huella'}
            </span>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <span className="alert-text">{error}</span>
          </div>
        )}

        {matchedUser && (
          <div className="fingerprint-result">
            <div className="fingerprint-result-header">
              <span className="badge">Acceso Concedido</span>
            </div>
            <div className="fingerprint-user-card">
              <div className="fingerprint-user-avatar">
                {matchedUser.imagen ? (
                  <img src={matchedUser.imagen} alt={matchedUser.nombre} />
                ) : (
                  getInitials(matchedUser.nombre)
                )}
              </div>
              <div className="fingerprint-user-info">
                <h3 className="fingerprint-user-name">{matchedUser.nombre}</h3>
                <span className="admin-badge-code">{matchedUser.codigo}</span>
                <p className="fingerprint-user-id">
                  Huella ID: <strong>{matchedUser.huella_id}</strong>
                </p>
                {matchedUser.created_at && (
                  <p className="fingerprint-user-date">
                    Registrado: {new Date(matchedUser.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default FingerprintReader
