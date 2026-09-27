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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-medium select-none transition-all shadow-2xs ${
        esCongelado
          ? "border-sky-300 dark:border-sky-700 bg-sky-50/90 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 hover:border-sky-400"
          : esDestelloActivo
          ? "border-amber-300 dark:border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-slate-800 dark:text-slate-100 ring-1 ring-amber-400/40"
          : "border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/40 hover:ring-1 hover:ring-cyan-400/40"
      }`}
    >
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
            ? "bg-sky-500 text-white shadow-2xs hover:bg-sky-600"
            : "text-slate-400 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-950/50"
        }`}
      >
        <Snowflake className="w-2 h-2" />
      </button>

      {/* 🔩 Nombre nativo Grasshopper */}
      <span className="font-semibold text-[9px] truncate max-w-[90px]" title={herraje.id}>
        {herraje.id}
      </span>

      {/* 🧭 Selector de Eje de Inserción (por defecto en -X) */}
      {!esCongelado && (
        <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
          <select
            value={herraje.ejeAproximacion || "-X"}
            onChange={(e) => onActualizar(herraje.id, { ejeAproximacion: e.target.value as any })}
            title="Eje del vector de aproximación e inserción (+X, -X, +Y, -Y, +Z, -Z)"
            className="text-[7.5px] font-mono font-bold bg-white/90 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-full px-1 py-0 cursor-pointer outline-none hover:border-cyan-500 transition shadow-2xs"
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

      {/* ⏱️ 1. SEGUNDO DE APARICIÓN EN ESCENA (Presencia física del herraje) */}
      <div
        onClick={(e) => e.stopPropagation()}
        title="Segundo exacto en que este herraje aparece en escena física a escala real (por defecto 0s). Presiona Enter o clic fuera para confirmar."
        className="inline-flex items-center gap-0.5 bg-white/90 dark:bg-slate-900 px-1 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8px] shadow-2xs shrink-0"
      >
        <span className="text-[7px] font-semibold text-slate-400">apa:</span>
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
          className="w-[24px] min-w-[24px] bg-transparent text-right font-mono font-bold text-slate-700 dark:text-slate-200 outline-none text-[8px] p-0 border-none cursor-text"
        />
        <span className="text-[7px] font-bold text-slate-400">s</span>
      </div>

      {/* 💡 2. CÁPSULA DE ILUMINACIÓN AGRUPADA: DURACIÓN (AZUL/AMARILLO) + SEGUNDO EN QUE DEBE TITILAR (DERECHA) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 px-1.5 py-0 rounded-full border transition-all shadow-2xs shrink-0 ${
          esDestelloActivo
            ? "bg-amber-300 dark:bg-amber-500 border-amber-500 dark:border-amber-400 text-amber-950 ring-1 ring-amber-400/60"
            : "bg-sky-100/80 dark:bg-sky-950/70 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300"
        }`}
      >
        {/* Duración del destello (0s = inactivo / azul tenue, >0s = amarillo) */}
        <div
          title="Duración del titileo en segundos. Al digitar un número > 0 se torna amarillo indicando que titilará."
          className="inline-flex items-center gap-0.5 cursor-text"
        >
          <span className={`text-[7px] font-bold ${esDestelloActivo ? "text-amber-900" : "text-sky-700 dark:text-sky-400"}`}>
            dur:
          </span>
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
            className={`w-[18px] min-w-[18px] bg-transparent text-right font-mono font-black outline-none text-[8px] p-0 border-none cursor-text ${
              esDestelloActivo ? "text-amber-950" : "text-sky-900 dark:text-sky-200"
            }`}
          />
          <span className={`text-[7px] font-bold ${esDestelloActivo ? "text-amber-900" : "text-sky-600 dark:text-sky-400"}`}>
            s
          </span>
        </div>

        {/* Separador visual sutil */}
        <span className={`text-[7px] font-mono select-none ${esDestelloActivo ? "text-amber-600" : "text-sky-300 dark:text-sky-700"}`}>
          |
        </span>

        {/* Segundo en el que debe titilar (al lado derecho de la cápsula de iluminación) */}
        <div
          title="Segundo exacto en el que debe comenzar a titilar (por defecto igual al segundo de aparición, editable para cámara zoom o locución)."
          className="inline-flex items-center gap-0.5 cursor-text"
        >
          <span className={`text-[7px] font-bold ${esDestelloActivo ? "text-amber-900" : "text-sky-700 dark:text-sky-400"}`}>
            en:
          </span>
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
            className={`w-[24px] min-w-[24px] bg-transparent text-right font-mono font-black outline-none text-[8px] p-0 border-none cursor-text ${
              esDestelloActivo ? "text-amber-950" : "text-sky-900 dark:text-sky-200"
            }`}
          />
          <span className={`text-[7px] font-bold ${esDestelloActivo ? "text-amber-900" : "text-sky-600 dark:text-sky-400"}`}>
            s
          </span>
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
        <X className="w-2 h-2" />
      </button>
    </div>
  );
}
