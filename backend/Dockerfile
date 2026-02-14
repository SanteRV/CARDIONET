# Dockerfile para Backend Flask
FROM python:3.11-slim

# Usuario no privilegiado
RUN groupadd -r cardionet && useradd -r -g cardionet cardionet

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Permisos para usuario cardionet
RUN chown -R cardionet:cardionet /app

USER cardionet

EXPOSE 5000

ENV FLASK_ENV=production

CMD ["python", "app.py"]
