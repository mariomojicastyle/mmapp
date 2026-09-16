"use client";

import React, { useMemo } from "react";
import { use3BFStore, PasoManualStudio, CoreografiaShowcase, EjeAperturaShowcase, sanitizarPasosManuales } from "@/lib/store";
import { Plus, Trash2, Box, Boxes, Layers, Hammer, Sparkles, Check, CheckCircle2, ChevronRight, ChevronDown, Sliders, Wand2, PlayCircle, X, FolderPlus, Pipette, Eraser, Eye, EyeOff, Link2, Unlink, RotateCw, RotateCcw, RefreshCw, GripVertical, Volume2, Clock, Loader2, Upload, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move } from "lucide-react";
import { agruparMallasEnPiezasMadre, extraerPiezaMadre, anotarInstanciasFisicas, esHerrajeNombre } from "@/lib/piezaMadreUtils";

const MARCAS_DISPONIBLES = [
  { id: "Universales", nombre: "Universales / Genéricos" },
  { id: "Móveis Henn", nombre: "Móveis Henn" },
  { id: "Politorno", nombre: "Politorno Móveis" },
  { id: "RTA Design", nombre: "RTA Design" },
];

// 🎨 Paleta cromática coordinada para diferenciar cada subbloque (P02A, P02B, P02C, etc.)
export const COLORES_SUBBLOQUES: Array<{ bg: string; border: string; text: string }> = [
  { bg: "#0284C7", border: "#38BDF8", text: "#0369A1" }, // Sub A: Azul Cielo
  { bg: "#7C3AED", border: "#A78BFA", text: "#6D28D9" }, // Sub B: Violeta
  { bg: "#059669", border: "#34D399", text: "#047857" }, // Sub C: Esmeralda
  { bg: "#D97706", border: "#FBBF24", text: "#B45309" }, // Sub D: Ámbar Cálido
  { bg: "#DB2777", border: "#F472B6", text: "#BE185D" }, // Sub E: Fucsia
  { bg: "#4F46E5", border: "#818CF8", text: "#4338CA" }, // Sub F: Índigo
  { bg: "#0D9488", border: "#2DD4BF", text: "#0F766E" }, // Sub G: Teal
  { bg: "#EA580C", border: "#FB923C", text: "#C2410C" }, // Sub H: Naranja
];

export function obtenerColorSubbloque(indice: number) {
  return COLORES_SUBBLOQUES[indice % COLORES_SUBBLOQUES.length];
}

// 🔄 Íconos SVG oficiales de la marca para Girar / Acostar Pieza en Banco de Trabajo
function IconGirarIzquierda({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 -960 960 960"
      className={className}
      fill="currentColor"
    >
      <path
        d="m 160,-120 v -80 h 94 c -41.33333,-33.33333 -74,-74.16667 -98,-122.5 -24,-48.33333 -36,-100.83333 -36,-157.5 0,-50 9.5,-96.83333 28.5,-140.5 19,-43.66667 44.66667,-81.66667 77,-114 32.33333,-32.33333 70.33333,-58 114,-77 43.66667,-19 90.5,-28.5 140.5,-28.5 86,0 161.5,26.5 226.5,79.5 65,53 106.5,119.83333 124.5,200.5 h -83 c -17.33333,-58.66667 -50.33333,-106.66667 -99,-144 -48.66667,-37.33333 -105,-56 -169,-56 -78,0 -144.16667,27.16667 -198.5,81.5 -54.33333,54.33333 -81.5,120.5 -81.5,198.5 0,48 10.83333,92 32.5,132 21.66667,40 50.83333,72.66667 87.5,98 v -110 h 80 v 240 z"
      />
      <rect
        style={{ fill: "none", stroke: "currentColor", strokeWidth: 75.5904 }}
        width="110.80532"
        height="446.57901"
        x="646.39978"
        y="-43.005001"
        transform="rotate(-45.134824)"
      />
    </svg>
  );
}

function IconGirarDerecha({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 -960 960 960"
      className={className}
      fill="currentColor"
    >
      <g transform="matrix(-1,0,0,1,976.82722,-1.7558784e-6)">
        <path
          d="m 160,-120 v -80 h 94 c -41.33333,-33.33333 -74,-74.16667 -98,-122.5 -24,-48.33333 -36,-100.83333 -36,-157.5 0,-50 9.5,-96.83333 28.5,-140.5 19,-43.66667 44.66667,-81.66667 77,-114 32.33333,-32.33333 70.33333,-58 114,-77 43.66667,-19 90.5,-28.5 140.5,-28.5 86,0 161.5,26.5 226.5,79.5 65,53 106.5,119.83333 124.5,200.5 h -83 c -17.33333,-58.66667 -50.33333,-106.66667 -99,-144 -48.66667,-37.33333 -105,-56 -169,-56 -78,0 -144.16667,27.16667 -198.5,81.5 -54.33333,54.33333 -81.5,120.5 -81.5,198.5 0,48 10.83333,92 32.5,132 21.66667,40 50.83333,72.66667 87.5,98 v -110 h 80 v 240 z"
        />
        <rect
          style={{ fill: "none", stroke: "currentColor", strokeWidth: 75.5904 }}
          width="110.80532"
          height="446.57901"
          x="646.39978"
          y="-43.005001"
          transform="rotate(-45.134824)"
        />
      </g>
    </svg>
  );
}

