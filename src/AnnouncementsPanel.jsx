import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AnnouncementsPanel({ user }) {
  const isAdmin = user?.codigo === '1212'
  const [anuncios, setAnuncios] = useState([])
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const cargarAnuncios = async () => {
    const { data } = await supabase.from('anuncios').select('*').order('id', { ascending: false })
    if (data) setAnuncios(data)
  }

  useEffect(() => {
    cargarAnuncios()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !contenido.trim()) {
      setMsg({ type: 'error', text: 'Completa el título y el contenido del anuncio.' })
      return
    }

    setLoading(true)
    setMsg({})

    const { error } = await supabase
      .from('anuncios')
      .insert({ titulo: titulo.trim(), contenido: contenido.trim() })

    if (error) {
      setMsg({ type: 'error', text: 'Error al guardar: ' + error.message })
      setLoading(false)
      return
    }

    setMsg({ type: 'success', text: 'Anuncio publicado correctamente.' })
    setTitulo('')
    setContenido('')
    setLoading(false)
    cargarAnuncios()
  }

  const eliminarAnuncio = async (id) => {
    const { error } = await supabase.from('anuncios').delete().eq('id', id)
    if (!error) {
      setAnuncios(anuncios.filter(a => a.id !== id))
      setMsg({ type: 'success', text: 'Anuncio eliminado.' })
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-card">
        <h2 className="admin-title">Anuncios</h2>
        {isAdmin && <p className="admin-subtitle">Crea y gestiona anuncios para los miembros del gimnasio.</p>}

        {isAdmin && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="anun-titulo">Título</label>
            <input
              id="anun-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Nueva clase de Yoga"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="anun-contenido">Contenido</label>
            <textarea
              id="anun-contenido"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe el anuncio aquí..."
              disabled={loading}
              rows={4}
              style={{
                fontFamily: 'var(--font-sans)',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(148,163,184,0.15)',
                borderRadius: '10px',
                padding: '0.9rem 1rem',
                color: '#ffffff',
                fontSize: '1rem',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                outline: 'none',
                resize: 'vertical',
                width: '100%'
              }}
            />
          </div>

          {msg.text && (
            <div className={`alert ${msg.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
              <span className="alert-text">{msg.text}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <><span className="spinner"></span> Publicando...</> : 'Publicar Anuncio'}
          </button>
        </form>
        )}
      </div>

      <div className="admin-card">
        <h3 className="admin-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Anuncios Publicados ({anuncios.length})</h3>

        {anuncios.length === 0 ? (
          <div className="admin-empty">No hay anuncios publicados.</div>
        ) : (
          <div className="anuncios-grid">
            {anuncios.map((a, i) => (
              <div key={a.id} className="anuncio-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="anuncio-card-accent"></div>
                <div className="anuncio-card-body">
                  <div className="anuncio-card-header">
                    <h4 className="anuncio-card-title">{a.titulo}</h4>
                    {isAdmin && (
                      <button
                        className="anuncio-delete-btn"
                        onClick={() => eliminarAnuncio(a.id)}
                        title="Eliminar anuncio"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="anuncio-card-content">{a.contenido}</p>
                  <div className="anuncio-card-footer">
                    <span className="anuncio-card-date">
                      {a.created_at
                        ? new Date(a.created_at).toLocaleDateString('es-MX', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default AnnouncementsPanel
