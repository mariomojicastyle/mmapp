'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-black text-white py-32 px-4 text-center">
      <div className="container mx-auto max-w-4xl">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold mb-6 leading-tight tracking-tight"
        >
          La plataforma 3D todo en uno
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-300 mb-12 text-xl leading-relaxed max-w-2xl mx-auto"
        >
          Impulsa tus ventas creando, gestionando y distribuyendo visuales 3D de alta calidad a escala — todo desde una plataforma integral para la industria del mueble.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-row justify-center gap-6"
        >
          <Link 
            href="#contacto" 
            className="bg-primary text-white py-4 px-10 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-opacity"
          >
            Agendar Demo
          </Link>
          <Link 
            href="#precios" 
            className="border-2 border-white text-white py-4 px-10 rounded-full font-semibold text-lg hover:bg-white hover:text-black transition-colors"
          >
            Ver Precios
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