// 🔄 Íconos SVG oficiales de Giro en Plano (-90° y +90°)
function IconGiroMenos90({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 -960 960 960"
      className={className}
      fill="currentColor"
    >
      <g transform="matrix(-1,0,0,1,1847.1126,-712.8031)">
        <path
          d="m 1127.1126,592.8031 c -22,0 -40.8333,-7.83333 -56.5,-23.5 -15.6667,-15.66667 -23.5,-34.5 -23.5,-56.5 V -47.196897 c 0,-22 7.8333,-40.83333 23.5,-56.500003 15.6667,-15.66667 34.5,-23.5 56.5,-23.5 h 480 c 22,0 40.8333,7.83333 56.5,23.5 15.6667,15.666673 23.5,34.500003 23.5,56.500003 V 512.8031 c 0,22 -7.8333,40.83333 -23.5,56.5 -15.6667,15.66667 -34.5,23.5 -56.5,23.5 z m 0,-80 h 480 V -47.196897 h -480 z m 480,0 h -480 z"
        />
        <path
          d="m 1155.6039,329.74457 h 70.5029 c 0,-34.66391 12.6317,-63.89324 37.8953,-87.68796 25.2636,-23.79472 55.521,-35.69208 90.7725,-35.69208 21.1509,0 40.8329,4.84707 59.0462,14.54122 18.2132,9.69414 33.1951,22.47279 44.9456,38.33594 h -56.4023 v 70.50288 h 176.2572 V 153.48736 h -70.5029 v 54.63974 c -18.8008,-22.32591 -41.2736,-39.95163 -67.4184,-52.87717 -26.1449,-12.92553 -54.7867,-19.38829 -85.9254,-19.38829 -55.8148,0 -102.9636,18.80077 -141.4464,56.40231 -38.4829,37.60154 -57.7243,83.42842 -57.7243,137.48062 z"
        />
      </g>
    </svg>
  );
}

function IconGiroMas90({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 -960 960 960"
      className={className}
      fill="currentColor"
    >
      <path
        d="m 240,-120 c -22,0 -40.83333,-7.83333 -56.5,-23.5 C 167.83333,-159.16667 160,-178 160,-200 v -560 c 0,-22 7.83333,-40.83333 23.5,-56.5 15.66667,-15.66667 34.5,-23.5 56.5,-23.5 h 480 c 22,0 40.83333,7.83333 56.5,23.5 15.66667,15.66667 23.5,34.5 23.5,56.5 v 560 c 0,22 -7.83333,40.83333 -23.5,56.5 -15.66667,15.66667 -34.5,23.5 -56.5,23.5 z m 0,-80 H 720 V -760 H 240 Z m 480,0 H 240 Z"
      />
      <path
        d="m 268.49134,-383.05853 h 70.50289 c 0,-34.66391 12.63173,-63.89324 37.8953,-87.68796 25.26356,-23.79472 55.52102,-35.69208 90.77246,-35.69208 21.15087,0 40.83289,4.84707 59.04617,14.54122 18.21327,9.69414 33.19515,22.47279 44.9456,38.33594 h -56.40231 v 70.50288 h 176.2572 v -176.25721 h -70.50288 v 54.63974 c -18.80074,-22.32591 -41.27354,-39.95163 -67.41839,-52.87717 -26.14485,-12.92553 -54.78664,-19.38829 -85.92539,-19.38829 -55.81475,0 -102.96356,18.80077 -141.44641,56.40231 -38.48286,37.60154 -57.72424,83.42842 -57.72424,137.48062 z"
      />
    </svg>
  );
}

