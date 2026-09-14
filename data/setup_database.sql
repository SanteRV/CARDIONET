-- Script de configuración de base de datos PostgreSQL para CARDIONET
-- Ejecutar como superusuario de PostgreSQL

-- Crear la base de datos
CREATE DATABASE cardionet_db;

-- Conectar a la base de datos
\c cardionet_db;

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
    region VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    calificacion FLOAT,
    telefono VARCHAR(20),
    ubicacion_consultorio VARCHAR(300)
);

-- Insertar datos reales de médicos cardiólogos
INSERT INTO medicos (nombre, especialidad, region, provincia, distrito, calificacion, telefono, ubicacion_consultorio) VALUES
('Dra. Ejemplo 01', 'CARDIOLOGIA', 'LIMA', 'LIMA', 'LINCE', 5.0, '900000000', 'Av. Arequipa 1860, consultorio 507, Lince'),
('Dr. Ejemplo 02', 'CARDIOLOGIA', 'LIMA', 'CALLAO', 'CALLAO', 3.8, '900000000', 'Av. Sáenz Peña 185, Callao'),
('Dr. Ejemplo 03', 'CARDIOLOGIA', 'LIMA', 'BARRANCA', 'BARRANCA', 4.9, '900000000', 'Jr. Castilla 230, Barranca'),
('Dr. Ejemplo 04', 'CARDIOLOGIA', 'LIMA', 'CAJATAMBO', 'CAJATAMBO', 4.1, '900000000', 'Jr. Comercio 112, Cajatambo'),
('Dra. Ejemplo 05', 'CARDIOLOGIA', 'LIMA', 'CALLAO', 'CARMEN DE LA LEGUA', 3.5, '900000000', 'Av. Japón 760, Carmen de la Legua'),
('Dr. Ejemplo 06', 'CARDIOLOGIA', 'LIMA', 'YAUYOS', 'YAUYOS', 4.7, '900000000', 'Plaza Principal 101, Yauyos'),
('Dra. Ejemplo 07', 'CARDIOLOGIA', 'LIMA', 'CAÑETE', 'ASIA', 3.9, '900000000', 'Boulevard de Asia Módulo G-12'),
('Dr. Ejemplo 08', 'CARDIOLOGIA', 'LIMA', 'LIMA', 'MAGDALENA DEL MAR', 4.6, '900000000', 'Av. Sucre 935, Magdalena del Mar'),
('Dr. Ejemplo 09', 'CARDIOLOGIA', 'LIMA', 'LIMA', 'SAN ISIDRO', 4.2, '900000000', 'Av. Rivera Navarrete 490, San Isidro'),
('Dra. Ejemplo 10', 'CARDIOLOGIA', 'LIMA', 'CALLAO', 'BELLAVISTA', 3.7, '900000000', 'Av. Guardia Chalaca 1350, Bellavista'),
('Dr. Ejemplo 11', 'CARDIOLOGIA', 'AREQUIPA', 'AREQUIPA', 'AREQUIPA', 4.8, '900000000', 'Av. Ejercito 715, Cayma'),
('Dr. Ejemplo 12', 'CARDIOLOGIA', 'AREQUIPA', 'CAMANÁ', 'CAMANÁ', 2.9, '900000000', 'Av. Arequipa 320, Camaná'),
('Dra. Ejemplo 13', 'CARDIOLOGIA', 'AREQUIPA', 'AREQUIPA', 'CERRO COLORADO', 3.6, '900000000', 'Av. Aviación 210, Cerro Colorado'),
('Dr. Ejemplo 14', 'CARDIOLOGIA', 'AREQUIPA', 'UNIÓN', 'COTAHUASI', 2.4, '900000000', 'Jr. Constitución 89, Cotahuasi'),
('Dr. Ejemplo 15', 'CARDIOLOGIA', 'AREQUIPA', 'CASTILLA', 'APLAO', 3.1, '900000000', 'Av. Salaverry 455, Aplao'),
('Dr. Ejemplo 16', 'CARDIOLOGIA', 'TRUJILLO', 'JULCAN', 'JULCAN', 4.0, '900000000', 'Jr. Bolívar 120, Julcán'),
('Dra. Ejemplo 17', 'CARDIOLOGIA', 'TRUJILLO', 'OTUZCO', 'OTUZCO', 4.5, '900000000', 'Av. Libertad 333, Otuzco'),
('Dr. Ejemplo 18', 'CARDIOLOGIA', 'TRUJILLO', 'PATAZ', 'TAYABAMBA', 3.0, '900000000', 'Jr. Lima 210, Tayabamba'),
('Dra. Ejemplo 19', 'CARDIOLOGIA', 'TRUJILLO', 'PACASMAYO', 'PACASMAYO', 4.9, '900000000', 'Malecón Grau 145, Pacasmayo'),
('Dr. Ejemplo 20', 'CARDIOLOGIA', 'TRUJILLO', 'ASCOPE', 'ASCOPE', 3.3, '900000000', 'Jr. San Martín 260, Ascope'),
('Dr. Ejemplo 21', 'CARDIOLOGIA', 'HUANCAYO', 'JUNIN', 'JUNIN', 4.4, '900000000', 'Av. Ferrocarril 204, Junín'),
('Dra. Ejemplo 22', 'CARDIOLOGIA', 'HUANCAYO', 'HUANCAYO', 'EL TAMBO', 3.2, '900000000', 'Av. Mariscal Castilla 501, El Tambo'),
('Dr. Ejemplo 23', 'CARDIOLOGIA', 'HUANCAYO', 'JAUJA', 'JAUJA', 4.3, '900000000', 'Jr. Junín 112, Jauja'),
('Dra. Ejemplo 24', 'CARDIOLOGIA', 'HUANCAYO', 'SATIPO', 'SATIPO', 2.7, '900000000', 'Av. Circunvalación 540, Satipo'),
('Dr. Ejemplo 25', 'CARDIOLOGIA', 'HUANCAYO', 'JAUJA', 'YAULI', 4.1, '900000000', 'Av. Real 201, Yauli'),
('Dr. Ejemplo 26', 'CARDIOLOGIA', 'HUANCAYO', 'CHANCHAMAYO', 'LA MERCED', 3.8, '900000000', 'Av. Perené 410, La Merced'),
('Dra. Ejemplo 27', 'CARDIOLOGIA', 'HUANCAYO', 'JAUJA', 'HUERTAS', 2.5, '900000000', 'Jr. San José 85, Huertas'),
('Dr. Ejemplo 28', 'CARDIOLOGIA', 'HUANUCO', 'HUANUCO', 'PILLCO MARCA', 4.6, '900000000', 'Av. Universitaria 430, Pillco Marca'),
('Dra. Ejemplo 29', 'CARDIOLOGIA', 'HUANUCO', 'HUANUCO', 'AMARILIS', 3.4, '900000000', 'Jr. 28 de Julio 270, Amarilis'),
('Dr. Ejemplo 30', 'CARDIOLOGIA', 'HUANUCO', 'LEONCIO PRADO', 'TINGO MARÍA', 4.0, '900000000', 'Av. Raymondi 315, Tingo María'),
('Dra. Ejemplo 31', 'CARDIOLOGIA', 'HUANUCO', 'HUAMALÍES', 'LLATA', 2.8, '900000000', 'Jr. Comercio 134, Llata'),
('Dr. Ejemplo 32', 'CARDIOLOGIA', 'HUANUCO', 'LAURICOCHA', 'HUANUCOPAMPA', 3.1, '900000000', 'Plaza Central 100, Huanucopampa');

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_pacientes_dni ON pacientes(dni);
CREATE INDEX idx_pacientes_historia ON pacientes(historia_clinica);
CREATE INDEX idx_evaluaciones_paciente ON evaluaciones(paciente_id);
CREATE INDEX idx_medicos_region ON medicos(region);
CREATE INDEX idx_medicos_provincia ON medicos(provincia);
CREATE INDEX idx_medicos_distrito ON medicos(distrito);
CREATE INDEX idx_medicos_calificacion ON medicos(calificacion DESC);
CREATE INDEX idx_medicos_ubicacion ON medicos(region, provincia, distrito);

-- Mensaje de confirmación
SELECT 'Base de datos CARDIONET configurada exitosamente con ' || COUNT(*) || ' médicos cardiólogos' AS mensaje
FROM medicos;
