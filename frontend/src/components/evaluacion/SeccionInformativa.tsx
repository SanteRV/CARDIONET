import { Fragment } from 'react';
import type { DatosClinicos } from '../../ml/tipos';
import { VARIABLES, textoValor } from '../../data/variables';
import { AvisoNoDiagnostico } from './Avisos';

interface Props {
  datos: DatosClinicos;
}

export function SeccionInformativa({ datos }: Readonly<Props>) {
  return (
    <div className="card shadow mb-4">
      <div className="card-header text-white">
        <h5 className="mb-0">
          <i className="bi bi-heart-pulse me-2"></i>
          Datos de esta evaluación
        </h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-4 text-center mb-3 mb-md-0">
            <svg
              viewBox="0 0 400 520"
              className="w-100"
              style={{ maxHeight: 280 }}
              role="img"
              aria-label="Ilustración de un torso humano con la zona del corazón destacada"
            >
              <defs>
                <linearGradient id="torsoGradInfo" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(119, 27, 30, 0.04)" />
                  <stop offset="100%" stopColor="rgba(119, 27, 30, 0.01)" />
                </linearGradient>
                <linearGradient id="heartGradInfo" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6d1619" />
                  <stop offset="40%" stopColor="#771b1e" />
                  <stop offset="100%" stopColor="#9c2529" />
                </linearGradient>
              </defs>
              <ellipse cx="200" cy="65" rx="40" ry="46" fill="none" stroke="rgba(119, 27, 30, 0.4)" strokeWidth="2" />
              <path d="M 168 108 L 165 142 L 200 148 L 235 142 L 232 108" fill="url(#torsoGradInfo)" stroke="rgba(119, 27, 30, 0.4)" strokeWidth="1.5" />
              <path d="M 128 148 Q 88 165 80 205 Q 75 245 95 270" stroke="rgba(119, 27, 30, 0.4)" strokeWidth="2" fill="none" />
              <path d="M 272 148 Q 312 165 320 205 Q 325 245 305 270" stroke="rgba(119, 27, 30, 0.4)" strokeWidth="2" fill="none" />
              <path
                d="M 95 270 Q 88 310 92 355 Q 98 400 115 440 L 150 465 L 200 478 L 250 465 L 285 440 Q 302 400 308 355 Q 312 310 305 270 Q 275 220 240 195 L 200 185 L 160 195 Q 125 220 95 270 Z"
                fill="url(#torsoGradInfo)"
                stroke="rgba(119, 27, 30, 0.4)"
                strokeWidth="2"
              />
              <ellipse cx="200" cy="270" rx="85" ry="95" fill="rgba(119, 27, 30, 0.08)" stroke="#771b1e" strokeWidth="2" strokeDasharray="6 4" />
              <path
                d="M200 215 C 160 192 130 205 130 240 C 130 278 200 335 200 335 C 200 335 270 278 270 240 C 270 205 240 192 200 215 Z"
                fill="url(#heartGradInfo)"
                stroke="#4a0f11"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="col-md-8">
            <h6 className="text-primary">
              <i className="bi bi-clipboard2-pulse me-2"></i>
              Datos ingresados
            </h6>
            <dl className="row small mb-3">
              {VARIABLES.map((def) => (
                <Fragment key={def.id}>
                  <dt className="col-sm-7 fw-normal text-muted">{def.etiqueta}</dt>
                  <dd className="col-sm-5 mb-1">{textoValor(def.id, datos[def.id])}</dd>
                </Fragment>
              ))}
            </dl>
            <AvisoNoDiagnostico className="mb-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
