/**
 * =========================================================================================
 * 💾 3dBimFab Opti_Nesting — Módulo de Persistencia y Respaldo de Planes de Corte
 * Permite guardar, restaurar y descargar planes de corte, parámetros de máquina y mermas
 * =========================================================================================
 */

import type {
  ModoOptimizacion,
  ConfiguracionLaminas,
  ResultadoOptimizacionGlobal,
} from "./tiposOptimizador";

export interface PlanOptimizacionGuardado {
  id: string;
  version: string;
  nombreProyecto: string;
  fechaIso: string;
  fechaTexto: string;
  modoActivo: ModoOptimizacion;
  configuracion: ConfiguracionLaminas;
  resumen: {
    totalLaminas: number;
    aprovechamientoGlobal: number;
    desperdicioGlobal: number;
    tamanoLote: number;
    tiempoCalculoMs: number;
  };
  resultado: ResultadoOptimizacionGlobal;
}

const STORAGE_PREFIX = "3bf_optimizacion_";

function sanitizarClave(nombre: string): string {
  return nombre.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

/**
 * Guarda un plan de optimización en el almacenamiento local del navegador
 */
export function guardarPlanLocal(
  nombreProyecto: string,
  modoActivo: ModoOptimizacion,
  configuracion: ConfiguracionLaminas,
  resultado: ResultadoOptimizacionGlobal
): PlanOptimizacionGuardado | null {
  if (typeof window === "undefined" || !resultado) return null;

  try {
    const ahora = new Date();
    const desperdicioPromedio = Math.round((100 - (resultado.aprovechamientoPromedio || 0)) * 10) / 10;
    const plan: PlanOptimizacionGuardado = {
      id: `opt_${Date.now()}`,
      version: "3dBimFab_Opti_Nesting_1.0",
      nombreProyecto,
      fechaIso: ahora.toISOString(),
      fechaTexto: ahora.toLocaleString("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      modoActivo,
      configuracion: { ...configuracion },
      resumen: {
        totalLaminas: resultado.totalLaminas,
        aprovechamientoGlobal: resultado.aprovechamientoPromedio,
        desperdicioGlobal: desperdicioPromedio,
        tamanoLote: configuracion.tamanoLote || 1,
        tiempoCalculoMs: resultado.tiempoCalculoMs,
      },
      resultado,
    };

    const key = `${STORAGE_PREFIX}${sanitizarClave(nombreProyecto)}`;
    localStorage.setItem(key, JSON.stringify(plan));

    // Actualizar índice de planes guardados
    try {
      const rawIndex = localStorage.getItem("3bf_optimizaciones_index");
      const index: Record<string, { fecha: string; nombre: string; lote: number; desperdicio: number }> =
        rawIndex ? JSON.parse(rawIndex) : {};

      index[key] = {
        fecha: plan.fechaTexto,
        nombre: plan.nombreProyecto,
        lote: plan.configuracion.tamanoLote || 1,
        desperdicio: plan.resumen.desperdicioGlobal,
      };
      localStorage.setItem("3bf_optimizaciones_index", JSON.stringify(index));
    } catch {
      // Ignorar fallas en índice
    }

    return plan;
  } catch (error) {
    console.error("Error al guardar plan de optimización en localStorage:", error);
    return null;
  }
}

/**
 * Carga un plan de optimización guardado desde el almacenamiento local
 */
export function cargarPlanLocal(nombreProyecto: string): PlanOptimizacionGuardado | null {
  if (typeof window === "undefined") return null;

  try {
    const key = `${STORAGE_PREFIX}${sanitizarClave(nombreProyecto)}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as PlanOptimizacionGuardado;
  } catch (error) {
    console.error("Error al cargar plan de optimización de localStorage:", error);
    return null;
  }
}

/**
 * Descarga el plan de optimización como archivo JSON de manufactura para archivo o intercambio
 */
export function descargarPlanJson(
  nombreProyecto: string,
  modoActivo: ModoOptimizacion,
  configuracion: ConfiguracionLaminas,
  resultado: ResultadoOptimizacionGlobal
): void {
  if (typeof window === "undefined" || !resultado) return;

  const ahora = new Date();
  const fechaLimpia = ahora.toISOString().slice(0, 10);
  const desperdicioPromedio = Math.round((100 - (resultado.aprovechamientoPromedio || 0)) * 10) / 10;

  const payload = {
    sistema: "3dBimFab Opti_Nesting",
    version: "1.0",
    proyecto: nombreProyecto,
    fechaExportacion: ahora.toISOString(),
    modo: modoActivo,
    parametrosMaquina: {
      tamanoLoteMuebles: configuracion.tamanoLote,
      discoKerfMm: configuracion.kerfSierra,
      diametroFresaMm: configuracion.diametroFresa,
      refiladoMargenMm: configuracion.refiladoMargen,
      formatoTableroBase: `${configuracion.largoBruto} × ${configuracion.anchoBruto} × ${configuracion.espesorBruto} mm`,
      estrategiaMadera: configuracion.estrategiaMadera,
    },
    metricasGenerales: {
      totalLaminasRequeridas: resultado.totalLaminas,
      porcentajeAprovechamientoPromedio: resultado.aprovechamientoPromedio,
      porcentajeDesperdicioPromedio: desperdicioPromedio,
      tiempoOptimizacionMs: resultado.tiempoCalculoMs,
    },
    desgloseLaminas: resultado.laminas.map((lamina) => ({
      numeroLamina: lamina.indice,
      material: lamina.material,
      espesorMm: lamina.espesor,
      dimensionesMm: { largo: lamina.largoTotal, ancho: lamina.anchoTotal },
      porcentajeAprovechamiento: lamina.porcentajeAprovechamiento,
      porcentajeDesperdicio: lamina.porcentajeDesperdicio,
      metrosLinealesCorte: lamina.metrosLinealesCorte,
      cantidadPiezas: lamina.piezas.length,
      piezas: lamina.piezas.map((p) => ({
        piezaId: p.piezaId,
        nombre: p.nombre,
        descripcion: p.descripcion,
        coordenadaX: p.x,
        coordenadaY: p.y,
        largoMm: p.largo,
        anchoMm: p.ancho,
        rotada90Grados: p.rotada,
        colorHex: p.colorHex,
      })),
    })),
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Optimizacion_${nombreProyecto.replace(/\s+/g, "_")}_${fechaLimpia}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
