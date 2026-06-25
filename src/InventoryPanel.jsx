import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function InventoryPanel() {
  const [items, setItems] = useState([])
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const cargarInventario = async () => {
    const { data } = await supabase.from('inventario').select('*').order('id', { ascending: false })
    if (data) setItems(data)
  }

  useEffect(() => {
    cargarInventario()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !cantidad.trim()) {
      setMsg({ type: 'error', text: 'Completa el nombre y la cantidad.' })
      return
    }

    setLoading(true)
    setMsg({})

    const { error } = await supabase
      .from('inventario')
      .insert({ nombre: nombre.trim(), cantidad: parseInt(cantidad), descripcion: descripcion.trim() })

    if (error) {
      setMsg({ type: 'error', text: 'Error al guardar: ' + error.message })
      setLoading(false)
      return
    }

    setMsg({ type: 'success', text: `"${nombre.trim()}" agregado al inventario.` })
    setNombre('')
    setCantidad('')
    setDescripcion('')
    setLoading(false)
    cargarInventario()
  }

  const eliminarItem = async (id) => {
    const { error } = await supabase.from('inventario').delete().eq('id', id)
    if (!error) {
      setItems(items.filter(i => i.id !== id))
      setMsg({ type: 'success', text: 'Elemento eliminado del inventario.' })
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-card">
        <h2 className="admin-title">Inventario</h2>
        <p className="admin-subtitle">Gestiona los equipos y productos del gimnasio.</p>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="inv-nombre">Nombre del artículo</label>
            <input
              id="inv-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Mancuernas 10kg"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inv-cantidad">Cantidad</label>
            <input
              id="inv-cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
              min="0"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="inv-descripcion">Descripción (opcional)</label>
            <input
              id="inv-descripcion"
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Pesas rusas de acero"
              disabled={loading}
            />
          </div>

          {msg.text && (
            <div className={`alert ${msg.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
              <span className="alert-text">{msg.text}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <><span className="spinner"></span> Guardando...</> : 'Agregar al Inventario'}
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h3 className="admin-title" style={{ fontSize: '1.25rem' }}>Artículos ({items.length})</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Descripción</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="5" className="admin-empty">No hay artículos en el inventario.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.descripcion || '—'}</td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}
                        onClick={() => eliminarItem(item.id)}
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
      </div>
    </section>
  )
}

export default InventoryPanel
