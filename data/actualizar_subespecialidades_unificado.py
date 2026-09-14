#!/usr/bin/env python3
"""
Script unificado para actualizar subespecialidades de médicos.
Uso: python data/actualizar_subespecialidades_unificado.py
O en Docker: docker-compose exec backend python /app/../data/actualizar_subespecialidades_unificado.py
"""
import sys
import os

# Configurar path y cargar variables de entorno
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(project_root, 'backend'))
os.chdir(project_root)

from dotenv import load_dotenv
load_dotenv(os.path.join(project_root, '.env'))

from sqlalchemy import text
from database.config import SessionLocal
from database.models import Medico


def actualizar_subespecialidades():
    """Agrega/actualiza la columna subespecialidad y asigna valores por defecto."""
    db = SessionLocal()
    try:
        # Agregar columna si no existe
        try:
            db.execute(text("ALTER TABLE medicos ADD COLUMN IF NOT EXISTS subespecialidad VARCHAR(200)"))
            db.commit()
            print("✓ Columna 'subespecialidad' verificada")
        except Exception as e:
            db.rollback()
            if "already exists" not in str(e).lower():
                print(f"Nota: {e}")

        # Actualizar médicos sin subespecialidad con distribución por ID
        medicos = db.query(Medico).filter(Medico.subespecialidad.is_(None)).all()
        subespecialidades_default = [
            'Cardiología Isquémica, Intervencionismo Coronario',
            'Arritmias, Electrofisiología',
            'Hipertensión Arterial, Cardiología Preventiva',
            'Insuficiencia Cardíaca, Cardiomiopatías',
            'Cardiología Preventiva, Rehabilitación',
            'Cardiología General, Ecocardiografía'
        ]

        for i, medico in enumerate(medicos):
            medico.subespecialidad = subespecialidades_default[i % len(subespecialidades_default)]

        db.commit()
        print(f"✓ {len(medicos)} médicos actualizados con subespecialidades")
    except Exception as e:
        db.rollback()
        print(f"✗ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == '__main__':
    print("CARDIONET - Actualización de subespecialidades")
    print("-" * 50)
    actualizar_subespecialidades()
    print("Completado.")
