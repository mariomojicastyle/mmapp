'use client';

import React from 'react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-32 px-4 bg-surface-light dark:bg-surface-dark text-center border-t border-border-light dark:border-border-dark">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-5xl font-bold mb-6">Solicitar una demostración</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Agenda una demostración personalizada para experimentar la plataforma 3D todo en uno en la que confían fábricas y minoristas líderes de todo el mundo.
        </p>
        <Link 
          href="#contacto" 
          className="bg-primary text-white py-5 px-14 rounded-full font-bold text-xl hover:bg-opacity-90 transition-opacity inline-block shadow-xl shadow-primary/30 transition-transform hover:scale-105"
        >
          Agendar Demostración
        </Link>
      </div>
    </section>
  );
}
