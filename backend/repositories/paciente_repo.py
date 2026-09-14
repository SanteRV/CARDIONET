"""Repositorio de acceso a datos de pacientes y evaluaciones."""
from sqlalchemy.orm import Session
from database.models import Paciente, Evaluacion


def obtener_o_crear_paciente(db: Session, paciente_data: dict) -> int:
    """Obtiene el ID de un paciente existente por DNI o crea uno nuevo."""
    paciente_existente = db.query(Paciente).filter(Paciente.dni == paciente_data['dni']).first()
    if paciente_existente:
        return paciente_existente.id
    nuevo_paciente = Paciente(**paciente_data)
    db.add(nuevo_paciente)
    db.commit()
    db.refresh(nuevo_paciente)
    return nuevo_paciente.id


def guardar_evaluacion(db: Session, paciente_id: int | None, parametros: list, prediccion: int) -> None:
    """Guarda una evaluación en la base de datos (paciente_id opcional para datos de entrenamiento)."""
    nueva_evaluacion = Evaluacion(
        paciente_id=paciente_id,
        edad=parametros[0],
        sexo=parametros[1],
        dolor_pecho=parametros[2],
        presion_arterial=parametros[3],
        colesterol=parametros[4],
        glucosa=parametros[5],
        resultado_ecg=parametros[6],
        frecuencia_cardiaca_max=parametros[7],
        angina=parametros[8],
        depresion_st=parametros[9],
        pendiente_st=parametros[10],
        numero_vasos=parametros[11],
        thalassemia=parametros[12],
        resultado_prediccion=int(prediccion),
        modelo_usado='Random Forest'
    )
    db.add(nueva_evaluacion)
    db.commit()
