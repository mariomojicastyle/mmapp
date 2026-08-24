"use client";

import React, { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Stage, Edges, Line, Html } from "@react-three/drei";
import { use3BFStore, ObjetoInstancia3BF, MaterialPBRDef } from "@/lib/store";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Download, Save, Zap, Trash2 } from "lucide-react";
import NPanel from "./NPanel";
import { GHXAutoWatcher } from "./GHXAutoWatcher";
import { generarEntornoEquirectangularLocal } from "./ShaderBallViewer";

function useMaterialPBRMaps(materialPBR?: MaterialPBRDef | null, fallbackUrl?: string | null, tipoMapeado?: string) {
  const [maps, setMaps] = React.useState<{
    diffuse: THREE.Texture | null;
    normal: THREE.Texture | null;
    roughness: THREE.Texture | null;
    ao: THREE.Texture | null;
  }>({ diffuse: null, normal: null, roughness: null, ao: null });

  const isTraversada = tipoMapeado === "Cubierta Atravesada" || tipoMapeado === "Entrepaño Atravesado";
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

function obtenerNombreUnificadoPieza(obj: THREE.Object3D): string {
  const meshName = (obj.name || "").replace("RH_OUT:", "").trim();
  const parentName = obj.parent ? obj.parent.name : "";
  const meshNameLower = meshName.toLowerCase();
  const parentNameLower = parentName.toLowerCase();

  // 1. Si es un tablero / cubierta
  if (parentNameLower === "cubierta" || meshNameLower.includes("cubierta")) {
    return "Cubierta";
  }
  if (meshNameLower.includes("entrepaño") || meshNameLower.includes("entrepanio")) {
    return "Entrepaño";
  }
  if (meshNameLower.includes("lateral")) {
    return "Lateral";
  }

  // 2. Herrajes
  if (meshNameLower.includes("caja")) {
    return "Caja Minifix";
  }
  if (meshNameLower.includes("perno")) {
    return "Perno Minifix";
  }
  if (meshNameLower.includes("tarugo")) {
    return "Tarugo";
  }
  if (meshNameLower.includes("tornillo")) {
    return "Tornillo";
  }
  if (meshNameLower.includes("maquinado")) {
    return "Maquinado CNC";
  }

  return meshName.replace(/\.\d+$/, "").replace(/\d+$/, "").trim();
}

function HoverRaycastTracker({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { camera, scene, gl } = useThree();
  const { setHoveredPiece, modoTransformacion } = use3BFStore();

  React.useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    const handlePointerMove = (e: PointerEvent) => {
      // Si está en modo grab o transformación, no activar tooltips
      if (modoTransformacion !== "none") {
        setHoveredPiece(null);
        return;
      }

      const rect = dom.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNDC, camera);

      // Recolectar todos los grupos o mallas de piezas 3BF en el escenario
      const targets: THREE.Object3D[] = [];
      if (furnitureGroup) {
        targets.push(furnitureGroup);
      }
      if (typeof window !== "undefined" && (window as any).__3bfInstanceGroups) {
        const groupsMap: Map<string, THREE.Group> = (window as any).__3bfInstanceGroups;
        groupsMap.forEach((grp) => {
          if (grp) targets.push(grp);
        });
      }

      if (targets.length === 0) {
        setHoveredPiece(null);
        return;
      }

      const hits = raycaster.intersectObjects(targets, true);
      const validHit = hits.find((h) => {
        const obj = h.object;
        const n = (obj.name || "").toLowerCase();
        return (
          obj.type === "Mesh" &&
          obj.visible &&
          obj.name.length > 0 &&
          !n.includes("floor") &&
          !n.includes("grid") &&
          !n.includes("plane") &&
          !n.includes("axis") &&
          !n.includes("silhouette") &&
          !n.includes("helper")
        );
      });

      if (validHit) {
        const pieceName = obtenerNombreUnificadoPieza(validHit.object);
        setHoveredPiece(pieceName);
        
        let foundInstId: string | null = (validHit.object as any).userData?.instanciaId || null;
        let curr = validHit.object.parent;
        while (curr && !foundInstId) {
          if ((curr as any).userData?.instanciaId) {
            foundInstId = (curr as any).userData.instanciaId;
          }
          curr = curr.parent;
        }
        if (typeof window !== "undefined") {
          (window as any).__hoveredInstanceId = foundInstId;
        }
      } else {
        setHoveredPiece(null);
        if (typeof window !== "undefined") {
          (window as any).__hoveredInstanceId = null;
        }
      }
    };

    const handlePointerLeave = () => {
      setHoveredPiece(null);
      if (typeof window !== "undefined") {
        (window as any).__hoveredInstanceId = null;
      }
    };

    dom.addEventListener("pointermove", handlePointerMove, { passive: true });
    dom.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      dom.removeEventListener("pointermove", handlePointerMove);
      dom.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [camera, scene, gl, furnitureGroup, modoTransformacion, setHoveredPiece]);

  return null;
}

function RhinoAxisTracker({ onUpdate }: { onUpdate: (axes: { x: { x: number; y: number }, y: { x: number; y: number }, z: { x: number; y: number } }) => void }) {
  const { camera } = useThree();

  useFrame(() => {
    const qInv = camera.quaternion.clone().invert();
    const vX = new THREE.Vector3(1, 0, 0).applyQuaternion(qInv);
    const vY = new THREE.Vector3(0, 0, -1).applyQuaternion(qInv);
    const vZ = new THREE.Vector3(0, 1, 0).applyQuaternion(qInv);

    const len = 25;

    onUpdate({
      x: { x: vX.x * len, y: -vX.y * len },
      y: { x: vY.x * len, y: -vY.y * len },
      z: { x: vZ.x * len, y: -vZ.y * len },
    });
  });

  return null;
}

function GroundInfiniteAxes() {
  const { calibracion, coloresApariencia } = use3BFStore();

  if (!calibracion.mostrarGrilla || !calibracion.mostrarEjesCoordenadas) return null;

  const count = Math.max(1, calibracion.numeroLineasRejilla || 500);
  const cellSpacing = Math.max(0.001, calibracion.distanciaCuadricula || 0.01);
  const halfExtent = count * cellSpacing;
  const axisWidth = calibracion.grosorGrillaGruesa || 2.0;

  return (
    <group position={[0, -0.00095, 0]} renderOrder={100}>
      {calibracion.mostrarEjeX && (
        <Line
          points={[
            [0, 0, 0],
            [halfExtent, 0, 0],
          ]}
          color={coloresApariencia.ejeX || calibracion.colorEjeX || "#ef4444"}
          lineWidth={axisWidth}
          toneMapped={false}
          renderOrder={100}
          depthTest={true}
          polygonOffset={true}
          polygonOffsetFactor={-10}
        />
      )}
      {calibracion.mostrarEjeY && (
        <Line
          points={[
            [0, 0, 0],
            [0, 0, -halfExtent],
          ]}
          color={coloresApariencia.ejeY || calibracion.colorEjeY || "#22c55e"}
          lineWidth={axisWidth}
          toneMapped={false}
          renderOrder={100}
          depthTest={true}
          polygonOffset={true}
          polygonOffsetFactor={-10}
        />
      )}
    </group>
  );
}

