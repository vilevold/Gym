import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AdminPanel() {
  const [nombre, setNombre] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')
  const [huellaId, setHuellaId] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  // Membership state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedUserMembresia, setSelectedUserMembresia] = useState(null)
  const [loadingMembresia, setLoadingMembresia] = useState(false)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('id', { ascending: false })
    if (data) setUsuarios(data)
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

  const cargarMembresiaUsuario = async (userId) => {
    if (!userId) {
      setSelectedUserMembresia(null)
      return
    }
    setLoadingMembresia(true)
    const { data } = await supabase
      .from('membresias')
      .select('*')
      .eq('usuario_id', userId)
      .maybeSingle()
    setSelectedUserMembresia(data || null)
    setLoadingMembresia(false)
  }

  const registrarPagoUsuario = async () => {
    if (!selectedUserId) return
    setPaying(true)
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('membresias')
      .upsert(
        { usuario_id: Number(selectedUserId), ultimo_pago: now },
        { onConflict: 'usuario_id' }
      )
      .select()
      .single()
    if (!error && data) {
      setSelectedUserMembresia(data)
      setMsg({ type: 'success', text: 'Pago registrado correctamente.' })
    }
    setPaying(false)
  }

  const generarCodigo = async () => {
    if (!nombre.trim()) {
      setMsg({ type: 'error', text: 'Primero ingresa un nombre.' })
      return
    }

    setGenerating(true)
    setMsg({})
    setCodigoGenerado('')
    setHuellaId('')

    let intentos = 0
    let code = ''
    let fpId = ''

    while (intentos < 100) {
      code = String(Math.floor(1000 + Math.random() * 9000))
      fpId = 'FP-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      const { data: codeCheck } = await supabase
        .from('usuarios')
        .select('id')
        .eq('codigo', code)
        .maybeSingle()

      const { data: fpCheck } = await supabase
        .from('usuarios')
        .select('id')
        .eq('huella_id', fpId)
        .maybeSingle()

      if (!codeCheck && !fpCheck) break
      intentos++
    }

    if (intentos >= 100) {
      setMsg({ type: 'error', text: 'No se pudo generar un código único. Intenta de nuevo.' })
      setGenerating(false)
      return
    }

    setCodigoGenerado(code)
    setHuellaId(fpId)
    setMsg({ type: 'success', text: `Código: ${code} · Huella: ${fpId}` })
    setGenerating(false)
  }

  const guardarUsuario = async () => {
    if (!nombre.trim() || !codigoGenerado) {
      setMsg({ type: 'error', text: 'Completa el nombre y genera un código.' })
      return
    }

    setLoading(true)
    setMsg({})

    let imagenUrl = null
    if (photoFile) {
      const fileName = `avatar_${Date.now()}_${codigoGenerado}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, photoFile, { contentType: photoFile.type, upsert: true })

      if (uploadError) {
        setMsg({ type: 'error', text: 'Error al subir foto: ' + uploadError.message })
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('fotos')
        .getPublicUrl(fileName)

      imagenUrl = urlData.publicUrl
    }

    const insertData = { nombre: nombre.trim(), codigo: codigoGenerado }
    if (huellaId.trim()) insertData.huella_id = huellaId.trim()
    if (imagenUrl) insertData.imagen = imagenUrl

    const { error } = await supabase
      .from('usuarios')
      .insert(insertData)

    if (error) {
      setMsg({ type: 'error', text: 'Error al guardar: ' + error.message })
      setLoading(false)
      return
    }

    setMsg({ type: 'success', text: `Usuario "${nombre.trim()}" registrado con código ${codigoGenerado}.` })
    setNombre('')
    setCodigoGenerado('')
    setHuellaId('')
    setPhotoFile(null)
    setPhotoPreview(null)
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
            <div className="form-group code-input-group">
              <label htmlFor="admin-huella">Huella ID (simulada)</label>
              <input
                id="admin-huella"
                type="text"
                value={huellaId}
                placeholder="Se genera automáticamente"
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

          <div className="admin-photo-upload">
            <label className="photo-upload-label">
              {photoPreview ? (
                <img src={photoPreview} alt="Foto" className="photo-preview" />
              ) : (
                <div className="photo-placeholder">
                  <span>📷</span>
                  <span>Foto</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    setPhotoFile(file)
                    setPhotoPreview(URL.createObjectURL(file))
                  }
                }}
                style={{ display: 'none' }}
              />
            </label>
            {photoPreview && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
              >
                Quitar
              </button>
            )}
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
        <h2 className="admin-title" style={{ fontSize: '1.25rem' }}>Gestión de Membresías</h2>
        <p className="admin-subtitle">Selecciona un usuario para ver y registrar sus pagos.</p>

        <div className="admin-form" style={{ flexDirection: 'row', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="admin-mem-usuario">Usuario</label>
            <select
              id="admin-mem-usuario"
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value)
                cargarMembresiaUsuario(e.target.value)
              }}
              style={{
                fontFamily: 'var(--font-sans)',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(148,163,184,0.15)',
                borderRadius: '10px',
                padding: '0.9rem 1rem',
                color: '#fff',
                fontSize: '1rem',
                width: '100%',
                outline: 'none'
              }}
            >
              <option value="">-- Seleccionar --</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.codigo})</option>
              ))}
            </select>
          </div>
        </div>

        {selectedUserId && (
          <div style={{ marginTop: '1rem' }}>
            {loadingMembresia ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <span className="spinner"></span> Cargando...
              </div>
            ) : !selectedUserMembresia ? (
              <div className="membresia-empty" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                <p>Este usuario no tiene membresía registrada.</p>
                <button
                  className="btn btn-primary"
                  onClick={registrarPagoUsuario}
                  disabled={paying}
                  style={{ marginTop: '0.75rem' }}
                >
                  {paying ? <span className="spinner"></span> : '💳 Registrar primer pago'}
                </button>
              </div>
            ) : (
              <div className="membresia-info" style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem'
              }}>
                <div className="membresia-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                  <span className="membresia-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Último pago</span>
                  <span className="membresia-value" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {new Date(selectedUserMembresia.ultimo_pago).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)' }} />
                <div className="membresia-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                  <span className="membresia-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Próximo pago</span>
                  <span style={{
                    fontWeight: 700,
                    color: isVencido(selectedUserMembresia.ultimo_pago) ? '#fca5a5' : 'var(--primary)'
                  }}>
                    {calcularProximoPago(selectedUserMembresia.ultimo_pago).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)' }} />
                <div className="membresia-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                  <span className="membresia-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Estado</span>
                  <span style={{
                    fontSize: '0.85rem', fontWeight: 700, padding: '0.3rem 0.8rem', borderRadius: '6px',
                    background: isVencido(selectedUserMembresia.ultimo_pago)
                      ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                    color: isVencido(selectedUserMembresia.ultimo_pago) ? '#fca5a5' : 'var(--primary)',
                    border: isVencido(selectedUserMembresia.ultimo_pago)
                      ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)'
                  }}>
                    {isVencido(selectedUserMembresia.ultimo_pago)
                      ? `Vencido (${Math.abs(daysUntil(selectedUserMembresia.ultimo_pago))}d)`
                      : `Activo (${daysUntil(selectedUserMembresia.ultimo_pago)}d)`
                    }
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={registrarPagoUsuario}
                  disabled={paying}
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  {paying ? <span className="spinner"></span> : '💳 Registrar pago'}
                </button>
              </div>
            )}
          </div>
        )}
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
                <th>Huella ID</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr><td colSpan="5" className="admin-empty">No hay usuarios registrados.</td></tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {u.imagen ? (
                        <img src={u.imagen} alt={u.nombre} className="admin-thumb" />
                      ) : (
                        <div className="admin-thumb" style={{
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.25))',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)'
                        }}>
                          {u.nombre?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      {u.nombre}
                    </td>
                    <td><span className="admin-badge-code">{u.codigo}</span></td>
                    <td>{u.huella_id || <span className="admin-no-photo">—</span>}</td>
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
