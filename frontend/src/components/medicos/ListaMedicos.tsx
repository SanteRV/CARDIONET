import { useState, useEffect, useRef } from 'react';
import type { Medico } from '../../api/medicos';
import { MedicoCard } from './MedicoCard';
import * as medicosApi from '../../api/medicos';
import { LoadingOverlay } from '../ui/LoadingOverlay';

const PER_PAGE = 10;

interface Props {
  perfilDetectado?: string;
  medicosRecomendados?: Medico[];
  medicos?: Medico[];
  loading?: boolean;
  medicoSeleccionadoId?: number;
  onCardClick?: (medico: Medico) => void;
  onVerTodos?: () => void;
}

export function ListaMedicos({
  perfilDetectado,
  medicosRecomendados,
  medicos: medicosExternos,
  loading: loadingExterno,
  medicoSeleccionadoId,
  onCardClick,
  onVerTodos,
}: Props) {
  const [medicosInternos, setMedicosInternos] = useState<Medico[]>(medicosRecomendados || []);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingInterno, setLoadingInterno] = useState(!medicosRecomendados && !medicosExternos);
  const [mode, setMode] = useState<'recomendados' | 'todos'>(medicosRecomendados ? 'recomendados' : 'todos');
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const medicos = medicosExternos ?? medicosInternos;
  const loading = loadingExterno ?? loadingInterno;

  useEffect(() => {
    if (!medicosRecomendados && !medicosExternos) loadTodos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (medicoSeleccionadoId != null && medicosExternos) {
      const idx = medicosExternos.findIndex((m) => m.id === medicoSeleccionadoId);
      if (idx >= 0) {
        const targetPage = Math.floor(idx / PER_PAGE) + 1;
        setPage((p) => (p !== targetPage ? targetPage : p));
      }
    }
  }, [medicoSeleccionadoId, medicosExternos]);

  useEffect(() => {
    if (medicoSeleccionadoId != null) {
      requestAnimationFrame(() => {
        const el = cardRefs.current[medicoSeleccionadoId!];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [medicoSeleccionadoId, page]);

  const loadTodos = async (p = 1) => {
    setLoadingInterno(true);
    try {
      const { ok, data } = await medicosApi.getTodos(p, medicosExternos ? 50 : PER_PAGE);
      if (ok && data.medicos) {
        setMedicosInternos(data.medicos);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.total_pages);
        setMode('todos');
      }
    } finally {
      setLoadingInterno(false);
    }
  };

  const paginatedMedicos = medicosExternos
    ? medicosExternos.slice((page - 1) * PER_PAGE, page * PER_PAGE)
    : medicos;
  const paginatedTotalPages = medicosExternos
    ? Math.ceil(medicosExternos.length / PER_PAGE) || 1
    : totalPages;

  const goToPage = (p: number) => {
    if (medicosExternos) {
      setPage(Math.max(1, Math.min(p, paginatedTotalPages)));
    } else {
      loadTodos(p);
    }
  };

  return (
    <div className="card shadow">
      <div className="card-header text-white" style={{ background: 'var(--primary-color)' }}>
        <h4 className="mb-0">Cardiólogos Disponibles</h4>
      </div>
      <div className="card-body">
        {loading && <LoadingOverlay />}

        {perfilDetectado && mode === 'recomendados' && (
          <div className="alert alert-info mb-4">
            <h6>Perfil Detectado: <strong>{perfilDetectado}</strong></h6>
            <p className="mb-0">Los siguientes cardiólogos están especializados en tu condición.</p>
          </div>
        )}

        {mode === 'todos' && (
          <div className="alert alert-secondary mb-4">
            <h6>Todos los Cardiólogos ({medicosExternos ? medicosExternos.length : total})</h6>
            <p className="mb-0">Página {page} de {paginatedTotalPages}</p>
          </div>
        )}

        {paginatedMedicos.length === 0 ? (
          <div className="alert alert-warning text-center">
            <i className="bi bi-info-circle"></i> No se encontraron cardiólogos disponibles.
          </div>
        ) : (
          <>
            {paginatedMedicos.map((m) => (
              <div
                key={m.id}
                ref={(el) => { cardRefs.current[m.id] = el; }}
                className={`mb-3 ${medicoSeleccionadoId === m.id ? 'medico-card-selected' : ''}`}
              >
                <MedicoCard
                  medico={m}
                  recomendado={mode === 'recomendados'}
                  onClick={onCardClick ? () => onCardClick(m) : undefined}
                />
              </div>
            ))}
            {medicosExternos && paginatedTotalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <span className="text-muted">Página {page} de {paginatedTotalPages}</span>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                        Anterior
                      </button>
                    </li>
                    <li className={`page-item ${page >= paginatedTotalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => goToPage(page + 1)} disabled={page >= paginatedTotalPages}>
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}

        {!medicosExternos && mode === 'todos' && totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
            <span className="text-muted">Página {page} de {totalPages}</span>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => loadTodos(page - 1)} disabled={page <= 1}>
                    Anterior
                  </button>
                </li>
                <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => loadTodos(page + 1)} disabled={page >= totalPages}>
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {mode === 'recomendados' && onVerTodos && (
          <div className="text-center mt-4">
            <button className="btn btn-outline-primary btn-lg" onClick={() => loadTodos(1)}>
              Ver Todos los Cardiólogos Disponibles
            </button>
          </div>
        )}

        {onVerTodos && (
          <div className="text-center mt-3">
            <button className="btn btn-secondary" onClick={onVerTodos}>
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
