import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function Dashboard({ user, onNavigate }) {
  const isAdmin = user?.codigo === '1212'
  const [stats, setStats] = useState(null)
  const [membresia, setMembresia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({})

  useEffect(() => {
    if (!user) return

    async function cargarDatos() {
      setLoading(true)

      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const [usuariosRes, membresiasRes, productosRes, anunciosRes, miMembresiaRes, ventasRes] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('membresias').select('*'),
        supabase.from('productos').select('*'),
        supabase.from('anuncios').select('*', { count: 'exact', head: true }),
        !isAdmin ? supabase.from('membresias').select('*').eq('usuario_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
        isAdmin ? supabase.from('ventas').select('*').gte('created_at', hoy.toISOString()) : Promise.resolve({ data: [] })
      ])

      const totalUsers = usuariosRes.count ?? 0
      const totalProductos = productosRes.data?.length ?? 0
      const totalAnuncios = anunciosRes.count ?? 0

      const ahora = new Date()
      const activas = (membresiasRes.data || []).filter(m => {
        const prox = new Date(m.ultimo_pago)
        prox.setMonth(prox.getMonth() + 1)
        return prox > ahora
      }).length

      const totalMembresias = membresiasRes.data?.length ?? 0
      const bajoStock = (productosRes.data || []).filter(p => p.cantidad <= 20).length

      const ventasHoy = ventasRes.data || []
      const ventasHoyTotal = ventasHoy.reduce((s, v) => s + Number(v.total), 0)
      const ventasHoyCount = ventasHoy.length

      setStats({ totalUsers, activas, totalMembresias, totalProductos, bajoStock, totalAnuncios, ventasHoyTotal, ventasHoyCount })
      if (miMembresiaRes.data) setMembresia(miMembresiaRes.data)
      setLoading(false)

      animateCounts({ totalUsers, activas, totalProductos, bajoStock, totalAnuncios, ventasHoyCount })
    }

    function animateCounts(targets) {
      const duration = 800
      const steps = 20
      const interval = duration / steps
      let step = 0

      const timer = setInterval(() => {
        step++
        const progress = Math.min(step / steps, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = {}
        for (const key in targets) {
          current[key] = Math.round(targets[key] * eased)
        }
        setCounts(current)
        if (progress >= 1) clearInterval(timer)
      }, interval)
    }

    cargarDatos()
  }, [user, isAdmin])

  const calcularProximoPago = (ultimoPago) => {
    const date = new Date(ultimoPago)
    date.setMonth(date.getMonth() + 1)
    return date
  }

  const isVencido = (ultimoPago) => {
    return new Date() > calcularProximoPago(ultimoPago)
  }

  const daysUntil = (ultimoPago) => {
    const diff = calcularProximoPago(ultimoPago) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const sections = [
    { key: 'membresia', label: 'Membresía', icon: '💳', adminOnly: false },
    { key: 'fingerprint', label: 'Asistencia', icon: '🖐️', adminOnly: true },
    { key: 'inventario', label: 'Inventario', icon: '📦', adminOnly: true },
    { key: 'usuarios', label: 'Usuarios', icon: '👥', adminOnly: true },
    { key: 'anuncios', label: 'Anuncios', icon: '📢', adminOnly: true },
    { key: 'admin', label: 'Admin Panel', icon: '⚙️', adminOnly: true },
  ]

  if (loading) {
    return (
      <section className="admin-section">
        <div className="admin-card">
          <div className="skeleton-line half" style={{ height: 24, marginBottom: 8 }}></div>
          <div className="skeleton-line third" style={{ height: 16 }}></div>
        </div>
        <div className="dashboard-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="stat-card" style={{ padding: '1.5rem' }}>
              <div className="skeleton-line" style={{ width: 40, height: 40, marginBottom: 12 }}></div>
              <div className="skeleton-line half" style={{ height: 28, marginBottom: 8 }}></div>
              <div className="skeleton-line third" style={{ height: 14 }}></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="admin-section">
      <div className="admin-card dashboard-header">
        <div>
          <h2 className="admin-title">
            {isAdmin ? 'Panel de Control' : `Bienvenido, ${user?.nombre}`}
          </h2>
          <p className="hero-subtitle" style={{ marginTop: '0.25rem' }}>
            {isAdmin
              ? 'Resumen general del gimnasio'
              : 'Tu estado de membresía y acceso rápido'
            }
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        {isAdmin ? (
          <>
            <StatCard
              type="users"
              icon="👥"
              value={counts.totalUsers ?? 0}
              label="Usuarios Registrados"
              final={stats?.totalUsers}
            />
            <StatCard
              type="memberships"
              icon="✅"
              value={counts.activas ?? 0}
              label="Membresías Activas"
              final={stats?.activas}
              barValue={stats?.totalMembresias > 0 ? (stats.activas / stats.totalMembresias) * 100 : 0}
              barLabel={`${stats?.totalMembresias || 0} totales`}
            />
            <StatCard
              type="products"
              icon="📦"
              value={counts.totalProductos ?? 0}
              label="Productos"
              final={stats?.totalProductos}
            />
            <StatCard
              type="stock"
              icon="⚠️"
              value={counts.bajoStock ?? 0}
              label="Stock Bajo (≤20)"
              final={stats?.bajoStock}
              highlight={stats?.bajoStock > 0}
              barValue={stats?.totalProductos > 0 ? ((stats.totalProductos - stats.bajoStock) / stats.totalProductos) * 100 : 0}
              barLabel={`${((stats?.totalProductos - stats?.bajoStock) / stats?.totalProductos * 100).toFixed(0) || 0}% saludable`}
            />
            <StatCard
              type="announcements"
              icon="📢"
              value={counts.totalAnuncios ?? 0}
              label="Anuncios"
              final={stats?.totalAnuncios}
            />
            <StatCard
              type="sales"
              icon="💰"
              value={`L${stats?.ventasHoyTotal?.toFixed(2) ?? '0.00'}`}
              label={`Ventas Hoy (${stats?.ventasHoyCount ?? 0})`}
              final={stats?.ventasHoyTotal}
            />
          </>
        ) : (
          <>
            <div className="stat-card stat-card-code">
              <div className="stat-card-header">
                <div className="stat-card-icon code-icon">👤</div>
              </div>
              <div className="stat-card-value" style={{ fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '2px', color: 'var(--primary)' }}>
                {user?.codigo || '—'}
              </div>
              <div className="stat-card-label">Mi Código de Acceso</div>
            </div>
            <div className={`stat-card ${membresia && !isVencido(membresia.ultimo_pago) ? 'stat-card-active' : 'stat-card-inactive'}`}>
              <div className="stat-card-header">
                <div className="stat-card-icon status-icon">
                  {membresia ? (isVencido(membresia.ultimo_pago) ? '❌' : '✅') : '⏳'}
                </div>
              </div>
              <div className="stat-card-value">
                {membresia ? (isVencido(membresia.ultimo_pago) ? 'Vencida' : 'Activa') : 'Sin membresía'}
              </div>
              <div className="stat-card-label">Estado de Membresía</div>
              {membresia && (
                <div className="stat-card-bar">
                  <div
                    className="stat-card-bar-fill"
                    style={{
                      width: '100%',
                      background: isVencido(membresia.ultimo_pago) ? '#ef4444' : 'var(--primary)'
                    }}
                  ></div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!isAdmin && membresia && (
        <div className="admin-card">
          <h3 className="admin-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
            Detalle de Membresía
          </h3>
          <div className="membresia-progress">
            <CircularProgress
              daysRemaining={isVencido(membresia.ultimo_pago) ? 0 : Math.max(0, daysUntil(membresia.ultimo_pago))}
              totalDays={30}
              isVencido={isVencido(membresia.ultimo_pago)}
            />
            <div className="membresia-progress-info">
              <div className="membresia-detail-row">
                <span className="membresia-label">Último pago</span>
                <span className="membresia-value">
                  {new Date(membresia.ultimo_pago).toLocaleDateString('es-MX', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>
              <div className="membresia-divider" />
              <div className="membresia-detail-row">
                <span className="membresia-label">Próximo pago</span>
                <span className={`membresia-value ${isVencido(membresia.ultimo_pago) ? 'membresia-vencido' : 'membresia-activo'}`}>
                  {calcularProximoPago(membresia.ultimo_pago).toLocaleDateString('es-MX', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>
              <div className="membresia-divider" />
              <div className="membresia-detail-row">
                <span className="membresia-label">Estado</span>
                <span className={`membresia-badge ${isVencido(membresia.ultimo_pago) ? 'badge-vencido' : 'badge-activo'}`}>
                  {isVencido(membresia.ultimo_pago)
                    ? `Vencido (${Math.abs(daysUntil(membresia.ultimo_pago))} días de retraso)`
                    : `Activo (${daysUntil(membresia.ultimo_pago)} días restantes)`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && stats && (
        <div className="admin-card">
          <h3 className="admin-title" style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
            Salud del Gimnasio
          </h3>
          <div className="health-grid">
            <div className="health-item">
              <div className="health-item-header">
                <span className="health-item-label">Ocupación de Membresías</span>
                <span className="health-item-value">
                  {stats.totalMembresias > 0 ? ((stats.activas / stats.totalMembresias) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="stat-card-bar">
                <div
                  className="stat-card-bar-fill"
                  style={{
                    width: `${stats.totalMembresias > 0 ? (stats.activas / stats.totalMembresias) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #10b981, #34d399)'
                  }}
                ></div>
              </div>
              <span className="health-item-sub">{stats.activas} activas de {stats.totalMembresias} totales</span>
            </div>
            <div className="health-item">
              <div className="health-item-header">
                <span className="health-item-label">Stock Saludable</span>
                <span className="health-item-value">
                  {stats.totalProductos > 0 ? (((stats.totalProductos - stats.bajoStock) / stats.totalProductos) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="stat-card-bar">
                <div
                  className="stat-card-bar-fill"
                  style={{
                    width: `${stats.totalProductos > 0 ? ((stats.totalProductos - stats.bajoStock) / stats.totalProductos) * 100 : 0}%`,
                    background: stats.bajoStock > 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #10b981, #34d399)'
                  }}
                ></div>
              </div>
              <span className="health-item-sub">{stats.totalProductos - stats.bajoStock} en buen stock de {stats.totalProductos}</span>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <h3 className="admin-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
          Acceso Rápido
        </h3>
        <div className="quick-grid">
          {sections
            .filter(s => !s.adminOnly || isAdmin)
            .map(s => (
              <button
                key={s.key}
                className="quick-btn"
                onClick={() => onNavigate(s.key)}
              >
                <div className="quick-btn-icon">{s.icon}</div>
                <div className="quick-btn-label">{s.label}</div>
              </button>
            ))}
        </div>
      </div>
    </section>
  )
}

function StatCard({ type, icon, value, label, barValue, barLabel, highlight }) {
  const colorMap = {
    users: { bar: 'linear-gradient(90deg, #3b82f6, #60a5fa)', icon: '#3b82f6' },
    memberships: { bar: 'linear-gradient(90deg, #10b981, #34d399)', icon: '#10b981' },
    products: { bar: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', icon: '#8b5cf6' },
    stock: { bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)', icon: '#f59e0b' },
    announcements: { bar: 'linear-gradient(90deg, #ec4899, #f472b6)', icon: '#ec4899' },
    sales: { bar: 'linear-gradient(90deg, #f59e0b, #f97316)', icon: '#f59e0b' },
  }

  const colors = colorMap[type] || colorMap.users

  return (
    <div className={`stat-card stat-card-${type} ${highlight ? 'stat-card-warning' : ''}`}>
      <div className="stat-card-accent" style={{ background: colors.bar }}></div>
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ background: `${colors.icon}18`, color: colors.icon }}>
          {icon}
        </div>
        {barLabel && (
          <span className="stat-card-tag" style={{ background: `${colors.icon}18`, color: colors.icon }}>
            {barLabel}
          </span>
        )}
      </div>
      <div className="stat-card-value" style={{ color: highlight ? 'var(--danger)' : undefined }}>
        {value}
      </div>
      <div className="stat-card-label">{label}</div>
      {barValue !== undefined && (
        <div className="stat-card-bar">
          <div
            className="stat-card-bar-fill"
            style={{ width: `${Math.min(barValue, 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}

function CircularProgress({ daysRemaining, totalDays, isVencido }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(daysRemaining / totalDays, 1)
  const offset = circumference * (1 - progress)
  const color = isVencido ? '#ef4444' : '#10b981'

  return (
    <div className="circular-progress">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle className="circular-progress-bg" cx="50" cy="50" r={radius} />
        <circle
          className="circular-progress-fill"
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="circular-progress-text">
        <span className="circular-progress-number" style={{ color }}>
          {isVencido ? 0 : daysRemaining}
        </span>
        <span className="circular-progress-unit">días</span>
      </div>
    </div>
  )
}

export default Dashboard
