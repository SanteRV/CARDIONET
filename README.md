# CARDIONET

Sistema de predicción de riesgo cardíaco con IA y directorio de cardiólogos.

## Tecnologías

- **Frontend:** React, Vite, TypeScript, Leaflet
- **Backend:** Python 3.11, Flask, SQLAlchemy
- **Base de datos:** PostgreSQL
- **ML:** scikit-learn (Random Forest, Decision Tree, SVM)
- **Infraestructura:** Docker, Nginx

## Inicio rápido (Docker)

```bash
cp .env.example .env
# Edita .env con DB_PASSWORD y JWT_SECRET_KEY

chmod +x deploy.sh
./deploy.sh
```

Aplicación disponible en: http://localhost:3010

## Configuración

Copia `.env.example` a `.env` y configura:

| Variable | Descripción |
|----------|-------------|
| DB_PASSWORD | Contraseña PostgreSQL (obligatoria) |
| JWT_SECRET_KEY | Clave para tokens JWT (obligatoria en producción). Genera con: `python -c "import secrets; print(secrets.token_hex(32))"` |
| CORS_ORIGINS | Orígenes permitidos (separados por coma) |

## Desarrollo

### Con Docker

```bash
docker-compose up -d
docker-compose logs -f
```

- Frontend: http://localhost:3010
- API: http://localhost:8083 o vía frontend en /api/

### Sin Docker

```bash
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
pip install -r backend/requirements.txt
# Configura PostgreSQL y .env
cd backend && python app.py
```

## Despliegue con Nginx Proxy Manager

Puertos usados por Docker:
- **3010** → Frontend (interfaz web)
- **8083** → API (opcional; el frontend ya hace proxy de `/api/` al backend)

### Un solo subdominio (recomendado)

1. **Add Proxy Host** en Nginx Proxy Manager.
2. **Domain Names:** tu subdominio (ej. `cardionet.duckterv.com`).
3. **Forward Hostname / IP:** IP del servidor donde corre Docker (ej. `161.132.50.147` o `localhost` si NPM está en el mismo servidor).
4. **Forward Port:** `3010`.
5. **SSL:** Activar "Force SSL" y usar certificado Let's Encrypt.
6. Guardar. Todo el tráfico (web y `/api/`) pasa por el puerto 3010; el frontend redirige `/api/` al backend internamente.

### Opcional: API en subdominio aparte

Si quieres exponer la API en otro host (ej. `api.cardionet.duckterv.com`):
- Crea otro Proxy Host con **Forward Port** `8083`.
- En `.env` añade ese origen a `CORS_ORIGINS` (ej. `https://api.cardionet.duckterv.com`).

## Despliegue en VPS (sin NPM)

```bash
chmod +x install_vps.sh
./install_vps.sh
```

Incluye: Docker, Nginx, firewall (UFW), certificado SSL opcional (Certbot).

## Estructura

```
├── backend/          # API Flask
├── frontend/         # React + Vite
├── data/             # SQL, scripts
├── ml_models/        # Modelos .pkl
├── docker-compose.yml
└── deploy.sh
```

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/salud | Health check |
| POST | /api/evaluacion | Evaluar riesgo cardíaco |
| POST | /api/medicos/recomendados | Médicos por perfil |
| GET | /api/medicos/todos | Lista de cardiólogos |
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/registro/paciente | Registrar paciente |

## Seguridad

- JWT_SECRET_KEY obligatoria en producción
- Rate limiting: 100/min general, 10/min login, 5/min registro
- Backend en 8083 (para NPM); acceso solo vía proxy recomendado
- PostgreSQL sin exposición externa
- Headers de seguridad (CSP, X-Frame-Options, etc.)
- Usuario no root en contenedores

## Comandos útiles

```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
docker-compose exec backend python train_model_win.py
```
