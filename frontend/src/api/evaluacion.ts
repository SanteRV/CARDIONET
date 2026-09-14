// Adaptador entre src/ml y las páginas: validación de los datos y métricas (metricas.json).
// Todo se calcula en el navegador: aquí no hay llamadas de red.
// El cálculo con los modelos (modelo.json) está en ./calculo.ts, para que no se cargue en la portada.

import metricasCrudas from '../ml/metricas.json';
import type { DatosClinicos, ModeloId, ResultadoModelo } from '../ml/tipos';
import {
  EJEMPLOS_RESPALDO,
  RANGOS_DATASET,
  VARIABLES,
  crearEjemplo,
  type Ejemplo,
  type Rango,
  type Variable,
  type VariableNumerica,
} from '../data/variables';

export type { DatosClinicos, Ejemplo, ModeloId, ResultadoModelo };

export const MODELOS: readonly ModeloId[] = ['random_forest', 'arbol_decision', 'svm'];

/* ------------------------------------------------------------------ */
/* Evaluación                                                          */
/* ------------------------------------------------------------------ */

/** Resultado de ./calculo.ts → evaluarCaso. */
export interface EvaluacionCompleta {
  datos: DatosClinicos;
  /** Random Forest, el modelo principal. */
  principal: ResultadoModelo;
}

export type ValidacionDatos = { ok: true; datos: DatosClinicos } | { ok: false; error: string };

type Rangos = Record<VariableNumerica, Rango>;

const NUMERO_CORTO = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });

function validarConRangos(entrada: unknown, rangos: Rangos): ValidacionDatos {
  if (!esObjeto(entrada)) return { ok: false, error: 'Faltan los datos clínicos.' };
  const valores = {} as Record<Variable, number>;
  for (const def of VARIABLES) {
    const valor = aNumero(entrada[def.id]);
    if (valor === null) {
      return { ok: false, error: `Completa el campo «${def.etiqueta}».` };
    }
    if (def.tipo === 'opciones') {
      if (!def.opciones.some((o) => o.valor === valor)) {
        return { ok: false, error: `Elige una opción válida en «${def.etiqueta}».` };
      }
    } else {
      const { min, max } = rangos[def.id];
      if (valor < min || valor > max) {
        const unidad = def.unidad ? ` ${def.unidad}` : '';
        return {
          ok: false,
          error: `«${def.etiqueta}» debe estar entre ${NUMERO_CORTO.format(min)} y ${NUMERO_CORTO.format(max)}${unidad}.`,
        };
      }
    }
    valores[def.id] = valor;
  }
  return { ok: true, datos: valores as DatosClinicos };
}

/** Convierte y valida los 13 datos (desde el formulario o desde el estado de la ruta). */
export function validarDatos(entrada: unknown): ValidacionDatos {
  return validarConRangos(entrada, metricas.rangos);
}

/* ------------------------------------------------------------------ */
/* Métricas (metricas.json, normalizado con guardas)                  */
/* ------------------------------------------------------------------ */

export type MetricaId = 'exactitud' | 'sensibilidad' | 'especificidad' | 'precision' | 'f1' | 'auc';

/** Proporciones entre 0 y 1 (el AUC también). */
export interface Estadistico {
  media: number;
  desviacion: number | null;
  min: number | null;
  max: number | null;
}

export interface FuenteDatos {
  nombre: string;
  url: string;
  licencia: string;
  urlLicencia: string | null;
  doi: string;
  urlDoi: string;
  cita: string;
}

export interface Importancia {
  variable: string;
  etiqueta: string;
  /** Proporción entre 0 y 1. */
  valor: number;
}

export interface ValidacionModelos {
  /** Cómo se validó, en texto. */
  metodo: string | null;
  /** Qué resume cada cifra (media, desviación…). */
  resumen: string | null;
  /** Cómo cada modelo asigna el grupo (clase 0 o 1). */
  reglaClase: string | null;
}

