import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <section className="hero-section py-5 landing-content">
        <div className="container">
          <div className="row align-items-center hero-row">
            <div className="col-lg-6 text-center text-lg-start mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--primary-color)', letterSpacing: '-0.02em' }}>
                <i className="bi bi-heart-pulse-fill me-2"></i>
                CARDIONET
              </h1>
              <p className="lead mb-0" style={{ color: 'var(--text-dark)', fontSize: '1.2rem' }}>
                Sistema de predicción de cardiopatías y recomendación de cardiólogos.
              </p>
            </div>
            <div className="col-lg-6 d-flex justify-content-center justify-content-lg-end">
              <div
                className="hero-heart"
                style={{
                  backgroundImage: 'url(/hheart.png)',
                  backgroundPosition: 'center',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>
          </div>

          {/* Objetivo clínico */}
          <div className="card shadow-sm mb-5 border-0 overflow-hidden landing-card-fade">
            <div className="card-header py-3" style={{ background: 'var(--primary-color)' }}>
              <h5 className="mb-0 text-white">
                <i className="bi bi-bullseye me-2"></i>
                Objetivo clínico del sistema
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex align-items-start landing-card-item">
                    <span className="me-3 mt-1 icon-primary">
                      <i className="bi bi-tools fs-4"></i>
                    </span>
                    <div>
                      <h6 className="fw-semibold text-dark mb-2">Herramienta de soporte a la decisión clínica</h6>
                      <p className="text-muted small mb-0">
                        Orientada al triaje. Ayuda al profesional a priorizar y clasificar casos según el nivel de riesgo estimado.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start landing-card-item">
                    <span className="me-3 mt-1 icon-primary">
                      <i className="bi bi-graph-up-arrow fs-4"></i>
                    </span>
                    <div>
                      <h6 className="fw-semibold text-dark mb-2">Estimación del riesgo</h6>
                      <p className="text-muted small mb-0">
                        Calcula el nivel de riesgo del usuario a partir de variables clínicas (edad, presión arterial, colesterol, etc.).
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start landing-card-item">
                    <span className="me-3 mt-1 icon-primary">
                      <i className="bi bi-shield-exclamation fs-4"></i>
                    </span>
                    <div>
                      <h6 className="fw-semibold text-dark mb-2">No realiza diagnóstico definitivo</h6>
                      <p className="text-muted small mb-0">
                        Es una herramienta de apoyo. El resultado no sustituye la valoración médica ni establece un diagnóstico.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start landing-card-item">
                    <span className="me-3 mt-1 icon-primary">
                      <i className="bi bi-geo-alt fs-4"></i>
                    </span>
                    <div>
                      <h6 className="fw-semibold text-dark mb-2">Derivación al especialista</h6>
                      <p className="text-muted small mb-0">
                        Orienta la derivación a un cardiólogo cercano, mostrando información relevante para el seguimiento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Opciones de salida */}
          <div className="card shadow-sm mb-5 border-0 overflow-hidden landing-card-fade">
            <div className="card-header py-3" style={{ background: 'var(--primary-color)' }}>
              <h5 className="mb-0 text-white">
                <i className="bi bi-clipboard2-pulse me-2"></i>
                Opciones de salida
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-md-6 col-lg-3">
                  <div className="opcion-salida-item text-center p-4 rounded-3 h-100">
                    <i className="bi bi-activity fs-2 mb-3 d-block icon-primary"></i>
                    <h6 className="fw-semibold mb-2">Nivel de riesgo</h6>
                    <p className="text-muted small mb-0">Bajo, medio o alto según el perfil clínico del usuario.</p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="opcion-salida-item text-center p-4 rounded-3 h-100">
                    <i className="bi bi-percent fs-2 mb-3 d-block icon-primary"></i>
                    <h6 className="fw-semibold mb-2">Probabilidad</h6>
                    <p className="text-muted small mb-0">Probabilidad asociada al riesgo estimado (%).</p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="opcion-salida-item text-center p-4 rounded-3 h-100">
                    <i className="bi bi-chat-quote fs-2 mb-3 d-block icon-primary"></i>
                    <h6 className="fw-semibold mb-2">Mensaje de acción</h6>
                    <p className="text-muted small mb-0">Recomendación clara según el nivel de riesgo.</p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="opcion-salida-item text-center p-4 rounded-3 h-100">
                    <i className="bi bi-people fs-2 mb-3 d-block icon-primary"></i>
                    <h6 className="fw-semibold mb-2">Guía de derivación</h6>
                    <p className="text-muted small mb-0">Información para derivación al especialista cercano.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="card shadow-sm border-0 mb-4 landing-card-fade" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="card-body py-5 text-center">
              <h5 className="mb-2" style={{ color: 'var(--primary-color)' }}>
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Comenzar
              </h5>
              <p className="text-muted small mb-4">
                Prueba la evaluación de riesgo sin crear cuenta.
              </p>
              <div className="d-grid gap-3">
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/evaluacion')}>
                  <i className="bi bi-heart-pulse me-2"></i>
                  Continuar como visitante
                </button>
                <p className="text-muted small mb-0 mt-1">O si ya tienes cuenta:</p>
                <button className="btn btn-outline-primary btn-lg" onClick={() => navigate('/login')}>
                  Iniciar sesión
                </button>
                <button className="btn btn-outline-primary btn-lg" onClick={() => navigate('/registro')}>
                  Registrarse como paciente
                </button>
                <button className="btn btn-outline-secondary btn-lg" onClick={() => navigate('/registro-medico')}>
                  Registrarse como médico
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
