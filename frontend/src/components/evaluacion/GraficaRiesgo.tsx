import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { metricas } from '../../api/evaluacion';
import { aPorcentaje } from '../../utils/formato';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

/** Importancia de las variables según metricas.json (general, no del caso evaluado). */
export function GraficaRiesgo() {
  const { importancias } = metricas;
  if (importancias.length === 0) return null;

  // metricas.json trae la importancia del Random Forest final; los valores suman 1, así que en % suman 100.
  const data = importancias.map((i) => aPorcentaje(i.valor));
  const maxVal = Math.max(...data, 1);

  return (
    <div className="chart-container mt-4">
      <h6 className="text-center mb-1">Peso de cada variable en el modelo</h6>
      <p className="text-muted small text-center mb-3">
        Cuánto usa en general el modelo Random Forest cada dato para decidir, en porcentaje del total. No dice qué
        pesó en tu caso.
      </p>
      <div style={{ height: Math.max(240, importancias.length * 30) }}>
        <Bar
          data={{
            labels: importancias.map((i) => i.etiqueta),
            datasets: [
              {
                label: 'Peso en el modelo (%)',
                data,
                backgroundColor: importancias.map((_, i) => `rgba(119, 27, 30, ${Math.max(0.3, 0.9 - i * 0.05)})`),
                borderColor: 'rgba(119, 27, 30, 1)',
                borderWidth: 2,
              },
            ],
          }}
          options={{
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => `${ctx.raw} % del total` } },
            },
            scales: {
              x: {
                beginAtZero: true,
                max: Math.min(100, Math.ceil(maxVal * 1.2)),
                ticks: { callback: (valor) => `${valor} %` },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
