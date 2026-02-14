# Dockerfile para Backend Flask
FROM python:3.11-slim

# Usuario no privilegiado
RUN groupadd -r cardionet && useradd -r -g cardionet cardionet

WORKDIR /app

# Instalar dependencias del sistema (gcc para compilar numpy en CPUs antiguos/VPS)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar numpy desde código fuente para compatibilidad con CPUs sin X86_V2 (VPS antiguos)
RUN pip install --no-cache-dir "numpy>=1.26.0,<2.0.0" --no-binary numpy

# Resto de dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Permisos para usuario cardionet
RUN chown -R cardionet:cardionet /app

USER cardionet

EXPOSE 5000

ENV FLASK_ENV=production

CMD ["python", "app.py"]
