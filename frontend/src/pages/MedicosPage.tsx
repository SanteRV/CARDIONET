import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListaMedicos } from '../components/medicos/ListaMedicos';
import { MapaCardiologos } from '../components/medicos/MapaCardiologos';
import * as medicosApi from '../api/medicos';
import type { Medico } from '../api/medicos';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export function MedicosPage() {
  const navigate = useNavigate();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [medicoSeleccionadoId, setMedicoSeleccionadoId] = useState<number | undefined>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    medicosApi.getTodos(1, 1000)
      .then(({ ok, data }) => {
        if (!cancelled && ok && data.medicos) setMedicos(data.medicos);
      })
      .catch(() => { /* fallback: medicos queda [] */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container-fluid my-4 px-3" style={{ minHeight: 'calc(100vh - 160px)' }}>
      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="overflow-auto pe-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <ListaMedicos
              medicos={medicos}
              loading={loading}
              medicoSeleccionadoId={medicoSeleccionadoId}
              onCardClick={(m) => setMedicoSeleccionadoId(m.id)}
              onVerTodos={() => navigate('/evaluacion')}
            />
          </div>
        </div>
        <div className="col-12 col-lg-7 d-flex flex-column" style={{ minHeight: 'calc(100vh - 180px)' }}>
          <div className="mapa-wrapper rounded shadow bg-light flex-grow-1" style={{ minHeight: '450px' }}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-muted">Mapa no disponible</div>}>
              <MapaCardiologos
                  medicos={medicos}
                  medicoSeleccionadoId={medicoSeleccionadoId}
                  onMedicoSeleccionado={(m) => setMedicoSeleccionadoId(m.id)}
                />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
