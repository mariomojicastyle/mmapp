# 🌌 Mario Mojica Hub - Command Center

Bienvenido al centro de mando de todos los proyectos de Mario Mojica. Este repositorio centraliza la gestión, arquitectura y despliegue de múltiples sub-proyectos.

## 📚 Sistema de Control y Memoria
Para evitar el **vértigo digital** y mantener el contexto, utilizamos el siguiente sistema de documentación:

### 📍 [Estado Actual del Proyecto](./ESTADO_DEL_PROYECTO.md)
**Uso:** Memoria RAM del proyecto. Contiene lo que estamos haciendo *ahora*, tareas pendientes y bloqueos inmediatos. Es el primer archivo que debe leer cualquier agente.

### 📜 [Histórico de Logros](./HISTORICO_DEL_PROYECTO.md)
**Uso:** Memoria a largo plazo. Registro cronológico de hitos alcanzados, funcionalidades completadas y decisiones históricas.

### 🏗️ [Arquitectura y Replicación](./Arquitectura/)
**Uso:** Planos técnicos. Contiene diagramas SVG, guías de replicación (V1, V2, V3...) y configuraciones de infraestructura.
- [Reglas de Oro y Buenas Prácticas](./Arquitectura/buenas_practicas_desarrollo.md)

---

## 📂 Estructura de Proyectos
- **[Plataforma B2B](./mario-mojica-plataforma/)**: Sistema de gestión de proyectos y equipo (Supabase + Next.js).
- **[Portfolio Personal](./mariomojica-portfolio/)**: Sitio web profesional y automatización de leads.
- **[Landing Page](./mario-mojica-landing-page/)**: Páginas de aterrizaje optimizadas para conversión.

---

## 🛠️ Protocolos de Trabajo

### 1. Inicio de Sesión
- El agente debe leer el `ESTADO_DEL_PROYECTO.md`.
- El usuario define el objetivo del día.

### 2. Desarrollo
- Seguir las [Buenas Prácticas](./Arquitectura/buenas_practicas_desarrollo.md).
- Documentar cambios técnicos en la versión correspondiente de la arquitectura.

### 3. Cierre de Sesión
- Mover tareas completadas del **Estado** al **Histórico**.
- Actualizar el **Estado** con los pendientes para la próxima vez.
