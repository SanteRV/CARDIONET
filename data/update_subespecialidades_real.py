# -*- coding: utf-8 -*-
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()  # la contraseña va en .env, nunca en el código

# Conexión
conn = psycopg2.connect(
    host="localhost",
    database="cardionet_db",
    user="postgres",
    password=os.getenv("DB_PASSWORD")
)

cur = conn.cursor()

try:
    # Agregar columna si no existe
    try:
        cur.execute("ALTER TABLE medicos ADD COLUMN subespecialidad VARCHAR(200)")
        conn.commit()
        print("OK: Columna 'subespecialidad' agregada")
    except:
        conn.rollback()
        print("OK: Columna ya existe")

    # Actualizar todos con sub-especialidades distribuidas
    cur.execute("UPDATE medicos SET subespecialidad = CASE "
                "WHEN id % 6 = 0 THEN 'Cardiología Isquémica, Intervencionismo Coronario' "
                "WHEN id % 6 = 1 THEN 'Arritmias, Electrofisiología' "
                "WHEN id % 6 = 2 THEN 'Hipertensión Arterial, Cardiología Preventiva' "
                "WHEN id % 6 = 3 THEN 'Insuficiencia Cardíaca, Cardiomiopatías' "
                "WHEN id % 6 = 4 THEN 'Cardiología Preventiva, Rehabilitación' "
                "WHEN id % 6 = 5 THEN 'Cardiología General, Ecocardiografía' "
                "END")

    conn.commit()

    # Verificar
    cur.execute("SELECT COUNT(*) FROM medicos WHERE subespecialidad IS NOT NULL")
    total = cur.fetchone()[0]
    print(f"OK: {total} medicos actualizados con sub-especialidades")

    # Mostrar distribución
    cur.execute("""
        SELECT subespecialidad, COUNT(*) as total
        FROM medicos
        GROUP BY subespecialidad
        ORDER BY total DESC
    """)
    print("\nDistribucion de especialidades:")
    for sub, count in cur.fetchall():
        print(f"  - {sub}: {count} medicos")

except Exception as e:
    print(f"ERROR: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()

print("\nActualizacion completada!")
