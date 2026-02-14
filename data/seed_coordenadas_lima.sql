-- Seed de coordenadas para médicos según distrito/provincia
-- Ejecutar después de init-docker.sql (post-migración v2)
-- Actualiza solo médicos sin latitud/longitud
-- Para BD existente: docker exec -i cardionet_postgres psql -U postgres -d cardionet_db < data/seed_coordenadas_lima.sql

-- Lima metropolitana
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

-- Arequipa
UPDATE medicos SET latitud = -16.398, longitud = -71.536 WHERE distrito = 'AREQUIPA' AND provincia = 'AREQUIPA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -16.623, longitud = -72.711 WHERE distrito = 'CAMANÁ' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -16.407, longitud = -71.529 WHERE distrito = 'CERRO COLORADO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -15.211, longitud = -72.890 WHERE distrito = 'COTAHUASI' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -16.442, longitud = -72.100 WHERE distrito = 'APLAO' AND provincia = 'CASTILLA' AND (latitud IS NULL OR longitud IS NULL);

-- Trujillo / La Libertad
UPDATE medicos SET latitud = -8.134, longitud = -78.753 WHERE distrito = 'JULCAN' AND provincia = 'JULCAN' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -7.901, longitud = -78.585 WHERE distrito = 'OTUZCO' AND provincia = 'OTUZCO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -8.272, longitud = -77.298 WHERE distrito = 'TAYABAMBA' AND provincia = 'PATAZ' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -7.401, longitud = -79.573 WHERE distrito = 'PACASMAYO' AND provincia = 'PACASMAYO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -7.751, longitud = -79.230 WHERE distrito = 'ASCOPE' AND provincia = 'ASCOPE' AND (latitud IS NULL OR longitud IS NULL);

-- Huancayo / Junín
UPDATE medicos SET latitud = -11.159, longitud = -75.993 WHERE distrito = 'JUNIN' AND provincia = 'JUNIN' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -12.070, longitud = -75.207 WHERE distrito = 'EL TAMBO' AND provincia = 'HUANCAYO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.776, longitud = -75.497 WHERE distrito = 'JAUJA' AND provincia = 'JAUJA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.254, longitud = -74.639 WHERE distrito = 'SATIPO' AND provincia = 'SATIPO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.688, longitud = -75.412 WHERE distrito = 'YAULI' AND provincia = 'JAUJA' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.050, longitud = -75.321 WHERE distrito = 'LA MERCED' AND provincia = 'CHANCHAMAYO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -11.734, longitud = -75.504 WHERE distrito = 'HUERTAS' AND provincia = 'JAUJA' AND (latitud IS NULL OR longitud IS NULL);

-- Huánuco
UPDATE medicos SET latitud = -9.950, longitud = -76.243 WHERE distrito = 'PILLCO MARCA' AND provincia = 'HUANUCO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -9.931, longitud = -76.233 WHERE distrito = 'AMARILIS' AND provincia = 'HUANUCO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -9.289, longitud = -75.995 WHERE distrito = 'TINGO MARÍA' AND provincia = 'LEONCIO PRADO' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -9.553, longitud = -76.816 WHERE distrito = 'LLATA' AND provincia = 'HUAMALÍES' AND (latitud IS NULL OR longitud IS NULL);
UPDATE medicos SET latitud = -10.153, longitud = -76.479 WHERE distrito = 'HUANUCOPAMPA' AND provincia = 'LAURICOCHA' AND (latitud IS NULL OR longitud IS NULL);
