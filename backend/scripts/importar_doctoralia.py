#!/usr/bin/env python3
"""
Script para importar médicos desde el JSON de Doctoralia.
Geocodifica direcciones con Nominatim (1 req/seg).

Uso:
  python scripts/importar_doctoralia.py [ruta_json]
  Docker: docker-compose exec backend python scripts/importar_doctoralia.py

Por defecto busca: Los 20 Cardiologos más recomendados en Lima - Doctoralia.json
en el directorio Documents del usuario.
"""
import re
import sys
import os
import time
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import or_, text
from database.config import SessionLocal
from database.models import Medico


def asegurar_columnas_medicos(db):
    """Asegura que existan las columnas nuevas en medicos."""
    alter_sql = [
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS num_opiniones INTEGER DEFAULT 0",
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS precio_visita VARCHAR(50)",
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS direccion_completa VARCHAR(400)",
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS latitud FLOAT",
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS longitud FLOAT",
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS email VARCHAR(120)",
    ]
    for sql in alter_sql:
        try:
            db.execute(text(sql))
            db.commit()
        except Exception:
            db.rollback()


def limpiar_texto(s: str) -> str:
    """Quita HTML, espacios extra y normaliza."""
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", "", s)
    s = " ".join(s.split())
    return s.strip()


def extraer_num_opiniones(texto: str) -> int | None:
    """Extrae número de opiniones desde Texto (ej: '302 opinión')."""
    if not texto:
        return None
    m = re.search(r"(\d+)\s*opini[oó]n", texto, re.I)
    return int(m.group(1)) if m else None


def extraer_precio(campo3: str) -> str | None:
    """Extrae precio desde Campo3 (ej: 'Visita Cardiología S/ 200')."""
    if not campo3:
        return None
    m = re.search(r"S/[\s\xa0]*(\d+)", campo3)
    return f"S/ {m.group(1)}" if m else None


# Coordenadas aproximadas por distrito de Lima (para asignar sin geocodificar)
COORDS_LIMA: dict[str, tuple[float, float]] = {
    "jesus maria": (-12.077, -77.051), "jesús maría": (-12.077, -77.051),
    "lince": (-12.084, -77.032), "miraflores": (-12.121, -77.030),
    "san isidro": (-12.089, -77.050), "surquillo": (-12.119, -77.029),
    "san borja": (-12.091, -77.001), "la molina": (-12.071, -76.965),
    "santiago de surco": (-12.152, -76.990), "surco": (-12.152, -76.990),
    "magdalena": (-12.095, -77.071), "magdalena del mar": (-12.095, -77.071),
    "pueblo libre": (-12.072, -77.062), "breña": (-12.056, -77.050),
    "la victoria": (-12.073, -77.029), "jorge chavez": (-12.056, -77.050),
    "cercado de lima": (-12.046, -77.042), "lima": (-12.046, -77.042),
    "callao": (-12.057, -77.118), "bellavista": (-12.068, -77.121),
    "la perla": (-12.066, -77.111), "carmen de la legua": (-12.051, -77.063),
    "san miguel": (-12.078, -77.085), "los olivos": (-12.006, -77.073),
    "comas": (-11.943, -77.061), "independencia": (-12.004, -77.038),
    "san juan de lurigancho": (-11.985, -77.008), "ate": (-12.052, -76.919),
    "santa anita": (-12.046, -76.973), "el agustino": (-12.050, -77.001),
    "la florida": (-12.118, -77.032), "barranco": (-12.145, -77.022),
    "chorrillos": (-12.173, -77.007), "villa el salvador": (-12.206, -76.981),
    "san juan de miraflores": (-12.162, -76.987), "villa maria del triunfo": (-12.163, -76.964),
    "rímac": (-12.044, -77.033), "rimac": (-12.044, -77.033),
    "san luis": (-12.080, -77.001),
}


def coords_desde_direccion(direccion: str) -> tuple[float | None, float | None]:
    """Asigna coords por distrito detectado en la dirección (Lima)."""
    if not direccion:
        return None, None
    d = direccion.lower().strip()
    for nombre, (lat, lng) in COORDS_LIMA.items():
        if nombre in d:
            return lat, lng
    return None, None


def geocodificar(direccion: str, ciudad: str = "Lima, Peru") -> tuple[float | None, float | None]:
    """Geocodifica dirección con Nominatim. Respetando 1 req/seg."""
    try:
        from geopy.geocoders import Nominatim
        from geopy.exc import GeocoderTimedOut, GeocoderServiceError
    except ImportError:
        print("  (geopy no instalado, omitiendo geocodificación)")
        return None, None

    locator = Nominatim(user_agent="cardionet-import-v1")
    query = f"{direccion}, {ciudad}" if direccion else ciudad
    try:
        location = locator.geocode(query, timeout=10)
        if location:
            return location.latitude, location.longitude
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"  Geocoding error: {e}")
    return None, None


