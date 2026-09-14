import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EvaluacionInput, EvaluacionResultado } from '../api/evaluacion';
import * as evaluacionApi from '../api/evaluacion';
import * as medicosApi from '../api/medicos';
import { FormularioEvaluacion } from '../components/evaluacion/FormularioEvaluacion';
import { ModalRegistroOpcional } from '../components/evaluacion/ModalRegistroOpcional';
import { ResultadoEvaluacion } from '../components/evaluacion/ResultadoEvaluacion';
import { ListaMedicos } from '../components/medicos/ListaMedicos';
import { MapaCardiologos } from '../components/medicos/MapaCardiologos';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

type View = 'form' | 'resultado' | 'medicos';

export function EvaluacionPage() {
  const [view, setView] = useState<View>('form');
  const [resultado, setResultado] = useState<EvaluacionResultado | null>(null);
  const [medicosRecomendados, setMedicosRecomendados] = useState<{ medicos: Awaited<ReturnType<typeof medicosApi.getRecomendados>>['data']['medicos']; perfilDetectado: string } | null>(null);
  const [medicoSeleccionadoId, setMedicoSeleccionadoId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [showModalRegistro, setShowModalRegistro] = useState(false);
  const [datosEvaluacion, setDatosEvaluacion] = useState<EvaluacionInput | null>(null);
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (data: EvaluacionInput) => {
    setLoading(true);
    try {
      const { ok, data: res } = await evaluacionApi.evaluar(data);
      if (ok && res && !('error' in res)) {
        setResultado(res);
        setDatosEvaluacion(data);
        setView('resultado');
        if (!user) setShowModalRegistro(true);
      } else {
        notify((res as { error?: string }).error || 'No se pudo realizar la evaluación', 'error');
      }
    } catch (err) {
      notify('Error de conexión con el servidor: ' + (err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerMedicos = async () => {
    if (!resultado) return;
    setLoading(true);
    try {
      const { ok, data } = await medicosApi.getRecomendados(resultado.perfil_riesgo);
      if (ok && data.medicos) {
        setMedicosRecomendados({ medicos: data.medicos, perfilDetectado: data.perfil_detectado });
        setView('medicos');
      } else {
        notify((data as { error?: string }).error || 'No se pudieron obtener los médicos', 'error');
      }
    } catch (err) {
      notify('Error de conexión: ' + (err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaEvaluacion = () => {
    setResultado(null);
    setMedicosRecomendados(null);
    setMedicoSeleccionadoId(undefined);
    setDatosEvaluacion(null);
    setShowModalRegistro(false);
    setView('form');
  };

  const handleRegistrarse = () => {
    setShowModalRegistro(false);
    navigate('/registro', { state: { datosPaciente: datosEvaluacion } });
  };

  const handleDemo = () => {
    notify('Datos de demo cargados. Pulse "Evaluar Riesgo" para ver el resultado.', 'info');
  };

  const handleVolverResultado = () => {
    setView(resultado ? 'resultado' : 'form');
  };

  return (
    <div className="container my-5">
      {loading && <LoadingOverlay />}

      {view === 'form' && (
        <FormularioEvaluacion onSubmit={handleSubmit} onDemo={handleDemo} />
      )}

      {view === 'resultado' && resultado && (
        <ResultadoEvaluacion
          resultado={resultado}
          onVerMedicos={handleVerMedicos}
          onNuevaEvaluacion={handleNuevaEvaluacion}
        />
      )}

      {view === 'medicos' && medicosRecomendados && (
        <div className="container-fluid px-0" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="row g-3">
            <div className="col-12 col-lg-5">
              <div className="overflow-auto pe-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                <ListaMedicos
                  perfilDetectado={medicosRecomendados.perfilDetectado}
                  medicosRecomendados={medicosRecomendados.medicos}
                  medicoSeleccionadoId={medicoSeleccionadoId}
                  onCardClick={(m) => setMedicoSeleccionadoId(m.id)}
                  onVerTodos={resultado ? handleVolverResultado : () => navigate('/evaluacion')}
                />
              </div>
            </div>
            <div className="col-12 col-lg-7 d-flex flex-column" style={{ minHeight: 'calc(100vh - 220px)' }}>
              <div className="mapa-wrapper rounded shadow bg-light flex-grow-1" style={{ minHeight: '450px' }}>
                <ErrorBoundary fallback={<div className="p-4 text-center text-muted">Mapa no disponible</div>}>
                  <MapaCardiologos
                    medicos={medicosRecomendados.medicos}
                    medicoSeleccionadoId={medicoSeleccionadoId}
                    onMedicoSeleccionado={(m) => setMedicoSeleccionadoId(m.id)}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalRegistroOpcional
        show={showModalRegistro && !!resultado}
        onClose={() => setShowModalRegistro(false)}
        onRegistrarse={handleRegistrarse}
      />
    </div>
  );
}
