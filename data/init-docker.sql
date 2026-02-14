-- Script de inicialización para Docker (cardionet_db ya existe por POSTGRES_DB)
-- No incluir CREATE DATABASE ni \c - el contenedor ya conecta a cardionet_db

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    apellidos_nombre VARCHAR(200) NOT NULL,
    historia_clinica VARCHAR(50) UNIQUE NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(300),
    provincia VARCHAR(100),
    ciudad VARCHAR(100),
    distrito VARCHAR(100)
);

-- Tabla de evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL,
    edad INTEGER,
    sexo INTEGER,
    dolor_pecho INTEGER,
    presion_arterial INTEGER,
    colesterol FLOAT,
    glucosa INTEGER,
    resultado_ecg INTEGER,
    frecuencia_cardiaca_max INTEGER,
    angina INTEGER,
    depresion_st FLOAT,
    pendiente_st INTEGER,
    numero_vasos INTEGER,
    thalassemia INTEGER,
    resultado_prediccion INTEGER,
    modelo_usado VARCHAR(50),
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- Tabla de médicos cardiólogos
CREATE TABLE IF NOT EXISTS medicos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    especialidad VARCHAR(100),
    subespecialidad VARCHAR(200),
    region VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    calificacion FLOAT,
    telefono VARCHAR(20),
    ubicacion_consultorio VARCHAR(300)
);

