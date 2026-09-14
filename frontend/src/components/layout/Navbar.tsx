import { Link, NavLink } from 'react-router-dom';

const claseBoton = ({ isActive }: { isActive: boolean }) =>
  `btn btn-sm ${isActive ? 'btn-light' : 'btn-outline-light'}`;

export function Navbar() {
  return (
    <nav className="navbar navbar-dark bg-primary navbar-expand">
      <div className="container flex-wrap gap-2">
        <Link to="/" className="navbar-brand mb-0 h1">
          <i className="bi bi-heart-pulse-fill me-2"></i>
          CARDIONET
        </Link>
        <span className="text-white d-none d-lg-inline">Estimación educativa del riesgo de enfermedad cardíaca</span>
        <div className="ms-auto d-flex align-items-center gap-2">
          <NavLink to="/evaluacion" end className={claseBoton}>
            Evaluación
          </NavLink>
          <NavLink to="/evaluacion/comparativo" className={claseBoton}>
            Comparar modelos
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
