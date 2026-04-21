'use client';

import React from 'react';
import { motion } from 'framer-motion';

const mainBenefits = [
  {
    icon: 'trending_up',
    title: 'Escala para diversificar tu portafolio',
    description: 'Al digitalizar tus modelos, puedes crear rápidamente nuevas colecciones, probar variaciones en el mercado antes de fabricar e integrar un catálogo infinito sin los costos de almacenamiento físico.'
  },
  {
    icon: 'settings_suggest',
    title: 'Automatiza tus flujos de fábrica',
    description: 'Desbloquea experiencias a nivel local conectando el diseño con el piso de producción. Envía órdenes limpias y exactas directamente a tus máquinas, reduciendo errores humanos a cero.'
  },
  {
    icon: 'lightbulb',
    title: 'Desbloquea tus imágenes en todas partes',
    description: 'Aprovecha tus visuales 3D renderizadas en todas las fuentes de productos de manera eficiente, desde catálogos impresos de alta calidad hasta retargeting publicitario y redes sociales.'
  },
  {
    icon: 'sentiment_very_satisfied',
    title: 'Aumenta la satisfacción y ahorra',
    description: 'Los clientes entienden exactamente qué están comprando gracias al 3D interactivo y AR, lo que reduce drásticamente las devoluciones, mientras tú ahorras en tiempos de desarrollo de prototipos.'
  }
];

export default function MaximizePotential() {
  return (
    <section className="py-24 px-4 bg-background-light dark:bg-background-dark text-center">
      <div className="container mx-auto max-w-7xl">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-6"
        >
          Maximiza el beneficio y la eficiencia con Mario Mojica.
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-text-muted-light dark:text-text-muted-dark text-lg mb-20 max-w-3xl mx-auto leading-relaxed"
        >
          Impulsa las ganancias, mejora las experiencias de los clientes y escala operaciones de fábrica sin cuellos de botella.
        </motion.p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
          {mainBenefits.map((benefit, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col gap-6"
            >
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-surface-light dark:bg-surface-dark flex items-center justify-center border border-border-light dark:border-border-dark text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-3xl">{benefit.icon}</span>
              </div>
              <div>
                <h4 className="font-bold text-xl mb-3">{benefit.title}</h4>
                <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
