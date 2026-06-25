import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function UsersPanel() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const cargarUsuarios = async () => {
    setLoading(true)
    const { data } = await supabase.from('usuarios').select('*').order('id', { ascending: false })
    if (data) setUsuarios(data)
    setLoading(false)
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

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
                    <tr key={u.id}>
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
                          onClick={() => eliminarUsuario(u.id)}
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
