import type { EvaluacionCompleta } from '../../api/evaluacion';
import { porcentajeProbabilidad } from '../../utils/formato';
import { AvisoPrivacidad, AvisoResultado } from './Avisos';
import { GraficaRiesgo } from './GraficaRiesgo';
import { QueHacerAhora } from './QueHacerAhora';

interface Props {
  evaluacion: EvaluacionCompleta;
  onComparar: () => void;
  onModificar: () => void;
  onNuevaEvaluacion: () => void;
}

export function ResultadoEvaluacion({ evaluacion, onComparar, onModificar, onNuevaEvaluacion }: Readonly<Props>) {
  const { principal } = evaluacion;
  // Sin redondear: cerca del 50 % el largo de la barra queda del mismo lado que el grupo.
  const porcentajeExacto = principal.probabilidad * 100;
  const textoPorcentaje = porcentajeProbabilidad(principal.probabilidad);

  return (
    <div className="card shadow">
      <div className="card-header bg-primary text-white">
        <h4 className="mb-0"><i className="bi bi-file-medical"></i> Resultado de la evaluación</h4>
      </div>
      <div className="card-body text-center">
        <div className="mb-4">
          <div className="alerta-resultado">
            <i className="bi bi-heart-pulse-fill" aria-hidden="true"></i>{' '}
            Probabilidad estimada de enfermedad cardíaca: {textoPorcentaje}
          </div>
        </div>

        <div className="probability-container mb-4">
          <div className="probability-label d-flex justify-content-between flex-wrap gap-1 mb-2">
            <span>Calculada con {principal.nombre} (modelo principal)</span>
            <span>0 % ━━━━━ 100 %</span>
          </div>
          <div
            className="probability-bar"
            role="progressbar"
            aria-label="Probabilidad estimada de enfermedad cardíaca"
            aria-valuenow={Number(porcentajeExacto.toFixed(2))}
            aria-valuetext={textoPorcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {/* Un solo color (el de la app, en index.css) para cualquier valor: sin verde de «bien» ni rojo de alarma. */}
            <div className="probability-fill" style={{ width: `${porcentajeExacto}%` }} />
          </div>
          <p className="mt-3 mb-0">
            {principal.prediccion === 1
              ? 'El modelo ubica estos datos en el grupo de pacientes con enfermedad cardíaca.'
              : 'El modelo ubica estos datos en el grupo de pacientes sin enfermedad cardíaca.'}
          </p>
        </div>

        <AvisoResultado />
        <AvisoPrivacidad />
        <QueHacerAhora />
        <GraficaRiesgo />

        <div className="mt-4 d-flex justify-content-center flex-wrap gap-2">
          <button className="btn btn-outline-primary btn-lg" onClick={onComparar}>
            <i className="bi bi-bar-chart-line me-2"></i>
            Comparar los 3 modelos
          </button>
          <button className="btn btn-outline-secondary btn-lg" onClick={onModificar}>
            <i className="bi bi-pencil me-2"></i>
            Modificar datos
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onNuevaEvaluacion}>
            Nueva evaluación
          </button>
        </div>
      </div>
    </div>
  );
}
