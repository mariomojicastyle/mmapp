'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function ProcessVideo() {
  return (
    <section className="bg-[#111] text-white py-32 px-4 text-center">
      <div className="container mx-auto max-w-5xl">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl font-bold mb-12"
        >
          Maximiza el potencial de tu fábrica.
        </motion.h2>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="aspect-video bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 relative shadow-2xl cursor-pointer group"
        >
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKdmhepECZ48ZLhwuiVB9fiYGWBARh2SkcoITTuE7U4ozhKOJPPn159u4RrL4M3FRAwW8OQ4yyLQWvzv5dhD1z-WEH918TaiQRMgTDL-qElC0ADBycudMcTj1uOXyxyTV0Vkr3fzIpBIrI753EjOZUtwT43sqVxV8kfl7QXoaEIYY7QuewJnD55D2azPAMnUMKNBfn_SPj7G4TVTD5MSMJX0VW5rd-MTLxFH-bjv3dVNItZu4KF7dONZIBZXX3hLGLQUksrkLR2GU"
            alt="Factory layout"
            fill
            className="object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(0,136,170,0.6)] group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-5xl ml-2">play_arrow</span>
            </div>
          </div>
          <div className="absolute bottom-8 left-8 text-left">
            <p className="text-2xl font-bold">Descubre cómo transformamos la industria</p>
            <p className="text-gray-300">Video corporativo • 2 min</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
