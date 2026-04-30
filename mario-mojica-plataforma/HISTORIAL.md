# Historial de Desarrollo - Plataforma Mario Mojica

Este archivo registra el progreso del proyecto, las funcionalidades implementadas y las decisiones técnicas tomadas.

## 📅 29 de Abril, 2026

### ✅ Funcionalidades Implementadas

#### 1. Gestión de Equipo Dinámica
- **Sincronización con Supabase:** Se migró el módulo de equipo de datos estáticos a una integración real con la tabla `profiles` de Supabase.
- **Invitación de Miembros:**
  - Implementado el modal de invitación en `/equipo`.
  - Creada la Server Action `invitarMiembro` que usa `service_role` para crear usuarios en Auth sin cerrar la sesión del admin.
  - Configurado un Trigger en PostgreSQL para crear automáticamente un perfil en `public.profiles` cuando se registra un nuevo usuario.
- **Hook `useTeamMembers`:** Creado para centralizar la carga de miembros en toda la aplicación.

#### 2. Gestión de Solicitudes
- **Asignación Real:**
  - El componente `AssigneeSelector` ahora muestra los miembros reales de la base de datos (ej. Fátima Mojica).
  - Se actualizaron las vistas de Kanban y Lista para pasar los miembros cargados dinámicamente.
- **Corrección de Errores Críticos:**
  - Solucionado un `ReferenceError` en `SuperAdminListView` y `ClientView` donde `teamMembers` no estaba definido.
  - Implementado un estado de `mounted` en `SolicitudesPage` para evitar errores de **Hydration Mismatch** causados por el renderizado condicional basado en roles durante el SSR.
  - Asegurada la consistencia de avatares y colores entre la vista de equipo y la de solicitudes.

### 🛠️ Detalles de Configuración
- **Variables de Entorno:** Añadida `SUPABASE_SERVICE_ROLE_KEY` (secreta) para habilitar acciones administrativas desde el servidor.
- **Base de Datos:** Estructura de la tabla `profiles` definida con `id`, `name`, `email`, `role`, `job_title`, y `avatar_url`.

---

## 📋 Próximos Pasos
- [ ] Implementar **Supabase Realtime** para actualizaciones instantáneas en el tablero Kanban.
- [ ] Mejorar el manejo de estados de carga (Skeletons) en las tablas.
- [ ] Agregar validaciones de formulario más robustas para las invitaciones.
- [ ] Comenzar con el módulo de **Proyectos** y su vinculación con las solicitudes.