export interface MetricasApp {
  fuente: FuenteDatos;
  /** Pacientes usados para entrenar. */
  n: number | null;
  nConEnfermedad: number | null;
  nSinEnfermedad: number | null;
  filasEnArchivo: number | null;
  filasDescartadas: number | null;
  validacion: ValidacionModelos;
  nombres: Record<ModeloId, string>;
  modelos: Partial<Record<ModeloId, Partial<Record<MetricaId, Estadistico>>>>;
  importancias: Importancia[];
  importanciasNota: string | null;
  rangos: Rangos;
  ejemplos: Ejemplo[];
}

export const METRICAS: readonly { id: MetricaId; nombre: string; explicacion: string }[] = [
  { id: 'exactitud', nombre: 'Exactitud', explicacion: 'Porcentaje de pacientes clasificados correctamente.' },
  { id: 'sensibilidad', nombre: 'Sensibilidad', explicacion: 'De los pacientes con enfermedad, qué porcentaje ubicó el modelo en el grupo con enfermedad.' },
  { id: 'especificidad', nombre: 'Especificidad', explicacion: 'De los pacientes sin enfermedad, qué porcentaje ubicó el modelo en el grupo sin enfermedad.' },
  { id: 'precision', nombre: 'Precisión', explicacion: 'De los pacientes que el modelo ubicó en el grupo con enfermedad, qué porcentaje la tenía.' },
  { id: 'f1', nombre: 'F1', explicacion: 'Combina precisión y sensibilidad en un solo valor.' },
  { id: 'auc', nombre: 'AUC', explicacion: 'Capacidad de la probabilidad para separar a los dos grupos: 0,5 equivale al azar y 1 a una separación perfecta.' },
];

const NOMBRE_MODELO: Record<ModeloId, string> = {
  random_forest: 'Random Forest',
  arbol_decision: 'Árbol de decisión',
  svm: 'SVM',
};

// Cita y licencia publicadas en https://archive.ics.uci.edu/dataset/45/heart+disease
// Solo se usan si metricas.json no trae el campo correspondiente.
const FUENTE_UCI = {
  nombre: 'Heart Disease (UCI Machine Learning Repository)',
  url: 'https://archive.ics.uci.edu/dataset/45/heart+disease',
  licencia: 'CC BY 4.0',
  doi: '10.24432/C52P4X',
  cita: 'Janosi, A., Steinbrunn, W., Pfisterer, M., & Detrano, R. (1989). Heart Disease [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C52P4X.',
};

const URL_CC_BY_4 = 'https://creativecommons.org/licenses/by/4.0/';

const CLAVES_MODELO: Record<ModeloId, readonly string[]> = {
  random_forest: ['random_forest', 'rf', 'randomforest'],
  arbol_decision: ['arbol_decision', 'dt', 'decision_tree', 'arbol', 'arbol_de_decision'],
  svm: ['svm'],
};

const CLAVES_METRICA: Record<MetricaId, readonly string[]> = {
  exactitud: ['exactitud', 'accuracy'],
  sensibilidad: ['sensibilidad', 'recall', 'sensitivity'],
  especificidad: ['especificidad', 'specificity'],
  precision: ['precision', 'precisión'],
  f1: ['f1', 'f1_score'],
  auc: ['auc_roc', 'auc', 'roc_auc'],
};

type Objeto = Record<string, unknown>;

