"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { Plus, Sparkles } from "lucide-react";
import ModalCrearPaso from "./ModalCrearPaso";

export default function LienzoPasoVirgen() {
  const { coloresApariencia } = use3BFStore();
  const [modalAbierto, setModalAbierto] = useState(false);

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
      {/* 🏷️ Modal Flotante Unificado con React Portal */}
      <ModalCrearPaso
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        tipoInicialSugerido="presentacion"
      />

      <div className="max-w-xs flex flex-col items-center gap-4 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shadow-xs">
        <div
          style={{ backgroundColor: `${botonActivoColor}15`, color: botonActivoColor }}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-xs"
        >
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            Manual en Estado Virgen
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Este mueble aún no tiene pasos de armado definidos. Comienza agregando tu primer paso.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          style={{ backgroundColor: botonActivoColor }}
          className="w-full py-2.5 px-5 rounded-full text-white font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Primer Paso</span>
        </button>
      </div>
    </div>
  );
}
