# Guía de Mejores Prácticas: Desarrollo y Despliegue

¡Felicidades! Tu nuevo portafolio está en vivo. Para mantenerlo estable y profesional a medida que crece, aquí tienes la estrategia recomendada siguiendo los estándares de la industria y tu arquitectura actual.

## 1. Estratégia de Ramas (Git Flow)

Para evitar errores en el sitio en vivo, nunca trabajes directamente en `main`.

| Rama | Propósito | Despliegue en Netlify |
| :--- | :--- | :--- |
| `main` | **Producción**. Código 100% estable. | Automático a `mariomojica.com` |
| `develop` | **Integración**. Próximas mejoras (ej. nueva landing). | Preview URL (para que tú lo veas antes) |
| `feat/nombre` | **Nuevas funciones**. Trabajo temporal. | No se despliega solo |

### Flujo de trabajo:
1. Crear rama: `git checkout -b develop`
2. Hacer cambios y commit.
3. Subir a GitHub: `git push origin develop`
4. **Deploy Preview**: Netlify te dará un link temporal para ver cómo queda sin afectar la web real.
5. Si te gusta: Fusionar `develop` en `main` y subir a GitHub.

## 2. Gestión de Repositorios

Como descubrimos, Netlify está vinculado a `mmapp`. 

> [!IMPORTANT]
> **Recomendación**: Mantén ambos repositorios (`b2b-hub` y `mmapp`) sincronizados o, mejor aún, elige uno como "fuente de la verdad" y desvincula el otro para evitar confusiones de versiones en el futuro.

## 3. Próximos Pasos (Arquitectura)
- **Variables de Entorno**: Si añades formularios (ej. para Supabase), usa archivos `.env` y regístralos en el panel de Netlify, nunca los subas a GitHub.
- **Optimización**: Sigue usando el comando `npm run build` localmente antes de subir para detectar errores de TypeScript.

---
*Documento de Mejores Prácticas V1*
