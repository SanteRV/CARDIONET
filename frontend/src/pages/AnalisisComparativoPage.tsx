import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricas, type DatosClinicos, type ResultadoModelo } from '../api/evaluacion';
import { compararCaso } from '../api/calculo';
import { AvisoNoDiagnostico, AvisoPrivacidad, AvisoPrivacidadPdf } from '../components/evaluacion/Avisos';
import { SeccionInformativa } from '../components/evaluacion/SeccionInformativa';
import { AnalisisComparativo } from '../components/evaluacion/AnalisisComparativo';
import { useEvaluacionActual } from '../context/EvaluacionActual';
import { useNotification } from '../hooks/useNotification';

type Caso =
  | { datos: DatosClinicos; modelos: ResultadoModelo[]; error: null }
  | { datos: DatosClinicos; modelos: null; error: string };

/* ------------------------------------------------------------------ */
/* PDF: A4 vertical, en varias páginas                                 */
/* ------------------------------------------------------------------ */

const MARGEN_MM = 10;
/** Espacio bajo la imagen para el número de página. */
const PIE_MM = 6;
/**
 * Ancho (px CSS) con que se dibuja el contenido para el PDF, sea cual sea la pantalla. Ocupa los 190 mm
 * útiles de la hoja A4, así que 1 px CSS = 0,25 mm: el texto normal (16 px) sale en unos 11 pt y el
 * pequeño (14 px) en unos 10 pt, legibles impresos. Antes se copiaba el ancho de la pantalla (1116 px en
 * una computadora) y el texto pequeño quedaba en unos 6 pt.
 */
const ANCHO_PDF_PX = 760;
/**
 * Ancho de la ventana en la que html2canvas copia la página: fijo, para que el PDF tenga la misma
 * distribución (tabla de métricas, columnas) desde un celular o desde una computadora.
 */
const VENTANA_PDF_PX = 1280;
/** Tope de escala: 1 px CSS = 1/96 de pulgada (0,2646 mm); con ANCHO_PDF_PX la imagen se ajusta a 190 mm. */
const MM_POR_PX_CSS_MAX = 25.4 / 96;

/** Elementos que no se parten entre dos páginas del PDF. */
const SELECTOR_BLOQUES =
  'h1, h2, h3, h4, h5, h6, p, li, dt, dd, tr, canvas, svg, img, .alert, .chart-container, [data-pdf-bloque]';

interface Bloque {
  arriba: number;
  abajo: number;
}

/** Posición de cada bloque, en px CSS desde el borde superior de la raíz. */
function medirBloques(raiz: HTMLElement): Bloque[] {
  const origen = raiz.getBoundingClientRect().top;
  const bloques: Bloque[] = [];
  for (const el of Array.from(raiz.querySelectorAll(SELECTOR_BLOQUES))) {
    const r = el.getBoundingClientRect();
    if (r.height <= 0) continue;
    let abajo = r.bottom;
    // Un título no queda solo al pie de una página: va con el comienzo de lo que le sigue. Si lo que sigue es
    // una frase corta (<p>), el bloque llega también al comienzo del gráfico, la tabla o la lista de después;
    // si no, el título y su frase quedaban al pie de una página y el gráfico pasaba a la siguiente.
    let siguiente = /^H[1-6]$/.test(el.tagName) ? el.nextElementSibling : null;
    while (siguiente) {
      const s = siguiente.getBoundingClientRect();
      if (s.height > 0) {
        abajo = Math.max(abajo, Math.min(s.bottom, s.top + 120));
        if (siguiente.tagName !== 'P' || s.height > 120) break;
      }
      siguiente = siguiente.nextElementSibling;
    }
    bloques.push({ arriba: r.top - origen, abajo: abajo - origen });
  }
  return bloques;
}

/**
 * Alturas (px CSS) donde empieza y termina cada página. Cada corte va en el borde de un bloque
 * que no quede dentro de otro bloque; si no hay ninguno en la parte baja de la página, se corta
 * donde la página se llena.
 */
function calcularCortes(altoTotal: number, altoPagina: number, bloques: Bloque[]): number[] {
  const bordes = [...new Set(bloques.flatMap((b) => [b.arriba, b.abajo]))].sort((a, b) => b - a);
  const partiria = (y: number) => bloques.some((b) => b.arriba < y - 0.5 && b.abajo > y + 0.5);
  const cortes = [0];
  let inicio = 0;
  while (altoTotal - inicio > altoPagina) {
    const limite = inicio + altoPagina;
    const minimo = inicio + altoPagina * 0.4;
    inicio = bordes.find((y) => y <= limite && y > minimo && !partiria(y)) ?? limite;
    cortes.push(inicio);
  }
  if (altoTotal - inicio >= 1 || cortes.length === 1) cortes.push(altoTotal);
  else cortes[cortes.length - 1] = altoTotal;
  return cortes;
}

/** Espera a que React aplique el ancho del PDF y a que Chart.js redibuje los gráficos con ese ancho. */
function esperarRedibujo(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 400)));
  });
}

function nombreArchivo(): string {
  const now = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `cardionet-analisis-${now.getFullYear()}${dos(now.getMonth() + 1)}${dos(now.getDate())}-${dos(now.getHours())}${dos(now.getMinutes())}.pdf`;
}

