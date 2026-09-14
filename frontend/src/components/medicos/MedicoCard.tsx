import type { Medico } from '../../api/medicos';

interface Props {
  medico: Medico;
  recomendado?: boolean;
  onClick?: () => void;
}

export function MedicoCard({ medico, recomendado, onClick }: Props) {
  const cal = Number(medico.calificacion) || 0;
  const estrellas = '★'.repeat(Math.floor(cal)) + '☆'.repeat(5 - Math.floor(cal));
  const tieneMapa = medico.latitud != null && medico.longitud != null;

  return (
    <div
      className={`medico-card ${recomendado ? 'medico-recomendado' : ''}`}
    >
      {recomendado && (
        <span className="badge-recomendado">
          <i className="bi bi-star-fill"></i> Altamente Recomendado
        </span>
      )}
      <h5 className="mb-3">
        <i className="bi bi-person-badge-fill"></i> {medico.nombre}
      </h5>
      <div className="mb-3">
        <span className="badge bg-primary me-2">{medico.especialidad || 'CARDIOLOGÍA'}</span>
        {medico.subespecialidad && (
          <span className="badge bg-success me-2">
            <i className="bi bi-award-fill"></i> {medico.subespecialidad}
          </span>
        )}
        <span className="badge" style={{ background: 'var(--primary-color)' }}>
          <i className="bi bi-geo-fill"></i> {medico.distrito || medico.region || medico.provincia || 'LIMA'}
        </span>
      </div>
      <div className="calificacion mb-3">
        {estrellas} <span className="rating-number">{cal.toFixed(1)}</span>
        {medico.num_opiniones != null && medico.num_opiniones > 0 && (
          <span className="text-muted ms-2">({medico.num_opiniones} opiniones)</span>
        )}
      </div>
      {medico.precio_visita && (
        <div className="info-medico mb-2">
          <i className="bi bi-currency-dollar"></i>
          <strong>Precio visita:</strong> {medico.precio_visita}
        </div>
      )}
      <div className="info-medico">
        <i className="bi bi-telephone-fill"></i>
        <strong>Teléfono:</strong> {medico.telefono || 'No especificado'}
      </div>
      {(medico.direccion_completa || medico.ubicacion_consultorio) && (
        <div className="info-medico">
          <i className="bi bi-geo-alt-fill"></i>
          <strong>Consultorio:</strong> {medico.direccion_completa || medico.ubicacion_consultorio}
        </div>
      )}
      {(medico.distrito || medico.provincia) && (
        <div className="info-medico">
          <i className="bi bi-pin-map-fill"></i>
          <strong>Ubicación:</strong> {[medico.distrito, medico.provincia].filter(Boolean).join(', ')}
          {medico.region ? ` - ${medico.region}` : ''}
        </div>
      )}
      {onClick && tieneMapa && (
        <div className="mt-3">
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={onClick}>
            <i className="bi bi-map"></i> Ver en mapa
          </button>
        </div>
      )}
    </div>
  );
}
