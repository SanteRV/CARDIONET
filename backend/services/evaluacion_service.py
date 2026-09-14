"""Servicio de evaluación de riesgo cardíaco."""
from datetime import datetime

from database.config import SessionLocal
from repositories.paciente_repo import obtener_o_crear_paciente, guardar_evaluacion
from services.perfil_riesgo import determinar_perfil_cardiopata
from ml.model_loader import predecir_riesgo, modelo_disponible, obtener_feature_importances


def ejecutar_evaluacion(data: dict) -> dict:
    """
    Ejecuta la evaluación completa: validación, predicción ML, guardado en BD.
    Retorna el resultado en formato para la API.
    """
    if not modelo_disponible():
        raise RuntimeError('Modelo no cargado')

    paciente_data = {
        'apellidos_nombre': data.get('apellidos_nombre'),
        'historia_clinica': data.get('historia_clinica'),
        'dni': data.get('dni'),
        'fecha_nacimiento': datetime.strptime(data.get('fecha_nacimiento'), '%Y-%m-%d').date(),
        'telefono': data.get('telefono'),
        'direccion': data.get('direccion'),
        'provincia': data.get('provincia', 'No especificado'),
        'ciudad': data.get('ciudad', 'No especificado'),
        'distrito': data.get('distrito', 'No especificado')
    }

    parametros = [
        int(data.get('edad')),
        int(data.get('sexo')),
        int(data.get('dolor_pecho')),
        int(data.get('presion_arterial')),
        float(data.get('colesterol')),
        int(data.get('glucosa')),
        int(data.get('resultado_ecg')),
        int(data.get('frecuencia_cardiaca_max')),
        int(data.get('angina')),
        float(data.get('depresion_st')),
        int(data.get('pendiente_st')),
        int(data.get('numero_vasos')),
        int(data.get('thalassemia'))
    ]

    prediccion, probabilidad = predecir_riesgo(parametros)
    perfil_riesgo = determinar_perfil_cardiopata(parametros)

    db = SessionLocal()
    try:
        paciente_id = obtener_o_crear_paciente(db, paciente_data)
        guardar_evaluacion(db, paciente_id, parametros, prediccion)
    finally:
        db.close()

    feature_importances = obtener_feature_importances(limite=8)

    return {
        'tiene_riesgo': prediccion,
        'probabilidad_riesgo': probabilidad,
        'mensaje': 'Existe riesgo de cardiopatía.' if prediccion == 1 else 'No se detecta riesgo cardiaco.',
        'paciente_id': paciente_id,
        'perfil_riesgo': perfil_riesgo,
        'feature_importances': feature_importances,
        'parametros': parametros,
        'parametros_evaluados': {
            'dolor_pecho': parametros[2],
            'presion_arterial': parametros[3],
            'colesterol': parametros[4],
            'frecuencia_cardiaca': parametros[7],
            'depresion_st': parametros[9],
            'numero_vasos': parametros[11]
        }
    }
