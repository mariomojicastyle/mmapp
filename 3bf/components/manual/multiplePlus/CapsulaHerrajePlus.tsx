"use client";

import React from "react";
import { Snowflake, X } from "lucide-react";
import { HerrajeCapaPlus } from "@/lib/storeTypes";

interface CapsulaHerrajePlusProps {
  herraje: HerrajeCapaPlus;
  capaId: string;
  pasoId: string;
  esCongelado?: boolean;
  onHover: (mallas: string[] | null) => void;
  onActualizar: (herrajeId: string, partial: Partial<HerrajeCapaPlus>) => void;
  onRemover: (herrajeId: string) => void;
  onToggleCongelar: (herrajeId: string) => void;
}

export function CapsulaHerrajePlus({
  herraje,
  capaId,
  pasoId,
  esCongelado = false,
  onHover,
  onActualizar,
  onRemover,
  onToggleCongelar,
}: CapsulaHerrajePlusProps) {
  // 🛡️ Al desmontar la cápsula (por ejemplo al eliminarla), limpiar el hover inmediatamente
  React.useEffect(() => {
    return () => {
      onHover(null);
    };
  }, [onHover]);

  // 1. ⏱️ Estado local para segundo de aparición física en escena
  const [textoAparicion, setTextoAparicion] = React.useState<string>(() =>
    herraje.tiempoAparicion !== undefined && herraje.tiempoAparicion !== null
      ? String(herraje.tiempoAparicion)
      : "0"
  );
  const [editandoAparicion, setEditandoAparicion] = React.useState(false);

  // 2. 💡 Estado local para duración del destello (0s = inactivo / azul tenue, >0s = amarillo)
  const [textoDuracion, setTextoDuracion] = React.useState<string>(() =>
    herraje.destello?.duracion !== undefined && herraje.destello?.duracion !== null
      ? String(herraje.destello.duracion)
      : "0"
  );
  const [editandoDuracion, setEditandoDuracion] = React.useState(false);

  // 3. 🎯 Estado local para segundo exacto en que debe titilar (al lado derecho de la cápsula de iluminación)
  const [textoSegundoTitileo, setTextoSegundoTitileo] = React.useState<string>(() =>
    herraje.destello?.tiempoInicio !== undefined && herraje.destello?.tiempoInicio !== null
      ? String(herraje.destello.tiempoInicio)
      : String(herraje.tiempoAparicion ?? 0)
  );
  const [editandoSegundoTitileo, setEditandoSegundoTitileo] = React.useState(false);

  // Sincronizaciones desde props cuando el usuario no está editando activamente
  React.useEffect(() => {
    if (!editandoAparicion) {
      setTextoAparicion(
        herraje.tiempoAparicion !== undefined && herraje.tiempoAparicion !== null
          ? String(herraje.tiempoAparicion)
          : "0"
      );
    }
  }, [herraje.tiempoAparicion, editandoAparicion]);

  React.useEffect(() => {
    if (!editandoDuracion) {
      setTextoDuracion(
        herraje.destello?.duracion !== undefined && herraje.destello?.duracion !== null
          ? String(herraje.destello.duracion)
          : "0"
      );
    }
  }, [herraje.destello?.duracion, editandoDuracion]);

  React.useEffect(() => {
    if (!editandoSegundoTitileo) {
      setTextoSegundoTitileo(
        herraje.destello?.tiempoInicio !== undefined && herraje.destello?.tiempoInicio !== null
          ? String(herraje.destello.tiempoInicio)
          : String(herraje.tiempoAparicion ?? 0)
      );
    }
  }, [herraje.destello?.tiempoInicio, herraje.tiempoAparicion, editandoSegundoTitileo]);

  // Commits con sanitización y persistencia
  const commitAparicion = React.useCallback(() => {
    setEditandoAparicion(false);
    const parsed = parseFloat(textoAparicion);
    const valApa = isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed * 10) / 10);
    setTextoAparicion(String(valApa));

    // Si el tiempo de inicio del destello no estaba personalizado (era igual a la aparición previa o undefined), sincronizarlo
    const tiempoInicioActual = herraje.destello?.tiempoInicio;
    const debeSincronizarTitileo = tiempoInicioActual === undefined || tiempoInicioActual === (herraje.tiempoAparicion ?? 0);

    onActualizar(herraje.id, {
      tiempoAparicion: valApa,
      ...(debeSincronizarTitileo
        ? {
            destello: {
              ...(herraje.destello || {}),
              tiempoInicio: valApa,
              duracion: herraje.destello?.duracion ?? 0,
            },
          }
        : {}),
    });

    if (debeSincronizarTitileo) {
      setTextoSegundoTitileo(String(valApa));
    }
  }, [textoAparicion, herraje.tiempoAparicion, herraje.destello, herraje.id, onActualizar]);

  const commitDuracion = React.useCallback(() => {
    setEditandoDuracion(false);
    const parsed = parseFloat(textoDuracion);
    const valDur = isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed * 10) / 10);
    setTextoDuracion(String(valDur));

    const tInicioVal = isNaN(parseFloat(textoSegundoTitileo))
      ? (herraje.tiempoAparicion ?? 0)
      : Math.max(0, Math.round(parseFloat(textoSegundoTitileo) * 10) / 10);

    onActualizar(herraje.id, {
      destello: {
        ...(herraje.destello || {}),
        duracion: valDur,
        tiempoInicio: tInicioVal,
      },
    });
  }, [textoDuracion, textoSegundoTitileo, herraje.tiempoAparicion, herraje.destello, herraje.id, onActualizar]);

  const commitSegundoTitileo = React.useCallback(() => {
    setEditandoSegundoTitileo(false);
    const parsed = parseFloat(textoSegundoTitileo);
    const valTit = isNaN(parsed) ? (herraje.tiempoAparicion ?? 0) : Math.max(0, Math.round(parsed * 10) / 10);
    setTextoSegundoTitileo(String(valTit));

    const durVal = isNaN(parseFloat(textoDuracion))
      ? (herraje.destello?.duracion ?? 0)
      : Math.max(0, Math.round(parseFloat(textoDuracion) * 10) / 10);

    onActualizar(herraje.id, {
      destello: {
        ...(herraje.destello || {}),
        tiempoInicio: valTit,
        duracion: durVal,
      },
    });
  }, [textoSegundoTitileo, textoDuracion, herraje.tiempoAparicion, herraje.destello, herraje.id, onActualizar]);

  // Detección cromática: Amarillo si duración > 0, Azul tenue si es 0 (congelado/estático)
  const duracionNumerica = parseFloat(textoDuracion) || 0;
  const esDestelloActivo = duracionNumerica > 0;

  return (
    <div
      onMouseEnter={() => onHover([herraje.id])}
      onMouseLeave={() => onHover(null)}
      className={`flex items-center justify-between gap-1.5 w-full min-w-[310px] shrink-0 px-2.5 py-0.5 rounded-full border shadow-2xs text-[9px] select-none transition-all ${
        esCongelado
          ? "border-sky-300 dark:border-sky-700 bg-sky-50/90 dark:bg-sky-950/70 text-sky-900 dark:text-sky-100"
          : esDestelloActivo
          ? "border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-100"
          : "border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:border-cyan-400"
      }`}
    >
      {/* 🔹 Zona Izquierda: Snowflake + Nombre nativo Grasshopper garantizado y rígido */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* ❄️ Botón Congelar / Descongelar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCongelar(herraje.id);
          }}
          title={
            esCongelado
              ? "Herraje Congelado (ya pre-instalado). Clic para descongelar y animar inserción"
              : "Congelar: herraje pre-instalado en paso anterior (viaja fijo sin animación de aproximación)"
          }
          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
            esCongelado
              ? "bg-sky-500 text-white shadow-2xs"
              : "text-slate-400 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-950/50"
          }`}
        >
          <Snowflake className="w-2.5 h-2.5" />
        </button>

        {/* 🔩 Nombre nativo Grasshopper (100% visible, rígido, sin compresión) */}
        <span className="font-bold text-[9.5px] whitespace-nowrap text-slate-800 dark:text-slate-100 leading-tight" title={herraje.id}>
          {herraje.id}
        </span>
      </div>

      {/* 🔹 Zona Derecha: Vector Inserción + apa + dur|en + Eliminar */}
      <div className="flex items-center gap-1 shrink-0">
        {/* 🧭 Selector de Eje de Inserción (por defecto en -X) */}
        {!esCongelado && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center bg-white dark:bg-slate-800 px-1.5 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8px] shadow-2xs shrink-0"
            title="Eje del vector de aproximación (+X, -X, +Y, -Y, +Z, -Z)"
          >
            <select
              value={herraje.ejeAproximacion || "-X"}
              onChange={(e) => onActualizar(herraje.id, { ejeAproximacion: e.target.value as any })}
              className="bg-transparent font-mono font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer text-[8px] leading-tight"
            >
              <option value="-X">-X</option>
              <option value="+X">+X</option>
              <option value="-Y">-Y</option>
              <option value="+Y">+Y</option>
              <option value="-Z">-Z</option>
              <option value="+Z">+Z</option>
            </select>
          </div>
        )}

        {/* ⏱️ 1. SEGUNDO DE APARICIÓN EN ESCENA */}
        <div
          onClick={(e) => e.stopPropagation()}
          title="Segundo exacto de aparición física (por defecto 0s). Presiona Enter o clic fuera para confirmar."
          className="inline-flex items-center gap-0.5 bg-white dark:bg-slate-800 px-1 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8px] shadow-2xs shrink-0"
        >
          <span className="font-bold text-slate-400 dark:text-slate-500 text-[7.5px] select-none">apa:</span>
          <input
            type="text"
            inputMode="decimal"
            value={textoAparicion}
            onFocus={(e) => {
              setEditandoAparicion(true);
              const target = e.currentTarget;
              setTimeout(() => target.select(), 0);
            }}
            onBlur={commitAparicion}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                setEditandoAparicion(false);
                setTextoAparicion(String(herraje.tiempoAparicion ?? 0));
                e.currentTarget.blur();
              }
            }}
            onChange={(e) => {
              setTextoAparicion(e.target.value);
            }}
            className="w-[16px] bg-transparent text-right font-mono font-bold text-slate-700 dark:text-slate-200 outline-none text-[8px] p-0 border-none cursor-text leading-tight"
          />
          <span className="font-bold text-slate-400 dark:text-slate-500 text-[7.5px] select-none">s</span>
        </div>

        {/* 💡 2. CÁPSULA DE ILUMINACIÓN COMPACTA */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-0.5 px-1 py-0 rounded-full border text-[8px] shadow-2xs shrink-0 select-none ${
            esDestelloActivo
              ? "bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 font-bold"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }`}
        >
          <div
            title="Duración del destello (0s = inactivo)"
            className="inline-flex items-center gap-0.5 cursor-text"
          >
            <span className="font-bold text-[7.5px] opacity-75">dur:</span>
            <input
              type="text"
              inputMode="decimal"
              value={textoDuracion}
              onFocus={(e) => {
                setEditandoDuracion(true);
                const target = e.currentTarget;
                setTimeout(() => target.select(), 0);
              }}
              onBlur={commitDuracion}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  setEditandoDuracion(false);
                  setTextoDuracion(String(herraje.destello?.duracion ?? 0));
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) => {
                setTextoDuracion(e.target.value);
              }}
              className="w-[14px] bg-transparent text-right font-mono font-bold outline-none text-[8px] p-0 border-none cursor-text leading-tight"
            />
            <span className="font-bold text-[7.5px] opacity-75">s</span>
          </div>

          <span className="opacity-30 select-none mx-0.5 text-[7.5px]">|</span>

          <div
            title="Segundo en que inicia el titileo"
            className="inline-flex items-center gap-0.5 cursor-text"
          >
            <span className="font-bold text-[7.5px] opacity-75">en:</span>
            <input
              type="text"
              inputMode="decimal"
              value={textoSegundoTitileo}
              onFocus={(e) => {
                setEditandoSegundoTitileo(true);
                const target = e.currentTarget;
                setTimeout(() => target.select(), 0);
              }}
              onBlur={commitSegundoTitileo}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  setEditandoSegundoTitileo(false);
                  setTextoSegundoTitileo(
                    String(herraje.destello?.tiempoInicio ?? herraje.tiempoAparicion ?? 0)
                  );
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) => {
                setTextoSegundoTitileo(e.target.value);
              }}
              className="w-[16px] bg-transparent text-right font-mono font-bold outline-none text-[8px] p-0 border-none cursor-text leading-tight"
            />
            <span className="font-bold text-[7.5px] opacity-75">s</span>
          </div>
        </div>

        {/* ❌ Botón Eliminar / Remover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onHover(null);
            onRemover(herraje.id);
          }}
          title={`Eliminar ${herraje.id} de esta capa`}
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer shrink-0"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}
