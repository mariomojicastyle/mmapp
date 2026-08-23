"use client";

import React, { useState } from "react";
import { use3BFStore, ColoresApariencia } from "@/lib/store";
import { 
  RotateCcw, 
  Palette, 
  Eye, 
  Layout, 
  Compass, 
  Check, 
  Copy, 
  Save, 
  Table, 
  Sparkles,
  Type,
  Grid3X3,
  ClipboardPaste,
  Pipette
} from "lucide-react";

// Función de compatibilidad total con formatos de color de Inkscape y CSS
function procesarColorInkscape(texto: string): string | null {
  if (!texto) return null;
  let s = texto.trim();
  
  // Quitar prefijos comunes como "RGBA:", "RGB:", "HEX:", "Color:", etc.
  s = s.replace(/^(rgba|rgb|hex|color)\s*:\s*/i, "").trim();
  
  if (s.startsWith("#")) {
    s = s.substring(1).trim();
  }
  
  // 1. Formato función CSS: rgba(187, 15, 15, 1) o rgb(187, 15, 15)
  const rgbFuncMatch = s.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbFuncMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbFuncMatch[1], 10))).toString(16).padStart(2, "0");
    const g = Math.min(255, Math.max(0, parseInt(rgbFuncMatch[2], 10))).toString(16).padStart(2, "0");
    const b = Math.min(255, Math.max(0, parseInt(rgbFuncMatch[3], 10))).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`.toUpperCase();
  }

  // 2. Formato de valores RGB separados por comas o espacios: "187, 15, 15"
  const commaMatch = s.match(/^(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/);
  if (commaMatch) {
    const r = Math.min(255, Math.max(0, parseInt(commaMatch[1], 10))).toString(16).padStart(2, "0");
    const g = Math.min(255, Math.max(0, parseInt(commaMatch[2], 10))).toString(16).padStart(2, "0");
    const b = Math.min(255, Math.max(0, parseInt(commaMatch[3], 10))).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`.toUpperCase();
  }

  // 3. Formato Oficial Inkscape RGBA 8 caracteres hex (ej: "bb0f0fff" o "0B0F17FF")
  if (/^[0-9A-Fa-f]{8}$/.test(s)) {
    return `#${s.substring(0, 6)}`.toUpperCase();
  }

  // 4. Formato Hex estándar 6 caracteres (ej: "bb0f0f")
  if (/^[0-9A-Fa-f]{6}$/.test(s)) {
    return `#${s}`.toUpperCase();
  }

  // 5. Formato Hex 3 caracteres (ej: "f00")
  if (/^[0-9A-Fa-f]{3}$/.test(s)) {
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toUpperCase();
  }

  return null;
}

interface ColorItemDef {
  key: keyof ColoresApariencia;
  label: string;
  descripcion?: string;
}

interface ColorGroupDef {
  titulo: string;
  icono: React.ReactNode;
  items: ColorItemDef[];
}

