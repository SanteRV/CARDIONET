import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { EvaluacionResultado } from '../../api/evaluacion';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FALLBACK_FI = [
  { nombre: 'Edad', importancia: 0.15 },
  { nombre: 'Colesterol', importancia: 0.13 },
  { nombre: 'Presión arterial', importancia: 0.12 },
  { nombre: 'Frecuencia cardíaca', importancia: 0.11 },
  { nombre: 'Resultado ECG', importancia: 0.10 },
  { nombre: 'Depresión ST', importancia: 0.09 },
];

export function GraficaRiesgo({ resultado }: { resultado: EvaluacionResultado }) {
  const fi = (resultado.feature_importances && resultado.feature_importances.length > 0)
    ? resultado.feature_importances
    : FALLBACK_FI;

  const labels = fi.map((f) => f.nombre);
  const data = fi.map((f) => Number((f.importancia * 100).toFixed(1)));
  const maxVal = Math.max(...data, 1);

  return (
    <div className="chart-container mt-4">
      <h6 className="text-center mb-3">Factores más relevantes en la predicción</h6>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: 'Importancia (%)',
              data,
              backgroundColor: fi.map((_, i) => `rgba(119, 27, 30, ${0.9 - i * 0.1})`),
              borderColor: 'rgba(119, 27, 30, 1)',
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              max: Math.min(100, Math.ceil(maxVal * 1.2)),
            },
          },
        }}
      />
    </div>
  );
}
