// Inferencia local: los tres modelos se evalúan en el navegador con modelo.json.
// Contrato con la interfaz: ./tipos.ts. Nada se envía a ningún servidor.

import modeloJson from './modelo.json';
import metricasJson from './metricas.json';
import type { DatosClinicos, ModeloId, ResultadoModelo } from './tipos';
import { evaluarModelos, type ClaveModelo, type ModeloExportado } from './inferencia';

const modelo: ModeloExportado = modeloJson;
// metricas.json lo normaliza src/api/evaluacion.ts; aquí solo se usan los nombres de los modelos.

/** Orden de las variables que esperan los modelos (codificación original de UCI). */
const VARIABLES: readonly (keyof DatosClinicos)[] = [
  'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal',
];

/** Modelos en el orden en que se muestran, con su clave en modelo.json y metricas.json. */
const MODELOS: readonly { id: ModeloId; clave: ClaveModelo }[] = [
  { id: 'random_forest', clave: 'rf' },
  { id: 'arbol_decision', clave: 'dt' },
  { id: 'svm', clave: 'svm' },
];

// Los mismos nombres que la tabla de métricas (metricas.json → modelos.*.nombre).
const NOMBRES: Record<ClaveModelo, string> = {
  rf: metricasJson.modelos.rf.nombre,
  dt: metricasJson.modelos.dt.nombre,
  svm: metricasJson.modelos.svm.nombre,
};

const ERROR_FORMATO =
  modelo.features.length === VARIABLES.length && modelo.features.every((f, i) => f === VARIABLES[i])
    ? null
    : 'Las variables de modelo.json no coinciden con las del formulario.';

function vectorEntrada(d: DatosClinicos): number[] {
  if (ERROR_FORMATO) throw new Error(ERROR_FORMATO);
  return VARIABLES.map((v) => {
    const valor = d[v];
    if (typeof valor !== 'number' || !Number.isFinite(valor)) {
      throw new Error(`Falta un valor numérico válido en «${v}».`);
    }
    return valor;
  });
}

/** Los tres modelos, en orden fijo: Random Forest, árbol de decisión y SVM. */
export function comparar(d: DatosClinicos): ResultadoModelo[] {
  const salida = evaluarModelos(modelo, vectorEntrada(d));
  return MODELOS.map(({ id, clave }) => ({
    modelo: id,
    nombre: NOMBRES[clave],
    probabilidad: salida[clave].probabilidad,
    prediccion: salida[clave].prediccion,
  }));
}

/** Random Forest, el modelo principal de la app. */
export function evaluar(d: DatosClinicos): ResultadoModelo {
  return comparar(d)[0];
}
