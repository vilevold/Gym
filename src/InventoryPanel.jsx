import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function InventoryPanel() {
  const [items, setItems] = useState([])
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoria, setCategoria] = useState('General')
  const [cantidad, setCantidad] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editCantidad, setEditCantidad] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })

  const categorias = ['General', 'Suplementos', 'Bebidas', 'Otro']

  const cargarProductos = async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false })
    if (data) setItems(data)
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setMsg({ type: 'error', text: 'Ingresa el nombre del producto.' })
      return
    }

    setLoading(true)
    setMsg({})

    const { error } = await supabase
      .from('productos')
      .insert({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio) || 0,
        categoria,
        cantidad: parseInt(cantidad) || 0
      })

    if (error) {
      setMsg({ type: 'error', text: 'Error al guardar: ' + error.message })
      setLoading(false)
      return
    }

    setMsg({ type: 'success', text: `"${nombre.trim()}" agregado.` })
    setNombre('')
    setDescripcion('')
    setPrecio('')
    setCategoria('General')
    setCantidad('')
    setLoading(false)
    cargarProductos()
  }

  const eliminarProducto = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}" del inventario?`)) return
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (!error) {
      setItems(items.filter(i => i.id !== id))
      setMsg({ type: 'success', text: `"${nombre}" eliminado.` })
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditCantidad(String(item.cantidad))
  }

  const guardarCantidad = async (id) => {
    const nueva = parseInt(editCantidad)
    if (isNaN(nueva) || nueva < 0) return

    const { error } = await supabase
      .from('productos')
      .update({ cantidad: nueva })
      .eq('id', id)

    if (!error) {
      setItems(items.map(i => i.id === id ? { ...i, cantidad: nueva } : i))
      setEditingId(null)
    }
  }

  const ajustarStock = async (item, delta) => {
    const nueva = item.cantidad + delta
    if (nueva < 0) return
    const { error } = await supabase
      .from('productos')
      .update({ cantidad: nueva })
      .eq('id', item.id)
    if (!error) {
      setItems(items.map(i => i.id === item.id ? { ...i, cantidad: nueva } : i))
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-card">
        <h2 className="admin-title">Inventario</h2>
        <p className="admin-subtitle">Gestiona los productos y existencias del gimnasio.</p>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="inv-nombre">Nombre del producto</label>
            <input
              id="inv-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Mancuernas 10kg"
              disabled={loading}
            />
          </div>

          <div className="admin-code-row">
            <div className="form-group code-input-group">
              <label htmlFor="inv-categoria">Categoría</label>
              <select
                id="inv-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                disabled={loading}
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
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group code-input-group">
              <label htmlFor="inv-precio">Precio ($)</label>
              <input
                id="inv-precio"
                type="number"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0.00"
                min="0"
                disabled={loading}
              />
            </div>
            <div className="form-group code-input-group">
              <label htmlFor="inv-cantidad">Stock inicial</label>
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
          </div>

          <div className="form-group">
            <label htmlFor="inv-descripcion">Descripción (opcional)</label>
            <input
              id="inv-descripcion"
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Pesas rusas de acero inoxidable"
              disabled={loading}
            />
          </div>

          {msg.text && (
            <div className={`alert ${msg.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
              <span className="alert-text">{msg.text}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <><span className="spinner"></span> Guardando...</> : 'Agregar Producto'}
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h3 className="admin-title" style={{ fontSize: '1.25rem' }}>Productos ({items.length})</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">No hay productos registrados.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.nombre}</div>
                      {item.descripcion && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {item.descripcion}
                        </div>
                      )}
                    </td>
                    <td><span className="admin-badge-code" style={{ fontSize: '0.75rem' }}>{item.categoria}</span></td>
                    <td>${Number(item.precio).toFixed(2)}</td>
                    <td>
                      <div className="stock-control">
                        <button className="stock-btn" onClick={() => ajustarStock(item, -1)} disabled={item.cantidad <= 0}>−</button>
                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={editCantidad}
                            onChange={(e) => setEditCantidad(e.target.value)}
                            min="0"
                            className="stock-input"
                            autoFocus
                            onBlur={() => guardarCantidad(item.id)}
                            onKeyDown={(e) => e.key === 'Enter' && guardarCantidad(item.id)}
                          />
                        ) : (
                          <span
                            className="stock-value"
                            style={{ color: item.cantidad > 0 ? 'var(--primary)' : '#fca5a5' }}
                            onClick={() => startEdit(item)}
                            title="Editar stock"
                          >
                            {item.cantidad}
                          </span>
                        )}
                        <button className="stock-btn" onClick={() => ajustarStock(item, 1)}>+</button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}
                        onClick={() => eliminarProducto(item.id, item.nombre)}
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
