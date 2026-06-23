import { useState } from 'react'

function App() {
  const [workouts, setWorkouts] = useState(0)

  return (
    <div className="app-container">
      {/* Navegación */}
      <nav className="navbar">
        <div className="nav-brand">
          GymPro <span className="brand-dot"></span>
        </div>
        <ul className="nav-links">
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#schedule">Clases</a></li>
          <li><a href="#pricing">Planes</a></li>
        </ul>
      </nav>

      {/* Hero / Header */}
      <header className="hero">
        <span className="badge">Esqueleto React + Vite</span>
        <h1 className="hero-title">
          Tu próximo gran proyecto de <span>Fitness</span> comienza aquí
        </h1>
        <p className="hero-subtitle">
          Un esqueleto de React limpio, optimizado y listo para agregar componentes y lógica de negocio.
        </p>

        {/* Rejilla de Componentes Esqueleto */}
        <div className="skeleton-grid">
          {/* Card 1: Interactiva (Contador de entrenamientos) */}
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

          {/* Card 2: Esqueleto de Horario */}
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

          {/* Card 3: Esqueleto de Precios */}
          <div className="skeleton-card" id="pricing">
            <div className="card-header">
              <span className="card-icon">💳</span>
              <span className="card-tag">Diseño</span>
            </div>
            <h3 className="card-title">Suscripciones</h3>
            <p className="card-description">
              Contenedor para la calculadora interactiva de membresías y pasarela de pago.
            </p>
            <div className="skeleton-bar-group">
              <div className="skeleton-line"></div>
              <div className="skeleton-line active"></div>
              <div className="skeleton-line half"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} GymPro. Desarrollado con React y Vite.</p>
      </footer>
    </div>
  )
}

export default App