function BoardMesh({
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
}: {
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
}) {
  const { calibracion, objetoSeleccionado, setHoveredPiece, coloresApariencia, capas, materialesPBR, asignacionesPartes } = use3BFStore();

  const { customGeometry, edgesGeometry } = React.useMemo(() => {
    if (vertices && indices && vertices.length > 0 && indices.length > 0) {
      const indexedGeo = new THREE.BufferGeometry();
      indexedGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      indexedGeo.setIndex(indices);
      indexedGeo.computeVertexNormals();

      let edges: THREE.EdgesGeometry | null = null;
      try {
        // 🛠️ Unificar vértices coincidentes (welding) para eliminar líneas de triangulación en caras coplanas
        const weldedGeo = BufferGeometryUtils.mergeVertices(indexedGeo, 0.001);
        weldedGeo.computeVertexNormals();
        edges = new THREE.EdgesGeometry(weldedGeo, calibracion.thresholdAristas || 25);
      } catch {
        try {
          edges = new THREE.EdgesGeometry(indexedGeo, calibracion.thresholdAristas || 25);
        } catch {
          edges = null;
        }
      }

      if (grasshopperUvs && grasshopperUvs.length > 0) {
        indexedGeo.setAttribute("uv", new THREE.Float32BufferAttribute(grasshopperUvs, 2));
        const geo = indexedGeo.toNonIndexed();
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        return { customGeometry: geo, edgesGeometry: edges };
      }

      const geo = indexedGeo.toNonIndexed();
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      const posAttr = geo.attributes.position;
      const uvs = new Float32Array(posAttr.count * 2);

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

        const UV_SCALE = 1.0 / 0.60; // 600mm x 600mm (0.60m) norma física real
        for (let j = 0; j < 3; j++) {
          const idx = i + j;
          const x = posAttr.getX(idx);
          const y = posAttr.getY(idx);
          const z = posAttr.getZ(idx);

          if (absY >= absX && absY >= absZ) {
            uvs[idx * 2] = x * UV_SCALE;
            uvs[idx * 2 + 1] = z * UV_SCALE;
          } else if (absX >= absY && absX >= absZ) {
            uvs[idx * 2] = z * UV_SCALE;
            uvs[idx * 2 + 1] = y * UV_SCALE;
          } else {
            uvs[idx * 2] = x * UV_SCALE;
            uvs[idx * 2 + 1] = y * UV_SCALE;
          }
        }
      }

      geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      return { customGeometry: geo, edgesGeometry: edges };
    }
    return { customGeometry: null, edgesGeometry: null };
  }, [vertices, indices, grasshopperUvs, calibracion.thresholdAristas]);

  const boxEdgesGeometry = React.useMemo(() => {
    if (!customGeometry && size && size.length === 3) {
      try {
        const boxGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
        return new THREE.EdgesGeometry(boxGeo, calibracion.thresholdAristas);
      } catch {
        return null;
      }
    }
    return null;
  }, [customGeometry, size, calibracion.thresholdAristas]);

  const cleanName = name.replace(/^RH_OUT:/i, "").trim();
  const baseCleanName = cleanName.replace(/2$/, "").replace(/_Color$|_MDP$|_Balance$/i, "").trim();
  const normalizeKey = (k: string) => k.replace(/^RH_OUT:/i, "").replace(/2$/, "").replace(/[_\s]+/g, " ").trim().toLowerCase();
  const normName = normalizeKey(name);
  const normBase = normalizeKey(baseCleanName);

  // 💡 1. Resolver Asignación de Parte con tolerancia a guiones bajos / espacios y sufijos
  let asignacion = asignacionesPartes[name] || 
                   asignacionesPartes[cleanName] || 
                   asignacionesPartes[`RH_OUT:${cleanName}`] ||
                   asignacionesPartes[baseCleanName] ||
                   asignacionesPartes[`RH_OUT:${baseCleanName}`];

  if (!asignacion) {
    const matchedKey = Object.keys(asignacionesPartes).find((k) => {
      const nK = normalizeKey(k);
      return nK === normName || nK === normBase || normName.startsWith(nK) || nK.startsWith(normName);
    });
    if (matchedKey) asignacion = asignacionesPartes[matchedKey];
  }

  const isWireframe = modoVisual === "lineas";
  const isTransparent = modoVisual === "semitransparente";
  const isHardwarePerno = normName.includes("perno") || normName.includes("tornillo");
  const isHardwareCaja = (normName.includes("caja") && !normName.includes("cajon") && !normName.includes("cajón")) || normName === "caja";
  const isHardwareTarugo = normName.includes("tarugo") || normName.includes("soporte");
  const isMachining = normName.includes("maquinado") || normName.includes("perforado");
  const isWoodBoardPiece = !isHardwarePerno && !isHardwareCaja && !isHardwareTarugo && !isMachining;

  // 💡 2. Resolver Capa Asignada (Blindaje: Piezas de madera NUNCA caen en capa_acero)
  let capaAsignada: any = null;
  if (asignacion && asignacion.capaId && asignacion.capaId !== "por_defecto" && !(isWoodBoardPiece && asignacion.capaId === "capa_acero")) {
    capaAsignada = capas.find((c) => c.id === asignacion.capaId);
  } else {
    if (isHardwarePerno) {
      capaAsignada = capas.find((c) => c.id === "capa_herrajes" || c.id === "capa_acero" || c.nombre.toLowerCase().includes("acero") || c.nombre.toLowerCase().includes("herraje"));
    } else if (isHardwareCaja) {
      capaAsignada = capas.find((c) => c.id === "capa_zincado" || c.id === "capa_zinc" || c.nombre.toLowerCase().includes("zinc"));
    } else if (isHardwareTarugo) {
      capaAsignada = capas.find((c) => c.id === "capa_madera" || c.nombre.toLowerCase().includes("madera"));
    } else if (isMachining) {
      capaAsignada = capas.find((c) => c.id === "capa_perforados" || c.nombre.toLowerCase().includes("perforad"));
    } else if (normName.includes("balance") || normName.includes("back")) {
      capaAsignada = capas.find((c) => c.id === "capa_back" || c.id === "capa_espaldar" || c.nombre.toLowerCase().includes("back"));
    } else if (normName.includes("mdp")) {
      capaAsignada = capas.find((c) => c.id === "capa_mdp" || c.nombre.toLowerCase() === "mdp");
    } else if (normName.includes("mdf")) {
      capaAsignada = capas.find((c) => c.id === "capa_mdf" || c.nombre.toLowerCase() === "mdf");
    } else {
      // Pieza principal de madera/tablero (Cubierta, Lateral, Frente, Tapa, Cajón, Tapaluz, etc.) -> Capa Tono
      capaAsignada = capas.find((c) => c.id === "capa_tono" || c.nombre.toLowerCase() === "tono" || c.nombre.toLowerCase().includes("tono")) || capas.find(c => c.id !== "capa_acero") || capas[0];
    }
  }
  if (!capaAsignada && capas.length > 0) {
    capaAsignada = capas[0];
  }
  if (isWoodBoardPiece && capaAsignada?.id === "capa_acero") {
    capaAsignada = capas.find((c) => c.id === "capa_tono" || c.nombre.toLowerCase().includes("tono")) || capaAsignada;
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
  const isWoodBoard = !isHardwarePerno && !isHardwareCaja && !isHardwareTarugo && !isMachining;

  const isMdpExpuesto = name.includes("MDP");
  const isBalance = name.includes("Balance");
  const isMelaminaCara = name.includes("Color") || (!isMdpExpuesto && !isBalance);

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
  const pbrMaps = useMaterialPBRMaps(materialPBR, targetTextureUrl, tipoMapeado);

  // 💡 5. Verificar Visibilidad (Capa o Parte apagada) - DESPUÉS DE TODOS LOS HOOKS
  const esParteOculta = asignacion && asignacion.visible === false;
  const esCapaOculta = capaAsignada && capaAsignada.visible === false;
  if (esParteOculta || esCapaOculta) {
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

  if (isHardwarePerno) {
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
    metalness = calibracion.metalicidadMadera ?? materialPBR.metalico;
    roughness = calibracion.rugosidadMadera ?? materialPBR.rugosidad;
    if (materialPBR.opacidad < 1.0 || (calibracion.opacidadMadera ?? 1.0) < 0.99) {
      opacity = Math.min(materialPBR.opacidad, calibracion.opacidadMadera ?? 1.0);
      transparent = true;
      depthWrite = opacity >= 0.95;
    }
  }

  let finalMeshColor = meshColor;
  if (modoVisual === "semitransparente") {
    finalMeshColor = coloresApariencia.mallasCristal || "#0284C7";
    opacity = 0.52;
    roughness = 0.75;
    metalness = 0.0;
    transparent = true;
    depthWrite = false;
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
      roughness = calibracion.rugosidadMadera ?? 0.58;
      metalness = calibracion.metalicidadMadera ?? 0.20;
      opacity = calibracion.opacidadMadera ?? 1.0;
      transparent = opacity < 0.99;
      depthWrite = opacity >= 0.95;
    }
  }

  const nombreMaterialEfectivo = materialPBR ? materialPBR.nombre : (isWoodBoard ? "M_Marfil" : (isHardwarePerno ? "Acero" : (isHardwareCaja ? "Zinc" : "PBR_Default")));
  const normalScaleVal = materialPBR?.normalScale ?? 1.0;

  const debeMostrarAristas = calibracion.mostrarAristas !== false && isWoodBoard && modoVisual !== "lineas";

  if (customGeometry) {
    return (
      <mesh 
        position={position}
        name={cleanName}
        geometry={customGeometry}
        userData={{ instanciaId }}
      >
        <meshStandardMaterial
          key={`${activeMap ? (activeMap as any).uuid : "no-map"}-${modoVisual}-${nombreMaterialEfectivo}-${finalMeshColor}-${opacity}-${roughness}-${metalness}`}
          name={nombreMaterialEfectivo}
          color={finalMeshColor}
          map={activeMap}
          normalMap={activeNormal}
          normalScale={activeNormal ? new THREE.Vector2(normalScaleVal, normalScaleVal) : undefined}
          roughnessMap={activeRoughness}
          aoMap={activeAO}
          aoMapIntensity={materialPBR?.aoIntensity ?? 1.0}
          envMapIntensity={modoVisual === "renderizado" ? 1.0 : 0.0}
          transparent={transparent}
          opacity={opacity}
          roughness={roughness}
          metalness={metalness}
          wireframe={isWireframe}
          depthWrite={depthWrite}
          side={THREE.DoubleSide}
        />
        {debeMostrarAristas && (
          edgesGeometry ? (
            <lineSegments geometry={edgesGeometry} renderOrder={10}>
              <lineBasicMaterial 
                color={calibracion.colorAristas || "#111827"} 
                transparent={(calibracion.opacidadAristas ?? 1.0) < 0.99}
                opacity={calibracion.opacidadAristas ?? 1.0}
                depthTest={true} 
              />
            </lineSegments>
          ) : (
            <Edges
              threshold={calibracion.thresholdAristas || 25}
              color={calibracion.colorAristas || "#111827"}
              opacity={calibracion.opacidadAristas ?? 1.0}
              transparent={(calibracion.opacidadAristas ?? 1.0) < 0.99}
              lineWidth={1}
              renderOrder={10}
            />
          )
        )}
      </mesh>
    );
  }

  return (
    <mesh
      position={position}
      name={cleanName}
      userData={{ instanciaId }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        key={`${activeMap ? (activeMap as any).uuid : "no-map"}-${modoVisual}-${nombreMaterialEfectivo}-${finalMeshColor}-${opacity}-${roughness}-${metalness}`}
        name={nombreMaterialEfectivo}
        color={finalMeshColor}
        map={activeMap}
        normalMap={activeNormal}
        normalScale={activeNormal ? new THREE.Vector2(normalScaleVal, normalScaleVal) : undefined}
        roughnessMap={activeRoughness}
        aoMap={activeAO}
        aoMapIntensity={materialPBR?.aoIntensity ?? 1.0}
        envMapIntensity={modoVisual === "renderizado" ? 1.0 : 0.0}
        transparent={transparent}
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
        wireframe={isWireframe}
        depthWrite={depthWrite}
      />
      {debeMostrarAristas && (
        boxEdgesGeometry ? (
          <lineSegments geometry={boxEdgesGeometry} renderOrder={10}>
            <lineBasicMaterial 
              color={calibracion.colorAristas || "#111827"} 
              transparent={(calibracion.opacidadAristas ?? 1.0) < 0.99}
              opacity={calibracion.opacidadAristas ?? 1.0}
              depthTest={true} 
            />
          </lineSegments>
        ) : (
          <Edges
            threshold={calibracion.thresholdAristas || 25}
            color={calibracion.colorAristas || "#111827"}
            opacity={calibracion.opacidadAristas ?? 1.0}
            transparent={(calibracion.opacidadAristas ?? 1.0) < 0.99}
            lineWidth={1}
            renderOrder={10}
          />
        )
      )}
    </mesh>
  );
}

function getFurnitureGroupBoardBox(furnitureGroup: THREE.Group): THREE.Box3 {
  furnitureGroup.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  
  furnitureGroup.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      const n = (m.name || "").toLowerCase();
      // Tableros de madera principales (excluyendo herrajes/maquinados)
      const isBoard = (
        n.includes("cubierta") ||
        n.includes("frente") ||
        n.includes("lateral") ||
        n.includes("tapa") ||
        n.includes("posterior") ||
        n.includes("cajon") ||
        n.includes("cajón") ||
        n.includes("mdp") ||
        n.includes("tablero") ||
        n.includes("madera") ||
        n.includes("entrepaño") ||
        n.includes("balance") ||
        n.includes("board") ||
        n.includes("panel")
      ) && !n.includes("perno") && !n.includes("tornillo") && !n.includes("tarugo") && !n.includes("maquinados");

      if (isBoard) {
        if (m.geometry) {
          m.geometry.computeBoundingBox();
          if (m.geometry.boundingBox) {
            const childBox = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
            box.union(childBox);
          }
        }
      }
    }
  });

  if (box.isEmpty()) {
    furnitureGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (m.geometry) {
          m.geometry.computeBoundingBox();
          if (m.geometry.boundingBox) {
            const childBox = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
            box.union(childBox);
          }
        }
      }
    });
  }

  if (box.isEmpty()) {
    box.setFromObject(furnitureGroup);
  }
  return box;
}

function extractStaticGeometry(furnitureGroup: THREE.Group) {
  const worldBox = getFurnitureGroupBoardBox(furnitureGroup);
  if (worldBox.isEmpty()) return null;

  const groupWorldPos = new THREE.Vector3();
  furnitureGroup.getWorldPosition(groupWorldPos);

  // Micro-expansión geométrica (0.6mm) para eliminar completamente el Z-fighting con las caras de la malla
  const eps = 0.0006;
  const minX = worldBox.min.x - groupWorldPos.x - eps;
  const maxX = worldBox.max.x - groupWorldPos.x + eps;
  const minY = worldBox.min.y - groupWorldPos.y - eps;
  const maxY = worldBox.max.y - groupWorldPos.y + eps;
  const minZ = worldBox.min.z - groupWorldPos.z - eps;
  const maxZ = worldBox.max.z - groupWorldPos.z + eps;

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const midZ = (minZ + maxZ) / 2;

  const faces = [
    { normal: new THREE.Vector3(0, 0, 1), center: new THREE.Vector3(midX, midY, maxZ) },  // 0: Front (+Z)
    { normal: new THREE.Vector3(0, 0, -1), center: new THREE.Vector3(midX, midY, minZ) }, // 1: Back (-Z)
    { normal: new THREE.Vector3(0, 1, 0), center: new THREE.Vector3(midX, maxY, midZ) },  // 2: Top (+Y)
    { normal: new THREE.Vector3(0, -1, 0), center: new THREE.Vector3(midX, minY, midZ) }, // 3: Bottom (-Y)
    { normal: new THREE.Vector3(1, 0, 0), center: new THREE.Vector3(maxX, midY, midZ) },  // 4: Right (+X)
    { normal: new THREE.Vector3(-1, 0, 0), center: new THREE.Vector3(minX, midY, midZ) }, // 5: Left (-X)
  ];

  const edges: Array<{ fA: number; fB: number; p1: [number, number, number]; p2: [number, number, number] }> = [
    // Top edges
    { fA: 2, fB: 0, p1: [minX, maxY, maxZ], p2: [maxX, maxY, maxZ] },
    { fA: 2, fB: 1, p1: [minX, maxY, minZ], p2: [maxX, maxY, minZ] },
    { fA: 2, fB: 4, p1: [maxX, maxY, minZ], p2: [maxX, maxY, maxZ] },
    { fA: 2, fB: 5, p1: [minX, maxY, minZ], p2: [minX, maxY, maxZ] },
    // Bottom edges
    { fA: 3, fB: 0, p1: [minX, minY, maxZ], p2: [maxX, minY, maxZ] },
    { fA: 3, fB: 1, p1: [minX, minY, minZ], p2: [maxX, minY, minZ] },
    { fA: 3, fB: 4, p1: [maxX, minY, minZ], p2: [maxX, minY, maxZ] },
    { fA: 3, fB: 5, p1: [minX, minY, minZ], p2: [minX, minY, maxZ] },
    // Vertical edges
    { fA: 0, fB: 5, p1: [minX, minY, maxZ], p2: [minX, maxY, maxZ] },
    { fA: 0, fB: 4, p1: [maxX, minY, maxZ], p2: [maxX, maxY, maxZ] },
    { fA: 1, fB: 5, p1: [minX, minY, minZ], p2: [minX, maxY, minZ] },
    { fA: 1, fB: 4, p1: [maxX, minY, minZ], p2: [maxX, maxY, minZ] },
  ];

  return { faces, edges };
}

