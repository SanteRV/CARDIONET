from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey
from database.config import Base

class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    apellidos_nombre = Column(String(200), nullable=False)
    historia_clinica = Column(String(50), unique=True, nullable=False)
    dni = Column(String(20), unique=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    telefono = Column(String(20))
    direccion = Column(String(300))
    provincia = Column(String(100))
    ciudad = Column(String(100))
    distrito = Column(String(100))

class Evaluacion(Base):
    __tablename__ = "evaluaciones"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, nullable=True)  # Nullable: evaluaciones anónimas para entrenamiento
    edad = Column(Integer)
    sexo = Column(Integer)
    dolor_pecho = Column(Integer)
    presion_arterial = Column(Integer)
    colesterol = Column(Float)
    glucosa = Column(Integer)
    resultado_ecg = Column(Integer)
    frecuencia_cardiaca_max = Column(Integer)
    angina = Column(Integer)
    depresion_st = Column(Float)
    pendiente_st = Column(Integer)
    numero_vasos = Column(Integer)
    thalassemia = Column(Integer)
    resultado_prediccion = Column(Integer)
    modelo_usado = Column(String(50))

class Medico(Base):
    __tablename__ = "medicos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    especialidad = Column(String(100))
    subespecialidad = Column(String(200))
    region = Column(String(100))
    provincia = Column(String(100))
    distrito = Column(String(100))
    calificacion = Column(Float)
    telefono = Column(String(20))
    ubicacion_consultorio = Column(String(300))
    num_opiniones = Column(Integer, default=0)
    precio_visita = Column(String(50))
    direccion_completa = Column(String(400))
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    email = Column(String(120))


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)  # 'paciente' | 'medico'
    paciente_id = Column(Integer, ForeignKey('pacientes.id'), nullable=True)
    medico_id = Column(Integer, ForeignKey('medicos.id'), nullable=True)
    activo = Column(Boolean, default=True)
