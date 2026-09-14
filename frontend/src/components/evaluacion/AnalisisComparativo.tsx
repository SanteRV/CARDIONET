import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import type { EvaluacionComparativo, EvaluacionResultado } from '../../api/evaluacion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const MODELO_LABELS: Record<string, string> = {
  random_forest: 'Random Forest',
  decision_tree: 'Árbol de Decisión',
  svm: 'SVM',
};

const COLORS = {
  random_forest: { main: 'rgba(119, 27, 30, 0.9)', fill: 'rgba(119, 27, 30, 0.25)', border: 'rgb(119, 27, 30)' },
  decision_tree: { main: 'rgba(40, 167, 69, 0.9)', fill: 'rgba(40, 167, 69, 0.25)', border: 'rgb(40, 167, 69)' },
  svm: { main: 'rgba(0, 123, 255, 0.9)', fill: 'rgba(0, 123, 255, 0.25)', border: 'rgb(0, 123, 255)' },
};

const CHART_KEYS = {
  gauges: 'gauges',
  barras: 'barras',
  radar: 'radar',
  barrasAgrupadas: 'barrasAgrupadas',
} as const;

interface Props {
  comparativo: EvaluacionComparativo;
  resultado: EvaluacionResultado;
}

export function AnalisisComparativo({ comparativo }: Readonly<Props>) {
  const [visibleCharts, setVisibleCharts] = useState<Record<string, boolean>>({
    [CHART_KEYS.gauges]: true,
    [CHART_KEYS.barras]: true,
    [CHART_KEYS.radar]: true,
    [CHART_KEYS.barrasAgrupadas]: true,
  });

  const toggleChart = (key: string) => {
    setVisibleCharts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showAll = () => setVisibleCharts({ [CHART_KEYS.gauges]: true, [CHART_KEYS.barras]: true, [CHART_KEYS.radar]: true, [CHART_KEYS.barrasAgrupadas]: true });
  const hideAll = () => setVisibleCharts({ [CHART_KEYS.gauges]: false, [CHART_KEYS.barras]: false, [CHART_KEYS.radar]: false, [CHART_KEYS.barrasAgrupadas]: false });

  const modelos = [
    { key: 'random_forest', data: comparativo.random_forest },
    { key: 'decision_tree', data: comparativo.decision_tree },
    { key: 'svm', data: comparativo.svm },
  ].filter((m) => m.data);

  const metricas = comparativo.metricas_modelos || {};
  const modelosConMetricas = modelos.filter((m) => metricas[m.key]);

  const radarData = {
    labels: ['Exactitud', 'Precisión', 'Sensibilidad', 'F1-Score'],
    datasets: modelosConMetricas.map((m) => ({
      label: MODELO_LABELS[m.key],
      data: [
        metricas[m.key].accuracy,
        metricas[m.key].precision,
        metricas[m.key].recall,
        metricas[m.key].f1,
      ],
      backgroundColor: COLORS[m.key as keyof typeof COLORS].fill,
      borderColor: COLORS[m.key as keyof typeof COLORS].border,
      borderWidth: 2,
      pointBackgroundColor: COLORS[m.key as keyof typeof COLORS].border,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: COLORS[m.key as keyof typeof COLORS].border,
    })),
  };

  const chartProbData = {
    labels: modelos.map((m) => MODELO_LABELS[m.key] || m.key),
    datasets: [
      {
        label: 'Probabilidad de riesgo (%)',
        data: modelos.map((m) => (m.data ? Number((m.data.probabilidad * 100).toFixed(1)) : 0)),
        backgroundColor: modelos.map((m) => COLORS[m.key as keyof typeof COLORS].main),
        borderColor: modelos.map((m) => COLORS[m.key as keyof typeof COLORS].border),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div className="card shadow">
      <div className="card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-2">
        <span className="fw-semibold">Comparativa de modelos ML</span>
        <div className="d-flex flex-wrap align-items-center gap-2 small">
          <span className="text-muted">Mostrar gráficos:</span>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id="chk-gauges"
              checked={visibleCharts[CHART_KEYS.gauges]}
              onChange={() => toggleChart(CHART_KEYS.gauges)}
            />
            <label className="form-check-label" htmlFor="chk-gauges">Gauges</label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id="chk-barras"
              checked={visibleCharts[CHART_KEYS.barras]}
              onChange={() => toggleChart(CHART_KEYS.barras)}
            />
            <label className="form-check-label" htmlFor="chk-barras">Barras</label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id="chk-radar"
              checked={visibleCharts[CHART_KEYS.radar]}
              onChange={() => toggleChart(CHART_KEYS.radar)}
            />
            <label className="form-check-label" htmlFor="chk-radar">Radar</label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              id="chk-agrupadas"
              checked={visibleCharts[CHART_KEYS.barrasAgrupadas]}
              onChange={() => toggleChart(CHART_KEYS.barrasAgrupadas)}
            />
            <label className="form-check-label" htmlFor="chk-agrupadas">Métricas</label>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={showAll}>Todos</button>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={hideAll}>Ninguno</button>
        </div>
      </div>
      <div className="card-body">
        <p className="text-muted small mb-4">
          Comparativa entre Random Forest (modelo principal), Árbol de Decisión y SVM para esta evaluación.
        </p>

        <h6 className="mb-3">Predicción de riesgo por modelo</h6>
        <div className="table-responsive mb-4">
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Modelo</th>
                <th>Predicción</th>
                <th>Probabilidad</th>
              </tr>
            </thead>
            <tbody>
              {modelos.map((m) => (
                <tr key={m.key}>
                  <td><strong>{MODELO_LABELS[m.key]}</strong></td>
                  <td>
                    <span className={m.data?.prediccion === 1 ? 'text-danger' : 'text-success'}>
                      {m.data?.prediccion === 1 ? 'Riesgo' : 'Sin riesgo'}
                    </span>
                  </td>
                  <td>{(m.data ? m.data.probabilidad * 100 : 0).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleCharts[CHART_KEYS.gauges] && (
          <>
            <h6 className="mb-3">Probabilidad de riesgo en esta evaluación (gauges)</h6>
            <div className="d-flex flex-wrap justify-content-center gap-4 mb-4">
              {modelos.map((m) => {
                const pct = m.data ? Math.round(m.data.probabilidad * 100) : 0;
                const c = COLORS[m.key as keyof typeof COLORS];
                return (
                  <div key={m.key} className="text-center">
                    <div className="position-relative d-inline-block" style={{ width: 130, height: 130 }}>
                      <Doughnut
                        data={{
                          labels: ['Riesgo', 'Sin riesgo'],
                          datasets: [{
                            data: [pct, 100 - pct],
                            backgroundColor: [c.main, 'rgba(0,0,0,0.06)'],
                            borderWidth: 0,
                            hoverOffset: 6,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          cutout: '72%',
                          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw}%` } } },
                          animation: { animateRotate: true, duration: 800 },
                        }}
                      />
                      <div className="position-absolute top-50 start-50 translate-middle fw-bold" style={{ fontSize: '1.25rem', color: c.border }}>{pct}%</div>
                    </div>
                    <div className="mt-2 small fw-semibold">{MODELO_LABELS[m.key]}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {visibleCharts[CHART_KEYS.barras] && (
          <>
            <h6 className="mb-3">Probabilidad de riesgo (barras horizontales)</h6>
            <div className="chart-container mb-4" style={{ height: 200 }}>
              <Bar
                data={chartProbData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `Probabilidad: ${ctx.raw}%` } } },
                  scales: { x: { beginAtZero: true, max: 100 } },
                  animation: { duration: 800 },
                }}
              />
            </div>
          </>
        )}

        {visibleCharts[CHART_KEYS.radar] && (
          <>
            <h6 className="mb-3">Perfil de rendimiento (gráfico radar)</h6>
            <p className="text-muted small mb-2">Cada polígono representa un modelo. Cuanto más grande y equilibrado, mejor el rendimiento.</p>
            <div className="chart-container mb-4" style={{ height: 320 }}>
              <Radar
                data={radarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%` } } },
                  scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } },
                  animation: { duration: 1000 },
                }}
              />
            </div>
          </>
        )}

        {visibleCharts[CHART_KEYS.barrasAgrupadas] && (
          <>
            <h6 className="mb-3">Comparativa de métricas (barras agrupadas)</h6>
            <div className="chart-container mb-3" style={{ height: 280 }}>
              <Bar
                data={{
                  labels: ['Exactitud', 'Precisión', 'Sensibilidad', 'F1-Score'],
                  datasets: modelosConMetricas.map((m) => ({
                    label: MODELO_LABELS[m.key],
                    data: [metricas[m.key].accuracy, metricas[m.key].precision, metricas[m.key].recall, metricas[m.key].f1],
                    backgroundColor: COLORS[m.key as keyof typeof COLORS].main,
                    borderColor: COLORS[m.key as keyof typeof COLORS].border,
                    borderWidth: 1,
                    borderRadius: 4,
                  })),
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                  scales: { y: { beginAtZero: true, max: 100 } },
                  animation: { duration: 600 },
                }}
              />
            </div>
          </>
        )}

        <div className="alert alert-info small mb-0">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Random Forest</strong> es el modelo principal por su mayor exactitud y equilibrio.
          El análisis comparativo permite validar consistencia entre modelos y explorar mejoras futuras.
        </div>
      </div>
    </div>
  );
}
