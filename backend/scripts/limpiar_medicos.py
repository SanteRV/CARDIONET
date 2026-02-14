#!/usr/bin/env python3
"""
Elimina médicos con poca información útil:
- Sin coordenadas (latitud/longitud)
- Sin dirección (direccion_completa y ubicacion_consultorio vacíos)

Primero desvincula usuarios.medico_id de los médicos que se borrarán.

Uso:
  python scripts/limpiar_medicos.py
  python scripts/limpiar_medicos.py --dry-run   # Solo mostrar cuántos se borrarían
Docker: docker-compose exec backend python scripts/limpiar_medicos.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import bindparam, text
from database.config import SessionLocal, engine
from database.models import Medico

# Funciona con SQLite func en PostgreSQL: TRIM y COALESCE
def _direccion_vacia(m):
    dc = (m.direccion_completa or "").strip()
    uc = (m.ubicacion_consultorio or "").strip()
    return not dc and not uc

def _sin_coordenadas(m):
    return m.latitud is None or m.longitud is None


def main():
    dry_run = "--dry-run" in sys.argv
    db = SessionLocal()
    try:
        total = db.query(Medico).count()
        # Médicos a borrar: sin coords Y sin dirección
        candidatos = [
            m for m in db.query(Medico).all()
            if _sin_coordenadas(m) and _direccion_vacia(m)
        ]
        n = len(candidatos)
        ids = [m.id for m in candidatos]

        if dry_run:
            print(f"[DRY-RUN] Total médicos: {total}")
            print(f"[DRY-RUN] Se borrarían {n} médicos sin coordenadas ni dirección")
            if n and n <= 20:
                for m in candidatos[:20]:
                    print(f"  - {m.id}: {m.nombre} ({m.especialidad or 'N/A'})")
            return

        if not ids:
            print("No hay médicos que borrar (todos tienen coords o dirección).")
            return

        # Desvincular usuarios
        stmt = text("UPDATE usuarios SET medico_id = NULL WHERE medico_id IN :ids").bindparams(
            bindparam("ids", expanding=True)
        )
        result = db.execute(stmt, {"ids": ids})
        usuarios_actualizados = result.rowcount
        if usuarios_actualizados:
            print(f"Desvinculados {usuarios_actualizados} usuario(s) de médico.")

        # Borrar
        deleted = db.query(Medico).filter(Medico.id.in_(ids)).delete(synchronize_session=False)
        db.commit()
        restantes = total - deleted
        print(f"Eliminados {deleted} médicos con poca información.")
        print(f"Quedan {restantes} médicos en la base de datos.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