-- Insertar datos de médicos cardiólogos
INSERT INTO medicos (nombre, especialidad, subespecialidad, region, provincia, distrito, calificacion, telefono, ubicacion_consultorio) VALUES
('Dra. Hameda Rahimi', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'LIMA', 'LINCE', 5.0, '954784961', 'Av. Arequipa 1860, consultorio 507, Lince'),
('Dr. Luis Paredes', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'CALLAO', 'CALLAO', 3.8, '954784961', 'Av. Sáenz Peña 185, Callao'),
('Dr. Ricardo Villanueva', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'BARRANCA', 'BARRANCA', 4.9, '954784961', 'Jr. Castilla 230, Barranca'),
('Dr. Ernesto Mogollón', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'CAJATAMBO', 'CAJATAMBO', 4.1, '954784961', 'Jr. Comercio 112, Cajatambo'),
('Dra. Fiorella Huamán', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'CALLAO', 'CARMEN DE LA LEGUA', 3.5, '954784961', 'Av. Japón 760, Carmen de la Legua'),
('Dr. Jorge Salazar', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'YAUYOS', 'YAUYOS', 4.7, '954784961', 'Plaza Principal 101, Yauyos'),
('Dra. Ruth Calderón', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'CAÑETE', 'ASIA', 3.9, '954784961', 'Boulevard de Asia Módulo G-12'),
('Dr. Pablo Gutiérrez', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'LIMA', 'MAGDALENA DEL MAR', 4.6, '954784961', 'Av. Sucre 935, Magdalena del Mar'),
('Dr. Víctor Alcántara', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'LIMA', 'SAN ISIDRO', 4.2, '954784961', 'Av. Rivera Navarrete 490, San Isidro'),
('Dra. Silvia Torres', 'CARDIOLOGIA', 'Cardiología General', 'LIMA', 'CALLAO', 'BELLAVISTA', 3.7, '954784961', 'Av. Guardia Chalaca 1350, Bellavista'),
('Dr. Alex Zapana', 'CARDIOLOGIA', 'Cardiología General', 'AREQUIPA', 'AREQUIPA', 'AREQUIPA', 4.8, '954784961', 'Av. Ejercito 715, Cayma'),
('Dr. Martín Ccorahua', 'CARDIOLOGIA', 'Cardiología General', 'AREQUIPA', 'CAMANÁ', 'CAMANÁ', 2.9, '954784961', 'Av. Arequipa 320, Camaná'),
('Dra. Janeth Quispe', 'CARDIOLOGIA', 'Cardiología General', 'AREQUIPA', 'AREQUIPA', 'CERRO COLORADO', 3.6, '954784961', 'Av. Aviación 210, Cerro Colorado'),
('Dr. Hugo Rivera', 'CARDIOLOGIA', 'Cardiología General', 'AREQUIPA', 'UNIÓN', 'COTAHUASI', 2.4, '954784961', 'Jr. Constitución 89, Cotahuasi'),
('Dr. Daniel Cárdenas', 'CARDIOLOGIA', 'Cardiología General', 'AREQUIPA', 'CASTILLA', 'APLAO', 3.1, '954784961', 'Av. Salaverry 455, Aplao'),
('Dr. Sebastián Luján', 'CARDIOLOGIA', 'Cardiología General', 'TRUJILLO', 'JULCAN', 'JULCAN', 4.0, '954784961', 'Jr. Bolívar 120, Julcán'),
('Dra. Elena Rojas', 'CARDIOLOGIA', 'Cardiología General', 'TRUJILLO', 'OTUZCO', 'OTUZCO', 4.5, '954784961', 'Av. Libertad 333, Otuzco'),
('Dr. Gustavo Pérez', 'CARDIOLOGIA', 'Cardiología General', 'TRUJILLO', 'PATAZ', 'TAYABAMBA', 3.0, '954784961', 'Jr. Lima 210, Tayabamba'),
('Dra. Adriana Silva', 'CARDIOLOGIA', 'Cardiología General', 'TRUJILLO', 'PACASMAYO', 'PACASMAYO', 4.9, '954784961', 'Malecón Grau 145, Pacasmayo'),
('Dr. Roberto Céspedes', 'CARDIOLOGIA', 'Cardiología General', 'TRUJILLO', 'ASCOPE', 'ASCOPE', 3.3, '954784961', 'Jr. San Martín 260, Ascope'),
('Dr. Álvaro Núñez', 'CARDIOLOGIA', 'Cardiología General', 'HUANCAYO', 'JUNIN', 'JUNIN', 4.4, '954784961', 'Av. Ferrocarril 204, Junín'),
('Dra. Melissa Obregón', 'CARDIOLOGIA', 'Cardiología General', 'HUANCAYO', 'HUANCAYO', 'EL TAMBO', 3.2, '954784961', 'Av. Mariscal Castilla 501, El Tambo'),
('Dr. César Yupanqui', 'CARDIOLOGIA', 'Cardiología General', 'HUANCAYO', 'JAUJA', 'JAUJA', 4.3, '954784961', 'Jr. Junín 112, Jauja'),
('Dra. Karina Poma', 'CARDIOLOGIA', 'Cardiología General', 'HUANCAYO', 'SATIPO', 'SATIPO', 2.7, '954784961', 'Av. Circunvalación 540, Satipo'),
('Dr. Renato Gavilán', 'CARDIOLOGIA', 'Cardiología General', 'HUANCAYO', 'JAUJA', 'YAULI', 4.1, '954784961', 'Av. Real 201, Yauli'),
('Dr. Luis Minaya', 'CARDIOLOGIA', 'Cardiología General', 'HUANCAYO', 'CHANCHAMAYO', 'LA MERCED', 3.8, '954784961', 'Av. Perené 410, La Merced'),
('Dra. Beatriz Camargo', 'CARDIOLOGIA', 'Cardiología General', 'HUANCAYO', 'JAUJA', 'HUERTAS', 2.5, '954784961', 'Jr. San José 85, Huertas'),
('Dr. Efraín Santos', 'CARDIOLOGIA', 'Cardiología General', 'HUANUCO', 'HUANUCO', 'PILLCO MARCA', 4.6, '954784961', 'Av. Universitaria 430, Pillco Marca'),
('Dra. Diana Muñoz', 'CARDIOLOGIA', 'Cardiología General', 'HUANUCO', 'HUANUCO', 'AMARILIS', 3.4, '954784961', 'Jr. 28 de Julio 270, Amarilis'),
('Dr. Jhonatan Valdez', 'CARDIOLOGIA', 'Cardiología General', 'HUANUCO', 'LEONCIO PRADO', 'TINGO MARÍA', 4.0, '954784961', 'Av. Raymondi 315, Tingo María'),
('Dra. Carla Inga', 'CARDIOLOGIA', 'Cardiología General', 'HUANUCO', 'HUAMALÍES', 'LLATA', 2.8, '954784961', 'Jr. Comercio 134, Llata'),
('Dr. Jorge Espinoza', 'CARDIOLOGIA', 'Cardiología General', 'HUANUCO', 'LAURICOCHA', 'HUANUCOPAMPA', 3.1, '954784961', 'Plaza Central 100, Huanucopampa');

-- Índices
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes(dni);
CREATE INDEX IF NOT EXISTS idx_pacientes_historia ON pacientes(historia_clinica);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_paciente ON evaluaciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_medicos_region ON medicos(region);
CREATE INDEX IF NOT EXISTS idx_medicos_provincia ON medicos(provincia);
CREATE INDEX IF NOT EXISTS idx_medicos_distrito ON medicos(distrito);
CREATE INDEX IF NOT EXISTS idx_medicos_calificacion ON medicos(calificacion DESC);
CREATE INDEX IF NOT EXISTS idx_medicos_ubicacion ON medicos(region, provincia, distrito);

