---
name: protocolo-arranque
description: >-
  Protocolo de Arranque Ultrarrápido (Tiered Context Loading) y recuperación de memoria activa del ecosistema Mario Mojica (3dBimFab, Plataforma B2B, CRM y RAM de Ventas).
  Activa esta habilidad SIEMPRE que el usuario diga 'arranque', 'protocolo de arranque', 'arrancar', 'iniciar sesion', 'recuperar contexto' o al inicio de cualquier sesión de trabajo.
---

# Protocolo de Arranque Oficial Optimizado (Tiered Context Loading)

Para garantizar un arranque instantáneo (`< 3 segundos`) y ahorrar más del **80% de la ventana de tokens** en cada sesión, la recuperación de memoria opera en **2 Niveles (Núcleo + Carga Bajo Demanda)**:

## ⚡ Nivel 1: Núcleo Obligatorio de Arranque (Leer SIEMPRE en paralelo al iniciar)
1. `c:\Desarrollo\mmapp\ESTADO_DEL_PROYECTO.md` *(leer SOLO `StartLine: 1, EndLine: 90` — contiene el estado activo y los últimos hitos sin cargar los 2.400 renglones históricos)* — Memoria RAM y tareas activas inmediatas.
2. `c:\Desarrollo\mmapp\3BF\3BF.md` — `3dBimFab`: Motor de Manufactura Digital Paramétrica (Grasshopper → Web).
3. `c:\Desarrollo\mmapp\3BF\WORKER.md` — Memoria Técnica y arquitectura modular del Worker Python (`3bf_worker.py`, `ghx_parser.py`, `mesh_builder.py`, `bom_engine.py`, `dxf_exporter.py`).
4. `c:\Desarrollo\mmapp\Arquitectura\Arquitectura.md` — Topología del Ecosistema B2B, Hetzner VPS y Google Drive.

## 🎯 Nivel 2: Carga Bajo Demanda (Leer SOLO cuando la tarea del usuario toque ese dominio)
- **Dominio Ingeniería 3D, Nesting o Manuales:**
  - `c:\Desarrollo\mmapp\3BF\3BF_Proceso.md`
  - `c:\Desarrollo\mmapp\3BF\Opti_Nesting.md`
  - `c:\Desarrollo\mmapp\Manuales\manuales_proceso.md`
  - `c:\Desarrollo\mmapp\docs\GUIA_CONFIGURACION_CAMARA.md`
- **Dominio Comercial, CRM B2B, Copywriting o Redes:**
  - `c:\Desarrollo\mmapp\Comercial\RAM_de_ventas.md`
  - `c:\Desarrollo\mmapp\Comercial\CRM.md`
  - `c:\Desarrollo\mmapp\Comercial\ranking_empresas_rta_brasil.md`
  - `c:\Desarrollo\mmapp\Comercial\guia_copy_voz_de_marca.md`
  - `c:\Desarrollo\mmapp\Comercial\Diseñador_Post.md`
  - `c:\Desarrollo\mmapp\Comercial\historico_de_posts.md`
  - `c:\Desarrollo\mmapp\Comercial\historico_de_hashtags.md`
  - `c:\Desarrollo\mmapp\Comercial\activos_digitales_y_redes.md`
  - `c:\Desarrollo\mmapp\Comercial\Historia_Manual.md`
  - `c:\Desarrollo\mmapp\docs\MANIFIESTO_NEGOCIO.md`
- **Dominio Git Flow (`/super-commit`), Analíticas o Seguridad:**
  - `c:\Desarrollo\mmapp\HISTORICO_DEL_PROYECTO.md` *(leer solo el tramo final para agregar nuevos hitos)*
  - `c:\Desarrollo\mmapp\Arquitectura\METRICAS.md`
  - `c:\Desarrollo\mmapp\docs\reputacion_web.md`
  - `c:\Desarrollo\mmapp\docs\Seguridad.md`

## ⚙️ Pasos de Ejecución Obligatorios en el Arranque:
1. **Ejecutar `view_file` en paralelo** para los **4 archivos del Nivel 1** (más cualquier archivo del Nivel 2 únicamente si el usuario ya especificó una tarea concreta de ese dominio en el mismo mensaje).
2. **Ejecutar `git status`** en `c:\Desarrollo\mmapp` en la misma tanda paralela para verificar la rama activa.
3. **Emitir un informe ejecutivo conciso** indicando:
   - Rama Git activa y último hito en curso.
   - Confirmación de carga del Núcleo de Nivel 1 (y disponibilidad bajo demanda del Nivel 2).
   - Si el usuario invocó explícitamente `/Arranque3BF`, verificar o lanzar los 5 Daemons correspondientes asegurándose de que **RhinoCompute 8 (`:5000`)** se inicie con `& "$env:USERPROFILE\AppData\Roaming\McNeel\Rhinoceros\packages\8.0\Hops\0.17.1\rhino.compute\rhino.compute.exe" --spawn-on-startup --idlespan 86400` para pre-calentar los procesos hijos `compute.geometry.exe` desde el arranque.
