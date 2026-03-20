import {getRequestConfig} from 'next-intl/server';
import {routing} from './navigation';
 
export default getRequestConfig(async ({requestLocale}) => {
  // Tomamos el locale actual o el por defecto
  let locale = await requestLocale;
 
  // Nos aseguramos de que el locale esté soportado
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