function BoardSilhouetteOutline({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { objetoSeleccionado, modoTransformacion, objetoActivoId, coloresApariencia } = use3BFStore();
  const { camera } = useThree();
  const [silhouettePoints, setSilhouettePoints] = React.useState<[number, number, number][][]>([]);
  const outlineGroupRef = useRef<THREE.Group>(null);
  const lastBboxKeyRef = useRef<string>("");
  const geoDataRef = useRef<any>(null);

  // 2. Loop ultra rápido de 60 FPS: sincroniza posición y evalúa cambios geométricos en tiempo real
  useFrame(() => {
    if (!objetoSeleccionado || !furnitureGroup) {
      if (silhouettePoints.length > 0) setSilhouettePoints([]);
      return;
    }

    // Sincronización instantánea de posición a 60 FPS
    if (outlineGroupRef.current) {
      outlineGroupRef.current.position.copy(furnitureGroup.position);
    }

    // 🎯 DETECCIÓN DINÁMICA DE CAMBIO DE GEOMETRÍA O PARÁMETROS (X, Y, Z completos)
    const worldBox = getFurnitureGroupBoardBox(furnitureGroup);
    const groupWorldPos = new THREE.Vector3();
    furnitureGroup.getWorldPosition(groupWorldPos);

    // BBox en espacio local para detectar cambios de forma/dimensiones en todos los ejes
    const locMinX = (worldBox.min.x - groupWorldPos.x).toFixed(3);
    const locMaxX = (worldBox.max.x - groupWorldPos.x).toFixed(3);
    const locMinY = (worldBox.min.y - groupWorldPos.y).toFixed(3);
    const locMaxY = (worldBox.max.y - groupWorldPos.y).toFixed(3);
    const locMinZ = (worldBox.min.z - groupWorldPos.z).toFixed(3);
    const locMaxZ = (worldBox.max.z - groupWorldPos.z).toFixed(3);
    const bboxKey = `${locMinX}_${locMaxX}_${locMinY}_${locMaxY}_${locMinZ}_${locMaxZ}_${objetoActivoId}`;

    if (!geoDataRef.current || lastBboxKeyRef.current !== bboxKey) {
      lastBboxKeyRef.current = bboxKey;
      geoDataRef.current = extractStaticGeometry(furnitureGroup);
    }

    const staticGeometry = geoDataRef.current;
    if (!staticGeometry) {
      if (silhouettePoints.length > 0) setSilhouettePoints([]);
      return;
    }

    const { faces, edges } = staticGeometry;
    const camPos = camera.position;

    const isVisible = faces.map((f: any) => {
      const worldFaceCenter = f.center.clone().add(groupWorldPos);
      const dir = camPos.clone().sub(worldFaceCenter);
      return f.normal.dot(dir) > 0;
    });

    const activeSilhouettes: [number, number, number][][] = [];
    for (const e of edges) {
      if (isVisible[e.fA] !== isVisible[e.fB]) {
        activeSilhouettes.push([e.p1, e.p2]);
      }
    }

    setSilhouettePoints(activeSilhouettes);
  });

  if (!objetoSeleccionado || !furnitureGroup || silhouettePoints.length === 0) return null;

  return (
    <group ref={outlineGroupRef} position={furnitureGroup.position} renderOrder={999}>
      {silhouettePoints.map((pts, idx) => (
        <Line
          key={`sil-${idx}`}
          points={pts}
          color={
            modoTransformacion === "grab"
              ? (coloresApariencia.objetosBloqueados || "#111827")
              : (coloresApariencia.objetosSeleccionados || "#FF9500")
          }
          lineWidth={3.0}
          toneMapped={false}
          renderOrder={999}
          depthTest={false}
          depthWrite={false}
          transparent={true}
        />
      ))}
    </group>
  );
}

function SelectionController() {
  const { gl } = useThree();
  const { setObjetoSeleccionado, seleccionarInstancia, modoTransformacion, snapPicking, cancelarGrab, confirmarGrab } = use3BFStore();

  React.useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      // 🎯 CLIC DERECHO INSTANTÁNEO (0ms de latencia en la primera pulsación)
      if (e.button === 2) {
        if (modoTransformacion === "grab") {
          cancelarGrab();
          return;
        }

        const hoveredInstId = typeof window !== "undefined" ? (window as any).__hoveredInstanceId : null;
        if (hoveredInstId && use3BFStore.getState().instancias[hoveredInstId]) {
          seleccionarInstancia(hoveredInstId);
        } else {
          const currentHover = use3BFStore.getState().hoveredPiece;
          if (currentHover !== null) {
            setObjetoSeleccionado(true);
          } else {
            seleccionarInstancia(null);
          }
        }
      } else if (e.button === 0) {
        // 🎯 CLIC IZQUIERDO
        if (modoTransformacion === "none") {
          const hoveredInstId = typeof window !== "undefined" ? (window as any).__hoveredInstanceId : null;
          if (hoveredInstId && use3BFStore.getState().instancias[hoveredInstId]) {
            seleccionarInstancia(hoveredInstId);
          } else {
            const currentHover = use3BFStore.getState().hoveredPiece;
            if (currentHover !== null) {
              setObjetoSeleccionado(true);
            } else {
              seleccionarInstancia(null);
            }
          }
        } else if (modoTransformacion === "grab") {
          // ⚠️ Si está eligiendo punto de snap (B), NO confirmar ni deseleccionar
          if (use3BFStore.getState().snapPicking) return;
          if (typeof window !== "undefined" && (window as any).__lastSnapSelectTime) {
            if (Date.now() - (window as any).__lastSnapSelectTime < 400) return;
          }
          confirmarGrab();
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevenir menú nativo del navegador

      if (modoTransformacion === "grab") {
        if (use3BFStore.getState().snapPicking) return;
        cancelarGrab();
        return;
      }

      const hoveredInstId = typeof window !== "undefined" ? (window as any).__hoveredInstanceId : null;
      if (hoveredInstId && use3BFStore.getState().instancias[hoveredInstId]) {
        seleccionarInstancia(hoveredInstId);
      } else {
        const currentHover = use3BFStore.getState().hoveredPiece;
        if (currentHover !== null) {
          setObjetoSeleccionado(true);
        } else {
          seleccionarInstancia(null);
        }
      }
    };

    // Usar capture: true para máxima sensibilidad inmediata
    domElement.addEventListener("pointerdown", handlePointerDown as any, { capture: true });
    domElement.addEventListener("contextmenu", handleContextMenu);

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown as any, { capture: true });
      domElement.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [gl, modoTransformacion, cancelarGrab, confirmarGrab, setObjetoSeleccionado]);

  return null;
}

function extractCandidatePoints(furnitureGroup: THREE.Group) {
  const worldBox = getFurnitureGroupBoardBox(furnitureGroup);
  if (worldBox.isEmpty()) return [];

  const groupWorldPos = new THREE.Vector3();
  furnitureGroup.getWorldPosition(groupWorldPos);

  const minX = worldBox.min.x - groupWorldPos.x;
  const maxX = worldBox.max.x - groupWorldPos.x;
  const minY = worldBox.min.y - groupWorldPos.y;
  const maxY = worldBox.max.y - groupWorldPos.y;
  const minZ = worldBox.min.z - groupWorldPos.z;
  const maxZ = worldBox.max.z - groupWorldPos.z;

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const midZ = (minZ + maxZ) / 2;

  const corners: Array<[number, number, number]> = [
    [minX, minY, minZ],
    [maxX, minY, minZ],
    [minX, maxY, minZ],
    [maxX, maxY, minZ],
    [minX, minY, maxZ],
    [maxX, minY, maxZ],
    [minX, maxY, maxZ],
    [maxX, maxY, maxZ],
  ];

  const midpoints: Array<[number, number, number]> = [
    [midX, minY, minZ],
    [midX, maxY, minZ],
    [midX, minY, maxZ],
    [midX, maxY, maxZ],
    [minX, midY, minZ],
    [maxX, midY, minZ],
    [minX, midY, maxZ],
    [maxX, midY, maxZ],
    [minX, minY, midZ],
    [maxX, minY, midZ],
    [minX, maxY, midZ],
    [maxX, maxY, midZ],
  ];

  return [
    ...corners.map((p) => ({ pos: p, tipo: "corner" as const })),
    ...midpoints.map((p) => ({ pos: p, tipo: "midpoint" as const })),
  ];
}

