'use client';

import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  {
    icon: 'gavel',
    value: '0%',
    label: 'De fricción por la resistencia al cambio'
  },
  {
    icon: 'directions_run',
    value: '+90%',
    label: 'De mejora en la eficiencia para la generación de los planos de fabricación'
  },
  {
    icon: 'schedule',
    value: '-85%',
    label: 'Ahorro en tiempo para el desarrollo de nuevos productos'
  },
  {
    icon: 'settings',
    value: '3x',
    label: 'Menos tiempo gestionando archivos técnicos'
  },
  {
    icon: 'receipt_long',
    value: '100%',
    label: 'De visibilidad de costos en la etapa de Diseño'
  }
];

export default function WhyChoose() {
  return (
    <section className="py-24 px-4 bg-background-light dark:bg-background-dark text-center border-b border-border-light dark:border-border-dark">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold mb-6">¿Por qué elegir a Mario Mojica?</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark text-lg mb-20 max-w-3xl mx-auto leading-relaxed">
          Somos el aliado estratégico que automatiza la creación de tus muebles, desde el primer trazo hasta el marketing en tu sitio web de cliente. Mario Mojica automatiza tus insumos de fabricación y eleva la experiencia del usuario online para incrementar tus ventas.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center text-primary border border-border-light dark:border-border-dark mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-4xl">{stat.icon}</span>
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark px-2">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20">
          <Link 
            href="#contacto" 
            className="bg-primary text-white py-4 px-12 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-opacity inline-block"
          >
            Ver la diferencia
          </Link>
        </div>
      </div>
    </section>
  );
}

// Helper to keep Link working if needed, but I'll import it correctly below
import Link from 'next/link';
