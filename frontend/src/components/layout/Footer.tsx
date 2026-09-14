import { metricas } from '../../api/evaluacion';
import { TEXTO_NO_DIAGNOSTICO } from '../evaluacion/Avisos';

/** Logotipo del portafolio del autor, con el color del texto del pie (fill="currentColor"). */
function LogoAutor() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 518 520" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M42.8276 88.0345H83.2759V133.241H146.328V417.569H186.776V446.121H517.5V479.431H481.81V519.879H161.793V487.759H129.078V458.017H97.5517V423.517H42.8276V88.0345Z" />
      <rect x="361.655" y="133.241" width="118.966" height="261.724" />
      <rect y="45.2069" width="42.8276" height="42.8276" />
      <path d="M47.5862 0H480.621V84.4655H86.8448V45.2069H47.5862V0Z" />
    </svg>
  );
}

export function Footer() {
  const { fuente } = metricas;

  return (
    <footer className="text-white py-3 mt-5">
      <div className="container small">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
          <p className="mb-0">
            <strong>CARDIONET</strong> · Proyecto de investigación de la Universidad Nacional Hermilio Valdizán
            (UNHEVAL), en colaboración con la Universidad Nacional Mayor de San Marcos (UNMSM).
          </p>
          <a
            href="https://santerv.com"
            target="_blank"
            rel="noopener noreferrer"
            className="logo-autor flex-shrink-0"
            aria-label="Hecho por Luis Manuel Carbajal Herrera (santerv.com)"
            title="Luis Manuel Carbajal Herrera · santerv.com"
          >
            <LogoAutor />
          </a>
        </div>
        <p className="mb-2">
          <strong>Datos:</strong> {fuente.cita}{' '}
          <a href={fuente.url} target="_blank" rel="noopener noreferrer" className="link-light">
            Ver en UCI
          </a>
          {' · '}Licencia{' '}
          {fuente.urlLicencia ? (
            <a href={fuente.urlLicencia} target="_blank" rel="noopener noreferrer" className="link-light">
              {fuente.licencia}
            </a>
          ) : (
            fuente.licencia
          )}
          {!fuente.cita.includes(fuente.doi) && (
            <>
              {' · '}DOI{' '}
              <a href={fuente.urlDoi} target="_blank" rel="noopener noreferrer" className="link-light">
                {fuente.doi}
              </a>
            </>
          )}
        </p>
        <p className="mb-0">
          {TEXTO_NO_DIAGNOSTICO} En una emergencia, llama gratis al SAMU 106.
        </p>
        <p className="pie-discreto mt-2 mb-0">
          Los estilos y los íconos de la página se descargan de cdn.jsdelivr.net; esas descargas no llevan tus datos.
        </p>
      </div>
    </footer>
  );
}
