"use client";

import React, { useState, useMemo } from "react";
import { use3BFStore, RecetaColorMueble, FichaProductoDef } from "@/lib/store";
import ColorSwatchItem from "./ColorSwatchItem";
import SaveColorRecipeModal from "./SaveColorRecipeModal";
import { 
  Tag, 
  Ruler, 
  Sparkles, 
  Plus, 
  Edit3, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  Wrench, 
  ShieldCheck, 
  Info, 
  Trash2,
  FileText,
  Boxes,
  Save,
  Palette,
  FolderPlus,
  Layers
} from "lucide-react";

export default function ProductSheetPanel() {
  const {
    objetoActivoId,
    instancias,
    resultado,
    coloresApariencia,
    esquemaColor,
    muebleActivoGuardado,
    setModalGuardarComoAbierto,
    getFichaProductoActivo,
    actualizarFichaProducto,
    aplicarRecetaColor,
    eliminarRecetaColor,
    recetaEnEdicion,
    iniciarEdicionReceta,
    cancelarEdicionReceta,
    guardarEstadoActualEnReceta
  } = use3BFStore();

  const esOscuro = esquemaColor === "oscuro";
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0891B2");

  // Instancia del mueble activo
  const objetoActivo = objetoActivoId ? instancias[objetoActivoId] : null;
  const muebleId = muebleActivoGuardado?.nombre || objetoActivo?.definitionId || "Componente Estándar";
  const resultadoEfectivo = (objetoActivoId && instancias[objetoActivoId]?.resultado) || resultado;

  // Ficha y Recetas
  const ficha = getFichaProductoActivo();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modalNuevaReceta, setModalNuevaReceta] = useState(false);

  // Estados de acordeones
  const [acordeonMateriales, setAcordeonMateriales] = useState(true);
  const [acordeonDfma, setAcordeonDfma] = useState(false);
  const [acordeonMontaje, setAcordeonMontaje] = useState(false);

  // Edición local temporal
  const [tituloTemp, setTituloTemp] = useState(ficha.titulo);
  const [descCortaTemp, setDescCortaTemp] = useState(ficha.descripcionCorta);
  const [descLargaTemp, setDescLargaTemp] = useState(ficha.descripcionLarga);
  const [cuidadosTemp, setCuidadosTemp] = useState(ficha.materialesCuidados);

  // Receta activa actualmente
  const recetaActiva = ficha.recetasColor.find((r) => r.id === ficha.recetaColorActivaId) || ficha.recetasColor[0];

  // Cálculo dinámico de Bounding Box en mm desde el resultado 3D
  const dimensiones = useMemo(() => {
    if (ficha.dimensionesManuales?.ancho && ficha.dimensionesManuales?.alto && ficha.dimensionesManuales?.profundidad) {
      return {
        ancho: ficha.dimensionesManuales.ancho,
        alto: ficha.dimensionesManuales.alto,
        profundidad: ficha.dimensionesManuales.profundidad
      };
    }
    // Si hay bounding box en el cómputo:
    const bbox = (resultadoEfectivo as any)?.bounding_box_global;
    if (bbox && bbox.min && bbox.max) {
      const dx = Math.round(Math.abs(bbox.max[0] - bbox.min[0]));
      const dy = Math.round(Math.abs(bbox.max[1] - bbox.min[1]));
      const dz = Math.round(Math.abs(bbox.max[2] - bbox.min[2]));
      return { ancho: dx || 1295, profundidad: dy || 480, alto: dz || 930 };
    }
    return { ancho: 1295, alto: 930, profundidad: 480 };
  }, [ficha.dimensionesManuales, resultadoEfectivo]);

  // Resumen DfMA desde el cómputo activo
  const metricasDfma = useMemo(() => {
    const meshes = (resultadoEfectivo as any)?.real_meshes || [];
    const piezasFisicas = meshes.filter((m: any) => !m.name?.toLowerCase().includes("parafuso") && !m.name?.toLowerCase().includes("prego") && !m.name?.toLowerCase().includes("grampo")).length;
    const herrajes = meshes.filter((m: any) => m.name?.toLowerCase().includes("parafuso") || m.name?.toLowerCase().includes("prego") || m.name?.toLowerCase().includes("porca") || m.name?.toLowerCase().includes("grampo")).length;
    return {
      totalMallas: meshes.length,
      piezasFisicas: piezasFisicas || 51,
      herrajesTotales: herrajes || 95
    };
  }, [resultadoEfectivo]);

  const handleGuardarEdicion = () => {
    actualizarFichaProducto(muebleId, {
      titulo: tituloTemp.trim() || ficha.titulo,
      descripcionCorta: descCortaTemp.trim(),
      descripcionLarga: descLargaTemp.trim(),
      materialesCuidados: cuidadosTemp.trim()
    });
    if (recetaEnEdicion) {
      guardarEstadoActualEnReceta();
    }
    setModoEdicion(false);
  };

  const handleToggleEdicion = () => {
    if (modoEdicion) {
      handleGuardarEdicion();
    } else {
      setTituloTemp(ficha.titulo);
      setDescCortaTemp(ficha.descripcionCorta);
      setDescLargaTemp(ficha.descripcionLarga);
      setCuidadosTemp(ficha.materialesCuidados);
      setModoEdicion(true);
      iniciarEdicionReceta(muebleId, recetaActiva.id);
    }
  };

  return (
    <div
      style={{
        backgroundColor: coloresApariencia?.fondoPaneles,
        color: coloresApariencia?.textoPrincipal
      }}
      className="flex flex-col h-full overflow-y-auto custom-scrollbar select-none text-xs"
    >
      {/* 🏷️ Cabecera Superior: Modo Edición y Nombre Comercial */}
      <div
        style={{ borderColor: coloresApariencia?.bordePaneles }}
        className="p-3 lg:p-3.5 border-b space-y-2 shrink-0"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {muebleActivoGuardado ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                📁 {muebleActivoGuardado.marca} / {muebleActivoGuardado.tipologia}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Componente Inteligente (Estándar)</span>
              </span>
            )}
          </div>

          <button
            onClick={handleToggleEdicion}
            style={{
              backgroundColor: (modoEdicion || recetaEnEdicion) ? colorBotonActivo : (esOscuro ? "#1E293B" : "#E2E8F0"),
              color: (modoEdicion || recetaEnEdicion) ? "#FFFFFF" : (esOscuro ? "#CBD5E1" : "#0F172A")
            }}
            className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer transition hover:opacity-90 shadow-2xs shrink-0"
          >
            {(modoEdicion || recetaEnEdicion) ? (
              <>
                <Check className="w-3 h-3" />
                <span>Listo</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3" />
                <span>Editar</span>
              </>
            )}
          </button>
        </div>

        {/* Título de Producto (Editable en modo edición) */}
        {modoEdicion ? (
          <input
            type="text"
            value={tituloTemp}
            onChange={(e) => setTituloTemp(e.target.value)}
            className="w-full px-2.5 py-1 text-sm font-bold rounded-full border border-cyan-500 bg-transparent focus:outline-none"
          />
        ) : (
          <h1 className="text-sm lg:text-base font-extrabold leading-tight tracking-tight">
            {ficha.titulo}
          </h1>
        )}

        {/* Referencia SKU Dinámica (Reacciona al color seleccionado) */}
        <div className="flex items-center gap-2">
          <span
            style={{
              backgroundColor: esOscuro ? "#1E293B" : "#F1F5F9",
              borderColor: esOscuro ? "#334155" : "#CBD5E1",
              color: colorBotonActivo
            }}
            className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border font-mono tracking-tight"
          >
            {recetaActiva?.referenciaSku || "Ref. D737-221"}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            • {recetaActiva?.nombre || "Acabado estándar"}
          </span>
        </div>
      </div>

      {/* 🎨 SECCIÓN 1: Color Recipe Engine (Swatches Interactivos en 1 Clic) */}
      <div
        style={{ borderColor: coloresApariencia?.bordePaneles }}
        className="p-3 lg:p-3.5 border-b space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Colores Disponibles ({ficha.recetasColor.length})
          </span>

          <button
            onClick={() => setModalNuevaReceta(true)}
            style={{ color: colorBotonActivo }}
            className="flex items-center gap-1 text-[11px] font-bold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva combinación</span>
          </button>
        </div>

        {/* Banner de Receta en Edición (Con Testigo Pulsante) */}
        {recetaEnEdicion && (
          <div
            style={{
              backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
              borderColor: colorBotonActivo
            }}
            className="p-2 lg:p-2.5 rounded-xl border flex items-center justify-between gap-2 animate-in fade-in"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping shrink-0" />
              <div className="min-w-0">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight block leading-none">
                  Editando Acabado y Piezas
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                  {recetaActiva?.nombre}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => cancelarEdicionReceta()}
                className="px-2 py-0.5 rounded-full text-[10.5px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => guardarEstadoActualEnReceta()}
                style={{ backgroundColor: colorBotonActivo }}
                title="Guardar estado de capas, piezas y balance en esta receta"
                className="w-7 h-7 rounded-full text-white flex items-center justify-center animate-pulse shadow-sm hover:scale-105 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Galería de Swatches Circulares */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {ficha.recetasColor.map((receta) => {
            const esActiva = receta.id === ficha.recetaColorActivaId;
            const estaEnEdicion = recetaEnEdicion?.recetaId === receta.id;

            return (
              <div key={receta.id} className="relative group">
                <ColorSwatchItem
                  receta={receta}
                  activa={esActiva}
                  onSelect={() => {
                    aplicarRecetaColor(muebleId, receta.id);
                    if (recetaEnEdicion) {
                      iniciarEdicionReceta(muebleId, receta.id);
                    }
                  }}
                  esOscuro={esOscuro}
                  colorActivo={colorBotonActivo}
                />

                {/* Micro-badge de Editando sobre el Swatch */}
                {estaEnEdicion && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping pointer-events-none" />
                )}

                {/* Botón de eliminar receta en modo edición (si hay más de 1) */}
                {(modoEdicion || recetaEnEdicion) && ficha.recetasColor.length > 1 && (
                  <button
                    onClick={() => eliminarRecetaColor(muebleId, receta.id)}
                    title="Eliminar esta receta"
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition cursor-pointer z-10"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Botón rápido para activar edición de materiales si no está activo */}
        {!recetaEnEdicion && (
          <div className="pt-1">
            <button
              onClick={() => iniciarEdicionReceta(muebleId, recetaActiva.id)}
              style={{
                backgroundColor: esOscuro ? "#1E293B" : "#F1F5F9",
                borderColor: esOscuro ? "#334155" : "#CBD5E1"
              }}
              className="w-full py-1.5 px-3 rounded-full border text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Editar capas y piezas de <strong>{recetaActiva?.nombre}</strong></span>
            </button>
          </div>
        )}

        {/* 💡 Banner Informativo: Componente Inteligente Estándar */}
        {!muebleActivoGuardado && ficha.recetasColor.length <= 1 && (
          <div
            style={{
              backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
              borderColor: esOscuro ? "#1E293B" : "#E2E8F0"
            }}
            className="p-2.5 rounded-xl border space-y-2 mt-2"
          >
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Este es un <strong>componente estándar</strong> con acabado base. Diseña y añade variantes de color con <strong>+ Nueva combinación</strong> o guárdalo en una carpeta de catálogo para archivar sus versiones comerciales.
            </p>
            <button
              onClick={() => setModalGuardarComoAbierto(true)}
              style={{
                backgroundColor: colorBotonActivo,
                color: "#FFFFFF"
              }}
              className="w-full py-1.5 px-3 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition hover:opacity-90 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Guardar en Carpeta de Mueble</span>
            </button>
          </div>
        )}
      </div>

      {/* 📐 SECCIÓN 2: Dimensiones del Modelo (Cotas en Tiempo Real) */}
      <div
        style={{ borderColor: coloresApariencia?.bordePaneles }}
        className="p-3 lg:p-3.5 border-b space-y-2"
      >
        <div className="flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dimensiones Generales (mm)
          </span>
        </div>

        {/* Píldoras de Medidas en Cápsulas Puras */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div
            style={{
              backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
              borderColor: esOscuro ? "#1E293B" : "#E2E8F0"
            }}
            className="p-1.5 rounded-full border flex flex-col items-center"
          >
            <span className="text-[9px] font-bold text-slate-400 uppercase">Alto (Z)</span>
            <span className="text-xs font-mono font-bold">{dimensiones.alto} mm</span>
          </div>

          <div
            style={{
              backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
              borderColor: esOscuro ? "#1E293B" : "#E2E8F0"
            }}
            className="p-1.5 rounded-full border flex flex-col items-center"
          >
            <span className="text-[9px] font-bold text-slate-400 uppercase">Ancho (X)</span>
            <span className="text-xs font-mono font-bold">{dimensiones.ancho} mm</span>
          </div>

          <div
            style={{
              backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
              borderColor: esOscuro ? "#1E293B" : "#E2E8F0"
            }}
            className="p-1.5 rounded-full border flex flex-col items-center"
          >
            <span className="text-[9px] font-bold text-slate-400 uppercase">Prof. (Y)</span>
            <span className="text-xs font-mono font-bold">{dimensiones.profundidad} mm</span>
          </div>
        </div>
      </div>

      {/* 🌟 SECCIÓN 3: Destacados Técnicos (Henn Style) */}
      <div
        style={{ borderColor: coloresApariencia?.bordePaneles }}
        className="p-3 lg:p-3.5 border-b space-y-2"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Características Clave
        </span>

        <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
          {ficha.destacadosClave.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400 shrink-0 mt-1.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 📖 SECCIÓN 4: Descripción Editorial (IKEA Style) */}
      <div
        style={{ borderColor: coloresApariencia?.bordePaneles }}
        className="p-3 lg:p-3.5 border-b space-y-2"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Descripción del Producto
        </span>

        {modoEdicion ? (
          <textarea
            rows={3}
            value={descLargaTemp}
            onChange={(e) => setDescLargaTemp(e.target.value)}
            className="w-full p-2 text-xs rounded-xl border border-cyan-500 bg-transparent focus:outline-none"
          />
        ) : (
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-sans">
            {ficha.descripcionLarga}
          </p>
        )}
      </div>

      {/* 📂 SECCIÓN 5: Acordeones Desplegables de Información Técnica */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {/* Acordeón 1: Materiales y Cuidados */}
        <div>
          <button
            onClick={() => setAcordeonMateriales(!acordeonMateriales)}
            className="w-full p-3 flex items-center justify-between font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Materiales y Cuidados</span>
            </div>
            {acordeonMateriales ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {acordeonMateriales && (
            <div className="px-3.5 pb-3 text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              {modoEdicion ? (
                <textarea
                  rows={3}
                  value={cuidadosTemp}
                  onChange={(e) => setCuidadosTemp(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-cyan-500 bg-transparent focus:outline-none"
                />
              ) : (
                <p>{ficha.materialesCuidados}</p>
              )}
            </div>
          )}
        </div>

        {/* Acordeón 2: Desglose DfMA & Herrajes */}
        <div>
          <button
            onClick={() => setAcordeonDfma(!acordeonDfma)}
            className="w-full p-3 flex items-center justify-between font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Boxes className="w-3.5 h-3.5 text-amber-600" />
              <span>Especificaciones de Fabricación (DfMA)</span>
            </div>
            {acordeonDfma ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {acordeonDfma && (
            <div className="px-3.5 pb-3 space-y-2 text-[10.5px] text-slate-500 dark:text-slate-400">
              <div className="grid grid-cols-2 gap-2">
                <div
                  style={{
                    backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
                    borderColor: esOscuro ? "#1E293B" : "#E2E8F0"
                  }}
                  className="p-2 rounded-xl border flex flex-col items-center text-center"
                >
                  <span className="text-[9.5px] uppercase font-bold text-slate-400">Piezas Físicas</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {metricasDfma.piezasFisicas} piezas
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
                    borderColor: esOscuro ? "#1E293B" : "#E2E8F0"
                  }}
                  className="p-2 rounded-xl border flex flex-col items-center text-center"
                >
                  <span className="text-[9.5px] uppercase font-bold text-slate-400">Herrajes Totales</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {metricasDfma.herrajesTotales} unidades
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic text-center">
                Mapeo 1:1 sincronizado directamente con los nodos de Grasshopper.
              </p>
            </div>
          )}
        </div>

        {/* Acordeón 3: Montaje y Documentos */}
        <div>
          <button
            onClick={() => setAcordeonMontaje(!acordeonMontaje)}
            className="w-full p-3 flex items-center justify-between font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-cyan-600" />
              <span>Montaje & Documentos</span>
            </div>
            {acordeonMontaje ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {acordeonMontaje && (
            <div className="px-3.5 pb-3 text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400 space-y-2">
              <p>{ficha.montajeNotas}</p>
              <div
                style={{
                  backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
                  borderColor: esOscuro ? "#1E293B" : "#E2E8F0"
                }}
                className="p-2 rounded-xl border flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  <span className="font-semibold text-slate-900 dark:text-white text-[11px]">
                    Manual 3D Interactivo
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">3BF Ready</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para guardar nueva receta de color */}
      <SaveColorRecipeModal
        abierto={modalNuevaReceta}
        onCerrar={() => setModalNuevaReceta(false)}
        muebleId={muebleId}
      />
    </div>
  );
}
