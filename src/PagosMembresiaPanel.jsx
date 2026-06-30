import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const precioLabel = { month: 'Mensual', week: 'Semanal', '15days': 'Cada 15 d\u00edas', day: 'Diario' }

function PagosMembresiaPanel() {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(false)

  const cargarPagos = async () => {
    setLoading(true)
    const { data } = await supabase.from('pagos_membresia').select('*').order('id', { ascending: false }).limit(200)
    if (data) setPagos(data)
    setLoading(false)
  }

  useEffect(() => {
    cargarPagos()
  }, [])

  const descargarPDF = () => {
    if (pagos.length === 0) return
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
    const title = `Reporte de Membresias Pagadas - ${new Date().toLocaleDateString()}`
    doc.setFontSize(16)
    doc.text(title, 14, 20)
    doc.setFontSize(10)
    doc.text(`Total pagos: ${pagos.length}`, 14, 28)
    const totalGeneral = pagos.reduce((s, p) => s + Number(p.precio), 0)
    doc.text(`Total recaudado: L${totalGeneral.toFixed(2)}`, 14, 34)

    autoTable(doc, {
      startY: 40,
      head: [['ID', 'Usuario', 'Periodo', 'Precio', 'Fecha']],
      body: pagos.map(p => [
        String(p.id),
        p.usuario_nombre,
        precioLabel[p.periodo] || p.periodo,
        `L${Number(p.precio).toFixed(2)}`,
        new Date(p.created_at).toLocaleString()
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] }
    })
    doc.save(`membresias_pagadas_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const cerrarPagos = async () => {
    if (pagos.length === 0) return
    if (!confirm('Cerrar los pagos registrados? Se eliminar\u00e1n todos los registros de pagos de membres\u00eda.')) return
    if (!confirm('Confirmar? Esta acci\u00f3n no se puede deshacer.')) return
    await supabase.from('pagos_membresia').delete().neq('id', 0)
    setPagos([])
  }

  const totalPagos = pagos.reduce((sum, p) => sum + Number(p.precio), 0)

  return (
    <section className="admin-section admin-section-wide">
      <div className="admin-card">
        <div className="ventas-header">
          <div>
            <h2 className="admin-title">{'Membresias pagadas'}</h2>
            <p className="admin-subtitle">{'Historial de pagos de membres\u00edas registradas.'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={descargarPDF} disabled={pagos.length === 0}>
              Descargar PDF
            </button>
            <button className="btn btn-outline" onClick={cerrarPagos} disabled={pagos.length === 0} style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' }}>
              Cerrar Registros
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ flex: 1, minWidth: 140, padding: '1rem' }}>
            <div className="stat-card-label">Total Cobrado</div>
            <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>L{totalPagos.toFixed(2)}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 140, padding: '1rem' }}>
            <div className="stat-card-label">Pagos Registrados</div>
            <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{pagos.length}</div>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Periodo</th>
                <th>Precio</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="admin-empty">Cargando...</td></tr>
              ) : pagos.length === 0 ? (
                <tr><td colSpan="5" className="admin-empty">{'No hay pagos de membres\u00eda registrados.'}</td></tr>
              ) : (
                pagos.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.usuario_nombre}</td>
                    <td>{precioLabel[p.periodo] || p.periodo}</td>
                    <td>L{Number(p.precio).toFixed(2)}</td>
                    <td className="ventas-fecha-col">{new Date(p.created_at).toLocaleString()}</td>
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

export default PagosMembresiaPanel