export function AnalisisComparativoPage() {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { evaluacion } = useEvaluacionActual();
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  // Los datos vienen de la evaluación en curso, que está solo en memoria (context/EvaluacionActual.tsx).
  const datos = evaluacion?.datos ?? null;
  const caso = useMemo<Caso | null>(() => {
    if (!datos) return null;
    try {
      return { datos, modelos: compararCaso(datos), error: null };
    } catch (err) {
      return { datos, modelos: null, error: (err as Error).message };
    }
  }, [datos]);

  const handleExportPDF = async () => {
    const raiz = contentRef.current;
    if (!raiz) return;
    // Con «exporting», la raíz pasa a ANCHO_PDF_PX (style más abajo) y un aviso tapa la página mientras tanto.
    setExporting(true);
    try {
      // Las librerías de PDF solo se descargan al exportar.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      await esperarRedibujo();
      let anchoCss = raiz.offsetWidth;
      let altoCss = raiz.offsetHeight;
      let bloques: Bloque[] = [];
      const canvas = await html2canvas(raiz, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: VENTANA_PDF_PX,
        // html2canvas no copia los elementos con data-html2canvas-ignore (los controles de la pantalla),
        // así que se mide la copia, que es lo que se dibuja.
        onclone: (_documento, copia) => {
          const r = copia.getBoundingClientRect();
          anchoCss = r.width;
          altoCss = r.height;
          bloques = medirBloques(copia);
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const anchoMm = Math.min(pdfW - 2 * MARGEN_MM, anchoCss * MM_POR_PX_CSS_MAX);
      const x = (pdfW - anchoMm) / 2;
      const altoMm = pdfH - 2 * MARGEN_MM - PIE_MM;
      const pxPorCss = canvas.width / anchoCss;
      const mmPorPx = anchoMm / canvas.width;
      const cortes = calcularCortes(altoCss, altoMm / mmPorPx / pxPorCss, bloques);
      const paginas = cortes.length - 1;

      for (let i = 0; i < paginas; i++) {
        const sy = Math.round(cortes[i] * pxPorCss);
        const sh = Math.min(canvas.height, Math.round(cortes[i + 1] * pxPorCss)) - sy;
        const hoja = document.createElement('canvas');
        hoja.width = canvas.width;
        hoja.height = Math.max(1, sh);
        const ctx = hoja.getContext('2d');
        if (!ctx) throw new Error('el navegador no permitió preparar la imagen.');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, hoja.width, hoja.height);
        ctx.drawImage(canvas, 0, sy, canvas.width, hoja.height, 0, 0, hoja.width, hoja.height);
        if (i > 0) pdf.addPage();
        // JPEG en vez de PNG: con PNG jsPDF guarda la imagen sin comprimir y el PDF pasaba de 40 MB.
        pdf.addImage(hoja.toDataURL('image/jpeg', 0.92), 'JPEG', x, MARGEN_MM, anchoMm, hoja.height * mmPorPx);
        pdf.setFontSize(8);
        pdf.setTextColor(110);
        pdf.text(`${i + 1} / ${paginas}`, pdfW / 2, pdfH - MARGEN_MM, { align: 'center' });
      }
      pdf.save(nombreArchivo());
    } catch (err) {
      notify('No se pudo exportar el PDF: ' + (err as Error).message, 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    // Durante la exportación la raíz mide ANCHO_PDF_PX aunque la pantalla sea más estrecha: «exportando-pdf»
    // recorta ese desborde para que en el celular la página no se ensanche por debajo del aviso.
    <div className={`container my-5${exporting ? ' exportando-pdf' : ''}`}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h3 className="mb-0">
          <i className="bi bi-bar-chart-line me-2"></i>
          Comparación de los 3 modelos
        </h3>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? (
              <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-file-pdf me-1"></i>
            )}
            Exportar PDF
          </button>
          {caso && (
            <button className="btn btn-outline-secondary" onClick={() => navigate('/evaluacion')}>
              <i className="bi bi-arrow-left me-1"></i>
              Volver al resultado
            </button>
          )}
        </div>
      </div>

      {/* Todo lo que está dentro de esta raíz sale en el PDF, avisos incluidos, salvo lo marcado con data-html2canvas-ignore. */}
      <div ref={contentRef} style={exporting ? { width: ANCHO_PDF_PX } : undefined}>
        {/* En pantalla, el aviso de la página («se borran al recargar»). En el PDF no aplica, porque el archivo
            sí guarda los datos: sale otro aviso que habla del archivo (solo si hay datos del caso). */}
        <AvisoPrivacidad
          className="mb-4"
          soloPantalla
          extra="El PDF se crea en tu navegador y se guarda solo en tu equipo."
        />
        {exporting && caso && <AvisoPrivacidadPdf className="mb-4" />}

        {caso ? (
          <SeccionInformativa datos={caso.datos} />
        ) : (
          <div className="card shadow mb-4">
            <div className="card-body text-center py-4">
              <i className="bi bi-graph-up-arrow display-6 text-muted mb-2 d-block"></i>
              <h5>Todavía no hay una evaluación</h5>
              <p className="text-muted mb-3">
                Abajo están las métricas con que se validaron los modelos. Para ver qué estima cada modelo con tus
                datos, primero haz una evaluación.
              </p>
              <button className="btn btn-primary mb-3" onClick={() => navigate('/evaluacion')} data-html2canvas-ignore>
                Ir a la evaluación
              </button>
              <AvisoNoDiagnostico className="mb-0" />
            </div>
          </div>
        )}

        {caso?.error && (
          <div className="alert alert-danger">No se pudo calcular la comparación: {caso.error}</div>
        )}

        <AnalisisComparativo modelos={caso?.modelos ?? null} metricas={metricas} animar={!exporting} />
      </div>

      {exporting && (
        <div className="pdf-preparando" role="status">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Preparando el PDF…
        </div>
      )}
    </div>
  );
}
