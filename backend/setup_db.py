# -*- coding: utf-8 -*-
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

# Configurar encoding de salida
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuración de conexión
DB_USER = 'postgres'
DB_PASSWORD = 'santerv'
DB_HOST = 'localhost'
DB_PORT = '5432'

print("=" * 80)
print("CARDIONET - Configuracion de Base de Datos PostgreSQL")
print("=" * 80)

try:
    # Conectar al servidor PostgreSQL (base de datos por defecto: postgres)
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

    # Verificar si la base de datos ya existe
    print("\n[2] Verificando si la base de datos 'cardionet_db' existe...")
    cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'cardionet_db';")
    exists = cursor.fetchone()

    if exists:
        print("⚠ La base de datos 'cardionet_db' ya existe")
        respuesta = input("¿Deseas eliminarla y recrearla? (s/n): ")
        if respuesta.lower() == 's':
            print("\n[3] Eliminando base de datos existente...")
            cursor.execute("DROP DATABASE cardionet_db;")
            print("✓ Base de datos eliminada")
        else:
            print("✓ Usando base de datos existente")
            cursor.close()
            conn.close()
            # Conectar a la base de datos existente
            conn = psycopg2.connect(
                user=DB_USER,
                password=DB_PASSWORD,
                host=DB_HOST,
                port=DB_PORT,
                database='cardionet_db'
            )
            cursor = conn.cursor()
            print("\n[Saltando al paso 4]")
    else:
        print("✓ La base de datos no existe, procediendo a crearla...")

        # Crear la base de datos
        print("\n[3] Creando base de datos 'cardionet_db'...")
        cursor.execute("CREATE DATABASE cardionet_db;")
        print("✓ Base de datos 'cardionet_db' creada exitosamente")

        # Cerrar conexión al servidor y conectar a la nueva base de datos
        cursor.close()
        conn.close()

        # Conectar a la nueva base de datos
        print("\n[4] Conectando a la base de datos 'cardionet_db'...")
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database='cardionet_db'
        )
        cursor = conn.cursor()
        print("✓ Conectado a 'cardionet_db'")

    # Leer el script SQL
    print("\n[5] Leyendo script SQL...")
    with open('../data/setup_database.sql', 'r', encoding='utf-8') as f:
        sql_script = f.read()

    # Separar el script en comandos individuales
    # Eliminar las líneas de conexión específicas de psql
    sql_commands = []
    for line in sql_script.split('\n'):
        if line.strip().startswith('--') or line.strip().startswith('\\c'):
            continue
        if line.strip().startswith('CREATE DATABASE'):
            continue  # Ya creamos la base de datos
        sql_commands.append(line)

    sql_script = '\n'.join(sql_commands)

    # Ejecutar el script
    print("\n[6] Ejecutando script SQL...")
    cursor.execute(sql_script)
    conn.commit()
    print("✓ Script SQL ejecutado exitosamente")

    # Verificar que las tablas se crearon
    print("\n[7] Verificando tablas creadas...")
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    print("✓ Tablas creadas:")
    for table in tables:
        print(f"   - {table[0]}")

    # Contar registros en medicos
    cursor.execute("SELECT COUNT(*) FROM medicos;")
    count = cursor.fetchone()[0]
    print(f"\n✓ Se insertaron {count} médicos cardiólogos en la base de datos")

    # Cerrar conexión
    cursor.close()
    conn.close()

    print("\n" + "=" * 80)
    print("✓ CONFIGURACIÓN DE BASE DE DATOS COMPLETADA EXITOSAMENTE")
    print("=" * 80)
    print("\nLa base de datos 'cardionet_db' está lista para usar")
    print("Credenciales:")
    print(f"  - Host: {DB_HOST}")
    print(f"  - Puerto: {DB_PORT}")
    print(f"  - Base de datos: cardionet_db")
    print(f"  - Usuario: {DB_USER}")
    print("=" * 80)

except psycopg2.Error as e:
    print(f"\n❌ Error de PostgreSQL: {e}")
    print("\nPosibles soluciones:")
    print("1. Verifica que PostgreSQL esté corriendo")
    print("2. Verifica que la contraseña sea correcta")
    print("3. Verifica que el puerto 5432 esté disponible")

except FileNotFoundError:
    print("\n❌ Error: No se encontró el archivo setup_database.sql")
    print("Verifica que el archivo exista en: ../data/setup_database.sql")

except Exception as e:
    print(f"\n❌ Error inesperado: {e}")

finally:
    if 'conn' in locals() and conn:
        conn.close()
        print("\nConexión cerrada")
