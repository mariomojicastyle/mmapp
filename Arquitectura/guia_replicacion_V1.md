# Guía de Replicación de Arquitectura B2B - V1

Esta guía detalla cómo replicar la arquitectura estable diseñada para el proyecto MMAp. El objetivo es un sistema desacoplado, escalable y administrable sin fallas de memoria.

## 1. Stack Tecnológico
- **Frontend**: React + Vite (Alojado en Netlify/Vercel).
- **Base de Datos**: Supabase Cloud (PostgreSQL administrado).
- **Orquestación**: n8n (Docker en VPS).
- **Proxy**: Nginx Proxy Manager (Docker en VPS).

## 2. Configuración del Servidor (Hetzner VPS)

### Requisitos Previos
- VPS con al menos 4GB de RAM (Ubuntu 24.04 recomendado).
- Docker y Docker Compose instalados.
- Puerto 80, 443 y SSH abiertos en el Firewall (UFW).

### Despliegue de Infraestructura
Crea un directorio `/opt/app` y dentro un archivo `docker-compose.yml` con la siguiente configuración optimizada:

```yaml
version: '3.8'

networks:
  frontend_net:
    driver: bridge

services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
      - '81:81'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - frontend_net

  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    environment:
      - N8N_HOST=tu-automatizacion.com
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://tu-automatizacion.com/
    volumes:
      - /opt/n8n/data:/home/node/.n8n
    deploy:
      resources:
        limits:
          memory: 1G
    networks:
      - frontend_net
```

## 3. Configuración del Backend (Supabase)
1. Crea un nuevo proyecto en [Supabase Cloud](https://supabase.com).
2. Crea la tabla `leads` con: `id`, `created_at`, `name`, `email`, `company`, `status`, `phone`.
3. Obtén las credenciales API (URL y Anon Key) desde el panel de *Settings > API*.

## 4. Configuración del Frontend (React)
1. Usa el proyecto en `/frontend`.
2. Instala dependencias: `npm install`.
3. Configura el archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://xyz.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```
4. Despliega en Netlify conectando el repositorio de GitHub y configurando las variables de entorno en el panel de Netlify.

## 5. Mantenimiento y Robustez
- **Memoria**: Mantener Baserow fuera del VPS si no se cuenta con al menos 8GB de RAM.
- **Acceso**: Bloquear puerto 81 de NPM para acceso solo vía Túnel SSH.
- **Backups**: Supabase gestiona los datos; n8n debe tener respaldos de la carpeta `/opt/n8n/data`.

---
*Generado automáticamente por el Gestor de Arquitectura V1*
