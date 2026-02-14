"""Utilidades de seguridad y configuración."""
import os

ESPECIALIDADES_VALIDAS = frozenset([
    'Intervencionismo Coronario', 'Arritmias', 'Cardiología Isquémica',
    'Hipertensión Arterial', 'Cardiología Preventiva', 'Insuficiencia Cardíaca',
    'Cardiología General'
])


def es_produccion() -> bool:
    """Indica si la aplicación está en modo producción."""
    return os.getenv('FLASK_ENV', 'development') == 'production'


def mensaje_error_seguro(exception: Exception) -> str:
    """No expone detalles internos en producción."""
    return str(exception) if not es_produccion() else 'Error al procesar la solicitud. Intente nuevamente.'


def sanitizar_especialidad(especialidad: str) -> str:
    """Valida que la especialidad esté en la lista blanca."""
    if not especialidad or not isinstance(especialidad, str):
        return 'Cardiología General'
    esp = especialidad.strip()
    return esp if esp in ESPECIALIDADES_VALIDAS else 'Cardiología General'
