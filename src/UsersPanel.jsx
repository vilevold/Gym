import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function UsersPanel() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [selectedUser, setSelectedUser] = useState(null)
  const [membresia, setMembresia] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [paying, setPaying] = useState(false)
  const [previewImg, setPreviewImg] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const cargarUsuarios = async () => {
    setLoading(true)
    const { data } = await supabase.from('usuarios').select('*').order('id', { ascending: false })
    if (data) setUsuarios(data)
    setLoading(false)
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const verPerfil = async (user) => {
    setSelectedUser(user)
    setLoadingProfile(true)
    setMembresia(null)
    const { data } = await supabase
      .from('membresias')
      .select('*')
      .eq('usuario_id', user.id)
      .maybeSingle()
    if (data) setMembresia(data)
    setLoadingProfile(false)
  }

  const eliminarUsuario = async (id) => {
    if (!confirm('Estas seguro de eliminar este usuario?')) return
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (error) {
      setMsg({ type: 'error', text: 'Error al eliminar: ' + error.message })
      return
    }
    if (selectedUser?.id === id) {
      setSelectedUser(null)
      setMembresia(null)
    }
    await cargarUsuarios()
    setMsg({ type: 'success', text: 'Usuario eliminado correctamente.' })
  }

  const registrarPago = async () => {
    if (!selectedUser) return
    setPaying(true)
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('membresias')
      .upsert({ usuario_id: selectedUser.id, ultimo_pago: now }, { onConflict: 'usuario_id' })
      .select()
      .single()
    if (!error && data) {
      setMembresia(data)
      setMsg({ type: 'success', text: 'Pago registrado.' })
    }
    setPaying(false)
  }

  const calcularProximoPago = (ultimoPago) => {
    const date = new Date(ultimoPago)
    date.setMonth(date.getMonth() + 1)
    return date
  }

  const isVencido = (ultimoPago) => new Date() > calcularProximoPago(ultimoPago)
  const daysUntil = (ultimoPago) => Math.ceil((calcularProximoPago(ultimoPago) - new Date()) / (1000 * 60 * 60 * 24))

  const quitarMembresia = async () => {
    if (!selectedUser || !confirm('Quitar la membresia de "' + selectedUser.nombre + '"?')) return
    const { error } = await supabase.from('membresias').delete().eq('usuario_id', selectedUser.id)
    if (!error) {
      setMembresia(null)
      setMsg({ type: 'success', text: 'Membresia eliminada.' })
    }
  }

  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase()
  }

  if (previewImg) {
    return (
      <div className="img-modal-overlay" onClick={() => setPreviewImg(null)}>
        <div className="img-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="img-modal-close" onClick={() => setPreviewImg(null)}>✕</button>
          <img src={previewImg} alt="Foto" className="img-modal-img" />
        </div>
      </div>
    )
  }

  return (
    <section className="admin-section">
      <div className="admin-card">
        <div className="users-header">
          <div>
            <h2 className="admin-title" style={{ margin: 0 }}>Usuarios</h2>
            <p className="admin-subtitle" style={{ margin: '0.25rem 0 0' }}>
              Lista completa de usuarios registrados en el sistema.
            </p>
          </div>
          <span className="users-count">{usuarios.length} registrados</span>
        </div>

        {msg.text && (
          <div className={'alert ' + (msg.type === 'error' ? 'alert-danger' : 'alert-success')}>
            <span className="alert-text">{msg.text}</span>
          </div>
        )}

        <input
          type="text"
          className="filter-input"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <span className="spinner"></span> Cargando usuarios...
          </div>
        ) : (
          (function() {
            const filtrados = usuarios.filter(function(u) {
              return !searchTerm || u.nombre.toLowerCase().includes(searchTerm.toLowerCase())
            })
            if (filtrados.length === 0) {
              return (
                <div className="users-empty">
                  No se encontraron usuarios.
                </div>
              )
            }
            return (
              <div className="users-grid">
                {filtrados.map(function(u) {
                  return (
                    <div key={u.id} className="user-card" onClick={function() { verPerfil(u) }}>
                      <div className="user-card-avatar">
                        {u.imagen ? (
                          <img src={u.imagen} alt={u.nombre} />
                        ) : (
                          <div className="user-card-initials">
                            {u.nombre ? u.nombre.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                      </div>
                      <div className="user-card-info">
                        <span className="user-card-name">{u.nombre}</span>
                        <span className="user-card-code">{u.codigo}</span>
                        <span className="user-card-date">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <button
                        className="user-card-delete"
                        onClick={function(e) { e.stopPropagation(); eliminarUsuario(u.id) }}
                        title="Eliminar usuario"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })()
        )}
      </div>

      {selectedUser && (
        <div className="admin-modal-overlay" onClick={function() { setSelectedUser(null); setMembresia(null) }}>
          <div className="admin-modal-card admin-modal-card--wide" onClick={function(e) { e.stopPropagation() }}>
            <button className="admin-modal-close" onClick={function() { setSelectedUser(null); setMembresia(null) }}>&times;</button>

            <div className="admin-modal-avatar">
              {selectedUser.imagen ? (
                <img src={selectedUser.imagen} alt={selectedUser.nombre} onClick={function() { setPreviewImg(selectedUser.imagen) }} style={{ cursor: 'pointer' }} />
              ) : (
                <div className="admin-modal-avatar-initials">
                  {selectedUser.nombre ? selectedUser.nombre.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>

            <h2 className="admin-modal-name">{selectedUser.nombre}</h2>

            <div className="admin-modal-details">
              <div className="admin-modal-field">
                <span className="admin-modal-label">ID</span>
                <span className="admin-modal-value">#{selectedUser.id}</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">Codigo</span>
                <span className="admin-modal-value admin-modal-code">{selectedUser.codigo}</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">Huella ID</span>
                <span className="admin-modal-value">{selectedUser.huella_id || '—'}</span>
              </div>
              <div className="admin-modal-field">
                <span className="admin-modal-label">Registrado</span>
                <span className="admin-modal-value">
                  {selectedUser.created_at
                    ? new Date(selectedUser.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '-'}
                </span>
              </div>
            </div>

            <div className="admin-modal-divider" />

            <div className="admin-modal-section">
              <h4 className="admin-modal-section-title">Membresia</h4>
              {loadingProfile ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}><span className="spinner"></span></div>
              ) : !membresia ? (
                <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Sin membresia activa.
                  <br />
                  <button className="btn btn-primary" onClick={registrarPago} disabled={paying} style={{ marginTop: '0.6rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    {paying ? <span className="spinner"></span> : 'Registrar primer pago'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="admin-modal-details">
                    <div className="admin-modal-field">
                      <span className="admin-modal-label">Ultimo pago</span>
                      <span className="admin-modal-value">
                        {new Date(membresia.ultimo_pago).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="admin-modal-field">
                      <span className="admin-modal-label">Proximo pago</span>
                      <span className="admin-modal-value" style={{ color: isVencido(membresia.ultimo_pago) ? '#fca5a5' : 'var(--primary)' }}>
                        {calcularProximoPago(membresia.ultimo_pago).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="admin-modal-field">
                      <span className="admin-modal-label">Estado</span>
                      <span className={'membresia-badge ' + (isVencido(membresia.ultimo_pago) ? 'badge-vencido' : 'badge-activo')}>
                        {isVencido(membresia.ultimo_pago)
                          ? 'Vencido (' + Math.abs(daysUntil(membresia.ultimo_pago)) + 'd)'
                          : 'Activo (' + daysUntil(membresia.ultimo_pago) + 'd)'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn-primary" onClick={registrarPago} disabled={paying} style={{ fontSize: '0.85rem', flex: 1 }}>
                      {paying ? <span className="spinner"></span> : 'Renovar pago'}
                    </button>
                    <button className="btn btn-outline" onClick={quitarMembresia} style={{ fontSize: '0.85rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}>
                      Quitar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-divider" />

            <button
              className="btn btn-outline"
              onClick={function() { eliminarUsuario(selectedUser.id) }}
              style={{ width: '100%', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)', fontSize: '0.85rem' }}
            >
              Eliminar usuario
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default UsersPanel
