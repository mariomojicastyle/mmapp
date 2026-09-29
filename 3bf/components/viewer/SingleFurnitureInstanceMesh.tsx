"use client";

import React, { useRef, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { use3BFStore, ObjetoInstancia3BF } from "@/lib/store";
import { anotarInstanciasFisicas, perteneceAMismaFamiliaPieza, extraerPiezaMadre } from "@/lib/piezaMadreUtils";
import { isHardwareMeshName, coincidenMismoHerraje } from "@/lib/engine/cadStateUtils";
import BoardMesh from "./BoardMesh";

export interface SingleFurnitureInstanceMeshProps {
  inst: ObjetoInstancia3BF;
  isSelected: boolean;
  setFurnitureGroup?: (g: THREE.Group | null) => void;
  mostrarDuplicadosRojos?: boolean;
}

export function SingleFurnitureInstanceMesh({ 
  inst, 
  isSelected, 
  setFurnitureGroup,
  mostrarDuplicadosRojos = true,
}: SingleFurnitureInstanceMeshProps) {
  const { 
    modoVisual, 
    posicionObjeto, 
    modoTransformacion,
    pestanaActiva,
    pasosManual,
    pasoActivoManualId,
  } = use3BFStore();
  const meshRef = useRef<THREE.Group>(null);

  const pasoActivoManual = useMemo(() => {
    return pasosManual.find((p) => p.id === pasoActivoManualId);
  }, [pasosManual, pasoActivoManualId]);

  const orientacionBanco = useMemo(() => {
    if (pestanaActiva !== "manual" || !pasoActivoManual || pasoActivoManual.tipo === "showcase") {
      return null;
    }
    return pasoActivoManual.orientacionBanco || null;
  }, [pestanaActiva, pasoActivoManual]);

  useEffect(() => {
    if (isSelected && meshRef.current && setFurnitureGroup) {
      setFurnitureGroup(meshRef.current);
    }
  }, [isSelected, inst.resultado, setFurnitureGroup]);

  // Registro de grupo de instancia para detección de snapping inter-geometrías
  useEffect(() => {
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

  // 🛡️ Deduplicador espacial defensivo y anotación física (incondicional antes de cualquier return)
  const annotatedMeshes = useMemo(() => {
    const rawMeshes = inst.resultado?.real_meshes || [];
    if (rawMeshes.length === 0) return [];

    // 🪵 DfMA Board Dimension Preservation
    const processedRawMeshes = rawMeshes;

    const cleanRealMeshes: any[] = [];
    if (processedRawMeshes.length <= 1) {
      cleanRealMeshes.push(...processedRawMeshes);
    } else {
      for (const m of processedRawMeshes) {
        if (m.es_duplicado_ghx) {
          if (mostrarDuplicadosRojos) {
            cleanRealMeshes.push(m);
          }
          continue;
        }
        const mName = (m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
        const mPos = m.position || [0, 0, 0];
        const mSize = m.size || [0, 0, 0];

        const isDup = cleanRealMeshes.some((u) => {
          const uName = (u.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
          if (mName !== uName) return false;
          const uPos = u.position || [0, 0, 0];
          const uSize = u.size || [0, 0, 0];

          const dPos = Math.hypot(mPos[0] - uPos[0], mPos[1] - uPos[1], mPos[2] - uPos[2]);
          const dSize = Math.hypot(mSize[0] - uSize[0], mSize[1] - uSize[1], mSize[2] - uSize[2]);
          return dPos < 0.0005 && dSize < 0.0005;
        });

        if (isDup) {
          if (mostrarDuplicadosRojos) {
            cleanRealMeshes.push({ ...m, es_duplicado_ghx: true });
          }
        } else {
          cleanRealMeshes.push(m);
        }
      }
    }

    return anotarInstanciasFisicas(cleanRealMeshes);
  }, [inst.resultado?.real_meshes, mostrarDuplicadosRojos]);

  // ⚡ Sincronización de montaje de mallas: Notificar al motor de cinemática para aplicar clips t=0
  useEffect(() => {
    if (annotatedMeshes.length > 0) {
      use3BFStore.getState().despertarAnimacionManual();
    }
  }, [annotatedMeshes.length]);

  // 📐 Cálculo de Orientación en Banco de Trabajo y Apoyo Físico en Suelo (Y = 0)
  const { rotacionEfectiva, posicionEfectiva } = useMemo(() => {
    const basePos: [number, number, number] = isSelected && modoTransformacion === "grab" 
      ? posicionObjeto 
      : (inst.posicion || [0, 0, 0]);

    if (!orientacionBanco) {
      const defaultRot: [number, number, number] = (inst.rotacion as any) || [0, 0, 0];
      return {
        rotacionEfectiva: defaultRot,
        posicionEfectiva: basePos,
      };
    }

    const rotX = orientacionBanco.rotacion?.[0] || 0; // Giro en X (Taller / Rhino)
    const rotY = orientacionBanco.rotacion?.[1] || 0; // Giro en Y (Taller / Rhino: Longitudinal -> Three.js Z)
    const rotZ = orientacionBanco.rotacion?.[2] || 0; // Giro en Z (Taller / Rhino: Vertical -> Three.js Y)
    const apoyoEnPiso = orientacionBanco.apoyoEnPiso ?? true;
    const alturaZCm = pasoActivoManual?.multiplePlus?.alturaZCm ?? pasoActivoManual?.orientacionBanco?.alturaZCm ?? 0;
    const alturaZM = alturaZCm / 100;

    if (rotX === 0 && rotY === 0 && rotZ === 0 && !apoyoEnPiso && alturaZM === 0) {
      return {
        rotacionEfectiva: [0, 0, 0] as [number, number, number],
        posicionEfectiva: basePos,
      };
    }

    // 🧭 TRADUCTOR MENTAL CANÓNICO: Ejes de Taller (Rhino Z-Up) -> Three.js (Y-Up)
    // - Giro en X (Rhino) -> Eje transversal X en Three.js
    // - Giro en Y (Rhino longitudinal) -> Eje longitudinal Z en Three.js
    // - Giro en Z (Rhino vertical) -> Eje vertical Y en Three.js
    const radThreeX = THREE.MathUtils.degToRad(rotX);
    const radThreeY = THREE.MathUtils.degToRad(rotZ);
    const radThreeZ = -THREE.MathUtils.degToRad(rotY);
    const euler = new THREE.Euler(radThreeX, radThreeY, radThreeZ, "XYZ");
    const rotMat = new THREE.Matrix4().makeRotationFromEuler(euler);

    if (annotatedMeshes.length === 0) {
      return {
        rotacionEfectiva: [radThreeX, radThreeY, radThreeZ] as [number, number, number],
        posicionEfectiva: [basePos[0], basePos[1] + alturaZM, basePos[2]] as [number, number, number],
      };
    }

    // 🎯 NORMA CANÓNICA DE EJES PASANDO POR EL CENTRO DE GRAVEDAD (CDG):
    // 1. Extraer todas las piezas y herrajes asignados del paso activo (capas Múltiple Plus o clásico)
    const asignadasClasicas = [
      ...(pasoActivoManual?.piezasAsignadas || []),
      ...(pasoActivoManual?.herrajesAsignados || []),
    ];
    const asignadasPlus: string[] = [];

    if (pasoActivoManual?.multiplePlus?.capas) {
      pasoActivoManual.multiplePlus.capas.forEach((c: any) => {
        (c.tableros || []).forEach((t: any) => asignadasPlus.push(t.id));
        (c.herrajes || []).forEach((h: any) => asignadasPlus.push(h.id));
        (c.congelados || []).forEach((h: any) => asignadasPlus.push(h.id));
      });
    }

    const todasAsignadas = asignadasPlus.length > 0 ? asignadasPlus : asignadasClasicas;

    // 2. Filtrar las mallas que pertenecen al ensamble / bloque funcional del paso activo
    const piezasTarget = (todasAsignadas.length > 0)
      ? annotatedMeshes.filter((m: any) => {
          const ik = (m.instanciaKey || "").toLowerCase();
          const cn = (m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
          return todasAsignadas.some((p) => {
            const pLow = p.toLowerCase();
            return (
              pLow === ik ||
              pLow === cn ||
              ik.startsWith(pLow) ||
              coincidenMismoHerraje(p, ik) ||
              coincidenMismoHerraje(p, cn)
            );
          });
        })
      : annotatedMeshes;

    // 3. Para definir el Centro de Gravedad y la caja envolvente del ensamble, priorizar los tableros estructurales
    const mallasCandidatas = piezasTarget.length > 0 ? piezasTarget : annotatedMeshes;
    const mallasTableros = mallasCandidatas.filter((m: any) => {
      const n = (m.name || "").toLowerCase();
      const ik = (m.instanciaKey || "").toLowerCase();
      return !isHardwareMeshName(n) && !isHardwareMeshName(ik);
    });

    const meshesParaBox = mallasTableros.length > 0 ? mallasTableros : mallasCandidatas;

    const localBox = new THREE.Box3();
    for (const m of meshesParaBox) {
      const pX = m.position ? m.position[0] : 0;
      const pY = m.position ? m.position[1] : 0;
      const pZ = m.position ? m.position[2] : 0;

      if (m.vertices && m.vertices.length >= 3) {
        for (let i = 0; i < m.vertices.length; i += 3) {
          localBox.expandByPoint(new THREE.Vector3(
            pX + m.vertices[i],
            pY + m.vertices[i + 1],
            pZ + m.vertices[i + 2]
          ));
        }
      } else if (m.position && m.size) {
        localBox.expandByPoint(new THREE.Vector3(
          pX - m.size[0] / 2,
          pY - m.size[1] / 2,
          pZ - m.size[2] / 2
        ));
        localBox.expandByPoint(new THREE.Vector3(
          pX + m.size[0] / 2,
          pY + m.size[1] / 2,
          pZ + m.size[2] / 2
        ));
      }
    }

    if (localBox.isEmpty()) {
      return {
        rotacionEfectiva: [radThreeX, radThreeY, radThreeZ] as [number, number, number],
        posicionEfectiva: [basePos[0], basePos[1] + alturaZM, basePos[2]] as [number, number, number],
      };
    }

    // 🎯 CENTRO DE GRAVEDAD (CDG) EXACTO DEL BLOQUE O CONJUNTO
    const unrotatedCenter = new THREE.Vector3();
    localBox.getCenter(unrotatedCenter);

    // 🌟 AJUSTE DEL EJE DE ROTACIÓN: Subir el eje de rotación unos 30 cm (configurable desde la UI)
    const offsetEjeCm = pasoActivoManual?.multiplePlus?.offsetEjeRotacionCm ?? 30;
    const offsetEjeM = (offsetEjeCm !== undefined ? offsetEjeCm : 30) / 100;

    const ejePivote = unrotatedCenter.clone();
    ejePivote.y += offsetEjeM;

    const corners: THREE.Vector3[] = [
      new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.min.z),
      new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.max.z),
      new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.min.z),
      new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.max.z),
      new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.min.z),
      new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.max.z),
      new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.min.z),
      new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.max.z),
    ];

    let minYRotado = Infinity;
    for (const c of corners) {
      const cRot = c.clone().applyMatrix4(rotMat);
      if (cRot.y < minYRotado) {
        minYRotado = cRot.y;
      }
    }

    const rotatedPivot = ejePivote.clone().applyMatrix4(rotMat);

    // ⚖️ APLICACIÓN DE LA NORMA: Los ejes de rotación X e Y pasan por el ejePivote elevado (+30 cm)
    // offsetX y offsetZ cancelan el desplazamiento horizontal para que el eje permanezca invariante
    const offsetX = ejePivote.x - rotatedPivot.x;
    const offsetZ = ejePivote.z - rotatedPivot.z;

    // Si apoyoEnPiso está activo, compensamos verticalmente para asentar el punto más bajo en Y = 0 (más elevación alturaZM)
    // Si no está activo, la rotación en altura es puramente sobre el eje elevado (más elevación alturaZM)
    const offsetY = (apoyoEnPiso ? -minYRotado : (ejePivote.y - rotatedPivot.y)) + alturaZM;

    const finalX = basePos[0] + offsetX;
    const finalY = basePos[1] + offsetY;
    const finalZ = basePos[2] + offsetZ;

    return {
      rotacionEfectiva: [radThreeX, radThreeY, radThreeZ] as [number, number, number],
      posicionEfectiva: [finalX, finalY, finalZ] as [number, number, number],
    };
  }, [
    isSelected,
    modoTransformacion,
    posicionObjeto,
    inst.posicion,
    inst.rotacion,
    orientacionBanco,
    pasoActivoManual,
    annotatedMeshes,
  ]);

  // 🛡️ Sincronización incondicional de posición y rotación al cambiar entre Visor 3D y Manual 3D
  useEffect(() => {
    if (!meshRef.current) return;
    if (pestanaActiva !== "manual") {
      // En Visor 3D, Despiece o Base de Datos: EL MUEBLE ESTÁ SIEMPRE DE PIE (0°) EN SU POSICIÓN BASE
      const basePos = (inst.posicion || [0, 0, 0]) as [number, number, number];
      meshRef.current.position.set(basePos[0], basePos[1], basePos[2]);
      if (inst.rotacion) {
        const radX = THREE.MathUtils.degToRad(inst.rotacion[0] || 0);
        const radY = THREE.MathUtils.degToRad(inst.rotacion[1] || 0);
        const radZ = THREE.MathUtils.degToRad(inst.rotacion[2] || 0);
        meshRef.current.quaternion.setFromEuler(new THREE.Euler(radX, radY, radZ, "XYZ"));
      } else {
        meshRef.current.quaternion.set(0, 0, 0, 1);
      }
      meshRef.current.updateMatrix();
      meshRef.current.updateMatrixWorld(true);
    } else {
      // En Manual 3D: aplicar posicionEfectiva y rotacionEfectiva del paso activo solo si NO estamos en animación de regreso/de pie
      const s = use3BFStore.getState();
      const tienePonerDePie = Boolean(pasoActivoManual?.multiplePlus?.ponerDePieAlFinal);
      const estaEnAnimacionDePie = tienePonerDePie && Boolean(s.isTimelinePlaying || (s.timelineCurrentTime && s.timelineCurrentTime > 0.05));
      if (!estaEnAnimacionDePie) {
        meshRef.current.position.set(posicionEfectiva[0], posicionEfectiva[1], posicionEfectiva[2]);
        const euler = new THREE.Euler(rotacionEfectiva[0], rotacionEfectiva[1], rotacionEfectiva[2], "XYZ");
        meshRef.current.quaternion.setFromEuler(euler);
        meshRef.current.updateMatrix();
        meshRef.current.updateMatrixWorld(true);
      }
    }
  }, [pestanaActiva, posicionEfectiva, rotacionEfectiva, inst.posicion, inst.rotacion]);

  const resolverTipoMapeado = useCallback((meshName: string) => {
    const norm = (meshName || "").toLowerCase();
    if (norm.includes("cubierta") || norm.includes("tapa")) {
      return inst.parametros?.tipo_mapeado_cubierta || "Longitudinal";
    }
    if (norm.includes("entrepanio") || norm.includes("entrepaño") || norm.includes("estante") || norm.includes("prateleira")) {
      return inst.parametros?.tipo_mapeado_entrepanio || "Longitudinal";
    }
    return "Longitudinal";
  }, [inst.parametros?.tipo_mapeado_cubierta, inst.parametros?.tipo_mapeado_entrepanio]);

  const isModelCubierta = inst.definitionId?.toLowerCase().includes("cubierta");
  const parentBoardGroupName = isModelCubierta ? "Cubierta" : "Tableros";
  const mainColor = inst.parametros?.color_acabado || "#0088aa";

  const hasTexturedMeshes = annotatedMeshes.some((m: any) => {
    const n = m.name?.toLowerCase() || "";
    return n.includes("color") || n.includes("balance") || (n.includes("mdp") && !n.includes("nurbs"));
  });

  const hardwareMeshes = annotatedMeshes.filter((m: any) => {
    return isHardwareMeshName(m.name) || (m.instanciaKey && isHardwareMeshName(m.instanciaKey));
  });

  const boardMeshes = annotatedMeshes.filter((m: any) => {
    if (hardwareMeshes.includes(m)) return false;
    const n = (m.name || "").toLowerCase();
    if (hasTexturedMeshes && (n.includes("nurbs") || m.is_nurbs_solid)) {
      return false;
    }
    return (
      n.includes("cubierta") ||
      n.includes("frente") ||
      n.includes("lateral") ||
      n.includes("posterior") ||
      n.includes("cajon") ||
      n.includes("cajón") ||
      n.includes("mdp") ||
      n.includes("balance") ||
      n.includes("entrepaño") ||
      n.includes("madera") ||
      n.includes("board") ||
      n.includes("panel") ||
      n.includes("tablero") ||
      n.includes("peça") ||
      n.includes("peca") ||
      n.includes("pk") ||
      n.includes("puerta") ||
      n.includes("porta") ||
      n.includes("division") ||
      n.includes("divisao") ||
      n.includes("costado") ||
      n.includes("fondo") ||
      n.includes("fundo")
    );
  });

  const machiningMeshes = annotatedMeshes.filter((m: any) => 
    (m.name || "").toLowerCase().includes("maquinados") || (m.name || "").toLowerCase().includes("machining")
  );

  const otherMeshes = annotatedMeshes.filter((m: any) => {
    if (boardMeshes.includes(m) || hardwareMeshes.includes(m) || machiningMeshes.includes(m)) return false;
    // Omitir únicamente si no tiene vértices reales y sus dimensiones son nulas
    const hasValidVerts = m.vertices && m.vertices.length >= 9;
    if (!hasValidVerts && (!m.size || (m.size[0] <= 0.0005 && m.size[1] <= 0.0005 && m.size[2] <= 0.0005))) return false;
    return true;
  });

  // 📐 Detección de tableros cuya Cara A es una lámina superficial plana (< 5mm) y delegan sus aristas 3D de caja al MDP
  const piezasConAristasEnMdp = useMemo(() => {
    const mapa = new Map<string, { tieneLaminaPlana: boolean; tieneMdpSolido: boolean }>();
    for (const m of boardMeshes) {
      const pm = (m.instanciaKey || extraerPiezaMadre((m.name || "").replace(/^RH_OUT:/i, "").trim())).toLowerCase();
      if (!mapa.has(pm)) {
        mapa.set(pm, { tieneLaminaPlana: false, tieneMdpSolido: false });
      }
      const entry = mapa.get(pm)!;
      const nLow = (m.name || "").toLowerCase();
      const minDim = m.size ? Math.min(m.size[0], m.size[1], m.size[2]) : 0;
      
      const esMdpOMdf = nLow.includes("mdp") || nLow.includes("mdf");
      const esBalance = nLow.includes("balance") || nLow.endsWith(" b");
      
      if (!esMdpOMdf && !esBalance) {
        if (minDim < 0.005) {
          entry.tieneLaminaPlana = true;
        }
      } else if (esMdpOMdf) {
        if (minDim >= 0.005) {
          entry.tieneMdpSolido = true;
        }
      }
    }
    
    const setMadresConMdpAristas = new Set<string>();
    mapa.forEach((val, pm) => {
      if (val.tieneLaminaPlana && val.tieneMdpSolido) {
        setMadresConMdpAristas.add(pm);
      }
    });
    return setMadresConMdpAristas;
  }, [boardMeshes]);

  // 🛡️ Salida defensiva segura: Se evalúa DESPUÉS de todos los hooks de React
  if (!inst.resultado?.real_meshes || inst.resultado.real_meshes.length === 0 || annotatedMeshes.length === 0) {
    return null;
  }

  return (
    <group 
      ref={meshRef} 
      position={pestanaActiva === "manual" ? undefined : posicionEfectiva} 
      rotation={pestanaActiva === "manual" ? undefined : rotacionEfectiva}
      name={inst.nombreVisible}
    >
      {boardMeshes.length > 0 && (
        <group name={parentBoardGroupName}>
          {boardMeshes.map((m: any, idx: number) => {
            const pm = (m.instanciaKey || extraerPiezaMadre((m.name || "").replace(/^RH_OUT:/i, "").trim())).toLowerCase();
            const debeDelegarAristasAlMdp = piezasConAristasEnMdp.has(pm);
            const nLow = (m.name || "").toLowerCase();
            const esMdpOMdf = nLow.includes("mdp") || nLow.includes("mdf");
            const esBalance = nLow.includes("balance") || nLow.endsWith(" b");

            const omitirAristas = debeDelegarAristasAlMdp && !esMdpOMdf && !esBalance;
            const forzarAristasCaja = debeDelegarAristasAlMdp && esMdpOMdf;

            return (
              <BoardMesh
                key={`board-${idx}`}
                instanciaId={inst.id}
                instanciaKey={m.instanciaKey}
                position={m.position}
                size={m.size}
                name={m.name}
                mainColor={mainColor}
                modoVisual={modoVisual}
                vertices={m.vertices}
                indices={m.indices}
                uvs={m.uvs}
                tipoMapeado={resolverTipoMapeado(m.name)}
                esDuplicado={Boolean(m.es_duplicado_ghx)}
                omitirAristas={omitirAristas}
                forzarAristasCaja={forzarAristasCaja}
              />
            );
          })}
        </group>
      )}

      {hardwareMeshes.length > 0 && (
        <group name="Herrajes">
          {hardwareMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`hardware-${idx}`}
              instanciaId={inst.id}
              instanciaKey={m.instanciaKey}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={resolverTipoMapeado(m.name)}
              esDuplicado={Boolean(m.es_duplicado_ghx)}
            />
          ))}
        </group>
      )}

      {pestanaActiva !== "manual" && machiningMeshes.length > 0 && (
        <group name="Maquinados">
          {machiningMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`machining-${idx}`}
              instanciaId={inst.id}
              instanciaKey={m.instanciaKey}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={resolverTipoMapeado(m.name)}
              esDuplicado={Boolean(m.es_duplicado_ghx)}
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
              instanciaKey={m.instanciaKey}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={resolverTipoMapeado(m.name)}
              esDuplicado={Boolean(m.es_duplicado_ghx)}
            />
          ))}
        </group>
      )}
    </group>
  );
}

export default SingleFurnitureInstanceMesh;
