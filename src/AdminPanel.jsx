import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

function AdminPanel() {
  const [nombre, setNombre] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // Camera state
  const [showCamera, setShowCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const cargarUsuarios = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('id', { ascending: false })
    if (data) setUsuarios(data)
  }

  const startCamera = async () => {
    setShowCamera(true)
    setCapturedImage(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraReady(true)
    } catch (err) {
      setMsg({ type: 'error', text: 'Error al acceder a la cámara: ' + err.message })
      setShowCamera(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(dataUrl)
    stopCamera()
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
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

    if (!capturedImage) {
      setMsg({ type: 'error', text: 'Toma una foto antes de guardar el usuario.' })
      return
    }

    setLoading(true)
    setMsg({})

    let imagenUrl = null
    try {
      const res = await fetch(capturedImage)
      const blob = await res.blob()
      const fileName = `avatar_${Date.now()}_${codigoGenerado}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      imagenUrl = urlData.publicUrl
    } catch (err) {
      setMsg({ type: 'error', text: 'Error al subir la foto: ' + err.message })
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('usuarios')
      .insert({ nombre: nombre.trim(), codigo: codigoGenerado, imagen: imagenUrl })

    if (error) {
      setMsg({ type: 'error', text: 'Error al guardar: ' + error.message })
      setLoading(false)
      return
    }

    setMsg({ type: 'success', text: `Usuario "${nombre.trim()}" registrado con código ${codigoGenerado}.` })
    setNombre('')
    setCodigoGenerado('')
    setCapturedImage(null)
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

          {/* Camera Section */}
          <div className="admin-camera-section">
            {!showCamera && !capturedImage && (
              <button
                className="btn btn-outline btn-block"
                onClick={startCamera}
                disabled={loading || generating || !codigoGenerado}
              >
                📷 Tomar Foto
              </button>
            )}

            {showCamera && (
              <div className="camera-preview">
                <video ref={videoRef} autoPlay playsInline className="camera-video" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="camera-actions">
                  <button
                    className="btn btn-primary"
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                  >
                    📸 Capturar
                  </button>
                  <button className="btn btn-outline" onClick={stopCamera}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="captured-preview">
                <img src={capturedImage} alt="Foto capturada" className="captured-img" />
                <div className="camera-actions">
                  <span className="photo-done">Foto tomada ✓</span>
                  <button className="btn btn-outline" onClick={retakePhoto}>
                    🔄 Volver a tomar
                  </button>
                </div>
              </div>
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
            disabled={loading || generating || !codigoGenerado || !capturedImage}
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
                <th>Foto</th>
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
