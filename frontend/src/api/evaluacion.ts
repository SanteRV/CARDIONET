import { apiFetch } from './client';

export interface EvaluacionInput {
  apellidos_nombre: string;
  historia_clinica: string;
  dni: string;
  fecha_nacimiento: string;
  telefono: string;
  direccion: string;
  edad: string;
  sexo: string;
  dolor_pecho: string;
  presion_arterial: string;
  colesterol: string;
  glucosa: string;
  resultado_ecg: string;
  frecuencia_cardiaca_max: string;
  angina: string;
  depresion_st: string;
  pendiente_st: string;
  numero_vasos: string;
  thalassemia: string;
}

export interface FeatureImportance {
  nombre: string;
  importancia: number;
}

export interface EvaluacionResultado {
  tiene_riesgo: number;
  probabilidad_riesgo: number;
  mensaje: string;
  paciente_id: number;
  perfil_riesgo: {
    especialidades: string[];
    principal: string;
    scores: Record<string, number>;
  };
  feature_importances?: FeatureImportance[];
  parametros?: number[];
  parametros_evaluados: Record<string, number>;
}

export interface ModeloComparativo {
  prediccion: number;
  probabilidad: number;
}

export interface EvaluacionComparativo {
  random_forest: ModeloComparativo | null;
  decision_tree: ModeloComparativo | null;
  svm: ModeloComparativo | null;
  metricas_modelos: Record<string, { accuracy: number; precision: number; recall: number; f1: number }>;
}

export async function evaluar(data: EvaluacionInput) {
  return apiFetch<EvaluacionResultado & { error?: string }>('/evaluacion', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function obtenerComparativo(parametros: number[]) {
  return apiFetch<EvaluacionComparativo & { error?: string }>('/evaluacion/comparativo', {
    method: 'POST',
    body: JSON.stringify({ parametros }),
  });
}
