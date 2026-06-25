import { useState, useEffect, useRef } from 'react'
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
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    cargarUsuarios()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
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
      const webpFile = await convertirAWebP(photoFile)
      const fileName = `avatar_${Date.now()}_${codigoGenerado}.webp`
      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, webpFile, { contentType: 'image/webp', upsert: true })

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

  const convertirAWebP = (file) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 400
        let { width, height } = img
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
          } else {
            resolve(file)
          }
        }, 'image/webp', 0.75)
      }
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  const abrirCamara = async () => {
    setShowCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setMsg({ type: 'error', text: 'No se pudo acceder a la cámara.' })
      setShowCamera(false)
    }
  }

  const capturarFoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(blob))
      cerrarCamara()
    }, 'image/jpeg', 0.9)
  }

  const cerrarCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setShowCamera(false)
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
            {showCamera ? (
              <div className="camera-preview">
                <video ref={videoRef} className="camera-video" autoPlay playsInline />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="camera-actions">
                  <button className="btn btn-primary" onClick={capturarFoto}>
                    📸 Capturar
                  </button>
                  <button className="btn btn-outline" onClick={cerrarCamara}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                <button type="button" className="btn btn-outline" onClick={abrirCamara} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                  📷 Tomar Foto
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  >
                    Quitar
                  </button>
                )}
              </>
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
