#!/usr/bin/env python3
"""
Geocodifica médicos que no tienen latitud/longitud usando el texto de ubicación.
1. Primero intenta lookup por distrito (rápido, sin API).
2. Si falla, usa Nominatim/OpenStreetMap (1 req/seg, gratis).

Requisito: el médico debe tener direccion_completa o ubicacion_consultorio.
Nota: Muchos registros de Doctoralia no incluyen dirección en el JSON.

Uso:
  python scripts/geocodificar_medicos.py           # Todos los que tienen dirección
  python scripts/geocodificar_medicos.py -n 50     # Máximo 50 (Nominatim es lento)
  python scripts/geocodificar_medicos.py --solo-lookup   # Solo lookup, sin Nominatim
  Docker: docker-compose exec backend python scripts/geocodificar_medicos.py
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.config import SessionLocal
from database.models import Medico

# Mismo lookup que importar_doctoralia
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
    "limatambo": (-12.090, -77.042), "monterrico": (-12.086, -76.976),
    "san luis": (-12.080, -77.001), "el polo": (-12.090, -76.975),
    "barrios altos": (-12.045, -77.025), "lurigancho": (-11.985, -77.008),
    "chaclacayo": (-11.987, -76.768), }

def coords_desde_direccion(direccion: str) -> tuple[float | None, float | None]:
    """Coords por distrito detectado en la dirección."""
    if not direccion:
        return None, None
    d = direccion.lower().strip()
    for nombre, (lat, lng) in COORDS_LIMA.items():
        if nombre in d:
            return lat, lng
    return None, None


def geocodificar_nominatim(direccion: str) -> tuple[float | None, float | None]:
    """Geocodifica con Nominatim. Limitar 1 req/seg."""
    try:
        from geopy.geocoders import Nominatim
        from geopy.exc import GeocoderTimedOut, GeocoderServiceError
    except ImportError:
        return None, None

    locator = Nominatim(user_agent="cardionet-geocode-v1")
    # Añadir Lima, Peru para mejorar resultados
    query = f"{direccion}, Lima, Peru" if direccion else "Lima, Peru"
    try:
        location = locator.geocode(query, timeout=10)
        if location:
            return location.latitude, location.longitude
    except (GeocoderTimedOut, GeocoderServiceError):
        pass
    return None, None


def main(limite: int | None = None, solo_lookup: bool = False, verbose: bool = False):
    db = SessionLocal()
    try:
        q = db.query(Medico).filter(
            (Medico.latitud.is_(None)) | (Medico.longitud.is_(None)),
        )
        medicos = q.limit(limite).all() if limite else q.all()
        total = len(medicos)
        print(f"Médicos sin coordenadas: {total}")
        if total == 0:
            print("Nada que geocodificar.")
            return

        actualizados = 0
        for i, m in enumerate(medicos):
            dir_texto = (m.direccion_completa or m.ubicacion_consultorio or "").strip()
            if not dir_texto:
                continue

            # Normalizar: "Av. X 123," -> quitar coma final, unificar
            dir_limpia = dir_texto.rstrip(",").strip()
            lat, lng = coords_desde_direccion(dir_limpia)
            if lat is None and not solo_lookup:
                if verbose:
                    print(f"  Geocoding: {dir_texto[:60]}...")
                lat, lng = geocodificar_nominatim(dir_texto)
                time.sleep(1.1)

            if lat is not None and lng is not None:
                m.latitud = lat
                m.longitud = lng
                actualizados += 1
                print(f"  [{i+1}/{total}] OK: {m.nombre[:40]}... -> {lat:.4f}, {lng:.4f}")

            if (i + 1) % 20 == 0:
                db.commit()
                print(f"  Commit intermedio ({i+1}/{total})")

        db.commit()
        print(f"\n[OK] {actualizados} médicos actualizados con coordenadas.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Geocodificar médicos sin coordenadas")
    p.add_argument("--limite", "-n", type=int, help="Máximo de médicos a procesar")
    p.add_argument("--solo-lookup", action="store_true", help="Solo lookup por distrito, sin Nominatim")
    p.add_argument("-v", "--verbose", action="store_true", help="Mostrar intentos de geocodificación")
    args = p.parse_args()
    main(limite=args.limite, solo_lookup=args.solo_lookup, verbose=args.verbose)
