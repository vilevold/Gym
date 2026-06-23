import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AdminPanel() {
  const [nombre, setNombre] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('id', { ascending: false })
    if (data) setUsuarios(data)
  }

  const generarCodigo = async () => {
    if (!nombre.trim()) {
      setMsg({ type: 'error', text: 'Primero ingresa un nombre.' })
      return
    }

    setGenerating(true)
    setMsg({})
    setCodigoGenerado('')

    let intentos = 0
    let code = ''

    while (intentos < 100) {
      code = String(Math.floor(1000 + Math.random() * 9000))
      const { data } = await supabase
        .from('usuarios')
        .select('id')
        .eq('codigo', code)
        .maybeSingle()

      if (!data) break
      intentos++
    }

    if (intentos >= 100) {
      setMsg({ type: 'error', text: 'No se pudo generar un código único. Intenta de nuevo.' })
      setGenerating(false)
      return
    }

    setCodigoGenerado(code)
    setMsg({ type: 'success', text: `Código generado: ${code}` })
    setGenerating(false)
  }

  const guardarUsuario = async () => {
    if (!nombre.trim() || !codigoGenerado) {
      setMsg({ type: 'error', text: 'Completa el nombre y genera un código.' })
      return
    }

    setLoading(true)
    setMsg({})

    const { error } = await supabase
      .from('usuarios')
      .insert({ nombre: nombre.trim(), codigo: codigoGenerado })

    if (error) {
      setMsg({ type: 'error', text: 'Error al guardar: ' + error.message })
      setLoading(false)
      return
    }

    setMsg({ type: 'success', text: `Usuario "${nombre.trim()}" registrado con código ${codigoGenerado}.` })
    setNombre('')
    setCodigoGenerado('')
    setLoading(false)
    cargarUsuarios()
  }

  return (
    <section className="admin-section">
      <div className="admin-card">
        <h2 className="admin-title">Panel de Administración</h2>
        <p className="admin-subtitle">Registra nuevos usuarios con un código único de 4 dígitos.</p>

        <div className="admin-form">
          <div className="form-group">
            <label htmlFor="admin-nombre">Nombre del usuario</label>
            <input
              id="admin-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Carlos"
              disabled={loading}
            />
          </div>

          <div className="admin-code-row">
            <div className="form-group code-input-group">
              <label htmlFor="admin-codigo">Código generado</label>
              <input
                id="admin-codigo"
                type="text"
                value={codigoGenerado}
                placeholder="Presiona 'Generar'"
                readOnly
              />
            </div>
            <button
              className="btn btn-outline btn-generate"
              onClick={generarCodigo}
              disabled={generating || loading}
            >
              {generating ? <span className="spinner"></span> : '🔄 Generar'}
            </button>
          </div>

          {msg.text && (
            <div className={`alert ${msg.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
              <span className="alert-text">{msg.text}</span>
            </div>
          )}

          <button
            className="btn btn-primary btn-block"
            onClick={guardarUsuario}
            disabled={loading || generating || !codigoGenerado}
          >
            {loading ? <><span className="spinner"></span> Guardando...</> : '💾 Guardar Usuario'}
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-title" style={{ fontSize: '1.25rem' }}>Usuarios Registrados ({usuarios.length})</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Código</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr><td colSpan="4" className="admin-empty">No hay usuarios registrados.</td></tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.nombre}</td>
                    <td><span className="admin-badge-code">{u.codigo}</span></td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default AdminPanel
