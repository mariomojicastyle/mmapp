"use client";

import { useEffect } from "react";
import { use3BFStore } from "@/lib/store";

export default function ThemeManager() {
  const { coloresApariencia, tema, cargarColoresPredefinidos } = use3BFStore();

  useEffect(() => {
    // Cargar colores predefinidos guardados por el usuario
    cargarColoresPredefinidos();
  }, [cargarColoresPredefinidos]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (coloresApariencia) {
      root.style.setProperty("--bg-surface", coloresApariencia.fondoPaneles);
      root.style.setProperty("--border-color", coloresApariencia.bordePaneles);
      root.style.setProperty("--text-main", coloresApariencia.textoPrincipal);
      root.style.setProperty("--text-muted", coloresApariencia.textoSecundario);
      root.style.setProperty("--brand-color", coloresApariencia.colorMarca);
      root.style.setProperty("--btn-active", coloresApariencia.botonActivo);
      root.style.setProperty("--topnav-bg", coloresApariencia.fondoTopNav);
      root.style.setProperty("--app-guide-lines", coloresApariencia.lineasReferencia);
      root.style.setProperty("--card-bg", coloresApariencia.fondoPaneles);
      root.style.setProperty("--card-border", coloresApariencia.bordePaneles);

      // Variables para Tablas, BOM y Base de Datos
      root.style.setProperty("--tabla-th-bg", coloresApariencia.tablaEncabezadoFondo || "#F1F5F9");
      root.style.setProperty("--tabla-th-text", coloresApariencia.tablaEncabezadoTexto || "#0F172A");
      root.style.setProperty("--tabla-row-bg", coloresApariencia.tablaFilaFondo || "#FFFFFF");
      root.style.setProperty("--tabla-border", coloresApariencia.tablaBorde || "#E2E8F0");
      root.style.setProperty("--tabla-total-bg", coloresApariencia.tablaTotalFondo || "#0F172A");
      root.style.setProperty("--tabla-total-text", coloresApariencia.tablaTotalTexto || "#F8FAFC");
      root.style.setProperty("--kpi-card-bg", coloresApariencia.kpiTarjetaFondo || "#FFFFFF");
      root.style.setProperty("--kpi-card-text", coloresApariencia.kpiTarjetaTexto || "#0891B2");
    }
  }, [coloresApariencia, tema]);

  return null;
}
