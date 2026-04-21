'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-white py-20 px-4 border-t border-gray-900">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 border-b border-gray-800 pb-16">
          <div className="col-span-1 md:col-span-4">
            <div className="mb-8">
              <div className="relative h-12 w-48 mb-6 brightness-0 invert">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCm1RoRrRYB0QwLav-WyKXyUWtkvfWoiwRZ2GX5XKfZgQOBf0UkAaS5OQeFer8fPiy0LDMYvPcsiFOeDrZ9O6j1NE3KFLcgCAMLIfHJHV36N5LIRPosaBtN9aPb6w3eAjcqACWMyF63LTX_TKVcbvhIA3v7kjeJoG3P29uYBZFNghRTrvPkx9ariLcWnQOWqYnlJAqHCvzhUGN45THdCQCA-0OQDnLJPHUhflJEUMkq7G3r4tEsgBVCT5zExuOJ-WLFBLXNdInt5cU"
                  alt="Mario Mojica Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-bold mb-3">Mario Mojica - La mejor plataforma para llevar su fábrica a la Industria 4.0.</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Te brindamos lo último en tecnología de visualización de productos, diseño paramétrico y automatización de fabricación — un líder mundial transformando la industria del mueble desde adentro hacia afuera.
              </p>
            </div>
            
            <div className="mt-8">
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Suscríbete a nuestro boletín</h4>
              <form className="flex gap-3">
                <input 
                  className="w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-white px-4 py-3 focus:ring-primary focus:border-primary focus:outline-none" 
                  placeholder="Tu email corporativo*" 
                  type="email" 
                />
                <button 
                  className="bg-primary hover:bg-opacity-90 text-white py-3 px-6 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
                  type="submit"
                >
                  Suscribirse
                </button>
              </form>
              <p className="text-xs text-gray-600 mt-3">
                Puedes optar por salir en cualquier momento. Lee nuestra <Link className="text-primary hover:underline" href="#">Política de Privacidad</Link>.
              </p>
            </div>
          </div>

          <div className="col-span-1 md:col-span-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h5 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Plataforma</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link className="hover:text-primary transition-colors" href="#">Por qué Mario Mojica</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Cómo funciona</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Industria 4.0</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Casos de uso</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Precios</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Productos</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link className="hover:text-primary transition-colors" href="#">Renders 4K</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Videos Cinemáticos</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Diseñador Modular</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Curador 3D</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Realidad Aumentada</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Planos Automáticos</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Integración CNC</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Compañía</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link className="hover:text-primary transition-colors" href="#">Acerca de</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Eventos</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Contáctanos</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Carreras</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Noticias de Prensa</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Recursos</h5>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li><Link className="hover:text-primary transition-colors" href="#">Historias de éxito</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Centro de Aprendizaje</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Blog de la Industria</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Guías y E-books</Link></li>
                  <li><Link className="hover:text-primary transition-colors" href="#">Soporte Técnico</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-6">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <p>© 2024 Mario Mojica. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link className="hover:text-white transition-colors" href="#">Términos de Servicio</Link>
              <Link className="hover:text-white transition-colors" href="#">Aviso de Privacidad</Link>
              <Link className="hover:text-white transition-colors" href="#">Configuración de Cookies</Link>
            </div>
          </div>
          
          <div className="flex gap-4">
            {['facebook', 'twitter', 'linkedin'].map((social) => (
              <Link 
                key={social}
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-primary hover:border-primary text-gray-400 hover:text-white transition-all"
              >
                <span className="sr-only">{social}</span>
                {/* SVG icons would go here, using generic ones from the subagent logic earlier */}
                <span className="material-symbols-outlined text-xl">share</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
