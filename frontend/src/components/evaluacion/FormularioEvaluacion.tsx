import { useState, type FormEvent } from 'react';
import type { DatosClinicos } from '../../ml/tipos';
import { VARIABLES, type DefVariable, type Variable } from '../../data/variables';
import { metricas, rangoDe, validarDatos } from '../../api/evaluacion';
import { useNotification } from '../../hooks/useNotification';
import { AvisoNoDiagnostico, AvisoPrivacidad } from './Avisos';

type ValoresFormulario = Record<Variable, string>;

const NUMERO_CORTO = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });

/**
 * Dos columnas en tablets y tres desde 1200 px: con tres columnas en pantallas medianas, las opciones
 * largas de las listas («Hipertrofia ventricular izquierda») se cortaban con la lista cerrada.
 */
const CLASE_COLUMNA = 'col-md-6 col-xl-4 mb-3';

function aFormulario(datos?: DatosClinicos): ValoresFormulario {
  const valores = {} as ValoresFormulario;
  for (const def of VARIABLES) valores[def.id] = datos ? String(datos[def.id]) : '';
  return valores;
}

interface CampoProps {
  def: DefVariable;
  valor: string;
  onChange: (id: Variable, valor: string) => void;
}

function Campo({ def, valor, onChange }: Readonly<CampoProps>) {
  const idAyuda = `${def.id}-ayuda`;

  if (def.tipo === 'opciones') {
    return (
      <div className={CLASE_COLUMNA}>
        <label className="form-label" htmlFor={def.id}>{def.etiqueta}</label>
        <select
          className="form-select"
          id={def.id}
          value={valor}
          onChange={(e) => onChange(def.id, e.target.value)}
          aria-describedby={idAyuda}
          required
        >
          <option value="">Elige una opción...</option>
          {def.opciones.map((o) => (
            <option key={o.valor} value={o.valor}>{o.texto}</option>
          ))}
        </select>
        <div id={idAyuda} className="form-text">{def.ayuda}</div>
      </div>
    );
  }

  const { min, max } = rangoDe(def.id);
  return (
    <div className={CLASE_COLUMNA}>
      <label className="form-label" htmlFor={def.id}>
        {def.etiqueta}
        {def.unidad ? ` (${def.unidad})` : ''}
      </label>
      <input
        type="number"
        inputMode="decimal"
        className="form-control"
        id={def.id}
        min={min}
        max={max}
        step={def.paso}
        value={valor}
        onChange={(e) => onChange(def.id, e.target.value)}
        aria-describedby={idAyuda}
        required
      />
      <div id={idAyuda} className="form-text">
        {def.ayuda} Acepta de {NUMERO_CORTO.format(min)} a {NUMERO_CORTO.format(max)}, los valores presentes en los
        datos de entrenamiento.
      </div>
    </div>
  );
}

interface Props {
  valoresIniciales?: DatosClinicos;
  onSubmit: (datos: DatosClinicos) => void;
}

export function FormularioEvaluacion({ valoresIniciales, onSubmit }: Readonly<Props>) {
  const [valores, setValores] = useState<ValoresFormulario>(() => aFormulario(valoresIniciales));
  // Mensaje en línea junto a los botones de ejemplo (no emergente): no tapa el botón ni la ayuda de los campos.
  const [ejemploCargado, setEjemploCargado] = useState<string | null>(null);
  const { notify, cerrarNotificaciones } = useNotification();

  const handleChange = (id: Variable, valor: string) => {
    setValores((v) => ({ ...v, [id]: valor }));
    // Si se cambia un dato, ya no es el caso del ejemplo tal cual.
    setEjemploCargado(null);
  };

  const handleEjemplo = (id: string) => {
    const ejemplo = metricas.ejemplos.find((e) => e.id === id);
    if (!ejemplo) return;
    setValores(aFormulario(ejemplo.datos));
    cerrarNotificaciones();
    setEjemploCargado(`${ejemplo.descripcion} Pulsa «Calcular probabilidad».`);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // El mensaje del ejemplo o un error anterior ya no aplican: no deben quedar junto al resultado.
    cerrarNotificaciones();
    setEjemploCargado(null);
    const validacion = validarDatos(valores);
    if (!validacion.ok) {
      notify(validacion.error, 'warning');
      return;
    }
    onSubmit(validacion.datos);
  };

  const renderGrupo = (grupo: DefVariable['grupo']) => (
    <div className="row">
      {VARIABLES.filter((d) => d.grupo === grupo).map((def) => (
        <Campo key={def.id} def={def} valor={valores[def.id]} onChange={handleChange} />
      ))}
    </div>
  );

  return (
    <div className="card shadow">
      <div className="card-header bg-primary text-white">
        <h4 className="mb-0"><i className="bi bi-clipboard-pulse"></i> Evaluación de riesgo cardíaco</h4>
      </div>
      <div className="card-body">
        <AvisoNoDiagnostico />
        <AvisoPrivacidad />
        <p className="text-muted mb-4">
          Completa los 13 datos. Varios salen de exámenes médicos: electrocardiograma, prueba de esfuerzo, fluoroscopia
          (vasos coloreados) y el resultado “thal”. Si tu informe no los trae, pregúntale a tu médico: sin ellos no se
          puede calcular la estimación.
        </p>

        {/* autoComplete="off": el navegador no guarda lo escrito para autocompletar ni lo restaura al reabrir la pestaña. */}
        <form onSubmit={handleSubmit} autoComplete="off">
          <h5 className="border-bottom pb-2 mb-3">Datos generales</h5>
          {renderGrupo('generales')}

          <h5 className="border-bottom pb-2 mb-3 mt-2">Resultados de exámenes</h5>
          {renderGrupo('examenes')}

          <div className="text-center d-flex justify-content-center gap-2 flex-wrap mt-3">
            {metricas.ejemplos.map((ejemplo) => (
              <button
                key={ejemplo.id}
                type="button"
                className="btn btn-outline-secondary btn-lg"
                onClick={() => handleEjemplo(ejemplo.id)}
                title={ejemplo.descripcion}
              >
                <i className="bi bi-play-circle"></i> {ejemplo.titulo}
              </button>
            ))}
            <button type="submit" className="btn btn-primary btn-lg">Calcular probabilidad</button>
          </div>
          <p className="small text-center mt-2 mb-0" role="status">
            {ejemploCargado ? (
              <span className="text-body">
                <i className="bi bi-check2-circle me-1 text-brand" aria-hidden="true"></i>
                {ejemploCargado}
              </span>
            ) : (
              <span className="text-muted">Los ejemplos cargan casos reales del conjunto de datos de Cleveland.</span>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
