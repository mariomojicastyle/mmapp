'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function HeroManual() {
  const { t } = useLanguage();

  return (
    <section className="bg-gradient-to-b from-black to-[#0a1a1f] text-white py-32 md:py-40 px-4 text-center">
      <motion.div
        className="container mx-auto max-w-4xl"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="mb-8">
          <span className="border border-primary/50 text-primary text-xs uppercase tracking-widest px-4 py-1 rounded-full inline-block">
            {t('Industria 4.0', 'Industry 4.0', 'Indústria 4.0')}
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={fadeUp}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight"
        >
          {t('El fin de las devoluciones por armado defectuoso', 'The end of returns due to faulty assembly', 'O fim das devoluções por montagem defeituosa')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="text-gray-300 mb-12 text-xl leading-relaxed max-w-2xl mx-auto"
        >
          {t(
            'Guías 3D interactivas con audio paso a paso y Realidad Aumentada. Diseñado para fabricantes de muebles listos para armar.',
            'Interactive 3D guides with step-by-step audio and Augmented Reality. Designed for ready-to-assemble furniture manufacturers.',
            'Guias 3D interativos com áudio passo a passo e Realidade Aumentada. Projetado para fabricantes de móveis prontos para montar.'
          )}
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-6"
        >
          <Link
            href="#demo"
            onClick={(e) => {
              if (typeof window !== "undefined" && (window as any).__triggerLiveDemoFullscreen) {
                e.preventDefault();
                (window as any).__triggerLiveDemoFullscreen();
              }
            }}
            className="bg-primary text-white py-4 px-10 rounded-full font-semibold text-lg hover:bg-opacity-90 shadow-xl shadow-primary/30 hover:scale-105 transition-all duration-300"
          >
            {t('Ver Demo Interactiva', 'View Interactive Demo', 'Ver Demo Interativa')}
          </Link>
          <Link
            href="#contacto"
            className="border-2 border-white text-white py-4 px-10 rounded-full font-semibold text-lg hover:bg-white hover:text-black transition-colors duration-300"
          >
            {t('Prototipo Gratuito', 'Free Prototype', 'Protótipo Gratuito')}
          </Link>
        </motion.div>

        {/* Subtle note */}
        <motion.p
          variants={fadeUp}
          className="text-gray-500 text-sm"
        >
          {t(
            'Sin apps. Sin descargas. Funciona desde el navegador.',
            'No apps. No downloads. Works right in the browser.',
            'Sem apps. Sem downloads. Funciona direto no navegador.'
          )}
        </motion.p>
      </motion.div>
    </section>
  );
}
