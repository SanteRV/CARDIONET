// Prueba de paridad entre la inferencia de la app (src/ml/inferencia.ts) y scikit-learn.
// Uso, desde la raíz del repositorio:  node frontend/scripts/paridad.ts
// Lee frontend/src/ml/modelo.json y ml/referencia.json (salidas de scikit-learn 1.6.1).
// Criterios: diferencia máxima 0 en Random Forest y árbol, menor que 1e-9 en SVM,
// y etiquetas iguales en todas las filas de los tres modelos (en los tres, clase 1 si la probabilidad
// es mayor que 0,5: ref.pred_svm de referencia.json). Además comprueba los ejemplos y rangos de respaldo
// de src/data/variables.ts frente a metricas.json, y que la inferencia rechaza entradas inválidas.
// Sale con código 1 si algo falla.

import { readFileSync } from 'node:fs';
import { evaluarModelos, probabilidadSvm, type ClaveModelo, type ModeloExportado } from '../src/ml/inferencia.ts';
import { EJEMPLOS_RESPALDO, RANGOS_DATASET } from '../src/data/variables.ts';

interface Referencia {
  features: string[];
  grupos: Record<string, [number, number]>;
  X: number[][];
  ref: Record<ClaveModelo, number[]> & {
    pred_rf: number[];
    pred_dt: number[];
    pred_svm: number[];
    decision_svm: number[];
  };
}

interface Ejemplo {
  linea_archivo: number;
  valores: Record<string, number>;
  probabilidad_modelo_final: Record<ClaveModelo, number>;
}

const leer = <T>(rutaRelativa: string): T =>
  JSON.parse(readFileSync(new URL(rutaRelativa, import.meta.url), 'utf8')) as T;

const modelo = leer<ModeloExportado>('../src/ml/modelo.json');
const R = leer<Referencia>('../../ml/referencia.json');
const metricas = leer<{
  ejemplos: Record<string, Ejemplo>;
  rangos: Record<string, { min: number; max: number }>;
}>('../src/ml/metricas.json');

const CLAVES: ClaveModelo[] = ['rf', 'dt', 'svm'];
let ok = true;
const fallar = (motivo: string) => {
  ok = false;
  console.log(`   FALLA: ${motivo}`);
};

if (JSON.stringify(modelo.features) !== JSON.stringify(R.features)) {
  console.log('Las variables de modelo.json y referencia.json no coinciden');
  process.exit(1);
}

const n = R.X.length;
const t0 = performance.now();
const salidas = R.X.map((x) => evaluarModelos(modelo, x));
const ms = performance.now() - t0;
const decisiones = R.X.map((x) => probabilidadSvm(modelo.svm, x).decision);

const grupos: Record<string, [number, number]> = { ...R.grupos, total: [0, n] };
for (const [nombre, [i0, i1]] of Object.entries(grupos)) {
  const filas = i1 - i0;
  console.log(`-- ${nombre} (${filas} filas)`);
  for (const k of CLAVES) {
    let difMax = 0;
    let identicas = 0;
    let etiquetas = 0;
    for (let i = i0; i < i1; i++) {
      const d = Math.abs(salidas[i][k].probabilidad - R.ref[k][i]);
      if (d > difMax) difMax = d;
      if (d === 0) identicas++;
      if (salidas[i][k].prediccion === R.ref[`pred_${k}`][i]) etiquetas++;
    }
    console.log(
      `   ${k.toUpperCase().padEnd(3)} dif. máx. prob. ${difMax.toExponential(3)}  idénticas ${identicas}/${filas}  etiquetas iguales ${etiquetas}/${filas}`
    );
    if (nombre === 'total') {
      if (k === 'svm' ? !(difMax < 1e-9) : difMax !== 0) fallar(`${k}: diferencia máxima ${difMax}`);
      if (etiquetas !== filas) fallar(`${k}: etiquetas iguales ${etiquetas}/${filas}`);
    }
  }
  let difDec = 0;
  for (let i = i0; i < i1; i++) difDec = Math.max(difDec, Math.abs(decisiones[i] + R.ref.decision_svm[i]));
  console.log(`   SVM decisión interna frente a -decision_function: dif. máx. ${difDec.toExponential(3)}`);
}

