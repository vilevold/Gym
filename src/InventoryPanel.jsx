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
  const [showVenderModal, setShowVenderModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [venderProducto, setVenderProducto] = useState(null)
  const [venderCantidad, setVenderCantidad] = useState(1)
  const [loadingVenta, setLoadingVenta] = useState(false)

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

  const handleVender = async (e) => {
    e.preventDefault()
    if (!venderProducto) return
    if (venderCantidad < 1 || venderCantidad > venderProducto.cantidad) {
      setMsg({ type: 'error', text: 'Cantidad inválida.' })
      return
    }

    setLoadingVenta(true)
    const total = (parseFloat(venderProducto.precio) || 0) * venderCantidad

    const { error: ventaError } = await supabase.from('ventas').insert({
      producto_id: venderProducto.id,
      producto_nombre: venderProducto.nombre,
      cantidad: venderCantidad,
      precio_unitario: parseFloat(venderProducto.precio) || 0,
      total
    })

    if (ventaError) {
      setMsg({ type: 'error', text: 'Error al registrar venta: ' + ventaError.message })
      setLoadingVenta(false)
      return
    }

    const nuevaCantidad = venderProducto.cantidad - venderCantidad
    await supabase.from('productos').update({ cantidad: nuevaCantidad }).eq('id', venderProducto.id)

    setItems(items.map(i => i.id === venderProducto.id ? { ...i, cantidad: nuevaCantidad } : i))
    setMsg({ type: 'success', text: `Venta registrada: ${venderCantidad}x ${venderProducto.nombre} — L${total.toFixed(2)}` })
    setShowVenderModal(false)
    setVenderProducto(null)
    setVenderCantidad(1)
    setLoadingVenta(false)
  }

  const itemsFiltrados = items.filter(item => {
    const matchNombre = item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = !filterCategoria || item.categoria === filterCategoria
    return matchNombre && matchCategoria
  })

  return (
    <section className="admin-section admin-section-wide">
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
              <label htmlFor="inv-precio">Precio (L)</label>
              <input
                id="inv-precio"
                type="number"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="L0.00"
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
        <h3 className="admin-title" style={{ fontSize: '1.25rem' }}>Productos ({itemsFiltrados.length})</h3>
        <div className="admin-filters">
          <input
            type="text"
            className="filter-input"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="filter-badges">
            <button className={`filter-badge ${!filterCategoria ? 'active' : ''}`} onClick={() => setFilterCategoria('')}>Todas</button>
            {categorias.map(c => (
              <button key={c} className={`filter-badge ${filterCategoria === c ? 'active' : ''}`} onClick={() => setFilterCategoria(c)}>{c}</button>
            ))}
          </div>
        </div>
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
              {itemsFiltrados.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">{items.length === 0 ? 'No hay productos registrados.' : 'No se encontraron productos.'}</td></tr>
              ) : (
                itemsFiltrados.map((item) => (
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
                    <td>L{Number(item.precio).toFixed(2)}</td>
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
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--primary)', borderColor: 'rgba(16,185,129,0.4)' }}
                          onClick={() => { setVenderProducto(item); setVenderCantidad(1); setShowVenderModal(true) }}
                          disabled={item.cantidad <= 0}
                        >
                          Vender
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}
                          onClick={() => eliminarProducto(item.id, item.nombre)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Vender */}
      {showVenderModal && venderProducto && (
        <div className="admin-modal-overlay" onClick={() => setShowVenderModal(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowVenderModal(false)}>×</button>
            <h3 className="admin-title" style={{ fontSize: '1.2rem', textAlign: 'center' }}>Vender</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {venderProducto.nombre} — <strong>Stock: {venderProducto.cantidad}</strong>
            </p>
            <form onSubmit={handleVender} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Cantidad a vender</label>
                <input
                  type="number"
                  min="1"
                  max={venderProducto.cantidad}
                  value={venderCantidad}
                  onChange={e => setVenderCantidad(Math.min(parseInt(e.target.value) || 1, venderProducto.cantidad))}
                />
              </div>
              <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                Total: L${((parseFloat(venderProducto.precio) || 0) * venderCantidad).toFixed(2)}
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loadingVenta || venderCantidad < 1}>
                {loadingVenta ? <><span className="spinner"></span> Registrando...</> : 'Confirmar Venta'}
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  )
}

export default InventoryPanel
