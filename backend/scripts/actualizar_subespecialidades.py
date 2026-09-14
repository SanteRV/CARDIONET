#!/usr/bin/env python3
"""
Script para actualizar subespecialidades de médicos.
Uso: python scripts/actualizar_subespecialidades.py
Docker: docker-compose exec backend python scripts/actualizar_subespecialidades.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database.config import SessionLocal
from database.models import Medico


def actualizar_subespecialidades():
    """Agrega/actualiza subespecialidad en médicos que no la tienen."""
    db = SessionLocal()
    try:
        try:
            db.execute(text("ALTER TABLE medicos ADD COLUMN IF NOT EXISTS subespecialidad VARCHAR(200)"))
            db.commit()
            print("✓ Columna 'subespecialidad' verificada")
        except Exception as e:
            db.rollback()
            if "already exists" not in str(e).lower():
                print(f"Nota: {e}")

        subespecialidades_default = [
            'Cardiología Isquémica, Intervencionismo Coronario',
            'Arritmias, Electrofisiología',
            'Hipertensión Arterial, Cardiología Preventiva',
            'Insuficiencia Cardíaca, Cardiomiopatías',
            'Cardiología Preventiva, Rehabilitación',
            'Cardiología General, Ecocardiografía'
        ]

        medicos = db.query(Medico).filter(Medico.subespecialidad.is_(None)).all()
        for i, medico in enumerate(medicos):
            medico.subespecialidad = subespecialidades_default[i % len(subespecialidades_default)]

        db.commit()
        print(f"✓ {len(medicos)} médicos actualizados")
    except Exception as e:
        db.rollback()
        print(f"✗ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == '__main__':
    print("CARDIONET - Actualización de subespecialidades")
    actualizar_subespecialidades()
