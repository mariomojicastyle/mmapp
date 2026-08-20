"use client";

import { useEffect } from "react";
import { use3BFStore } from "@/lib/store";

const FONT_MAP: Record<string, string> = {
  sistema: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
  prompt: "var(--font-prompt), 'Prompt', sans-serif",
  inter: "var(--font-inter), 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  arimo: "var(--font-arimo), 'Arimo', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export default function ThemeManager() {
  const { coloresApariencia, tema, fuenteInterfaz, cargarColoresPredefinidos } = use3BFStore();

  useEffect(() => {
    // Cargar colores y fuentes predefinidas guardadas por el usuario
    cargarColoresPredefinidos();
  }, [cargarColoresPredefinidos]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Aplicar tipografía activa
    const fontCss = FONT_MAP[fuenteInterfaz || "sistema"] || FONT_MAP.sistema;
    root.style.setProperty("--app-font", fontCss);
    if (document.body) {
      document.body.style.fontFamily = fontCss;
    }

    if (coloresApariencia) {
      root.style.setProperty("--bg-main", coloresApariencia.fondoAplicacion || "#F1F5F9");
      root.style.setProperty("--bg-surface", coloresApariencia.fondoPaneles);
      root.style.setProperty("--border-color", coloresApariencia.bordePaneles);
      root.style.setProperty("--text-main", coloresApariencia.textoPrincipal);
      root.style.setProperty("--text-muted", coloresApariencia.textoPrincipal);
      root.style.setProperty("--brand-color", coloresApariencia.colorMarca);
      root.style.setProperty("--btn-active", coloresApariencia.botonActivo);
      root.style.setProperty("--btn-inactive", coloresApariencia.botonInactivo || "#E2E8F0");
      root.style.setProperty("--btn-inactive-border", coloresApariencia.bordeBotonInactivo || "#CBD5E1");
      root.style.setProperty("--control-border", coloresApariencia.bordePaneles || "#CBD5E1");
      root.style.setProperty("--panel-container", coloresApariencia.panelContenedor || "#E2E8F0");
      root.style.setProperty("--topnav-bg", coloresApariencia.fondoTopNav);
      root.style.setProperty("--badge-bg", coloresApariencia.insigniaFondo || "#CFFAFE");
      root.style.setProperty("--badge-text", coloresApariencia.insigniaTexto || "#0E7490");
      root.style.setProperty("--state-active", coloresApariencia.estadoActivo || "#10B981");
      root.style.setProperty("--card-bg", coloresApariencia.fondoPaneles);
      root.style.setProperty("--card-border", coloresApariencia.bordePaneles);
      root.style.setProperty("--scrollbar-thumb", coloresApariencia.rejillaPrincipal || "#94A3B8");

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
  }, [coloresApariencia, tema, fuenteInterfaz]);

  return null;
}
