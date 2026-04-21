'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const benefits = [
  {
    title: 'Híper-realista',
    description: 'Activos digitales de alta poligonización optimizados en tiempo real para imágenes 4K asombrosas.'
  },
  {
    title: 'Personalizaciones dinámicas',
    description: 'Muestra miles de variaciones de tapicería, acabados de madera y herrajes al instante.'
  },
  {
    title: 'Módulos inmersivos',
    description: 'Generación de vistas de 360 grados, modelos AR para probar en casa y visores 3D embebidos.'
  },
  {
    title: 'Adaptable a móviles y Puntos de Venta',
    description: 'Soporta todos los dispositivos móviles, iPads para comerciales en tienda y pantallas interactivas de gran formato.'
  }
];

export default function CurationSection() {
  return (
    <section className="py-24 px-4 bg-surface-light dark:bg-surface-dark border-y border-border-light dark:border-border-dark">
      <div className="container mx-auto max-w-7xl flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left: Configurator Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="w-full lg:w-1/2"
        >
          <div className="bg-background-light dark:bg-background-dark rounded-2xl border border-border-light dark:border-border-dark p-8 shadow-xl">
            <div className="flex justify-center gap-4 mb-6 border-b border-border-light dark:border-border-dark pb-6 overflow-x-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-20 h-20 bg-surface-light dark:bg-surface-dark rounded-lg border-2 ${i === 1 ? 'border-primary' : 'border-border-light dark:border-border-dark'} cursor-pointer hover:border-primary transition-colors flex-shrink-0`} />
              ))}
            </div>
            
            <div className="aspect-square bg-surface-light dark:bg-surface-dark rounded-xl mb-6 flex items-center justify-center relative overflow-hidden group">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuACyTKIws-423hYl40pt8TEB5h5iRLSY6-Q0hD0B-JaNcKzs2lLgz2HZ6cju-d0GuWsZ7XuqTyg07c0VyvYsZ-FfCgekaA-8eTMokmVXqCyzt27c0ApJF1x6PY0Oj1X-fqZBfxAOOlf_QbeMT30pKrhn2w8Dx_Wb5WqyP67oYdX6mYB9d10XSGQjgbQavHa9s_LoC6-Ww_GtYMxPSDWQg-buDeFPVVZDgEueiZlx4SZnhp6PTNc43hO6npd0Ojhg7R92sMTrMEEDeg"
                alt="Furniture Configurator"
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-md backdrop-blur-sm">
                <span className="material-symbols-outlined text-[18px]">360</span> Vista Interactiva 3D
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm font-bold mb-3 uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Selecciona Variante:</div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-800 border-2 border-primary cursor-pointer ring-2 ring-transparent" />
                <div className="w-8 h-8 rounded-full bg-yellow-600 border border-transparent cursor-pointer" />
                <div className="w-8 h-8 rounded-full bg-yellow-300 border border-transparent cursor-pointer" />
              </div>
            </div>

            <div>
              <div className="text-sm font-bold mb-3 uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Selecciona Tapicería:</div>
              <div className="flex flex-wrap gap-3">
                {['bg-teal-700', 'bg-gray-500', 'bg-red-800', 'bg-pink-300', 'bg-teal-500', 'bg-yellow-500', 'bg-blue-300'].map((color, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full ${color} border ${i === 0 ? 'border-primary border-2' : 'border-border-light dark:border-border-dark'} shadow-inner cursor-pointer hover:scale-110 transition-transform`} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Text and Benefits */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="w-full lg:w-1/2"
        >
          <h2 className="text-4xl font-bold mb-6">El Curador perfecto para Fábricas y Carpinteros.</h2>
          <p className="text-text-muted-light dark:text-text-muted-dark text-lg mb-10 leading-relaxed">
            Empodera a tus distribuidores, tiendas físicas y clientes finales con una experiencia interactiva perfecta. Todo sincronizado desde el mismo núcleo de diseño de tu fábrica.
          </p>
          
          <ul className="space-y-6">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex gap-4 items-start">
                <span className="material-symbols-outlined text-primary text-2xl mt-1">check_circle</span>
                <div>
                  <strong className="block text-xl mb-1">{benefit.title}</strong>
                  <span className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                    {benefit.description}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
