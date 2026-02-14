# -*- coding: utf-8 -*-
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_USER = 'postgres'
DB_PASSWORD = 'santerv'
DB_HOST = 'localhost'
DB_PORT = '5432'

print("=" * 80)
print("CARDIONET - Configuracion de Base de Datos PostgreSQL")
print("=" * 80)

try:
    print("\n[1] Conectando al servidor PostgreSQL...")
    conn = psycopg2.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database='postgres'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    print("[OK] Conexion exitosa al servidor PostgreSQL")

    print("\n[2] Verificando si la base de datos 'cardionet_db' existe...")
    cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'cardionet_db';")
    exists = cursor.fetchone()

    if exists:
        print("[INFO] La base de datos 'cardionet_db' ya existe")
        print("[INFO] Eliminando base de datos existente...")
        cursor.execute("DROP DATABASE cardionet_db;")
        print("[OK] Base de datos eliminada")

    print("\n[3] Creando base de datos 'cardionet_db'...")
    cursor.execute("CREATE DATABASE cardionet_db;")
    print("[OK] Base de datos 'cardionet_db' creada exitosamente")

    cursor.close()
    conn.close()

    print("\n[4] Conectando a la base de datos 'cardionet_db'...")
    conn = psycopg2.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database='cardionet_db'
    )
    cursor = conn.cursor()
    print("[OK] Conectado a 'cardionet_db'")

    print("\n[5] Leyendo script SQL...")
    with open('../data/setup_database.sql', 'r', encoding='utf-8') as f:
        sql_script = f.read()

    sql_commands = []
    for line in sql_script.split('\n'):
        if line.strip().startswith('--') or line.strip().startswith('\\c'):
            continue
        if line.strip().startswith('CREATE DATABASE'):
            continue
        sql_commands.append(line)

    sql_script = '\n'.join(sql_commands)

    print("\n[6] Ejecutando script SQL...")
    cursor.execute(sql_script)
    conn.commit()
    print("[OK] Script SQL ejecutado exitosamente")

    print("\n[7] Verificando tablas creadas...")
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    print("[OK] Tablas creadas:")
    for table in tables:
        print(f"   - {table[0]}")

    cursor.execute("SELECT COUNT(*) FROM medicos;")
    count = cursor.fetchone()[0]
    print(f"\n[OK] Se insertaron {count} medicos cardiologos en la base de datos")

    cursor.close()
    conn.close()

    print("\n" + "=" * 80)
    print("[OK] CONFIGURACION DE BASE DE DATOS COMPLETADA EXITOSAMENTE")
    print("=" * 80)
    print("\nLa base de datos 'cardionet_db' esta lista para usar")
    print("Credenciales:")
    print(f"  - Host: {DB_HOST}")
    print(f"  - Puerto: {DB_PORT}")
    print(f"  - Base de datos: cardionet_db")
    print(f"  - Usuario: {DB_USER}")
    print("=" * 80)

except psycopg2.Error as e:
    print(f"\n[ERROR] Error de PostgreSQL: {e}")
    print("\nPosibles soluciones:")
    print("1. Verifica que PostgreSQL este corriendo")
    print("2. Verifica que la contrasena sea correcta")
    print("3. Verifica que el puerto 5432 este disponible")

except FileNotFoundError:
    print("\n[ERROR] No se encontro el archivo setup_database.sql")
    print("Verifica que el archivo exista en: ../data/setup_database.sql")

except Exception as e:
    print(f"\n[ERROR] Error inesperado: {e}")

finally:
    if 'conn' in locals() and conn:
        conn.close()
        print("\nConexion cerrada")
