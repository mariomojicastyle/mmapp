'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Siempre requerido para renderizado WebGL/3D
    analytics: true, // Telemetría de armado
  });

  useEffect(() => {
    // Comprobar si ya se guardó la preferencia
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Retrasar la visualización 1.5s
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Escuchar evento personalizado para abrir el modal desde el footer
  useEffect(() => {
    const handleOpenCookies = () => setIsOpen(true);
    window.addEventListener('open-cookie-settings', handleOpenCookies);
    return () => window.removeEventListener('open-cookie-settings', handleOpenCookies);
  }, []);

  const handleSave = (all = false) => {
    const consentValue = all 
      ? { essential: true, analytics: true } 
      : preferences;
    
    localStorage.setItem('cookie-consent', JSON.stringify(consentValue));
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-lg bg-surface-dark border border-border-dark rounded-2xl p-6 md:p-8 shadow-2xl text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">cookie</span>
              <h3 className="text-xl font-bold">Configuración de Cookies</h3>
            </div>
            
            <p className="text-text-muted-dark text-sm leading-relaxed mb-6">
              Utilizamos cookies técnicas y almacenamiento local esenciales para cargar los modelos 3D y renderizar correctamente el visor WebGL, así como telemetría anónima opcional para medir las tasas de completitud de armado.
            </p>

            <div className="space-y-4 mb-6">
              {/* Essential */}
              <div className="flex items-start justify-between gap-4 p-3 bg-background-dark/50 border border-border-dark/50 rounded-xl">
                <div>
                  <h4 className="font-semibold text-sm">Cookies Técnicas Esenciales</h4>
                  <p className="text-xs text-text-muted-dark mt-1">Necesarias para el motor 3D y la persistencia de pasos de armado.</p>
                </div>
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={preferences.essential}
                    disabled
                    className="w-4 h-4 rounded text-primary focus:ring-primary/50 bg-[#0a0a0a] border-border-dark"
                  />
                  <span className="text-xs text-primary font-bold ml-2">Obligatorio</span>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 p-3 bg-background-dark/50 border border-border-dark/50 rounded-xl">
                <div>
                  <h4 className="font-semibold text-sm">Telemetría y Rendimiento (Opcional)</h4>
                  <p className="text-xs text-text-muted-dark mt-1">Ayuda a los fabricantes a detectar herrajes con problemas de ensamble y pasos con alta fricción.</p>
                </div>
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary focus:ring-offset-0 bg-[#0a0a0a] border-border-dark cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleSave(true)}
                className="flex-1 bg-primary text-white py-3 rounded-full font-bold text-sm hover:bg-opacity-90 transition-all cursor-pointer text-center"
              >
                Aceptar todas
              </button>
              <button
                onClick={() => handleSave(false)}
                className="flex-1 border border-border-dark text-white py-3 rounded-full font-bold text-sm hover:bg-white hover:text-black transition-all cursor-pointer text-center"
              >
                Guardar selección
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
