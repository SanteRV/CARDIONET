import { apiFetch } from './client';

export interface Usuario {
  id: number;
  email: string;
  rol: 'paciente' | 'medico';
  paciente_id?: number;
  medico_id?: number;
}

export interface LoginRes {
  token: string;
  usuario: Usuario;
}

export interface MeRes {
  usuario: Usuario;
}

export async function login(email: string, password: string) {
  return apiFetch<LoginRes & { error?: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registroPaciente(data: {
  email: string;
  password: string;
  apellidos_nombre: string;
  historia_clinica: string;
  dni: string;
  fecha_nacimiento: string;
  telefono?: string;
  direccion?: string;
  provincia?: string;
  ciudad?: string;
  distrito?: string;
}) {
  return apiFetch<{ usuario: Usuario; token: string } & { error?: string }>(
    '/auth/registro/paciente',
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function registroMedico(data: {
  email: string;
  password: string;
  medico_id: number;
}) {
  return apiFetch<{ usuario: Usuario; token: string } & { error?: string }>(
    '/auth/registro/medico',
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function me() {
  return apiFetch<MeRes>('/auth/me');
}
