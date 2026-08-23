"use client";

import React, { useEffect, useRef } from "react";
import { use3BFStore } from "@/lib/store";

/**
 * ⚡ GHXAutoWatcher: Observador de Archivos en Caliente (Hot Reload Automático)
 * Monitorea los archivos .ghx de todos los componentes activos en escena.
 * Cada vez que el usuario guarda en Grasshopper (Ctrl+S), recarga la metadata y geometría automáticamente.
 */
export function GHXAutoWatcher() {
  const { instancias, recargarDefinicionInstancia, objetoActivoId, escenarioLimpio } = use3BFStore();
  const mtimesMapRef = useRef<Record<string, number>>({});
  const isCheckingRef = useRef(false);
  const debounceTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (escenarioLimpio) {
      mtimesMapRef.current = {};
      return;
    }

    const checkFileChanges = async () => {
      if (isCheckingRef.current) return;
      const currentInstancias = Object.values(use3BFStore.getState().instancias || {});
      if (currentInstancias.length === 0) return;

      const items = currentInstancias.map((inst) => ({
        id: inst.id,
        model_id: inst.definitionId,
        custom_filename: inst.archivo,
        last_mtime: mtimesMapRef.current[inst.id] || 0,
      }));

      isCheckingRef.current = true;
      try {
        const res = await fetch("/api/watch-ghx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            for (const r of data.results) {
              const prevMtime = mtimesMapRef.current[r.id];
              
              // Inicializar mtime en la primera lectura
              if (!prevMtime || prevMtime === 0) {
                mtimesMapRef.current[r.id] = r.current_mtime;
                continue;
              }

              // Detectar cambio de archivo tras guardar en Grasshopper
              if (r.changed && r.current_mtime > prevMtime) {
                mtimesMapRef.current[r.id] = r.current_mtime;

                // Debounce de seguridad (300ms) para esperar que Rhino termine de escribir el XML
                if (debounceTimeoutRef.current[r.id]) {
                  clearTimeout(debounceTimeoutRef.current[r.id]);
                }

                debounceTimeoutRef.current[r.id] = setTimeout(async () => {
                  try {
                    console.log(`[3BF Hot-Reload] Auto-actualizando componente: ${r.model_id} (${r.id})`);
                    await recargarDefinicionInstancia(r.id);
                  } catch (e) {
                    console.warn(`[3BF Hot-Reload] Error recargando ${r.id}:`, e);
                  }
                }, 300);
              }
            }
          }
        }
      } catch (err) {
        // Silencioso ante errores de red momentáneos
      } finally {
        isCheckingRef.current = false;
      }
    };

    const interval = setInterval(checkFileChanges, 1000);
    return () => {
      clearInterval(interval);
      Object.values(debounceTimeoutRef.current).forEach((t) => clearTimeout(t));
    };
  }, [instancias, escenarioLimpio, recargarDefinicionInstancia]);

  return null;
}
