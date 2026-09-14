import type { DatosClinicos } from '../ml/tipos';

// Las 13 variables clínicas del conjunto UCI Heart Disease (Cleveland), en su orden
// y con su codificación original (ver heart-disease.names en el repositorio de UCI).

export type Variable = keyof DatosClinicos;
export type VariableNumerica = 'age' | 'trestbps' | 'chol' | 'thalach' | 'oldpeak';
export type VariableCategorica = Exclude<Variable, VariableNumerica>;

export interface Opcion {
  valor: number;
  /** Texto de la lista: corto, para que se lea completo con la lista cerrada. */
  texto: string;
  /** Texto completo para el resumen de datos, si el de la lista está abreviado. */
  textoCompleto?: string;
}

export interface Rango {
  min: number;
  max: number;
}

interface DefBase {
  etiqueta: string;
  /**
   * Nombre corto para el gráfico de peso de cada variable. Si falta, se usa el de metricas.json; se pone cuando
   * ese nombre no coincide con el del formulario (p. ej. «Thal» frente a «Resultado “thal”»).
   */
  etiquetaCorta?: string;
  ayuda: string;
  grupo: 'generales' | 'examenes';
}

export interface DefNumerica extends DefBase {
  tipo: 'numero';
  id: VariableNumerica;
  paso: number;
  unidad?: string;
}

export interface DefCategorica extends DefBase {
  tipo: 'opciones';
  id: VariableCategorica;
  opciones: Opcion[];
}

export type DefVariable = DefNumerica | DefCategorica;

const SI_NO: Opcion[] = [
  { valor: 1, texto: 'Sí' },
  { valor: 0, texto: 'No' },
];

export const VARIABLES: DefVariable[] = [
  {
    id: 'age',
    tipo: 'numero',
    grupo: 'generales',
    etiqueta: 'Edad',
    unidad: 'años',
    paso: 1,
    ayuda: 'Edad en años cumplidos.',
  },
  {
    id: 'sex',
    tipo: 'opciones',
    grupo: 'generales',
    etiqueta: 'Sexo',
    ayuda: 'Elige hombre o mujer.',
    opciones: [
      { valor: 1, texto: 'Hombre' },
      { valor: 0, texto: 'Mujer' },
    ],
  },
  {
    id: 'cp',
    tipo: 'opciones',
    grupo: 'generales',
    etiqueta: 'Tipo de dolor en el pecho',
    etiquetaCorta: 'Dolor en el pecho',
    ayuda: 'Según la clasificación de tu médico. «Asintomático» significa sin dolor en el pecho.',
    opciones: [
      { valor: 1, texto: 'Angina típica' },
      { valor: 2, texto: 'Angina atípica' },
      { valor: 3, texto: 'Dolor no anginoso' },
      { valor: 4, texto: 'Asintomático' },
    ],
  },
  {
    id: 'trestbps',
    tipo: 'numero',
    grupo: 'generales',
    etiqueta: 'Presión arterial en reposo',
    unidad: 'mm Hg',
    paso: 1,
    ayuda: 'Presión medida en reposo, en milímetros de mercurio.',
  },
  {
    id: 'chol',
    tipo: 'numero',
    grupo: 'generales',
    etiqueta: 'Colesterol en sangre',
    unidad: 'mg/dl',
    paso: 1,
    ayuda: 'Colesterol sérico, tal como figura en tu análisis de sangre.',
  },
  {
    id: 'fbs',
    tipo: 'opciones',
    grupo: 'generales',
    etiqueta: 'Glucosa en ayunas mayor de 120 mg/dl',
    ayuda: 'Azúcar en sangre medida en ayunas.',
    opciones: SI_NO,
  },
  {
    id: 'restecg',
    tipo: 'opciones',
    grupo: 'examenes',
    etiqueta: 'Electrocardiograma en reposo',
    // heart-disease.names (UCI): ST-T wave abnormality (T wave inversions and/or ST elevation or depression of
    // > 0.05 mV); probable or definite left ventricular hypertrophy by Estes' criteria.
    ayuda:
      'Resultado del electrocardiograma tomado en reposo. «Anomalía de la onda ST-T»: ondas T invertidas y/o elevación o depresión del segmento ST de más de 0,05 mV. «Hipertrofia ventricular izquierda»: probable o definida según los criterios de Estes.',
    opciones: [
      { valor: 0, texto: 'Normal' },
      { valor: 1, texto: 'Anomalía de la onda ST-T' },
      // Texto corto para que se lea completo con la lista cerrada; el completo va en la ayuda y en el resumen.
      {
        valor: 2,
        texto: 'Hipertrofia ventricular izquierda',
        textoCompleto: 'Hipertrofia ventricular izquierda probable o definida',
      },
    ],
  },
  {
    id: 'thalach',
    tipo: 'numero',
    grupo: 'examenes',
    etiqueta: 'Frecuencia cardíaca máxima alcanzada',
    paso: 1,
    ayuda: 'Frecuencia cardíaca máxima alcanzada, tal como figura en tu informe médico.',
  },
  {
    id: 'exang',
    tipo: 'opciones',
    grupo: 'examenes',
    etiqueta: 'Angina provocada por el ejercicio',
    ayuda: 'Dolor en el pecho que aparece con el ejercicio.',
    opciones: SI_NO,
  },
  {
    id: 'oldpeak',
    tipo: 'numero',
    grupo: 'examenes',
    etiqueta: 'Depresión del segmento ST con el ejercicio',
    paso: 0.1,
    ayuda: 'Cuánto baja el segmento ST del electrocardiograma con el ejercicio, comparado con el reposo. Si no baja, escribe 0.',
  },
  {
    id: 'slope',
    tipo: 'opciones',
    grupo: 'examenes',
    etiqueta: 'Pendiente del segmento ST en el esfuerzo máximo',
    ayuda: 'Forma del segmento ST en el momento de mayor esfuerzo de la prueba.',
    opciones: [
      { valor: 1, texto: 'Ascendente' },
      { valor: 2, texto: 'Plana' },
      { valor: 3, texto: 'Descendente' },
    ],
  },
  {
    id: 'ca',
    tipo: 'opciones',
    grupo: 'examenes',
    etiqueta: 'Vasos principales coloreados por fluoroscopia',
    etiquetaCorta: 'Vasos por fluoroscopia',
    // heart-disease.names (UCI): «number of major vessels (0-3) colored by flourosopy».
    ayuda:
      'Número de vasos principales (de 0 a 3) coloreados por fluoroscopia, tal como figura en tu informe médico. Si tu informe no trae este dato, pregúntale a tu médico: sin él no se puede calcular.',
    opciones: [
      { valor: 0, texto: '0' },
      { valor: 1, texto: '1' },
      { valor: 2, texto: '2' },
      { valor: 3, texto: '3' },
    ],
  },
  {
    id: 'thal',
    tipo: 'opciones',
    grupo: 'examenes',
    // heart-disease.names (UCI) solo dice «thal: 3 = normal; 6 = fixed defect; 7 = reversable defect»;
    // no nombra el examen, así que la app tampoco lo nombra.
    etiqueta: 'Resultado “thal”',
    etiquetaCorta: 'Resultado “thal”',
    ayuda:
      'Elige lo que diga tu informe: normal, defecto fijo o defecto reversible. La documentación de UCI solo llama a este dato «thal» y no dice de qué examen sale. Si no lo encuentras, pregúntale a tu médico: sin este dato no se puede calcular.',
    opciones: [
      { valor: 3, texto: 'Normal' },
      { valor: 6, texto: 'Defecto fijo' },
      { valor: 7, texto: 'Defecto reversible' },
    ],
  },
];

