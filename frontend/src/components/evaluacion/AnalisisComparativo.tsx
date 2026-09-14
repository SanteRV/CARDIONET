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
import {
  METRICAS,
  MODELOS,
  type Estadistico,
  type MetricaId,
  type MetricasApp,
  type ModeloId,
  type ResultadoModelo,
} from '../../api/evaluacion';
import { aPorcentaje, dosDecimales, porcentaje, porcentajeProbabilidad } from '../../utils/formato';
import { AvisoResultado } from './Avisos';
import { QueHacerAhora } from './QueHacerAhora';

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

/**
 * Un color por modelo, sin rojo ni verde: ninguno debe leerse como «bien» o «mal».
 * Vino (tono de la app), azul pizarra y gris. Contraste (fórmula WCAG) con el fondo blanco: 8,5:1, 5,5:1 y 3,9:1;
 * con la pista gris de los medidores: 7,4:1, 4,9:1 y 3,4:1. Tienen luminosidades distintas (1,5:1 entre vino y
 * azul, 1,4:1 entre azul y gris), así que impresos en gris tampoco se ven iguales. Los pares se siguen
 * distinguiendo con simulación de protanopia y deuteranopia.
 */
const COLORS: Record<ModeloId, { main: string; border: string }> = {
  random_forest: { main: 'rgb(140, 42, 46)', border: 'rgb(140, 42, 46)' },
  arbol_decision: { main: 'rgb(79, 106, 143)', border: 'rgb(79, 106, 143)' },
  svm: { main: 'rgb(123, 130, 136)', border: 'rgb(123, 130, 136)' },
};

/** Forma de los puntos del radar: el modelo se distingue también sin color (p. ej. impreso en gris). */
const PUNTO: Record<ModeloId, 'circle' | 'rect' | 'triangle'> = {
  random_forest: 'circle',
  arbol_decision: 'rect',
  svm: 'triangle',
};

/**
 * Radar sin relleno: las medias de SVM y Random Forest son muy parecidas y, con los polígonos rellenos, la línea
 * gris de SVM quedaba tapada. SVM va con línea discontinua y se dibuja encima (en Chart.js, el «order» más bajo
 * queda arriba); por los huecos de su trazo se sigue viendo la línea de debajo.
 */
const TRAZO_RADAR: Record<ModeloId, { dash: number[]; order: number }> = {
  random_forest: { dash: [], order: 1 },
  arbol_decision: { dash: [], order: 2 },
  svm: { dash: [6, 4], order: 0 },
};

/** Color del texto (no el del modelo): las cifras se leen igual en los tres medidores. */
const COLOR_TEXTO = '#212529';

type ChartKey = 'gauges' | 'barras' | 'radar' | 'barrasAgrupadas';

const CHART_LABELS: Record<ChartKey, string> = {
  gauges: 'Medidores',
  barras: 'Barras',
  radar: 'Radar',
  barrasAgrupadas: 'Métricas',
};

/** Métricas que se grafican en escala 0–100 % (el AUC va solo en la tabla). */
const METRICAS_EN_PORCENTAJE: MetricaId[] = ['exactitud', 'sensibilidad', 'especificidad', 'precision', 'f1'];

function formatoMetrica(id: MetricaId, valor: number): string {
  return id === 'auc' ? dosDecimales(valor) : porcentaje(valor);
}

/**
 * Media ± desviación y, debajo, mínimo y máximo (en la tabla y en las tarjetas del celular).
 * Cada cifra va en un bloque que no se parte: en columnas estrechas (y en el PDF) el «%» no queda solo en otra línea.
 */
function ValorMetrica({ id, e }: Readonly<{ id: MetricaId; e: Estadistico }>) {
  return (
    <>
      <span className="text-nowrap">{formatoMetrica(id, e.media)}</span>
      {e.desviacion !== null && (
        <>
          {' '}
          <span className="text-nowrap">± {formatoMetrica(id, e.desviacion)}</span>
        </>
      )}
      {e.min !== null && e.max !== null && (
        <div className="text-muted small">
          <span className="text-nowrap">mín. {formatoMetrica(id, e.min)}</span> ·{' '}
          <span className="text-nowrap">máx. {formatoMetrica(id, e.max)}</span>
        </div>
      )}
    </>
  );
}

