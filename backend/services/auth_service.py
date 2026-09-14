"""Servicio de autenticación."""
from database.config import SessionLocal
from database.models import Usuario, Paciente, Medico
from werkzeug.security import generate_password_hash, check_password_hash
from utils.jwt_utils import crear_token


def registrar_paciente(email: str, password: str, datos_paciente: dict) -> dict:
    """Registra un nuevo paciente con usuario."""
    db = SessionLocal()
    try:
        if db.query(Usuario).filter(Usuario.email == email).first():
            raise ValueError('El email ya está registrado')

        paciente = Paciente(
            apellidos_nombre=datos_paciente['apellidos_nombre'],
            historia_clinica=datos_paciente['historia_clinica'],
            dni=datos_paciente['dni'],
            fecha_nacimiento=datos_paciente['fecha_nacimiento'],
            telefono=datos_paciente.get('telefono'),
            direccion=datos_paciente.get('direccion', ''),
            provincia=datos_paciente.get('provincia', 'No especificado'),
            ciudad=datos_paciente.get('ciudad', 'No especificado'),
            distrito=datos_paciente.get('distrito', 'No especificado')
        )
        db.add(paciente)
        db.commit()
        db.refresh(paciente)

        usuario = Usuario(
            email=email,
            password_hash=generate_password_hash(password, method='pbkdf2:sha256'),
            rol='paciente',
            paciente_id=paciente.id,
            medico_id=None,
            activo=True
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        token = crear_token(usuario.id, usuario.email, usuario.rol, paciente_id=paciente.id, medico_id=None)
        return {
            'token': token,
            'usuario': {'id': usuario.id, 'email': usuario.email, 'rol': usuario.rol, 'paciente_id': paciente.id, 'medico_id': None},
            'paciente_id': paciente.id
        }
    finally:
        db.close()


def registrar_medico(email: str, password: str, medico_id: int) -> dict:
    """Registra un médico vinculado a un medico existente."""
    db = SessionLocal()
    try:
        if db.query(Usuario).filter(Usuario.email == email).first():
            raise ValueError('El email ya está registrado')

        medico = db.query(Medico).filter(Medico.id == medico_id).first()
        if not medico:
            raise ValueError('Médico no encontrado')

        if db.query(Usuario).filter(Usuario.medico_id == medico_id).first():
            raise ValueError('Este médico ya tiene una cuenta registrada')

        usuario = Usuario(
            email=email,
            password_hash=generate_password_hash(password, method='pbkdf2:sha256'),
            rol='medico',
            paciente_id=None,
            medico_id=medico_id,
            activo=True
        )
        db.add(usuario)
        if medico.email is None:
            medico.email = email
        db.commit()
        db.refresh(usuario)

        token = crear_token(usuario.id, usuario.email, usuario.rol, paciente_id=None, medico_id=medico_id)
        return {
            'token': token,
            'usuario': {'id': usuario.id, 'email': usuario.email, 'rol': usuario.rol, 'paciente_id': None, 'medico_id': medico_id},
            'medico_id': medico_id
        }
    finally:
        db.close()


def login(email: str, password: str) -> dict:
    """Autentica usuario y retorna token."""
    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter(Usuario.email == email, Usuario.activo == True).first()
        if not usuario or not check_password_hash(usuario.password_hash, password):
            raise ValueError('Email o contraseña incorrectos')

        token = crear_token(
            usuario.id, usuario.email, usuario.rol,
            paciente_id=usuario.paciente_id, medico_id=usuario.medico_id
        )
        return {
            'token': token,
            'usuario': {
                'id': usuario.id,
                'email': usuario.email,
                'rol': usuario.rol,
                'paciente_id': usuario.paciente_id,
                'medico_id': usuario.medico_id
            }
        }
    finally:
        db.close()
