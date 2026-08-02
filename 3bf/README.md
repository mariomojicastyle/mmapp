# 🏗️ 3BF Engine — Motor de Manufactura Digital Paramétrica

Este es el proyecto independiente **3BF (3DBimFab)** del ecosistema Mario Mojica, diseñado bajo el patrón arquitectónico inspirado en **VIKTOR.ai** (Frontend React/Next.js + Orquestador Nube + **3BF Worker Python** + Visor WebGL R3F).

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias del Frontend Web
```bash
npm install
```

### 2. Iniciar Servidor Frontend (Puerto 3005)
```bash
npm run dev
```
Accede a `http://localhost:3005` en tu navegador.

### 3. Iniciar el "3BF Worker" (Python Backend Runner - Puerto 8005)
```bash
# Crear entorno virtual de Python
python -m venv worker/venv
# Activar entorno (Windows)
worker\venv\Scripts\activate
# Instalar dependencias
pip install -r worker/requirements.txt
# Ejecutar Worker
python worker/3bf_worker.py
```

---

## 📐 Estructura del Proyecto

* **`app/`**: Aplicación Next.js App Router (Dashboard, API Gateway, iFrame Embed).
* **`components/`**: Visor 3D React Three Fiber (`viewer/`), controles paramétricos DfMA (`ui/`), vistas de despiece y PDF (`views/`).
* **`lib/`**: Store global Zustand y parseador de JSON Schema.
* **`worker/`**: El **3BF Worker** en Python (`3bf_worker.py`) que ejecuta scripts CAD/Grasshopper y genera archivos `.glb`, `.dxf` y despiece JSON.