/** Frase con el modelo de mayor exactitud media, calculada desde metricas.json. */
function textoExactitud(metricas: MetricasApp): string {
  const ranking = MODELOS.flatMap((id): { id: ModeloId; e: Estadistico }[] => {
    const e = metricas.modelos[id]?.exactitud;
    return e ? [{ id, e }] : [];
  }).sort((a, b) => b.e.media - a.e.media);
  if (ranking.length === 0) return 'Las métricas muestran cómo se comportó cada modelo en la validación.';

  const [primero, segundo] = ranking;
  const nombre = (id: ModeloId) => metricas.nombres[id];
  if (segundo && segundo.e.media === primero.e.media) {
    return `En la validación, ${nombre(primero.id)} y ${nombre(segundo.id)} tuvieron la misma exactitud media (${porcentaje(primero.e.media)}).`;
  }
  let texto = `En la validación, la mayor exactitud media fue la de ${nombre(primero.id)} (${porcentaje(primero.e.media)}).`;
  if (segundo && primero.e.desviacion !== null && primero.e.media - segundo.e.media < primero.e.desviacion) {
    texto += ` La diferencia con ${nombre(segundo.id)} (${porcentaje(segundo.e.media)}) es menor que la desviación estándar.`;
  }
  return texto;
}

interface Props {
  /** Resultado de cada modelo para los datos evaluados; null si no hay evaluación. */
  modelos: ResultadoModelo[] | null;
  metricas: MetricasApp;
  /**
   * false mientras se exporta el PDF: al cambiar al ancho del PDF, Chart.js vuelve a animar los gráficos y
   * la copia salía a mitad de la animación (el radar, vacío). Sin animación se redibujan al instante.
   */
  animar?: boolean;
}

