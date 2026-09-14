import { useNavigate } from 'react-router-dom';
import { TEXTO_NO_DIAGNOSTICO } from '../components/evaluacion/Avisos';

const PASOS = [
  {
    icono: 'bi-clipboard2-pulse',
    titulo: 'Ingresas 13 datos clínicos',
    texto: 'Edad, presión arterial, colesterol y resultados de exámenes como el electrocardiograma y la prueba de esfuerzo.',
  },
  {
    icono: 'bi-percent',
    titulo: 'Obtienes una probabilidad estimada',
    texto: 'El modelo principal, Random Forest, estima la probabilidad de enfermedad cardíaca con esos datos.',
  },
  {
    icono: 'bi-bar-chart-line',
    titulo: 'Comparas tres modelos',
    texto: 'Ves qué estiman Random Forest, árbol de decisión y SVM, y cómo se comportaron en la validación.',
  },
  {
    icono: 'bi-shield-exclamation',
    titulo: 'No es un diagnóstico',
    texto: 'Una probabilidad baja no descarta una enfermedad. Ante cualquier duda, consulta a un médico.',
  },
];

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
              <p className="lead mb-3" style={{ color: 'var(--text-dark)', fontSize: '1.2rem' }}>
                Estima la probabilidad de enfermedad cardíaca a partir de 13 datos clínicos, con modelos entrenados
                con el conjunto de datos público Heart Disease de Cleveland.
              </p>
              <p className="mb-4" style={{ color: 'var(--text-dark)' }}>
                {TEXTO_NO_DIAGNOSTICO} El cálculo se hace en tu navegador y no guarda tus datos.
              </p>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/evaluacion')}>
                <i className="bi bi-heart-pulse me-2"></i>
                Empezar evaluación
              </button>
            </div>
            <div className="col-lg-6 d-flex justify-content-center justify-content-lg-end">
              <div
                className="hero-heart"
                role="img"
                aria-label="Ilustración de un corazón"
                style={{
                  backgroundImage: 'url(/hheart.png)',
                  backgroundPosition: 'center',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>
          </div>

          <div className="card shadow-sm mb-5 border-0 overflow-hidden landing-card-fade">
            <div className="card-header py-3" style={{ background: 'var(--primary-color)' }}>
              <h5 className="mb-0 text-white">
                <i className="bi bi-list-check me-2"></i>
                Cómo funciona
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                {PASOS.map((paso) => (
                  <div className="col-md-6" key={paso.titulo}>
                    <div className="d-flex align-items-start landing-card-item">
                      <span className="me-3 mt-1 icon-primary">
                        <i className={`bi ${paso.icono} fs-4`}></i>
                      </span>
                      <div>
                        <h6 className="fw-semibold text-dark mb-2">{paso.titulo}</h6>
                        <p className="text-muted small mb-0">{paso.texto}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
