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
  ClipboardPaste, 
  Save, 
  Table, 
  Sparkles 
} from "lucide-react";

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
    restaurarColoresApariencia,
    guardarComoPredefinido,
  } = use3BFStore();

  const [copiadoGeneral, setCopiadoGeneral] = useState(false);
  const [guardadoFeedback, setGuardadoFeedback] = useState(false);
  const [itemCopiadoKey, setItemCopiadoKey] = useState<string | null>(null);

  // Definición de grupos de colores según la sección activa
  const gruposColores: ColorGroupDef[] = React.useMemo(() => {
    // Si estamos en la ficha de Despiece & Costos
    if (pestanaActiva === "despiece") {
      return [
        {
          titulo: "Ficha de Despiece & Tablas (BOM)",
          icono: <Table className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
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
          icono: <Layout className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
          items: [
            { key: "fondoPaneles", label: "Fondo de paneles", descripcion: "Superficie de tarjetas y N-Panel" },
            { key: "bordePaneles", label: "Bordes de paneles", descripcion: "Líneas divisorias y marcos" },
            { key: "textoPrincipal", label: "Texto principal", descripcion: "Títulos y valores activos" },
            { key: "textoSecundario", label: "Texto secundario", descripcion: "Etiquetas, unidades y subtítulos" },
            { key: "colorMarca", label: "Color de marca", descripcion: "Acentos Cyan / Brand principal" },
            { key: "botonActivo", label: "Botones activos", descripcion: "Pestañas y modos seleccionados" },
            { key: "fondoTopNav", label: "Fondo de barra superior", descripcion: "Cabecera principal TopNav" },
          ],
        },
      ];
    }

    // Si estamos en la ficha de Base de Datos
    if (pestanaActiva === "basedatos") {
      return [
        {
          titulo: "Base de Datos (Tablas & Materias Primas)",
          icono: <Table className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
          items: [
            { key: "tablaEncabezadoFondo", label: "Encabezados de tabla (Fondo)", descripcion: "Fondo de columnas de tablas" },
            { key: "tablaEncabezadoTexto", label: "Encabezados de tabla (Texto)", descripcion: "Texto de columnas de tablas" },
            { key: "tablaFilaFondo", label: "Celdas y filas de materias primas", descripcion: "Fondo de las filas de materiales" },
            { key: "tablaBorde", label: "Bordes y líneas de tabla", descripcion: "Divisores entre celdas" },
          ],
        },
        {
          titulo: "Objetos de interfaz",
          icono: <Layout className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
          items: [
            { key: "fondoPaneles", label: "Fondo de paneles", descripcion: "Superficie de tarjetas y N-Panel" },
            { key: "bordePaneles", label: "Bordes de paneles", descripcion: "Líneas divisorias y marcos" },
            { key: "textoPrincipal", label: "Texto principal", descripcion: "Títulos y valores activos" },
            { key: "textoSecundario", label: "Texto secundario", descripcion: "Etiquetas, unidades y subtítulos" },
            { key: "colorMarca", label: "Color de marca", descripcion: "Acentos Cyan / Brand principal" },
            { key: "botonActivo", label: "Botones activos", descripcion: "Pestañas y modos seleccionados" },
            { key: "fondoTopNav", label: "Fondo de barra superior", descripcion: "Cabecera principal TopNav" },
          ],
        },
      ];
    }

    // Vista general en el Visor 3D (Rhinoceros 8 Style Completo)
    return [
      {
        titulo: "Colores de la vista",
        icono: <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
        items: [
          { key: "fondo3D", label: "Fondo", descripcion: "Color de fondo del visor 3D" },
          { key: "rejillaPrincipal", label: "Línea de rejilla principal", descripcion: "Ejes y subdivisiones mayores" },
          { key: "rejillaSecundaria", label: "Línea de rejilla secundaria", descripcion: "Cuadrícula fina del suelo" },
          { key: "ejeX", label: "Línea de eje X", descripcion: "Eje horizontal universal (Rojo)" },
          { key: "ejeY", label: "Línea de eje Y", descripcion: "Eje de profundidad universal (Verde)" },
          { key: "ejeZ", label: "Línea de eje Z", descripcion: "Eje de altura universal (Azul)" },
          { key: "iconoPlanoUniversalX", label: "Icono del eje del plano universal X" },
          { key: "iconoPlanoUniversalY", label: "Icono del eje del plano universal Y" },
          { key: "iconoPlanoUniversalZ", label: "Icono del eje del plano universal Z" },
          { key: "siluetaBordes", label: "Aristas de corte y silueta", descripcion: "Líneas de contorno 3D" },
        ],
      },
      {
        titulo: "Visualización de objetos",
        icono: <Palette className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
        items: [
          { key: "objetosSeleccionados", label: "Objetos seleccionados", descripcion: "Caja delimitadora y highlight" },
          { key: "objetosBloqueados", label: "Objetos bloqueados", descripcion: "Piezas no editables o fijas" },
          { key: "materialPorDefecto", label: "Material por defecto", descripcion: "Tono base de mallas neutras" },
          { key: "mallasCristal", label: "Mallas de cristal", descripcion: "Semitransparencia de vidrio/acrílico" },
          { key: "colorHerrajes", label: "Herrajes y mecanizados", descripcion: "Minifix, pernos y perforaciones" },
          { key: "colorTapacantos", label: "Tapacantos y bordes", descripcion: "Canto de melamina aplicado" },
        ],
      },
      {
        titulo: "Objetos de interfaz",
        icono: <Layout className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
        items: [
          { key: "fondoPaneles", label: "Fondo de paneles", descripcion: "Superficie de tarjetas y N-Panel" },
          { key: "bordePaneles", label: "Bordes de paneles", descripcion: "Líneas divisorias y marcos" },
          { key: "textoPrincipal", label: "Texto principal", descripcion: "Títulos y valores activos" },
          { key: "textoSecundario", label: "Texto secundario", descripcion: "Etiquetas, unidades y subtítulos" },
          { key: "colorMarca", label: "Color de marca", descripcion: "Acentos Cyan / Brand principal" },
          { key: "botonActivo", label: "Botones activos", descripcion: "Pestañas y modos seleccionados" },
          { key: "fondoTopNav", label: "Fondo de barra superior", descripcion: "Cabecera principal TopNav" },
          { key: "lineasReferencia", label: "Líneas de referencia", descripcion: "Líneas de cota y alineación" },
        ],
      },
      {
        titulo: "Ficha de Despiece & Base de Datos",
        icono: <Table className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
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
      {
        titulo: "Colores de widget",
        icono: <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
        items: [
          { key: "widgetEjeU", label: "Eje U (Gizmo X)", descripcion: "Eje de traslación horizontal" },
          { key: "widgetEjeV", label: "Eje V (Gizmo Y)", descripcion: "Eje de traslación profundidad" },
          { key: "widgetEjeW", label: "Eje W (Gizmo Z)", descripcion: "Eje de traslación vertical" },
          { key: "puntoSnap", label: "Punto de anclaje (Snap)", descripcion: "Puntos magnéticos de ensamble" },
        ],
      },
    ];
  }, [pestanaActiva]);

  // Copiar color individual al portapapeles con 1 toque
  const copiarColorIndividual = (clave: string, valor: string) => {
    navigator.clipboard.writeText(valor.toUpperCase());
    setItemCopiadoKey(clave);
    setTimeout(() => setItemCopiadoKey(null), 1500);
  };

  // Pegar color desde el portapapeles directamente al swatch con 1 toque
  const pegarColorIndividual = async (clave: keyof ColoresApariencia) => {
    try {
      const texto = await navigator.clipboard.readText();
      const limpio = texto.trim();
      if (/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(limpio)) {
        const hex = limpio.startsWith("#") ? limpio : `#${limpio}`;
        setColorApariencia(clave, hex);
        setItemCopiadoKey(`${clave}_pasted`);
        setTimeout(() => setItemCopiadoKey(null), 1500);
      }
    } catch {
      // Si el navegador bloquea clipboard.readText, solicitar entrada manual rápida
      const entrada = window.prompt("Pega el código hexadecimal (ej: #F8FAFC):");
      if (entrada && /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(entrada.trim())) {
        const hex = entrada.trim().startsWith("#") ? entrada.trim() : `#${entrada.trim()}`;
        setColorApariencia(clave, hex);
      }
    }
  };

  const copiarConfiguracion = () => {
    navigator.clipboard.writeText(JSON.stringify(coloresApariencia, null, 2));
    setCopiadoGeneral(true);
    setTimeout(() => setCopiadoGeneral(false), 2000);
  };

  const handleGuardarPredefinido = () => {
    guardarComoPredefinido();
    setGuardadoFeedback(true);
    setTimeout(() => setGuardadoFeedback(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs custom-scrollbar">
      
      {/* 🔘 SELECTOR DE ESQUEMA (ESTILO RHINOCEROS 8) */}
      <div 
        style={{ 
          backgroundColor: coloresApariencia.fondoPaneles, 
          borderColor: coloresApariencia.bordePaneles 
        }}
        className="p-3 rounded-xl border shadow-xs space-y-2 transition-colors"
      >
        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
          Esquema de Color
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition">
            <input
              type="radio"
              name="esquema"
              value="oscuro"
              checked={esquemaColor === "oscuro"}
              onChange={() => setEsquemaColor("oscuro")}
              className="accent-cyan-600 cursor-pointer"
            />
            <span>Oscuro</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition">
            <input
              type="radio"
              name="esquema"
              value="claro"
              checked={esquemaColor === "claro"}
              onChange={() => setEsquemaColor("claro")}
              className="accent-cyan-600 cursor-pointer"
            />
            <span>Claro</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition">
            <input
              type="radio"
              name="esquema"
              value="personalizado"
              checked={esquemaColor === "personalizado"}
              onChange={() => setEsquemaColor("personalizado")}
              className="accent-cyan-600 cursor-pointer"
            />
            <span>Personalizado</span>
          </label>
        </div>
      </div>

      {/* 📋 GLOSARIO DE COLORES POR CATEGORÍA (RHINO 8 STYLE TABLES) */}
      {gruposColores.map((grupo) => (
        <div 
          key={grupo.titulo}
          style={{ 
            backgroundColor: coloresApariencia.fondoPaneles, 
            borderColor: coloresApariencia.bordePaneles 
          }}
          className="p-3 rounded-xl border shadow-xs space-y-2 transition-colors"
        >
          {/* Título de Categoría */}
          <div 
            style={{ borderColor: coloresApariencia.bordePaneles }}
            className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs pb-1 border-b"
          >
            {grupo.icono}
            <span>{grupo.titulo}</span>
          </div>

          {/* Filas de Colores con Rectángulo Swatch y Botones de Copiar/Pegar */}
          <div className="space-y-1.5 pt-1">
            {grupo.items.map((item) => {
              const valorColor = coloresApariencia[item.key] || "#888888";
              const isCopied = itemCopiadoKey === item.key;
              const isPasted = itemCopiadoKey === `${item.key}_pasted`;
              
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition gap-2"
                >
                  {/* Nombre y descripción del objeto BIM */}
                  <div className="min-w-0 flex-1">
                    <span 
                      className="text-[11px] font-medium text-slate-800 dark:text-slate-200 block truncate" 
                      title={item.descripcion || item.label}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Bloque de Acciones: Copiar + Pegar + Swatch */}
                  <div className="shrink-0 flex items-center gap-1">
                    
                    {/* Botón 1-Touch: Copiar Color */}
                    <button
                      type="button"
                      onClick={() => copiarColorIndividual(item.key, valorColor)}
                      title={`Copiar color ${valorColor} al portapapeles`}
                      className="p-1 rounded hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>

                    {/* Botón 1-Touch: Pegar Color */}
                    <button
                      type="button"
                      onClick={() => pegarColorIndividual(item.key)}
                      title="Pegar color (#HEX) desde el portapapeles"
                      className="p-1 rounded hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                    >
                      {isPasted ? (
                        <Check className="w-3 h-3 text-cyan-500" />
                      ) : (
                        <ClipboardPaste className="w-3 h-3" />
                      )}
                    </button>

                    {/* Rectángulo Swatch Interactivo Estilo Rhino 8 */}
                    <div className="relative shrink-0 flex items-center">
                      <input
                        type="color"
                        value={valorColor}
                        onChange={(e) => setColorApariencia(item.key, e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        title={`Cambiar color de ${item.label} (${valorColor})`}
                      />
                      <div 
                        className="w-16 h-5 rounded border border-slate-400/60 dark:border-slate-600 shadow-xs flex items-center justify-center text-[9px] font-mono font-bold transition-transform hover:scale-105"
                        style={{ 
                          backgroundColor: valorColor,
                          color: getContrastColor(valorColor)
                        }}
                      >
                        {isCopied ? "COPIADO" : isPasted ? "PEGADO" : valorColor.toUpperCase()}
                      </div>
                    </div>
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
          className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
        >
          {guardadoFeedback ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>¡Guardado como predefinido!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Guardar como predefinido</span>
            </>
          )}
        </button>

        {/* Botón 2: Restaurar valores predeterminados */}
        <button
          onClick={restaurarColoresApariencia}
          className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restaurar valores predeterminados
        </button>

        {/* Botón 3: Copiar Paleta JSON */}
        <button
          onClick={copiarConfiguracion}
          className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {copiadoGeneral ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">¡Paleta Copiada al Portapapeles!</span>
            </>
          ) : (
            <>
              <span>Copiar Paleta JSON</span>
            </>
          )}
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
