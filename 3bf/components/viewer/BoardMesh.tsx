"use client";

import React from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { use3BFStore, MaterialPBRDef } from "@/lib/store";
import { extraerPiezaMadre } from "@/lib/piezaMadreUtils";

export function useMaterialPBRMaps(
  materialPBR?: MaterialPBRDef | null, 
  fallbackUrl?: string | null, 
  tipoMapeado?: string, 
  hasGrasshopperUvs?: boolean
) {
  const [maps, setMaps] = React.useState<{
    diffuse: THREE.Texture | null;
    normal: THREE.Texture | null;
    roughness: THREE.Texture | null;
    ao: THREE.Texture | null;
  }>({ diffuse: null, normal: null, roughness: null, ao: null });

  // 🛡️ REGLA DfMA CANÓNICA: Si la pieza ya trae UVs calculadas por Grasshopper (hasGrasshopperUvs),
  // tex.rotation SIEMPRE debe ser 0. En Three.js tex.rotation rota TODA la textura indiscriminadamente
  // (tanto caras como cantos), destruyendo los cantos (tapacanto PVC) que siempre deben correr a lo largo.
  // Grasshopper ya resuelve la orientación física en sus coordenadas UV.
  const isTraversada = !hasGrasshopperUvs && (tipoMapeado === "Cubierta Atravesada" || tipoMapeado === "Entrepaño Atravesado");
  const targetDiffuse = materialPBR?.texturaUrl || fallbackUrl;
  const targetNormal = materialPBR?.normalMapUrl || null;
  const targetRoughness = materialPBR?.roughnessMapUrl || null;
  const targetAO = materialPBR?.aoMapUrl || null;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!targetDiffuse && !targetNormal && !targetRoughness && !targetAO) {
      setMaps({ diffuse: null, normal: null, roughness: null, ao: null });
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const setupTex = (tex: THREE.Texture, isColor = false) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.0, 1.0);
      tex.center.set(0.5, 0.5);
      tex.rotation = isTraversada ? Math.PI / 2 : 0;
      if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    };

    if (targetDiffuse) {
      loader.load(targetDiffuse, (t) => {
        setMaps((prev) => ({ ...prev, diffuse: setupTex(t, true) }));
      });
    } else {
      setMaps((prev) => ({ ...prev, diffuse: null }));
    }

    if (targetNormal) {
      loader.load(targetNormal, (t) => {
        setMaps((prev) => ({ ...prev, normal: setupTex(t, false) }));
      });
    } else {
      setMaps((prev) => ({ ...prev, normal: null }));
    }

    if (targetRoughness) {
      loader.load(targetRoughness, (t) => {
        setMaps((prev) => ({ ...prev, roughness: setupTex(t, false) }));
      });
    } else {
      setMaps((prev) => ({ ...prev, roughness: null }));
    }

    if (targetAO) {
      loader.load(targetAO, (t) => {
        setMaps((prev) => ({ ...prev, ao: setupTex(t, false) }));
      });
    } else {
      setMaps((prev) => ({ ...prev, ao: null }));
    }
  }, [targetDiffuse, targetNormal, targetRoughness, targetAO, isTraversada]);

  return maps;
}

export interface BoardMeshProps {
  position: [number, number, number];
  size: [number, number, number];
  name: string;
  mainColor: string;
  modoVisual: string;
  vertices?: number[];
  indices?: number[];
  uvs?: number[];
  tipoMapeado?: string;
  instanciaId?: string;
  instanciaKey?: string;
  esDuplicado?: boolean;
}

