import { useNavigate } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();

  const handleVerMedicos = () => {
    navigate('/evaluacion/medicos');
  };

  return (
    <footer className="text-white py-3 mt-5">
      <div className="container d-flex justify-content-between align-items-center flex-wrap gap-2">
        <p className="mb-0">CARDIONET © 2025 - Sistema de Predicción de Cardiopatías</p>
        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={handleVerMedicos}
          title="Ver cardiólogos disponibles"
        >
          <i className="bi bi-people-fill"></i> Ver médicos
        </button>
      </div>
    </footer>
  );
}