function SnapPointMarkers({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { snapPicking, snapBasePoint, snapTargetPoint, setSnapBasePoint, modoTransformacion, posicionObjeto, objetoActivoId, coloresApariencia } = use3BFStore();
  const { camera, raycaster, gl } = useThree();
  const [hoveredPoint, setHoveredPoint] = React.useState<{ pos: [number, number, number]; tipo: "corner" | "midpoint" } | null>(null);
  const snapGroupRef = useRef<THREE.Group>(null);
  const lastSnapBboxKeyRef = useRef<string>("");
  const candidatePointsRef = useRef<Array<{ pos: [number, number, number]; tipo: "corner" | "midpoint" }>>([]);

  // 2. Detectar punto más cercano al rayo del mouse solo cuando snapPicking (B) está activo
  useFrame(() => {
    if (!furnitureGroup) return;

    // Sincronización instantánea de posición a 60 FPS
    if (snapGroupRef.current) {
      snapGroupRef.current.position.copy(furnitureGroup.position);
    }

    if (!snapPicking || modoTransformacion !== "grab") {
      if (hoveredPoint !== null) setHoveredPoint(null);
      return;
    }

    // 🎯 DETECCIÓN DINÁMICA DE DIMENSIONES PARA SNAPS
    const worldBox = getFurnitureGroupBoardBox(furnitureGroup);
    const groupWorldPos = new THREE.Vector3();
    furnitureGroup.getWorldPosition(groupWorldPos);

    const locMinX = (worldBox.min.x - groupWorldPos.x).toFixed(3);
    const locMaxX = (worldBox.max.x - groupWorldPos.x).toFixed(3);
    const locMinZ = (worldBox.min.z - groupWorldPos.z).toFixed(3);
    const locMaxZ = (worldBox.max.z - groupWorldPos.z).toFixed(3);
    const bboxKey = `${locMinX}_${locMaxX}_${locMinZ}_${locMaxZ}_${objetoActivoId}`;

    if (candidatePointsRef.current.length === 0 || lastSnapBboxKeyRef.current !== bboxKey) {
      lastSnapBboxKeyRef.current = bboxKey;
      candidatePointsRef.current = extractCandidatePoints(furnitureGroup);
    }

    const candidatePoints = candidatePointsRef.current;
    if (candidatePoints.length === 0) return;

    let closestPoint: { pos: [number, number, number]; tipo: "corner" | "midpoint" } | null = null;
    let minDistance = 0.08; // Umbral de atracción de 80mm en espacio de mundo

    for (const pt of candidatePoints) {
      const worldPt = new THREE.Vector3(pt.pos[0], pt.pos[1], pt.pos[2]).add(groupWorldPos);
      const dist = raycaster.ray.distanceToPoint(worldPt);

      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = pt;
      }
    }

    if (
      closestPoint?.pos[0] !== hoveredPoint?.pos[0] ||
      closestPoint?.pos[1] !== hoveredPoint?.pos[1] ||
      closestPoint?.pos[2] !== hoveredPoint?.pos[2] ||
      closestPoint?.tipo !== hoveredPoint?.tipo
    ) {
      setHoveredPoint(closestPoint);
    }
  });

  // 3. Listener para capturar el clic izquierdo sobre el punto detectado (Endpoint □ o Midpoint △)
  React.useEffect(() => {
    if (!snapPicking || modoTransformacion !== "grab") return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0 && hoveredPoint) {
        e.stopPropagation();
        e.preventDefault();
        if (typeof window !== "undefined") {
          (window as any).__lastSnapSelectTime = Date.now();
        }
        setSnapBasePoint(hoveredPoint.pos);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (hoveredPoint) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const dom = gl.domElement;
    dom.addEventListener("pointerdown", handlePointerDown, { capture: true });
    dom.addEventListener("contextmenu", handleContextMenu, { capture: true });
    return () => {
      dom.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      dom.removeEventListener("contextmenu", handleContextMenu, { capture: true });
    };
  }, [snapPicking, modoTransformacion, hoveredPoint, setSnapBasePoint, gl]);

  const { snapTargetType } = use3BFStore();
  const snapColor = coloresApariencia.puntoSnap || coloresApariencia.objetosSeleccionados || "#FF9500";

  if (!furnitureGroup) return null;

  return (
    <>
      {/* 1. Icono de selección de Punto Base (Origen) durante modo [B] en la PRIMERA CAPA (HTML/SVG Overlay) */}
      {snapPicking && modoTransformacion === "grab" && hoveredPoint && (
        <group ref={snapGroupRef} position={furnitureGroup.position}>
          <Html position={hoveredPoint.pos} center zIndexRange={[9999, 9999]} style={{ pointerEvents: "none" }}>
            <div style={{ transform: "translate3d(0, 0, 0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="-12 -12 24 24" style={{ overflow: "visible" }}>
                {hoveredPoint.tipo === "corner" ? (
                  <rect
                    x="-5"
                    y="-5"
                    width="10"
                    height="10"
                    fill={snapColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                  />
                ) : (
                  <polygon
                    points="0,-6 6,5 -6,5"
                    fill={snapColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                  />
                )}
              </svg>
            </div>
          </Html>
        </group>
      )}

      {/* 2. Icono de Punto Destino (Target Snap) en la PRIMERA CAPA (HTML/SVG Overlay) */}
      {!snapPicking && modoTransformacion === "grab" && snapTargetPoint && (
        <Html position={snapTargetPoint} center zIndexRange={[9999, 9999]} style={{ pointerEvents: "none" }}>
          <div style={{ transform: "translate3d(0, 0, 0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="-12 -12 24 24" style={{ overflow: "visible" }}>
              {snapTargetType === "midpoint" ? (
                <polygon
                  points="0,-6 6,5 -6,5"
                  fill={snapColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                />
              ) : (
                <rect
                  x="-5"
                  y="-5"
                  width="10"
                  height="10"
                  fill={snapColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                />
              )}
            </svg>
          </div>
        </Html>
      )}

      {/* 3. Indicador de Punto Base de Origen Anclado en la Pieza en Movimiento */}
      {!snapPicking && modoTransformacion === "grab" && snapBasePoint && (
        <group ref={snapGroupRef} position={furnitureGroup.position}>
          <Html position={snapBasePoint} center zIndexRange={[9998, 9998]} style={{ pointerEvents: "none" }}>
            <div style={{ transform: "translate3d(0, 0, 0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="-10 -10 20 20" style={{ overflow: "visible" }}>
                <circle
                  cx="0"
                  cy="0"
                  r="3.5"
                  fill={snapColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                />
              </svg>
            </div>
          </Html>
        </group>
      )}
    </>
  );
}

function GuidelineAxes() {
  const { modoTransformacion, ejeBloqueado, posicionPrevia } = use3BFStore();
  if (modoTransformacion !== "grab") return null;

  return (
    <group>
      {/* Eje X (Rojo - Horizontal en plano del suelo) */}
      {(ejeBloqueado === "none" || ejeBloqueado === "X") && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  -50, posicionPrevia[1], posicionPrevia[2],
                  50, posicionPrevia[1], posicionPrevia[2],
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#ef4444"
            opacity={ejeBloqueado === "X" ? 1.0 : 0.4}
            transparent
            linewidth={2}
          />
        </line>
      )}

      {/* Eje Y (Verde - Profundidad en plano del suelo a lo largo del eje verde) */}
      {(ejeBloqueado === "none" || ejeBloqueado === "Y") && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  posicionPrevia[0], posicionPrevia[1], -50,
                  posicionPrevia[0], posicionPrevia[1], 50,
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#22c55e"
            opacity={ejeBloqueado === "Y" ? 1.0 : 0.4}
            transparent
            linewidth={2}
          />
        </line>
      )}

      {/* Eje Z (Azul - Altura vertical en el aire) */}
      {(ejeBloqueado === "none" || ejeBloqueado === "Z") && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  posicionPrevia[0], -50, posicionPrevia[2],
                  posicionPrevia[0], 50, posicionPrevia[2],
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#3b82f6"
            opacity={ejeBloqueado === "Z" ? 1.0 : 0.4}
            transparent
            linewidth={2}
          />
        </line>
      )}
    </group>
  );
}

function TransformSnappingController() {
  const {
    modoTransformacion,
    posicionPrevia,
    setPosicionObjeto,
    ejeBloqueado,
    snapActivo,
    snapPicking,
    snapBasePoint,
    setSnapTargetPoint,
    objetoActivoId,
  } = use3BFStore();

  const { camera, raycaster, pointer } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectionPoint = useRef(new THREE.Vector3());
  const initialOffset = useRef(new THREE.Vector3());
  const hasInitialized = useRef(false);

  useFrame(() => {
    if (modoTransformacion !== "grab") {
      hasInitialized.current = false;
      return;
    }

    // SI ESTÁ ELIGIENDO PUNTO BASE (B), LA PIEZA PERMANECE ESTÁTICA / INMÓVIL
    if (snapPicking) {
      hasInitialized.current = false;
      return;
    }

    if (ejeBloqueado === "Z") {
      // Movimiento vertical en Eje Z (Altura): plano vertical perpendicular a la vista
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();
      planeRef.current.setFromNormalAndCoplanarPoint(camDir, new THREE.Vector3(...posicionPrevia));
    } else {
      // Movimiento horizontal en el plano del suelo X / Y (plano Y = 0)
      planeRef.current.set(new THREE.Vector3(0, 1, 0), -posicionPrevia[1]);
    }

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(planeRef.current, intersectionPoint.current);

    if (hit) {
      if (!hasInitialized.current) {
        initialOffset.current.copy(hit).sub(new THREE.Vector3(...posicionPrevia));
        hasInitialized.current = true;
      }

      const targetPos = hit.clone().sub(initialOffset.current);

      let finalX = snapBasePoint ? hit.x - snapBasePoint[0] : targetPos.x;
      let finalHeightY = ejeBloqueado === "Z" 
        ? (snapBasePoint ? hit.y - snapBasePoint[1] : targetPos.y) 
        : posicionPrevia[1];
      let finalDepthZ = snapBasePoint ? hit.z - snapBasePoint[2] : targetPos.z;

      if (ejeBloqueado === "X") {
        // Bloqueo en Eje X: solo se traslada en X
        finalHeightY = posicionPrevia[1];
        finalDepthZ = posicionPrevia[2];
      } else if (ejeBloqueado === "Y") {
        // Bloqueo en Eje Y (Verde / Profundidad en suelo): solo se traslada en Z de Three.js
        finalX = posicionPrevia[0];
        finalHeightY = posicionPrevia[1];
      } else if (ejeBloqueado === "Z") {
        // Bloqueo en Eje Z (Azul / Altura vertical): solo se traslada en Y de Three.js
        finalX = posicionPrevia[0];
        finalDepthZ = posicionPrevia[2];
      }

      const anchorOffset = snapBasePoint ? new THREE.Vector3(...snapBasePoint) : new THREE.Vector3(0, 0, 0);
      const currentAnchorWorld = new THREE.Vector3(finalX, finalHeightY, finalDepthZ).add(anchorOffset);

      // =========================================================================
      // 🎯 SNAPPING INTER-GEOMETRÍAS (Destino hacia otras geometrías en el escenario)
      // =========================================================================
      const otherTargets: Array<{ pos: [number, number, number]; tipo: "corner" | "midpoint" }> = [];

      if (typeof window !== "undefined" && (window as any).__3bfInstanceGroups) {
        const groupsMap: Map<string, THREE.Group> = (window as any).__3bfInstanceGroups;
        groupsMap.forEach((grp, id) => {
          if (id === objetoActivoId || !grp) return;
          const pts = extractCandidatePoints(grp);
          const grpWorldPos = new THREE.Vector3();
          grp.getWorldPosition(grpWorldPos);
          for (const p of pts) {
            otherTargets.push({
              pos: [p.pos[0] + grpWorldPos.x, p.pos[1] + grpWorldPos.y, p.pos[2] + grpWorldPos.z],
              tipo: p.tipo,
            });
          }
        });
      }

      let bestTarget: { pos: [number, number, number]; tipo: "corner" | "midpoint" } | null = null;
      let minDistance = 0.10; // 100mm de radio magnético de atracción hacia otra geometría

      for (const target of otherTargets) {
        const tWorld = new THREE.Vector3(...target.pos);
        const rayDist = raycaster.ray.distanceToPoint(tWorld);
        const anchorDist = currentAnchorWorld.distanceTo(tWorld);
        const effectiveDist = Math.min(rayDist, anchorDist);

        if (effectiveDist < minDistance) {
          minDistance = effectiveDist;
          bestTarget = target;
        }
      }

      if (bestTarget) {
        // 🎯 SNAP MAGNÉTICO AL DESTINO CON RESPETO AL EJE BLOQUEADO
        if (ejeBloqueado === "none") {
          finalX = bestTarget.pos[0] - anchorOffset.x;
          finalHeightY = bestTarget.pos[1] - anchorOffset.y;
          finalDepthZ = bestTarget.pos[2] - anchorOffset.z;
        } else if (ejeBloqueado === "X") {
          finalX = bestTarget.pos[0] - anchorOffset.x;
        } else if (ejeBloqueado === "Y") {
          finalDepthZ = bestTarget.pos[2] - anchorOffset.z;
        } else if (ejeBloqueado === "Z") {
          finalHeightY = bestTarget.pos[1] - anchorOffset.y;
        }
        setSnapTargetPoint(bestTarget.pos, bestTarget.tipo);
      } else if (snapActivo) {
        // Fallback a snapping de cuadrícula cada 100mm
        const snapStep = 0.1;
        const snappedAnchorX = Math.round(currentAnchorWorld.x / snapStep) * snapStep;
        const snappedAnchorY = Math.round(currentAnchorWorld.y / snapStep) * snapStep;
        const snappedAnchorZ = Math.round(currentAnchorWorld.z / snapStep) * snapStep;
        const snapThreshold = 0.05; // 50mm

        let targetSnap: [number, number, number] | null = null;

        if (ejeBloqueado === "X" && Math.abs(currentAnchorWorld.x - snappedAnchorX) < snapThreshold) {
          finalX = snappedAnchorX - anchorOffset.x;
          targetSnap = [snappedAnchorX, currentAnchorWorld.y, currentAnchorWorld.z];
        } else if (ejeBloqueado === "Y" && Math.abs(currentAnchorWorld.z - snappedAnchorZ) < snapThreshold) {
          finalDepthZ = snappedAnchorZ - anchorOffset.z;
          targetSnap = [currentAnchorWorld.x, currentAnchorWorld.y, snappedAnchorZ];
        } else if (ejeBloqueado === "Z" && Math.abs(currentAnchorWorld.y - snappedAnchorY) < snapThreshold) {
          finalHeightY = snappedAnchorY - anchorOffset.y;
          targetSnap = [currentAnchorWorld.x, snappedAnchorY, currentAnchorWorld.z];
        } else if (ejeBloqueado === "none") {
          if (Math.abs(currentAnchorWorld.x - snappedAnchorX) < snapThreshold) {
            finalX = snappedAnchorX - anchorOffset.x;
            targetSnap = [snappedAnchorX, currentAnchorWorld.y, currentAnchorWorld.z];
          }
          if (Math.abs(currentAnchorWorld.z - snappedAnchorZ) < snapThreshold) {
            finalDepthZ = snappedAnchorZ - anchorOffset.z;
            targetSnap = [finalX + anchorOffset.x, currentAnchorWorld.y, snappedAnchorZ];
          }
        }

        setSnapTargetPoint(targetSnap, "corner");
      } else {
        setSnapTargetPoint(null, null);
      }

      setPosicionObjeto([Number(finalX.toFixed(4)), Number(finalHeightY.toFixed(4)), Number(finalDepthZ.toFixed(4))]);
    }
  });

  return null;
}

function SingleFurnitureInstanceMesh({ 
  inst, 
  isSelected, 
  setFurnitureGroup 
}: { 
  inst: ObjetoInstancia3BF; 
  isSelected: boolean; 
  setFurnitureGroup?: (g: THREE.Group | null) => void;
}) {
  const { modoVisual, posicionObjeto, modoTransformacion } = use3BFStore();
  const meshRef = useRef<THREE.Group>(null);

  React.useEffect(() => {
    if (isSelected && meshRef.current && setFurnitureGroup) {
      setFurnitureGroup(meshRef.current);
    }
  }, [isSelected, inst.resultado, setFurnitureGroup]);

  // Registro de grupo de instancia para detección de snapping inter-geometrías
  React.useEffect(() => {
    if (meshRef.current && typeof window !== "undefined") {
      if (!(window as any).__3bfInstanceGroups) {
        (window as any).__3bfInstanceGroups = new Map<string, THREE.Group>();
      }
      (window as any).__3bfInstanceGroups.set(inst.id, meshRef.current);
    }
    return () => {
      if (typeof window !== "undefined" && (window as any).__3bfInstanceGroups) {
        (window as any).__3bfInstanceGroups.delete(inst.id);
      }
    };
  }, [inst.id, inst.resultado]);

  if (!inst.resultado?.real_meshes || inst.resultado.real_meshes.length === 0) {
    return null;
  }

  const isModelCubierta = inst.definitionId.toLowerCase().includes("cubierta");
  const parentBoardGroupName = isModelCubierta ? "Cubierta" : "Tableros";
  const mainColor = inst.parametros.color_acabado || "#0088aa";

  const namesWith2 = new Set(inst.resultado.real_meshes.filter((m: any) => m.name.endsWith("2")).map((m: any) => m.name.slice(0, -1)));
  const cleanRealMeshes = inst.resultado.real_meshes.filter((m: any) => {
    if (!m.name.endsWith("2") && namesWith2.has(m.name)) {
      return false;
    }
    return true;
  });

  const hasTexturedMeshes = cleanRealMeshes.some((m: any) => {
    const n = m.name.toLowerCase();
    return n.includes("color") || n.includes("balance") || (n.includes("mdp") && !n.includes("nurbs"));
  });

  const boardMeshes = cleanRealMeshes.filter((m: any) => {
    const n = m.name.toLowerCase();
    if (hasTexturedMeshes && (n.includes("nurbs") || m.is_nurbs_solid)) {
      return false;
    }
    return (
      n.includes("cubierta") ||
      n.includes("frente") ||
      n.includes("lateral") ||
      n.includes("tapa") ||
      n.includes("posterior") ||
      n.includes("cajon") ||
      n.includes("cajón") ||
      n.includes("mdp") ||
      n.includes("balance") ||
      n.includes("entrepaño") ||
      n.includes("madera") ||
      n.includes("board") ||
      n.includes("panel") ||
      n.includes("tablero")
    );
  });

  const hardwareMeshes = cleanRealMeshes.filter((m: any) => {
    const n = m.name.toLowerCase();
    return (n.includes("perno") || n.includes("caja") || n.includes("tarugo") || n.includes("tornillo") || n.includes("soporte")) && !n.includes("cajon") && !n.includes("cajón");
  });

  const machiningMeshes = cleanRealMeshes.filter((m: any) => 
    m.name.toLowerCase().includes("maquinados") || m.name.toLowerCase().includes("machining")
  );

  const otherMeshes = cleanRealMeshes.filter((m: any) => 
    !boardMeshes.includes(m) && !hardwareMeshes.includes(m) && !machiningMeshes.includes(m)
  );

  const currentPos = isSelected && modoTransformacion === "grab" ? posicionObjeto : inst.posicion;

  return (
    <group 
      ref={meshRef} 
      position={currentPos} 
      name={inst.nombreVisible}
    >
      {boardMeshes.length > 0 && (
        <group name={parentBoardGroupName}>
          {boardMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`board-${idx}`}
              instanciaId={inst.id}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={m.name.includes("Cubierta") ? inst.parametros.tipo_mapeado_cubierta : inst.parametros.tipo_mapeado_entrepanio}
            />
          ))}
        </group>
      )}

      {hardwareMeshes.length > 0 && (
        <group name="Herrajes">
          {hardwareMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`hardware-${idx}`}
              instanciaId={inst.id}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={m.name.includes("Cubierta") ? inst.parametros.tipo_mapeado_cubierta : inst.parametros.tipo_mapeado_entrepanio}
            />
          ))}
        </group>
      )}

      {machiningMeshes.length > 0 && (
        <group name="Maquinados">
          {machiningMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`machining-${idx}`}
              instanciaId={inst.id}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={m.name.includes("Cubierta") ? inst.parametros.tipo_mapeado_cubierta : inst.parametros.tipo_mapeado_entrepanio}
            />
          ))}
        </group>
      )}

      {otherMeshes.length > 0 && (
        <group name="Otros">
          {otherMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`other-${idx}`}
              instanciaId={inst.id}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={m.name.includes("Cubierta") ? inst.parametros.tipo_mapeado_cubierta : inst.parametros.tipo_mapeado_entrepanio}
            />
          ))}
        </group>
      )}
    </group>
  );
}