export default function AppearanceSettingsPanel() {
  const {
    pestanaActiva,
    esquemaColor,
    setEsquemaColor,
    coloresApariencia,
    setColorApariencia,
    fuenteInterfaz,
    setFuenteInterfaz,
    calibracion,
    setCalibracion,
    restaurarColoresApariencia,
    guardarComoPredefinido,
  } = use3BFStore();

  const [guardadoFeedback, setGuardadoFeedback] = useState(false);
  const [copiadoKey, setCopiadoKey] = useState<string | null>(null);
  const [pegadoKey, setPegadoKey] = useState<string | null>(null);

  // 💧 Cuentagotas Universal de Pantalla (EyeDropper API nativo de Chromium)
  const abrirCuentagotas = async (key: keyof ColoresApariencia) => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          setColorApariencia(key, result.sRGBHex.toUpperCase());
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Cuentagotas cancelado o no disponible:", err);
        }
      }
    } else {
      alert("El Cuentagotas Universal requiere Google Chrome, Microsoft Edge o Brave.");
    }
  };

  const copiarFormatoInkscape = (hexColor: string, key: string) => {
    const hex = (hexColor || "#888888").replace("#", "").toLowerCase();
    const inkscapeRgba = `${hex.padEnd(6, "0")}ff`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inkscapeRgba);
      setCopiadoKey(key);
      setTimeout(() => setCopiadoKey(null), 1500);
    }
  };

  const pegarDesdePortapapeles = async (key: keyof ColoresApariencia) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        const text = await navigator.clipboard.readText();
        const parsed = procesarColorInkscape(text);
        if (parsed) {
          setColorApariencia(key, parsed);
          setPegadoKey(key);
          setTimeout(() => setPegadoKey(null), 1500);
        }
      } catch (err) {
        console.warn("No se pudo leer portapapeles:", err);
      }
    }
  };

  // Definición de grupos de colores según la sección activa
  const gruposColores: ColorGroupDef[] = React.useMemo(() => {
    // Si estamos en la ficha de Despiece & Costos
    if (pestanaActiva === "despiece") {
      return [
        {
          titulo: "Ficha de Despiece & Tablas (BOM)",
          icono: <Table style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />,
          items: [
            { key: "tablaEncabezadoFondo", label: "Encabezados de tabla (Fondo)", descripcion: "Fondo de columnas de tablas BOM" },
            { key: "tablaEncabezadoTexto", label: "Encabezados de tabla (Texto)", descripcion: "Texto de columnas de tablas BOM" },
            { key: "tablaFilaFondo", label: "Celdas y filas de corte", descripcion: "Fondo de las filas de despiece" },
            { key: "tablaBorde", label: "Bordes y divisores", descripcion: "Divisores entre celdas" },
            { key: "tablaTotalFondo", label: "Fila de Total Consolidado", descripcion: "Barra final de costo total" },
            { key: "tablaTotalTexto", label: "Texto de Fila Total", descripcion: "Color de letras en la barra de total" },
            { key: "kpiTarjetaFondo", label: "Tarjetas KPI Métricas", descripcion: "Fondo de métricas superiores" },
            { key: "kpiTarjetaTexto", label: "Valores KPI Métricas", descripcion: "Color de números de costo y m²" },
          ],
        },
        {
          titulo: "Objetos de interfaz",
          icono: <Layout style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />,
          items: [
            { key: "fondoAplicacion", label: "Fondo de aplicación", descripcion: "Espacio y separación entre paneles" },
            { key: "fondoPaneles", label: "Fondo de paneles y barra superior", descripcion: "Superficie de tarjetas, N-Panel y cabecera" },
            { key: "bordePaneles", label: "Bordes de paneles", descripcion: "Líneas divisorias, marcos y controles" },
            { key: "textoPrincipal", label: "Texto de interfaz", descripcion: "Títulos, etiquetas y valores generales" },
            { key: "textoLogotipo", label: "Texto logotipo", descripcion: "Color de 3dBimFab y Powered by" },
            { key: "color3BF", label: "Color 3BF", descripcion: "Color del texto 3BF en el recuadro rojo" },
            { key: "textoSecundario", label: "Texto secundario (Subtítulos / Versión)", descripcion: "Etiquetas secundarias y subtítulos" },
            { key: "botonActivo", label: "Botones activos e iconos fijos", descripcion: "Pestañas seleccionadas, herramientas activas e iconos fijos" },
            { key: "botonInactivo", label: "Botones inactivos", descripcion: "Pestañas y opciones secundarias" },
            { key: "bordeBotonInactivo", label: "Borde de botones inactivos", descripcion: "Líneas de botones secundarios" },
            { key: "panelContenedor", label: "Panel contenedor", descripcion: "Cápsula y barra de pestañas" },
            { key: "insigniaFondo", label: "Insignias y badges (Fondo)", descripcion: "Fondo de etiquetas de versión y estado" },
            { key: "estadoActivo", label: "Indicadores de estado (Online / Activo)", descripcion: "Color de estado online y pieza activa" },
          ],
        },
      ];
    }

    // Si estamos en la ficha de Base de Datos
    if (pestanaActiva === "basedatos") {
      return [
        {
          titulo: "Base de Datos (Tablas & Materias Primas)",
          icono: <Table style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />,
          items: [
            { key: "tablaEncabezadoFondo", label: "Encabezados de tabla (Fondo)", descripcion: "Fondo de columnas de tablas" },
            { key: "tablaEncabezadoTexto", label: "Encabezados de tabla (Texto)", descripcion: "Texto de columnas de tablas" },
            { key: "tablaFilaFondo", label: "Celdas y filas de materias primas", descripcion: "Fondo de las filas de materiales" },
            { key: "tablaBorde", label: "Bordes y líneas de tabla", descripcion: "Divisores entre celdas" },
          ],
        },
        {
          titulo: "Objetos de interfaz",
          icono: <Layout style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />,
          items: [
            { key: "fondoAplicacion", label: "Fondo de aplicación", descripcion: "Espacio y separación entre paneles" },
            { key: "fondoPaneles", label: "Fondo de paneles y barra superior", descripcion: "Superficie de tarjetas, N-Panel y cabecera" },
            { key: "bordePaneles", label: "Bordes de paneles", descripcion: "Líneas divisorias, marcos y controles" },
            { key: "textoPrincipal", label: "Texto de interfaz", descripcion: "Títulos, etiquetas y valores generales" },
            { key: "textoLogotipo", label: "Texto logotipo", descripcion: "Color de 3dBimFab y Powered by" },
            { key: "color3BF", label: "Color 3BF", descripcion: "Color del texto 3BF en el recuadro rojo" },
            { key: "textoSecundario", label: "Texto secundario (Subtítulos / Versión)", descripcion: "Etiquetas secundarias y subtítulos" },
            { key: "botonActivo", label: "Botones activos e iconos fijos", descripcion: "Pestañas seleccionadas, herramientas activas e iconos fijos" },
            { key: "botonInactivo", label: "Botones inactivos", descripcion: "Pestañas y opciones secundarias" },
            { key: "bordeBotonInactivo", label: "Borde de botones inactivos", descripcion: "Líneas de botones secundarios" },
            { key: "panelContenedor", label: "Panel contenedor", descripcion: "Cápsula y barra de pestañas" },
            { key: "insigniaFondo", label: "Insignias y badges (Fondo)", descripcion: "Fondo de etiquetas de versión y estado" },
            { key: "estadoActivo", label: "Indicadores de estado (Online / Activo)", descripcion: "Color de estado online y pieza activa" },
          ],
        },
      ];
    }

    // Vista general en el Visor 3D (Rhinoceros 8 Style Completo)
    return [
      {
        titulo: "Colores de la vista",
        icono: <Eye style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />,
        items: [
          { key: "fondo3D", label: "Fondo", descripcion: "Color de fondo del visor 3D" },
          { key: "rejillaPrincipal", label: "Línea de rejilla principal", descripcion: "Ejes y subdivisiones mayores" },
          { key: "rejillaSecundaria", label: "Línea de rejilla secundaria", descripcion: "Cuadrícula fina del suelo" },
          { key: "ejeX", label: "Línea de eje X", descripcion: "Eje horizontal universal (Rojo)" },
          { key: "ejeY", label: "Línea de eje Y", descripcion: "Eje de profundidad universal (Verde)" },
          { key: "iconoPlanoUniversalX", label: "Icono del eje del plano universal X" },
          { key: "iconoPlanoUniversalY", label: "Icono del eje del plano universal Y" },
          { key: "iconoPlanoUniversalZ", label: "Icono del eje del plano universal Z" },
        ],
      },
      {
        titulo: "Visualización de objetos",
        icono: <Palette style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />,
        items: [
          { key: "objetosSeleccionados", label: "Objetos seleccionados", descripcion: "Caja delimitadora y highlight" },
          { key: "objetosBloqueados", label: "Objetos bloqueados", descripcion: "Piezas no editables o fijas" },
          { key: "materialPorDefecto", label: "Material por defecto", descripcion: "Tono base de mallas neutras" },
          { key: "mallasCristal", label: "Mallas de cristal", descripcion: "Semitransparencia de vidrio/acrílico" },
          { key: "colorHerrajes", label: "Herrajes y mecanizados", descripcion: "Minifix, pernos y perforaciones" },
        ],
      },
      {
        titulo: "Objetos de interfaz",
        icono: <Layout style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />,
        items: [
          { key: "fondoAplicacion", label: "Fondo de aplicación", descripcion: "Espacio y separación entre paneles" },
          { key: "fondoPaneles", label: "Fondo de paneles y barra superior", descripcion: "Superficie de tarjetas, N-Panel y cabecera" },
          { key: "bordePaneles", label: "Bordes de paneles", descripcion: "Líneas divisorias, marcos y controles" },
          { key: "textoPrincipal", label: "Texto de interfaz", descripcion: "Títulos, etiquetas y valores generales" },
          { key: "textoLogotipo", label: "Texto logotipo", descripcion: "Color de 3dBimFab y Powered by" },
          { key: "color3BF", label: "Color 3BF", descripcion: "Color del texto 3BF en el recuadro rojo" },
          { key: "textoSecundario", label: "Texto secundario (Subtítulos / Versión)", descripcion: "Etiquetas secundarias y subtítulos" },
          { key: "botonActivo", label: "Botones activos e iconos fijos", descripcion: "Pestañas seleccionadas, herramientas activas e iconos fijos" },
          { key: "botonInactivo", label: "Botones inactivos", descripcion: "Pestañas y opciones secundarias" },
          { key: "bordeBotonInactivo", label: "Borde de botones inactivos", descripcion: "Líneas de botones secundarios" },
          { key: "panelContenedor", label: "Panel contenedor", descripcion: "Cápsula y barra de pestañas" },
          { key: "insigniaFondo", label: "Insignias y badges (Fondo)", descripcion: "Fondo de etiquetas de versión y estado" },
          { key: "estadoActivo", label: "Indicadores de estado (Online / Activo)", descripcion: "Color de estado online y pieza activa" },
        ],
      },
      {
        titulo: "Ficha de Despiece & Base de Datos",
        icono: <Table style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />,
        items: [
          { key: "tablaEncabezadoFondo", label: "Encabezados de tabla (Fondo)", descripcion: "Fondo de columnas de tablas BOM" },
          { key: "tablaEncabezadoTexto", label: "Encabezados de tabla (Texto)", descripcion: "Texto de columnas de tablas BOM" },
          { key: "tablaFilaFondo", label: "Celdas y filas de tabla", descripcion: "Fondo de las filas de despiece" },
          { key: "tablaBorde", label: "Bordes y líneas de tabla", descripcion: "Divisores entre celdas" },
          { key: "tablaTotalFondo", label: "Fila de Total Consolidado", descripcion: "Barra final de costo total" },
          { key: "tablaTotalTexto", label: "Texto de Fila Total", descripcion: "Color de letras en la barra de total" },
          { key: "kpiTarjetaFondo", label: "Tarjetas KPI Métricas", descripcion: "Fondo de métricas superiores" },
          { key: "kpiTarjetaTexto", label: "Valores KPI Métricas", descripcion: "Color de números de costo y m²" },
        ],
      },
    ];
  }, [pestanaActiva, coloresApariencia?.botonActivo]);

  const handleGuardarPredefinido = () => {
    guardarComoPredefinido();
    setGuardadoFeedback(true);
    setTimeout(() => setGuardadoFeedback(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs custom-scrollbar">
      
      {/* 🔘 SELECTOR DE ESQUEMA (ESTILO ORIGINAL RHINOCEROS 8) */}
      <div 
        style={{ 
          backgroundColor: coloresApariencia.fondoPaneles, 
          borderColor: coloresApariencia?.bordePaneles 
        }}
        className="p-3 rounded-xl border shadow-xs space-y-2 transition-colors"
      >
        <div 
          style={{ color: coloresApariencia?.textoPrincipal }}
          className="text-[11px] font-bold"
        >
          Esquema de Color
        </div>
        <div 
          style={{ color: coloresApariencia?.textoPrincipal }}
          className="flex items-center gap-6 text-xs font-semibold"
        >
          <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition">
            <input
              type="radio"
              name="esquema"
              value="oscuro"
              checked={esquemaColor === "oscuro"}
              onChange={() => setEsquemaColor("oscuro")}
              style={{ accentColor: coloresApariencia?.bordePaneles }}
              className="cursor-pointer"
            />
            <span>Oscuro</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition">
            <input
              type="radio"
              name="esquema"
              value="claro"
              checked={esquemaColor === "claro"}
              onChange={() => setEsquemaColor("claro")}
              style={{ accentColor: coloresApariencia?.bordePaneles }}
              className="cursor-pointer"
            />
            <span>Claro</span>
          </label>
        </div>
      </div>

      {/* 🔤 SELECTOR DE TIPOGRAFÍA GLOBAL */}
      <div 
        style={{ 
          backgroundColor: coloresApariencia.fondoPaneles, 
          borderColor: coloresApariencia?.bordePaneles 
        }}
        className="p-3 rounded-xl border shadow-xs space-y-2 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div 
            style={{ color: coloresApariencia?.textoPrincipal }}
            className="flex items-center gap-1.5 font-bold text-xs"
          >
            <Type style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />
            <span>Tipografía de Interfaz</span>
          </div>
          <span 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="text-[10px] font-medium"
          >
            Global
          </span>
        </div>

        <select
          value={fuenteInterfaz || "sistema"}
          onChange={(e) => setFuenteInterfaz(e.target.value)}
          style={{
            backgroundColor: coloresApariencia.fondoAplicacion || "#F1F5F9",
            borderColor: coloresApariencia.bordePaneles || "#CBD5E1",
            color: coloresApariencia.textoPrincipal || "#0F172A",
          }}
          className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="sistema">Sistema (Segoe UI / Roboto Default)</option>
          <option value="prompt">Prompt (Google Font Geométrica / Tech)</option>
          <option value="inter">Inter (Equivalente Helvética Moderno)</option>
          <option value="arimo">Arimo (Métrica 1:1 Helvética Clásica)</option>
        </select>
      </div>

      {/* 📐 PROPIEDADES DE REJILLA (RHINOCEROS 8 EXACT MATCH) */}
      <div 
        style={{ 
          backgroundColor: coloresApariencia.fondoPaneles, 
          borderColor: coloresApariencia?.bordePaneles 
        }} 
        className="p-3 rounded-xl border shadow-xs space-y-3 transition-colors"
      >
        <div 
          style={{ 
            borderColor: coloresApariencia?.bordePaneles,
            color: coloresApariencia?.textoPrincipal 
          }}
          className="flex items-center gap-1.5 font-bold text-xs pb-1.5 border-b"
        >
          <Grid3X3 style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />
          <span>Propiedades de rejilla</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* 1. Número de líneas de rejilla */}
          <div className="flex items-center gap-2">
            <span style={{ color: coloresApariencia.textoPrincipal }} className="w-[145px] shrink-0 text-[11px] leading-tight">
              Número de líneas de rejilla:
            </span>
            <input
              type="number"
              min={10}
              max={2000}
              step={10}
              value={calibracion.numeroLineasRejilla || 500}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 500;
                setCalibracion("numeroLineasRejilla", val);
              }}
              style={{
                backgroundColor: coloresApariencia.fondoAplicacion || "#F1F5F9",
                borderColor: coloresApariencia.bordePaneles || "#CBD5E1",
                color: coloresApariencia.textoPrincipal || "#0F172A",
              }}
              className="w-14 px-1.5 py-1 rounded border text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0"
            />
          </div>

          {/* 2. Espaciado de la línea de rejilla secundaria */}
          <div className="flex items-center gap-2">
            <span style={{ color: coloresApariencia.textoPrincipal }} className="w-[145px] shrink-0 text-[11px] leading-tight">
              Espaciado de la línea de rejilla secundaria:
            </span>
            <input
              type="number"
              min={1}
              max={500}
              step={1}
              value={calibracion.espaciadoRejillaSecundariaMm || 10}
              onChange={(e) => {
                const mm = parseFloat(e.target.value) || 10;
                setCalibracion("espaciadoRejillaSecundariaMm", mm);
                setCalibracion("distanciaCuadricula", mm / 1000);
                setCalibracion("distanciaSeccion", (mm * (calibracion.lineasPrincipalesCada || 10)) / 1000);
              }}
              style={{
                backgroundColor: coloresApariencia.fondoAplicacion || "#F1F5F9",
                borderColor: coloresApariencia.bordePaneles || "#CBD5E1",
                color: coloresApariencia.textoPrincipal || "#0F172A",
              }}
              className="w-14 px-1.5 py-1 rounded border text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0"
            />
            <span style={{ color: coloresApariencia.textoSecundario }} className="text-[11px] shrink-0">
              milímetros
            </span>
          </div>

          {/* 3. Líneas principales cada */}
          <div className="flex items-center gap-2">
            <span style={{ color: coloresApariencia.textoPrincipal }} className="w-[145px] shrink-0 text-[11px] leading-tight">
              Líneas principales cada:
            </span>
            <input
              type="number"
              min={2}
              max={100}
              step={1}
              value={calibracion.lineasPrincipalesCada || 10}
              onChange={(e) => {
                const cant = parseInt(e.target.value) || 10;
                setCalibracion("lineasPrincipalesCada", cant);
                setCalibracion("distanciaSeccion", ((calibracion.espaciadoRejillaSecundariaMm || 10) * cant) / 1000);
              }}
              style={{
                backgroundColor: coloresApariencia.fondoAplicacion || "#F1F5F9",
                borderColor: coloresApariencia.bordePaneles || "#CBD5E1",
                color: coloresApariencia.textoPrincipal || "#0F172A",
              }}
              className="w-14 px-1.5 py-1 rounded border text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-cyan-500 shrink-0"
            />
            <span style={{ color: coloresApariencia.textoSecundario }} className="text-[10px] leading-tight shrink-0">
              líneas de rejilla secundarias
            </span>
          </div>

          <div 
            style={{ borderColor: coloresApariencia?.insigniaFondo || coloresApariencia?.bordePaneles }}
            className="pt-2 border-t space-y-2"
          >
            {/* Checkbox: Mostrar líneas de rejilla */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={calibracion.mostrarGrilla}
                onChange={(e) => setCalibracion("mostrarGrilla", e.target.checked)}
                style={{ accentColor: coloresApariencia?.botonActivo || coloresApariencia?.bordePaneles }}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span style={{ color: coloresApariencia.textoPrincipal }} className="text-xs font-medium">
                Mostrar líneas de rejilla
              </span>
            </label>

            {/* Checkbox: Mostrar ejes de rejilla */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={calibracion.mostrarEjesCoordenadas}
                onChange={(e) => {
                  const val = e.target.checked;
                  setCalibracion("mostrarEjesCoordenadas", val);
                  setCalibracion("mostrarEjeX", val);
                  setCalibracion("mostrarEjeY", val);
                }}
                style={{ accentColor: coloresApariencia?.botonActivo || coloresApariencia?.bordePaneles }}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span style={{ color: coloresApariencia.textoPrincipal }} className="text-xs font-medium">
                Mostrar ejes de rejilla
              </span>
            </label>

            {/* Checkbox: Mostrar icono de ejes del plano universal */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={calibracion.mostrarIconoPlanoUniversal !== false}
                onChange={(e) => setCalibracion("mostrarIconoPlanoUniversal", e.target.checked)}
                style={{ accentColor: coloresApariencia?.botonActivo || coloresApariencia?.bordePaneles }}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span style={{ color: coloresApariencia.textoPrincipal }} className="text-xs font-medium">
                Mostrar icono de ejes del plano universal
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 📋 GLOSARIO DE COLORES POR CATEGORÍA (RHINO 8 STYLE TABLES) */}
      {gruposColores.map((grupo) => (
        <div 
          key={grupo.titulo}
          style={{ 
            backgroundColor: coloresApariencia.fondoPaneles, 
            borderColor: coloresApariencia?.bordePaneles 
          }}
          className="p-3 rounded-xl border shadow-xs space-y-2 transition-colors"
        >
          {/* Título de Categoría */}
          <div 
            style={{ 
              borderColor: coloresApariencia?.bordePaneles,
              color: coloresApariencia?.textoPrincipal 
            }}
            className="flex items-center gap-1.5 font-bold text-xs pb-1 border-b"
          >
            {grupo.icono}
            <span>{grupo.titulo}</span>
          </div>

          {/* Filas de Colores con Rectángulo Swatch y Botones de Copiar/Pegar */}
          <div className="space-y-1.5 pt-1">
            {grupo.items.map((item) => {
              const valorColor = coloresApariencia[item.key] || "#888888";
              
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:opacity-80 transition gap-2"
                >
                  {/* Nombre y descripción del objeto BIM */}
                  <div className="min-w-0 flex-1">
                    <span 
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="text-[11px] font-medium block truncate" 
                      title={item.descripcion || item.label}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Bloque de Acciones: Input HEX/Inkscape + Swatch Visual + Cuentagotas Universal */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {/* Input de Texto HEX Editable (1 Clic Selecciona Todo + Pegar directo de Inkscape) */}
                    <input
                      type="text"
                      value={valorColor.toUpperCase()}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData("text");
                        const parsed = procesarColorInkscape(text);
                        if (parsed) {
                          e.preventDefault();
                          setColorApariencia(item.key, parsed);
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        const parsed = procesarColorInkscape(val);
                        if (parsed) {
                          setColorApariencia(item.key, parsed);
                        } else if (/^#?[0-9A-Fa-f]{0,8}$/.test(val)) {
                          const formatted = val.startsWith("#") ? val : `#${val}`;
                          setColorApariencia(item.key, formatted);
                        }
                      }}
                      onBlur={(e) => {
                        const parsed = procesarColorInkscape(e.target.value);
                        if (parsed) {
                          setColorApariencia(item.key, parsed);
                        } else {
                          setColorApariencia(item.key, valorColor.length === 7 ? valorColor : "#888888");
                        }
                      }}
                      placeholder="#HEX"
                      maxLength={15}
                      title="Escribe o pega cualquier código (ej: #BB0F0F o bb0f0fff de Inkscape)"
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal
                      }}
                      className="w-16 h-5 text-center text-[10px] font-mono font-bold rounded border focus:outline-none focus:ring-1 focus:ring-cyan-500 selection:bg-cyan-600 selection:text-white cursor-text transition-colors"
                    />

                    {/* Muestra de Color Visual (Clic abre la paleta clásica) */}
                    <div 
                      className="relative w-5 h-5 rounded border shadow-xs shrink-0 overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: valorColor,
                        borderColor: coloresApariencia?.bordePaneles || "#94A3B8"
                      }}
                      title={`Color actual de ${item.label}. Clic para abrir paleta clásica.`}
                    >
                      <input
                        type="color"
                        value={valorColor.length === 7 ? valorColor : "#888888"}
                        onChange={(e) => setColorApariencia(item.key, e.target.value.toUpperCase())}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </div>

                    {/* 💧 Botón Cuentagotas Universal (Captura cualquier pixel de la pantalla / Inkscape) */}
                    <button
                      type="button"
                      onClick={() => abrirCuentagotas(item.key)}
                      title={`Cuentagotas Universal: Haz clic para capturar cualquier color de la pantalla o de Inkscape para ${item.label}`}
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.colorMarca || "#0891b2",
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded border shadow-xs hover:bg-cyan-500/20 hover:scale-110 active:scale-95 transition-all cursor-pointer group"
                    >
                      <Pipette className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* 🛠️ BARRA DE ACCIONES AL FINAL */}
      <div className="pt-2 flex flex-col gap-2">
        
        {/* Botón 1: Guardar como predefinido */}
        <button
          onClick={handleGuardarPredefinido}
          style={{
            backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
            color: "#FFFFFF",
          }}
          className="w-full py-2 px-3 rounded-lg font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
        >
          {guardadoFeedback ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>¡Perfil {esquemaColor === "claro" ? "Claro" : "Oscuro"} guardado como predefinido!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Guardar como predefinido ({esquemaColor === "claro" ? "Perfil Claro" : "Perfil Oscuro"})</span>
            </>
          )}
        </button>

        {/* Botón 2: Restaurar valores predeterminados de fábrica */}
        <button
          onClick={restaurarColoresApariencia}
          style={{
            backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
            color: "#FFFFFF",
          }}
          className="w-full py-2 px-3 rounded-lg font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          title={`Restaura los valores de fábrica originales para el perfil ${esquemaColor === "claro" ? "Claro" : "Oscuro"}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar valores de fábrica ({esquemaColor === "claro" ? "Claro" : "Oscuro"})</span>
        </button>
      </div>
    </div>
  );
}

// Función auxiliar para calcular contraste de texto (blanco o negro) sobre el swatch
function getContrastColor(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith("#")) return "#000000";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}
