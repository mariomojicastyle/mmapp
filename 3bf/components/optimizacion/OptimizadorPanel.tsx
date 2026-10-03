"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { use3BFStore } from "@/lib/store";
import { extraerPiezasParaOptimizacion, agruparPiezasPorEspesor } from "@/lib/optimizador/extractorPiezasModelo";
import { ejecutarOptimizacionGlobal } from "@/lib/optimizador/motorOptimizacionFacade";
import OptimizadorHeader from "./OptimizadorHeader";
import OptimizadorParametrosBar from "./OptimizadorParametrosBar";
import VisorLaminasCanvas from "./VisorLaminasCanvas";
import ResumenMetricasCard from "./ResumenMetricasCard";
import ListaPiezasOptimizadas from "./ListaPiezasOptimizadas";
import ModalImportarCorte from "./ModalImportarCorte";

export default function OptimizadorPanel() {
  const store3BF = use3BFStore();
  const {
    modoActivo,
    configuracion,
    espesorActivo,
    laminaActivaIndex,
    resultadoOptimizacion,
    setResultadoOptimizacion,
    setCalculando,
    origenDatos,
    piezasExternas,
  } = useOptimizadorStore();

  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);

  const lote = Math.max(1, configuracion.tamanoLote || 1);

  // 1. Extraer piezas según el origen de datos activo (Modelo 3D o Archivo Externo) y escalar por tamaño de lote
  const piezasDisponibles = useMemo(() => {
    const base = (origenDatos === "archivo_externo" && piezasExternas.length > 0)
      ? piezasExternas
      : extraerPiezasParaOptimizacion(store3BF);

    if (lote === 1) return base;

    return base.map((p) => ({
      ...p,
      cantidad: p.cantidad * lote,
    }));
  }, [origenDatos, piezasExternas, store3BF.resultado, store3BF.instancias, lote]);

  // 2. Extraer espesores disponibles
  const espesoresDisponibles = useMemo(() => {
    const grupos = agruparPiezasPorEspesor(piezasDisponibles);
    return Object.keys(grupos).map(Number).sort((a, b) => b - a);
  }, [piezasDisponibles]);

  // 3. Función ejecutora de la optimización
  const handleCalcular = () => {
    setCalculando(true);
    setTimeout(() => {
      const res = ejecutarOptimizacionGlobal(
        modoActivo,
        piezasDisponibles,
        configuracion,
        espesorActivo
      );
      setResultadoOptimizacion(res);
      setCalculando(false);
    }, 50);
  };

  // 4. Calcular automáticamente al entrar o cambiar de modo, espesor, lote o parámetros de máquina
  useEffect(() => {
    if (piezasDisponibles.length > 0) {
      handleCalcular();
    }
  }, [
    modoActivo, 
    espesorActivo, 
    piezasDisponibles, 
    configuracion.estrategiaMadera,
    configuracion.largoBruto,
    configuracion.anchoBruto,
    configuracion.kerfSierra,
    configuracion.diametroFresa,
    configuracion.refiladoMargen,
    lote
  ]);

  const laminaSeleccionada = resultadoOptimizacion?.laminas[laminaActivaIndex] || null;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">
      {/* 1. Cabecera con Selector de Tríada y Filtros en Cápsulas rounded-full */}
      <OptimizadorHeader
        espesoresDisponibles={espesoresDisponibles}
        onEjecutarCalculo={handleCalcular}
        totalPiezas={piezasDisponibles.reduce((acc, p) => acc + p.cantidad, 0)}
        onAbrirImportador={() => setModalImportarAbierto(true)}
      />

      {/* 2. Barra de Parámetros de Máquina / Material */}
      <OptimizadorParametrosBar />

      {/* 3. Área Central Dividida: Canvas 2D (Izquierda/Centro) y Lista de Piezas (Derecha) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Lienzo Canvas 2D */}
        <div className="flex-1 h-full relative">
          <VisorLaminasCanvas
            lamina={laminaSeleccionada}
            totalLaminas={resultadoOptimizacion?.totalLaminas || 0}
          />
        </div>

        {/* Panel Lateral de Piezas */}
        <div className="w-64 lg:w-72 h-full border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0 hidden md:block">
          <ListaPiezasOptimizadas piezas={piezasDisponibles} />
        </div>
      </div>

      {/* 4. Barra Inferior con Métricas de Rendimiento */}
      <ResumenMetricasCard resultado={resultadoOptimizacion} />

      {/* 5. Modal de Importación Externa CSV / DXF */}
      <ModalImportarCorte
        abierto={modalImportarAbierto}
        onCerrar={() => setModalImportarAbierto(false)}
      />
    </div>
  );
}