export function BoardMesh({
  position,
  size,
  name,
  mainColor,
  modoVisual,
  vertices,
  indices,
  uvs: grasshopperUvs,
  tipoMapeado,
  instanciaId,
  instanciaKey,
  esDuplicado = false,
}: BoardMeshProps) {
  const { 
    calibracion, 
    objetoSeleccionado, 
    setHoveredPiece, 
    coloresApariencia, 
    capas, 
    materialesPBR, 
    asignacionesPartes,
    modoPickingManual,
    togglePiezaEnPickingManual,
    pasosManual,
    pasoActivoManualId,
    pestanaActiva,
  } = use3BFStore();

  const meshRef = React.useRef<THREE.Mesh>(null);

  const customGeometry = React.useMemo(() => {
    if (vertices && indices && vertices.length > 0 && indices.length > 0) {
      const indexedGeo = new THREE.BufferGeometry();
      indexedGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      indexedGeo.setIndex(indices);
      indexedGeo.computeVertexNormals();

      if (grasshopperUvs && grasshopperUvs.length > 0) {
        indexedGeo.setAttribute("uv", new THREE.Float32BufferAttribute(grasshopperUvs, 2));
        const geo = indexedGeo.toNonIndexed();
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        return geo;
      }

      const geo = indexedGeo.toNonIndexed();
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      const posAttr = geo.attributes.position;
      const uvs = new Float32Array(posAttr.count * 2);

      const UV_SCALE = 1.0 / 0.60; // 600mm x 600mm (0.60m) norma física real
      for (let i = 0; i < posAttr.count; i += 3) {
        const pA = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        const pB = new THREE.Vector3(posAttr.getX(i + 1), posAttr.getY(i + 1), posAttr.getZ(i + 1));
        const pC = new THREE.Vector3(posAttr.getX(i + 2), posAttr.getY(i + 2), posAttr.getZ(i + 2));

        const cb = new THREE.Vector3().subVectors(pC, pB);
        const ab = new THREE.Vector3().subVectors(pA, pB);
        const normal = cb.cross(ab).normalize();

        const absX = Math.abs(normal.x);
        const absY = Math.abs(normal.y);
        const absZ = Math.abs(normal.z);

        for (let j = 0; j < 3; j++) {
          const idx = i + j;
          const x = posAttr.getX(idx);
          const y = posAttr.getY(idx);
          const z = posAttr.getZ(idx);

          if (absY >= absX && absY >= absZ) {
            // Cara horizontal (superior / inferior)
            if (tipoMapeado === "Cubierta Atravesada" || tipoMapeado === "Entrepaño Atravesado") {
              uvs[idx * 2] = z * UV_SCALE;
              uvs[idx * 2 + 1] = x * UV_SCALE;
            } else {
              uvs[idx * 2] = x * UV_SCALE;
              uvs[idx * 2 + 1] = z * UV_SCALE;
            }
          } else if (absX >= absY && absX >= absZ) {
            // Cara vertical lateral (normal X): laterales, parantes verticales (Peça 14), cantos laterales
            // 🛡️ REGLA DfMA: En un lateral o parante vertical, la altura Y es la dimensión dominante.
            // Para que la veta corra a lo largo de Y (vertical), como la textura tiene veta en U:
            if (size && size[1] >= size[2]) {
              uvs[idx * 2] = y * UV_SCALE;
              uvs[idx * 2 + 1] = z * UV_SCALE;
            } else {
              uvs[idx * 2] = z * UV_SCALE;
              uvs[idx * 2 + 1] = y * UV_SCALE;
            }
          } else {
            // Cara vertical frontal / trasera (normal Z): frentes, espaldares, cantos frontales
            // 🛡️ REGLA DfMA: En parantes o pilastras verticales (Peça 14) o cantos de piezas verticales,
            // la altura Y es mayor que el ancho X (size[1] > size[0]).
            // La veta y el canto SIEMPRE corren a lo largo de la altura Y (vertical):
            if (size && size[1] > size[0]) {
              uvs[idx * 2] = y * UV_SCALE;
              uvs[idx * 2 + 1] = x * UV_SCALE;
            } else {
              uvs[idx * 2] = x * UV_SCALE;
              uvs[idx * 2 + 1] = y * UV_SCALE;
            }
          }
        }
      }

      geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      return geo;
    }
    return null;
  }, [vertices, indices, grasshopperUvs, size?.[0], size?.[1], size?.[2], tipoMapeado]);

  // 🪵 Geometría de caja limpia para el trazado de aristas perimetrales CAD en tableros de madera
  const boxMeshGeometry = React.useMemo(() => {
    if (size && size.length === 3 && size[0] > 0 && size[1] > 0 && size[2] > 0) {
      try {
        return new THREE.BoxGeometry(size[0], size[1], size[2]);
      } catch {
        return null;
      }
    }
    return null;
  }, [size?.[0], size?.[1], size?.[2]]);

  React.useEffect(() => {
    return () => {
      boxMeshGeometry?.dispose();
    };
  }, [boxMeshGeometry]);

  const cleanName = name.replace(/^RH_OUT:/i, "").trim();
  const piezaMadre = instanciaKey || extraerPiezaMadre(cleanName || name);
  const estaSeleccionadaEnPicking = Boolean(
    modoPickingManual.activo && 
    piezaMadre && 
    modoPickingManual.piezasTemporalmenteSeleccionadas.includes(piezaMadre)
  );

  const normalizeKey = (k: string) => k.replace(/^RH_OUT:/i, "").replace(/[_\s]+/g, " ").trim().toLowerCase();
  const normName = normalizeKey(name);

  // 💡 1. Resolver Asignación de Parte: Búsqueda EXACTA y estricta (distingue longitud de caracteres y sufijos como PK7 vs PK7B)
  let asignacion = asignacionesPartes[name] || 
                   asignacionesPartes[cleanName] || 
                   asignacionesPartes[`RH_OUT:${cleanName}`];

  if (!asignacion) {
    // 1.1 Match exacto normalizado (mismo texto exacto, insensible a mayúsculas/espacios/guiones)
    const exactMatchedKey = Object.keys(asignacionesPartes).find((k) => normalizeKey(k) === normName);
    if (exactMatchedKey) {
      asignacion = asignacionesPartes[exactMatchedKey];
    } else {
      // 1.2 Fallback seguro solo para sufijos técnicos explícitos (_Color, _MDP, _Balance) si y solo si existe la base exacta
      const baseCleanName = cleanName.replace(/2$/, "").replace(/_Color$|_MDP$|_Balance$/i, "").trim();
      const normBase = baseCleanName ? normalizeKey(baseCleanName) : "";
      if (normBase && normBase !== normName) {
        const baseMatchedKey = Object.keys(asignacionesPartes).find((k) => normalizeKey(k) === normBase);
        if (baseMatchedKey) asignacion = asignacionesPartes[baseMatchedKey];
      }
    }
  }

  const isWireframe = false;
  const isTransparent = modoVisual === "semitransparente" || modoVisual === "lineas";
  const isHardwarePerno = normName.includes("perno") || normName.includes("tornillo") || normName.includes("parafuso");
  const isHardwarePrego = normName.includes("prego") || normName.includes("puntilla") || normName.includes("clavo") || normName.includes("tachuela");
  const isHardwareCaja = (normName.includes("caja") && !normName.includes("cajon") && !normName.includes("cajón")) || normName === "caja" || normName.includes("minifix") || normName.includes("girofix") || normName.includes("tambor");
  const isHardwareTarugo = normName.includes("tarugo") || normName.includes("cavilha") || normName.includes("clavilha") || normName.includes("espiga");
  const isHardwareSuporte = normName.includes("suporte") || normName.includes("soporte") || normName.includes("esquadro") || normName.includes("mao francesa") || normName.includes("mão francesa");
  const isHardwarePata = normName.includes("pes") || normName.includes("pés") || normName.includes("pata") || normName.includes("pie") || normName.includes("sapata") || normName.includes("deslizador") || normName.includes("nivelador");
  const isHardwareCorredera = normName.includes("corredera") || normName.includes("corredi") || normName.includes("trilho");
  const isHardwareCorrederaSeguro =
    (instanciaKey && (instanciaKey.toLowerCase().includes("segur") || instanciaKey.toLowerCase().includes("gatill"))) ||
    normName.includes("segur") ||
    normName.includes("gatill") ||
    (isHardwareCorredera && (size && size.length === 3 && Math.min(size[0], size[1], size[2]) < 0.005 && size[1] < 0.015));
  const isHardwareCantoneira = normName.includes("cantoneira") || normName.includes("cantonera") || normName.includes("angulo") || normName.includes("ángulo") || normName.includes("esquinero");
  const isHardwarePorca = normName.includes("porca") || normName.includes("tuerca") || normName.includes("bucha");
  const isHardwareTampa = normName.includes("tampa") || normName.includes("tapa") || normName.includes("adesivo") || normName.includes("tapon") || normName.includes("tapón");
  const isHardware = isHardwarePerno || isHardwarePrego || isHardwareCaja || isHardwareTarugo || isHardwareSuporte || isHardwarePata || isHardwareCorredera || isHardwareCantoneira || isHardwarePorca || isHardwareTampa || normName.includes("bisagra") || normName.includes("dobradiça") || normName.includes("dobradi") || normName.includes("puxador") || normName.includes("manija") || normName.includes("tirador") || normName.includes("jaladera");
  const isMachining = normName.includes("maquinado") || normName.includes("perforado");
  const isWoodBoardPiece = !isHardware && !isMachining;

  // 🪵 Detector Universal de Cara de Balance / Reverso (ej. Peça 6 B, Peça 7 B, Peça 10 B, PK6B, Balance, Equilibrio)
  const isBalance = (
    normName.includes("balance") ||
    normName.includes("equilibrio") ||
    normName.includes("reverso") ||
    normName.endsWith(" b") ||
    normName.endsWith("_b") ||
    normName.endsWith("-b") ||
    /pe[cç]a\s*\d+\s*b$/i.test(normName) ||
    /pk\s*\d+\s*b$/i.test(normName)
  );

  // 🪵 Detector Universal de Fondos y Piezas de 3 mm (Fondos Traseros, Fondos de Cajón, Costas, Espaldares, Peça 15, Peça 18)
  const isFondoBoard = (
    normName.includes("fondo") ||
    normName.includes("fundo") ||
    normName.includes("tono fondo") ||
    normName.includes("costa") ||
    normName.includes("costas") ||
    normName.includes("espaldar") ||
    normName.includes("trasera") ||
    normName.includes("back") ||
    normName.includes("peça 15") ||
    normName.includes("peca 15") ||
    normName.includes("pk15") ||
    normName.includes("peça 18") ||
    normName.includes("peca 18") ||
    normName.includes("pk18") ||
    (isWoodBoardPiece && size && size.length === 3 && Math.min(size[0], size[1], size[2]) <= 0.005 && Math.min(size[0], size[1], size[2]) >= 0.001)
  ) && !normName.includes("mdf") && !normName.includes("mdp");

  // 💡 2. Resolver Capa Asignada
  let capaAsignada: any = null;
  if (asignacion && asignacion.capaId && asignacion.capaId !== "por_defecto") {
    capaAsignada = capas.find((c) => c.id === asignacion.capaId) || null;
  }
  
  // 🛡️ REGLA ORO B2B: Alineación obligatoria de piezas de 3 mm y Fondos
  if (normName.includes("mdf")) {
    // La cara MDF siempre pertenece a la capa MDF (mat_mdf)
    capaAsignada = capas.find((c) => c.id === "capa_mdf" || c.nombre.toLowerCase() === "mdf") || capas[0];
  } else if (isFondoBoard) {
    // La cara con color de todas las piezas de 3 mm / fondos siempre se vincula a la capa Tono Fondo
    const capaInvalidaFondo = !capaAsignada || 
                              capaAsignada.id === "capa_tono" || 
                              capaAsignada.id === "capa_espaldar" || 
                              capaAsignada.id === "capa_back" ||
                              capaAsignada.id === "capa_acero" ||
                              capaAsignada.id === "capa_aluminio";
    if (capaInvalidaFondo) {
      capaAsignada = capas.find((c) => c.id === "capa_tono_fondo" || c.nombre.toLowerCase() === "tono fondo" || (c.nombre.toLowerCase().includes("fondo") && !c.nombre.toLowerCase().includes("mdf"))) || capas.find((c) => c.id === "capa_tono") || capas[0];
    }
  } else if (!capaAsignada) {
    if (isHardwareCorrederaSeguro) {
      // 🖤 Gatillo / seguro plástico de desacople -> Capa Plastico Negro
      capaAsignada = capas.find((c) => c.id === "capa_plastico_1" || c.id === "capa_plastico" || c.nombre.toLowerCase().includes("negro") || c.nombre.toLowerCase().includes("plastico")) || capas.find((c) => c.id === "capa_herrajes") || capas[0];
    } else if (isHardwareCorredera || isHardwareCantoneira || isHardwarePrego) {
      // 🔩 Correderas telescópicas, cantoneras y puntillas/pregos -> Capa Zincado / Acero
      capaAsignada = capas.find((c) => c.id === "capa_zincado" || c.id === "capa_zinc" || c.id === "capa_acero" || c.nombre.toLowerCase().includes("zinc") || c.nombre.toLowerCase().includes("acero")) || capas.find((c) => c.id === "capa_herrajes") || capas[0];
    } else if (isHardwarePata) {
      // 🦶 Patas / Pies (Pes) -> Capa Plastico_1 (mat_pnegro, Plástico inyectado negro)
      capaAsignada = capas.find((c) => c.id === "capa_plastico_1" || c.id === "capa_plastico_2" || c.nombre.toLowerCase().includes("plastico")) || capas.find((c) => c.id === "capa_herrajes") || capas[0];
    } else if (isHardwarePorca || isHardwareTampa || isHardwareSuporte) {
      // 🔩 Tuerca / Porca, Tapa adhesiva o Soporte de repisa -> Capa Plastico_2 (mat_pblanco) o Herrajes
      capaAsignada = capas.find((c) => c.id === "capa_plastico_2" || c.id === "capa_plastico_1" || c.nombre.toLowerCase().includes("plastico")) || capas.find((c) => c.id === "capa_herrajes") || capas[0];
    } else if (isHardwarePerno) {
      capaAsignada = capas.find((c) => c.id === "capa_herrajes" || c.id === "capa_acero" || c.nombre.toLowerCase().includes("acero") || c.nombre.toLowerCase().includes("herraje"));
    } else if (isHardwareCaja) {
      capaAsignada = capas.find((c) => c.id === "capa_zincado" || c.id === "capa_zinc" || c.nombre.toLowerCase().includes("zinc"));
    } else if (isHardwareTarugo) {
      capaAsignada = capas.find((c) => c.id === "capa_madera" || c.nombre.toLowerCase().includes("madera"));
    } else if (isMachining) {
      capaAsignada = capas.find((c) => c.id === "capa_perforados" || c.nombre.toLowerCase().includes("perforad"));
    } else if (isBalance) {
      capaAsignada = capas.find((c) => c.id === "capa_back" || c.id === "capa_espaldar" || c.nombre.toLowerCase().includes("back") || c.nombre.toLowerCase().includes("balance"));
    } else if (normName.includes("mdp")) {
      capaAsignada = capas.find((c) => c.id === "capa_mdp" || c.nombre.toLowerCase() === "mdp");
    } else {
      // Pieza principal de madera/tablero (Cubierta, Lateral, Frente, Tapa, Peça 6, Peça 7, Peça 10, etc.) -> Capa Tono
      capaAsignada = capas.find((c) => c.id === "capa_tono" || (c.nombre.toLowerCase().includes("tono") && !c.nombre.toLowerCase().includes("fondo"))) || capas.find(c => c.id !== "capa_acero") || capas[0];
    }
  }
  if (!capaAsignada && capas.length > 0) {
    capaAsignada = capas[0];
  }

  // 💡 3. Resolver Material PBR Asignado
  let materialPBR: MaterialPBRDef | null = null;
  if (asignacion && asignacion.materialId && asignacion.materialId !== "por_capa") {
    materialPBR = materialesPBR.find((m) => m.id === asignacion.materialId) || null;
  } else if (capaAsignada) {
    materialPBR = materialesPBR.find((m) => m.id === capaAsignada.materialId) || null;
  }

  const isSolidOrRendered = modoVisual === "solido" || modoVisual === "renderizado";
  const isRenderedMode = modoVisual === "renderizado";
  const isWoodBoard = !isHardware && !isMachining;

  const isMdpExpuesto = normName.includes("mdp");
  const isMelaminaCara = (normName.includes("color") || !isBalance) && !isMdpExpuesto;

  // 💡 4. Determinar Textura Objetivo (targetTextureUrl)
  let targetTextureUrl: string | null = null;
  if (modoVisual === "renderizado") {
    if (materialPBR && materialPBR.texturaUrl) {
      targetTextureUrl = materialPBR.texturaUrl;
    } else if (materialPBR && !materialPBR.texturaUrl) {
      targetTextureUrl = null;
    } else if (calibracion.customTextureUrl) {
      targetTextureUrl = calibracion.customTextureUrl;
    } else if (isWoodBoard && isMelaminaCara) {
      targetTextureUrl = "/textures/Marfil_diffuse.jpg";
    }
  }

  // ⚠️ LLAMADO INCONDICIONAL DE HOOK: antes de cualquier return temprano (Reglas de React Hooks)
  const pbrMaps = useMaterialPBRMaps(materialPBR, targetTextureUrl, tipoMapeado, Boolean(grasshopperUvs && grasshopperUvs.length > 0));

  // 💡 Verificar si el cajón/grupo cinemático al que pertenece esta pieza está apagado (Bombillito / Ojito)
  const pasoActivoManual = React.useMemo(() => {
    return pasosManual.find((p) => p.id === pasoActivoManualId);
  }, [pasosManual, pasoActivoManualId]);

  const estaOcultaPorGrupoCinematico = React.useMemo(() => {
    // 🛡️ REGLA SUPREMA: En el Visor 3D ("visor") NUNCA se ocultan piezas por cinemáticas del Manual 3D.
    // Las reglas de visibilidad del Manual 3D SOLO aplican si pestanaActiva === "manual".
    if (pestanaActiva !== "manual") return false;

    const pasoConGrupos = (pasoActivoManual?.showcase?.gruposCinematicos && pasoActivoManual.showcase.gruposCinematicos.length > 0)
      ? pasoActivoManual
      : pasosManual.find((p) => p.id === "P00" || p.tipo === "showcase");

    if (!pasoConGrupos?.showcase?.gruposCinematicos) return false;

    return pasoConGrupos.showcase.gruposCinematicos.some(
      (g) =>
        g.oculto &&
        g.piezas.some(
          (pz) =>
            pz === piezaMadre ||
            pz === cleanName ||
            (instanciaKey && pz === instanciaKey) ||
            extraerPiezaMadre(pz) === piezaMadre ||
            (instanciaKey && extraerPiezaMadre(pz) === instanciaKey)
        )
    );
  }, [pestanaActiva, pasoActivoManual, pasosManual, piezaMadre, cleanName, instanciaKey]);

  // 💡 4.1 Verificar si esta pieza pertenece a las piezas o herrajes asignados del paso activo (o al picking temporal)
  const perteneceAlPasoActivo = React.useMemo(() => {
    if (pestanaActiva !== "manual" || !pasoActivoManual || pasoActivoManual.tipo === "showcase") {
      return false;
    }
    const asignadas = [
      ...(pasoActivoManual.piezasAsignadas || []),
      ...(pasoActivoManual.herrajesAsignados || []),
      ...(modoPickingManual.activo && modoPickingManual.pasoId === pasoActivoManual.id ? modoPickingManual.piezasTemporalmenteSeleccionadas : []),
    ];
    if (asignadas.length === 0) return false;

    const rawClean = name ? name.replace(/^RH_(?:OUT|IN):\s*/i, "").trim() : "";

    return asignadas.some((pz) => {
      if (!pz) return false;

      // 1. Coincidencia directa con instanciaKey o piezaMadre (ej. "Peça 8 (1)" === "Peça 8 (1)")
      if (instanciaKey && (pz === instanciaKey || pz.toLowerCase() === instanciaKey.toLowerCase())) {
        return true;
      }
      if (piezaMadre && (pz === piezaMadre || pz.toLowerCase() === piezaMadre.toLowerCase())) {
        return true;
      }

      // 2. Discriminación estricta de instancias numeradas:
      // Si pz tiene "(N)" y el mesh también tiene "(M)", y no fueron iguales arriba, NO coinciden.
      const tieneInstanciaPz = Boolean(pz.match(/\s*\(\d+\)$/));
      const tieneInstanciaMesh = Boolean((instanciaKey || piezaMadre || "").match(/\s*\(\d+\)$/));

      if (tieneInstanciaPz && tieneInstanciaMesh) {
        return false;
      }

      // 3. Coincidencia por nombre limpio (para piezas no numeradas como "Peça 7" o "Cubierta")
      if (cleanName && (pz === cleanName || pz.toLowerCase() === cleanName.toLowerCase())) {
        return true;
      }
      if (rawClean && (pz === rawClean || pz.toLowerCase() === rawClean.toLowerCase())) {
        return true;
      }

      // 4. Coincidencia canónica de Pieza Madre
      const pmPz = extraerPiezaMadre(pz);
      const pmMesh = piezaMadre || (instanciaKey ? extraerPiezaMadre(instanciaKey) : extraerPiezaMadre(cleanName || rawClean));
      if (pmPz && pmMesh && pmPz.toLowerCase() === pmMesh.toLowerCase()) {
        if (!tieneInstanciaPz && !tieneInstanciaMesh) return true;
      }

      return false;
    });
  }, [
    pestanaActiva,
    pasoActivoManual,
    modoPickingManual.activo,
    modoPickingManual.pasoId,
    modoPickingManual.piezasTemporalmenteSeleccionadas,
    instanciaKey,
    piezaMadre,
    cleanName,
    name,
  ]);

  // 💡 4.2 Reglas de Aislamiento y Visibilidad del Paso (Invert Hide & Piezas Ocultas)
  const estaOcultaPorReglasPaso = React.useMemo(() => {
    if (pestanaActiva !== "manual" || !pasoActivoManual || pasoActivoManual.tipo === "showcase") {
      return false;
    }

    // 0. 🔍 Aislamiento Macro de Bloque Estándar: Ocultar todo el mueble principal para foco macro en el bloque
    if (pasoActivoManual.tipo === "bloque_estandar") {
      return true;
    }

    // 0.1 🔍 Picking exclusivo de Subbloque:
    // Si estamos en modo picking para un subbloque (grupoId activo en paso de armado),
    // SOLO deben verse las piezas y herrajes asignados a este paso (ej. P02).
    // Todo lo que NO pertenezca a este paso permanece estrictamente OCULTO.
    const esPickingSubbloque = modoPickingManual.activo && Boolean(modoPickingManual.grupoId);
    if (esPickingSubbloque) {
      if (!perteneceAlPasoActivo) {
        return true;
      }
    }

    // 0.2 🧩 Aislamiento Estricto de Pasos con Subbloques:
    // Si el paso contiene subbloques (ej. P02A, P02B, P02C), NINGUNA pieza o herraje ajeno del mueble
    // puede flotar en el aire. Solo se muestran las mallas que pertenezcan a alguno de los subbloques.
    const subbloquesPaso = pasoActivoManual.subbloques || [];
    const rawClean = name ? name.replace(/^RH_(?:OUT|IN):\s*/i, "").trim() : "";
    if (subbloquesPaso.length > 0) {
      const perteneceAAlgunSubbloque = subbloquesPaso.some((sub) => {
        const elementos = [
          sub.piezaMaster,
          ...(sub.piezas || []),
          ...(sub.herrajes || [])
        ].filter(Boolean) as string[];

        return elementos.some((elem) => {
          if (!elem) return false;
          const eLow = elem.toLowerCase().trim();
          if (instanciaKey && instanciaKey.toLowerCase().trim() === eLow) return true;
          if (piezaMadre && piezaMadre.toLowerCase().trim() === eLow) return true;
          if (cleanName && cleanName.toLowerCase().trim() === eLow) return true;
          if (rawClean && rawClean.toLowerCase().trim() === eLow) return true;
          const pmElem = extraerPiezaMadre(elem).toLowerCase().trim();
          const pmThis = (piezaMadre || (instanciaKey ? extraerPiezaMadre(instanciaKey) : extraerPiezaMadre(cleanName || rawClean))).toLowerCase().trim();
          return pmElem && pmThis && pmElem === pmThis;
        });
      });

      if (!perteneceAAlgunSubbloque) {
        return true; // 🛡️ Ocultar totalmente para erradicar piezas y tornillos huérfanos flotando en el aire
      }
    }

    const totalAsignadas = (pasoActivoManual.piezasAsignadas?.length || 0) + 
      (pasoActivoManual.herrajesAsignados?.length || 0) + 
      (modoPickingManual.activo && modoPickingManual.pasoId === pasoActivoManual.id ? modoPickingManual.piezasTemporalmenteSeleccionadas.length : 0);

    // 1. Invert Hide (Aislar Paso): Ocultar cualquier pieza que NO esté seleccionada para este paso
    // Se ejecuta fielmente al presionar Invert Hide, ocultando todo lo que no ha sido seleccionado con el cuentagotas.
    if (pasoActivoManual.ocultarNoAsignadas && totalAsignadas > 0) {
      if (!perteneceAlPasoActivo) {
        return true;
      }
    }

    // 2. Piezas Ocultas (Ojito del paso): Apagar las piezas asignadas a este paso
    if (pasoActivoManual.piezasOcultas && !esPickingSubbloque) {
      if (perteneceAlPasoActivo) {
        return true;
      }
    }

    // 2.1 Subbloque Oculto (Ojito del subbloque): Apagar las piezas asignadas a un subbloque oculto
    const estaEnSubbloqueOculto = subbloquesPaso.some((sub) => {
      if (!sub.oculto) return false;
      const elementosSub = [...(sub.piezas || []), ...(sub.herrajes || [])];
      return elementosSub.some((pz) => {
        if (!pz) return false;
        if (instanciaKey && (pz === instanciaKey || pz.toLowerCase() === instanciaKey.toLowerCase())) return true;
        if (piezaMadre && (pz === piezaMadre || pz.toLowerCase() === piezaMadre.toLowerCase())) return true;
        if (cleanName && (pz === cleanName || pz.toLowerCase() === cleanName.toLowerCase())) return true;
        if (rawClean && (pz === rawClean || pz.toLowerCase() === rawClean.toLowerCase())) return true;
        const pmPz = extraerPiezaMadre(pz);
        const pmMesh = piezaMadre || (instanciaKey ? extraerPiezaMadre(instanciaKey) : extraerPiezaMadre(cleanName || rawClean));
        return pmPz && pmMesh && pmPz.toLowerCase() === pmMesh.toLowerCase();
      });
    });

    if (estaEnSubbloqueOculto) {
      return true;
    }

    return false;
  }, [pestanaActiva, pasoActivoManual, modoPickingManual.activo, modoPickingManual.modo, modoPickingManual.grupoId, modoPickingManual.pasoId, modoPickingManual.piezasTemporalmenteSeleccionadas, perteneceAlPasoActivo, instanciaKey, piezaMadre, cleanName, name]);

  // 💡 5. Verificar Visibilidad (Capa, Parte, Grupo Cinemático o Reglas de Paso) - DESPUÉS DE TODOS LOS HOOKS
  const esParteOculta = asignacion && asignacion.visible === false;
  const esCapaOculta = capaAsignada && capaAsignada.visible === false;
  if (esParteOculta || esCapaOculta || estaOcultaPorGrupoCinematico || estaOcultaPorReglasPaso) {
    return null;
  }

  const activeMap = modoVisual === "renderizado" ? pbrMaps.diffuse : null;
  const activeNormal = modoVisual === "renderizado" ? pbrMaps.normal : null;
  const activeRoughness = modoVisual === "renderizado" ? pbrMaps.roughness : null;
  const activeAO = modoVisual === "renderizado" ? pbrMaps.ao : null;
  const hasMap = activeMap !== null;

  // 💡 6. Propiedades Físicas y Color
  let meshColor = mainColor;
  let metalness = calibracion.metalicidadMadera ?? 0.1;
  let roughness = calibracion.rugosidadMadera ?? 0.4;
  let opacity = isTransparent ? 0.52 : (calibracion.opacidadMadera ?? 1.0);
  let transparent = isTransparent || opacity < 0.99;
  let depthWrite = !transparent || opacity >= 0.95;

  if (esDuplicado) {
    // 🔴 Malla duplicada detectada: resplandor rojo intenso para diagnóstico visual
    meshColor = "#EF4444";
    metalness = 0.3;
    roughness = 0.25;
    opacity = 0.95;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareCorrederaSeguro) {
    // 🖤 Gatillo / seguro plástico de desacople de corredera (negro carbón mate DTC)
    meshColor = "#1E293B";
    metalness = 0.05;
    roughness = 0.65;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareCorredera || isHardwarePrego) {
    // 🔩 Correderas y Puntillas/Pregos (Acero brillante)
    meshColor = coloresApariencia.colorHerrajes || "#E2E8F0";
    metalness = 0.92;
    roughness = 0.18;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareCantoneira) {
    meshColor = coloresApariencia.colorHerrajes || "#94A3B8";
    metalness = 0.88;
    roughness = 0.22;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwarePerno) {
    meshColor = coloresApariencia.colorHerrajes || "#9CA3AF";
    metalness = 0.85;
    roughness = 0.25;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareCaja) {
    meshColor = coloresApariencia.colorHerrajes || "#D97706";
    metalness = 0.75;
    roughness = 0.3;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareTarugo) {
    meshColor = coloresApariencia.colorHerrajes || "#B45309";
    metalness = 0.0;
    roughness = 0.8;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwarePata) {
    meshColor = "#1E293B";
    metalness = 0.1;
    roughness = 0.6;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwarePorca || isHardwareTampa || isHardwareSuporte) {
    // ⚪ Plástico blanco / marfil técnico (Porcas, Tapas, Soportes de repisa)
    meshColor = "#F4F4F5";
    metalness = 0.05;
    roughness = 0.35;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isMachining) {
    meshColor = "#EF4444";
    metalness = 0.2;
    roughness = 0.5;
    opacity = 0.6;
    transparent = true;
  } else if (isWoodBoard) {
    roughness = isTransparent ? 0.75 : (isMdpExpuesto ? 0.85 : (isBalance ? 0.5 : (calibracion.rugosidadMadera ?? 0.58)));
    metalness = isTransparent ? 0.0 : (isMdpExpuesto ? 0.0 : (isBalance ? 0.0 : (calibracion.metalicidadMadera ?? 0.20)));
    opacity = isTransparent ? 0.52 : (calibracion.opacidadMadera ?? 1.0);
    transparent = isTransparent || opacity < 0.99;
    depthWrite = !isTransparent && opacity >= 0.95;
  }

  // Aplicar propiedades físicas del material PBR
  if (materialPBR && modoVisual !== "semitransparente") {
    meshColor = materialPBR.colorBase;
    const esMetalico = materialPBR.tipo === "Metal" || (materialPBR.metalico ?? 0) >= 0.5;
    metalness = esMetalico ? materialPBR.metalico : (calibracion.metalicidadMadera ?? materialPBR.metalico);
    roughness = esMetalico ? materialPBR.rugosidad : (calibracion.rugosidadMadera ?? materialPBR.rugosidad);
    if (materialPBR.opacidad < 1.0 || (calibracion.opacidadMadera ?? 1.0) < 0.99) {
      opacity = Math.min(materialPBR.opacidad, calibracion.opacidadMadera ?? 1.0);
      transparent = true;
      depthWrite = opacity >= 0.95;
    }
  }

  let finalMeshColor = meshColor;
  if (modoVisual === "semitransparente") {
    if (isHardware) {
      // 🔩 HERRAJES EN MODO CRISTAL (GHOSTED):
      // Deben permanecer SÓLIDOS, METÁLICOS Y TOTALMENTE VISIBLES (exactamente como en Rhino Ghosted),
      // contrastando nítidamente contra el cuerpo azul translúcido del mueble.
      finalMeshColor = (isHardwareCorredera || isHardwarePrego)
        ? "#F8FAFC" 
        : (isHardwareCantoneira ? "#E2E8F0" : (isHardwarePata ? "#1E293B" : (isHardwarePorca || isHardwareTampa || isHardwareSuporte ? "#F4F4F5" : (coloresApariencia.colorHerrajes || "#CBD5E1"))));
      opacity = 1.0;
      roughness = (isHardwarePata || isHardwarePorca || isHardwareSuporte) ? 0.4 : 0.18;
      metalness = (isHardwarePata || isHardwarePorca || isHardwareSuporte) ? 0.05 : 0.92;
      transparent = false;
      depthWrite = true;
    } else {
      // 🪵 TABLEROS DE MADERA EN MODO CRISTAL:
      // Translúcidos para permitir ver las correderas y herrajes interiores
      finalMeshColor = coloresApariencia.mallasCristal || "#0284C7";
      opacity = 0.52;
      roughness = 0.75;
      metalness = 0.0;
      transparent = true;
      depthWrite = false;
    }
  } else if (modoVisual === "lineas") {
    // 📐 Transparencia de las piezas del modo sólido sobre la malla pura (Tableros y Herrajes)
    if (isHardware) {
      finalMeshColor = isHardwareCorredera 
        ? "#334155" 
        : (isHardwarePata 
            ? "#334155" 
            : (isHardwareCantoneira 
                ? "#64748B" 
                : (isHardwarePorca || isHardwareTampa ? "#E2E8F0" : (coloresApariencia.colorHerrajes || "#64748B"))));
      opacity = 0.35;
      roughness = 0.5;
      metalness = 0.2;
      transparent = true;
      depthWrite = false;
    } else {
      finalMeshColor = capaAsignada?.color || (materialPBR ? materialPBR.colorBase : (coloresApariencia.materialPorDefecto || calibracion.colorSolido || "#CBD5E1"));
      opacity = 0.35;
      roughness = 0.75;
      metalness = 0.0;
      transparent = true;
      depthWrite = false;
    }
  } else if (modoVisual === "solido") {
    // 🎨 MODO SÓLIDO (Solid Mode): El color de la pieza coincide EXACTAMENTE con el color de su capa asignada
    finalMeshColor = capaAsignada?.color || (materialPBR ? materialPBR.colorBase : (coloresApariencia.materialPorDefecto || calibracion.colorSolido || "#CBD5E1"));
    if (isWoodBoard) {
      roughness = calibracion.rugosidadMadera ?? 0.58;
      metalness = calibracion.metalicidadMadera ?? 0.20;
      opacity = calibracion.opacidadMadera ?? 1.0;
      transparent = opacity < 0.99;
      depthWrite = opacity >= 0.95;
    }
  } else if (modoVisual === "renderizado") {
    if (hasMap) {
      finalMeshColor = "#ffffff";
    } else if (materialPBR) {
      finalMeshColor = materialPBR.colorBase;
    } else if (isMdpExpuesto) {
      finalMeshColor = "#D5B88A";
    } else if (isBalance) {
      finalMeshColor = "#F9FAFB";
    } else {
      finalMeshColor = calibracion.colorSolido || "#CBD5E1";
    }
    if (isWoodBoard) {
      const esMetalico = materialPBR?.tipo === "Metal" || (materialPBR?.metalico ?? 0) >= 0.5;
      roughness = esMetalico ? materialPBR!.rugosidad : (materialPBR ? materialPBR.rugosidad : (calibracion.rugosidadMadera ?? 0.58));
      metalness = esMetalico ? materialPBR!.metalico : (materialPBR ? materialPBR.metalico : (calibracion.metalicidadMadera ?? 0.20));
      opacity = calibracion.opacidadMadera ?? 1.0;
      transparent = opacity < 0.99;
      depthWrite = opacity >= 0.95;
    }
  }

  const nombreMaterialEfectivo = materialPBR ? materialPBR.nombre : (isWoodBoard ? "M_Marfil" : (isHardwarePata || isHardwarePorca || isHardwareTampa || isHardwareSuporte ? "P_Blanco" : (isHardwarePerno || isHardwarePrego ? "Acero" : (isHardwareCaja ? "Zinc" : "PBR_Default"))));
  const normalScaleVal = materialPBR?.normalScale ?? 1.0;

  const debeMostrarAristas = calibracion.mostrarAristas !== false && (isWoodBoard || isHardware);

  // 🪵 Detector de piezas paralelepípedo (caja rectangular pura de madera):
  // Se excluyen explícitamente TODOS los herrajes, accesorios, tapas, puntillas, soportes, tarugos, piezas curvas o mecanizadas.
  const noEsParalelepipedo = isHardware || isMachining || isHardwareTampa || isHardwareSuporte || isHardwarePrego ||
    normName.includes("tampa") || 
    normName.includes("suporte") || 
    normName.includes("soporte") || 
    normName.includes("prego") || 
    normName.includes("puntilla") || 
    normName.includes("clavo") || 
    normName.includes("tarugo") || 
    normName.includes("cavilha") || 
    normName.includes("curv") || 
    normName.includes("arco") || 
    normName.includes("cilindr") || 
    normName.includes("redond") || 
    normName.includes("chaflan") || 
    normName.includes("angulo");

  const esParalelepipedo = !isHardware && isWoodBoard && !noEsParalelepipedo;

  // 🪵 Opción 2: Para tableros de madera que son paralelepípedos puros, utilizamos la geometría de caja perimetral (boxMeshGeometry)
  // para trazar exclusivamente las 12 aristas exteriores limpias, suprimiendo costuras de corte, empalmes y diagonales de triangulación.
  // Para piezas como Tampa, herrajes, mecanizados o piezas no prismáticas,
  // se preserva customGeometry para dibujar fielmente sus contornos y curvaturas originales.
  // ⚠️ NOTA: Asignación directa sin hook para cumplir con las reglas de React Hooks ante retornos tempranos.
  const edgeGeometryToUse = (esParalelepipedo && boxMeshGeometry) ? boxMeshGeometry : (customGeometry || undefined);

  // Suprimir aristas duplicadas en capas superpuestas (Balance / MDP). Solo la cara principal del tablero traza las aristas.
  const debeOmitirAristasPorDuplicidadCapa = isWoodBoard && (isBalance || isMdpExpuesto);
  const mostrarAristasEnEsteMesh = (debeMostrarAristas && !debeOmitirAristasPorDuplicidadCapa) || estaSeleccionadaEnPicking;

  // 💡 Intensidad dinámica de luz de entorno (IBL)
  const luzEntornoConfig = calibracion.lucesEstudio?.["env_hdri"];
  const baseEnvIntensity = (modoVisual === "renderizado" && (luzEntornoConfig ? luzEntornoConfig.activa : true))
    ? (luzEntornoConfig?.intensidad ?? calibracion.intensidadLuzEntorno ?? 0.55)
    : 0.0;
  // 🔩 Para herrajes y piezas metálicas, aumentamos el IBL para reflejos definidos de estudio
  const esPiezaMetalica = isHardware || metalness >= 0.5 || materialPBR?.tipo === "Metal";
  const envMapIntensityEfectivo = esPiezaMetalica
    ? Math.max(baseEnvIntensity * 1.5, 1.15)
    : baseEnvIntensity;

  // 🛡️ Blindaje físico contra colapso al centro (0, 0, 0):
  // Si meshRef ya tiene una posición asignada por la cinemática o subbloque, se preserva;
  // de lo contrario, se inicializa SIEMPRE en su posición CAD original para que nunca colapse a [0, 0, 0].
  const safePosition = meshRef.current
    ? meshRef.current.position
    : (position || [0, 0, 0]);

  if (customGeometry) {
    return (
      <mesh 
        ref={meshRef}
        position={position}
        scale={esDuplicado ? [1.06, 1.06, 1.06] : (estaSeleccionadaEnPicking ? [1.015, 1.015, 1.015] : undefined)}
        renderOrder={esDuplicado ? 20 : (estaSeleccionadaEnPicking ? 22 : undefined)}
        name={instanciaKey ? `${instanciaKey}::${cleanName}` : cleanName}
        geometry={customGeometry}
        onClick={(e) => {
          if (modoPickingManual.activo) {
            e.stopPropagation();
            togglePiezaEnPickingManual(piezaMadre);
          }
        }}
        onPointerOver={(e) => {
          if (modoPickingManual.activo) {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          if (modoPickingManual.activo) {
            document.body.style.cursor = "auto";
          }
        }}
        userData={{ 
          ...(meshRef.current?.userData || {}),
          initialPosition: meshRef.current?.userData?.initialPosition || new THREE.Vector3(position[0], position[1], position[2]),
          __cadOrigPosition: meshRef.current?.userData?.__cadOrigPosition || new THREE.Vector3(position[0], position[1], position[2]),
          __cadOrigQuaternion: meshRef.current?.userData?.__cadOrigQuaternion || new THREE.Quaternion(0, 0, 0, 1),
          __cadOrigScale: meshRef.current?.userData?.__cadOrigScale || new THREE.Vector3(1, 1, 1),
          __cadOrigMatrix: meshRef.current?.userData?.__cadOrigMatrix || new THREE.Matrix4().compose(
            new THREE.Vector3(position[0], position[1], position[2]),
            new THREE.Quaternion(0, 0, 0, 1),
            new THREE.Vector3(1, 1, 1)
          ),
          instanciaId,
          instanciaKey: piezaMadre,
          pbrDiffuse: pbrMaps.diffuse,
          materialPBR,
          nombreMaterialEfectivo,
          isWoodBoard,
          isHardware,
          isHardwareCorredera,
          isHardwareCantoneira,
          isHardwarePata,
          isHardwarePorca,
          isHardwareTampa,
          isHardwarePerno,
          isHardwarePrego,
          isHardwareSuporte,
          isHardwareTarugo,
          isHardwareCaja,
          isBalance,
          isMdpExpuesto,
          esDuplicado,
          cleanName,
          rawName: name,
          piezaMadre
        }}
      >
        <meshStandardMaterial
          key={`${activeMap ? (activeMap as any).uuid : "no-map"}-${modoVisual}-${nombreMaterialEfectivo}-${finalMeshColor}-${opacity}-${roughness}-${metalness}-${esDuplicado}-${estaSeleccionadaEnPicking}`}
          name={esDuplicado ? "Material_Duplicado_Alerta" : nombreMaterialEfectivo}
          color={esDuplicado ? "#EF4444" : (estaSeleccionadaEnPicking ? "#FBBF24" : finalMeshColor)}
          emissive={estaSeleccionadaEnPicking ? new THREE.Color("#F59E0B") : (esDuplicado ? new THREE.Color("#DC2626") : undefined)}
          emissiveIntensity={estaSeleccionadaEnPicking ? 0.70 : (esDuplicado ? 0.45 : 0)}
          map={activeMap}
          normalMap={activeNormal}
          normalScale={activeNormal ? new THREE.Vector2(normalScaleVal, normalScaleVal) : undefined}
          roughnessMap={activeRoughness}
          aoMap={activeAO}
          aoMapIntensity={materialPBR?.aoIntensity ?? 1.0}
          envMapIntensity={envMapIntensityEfectivo}
          transparent={estaSeleccionadaEnPicking ? false : transparent}
          opacity={estaSeleccionadaEnPicking ? 1.0 : opacity}
          roughness={roughness}
          metalness={metalness}
          wireframe={isWireframe}
          depthWrite={estaSeleccionadaEnPicking ? true : depthWrite}
          side={THREE.DoubleSide}
        />
        {/* 📐 Malla pura (wireframe de la geometría real) sobre la superficie sólida translúcida */}
        {modoVisual === "lineas" && (
          <mesh geometry={customGeometry || undefined}>
            <meshBasicMaterial
              wireframe={true}
              color={calibracion.colorAristas || "#1E293B"}
              transparent={true}
              opacity={0.45}
              depthWrite={false}
            />
          </mesh>
        )}
        {mostrarAristasEnEsteMesh && !isHardware && (
          <Edges
            geometry={edgeGeometryToUse}
            threshold={calibracion.thresholdAristas || 25}
            color={estaSeleccionadaEnPicking ? "#D97706" : (esDuplicado ? "#991B1B" : (calibracion.colorAristas || "#111827"))}
            opacity={estaSeleccionadaEnPicking ? 1.0 : (calibracion.opacidadAristas ?? 1.0)}
            transparent={(calibracion.opacidadAristas ?? 1.0) < 0.99 && !estaSeleccionadaEnPicking}
            lineWidth={estaSeleccionadaEnPicking ? 3.0 : (esDuplicado ? 2.5 : Math.max(1, ((calibracion.calibreAristas ?? 100) / 100) * 1.5))}
            renderOrder={estaSeleccionadaEnPicking ? 35 : (esDuplicado ? 25 : 10)}
          />
        )}
      </mesh>
    );
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={esDuplicado ? [1.06, 1.06, 1.06] : (estaSeleccionadaEnPicking ? [1.015, 1.015, 1.015] : undefined)}
      renderOrder={esDuplicado ? 20 : (estaSeleccionadaEnPicking ? 22 : undefined)}
      name={cleanName}
      onClick={(e) => {
        if (modoPickingManual.activo) {
          e.stopPropagation();
          togglePiezaEnPickingManual(piezaMadre);
        }
      }}
      onPointerOver={(e) => {
        if (modoPickingManual.activo) {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        if (modoPickingManual.activo) {
          document.body.style.cursor = "auto";
        }
      }}
      userData={{ 
        ...(meshRef.current?.userData || {}),
        initialPosition: meshRef.current?.userData?.initialPosition || new THREE.Vector3(position[0], position[1], position[2]),
        __cadOrigPosition: meshRef.current?.userData?.__cadOrigPosition || new THREE.Vector3(position[0], position[1], position[2]),
        __cadOrigQuaternion: meshRef.current?.userData?.__cadOrigQuaternion || new THREE.Quaternion(0, 0, 0, 1),
        __cadOrigScale: meshRef.current?.userData?.__cadOrigScale || new THREE.Vector3(1, 1, 1),
        __cadOrigMatrix: meshRef.current?.userData?.__cadOrigMatrix || new THREE.Matrix4().compose(
          new THREE.Vector3(position[0], position[1], position[2]),
          new THREE.Quaternion(0, 0, 0, 1),
          new THREE.Vector3(1, 1, 1)
        ),
        instanciaId,
        pbrDiffuse: pbrMaps.diffuse,
        materialPBR,
        nombreMaterialEfectivo,
        isWoodBoard,
        isHardware,
        isHardwareCorredera,
        isHardwareCantoneira,
        isHardwarePata,
        isHardwarePorca,
        isHardwareTampa,
        isHardwarePerno,
        isHardwarePrego,
        isHardwareSuporte,
        isHardwareTarugo,
        isHardwareCaja,
        isBalance,
        isMdpExpuesto,
        esDuplicado,
        cleanName,
        rawName: name,
        piezaMadre
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        key={`${activeMap ? (activeMap as any).uuid : "no-map"}-${modoVisual}-${nombreMaterialEfectivo}-${finalMeshColor}-${opacity}-${roughness}-${metalness}-${esDuplicado}-${estaSeleccionadaEnPicking}`}
        name={esDuplicado ? "Material_Duplicado_Alerta" : nombreMaterialEfectivo}
        color={esDuplicado ? "#EF4444" : (estaSeleccionadaEnPicking ? "#FBBF24" : finalMeshColor)}
        emissive={estaSeleccionadaEnPicking ? new THREE.Color("#F59E0B") : (esDuplicado ? new THREE.Color("#DC2626") : undefined)}
        emissiveIntensity={estaSeleccionadaEnPicking ? 0.70 : (esDuplicado ? 0.45 : 0)}
        map={activeMap}
        normalMap={activeNormal}
        normalScale={activeNormal ? new THREE.Vector2(normalScaleVal, normalScaleVal) : undefined}
        roughnessMap={activeRoughness}
        aoMap={activeAO}
        aoMapIntensity={materialPBR?.aoIntensity ?? 1.0}
        envMapIntensity={envMapIntensityEfectivo}
        transparent={estaSeleccionadaEnPicking ? false : transparent}
        opacity={estaSeleccionadaEnPicking ? 1.0 : opacity}
        roughness={roughness}
        metalness={metalness}
        wireframe={isWireframe}
        depthWrite={estaSeleccionadaEnPicking ? true : depthWrite}
        side={THREE.DoubleSide}
      />
      {/* 📐 Malla pura (wireframe de la geometría real) sobre la superficie sólida translúcida */}
      {modoVisual === "lineas" && (
        <mesh>
          <boxGeometry args={size} />
          <meshBasicMaterial
            wireframe={true}
            color={calibracion.colorAristas || "#1E293B"}
            transparent={true}
            opacity={0.45}
            depthWrite={false}
          />
        </mesh>
      )}
      {mostrarAristasEnEsteMesh && !isHardware && (
        <Edges
          threshold={calibracion.thresholdAristas || 25}
          color={estaSeleccionadaEnPicking ? "#D97706" : (esDuplicado ? "#991B1B" : (calibracion.colorAristas || "#111827"))}
          opacity={estaSeleccionadaEnPicking ? 1.0 : (calibracion.opacidadAristas ?? 1.0)}
          transparent={(calibracion.opacidadAristas ?? 1.0) < 0.99 && !estaSeleccionadaEnPicking}
          lineWidth={estaSeleccionadaEnPicking ? 3.0 : (esDuplicado ? 2.5 : Math.max(1, ((calibracion.calibreAristas ?? 100) / 100) * 1.5))}
          renderOrder={estaSeleccionadaEnPicking ? 35 : (esDuplicado ? 25 : 10)}
        />
      )}
    </mesh>
  );
}

export default BoardMesh;