/**
 * Mínimo y máximo de cada variable numérica en data/uci/processed.cleveland.data
 * (303 filas). Se usan si metricas.json no trae «rangos». El formulario no acepta
 * valores fuera de lo que vieron los modelos al entrenar.
 */
export const RANGOS_DATASET: Record<VariableNumerica, Rango> = {
  age: { min: 29, max: 77 },
  trestbps: { min: 94, max: 200 },
  chol: { min: 126, max: 564 },
  thalach: { min: 71, max: 202 },
  oldpeak: { min: 0, max: 6.2 },
};

export interface Ejemplo {
  id: string;
  titulo: string;
  descripcion: string;
  conEnfermedad: boolean;
  datos: DatosClinicos;
}

export function crearEjemplo(conEnfermedad: boolean, datos: DatosClinicos, lineaArchivo: number | null): Ejemplo {
  const linea = lineaArchivo !== null ? ` (línea ${lineaArchivo} del archivo)` : '';
  return {
    id: conEnfermedad ? 'con-enfermedad' : 'sin-enfermedad',
    titulo: `Ejemplo: paciente ${conEnfermedad ? 'con' : 'sin'} enfermedad`,
    descripcion: `Caso real del conjunto de Cleveland${linea}, diagnosticado ${conEnfermedad ? 'con' : 'sin'} enfermedad cardíaca.`,
    conEnfermedad,
    datos,
  };
}

// La app usa metricas.json → ejemplos. Esto es solo el respaldo si ese campo falta o no es válido.
// Son las mismas filas, comprobadas en data/uci/processed.cleveland.data:
//  - línea 66:  60,1,4,145,282,0,2,142,1,2.8,2,2,7 → num = 2 (con enfermedad)
//  - línea 256: 42,0,3,120,209,0,0,173,0,0,2,0,3   → num = 0 (sin enfermedad)
export const EJEMPLOS_RESPALDO: Ejemplo[] = [
  crearEjemplo(
    true,
    { age: 60, sex: 1, cp: 4, trestbps: 145, chol: 282, fbs: 0, restecg: 2, thalach: 142, exang: 1, oldpeak: 2.8, slope: 2, ca: 2, thal: 7 },
    66
  ),
  crearEjemplo(
    false,
    { age: 42, sex: 0, cp: 3, trestbps: 120, chol: 209, fbs: 0, restecg: 0, thalach: 173, exang: 0, oldpeak: 0, slope: 2, ca: 0, thal: 3 },
    256
  ),
];

export function definicionDe(id: Variable): DefVariable {
  const def = VARIABLES.find((v) => v.id === id);
  if (!def) throw new Error(`Variable desconocida: ${id}`);
  return def;
}

/** Texto legible de un valor ya codificado (p. ej. cp = 4 → «Asintomático»). */
export function textoValor(id: Variable, valor: number): string {
  const def = definicionDe(id);
  if (def.tipo === 'opciones') {
    const opcion = def.opciones.find((o) => o.valor === valor);
    return opcion ? (opcion.textoCompleto ?? opcion.texto) : String(valor);
  }
  const numero = new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(valor);
  return def.unidad ? `${numero} ${def.unidad}` : numero;
}
