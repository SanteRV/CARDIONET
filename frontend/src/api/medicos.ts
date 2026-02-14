import { apiFetch } from './client';

export interface Medico {
  id: number;
  nombre: string;
  especialidad?: string;
  subespecialidad?: string;
  region?: string;
  provincia?: string;
  distrito?: string;
  calificacion?: number;
  telefono?: string;
  ubicacion_consultorio?: string;
  direccion_completa?: string;
  num_opiniones?: number;
  precio_visita?: string;
  latitud?: number;
  longitud?: number;
}

export interface RecomendadosRes {
  medicos: Medico[];
  perfil_detectado: string;
  especialidades_recomendadas: string[];
}

export interface TodosRes {
  medicos: Medico[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export async function getRecomendados(perfilRiesgo: { especialidades?: string[]; principal?: string }) {
  return apiFetch<RecomendadosRes & { error?: string }>('/medicos/recomendados', {
    method: 'POST',
    body: JSON.stringify({ perfil_riesgo: perfilRiesgo }),
  });
}

export async function getTodos(page = 1, perPage = 10) {
  return apiFetch<TodosRes & { error?: string }>(
    `/medicos/todos?page=${page}&per_page=${perPage}`
  );
}

export async function getPerfil() {
  return apiFetch<Medico & { error?: string }>('/medicos/perfil');
}

export async function putPerfil(data: Partial<Medico>) {
  return apiFetch<Medico & { error?: string }>('/medicos/perfil', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
