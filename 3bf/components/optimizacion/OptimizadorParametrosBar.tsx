"use client";

import React from "react";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { use3BFStore } from "@/lib/store";
import { Sliders, Maximize2, Settings2, Ruler, Boxes, Sparkles, Cpu } from "lucide-react";

interface InputNumericoFlexibleProps {
  valor: number;
  onChangeValor: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

function InputNumericoFlexible({
  valor,
  onChangeValor,
  min = 0,
  max = 999,
  step = 0.1,
  className = "w-12 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100 text-xs px-1",
}: InputNumericoFlexibleProps) {
  const [texto, setTexto] = React.useState(String(valor));

  React.useEffect(() => {
    const parseado = parseFloat(texto.replace(",", "."));
    if (isNaN(parseado) || Math.abs(parseado - valor) > 0.0001) {
      setTexto(String(valor));
    }
  }, [valor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const limpio = raw.replace(/[^0-9.,]/g, "");
    setTexto(limpio);

    const normalizado = limpio.replace(",", ".");
    const num = parseFloat(normalizado);
    if (!isNaN(num) && num >= min && num <= max) {
      onChangeValor(num);
    }
  };

  const handleBlur = () => {
    const normalizado = texto.replace(",", ".");
    const num = parseFloat(normalizado);
    if (isNaN(num) || num < min) {
      setTexto(String(min));
      onChangeValor(min);
    } else if (num > max) {
      setTexto(String(max));
      onChangeValor(max);
    } else {
      setTexto(String(num));
      onChangeValor(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const actual = parseFloat(texto.replace(",", ".")) || valor;
      const nuevo = Math.round((actual + step) * 100) / 100;
      if (nuevo <= max) {
        setTexto(String(nuevo));
        onChangeValor(nuevo);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const actual = parseFloat(texto.replace(",", ".")) || valor;
      const nuevo = Math.round((actual - step) * 100) / 100;
      if (nuevo >= min) {
        setTexto(String(nuevo));
        onChangeValor(nuevo);
      }
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="text"
        inputMode="decimal"
        value={texto}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
      />
      <div className="flex flex-col ml-0.5">
        <button
          type="button"
          onClick={() => {
            const actual = parseFloat(texto.replace(",", ".")) || valor;
            const nuevo = Math.min(max, Math.round((actual + step) * 100) / 100);
            setTexto(String(nuevo));
            onChangeValor(nuevo);
          }}
          className="text-[8px] leading-[7px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition px-0.5 cursor-pointer"
          title="Aumentar"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => {
            const actual = parseFloat(texto.replace(",", ".")) || valor;
            const nuevo = Math.max(min, Math.round((actual - step) * 100) / 100);
            setTexto(String(nuevo));
            onChangeValor(nuevo);
          }}
          className="text-[8px] leading-[7px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition px-0.5 cursor-pointer"
          title="Disminuir"
        >
          ▼
        </button>
      </div>
    </div>
  );
}

export default function OptimizadorParametrosBar() {
  const { modoActivo, configuracion, actualizarConfiguracion, espesorActivo, resultadoOptimizacion } = useOptimizadorStore();
  const { coloresApariencia, esquemaColor, dbTableros } = use3BFStore();

  const esOscuro = esquemaColor === "oscuro";
  const colorFondo = coloresApariencia?.fondoPaneles || (esOscuro ? "#0B0F17" : "#FFFFFF");
  const colorBorde = coloresApariencia?.bordePaneles || (esOscuro ? "#334155" : "#E2E8F0");
  const colorTexto = coloresApariencia?.textoPrincipal || (esOscuro ? "#F8FAFC" : "#0F172A");
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0088AA");

  const tamanoLoteActual = configuracion.tamanoLote || 1;
  const nivelActual = configuracion.nivelOptimizacion || "intensivo";

  // Tablero activo de la base de datos según el espesor seleccionado
  const tableroActivo = espesorActivo !== null 
    ? dbTableros?.find((t: any) => Math.abs((t.calibreMm ?? 0) - espesorActivo) <= 1.5)
    : dbTableros?.find((t: any) => t.calibreMm === 15);

  return (
    <div 
      style={{ backgroundColor: colorFondo, borderColor: colorBorde }}
      className="p-2 lg:p-2.5 border-b flex items-center justify-between gap-3 flex-wrap text-xs"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
          <Settings2 className="w-3.5 h-3.5" /> Parámetros:
        </span>

        {/* Multiplicador de Tamaño de Lote (Cantidad de Muebles) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner">
          <Boxes className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Lote:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => actualizarConfiguracion({ tamanoLote: Math.max(1, tamanoLoteActual - 1) })}
              className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition active:scale-90"
              title="Reducir 1 unidad al lote"
            >
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={tamanoLoteActual}
              onChange={(e) => {
                const limpio = e.target.value.replace(/[^0-9]/g, "");
                const val = parseInt(limpio, 10);
                actualizarConfiguracion({ tamanoLote: isNaN(val) || val < 1 ? 1 : val });
              }}
              className="w-14 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100 text-xs px-1"
            />
            <button
              type="button"
              onClick={() => actualizarConfiguracion({ tamanoLote: tamanoLoteActual + 1 })}
              className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition active:scale-90"
              title="Añadir 1 unidad al lote"
            >
              +
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">mueble{tamanoLoteActual > 1 ? "s" : ""}</span>

          {/* Presets de Lote Industrial */}
          <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-300 dark:border-slate-700">
            {[1, 5, 10, 20, 50, 100].map((preset) => {
              const activo = tamanoLoteActual === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => actualizarConfiguracion({ tamanoLote: preset })}
                  style={activo ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" } : {}}
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                    activo 
                      ? "shadow-sm" 
                      : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* Parámetros para Tableros (Seccionadora y Celda CNC) */}
        {modoActivo !== "madera_maciza" && (
          <>
            {/* Información del Tablero de Inventario (Fijo según Material de la Base de Datos) */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner">
              <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Tablero Inventario:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate max-w-[220px]" title={tableroActivo?.nombreComercial}>
                {tableroActivo?.nombreComercial || `Tablero ${configuracion.espesorBruto}mm`}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-cyan-700 dark:text-cyan-300 font-mono font-semibold text-[11px] bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.2 rounded-full border border-cyan-200 dark:border-cyan-800">
                {configuracion.largoBruto} × {configuracion.anchoBruto} mm
              </span>
            </div>

            {/* Si es Seccionadora: Kerf */}
            {modoActivo === "seccionadora" && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Disco (Kerf):</span>
                <InputNumericoFlexible
                  valor={configuracion.kerfSierra}
                  onChangeValor={(kerfSierra) => actualizarConfiguracion({ kerfSierra })}
                  min={0.5}
                  max={20}
                  step={0.1}
                  className="w-12 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100 text-xs px-1"
                />
                <span className="text-[10px] text-slate-400">mm</span>
              </div>
            )}

            {/* Si es Celda CNC: Fresa */}
            {modoActivo === "nesting_cnc" && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Fresa:</span>
                <InputNumericoFlexible
                  valor={configuracion.diametroFresa}
                  onChangeValor={(diametroFresa) => actualizarConfiguracion({ diametroFresa })}
                  min={1}
                  max={30}
                  step={0.5}
                  className="w-12 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100 text-xs px-1"
                />
                <span className="text-[10px] text-slate-400">mm</span>
              </div>
            )}

            {/* Refilado Perimetral */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Refilado:</span>
              <InputNumericoFlexible
                valor={configuracion.refiladoMargen}
                onChangeValor={(refiladoMargen) => actualizarConfiguracion({ refiladoMargen })}
                min={0}
                max={100}
                step={1}
                className="w-10 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100 text-xs px-1"
              />
              <span className="text-[10px] text-slate-400">mm</span>
            </div>

            {/* Selector de Nivel de Cálculo Metaheurístico / Multi-Iterativo */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Cálculo:</span>
              <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-slate-200 dark:bg-slate-800">
                {[
                  { id: "rapido", label: "Rápido (1x)", title: "Cálculo greedy básico (1 pasada)" },
                  { id: "estandar", label: "Estándar (50x)", title: "Búsqueda multi-estrategia heurística (50 iteraciones)" },
                  { id: "intensivo", label: "Máximo (150x)", title: "Motor metaheurístico profundo con Strip Packing y semillas estocásticas (150+ iteraciones)" },
                ].map((niv) => {
                  const activo = nivelActual === niv.id;
                  return (
                    <button
                      key={niv.id}
                      type="button"
                      onClick={() => actualizarConfiguracion({ nivelOptimizacion: niv.id as any })}
                      style={activo ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" } : {}}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        activo ? "shadow-xs" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                      title={niv.title}
                    >
                      {niv.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Badge de Semilla Ganadora y Rendimiento */}
            {resultadoOptimizacion?.semillaOptimizacion && (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] shadow-xs"
                title={`Semilla metaheurística ganadora: #${resultadoOptimizacion.semillaOptimizacion}. Evaluadas ${resultadoOptimizacion.iteracionesEjecutadas || 1} iteraciones.`}
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-slate-400 font-medium">Semilla:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  #{resultadoOptimizacion.semillaOptimizacion}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold text-[10px]">
                  {resultadoOptimizacion.iteracionesEjecutadas || 1} iteraciones ({resultadoOptimizacion.tiempoCalculoMs} ms)
                </span>
              </div>
            )}
          </>
        )}

        {/* Parámetros para Madera Maciza */}
        {modoActivo === "madera_maciza" && (
          <>
            {/* Estrategia Rip vs Crosscut */}
            <div className="flex items-center p-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => actualizarConfiguracion({ estrategiaMadera: "rip_first" })}
                style={
                  configuracion.estrategiaMadera === "rip_first"
                    ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                    : { color: colorTexto }
                }
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer"
              >
                Rip-First (Longitudinal)
              </button>
              <button
                type="button"
                onClick={() => actualizarConfiguracion({ estrategiaMadera: "crosscut_first" })}
                style={
                  configuracion.estrategiaMadera === "crosscut_first"
                    ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                    : { color: colorTexto }
                }
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer"
              >
                Crosscut-First (Troceado)
              </button>
            </div>

            {/* Medidas de Tablón */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Tablón:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">8" × 10 ft</span>
              <span className="text-[10px] text-slate-400">({configuracion.largoTablonMm}×{Math.round(configuracion.anchoTablonMm)}mm)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
