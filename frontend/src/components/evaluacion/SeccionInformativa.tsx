import type { EvaluacionResultado } from '../../api/evaluacion';

interface Props {
  resultado: EvaluacionResultado;
}

function obtenerFactoresRiesgo(params: Record<string, number>, tieneRiesgo: boolean): string[] {
  const factores: string[] = [];
  if (params.presion_arterial && params.presion_arterial > 140) factores.push('Presión arterial elevada');
  if (params.colesterol && params.colesterol > 240) factores.push('Colesterol alto');
  if (params.dolor_pecho && params.dolor_pecho >= 2) factores.push('Dolor torácico significativo');
  if (params.frecuencia_cardiaca && (params.frecuencia_cardiaca > 170 || params.frecuencia_cardiaca < 60)) factores.push('Frecuencia cardíaca anormal');
  if (params.depresion_st && params.depresion_st > 1.5) factores.push('Depresión del segmento ST');
  if (params.numero_vasos && params.numero_vasos > 0) factores.push('Alteración vascular detectada');
  if (factores.length === 0 && tieneRiesgo) factores.push('Combinación de factores clínicos');
  return factores;
}

export function SeccionInformativa({ resultado }: Readonly<Props>) {
  const tieneRiesgo = resultado.tiene_riesgo === 1;
  const params = resultado.parametros_evaluados || {};
  const perfil = resultado.perfil_riesgo?.principal || 'Cardiología General';
  const factoresRiesgo = obtenerFactoresRiesgo(params, tieneRiesgo);

  const sintomas = tieneRiesgo
    ? [
        'Dolor o presión en el pecho (angina)',
        'Dolor que puede irradiarse al brazo izquierdo, mandíbula o espalda',
        'Falta de aire (disnea)',
        'Fatiga inexplicable',
        'Palpitaciones o latidos irregulares',
        'Mareos o desmayos',
      ]
    : [
        'Síntomas menores o ausentes en evaluación de rutina',
        'Mantener controles preventivos según edad y factores de riesgo',
      ];

  return (
    <div className="card shadow mb-4">
      <div className={`card-header text-white ${tieneRiesgo ? 'bg-danger' : 'bg-success'}`}>
        <h5 className="mb-0">
          <i className="bi bi-heart-pulse me-2"></i>
          Información sobre su evaluación
        </h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-5 text-center mb-3 mb-md-0">
            <div className="seccion-informativa-illustracion">
              <svg
                viewBox="0 0 400 520"
                className="w-100"
                style={{ maxHeight: 280 }}
                role="img"
                aria-label="Torso humano con zona cardíaca destacada"
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
                  <linearGradient id="zonaRiesgoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={tieneRiesgo ? 'rgba(220, 53, 69, 0.4)' : 'rgba(40, 167, 69, 0.2)'} />
                    <stop offset="100%" stopColor={tieneRiesgo ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.05)'} />
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
                <ellipse cx="200" cy="270" rx="85" ry="95" fill="url(#zonaRiesgoGrad)" stroke={tieneRiesgo ? '#dc3545' : '#28a745'} strokeWidth="2" strokeDasharray="6 4" />
                <path
                  d="M200 215 C 160 192 130 205 130 240 C 130 278 200 335 200 335 C 200 335 270 278 270 240 C 270 205 240 192 200 215 Z"
                  fill="url(#heartGradInfo)"
                  stroke="#4a0f11"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p className="small text-muted mt-2 mb-0">
              Zona cardíaca evaluada (pecho y posible irradiación)
            </p>
          </div>
          <div className="col-md-7">
            <h6 className="text-primary">
              <i className="bi bi-clipboard2-pulse me-2"></i>
              Factores de riesgo identificados
            </h6>
            <ul className="small mb-3">
              {factoresRiesgo.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            <h6 className="text-primary">
              <i className="bi bi-activity me-2"></i>
              Síntomas a vigilar
            </h6>
            <ul className="small mb-3">
              {sintomas.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>

            <h6 className="text-primary">
              <i className="bi bi-lightbulb me-2"></i>
              Recomendaciones
            </h6>
            <div className={`alert ${tieneRiesgo ? 'alert-warning' : 'alert-success'} small mb-0`}>
              {tieneRiesgo ? (
                <>
                  Consulte con un cardiólogo lo antes posible. Se sugiere especialidad en{' '}
                  <strong>{perfil}</strong>. Realice los controles que su médico indique y evite factores de riesgo modificables (tabaco, sedentarismo, dieta rica en grasas).
                </>
              ) : (
                <>
                  Mantenga hábitos saludables: dieta equilibrada, ejercicio regular y controles preventivos. Consulte si aparecen síntomas nuevos o si tiene antecedentes familiares de cardiopatía.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
