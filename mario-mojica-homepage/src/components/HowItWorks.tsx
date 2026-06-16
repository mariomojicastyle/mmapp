'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-surface-light dark:bg-surface-dark text-center border-y border-border-light dark:border-border-dark">
      <div className="container mx-auto max-w-5xl">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-6"
        >
          Cómo funciona.
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-text-muted-light dark:text-text-muted-dark text-lg mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Partimos de la creación de muebles tipo paramétrico y modular. Nuestro software exclusivo procesa este diseño inteligente y genera automáticamente toda la documentación técnica para tu fábrica, así como un ecosistema completo de materiales de marketing para vender online de forma espectacular.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 rounded-2xl overflow-hidden shadow-2xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-6"
        >
          <div className="flex gap-4 h-96">
            <div className="w-1/2 relative rounded-xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-500">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuACyTKIws-423hYl40pt8TEB5h5iRLSY6-Q0hD0B-JaNcKzs2lLgz2HZ6cju-d0GuWsZ7XuqTyg07c0VyvYsZ-FfCgekaA-8eTMokmVXqCyzt27c0ApJF1x6PY0Oj1X-fqZBfxAOOlf_QbeMT30pKrhn2w8Dx_Wb5WqyP67oYdX6mYB9d10XSGQjgbQavHa9s_LoC6-Ww_GtYMxPSDWQg-buDeFPVVZDgEueiZlx4SZnhp6PTNc43hO6npd0Ojhg7R92sMTrMEEDeg"
                alt="Abstract furniture rendering"
                fill
                className="object-cover"
              />
            </div>
            <div className="w-1/2 relative rounded-xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-500">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjCJiVrOVqSuEqW29q7UxeBDTeNEJPbN0AYXEI5aLvcyJLCP_CBIOIxobvBWQdCaCewB3wwdMohlSMc_-AhWBsvqAs6t8vBdApCUXuAvFDRSrU7ixMwNGtsMEekiLgp0c1VAKz3Bb3lPZtqvZj54gKyZEIkOQUr5Wf3NUStZ4Xlt03Q1lRJa3AxujWVdYVClVon6Pmh-YhuQONCERn8QMAtlij23dg_XIjCo_VsecvLCljdSvmfzKjBgCoa3ccddbvOxn8bnVY4uA"
                alt="Abstract 3D design"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>

        <Link 
          href="#contacto" 
          className="bg-primary text-white py-4 px-12 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-opacity inline-block shadow-lg shadow-primary/20"
        >
          Saber más
        </Link>
      </div>
    </section>
  );
}