function esObjeto(v: unknown): v is Objeto {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function aNumero(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function aTexto(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function campo(o: Objeto, claves: readonly string[]): unknown {
  for (const c of claves) {
    if (o[c] !== undefined && o[c] !== null) return o[c];
  }
  return undefined;
}

function leerEstadistico(v: unknown): Estadistico | null {
  let e: Estadistico | null = null;
  const directo = aNumero(v);
  if (directo !== null) {
    e = { media: directo, desviacion: null, min: null, max: null };
  } else if (esObjeto(v)) {
    const media = aNumero(campo(v, ['media', 'mean', 'promedio', 'valor']));
    if (media === null) return null;
    e = {
      media,
      desviacion: aNumero(campo(v, ['desviacion', 'desviacion_estandar', 'de', 'std', 'sd'])),
      min: aNumero(campo(v, ['min', 'minimo'])),
      max: aNumero(campo(v, ['max', 'maximo'])),
    };
  }
  if (!e) return null;
  // Si viene en escala 0–100, se pasa a proporción.
  if (e.media > 1) {
    const escalar = (x: number | null) => (x === null ? null : x / 100);
    return { media: e.media / 100, desviacion: escalar(e.desviacion), min: escalar(e.min), max: escalar(e.max) };
  }
  return e;
}

function leerNombres(modelos: Objeto): Record<ModeloId, string> {
  const nombres = { ...NOMBRE_MODELO };
  for (const id of MODELOS) {
    const crudo = campo(modelos, CLAVES_MODELO[id]);
    const nombre = esObjeto(crudo) ? aTexto(crudo.nombre) : null;
    if (nombre) nombres[id] = nombre;
  }
  return nombres;
}

function leerModelos(modelos: Objeto): MetricasApp['modelos'] {
  const salida: MetricasApp['modelos'] = {};
  for (const id of MODELOS) {
    const crudo = campo(modelos, CLAVES_MODELO[id]);
    if (!esObjeto(crudo)) continue;
    const origen = esObjeto(crudo.metricas) ? crudo.metricas : crudo;
    const metricasModelo: Partial<Record<MetricaId, Estadistico>> = {};
    for (const { id: metrica } of METRICAS) {
      const e = leerEstadistico(campo(origen, CLAVES_METRICA[metrica]));
      if (e) metricasModelo[metrica] = e;
    }
    if (Object.keys(metricasModelo).length > 0) salida[id] = metricasModelo;
  }
  return salida;
}

function leerClases(v: unknown): { con: number | null; sin: number | null } {
  if (Array.isArray(v)) return { sin: aNumero(v[0]), con: aNumero(v[1]) };
  if (esObjeto(v)) {
    return {
      con: aNumero(campo(v, ['1', 'con_enfermedad', 'enfermedad', 'positivos', 'positivo'])),
      sin: aNumero(campo(v, ['0', 'sin_enfermedad', 'sanos', 'negativos', 'negativo'])),
    };
  }
  return { con: null, sin: null };
}

function leerValidacion(v: unknown): ValidacionModelos {
  const texto = aTexto(v);
  if (texto) return { metodo: texto, resumen: null, reglaClase: null };
  if (!esObjeto(v)) return { metodo: null, resumen: null, reglaClase: null };
  let metodo = aTexto(campo(v, ['metodo', 'descripcion', 'texto']));
  if (!metodo) {
    const pliegues = aNumero(campo(v, ['k', 'pliegues', 'folds', 'n_splits', 'particiones']));
    const repeticiones = aNumero(campo(v, ['repeticiones', 'n_repeats', 'repeats']));
    const partes = [
      aTexto(campo(v, ['tipo', 'estrategia', 'nombre'])),
      pliegues !== null ? `${pliegues} particiones` : null,
      repeticiones !== null ? `${repeticiones} repeticiones` : null,
    ].filter((p): p is string => p !== null);
    metodo = partes.length > 0 ? partes.join(', ') : null;
  }
  return {
    metodo,
    resumen: aTexto(campo(v, ['resumen'])),
    reglaClase: aTexto(campo(v, ['etiqueta', 'regla_clase', 'umbral'])),
  };
}

function leerImportancias(v: unknown): Importancia[] {
  if (!Array.isArray(v)) return [];
  const lista = v.flatMap((item): Importancia[] => {
    if (!esObjeto(item)) return [];
    const valor = aNumero(campo(item, ['importancia', 'valor', 'value']));
    if (valor === null) return [];
    const variable = aTexto(campo(item, ['variable', 'codigo', 'id'])) ?? '';
    const def = VARIABLES.find((d) => d.id === variable);
    // Primero el nombre corto de la app, para que el gráfico use los mismos nombres que el formulario.
    const etiqueta =
      def?.etiquetaCorta ??
      aTexto(campo(item, ['etiqueta_corta', 'etiqueta', 'nombre', 'label'])) ??
      def?.etiqueta ??
      variable;
    return [{ variable, etiqueta, valor }];
  });
  const total = lista.reduce((suma, i) => suma + i.valor, 0);
  const escala = total > 1.5 ? 100 : 1;
  return lista.map((i) => ({ ...i, valor: i.valor / escala })).sort((a, b) => b.valor - a.valor);
}

function leerRangos(v: unknown): Rangos {
  const rangos = { ...RANGOS_DATASET };
  if (!esObjeto(v)) return rangos;
  for (const id of Object.keys(RANGOS_DATASET) as VariableNumerica[]) {
    const crudo = v[id];
    let min: number | null = null;
    let max: number | null = null;
    if (Array.isArray(crudo)) {
      min = aNumero(crudo[0]);
      max = aNumero(crudo[1]);
    } else if (esObjeto(crudo)) {
      min = aNumero(campo(crudo, ['min', 'minimo']));
      max = aNumero(campo(crudo, ['max', 'maximo']));
    }
    if (min !== null && max !== null && min < max) rangos[id] = { min, max };
  }
  return rangos;
}

/** Un ejemplo con enfermedad y otro sin ella; si metricas.json no los trae bien, los de respaldo. */
function leerEjemplos(v: unknown, rangos: Rangos): Ejemplo[] {
  let candidatos: unknown[] = [];
  if (Array.isArray(v)) candidatos = v;
  else if (esObjeto(v)) candidatos = [campo(v, ['con_enfermedad']), campo(v, ['sin_enfermedad'])];
  const ejemplos = candidatos.flatMap((crudo): Ejemplo[] => {
    if (!esObjeto(crudo)) return [];
    const num = aNumero(campo(crudo, ['num', 'clase']));
    const validacion = validarConRangos(campo(crudo, ['valores', 'datos']) ?? crudo, rangos);
    if (num === null || !validacion.ok) return [];
    return [crearEjemplo(num > 0, validacion.datos, aNumero(campo(crudo, ['linea_archivo'])))];
  });
  const con = ejemplos.find((e) => e.conEnfermedad);
  const sin = ejemplos.find((e) => !e.conEnfermedad);
  return con && sin ? [con, sin] : EJEMPLOS_RESPALDO;
}

function leerFuente(v: unknown): FuenteDatos {
  const o: Objeto = esObjeto(v) ? v : {};
  const licencia = aTexto(o.licencia) ?? FUENTE_UCI.licencia;
  const doi = aTexto(o.doi) ?? FUENTE_UCI.doi;
  return {
    nombre: aTexto(o.nombre) ?? FUENTE_UCI.nombre,
    url: aTexto(o.url) ?? FUENTE_UCI.url,
    licencia,
    urlLicencia:
      aTexto(campo(o, ['licencia_url', 'url_licencia'])) ?? (/CC[\s-]*BY[\s-]*4\.0/i.test(licencia) ? URL_CC_BY_4 : null),
    doi,
    urlDoi: /^https?:\/\//i.test(doi) ? doi : `https://doi.org/${doi}`,
    cita: aTexto(o.cita) ?? FUENTE_UCI.cita,
  };
}

export function normalizarMetricas(crudo: unknown): MetricasApp {
  const o: Objeto = esObjeto(crudo) ? crudo : {};
  const datos: Objeto = esObjeto(o.datos) ? o.datos : {};
  const modelos: Objeto = esObjeto(o.modelos) ? o.modelos : {};
  const clases = leerClases(campo(o, ['n_por_clase']) ?? campo(datos, ['n_por_clase']));
  const n =
    aNumero(o.n) ??
    aNumero(campo(datos, ['n_total', 'n'])) ??
    (clases.con !== null && clases.sin !== null ? clases.con + clases.sin : null);
  const rangos = leerRangos(o.rangos);
  return {
    fuente: leerFuente(o.fuente),
    n,
    nConEnfermedad: clases.con,
    nSinEnfermedad: clases.sin,
    filasEnArchivo: aNumero(campo(datos, ['filas_en_archivo'])),
    filasDescartadas: aNumero(campo(datos, ['filas_descartadas'])),
    validacion: leerValidacion(o.validacion),
    nombres: leerNombres(modelos),
    modelos: leerModelos(modelos),
    importancias: leerImportancias(o.importancias),
    importanciasNota: aTexto(o.importancias_nota),
    rangos,
    ejemplos: leerEjemplos(o.ejemplos, rangos),
  };
}

export const metricas: MetricasApp = normalizarMetricas(metricasCrudas as unknown);

export function rangoDe(id: VariableNumerica): Rango {
  return metricas.rangos[id];
}
