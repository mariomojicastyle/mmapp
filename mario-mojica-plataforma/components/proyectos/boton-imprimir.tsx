"use client";

export default function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
    >
      <span className="material-symbols-outlined text-base">print</span>
      Imprimir Reporte (PDF)
    </button>
  );
}
