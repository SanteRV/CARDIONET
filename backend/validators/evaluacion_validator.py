"""Validación de datos para evaluación de riesgo cardíaco."""
from datetime import datetime


def validar_datos_evaluacion(data: dict) -> None:
    """Valida y normaliza datos del formulario de evaluación. Lanza ValueError si hay errores."""
    if not data or not isinstance(data, dict):
        raise ValueError('Datos inválidos')

    campos_requeridos = [
        'apellidos_nombre', 'historia_clinica', 'dni', 'fecha_nacimiento',
        'edad', 'sexo', 'dolor_pecho', 'presion_arterial', 'colesterol',
        'glucosa', 'resultado_ecg', 'frecuencia_cardiaca_max', 'angina',
        'depresion_st', 'pendiente_st', 'numero_vasos', 'thalassemia'
    ]
    for c in campos_requeridos:
        if data.get(c) is None or str(data.get(c)).strip() == '':
            raise ValueError(f'Campo requerido: {c}')

    if len(str(data.get('apellidos_nombre', ''))) > 200:
        raise ValueError('apellidos_nombre muy largo')
    if len(str(data.get('historia_clinica', ''))) > 50:
        raise ValueError('historia_clinica muy larga')
    if len(str(data.get('dni', ''))) > 20:
        raise ValueError('dni muy largo')

    try:
        edad = int(data.get('edad'))
    except (TypeError, ValueError):
        raise ValueError('Edad inválida')
    if edad < 1 or edad > 120:
        raise ValueError('Edad debe estar entre 1 y 120')

    try:
        presion = int(data.get('presion_arterial'))
    except (TypeError, ValueError):
        raise ValueError('Presión arterial inválida')
    if presion < 50 or presion > 250:
        raise ValueError('Presión arterial fuera de rango válido')

    try:
        colesterol = float(data.get('colesterol'))
    except (TypeError, ValueError):
        raise ValueError('Colesterol inválido')
    if colesterol < 0 or colesterol > 600:
        raise ValueError('Colesterol fuera de rango válido')

    try:
        freq = int(data.get('frecuencia_cardiaca_max'))
    except (TypeError, ValueError):
        raise ValueError('Frecuencia cardíaca inválida')
    if freq < 40 or freq > 250:
        raise ValueError('Frecuencia cardíaca fuera de rango válido')

    try:
        depresion_st = float(data.get('depresion_st'))
    except (TypeError, ValueError):
        raise ValueError('Depresión ST inválida')
    if depresion_st < -5 or depresion_st > 10:
        raise ValueError('Depresión ST fuera de rango válido')

    try:
        datetime.strptime(str(data.get('fecha_nacimiento')), '%Y-%m-%d')
    except (TypeError, ValueError):
        raise ValueError('Formato de fecha inválido (use YYYY-MM-DD)')
