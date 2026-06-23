'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3003';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${
          isScrolled || isMenuOpen
            ? 'bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md shadow-lg py-3 text-text-light dark:text-text-dark border-b border-gray-200 dark:border-gray-800'
            : 'bg-primary py-4 text-white'
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between relative h-10">
          {/* Left Column: Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
            <Link href="#caracteristicas" className="hover:opacity-60 transition-all whitespace-nowrap">{t('Características', 'Features', 'Recursos')}</Link>
            <Link href="#demo" className="hover:opacity-60 transition-all whitespace-nowrap">{t('Demo', 'Demo', 'Demo')}</Link>
            <Link href="#contacto" className="hover:opacity-60 transition-all whitespace-nowrap">{t('Contacto', 'Contact', 'Contato')}</Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden flex items-center hover:opacity-60 transition-all z-50"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="material-symbols-outlined !text-3xl">
              {isMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500">
            <Link href="/" className="block">
              <div className={`relative h-7 md:h-9 w-40 transition-all duration-500 ${isScrolled || isMenuOpen ? 'brightness-100 dark:brightness-0 dark:invert' : 'brightness-0 invert'}`}>
                <Image
                  src="/Logo_Header.svg"
                  alt="Mario Mojica Logo"
                  fill
                  className="object-contain object-centerX"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Right Column: Actions & Language */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em]">
              <Link href={`${platformUrl}/login`} className="hover:opacity-60 transition-all">Login</Link>
              <Link 
                href="#contacto" 
                className={`px-6 py-2.5 rounded-full transition-all text-[11px] font-black uppercase tracking-[0.2em] shadow-lg ${
                  isScrolled || isMenuOpen
                    ? 'bg-primary text-white hover:bg-opacity-90'
                    : 'bg-white text-primary hover:bg-gray-100'
                }`}
              >
                {t('Prototipo Gratuito', 'Free Prototype', 'Protótipo Gratuito')}
              </Link>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <button 
                onClick={() => setLanguage('es')}
                className={`transition-opacity hover:opacity-100 cursor-pointer ${language === 'es' ? 'opacity-100 font-extrabold' : 'opacity-40'}`}
              >
                ES
              </button>
              <span className="opacity-20">/</span>
              <button 
                onClick={() => setLanguage('en')}
                className={`transition-opacity hover:opacity-100 cursor-pointer ${language === 'en' ? 'opacity-100 font-extrabold' : 'opacity-40'}`}
              >
                EN
              </button>
              <span className="opacity-20">/</span>
              <button 
                onClick={() => setLanguage('pt')}
                className={`transition-opacity hover:opacity-100 cursor-pointer ${language === 'pt' ? 'opacity-100 font-extrabold' : 'opacity-40'}`}
              >
                PT
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`fixed inset-0 bg-white z-[45] transition-transform duration-500 ease-in-out lg:hidden flex flex-col items-center justify-center gap-8 ${
          isMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <nav className="flex flex-col items-center gap-8 text-2xl font-black uppercase tracking-[0.2em] text-text-light">
          <Link onClick={() => setIsMenuOpen(false)} href="#caracteristicas" className="hover:text-primary transition-colors">{t('Características', 'Features', 'Recursos')}</Link>
          <Link onClick={() => setIsMenuOpen(false)} href="#demo" className="hover:text-primary transition-colors">{t('Demo', 'Demo', 'Demo')}</Link>
          <Link onClick={() => setIsMenuOpen(false)} href="#contacto" className="hover:text-primary transition-colors">{t('Contacto', 'Contact', 'Contato')}</Link>
          <Link onClick={() => setIsMenuOpen(false)} href={`${platformUrl}/login`} className="hover:text-primary transition-colors">Login</Link>
          <Link 
            onClick={() => setIsMenuOpen(false)}
            href="#contacto" 
            className="bg-primary text-white px-10 py-4 rounded-full text-xl shadow-xl active:scale-95 transition-all"
          >
            {t('Prototipo Gratuito', 'Free Prototype', 'Protótipo Gratuito')}
          </Link>
        </nav>
      </div>
    </>
  );
}
