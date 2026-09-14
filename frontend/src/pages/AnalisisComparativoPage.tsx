import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { EvaluacionComparativo, EvaluacionResultado } from '../api/evaluacion';
import { SeccionInformativa } from '../components/evaluacion/SeccionInformativa';
import { AnalisisComparativo } from '../components/evaluacion/AnalisisComparativo';

export type AnalisisPageState = {
  comparativo: EvaluacionComparativo;
  resultado: EvaluacionResultado;
};

export function AnalisisComparativoPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const pageState = state as AnalisisPageState | null;

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(pdfW / imgW, pdfH / imgH) * 0.95;
      const w = imgW * ratio;
      const h = imgH * ratio;
      pdf.addImage(imgData, 'PNG', (pdfW - w) / 2, 10, w, h);
      const now = new Date();
      const filename = `cardionet-analisis-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  if (!pageState?.comparativo || !pageState?.resultado) {
    return (
      <div className="container my-5">
        <div className="card shadow text-center py-5">
          <i className="bi bi-graph-up-arrow display-4 text-muted mb-3"></i>
          <h4>No hay datos de análisis</h4>
          <p className="text-muted mb-4">
            Realiza una evaluación de riesgo cardíaco y pulsa "Análisis de comparación" para ver esta página.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/evaluacion')}>
            Ir a Evaluación
          </button>
        </div>
      </div>
    );
  }

  const { comparativo, resultado } = pageState;

  return (
    <div className="container my-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h3 className="mb-0">
          <i className="bi bi-bar-chart-line me-2"></i>
          Análisis Comparativo de Modelos
        </h3>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? (
              <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-file-pdf me-1"></i>
            )}
            Exportar PDF
          </button>
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </button>
        </div>
      </div>

      <div ref={contentRef}>
        <SeccionInformativa resultado={resultado} />
        <AnalisisComparativo comparativo={comparativo} resultado={resultado} />
      </div>
    </div>
  );
}