-- Migración v2: nuevas columnas en medicos y tabla usuarios
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS num_opiniones INTEGER DEFAULT 0;
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS precio_visita VARCHAR(50);
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS direccion_completa VARCHAR(400);
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS latitud FLOAT;
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS longitud FLOAT;
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS email VARCHAR(120);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    paciente_id INTEGER REFERENCES pacientes(id),
    medico_id INTEGER REFERENCES medicos(id),
    activo BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Seed de coordenadas para médicos según distrito/provincia
UPDATE medicos SET latitud = -12.084, longitud = -77.032 WHERE distrito = 'LINCE' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -12.057, longitud = -77.118 WHERE distrito = 'CALLAO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -10.754, longitud = -77.763 WHERE distrito = 'BARRANCA' AND provincia = 'BARRANCA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -10.494, longitud = -76.992 WHERE distrito = 'CAJATAMBO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -12.051, longitud = -77.063 WHERE distrito = 'CARMEN DE LA LEGUA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -12.264, longitud = -75.933 WHERE distrito = 'YAUYOS' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -12.837, longitud = -76.510 WHERE distrito = 'ASIA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -12.095, longitud = -77.071 WHERE distrito = 'MAGDALENA DEL MAR' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -12.089, longitud = -77.050 WHERE distrito = 'SAN ISIDRO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -12.068, longitud = -77.121 WHERE distrito = 'BELLAVISTA' AND provincia = 'CALLAO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -16.398, longitud = -71.536 WHERE distrito = 'AREQUIPA' AND provincia = 'AREQUIPA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -16.623, longitud = -72.711 WHERE distrito = 'CAMANÁ' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -16.407, longitud = -71.529 WHERE distrito = 'CERRO COLORADO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -15.211, longitud = -72.890 WHERE distrito = 'COTAHUASI' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -16.442, longitud = -72.100 WHERE distrito = 'APLAO' AND provincia = 'CASTILLA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -8.134, longitud = -78.753 WHERE distrito = 'JULCAN' AND provincia = 'JULCAN' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -7.901, longitud = -78.585 WHERE distrito = 'OTUZCO' AND provincia = 'OTUZCO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -8.272, longitud = -77.298 WHERE distrito = 'TAYABAMBA' AND provincia = 'PATAZ' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -7.401, longitud = -79.573 WHERE distrito = 'PACASMAYO' AND provincia = 'PACASMAYO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -7.751, longitud = -79.230 WHERE distrito = 'ASCOPE' AND provincia = 'ASCOPE' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.159, longitud = -75.993 WHERE distrito = 'JUNIN' AND provincia = 'JUNIN' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -12.070, longitud = -75.207 WHERE distrito = 'EL TAMBO' AND provincia = 'HUANCAYO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.776, longitud = -75.497 WHERE distrito = 'JAUJA' AND provincia = 'JAUJA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.254, longitud = -74.639 WHERE distrito = 'SATIPO' AND provincia = 'SATIPO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.688, longitud = -75.412 WHERE distrito = 'YAULI' AND provincia = 'JAUJA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.050, longitud = -75.321 WHERE distrito = 'LA MERCED' AND provincia = 'CHANCHAMAYO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.734, longitud = -75.504 WHERE distrito = 'HUERTAS' AND provincia = 'JAUJA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -9.950, longitud = -76.243 WHERE distrito = 'PILLCO MARCA' AND provincia = 'HUANUCO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -9.931, longitud = -76.233 WHERE distrito = 'AMARILIS' AND provincia = 'HUANUCO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -9.289, longitud = -75.995 WHERE distrito = 'TINGO MARÍA' AND provincia = 'LEONCIO PRADO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -9.553, longitud = -76.816 WHERE distrito = 'LLATA' AND provincia = 'HUAMALÍES' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -10.153, longitud = -76.479 WHERE distrito = 'HUANUCOPAMPA' AND provincia = 'LAURICOCHA' AND (latitud IS NULL OR longitud IS NULL);

-- Migración: paciente_id nullable para guardar evaluaciones anónimas (entrenamiento ML)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='evaluaciones' AND column_name='paciente_id' AND is_nullable='NO'
  ) THEN
    ALTER TABLE evaluaciones ALTER COLUMN paciente_id DROP NOT NULL;
  END IF;
END $$;
