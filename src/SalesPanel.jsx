import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function SalesPanel() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(false)

  const cargarVentas = async () => {
    setLoading(true)
    const { data } = await supabase.from('ventas').select('*').order('id', { ascending: false }).limit(200)
    if (data) setVentas(data)
    setLoading(false)
  }

  useEffect(() => {
    cargarVentas()
  }, [])

  const descargarVentas = () => {
    if (ventas.length === 0) return
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
    const title = `Reporte de Ventas - ${new Date().toLocaleDateString()}`
    doc.setFontSize(16)
    doc.text(title, 14, 20)
    doc.setFontSize(10)
    doc.text(`Total transacciones: ${ventas.length}`, 14, 28)
    const totalGeneral = ventas.reduce((s, v) => s + Number(v.total), 0)
    doc.text(`Total vendido: L${totalGeneral.toFixed(2)}`, 14, 34)

    autoTable(doc, {
      startY: 40,
      head: [['ID', 'Producto', 'Cantidad', 'Precio Unit.', 'Total', 'Fecha']],
      body: ventas.map(v => [
        String(v.id),
        v.producto_nombre,
        String(v.cantidad),
        `L${Number(v.precio_unitario).toFixed(2)}`,
        `L${Number(v.total).toFixed(2)}`,
        new Date(v.created_at).toLocaleString()
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] }
    })
    doc.save(`ventas_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const cerrarVentas = async () => {
    if (ventas.length === 0) return
    if (!confirm('¿Cerrar las ventas del día? Se eliminarán todos los registros.')) return
    if (!confirm('¿Confirmar? Esta acción no se puede deshacer.')) return
    await supabase.from('ventas').delete().neq('id', 0)
    setVentas([])
  }

  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0)

  return (
    <section className="admin-section admin-section-wide">
      <div className="admin-card">
        <div className="ventas-header">
          <div>
            <h2 className="admin-title">Ventas</h2>
            <p className="admin-subtitle">Historial de ventas registradas.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={descargarVentas} disabled={ventas.length === 0}>
              Descargar PDF
            </button>
            <button className="btn btn-outline" onClick={cerrarVentas} disabled={ventas.length === 0} style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}>
              Cerrar Ventas del Día
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ flex: 1, minWidth: 140, padding: '1rem' }}>
            <div className="stat-card-label">Total Ventas</div>
            <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>L{totalVentas.toFixed(2)}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 140, padding: '1rem' }}>
            <div className="stat-card-label">Transacciones</div>
            <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{ventas.length}</div>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio Unit.</th>
                <th>Total</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="admin-empty">Cargando...</td></tr>
              ) : ventas.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">No hay ventas registradas.</td></tr>
              ) : (
                ventas.map(v => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td style={{ fontWeight: 600 }}>{v.producto_nombre}</td>
                    <td>{v.cantidad}</td>
                    <td>L{Number(v.precio_unitario).toFixed(2)}</td>
                    <td className="ventas-total-col">L{Number(v.total).toFixed(2)}</td>
                    <td className="ventas-fecha-col">{new Date(v.created_at).toLocaleString()}</td>
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

export default SalesPanel
