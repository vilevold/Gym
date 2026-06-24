import { useState } from 'react'
import { supabase } from './supabaseClient'
import AdminPanel from './AdminPanel'

function App() {
  const [workouts, setWorkouts] = useState(0)
  const [section, setSection] = useState('dashboard')

  // Estado de usuario para controlar la sesión (Opción 2)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gympro_user')
    return saved ? JSON.parse(saved) : null
  })

  // Estados del Formulario de Login
  const [codigo, setCodigo] = useState('')
  const [profiles, setProfiles] = useState([])
  const [showProfileSelector, setShowProfileSelector] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Estados para acceso admin
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  // Estado del menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setAdminPassword('')

    if (!codigo.trim()) {
      setError('Por favor, ingresa tu código de acceso.')
      return
    }

    if (codigo.trim() === '1212') {
      setShowAdminPassword(true)
      return
    }

    setLoading(true)
    setProfiles([])
    setShowProfileSelector(false)

    try {
      console.log('[DEBUG] Iniciando petición a Supabase...')
      console.log('[DEBUG] Consultando usuarios con código:', codigo.trim())

      const { data, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo', codigo.trim())

      console.log('[DEBUG] Respuesta de Supabase - data:', data, 'error:', dbError)

      if (dbError) {
        throw new Error(dbError.message)
      }

      if (!data || data.length === 0) {
        setError('El código de acceso no existe en el sistema.')
        setLoading(false)
        return
      }

      setProfiles(data)
      setShowProfileSelector(true)
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error al validar el código: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminPasswordSubmit = (e) => {
    e.preventDefault()
    if (adminPassword === 'valhalla') {
      const adminUser = { id: 0, codigo: '1212', nombre: 'Admin' }
      setUser(adminUser)
      localStorage.setItem('gympro_user', JSON.stringify(adminUser))
      setSection('admin')
    } else {
      setError('Contraseña incorrecta.')
    }
  }

  const selectProfile = (profile) => {
    const loggedInUser = {
      id: profile.id,
      codigo: profile.codigo,
      nombre: profile.nombre || 'Usuario GymPro',
      imagen: profile.imagen || null
    }
    setUser(loggedInUser)
    setSection('dashboard')
    localStorage.setItem('gympro_user', JSON.stringify(loggedInUser))
  }

  const handleLogout = () => {
    setUser(null)
    setSection('dashboard')
    localStorage.removeItem('gympro_user')
    setIsMobileMenuOpen(false)
    setCodigo('')
    setProfiles([])
    setShowProfileSelector(false)
    setShowAdminPassword(false)
    setAdminPassword('')
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleGoBack = () => {
    setShowProfileSelector(false)
    setProfiles([])
    setError('')
  }

  const isAdmin = user?.codigo === '1212'

  // Obtener iniciales del nombre para el avatar
  const getInitials = (name) => {
    if (!name) return 'GP'
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // Vista de Login si el usuario no ha iniciado sesión
  if (!user) {
    return (
      <div className="login-container">
        {showAdminPassword ? (
          <div className="login-card">
            <div className="login-header">
              <h2 className="login-logo">
                Valhalla <span className="brand-dot"></span>
              </h2>
              <p className="login-subtitle">Ingresa la contraseña de administrador</p>
            </div>

            <form onSubmit={handleAdminPasswordSubmit} className="login-form">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-text">{error}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="admin-password">Contraseña</label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Ingresar como Admin
              </button>
            </form>

            <button
              onClick={() => { setShowAdminPassword(false); setError('') }}
              className="btn btn-outline btn-block btn-back"
              type="button"
            >
              Volver
            </button>
          </div>
        ) : !showProfileSelector ? (
          <div className="login-card">
            <div className="login-header">
              <h2 className="login-logo">
                Valhalla <span className="brand-dot"></span>
              </h2>
              <p className="login-subtitle">Ingresa tu código de acceso para comenzar</p>
            </div>

            <form onSubmit={handleCodeSubmit} className="login-form">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-text">{error}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="codigo">Código de Acceso</label>
                <input
                  id="codigo"
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej. GYM-12345"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Buscando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="login-card profile-selection-card">
            <div className="login-header">
              <h2 className="profile-title">¿Quién está entrenando hoy?</h2>
              <p className="login-subtitle">Código de acceso: <strong>{codigo}</strong></p>
            </div>

            <div className="profile-grid">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className="profile-card"
                  onClick={() => selectProfile(profile)}
                  type="button"
                >
                  <div className="profile-avatar">
                    {profile.imagen ? (
                      <img src={profile.imagen} alt={profile.nombre} className="profile-img" />
                    ) : (
                      getInitials(profile.nombre)
                    )}
                  </div>
                  <span className="profile-name">{profile.nombre}</span>
                </button>
              ))}
            </div>

            <button onClick={handleGoBack} className="btn btn-outline btn-block btn-back" type="button">
              Volver
            </button>
          </div>
        )}
      </div>
    )
  }

  // Vista del Dashboard una vez logueado
  return (
    <div className="app-container">
      {/* Navegación */}
      <nav className="navbar">
        <div className="nav-brand">
          Valhalla <span className="brand-dot"></span>
        </div>

        {/* Toggle para menú móvil */}
        <button
          className={`nav-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Alternar menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <li className="nav-user-info">
            <div className="nav-avatar">
              {user?.imagen ? (
                <img src={user.imagen} alt={user.nombre} className="nav-avatar-img" />
              ) : (
                getInitials(user?.nombre)
              )}
            </div>
            <span className="nav-user-name">{user?.nombre}</span>
          </li>
          <li><a href="#dashboard" onClick={() => { setSection('dashboard'); closeMobileMenu() }}>Dashboard</a></li>
          {isAdmin && (
            <>
              <li><a href="#clases" onClick={() => { setSection('clases'); closeMobileMenu() }}>Clases</a></li>
              <li><a href="#planes" onClick={() => { setSection('planes'); closeMobileMenu() }}>Planes</a></li>
              <li><a href="#admin" className="nav-link-admin" onClick={() => { setSection('admin'); closeMobileMenu() }}>Admin Panel</a></li>
            </>
          )}
          <li>
            <button className="btn btn-outline btn-logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </li>
        </ul>
      </nav>

      {section === 'admin' ? (
        <AdminPanel />
      ) : section === 'clases' ? (
        <header className="hero">
          <span className="badge">📅 Clases</span>
          <h1 className="hero-title">
            Horario de <span>Clases</span>
          </h1>
          <p className="hero-subtitle">
            Administra las disciplinas, horarios y entrenadores disponibles.
          </p>
          <div className="skeleton-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="skeleton-card">
              <div className="card-header">
                <span className="card-icon">📅</span>
                <span className="card-tag">Estructura</span>
              </div>
              <h3 className="card-title">Clases Semanales</h3>
              <p className="card-description">
                Aquí podrás gestionar el calendario de clases (CrossFit, Yoga, Zumba, etc.).
              </p>
              <div className="skeleton-bar-group">
                <div className="skeleton-line active"></div>
                <div className="skeleton-line third"></div>
                <div className="skeleton-line half"></div>
              </div>
            </div>
          </div>
        </header>
      ) : section === 'planes' ? (
        <header className="hero">
          <span className="badge">💳 Planes</span>
          <h1 className="hero-title">
            Planes de <span>Suscripción</span>
          </h1>
          <p className="hero-subtitle">
            Administra los planes de membresía, precios y beneficios.
          </p>
          <div className="skeleton-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="skeleton-card">
              <div className="card-header">
                <span className="card-icon">💳</span>
                <span className="card-tag">Diseño</span>
              </div>
              <h3 className="card-title">Suscripciones</h3>
              <p className="card-description">
                Aquí podrás gestionar los planes de membresía y precios.
              </p>
              <div className="skeleton-bar-group">
                <div className="skeleton-line"></div>
                <div className="skeleton-line active"></div>
                <div className="skeleton-line half"></div>
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className="hero">
          <span className="badge">Sesión iniciada como: {user.nombre} ({user.codigo})</span>
          <h1 className="hero-title">
            Tu próximo gran proyecto de <span>Fitness</span> comienza aquí
          </h1>
          <p className="hero-subtitle">
            Un esqueleto de React limpio, optimizado y listo para agregar componentes y lógica de negocio.
          </p>

          <div className="skeleton-grid">
            <div className="skeleton-card" id="dashboard">
              <div className="card-header">
                <span className="card-icon">🏋️‍♂️</span>
                <span className="card-tag">Interactivo</span>
              </div>
              <h3 className="card-title">Registro de Rutinas</h3>
              <p className="card-description">
                Un componente reactivo simple para probar el estado y el HMR de React.
              </p>
              <div className="counter-box">
                <button
                  className="btn btn-outline"
                  onClick={() => setWorkouts(Math.max(0, workouts - 1))}
                >
                  -
                </button>
                <span className="counter-value">{workouts}</span>
                <button
                  className="btn btn-primary"
                  onClick={() => setWorkouts(workouts + 1)}
                >
                  + Rutina
                </button>
              </div>
            </div>

            <div className="skeleton-card" id="schedule">
              <div className="card-header">
                <span className="card-icon">📅</span>
                <span className="card-tag">Estructura</span>
              </div>
              <h3 className="card-title">Clases Semanales</h3>
              <p className="card-description">
                Espacio reservado para el calendario interactivo de disciplinas (CrossFit, Yoga, Zumba).
              </p>
              <div className="skeleton-bar-group">
                <div className="skeleton-line active"></div>
                <div className="skeleton-line third"></div>
                <div className="skeleton-line half"></div>
              </div>
            </div>

            <div className="skeleton-card" id="pricing">
              <div className="card-header">
                <span className="card-icon">💳</span>
                <span className="card-tag">Diseño</span>
              </div>
              <h3 className="card-title">Suscripciones</h3>
              <p className="card-description">
                Espacio reservado para la calculadora interactiva de membresías y pasarela de pago.
              </p>
              <div className="skeleton-bar-group">
                <div className="skeleton-line"></div>
                <div className="skeleton-line active"></div>
                <div className="skeleton-line half"></div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} GymPro. Desarrollado con React, Vite y Supabase.</p>
      </footer>
    </div>
  )
}

export default App

