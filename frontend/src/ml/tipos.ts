// Contrato entre la interfaz y la inferencia local (frontend/src/ml/index.ts).
// Codificación original del conjunto UCI Heart Disease (Cleveland).

export type ModeloId = 'random_forest' | 'arbol_decision' | 'svm';

export interface DatosClinicos {
  age: number;
  sex: 0 | 1;
  cp: 1 | 2 | 3 | 4;
  trestbps: number;
  chol: number;
  fbs: 0 | 1;
  restecg: 0 | 1 | 2;
  thalach: number;
  exang: 0 | 1;
  oldpeak: number;
  slope: 1 | 2 | 3;
  ca: 0 | 1 | 2 | 3;
  thal: 3 | 6 | 7;
}

export interface ResultadoModelo {
  modelo: ModeloId;
  nombre: string;
  /** Probabilidad de la clase 1 (enfermedad), entre 0 y 1. */
  probabilidad: number;
  prediccion: 0 | 1;
}
