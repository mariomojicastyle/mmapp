"use client";

import React from "react";
import { Crosshair, X, Eye, ArrowRight, RotateCcw } from "lucide-react";
import { TableroCapaPlus } from "@/lib/storeTypes";

interface CapsulaTableroPlusProps {
  tablero: TableroCapaPlus;
  capaId: string;
  pasoId: string;
  opcionesDestino: Array<{ id: string; label: string; esHeredado?: boolean }>;
  estaPosicionando: boolean;
  onHover: (mallas: string[] | null) => void;
  onActualizar: (tableroId: string, partial: Partial<TableroCapaPlus>) => void;
  onRemover: (tableroId: string) => void;
  onTogglePosicionar: (tableroId: string) => void;
}

export function CapsulaTableroPlus({
  tablero,
  capaId,
  pasoId,
  opcionesDestino,
  estaPosicionando,
  onHover,
  onActualizar,
  onRemover,
  onTogglePosicionar,
}: CapsulaTableroPlusProps) {
  const rotacion = tablero.rotacionGrados || [0, 0, 0];
  const tieneGiro = Boolean(rotacion[0] !== 0 || rotacion[1] !== 0 || rotacion[2] !== 0);

  const tieneDesplazamiento = Boolean(
    (tablero.offsetXCm || 0) !== 0 ||
    (tablero.offsetYCm || 0) !== 0 ||
    (tablero.offsetZCm || 0) !== 0 ||
    (tablero.elevacionZCm || 0) !== 0 ||
    tieneGiro
  );

  const SECUENCIA_ANGULOS = React.useMemo(() => [0, 90, 180, -90] as const, []);

  const ciclarEje = React.useCallback(
    (ejeIdx: 0 | 1 | 2, direccion: 1 | -1 = 1) => {
      const valActual = rotacion[ejeIdx] || 0;
      let idxActual = SECUENCIA_ANGULOS.indexOf(valActual as any);
      if (idxActual === -1) idxActual = 0;
      const siguienteIdx = (idxActual + direccion + SECUENCIA_ANGULOS.length) % SECUENCIA_ANGULOS.length;
      const nuevoValor = SECUENCIA_ANGULOS[siguienteIdx];

      const nuevaRot: [number, number, number] = [
        rotacion[0] || 0,
        rotacion[1] || 0,
        rotacion[2] || 0,
      ];
      nuevaRot[ejeIdx] = nuevoValor;
      onActualizar(tablero.id, { rotacionGrados: nuevaRot });
    },
    [rotacion, tablero.id, onActualizar, SECUENCIA_ANGULOS]
  );

  // 🛡️ Al desmontar la cápsula (por ejemplo al eliminarla), limpiar el hover inmediatamente
  React.useEffect(() => {
    return () => {
      onHover(null);
    };
  }, [onHover]);

  // ⚡ Estado local desacoplado para edición fluida sin interferencias del store en cada tecla
  const [textoAparicion, setTextoAparicion] = React.useState<string>(() =>
    tablero.tiempoAparicion !== undefined && tablero.tiempoAparicion !== null
      ? String(tablero.tiempoAparicion)
      : "0"
  );
  const [editandoAparicion, setEditandoAparicion] = React.useState(false);

  const [textoMov, setTextoMov] = React.useState<string>(() =>
    tablero.tiempoInicioMovimiento !== undefined && tablero.tiempoInicioMovimiento !== null
      ? String(tablero.tiempoInicioMovimiento)
      : "500"
  );
  const [editandoMov, setEditandoMov] = React.useState(false);

  const [textoElevacion, setTextoElevacion] = React.useState<string>(() =>
    tablero.elevacionZCm !== undefined && tablero.elevacionZCm !== null
      ? String(tablero.elevacionZCm)
      : "0"
  );
  const [editandoElevacion, setEditandoElevacion] = React.useState(false);

  React.useEffect(() => {
    if (!editandoAparicion) {
      setTextoAparicion(
        tablero.tiempoAparicion !== undefined && tablero.tiempoAparicion !== null
          ? String(tablero.tiempoAparicion)
          : "0"
      );
    }
  }, [tablero.tiempoAparicion, editandoAparicion]);

  React.useEffect(() => {
    if (!editandoMov) {
      setTextoMov(
        tablero.tiempoInicioMovimiento !== undefined && tablero.tiempoInicioMovimiento !== null
          ? String(tablero.tiempoInicioMovimiento)
          : "500"
      );
    }
  }, [tablero.tiempoInicioMovimiento, editandoMov]);

  React.useEffect(() => {
    if (!editandoElevacion) {
      setTextoElevacion(
        tablero.elevacionZCm !== undefined && tablero.elevacionZCm !== null
          ? String(tablero.elevacionZCm)
          : "0"
      );
    }
  }, [tablero.elevacionZCm, editandoElevacion]);

  const commitAparicion = React.useCallback(() => {
    setEditandoAparicion(false);
    const parsed = parseFloat(textoAparicion);
    const finalVal = isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed * 10) / 10);
    setTextoAparicion(String(finalVal));
    if (finalVal !== (tablero.tiempoAparicion ?? 0)) {
      onActualizar(tablero.id, { tiempoAparicion: finalVal });
    }
  }, [textoAparicion, tablero.tiempoAparicion, tablero.id, onActualizar]);

  const commitMov = React.useCallback(() => {
    setEditandoMov(false);
    const parsed = parseFloat(textoMov);
    const finalVal = isNaN(parsed) ? 500 : Math.max(0, Math.round(parsed * 10) / 10);
    setTextoMov(String(finalVal));
    if (finalVal !== (tablero.tiempoInicioMovimiento ?? 500)) {
      onActualizar(tablero.id, { tiempoInicioMovimiento: finalVal });
    }
  }, [textoMov, tablero.tiempoInicioMovimiento, tablero.id, onActualizar]);

  const commitElevacion = React.useCallback(() => {
    setEditandoElevacion(false);
    const parsed = parseFloat(textoElevacion);
    const finalVal = isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed * 10) / 10);
    setTextoElevacion(String(finalVal));
    if (finalVal !== (tablero.elevacionZCm ?? 0)) {
      onActualizar(tablero.id, { elevacionZCm: finalVal });
    }
  }, [textoElevacion, tablero.elevacionZCm, tablero.id, onActualizar]);

  return (
    <div
      onMouseEnter={() => onHover([tablero.id])}
      onMouseLeave={() => onHover(null)}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-100 shadow-2xs text-[9.5px] select-none transition-all hover:border-amber-400 hover:ring-1 hover:ring-amber-400/40"
    >
      {/* 🪵 Nombre nativo Grasshopper */}
      <span className="font-bold text-[9.5px] truncate max-w-[100px]" title={tablero.id}>
        {tablero.id}
      </span>

      {/* 🎯 Dropdown Hacia: */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1.5 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8.5px] shadow-2xs"
        title="Pieza de destino hacia la que se ensamblará durante el paso"
      >
        <span className="font-bold text-slate-400 dark:text-slate-500 text-[7.5px]">Hacia:</span>
        <select
          value={tablero.destinoId || "base_master"}
          onChange={(e) => onActualizar(tablero.id, { destinoId: e.target.value })}
          className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[85px] truncate text-[8.5px]"
        >
          <option value="base_master">👑 Base Master</option>
          {opcionesDestino
            .filter((op) => op.id !== tablero.id)
            .map((op) => (
              <option key={op.id} value={op.id}>
                {op.esHeredado ? `🧩 ${op.label}` : op.label}
              </option>
            ))}
        </select>
      </div>

      {/* 👁️ Tiempo de aparición en espera (defecto 0s) */}
      <div
        onClick={(e) => e.stopPropagation()}
        title="Segundo exacto en que este tablero aparece en escena en su posición de espera (por defecto 0s). Presiona Enter o haz clic fuera para confirmar."
        className="inline-flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8.5px] shadow-2xs"
      >
        <Eye className="w-2 h-2 text-slate-400 shrink-0" />
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
              setTextoAparicion(String(tablero.tiempoAparicion ?? 0));
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => {
            setTextoAparicion(e.target.value);
          }}
          className="w-[26px] min-w-[26px] bg-transparent text-right font-mono font-bold text-[8.5px] text-slate-700 dark:text-slate-200 outline-none p-0 border-none cursor-text"
        />
        <span className="text-[7.5px] font-bold text-slate-400">s</span>
      </div>

      {/* ➔ Tiempo de inicio de movimiento hacia destino (defecto 500s para que no se mueva) */}
      <div
        onClick={(e) => e.stopPropagation()}
        title="Segundo exacto en que inicia su trayectoria hacia la pieza de destino (por defecto 500s para permanecer en espera). Presiona Enter o haz clic fuera para confirmar."
        className="inline-flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1.5 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8.5px] shadow-2xs"
      >
        <ArrowRight className="w-2 h-2 text-cyan-600 shrink-0" />
        <input
          type="text"
          inputMode="decimal"
          value={textoMov}
          onFocus={(e) => {
            setEditandoMov(true);
            const target = e.currentTarget;
            setTimeout(() => target.select(), 0);
          }}
          onBlur={commitMov}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setEditandoMov(false);
              setTextoMov(String(tablero.tiempoInicioMovimiento ?? 500));
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => {
            setTextoMov(e.target.value);
          }}
          className="w-[32px] min-w-[32px] bg-transparent text-right font-mono font-bold text-[8.5px] text-cyan-700 dark:text-cyan-300 outline-none p-0 border-none cursor-text"
        />
        <span className="text-[7.5px] font-bold text-slate-400">s</span>
      </div>

      {/* 📐 Altura Z sobre el banco/suelo (elevación en cm) */}
      <div
        onClick={(e) => e.stopPropagation()}
        title="Altura Z sobre el banco/suelo (elevación en cm para despejar tarugos inferiores). Presiona Enter o haz clic fuera para confirmar."
        className="inline-flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1.5 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8.5px] shadow-2xs"
      >
        <span className="font-bold text-amber-600 dark:text-amber-400 text-[8px]">Z:</span>
        <input
          type="text"
          inputMode="decimal"
          value={textoElevacion}
          onFocus={(e) => {
            setEditandoElevacion(true);
            const target = e.currentTarget;
            setTimeout(() => target.select(), 0);
          }}
          onBlur={commitElevacion}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setEditandoElevacion(false);
              setTextoElevacion(String(tablero.elevacionZCm ?? 0));
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => {
            setTextoElevacion(e.target.value);
          }}
          className="w-[28px] min-w-[28px] bg-transparent text-right font-mono font-bold text-[8.5px] text-amber-700 dark:text-amber-300 outline-none p-0 border-none cursor-text"
        />
        <span className="text-[7.5px] font-bold text-slate-400">cm</span>
      </div>

      {/* 🔄 Triple Píldora Cíclica de Giro 3D Inline (Opción 2) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1.5 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8.5px] shadow-2xs shrink-0 select-none"
      >
        <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Giro:
        </span>
        {(["X", "Y", "Z"] as const).map((eje, idx) => {
          const val = rotacion[idx] || 0;
          const estaActivo = val !== 0;
          return (
            <button
              key={eje}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                ciclarEje(idx as 0 | 1 | 2, 1);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                ciclarEje(idx as 0 | 1 | 2, -1);
              }}
              title={`Eje ${eje}: ${val}° (Clic izquierdo: +90°, Clic secundario: -90°)`}
              className={`px-1.5 py-0 rounded-full font-mono font-bold text-[8.5px] transition cursor-pointer ${
                estaActivo
                  ? "bg-[#0088AA] dark:bg-[#1368AA] text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {eje}:{val}°
            </button>
          );
        })}
      </div>

      {/* 🔄 Botón Resetear Posición de Espera a Origen [0, 0, 0], Z: 0 y Giro: 0° */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onActualizar(tablero.id, {
            offsetXCm: 0,
            offsetYCm: 0,
            offsetZCm: 0,
            elevacionZCm: 0,
            rotacionGrados: [0, 0, 0],
          });
        }}
        title="Resetear posición de espera a origen [0, 0, 0], altura Z a 0 y giro a 0°"
        className={`w-4 h-4 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
          tieneDesplazamiento
            ? "text-amber-600 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/80 shadow-2xs"
            : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
        }`}
      >
        <RotateCcw className="w-2.5 h-2.5" />
      </button>

      {/* 🎯 Botón Mira (Crosshair) de Posicionamiento */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePosicionar(tablero.id);
        }}
        title="Arrastrar y posicionar esta pieza interactivamente en el piso 3D"
        className={`w-4 h-4 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
          estaPosicionando
            ? "bg-cyan-500 text-white shadow-2xs animate-pulse ring-1 ring-cyan-400/50"
            : "text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
        }`}
      >
        <Crosshair className="w-2.5 h-2.5" />
      </button>

      {/* ❌ Botón Eliminar / Remover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onHover(null);
          onRemover(tablero.id);
        }}
        title={`Eliminar ${tablero.id} de esta capa`}
        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer shrink-0"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}
