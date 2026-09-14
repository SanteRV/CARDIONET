import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegistroPacientePage } from './pages/RegistroPacientePage';
import { RegistroMedicoPage } from './pages/RegistroMedicoPage';
import { EvaluacionPage } from './pages/EvaluacionPage';
import { MedicosPage } from './pages/MedicosPage';
import { PerfilMedicoPage } from './pages/PerfilMedicoPage';
import { AnalisisComparativoPage } from './pages/AnalisisComparativoPage';

function ProtectedPerfil({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container my-5 text-center">Cargando...</div>;
  if (!user || user.rol !== 'medico') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border" style={{ color: 'var(--primary-color)' }} role="status" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? (user.rol === 'medico' ? <Navigate to="/perfil-medico" replace /> : <Navigate to="/evaluacion" replace />) : <LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPacientePage />} />
        <Route path="/registro-medico" element={<RegistroMedicoPage />} />
        <Route path="/evaluacion" element={<EvaluacionPage />} />
        <Route path="/evaluacion/comparativo" element={<AnalisisComparativoPage />} />
        <Route path="/evaluacion/medicos" element={<MedicosPage />} />
        <Route
          path="/perfil-medico"
          element={
            <ProtectedPerfil>
              <PerfilMedicoPage />
            </ProtectedPerfil>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
