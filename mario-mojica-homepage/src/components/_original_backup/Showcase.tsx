'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Showcase() {
  return (
    <section className="py-24 px-4 bg-background-light dark:bg-background-dark">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Galería de Inspiración</h2>
        
        <div className="flex flex-col space-y-8">
          {/* Main large image */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="h-[500px] w-full rounded-2xl overflow-hidden shadow-lg relative group cursor-pointer"
          >
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYfTmk9de54GD5sF4c_WFR8ZczkXrNOS5jSdMK3j2sl8J63gjTiEhiNFZjQUrj0XtXtsVqFB18D9Mkrx87sSI81EibdOfco6_tjVylTTrmYcy3rLTBCOr_tK0W-z2J1Uq16r2pODB6rqKTAy7Phh-kn9pXHUuEMGIHDCPmTeWgj-1NkZ1d_7j4cBE8dlKB2dYGmhv1YwOh4omOYzreCqNL7PviMNzL3kFnKHAE5jTTC6sE35vvvkGY8vemXDE47WjUkAxN8tqsbQk"
              alt="High end furniture render"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-2">Colección Nórdica</h3>
                <p>Renderizado 100% digital creado con Mario Mojica</p>
              </div>
            </div>
          </motion.div>

          {/* Side by side images */}
          <div className="flex flex-col md:flex-row gap-8 h-auto md:h-[400px]">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full md:w-1/2 h-[400px] relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
            >
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuACyTKIws-423hYl40pt8TEB5h5iRLSY6-Q0hD0B-JaNcKzs2lLgz2HZ6cju-d0GuWsZ7XuqTyg07c0VyvYsZ-FfCgekaA-8eTMokmVXqCyzt27c0ApJF1x6PY0Oj1X-fqZBfxAOOlf_QbeMT30pKrhn2w8Dx_Wb5WqyP67oYdX6mYB9d10XSGQjgbQavHa9s_LoC6-Ww_GtYMxPSDWQg-buDeFPVVZDgEueiZlx4SZnhp6PTNc43hO6npd0Ojhg7R92sMTrMEEDeg"
                alt="Detail render"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-1">Texturas en Alta Definición</h3>
                  <p className="text-sm">Acabados hiper-realistas</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full md:w-1/2 h-[400px] relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
            >
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjCJiVrOVqSuEqW29q7UxeBDTeNEJPbN0AYXEI5aLvcyJLCP_CBIOIxobvBWQdCaCewB3wwdMohlSMc_-AhWBsvqAs6t8vBdApCUXuAvFDRSrU7ixMwNGtsMEekiLgp0c1VAKz3Bb3lPZtqvZj54gKyZEIkOQUr5Wf3NUStZ4Xlt03Q1lRJa3AxujWVdYVClVon6Pmh-YhuQONCERn8QMAtlij23dg_XIjCo_VsecvLCljdSvmfzKjBgCoa3ccddbvOxn8bnVY4uA"
                alt="Modular system"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-1">Sistemas Modulares</h3>
                  <p className="text-sm">Configuración infinita en tiempo real</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