export function AnalisisComparativo({ modelos, metricas, animar = true }: Readonly<Props>) {
  const [visibleCharts, setVisibleCharts] = useState<Record<ChartKey, boolean>>({
    gauges: true,
    barras: true,
    radar: true,
    barrasAgrupadas: true,
  });

  const { n, nConEnfermedad, nSinEnfermedad, filasEnArchivo, filasDescartadas, validacion, fuente, nombres } = metricas;
  const resultados = modelos ?? [];
  const hayCaso = resultados.length > 0;
  const modelosConMetricas = MODELOS.filter((id) => metricas.modelos[id]);
  const metricasGrafico = METRICAS.filter(
    (m) => METRICAS_EN_PORCENTAJE.includes(m.id) && modelosConMetricas.some((id) => metricas.modelos[id]?.[m.id])
  );
  const metricasTabla = METRICAS.filter((m) => modelosConMetricas.some((id) => metricas.modelos[id]?.[m.id]));

  const graficosDisponibles: ChartKey[] = [
    ...(hayCaso ? (['gauges', 'barras'] as ChartKey[]) : []),
    ...(metricasGrafico.length >= 3 ? (['radar'] as ChartKey[]) : []),
    ...(metricasGrafico.length > 0 ? (['barrasAgrupadas'] as ChartKey[]) : []),
  ];

  const toggleChart = (key: ChartKey) => setVisibleCharts((prev) => ({ ...prev, [key]: !prev[key] }));
  const setAll = (visible: boolean) =>
    setVisibleCharts({ gauges: visible, barras: visible, radar: visible, barrasAgrupadas: visible });
  const mostrar = (key: ChartKey) => graficosDisponibles.includes(key) && visibleCharts[key];

  const datosMetrica = (id: ModeloId) =>
    metricasGrafico.map((m) => {
      const e = metricas.modelos[id]?.[m.id];
      return e ? aPorcentaje(e.media) : null;
    });

  return (
    <div className="card shadow">
      <div className="card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-2">
        <span className="fw-semibold">Comparación de modelos</span>
        {graficosDisponibles.length > 0 && (
          <div className="d-flex flex-wrap align-items-center gap-2 small" data-html2canvas-ignore>
            <span>Mostrar gráficos:</span>
            {graficosDisponibles.map((key) => (
              <div className="form-check form-check-inline" key={key}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`chk-${key}`}
                  checked={visibleCharts[key]}
                  onChange={() => toggleChart(key)}
                />
                <label className="form-check-label" htmlFor={`chk-${key}`}>{CHART_LABELS[key]}</label>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setAll(true)}>Todos</button>
            <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setAll(false)}>Ninguno</button>
          </div>
        )}
      </div>
      <div className="card-body">
        <p className="text-muted small mb-4">
          Random Forest es el modelo principal de la app; el árbol de decisión y SVM se muestran para comparar.
        </p>

        {hayCaso && (
          <>
            <h6 className="mb-3">Probabilidad estimada por cada modelo con tus datos</h6>
            <div className={`table-responsive ${validacion.reglaClase ? 'mb-2' : 'mb-4'}`}>
              <table className="table table-bordered mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Modelo</th>
                    <th>Grupo en que ubica los datos</th>
                    <th>Probabilidad estimada de enfermedad cardíaca</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((m) => (
                    <tr key={m.modelo}>
                      <td><strong>{m.nombre}</strong></td>
                      <td>{m.prediccion === 1 ? 'Con enfermedad cardíaca' : 'Sin enfermedad cardíaca'}</td>
                      <td>{porcentajeProbabilidad(m.probabilidad)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {validacion.reglaClase && (
              <p className="small text-muted mb-4">Cómo se asigna el grupo: {validacion.reglaClase}</p>
            )}
            {/* Los mismos avisos que en el resultado: esta página y su PDF también muestran probabilidades del caso. */}
            <AvisoResultado />
            <div className="mb-4">
              <QueHacerAhora />
            </div>
          </>
        )}

        {hayCaso && mostrar('gauges') && (
          <>
            <h6 className="mb-3">Probabilidad estimada con tus datos (medidores)</h6>
            <div className="d-flex flex-wrap justify-content-center gap-4 mb-4">
              {resultados.map((m) => {
                const pct = aPorcentaje(m.probabilidad);
                const c = COLORS[m.modelo];
                return (
                  <div key={m.modelo} className="text-center" data-pdf-bloque>
                    <div className="position-relative d-inline-block" style={{ width: 130, height: 130 }}>
                      <Doughnut
                        data={{
                          labels: ['Probabilidad estimada', 'Resto'],
                          datasets: [{
                            data: [pct, Number((100 - pct).toFixed(1))],
                            backgroundColor: [c.main, 'rgba(0,0,0,0.06)'],
                            borderWidth: 0,
                            hoverOffset: 6,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          cutout: '72%',
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (ctx) =>
                                  porcentajeProbabilidad(ctx.dataIndex === 0 ? m.probabilidad : 1 - m.probabilidad),
                              },
                            },
                          },
                          animation: animar ? { animateRotate: true, duration: 800 } : false,
                        }}
                      />
                      {/* Centrado con flex y sin transform: html2canvas dibuja mal translate() y la cifra salía corrida en el PDF. */}
                      <div
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center fw-bold"
                        style={{ fontSize: '1.1rem', color: COLOR_TEXTO, whiteSpace: 'nowrap', pointerEvents: 'none' }}
                      >
                        {porcentajeProbabilidad(m.probabilidad)}
                      </div>
                    </div>
                    <div className="mt-2 small fw-semibold">{m.nombre}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {hayCaso && mostrar('barras') && (
          <>
            <h6 className="mb-3">Probabilidad estimada con tus datos (barras)</h6>
            <div className="chart-container mb-4" style={{ height: 200 }}>
              <Bar
                data={{
                  labels: resultados.map((m) => m.nombre),
                  datasets: [
                    {
                      label: 'Probabilidad estimada (%)',
                      data: resultados.map((m) => aPorcentaje(m.probabilidad)),
                      backgroundColor: resultados.map((m) => COLORS[m.modelo].main),
                      borderWidth: 0,
                      borderRadius: 4,
                      borderSkipped: false,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => `Probabilidad: ${porcentajeProbabilidad(resultados[ctx.dataIndex].probabilidad)}`,
                      },
                    },
                  },
                  scales: { x: { beginAtZero: true, max: 100 } },
                  animation: animar ? { duration: 800 } : false,
                }}
              />
            </div>
          </>
        )}

        <h6 className="mb-2">Cómo se comportó cada modelo en la validación</h6>
        {modelosConMetricas.length === 0 ? (
          <div className="alert alert-secondary small">No hay métricas de validación disponibles.</div>
        ) : (
          <>
            <div className="alert alert-light border small mb-3">
              {validacion.metodo && (
                <p className="mb-2"><strong>Cómo se validó:</strong> {validacion.metodo}</p>
              )}
              <p className="mb-0">
                <strong>Cada valor:</strong> media ± desviación estándar; debajo, el mínimo y el máximo.
                {validacion.resumen ? ` Se calculan así: ${validacion.resumen}` : ''}
              </p>
            </div>
            {/*
              Tabla desde 992 px (y en el PDF, que se copia con una ventana de 1280 px); por debajo, una tarjeta por
              modelo. Entre 768 y 991 px la tabla de 7 columnas medía más que su caja y la columna AUC salía cortada.
            */}
            <div className="table-responsive mb-3 d-none d-lg-block">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Modelo</th>
                    {metricasTabla.map((m) => <th key={m.id}>{m.nombre}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {modelosConMetricas.map((id) => (
                    <tr key={id}>
                      <td><strong>{nombres[id]}</strong></td>
                      {metricasTabla.map((m) => {
                        const e = metricas.modelos[id]?.[m.id];
                        return <td key={m.id}>{e ? <ValorMetrica id={m.id} e={e} /> : '—'}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-lg-none mb-3">
              {modelosConMetricas.map((id) => (
                <div className="border rounded bg-white mb-2" key={id} data-pdf-bloque>
                  <div className="px-3 py-2 border-bottom bg-light fw-semibold">{nombres[id]}</div>
                  <dl className="mb-0 small">
                    {metricasTabla.map((m, i) => {
                      const e = metricas.modelos[id]?.[m.id];
                      return (
                        <div
                          className={`d-flex justify-content-between align-items-start gap-3 px-3 py-2 ${i > 0 ? 'border-top' : ''}`}
                          key={m.id}
                        >
                          <dt className="fw-semibold">{m.nombre}</dt>
                          <dd className="mb-0 text-end">{e ? <ValorMetrica id={m.id} e={e} /> : '—'}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              ))}
            </div>
            <dl className="row small mb-4">
              {metricasTabla.map((m) => (
                <div className="col-md-6 mb-1" key={m.id}>
                  <dt className="d-inline">{m.nombre}: </dt>
                  <dd className="d-inline">{m.explicacion}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {mostrar('radar') && (
          <>
            <h6 className="mb-3">Perfil de rendimiento (gráfico radar)</h6>
            <p className="text-muted small mb-2">
              Cada línea es un modelo; la de {nombres.svm ?? 'SVM'} va discontinua. Cada eje es la media de una métrica
              en la validación.
            </p>
            <div className="chart-container mb-4" style={{ height: 320 }}>
              <Radar
                data={{
                  labels: metricasGrafico.map((m) => m.nombre),
                  datasets: modelosConMetricas.map((id) => ({
                    label: nombres[id],
                    data: datosMetrica(id),
                    fill: false,
                    backgroundColor: 'transparent',
                    borderColor: COLORS[id].border,
                    borderDash: TRAZO_RADAR[id].dash,
                    order: TRAZO_RADAR[id].order,
                    borderWidth: 2,
                    pointStyle: PUNTO[id],
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: COLORS[id].border,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: COLORS[id].border,
                  })),
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    // «order» cambia también el orden de la leyenda: se vuelve al de la tabla (Random Forest primero).
                    legend: {
                      position: 'top',
                      labels: { usePointStyle: true, sort: (a, b) => (a.datasetIndex ?? 0) - (b.datasetIndex ?? 0) },
                    },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} %` } },
                  },
                  scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } },
                  animation: animar ? { duration: 1000 } : false,
                }}
              />
            </div>
          </>
        )}

        {mostrar('barrasAgrupadas') && (
          <>
            <h6 className="mb-3">Comparación de métricas (barras agrupadas)</h6>
            <div className="chart-container mb-3" style={{ height: 280 }}>
              <Bar
                data={{
                  labels: metricasGrafico.map((m) => m.nombre),
                  datasets: modelosConMetricas.map((id) => ({
                    label: nombres[id],
                    data: datosMetrica(id),
                    backgroundColor: COLORS[id].main,
                    borderWidth: 0,
                    borderRadius: 4,
                  })),
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} %` } } },
                  scales: { y: { beginAtZero: true, max: 100 } },
                  animation: animar ? { duration: 600 } : false,
                }}
              />
            </div>
          </>
        )}

        <div className="alert alert-info small mb-0">
          <p className="mb-2">
            <i className="bi bi-info-circle me-2" aria-hidden="true"></i>
            {textoExactitud(metricas)} Estas cifras describen cómo se comportaron los modelos con los pacientes del
            conjunto de datos, no la precisión de un resultado individual.
          </p>
          <p className="mb-2">
            Datos: {n !== null ? `${n} pacientes` : 'pacientes'}
            {nConEnfermedad !== null && nSinEnfermedad !== null
              ? ` (${nConEnfermedad} con enfermedad cardíaca y ${nSinEnfermedad} sin ella)`
              : ''}{' '}
            del conjunto {fuente.nombre}, licencia {fuente.licencia}.
            {filasEnArchivo !== null && filasDescartadas !== null && filasDescartadas > 0
              ? ` El archivo tiene ${filasEnArchivo} filas; se descartaron ${filasDescartadas} con datos faltantes.`
              : ''}
          </p>
          {/* La cita va como texto, no solo como enlace, para que se lea completa en el PDF impreso. */}
          <p className="mb-0">
            <strong>Cita del conjunto de datos:</strong> {fuente.cita}
            {fuente.cita.includes(fuente.doi) ? '' : ` DOI: ${fuente.doi}.`}{' '}
            <a
              href={fuente.url}
              target="_blank"
              rel="noopener noreferrer"
              className="alert-link"
              data-html2canvas-ignore
            >
              Ver en UCI
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
