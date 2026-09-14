"""Servicio de búsqueda y recomendación de médicos."""
from database.config import SessionLocal
from repositories.medico_repo import (
    buscar_por_especialidad,
    buscar_cardiologos_generales,
    obtener_todos_cardiologos,
    contar_cardiologos,
    obtener_por_id,
    medicos_a_dict,
    medico_a_dict
)
from utils.security import sanitizar_especialidad


def obtener_medicos_recomendados(perfil_riesgo: dict) -> dict:
    """Obtiene médicos recomendados según el perfil de riesgo del paciente."""
    perfil = perfil_riesgo or {}
    especialidades_raw = perfil.get('especialidades', ['Cardiología General'])
    especialidades_requeridas = [sanitizar_especialidad(e) for e in especialidades_raw[:2]]

    db = SessionLocal()
    try:
        medicos_recomendados = []
        for especialidad in especialidades_requeridas[:2]:
            medicos = buscar_por_especialidad(db, especialidad, limite=5)
            for m in medicos:
                if m not in medicos_recomendados:
                    medicos_recomendados.append(m)

        if len(medicos_recomendados) < 3:
            medicos_generales = buscar_cardiologos_generales(db, limite=5)
            for m in medicos_generales:
                if m not in medicos_recomendados and len(medicos_recomendados) < 5:
                    medicos_recomendados.append(m)

        medicos_recomendados.sort(key=lambda x: x.calificacion or 0, reverse=True)
        resultado = medicos_a_dict(medicos_recomendados[:5])

        return {
            'medicos': resultado,
            'perfil_detectado': perfil.get('principal', 'Cardiología General'),
            'especialidades_recomendadas': especialidades_requeridas
        }
    finally:
        db.close()


def obtener_todos_medicos(page: int = 1, per_page: int = 10) -> dict:
    """Obtiene cardiólogos disponibles con paginación."""
    db = SessionLocal()
    try:
        total = contar_cardiologos(db)
        offset = (page - 1) * per_page
        medicos = obtener_todos_cardiologos(db, limite=per_page, offset=offset)
        total_pages = max(1, (total + per_page - 1) // per_page)
        return {
            'medicos': medicos_a_dict(medicos),
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }
    finally:
        db.close()


def obtener_perfil_medico(medico_id: int) -> dict:
    """Obtiene el perfil de un médico por ID."""
    db = SessionLocal()
    try:
        medico = obtener_por_id(db, medico_id)
        if not medico:
            raise ValueError('Médico no encontrado')
        return medico_a_dict(medico)
    finally:
        db.close()


def actualizar_perfil_medico(medico_id: int, datos: dict) -> dict:
    """Actualiza el perfil del médico (datos del consultorio)."""
    db = SessionLocal()
    try:
        medico = obtener_por_id(db, medico_id)
        if not medico:
            raise ValueError('Médico no encontrado')

        campos_permitidos = ['telefono', 'ubicacion_consultorio', 'provincia', 'distrito', 'direccion_completa', 'precio_visita', 'email']
        for k in campos_permitidos:
            if k in datos and datos[k] is not None:
                setattr(medico, k, datos[k])
        db.commit()
        db.refresh(medico)
        return medico_a_dict(medico)
    finally:
        db.close()
