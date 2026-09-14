import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { EvaluacionActualProvider } from './context/EvaluacionActual';
import { LandingPage } from './pages/LandingPage';

// Las páginas de evaluación y comparación (modelos, Chart.js) se cargan al abrirlas,
// para que la portada no descargue modelo.json ni los gráficos.
const EvaluacionPage = lazy(() => import('./pages/EvaluacionPage').then((m) => ({ default: m.EvaluacionPage })));
const AnalisisComparativoPage = lazy(() =>
  import('./pages/AnalisisComparativoPage').then((m) => ({ default: m.AnalisisComparativoPage }))
);

function IrArribaAlCambiarDeRuta() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function Cargando() {
  return (
    <div className="container my-5 text-center">
      <span className="spinner-border text-secondary" role="status" aria-label="Cargando"></span>
    </div>
  );
}

function ErrorAlCargar(error: Error) {
  return (
    <div className="container my-5">
      <div className="alert alert-danger">
        <p className="mb-2">
          No se pudo cargar esta página. Si el sitio se actualizó mientras la tenías abierta, recárgala.
        </p>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()}>
          Recargar la página
        </button>
        <pre className="mt-3 mb-0 small">{error.message}</pre>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <EvaluacionActualProvider>
        <IrArribaAlCambiarDeRuta />
        <Navbar />
        <ErrorBoundary fallback={ErrorAlCargar}>
          <Suspense fallback={<Cargando />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/evaluacion" element={<EvaluacionPage />} />
              <Route path="/evaluacion/comparativo" element={<AnalisisComparativoPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Footer />
      </EvaluacionActualProvider>
    </BrowserRouter>
  );
}
