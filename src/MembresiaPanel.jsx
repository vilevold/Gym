import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function MembresiaPanel({ user }) {
  const isAdmin = user?.codigo === '1212'
  const [membresia, setMembresia] = useState(null)
  const [todas, setTodas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [paySearch, setPaySearch] = useState('')

  useEffect(() => {
    if (user) {
      cargarMembresia()
      if (isAdmin) {
        cargarTodas()
        cargarUsuarios()
      }
    }
  }, [user])

  const cargarMembresia = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('membresias')
      .select('*')
      .eq('usuario_id', user.id)
      .maybeSingle()
    if (data) setMembresia(data)
    setLoading(false)
  }

  const cargarTodas = async () => {
    const { data } = await supabase
      .from('membresias')
      .select('*')
      .order('ultimo_pago', { ascending: false })
    if (data) setTodas(data)
  }

  const cargarUsuarios = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre, codigo')
      .order('nombre', { ascending: true })
    if (data) setUsuarios(data)
  }

  const registrarPago = async (usuarioId) => {
    setPaying(true)
    setMsg({})

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('membresias')
      .upsert(
        { usuario_id: usuarioId, ultimo_pago: now },
        { onConflict: 'usuario_id' }
      )
      .select()
      .single()

    if (error) {
      setMsg({ type: 'error', text: 'Error al registrar pago: ' + error.message })
    } else {
      if (usuarioId === user.id) setMembresia(data)
      if (isAdmin) cargarTodas()
      setMsg({ type: 'success', text: 'Pago registrado correctamente.' })
    }

    setPaying(false)
  }

  const calcularProximoPago = (ultimoPago) => {
    const date = new Date(ultimoPago)
    date.setMonth(date.getMonth() + 1)
    return date
  }

  const isVencido = (ultimoPago) => {
    const proximo = calcularProximoPago(ultimoPago)
    return new Date() > proximo
  }

  const daysUntil = (ultimoPago) => {
    const proximo = calcularProximoPago(ultimoPago)
    const diff = proximo - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <section className="admin-section">
      {!isAdmin && (
        <div className="admin-card">
          <h2 className="admin-title">Mi Membresía</h2>

          {msg.text && (
            <div className={`alert ${msg.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
              <span className="alert-text">{msg.text}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <span className="spinner"></span> Cargando membresía...
            </div>
          ) : (
            <div className="membresia-status">
              {!membresia ? (
                <div className="membresia-empty">
                  <p>Aún no tienes una membresía activa.</p>
                  <p className="membresia-hint">Espera a que el administrador registre tu pago.</p>
                </div>
              ) : (
                <div className="membresia-info">
                  <div className="membresia-row">
                    <span className="membresia-label">Último pago</span>
                    <span className="membresia-value">
                      {new Date(membresia.ultimo_pago).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="membresia-divider" />
                  <div className="membresia-row">
                    <span className="membresia-label">Próximo pago</span>
                    <span className={`membresia-value ${isVencido(membresia.ultimo_pago) ? 'membresia-vencido' : 'membresia-activo'}`}>
                      {calcularProximoPago(membresia.ultimo_pago).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="membresia-divider" />
                  <div className="membresia-row">
                    <span className="membresia-label">Estado</span>
                    <span className={`membresia-badge ${isVencido(membresia.ultimo_pago) ? 'badge-vencido' : 'badge-activo'}`}>
                      {isVencido(membresia.ultimo_pago)
                        ? `Vencido (${Math.abs(daysUntil(membresia.ultimo_pago))} días de retraso)`
                        : `Activo (${daysUntil(membresia.ultimo_pago)} días restantes)`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="admin-card">
          <h3 className="admin-title" style={{ fontSize: '1.25rem' }}>
            Registrar Pago para Usuario
          </h3>

          {selectedUserId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Usuario seleccionado:
              </span>
              <span style={{
                background: 'rgba(16,185,129,0.15)', color: 'var(--primary)',
                padding: '0.3rem 0.8rem', borderRadius: '6px', fontWeight: 700,
                border: '1px solid rgba(16,185,129,0.3)'
              }}>
                {usuarios.find(u => u.id === selectedUserId)?.nombre || '—'}
              </span>
              <button
                className="btn btn-outline"
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setSelectedUserId('')}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="admin-search-user">Buscar usuario</label>
              <input
                id="admin-search-user"
                type="text"
                className="filter-input"
                placeholder="Escribe nombre o código..."
                value={paySearch}
                onChange={(e) => setPaySearch(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {!selectedUserId && paySearch && (
            <div style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
              border: '1px solid var(--border-color)', marginBottom: '1rem',
              maxHeight: '200px', overflowY: 'auto'
            }}>
              {(() => {
                const filtrados = usuarios.filter(u =>
                  u.nombre.toLowerCase().includes(paySearch.toLowerCase()) ||
                  u.codigo.toLowerCase().includes(paySearch.toLowerCase())
                )
                return filtrados.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron usuarios.
                  </div>
                ) : (
                  filtrados.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        width: '100%', padding: '0.75rem 1rem',
                        background: 'transparent', border: 'none',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-main)', cursor: 'pointer',
                        fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
                        textAlign: 'left', transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        setSelectedUserId(u.id)
                        setPaySearch('')
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="admin-thumb" style={{
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.25))',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)'
                      }}>
                        {u.nombre?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{u.nombre}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.codigo}</div>
                      </div>
                    </button>
                  ))
                )
              })()}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={() => {
              if (!selectedUserId) {
                setMsg({ type: 'error', text: 'Selecciona un usuario.' })
                return
              }
              registrarPago(Number(selectedUserId))
            }}
            disabled={paying || !selectedUserId}
            style={{ height: '44px', whiteSpace: 'nowrap', width: '100%' }}
          >
            {paying ? <span className="spinner"></span> : '💳 Registrar Pago'}
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="admin-card">
          <h3 className="admin-title" style={{ fontSize: '1.25rem' }}>Todas las Membresías ({todas.length})</h3>

          <div className="admin-filters">
            <input
              type="text"
              className="filter-input"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="filter-badges">
              {['all', 'activo', 'vencido'].map((f) => (
                <button
                  key={f}
                  className={`filter-badge ${filterStatus === f ? 'active' : ''}`}
                  onClick={() => setFilterStatus(f)}
                >
                  {f === 'all' ? 'Todos' : f === 'activo' ? 'Activos' : 'Vencidos'}
                </button>
              ))}
            </div>
          </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Código</th>
                <th>Último pago</th>
                <th>Próximo pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filtradas = todas.filter((m) => {
                  const userData = usuarios.find(u => u.id === m.usuario_id)
                  const name = (userData?.nombre || '').toLowerCase()
                  const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase())
                  const vencido = isVencido(m.ultimo_pago)
                  const matchStatus = filterStatus === 'all'
                    || (filterStatus === 'activo' && !vencido)
                    || (filterStatus === 'vencido' && vencido)
                  return matchSearch && matchStatus
                })
                return filtradas.length === 0 ? (
                  <tr><td colSpan="5" className="admin-empty">No se encontraron membresías.</td></tr>
                ) : (
                  filtradas.map((m) => {
                    const vencido = isVencido(m.ultimo_pago)
                    const userData = usuarios.find(u => u.id === m.usuario_id)
                    return (
                      <tr key={m.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="admin-thumb" style={{
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.25))',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)'
                          }}>
                            {userData?.nombre?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          {userData?.nombre || '—'}
                        </td>
                        <td><span className="admin-badge-code">{userData?.codigo || '—'}</span></td>
                        <td>{new Date(m.ultimo_pago).toLocaleDateString('es-MX')}</td>
                        <td className={vencido ? 'membresia-vencido' : 'membresia-activo'}>
                          {calcularProximoPago(m.ultimo_pago).toLocaleDateString('es-MX')}
                        </td>
                        <td>
                          <span className={`membresia-badge ${vencido ? 'badge-vencido' : 'badge-activo'}`}>
                            {vencido
                              ? `Vencido (${Math.abs(daysUntil(m.ultimo_pago))}d)`
                              : `Activo (${daysUntil(m.ultimo_pago)}d)`
                            }
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )
              })()}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </section>
  )
}

export default MembresiaPanel
