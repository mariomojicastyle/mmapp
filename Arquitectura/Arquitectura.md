# Arquitectura de la Solución B2B — Mario Mojica (Versión 10)

> **Versión Actual:** V10 (Agosto 2026)  
> **Diagrama Vectorial V10:** [arquitectura_v10.svg](file:///c:/Desarrollo/mmapp/Arquitectura/arquitectura_v10.svg)  
> **Documento de Especificación 3BF:** [3BF.md](file:///c:/Desarrollo/mmapp/3BF.md) & [3BF_Proceso.md](file:///c:/Desarrollo/mmapp/3BF/3BF_Proceso.md)  
> **Módulo Comercial:** [RAM_de_ventas.md](file:///c:/Desarrollo/mmapp/Comercial/RAM_de_ventas.md) & [CRM.md](file:///c:/Desarrollo/mmapp/Comercial/CRM.md)

Este documento detalla de forma exhaustiva la arquitectura técnica del ecosistema B2B de **Mario Mojica**, integrando la plataforma central, el blindaje criptográfico IP Shield, la analítica web privada en VPS, el motor paramétrico de manufactura digital **3DBimFab** sincronizado con Google Drive y el sistema inteligente de prospección **RAM de Ventas**.

---

## 🛠️ 1. Topología del Ecosistema

El sistema está estructurado bajo una arquitectura **Headless distribuida y modular**, que articula seis componentes estratégicos:

```
                                      ┌────────────────────────────────┐
                                      │   Clientes / Navegadores       │
                                      └──────────────┬─────────────────┘
                                                     │
                             ┌───────────────────────┼──────────────────────┐
                             │ (HTTPS / Analytics)   │ (Signed URLs / POST) │
                             ▼                       ▼                      ▼
               ┌───────────────────────────┐ ┌───────────────┐     ┌─────────────────┐
               │    VPS Hetzner Docker     │ │  Landing Page │     │    Visor 3D     │
               │ (Nginx Proxy Manager,     │ │   (Netlify)   │     │ (Vite/Three.js) │
               │  n8n, Baserow, Umami)     │ └───────────────┘     └────────┬────────┘
               └─────────────┬─────────────┘                                │
                             │                                              │
                             │ (Secure Actions / Telemetry / Sign)          │
                             ▼                                              │
               ┌───────────────────────────┐                                │
               │   Plataforma CMS / API    │◄───────────────────────────────┘
               │     Next.js (Netlify)     │
               └─────────────┬─────────────┘
                             │
                             ├──────────────────────────────────────────────┐
                             ▼                                              ▼
               ┌───────────────────────────┐                  ┌───────────────────────────┐
               │      Supabase Cloud       │                  │   3DBimFab Parametric     │
               │ (PostgreSQL, Storage Priv)│                  │ (Next.js, FastAPI, Rhino) │
               └───────────────────────────┘                  └─────────────┬─────────────┘
                                                                            │ (Sync Bidireccional)
                                                                            ▼
                                                              ┌───────────────────────────┐
                                                              │ Google Drive (G:\Muebles) │
                                                              └───────────────────────────┘
```

---

## 📦 2. Detalle de Componentes

### A. Capa Frontend & Experiencias 3D
1. **Plataforma CMS B2B (Next.js):** Panel de control para gestión de proyectos, configuración de manuales, métricas y el nuevo módulo **RAM de Ventas** (`/ventas-ram`).
2. **Visor 3D Interactivo (App Armado):** Motor WebGL (React Three Fiber) con locución paso a paso, orbitales con amortiguación y descifrado de geometría en RAM.
3. **Landing Page Corporativa (`mariomojica.com`):** Portafolio B2B optimizado para Generative Engine Optimization (GEO) y SEO, enfocado en marcas de muebles RTA.
4. **Realidad Aumentada (AR Scene Viewer):** Acceso móvil vía código QR sin instalación de aplicaciones, transmitiendo el modelo 3D mediante streaming serverless firmado.

---

### B. Supabase Cloud Core & IP Shield V2
* **Base de Datos PostgreSQL:** Almacena proyectos, usuarios, telemetría de armado (`telemetria_manuales`), prospección (`ventas_prospectos`, `ventas_interacciones`) y catálogos de materiales.
* **Storage Privado Cifrado:** Modelos `.glb` protegidos con cifrado en caliente **AES-256-GCM** (los primeros 4KB quedan corruptos en reposo).
* **Edge Functions:** Microservicio Deno para descifrado seguro en memoria RAM y generación de streams temporales con validación HMAC-SHA256.
* **Gateways con Rate Limiting:** `/api/metrics/collect` protegido contra spam con límite estricto de 40 req/min por IP.

---

### C. Hetzner VPS (Microservicios Docker)
1. **Nginx Proxy Manager (`npm_proxy`):** Enrutador perimetral con certificados SSL automáticos (Let's Encrypt) para subdominios corporativos.
2. **n8n Automation Engine (`n8n_app`):** Automatización de leads entrantes, alertas en WhatsApp y sincronización bidireccional con Gmail.
3. **Baserow B2B CRM (`baserow_app`):** Base de datos relacional para el embudo de ventas (Tabla 994 Leads, Tabla 991 Empresas) con estados de seguimiento.
4. **Umami Analytics (`umami_app` & `umami_db`):** Analítica web soberana y libre de cookies.

---

### D. 3DBimFab — Motor de Manufactura Digital Paramétrica & Google Drive
El motor 3DBimFab opera bajo un clúster local de 3 servicios interconectados:

1. **RhinoCompute 8 (`:5000`):** Ejecutable `rhino.compute.exe` que resuelve algoritmos Grasshopper (`.ghx`) en C++ a máxima velocidad.
2. **3BF Python Worker (`:8005`):** Servidor FastAPI que decodifica geometría pura, aplica transformaciones $X,Y,Z$ a nivel de vértice, normaliza mallas y exporta archivos `.glb`.
3. **3BF Next.js Web App (`:3005`):** Visor WebGL y entorno de autoría paramétrica que incluye:
   - **Biblioteca de Muebles (Asset Browser Blender 4.x):** Navegación jerárquica por marcas (`RTA Design`, `Politorno`, `Henn`, `Bartira`, etc.), miniaturas WebGL 3D cuadradas centradas (360×360 px), edición inline de nombres por doble clic y flujo de "Guardar como..." / "Abrir Mueble".
   - **Sincronización Nativa con Google Drive (`G:\Mi unidad\Muebles`):** Lectura en vivo sin listas quemadas por defecto, persistencia de paquetes `.3bf.json` y botón interactivo `Ir al Drive ↗`.
   - **Biblioteca de Componentes GHX:** Bloques constructivos modulares con drag & drop y nombrado secuencial automático (`Cubierta`, `Cubierta_01`).
   - **Motor BOM y Ficha Técnica de Costos:** Despiece interactivo con dimensiones reactivas únicas por instancia y unificación consolidada de herrajes (ej. 8 Cajas y 8 Pernos para 2 cubiertas).

---

### E. RAM de Ventas — CRM Inteligente de Prospección B2B
* **Outreach Copilot:** Generación de copys en 4 calibres de caracteres (300, 600, 900 y 1500) en Español y Portugués Brasileño, contextualizados por polo industrial mueblero (Arapongas, Bento Gonçalves, Ubá, Mirassol).
* **Termómetro Comercial:** 6 niveles de temperatura (`caliente`, `tibio`, `enfriando`, `pausado`, `cerrado_ganado`, `cerrado_perdido`).
* **Análisis Multimodal:** Extracción de datos y cargos a partir de capturas de pantalla de perfiles de LinkedIn y WhatsApp.
* **Control Antiduplicados:** Validación instantánea contra Baserow y Supabase antes de registrar prospectos.

---

## 🔒 3. Seguridad Perimetral y DNS Anycast
* **Cloudflare DNS & WAF:** Servidores Anycast (`justin.ns.cloudflare.com`, `tara.ns.cloudflare.com`) con CNAME Flattening e IPv6 nativo para eliminar fallos en redes móviles 4G/5G.
* **HSTS & Headers:** Inyección forzada de HTTPS con `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` y protección XSS / Anti-Clickjacking.
