import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EvaluacionResultado } from '../../api/evaluacion';
import * as evaluacionApi from '../../api/evaluacion';
import { GraficaRiesgo } from './GraficaRiesgo';

function getColorByPercentage(percentage: number): string {
  if (percentage < 30) return '#28a745';
  if (percentage < 50) return '#5cb85c';
  if (percentage < 70) return '#ffc107';
  if (percentage < 85) return '#fd7e14';
  return '#dc3545';
}

interface Props {
  resultado: EvaluacionResultado;
  onVerMedicos: () => void;
  onNuevaEvaluacion: () => void;
}

export function ResultadoEvaluacion({ resultado, onVerMedicos, onNuevaEvaluacion }: Props) {
  const [loadingComparativo, setLoadingComparativo] = useState(false);
  const navigate = useNavigate();

  const porcentaje = (resultado.probabilidad_riesgo * 100).toFixed(1);
  const porcentajeInt = Math.round(Number(porcentaje));
  const tieneRiesgo = resultado.tiene_riesgo === 1;
  const color = getColorByPercentage(porcentajeInt);

  const handleAnalisisComparativo = async () => {
    const params = resultado.parametros;
    if (!params || params.length !== 13) return;
    setLoadingComparativo(true);
    const { ok, data } = await evaluacionApi.obtenerComparativo(params);
    setLoadingComparativo(false);
    if (ok && data && !('error' in data)) {
      navigate('/evaluacion/comparativo', { state: { comparativo: data, resultado } });
    }
  };

  return (
    <div className="card shadow">
      <div className={`card-header text-white ${tieneRiesgo ? 'bg-danger' : 'bg-success'}`}>
        <h4 className="mb-0"><i className="bi bi-file-medical"></i> Resultado de la Evaluación</h4>
      </div>
      <div className="card-body text-center">
        <div className="mb-4">
          <div className={tieneRiesgo ? 'alerta-riesgo' : 'alerta-sin-riesgo'}>
            <i className={`bi ${tieneRiesgo ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}></i>{' '}
            {resultado.mensaje}
          </div>
        </div>
        <div className="probability-container mb-4">
          <div className="probability-label d-flex justify-content-between mb-2">
            <span>Probabilidad según Random Forest (modelo principal)</span>
            <span>0% ━━━━━ 100%</span>
          </div>
          <div className="probability-bar">
            <div
              className="probability-fill"
              style={{ width: `${porcentajeInt}%`, background: color }}
            />
          </div>
          <div className="probability-percentage mt-3 fw-bold" style={{ color, fontSize: '2.5rem' }}>
            {porcentaje}%
          </div>
          <div className={tieneRiesgo ? 'text-danger' : 'text-success'}>
            {tieneRiesgo ? 'Alto riesgo cardíaco detectado' : 'Bajo riesgo cardíaco'}
          </div>
        </div>
        <p className="text-muted text-center mt-3">
          {tieneRiesgo
            ? 'Se recomienda consultar con un cardiólogo especialista de inmediato.'
            : 'Los parámetros evaluados están dentro de rangos saludables.'}
        </p>

        <GraficaRiesgo resultado={resultado} />

        <div className="mt-4">
          <button
            className="btn btn-outline-primary btn-lg me-2"
            onClick={handleAnalisisComparativo}
            disabled={loadingComparativo || !resultado.parametros}
          >
            {loadingComparativo ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            ) : (
              <i className="bi bi-bar-chart-line me-2"></i>
            )}
            Análisis de comparación
          </button>
          {tieneRiesgo && (
            <button className="btn btn-success btn-lg me-2" onClick={onVerMedicos}>
              Ver Cardiólogos Recomendados
            </button>
          )}
          <button className="btn btn-secondary btn-lg" onClick={onNuevaEvaluacion}>
            Nueva Evaluación
          </button>
        </div>
      </div>
    </div>
  );
}