function ParametricFurnitureMesh({ setFurnitureGroup }: { setFurnitureGroup: (g: THREE.Group | null) => void }) {
  const { instancias, objetoActivoId, parametros, resultado } = use3BFStore();

  const listaInstancias = Object.values(instancias);

  if (listaInstancias.length > 0) {
    return (
      <>
        {listaInstancias.map((inst) => (
          <SingleFurnitureInstanceMesh
            key={inst.id}
            inst={inst}
            isSelected={inst.id === objetoActivoId}
            setFurnitureGroup={inst.id === objetoActivoId ? setFurnitureGroup : undefined}
          />
        ))}
      </>
    );
  }

  if (!parametros.model_id || !resultado) {
    return null;
  }

  const legacyInst: ObjetoInstancia3BF = {
    id: "legacy_single",
    nombreVisible: parametros.model_id,
    definitionId: parametros.model_id,
    archivo: parametros.custom_filename || `${parametros.model_id}.ghx`,
    parametros: parametros as any,
    resultado: resultado,
    cargando: false,
    posicion: [0, 0, 0],
    rotacion: [0, 0, 0],
    posicionPrevia: [0, 0, 0],
  };

  return (
    <SingleFurnitureInstanceMesh
      inst={legacyInst}
      isSelected={true}
      setFurnitureGroup={setFurnitureGroup}
    />
  );
}

function BlenderNavigationController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera, gl } = useThree();
  const { modoTransformacion } = use3BFStore();

  React.useEffect(() => {
    const domElement = gl.domElement;
    let isMiddleDragging = false;
    let isCtrlZooming = false;
    let isShiftPanning = false;
    let prevY = 0;
    let prevX = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 1) {
        isMiddleDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;

        if (e.ctrlKey || e.metaKey) {
          isCtrlZooming = true;
          isShiftPanning = false;
          if (controlsRef.current) controlsRef.current.enabled = false;
        } else if (e.shiftKey) {
          isShiftPanning = true;
          isCtrlZooming = false;
          if (controlsRef.current) controlsRef.current.enabled = false;
        } else {
          isCtrlZooming = false;
          isShiftPanning = false;
          if (controlsRef.current && modoTransformacion !== "grab") {
            controlsRef.current.enabled = true;
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isMiddleDragging) return;

      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      const controls = controlsRef.current;
      if (!controls) return;

      if (isCtrlZooming) {
        // Zoom in si deltaY < 0 (hacia arriba acerca), Zoom out si deltaY > 0 (hacia abajo aleja)
        const target = controls.target || new THREE.Vector3(0, 0, 0);
        const offset = camera.position.clone().sub(target);
        const currentDist = offset.length();

        const zoomSpeed = 0.007;
        const scaleFactor = Math.max(0.1, 1.0 + (deltaY * zoomSpeed));
        
        const minD = controls.minDistance || 0.2;
        const maxD = controls.maxDistance || 20.0;
        const newDist = Math.max(minD, Math.min(maxD, currentDist * scaleFactor));
        
        offset.setLength(newDist);
        camera.position.copy(target).add(offset);
        camera.updateProjectionMatrix();
        controls.update();
      } else if (isShiftPanning) {
        const target = controls.target || new THREE.Vector3(0, 0, 0);
        const offset = camera.position.clone().sub(target);
        const panSpeed = Math.max(0.0005, offset.length() * 0.0012);

        const vRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(-deltaX * panSpeed);
        const vUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(deltaY * panSpeed);

        camera.position.add(vRight).add(vUp);
        target.add(vRight).add(vUp);
        camera.updateProjectionMatrix();
        controls.update();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 1) {
        isMiddleDragging = false;
        isCtrlZooming = false;
        isShiftPanning = false;
        if (controlsRef.current && modoTransformacion !== "grab") {
          controlsRef.current.enabled = true;
        }
      }
    };

    domElement.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [camera, gl, controlsRef, modoTransformacion]);

  return null;
}

function CameraRefBridge({ cameraRef }: { cameraRef: React.MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree();
  React.useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);
  return null;
}