def parsear_registro(registro: dict) -> dict | None:
    """Parsea un registro del JSON Doctoralia a datos de Medico."""
    nombre = limpiar_texto(registro.get("Campo1", ""))
    if not nombre:
        return None

    esp = limpiar_texto(registro.get("Campo2", "")) or "Cardiologo"
    norm = unicodedata.normalize("NFD", esp.lower())
    sin_acentos = "".join(c for c in norm if unicodedata.category(c) != "Mn")
    es_cardiologo = "cardiolog" in sin_acentos or "cardio" in sin_acentos
    especialidad = "CARDIOLOGIA" if es_cardiologo else esp.upper()
    num_opiniones = extraer_num_opiniones(registro.get("Texto", ""))
    direccion = limpiar_texto(registro.get("Texto1", ""))
    precio = extraer_precio(registro.get("Campo3", ""))
    distrito = direccion.split(",")[-1].strip().upper() if direccion and "," in direccion else None

    return {
        "nombre": nombre,
        "especialidad": especialidad.upper() if especialidad else "CARDIOLOGIA",
        "subespecialidad": "Cardiología General",
        "num_opiniones": num_opiniones or 0,
        "precio_visita": precio,
        "direccion_completa": direccion or None,
        "ubicacion_consultorio": direccion or None,
        "calificacion": 4.5,
        "region": "LIMA",
        "provincia": "LIMA",
        "distrito": distrito or None,
    }


def importar(ruta_json: str | None = None, geocodificar_dir: bool = True, limite: int | None = None):
    """Importa médicos desde el JSON de Doctoralia."""
    import json

    if not ruta_json:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        project_data = os.path.join(os.path.dirname(backend_dir), "data")
        candidatos = [
            os.path.join(project_data, "doctoralia_limpio.json"),
            os.path.join(project_data, "doctoralia.json"),
            os.path.join(backend_dir, "data_external", "doctoralia_limpio.json"),
            os.path.join(backend_dir, "data_external", "doctoralia.json"),
            os.path.join(os.path.expanduser("~/Documents"), "Los 20 Cardiologos más recomendados en Lima - Doctoralia.json"),
        ]
        for c in candidatos:
            if os.path.exists(c):
                ruta_json = c
                break
        else:
            ruta_json = candidatos[0]

    if not os.path.exists(ruta_json):
        print(f"[X] Archivo no encontrado: {ruta_json}")
        sys.exit(1)

    with open(ruta_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    if limite:
        data = data[:limite]
    print(f"Procesando {len(data)} registros de {ruta_json}")

    db = SessionLocal()
    asegurar_columnas_medicos(db)
    insertados = 0
    actualizados = 0
    omitidos = 0

    try:
        for i, reg in enumerate(data):
            parsed = parsear_registro(reg)
            if not parsed:
                omitidos += 1
                continue

            nombre = parsed["nombre"]
            direccion = parsed.get("direccion_completa") or parsed.get("ubicacion_consultorio") or ""

            if direccion:
                existing = db.query(Medico).filter(
                    Medico.nombre == nombre,
                    or_(Medico.direccion_completa == direccion, Medico.ubicacion_consultorio == direccion),
                ).first()
            else:
                existing = db.query(Medico).filter(
                    Medico.nombre == nombre,
                    Medico.direccion_completa.is_(None),
                    Medico.ubicacion_consultorio.is_(None),
                ).first()

            if existing:
                existing.num_opiniones = parsed.get("num_opiniones") or existing.num_opiniones
                existing.precio_visita = parsed.get("precio_visita") or existing.precio_visita
                existing.direccion_completa = parsed.get("direccion_completa") or existing.direccion_completa
                existing.ubicacion_consultorio = parsed.get("ubicacion_consultorio") or existing.ubicacion_consultorio
                if parsed.get("especialidad"):
                    existing.especialidad = parsed["especialidad"]
                medico = existing
                actualizados += 1
            else:
                medico = Medico(**parsed)
                db.add(medico)
                db.flush()
                insertados += 1

            dir_completa = parsed.get("direccion_completa") or parsed.get("ubicacion_consultorio") or ""
            if not medico.latitud or not medico.longitud:
                lat, lng = coords_desde_direccion(dir_completa)
                if lat is not None and lng is not None:
                    medico.latitud = lat
                    medico.longitud = lng
                elif geocodificar_dir and dir_completa:
                    lat, lng = geocodificar(dir_completa)
                    medico.latitud = lat
                    medico.longitud = lng
                    time.sleep(1)

            if (i + 1) % 10 == 0:
                print(f"  Procesados {i + 1}/{len(data)}")

        db.commit()
        print(f"[OK] Importacion completada: {insertados} insertados, {actualizados} actualizados, {omitidos} omitidos")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Importar médicos desde JSON Doctoralia")
    p.add_argument("ruta_json", nargs="?", help="Ruta al JSON")
    p.add_argument("--limite", "-n", type=int, help="Máximo de registros a procesar")
    p.add_argument("--no-geocode", action="store_true", help="No geocodificar direcciones")
    args = p.parse_args()
    importar(
        ruta_json=args.ruta_json,
        geocodificar_dir=not args.no_geocode,
        limite=args.limite,
    )
