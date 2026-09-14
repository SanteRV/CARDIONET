// Cálculo con los modelos de modelo.json, en el navegador.
// Va aparte de ./evaluacion.ts (que solo lee metricas.json) para que modelo.json se cargue con las
// páginas de evaluación y comparación, y no con la portada.

import { comparar, evaluar } from '../ml';
import { MODELOS, type DatosClinicos, type EvaluacionCompleta, type ResultadoModelo } from './evaluacion';

export function evaluarCaso(datos: DatosClinicos): EvaluacionCompleta {
  return { datos, principal: evaluar(datos) };
}

/** Resultado de los 3 modelos, siempre en el orden de MODELOS. */
export function compararCaso(datos: DatosClinicos): ResultadoModelo[] {
  const resultados = comparar(datos);
  return MODELOS.flatMap((id) => resultados.filter((r) => r.modelo === id).slice(0, 1));
}
