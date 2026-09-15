"use client";

import React, { useMemo } from "react";
import { use3BFStore, PasoManualStudio, CoreografiaShowcase, EjeAperturaShowcase, sanitizarPasosManuales } from "@/lib/store";
import { Plus, Trash2, Box, Boxes, Layers, Hammer, Sparkles, Check, CheckCircle2, ChevronRight, ChevronDown, Sliders, Wand2, PlayCircle, X, FolderPlus, Pipette, Eraser, Eye, EyeOff, Link2, Unlink, RotateCw, RotateCcw, GripVertical, Volume2, Clock, Loader2, Upload } from "lucide-react";
import { agruparMallasEnPiezasMadre, extraerPiezaMadre, anotarInstanciasFisicas, esHerrajeNombre } from "@/lib/piezaMadreUtils";

const MARCAS_DISPONIBLES = [
  { id: "Universales", nombre: "Universales / Genéricos" },
  { id: "Móveis Henn", nombre: "Móveis Henn" },
  { id: "Politorno", nombre: "Politorno Móveis" },
  { id: "RTA Design", nombre: "RTA Design" },
];

export default function StepManagerPanel() {
  const [mostrarMenuAnadirBloque, setMostrarMenuAnadirBloque] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [guardandoBloque, setGuardandoBloque] = React.useState(false);
  const [mensajeBloque, setMensajeBloque] = React.useState<string | null>(null);

  const {
    pasosManual,
    pasoActivoManualId,
    seleccionarPasoManualActivo,
    crearPasoManual,
    eliminarPasoManual,
    actualizarPasoManual,
    reordenarPasosManual,
    desasignarPiezaDePasoManual,
    desasignarHerrajeDePasoManual,
    autoDetectarGruposCinematicos,
    agregarGrupoCinematico,
    actualizarGrupoCinematico,
    eliminarGrupoCinematico,
    conmutarVisibilidadGrupoCinematico,
    conmutarVisibilidadTodosGruposCinematicos,
    conmutarVisibilidadPiezasPaso,
    conmutarOcultarNoAsignadasPaso,
    asignarPiezaAGrupoCinematico,
    desasignarPiezaDeGrupoCinematico,
    modoPickingManual,
    iniciarPickingManual,
    limpiarPickingManual,
    resultado,
    asignacionesPartes,
    coloresApariencia,
    bloqueEstandarEnEdicion,
    setBloqueEstandarEnEdicion,
  } = use3BFStore();

  // Estados locales para el formulario de Editar Bloque Estándar
  const [editNombre, setEditNombre] = React.useState("");
  const [editMarca, setEditMarca] = React.useState("Universales");
  const [editDuracion, setEditDuracion] = React.useState(8.0);
  const [editDesc, setEditDesc] = React.useState("");
  const [editGuionEs, setEditGuionEs] = React.useState("");
  const [editGuionPt, setEditGuionPt] = React.useState("");
  const [editGuionEn, setEditGuionEn] = React.useState("");
  const [editArchivosGlb, setEditArchivosGlb] = React.useState<File[]>([]);
  const [traduciendoEditGuion, setTraduciendoEditGuion] = React.useState(false);
  const [guardandoEdicionBloque, setGuardandoEdicionBloque] = React.useState(false);
  const [mensajeEdicionBloque, setMensajeEdicionBloque] = React.useState<string | null>(null);

  // Sincronizar formulario cada vez que se carga un bloque para edición
  React.useEffect(() => {
    if (bloqueEstandarEnEdicion) {
      setEditNombre(bloqueEstandarEnEdicion.nombre || "");
      setEditMarca(bloqueEstandarEnEdicion.categoriaMarca || "Universales");
      setEditDuracion(bloqueEstandarEnEdicion.duracion || 8.0);
      setEditDesc(bloqueEstandarEnEdicion.descripcion || "");
      setEditGuionEs(bloqueEstandarEnEdicion.guionEs || "");
      setEditGuionPt(bloqueEstandarEnEdicion.guionPt || "");
      setEditGuionEn(bloqueEstandarEnEdicion.guionEn || "");
      setEditArchivosGlb([]);
      setMensajeEdicionBloque(null);
    }
  }, [bloqueEstandarEnEdicion]);

  // 🛡️ Blindaje y Autocuración: Garantizar que P00 siempre esté presente y sincronizar versión de Drive si está vacío
  React.useEffect(() => {
    if (!pasosManual || pasosManual.length === 0 || !pasosManual.some((p) => p.id === "P00" || p.tipo === "showcase")) {
      const curados = sanitizarPasosManuales(pasosManual || []);
      use3BFStore.getState().setPasosManual(curados);
      return;
    }

    // Si P00 no tiene grupos cinemáticos asignados, consultar Drive para recuperar versión guardada con animaciones
    const p00 = pasosManual.find((p) => p.id === "P00");
    if (!p00?.showcase?.gruposCinematicos || p00.showcase.gruposCinematicos.length === 0) {
      use3BFStore.getState().cargarManualesDesdeDrive();
    }
  }, [pasosManual]);

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  const handleGuardarBloqueDisco = async () => {
    if (!pasoActivo || !pasoActivo.bloqueEstandar) return;
    setGuardandoBloque(true);
    try {
      const bloqueActualizado = {
        ...pasoActivo.bloqueEstandar,
        nombre: pasoActivo.titulo,
        duracion: pasoActivo.duracionTotal,
        descripcion: pasoActivo.descripcion,
        guionEs: pasoActivo.guionEs,
        guionPt: pasoActivo.guionPt,
        guionEn: pasoActivo.guionEn,
      };
      const res = await fetch("/api/bloques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bloqueActualizado),
      });
      if (res.ok) {
        setMensajeBloque("¡Guardado en disco!");
        use3BFStore.getState().cargarBloquesEstandar();
      } else {
        setMensajeBloque("Error al guardar");
      }
    } catch {
      setMensajeBloque("Error conexión");
    } finally {
      setGuardandoBloque(false);
      setTimeout(() => setMensajeBloque(null), 3500);
    }
  };

  // Traducir guiones en formulario de edición
  const handleTraducirEditGuion = async () => {
    if (!editGuionEs.trim()) return;
    setTraduciendoEditGuion(true);
    try {
      // Português
      const resPt = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editGuionEs.trim(), targetLang: "pt" }),
      });
      if (resPt.ok) {
        const dataPt = await resPt.json();
        if (dataPt.translation) setEditGuionPt(dataPt.translation);
      }

      // Inglés
      const resEn = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editGuionEs.trim(), targetLang: "en" }),
      });
      if (resEn.ok) {
        const dataEn = await resEn.json();
        if (dataEn.translation) setEditGuionEn(dataEn.translation);
      }
    } catch (err) {
      console.error("Error traduciendo guiones en edición de bloque:", err);
    } finally {
      setTraduciendoEditGuion(false);
    }
  };

  // Guardar formulario inferior de Edición de Bloque (.3bb.json)
  const handleGuardarEdicionBloque = async () => {
    if (!bloqueEstandarEnEdicion || !editNombre.trim()) return;
    setGuardandoEdicionBloque(true);
    try {
      let partesGlbSubidas = bloqueEstandarEnEdicion.partesGlb || [];
      let carpetaModelosRuta = bloqueEstandarEnEdicion.carpetaModelos || "";

      // Subir nuevos archivos GLB si el usuario seleccionó alguno
      if (editArchivosGlb.length > 0) {
        const slug = editNombre
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");

        const fd = new FormData();
        fd.append("carpeta", slug || bloqueEstandarEnEdicion.id);
        editArchivosGlb.forEach((f) => fd.append("files", f));

        try {
          const uploadRes = await fetch("/api/bloques/upload", {
            method: "POST",
            body: fd,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.success && uploadData.archivos) {
              carpetaModelosRuta = uploadData.carpetaModelos;
              partesGlbSubidas = uploadData.archivos.map((a: any) => ({
                id: a.nombre.replace(/\.glb$/i, "").toLowerCase(),
                nombre: a.nombre.replace(/\.glb$/i, ""),
                archivo: a.ruta,
              }));
            }
          }
        } catch (uploadErr) {
          console.warn("[3dBimFab] Error subiendo modelos GLB en edición:", uploadErr);
        }
      }

      const bloqueActualizado = {
        ...bloqueEstandarEnEdicion,
        nombre: editNombre.trim(),
        categoriaMarca: editMarca,
        duracion: Number(editDuracion) || 8.0,
        descripcion: editDesc.trim(),
        guionEs: editGuionEs.trim(),
        guionPt: editGuionPt.trim(),
        guionEn: editGuionEn.trim(),
        carpetaModelos: carpetaModelosRuta || undefined,
        partesGlb: partesGlbSubidas.length > 0 ? partesGlbSubidas : undefined,
        fechaModificacion: new Date().toISOString(),
      };

      // 1. Guardar en disco vía API
      const res = await fetch("/api/bloques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bloqueActualizado),
      });

      if (res.ok) {
        // 2. Si el manual padre previo contiene este bloque estándar en alguno de sus pasos, sincronizarlo
        const padre = use3BFStore.getState().manualPadrePrevioEdicionBloque;
        if (padre) {
          const pasosActualizados = padre.pasos.map((p) => {
            if (p.tipo === "bloque_estandar" && (p.bloqueEstandar?.id === bloqueActualizado.id || p.titulo === bloqueActualizado.nombre)) {
              return {
                ...p,
                titulo: editNombre.trim(),
                duracionTotal: Number(editDuracion) || 8.0,
                duracionAudioSegundos: Number(editDuracion) || 8.0,
                descripcion: editDesc.trim(),
                guionEs: editGuionEs.trim(),
                guionPt: editGuionPt.trim(),
                guionEn: editGuionEn.trim(),
                bloqueEstandar: {
                  ...(p.bloqueEstandar || {}),
                  ...bloqueActualizado,
                },
              };
            }
            return p;
          });
          use3BFStore.setState({
            manualPadrePrevioEdicionBloque: {
              ...padre,
              pasos: pasosActualizados,
            },
          });
        }

        // 3. Recargar biblioteca de bloques
        use3BFStore.getState().cargarBloquesEstandar();

        // 4. El formulario desaparece automáticamente tras guardar con éxito
        setBloqueEstandarEnEdicion(null);
      } else {
        setMensajeEdicionBloque("Error al guardar cambios");
        setTimeout(() => setMensajeEdicionBloque(null), 3500);
      }
    } catch (err) {
      console.error("Error guardando edición de bloque estándar:", err);
      setMensajeEdicionBloque("Error de conexión");
      setTimeout(() => setMensajeEdicionBloque(null), 3500);
    } finally {
      setGuardandoEdicionBloque(false);
    }
  };
  const handleCambioDistanciaGlobal = (nuevaDist: number) => {
    if (!pasoActivo) return;
    const sinc = pasoActivo.showcase?.sincronizarCarreraCajones !== false;
    const gruposActualizados = (pasoActivo.showcase?.gruposCinematicos || []).map((g) => {
      if (g.tipo === "cajon" && sinc) {
        return { ...g, distanciaMm: nuevaDist };
      }
      return g;
    });
    actualizarPasoManual(pasoActivo.id, {
      showcase: {
        ...(pasoActivo.showcase || {
          abrirCajones: true,
          abrirPuertas: true,
          anguloPuertasDeg: 90,
          giroPresentacion360: true,
          coreografia: "secuencial",
          ejeGlobal: "+Z",
          gruposCinematicos: [],
        }),
        distanciaAperturaMm: nuevaDist,
        gruposCinematicos: gruposActualizados,
      },
    });
  };

  const toggleSincronizacionCajones = () => {
    if (!pasoActivo) return;
    const nuevoSinc = !(pasoActivo.showcase?.sincronizarCarreraCajones !== false);
    const distGlobal = pasoActivo.showcase?.distanciaAperturaMm || 300;
    const gruposActualizados = (pasoActivo.showcase?.gruposCinematicos || []).map((g) => {
      if (g.tipo === "cajon" && nuevoSinc) {
        return { ...g, distanciaMm: distGlobal };
      }
      return g;
    });
    actualizarPasoManual(pasoActivo.id, {
      showcase: {
        ...(pasoActivo.showcase || {
          abrirCajones: true,
          distanciaAperturaMm: 300,
          abrirPuertas: true,
          anguloPuertasDeg: 90,
          giroPresentacion360: true,
          coreografia: "secuencial",
          ejeGlobal: "+Z",
          gruposCinematicos: [],
        }),
        sincronizarCarreraCajones: nuevoSinc,
        gruposCinematicos: gruposActualizados,
      },
    });
  };

  // 🪵 Tableros asignados exclusivamente a este paso (excluyendo cualquier herraje)
  const tablerosPasoActivo = useMemo(() => {
    if (!pasoActivo || pasoActivo.tipo === "showcase") return [];
    return (pasoActivo.piezasAsignadas || []).filter((p) => !esHerrajeNombre(p));
  }, [pasoActivo]);

  // Sincronización automática de Pieza Master si la actual no pertenece a las asignadas del paso
  React.useEffect(() => {
    if (pasoActivo && pasoActivo.tipo !== "showcase" && tablerosPasoActivo.length > 0) {
      if (!pasoActivo.piezaMaster || !tablerosPasoActivo.includes(pasoActivo.piezaMaster)) {
        actualizarPasoManual(pasoActivo.id, { piezaMaster: tablerosPasoActivo[0] });
      }
    }
  }, [pasoActivo?.id, pasoActivo?.tipo, tablerosPasoActivo, pasoActivo?.piezaMaster, actualizarPasoManual]);

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* 1. Selector de Pasos (Cápsulas Horizontales) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold tracking-wide uppercase opacity-70 text-[10px]">
            Línea de Pasos del Manual
          </span>
          <button
            type="button"
            onClick={() => crearPasoManual("ensamble")}
            style={{ borderColor: botonActivoColor, color: botonActivoColor }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border hover:bg-cyan-500/10 transition font-bold text-[10px]"
          >
            <Plus className="w-3 h-3" /> + Nuevo Paso
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
          {pasosManual.map((paso, index) => {
            const esActivo = paso.id === pasoActivoManualId;
            const esP00 = paso.id === "P00" || paso.tipo === "showcase";
            const esDragOver = dragOverIndex === index;

            return (
              <button
                key={`${paso.id}_${index}`}
                type="button"
                draggable={!esP00}
                onDragStart={(e) => {
                  if (esP00) return;
                  setDraggedIndex(index);
                  e.dataTransfer.setData("text/plain", index.toString());
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (esP00) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverIndex !== index) {
                    setDragOverIndex(index);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverIndex === index) {
                    setDragOverIndex(null);
                  }
                }}
                onDrop={(e) => {
                  if (esP00) return;
                  e.preventDefault();
                  setDragOverIndex(null);
                  setDraggedIndex(null);
                  const origenIdxStr = e.dataTransfer.getData("text/plain");
                  const origenIdx = parseInt(origenIdxStr, 10);
                  if (!isNaN(origenIdx) && origenIdx !== index && origenIdx > 0 && index > 0) {
                    reordenarPasosManual(origenIdx, index);
                  }
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                onClick={() => seleccionarPasoManualActivo(paso.id)}
                style={
                  esActivo
                    ? { backgroundColor: botonActivoColor, color: "#ffffff", borderColor: botonActivoColor }
                    : {}
                }
                title={esP00 ? "Paso 00 Showcase (Fijo)" : `Arrastra para reordenar paso ${paso.id}`}
                className={`px-3 py-1 rounded-full border text-[11px] font-bold shrink-0 transition flex items-center gap-1.5 select-none ${
                  esP00
                    ? "cursor-default"
                    : "cursor-grab active:cursor-grabbing hover:border-cyan-400"
                } ${
                  esDragOver ? "ring-2 ring-cyan-500 scale-105" : ""
                } ${
                  esActivo
                    ? "shadow-sm"
                    : "border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {!esP00 && <GripVertical className="w-2.5 h-2.5 opacity-40 hover:opacity-100 shrink-0" />}
                <span>{paso.id}</span>
                {paso.tipo === "showcase" ? null : paso.tipo === "bloque_estandar" ? (
                  <Boxes className="w-3 h-3 text-cyan-400 shrink-0" />
                ) : (
                  <span className="opacity-70 font-normal text-[10px]">
                    ({(paso.piezasAsignadas || []).length + (paso.herrajesAsignados || []).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tarjeta de Configuración del Paso Seleccionado */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-3">
        {/* Encabezado del Paso Activo */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              style={{ backgroundColor: botonActivoColor }}
              className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
            >
              {pasoActivo.id}
            </span>
            <input
              type="text"
              value={pasoActivo.titulo}
              onChange={(e) => actualizarPasoManual(pasoActivo.id, { titulo: e.target.value })}
              className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 outline-none truncate"
            />
          </div>

          {pasosManual.length > 1 && pasoActivo.id !== "P00" && (
            <button
              type="button"
              onClick={() => eliminarPasoManual(pasoActivo.id)}
              title="Eliminar este paso"
              className="p-1 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── MODO SHOWCASE (PASO 00): CINEMÁTICA DE COMPONENTES ─────────────────── */}
        {pasoActivo.tipo === "showcase" ? (
          <div className="flex flex-col gap-3">
            {/* 🗄️ Bloque de Cajones (Contenedor Único Integrado) */}
            <div className="flex flex-col gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] shadow-xs">
              {/* Título Principal */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 tracking-wide">
                  Bloque de Cajones
                </span>
                {/* Píldora de Sincronización */}
                <button
                  type="button"
                  onClick={toggleSincronizacionCajones}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                    pasoActivo.showcase?.sincronizarCarreraCajones !== false
                      ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
                  }`}
                  title="Sincronizar carrera de cajones"
                >
                  {pasoActivo.showcase?.sincronizarCarreraCajones !== false ? (
                    <>
                      <Link2 className="w-2.5 h-2.5 text-cyan-600" />
                      <span>Sincronizados</span>
                    </>
                  ) : (
                    <>
                      <Unlink className="w-2.5 h-2.5 text-slate-400" />
                      <span>Independientes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Subtítulo: Coreografía de Movimiento */}
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-[10.5px] opacity-75">
                  Coreografía de Movimiento
                </span>

                {/* Botones de Coreografía */}
                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700/80 gap-0.5 w-full">
                  {(["secuencial", "cascada", "simultaneo"] as const).map((modo) => {
                    const activo = (pasoActivo.showcase?.coreografia || "secuencial") === modo;
                    const labels = {
                      secuencial: "Secuencial (1 a 1)",
                      cascada: "Cascada",
                      simultaneo: "Simultáneo",
                    };
                    return (
                      <button
                        key={modo}
                        type="button"
                        onClick={() =>
                          actualizarPasoManual(pasoActivo.id, {
                            showcase: {
                              ...(pasoActivo.showcase || {
                                abrirCajones: true,
                                distanciaAperturaMm: 300,
                                abrirPuertas: true,
                                anguloPuertasDeg: 90,
                                giroPresentacion360: true,
                                ejeGlobal: "+Z",
                                gruposCinematicos: [],
                              }),
                              coreografia: modo as CoreografiaShowcase,
                            },
                          })
                        }
                        style={activo ? { backgroundColor: botonActivoColor, color: "#ffffff" } : {}}
                        className={`flex-1 py-1 px-1 rounded-full text-[10px] font-bold transition flex items-center justify-center cursor-pointer ${
                          activo ? "shadow-sm" : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        {labels[modo]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eje de apertura y abajo el desplegable de los ejes */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold opacity-70 text-[10.5px]">Eje de apertura</span>
                <select
                  value={pasoActivo.showcase?.ejeGlobal || "+Z"}
                  onChange={(e) =>
                    actualizarPasoManual(pasoActivo.id, {
                      showcase: {
                        ...(pasoActivo.showcase || {
                          abrirCajones: true,
                          distanciaAperturaMm: 300,
                          abrirPuertas: true,
                          anguloPuertasDeg: 90,
                          giroPresentacion360: true,
                          coreografia: "secuencial",
                          gruposCinematicos: [],
                        }),
                        ejeGlobal: e.target.value as EjeAperturaShowcase,
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10.5px] font-semibold outline-none cursor-pointer"
                >
                  <option value="+Z">+Z (Hacia el frente / Cámara)</option>
                  <option value="-Z">-Z (Hacia atrás)</option>
                  <option value="+Y">+Y (Profundidad positiva)</option>
                  <option value="-Y">-Y (Profundidad negativa)</option>
                  <option value="+X">+X (Hacia la derecha)</option>
                  <option value="-X">-X (Hacia la izquierda)</option>
                </select>
              </div>

              {/* Slider Distancia de apertura */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between opacity-70 text-[10.5px]">
                  <span className="font-semibold">Distancia de apertura</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={50}
                      max={600}
                      step={10}
                      value={pasoActivo.showcase?.distanciaAperturaMm ?? 300}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        handleCambioDistanciaGlobal(isNaN(val) ? 0 : val);
                      }}
                      className="w-12 px-1 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-800 dark:text-slate-100 text-right text-[10px] outline-none focus:border-cyan-500"
                    />
                    <span className="font-mono text-[9.5px]">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={100}
                  max={450}
                  step={10}
                  value={pasoActivo.showcase?.distanciaAperturaMm || 300}
                  onChange={(e) => handleCambioDistanciaGlobal(parseInt(e.target.value, 10))}
                  className="accent-cyan-600 h-1.5 cursor-pointer w-full"
                />
              </div>

              {/* Botones uno junto al otro: Apertura 1 y Apertura 2 */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const durTotal = Math.max(pasoActivo.duracionTotal || 10, 1);
                    use3BFStore.getState().setTimelineCurrentTime(durTotal * 0.28);
                  }}
                  className="py-1.5 px-3 rounded-full text-[11px] font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 dark:hover:bg-cyan-600 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95"
                  title="Previsualizar Apertura 1 (Cajón 1)"
                >
                  <span>Apertura 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const durTotal = Math.max(pasoActivo.duracionTotal || 10, 1);
                    use3BFStore.getState().setTimelineCurrentTime(durTotal * 0.65);
                  }}
                  className="py-1.5 px-3 rounded-full text-[11px] font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 dark:hover:bg-cyan-600 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95"
                  title="Previsualizar Apertura 2 (Cajón 2)"
                >
                  <span>Apertura 2</span>
                </button>
              </div>
            </div>

            {/* Listado de Grupos Cinemáticos: Bloques Funcionales (Cajones o Puertas) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[10.5px] uppercase tracking-wide opacity-75">
                    Bloques Funcionales ({pasoActivo.showcase?.gruposCinematicos?.length || 0})
                  </span>
                  {(pasoActivo.showcase?.gruposCinematicos?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => conmutarVisibilidadTodosGruposCinematicos(pasoActivo.id)}
                      title="Ocultar o mostrar todos los bloques funcionales en 3D"
                      className="p-1 rounded-full text-slate-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                    >
                      {pasoActivo.showcase?.gruposCinematicos?.some((g) => g.oculto) ? (
                        <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Botón con Menú Desplegable: Cajón o Puerta */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMostrarMenuAnadirBloque(!mostrarMenuAnadirBloque)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition font-bold text-[10.5px] cursor-pointer shadow-sm bg-white dark:bg-slate-900"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Bloque Funcional</span>
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>

                  {mostrarMenuAnadirBloque && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setMostrarMenuAnadirBloque(false)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 z-40 w-52 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            const countCajon = (pasoActivo.showcase?.gruposCinematicos || []).filter((g) => g.tipo === "cajon").length;
                            const idNuevo = `cajon_${Date.now().toString().slice(-4)}`;
                            agregarGrupoCinematico(pasoActivo.id, {
                              id: idNuevo,
                              nombre: `Cajón ${countCajon + 1}`,
                              tipo: "cajon",
                              piezas: [],
                              ejeApertura: pasoActivo.showcase?.ejeGlobal || "+Z",
                              distanciaMm: pasoActivo.showcase?.distanciaAperturaMm || 300,
                            });
                            setMostrarMenuAnadirBloque(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-cyan-500/10 transition flex items-center gap-2.5 cursor-pointer group"
                        >
                          <span className="w-7 h-7 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition shadow-sm">
                            🗄️
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Cajón</span>
                            <span className="text-[9.5px] opacity-60 leading-tight">Extracción telescópica lineal</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const countPuerta = (pasoActivo.showcase?.gruposCinematicos || []).filter((g) => g.tipo === "puerta").length;
                            const idNuevo = `puerta_${Date.now().toString().slice(-4)}`;
                            agregarGrupoCinematico(pasoActivo.id, {
                              id: idNuevo,
                              nombre: `Puerta ${countPuerta + 1}`,
                              tipo: "puerta",
                              piezas: [],
                              ejeApertura: "+Z",
                              distanciaMm: 0,
                              anguloRotacionDeg: 90,
                              ladoBisagra: "izquierda",
                              pivoteOffsetMm: 0,
                            });
                            setMostrarMenuAnadirBloque(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-indigo-500/10 transition flex items-center gap-2.5 cursor-pointer group"
                        >
                          <span className="w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition shadow-sm">
                            🚪
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100">Puerta</span>
                            <span className="text-[9.5px] opacity-60 leading-tight">Giro angular con eje de bisagra</span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {(!pasoActivo.showcase?.gruposCinematicos || pasoActivo.showcase.gruposCinematicos.length === 0) ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-2 text-xs opacity-90 bg-slate-500/5">
                  <p className="font-semibold text-[11px]">No hay bloques funcionales cinemáticos asignados aún.</p>
                  <p className="text-[10px] opacity-60 max-w-xs">
                    Haz clic en <strong>"+ Bloque Funcional"</strong> para añadir cajones o puertas, o recupera la versión completa guardada.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      fetch("/api/drive/manuales")
                        .then((r) => r.json())
                        .then((data) => {
                          const target = (data.manuales || []).find((m: any) => {
                            const p00m = (m.pasos || []).find((p: any) => p.id === "P00");
                            return (p00m?.showcase?.gruposCinematicos?.length || 0) > 0;
                          });
                          if (target) {
                            use3BFStore.getState().cargarManualProyecto(target);
                          }
                        });
                    }}
                    className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-[11px] shadow-sm hover:opacity-90 active:scale-95 transition"
                    style={{ backgroundColor: botonActivoColor }}
                  >
                    <span>📂 Restaurar 6 Cajones Animados (Versión Guardada)</span>
                  </button>
                </div>
              ) : (
                /* Flujo continuo natural sin barra de scroll interna */
                <div className="flex flex-col gap-3">
                  {pasoActivo.showcase.gruposCinematicos.map((grupo, gIdx) => {
                    const esPuerta = grupo.tipo === "puerta";
                    return (
                      <div
                        key={grupo.id}
                        className={`p-3 rounded-2xl border transition flex flex-col gap-2.5 shadow-sm ${
                          grupo.oculto
                            ? "border-amber-500/40 bg-amber-500/5 opacity-80"
                            : esPuerta
                            ? "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70"
                        }`}
                      >
                        {/* Cabecera del Bloque Funcional */}
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                              {gIdx + 1}
                            </span>
                            <span
                              className="text-xs shrink-0 select-none"
                              title={esPuerta ? "Bloque tipo Puerta" : "Bloque tipo Cajón"}
                            >
                              {esPuerta ? "🚪" : "🗄️"}
                            </span>
                            <input
                              type="text"
                              value={grupo.nombre}
                              onChange={(e) =>
                                actualizarGrupoCinematico(pasoActivo.id, grupo.id, { nombre: e.target.value })
                              }
                              className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 outline-none flex-1 min-w-[60px] max-w-[120px] truncate"
                            />
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Botón Cuentagotas / Selección Visual 3D */}
                            <button
                              type="button"
                              onClick={() => {
                                if (modoPickingManual.activo && modoPickingManual.grupoId === grupo.id) {
                                  limpiarPickingManual();
                                } else {
                                  iniciarPickingManual(pasoActivo.id, grupo.id);
                                }
                              }}
                              title="Seleccionar piezas de este bloque directamente tocándolas en el 3D"
                              className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 font-bold text-[9.5px] border cursor-pointer ${
                                modoPickingManual.activo && modoPickingManual.grupoId === grupo.id
                                  ? "bg-cyan-500 text-white border-cyan-400 shadow-sm animate-pulse"
                                  : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                              }`}
                            >
                              <Pipette className="w-3 h-3" />
                              <span>
                                {modoPickingManual.activo && modoPickingManual.grupoId === grupo.id ? "Tocando 3D..." : "Tocar en 3D"}
                              </span>
                            </button>

                            {/* 💡 Botón Bombillito / Ojito para Apagar/Encender Bloque en 3D */}
                            <button
                              type="button"
                              onClick={() => conmutarVisibilidadGrupoCinematico(pasoActivo.id, grupo.id)}
                              title={grupo.oculto ? "Mostrar bloque en 3D" : "Apagar bloque en 3D (para ver herrajes interiores)"}
                              className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                                grupo.oculto
                                  ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {grupo.oculto ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => eliminarGrupoCinematico(pasoActivo.id, grupo.id)}
                              title="Eliminar este bloque funcional"
                              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Parámetros Específicos según Tipo de Componente */}
                        {esPuerta ? (
                          /* 🚪 Parámetros de Puerta: Ángulo de Giro, Lado de Bisagra y Ajuste de Pivote */
                          <div className="flex flex-col gap-2 p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/70 dark:border-slate-800/70 text-[10px]">
                            {/* Slider y Entrada Numérica de Ángulo de Giro */}
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold opacity-70">Ángulo de Giro:</span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={180}
                                    step={5}
                                    value={grupo.anguloRotacionDeg ?? 90}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                        anguloRotacionDeg: isNaN(val) ? 0 : Math.max(0, val),
                                      });
                                    }}
                                    className="w-14 px-1.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-right text-[10px] outline-none focus:border-indigo-500 shadow-inner"
                                  />
                                  <span className="font-mono text-[10px] opacity-60">°</span>
                                </div>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={180}
                                step={5}
                                value={grupo.anguloRotacionDeg ?? 90}
                                onChange={(e) =>
                                  actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                    anguloRotacionDeg: parseInt(e.target.value, 10),
                                  })
                                }
                                className="accent-indigo-600 h-1.5 cursor-pointer w-full"
                              />
                            </div>

                            {/* Lado de Bisagra y Slider de Ajuste Fino de Pivote */}
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold opacity-70 text-[9.5px]">Eje de Bisagra:</span>
                                <select
                                  value={grupo.ladoBisagra || "izquierda"}
                                  onChange={(e) =>
                                    actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                      ladoBisagra: e.target.value as "izquierda" | "derecha",
                                    })
                                  }
                                  className="w-full px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-semibold outline-none cursor-pointer"
                                >
                                  <option value="izquierda">Bisagra Izquierda</option>
                                  <option value="derecha">Bisagra Derecha</option>
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between opacity-70 text-[9.5px]">
                                  <span className="font-semibold">Ajuste Pivote:</span>
                                  <div className="flex items-center gap-0.5">
                                    <input
                                      type="number"
                                      min={-100}
                                      max={100}
                                      step={1}
                                      value={grupo.pivoteOffsetMm ?? 0}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                          pivoteOffsetMm: isNaN(val) ? 0 : val,
                                        });
                                      }}
                                      className="w-12 px-1 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-800 dark:text-slate-100 text-right text-[9.5px] outline-none focus:border-indigo-500"
                                    />
                                    <span className="font-mono text-[9px] opacity-60">mm</span>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min={-50}
                                  max={50}
                                  step={1}
                                  value={grupo.pivoteOffsetMm || 0}
                                  onChange={(e) =>
                                    actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                      pivoteOffsetMm: parseInt(e.target.value, 10),
                                    })
                                  }
                                  className="accent-indigo-600 h-1 mt-1 cursor-pointer"
                                  title="Ajuste fino del punto de pivote de la bisagra en milímetros"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* 🗄️ Parámetros de Cajón: Slider Carrera y Entrada Numérica Editable */
                          (() => {
                            const sinc = pasoActivo.showcase?.sincronizarCarreraCajones !== false;
                            const distEfectiva = sinc
                              ? (pasoActivo.showcase?.distanciaAperturaMm ?? grupo.distanciaMm ?? 300)
                              : (grupo.distanciaMm ?? pasoActivo.showcase?.distanciaAperturaMm ?? 300);

                            return (
                              <div className="flex flex-col gap-2 p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/70 dark:border-slate-800/70 text-[10px]">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold opacity-70">Carrera Apertura:</span>
                                    {sinc && (
                                      <span
                                        className="text-[8.5px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5"
                                        title="Sincronizado: todos los cajones abren a la misma distancia"
                                      >
                                        <Link2 className="w-2.5 h-2.5" /> Uniforme
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={600}
                                      step={10}
                                      value={distEfectiva}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        const nVal = isNaN(val) ? 0 : Math.max(0, val);
                                        if (sinc) {
                                          handleCambioDistanciaGlobal(nVal);
                                        } else {
                                          actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                            distanciaMm: nVal,
                                          });
                                        }
                                      }}
                                      className="w-14 px-1.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-right text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                                    />
                                    <span className="font-mono text-[10px] opacity-60">mm</span>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min={0}
                                  max={450}
                                  step={10}
                                  value={distEfectiva}
                                  onChange={(e) => {
                                    const nVal = parseInt(e.target.value, 10);
                                    if (sinc) {
                                      handleCambioDistanciaGlobal(nVal);
                                    } else {
                                      actualizarGrupoCinematico(pasoActivo.id, grupo.id, {
                                        distanciaMm: nVal,
                                      });
                                    }
                                  }}
                                  className="accent-cyan-600 h-1.5 cursor-pointer w-full"
                                />
                              </div>
                            );
                          })()
                        )}

                        {/* Piezas Asignadas al Bloque (Chips en Cápsula de Pieza Madre) */}
                        {grupo.piezas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {grupo.piezas.map((pz) => {
                              const pmLimpia = extraerPiezaMadre(pz);
                              return (
                                <span
                                  key={pz}
                                  style={{ borderColor: botonActivoColor }}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 border"
                                >
                                  <span className="truncate max-w-[140px]">{pmLimpia}</span>
                                  <button
                                    type="button"
                                    onClick={() => desasignarPiezaDeGrupoCinematico(pasoActivo.id, grupo.id, pz)}
                                    className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-1 px-2 text-center rounded-xl bg-slate-500/5 text-[9.5px] opacity-60 italic">
                            Toca las piezas en el 3D con el cuentagotas para asignarlas
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : pasoActivo.tipo === "bloque_estandar" ? (
          /* ── MODO BLOQUE ESTÁNDAR REUTILIZABLE ─────────────────────── */
          <div className="flex flex-col gap-3">
            {/* Tarjeta de Información y Configuración del Bloque Estándar */}
            <div className="flex flex-col gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              {/* Encabezado con Insignia de Bloque Estándar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    style={{ backgroundColor: botonActivoColor }}
                    className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  >
                    {pasoActivo.id}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-cyan-500 shrink-0" />
                    <span>Bloque Estándar Reutilizable</span>
                  </span>
                  {pasoActivo.bloqueEstandar?.categoriaMarca && (
                    <span className="text-[9.5px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {pasoActivo.bloqueEstandar.categoriaMarca}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono opacity-60 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pasoActivo.duracionTotal}s
                  </span>
                </div>
              </div>

              {/* Título y Descripción del Bloque */}
              <div className="flex items-start gap-3 pt-1">
                {pasoActivo.bloqueEstandar?.thumbnail && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 p-1 flex items-center justify-center shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pasoActivo.bloqueEstandar.thumbnail}
                      alt={pasoActivo.titulo}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    {pasoActivo.titulo}
                  </span>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {pasoActivo.descripcion || pasoActivo.bloqueEstandar?.descripcion}
                  </p>
                </div>
              </div>

              {/* Control de Duración en Segundos */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10.5px] flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Duración del Paso:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={2}
                      max={300}
                      step={0.5}
                      value={pasoActivo.duracionTotal}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        actualizarPasoManual(pasoActivo.id, {
                          duracionTotal: isNaN(val) ? 8.0 : val,
                          duracionAudioSegundos: isNaN(val) ? 8.0 : val,
                        });
                      }}
                      className="w-14 px-1.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-right text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                    />
                    <span className="font-mono text-[10px] opacity-60">seg</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={3}
                  max={Math.max(120, Math.ceil((pasoActivo.duracionTotal || 60) * 1.2))}
                  step={0.5}
                  value={pasoActivo.duracionTotal}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    actualizarPasoManual(pasoActivo.id, {
                      duracionTotal: val,
                      duracionAudioSegundos: val,
                    });
                  }}
                  className="accent-cyan-600 h-1.5 cursor-pointer w-full"
                />
              </div>

              {/* Guiones de Locución Multilingüe TTS */}
              <div className="flex flex-col gap-2 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-black/[0.02] dark:bg-white/[0.02]">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-cyan-600" /> Locución TTS Multilingüe
                </span>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    Español (ES):
                  </span>
                  <input
                    type="text"
                    value={pasoActivo.guionEs || ""}
                    onChange={(e) => actualizarPasoManual(pasoActivo.id, { guionEs: e.target.value })}
                    className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    Português (PT-BR):
                  </span>
                  <input
                    type="text"
                    value={pasoActivo.guionPt || ""}
                    onChange={(e) => actualizarPasoManual(pasoActivo.id, { guionPt: e.target.value })}
                    className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    English (EN):
                  </span>
                  <input
                    type="text"
                    value={pasoActivo.guionEn || ""}
                    onChange={(e) => actualizarPasoManual(pasoActivo.id, { guionEn: e.target.value })}
                    className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10.5px] outline-none focus:border-cyan-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Partes GLB 3D del Bloque */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-black/[0.02] dark:bg-white/[0.02]">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Boxes className="w-3 h-3 text-cyan-600" /> Partes 3D GLB ({pasoActivo.bloqueEstandar?.partesGlb?.length || 0})
                </span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {(pasoActivo.bloqueEstandar?.partesGlb || []).map((parte) => (
                    <div
                      key={parte.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="font-semibold truncate">{parte.nombre || parte.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón Guardar Cambios en Bloque (.3bb.json) */}
              <button
                type="button"
                disabled={guardandoBloque}
                onClick={handleGuardarBloqueDisco}
                style={{ backgroundColor: botonActivoColor }}
                className="w-full py-2 px-3 rounded-full text-white font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition text-xs select-none cursor-pointer disabled:opacity-50"
              >
                {guardandoBloque ? (
                  <span>Guardando en disco...</span>
                ) : (
                  <>
                    <Boxes className="w-3.5 h-3.5" />
                    <span>{mensajeBloque || "Guardar Cambios en Bloque (.3bb.json)"}</span>
                  </>
                )}
              </button>


            </div>
          </div>
        ) : (
          /* ── MODO ENSAMBLE (PASO 01+) ─────────────────────────────────── */
          <div className="flex flex-col gap-3">
            {/* 🎯 TARJETA DE PIEZAS CONFIGURADAS DEL PASO (Inspirado en la lógica de Bloques Funcionales de P00) */}
            <div className="flex flex-col gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              {/* Cabecera del Paso Ensamble */}
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span
                    style={{ backgroundColor: botonActivoColor }}
                    className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  >
                    {pasoActivo.id}
                  </span>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                    Piezas del Paso ({(pasoActivo.piezasAsignadas || []).length + (pasoActivo.herrajesAsignados || []).length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Botón Cuentagotas / Selección Visual 3D para el Paso */}
                  <button
                    type="button"
                    onClick={() => {
                      if (modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "agregar") {
                        limpiarPickingManual();
                      } else {
                        iniciarPickingManual(pasoActivo.id, null, "agregar");
                      }
                    }}
                    title="Seleccionar piezas y herrajes de este paso directamente tocándolas en el 3D"
                    className={`px-3 py-1 rounded-full transition flex items-center gap-1.5 font-bold text-[9.5px] border cursor-pointer ${
                      modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "agregar"
                        ? "bg-cyan-500 text-white border-cyan-400 shadow-sm animate-pulse"
                        : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                    }`}
                  >
                    <Pipette className="w-3 h-3" />
                    <span>
                      {modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "agregar" ? "Tocando 3D..." : "Tocar en 3D"}
                    </span>
                  </button>

                  {/* 🧹 Botón Retirar / Desasignación Visual 3D */}
                  <button
                    type="button"
                    onClick={() => {
                      if (modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "retirar") {
                        limpiarPickingManual();
                      } else {
                        iniciarPickingManual(pasoActivo.id, null, "retirar");
                      }
                    }}
                    title="Retirar piezas o herrajes tocándolos directamente en la vista 3D"
                    className={`px-3 py-1 rounded-full transition flex items-center gap-1.5 font-bold text-[9.5px] border cursor-pointer ${
                      modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "retirar"
                        ? "bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/40 animate-pulse"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                    }`}
                  >
                    <Eraser className="w-3 h-3" />
                    <span>
                      {modoPickingManual.activo && modoPickingManual.pasoId === pasoActivo.id && !modoPickingManual.grupoId && modoPickingManual.modo === "retirar" ? "Retirando 3D..." : "Retirar"}
                    </span>
                  </button>

                  {/* 💡 Botón Bombillito / Ojito para Apagar/Encender Piezas del Paso en 3D */}
                  <button
                    type="button"
                    onClick={() => conmutarVisibilidadPiezasPaso(pasoActivo.id)}
                    title={pasoActivo.piezasOcultas ? "Mostrar piezas de este paso en 3D" : "Apagar piezas de este paso en 3D (para inspeccionar uniones interiores)"}
                    className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                      pasoActivo.piezasOcultas
                        ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {pasoActivo.piezasOcultas ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* 🎯 Botón Invert Hide (Ocultar lo visible no seleccionado para dejar únicamente presentes las piezas del paso) */}
                  <button
                    type="button"
                    onClick={() => conmutarOcultarNoAsignadasPaso(pasoActivo.id)}
                    title={
                      pasoActivo.ocultarNoAsignadas
                        ? "Invert Hide Activo: Piezas no seleccionadas ocultas. Clic para mostrar todo el mueble."
                        : "Invert Hide: Ocultar todo lo visible no seleccionado para que queden únicamente presentes los tableros y herrajes de este paso."
                    }
                    className={`px-3 py-1 rounded-full text-[9.5px] font-bold border transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      pasoActivo.ocultarNoAsignadas
                        ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm ring-2 ring-[#1368AA]/30"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-sm"
                    }`}
                  >
                    {pasoActivo.ocultarNoAsignadas ? (
                      <EyeOff className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-[#1368AA]" />
                    )}
                    <span>{pasoActivo.ocultarNoAsignadas ? `Invert Hide (Solo ${pasoActivo.id})` : "Invert Hide"}</span>
                  </button>
                </div>
              </div>

              {/* Piezas Asignadas (Chips en Cápsula de Pieza Madre) */}
              {((pasoActivo.piezasAsignadas || []).length > 0 || (pasoActivo.herrajesAsignados || []).length > 0) ? (
                <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  {/* Tableros de Madera */}
                  {(pasoActivo.piezasAsignadas || []).length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-amber-600" /> Tableros ({pasoActivo.piezasAsignadas.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {pasoActivo.piezasAsignadas.map((pz) => {
                          const pmLimpia = extraerPiezaMadre(pz);
                          return (
                            <span
                              key={pz}
                              style={{ borderColor: botonActivoColor }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 border"
                            >
                              <span className="truncate max-w-[140px]">{pmLimpia}</span>
                              <button
                                type="button"
                                onClick={() => desasignarPiezaDePasoManual(pasoActivo.id, pz)}
                                className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                title="Quitar de este paso"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Herrajes */}
                  {(pasoActivo.herrajesAsignados || []).length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Hammer className="w-2.5 h-2.5 text-slate-500" /> Herrajes ({pasoActivo.herrajesAsignados.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {pasoActivo.herrajesAsignados.map((h) => {
                          const hLimpio = extraerPiezaMadre(h);
                          return (
                            <span
                              key={h}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                            >
                              <span className="truncate max-w-[140px]">{hLimpio}</span>
                              <button
                                type="button"
                                onClick={() => desasignarHerrajeDePasoManual(pasoActivo.id, h)}
                                className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                title="Quitar de este paso"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2.5 px-3 text-center rounded-xl bg-slate-500/5 border border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex flex-col items-center gap-1">
                  <span>Ninguna pieza asignada a este paso todavía.</span>
                  <span className="text-[9px] font-medium text-cyan-600 dark:text-cyan-400">
                    Usa <strong>&quot;Tocar en 3D&quot;</strong> para sumarlas o <strong>&quot;Retirar&quot;</strong> para quitarlas tocándolas en 3D.
                  </span>
                </div>
              )}
            </div>

            {/* 🗄️ CONTROL DE VISIBILIDAD DE BLOQUES FUNCIONALES (P00) EN PASO DE ENSAMBLE */}
            {(() => {
              const pasoP00 = pasosManual.find((p) => p.id === "P00" || p.tipo === "showcase");
              const bloques = pasoP00?.showcase?.gruposCinematicos || [];
              if (bloques.length === 0) return null;

              const algunOculto = bloques.some((g) => g.oculto);

              return (
                <div className="flex flex-col gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs">🗄️</span>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        Bloques Funcionales ({bloques.length})
                      </span>
                      <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                        P00
                      </span>
                    </div>

                    {/* Botón Maestro: Ocultar / Mostrar Todos */}
                    <button
                      type="button"
                      onClick={() => pasoP00 && conmutarVisibilidadTodosGruposCinematicos(pasoP00.id, !algunOculto)}
                      className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold border transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        algunOculto
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                      title={algunOculto ? "Mostrar todos los bloques funcionales en 3D" : "Ocultar todos los bloques funcionales en 3D para despejar el ensamble"}
                    >
                      {algunOculto ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{algunOculto ? "Mostrar Todos" : "Ocultar Todos"}</span>
                    </button>
                  </div>

                  {/* Lista de Bloques Funcionales con su Ojito individual */}
                  <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 max-h-48 overflow-y-auto pr-0.5">
                    {bloques.map((grupo) => {
                      const esPuerta = grupo.tipo === "puerta";
                      const estaOculto = Boolean(grupo.oculto);

                      return (
                        <div
                          key={grupo.id}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-full border transition ${
                            estaOculto
                              ? "bg-amber-500/5 border-amber-500/30 opacity-70"
                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-xs shrink-0 select-none">
                              {esPuerta ? "🚪" : "🗄️"}
                            </span>
                            <span className="font-semibold text-[10.5px] text-slate-800 dark:text-slate-100 truncate">
                              {grupo.nombre}
                            </span>
                            <span className="text-[9px] opacity-60 shrink-0 font-mono">
                              ({grupo.piezas.length} pzas)
                            </span>
                          </div>

                          {/* Botón Bombillito / Ojito por bloque */}
                          <button
                            type="button"
                            onClick={() => pasoP00 && conmutarVisibilidadGrupoCinematico(pasoP00.id, grupo.id)}
                            title={estaOculto ? "Mostrar este bloque en 3D" : "Ocultar este bloque en 3D"}
                            className={`p-1 rounded-full transition shrink-0 cursor-pointer border ${
                              estaOculto
                                ? "bg-amber-500/20 text-amber-500 border-amber-500/40 hover:bg-amber-500/30"
                                : "bg-white dark:bg-slate-900 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {estaOculto ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Pieza Master / Base de Banco */}
            <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-500/5">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1 text-xs">
                  <Box className="w-3.5 h-3.5 text-cyan-600" /> Pieza Master (Banco de Trabajo)
                </span>
                <span className="text-[10px] opacity-60">Apoyada fija</span>
              </div>

              <select
                value={pasoActivo.piezaMaster || ""}
                onChange={(e) => actualizarPasoManual(pasoActivo.id, { piezaMaster: e.target.value })}
                className="w-full px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="">
                  {tablerosPasoActivo.length > 0
                    ? "-- Selecciona la pieza base de apoyo --"
                    : "-- Primero selecciona piezas de madera para este paso --"}
                </option>
                {tablerosPasoActivo.map((p) => {
                  const nombreLimpio = extraerPiezaMadre(p);
                  return (
                    <option key={p} value={p}>
                      {nombreLimpio} {p !== nombreLimpio ? `(${p})` : ""}
                    </option>
                  );
                })}
              </select>

              {/* Botonera de Orientación Banco de Trabajo (Giro X / Y / Z) */}
              {(() => {
                const rotacionBanco = pasoActivo.orientacionBanco?.rotacion || [0, 0, 0];
                const rotX = rotacionBanco[0] || 0;
                const rotY = rotacionBanco[1] || 0;
                const rotZ = rotacionBanco[2] || 0;

                const isXPosActive = rotX === 90;
                const isXNegActive = rotX === -90;
                const isYPosActive = rotY === 90;
                const isYNegActive = rotY === -90;
                const isZPosActive = rotZ === 90;
                const isZNegActive = rotZ === -90;

                const toggleRotacionBanco = (eje: "X" | "Y" | "Z", anguloObjetivo: 90 | -90) => {
                  const anguloActual = eje === "X" ? rotX : eje === "Y" ? rotY : rotZ;
                  const nuevoAngulo = anguloActual === anguloObjetivo ? 0 : anguloObjetivo;
                  const nuevoX = eje === "X" ? nuevoAngulo : rotX;
                  const nuevoY = eje === "Y" ? nuevoAngulo : rotY;
                  const nuevoZ = eje === "Z" ? nuevoAngulo : rotZ;

                  actualizarPasoManual(pasoActivo.id, {
                    orientacionBanco: {
                      rotacion: [nuevoX, nuevoY, nuevoZ],
                      apoyoEnPiso: pasoActivo.orientacionBanco?.apoyoEnPiso ?? true,
                    },
                  });
                };

                return (
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Giro Banco de Trabajo:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono font-bold text-[#1368AA] dark:text-blue-400">
                          X: {rotX}° | Y: {rotY}° | Z: {rotZ}°
                        </span>
                        {(rotX !== 0 || rotY !== 0 || rotZ !== 0) && (
                          <button
                            type="button"
                            onClick={() =>
                              actualizarPasoManual(pasoActivo.id, {
                                orientacionBanco: {
                                  rotacion: [0, 0, 0],
                                  apoyoEnPiso: pasoActivo.orientacionBanco?.apoyoEnPiso ?? true,
                                },
                              })
                            }
                            title="Restablecer giro a 0°"
                            className="px-2 py-0.5 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            0°
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("X", 90)}
                        title={isXPosActive ? "Desactivar giro X +90° (volver a 0°)" : "Activar giro X +90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isXPosActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isXPosActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro X +90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("X", -90)}
                        title={isXNegActive ? "Desactivar giro X -90° (volver a 0°)" : "Activar giro X -90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isXNegActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isXNegActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro X -90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("Y", 90)}
                        title={isYPosActive ? "Desactivar giro Y +90° (volver a 0°)" : "Activar giro Y +90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isYPosActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isYPosActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro Y +90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("Y", -90)}
                        title={isYNegActive ? "Desactivar giro Y -90° (volver a 0°)" : "Activar giro Y -90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isYNegActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isYNegActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro Y -90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("Z", 90)}
                        title={isZPosActive ? "Desactivar giro Z +90° (volver a 0°)" : "Activar giro Z +90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isZPosActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isZPosActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro Z +90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRotacionBanco("Z", -90)}
                        title={isZNegActive ? "Desactivar giro Z -90° (volver a 0°)" : "Activar giro Z -90°"}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                          isZNegActive
                            ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400"
                        }`}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isZNegActive ? "text-white" : "text-[#1368AA] dark:text-blue-400"}`} />
                        <span>Giro Z -90°</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pasoActivo.orientacionBanco?.apoyoEnPiso ?? true}
                    onChange={(e) =>
                      actualizarPasoManual(pasoActivo.id, {
                        orientacionBanco: {
                          rotacion: pasoActivo.orientacionBanco?.rotacion || [0, 0, 0],
                          apoyoEnPiso: e.target.checked,
                        },
                      })
                    }
                    className="rounded accent-cyan-600"
                  />
                  <span>Apoyar en ras del suelo (Y = 0)</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📦 FORMULARIO INFERIOR: EDITAR BLOQUE ESTÁNDAR (.3bb.json) */}
      {bloqueEstandarEnEdicion && (
        <div className="flex flex-col gap-3 p-3.5 rounded-2xl border border-cyan-500/40 bg-white dark:bg-slate-900 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Cabecera del Formulario de Edición */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: botonActivoColor }}
                className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0"
              >
                <Sliders className="w-3.5 h-3.5" />
              </span>
              <div className="flex items-center">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                  Editar Bloque Estándar
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBloqueEstandarEnEdicion(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar editor de bloque estándar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {/* 1. Título del Bloque */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                Título del Bloque *
              </label>
              <input
                type="text"
                required
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Ej. Desacople de Corredera Telescópica"
                className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 font-medium text-xs"
              />
            </div>

            {/* 2. Marca / Carpeta y Duración */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  Marca / Carpeta
                </label>
                <select
                  value={editMarca}
                  onChange={(e) => setEditMarca(e.target.value)}
                  className="px-2.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 text-[11px] cursor-pointer"
                >
                  {MARCAS_DISPONIBLES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  Duración (segundos)
                </label>
                <input
                  type="number"
                  min={3}
                  max={300}
                  step={0.5}
                  value={editDuracion}
                  onChange={(e) => setEditDuracion(parseFloat(e.target.value) || 8.0)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 text-center font-mono text-xs"
                />
              </div>
            </div>

            {/* 3. Descripción Técnica Pedagógica */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                Descripción Técnica Pedagógica
              </label>
              <textarea
                rows={2}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Detalla la acción didáctica (separación de guías, accionamiento de clips, etc.)."
                className="px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 resize-none text-[11px]"
              />
            </div>

            {/* 4. Modelos 3D del Bloque (.GLB) */}
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-dashed border-cyan-500/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px] flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Modelos 3D del Bloque (.GLB)
                </span>
                <span className="text-[10px] text-slate-400">
                  {bloqueEstandarEnEdicion.partesGlb?.length || 0} cargados
                </span>
              </div>

              {/* Lista actual de piezas GLB registradas */}
              {(bloqueEstandarEnEdicion.partesGlb || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bloqueEstandarEnEdicion.partesGlb!.map((parte) => (
                    <div
                      key={parte.id}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-100/70 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 text-[10px] font-medium border border-cyan-300 dark:border-cyan-700"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{parte.nombre || parte.id}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                Selecciona nuevos archivos .GLB si deseas reemplazar o actualizar las piezas en disco.
              </p>

              <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-cyan-500/50 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] cursor-pointer shadow-xs transition active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                <span>Reemplazar / Seleccionar archivos .GLB</span>
                <input
                  type="file"
                  multiple
                  accept=".glb"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const seleccionados = Array.from(e.target.files).filter((f) =>
                        f.name.toLowerCase().endsWith(".glb")
                      );
                      setEditArchivosGlb((prev) => [...prev, ...seleccionados]);
                    }
                  }}
                />
              </label>

              {/* Archivos nuevos seleccionados pendientes de subida */}
              {editArchivosGlb.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {editArchivosGlb.map((file, idx) => (
                    <div
                      key={`${file.name}_${idx}`}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[10px] font-medium border border-amber-300 dark:border-amber-700"
                    >
                      <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => setEditArchivosGlb(editArchivosGlb.filter((_, i) => i !== idx))}
                        className="hover:text-rose-500 text-slate-400 ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Guiones de Locución TTS con Botón Traducir Automáticamente */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-400">
                  Guiones de Locución TTS
                </span>
                <button
                  type="button"
                  disabled={traduciendoEditGuion || !editGuionEs.trim()}
                  onClick={handleTraducirEditGuion}
                  style={{ borderColor: botonActivoColor, color: botonActivoColor }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-bold transition cursor-pointer disabled:opacity-40"
                  title="Traducir automáticamente de Español a Portugués e Inglés"
                >
                  {traduciendoEditGuion ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Traduciendo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Traducir Automáticamente</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  Español (ES)
                </span>
                <input
                  type="text"
                  placeholder="Instrucción en voz en off para armador hispano..."
                  value={editGuionEs}
                  onChange={(e) => setEditGuionEs(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  Português (PT-BR)
                </span>
                <input
                  type="text"
                  placeholder="Instrução em voz em off para montador brasileiro..."
                  value={editGuionPt}
                  onChange={(e) => setEditGuionPt(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  English (EN)
                </span>
                <input
                  type="text"
                  placeholder="Voice-over instruction for English assembler..."
                  value={editGuionEn}
                  onChange={(e) => setEditGuionEn(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Mensaje de feedback si hubo error */}
            {mensajeEdicionBloque && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-[10.5px] font-medium text-center">
                {mensajeEdicionBloque}
              </div>
            )}

            {/* Botones de Acción al Final del Formulario */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBloqueEstandarEnEdicion(null)}
                className="px-4 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-[11px] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoEdicionBloque || !editNombre.trim()}
                onClick={handleGuardarEdicionBloque}
                style={{ backgroundColor: botonActivoColor }}
                className="px-5 py-1.5 rounded-full text-white font-bold text-[11px] shadow-sm hover:opacity-90 active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {guardandoEdicionBloque ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando Cambios...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