export default function StepManagerPanel() {
  const [mostrarMenuAnadirBloque, setMostrarMenuAnadirBloque] = React.useState(false);
  const [seccionPiezasColapsada, setSeccionPiezasColapsada] = React.useState(false);
  const [subbloquesColapsados, setSubbloquesColapsados] = React.useState<Record<string, boolean>>({});
  const [gruposCinematicosColapsados, setGruposCinematicosColapsados] = React.useState<Record<string, boolean>>({});
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
    agregarSubBloqueArmado,
    actualizarSubBloqueArmado,
    eliminarSubBloqueArmado,
    asignarPiezaASubBloque,
    desasignarPiezaDeSubBloque,
    conmutarVisibilidadSubBloqueArmado,
    actualizarTransformBancoSubBloque,
    resetTransformBancoSubBloque,
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
      if (g.tipo === "cajon") {
        return {
          ...g,
          distanciaMm: nuevoSinc ? distGlobal : (g.distanciaMm ?? distGlobal),
        };
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
        {/* Encabezado del Paso Activo (Solo para Showcase) */}
        {pasoActivo.tipo === "showcase" && (
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
                className="p-1 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

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
                      secuencial: "Individual",
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

              {/* Slider Distancia de apertura con botón de dos posiciones */}
              {(() => {
                const sincGlobal = pasoActivo.showcase?.sincronizarCarreraCajones !== false;
                return (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-semibold opacity-75">Distancia de apertura</span>
                      <div className="flex items-center gap-2">
                        {/* Pequeño botón de posición Activado / Desactivado */}
                        <button
                          type="button"
                          onClick={toggleSincronizacionCajones}
                          title={
                            sincGlobal
                              ? "Control Uniforme Activado: El slider principal gobierna todos los cajones simultáneamente. Clic para desactivar y mover cajones por separado."
                              : "Control Uniforme Desactivado: Puedes controlar la carrera de cada cajón individualmente. Clic para activar y sincronizar todos."
                          }
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out select-none ${
                            sincGlobal ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                              sincGlobal ? "translate-x-3" : "translate-x-0"
                            }`}
                          />
                        </button>

                        <div className={`flex items-center gap-1 transition-opacity ${sincGlobal ? "opacity-100" : "opacity-40"}`}>
                          <input
                            type="number"
                            min={50}
                            max={600}
                            step={10}
                            disabled={!sincGlobal}
                            value={pasoActivo.showcase?.distanciaAperturaMm ?? 300}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleCambioDistanciaGlobal(isNaN(val) ? 0 : val);
                            }}
                            className="w-12 px-1 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-800 dark:text-slate-100 text-right text-[10px] outline-none focus:border-cyan-500 disabled:cursor-not-allowed"
                          />
                          <span className="font-mono text-[9.5px]">mm</span>
                        </div>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={450}
                      step={10}
                      disabled={!sincGlobal}
                      value={pasoActivo.showcase?.distanciaAperturaMm || 300}
                      onChange={(e) => handleCambioDistanciaGlobal(parseInt(e.target.value, 10))}
                      className={`accent-cyan-600 h-1.5 w-full transition-opacity ${
                        sincGlobal ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-30"
                      }`}
                    />
                  </div>
                );
              })()}

              {/* Cierre del Bloque de Cajones */}
            </div>

            {/* Listado de Grupos Cinemáticos: Bloques Funcionales (Cajones o Puertas) */}
            <div className="flex flex-col gap-2.5">
              {/* Cabecera: Título a la izquierda en una sola línea y Ojito a la derecha */}
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
                  Bloques Funcionales ({pasoActivo.showcase?.gruposCinematicos?.length || 0})
                </span>
                {(pasoActivo.showcase?.gruposCinematicos?.length || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => conmutarVisibilidadTodosGruposCinematicos(pasoActivo.id)}
                    title={
                      pasoActivo.showcase?.gruposCinematicos?.some((g) => g.oculto)
                        ? "Mostrar todos los bloques funcionales en 3D"
                        : "Ocultar todos los bloques funcionales en 3D"
                    }
                    className={`p-1.5 rounded-full transition cursor-pointer border shrink-0 ${
                      pasoActivo.showcase?.gruposCinematicos?.some((g) => g.oculto)
                        ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-cyan-500 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {pasoActivo.showcase?.gruposCinematicos?.some((g) => g.oculto) ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Botón de ancho completo estilo 'Guardar Manual' con Menú Desplegable: Cajón o Puerta */}
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setMostrarMenuAnadirBloque(!mostrarMenuAnadirBloque)}
                  style={{ backgroundColor: botonActivoColor }}
                  className="w-full py-2 px-4 rounded-full text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-98 transition cursor-pointer select-none"
                >
                  <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>Adicionar Bloque Funcional</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/80 ml-0.5" />
                </button>

                {mostrarMenuAnadirBloque && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setMostrarMenuAnadirBloque(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 w-full p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100">
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

              {(!pasoActivo.showcase?.gruposCinematicos || pasoActivo.showcase.gruposCinematicos.length === 0) ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-2 text-xs opacity-90 bg-slate-500/5">
                  <p className="font-semibold text-[11px]">No hay bloques funcionales cinemáticos asignados aún.</p>
                  <p className="text-[10px] opacity-60 max-w-xs">
                    Haz clic en <strong>"+ Bloque Funcional"</strong> para añadir cajones o puertas.
                  </p>
                </div>
              ) : (
                /* Flujo continuo natural sin barra de scroll interna */
                <div className="flex flex-col gap-3">
                  {pasoActivo.showcase.gruposCinematicos.map((grupo, gIdx) => {
                    const esPuerta = grupo.tipo === "puerta";
                    const estaColapsado = !!gruposCinematicosColapsados[grupo.id];

                    const toggleColapsoGrupo = () => {
                      setGruposCinematicosColapsados((prev) => ({
                        ...prev,
                        [grupo.id]: !prev[grupo.id],
                      }));
                    };

                    return (
                      <div
                        key={grupo.id}
                        className={`p-3 rounded-2xl border transition flex flex-col gap-2.5 shadow-sm ${
                          esPuerta
                            ? "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70"
                        } ${grupo.oculto ? "opacity-75" : ""}`}
                      >
                        {/* Cabecera del Bloque Funcional: Ícono de Retracción circular interactivo */}
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {/* Círculo con flechita que rota 180° reemplazando al número */}
                            <button
                              type="button"
                              onClick={toggleColapsoGrupo}
                              title={estaColapsado ? `Expandir ${grupo.nombre}` : `Retraer ${grupo.nombre}`}
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110 shadow-2xs cursor-pointer border ${
                                esPuerta
                                  ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                                  : "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                              }`}
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                  estaColapsado ? "-rotate-180" : "rotate-0"
                                }`}
                              />
                            </button>

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

                            {/* 💡 Botón Bombillito / Ojito para Apagar/Encender Bloque en 3D (Estilo Neutro / #1368AA) */}
                            <button
                              type="button"
                              onClick={() => conmutarVisibilidadGrupoCinematico(pasoActivo.id, grupo.id)}
                              title={grupo.oculto ? "Mostrar bloque en 3D" : "Apagar bloque en 3D (para ver herrajes interiores)"}
                              className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                                grupo.oculto
                                  ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-cyan-500 border-slate-200 dark:border-slate-700"
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

                        {/* Contenido Retráctil del Bloque Funcional (Cajón / Puerta) */}
                        {!estaColapsado && (
                          <>
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
                                    {sinc ? (
                                      <span
                                        className="text-[8.5px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5"
                                        title="Sincronizado: este cajón sigue el control global de apertura"
                                      >
                                        <Link2 className="w-2.5 h-2.5" /> Uniforme
                                      </span>
                                    ) : (
                                      <span
                                        className="text-[8.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5"
                                        title="Independiente: la distancia de este cajón se controla por separado"
                                      >
                                        Individual
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
                      </>
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
              {/* Cabecera del Paso Ensamble: Bloque de armado PXX (Con botón circular colapsable que rota 180°) */}
              {(() => {
                const idPasoLimpio = pasoActivo.id.startsWith("P") ? pasoActivo.id : `P${String(pasoActivo.numero ?? "").padStart(2, "0")}`;
                const tituloFijo = `Bloque de armado ${idPasoLimpio}`;
                const totalComponentes = (pasoActivo.piezasAsignadas || []).length + (pasoActivo.herrajesAsignados || []).length;

                return (
                  <div className="flex flex-col gap-2.5 w-full">
                    {/* Fila 1: Título con botón circular interactivo que rota 180° para retraer todo el bloque de armado */}
                    <div
                      onClick={() => setSeccionPiezasColapsada(!seccionPiezasColapsada)}
                      className="flex items-center justify-between w-full cursor-pointer select-none group py-0.5"
                      title={seccionPiezasColapsada ? "Expandir Bloque de armado" : "Retraer Bloque de armado"}
                    >
                      <div className="flex items-center gap-2">
                        {/* Círculo con flechita que rota 180° */}
                        <div className="w-5 h-5 rounded-full border border-cyan-500/40 dark:border-cyan-400/40 bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-500/20 shadow-2xs">
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-300 ${
                              seccionPiezasColapsada ? "-rotate-180" : "rotate-0"
                            }`}
                          />
                        </div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                          {tituloFijo}
                        </span>
                      </div>

                      {totalComponentes > 0 && (
                        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                          {totalComponentes} {totalComponentes === 1 ? "comp." : "comps."}
                        </span>
                      )}
                    </div>

                    {/* Contenido Retráctil: Botones de Acción + Tableros y Herrajes */}
                    {!seccionPiezasColapsada && (
                      <div className="flex flex-col gap-2.5 pt-0.5">
                        {/* Fila 2: Botones de Acción (Tocar en 3D, Retirar, Ojito, Invert y Tarrito de Basura) */}
                        <div className="flex items-center gap-1.5 w-full flex-wrap">
                          {/* 1. Botón Cápsula Tocar en 3D */}
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                modoPickingManual.activo &&
                                modoPickingManual.pasoId === pasoActivo.id &&
                                !modoPickingManual.grupoId &&
                                modoPickingManual.modo === "agregar"
                              ) {
                                limpiarPickingManual();
                              } else {
                                if (!pasoActivo.piezasOcultas) {
                                  conmutarVisibilidadPiezasPaso(pasoActivo.id);
                                }
                                iniciarPickingManual(pasoActivo.id, null, "agregar");
                              }
                            }}
                            title="Seleccionar piezas y herrajes tocándolas directamente en el 3D"
                            className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 font-bold text-[9.5px] border cursor-pointer ${
                              modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "agregar"
                                ? "bg-cyan-500 text-white border-cyan-400 shadow-sm animate-pulse"
                                : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                            }`}
                          >
                            <Pipette className="w-3 h-3" />
                            <span>
                              {modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "agregar"
                                ? "Tocando 3D..."
                                : "Tocar en 3D"}
                            </span>
                          </button>

                          {/* 2. Botón Cápsula Retirar (Inmediatamente a la derecha de Tocar en 3D) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                modoPickingManual.activo &&
                                modoPickingManual.pasoId === pasoActivo.id &&
                                !modoPickingManual.grupoId &&
                                modoPickingManual.modo === "retirar"
                              ) {
                                limpiarPickingManual();
                              } else {
                                iniciarPickingManual(pasoActivo.id, null, "retirar");
                              }
                            }}
                            title="Retirar piezas o herrajes tocándolos directamente en la vista 3D"
                            className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 font-bold text-[9.5px] border cursor-pointer ${
                              modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "retirar"
                                ? "bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/40 animate-pulse"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                            }`}
                          >
                            <Eraser className="w-3 h-3" />
                            <span>
                              {modoPickingManual.activo &&
                              modoPickingManual.pasoId === pasoActivo.id &&
                              !modoPickingManual.grupoId &&
                              modoPickingManual.modo === "retirar"
                                ? "Retirando 3D..."
                                : "Retirar"}
                            </span>
                          </button>

                          {/* 3. Botón Circular Apagar/Prender Piezas en 3D (Ojito) */}
                          <button
                            type="button"
                            onClick={() => conmutarVisibilidadPiezasPaso(pasoActivo.id)}
                            title={
                              pasoActivo.piezasOcultas
                                ? "Mostrar piezas de este bloque de armado en 3D"
                                : "Apagar piezas de este bloque de armado en 3D"
                            }
                            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                              pasoActivo.piezasOcultas
                                ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {pasoActivo.piezasOcultas ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 4. Botón Circular Invert (Ojo con la diagonal, sin texto, mismo tamaño) */}
                          <button
                            type="button"
                            onClick={() => conmutarOcultarNoAsignadasPaso(pasoActivo.id)}
                            title={
                              pasoActivo.ocultarNoAsignadas
                                ? "Invert Hide Activo: Piezas no asignadas ocultas. Clic para mostrar todo el mueble."
                                : "Invert Hide: Aislar este bloque de armado ocultando el resto del mueble."
                            }
                            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                              pasoActivo.ocultarNoAsignadas
                                ? "bg-[#1368AA] text-white border-[#1368AA] shadow-sm ring-2 ring-[#1368AA]/30"
                                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-cyan-500 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Tarrito de Basura al Final */}
                          {pasosManual.length > 1 && pasoActivo.id !== "P00" && (
                            <button
                              type="button"
                              onClick={() => eliminarPasoManual(pasoActivo.id)}
                              title="Eliminar este bloque de armado"
                              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0 cursor-pointer ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Piezas Asignadas (Tableros y Herrajes limpios sin cabecera redundante) */}
                        {((pasoActivo.piezasAsignadas || []).length > 0 || (pasoActivo.herrajesAsignados || []).length > 0) ? (
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                            {/* Tableros de Madera */}
                            {(pasoActivo.piezasAsignadas || []).length > 0 && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Layers className="w-2.5 h-2.5 text-amber-600" /> Tableros ({pasoActivo.piezasAsignadas.length})
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {pasoActivo.piezasAsignadas.map((pz) => {
                                    const pmLimpia = extraerPiezaMadre(pz);
                                    const subAsignado = (pasoActivo.subbloques || []).find((s) =>
                                      s.piezas.some((sp) => sp === pz || extraerPiezaMadre(sp) === pmLimpia)
                                    );
                                    return (
                                      <span
                                        key={pz}
                                        style={{ borderColor: botonActivoColor }}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 border"
                                      >
                                        <span className="truncate max-w-[140px]">{pmLimpia}</span>
                                        {subAsignado && (() => {
                                          const sIdx = (pasoActivo.subbloques || []).findIndex((s) => s.id === subAsignado.id);
                                          const colorSub = obtenerColorSubbloque(sIdx >= 0 ? sIdx : 0);
                                          return (
                                            <span
                                              className="px-1.5 py-0.5 rounded-full text-white font-black text-[8px] flex items-center justify-center shrink-0 shadow-xs"
                                              style={{ backgroundColor: colorSub.bg }}
                                              title={`Asignado a ${subAsignado.nombre}`}
                                            >
                                              {subAsignado.codigo || `${pasoActivo.id}${subAsignado.letra}`}
                                            </span>
                                          );
                                        })()}
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
                                    const subAsignadoH = (pasoActivo.subbloques || []).find((s) =>
                                      s.herrajes.some((sh) => sh === h || extraerPiezaMadre(sh) === hLimpio)
                                    );
                                    return (
                                      <span
                                        key={h}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                                      >
                                        <span className="truncate max-w-[140px]">{hLimpio}</span>
                                        {subAsignadoH && (() => {
                                          const sIdx = (pasoActivo.subbloques || []).findIndex((s) => s.id === subAsignadoH.id);
                                          const colorSub = obtenerColorSubbloque(sIdx >= 0 ? sIdx : 0);
                                          return (
                                            <span
                                              className="px-1.5 py-0.5 rounded-full text-white font-black text-[8px] flex items-center justify-center shrink-0 shadow-xs"
                                              style={{ backgroundColor: colorSub.bg }}
                                              title={`Asignado a ${subAsignadoH.nombre}`}
                                            >
                                              {subAsignadoH.codigo || `${pasoActivo.id}${subAsignadoH.letra}`}
                                            </span>
                                          );
                                        })()}
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
                    )}
                  </div>
                );
              })()}

              {/* 🧩 SECCIÓN DE SUBBLOQUES DE ARMADO (A partir de la línea roja) */}
              <div className="flex flex-col gap-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                {/* Cabecera de Subbloques */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Sub-Bloques de Armado ({(pasoActivo.subbloques || []).length})
                  </span>
                </div>

                {/* Botón de ancho completo para añadir subbloque */}
                <button
                  type="button"
                  onClick={() => agregarSubBloqueArmado(pasoActivo.id)}
                  style={{ backgroundColor: botonActivoColor }}
                  className="w-full py-2 px-3 rounded-full text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 active:scale-98 transition cursor-pointer select-none"
                >
                  <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>Añadir Sub-Bloque</span>
                </button>

                {/* Listado de Tarjetas de Subbloques */}
                {pasoActivo.subbloques && pasoActivo.subbloques.length > 0 && (
                  <div className="flex flex-col gap-2.5 mt-0.5">
                    {pasoActivo.subbloques.map((sub, sIdx) => {
                      const estaEnPickingAgregar =
                        modoPickingManual.activo &&
                        modoPickingManual.pasoId === pasoActivo.id &&
                        modoPickingManual.grupoId === sub.id &&
                        modoPickingManual.modo === "agregar";
                      const estaEnPickingRetirar =
                        modoPickingManual.activo &&
                        modoPickingManual.pasoId === pasoActivo.id &&
                        modoPickingManual.grupoId === sub.id &&
                        modoPickingManual.modo === "retirar";

                      const letraSub = sub.letra || String.fromCharCode(65 + sIdx);
                      const codigoSub = sub.codigo || `${pasoActivo.id}${letraSub}`;
                      const nombreSub = (!sub.nombre || sub.nombre.startsWith("Subbloque "))
                        ? `Sub-Bloque ${pasoActivo.id}-${letraSub}`
                        : sub.nombre;

                      const colorSub = obtenerColorSubbloque(sIdx);
                      const estaColapsado = !!subbloquesColapsados[sub.id];
                      const totalCompSub = (sub.piezas || []).length + (sub.herrajes || []).length;

                      const toggleColapsoSub = () => {
                        setSubbloquesColapsados((prev) => ({
                          ...prev,
                          [sub.id]: !prev[sub.id],
                        }));
                      };

                      return (
                        <div
                          key={sub.id}
                          className="p-2.5 rounded-2xl border bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-2 shadow-xs transition-colors"
                          style={{ borderColor: `${colorSub.bg}45` }}
                        >
                          {/* Fila 1: Cabecera con botón circular de retracción (180°), badge de código y título */}
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Círculo con flechita que rota 180° coordinado con el color del subbloque */}
                              <button
                                type="button"
                                onClick={toggleColapsoSub}
                                title={estaColapsado ? `Expandir ${nombreSub}` : `Retraer ${nombreSub}`}
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110 shadow-2xs cursor-pointer border"
                                style={{
                                  backgroundColor: `${colorSub.bg}15`,
                                  borderColor: `${colorSub.bg}40`,
                                  color: colorSub.bg,
                                }}
                              >
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                    estaColapsado ? "-rotate-180" : "rotate-0"
                                  }`}
                                />
                              </button>

                              <span 
                                className="px-2.5 py-0.5 rounded-full text-white flex items-center justify-center font-black text-[10.5px] shrink-0 shadow-xs"
                                style={{ backgroundColor: colorSub.bg }}
                              >
                                {codigoSub}
                              </span>
                              <input
                                type="text"
                                value={nombreSub}
                                onChange={(e) =>
                                  actualizarSubBloqueArmado(pasoActivo.id, sub.id, { nombre: e.target.value })
                                }
                                className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 outline-none w-full text-slate-800 dark:text-slate-100 truncate"
                              />
                            </div>

                            {totalCompSub > 0 && (
                              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 font-mono shrink-0">
                                {totalCompSub} {totalCompSub === 1 ? "comp." : "comps."}
                              </span>
                            )}
                          </div>

                          {/* Contenido Retráctil del Sub-Bloque */}
                          {!estaColapsado && (
                            <>
                              {/* Fila 2: Herramientas dedicadas del Subbloque (Tocar en 3D, Retirar, Ocultar/Ver y Tarrito de Basura) */}
                              <div className="flex items-center gap-1.5 w-full flex-wrap">
                            {/* Tocar en 3D */}
                            <button
                              type="button"
                              onClick={() => {
                                if (estaEnPickingAgregar) {
                                  limpiarPickingManual();
                                } else {
                                  if (!pasoActivo.piezasOcultas) {
                                    conmutarVisibilidadPiezasPaso(pasoActivo.id);
                                  }
                                  iniciarPickingManual(pasoActivo.id, sub.id, "agregar");
                                }
                              }}
                              title="Seleccionar piezas o correderas para este subbloque tocándolas en 3D"
                              className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 font-bold text-[9px] border cursor-pointer ${
                                estaEnPickingAgregar
                                  ? "bg-cyan-500 text-white border-cyan-400 shadow-sm animate-pulse"
                                  : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                              }`}
                            >
                              <Pipette className="w-3 h-3" />
                              <span>{estaEnPickingAgregar ? "Tocando 3D..." : "Tocar en 3D"}</span>
                            </button>

                            {/* Retirar */}
                            <button
                              type="button"
                              onClick={() => {
                                if (estaEnPickingRetirar) {
                                  limpiarPickingManual();
                                } else {
                                  iniciarPickingManual(pasoActivo.id, sub.id, "retirar");
                                }
                              }}
                              title="Retirar piezas o correderas de este subbloque tocándolas en 3D"
                              className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 font-bold text-[9px] border cursor-pointer ${
                                estaEnPickingRetirar
                                  ? "bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/40 animate-pulse"
                                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                              }`}
                            >
                              <Eraser className="w-3 h-3" />
                              <span>{estaEnPickingRetirar ? "Retirando 3D..." : "Retirar"}</span>
                            </button>

                            {/* 3. Botón Circular Ocultar/Prender Subbloque en 3D (Ojito) */}
                            <button
                              type="button"
                              onClick={() => conmutarVisibilidadSubBloqueArmado(pasoActivo.id, sub.id)}
                              title={
                                sub.oculto
                                  ? `Mostrar piezas de ${sub.nombre} en 3D`
                                  : `Ocultar piezas de ${sub.nombre} en 3D`
                              }
                              className={`p-1.5 rounded-full transition shrink-0 cursor-pointer border ${
                                sub.oculto
                                  ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {sub.oculto ? (
                                <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Tarrito de Basura */}
                            <button
                              type="button"
                              onClick={() => eliminarSubBloqueArmado(pasoActivo.id, sub.id)}
                              title="Eliminar este subbloque"
                              className="p-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0 cursor-pointer ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Chips de componentes asignados al subbloque */}
                          {(sub.piezas.length > 0 || sub.herrajes.length > 0) ? (
                            <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                              {sub.piezas.map((pz) => (
                                <span
                                  key={pz}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/30"
                                >
                                  <span>{extraerPiezaMadre(pz)}</span>
                                  <button
                                    type="button"
                                    onClick={() => desasignarPiezaDeSubBloque(pasoActivo.id, sub.id, pz)}
                                    className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                              {sub.herrajes.map((hr) => (
                                <span
                                  key={hr}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                                >
                                  <span>{extraerPiezaMadre(hr)}</span>
                                  <button
                                    type="button"
                                    onClick={() => desasignarPiezaDeSubBloque(pasoActivo.id, sub.id, hr)}
                                    className="hover:text-rose-500 transition cursor-pointer ml-0.5"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="py-1 px-2 text-center rounded-xl bg-slate-500/5 text-[9.5px] opacity-60 italic">
                              Usa <strong>Tocar en 3D</strong> para asignar la pieza madre y sus correderas
                            </div>
                          )}

                          {/* 🪚 BANCO DE TRABAJO Y PIEZA MÁSTER INDEPENDIENTE DEL SUB-BLOQUE (LÍNEA ROJA) */}
                          {(() => {
                            const piezaMasterSel = sub.piezaMaster || (sub.piezas.length > 0 ? sub.piezas[0] : "");
                            const rotPlano = sub.transformBanco?.rotacionPlano ?? sub.transformBanco?.rotacionYDeg ?? (sub.transformBanco?.rotacion?.[1] || 0);
                            const offsetX = sub.transformBanco?.offsetX || 0;
                            const offsetZ = sub.transformBanco?.offsetZ || 0;
                            const acostado = sub.transformBanco?.acostado || false;
                            const direccionAcostar = sub.transformBanco?.direccionAcostar || "izquierda";

                            // 🔄 Giro único en el plano: Izquierda (-90°) o Derecha (+90°)
                            const girarPlano = (delta: number) => {
                              let nuevo = (rotPlano + delta) % 360;
                              if (nuevo < 0) nuevo += 360;
                              actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                rotacionPlano: nuevo,
                                rotacionYDeg: nuevo,
                                rotacion: [0, nuevo, 0],
                                apoyoEnPiso: true,
                              });
                            };

                            // 🕹️ Joystick D-Pad: Desplazamiento sobre plano horizontal (±50 mm por clic)
                            const moverPlano = (dx: number, dz: number) => {
                              const nuevoX = Math.round((offsetX + dx) * 1000) / 1000;
                              const nuevoZ = Math.round((offsetZ + dz) * 1000) / 1000;
                              actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                offsetX: nuevoX,
                                offsetZ: nuevoZ,
                                apoyoEnPiso: true,
                              });
                            };

                            const resetOffsets = () => {
                              actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                offsetX: 0,
                                offsetZ: 0,
                                apoyoEnPiso: true,
                              });
                            };

                            return (
                              <div className="flex flex-col gap-2.5 p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs mt-1">
                                {/* Selector de Pieza Master del Sub-Bloque */}
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-100">
                                      <Box className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                      <span>Pieza Master</span>
                                    </span>
                                  </div>

                                  <select
                                    value={piezaMasterSel}
                                    onChange={(e) => {
                                      actualizarSubBloqueArmado(pasoActivo.id, sub.id, { piezaMaster: e.target.value });
                                    }}
                                    className="w-full px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none cursor-pointer text-slate-800 dark:text-slate-100"
                                  >
                                    {sub.piezas.length === 0 && (
                                      <option value="">-- Asigna piezas de madera primero --</option>
                                    )}
                                    {sub.piezas.map((p) => {
                                      const nombreLimpio = extraerPiezaMadre(p);
                                      return (
                                        <option key={p} value={p}>
                                          {nombreLimpio} {p !== nombreLimpio ? `(${p})` : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                  {/* 🔄 Segmented Pill Bar: Contenedor unificado de Acostar y Giro en Plano */}
                                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                                    {/* Barra Cápsula Unificada (Pill Container) */}
                                    <div className="flex items-center justify-center py-1">
                                      <div className="inline-flex items-center p-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-inner gap-1.5">
                                        {/* 1. Girar / Acostar Izquierda */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const estaActivoIzquierda = acostado && direccionAcostar !== "derecha";
                                            actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                              acostado: !estaActivoIzquierda,
                                              direccionAcostar: "izquierda",
                                              apoyoEnPiso: true,
                                            });
                                          }}
                                          title={
                                            acostado && direccionAcostar !== "derecha"
                                              ? "Acostada hacia la izquierda (Activo). Clic para poner de pie"
                                              : "Girar / Acostar hacia la izquierda"
                                          }
                                          className={`w-[33px] h-[33px] rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                            acostado && direccionAcostar !== "derecha"
                                              ? "bg-[#0891b2] text-white shadow-sm border border-[#0891b2] scale-105"
                                              : "bg-transparent border border-slate-300/80 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-200/40 dark:hover:bg-slate-700/40"
                                          }`}
                                        >
                                          <IconGirarIzquierda className="w-[20.5px] h-[20.5px]" />
                                        </button>

                                        {/* 2. Girar / Acostar Derecha */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const estaActivoDerecha = acostado && direccionAcostar === "derecha";
                                            actualizarTransformBancoSubBloque(pasoActivo.id, sub.id, {
                                              acostado: !estaActivoDerecha,
                                              direccionAcostar: "derecha",
                                              apoyoEnPiso: true,
                                            });
                                          }}
                                          title={
                                            acostado && direccionAcostar === "derecha"
                                              ? "Acostada hacia la derecha (Activo). Clic para poner de pie"
                                              : "Girar / Acostar hacia la derecha"
                                          }
                                          className={`w-[33px] h-[33px] rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                            acostado && direccionAcostar === "derecha"
                                              ? "bg-[#0891b2] text-white shadow-sm border border-[#0891b2] scale-105"
                                              : "bg-transparent border border-slate-300/80 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-200/40 dark:hover:bg-slate-700/40"
                                          }`}
                                        >
                                          <IconGirarDerecha className="w-[20.5px] h-[20.5px]" />
                                        </button>

                                        {/* Separador sutil */}
                                        <div className="w-px h-4.5 bg-slate-300/80 dark:bg-slate-700 mx-0.5" />

                                        {/* 3. Giro -90° (Antihorario) */}
                                        <button
                                          type="button"
                                          onClick={() => girarPlano(-90)}
                                          title="Girar 90° hacia la izquierda (antihorario)"
                                          className="w-[33px] h-[33px] rounded-full bg-transparent border border-slate-300/80 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:border-blue-400 dark:hover:text-blue-400 hover:bg-slate-200/40 dark:hover:bg-slate-700/40 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                        >
                                          <IconGiroMenos90 className="w-[22px] h-[22px]" />
                                        </button>

                                        {/* 4. Giro +90° (Horario) */}
                                        <button
                                          type="button"
                                          onClick={() => girarPlano(90)}
                                          title="Girar 90° hacia la derecha (horario)"
                                          className="w-[33px] h-[33px] rounded-full bg-transparent border border-slate-300/80 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:border-blue-400 dark:hover:text-blue-400 hover:bg-slate-200/40 dark:hover:bg-slate-700/40 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                        >
                                          <IconGiroMas90 className="w-[22px] h-[22px]" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                {/* 🕹️ Control Tipo Joystick / Cruceta D-Pad */}
                                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                                  {/* Cruceta Joystick D-Pad centrada */}
                                  <div className="flex flex-col items-center justify-center py-1 select-none">
                                    {/* Fila Arriba: Subir */}
                                    <button
                                      type="button"
                                      onClick={() => moverPlano(0, -0.05)}
                                      title="Subir en el banco de trabajo (+50 mm)"
                                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer mb-1"
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </button>

                                    {/* Fila Centro: Izquierda | Centro Reset | Derecha */}
                                    <div className="flex items-center gap-2">
                                      {/* Izquierda */}
                                      <button
                                        type="button"
                                        onClick={() => moverPlano(-0.05, 0)}
                                        title="Desplazar a la izquierda (-50 mm)"
                                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
                                      >
                                        <ArrowLeft className="w-4 h-4" />
                                      </button>

                                      {/* Centro Neutro / Reset */}
                                      <button
                                        type="button"
                                        onClick={resetOffsets}
                                        title="Centrar en origen"
                                        className="w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:border-[#1368AA] hover:text-[#1368AA] flex items-center justify-center shadow-2xs active:scale-90 transition-all cursor-pointer"
                                      >
                                        ●
                                      </button>

                                      {/* Derecha */}
                                      <button
                                        type="button"
                                        onClick={() => moverPlano(0.05, 0)}
                                        title="Desplazar a la derecha (+50 mm)"
                                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
                                      >
                                        <ArrowRight className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Fila Abajo: Bajar */}
                                    <button
                                      type="button"
                                      onClick={() => moverPlano(0, 0.05)}
                                      title="Bajar en el banco de trabajo (-50 mm)"
                                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#1368AA] hover:text-[#1368AA] dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer mt-1"
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  );
                })}
                  </div>
                )}
              </div>
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
                          ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
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
                                ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
                                : "bg-white dark:bg-slate-900 text-slate-400 hover:text-cyan-500 border-slate-200 dark:border-slate-700"
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

            {/* Pieza Master / Base de Banco (solo para pasos sin subbloques independientes) */}
            {(!pasoActivo.subbloques || pasoActivo.subbloques.length === 0) && (
              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-500/5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-100">
                    <Box className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Pieza Master</span>
                  </span>
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
          )}
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
