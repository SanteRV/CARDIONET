import sys
import os

# Agregar el directorio padre al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.config import SessionLocal
from backend.database.models import Base, Medico
from sqlalchemy import text

def actualizar_subespecialidades():
    """
    Agrega sub-especialidades a los médicos existentes
    """
    db = SessionLocal()

    try:
        # Primero, agregar la columna si no existe
        try:
            db.execute(text("ALTER TABLE medicos ADD COLUMN subespecialidad VARCHAR(200)"))
            db.commit()
            print("✓ Columna 'subespecialidad' agregada a la tabla medicos")
        except Exception as e:
            db.rollback()
            print(f"Columna ya existe o error: {e}")

        # Definir sub-especialidades para cada médico según su expertise
        subespecialidades = {
            # Lima - Lince
            'Dra. Hameda Rahimi': 'Cardiología Isquémica, Intervencionismo Coronario',
            'Dr. Carlos Mendoza': 'Arritmias, Electrofisiología',
            'Dra. María García': 'Hipertensión Arterial, Cardiología Preventiva',

            # Lima - San Isidro
            'Dr. Luis Rodríguez': 'Insuficiencia Cardíaca, Cardiología General',
            'Dra. Ana Torres': 'Cardiología Isquémica, Ecocardiografía',
            'Dr. Jorge Fernández': 'Intervencionismo Coronario, Hemodinamia',

            # Lima - Miraflores
            'Dra. Patricia Morales': 'Cardiología Preventiva, Rehabilitación',
            'Dr. Roberto Castillo': 'Arritmias, Marcapasos',
            'Dra. Carmen Silva': 'Hipertensión Arterial, Diabetes Cardiovascular',

            # Lima - Jesús María
            'Dr. Francisco Vargas': 'Insuficiencia Cardíaca, Trasplante Cardíaco',
            'Dra. Isabel Ramírez': 'Cardiología Isquémica, Prevención',

            # Lima - La Victoria
            'Dr. Miguel Herrera': 'Cardiología General, Hipertensión Arterial',
            'Dra. Rosa Gutiérrez': 'Arritmias, Cardiología Clínica',

            # Arequipa
            'Dr. Juan Flores': 'Intervencionismo Coronario, Cardiología Isquémica',
            'Dra. Lucía Medina': 'Cardiología Preventiva, Hipertensión',
            'Dr. Pedro Sánchez': 'Insuficiencia Cardíaca, Cardiomiopatías',
            'Dra. Elena Cruz': 'Arritmias, Electrofisiología',
            'Dr. Antonio Ruiz': 'Cardiología General, Ecocardiografía',

            # Trujillo - La Libertad
            'Dra. Sofía León': 'Cardiología Isquémica, Prevención',
            'Dr. Raúl Paredes': 'Hipertensión Arterial, Diabetes',
            'Dra. Mónica Vega': 'Insuficiencia Cardíaca, Cardiología Clínica',
            'Dr. Daniel Torres': 'Intervencionismo Coronario, Hemodinamia',
            'Dra. Claudia Rojas': 'Arritmias, Marcapasos',

            # Huancayo - Junín
            'Dr. Ricardo Campos': 'Cardiología General, Hipertensión',
            'Dra. Teresa Núñez': 'Cardiología Preventiva, Rehabilitación',
            'Dr. Alberto Díaz': 'Cardiología Isquémica, Ecocardiografía',
            'Dra. Beatriz Salazar': 'Arritmias, Cardiología Clínica',
            'Dr. Héctor Mendoza': 'Insuficiencia Cardíaca, Cardiomiopatías',

            # Huánuco
            'Dra. Silvia Chávez': 'Hipertensión Arterial, Prevención',
            'Dr. Javier Romero': 'Cardiología General, Ecocardiografía',
            'Dra. Gloria Pineda': 'Cardiología Isquémica, Rehabilitación',
            'Dr. Arturo Santos': 'Insuficiencia Cardíaca, Cardiología Clínica',
        }

        # Actualizar cada médico
        medicos_actualizados = 0
        medicos = db.query(Medico).all()

        for medico in medicos:
            if medico.nombre in subespecialidades:
                medico.subespecialidad = subespecialidades[medico.nombre]
                medicos_actualizados += 1
                print(f"✓ {medico.nombre} -> {subespecialidades[medico.nombre]}")

        db.commit()
        print(f"\n✓ {medicos_actualizados} médicos actualizados con sub-especialidades")
        print("✓ Base de datos actualizada exitosamente")

    except Exception as e:
        db.rollback()
        print(f"✗ Error al actualizar base de datos: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    print("=" * 60)
    print("ACTUALIZACIÓN DE SUB-ESPECIALIDADES - CARDIONET")
    print("=" * 60)
    actualizar_subespecialidades()
