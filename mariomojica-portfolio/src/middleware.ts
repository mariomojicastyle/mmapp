import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/navigation';
 
export default createMiddleware(routing);
 
export const config = {
  // Ajuste para que solo afecte a las rutas del sitio, no a imágenes ni API
  matcher: ['/', '/(es|en)/:path*']
};
