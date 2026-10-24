"use client";

import React, { useState, useRef, useEffect } from "react";
import { use3BFStore } from "@/lib/store";
import { Eye, EyeOff, Zap } from "lucide-react";

export default function FunctionalBlocksVisibilityCard() {
  const {
    pasosManual,
    pasoActivoManualId,
    conmutarVisibilidadTodosGruposCinematicos,
    conmutarVisibilidadGrupoCinematico,
    cargarBloqueFuncionalEnPaso,
  } = use3BFStore();

  const pasoP00 = pasosManual.find((p) => p.id === "P00" || p.tipo === "showcase");
  const bloques = pasoP00?.showcase?.gruposCinematicos || [];

  // Altura inicial persistida
  const [alturaBloquesPx, setAlturaBloquesPx] = useState<number>(260);
  const [arrastrando, setArrastrando] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(260);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("3bf_bloques_funcionales_height");
      if (stored) {
        const val = Number(stored);
        if (!isNaN(val) && val >= 90 && val <= 1200) {
          setAlturaBloquesPx(val);
          if (listRef.current) {
            listRef.current.style.height = `${val}px`;
            listRef.current.style.maxHeight = `${val}px`;
          }
        }
      }
    }
  }, []);

  // Control 60 FPS ultra-fluido por manipulación directa del DOM (cero re-renders durante el arrastre)
  const handleStartResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setArrastrando(true);
    dragStartYRef.current = e.clientY;
    const currentH = listRef.current ? listRef.current.clientHeight : alturaBloquesPx;
    startHeightRef.current = currentH;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !listRef.current) return;
    const deltaY = e.clientY - dragStartYRef.current;
    const nuevaAltura = Math.max(90, Math.min(1200, Math.round(startHeightRef.current + deltaY)));
    listRef.current.style.height = `${nuevaAltura}px`;
    listRef.current.style.maxHeight = `${nuevaAltura}px`;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setArrastrando(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (listRef.current) {
      const h = parseInt(listRef.current.style.height, 10);
      if (!isNaN(h)) {
        setAlturaBloquesPx(h);
        if (typeof window !== "undefined") {
          localStorage.setItem("3bf_bloques_funcionales_height", String(h));
        }
      }
    }
  };

  if (bloques.length === 0) return null;

  const algunOculto = bloques.some((g) => g.oculto);
  const pasoEsArmable = pasoActivoManualId && pasoActivoManualId !== "P00";

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
      {/* Cabecera compacta */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs">🗄️</span>
          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
            Bloques Funcionales ({bloques.length})
          </span>
          <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
            P00
          </span>
        </div>

        {/* Botón Maestro: Ocultar / Mostrar Todos */}
        <button
          type="button"
          onClick={() => pasoP00 && conmutarVisibilidadTodosGruposCinematicos(pasoP00.id, !algunOculto)}
          className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold border transition flex items-center gap-1 cursor-pointer shrink-0 ${
            algunOculto
              ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
          }`}
          title={algunOculto ? "Mostrar todos los bloques funcionales en 3D" : "Ocultar todos los bloques funcionales en 3D para despejar el ensamble"}
        >
          {algunOculto ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>{algunOculto ? "Mostrar Todos" : "Ocultar Todos"}</span>
        </button>
      </div>

      {/* Lista de Bloques Funcionales con altura ultra-fluida */}
      <div
        ref={listRef}
        style={{ height: `${alturaBloquesPx}px`, maxHeight: `${alturaBloquesPx}px` }}
        className="flex flex-col gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 overflow-y-auto pr-0.5 custom-scrollbar"
      >
        {bloques.map((grupo) => {
          const esPuerta = grupo.tipo === "puerta";
          const estaOculto = Boolean(grupo.oculto);

          return (
            <div
              key={grupo.id}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-full border transition ${
                estaOculto
                  ? "bg-amber-500/5 border-amber-500/30 opacity-70"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-xs shrink-0 select-none">
                  {esPuerta ? "🚪" : "🗄️"}
                </span>
                <span className="font-semibold text-[10.5px] text-slate-800 dark:text-slate-100 truncate">
                  {grupo.nombre}
                </span>
                <span className="text-[9px] opacity-60 shrink-0 font-mono">
                  ({grupo.piezas.length} pzas)
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* 🚀 BOTÓN 1 CLIC: Armar en este paso */}
                {pasoEsArmable && (
                  <button
                    type="button"
                    onClick={() => cargarBloqueFuncionalEnPaso(pasoActivoManualId, grupo.id)}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-[#0088AA] hover:bg-[#007799] dark:bg-[#1368AA] dark:hover:bg-[#115b94] border border-cyan-400/40 transition cursor-pointer shadow-2xs active:scale-95"
                    title={`Asignar todas las piezas de ${grupo.nombre} a ${pasoActivoManualId} como capa limpia y despejar el banco`}
                  >
                    <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                    <span>Armar en {pasoActivoManualId}</span>
                  </button>
                )}

                {/* Botón Ojito por bloque */}
                <button
                  type="button"
                  onClick={() => pasoP00 && conmutarVisibilidadGrupoCinematico(pasoP00.id, grupo.id)}
                  title={estaOculto ? "Mostrar este bloque en 3D" : "Ocultar este bloque en 3D"}
                  className={`p-1 rounded-full transition shrink-0 cursor-pointer border ${
                    estaOculto
                      ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-400 hover:text-cyan-500 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {estaOculto ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ↕️ Franja inferior simple y ultra-fluida (sin textos ni adornos pesados) */}
      <div
        onPointerDown={handleStartResize}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Arrastra para ajustar la altura"
        className="w-full py-1.5 flex items-center justify-center cursor-ns-resize select-none group"
      >
        <div
          className={`w-14 h-1 rounded-full transition-colors ${
            arrastrando
              ? "bg-[#0088AA] dark:bg-[#1368AA]"
              : "bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-500"
          }`}
        />
      </div>
    </div>
  );
}
