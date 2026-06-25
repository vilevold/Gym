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
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (error) {
      setMsg({ type: 'error', text: 'Error al eliminar: ' + error.message })
      return
    }
    setUsuarios(usuarios.filter(u => u.id !== id))
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

  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase()
  }

  if (selectedUser) {
    return (
      <section className="admin-section">
        <div className="admin-card" style={{ position: 'relative' }}>
          <button
            className="btn btn-outline"
            onClick={() => { setSelectedUser(null); setMembresia(null) }}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            ✕ Cerrar
          </button>

          <div className="perfil-header">
            <div className="perfil-avatar">
              {selectedUser.imagen ? (
                <img src={selectedUser.imagen} alt={selectedUser.nombre} />
              ) : (
                getInitials(selectedUser.nombre)
              )}
            </div>
            <div className="perfil-header-info">
              <h2 className="admin-title" style={{ margin: 0 }}>{selectedUser.nombre}</h2>
              <p className="admin-subtitle" style={{ margin: '0.25rem 0 0' }}>
                Código: <span className="admin-badge-code">{selectedUser.codigo}</span>
                {selectedUser.huella_id && <> · Huella: <span className="admin-badge-code">{selectedUser.huella_id}</span></>}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="admin-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Información general</h3>
          <div className="perfil-grid">
            <div className="perfil-field">
              <span className="perfil-label">ID</span>
              <span className="perfil-value">{selectedUser.id}</span>
            </div>
            <div className="perfil-field">
              <span className="perfil-label">Código de acceso</span>
              <span className="perfil-value"><span className="admin-badge-code">{selectedUser.codigo}</span></span>
            </div>
            <div className="perfil-field">
              <span className="perfil-label">Huella digital</span>
              <span className="perfil-value">{selectedUser.huella_id || 'No registrada'}</span>
            </div>
            <div className="perfil-field">
              <span className="perfil-label">Registrado el</span>
              <span className="perfil-value">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="admin-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Membresía</h3>
          {loadingProfile ? (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}><span className="spinner"></span></div>
          ) : !membresia ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              <p>Sin membresía registrada.</p>
              <button className="btn btn-primary" onClick={registrarPago} disabled={paying} style={{ marginTop: '0.75rem' }}>
                {paying ? <span className="spinner"></span> : '💳 Registrar primer pago'}
              </button>
            </div>
          ) : (
            <div>
              <div className="perfil-grid">
                <div className="perfil-field">
                  <span className="perfil-label">Último pago</span>
                  <span className="perfil-value">{new Date(membresia.ultimo_pago).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="perfil-field">
                  <span className="perfil-label">Próximo pago</span>
                  <span className="perfil-value" style={{ color: isVencido(membresia.ultimo_pago) ? '#fca5a5' : 'var(--primary)' }}>
                    {calcularProximoPago(membresia.ultimo_pago).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="perfil-field">
                  <span className="perfil-label">Estado</span>
                  <span>
                    <span className={`membresia-badge ${isVencido(membresia.ultimo_pago) ? 'badge-vencido' : 'badge-activo'}`}>
                      {isVencido(membresia.ultimo_pago) ? `Vencido (${Math.abs(daysUntil(membresia.ultimo_pago))}d)` : `Activo (${daysUntil(membresia.ultimo_pago)}d)`}
                    </span>
                  </span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={registrarPago} disabled={paying} style={{ marginTop: '1rem' }}>
                {paying ? <span className="spinner"></span> : '💳 Registrar pago'}
              </button>
            </div>
          )}
        </div>

        <button
          className="btn btn-outline btn-block"
          onClick={() => { setSelectedUser(null); setMembresia(null) }}
          style={{ marginTop: '0.5rem' }}
        >
          ← Volver a lista de usuarios
        </button>
      </section>
    )
  }

  return (
    <section className="admin-section">
      <div className="admin-card">
        <h2 className="admin-title">Usuarios</h2>
        <p className="admin-subtitle">Lista completa de usuarios registrados en el sistema.</p>

        {msg.text && (
          <div className={`alert ${msg.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
            <span className="alert-text">{msg.text}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <span className="spinner"></span> Cargando usuarios...
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Foto</th>
                  <th>Registrado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan="6" className="admin-empty">No hay usuarios registrados.</td></tr>
                ) : (
                  usuarios.map((u) => (
                    <tr
                      key={u.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => verPerfil(u)}
                    >
                      <td>{u.id}</td>
                      <td>{u.nombre}</td>
                      <td><span className="admin-badge-code">{u.codigo}</span></td>
                      <td>
                        {u.imagen ? (
                          <img src={u.imagen} alt={u.nombre} className="admin-thumb" />
                        ) : (
                          <span className="admin-no-photo">—</span>
                        )}
                      </td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}
                          onClick={(e) => { e.stopPropagation(); eliminarUsuario(u.id) }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default UsersPanel
