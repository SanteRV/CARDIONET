import psycopg2
import sys
import io

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Conexión a PostgreSQL
conn = psycopg2.connect(
    host="localhost",
    database="cardionet_db",
    user="postgres",
    password="santerv"
)

cur = conn.cursor()

try:
    # Agregar columna si no existe
    try:
        cur.execute("ALTER TABLE medicos ADD COLUMN subespecialidad VARCHAR(200)")
        conn.commit()
        print("✓ Columna 'subespecialidad' agregada")
    except:
        conn.rollback()
        print("✓ Columna 'subespecialidad' ya existe")

    # Actualizar sub-especialidades
    actualizaciones = [
        ("Dra. Hameda Rahimi", "Cardiología Isquémica, Intervencionismo Coronario"),
        ("Dr. Carlos Mendoza", "Arritmias, Electrofisiología"),
        ("Dra. María García", "Hipertensión Arterial, Cardiología Preventiva"),
        ("Dr. Luis Rodríguez", "Insuficiencia Cardíaca, Cardiología General"),
        ("Dra. Ana Torres", "Cardiología Isquémica, Ecocardiografía"),
        ("Dr. Jorge Fernández", "Intervencionismo Coronario, Hemodinamia"),
        ("Dra. Patricia Morales", "Cardiología Preventiva, Rehabilitación"),
        ("Dr. Roberto Castillo", "Arritmias, Marcapasos"),
        ("Dra. Carmen Silva", "Hipertensión Arterial, Diabetes Cardiovascular"),
        ("Dr. Francisco Vargas", "Insuficiencia Cardíaca, Trasplante Cardíaco"),
        ("Dra. Isabel Ramírez", "Cardiología Isquémica, Prevención"),
        ("Dr. Miguel Herrera", "Cardiología General, Hipertensión Arterial"),
        ("Dra. Rosa Gutiérrez", "Arritmias, Cardiología Clínica"),
        ("Dr. Juan Flores", "Intervencionismo Coronario, Cardiología Isquémica"),
        ("Dra. Lucía Medina", "Cardiología Preventiva, Hipertensión"),
        ("Dr. Pedro Sánchez", "Insuficiencia Cardíaca, Cardiomiopatías"),
        ("Dra. Elena Cruz", "Arritmias, Electrofisiología"),
        ("Dr. Antonio Ruiz", "Cardiología General, Ecocardiografía"),
        ("Dra. Sofía León", "Cardiología Isquémica, Prevención"),
        ("Dr. Raúl Paredes", "Hipertensión Arterial, Diabetes"),
        ("Dra. Mónica Vega", "Insuficiencia Cardíaca, Cardiología Clínica"),
        ("Dr. Daniel Torres", "Intervencionismo Coronario, Hemodinamia"),
        ("Dra. Claudia Rojas", "Arritmias, Marcapasos"),
        ("Dr. Ricardo Campos", "Cardiología General, Hipertensión"),
        ("Dra. Teresa Núñez", "Cardiología Preventiva, Rehabilitación"),
        ("Dr. Alberto Díaz", "Cardiología Isquémica, Ecocardiografía"),
        ("Dra. Beatriz Salazar", "Arritmias, Cardiología Clínica"),
        ("Dr. Héctor Mendoza", "Insuficiencia Cardíaca, Cardiomiopatías"),
        ("Dra. Silvia Chávez", "Hipertensión Arterial, Prevención"),
        ("Dr. Javier Romero", "Cardiología General, Ecocardiografía"),
        ("Dra. Gloria Pineda", "Cardiología Isquémica, Rehabilitación"),
        ("Dr. Arturo Santos", "Insuficiencia Cardíaca, Cardiología Clínica"),
    ]

    contador = 0
    for nombre, subespecialidad in actualizaciones:
        cur.execute(
            "UPDATE medicos SET subespecialidad = %s WHERE nombre = %s",
            (subespecialidad, nombre)
        )
        contador += cur.rowcount

    conn.commit()
    print(f"✓ {contador} médicos actualizados con sub-especialidades")

    # Verificar
    cur.execute("SELECT COUNT(*) FROM medicos WHERE subespecialidad IS NOT NULL")
    total = cur.fetchone()[0]
    print(f"✓ Total médicos con sub-especialidad: {total}")

except Exception as e:
    print(f"✗ Error: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()

print("\n✓ Actualización completada")
