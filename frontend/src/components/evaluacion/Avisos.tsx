import { metricas } from '../../api/evaluacion';

export const TEXTO_NO_DIAGNOSTICO =
  'Herramienta educativa de un proyecto de investigación. No es un diagnóstico ni reemplaza una consulta médica.';

// Comprobado en el código: los datos solo están en el estado de React (context/EvaluacionActual.tsx y el
// formulario), no en history.state, localStorage, sessionStorage ni cookies, y la app no hace llamadas de red
// con ellos. Por eso se pierden al recargar o cerrar la página (también al pulsar «Nueva evaluación»).
// Si la página vuelve de la caché de «Atrás» del navegador (bfcache), se recarga y tampoco quedan a la vista
// (context/EvaluacionActual.tsx).
// Lo que se descarga de cdn.jsdelivr.net (estilos e íconos, sin datos) se indica en el pie de página.
const TEXTO_PRIVACIDAD =
  'No guardamos tus datos: el cálculo se hace en tu navegador y no se envían a ningún servidor. Se borran al recargar o cerrar la página.';

/** Aviso del PDF: el archivo sí guarda los datos, así que no repite «se borran al recargar». */
const TEXTO_PRIVACIDAD_PDF =
  'Este PDF contiene los datos que ingresaste. Se creó en tu navegador, sin enviarlos a ningún servidor; guárdalo o bórralo según lo necesites.';

export function AvisoNoDiagnostico({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <div className={`alert alert-warning d-flex align-items-start gap-2 small text-start ${className}`} role="note">
      <i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden="true"></i>
      <span>{TEXTO_NO_DIAGNOSTICO}</span>
    </div>
  );
}

interface AvisoPrivacidadProps {
  className?: string;
  extra?: string;
  /** true: no sale en el PDF (html2canvas no copia los elementos con data-html2canvas-ignore). */
  soloPantalla?: boolean;
}

export function AvisoPrivacidad({ className = '', extra, soloPantalla = false }: Readonly<AvisoPrivacidadProps>) {
  return (
    <div
      className={`alert alert-secondary d-flex align-items-start gap-2 small text-start ${className}`}
      role="note"
      data-html2canvas-ignore={soloPantalla || undefined}
    >
      <i className="bi bi-shield-lock-fill mt-1" aria-hidden="true"></i>
      <span>
        {TEXTO_PRIVACIDAD}
        {extra ? ` ${extra}` : ''}
      </span>
    </div>
  );
}

export function AvisoPrivacidadPdf({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <div className={`alert alert-secondary d-flex align-items-start gap-2 small text-start ${className}`} role="note">
      <i className="bi bi-shield-lock-fill mt-1" aria-hidden="true"></i>
      <span>{TEXTO_PRIVACIDAD_PDF}</span>
    </div>
  );
}

function textoEntrenamiento(): string {
  const { n, nConEnfermedad, nSinEnfermedad, fuente } = metricas;
  const pacientes = n !== null ? `${n} pacientes` : 'pacientes';
  const clases =
    nConEnfermedad !== null && nSinEnfermedad !== null
      ? ` (${nConEnfermedad} con enfermedad cardíaca y ${nSinEnfermedad} sin ella, según diagnóstico por angiografía)`
      : '';
  return `Los modelos se entrenaron con ${pacientes} de la Cleveland Clinic Foundation${clases}, tomados del conjunto ${fuente.nombre}.`;
}

/** Avisos obligatorios junto al resultado. */
export function AvisoResultado() {
  return (
    <div className="alert alert-warning text-start small" role="note">
      <p className="mb-2">
        <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
        <strong>{TEXTO_NO_DIAGNOSTICO}</strong>
      </p>
      <ul className="mb-0 ps-4">
        <li>Una probabilidad baja no descarta una enfermedad cardíaca.</li>
        <li>{textoEntrenamiento()}</li>
      </ul>
    </div>
  );
}
