// Inferencia de los modelos exportados en modelo.json (scikit-learn 1.6.1).
// Funciones puras: reciben el modelo como argumento, sin importar JSON ni tocar el DOM,
// para poder probarlas en Node (frontend/scripts/paridad.ts) con los mismos datos que usa la app.
// Guía de referencia: ml/verificar_paridad.py y el campo «formato» de modelo.json.

/** Árbol en arreglos: nodo n → variable f[n], umbral t[n], hijos l[n] y r[n], probabilidad de clase 1 p[n] (hojas). */
export interface ArbolExportado {
  f: number[];
  t: number[];
  l: number[];
  r: number[];
  p: number[];
}

/** SVC con kernel RBF sobre variables estandarizadas (StandardScaler). */
export interface SvmExportada {
  gamma: number;
  /** Vectores soporte ya estandarizados. */
  sv: number[][];
  coef: number[];
  b: number;
  probA: number;
  probB: number;
  mean: number[];
  scale: number[];
}

export interface ModeloExportado {
  features: string[];
  rf: { arboles: ArbolExportado[] };
  dt: ArbolExportado;
  svm: SvmExportada;
}

export type ClaveModelo = 'rf' | 'dt' | 'svm';

export interface SalidaModelo {
  /** Probabilidad de la clase 1 (enfermedad), entre 0 y 1. */
  probabilidad: number;
  prediccion: 0 | 1;
}

export type SalidaModelos = Record<ClaveModelo, SalidaModelo>;

/** Probabilidad de clase 1 en la hoja a la que llega x. */
export function probabilidadArbol(arbol: ArbolExportado, x: readonly number[]): number {
  const { f, t, l, r, p } = arbol;
  let n = 0;
  // Un árbol no puede tener más niveles que nodos: evita un bucle infinito con un JSON dañado.
  for (let pasos = 0; l[n] !== -1; pasos++) {
    if (pasos >= l.length || l[n] === undefined) throw new Error('Árbol mal formado en modelo.json');
    // scikit-learn pasa la entrada a float32 antes de comparar con el umbral (float64).
    n = Math.fround(x[f[n]]) <= t[n] ? l[n] : r[n];
  }
  return p[n];
}

/** Random Forest: media de las probabilidades de las hojas, sumadas en el orden de los árboles. */
export function probabilidadBosque(arboles: readonly ArbolExportado[], x: readonly number[]): number {
  let suma = 0;
  for (const arbol of arboles) suma += probabilidadArbol(arbol, x);
  return suma / arboles.length;
}

/** Decisión interna de libsvm: el negativo de decision_function de scikit-learn. */
export function decisionSvm(svm: SvmExportada, x: readonly number[]): number {
  const { mean, scale, sv, coef, gamma, b } = svm;
  const z = x.map((v, i) => (v - mean[i]) / scale[i]);
  let total = 0;
  for (let k = 0; k < sv.length; k++) {
    const vector = sv[k];
    let d2 = 0;
    for (let i = 0; i < z.length; i++) {
      const d = z[i] - vector[i];
      d2 += d * d;
    }
    total += coef[k] * Math.exp(-gamma * d2);
  }
  return total + b;
}

/**
 * Copia de multiclass_probability de libsvm (sklearn/svm/src/libsvm/svm.cpp).
 * r[i][j] es la probabilidad por pares de la clase i frente a la j.
 */
export function multiclassProbability(k: number, r: readonly (readonly number[])[]): number[] {
  const maxIter = Math.max(100, k);
  const eps = 0.005 / k;
  const p: number[] = new Array<number>(k).fill(1 / k);
  const Q: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  const Qp: number[] = new Array<number>(k).fill(0);

  for (let t = 0; t < k; t++) {
    Q[t][t] = 0;
    for (let j = 0; j < t; j++) {
      Q[t][t] += r[j][t] * r[j][t];
      Q[t][j] = Q[j][t];
    }
    for (let j = t + 1; j < k; j++) {
      Q[t][t] += r[j][t] * r[j][t];
      Q[t][j] = -r[j][t] * r[t][j];
    }
  }

  for (let iter = 0; iter < maxIter; iter++) {
    let pQp = 0;
    for (let t = 0; t < k; t++) {
      Qp[t] = 0;
      for (let j = 0; j < k; j++) Qp[t] += Q[t][j] * p[j];
      pQp += p[t] * Qp[t];
    }
    let maxError = 0;
    for (let t = 0; t < k; t++) {
      const error = Math.abs(Qp[t] - pQp);
      if (error > maxError) maxError = error;
    }
    if (maxError < eps) break;
    for (let t = 0; t < k; t++) {
      const diff = (-Qp[t] + pQp) / Q[t][t];
      p[t] += diff;
      pQp = (pQp + diff * (diff * Q[t][t] + 2 * Qp[t])) / (1 + diff) / (1 + diff);
      for (let j = 0; j < k; j++) {
        Qp[j] = (Qp[j] + diff * Q[t][j]) / (1 + diff);
        p[j] /= 1 + diff;
      }
    }
  }
  return p;
}

/** Probabilidad de clase 1 de la SVM (Platt + multiclass_probability, como predict_proba) y su decisión interna. */
export function probabilidadSvm(svm: SvmExportada, x: readonly number[]): { probabilidad: number; decision: number } {
  const decision = decisionSvm(svm, x);
  const fApB = decision * svm.probA + svm.probB;
  let q = fApB >= 0 ? Math.exp(-fApB) / (1 + Math.exp(-fApB)) : 1 / (1 + Math.exp(fApB));
  q = Math.min(Math.max(q, 1e-7), 1 - 1e-7);
  const p = multiclassProbability(2, [
    [0, q],
    [1 - q, 0],
  ]);
  return { probabilidad: p[1], decision };
}

/** Los tres modelos sobre un mismo vector x (13 números en el orden de modelo.features). */
export function evaluarModelos(modelo: ModeloExportado, x: readonly number[]): SalidaModelos {
  // Guarda propia: un vector incompleto o con NaN/Infinity daría probabilidades plausibles sin error.
  if (x.length !== modelo.features.length || !x.every((v) => Number.isFinite(v))) {
    throw new Error(`Entrada inválida: se esperaban ${modelo.features.length} números finitos.`);
  }
  const rf = probabilidadBosque(modelo.rf.arboles, x);
  const dt = probabilidadArbol(modelo.dt, x);
  const svm = probabilidadSvm(modelo.svm, x).probabilidad;
  // Misma regla en los tres modelos: clase 1 solo si la probabilidad es mayor que 0,5.
  // En los árboles coincide con predict(). En la SVM no se usa el signo de la decisión (predict() de
  // libsvm), porque cerca de 0,5 puede dar la clase contraria a la probabilidad que se muestra.
  return {
    rf: { probabilidad: rf, prediccion: rf > 0.5 ? 1 : 0 },
    dt: { probabilidad: dt, prediccion: dt > 0.5 ? 1 : 0 },
    svm: { probabilidad: svm, prediccion: svm > 0.5 ? 1 : 0 },
  };
}