// Los ejemplos del formulario (metricas.json → ejemplos) con las probabilidades que publica metricas.json (4 decimales).
console.log('-- ejemplos de metricas.json');
for (const [nombre, e] of Object.entries(metricas.ejemplos)) {
  if (typeof e !== 'object' || e === null || !('valores' in e)) continue;
  const x = modelo.features.map((f) => e.valores[f]);
  const s = evaluarModelos(modelo, x);
  const partes = CLAVES.map((k) => {
    const publicada = e.probabilidad_modelo_final[k];
    const coincide = Math.round(s[k].probabilidad * 1e4) / 1e4 === publicada;
    if (!coincide) fallar(`ejemplo ${nombre}, ${k}: ${s[k].probabilidad} frente a ${publicada}`);
    return `${k.toUpperCase()} ${s[k].probabilidad} (publicada ${publicada}${coincide ? ', coincide' : ''})`;
  });
  console.log(`   ${nombre} (línea ${e.linea_archivo}): ${partes.join('; ')}`);
}

// Respaldos de src/data/variables.ts: la app solo los usa si metricas.json no trae el campo, pero si se
// reentrena y cambian los rangos o los ejemplos, deben actualizarse. Esto avisa.
console.log('-- respaldos de src/data/variables.ts frente a metricas.json');
for (const [v, r] of Object.entries(RANGOS_DATASET)) {
  const m = metricas.rangos[v];
  if (!m || m.min !== r.min || m.max !== r.max) {
    fallar(`RANGOS_DATASET.${v} = ${JSON.stringify(r)}; metricas.json tiene ${JSON.stringify(m)}`);
  }
}
console.log(`   RANGOS_DATASET: ${Object.keys(RANGOS_DATASET).length} variables comparadas`);
for (const respaldo of EJEMPLOS_RESPALDO) {
  const nombre = respaldo.conEnfermedad ? 'con_enfermedad' : 'sin_enfermedad';
  const e = metricas.ejemplos[nombre];
  const datos = respaldo.datos as unknown as Record<string, number>;
  const iguales =
    e !== undefined &&
    modelo.features.every((f) => datos[f] === e.valores[f]) &&
    respaldo.descripcion.includes(`línea ${e.linea_archivo} `);
  console.log(`   EJEMPLOS_RESPALDO ${nombre}: ${iguales ? 'coincide' : 'NO coincide'}`);
  if (!iguales) fallar(`EJEMPLOS_RESPALDO ${nombre} no coincide con metricas.json`);
}

// La inferencia debe rechazar vectores incompletos o con valores no finitos, sin depender de quien la llame.
console.log('-- entradas inválidas');
const base = R.X[0];
const invalidas: [string, number[]][] = [
  ['12 números', base.slice(0, 12)],
  ['14 números', [...base, 0]],
  ['colesterol NaN', base.map((v, i) => (i === 4 ? Number.NaN : v))],
  ['frecuencia Infinity', base.map((v, i) => (i === 7 ? Number.POSITIVE_INFINITY : v))],
];
for (const [nombre, x] of invalidas) {
  let rechazada = false;
  try {
    evaluarModelos(modelo, x);
  } catch {
    rechazada = true;
  }
  console.log(`   ${nombre}: ${rechazada ? 'rechazada' : 'NO rechazada'}`);
  if (!rechazada) fallar(`entrada inválida aceptada (${nombre})`);
}

console.log(`Tiempo: ${ms.toFixed(1)} ms para evaluar los 3 modelos en ${n} filas.`);
console.log('RESULTADO:', ok ? 'OK' : 'FALLA');
process.exit(ok ? 0 : 1);
