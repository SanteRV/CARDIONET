#!/usr/bin/env python3
"""
Convierte el CSV de Doctoralia a JSON limpio para importación.
Limpia HTML, normaliza campos, filtra solo cardiólogos y elimina duplicados.

Uso:
  python scripts/convertir_csv_doctoralia.py [ruta_csv]
  python scripts/convertir_csv_doctoralia.py --solo-direccion  # Solo los que tienen dirección
Docker: docker-compose exec backend python scripts/convertir_csv_doctoralia.py
"""
import csv
import json
import re
import sys
import os
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def limpiar_texto(s: str) -> str:
    """Quita HTML, espacios extra y normaliza."""
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", "", s)
    s = " ".join(s.split())
    return s.strip()


def extraer_num_opiniones(texto: str) -> int | None:
    """Extrae número de opiniones desde Texto."""
    if not texto:
        return None
    m = re.search(r"(\d+)\s*opini[oó]n", texto, re.I)
    return int(m.group(1)) if m else None


def extraer_precio(campo3: str) -> str | None:
    """Extrae precio desde Campo3."""
    if not campo3:
        return None
    m = re.search(r"S/[\s\xa0]*(\d+)", campo3)
    return f"S/ {m.group(1)}" if m else None


def es_cardiologo(esp: str) -> bool:
    """Verifica si la especialidad incluye cardiología (incl. Cardiólogo con acento)."""
    if not esp:
        return False
    norm = unicodedata.normalize("NFD", esp.lower())
    sin_acentos = "".join(c for c in norm if unicodedata.category(c) != "Mn")
    return "cardiolog" in sin_acentos or "cardio" in sin_acentos


def parsear_fila(row: dict) -> dict | None:
    """Parsea una fila del CSV a registro limpio."""
    nombre = limpiar_texto(row.get("Campo1", ""))
    if not nombre or len(nombre) < 3:
        return None

    esp = limpiar_texto(row.get("Campo2", ""))
    if not es_cardiologo(esp):
        return None

    # Usar Texto o Campo para opiniones (Campo tiene HTML, Texto puede tener número)
    texto_opiniones = row.get("Texto", "") or row.get("Campo", "")
    num_opiniones = extraer_num_opiniones(texto_opiniones)

    direccion = limpiar_texto(row.get("Texto1", ""))
    precio = extraer_precio(row.get("Campo3", ""))

    distrito = None
    if direccion and "," in direccion:
        distrito = direccion.split(",")[-1].strip().upper()

    return {
        "Campo1": nombre,
        "Campo2": esp,
        "Texto": f"{num_opiniones or 0} opinión" if num_opiniones else "",
        "Texto1": direccion or "",
        "Campo3": precio or "",
        "_parsed": {
            "nombre": nombre,
            "especialidad": "CARDIOLOGIA",
            "subespecialidad": "Cardiología General",
            "num_opiniones": num_opiniones or 0,
            "precio_visita": precio,
            "direccion_completa": direccion or None,
            "ubicacion_consultorio": direccion or None,
            "calificacion": 4.5,
            "region": "LIMA",
            "provincia": "LIMA",
            "distrito": distrito,
        },
    }


def convertir(ruta_csv: str | None = None, ruta_json: str | None = None, solo_con_direccion: bool = False) -> int:
    """Convierte CSV a JSON limpio."""
    if not ruta_csv:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        project_root = os.path.dirname(backend_dir)
        candidatos = [
            os.path.join(project_root, "data", "doctoralia.csv"),
            os.path.join(backend_dir, "data_external", "doctoralia.csv"),
        ]
        for c in candidatos:
            if os.path.exists(c):
                ruta_csv = c
                break
        else:
            ruta_csv = candidatos[0]

    if not os.path.exists(ruta_csv):
        print(f"[X] CSV no encontrado: {ruta_csv}")
        sys.exit(1)

    if not ruta_json:
        dir_csv = os.path.dirname(ruta_csv)
        ruta_json = os.path.join(dir_csv, "doctoralia_limpio.json")

    registros_limpios: list[dict] = []
    vistos: set[tuple[str, str]] = set()
    omitidos = 0

    with open(ruta_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            parsed = parsear_fila(row)
            if not parsed:
                omitidos += 1
                continue

            if solo_con_direccion and not parsed["Texto1"]:
                omitidos += 1
                continue

            # Evitar duplicados por nombre + dirección
            key = (parsed["Campo1"], parsed["Texto1"])
            if key in vistos:
                omitidos += 1
                continue
            vistos.add(key)

            # Guardar formato compatible con importar_doctoralia (sin _parsed para el JSON estándar)
            reg_export = {
                "Campo1": parsed["Campo1"],
                "Campo2": parsed["Campo2"],
                "Texto": parsed["Texto"],
                "Texto1": parsed["Texto1"],
                "Campo3": parsed["Campo3"],
            }
            registros_limpios.append(reg_export)

    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(registros_limpios, f, ensure_ascii=False, indent=2)

    con_direccion = sum(1 for r in registros_limpios if r.get("Texto1"))
    print(f"[OK] Convertido: {len(registros_limpios)} cardiólogos válidos → {ruta_json}")
    print(f"     Con dirección: {con_direccion} | Omitidos: {omitidos}")
    return len(registros_limpios)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Convertir CSV Doctoralia a JSON limpio")
    p.add_argument("ruta_csv", nargs="?", help="Ruta al CSV")
    p.add_argument("-o", "--output", help="Ruta del JSON de salida")
    p.add_argument("--solo-direccion", action="store_true", help="Solo cardiólogos con dirección")
    args = p.parse_args()
    convertir(
        ruta_csv=args.ruta_csv,
        ruta_json=args.output,
        solo_con_direccion=args.solo_direccion,
    )
