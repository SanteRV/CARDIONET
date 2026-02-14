#!/usr/bin/env python3
"""
Exporta las evaluaciones guardadas en la BD a un CSV compatible con el dataset
de heart disease (age,sex,cp,trestbps,chol,fbs,restecg,thalach,exang,oldpeak,slope,ca,thal,target).

Sirve para reentrenar modelos con datos reales de la aplicación.
Más respuestas = mejor entrenamiento futuro.

Uso:
  python scripts/exportar_evaluaciones_csv.py
  python scripts/exportar_evaluaciones_csv.py --output data/evaluaciones_export.csv
  python scripts/exportar_evaluaciones_csv.py --combinar  # Une con heart_disease_sample.csv
Docker: docker-compose exec backend python scripts/exportar_evaluaciones_csv.py
"""
import os
import sys
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.config import SessionLocal
from database.models import Evaluacion

# Mapeo columnas evaluaciones -> formato heart_disease
COLUMNAS = [
    ('edad', 'age'),
    ('sexo', 'sex'),
    ('dolor_pecho', 'cp'),
    ('presion_arterial', 'trestbps'),
    ('colesterol', 'chol'),
    ('glucosa', 'fbs'),
    ('resultado_ecg', 'restecg'),
    ('frecuencia_cardiaca_max', 'thalach'),
    ('angina', 'exang'),
    ('depresion_st', 'oldpeak'),
    ('pendiente_st', 'slope'),
    ('numero_vasos', 'ca'),
    ('thalassemia', 'thal'),
]
TARGET_COL = 'resultado_prediccion'
TARGET_CSV = 'target'


def evaluacion_a_fila(e: Evaluacion) -> list | None:
    """Convierte una Evaluacion a lista de valores. Retorna None si hay valores nulos (se omiten)."""
    vals = []
    for col_db, _ in COLUMNAS:
        v = getattr(e, col_db, None)
        if v is None:
            return None
        vals.append(v)
    target = getattr(e, TARGET_COL, None)
    if target is None:
        return None
    vals.append(int(target))
    return vals


def main():
    parser = argparse.ArgumentParser(description='Exportar evaluaciones a CSV para entrenamiento')
    parser.add_argument('--output', '-o', default=None, help='Archivo CSV de salida')
    parser.add_argument('--combinar', action='store_true', help='Combinar con heart_disease_sample.csv')
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(script_dir, '..', 'data')
    default_output = os.path.join(data_dir, 'evaluaciones_export.csv')
    output_path = args.output or default_output

    db = SessionLocal()
    try:
        evaluaciones = db.query(Evaluacion).order_by(Evaluacion.id).all()
        n = len(evaluaciones)

        if n == 0:
            print('[INFO] No hay evaluaciones guardadas. Las evaluaciones se guardan al usar la app.')
            return

        header_csv = [c[1] for c in COLUMNAS] + [TARGET_CSV]
        filas = [f for e in evaluaciones if (f := evaluacion_a_fila(e)) is not None]
        omitidas = n - len(filas)
        if omitidas:
            print(f'[INFO] Omitidas {omitidas} evaluaciones con valores nulos')
        if not filas:
            print('[INFO] No hay evaluaciones completas para exportar')
            return

        # Escribir CSV
        os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(','.join(header_csv) + '\n')
            for fila in filas:
                f.write(','.join(str(v) for v in fila) + '\n')

        print(f'[OK] Exportadas {n} evaluaciones a {output_path}')

        if args.combinar:
            sample_path = os.path.join(data_dir, 'heart_disease_sample.csv')
            if os.path.isfile(sample_path):
                import pandas as pd
                df_sample = pd.read_csv(sample_path)
                df_eval = pd.read_csv(output_path)
                df_combined = pd.concat([df_sample, df_eval], ignore_index=True)
                combined_path = output_path.replace('.csv', '_combinado.csv')
                df_combined.to_csv(combined_path, index=False)
                print(f'[OK] Combinado con heart_disease_sample: {combined_path} ({len(df_combined)} filas)')
            else:
                print(f'[WARN] heart_disease_sample.csv no encontrado en {data_dir}')

    finally:
        db.close()


if __name__ == '__main__':
    main()
