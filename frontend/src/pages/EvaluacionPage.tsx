import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DatosClinicos } from '../api/evaluacion';
import { evaluarCaso } from '../api/calculo';
import { FormularioEvaluacion } from '../components/evaluacion/FormularioEvaluacion';
import { ResultadoEvaluacion } from '../components/evaluacion/ResultadoEvaluacion';
import { useEvaluacionActual } from '../context/EvaluacionActual';
import { useNotification } from '../hooks/useNotification';

type View = 'form' | 'resultado';

export function EvaluacionPage() {
  const navigate = useNavigate();
  const { notify } = useNotification();
  // La evaluación en curso está solo en memoria (context/EvaluacionActual.tsx), no en el historial.
  // Si se vuelve desde la comparación, se muestra otra vez el resultado.
  const { evaluacion, setEvaluacion } = useEvaluacionActual();
  const [view, setView] = useState<View>(evaluacion ? 'resultado' : 'form');

  const irArriba = () => window.scrollTo({ top: 0 });

  const handleSubmit = (datos: DatosClinicos) => {
    try {
      setEvaluacion(evaluarCaso(datos));
      setView('resultado');
      irArriba();
    } catch (err) {
      notify('No se pudo calcular la estimación: ' + (err as Error).message, 'error');
    }
  };

  const handleModificar = () => {
    setView('form');
    irArriba();
  };

  const handleNuevaEvaluacion = () => {
    setEvaluacion(null);
    setView('form');
    irArriba();
  };

  return (
    <div className="container my-5">
      {view === 'resultado' && evaluacion ? (
        <ResultadoEvaluacion
          evaluacion={evaluacion}
          onComparar={() => navigate('/evaluacion/comparativo')}
          onModificar={handleModificar}
          onNuevaEvaluacion={handleNuevaEvaluacion}
        />
      ) : (
        <FormularioEvaluacion valoresIniciales={evaluacion?.datos} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
