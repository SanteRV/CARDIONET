// Fuente del SAMU 106: https://www.gob.pe/1013-solicitar-atencion-medica-en-caso-de-emergencia-samu
const FUENTE_SAMU = 'https://www.gob.pe/1013-solicitar-atencion-medica-en-caso-de-emergencia-samu';

export function QueHacerAhora() {
  return (
    <section className="text-start mt-4" aria-labelledby="que-hacer-ahora-titulo">
      <h5 id="que-hacer-ahora-titulo" className="border-bottom pb-2 mb-3">
        <i className="bi bi-signpost-split me-2" aria-hidden="true"></i>
        Qué hacer ahora
      </h5>
      <p>
        <i className="bi bi-person-check me-2 text-brand" aria-hidden="true"></i>
        Consulta a un cardiólogo o acude a tu centro de salud para revisar tu caso, sea cual sea el resultado.
      </p>
      <div className="alert alert-danger mb-0">
        <p className="fw-semibold mb-2">
          <i className="bi bi-telephone-fill me-2" aria-hidden="true"></i>
          Si tienes síntomas graves
        </p>
        <p className="mb-2">
          Si tienes dolor de pecho, falta de aire, desmayo u otros síntomas graves, llama gratis al{' '}
          <a href="tel:106" className="alert-link">SAMU 106</a> (Ministerio de Salud, atiende las 24 horas) o acude
          a emergencias.
        </p>
        <p className="small mb-0">
          Fuente:{' '}
          <a href={FUENTE_SAMU} target="_blank" rel="noopener noreferrer" className="alert-link">
            gob.pe – SAMU
          </a>
        </p>
      </div>
    </section>
  );
}