function ThumbnailCapturer() {
  const { gl, scene, camera } = useThree();
  React.useEffect(() => {
    (window as any).__capturarThumbnail3BF = () => {
      try {
        gl.render(scene, camera);
        const srcCanvas = gl.domElement;
        const width = srcCanvas.width;
        const height = srcCanvas.height;
        if (!width || !height) return null;

        // Recorte cuadrado exactamente centrado
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        const offscreen = document.createElement("canvas");
        offscreen.width = 360;
        offscreen.height = 360;
        const ctx = offscreen.getContext("2d");
        if (ctx) {
          ctx.drawImage(srcCanvas, startX, startY, size, size, 0, 0, 360, 360);
          return offscreen.toDataURL("image/webp", 0.92);
        }
        return srcCanvas.toDataURL("image/webp", 0.85);
      } catch (e) {
        console.error("Error al capturar thumbnail 3D centrado:", e);
        return null;
      }
    };

    // 📸 Captura limpia en alta resolución para Render IA (proporción exacta 1:1 sin deformación y fondo blanco puro)
    (window as any).__capturarEscenaRenderIA = (opts?: { width?: number; height?: number; aspectRatio?: string }) => {
      try {
        const targetW = opts?.width || 1024;
        const targetH = opts?.height || 1024;

        // Ocultar temporalmente ayudas visuales, grilla de suelo Drei, ejes y líneas de selección
        const hiddenObjects: { obj: THREE.Object3D; wasVisible: boolean }[] = [];
        scene.traverse((obj) => {
          const n = (obj.name || "").toLowerCase();
          const isHelper =
            n.includes("grid") ||
            n.includes("helper") ||
            n.includes("selection") ||
            n.includes("bbox") ||
            n.includes("snap") ||
            n.includes("axes") ||
            n.includes("ground") ||
            n.includes("silhouette") ||
            obj.type === "LineSegments" ||
            obj.type === "GridHelper" ||
            obj.type === "AxesHelper" ||
            obj.type === "Line2" ||
            (obj as any).isLine ||
            (obj.type === "Mesh" && (obj.position.y <= 0 && obj.position.y >= -0.01) && !(obj as any).geometry?.attributes?.position?.count);

          if (isHelper) {
            if (obj.visible) {
              hiddenObjects.push({ obj, wasVisible: true });
              obj.visible = false;
            }
          }
        });

        // Forzar render limpio
        gl.render(scene, camera);
        const srcCanvas = gl.domElement;
        const width = srcCanvas.width;
        const height = srcCanvas.height;

        let resultBase64 = "";
        if (width && height) {
          const offscreen = document.createElement("canvas");
          offscreen.width = targetW;
          offscreen.height = targetH;
          const ctx = offscreen.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF"; // Fondo blanco puro de estudio comercial

            // CÁLCULO PROPORCIONAL EXACTO (Cero deformación / Aspect Ratio Matching)
            const targetRatio = targetW / targetH;
            const srcRatio = width / height;

            let cropW = width;
            let cropH = height;
            let startX = 0;
            let startY = 0;

            if (srcRatio > targetRatio) {
              // El canvas original es más ancho: recortar los lados para centrar perfectamente
              cropW = height * targetRatio;
              startX = (width - cropW) / 2;
            } else {
              // El canvas original es más alto: recortar arriba y abajo para centrar
              cropH = width / targetRatio;
              startY = (height - cropH) / 2;
            }

            ctx.fillRect(0, 0, targetW, targetH);
            ctx.drawImage(srcCanvas, startX, startY, cropW, cropH, 0, 0, targetW, targetH);
            resultBase64 = offscreen.toDataURL("image/png");
          } else {
            resultBase64 = srcCanvas.toDataURL("image/png");
          }
        }

        // Restaurar visibilidad
        hiddenObjects.forEach(({ obj, wasVisible }) => {
          obj.visible = wasVisible;
        });
        gl.render(scene, camera);

        return resultBase64;
      } catch (e) {
        console.error("Error capturando escena limpia para Render IA:", e);
        return null;
      }
    };

    return () => {
      delete (window as any).__capturarThumbnail3BF;
      delete (window as any).__capturarEscenaRenderIA;
    };
  }, [gl, scene, camera]);
  return null;
}

