'use client';

import React from 'react';

export default function Brands() {
  return (
    <section className="bg-surface-light dark:bg-surface-dark py-12 px-4 border-b border-border-light dark:border-border-dark">
      <div className="container mx-auto flex justify-center items-center gap-16 opacity-60 flex-wrap">
        <span className="text-3xl font-serif italic font-bold">SWOON</span>
        <span className="text-2xl font-sans font-bold uppercase tracking-widest">Loaf</span>
        <span className="text-3xl font-serif font-bold tracking-widest">YARDISTRY</span>
        <span className="text-2xl font-sans font-bold uppercase tracking-widest">Century</span>
        <span className="text-2xl font-serif font-bold tracking-wider">LIVING SPACES</span>
      </div>
    </section>
  );
}
