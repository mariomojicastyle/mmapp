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
          <span className="border border-primary/50 text-primary text-xs uppercase tracking-widest px-4 py-1.5 rounded-full inline-block font-semibold bg-primary/10">
            {t(
              'DESARROLLO DE SOFTWARE DE MANUFACTURA | INDUSTRIA 4.0',
              'MANUFACTURING SOFTWARE DEVELOPMENT | INDUSTRY 4.0',
              'DESENVOLVIMENTO DE SOFTWARE PARA MANUFATURA | INDÚSTRIA 4.0'
            )}
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={fadeUp}
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-white"
        >
          {t(
            'Software especializado para la Industria de Manufactura de Muebles',
            'Specialized Software for the Furniture Manufacturing Industry',
            'Software especializado para a Indústria de Manufatura de Móveis'
          )}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="text-gray-300 mb-12 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto"
        >
          {t(
            'Desarrollamos software para la manufactura de muebles. Escalamos tus procesos de fabricación y creamos para tus clientes una experiencia memorable desde la compra hasta el uso.',
            'We develop software for furniture manufacturing. We scale your manufacturing processes and create a memorable experience for your customers from purchase to use.',
            'Desenvolvemos software para a manufatura de móveis. Escalamos seus processos de fabricação e criamos para seus clientes uma experiência memorável desde a compra até o uso.'
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
            className="bg-primary text-white py-4 px-9 rounded-full font-semibold text-lg hover:bg-opacity-90 shadow-xl shadow-primary/30 hover:scale-105 transition-all duration-300"
          >
            {t('Ver Demo 3D en Vivo', 'View Live 3D Demo', 'Ver Demo 3D ao Vivo')}
          </Link>
          <Link
            href="#contacto"
            className="border-2 border-white/80 text-white py-4 px-9 rounded-full font-semibold text-lg hover:bg-white hover:text-black transition-colors duration-300"
          >
            {t('Solicitar Prototipo', 'Request Prototype', 'Solicitar Protótipo')}
          </Link>
        </motion.div>

        {/* Subtle note */}
        <motion.p
          variants={fadeUp}
          className="text-gray-400 text-sm font-medium"
        >
          {t(
            'Sin apps. Sin descargas. Funciona directo desde el navegador.',
            'No apps. No downloads. Works right in the browser.',
            'Sem apps. Sem downloads. Funciona direto no navegador.'
          )}
        </motion.p>
      </motion.div>
    </section>
  );
}
