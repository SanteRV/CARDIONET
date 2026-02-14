"""Servicio para determinar el perfil de riesgo cardíaco y especialidades recomendadas."""


def determinar_perfil_cardiopata(parametros: list) -> dict:
    """
    Determina el perfil de cardiopatía basado en los parámetros del paciente.
    Retorna especialidades recomendadas.

    Parámetros: [edad, sexo, dolor_pecho, presion_arterial, colesterol, glucosa,
                 resultado_ecg, frecuencia_cardiaca_max, angina, depresion_st,
                 pendiente_st, numero_vasos, thalassemia]
    """
    edad, sexo, dolor_pecho, presion, colesterol, glucosa, ecg, freq_max, angina, depresion_st, pendiente_st, vasos, thal = parametros

    especialidades = []
    score = {}

    if vasos > 0:
        especialidades.append('Intervencionismo Coronario')
        score['Intervencionismo Coronario'] = 100

    if ecg != 0 or freq_max > 170 or freq_max < 60:
        especialidades.append('Arritmias')
        score['Arritmias'] = 90

    if dolor_pecho == 3 or angina == 1 or depresion_st > 1.5:
        especialidades.append('Cardiología Isquémica')
        score['Cardiología Isquémica'] = 95

    if presion > 140:
        especialidades.append('Hipertensión Arterial')
        score['Hipertensión Arterial'] = 85

    if colesterol > 240 or glucosa == 1:
        especialidades.append('Cardiología Preventiva')
        score['Cardiología Preventiva'] = 80

    if ecg == 2:
        especialidades.append('Insuficiencia Cardíaca')
        score['Insuficiencia Cardíaca'] = 88

    if not especialidades:
        especialidades.append('Cardiología General')
        score['Cardiología General'] = 70

    especialidades_ordenadas = sorted(especialidades, key=lambda x: score.get(x, 0), reverse=True)

    return {
        'especialidades': especialidades_ordenadas,
        'principal': especialidades_ordenadas[0] if especialidades_ordenadas else 'Cardiología General',
        'scores': score
    }
