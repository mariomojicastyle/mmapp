'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (esVal: string, enVal: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Intentar cargar idioma guardado
    const savedLang = localStorage.getItem('preferred-language') as Language;
    if (savedLang === 'es' || savedLang === 'en') {
      setTimeout(() => setLanguageState(savedLang), 0);
    } else {
      // 2. Detección automática basada en el idioma del navegador
      const browserLang = navigator.language || 'es';
      if (!browserLang.toLowerCase().startsWith('es')) {
        setLanguageState('en');
      }
    }
    setIsLoaded(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred-language', lang);
  };

  // Función helper rápida para traducir textos inline
  const t = (esVal: string, enVal: string): string => {
    return language === 'es' ? esVal : enVal;
  };

  // Evitar parpadeos de hidratación mostrando la versión por defecto del servidor (es)
  // hasta que el cliente determine el idioma adecuado
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div style={{ opacity: isLoaded ? 1 : 0.99, transition: 'opacity 0.2s' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