function CameraViewController({ 
  furnitureGroup, 
  controlsRef 
}: { 
  furnitureGroup: THREE.Group | null;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const centrarCamaraTrigger = use3BFStore((s) => s.centrarCamaraTrigger);
  const campoDeVisionFov = use3BFStore((s) => s.calibracion.campoDeVisionFov || 45);

  React.useEffect(() => {
    if (camera && "fov" in camera) {
      (camera as THREE.PerspectiveCamera).fov = campoDeVisionFov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }, [camera, campoDeVisionFov]);

  React.useEffect(() => {
    if (centrarCamaraTrigger > 0 && controlsRef.current && camera) {
      if (furnitureGroup && furnitureGroup.children.length > 0) {
        const box = new THREE.Box3().setFromObject(furnitureGroup);
        if (!box.isEmpty()) {
          const center = new THREE.Vector3();
          const size = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(size);

          const maxDim = Math.max(size.x, size.y, size.z, 0.4);
          const fov = ((camera as THREE.PerspectiveCamera).fov || 45) * (Math.PI / 180);
          let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
          cameraDistance = Math.max(cameraDistance, 0.8);

          controlsRef.current.target.set(center.x, center.y, center.z);
          camera.position.set(
            center.x + cameraDistance * 0.7,
            center.y + cameraDistance * 0.6,
            center.z + cameraDistance * 0.9
          );
          camera.lookAt(center);
          controlsRef.current.update();
          return;
        }
      }

      // Default fallback
      controlsRef.current.target.set(0.25, 0.3, -0.24);
      camera.position.set(0.6, 0.9, 1.1);
      camera.lookAt(0.25, 0.3, -0.24);
      controlsRef.current.update();
    }
  }, [centrarCamaraTrigger, furnitureGroup, controlsRef, camera]);

  return null;
}

function SceneEnvironment({ modoVisual }: { modoVisual: string }) {
  const { scene } = useThree();

  useEffect(() => {
    if (modoVisual !== "renderizado") {
      scene.environment = null;
      return;
    }

    let active = true;
    try {
      const loader = new RGBELoader();
      loader.load(
        "/textures/hdri/modern_bathroom_1k.hdr",
        (tex) => {
          if (!active) return;
          tex.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = tex;
        },
        undefined,
        () => {
          if (!active) return;
          const fallbackEnv = generarEntornoEquirectangularLocal("alps_field_sol", 45);
          scene.environment = fallbackEnv;
        }
      );
    } catch {
      if (active) {
        const fallbackEnv = generarEntornoEquirectangularLocal("alps_field_sol", 45);
        scene.environment = fallbackEnv;
      }
    }
    return () => {
      active = false;
      scene.environment = null;
    };
  }, [scene, modoVisual]);
  return null;
}

// =========================================================================
// VISOR 3D PRINCIPAL (VIEWPORT)
// =========================================================================

export default function Viewer3D() {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const {
    tema,
    resultado,
    modoVisual,
    calibracion,
    coloresApariencia,
    escenarioLimpio,
    parametros,
    hoveredPiece,
    setMostrarNPanel,
    pestanaNPanel,
    setPestanaNPanel,
    setModalGuardarComoAbierto,
    muebleActivoGuardado,
    instancias,
    objetoActivoId,
    seleccionarInstancia,
    objetoSeleccionado,
    setObjetoSeleccionado,
    modoTransformacion,
    posicionObjeto,
    iniciarGrab,
    confirmarGrab,
    cancelarGrab,
    ejeBloqueado,
    setEjeBloqueado,
    snapActivo,
    snapPicking,
    snapBasePoint,
    toggleSnapMode,
    deshacer,
    rehacer,
    mecanizadosCruzados,
    mecanizadoEnProgreso,
    perforarMueble,
    limpiarPerforaciones,
    renombrarInstancia,
    eliminarInstancia,
    guardarCambiosMueble,
    guardandoMueble,
    recargarDefinicionInstancia,
  } = use3BFStore();

  const [furnitureGroup, setFurnitureGroup] = React.useState<THREE.Group | null>(null);
  const [editingInstId, setEditingInstId] = React.useState<string | null>(null);
  const [editTempName, setEditTempName] = React.useState<string>("");
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [rhinoAxes, setRhinoAxes] = React.useState({
    x: { x: 22, y: 0 },
    y: { x: -8, y: -12 },
    z: { x: 0, y: -22 },
  });
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // ⏪ Atajo Ctrl+Z / Cmd+Z: Deshacer (Undo) / Ctrl+Shift+Z / Ctrl+Y: Rehacer (Redo)
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) {
          rehacer();
        } else {
          deshacer();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        rehacer();
        return;
      }

      // 🔄 Atajo Shift+R: Actualizar Algoritmo / Hot-Reload GHX
      if (e.shiftKey && (e.key === "r" || e.key === "R") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (objetoActivoId) {
          recargarDefinicionInstancia(objetoActivoId);
        }
        return;
      }

      // 🗑️ Atajo Delete / Supr / Backspace / X: Eliminar componente seleccionado
      if (
        (e.key === "Delete" || e.key === "Del" || e.key === "Backspace" || ((e.key === "x" || e.key === "X") && modoTransformacion !== "grab")) &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        if (objetoActivoId && modoTransformacion !== "grab") {
          e.preventDefault();
          eliminarInstancia(objetoActivoId);
          return;
        }
      }

      // Atajo G: Iniciar / Confirmar Modo Mover (Grab)
      if ((e.key === "g" || e.key === "G") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (objetoSeleccionado) {
          if (modoTransformacion === "grab") {
            confirmarGrab();
          } else {
            iniciarGrab();
          }
        }
        return;
      }

      // Atajos activos durante modo Grab
      if (modoTransformacion === "grab") {
        if (e.key === "b" || e.key === "B") {
          e.preventDefault();
          toggleSnapMode();
        } else if (e.key === "x" || e.key === "X") {
          e.preventDefault();
          setEjeBloqueado("X");
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          setEjeBloqueado("Y");
        } else if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          setEjeBloqueado("Z");
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelarGrab();
        } else if (e.key === "Enter") {
          e.preventDefault();
          confirmarGrab();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setMostrarNPanel,
    objetoSeleccionado,
    modoTransformacion,
    iniciarGrab,
    confirmarGrab,
    cancelarGrab,
    toggleSnapMode,
    setEjeBloqueado,
    deshacer,
    rehacer,
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const exportToGLB = () => {
    const instanceMap: Map<string, THREE.Group> | undefined = typeof window !== "undefined" ? (window as any).__3bfInstanceGroups : undefined;
    const targetGroups: THREE.Group[] = [];
    if (furnitureGroup) {
      targetGroups.push(furnitureGroup);
    } else if (instanceMap && instanceMap.size > 0) {
      instanceMap.forEach((grp) => targetGroups.push(grp));
    }

    if (targetGroups.length === 0) {
      alert("Espera a que el modelo esté cargado en pantalla para exportar.");
      return;
    }
    
    import("three/examples/jsm/exporters/GLTFExporter.js").then(({ GLTFExporter }) => {
      const exporter = new GLTFExporter();
      
      // 1. Crear nodo raíz limpio y purgado para Blender
      const exportRoot = new THREE.Group();
      exportRoot.name = parametros.model_id || "Mueble_3BF";

      targetGroups.forEach((targetGroup) => {
        targetGroup.updateWorldMatrix(true, true);
        const groupWorldPos = new THREE.Vector3();
        targetGroup.getWorldPosition(groupWorldPos);

        targetGroup.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh || !mesh.isMesh) return;
        
        // Filtrar objetos ocultos o invisibles
        if (!mesh.visible) return;
        const meshName = (mesh.name || "").trim();
        // Si no tiene nombre explícito de pieza, es un helper/outline/edges interno de Three.js
        if (!meshName) return;
        
        const nLow = meshName.toLowerCase();
        
        // Descartar maquinados transparentes, helpers, sombras o sólidos NURBS de cálculo analítico
        if (
          nLow.includes("perforado") || 
          nLow.includes("maquinado") || 
          nLow.includes("helper") || 
          nLow.includes("plane") || 
          nLow.includes("nurbs") ||
          nLow.includes("edges") ||
          nLow.includes("outline") ||
          nLow.includes("silhouette") ||
          nLow.includes("shadow") ||
          nLow.includes("axis")
        ) {
          return;
        }

        // Descartar si no tiene geometría válida o tiene 0 vértices
        if (!mesh.geometry || !mesh.geometry.attributes.position || mesh.geometry.attributes.position.count === 0) {
          return;
        }

        // 2. Crear geometría limpia con atributos estándar (position, normal, uv)
        const cleanGeo = mesh.geometry.clone();
        
        // Eliminar atributos no estándar que causan conflicto en Blender
        Object.keys(cleanGeo.attributes).forEach((attrKey) => {
          if (!["position", "normal", "uv"].includes(attrKey)) {
            cleanGeo.deleteAttribute(attrKey);
          }
        });

        // Asegurar coordenadas UV válidas de 2 componentes
        if (!cleanGeo.attributes.uv) {
          const pos = cleanGeo.attributes.position;
          const uvs = new Float32Array(pos.count * 2);
          for (let i = 0; i < pos.count; i++) {
            uvs[i * 2] = pos.getX(i);
            uvs[i * 2 + 1] = pos.getZ(i);
          }
          cleanGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
        }

        // Convertir a geometría no indexada y calcular normales
        let finalGeo = cleanGeo.index ? cleanGeo.toNonIndexed() : cleanGeo;
        const posAttr = finalGeo.attributes.position;
        const uvAttr = finalGeo.attributes.uv;

        // 📐 Inversión Explícita Directa de Balance (Multiplicar por -1):
        if (nLow.includes("balance")) {
          for (let i = 0; i < posAttr.count; i += 3) {
            const x1 = posAttr.getX(i + 1), y1 = posAttr.getY(i + 1), z1 = posAttr.getZ(i + 1);
            const x2 = posAttr.getX(i + 2), y2 = posAttr.getY(i + 2), z2 = posAttr.getZ(i + 2);
            posAttr.setXYZ(i + 1, x2, y2, z2);
            posAttr.setXYZ(i + 2, x1, y1, z1);

            if (uvAttr) {
              const u1 = uvAttr.getX(i + 1), v1 = uvAttr.getY(i + 1);
              const u2 = uvAttr.getX(i + 2), v2 = uvAttr.getY(i + 2);
              uvAttr.setXY(i + 1, u2, v2);
              uvAttr.setXY(i + 2, u1, v1);
            }
          }
          posAttr.needsUpdate = true;
          if (uvAttr) uvAttr.needsUpdate = true;
        }

        finalGeo.computeVertexNormals();

        // Forzar vector normal hacia abajo (0, -1, 0) para Balance y (0, 1, 0) para Color
        if (nLow.includes("balance") && finalGeo.attributes.normal) {
          const normAttr = finalGeo.attributes.normal;
          for (let idx = 0; idx < normAttr.count; idx++) {
            normAttr.setXYZ(idx, 0, -1, 0);
          }
          normAttr.needsUpdate = true;
        } else if (nLow.includes("color") && finalGeo.attributes.normal) {
          const normAttr = finalGeo.attributes.normal;
          for (let idx = 0; idx < normAttr.count; idx++) {
            normAttr.setXYZ(idx, 0, 1, 0);
          }
          normAttr.needsUpdate = true;
        }

        finalGeo.clearGroups();

        // 3. Crear material limpio según el modo visual activo
        const isExportSolid = modoVisual === "solido";
        const srcMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const matName = isExportSolid 
          ? (meshName ? `${meshName}_Solido` : "Material_Solido_Gris") 
          : (srcMat?.name || (meshName ? `${meshName}_Mat` : "PBR_Material"));

        const cleanMat = new THREE.MeshStandardMaterial({
          name: matName,
          color: isExportSolid 
            ? new THREE.Color(coloresApariencia.materialPorDefecto || calibracion.colorSolido || "#CBD5E1")
            : ((srcMat as any)?.color || new THREE.Color("#CBD5E1")),
          roughness: isExportSolid ? 0.5 : ((srcMat as any)?.roughness ?? 0.4),
          metalness: isExportSolid ? 0.05 : ((srcMat as any)?.metalness ?? 0.1),
          map: isExportSolid ? null : ((srcMat as any)?.map || null),
          transparent: false,
          opacity: 1.0,
          side: THREE.DoubleSide
        });

        const newMesh = new THREE.Mesh(finalGeo, cleanMat);
        newMesh.name = meshName || "Pieza_3BF";
        newMesh.children = [];

        // Posicionar en espacio local del mueble
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        mesh.getWorldQuaternion(worldQuat);
        mesh.getWorldScale(worldScale);

        newMesh.position.subVectors(worldPos, groupWorldPos);
        newMesh.quaternion.copy(worldQuat);
        newMesh.scale.copy(worldScale);

        exportRoot.add(newMesh);
        });
      });

      if (exportRoot.children.length === 0) {
        alert("No se encontraron mallas visibles para exportar.");
        return;
      }

      exporter.parse(
        exportRoot,
        (gltf) => {
          const blob = new Blob([gltf as ArrayBuffer], { type: "application/octet-stream" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(11, 19);
          const fileName = `${parametros.model_id || "Cubierta"}_${timestamp}.glb`;
          link.download = fileName;
          link.click();
          console.log(`[3BF GLB Exporter] Exportado exitosamente: ${fileName} con ${exportRoot.children.length} piezas listas para Blender.`);
        },
        (error) => {
          console.error("Error al exportar GLB:", error);
        },
        { binary: true }
      );
    });
  };

  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

  const handleDropOnCanvas = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    let itemToLoad: any = null;

    try {
      const dataStr = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
      if (dataStr) {
        itemToLoad = JSON.parse(dataStr);
      }
    } catch (err) {
      console.warn("Error en parse de Drag dataTransfer:", err);
    }

    if (!itemToLoad && typeof window !== "undefined" && (window as any).__dragged3BFItem) {
      itemToLoad = (window as any).__dragged3BFItem;
    }

    // 1. Raycast desde el puntero del mouse hacia el plano horizontal del escenario (Y = 0)
    let dropPosition: [number, number, number] = [0, 0, 0];
    if (cameraRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
        // Cuadricular la posición al cuadrante más cercano de la grilla (ej. distanciaCuadricula = 0.1m / 100mm o 0.05m)
        const gridStep = use3BFStore.getState().calibracion.distanciaCuadricula || 0.1;
        const snappedX = Math.round(intersection.x / gridStep) * gridStep;
        const snappedZ = Math.round(intersection.z / gridStep) * gridStep;
        dropPosition = [Number(snappedX.toFixed(3)), 0, Number(snappedZ.toFixed(3))];
      }
    } else {
      const cantExistentes = Object.keys(use3BFStore.getState().instancias).length;
      dropPosition = [cantExistentes * 0.65, 0, 0];
    }

    if (itemToLoad && itemToLoad.id) {
      await use3BFStore.getState().agregarInstanciaGHX(itemToLoad, dropPosition);
    }

    if (typeof window !== "undefined") {
      (window as any).__dragged3BFItem = null;
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => use3BFStore.getState().setHoveredPiece(null)}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        if (!isDraggingOver) setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingOver(false);
      }}
      onDrop={handleDropOnCanvas}
      onContextMenu={(e) => {
        e.preventDefault();
        if (modoTransformacion === "grab") {
          cancelarGrab();
        }
      }}
      onClick={() => {
        if (modoTransformacion === "grab") {
          if (use3BFStore.getState().snapPicking) return;
          if (typeof window !== "undefined" && (window as any).__lastSnapSelectTime) {
            if (Date.now() - (window as any).__lastSnapSelectTime < 400) return;
          }
          confirmarGrab();
        }
      }}
      className="w-full h-full relative rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-cyan-900/50 glass-panel"
    >
      <NPanel />

      {/* Indicador visual de Zona de Suelta (Drop Zone) */}
      {isDraggingOver && (
        <div className="absolute inset-2 z-40 rounded-xl border-2 border-dashed border-cyan-400 bg-cyan-500/10 backdrop-blur-xs flex items-center justify-center pointer-events-none transition-all">
          <div className="bg-slate-950/80 text-cyan-300 font-bold text-xs px-4 py-2 rounded-full border border-cyan-500/50 shadow-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Soltar para abrir modelo en el escenario 3D</span>
          </div>
        </div>
      )}



      {hoveredPiece && (
        <div 
          style={{
            left: `${mousePos.x + 15}px`,
            top: `${mousePos.y + 15}px`,
            borderColor: parametros.color_acabado || "#0088aa"
          }}
          className="absolute border-2 bg-slate-900/80 dark:bg-[#0D1117]/80 backdrop-blur-md text-white text-xs px-4 py-1.5 rounded-xl font-sans font-bold shadow-lg z-20 pointer-events-none transition-all duration-75 text-center min-w-[80px]"
        >
          {hoveredPiece}
        </div>
      )}

      {/* 🧭 HUD SUPERIOR IZQUIERDO: JERARQUÍA NOMBRE DE ARCHIVO + (N) COMPONENTES + LISTA DE PIEZAS */}
      <div className="absolute top-3.5 left-4 z-20 flex flex-col items-start gap-1 select-none pointer-events-auto max-w-[260px]">
        {/* Nivel 1: Barra de Acciones Superior (Guardar + Nombre / Perforar Mueble) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Botón Guardar (Guardar nuevo o Guardar Cambios en caliente) */}
          <button
            onClick={async () => {
              if (muebleActivoGuardado) {
                await guardarCambiosMueble();
              } else {
                setMostrarNPanel(true);
                setPestanaNPanel("muebles");
                setModalGuardarComoAbierto(true);
              }
            }}
            disabled={guardandoMueble}
            title={muebleActivoGuardado ? `Guardar cambios en "${muebleActivoGuardado.nombre}"` : "Guardar nuevo mueble en el catálogo"}
            style={{
              backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
              borderColor: coloresApariencia?.colorMarca || "#0891b2",
            }}
            className="px-3 h-6 rounded-full text-white shadow-md border flex items-center gap-1.5 text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-3 h-3 text-white ${guardandoMueble ? "animate-spin" : ""}`} />
            <span>{guardandoMueble ? "Guardando..." : "Guardar"}</span>
          </button>

          {/* Nombre del mueble activo (si ya está guardado en catálogo) */}
          {muebleActivoGuardado && (
            <button
              onClick={() => {
                setMostrarNPanel(true);
                setPestanaNPanel("muebles");
              }}
              title="Mueble activo en catálogo (Haz clic para ver en Biblioteca de Muebles)"
              style={{ 
                color: coloresApariencia?.textoPrincipal || (tema === "obsidian" ? "#F8FAFC" : "#0F172A"),
              }}
              className="flex items-center gap-1 text-xs font-bold hover:text-cyan-500 transition-colors cursor-pointer group max-w-[130px] truncate"
            >
              <span className="underline decoration-dotted underline-offset-2 group-hover:decoration-solid truncate">
                {muebleActivoGuardado.nombre}
              </span>
            </button>
          )}

          {/* Botón Perforar Mueble */}
          <button
            onClick={async () => {
              await perforarMueble();
            }}
            disabled={mecanizadoEnProgreso}
            title="Detectar contacto entre piezas y transferir perforaciones al DXF"
            style={{
              backgroundColor: Object.keys(mecanizadosCruzados || {}).length > 0 
                ? (coloresApariencia?.fondoPaneles || "#FFFFFF") 
                : (coloresApariencia?.fondoPaneles || "#FFFFFF"),
              borderColor: Object.keys(mecanizadosCruzados || {}).length > 0 
                ? "#F59E0B" 
                : (coloresApariencia?.bordePaneles || "#CBD5E1"),
              color: Object.keys(mecanizadosCruzados || {}).length > 0 
                ? "#D97706" 
                : (coloresApariencia?.textoPrincipal || "#0F172A"),
            }}
            className="px-2.5 h-6 rounded-full shadow-md border flex items-center gap-1 text-[11px] font-bold hover:border-amber-500 hover:text-amber-600 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3 h-3 ${mecanizadoEnProgreso ? "animate-spin text-amber-500" : "text-amber-500"}`} />
            <span>
              {mecanizadoEnProgreso 
                ? "Perforando..." 
                : (Object.keys(mecanizadosCruzados || {}).length > 0 
                    ? `Perforado (${Object.values(mecanizadosCruzados).flat().length})` 
                    : "Perforar")}
            </span>
          </button>

          {/* Botón Limpiar Perforaciones */}
          {Object.keys(mecanizadosCruzados || {}).length > 0 && (
            <button
              onClick={limpiarPerforaciones}
              title="Eliminar perforaciones transferidas"
              style={{
                backgroundColor: coloresApariencia?.fondoPaneles || "#FFFFFF",
                borderColor: coloresApariencia?.bordePaneles || "#CBD5E1",
              }}
              className="w-6 h-6 rounded-full shadow-md border flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-400 active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Nivel 2: Contador de Componentes (N) y Listado Jerárquico */}
        <div className="flex flex-col items-start gap-0.5">
          {(() => {
            const lista = Object.values(instancias || {});
            
            // Determinar si hay componentes reales en el escenario
            let itemsAMostrar: { id: string; nombre: string; isActivo: boolean; isLegacy?: boolean }[] = [];

            if (lista.length > 0) {
              itemsAMostrar = lista.map((inst, idx) => ({
                id: inst.id,
                nombre: inst.nombreVisible || inst.definitionId || `Componente ${idx + 1}`,
                isActivo: objetoActivoId === inst.id,
              }));
            } else if (!escenarioLimpio && ((resultado?.real_meshes && resultado.real_meshes.length > 0) || (resultado?.despiece && resultado.despiece.length > 0))) {
              const nombreBase = parametros.model_id || (parametros as any).custom_filename?.replace(/\.ghx$/i, "") || "Cubierta";
              itemsAMostrar = [{
                id: "base_model",
                nombre: nombreBase,
                isActivo: true,
                isLegacy: true,
              }];
            }

            const total = itemsAMostrar.length;

            return (
              <>
                <span 
                  style={{ 
                    color: coloresApariencia?.textoSecundario || (tema === "obsidian" ? "#94A3B8" : "#64748B"),
                  }}
                  className="text-[11px] font-mono font-semibold opacity-85"
                >
                  ({total}) {total === 1 ? "Componente" : "Componentes"}:
                </span>

                {/* Lista de Nombres de Componentes */}
                <div className="flex flex-col items-start gap-0.5 pl-1 max-h-[35vh] overflow-y-auto custom-scrollbar">
                  {total > 0 ? (
                    itemsAMostrar.map((comp) => {
                      const isEditing = editingInstId === comp.id;

                      if (isEditing) {
                        return (
                          <div key={comp.id} className="flex items-center gap-1 text-[11px] font-mono pl-0.5 my-0.5">
                            <span className="opacity-60 text-[9px]">•</span>
                            <input
                              autoFocus
                              type="text"
                              value={editTempName}
                              onChange={(e) => setEditTempName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (editTempName.trim()) {
                                    renombrarInstancia(comp.id, editTempName.trim());
                                  }
                                  setEditingInstId(null);
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingInstId(null);
                                }
                              }}
                              onBlur={() => {
                                if (editTempName.trim()) {
                                  renombrarInstancia(comp.id, editTempName.trim());
                                }
                                setEditingInstId(null);
                              }}
                              style={{
                                backgroundColor: coloresApariencia?.fondoAplicacion || "#FFFFFF",
                                borderColor: coloresApariencia?.botonActivo || "#0891b2",
                                color: coloresApariencia?.textoPrincipal || "#0F172A",
                              }}
                              className="px-1.5 py-0.5 text-[11px] font-mono border rounded outline-none w-32 shadow-xs"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={comp.id} className="flex items-center gap-1.5 group/item w-full">
                          <button
                            onClick={() => {
                              if (!comp.isLegacy) {
                                seleccionarInstancia(comp.id);
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingInstId(comp.id);
                              setEditTempName(comp.nombre);
                            }}
                            title={comp.isLegacy ? `${comp.nombre} (Doble clic para renombrar)` : `Doble clic para renombrar: ${comp.nombre}`}
                            style={{
                              color: coloresApariencia?.textoSecundario || (tema === "obsidian" ? "#94A3B8" : "#64748B")
                            }}
                            className={`flex items-center gap-1 text-[11px] font-mono transition-colors hover:text-cyan-500 cursor-pointer text-left select-none truncate ${
                              comp.isActivo ? "font-bold opacity-90" : "font-medium opacity-75 hover:opacity-100"
                            }`}
                          >
                            <span className="opacity-60 text-[9px]">•</span>
                            <span className="truncate max-w-[170px]">{comp.nombre}</span>
                          </button>

                          {!comp.isLegacy && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarInstancia(comp.id);
                              }}
                              title={`Eliminar ${comp.nombre} (Supr / Delete)`}
                              className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:text-red-500 transition-opacity cursor-pointer shrink-0 text-slate-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span 
                      style={{
                        color: coloresApariencia?.textoSecundario || (tema === "obsidian" ? "#64748B" : "#94A3B8")
                      }}
                      className="text-[10px] italic opacity-60 pl-1"
                    >
                      (Escenario vacío)
                    </span>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <Canvas
        camera={{ position: [0.6, 0.9, 1.1], fov: 45, near: 0.005, far: 100 }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        onPointerMissed={() => {
          use3BFStore.getState().setHoveredPiece(null);
          if (typeof window !== "undefined") {
            (window as any).__hoveredInstanceId = null;
          }
        }}
      >
        <color attach="background" args={[coloresApariencia.fondo3D || (tema === "obsidian" ? "#0D1117" : "#F3F4F6")]} />
        <CameraRefBridge cameraRef={cameraRef} />
        <ThumbnailCapturer />
        <SceneEnvironment modoVisual={modoVisual} />
        <HoverRaycastTracker furnitureGroup={furnitureGroup} />
        <ambientLight intensity={calibracion.intensidadLuzAmbiental ?? 0.8} />
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={calibracion.intensidadLuzDirecta ?? 1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        <directionalLight position={[-5, 5, -5]} intensity={(calibracion.intensidadLuzDirecta ?? 1.5) * 0.25} />
        
        {!escenarioLimpio && (
          <>
            <ParametricFurnitureMesh setFurnitureGroup={setFurnitureGroup} />
            <SnapPointMarkers furnitureGroup={furnitureGroup} />
            <GuidelineAxes />
            <TransformSnappingController />
            <SelectionController />
            <BoardSilhouetteOutline furnitureGroup={furnitureGroup} />
          </>
        )}

        {calibracion.mostrarGrilla && (
          <Grid
            renderOrder={-10}
            position={[0, -0.001, 0]}
            args={[
              Math.max(0.1, (calibracion.numeroLineasRejilla || 500) * (calibracion.distanciaCuadricula || 0.01) * 2),
              Math.max(0.1, (calibracion.numeroLineasRejilla || 500) * (calibracion.distanciaCuadricula || 0.01) * 2),
            ]}
            cellSize={calibracion.distanciaCuadricula || 0.01}
            cellThickness={calibracion.grosorGrillaDelgada || 1.0}
            cellColor={coloresApariencia.rejillaSecundaria || calibracion.colorGrillaDelgada || "#CBD5E1"}
            sectionSize={calibracion.distanciaSeccion || 0.1}
            sectionThickness={calibracion.grosorGrillaGruesa || 1.5}
            sectionColor={coloresApariencia.rejillaPrincipal || calibracion.colorGrillaGruesa || "#94A3B8"}
            fadeDistance={Math.max(100, (calibracion.numeroLineasRejilla || 500) * (calibracion.distanciaCuadricula || 0.01) * 4)}
          />
        )}
        <GroundInfiniteAxes />
        <CameraViewController furnitureGroup={furnitureGroup} controlsRef={controlsRef} />
        <BlenderNavigationController controlsRef={controlsRef} />
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          enabled={modoTransformacion !== "grab"} 
          target={[0.25, 0, -0.24]} 
          minDistance={calibracion.zoomMinimoMetros ?? 0.02} 
          maxDistance={calibracion.zoomMaximoMetros ?? 30} 
          enableDamping
          dampingFactor={0.05}
          screenSpacePanning={true}
          mouseButtons={{
            LEFT: undefined,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: undefined,
          }}
        />
        <RhinoAxisTracker onUpdate={setRhinoAxes} />
      </Canvas>

      {calibracion.mostrarIconoPlanoUniversal !== false && (
        <div className="absolute bottom-3 left-3 pointer-events-none z-10 select-none flex items-center justify-center p-1">
          <svg width="68" height="68" viewBox="0 0 68 68" className="overflow-visible">
            <line
              x1="34"
              y1="34"
              x2={34 + rhinoAxes.x.x}
              y2={34 + rhinoAxes.x.y}
              stroke={coloresApariencia.iconoPlanoUniversalX || (tema === "obsidian" ? "#94a3b8" : "#475569")}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <text
              x={34 + rhinoAxes.x.x * 1.3}
              y={34 + rhinoAxes.x.y * 1.3 + 4}
              fill={coloresApariencia.textoPrincipal || (tema === "obsidian" ? "#cbd5e1" : "#334155")}
              fontSize="11"
              fontFamily="Inter, -apple-system, sans-serif"
              fontWeight="700"
              textAnchor="middle"
            >
              x
            </text>
            <line
              x1="34"
              y1="34"
              x2={34 + rhinoAxes.y.x}
              y2={34 + rhinoAxes.y.y}
              stroke={coloresApariencia.iconoPlanoUniversalY || (tema === "obsidian" ? "#94a3b8" : "#475569")}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <text
              x={34 + rhinoAxes.y.x * 1.3}
              y={34 + rhinoAxes.y.y * 1.3 + 4}
              fill={coloresApariencia.textoPrincipal || (tema === "obsidian" ? "#cbd5e1" : "#334155")}
              fontSize="11"
              fontFamily="Inter, -apple-system, sans-serif"
              fontWeight="700"
              textAnchor="middle"
            >
              y
            </text>
            <line
              x1="34"
              y1="34"
              x2={34 + rhinoAxes.z.x}
              y2={34 + rhinoAxes.z.y}
              stroke={coloresApariencia.iconoPlanoUniversalZ || (tema === "obsidian" ? "#94a3b8" : "#475569")}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <text
              x={34 + rhinoAxes.z.x * 1.3}
              y={34 + rhinoAxes.z.y * 1.3 + 4}
              fill={coloresApariencia.textoPrincipal || (tema === "obsidian" ? "#cbd5e1" : "#334155")}
              fontSize="11"
              fontFamily="Inter, -apple-system, sans-serif"
              fontWeight="700"
              textAnchor="middle"
            >
              z
            </text>
          </svg>
        </div>
      )}

      {/* Botón Descargar GLB */}
      {resultado?.real_meshes && resultado.real_meshes.length > 0 && (
        <button
          onClick={exportToGLB}
          className="absolute bottom-3 right-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg border border-cyan-400 transition-all flex items-center gap-2 cursor-pointer hover:scale-105 z-10"
        >
          <Download className="w-3.5 h-3.5" /> Descargar GLB
        </button>
      )}
      {/* ⚡ Observador Automático de Archivos GHX en Caliente (Auto Hot-Reload) */}
      <GHXAutoWatcher />
    </div>
  );
}
