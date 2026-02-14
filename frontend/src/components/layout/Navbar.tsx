import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-dark bg-primary navbar-expand">
      <div className="container">
        <Link to="/" className="navbar-brand mb-0 h1">
          <i className="bi bi-heart-pulse-fill me-2"></i>
          CARDIONET
        </Link>
        <span className="text-white d-none d-md-inline">Sistema de Predicción de Cardiopatías</span>
        <div className="ms-auto d-flex align-items-center gap-2">
          {user ? (
            <>
              <span className="text-white me-2">
                {user.email}
                {user.rol === 'medico' ? ' (Médico)' : ''}
              </span>
              <button className="btn btn-outline-light btn-sm" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-light btn-sm">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn btn-light btn-sm">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
