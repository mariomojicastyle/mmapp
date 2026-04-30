# 🛡️ RBAC: Sistema de Control de Acceso Basado en Roles
**Fecha**: 2026-04-29
**Estado**: ✅ Aprobado por el usuario

## 📋 Matriz de Permisos (Versión 1.0)

Este sistema define la visibilidad y capacidad de acción en la plataforma según el rol del usuario autenticado.

| Sección | **SuperAdmin** (Mario) | **Admin** (Cliente) | **Diseñador** (Cliente) | **Lector** (Cliente) |
| :--- | :--- | :--- | :--- | :--- |
| **Solicitudes** | ✅ Ver Todas / Gestionar | ✅ Ver Propias / Crear | ✅ Ver Propias / Comentar | ✅ Solo Ver |
| **Proyectos** | ✅ Gestionar Todos | ✅ Ver Propios | ✅ Ver Propios / Editar | ✅ Solo Ver |
| **Web** | ✅ Gestionar Todo | ✅ Ver / Solicitar Cambios | ✅ Ver / Editar contenido | ✅ Solo Ver |
| **Productos** | ✅ Gestionar Catálogo | ✅ Ver / Comprar | ✅ Ver / Sugerir | ✅ Solo Ver |
| **Equipo** | ✅ Gestionar mm.com | ✅ Gestionar Colaboradores | ❌ No ve | ❌ No ve |
| **Uso** | ✅ Analytics Global | ✅ Analytics de su Empresa | ✅ Ver métricas | ✅ Solo Ver |
| **Facturación** | ✅ Ver Invoices Global | ✅ Ver / Pagar Facturas | ❌ No ve | ❌ No ve |
| **Configuración** | ✅ Full Access | ✅ Ajustes de su Perfil | ✅ Ajustes básicos | ✅ Solo Ver |

---

## 🏗️ Implementación Técnica (Frontend)

### 1. Modelo de Datos del Usuario
El objeto de usuario en el estado global (o via Supabase Auth metadata) debe incluir:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "superadmin | admin | designer | viewer",
  "organization_id": "uuid"
}
```

### 2. Hook de Permisos (`usePermissions`)
Se implementará un hook centralizado para validar accesos en componentes:
- `canView(section)`
- `canAction(action, target)`

### 3. Sidebar Inteligente
El componente `Sidebar` filtrará las secciones de `lib/navigation.ts` comparando el `role` del usuario con la matriz de visibilidad antes de renderizar.

### 4. Middleware / Proxy Protection
El archivo `proxy.ts` (Next.js 16) validará que un usuario no pueda acceder a rutas restringidas (ej: `/facturacion` para un `diseñador`) mediante redirección forzada.

---

## 📝 Notas de Evolución
- Los permisos son granulares: un Admin de cliente solo puede gestionar colaboradores de su propia organización.
- El SuperAdmin tiene bypass total de seguridad en todas las organizaciones.
