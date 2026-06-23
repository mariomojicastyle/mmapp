'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3003';

  return (
    <footer className="bg-[#0a0a0a] text-white py-20 px-4 border-t border-gray-900">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 border-b border-gray-800 pb-16">
          <div className="col-span-1 md:col-span-4">
            <div className="mb-8">
              <div className="relative w-12 h-12 mb-6">
                <Image
                  src="/Logosimbolo.svg"
                  alt="Mario Mojica Logosímbolo"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('El fin de los manuales confusos', 'The end of confusing manuals')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('Transformamos los manuales de ensamble en experiencias 3D interactivas. Menos devoluciones, menos llamadas a soporte, más clientes felices.', 'We transform assembly manuals into interactive 3D experiences. Fewer returns, fewer support calls, more happy customers.')}
              </p>
            </div>
          </div>

          <div className="col-span-1 md:col-span-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h5 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">{t('Plataforma', 'Platform')}</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Por qué Mario Mojica', 'Why Mario Mojica')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Cómo funciona', 'How it works')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Industria 4.0', 'Industry 4.0')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Métricas & PDF', 'Metrics & PDF')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Portal B2B', 'B2B Portal')}</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">{t('Características', 'Features')}</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link className="hover:text-primary transition-colors" href="#caracteristicas">{t('Audio Guía (TTS)', 'Audio Guide (TTS)')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#caracteristicas">{t('Realidad Aumentada', 'Augmented Reality')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#caracteristicas">{t('Herrajes en 3D', '3D Hardware')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#caracteristicas">{t('Personalización B2B', 'B2B Customization')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#caracteristicas">{t('Códigos QR', 'QR Codes')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#caracteristicas">{t('Escenario Fotorrealista', 'Photorealistic Scene')}</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">{t('Compañía', 'Company')}</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Acerca de', 'About')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#contacto">{t('Contáctanos', 'Contact us')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Carreras', 'Careers')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Noticias', 'News')}</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">{t('Recursos', 'Resources')}</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Historias de éxito', 'Success stories')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#demo">{t('Manual de Muestra', 'Sample Manual')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Blog de la Industria', 'Industry Blog')}</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">{t('Soporte Técnico', 'Technical Support')}</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-6">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <p>{t('© 2024 Mario Mojica. Todos los derechos reservados.', '© 2024 Mario Mojica. All rights reserved.')}</p>
            <div className="flex gap-6">
              <Link className="hover:text-white transition-colors" href={`${platformUrl}/terms`}>{t('Términos de Servicio', 'Terms of Service')}</Link>
              <Link className="hover:text-white transition-colors" href={`${platformUrl}/privacy`}>{t('Aviso de Privacidad', 'Privacy Notice')}</Link>
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))} className="hover:text-white transition-colors text-left">{t('Configuración de Cookies', 'Cookie Settings')}</button>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: t('Mario Mojica - Manuales de Armado Interactivos 3D', 'Mario Mojica - 3D Interactive Assembly Manuals'),
                    text: t('Guías 3D interactivas con audio paso a paso para fabricantes de muebles RTA.', 'Interactive 3D guides with step-by-step audio for RTA furniture manufacturers.'),
                    url: window.location.href,
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert(t('¡Enlace copiado al portapapeles!', 'Link copied to clipboard!'));
                }
              }}
              className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-primary hover:border-primary text-gray-400 hover:text-white transition-all cursor-pointer"
              title={t('Compartir esta página', 'Share this page')}
            >
              <span className="sr-only">{t('Compartir', 'Share')}</span>
              <span className="material-symbols-outlined text-xl">share</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
