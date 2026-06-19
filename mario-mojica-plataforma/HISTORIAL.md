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

---

## 📅 19 de Junio, 2026

### ✅ Funcionalidades Implementadas

#### 1. Sistema de Carga e Interacción de Avatar
- **Modal Interactivo de Avatar:** Creado un modal animado oscuro con Framer Motion en la página `/configuracion` con opciones para:
  - Cargar imágenes desde el dispositivo local.
  - Tomar fotos directamente en vivo usando la webcam del dispositivo (`getUserMedia`).
  - Elegir entre dos carruseles deslizables independientes.
- **Ajuste y Rotación (Crop, Rotate, Zoom & Pan):**
  - Añadido soporte para mover y arrastrar la imagen (Pan) de forma intuitiva con eventos de puntero.
  - Añadido un slider de Zoom interactivo para ajustar la escala del avatar en vivo.
  - Botón de rotación a 90° acumulativos.
  - El canvas de 150x150 renderiza la imagen en Base64 JPEG (80% calidad) reflejando exactamente el encuadre configurado por el usuario.

#### 2. Galería de Ilustraciones con Doble Carrusel
- **Personajes:** Franja con 20 avatares no woke y divertidos (10 masculinos y 10 femeninos tradicionales con fondos de colores pasteles alegres).
- **Otras Ilustraciones (Random):** Segunda franja con 20 ilustraciones abstractas de objetos y formas artísticas con fondos coloridos.
- **Navegación por Desplazamiento:** Cada franja cuenta con scroll horizontal oculto y flechas absolutas de navegación (incluyendo el botón flotante circular blanco `shadow-lg`) para deslizar individualmente el contenido de forma suave.

#### 3. Sincronización de Avatar en la Interfaz
- **Header (TopNav):** La foto de perfil reemplaza a las iniciales fijas en el botón del menú de usuario al instante de guardar los cambios sin recargar la página.
- **Sidebar (RoleSelector):** El avatar se renderiza también en la esquina inferior izquierda del menú lateral del usuario (dentro del selector de roles) en reemplazo de la letra de rol inicial.
- **Base de Datos & Auth:** Sincronización física en `profiles.avatar_url` de Supabase y en la metadata del usuario de autenticación.

