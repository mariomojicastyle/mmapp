# 🧠 Estado Actual del Proyecto (Memoria Activa)

Este archivo es la "Memoria RAM" para Antigravity. Contiene el contexto de lo que estamos trabajando justo ahora, los objetivos pendientes y los bloqueos.

---

## 🏗️ 1. Plataforma B2B & 3DBimFab (Foco Actual)
**Estado:** Integración Supabase avanzada, Identidad Visual estandarizada e Hito Fundacional de **3DBimFab (3BF)** completado.

### 🧩 Proyecto Independiente 3BF (3DBimFab Engine — Inspirado en VIKTOR.ai) — Estado: IMPLEMENTADO Y VALIDADO
- [x] **Creación del Proyecto Independiente `3BF/`**: Inicializado el proyecto autónomo en `c:\Desarrollo\mmapp\3BF\` con su propio `package.json`, servidor web Next.js en puerto `3005`, y ejecutor independiente `worker/3bf_worker.py` en Python (FastAPI) en puerto `8005`.
- [x] **Arquitectura Inspirada en VIKTOR.ai**: Frontend React/Next.js con visor 3D R3F, controles paramétricos DfMA, tabla de despiece de madera, inventario de herrajes y exportador de planos CNC en DXF.
- [x] **Compilación de Producción Validada**: Verificada la compilación estática y dinámica de Next.js (`npm run build`) con 0 errores (7/7 páginas generadas exitosamente).
- [x] **Preparado para Embebido**: Vista `/embed` lista con protocolo `postMessage` y cabeceras permisivas de iFrame para acoplamiento seguro a la plataforma.
- [x] **[NUEVO - 01 de Agosto, 2026] Hito 3BF Paramétrico Nativo (Rhino 8 & Grasshopper)**:
  - **19 Piezas Nativa de Rhino 8**: Eliminación de duplicación artificial en Python y extracción nativa de los BReps OpenNURBS (`archive3dm`) mediante `rhino3dm.CommonObject.Decode()`.
  - **Modo Technical "Cristal Tintado 70%"**: Renderizado 3D estilo CAD con `<Edges color="#000000" threshold={15} />` de `@react-three/drei` y selector de modos 3D (💎 Cristal, 🧱 Sólido, 📐 Líneas).
  - **Arquitectura de Variantes `.ghx`**: Carga dinámica automatizada en `3bf_worker.py` para variantes por número de cajones (`Cajon_Experimento_Viktor_1cajon.ghx`, `2cajones.ghx`, `3cajones.ghx`).
  - **Sliders con Límites Auto-Detectados**: Extracción en XML de `<Min>`, `<Max>` y `<Value>` con etiquetas 1:1 de Grasshopper y componente `EditableNumberInput` para ingresar valores exactos con auto-clampeo.
  - **Mapeo de Value Lists**: Formateo estricto a entero sin decimales (`"351"`, `"400"`) enviando `System.Int32` y `System.String` para conmutación inmediata de Value Lists en RhinoCompute 8.
  - **[NUEVO - 02 de Agosto, 2026] Protocolo de Arranque `/Arranque3BF` Optimizado**: Invocación garantizada como Daemons de fondo independientes (`IsDaemon: true`) de los 3 procesos principales (RhinoCompute 5000, Python Worker 8005 y Next.js Web App 3005) para asegurar el encendido persistente a la primera.
  - **[NUEVO - 02 de Agosto, 2026] Hito Calibración 3D, Normales Perpendiculares & Texturizado PBR Validado**:
    - **Panel de Calibración Flotante (`🎛️ Calibrar 3D`)**: Panel desplegable en la esquina superior izquierda (`CalibrationPanel.tsx`) con 10 controles en tiempo real (Color sólido base `#9CA3AF`, Opacidad $0-100\%$, Rugosidad $0-1$, Metalicidad $0-1$, Interruptor de aristas, Color de aristas `#111827`, Opacidad de aristas, Ángulo umbral $1^\circ-89^\circ$, Cargar Bitmap JPG/PNG personalizado, Luz directa y Luz ambiental).
    - **Re-Compilación Dinámica GLSL en GPU (`key={activeMap.uuid}`)**: Resuelto el fallo de re-vinculación del mapa en WebGL añadiendo la propiedad `key={activeMap ? activeMap.uuid : "no-map"}` a `<meshStandardMaterial>`, obligando a Three.js a instanciar la bandera `#define USE_MAP` en el Fragment Shader de la tarjeta gráfica tan pronto la textura finaliza su carga.
    - **Mapeado Triplanar UV Nítido & Escala de Veta ($1.5\times-4.0\times$)**: Proyección UV triplanar estable sobre planos $XZ$ (cubiertas), $ZY$ (cantos) y $XY$ (frentes) con `THREE.MirroredRepeatWrapping` y espacio de color `THREE.SRGBColorSpace`.
    - **Validación Visual Autónoma (Playwright / Chromium)**: Verificación empírica automatizada mediante capturas de pantalla de navegador Chromium headless en `http://localhost:3005`, confirmando el renderizado real de la textura melamínica Marfil PBR sin alucinaciones.
    - **Auto-Corrección Vectorial de Normales ($100\%$ Outward Normals)**: Algoritmo en `Viewer3D.tsx` que detecta y voltea automáticamente la orientación del triángulo si la normal apunta hacia el interior de la masa del tablero ($\vec{N} \cdot \vec{V}_{out} < 0$).
    - **Geometría Dual en Memoria**: Malla indexada para aristas perimetrales de $90^\circ$ sin duplicados + Malla no-indexada para normales de cara $100\%$ perpendiculares a $90^\circ$ (eliminando gradientes de sombra en los bordes y la línea de costura).
    - **Oclusión Z-Buffer Estricta**: Aristas configuradas en el pase opaco (`depthTest={true}`, `depthWrite={true}`) evitando transparencias falsas o filtración de líneas traseras.
  - **[NUEVO - 15 de Agosto, 2026] Hito 3BF_ManoObra_CIF (Ficha Financiera Industrial 100%, Pestaña de Mano de Obra & CIF y Detección Automática DfMA de Cantos)**:
    - **Ficha Financiera Industrial Consolidada (100.00% Ficha Técnica)**: Implementación del modelo contable de costeo por absorción estándar (NIC 2 / RTA) que proyecta la totalidad del costo de fabricación: $\text{Costo Total (100\%)} = \text{MP (77.78\%)} + \text{Tercerizaciones (0\%)} + \text{MO+PRES (12.42\%)} + \text{CIF (9.80\%)}$.
    - **Nueva Pestaña Modular `🏭 Mano de Obra & CIF` en Base de Datos**: Controles interactivos con `DecimalInput` para parametrizar en tiempo real los porcentajes de Mano de Obra Directa + Prestaciones (`12.42%`), Costos Indirectos de Fabricación - CIF (`9.80%`), Adicionales (`0.40%`), y Tercerizaciones ($ COP).
    - **Tabla 4 "Resumen de Costo" en la Vista de Despiece (`DespieceView.tsx`)**: Incorporada la tabla financiera completa que detalla fila por fila: 1. Láminas, 2. Fondos, 3. Cantos, 4. Empaque, 5. Herrajes, 6. Adicionales, Subtotal MP (77.78%), 7. Tercerizaciones (0.00%), 8. MO+PRES (12.42%), 9. CIF (9.80%) y Gran Total (100.00%).
    - **Detección Automática de Cantos DfMA (3D ➔ BOM)**: Conexión reactiva entre los selectores de borde del visor 3D y la tabla de cantos con fórmula de despunte de $+100\text{ mm}$ por borde.
  - **[NUEVO - 15 de Agosto, 2026] Hito 3BF_Costos (Motor de Costeo B2B, Negociación Proveedurías, Descuento Cara, Desperdicio Nesting & Google Sheets Optimizer)**:
    - **Directorio Modular de Negociación Proveedurías**: Reestructurada la pestaña a `Negociación Proveedurías` con acordeón alfabético de 1 línea (`Arauco`, `Duratex`, `Masisa`, `Novopan del Ecuador S.A.`).
    - **Matriz de Liquidación Novopan (Ecuador ➔ Colombia)**: Integración matemática de fletes ($18.57/m³), apoyos por volumen (20.0%), apoyos por tasa (15.1%), pronto pago (3.5%), gastos de nacionalización (8.7%), financiación (1.1%) y TRM Novopan ($4.000 COP), liquidando el valor de la lámina y su costo por m² al centavo.
    - **Algoritmo de Descuento por Tipo de Cara (`Desc. Cara (I)`)**: Selector editable en tabla de tableros que aplica 5.0% a tableros con balance blanco (`D/B`) y 0.0% a tableros con 2 caras diseño (`D/D`, `D/KN`), coincidiendo exactamente con la columna `I` del Excel industrial.
    - **Cálculo Industrial de Desperdicio Nesting (`% DESP`)**: Implementada la fórmula DfMA oficial $\text{Factor} = \frac{1}{1 - \frac{\% \text{Desp}}{100}}$, con control global editable en cabecera (`10.0%`) y casillas fila a fila por pieza en la lista de corte (BOM).
    - **Auto-selección Numérica Global (`DecimalInput`)**: Estandarizada la selección completa al hacer foco (`select()`) y compatibilidad total con punto y coma en toda la plataforma.
    - **Optimizador de Plantillas ERP para Google Sheets**: Purgadas más de 1 millón de celdas fantasmas para resolver `FILE_TOO_LARGE` (de 4.66 MB a 602 KB) y restaurados los 35 Named Ranges globales para eliminar el error `#NAME?`.
    - **Selector Limpio de Sustrato**: Menú desplegable simplificado que muestra exclusivamente el nombre comercial del material sin precios concatenados.
  - **[NUEVO - 15 de Agosto, 2026] Hito 3BF_Worker_Doc & BoxMapping DfMA (Memoria Técnica del Worker & Mapeo Cúbico 3D)**:
    - **Creación del Documento Maestro `WORKER.md`**: Publicado el estándar oficial de comunicación GHX ➔ FastAPI ➔ Three.js en [`3BF/WORKER.md`](file:///c:/Desarrollo/mmapp/3BF/WORKER.md) e incorporado formalmente en el protocolo de arranque de [`AGENTS.md`](file:///c:/Desarrollo/mmapp/AGENTS.md).
    - **Matriz de Texturizado DfMA de 6 Niveles**: Estandarizada la tabla oficial de giros (`Rotate 3D`) para los 6 tipos de piezas de carpintería (`Vertical`, `Vertical Atravesada`, `Frontal`, `Frontal Atravesada`, `Horizontal`, `Horizontal Atravesada`) con caja estándar de 600 x 600 x 600 mm.
    - **Algoritmo de Mapeo Cúbico 3D Real (6 Caras Independientes)**: Componente nativo de Python en Rhino 8 que evalúa la normal dominante de cada vértice para eliminar rayas estiradas en cantos perimetrales y proyectar la veta continua.
    - **Pipeline de Extracción de UVs en el Worker**: Actualizado `3bf_worker.py` y `Viewer3D.tsx` para extraer y renderizar directamente `TextureCoordinates` de OpenNURBS sin requerir plugins externos como *Human*.
    - **Purga Total al "Buscar en Disco"**: Reseteo de variables de estado en `purgarEstadoCompleto()` (`model_id = ""`, `custom_filename = ""`) y eliminación de fallbacks hardcodeados en `ControlPanel.tsx`, dejando la interfaz 100% limpia.
  - **[NUEVO - 14 de Agosto, 2026] Hito 3BF_Alineado (Alineación Geométrica 1:1 CAD/WebGL, Widget Ejes Rhino 8 & Protocolo Purge-First)**:
    - **Alineación Geométrica Dextrógira 1:1**: Eliminación del efecto espejo en profundidad mediante la transformación de coordenadas `Three.js X = Rhino X`, `Three.js Y = Rhino Z`, `Three.js Z = -Rhino Y`, asegurando que el origen `(0,0,0)`, la posición de herrajes y los tableros coincidan milimétricamente con el viewport de Rhinoceros 8.
    - **Widget Vectorial de Ejes X, Y, Z Estilo Rhino 8**: Sincronización continua de orientación espacial a 60 FPS con un widget SVG ligero en la esquina inferior izquierda, sin interferencias de renderizado en Three.js.
    - **Protocolo de Purga Previa (Purge-First)**: Implementado reseteo en 3 niveles (Web React, Python Worker y RhinoCompute RAM) para garantizar que los modelos `.ghx` nuevos se carguen limpios y sin residuos de memoria.
    - **Corrección de Búsqueda Estricta de Signos en Sliders**: Eliminada la neutralización de valores negativos (`-1` vs `1`) en `3bf_worker.py`, permitiendo el desplazamiento simétrico exacto de pernos Minifix.
    - **Consolidación del Estándar de Salidas Agrupadas (`RH_OUT:...`)**: Homologación con McNeel Hops de salidas agrupadas en `GH_Group`.
    - **Arquitectura Versionada V3.0**: Publicación de `3BF_Proceso_Diagrama_V3.svg` y `3BF_Arquitectura_V3.svg` bajo el estándar *Tech Ethos*.
  - **[NUEVO - 13 de Agosto, 2026] Hito 3BF_Mesh_OK (Optimización de Carga, Raycasting Centralizado y Exportación GLB a Blender)**:
    - **Sincronización Dinámica de Metadatos (Bust Cache & 5ms Endpoint `/metadata`)**: Creado el endpoint `/metadata` en `3bf_worker.py` y proxy en Next.js `/api/metadata` que parsea los `default_values` del XML de Grasshopper en milisegundos sin invocar a RhinoCompute, reduciendo el tiempo de carga a la mitad (~1.5s) y eliminando peticiones dobles o retardos iniciales.
    - **Motor de Raycasting Centralizado por Profundidad (`<RaycastHandler />`)**: Reemplazados todos los handlers de puntero manuales por un evaluador centralizado frame-a-frame en Three.js con `useFrame` e `intersectObjects`. Resuelto de raíz el bug del tooltip en el aire/vacío al ejecutar `setHoveredPiece(null)` instantáneamente cuando no hay colisiones o al salir del Canvas (`onMouseLeave`).
    - **Formateo Unificado de Piezas DfMA (`obtenerNombreUnificadoPieza`)**: Nomenclatura homologada entre el visor 3D y la *Scene Collection* de Blender: sub-mallas del tablero (`Balance cubierta2`, `Color cubierta2`, `MDP2`) muestran unificadamente **"Cubierta"**, mientras que herrajes muestran **"Perno Minifix"**, **"Caja Minifix"**, **"Tarugo"** o **"Tornillo"**.
    - **Deduplicación Global Raíz de Mallas en GLB**: Deduplicación a nivel raíz `cleanRealMeshes` en `Viewer3D.tsx` que elimina mallas obsoletas base (ej. `MDP`) si la escena contiene versiones actualizadas (ej. `MDP2`), produciendo exportaciones GLB en Blender 100% limpias bajo los grupos `Cubierta`, `Herrajes` y `Maquinados` sin carpetas o mallas huérfanas en `Otros`.
    - **Estándar VisualARQ de Organización de Grupos y Sliders**: Implementado algoritmo en `3bf_worker.py` y `ControlPanel.tsx` que respeta la jerarquía multinivel de VisualARQ. Los grupos de Grasshopper (`GH_Group`) definen los títulos de las tarjetas sin números, mientras que los prefijos numéricos principales (`01.x`, `05.x`) ordenan las tarjetas y los sub-prefijos decimales (`.0`, `.1`) ordenan los controles internamente, ocultando la numeración en la web para una UI 100% limpia y auto-organizada.
  - **[NUEVO - 06 de Agosto, 2026] Hito de Perfil Comercial Upwork & Producción de Video de Presentación**:
    - **Video de Presentación Publicado & Funcionando**: Producido y sincronizado video de 9m 33s en inglés y español demostrando el visor SaaS de manuales 3D, el motor paramétrico 3DBimFab, la arquitectura de seguridad IP Shield V2, la base de datos Supabase PostgreSQL y los contenedores Docker en Hetzner VPS.
    - **Alojamiento en YouTube**: Publicado en modo **No listado (Unlisted)** con la opción **Permitir incorporación (Allow embedding)** activada (`https://youtu.be/wK_a7Fvp2nk`), integrado sin errores en el modal de presentación de Upwork.
    - **Guion Maestro Sincronizado & Prompts de IA**: Creado el archivo [`docs/Upwork/video_presentacion.md`](file:///c:/Desarrollo/mmapp/docs/Upwork/video_presentacion.md) con las versiones en español V2, inglés TTS V2, prompts cinemáticos para Google Flow y guía técnica de Docker.
    - **Solución al Bug de Caracteres XML en API TTS (`/api/tts`)**: Diagnóstico y corrección del bug en `mario-mojica-plataforma/app/api/tts/route.ts` añadiendo `escapeXml()` para evitar fallos silenciosos (0 bytes) al procesar ampersands (`&`) en textos como `R&D`.
    - **Perfil de Upwork**: Configurado con el título `Full-Stack Software Engineer | Next.js, Python & AI Automation`, tarifa de `$30.00/hr` y estrategia de portafolio B2B refactorizada.



### 🎯 Objetivos de la Fase (Plataforma B2B)
- [x] Migrar equipo a Supabase dinámico.
- [x] Corregir errores de hidratación y referencias en Solicitudes.
- [x] Sistema de Notificaciones Realtime (UI + DB + n8n).
- [x] Estandarización de Identidad Visual (Logo corregido en Login, Sidebar y TopNav).
- [x] Rediseño de Navegación Superior (TopNav con Créditos, Feedback y Búsqueda).
- [x] Rediseño de flujos de asignación de Solicitudes (Sliders, Roles SuperAdmin vs Coequipero, Vistas independientes).
- [x] Módulo de Proyectos & CMS de Armado (Vincular solicitudes a proyectos reales, modal "Nuevo Proyecto" restringido por rol).
- [x] **Pestaña Despiece y Calculador de Costos 3D (Refactorización V2)**:
  - Desglose de piezas individuales mediante badges apilados en lugar de cadenas de rangos.
  - Corrección de regex en escáner GLB para leer números de pegatinas desde nombres de padres con guiones o sin espacios.
  - Omitir el nodo raíz "Scene" para evitar nombres erróneos de piezas.
  - Filas de costo total por sección (Madera, Fondos, Herrajes) y alineación de herrajes a 14 columnas.
  - Bloque resumen de Gran Total al final de la pestaña.
- [x] **Módulo de Imagen de Perfil Interactiva (Hito Online_1)**:
  - Carga de imágenes locales y captura nativa de cámara web en vivo (`getUserMedia`) con previsualización circular Obsidian Teal.
  - Herramientas de ajuste: Zoom mediante slider, arrastre fluido (Pan) por pointer events y rotación acumulada a 90°.
  - Procesamiento por canvas a 150x150 píxeles codificado a Base64.
  - Galería con doble carrusel deslizable con flechas flotantes independientes para 20 personajes y 20 ilustraciones abstractas coloridas.
  - Sincronización en tiempo real del avatar cargado en el header (`TopNav`) y el menú lateral inferior (`RoleSelector` del `Sidebar`).
- [x] **Módulo de Publicaciones Multicanal B2B (Hito Mercadeo_Face_Insta_OK & Arquitectura V8)**:
  - Publicación directa multi-formato (Single Photo & Carrusel HD) verificada en vivo a Facebook Page (`1219474691249252`) e Instagram Business (`@mariomojicaff`).
  - Intercambio automático de tokens a **Never-Expiring Page Access Token** en `saveMarketingCuenta`.
  - Conversor de imágenes Base64 DataURL a URLs públicas HTTPS vía bucket `marketing-media` de Supabase para cumplir requerimientos de Meta CDN.
  - Planificador Semanal B2B de 24 horas con mapa de calor de CTR B2B (tonos coral/rosa), cabecera sticky de días y selector de zona horaria dinámico (Brasil - Bento Gonçalves UTC-3 vs Colombia UTC-5).
  - Límite de contenedor y scrollbar en Próximas Publicaciones (`max-h-[380px]`) y botón de borrado `🗑️ Eliminar` con alto contraste en modal y lista.
  - **[NUEVO - 04 de Agosto, 2026] Soporte de Publicación de Video en Meta y LinkedIn**: Implementado el soporte de publicación nativa de videos MP4 para Facebook (Videos API `/videos`), Instagram (Reels API con sondeo de estado/polling) y LinkedIn (Digitalmedia URN con receta `feedshare-video` y categoría `"VIDEO"`).
  - [x] **Campaña de Posicionamiento B2B "Forbes Style" & Estrategia Obviedades**:
  - Creación del Post 04 ("Experiencia Premium / La Silla Más Cómoda") en [Post_04_Experiencia_Premium.md](file:///c:/Desarrollo/mmapp/Comercial/Posts/Post_04_Experiencia_Premium.md) y registro en [historico_de_posts.md](file:///c:/Desarrollo/mmapp/Comercial/historico_de_posts.md).
  - Plantillas multipágina vectoriales Forbes en 3:4 (1080x1440 px) en [08_Post_Julio_Forbes_2026.svg](file:///c:/Desarrollo/mmapp/Publicaciones/08_Post_Julio_Forbes_2026.svg).
  - Creación de [Propuestas_Temas_Linkedin.md](file:///c:/Desarrollo/mmapp/Comercial/Posts/Propuestas_Temas_Linkedin.md) con el desglose completo de las 20 analogías de la **# Estrategia Obviedades** y plan de contenido semanal.
- [x] **Ecosistema de Analíticas, CRM B2B y Blindaje de Métricas (Hito Manual_Metricas)**:
  - Despliegue de Umami Analytics en producción en el Hetzner VPS con PostgreSQL y certificado SSL Let's Encrypt bajo el subdominio `analytics.mariomojica.com`.
  - Integración condicional y asíncrona del script de Umami en la Landing Page y en la Consola CMS Next.js.
  - Implementación de la tabla `Leads` (600) de Baserow con campo `Estado CRM` de selección única y automatización de alertas de pipeline en n8n.
  - Creación de API Route `/api/metrics/collect` en Next.js con rate limiting (40 llamadas/min) para evitar escrituras directas del cliente en Supabase.
  - Diseño e implementación de la vista de reportes PDF de fricción en la consola, optimizada para impresión física en tamaño A4 (`@media print`).
  - Creación del archivo maestro de diseño técnico [Arquitectura.md](file:///c:/Desarrollo/mmapp/Arquitectura/Arquitectura.md) y diagrama vectorial [arquitectura_V7.svg](file:///c:/Desarrollo/mmapp/Arquitectura/arquitectura_V7.svg) como ancla de referencia para el proyecto.
- [x] **Módulo de Publicaciones Multicanal B2B & Worker Autónomo en n8n (Hito Merkadeo)**:
  - Editor multicanal con previsualización en vivo para LinkedIn, Instagram, Facebook y YouTube.
  - Reordenamiento Drag & Drop de carruseles y compresión optimizada por Canvas en cliente (<150KB por imagen).
  - API Route de publicación `/api/marketing/publish` con llamadas Graph API y LinkedIn UGC Posts.
  - Conexión con worker en segundo plano de n8n (`marketing_publisher_worker`) ejecutándose minutalmente.
  - Solución del límite de transferencia de Server Actions (25MB en `next.config.ts`) y prevención de errores de hidratación (`suppressHydrationWarning`).
  - **[NUEVO - 14 de Julio, 2026]** Integración de analíticas de Umami en la aplicación base del visor 3D (`legacy-aplicativo-armado`) habilitando el rastreo automático y multitenant de visitas y eventos de pasos (`Session Start`, `Step Reached`, `Help Clicked`, `Session Complete`, `Feedback Submitted`) para la Estantería Multifuncional (M00001), Politorno y cualquier manual futuro.
  - **[NUEVO - 14 de Julio, 2026]** Implementación de rastreo declarativo de eventos de Umami en la landing page (`mario-mojica-homepage`) en enlaces de la Navbar, clics de cambio de idioma, CTAs de solicitud de demo y envío exitoso del formulario de leads.
  - **[NUEVO - 14 de Julio, 2026]** Creación del documento [METRICAS.md](file:///c:/Desarrollo/mmapp/Arquitectura/METRICAS.md) e inyección en el Protocolo de Arranque del archivo [AGENTS.md](file:///c:/Desarrollo/mmapp/AGENTS.md).
  - **[NUEVO - 15 de Julio, 2026]** Creación del documento [activos_digitales_y_redes.md](file:///c:/Desarrollo/mmapp/Comercial/activos_digitales_y_redes.md) e inyección en el Protocolo de Arranque del archivo [AGENTS.md](file:///c:/Desarrollo/mmapp/AGENTS.md).
  - **[NUEVO - 15 de Julio, 2026]** Creación del documento [guia_copy_voz_de_marca.md](file:///c:/Desarrollo/mmapp/Comercial/guia_copy_voz_de_marca.md) e inyección en el Protocolo de Arranque del archivo [AGENTS.md](file:///c:/Desarrollo/mmapp/AGENTS.md).
  - **[NUEVO - 15 de Julio, 2026]** Configuración de redirección limpia nativa en Next.js (`/demo` -> manual real de pruebas) para uso estético en publicaciones y tracking de Umami.
  - **[NUEVO - 15 de Julio, 2026]** Creación del documento [historico_de_posts.md](file:///c:/Desarrollo/mmapp/Comercial/historico_de_posts.md) para control de rendimiento de copys en redes.
  - **[NUEVO - 16 de Julio, 2026]** Integración de `MAPA_DEL_TESORO.md` en la Sección 6 de [Arquitectura.md](file:///c:/Desarrollo/mmapp/Arquitectura/Arquitectura.md) para centralizar la documentación del visor 3D en el arranque.
  - **[NUEVO - 16 de Julio, 2026]** Creación del documento [historico_de_hashtags.md](file:///c:/Desarrollo/mmapp/Comercial/historico_de_hashtags.md) para registrar, clasificar y medir el impacto y rendimiento de las etiquetas usadas en publicaciones.
  - **[NUEVO - 16 de Julio, 2026]** Actualización de [MANIFIESTO_NEGOCIO.md](file:///c:/Desarrollo/mmapp/docs/MANIFIESTO_NEGOCIO.md) con la segmentación de mercado de carpintería: *Planejados* (Dell Anno), *Modulados* (Favorita/New) y *RTA/Seriados* (Politorno/Madesa).
  - **[NUEVO - 27 de Julio, 2026]** Giro Estratégico de Posicionamiento B2B: Redefinición oficial de **Mario Mojica (MM)** como **Firma de desarrollo de software para el sector de la Manufactura (Manufactura 4.0 / Smart Manufacturing)** en [MANIFIESTO_NEGOCIO.md](file:///c:/Desarrollo/mmapp/docs/MANIFIESTO_NEGOCIO.md) y [guia_copy_voz_de_marca.md](file:///c:/Desarrollo/mmapp/Comercial/guia_copy_voz_de_marca.md), estableciendo la Industria del Mueble como vertical de foco inmediato y el Manual 3D con telemetría como módulo de entrada (Caballo de Troya).
  - **[NUEVO - 29 de Julio, 2026]** Hito **Ajuste_GeoSeo**: Redefinición del Hero de la HomePage (`mario-mojica-homepage`), optimización de metadatos SEO / GEO para motores de IA y buscadores (Schema.org `JSON-LD`), taxonomía de 5 categorías muebleras en el Manifiesto de Negocio y corrección completa de las previsualizaciones OpenGraph/Facebook/WhatsApp con imagen fija HD de 1200x630 y meta etiqueta `fb:app_id`.
  - **[NUEVO - 03 de Agosto, 2026] Hito Drive_Video (Integración de Videos MP4 y Google Drive)**:
    - **Soporte de Video en Mockups**: Habilitación dinámica de etiquetas `<video>` y renderizado de ícono de película cinematográfica (`Film`) en miniaturas para el Editor Multi-Canal B2B de Next.js, implementando `crossOrigin="anonymous"` para resolución de CORS y credenciales locales en navegadores Chrome/Safari.
    - **Soporte Nativo de Google Drive (Almacenamiento Cero)**: Creación de políticas RLS en Supabase Storage para el bucket `marketing-media`. Implementación en el cliente de un parser de enlaces públicos de Google Drive (`parseGoogleDriveLink`) para extraer el ID del archivo y generar URLs de descarga directa (`drive.usercontent.google.com`).
    - **Evadir Restricciones CORP de Google**: Integración de iframe de visualización interactiva oficial de Google Drive (`/preview`) en los mockups de redes sociales del panel del CMS para eludir las restricciones de origen cruzado de Google (`Cross-Origin-Resource-Policy: same-site`), manteniendo la descarga directa limpia para consumo asíncrono y publicación en n8n.
    - **Bypass de Límites de Carga**: Superación exitosa de los límites de carga de funciones serverless de Netlify (6MB) al permitir guardar y previsualizar videos pesados (~50MB) de la campaña de Michael Thonet mediante Google Drive.
- [x] **Resolución y Separación de Tornillos Maderkit (PolitornoP01 - 07 de Julio, 2026)**:
  - Corrección de la duplicidad y colisión de tornillos de dos tipos (Tornillo_1 y Tornillo_2) en la Estantería Multifuncional (M00001).
  - Reestructuración de la base de datos para separar el inventario oficial en Tornillo_1 (84 unidades, corto plateado para correderas) y Tornillo_2 (32 unidades, largo negro de estructura).
  - Inversión de mapeos y blindaje del algoritmo de limpieza en detalle-proyecto-modal.tsx, PanelHerrajes.jsx, PanelCantidades.jsx, y Model.jsx, resolviendo que Tornillo_0000152 se limpie a Tornillo_2 y Tornillo_0004705 a Tornillo_1.
  - Corrección del bypass en PanelBtn.jsx para permitir la apertura inmediata de PanelCantidades en el paso 00.
- [x] **Preservación de Números en Nombres "Ensamblaje" (Politorno02 - 10 de Julio, 2026)**:
  - Evitar la eliminación de números menores a 100 en piezas o geometrías cuyo nombre comience con "Ensamblaje" (ej: `Ensamblaje_Paso_1`), ya que representan estructuras previamente armadas.
  - Se modificó la lógica en `Model.jsx`, `PanelCantidades.jsx`, `PanelHerrajes.jsx` y `detalle-proyecto-modal.tsx` para incorporar esta regla y conservar los dígitos de forma coherente en todo el sistema.
  - **Garantía Neutral B2B**: Regeneración algorítmica del documento `Garantia.pdf` vía script de Puppeteer en formato exacto A4 de 3 páginas (ES, EN, PT). Se codificó el logotipo SVG en Base64 para carga instantánea y se inyectó la estética Obsidian Teal oscura, eliminando menciones específicas de marca (Ej. Politorno).
- [x] **Valla Publicitaria Digital (Politorno_Multimarca_Full - 11 de Julio, 2026)**:
  - Implementación de `client-branding-shield` en `PanelInicial.jsx` extraído dinámicamente desde el CMS.
  - Diseño responsivo anclado al centro absoluto de la cámara Spline (`top: 36%; transform: translate(-50%, -50%)`).
  - Animación CSS pura en bucle infinito (`brandLoop`, 10s) para alternar protagonismo entre el logo del cliente B2B y el logo 3D de Mario Mojica.
  - Textos descriptivos multi-idioma (ES, EN, PT) que indican de forma nativa: "Productos [Cliente] Potenciados por [MARIO MOJICA]".
  - **Traducción Universal de Tooltips**: Implementación de una regla incondicional en `translateHerraje` (`src/lib/assets.js`). Cualquier submalla detectada cuyo nombre inicie con "Ensamblaje" (ej: `Ensamblaje_Paso_2`) será traducida automáticamente a "Ensamblaje previo" (ES), "Previous assembly" (EN) o "Montagem anterior" (PT). Se integró además un fallback para términos comunes como "Gaveta".
  - **Traducción de Nubes AR**: Integración del idioma Portugués en los textos estáticos del botón y modal de Realidad Aumentada (`RealidadAumentada.jsx` y `PanelInicial.jsx`).
- [x] **Modo de Arranque Móvil, Fullscreen Directo y Altura del Iframe (Politorno_Multimarca_Full - 13 de Julio, 2026)**:
  - Creación del selector "Modo de Arranque Móvil" (Simple vs Gamma) en la base de datos y CMS.
  - Implementación de la pantalla de bienvenida limpia y responsiva (Simple) en modo demo móvil sin alterar la pantalla QR.
  - Aumento de la altura del iframe de la demo en un 50% (`aspect-[16/13.5]` en lugar de `aspect-video`).
  - Intercepción de los botones de la landing page ("Ver Demo Interactiva") para lanzar pantalla completa directamente.
  - Rediseño e integración del botón circular de cerrar "X" (close-fullscreen-btn) independiente, posicionado de forma perfectamente simétrica en la esquina superior derecha (`right: 15px; top: 140px` en móviles) para alineación vertical con el botón de AR.
  - Detención automática del audio de la guía de instrucciones (llamando a `PausedAudio()`) al salir de la pantalla completa (vía botón "X", tecla ESC, o gesto nativo), previniendo reproducciones en segundo plano.
  - Corrección del auto-pausado al arrancar: condicionado el evento de fullscreen local del iframe para no silenciar el audio/animaciones al inicio.
  - Corrección de la limpieza de nombres de pieza para duplicados de Blender que pierden el punto (ej: `11003` -> `11`).
- [x] **Rediseño del SVG Ensamble Minifix al Estilo Tech Ethos (14 de Julio, 2026)**:
  - Definido el tema claro **"Tech Ethos"** en `AGENTS.md` como el estándar global predeterminado del proyecto para diseño de gráficos e interfaces.
  - Rediseñado por completo el archivo `Ensamble_Minifix.svg` en `temporal/SVG/` y en los assets públicos del visor (`legacy-aplicativo-armado/public/assets/tips/`), reduciendo el tamaño y mejorando la calidad con trazados nativos de línea limpia en lugar de vectorizaciones automáticas rugosas.
  - Aplicados gradientes metálicos realistas, contornos suavizados en gris pizarra, y un resplandor en cian para la flecha indicativa de giro de 180°.
- [x] **Ajuste de CTA y Resolución de Desbordamiento Horizontal Móvil (14 de Julio, 2026)**:
  - Cambiada la etiqueta del botón de solicitud a `"Solicitar un prototipo con tu marca"` con traducciones en inglés y portugués en [LiveDemo.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/LiveDemo.tsx).
  - Resuelto el desbordamiento horizontal en celulares: optimizados los estilos responsivos del logotipo y el contenedor en [Header.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/Header.tsx) (`w-32 md:w-40` y `px-4 md:px-6` en móviles) para dar espacio a los botones del menú y selector de idioma.
  - Implementada protección contra scroll horizontal forzado configurando `max-width: 100%; overflow-x: hidden` en `html, body` dentro de [globals.css](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/app/globals.css) y clase `overflow-x-hidden` en el `<main>` de [page.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/app/page.tsx).
- [x] **Resolución del Recorte de Botones Inferiores en Fullscreen Móvil (14 de Julio, 2026)**:
  - Modificado el posicionamiento bottom en [NavBarInferior.css](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/NavBarInferior.css) utilizando `env(safe-area-inset-bottom)` combinada con un margen base aumentado para móviles (`bottom: calc(32px + env(safe-area-inset-bottom))` en pantallas de hasta 787px de ancho, y `20px` en pantallas de 320px). Esto evita que los botones queden sumergidos bajo la barra de gestos o el teclado del sistema, manteniéndolos 100% visibles.
- [x] **Blindaje de Propiedad Intelectual y Ofuscación de Archivos 3D GLB (15 de Julio, 2026)**:
  - Implementación de un sistema de protección y enmascaramiento binario XOR asíncrono para los archivos `.glb`.
  - Ofuscación en caliente en la subida en el CMS (`detalle-proyecto-modal.tsx`) y desencriptación en caliente en el frontend de Vite (`Model.jsx`) y escáner de despiece en Next.js.
  - Creación y ejecución de un script de migración masiva (`encrypt_existing_glbs.js`) en Supabase Storage, protegiendo 21 archivos `.glb` correspondientes a la Mesa Tijuca, Estantería Multifuncional y plantillas de desarrollo.
  - El modelo 3D desencriptado ahora solo reside efímeramente en la memoria RAM del cliente, sirviendo archivos corruptos e inservibles al descargar por inspección de red.
- [x] **Optimización de Carga Móvil y Visibilidad del Botón de AR (18 de Julio, 2026)**:
  - Discriminación de descarga del iframe de Spline 3D (`PanelInicial.jsx`): En dispositivos móviles (`isMobile = true`), el visor omite la descarga del peso de Spline 3D (~15-20MB), cargando instantáneamente el backdrop ligero Obsidian Teal con logo y progreso.
  - Eliminada la restricción de pantalla completa (`isFullscreen`) en el renderizado del botón de Realidad Aumentada (`RealidadAumentada.jsx`), asegurando que el botón `ar-btn-pc` permanezca visible y funcional siempre en navegadores móviles.
  - Resolución de Autoplay y Fullscreen Móvil (`/demo`): Reemplazada la página Next.js con iframe por una redirección Netlify 302 directa a `/embed/armado/M00001` para resolver assets por proxy. Creado puente de audio directo (`__directAudioPlay`) en el click handler táctil para conservar el gesto de usuario.
- [x] **Corrección de Enlace de Portafolio (22 de Julio, 2026)**:
  - Reemplazada la URL hardcoded `http://localhost:3002` en [Footer.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/Footer.tsx) por la variable de entorno `NEXT_PUBLIC_PORTFOLIO_URL` y fallback predeterminado `'https://portfolio.mariomojica.com'`.
  - Configurada la variable `NEXT_PUBLIC_PORTFOLIO_URL=https://portfolio.mariomojica.com` en `.env.local` y `.env.example` de la landing page (`mario-mojica-homepage`).
- [x] **Recuperación de Realidad Aumentada (AR) con IP Shield V2 y Edge Function Serverless (23 de Julio, 2026)**:
  - Creación y despliegue de la Supabase Edge Function `decrypt-glb`: Proxy serverless que recibe tokens HMAC-SHA256 con TTL de 30 minutos, descarga el `.glb` cifrado desde Supabase Storage, descifra los primeros 4KB en la RAM del servidor y sirve un binario GLB limpio a **Google Scene Viewer** (Android).
  - Creación del módulo de firma [arToken.js](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/lib/arToken.js) para autorizar peticiones AR en tiempo real desde [RealidadAumentada.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarSuperior/RealidadAumentada/RealidadAumentada.jsx).
  - Corrección de visibilidad de `<model-viewer>` (reemplazo de `display: none` por posicionamiento fuera de pantalla `opacity: 0`) para resolver falsos negativos de compatibilidad WebXR y adición de fallback de lanzamiento directo por Android Intent (`intent://arvr.google.com/scene-viewer...`).
  - Módulo de exclusión de analíticas [UmamiIgnoreManager.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/UmamiIgnoreManager.tsx) mediante el parámetro `?ignore_me=true` para prevenir falsos positivos en las métricas de prueba.
- [x] **Módulo de Marketing Nativo — Fase 1 Completada (Pasos 1 a 4 - 24 de Julio, 2026)**:
  - **Capa de Datos & RLS:** Creación del esquema SQL ([marketing_v1_schema.sql](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/scripts/marketing_v1_schema.sql)) con 5 tablas en Supabase (`marketing_cuentas`, `marketing_posts`, `marketing_colas`, `marketing_metricas`, `marketing_post_metricas`) con políticas RLS restringidas a `superadmin`.
  - **Permisos & Navegación:** Configuración de `MARKETING` en [roles.ts](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/lib/auth/roles.ts) e integración del ítem `/marketing` con ícono `Megaphone` en la sección PLATAFORMA de [navigation.ts](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/lib/navigation.ts).
  - **Server Actions:** Implementación de [marketing.ts](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/app/actions/marketing.ts) para CRUD de cuentas, publicaciones y colas.
  - **OAuth 2.0 Auth Routes:** Endpoints de autenticación y callback para Google Drive / YouTube (`/api/auth/google`), Meta / FB / IG (`/api/auth/facebook`), y LinkedIn (`/api/auth/linkedin`).
  - **Componentes UI Especializados:**
    - [drive-file-picker.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/components/marketing/drive-file-picker.tsx): Explorador modal de archivos multimedia de Google Drive.
    - [editor-post-modal.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/components/marketing/editor-post-modal.tsx): Editor multicanal con **Vista Previa en Vivo Simultánea** para LinkedIn, Instagram, Facebook y YouTube, con truco de primer comentario (`/demo`).
    - [calendario-semanal.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/components/marketing/calendario-semanal.tsx): Planificador semanal con mapa de calor de máximo CTR (Martes-Jueves 8:30-10:00 AM).
  - **Workers de n8n Desplegados:**
    - `marketing_publisher_worker` (ID: `rhkOkQuv7M4ARSEm`): Cron ejecutor minutal de publicaciones.
    - `marketing_token_refresher` (ID: `vdhZa14gtVnatV3u`): Renovador automático diario de tokens OAuth.



### 🚧 Bloqueos / Notas Técnicas
- **Identidad Visual:** Se utiliza el logo `Logo_vertical_color_en.svg` (corregido) como estándar global.
- **TopNav:** Implementa créditos dinámicos desde el perfil de Supabase (fallback a 1,250).
- **Control de Acceso:** Solo `superadmin` y `coequipero` tienen permisos para crear proyectos.
- **Detección de Nombres**: Se prioriza `child.parent.name` si no contiene la palabra "PIEZA" ni es "Scene", manteniendo la cohesión con los tooltips.
- **MIME Types en Subidas:** Se solucionó el error `TypeError: Failed to fetch` en subidas de archivos `.svg`/`.pdf` mediante un mapeo estricto de extensiones a tipos MIME que solventa fallos cuando el navegador reporta un tipo vacío en Windows.
- **Burbujas de Ayuda en Móvil:** Se centraron horizontalmente todas las burbujas superiores e inferiores en responsive y se desplazaron sus flechas direccionales de forma asimétrica para coincidir con la posición de sus botones correspondientes sin recortarse.

---

## 📂 2. Arquitectura de Proyectos y CMS de Armado (Nuevo Gran Objetivo)

### 🧩 2.1 Concepto
Convertir el aplicativo de armado 3D estándar en un **CMS independiente y multitenant** gestionado desde la plataforma de Mario Mojica:
1. **Servidor Central:** El manual vive en los servidores de `mariomojica.com`.
2. **Branding Dinámico (Admin Cliente):** El cliente con rol `admin` puede personalizar colores primarios/secundarios, subir logotipo, subir icono, y configurar garantía.
3. **Widget Embebible (PDP Nativos):** El manual se puede embeber en la web del cliente (ej. `maderkit.com.co`) en sus PDP (Product Detail Pages) como si fuera nativo, usando un `<iframe src="https://mariomojica.com/embed/armado/[id]"/>` o widget JS con autorización por dominio (CORS/Referer).
4. **Roles de Creación:** Solamente el `superadmin` y el `coequipero` pueden crear nuevos proyectos/productos. Los clientes solicitan el manual, Mario Mojica lo desarrolla y le da acceso a su manual en su cuenta de cliente para obtener el código de inserción.

### 💾 2.2 Estructura de Datos (Tablas Supabase)

#### Tabla `public.proyectos` (Nueva)
Representa un proyecto en la plataforma (B2B, B2C, Aplicativo de armado, Genérico).
```sql
CREATE TABLE public.proyectos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    tipo_proyecto text NOT NULL CHECK (tipo_proyecto IN ('Aplicativo de armado', 'B2B', 'B2C', 'Genérico')),
    estado text DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo', 'En progreso', 'En revisión', 'Completado')),
    progreso integer DEFAULT 10 CHECK (progreso >= 0 AND progreso <= 100),
    client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    solicitud_id bigint REFERENCES public.solicitudes(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### Tabla `public.configuraciones_manual` (Nueva - Específica de Armado)
Almacena la personalización y los assets cargados para cada manual.
```sql
CREATE TABLE public.configuraciones_manual (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE CASCADE UNIQUE,
    -- Identidad Gráfica (Personalización de Cliente Admin)
    color_primario text DEFAULT '#0088aa', -- Obsidian Teal por defecto
    color_secundario text DEFAULT '#111827',
    logo_url text,
    favicon_url text,
    dominio_autorizado text, -- Ej: maderkit.com.co
    
    -- Assets Dinámicos del Producto (Alimentados por Mario Mojica Team)
    glb_pasos jsonb DEFAULT '[]'::jsonb, -- Lista de URLs de GLBs por paso
    audio_es_pasos jsonb DEFAULT '[]'::jsonb, -- Audios en español por paso
    audio_en_pasos jsonb DEFAULT '[]'::jsonb, -- Audios en inglés por paso
    audio_ayuda text, -- Audio global de ayuda
    imagen_herramientas text, -- Imagen de herramientas requeridas
    imagenes_ensambles jsonb DEFAULT '[]'::jsonb, -- Imagenes de ensambles especiales
    garantia_texto text, -- Texto de garantía del producto
    fotos_herrajes jsonb DEFAULT '[]'::jsonb, -- Fotos de tornillos/herrajes
    renders_fotorealistas jsonb DEFAULT '[]'::jsonb, -- Galería de renders 3D
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 🗺️ 3. Plan de Implementación de la Fase 1 (Completado)

- [x] **Paso 1:** Crear la Interfaz del Modal "Nuevo Proyecto" (`components/proyectos/nuevo-proyecto-modal.tsx`) en Obsidian Teal con listados reactivos.
- [x] **Paso 2:** Control de Roles. Restringir la creación de proyectos exclusivamente a `SuperAdmin` y `Coequipero`.
- [x] **Paso 3:** Integración de Supabase. Creación de tablas (`proyectos`, `configuraciones_manual`) con RLS, Server Actions (`proyectos.ts`) y listados dinámicos.

---

## 📂 4. Arquitectura y Plan de la Fase 2: Detalle de Proyecto, Panel de Insumos y Manual Vacío

### 📦 4.1 Definición de "Manual Vacío" (Plantilla Replicable)
Un **"Manual Vacío"** es un cascarón o aplicación base centralizada (desplegada en `/embed/armado/[proyecto_id]`) que en lugar de leer archivos estáticos en carpetas locales (como hace `M01536`), consulta en tiempo real una API que retorna el JSON de `public.configuraciones_manual` desde Supabase.
- **Estado Inicial (Vacío):** Si el proyecto no tiene assets cargados, el manual despliega una pantalla interactiva elegante de bienvenida Obsidian Teal: *"Este manual se encuentra en fase de desarrollo. Esperando insumos del administrador."*
- **Activación Dinámica:** En el momento en que se cargan los insumos desde la plataforma, la API devuelve las URLs correspondientes de Supabase Storage. El aplicativo base las inyecta de forma reactiva en Three.js y React, volviéndose 100% funcional de forma inmediata y automática (sin necesidad de desplegar código o carpetas físicas).

### 🗺️ 4.2 Localización y Mapeo de Assets (De M01536 a CMS Dinámico)

| Insumo del Manual | Ubicación Actual en `M01536` | Nueva Ubicación Ideal (CMS Dinámico) | Estructura en Base de Datos (`configuraciones_manual`) |
| :--- | :--- | :--- | :--- |
| **1. GLB de los pasos** | `/public/M01536/models/P00.glb` ... `P05.glb` | Bucket `manuals-assets/` bajo `[proyecto_id]/models/P[paso].glb` | `glb_pasos`: `jsonb` (Array de URLs públicas de GLB) |
| **2. Audio de pasos (ES/EN)** | `/public/M01536/sounds/[paso].mp3` (Solo ES) | Bucket `manuals-assets/` bajo `[proyecto_id]/sounds/[es|en]/[paso].mp3` | `audio_es_pasos` / `audio_en_pasos`: `jsonb` (Arrays de URLs) |
| **3. Audio de ayuda** | `/public/assets/sounds/01_Ayuda.mp3` (Estático) | Bucket `manuals-assets/` bajo `[proyecto_id]/sounds/ayuda.mp3` | `audio_ayuda`: `text` (URL del archivo de ayuda) |
| **4. Imagen de herramientas** | `/public/assets/tips/[martillo].svg` (Iconos individuales) | Bucket `manuals-assets/` bajo `[proyecto_id]/tips/tools.png` | `imagen_herramientas`: `text` (URL de la imagen consolidada) |
| **5. Ensambles especiales** | `/public/assets/tips/[minifix].svg` etc. | Bucket `manuals-assets/` bajo `[proyecto_id]/tips/assemblies/` | `imagenes_ensambles`: `jsonb` (Array de URLs de tips) |
| **6. Garantía del producto** | `/public/assets/tips/garantia.pdf` (Estático) | Bucket `manuals-assets/` bajo `[proyecto_id]/garantia.pdf` | `garantia_texto`: `text` (o URL del documento personalizado) |
| **7. Fotografías de herrajes** | Ilustraciones vectoriales estáticas en el DOM | Bucket `manuals-assets/` bajo `[proyecto_id]/hardware/[foto].jpg` | `fotos_herrajes`: `jsonb` (Fotos reales para facilitar armado) |
| **8. Renders fotorealistas** | `/public/M01536/renders/render1.jpg` ... | Bucket `manuals-assets/` bajo `[proyecto_id]/renders/[render].jpg` | `renders_fotorealistas`: `jsonb` (Array de renders de galería) |

### 🛠️ 4.3 Checklist de Implementación del Detalle de Proyecto & Panel de Carga

- [x] **Paso 1: Desarrollar Server Actions para Carga de Insumos (`app/actions/insumos.ts`)** (Completado)
  - Métodos para subir archivos a Supabase Storage en el bucket `insumos_manuales` dinámicamente.
  - Métodos para actualizar la tabla `configuraciones_manual` agregando/removiendo las URLs de los assets según el tipo correspondiente.
  
- [x] **Paso 2: Diseñar la Interfaz del Modal de Detalle de Proyecto (`components/proyectos/detalle-proyecto-modal.tsx`)** (Completado)
  - **Módulo Superior (Visualizador de Solicitud):**
    - Mapeo estructurado: Título, descripción y fecha de la solicitud de origen.
    - Galería interactiva de adjuntos (renderiza imágenes en miniatura directamente en el navegador).
    - Descarga integrada con un clic para archivos no visualizables (PDF, DWG, 3DM, etc.).
  - **Módulo Inferior (Uploader de Insumos CMS):**
    - Sección interactiva dividida en acordeones o pestañas para cada uno de los 8 tipos de insumos.
    - Soporte para agregar dinámicamente pasos de armado (con su GLB respectivo, su locución en español y locución en inglés).
    - Drag & drop con barras de progreso de carga en tiempo real en Obsidian Teal.

- [x] **Paso 3: Conectar el Modal al Dashboard de Proyectos** (Completado)
  - Añadir manejador de clic (`onClick`) en las tarjetas de `app/(dashboard)/proyectos/page.tsx`.
  - Al hacer clic en un proyecto, abrir `DetalleProyectoModal` pasándole todos los datos del proyecto, solicitud y cliente cargados en tiempo real.

- [x] **Paso 4: Sincronización Dinámica de Assets en el Visualizador 3D (Vite/Proxy)** (Completado)
  - Resolvimos dinámicamente la compatibilidad para el audio de ayuda (`01_Ayuda.mp3`) cargándolo y refrescando el buffer de HTML5 Audio correctamente.
  - Mapeamos e integramos dinámicamente las imágenes reales de los herrajes subidos por el cliente (con soporte para extensiones `.webp`, `.png`, `.jpg` y redimensionamiento contain de alta calidad).
  - Pintamos dinámicamente el botón central del paso actual en Obsidian Teal con el **Color Primario** seleccionado por el cliente.
  - Agregamos la columna `color_texto_botones` en Supabase y el selector de color de contraste (Texto/Iconos) en la plataforma Next.js, logrando que tanto los iconos como el número del paso central se pinten con el color de contraste elegido por el cliente.
  - Corregimos el helper `getStorageUrl` en `AssemblyPage.jsx` para que anteponga automáticamente el prefijo de subcarpeta del código de manual (`[id]/`), solucionando de raíz el error 404 que impedía la carga del Logotipo de la empresa y del Favicon personalizado de la pestaña del navegador.

- [x] **Paso 5: Personalización de 4 Texturas PBR Completas (Piso y Escenario/Paredes)** (Completado)
  - Incorporamos 8 columnas en Supabase (`pbr_floor_diff`, `pbr_floor_normal`, `pbr_floor_roughness`, `pbr_floor_height`, `pbr_wall_diff`, `pbr_wall_normal`, `pbr_wall_roughness`, `pbr_wall_height`).
  - Diseñamos la sección "Texturas del Escenario (PBR)" en `detalle-proyecto-modal.tsx` con soporte para cargar, borrar y guardar las 4 texturas para piso y escenario.
  - Actualizamos `AssemblyPage.jsx` para recuperar las URLs y `Experience.jsx` / `Floor.jsx` para renderizar materiales físicos PBR con `bumpMap` de altura y optimización anti-parpadeo entre pasos.

- [x] **Paso 6: Estandarización Visual de Tooltips y Generación Nativa de QR** (Completado)
  - Unificamos el estilo de todas las "nubes" de ayuda (`PanelAyudas`, `PanelBtn`, `PanelHerrajes`) con bordes de 20px, fuentes Inter, y el fondo utilizando el `color-mix` dinámico con `var(--primary)`.
  - Reemplazamos la API externa de códigos QR por `react-qr-code`, logrando generación 100% nativa, offline y a prueba de fallos directamente en el frontend.

- [x] **Paso 7: Modo Cristal (Glassmorphism) con Opacidad Regulable** (Completado)
  - Incorporamos la columna `opacidad_manual` en la tabla `configuraciones_manual` de Supabase para almacenar la opacidad del manual (rango 10-100%).
  - Diseñamos un Slider premium e interactivo en Obsidian Teal dentro del panel de Branding de Next.js, con un indicador dinámico de estado.
  - Sincronizamos e inyectamos la transparencia cromática en el manual de armado React mediante la función nativa CSS `color-mix(in srgb, Color Porcentaje%, transparent)` aplicada a `--surface` y afines.
  - Aseguramos la consistencia unificada del diseño aplicando la opacidad y el efecto esmerilado al círculo central indicador de pasos de la botonera.

---

## 🌐 5. Portfolio y Leads (mariomojica.com)
**Estado:** Estable y en producción. Conectado a sistema completo de captura de leads.

### 🎯 Objetivos de la Fase
- [x] Formularios de Frontend diseñados y conectados (Producción).
- [x] Conexión n8n + Baserow.
- [x] Tabla de leads en Baserow optimizada y funcional.
- [x] Notificaciones de leads activas (WhatsApp Cloud API y Email).
- [x] **[NUEVO] n8n-MCP Integration:** Capacidad de la IA para crear/editar flujos de n8n.
- [x] **[NUEVO - 16 de Julio, 2026] Carga Completa de Contactos de Empresas Tier 2:** Investigados e inyectados los 15 contactos/tomadores de decisión de las empresas del Tier 2 de RTA Brasil en la tabla de Leads (ID 994), vinculados correctamente mediante ID relacional (`Link Row`) a la tabla de Empresas (ID 991).
- [x] **[NUEVO - 16 de Julio, 2026] Carga de Contactos Clave para Kits Paraná y Möbler Móveis:** Investigados e inyectados en la tabla de Leads (994) los 5 tomadores de decisión clave (*Jamylle Duarte*, *Edson Stocki* y *Evaldo Luís Arruda* [Presidente] para Kits Paraná, y *Ricardo Carandina* y *Diogenys Marcelo Carandina* para Möbler Móveis). Se vincularon de forma relacional, se configuraron los enlaces de búsqueda rápida de redes sociales (LinkedIn/Facebook/Instagram) y se corrigieron los campos de texto redundantes (`Empresa` y `Pais`) para su correcta visualización.
- [x] **[NUEVO - 16 de Julio, 2026] Carga Completa de Empresas del Tier 1:** Inyectados los 15 líderes masivos de RTA Brasil (Bartira, Kappesberg, Henn, Madesa, etc.) en la tabla de Empresas (ID 991) con sus respectivos metadatos comerciales, dolores de producción y canales preferidos de prospección.
- [x] **[NUEVO - 16 de Julio, 2026] Carga de Expositores RTA de Movel Sul (Tier 2):** Identificados e inyectados en la tabla de Empresas (ID 991) los fabricantes clave *Kits Paraná* (Fila ID 31, cocinas en kit) y *Möbler Móveis* (Fila ID 32, salas RTA) tras contrastar el histórico de expositores de la feria Movelsul.
- [x] **[NUEVO - 16 de Julio, 2026] Validación y Corrección de LinkedIn Tier 1:** Corregidos todos los enlaces de las 15 empresas del Tier 1 en la tabla 991 usando el algoritmo de escaneo de variaciones en paralelo, resolviendo los errores de redirección `/company/unavailable/` y documentando el protocolo en [CRM.md](file:///c:/Desarrollo/mmapp/Comercial/CRM.md).
- [x] **[NUEVO - 21 de Julio, 2026] Migración de Lead y Nuevos Prospectos:** Actualizado el perfil de Vitor Machado por su cambio a *Delucci Móveis*. Se registró la nueva empresa en el CRM (ID 67) y se inyectaron sus contactos clave: Vanessa Guindani (Marketing), Kelwin Pawlak (Projetista) y Alon Gabriel (Compras).
- [ ] **PENDIENTE:** Monitoreo de tráfico y leads reales.
- [x] **Configuración de LinkedIn Personal (14 de Julio, 2026):** Perfil de Mario Mojica optimizado con titular persuasivo B2B en español y portugués, correo corporativo verificado como principal, biografía ("Acerca de") en ambos idiomas, y aptitudes alineadas a la Industria 4.0.
- [x] **Gestión de Activos Digitales y Redes (15 de Julio, 2026):** Creación del documento [activos_digitales_y_redes.md](file:///c:/Desarrollo/mmapp/Comercial/activos_digitales_y_redes.md) que contiene el registro de perfiles y la estrategia de contenido. Se optimizó el perfil comercial de Facebook, se creó la página de empresa oficial "Mario Mojica - Smart Assembly 3D - Inteligência Moveleira" y se vincularon exitosamente Instagram y YouTube en el hub de publicaciones.
- [x] **Página de Empresa en LinkedIn:** Creada y vinculada exitosamente al perfil personal principal ([mario-mojica](https://www.linkedin.com/in/mario-mojica)) como `Mario Mojica - Ensamblaje inteligente 3D`. La cuenta temporal previa `mariomojicaff` fue cerrada.




---

## 📂 6. Aplicativo de Armado (Legacy Restore)
**Estado:** Integración inmersiva de Gama (R4X Bot) completada al 100% en la portada de carga (App_Armado_V11). Rediseño Obsidian Teal Premium finalizado con tooltips y SVGs nativos.

### 🎯 Objetivos de la Fase
- [x] App_Armado_V10: Integración inmersiva 3D de "Gama" en la pantalla de carga inicial.
- [x] App_Armado_V11: Optimización de iconos SVG nativos (Shadows) para herencia de color perfecta y adición de tooltips nativos en toda la interfaz de navegación.
- [x] Eliminar dependencias de `3dymedios.com` (localización total de GLB, Matcaps, HDRI, etc.).
- [x] Exclusión mutua de cortinas en Zustand para evitar traslapes.
- [x] Manual_Audios_v1: Sincronización y corrección de rutas de audio en español latino a la raíz de Supabase Storage (`sounds/[paso].mp3`) y restauración del ciclo de montaje de `AudioPlayer` para evadir bloqueos de Autoplay.
- [x] Manual_Audios_v1.1: Herrajes compartidos en Supabase (`_herrajes_compartidos/`), Overlay de cámara con Copy/Paste de coordenadas JSON, campos `cameraPosition`/`cameraTarget` en el modal, y unificación canónica de nombres de herrajes (`limpiarNombreMalla`) — réplica exacta del algoritmo `obtenerNombreLimpioTooltip` del modal para que el visor 3D muestre nombres idénticos (ej: `Bisagra_20040` en vez de `Bisagra`).
- [x] Manual_sonido_v2 (08 de Junio, 2026):
  - Posicionamiento de cámara flexible: Entradas de POS y TGT editables con pegado directo de coordenadas individuales o el texto completo filtrado automáticamente.
  - Unificación de botones de audio a 'Subir Audio' para Bienvenida, Ayuda e instrucciones paso a paso.
  - Solución de problemas de caché de Supabase inyectando cacheControl: '0' en las subidas por API.
  - Sincronización en tiempo real y eliminación de caché en el visor 3D mediante marca de tiempo dinámica (?t=timestamp) en las llamadas a audios en AudioPlayer.jsx.
  - Independencia de estado de carga: Spinner exclusivo para 'Subir Audio' (usando el sufijo _upload) y spinner de carga premium para la generación de la vista previa de voz (usando el sufijo _preview).
- [x] Manual_Iluminacion_Camara (09 de Junio, 2026):
  - **Calibración de Iluminación 3D en Caliente**: Implementación de un editor flotante premium (`LightingPanel.jsx`) en el visor 3D para calibrar luces y tone mapping en caliente y guardarlos directamente en Supabase desde el CMS.
  - **Guardado Automático de Cámara e Iluminación (postMessage)**: Conexión local robusta e instantánea entre el visor 3D (`localhost:5173`) y el CMS (`localhost:3003` / `mariomojica.com`) mediante la API HTML5 `postMessage` cross-origin (utilizando `rel="opener"` en los enlaces de previsualización), automatizando la persistencia a Supabase en caliente.
  - **Copia al Portapapeles y Casilleros de Pegado**: Se añade copia automática al portapapeles al pulsar "Definir posición" y se restauran inputs de texto individuales por paso en el modal para permitir el copiado y pegado clásico en cualquier situación.
  - **Corrección de Pantalla Negra y Rendimiento**: Reubicación de hooks de React en `CameraOverlay` para evitar fallos de ejecución y eliminación de bucles `useFrame` redundantes a 60fps para optimizar recursos.
- [x] Manual_Exportacion_glb_geometry_nodes (10-11 de Junio, 2026):
  - **Bake de Geometry Nodes a Objetos Reales**: Desarrollo de scripts en Python para Blender (`bake_geometry_nodes_v1.py` a `_v4.py`) que permiten hornear de forma masiva animaciones procedimentales generadas por Geometry Nodes directamente sobre los objetos reales de la escena, eliminando los planos emisores para evitar duplicidad.
  - **Bakeo por Cuaterniones y Antiflip (V4)**: Migración de rotaciones Euler a cuaterniones con corrección de signo antiflip ($q \cdot q_{prev} < 0$) para evitar Gimbal Lock y garantizar interpolaciones de rotación suaves.
  - **Corrección de Parentesco Inverso (V4)**: Incorporación de `matrix_parent_inverse` de Blender en el cálculo local de transformaciones (`(parent_matrix @ orig_obj.matrix_parent_inverse).inverted() @ world_matrix`), solucionando colisiones e intersecciones oblicuas de piezas con parentesco.
  - **Compresión Draco y Animaciones Unificadas**: Integración de la compresión Draco en la exportación de GLB (`export_draco_mesh_compression_enable=True`) para optimizar el peso en web y configuración del modo de animación a `Active actions merged` (`export_animation_mode='ACTIVE_ACTIONS'`) para unificar pistas.
  - **Restauración de Escena y Seguridad**: Implementación de reversión de archivo automática (`revert_blend=True` con `bpy.ops.wm.revert_mainfile()`) para no alterar el archivo `.blend` original en disco y uso de cadenas con nombres de objeto en lugar de referencias directas de C++ para evitar errores de `ReferenceError: StructRNA of type Object has been removed`.
  - **Soporte de Pausas y Silencios en TTS (Next.js)**: Adición de instructivo interactivo en el modal de detalles del proyecto y lógica en la API TTS para intercalar silencios exactos (`[pausa: X]`) basados en el formato binario nativo del motor de voz, evitando cortes del decodificador en la web.
- [x] Manual_Escaner (11 de Junio, 2026):
  - **Unificación Espacial de Herrajes Complejos**: Algoritmo tridimensional en Three.js que consolida submallas separadas por animación (bisagras y correderas) a menos de 100 mm en una única pieza física real, dividiendo al final entre 2 para reportar con absoluta precisión 4 bisagras y 4 correderas.
  - **Filtro de Superposición Estricto (2 mm)**: Para herrajes simples (pernos y puntillas), se restringe la tolerancia a 2 mm para ignorar copias duplicadas accidentalmente en Blender con Shift+D, reportando 34 puntillas y 28 pernos de forma blindada.
  - **Persistencia Automática de Despiece**: Automatización del guardado del despiece en Supabase (`despiece`) inmediatamente tras finalizar el escaneo con éxito en la plataforma Next.js.
  - **Sincronía Completa del Visor 3D**: Modificaciones en `PanelHerrajes.jsx` para heredar las cantidades estimadas directamente de `data.despiece` en el paso inicial 00, y réplica del algoritmo espacial/superposición en el fallback local en `PanelCantidades.jsx`.
- [x] **Estabilización de Animaciones (v18 - 13 de Junio, 2026)**: Resolución de la suite de bugs del horneado de Geometry Nodes. Se descartó la jerarquía de parentesco (causa raíz de matrices singulares por escala cero, cizalladura por escala no uniforme y desapariciones) a favor de un horneado directo en coordenadas de mundo absoluto (World Space) con unificación por cuaterniones y filtros antiflip.
- [x] **Sincronización de Animación y Encuesta Final (8 de Julio, 2026)**: Implementación del estado global `AnimationEnded` y escucha de eventos de finalización del mixer de Three.js para sincronizar el modal de feedback del paso final, forzando que solo se active cuando tanto la locución como la animación 3D hayan terminado de reproducirse.
- [x] **Personalización de Color de Objeto Tocado (8 de Julio, 2026)**: Incorporación de la columna `color_objeto_tocado` en Supabase y de un selector interactivo en la pestaña **"Personalización UI"** del CMS (después de "Color de Texto / Iconos"). Implementación del tintado dinámico y reactivo en caliente de la malla de selección en el visor Three.js.
- [x] **Internacionalización y Modo Estudio 3D (Manual_Entorno_mejorado - 13 de Junio, 2026)**:
  - **Internacionalización a Inglés**: Traducción dinámica de toda la interfaz visual (las 8 nubes de ayuda, tooltips, panel de cantidades, realidad aumentada con popup de QR y panel de tips generales) en tiempo real al cambiar a "EN". Implementación del atributo `data-tip-key` para no romper el filtrado de tips en español.
  - **Ajuste de Spacing**: Reubicación del botón de cantidades dentro de la lista `.menu` para heredar el `gap` idéntico a las fichas de los herrajes.
  - **Modo Estudio 3D (Spline)**: Escenario digital infinito configurable desde la plataforma mediante `tipo_ambiente` y `color_ambiente` en Supabase.
  - **Sombras Reales en Modo Estudio**: Malla de suelo de `30x30` que recibe sombras en WebGL y se desvanece de manera invisible en la niebla al compartir el mismo color de fondo.
  - **Control de Color en la Plataforma**: Selector de color interactivo en el modal para cambiar el tono de fondo/piso del estudio en caliente.
- [x] **Manual_Online (16 de Junio, 2026)**:
  - **Resolución de Carga de Assets en Producción**: Implementación de una utilidad de prefijo dinámico (`assets.js`) para redirigir correctamente las llamadas de assets locales estáticos y de manuales cuando la app se carga embebida bajo la subruta proxy `/embed/armado/*` en `mariomojica.com`.
  - **Bypass de Limitación de Proxies en Netlify**: Configuración de reglas explícitas de proxy en `netlify.toml` del portfolio y homepage para desviar recursos dinámicos (`models`, `sounds`, `herrajes`) directamente hacia el storage de Supabase, evitando el encadenamiento de proxies de Netlify que provocaba errores 404.
  - **Exclusión de Assets Estáticos Locales**: Adición de reglas prioritarias en `netlify.toml` para asegurar que las carpetas locales de la aplicación (`/assets/`, `/textures/`, `/Matcaps/`, `/hdri/`, `/manual-vacio/`) se sirvan desde el CDN de Netlify del visor en vez de enviarse a Supabase.
  - **Configuración de base path absoluto en Vite**: Migración de `base: './'` a `base: '/'` en `vite.config.js` para asegurar que el bundle del visor busque sus recursos de sistema en rutas absolutas, previniendo secuestros por parte de las reglas dinámicas.
  - **Soporte para Múltiples Clips de Animación**: Actualización del componente `Model.jsx` para iterar y reproducir simultáneamente todos los clips de animación contenidos en el GLB de pasos, dando soporte nativo a manuales complejos con tracks de animación segmentados.
  - **Bypass de Caché por Session Cache Buster**: Inyección de un timestamp único de sesión (`?v=timestamp`) en las solicitudes de assets locales y dinámicos para evitar que los navegadores o CDNs almacenen en caché versiones viejas de modelos y audios tras subirse nuevas versiones en el CMS.
- [x] **Bypass Resiliente de Carga y Sombra Tonal (15 de Junio, 2026)**:
  - **Bypass de Pantalla de Carga**: Se añadió un temporizador de respaldo en `PanelInicial.jsx` para que el botón "Iniciar" aparezca a los 6 segundos de forma automatizada, evitando bloqueos por fallos o timeouts en la red de Supabase.
  - **Sombra de Contraste Tonal**: Reemplazo de la sombra negra (`rgba(0,0,0,0.4)`) por una sombra tonal fluida (`color-mix` basada en `var(--secondary)`) en el título bajo la regla de Underline Glow para un contraste natural.
- [x] **Estabilización de Redirecciones, Fullscreen y Posición de Nubes (16 de Junio, 2026)**:
  - **Resolución de Assets (Herramientas y Garantía)**: Reordenamiento de las reglas de redirección en `netlify.toml` de todos los proyectos y en `_redirects` para priorizar archivos individuales (`/:manualId/:file`) antes que directorios de categorías (`/:manualId/:category/*`), eliminando barras diagonales no deseadas que causaban fallos 404 en el Storage de Supabase.
  - **Fullscreen por Rotación**: Inyección de lógica robusta en `AssemblyPage.jsx` para detectar rotación horizontal en dispositivos móviles e invocar `requestFullscreen` de forma interactiva (con fallback a listeners de interacción en pantalla si es bloqueado inicialmente por políticas del navegador).
  - **Alineación de Nubes y z-index**: Incremento del `z-index` de `.contenedor` a `1000` en `NavBarInferior.css` para permitir el paso por encima del botón de AR. Redefinición de burbujas superiores a alineaciones asimétricas individuales según su botón correspondiente (`ayuda1` a la izquierda, `ayudaLuz` al centro, y `ayudaVelocidad`/`ayudaIdioma` a la derecha con `right: 4px`) para evitar desbordes. Elevación y centrado de las burbujas inferiores en móviles a `bottom: 80px !important` en `PanelAyudas.css`, garantizando que floten elegantemente por encima de los botones inferiores sin tapar el slider ni el play/pausa.
- [x] **Perfeccionamiento Milimétrico de Nubes de Ayuda en Móvil (17 de Junio, 2026)**:
  - **Barra Superior**: Fijada la altura de `.contenedor1` a `52px !important` y desplazada hacia abajo con `top: 50px !important` en móviles para evitar la proximidad extrema con el borde superior de la pantalla (bajando 30px respecto a la versión anterior). Se removieron los estilos en línea de `position: relative` en los contenedores de velocidad e idioma, permitiendo que la regla de `position: static !important` surta efecto para alinear las burbujas superiores con total precisión respecto a `.contenedor1-1`.
  - **Botón de Cerrar**: Ajustado el `top` de `.cerrar` a `50px !important` en móviles para mantener simetría vertical perfecta con la barra superior de botones.
  - **Barra Inferior**: Centrado y acotado el ancho de `.SesionArriba` a exactamente `292px !important` en dispositivos móviles, sirviendo como marco de anclaje relativo exacto para las burbujas inferiores, eliminando cualquier desfase horizontal por ancho de pantalla.
  - **Burbujas Inferiores**: Redefinido el offset de las flechas de `ayuda4` (Buscador) y `ayuda5` (Play/Pausa) a `18px !important` para coincidir milimétricamente con el centro de la lupa y del botón play.
  - **Z-Index de Realidad Aumentada**: Incrementado el `z-index` de `.AR` a `1001 !important` en dispositivos móviles para sobrepasar la barra inferior de botones (`z-index: 1000`), manteniendo el botón de AR flotante e interactivo en primer plano en todo momento.
- [x] **Solución de Carga Errática en AR Móvil y Preload Dinámico de GLBs (17 de Junio, 2026)**:
  - **Botón AR Fijo en el DOM**: Se modificó `PanelInicial.jsx` para renderizar el botón `#inicio` permanentemente en el DOM de React, controlando su visibilidad mediante estilos inline `display: (displayProgress === 100 || progress >= 100) ? "flex" : "none"`. Esto corrige referencias nulas de DOM (`document.getElementById("inicio")`) y asegura que el botón aparezca de manera instantánea cuando Three.js completa la carga de los modelos.
  - **Simulación de Progreso**: Implementación de una simulación progresiva suave hasta el 90% para amortiguar el salto brusco de 0% a 100% (causado por la falta de cabeceras `Content-Length` en servidores de almacenamiento).
  - **Preload Dinámico de Modelos**: Se añadió preloading en `Model.jsx` usando `useGLTF.preload()` para los pasos `pasoActual + 1` y `pasoActual - 1`, permitiendo que el navegador descargue en segundo plano los modelos adyacentes y eliminando los retardos y pantallas vacías en la transición de pasos.
- [x] **Interacción Táctil de Tooltips y Posición Fija en Móvil (17 de Junio, 2026)**:
  - **Diferenciación de Dispositivos (Touch vs Desktop)**: Se introdujo la constante `isTouchDevice` para desactivar los listeners de hover `onPointerEnter` y `onPointerLeave` en móviles, evitando bloqueos de mallas resaltadas. En su lugar, se configuró un listener `onClick` (`handleTouchSelect`) en `Model.jsx` para alternar (seleccionar/deseleccionar) las piezas mediante toques directos.
  - **Ubicación Fija a Salvo del Dedo**: Se configuró la visualización del tooltip en dispositivos táctiles en una posición fija: centrado horizontalmente (`left: 50%`) y a exactamente `10px` por debajo de los botones superiores, leyendo en caliente el rectángulo de colisión (`rect.bottom`) de la barra de botones. Esto evita que la mano del usuario tape la lectura del nombre de la pieza seleccionada.
  - **Deselección Dinámica por Click en Fondo**: Añadida la directiva `onPointerMissed` en el canvas de R3F (`AssemblyViewer.jsx`) para que al tocar en cualquier espacio vacío del escenario se limpie el tooltip activo, restaurando de manera reactiva el material original de la pieza resaltada mediante un efecto en `Model.jsx`.
- [x] **Solución a Pausas del Generador de Audio TTS en Producción (17 de Junio, 2026)**:
  - **Restauración de Silencios Base64**: Se corrigió el endpoint `/api/tts/route.ts` de la plataforma Next.js. Debido a que las APIs serverless carecen de binarios locales (`edge-tts` CLI) y scripts Python, se sustituyó el fallback `synthesizeTts("...", voice)` (que no generaba silencio real) por la decodificación directa de un buffer de silencio MP3 puro de 1 segundo en base64 (`SILENT_MP3_BASE64`), garantizando pausas precisas de silencio en los archivos generados en producción.
- [x] **Ajuste Fino de Audios TTS y Edición Dinámica de Ayudas (Hito Manual_Online_v2 - 17 de Junio, 2026)**:
  - **Corrección de Detención en Pausas**: Refactorización de la API de TTS en Next.js para eliminar cabeceras ID3v2 redundantes en la concatenación de MP3s de silencios y voz. Al limpiar las cabeceras intermedias con `stripId3`, el decodificador de HTML5 Audio del navegador web puede reproducir de manera continua sin detener el audio al llegar a una pausa.
  - **CMS de Edición de Ayudas de Interfaz**: Nueva sección **8. Ayudas de Interfaz y Calibrador** en el panel de insumos del CMS. Permite editar en caliente los títulos y descripciones en español e inglés de las 8 burbujas de ayuda (nubes) del tutorial interactivo, con guardado directo en la columna `ayudas_texto` (`jsonb`) en Supabase.
  - **Traducción Automática**: Botón inteligente en el CMS que traduce automáticamente a inglés el título y contenido de cada ayuda usando el endpoint `/api/translate`.
  - **Visor Dinámico de Ayudas**: Sincronización del visor para renderizar dinámicamente los textos custom de las nubes y auto-cargar la versión de calibración local o productiva desde el botón del CMS.
  - **Limpieza de UI**: Eliminación del botón redundante "Abrir Calibrador UI" del pie de página del modal de detalles del CMS.
- [x] **Optimización de Interfaz y SEO del Visor de Armado (Hito Manual_Metricas - 18 de Junio, 2026)**:
  - **Open Graph Local**: Se procesó la imagen previa de portada (`Banner_Manual`) de PNG a formato WebP optimizado y se inyectó en el `index.html` con rutas relativas, resolviendo dependencias de Supabase para previsualizaciones ricas en WhatsApp.
  - **Iframe de Spline (Bienvenida)**: Se limpió la URL dinámica de Spline y se eliminó el atributo genérico `title="Spline 3D Scene"` del iframe, suprimiendo tooltips nativos indeseados del navegador en PC.
  - **Corrección de Margen Táctil**: Ajuste de CSS (`margin-top: 0`) para alinear perfectamente el botón "Iniciar" en dispositivos móviles, previniendo superposiciones con el logo y centrándolo en el borde superior de la pantalla.
  - **Restauración Síncrona de Hover en PC**: Se corrigió un bug de colisión de estados (race condition) originado en la actualización táctil anterior. Se reintrodujo la restauración síncrona del material en `onPointerLeave` exclusivamente para dispositivos no táctiles, evitando que las piezas queden seleccionadas infinitamente al arrastrar el mouse.
- [x] **Blindaje Legal Fase 3 y Traducción de Alias (23 de Junio, 2026)**:
  - **Eliminación de Paridad CSS y Marca**: Remoción de archivos de encuesta obsoletos y del logo de Maderkit. Refactorización de `Landscape.jsx` para usar Tailwind CSS y borrado de `Landscape.css`.
  - **Garantía Premium Neutra**: Creación de `Garantia.pdf` neutro de la plataforma y su sincronización local y en Supabase Storage.
  - **Capa de Traducción de Alias en React**: Implementación de `resolveAlias` en `assets.js` e integración en `PanelHerrajes.jsx`, `PanelCantidades.jsx` y `Model.jsx`. Traduce nombres de mallas con SKUs legacy del GLB a nombres limpios en caliente, permitiendo renderizar sus imágenes de forma blindada sin alterar los archivos 3D.
- [x] **Blindaje Legal Fase 4, Ofuscación Estructural y Eliminación de Código Legado (Fase 5) (24 de Junio, 2026)**:
  - **Refactorización de Escena 3D (R3F)**: Renombrado de `Experience` a `AssemblySceneViewer`, y métodos internos a estándares modernos (e.g. `parseCubemapTextureAtlas`, `alignSkyboxToGround`, `ViewportCameraManager`).
  - **Ofuscación y Limpieza en Model.jsx**: Renombrado de variables y funciones de control (`cleanMeshIdentifier`, `modelRef`, `materialsCache`, `resolvePartDisplayName`) y corrección de un `ReferenceError` en la fov por defecto de la cámara.
  - **Fase 5 (Higiene de PI)**: Remoción completa (física y de control de versiones Git) de la carpeta parent `legacy-aplicativo-armado-original` para independizar por completo el aplicativo blindado.

---


- [x] **Plataforma CMS - Traducciones TTS y Ergonomía (01 de Julio, 2026)**:
  - **Reingeniería de Traducción con Pausas**: Refactorización del motor de `/api/translate` garantizando la supervivencia y posicionamiento intacto (Límites de palabra) de las etiquetas de control `[pausa: N]` post-traducción a EN y PT.
  - **Ergonomía Bilingüe**: Reestructuración del CMS extrayendo la generación de Audio a la nueva pestaña dedicada "Textos y Locución (TTS)", eliminando colisiones de *Nested Scrolling* y quintuplicando la altura de los `textarea` para edición profesional sin ahogo de vista.
- [x] **Plataforma CMS - Robustez de Traducción, Glosario Inglés y Alineación de Pausas (02 de Julio, 2026)**:
  - **Cascada de Modelos y Reintentos (Anti-429)**: Incorporación de una cascada secuencial de modelos (`gemini-2.5-flash`, `gemini-flash-latest`, `gemini-2.0-flash`, `gemini-pro-latest`) con reintentos exponenciales en `/api/translate`, previniendo de forma blindada fallos silenciosos por límite de cuota (429).
  - **Inyección de Glosario por Placeholders**: Rediseño del fallback de Google Translate utilizando variables temporales (`__GLOS_PL_N__`, `__GLOS_SG_N__`) para garantizar la inyección infalible de términos técnicos del glosario.
  - **Regla de Pluralización en Inglés**: Refactorización de `pluralizeEnglish` para pluralizar únicamente el sustantivo final o penúltimo (evitando "Flats heads screws" y corrigiéndolo a "Flat head screws").
  - **Ventana de Alineación de Pausas**: Ampliación de la ventana de búsqueda de signos de puntuación a 35 caracteres, permitiendo que las pausas se alineen de forma perfecta con los puntos finales de las oraciones en cualquier idioma.
  - **Advertencias y Tokens de Salida**: Aumento del límite de tokens de salida a 20,000 en la API para dar cabida a los tokens de pensamiento de los modelos de razonamiento (Gemini 2.5/3.5) y adición de banner amarillo de advertencia en el modal de detalles del CMS Next.js.
- [x] **Algoritmo de Escaneo y Unificación Compuesta de Cajones (Politorno) (07 de Julio, 2026)**: Resolvimos la anomalía en la cantidad detectada para las mallas internas de los cajones en el escáner de Politorno (`Peça 06`, `Peça 07`, `Peça 08`, `Fundo/Peça 10`). Dado que Three.js optimiza el árbol y cuelga estas piezas directamente de los frentes de los cajones (`Peça 12` y `Peça 13`), implementamos una lógica de identificador de unificación compuesto (`${child.parent.uuid}_${nombreLimpio}`) cuando el nombre del padre no coincide con el de la pieza. Esto cohesiona de forma robusta las primitivas de un mismo cajón, reduciendo la cantidad detectada de 3 a la cantidad real de 2 para cada una de estas piezas.

## 🔗 Enlaces de Control
- **Baserow:** [Leads Table](https://baserow.mariomojica.com/database/144/table/600/2509)
- **n8n Principal:** [https://n8n.mariomojica.com/](https://n8n.mariomojica.com/)
- **Supabase Console:** [Cloud Project](https://supabase.com/dashboard/)
- **Local App:** [http://localhost:3000](http://localhost:3000)

---
*Última actualización de contexto: 03 de Agosto, 2026*


---

## 🤖 7. Automatización Blender (Cohesión de Mallas Grasshopper)
**Estado:** V30 Estable y en Producción.

### 🎯 Objetivos de la Fase
- [x] Desarrollar un script en Python para Blender que consolide mallas exportadas de Grasshopper.
- [x] Reconstrucción de Herrajes: Detectar y agrupar componentes fragmentados.
- [x] Cohesión de Láminas: Unir capas de tableros basándose en centros espaciales y geometría (paralelepípedo).
- [x] Absorción Inteligente de Parches 2D: Detectar geometrías sin grosor (tapitas de ranura) y fusionarlas a su pieza principal mediante análisis de Bounding Boxes.
- [x] Resolución de Geometría Invisible: Reparar fallos de visibilidad en parches 2D forzando geometría doble cara real, evitando el backface culling.
- [x] Orígenes Geométricos: Ajustar el origen de cada malla consolidada al centro geométrico del Bounding Box.

- [x] **Configuración de Leads y CRM en n8n (26 de Junio, 2026)**:
  - **Integración Gmail-Baserow**: Configuración exitosa del trigger de Gmail para procesar correos entrantes y buscar/crear leads en Baserow CRM basándose en el email del remitente.
  - **Manejo de Errores y Tipado**: Resolución de bugs críticos de tipado (Type Validation) en n8n al comparar IDs numéricos de Baserow dentro del nodo IF.
  - **Plantillas Meta WhatsApp**: Creación e integración de plantillas de Utilidad (lerta_correo_respuesta) en Meta WhatsApp Manager, corrigiendo la validación de parámetros dinámicos ({1}) para el envío de alertas de respuesta y nuevos leads al celular del administrador.

### 🚧 Notas Técnicas
- **Resolución Bounding Box Volumétrico:** En V30 se resolvió un bug de unión aleatoria obligando al algoritmo a validar colisiones (`bbox_contains`) siempre contra la malla de mayor grosor (MDP) en lugar de capas 2D (Cara), eliminando falsos negativos causados por el orden de extracción de `set()` en Python.


### Actualización 2026-07-10: V20 Estable - Bug de Extracción GLTF Corregido
- **Estado Actual:** La V20 (Baking en Geometry Nodes) se ha validado de punta a punta. Se corrigió un bug bloqueante donde el agrupador "Peça_Group" sufría corrupción de codificación en GLTF (generando `Pe\ufffdA_Group`), lo que causaba que la aplicación web ignorara por completo los herrajes del cajón (P03).
- **Logros:**
  - Se implementó una RegEx `/^PE.A/i` en `pieceUtils.js` que detecta la pieza ignorando caracteres rotos.
  - Se añadió un parche "en caliente" en `PanelHerrajes.jsx` para forzar a la interfaz a mostrar "Tapa furo adesivo" en el paso 03 y eliminar la filtración visual de la "Tapa furo plástico" de los modelos estáticos.
  - Se saneó el script `bake_geometry_nodes_v20.py` para nombrar al grupo `Peca_Group` y evitar problemas futuros.
- **Siguiente Paso:** Validar más manuales o proceder con la exportación/despliegue general del aplicativo.
