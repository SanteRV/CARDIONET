"""Repositorio de acceso a datos de médicos."""
from sqlalchemy.orm import Session
from database.models import Medico


def medico_a_dict(m) -> dict:
    """Convierte un objeto Medico a diccionario."""
    return {
        'id': m.id,
        'nombre': m.nombre,
        'especialidad': m.especialidad,
        'subespecialidad': m.subespecialidad,
        'region': m.region,
        'calificacion': m.calificacion,
        'telefono': m.telefono,
        'ubicacion_consultorio': m.ubicacion_consultorio,
        'provincia': m.provincia,
        'distrito': m.distrito,
        'num_opiniones': getattr(m, 'num_opiniones', None),
        'precio_visita': getattr(m, 'precio_visita', None),
        'direccion_completa': getattr(m, 'direccion_completa', None) or m.ubicacion_consultorio,
        'latitud': getattr(m, 'latitud', None),
        'longitud': getattr(m, 'longitud', None),
        'email': getattr(m, 'email', None),
    }


def medicos_a_dict(medicos: list) -> list:
    """Convierte lista de objetos Medico a listas de diccionarios."""
    return [medico_a_dict(m) for m in medicos]


def obtener_por_id(db: Session, medico_id: int) -> Medico | None:
    """Obtiene un médico por ID."""
    return db.query(Medico).filter(Medico.id == medico_id).first()


def buscar_por_especialidad(db: Session, especialidad: str, limite: int = 5) -> list:
    """Busca médicos por subespecialidad o especialidad CARDIOLOGIA."""
    return db.query(Medico).filter(
        (Medico.subespecialidad.ilike(f'%{especialidad}%')) |
        _es_cardiologo()
    ).order_by(Medico.calificacion.desc()).limit(limite).all()


def buscar_cardiologos_generales(db: Session, limite: int = 5) -> list:
    """Obtiene los mejores cardiólogos generales."""
    return db.query(Medico).filter(_es_cardiologo()).order_by(Medico.calificacion.desc()).limit(limite).all()


def _es_cardiologo():
    """Condición para filtrar cardiólogos (CARDIOLOGIA, CARDIÓLOGO, etc.)."""
    return Medico.especialidad.ilike('%CARDIOLOG%')


def contar_cardiologos(db: Session) -> int:
    """Cuenta el total de cardiólogos."""
    return db.query(Medico).filter(_es_cardiologo()).count()


def obtener_todos_cardiologos(db: Session, limite: int = None, offset: int = 0) -> list:
    """Obtiene cardiólogos ordenados por calificación, con paginación opcional."""
    query = db.query(Medico).filter(_es_cardiologo()).order_by(Medico.calificacion.desc()).offset(offset)
    if limite is not None:
        query = query.limit(limite)
    return query.all()
