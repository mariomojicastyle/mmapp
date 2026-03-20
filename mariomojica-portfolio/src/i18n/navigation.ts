import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';
 
export const routing = defineRouting({
  // Idiomas soportados
  locales: ['es', 'en'],
 
  // Idioma que se usará si no hay otro detectado
  defaultLocale: 'es'
});
 
// Envolturas de navegación ligeras para usar el routing definido
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
