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

    const rotX = orientacionBanco.rotacion?.[0] || 0;
    const rotY = orientacionBanco.rotacion?.[1] || 0;
    const rotZ = orientacionBanco.rotacion?.[2] || 0;
    const apoyoEnPiso = orientacionBanco.apoyoEnPiso ?? true;

    if (rotX === 0 && rotY === 0 && rotZ === 0) {
      return {
        rotacionEfectiva: [0, 0, 0] as [number, number, number],
        posicionEfectiva: basePos,
      };
    }

    const radX = THREE.MathUtils.degToRad(rotX);
    const radY = THREE.MathUtils.degToRad(rotY);
    const radZ = THREE.MathUtils.degToRad(rotZ);
    const euler = new THREE.Euler(radX, radY, radZ, "XYZ");
    const rotMat = new THREE.Matrix4().makeRotationFromEuler(euler);

    if (!apoyoEnPiso || annotatedMeshes.length === 0) {
      return {
        rotacionEfectiva: [radX, radY, radZ] as [number, number, number],
        posicionEfectiva: basePos,
      };
    }

    // 🎯 CÁLCULO PRECISO DEL APOYO EN SUELO (Y = 0) Y CENTRADO EN BANCO
    // Si Invert Hide está activo, tomamos prioritariamente las piezas de este paso
    const piezasTarget = (pasoActivoManual?.ocultarNoAsignadas && (pasoActivoManual.piezasAsignadas?.length || 0) > 0)
      ? annotatedMeshes.filter((m: any) => {
          const ik = (m.instanciaKey || "").toLowerCase();
          const cn = (m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
          const asignadas = [...(pasoActivoManual.piezasAsignadas || []), ...(pasoActivoManual.herrajesAsignados || [])];
          return asignadas.some((p) => {
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

    // Si el paso tiene una Pieza Master asignada, medir la cota de la Master para que sea su base la que apoye en el piso Y = 0
    const masterTarget = pasoActivoManual?.piezaMaster ? pasoActivoManual.piezaMaster.toLowerCase().trim() : "";
    const mallasMaster = masterTarget
      ? piezasTarget.filter((m: any) => {
          const ik = (m.instanciaKey || "").toLowerCase();
          const cn = (m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
          return perteneceAMismaFamiliaPieza(ik, masterTarget) || perteneceAMismaFamiliaPieza(cn, masterTarget);
        })
      : [];

    const meshesParaBox = mallasMaster.length > 0 ? mallasMaster : (piezasTarget.length > 0 ? piezasTarget : annotatedMeshes);

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
        rotacionEfectiva: [radX, radY, radZ] as [number, number, number],
        posicionEfectiva: basePos,
      };
    }

    const unrotatedCenter = new THREE.Vector3();
    localBox.getCenter(unrotatedCenter);

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

    const rotatedCenter = unrotatedCenter.clone().applyMatrix4(rotMat);

    const offsetY = -minYRotado;
    const offsetX = unrotatedCenter.x - rotatedCenter.x;
    const offsetZ = unrotatedCenter.z - rotatedCenter.z;

    const finalX = basePos[0] + offsetX;
    const finalY = basePos[1] + offsetY;
    const finalZ = basePos[2] + offsetZ;

    return {
      rotacionEfectiva: [radX, radY, radZ] as [number, number, number],
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

  if (!inst.resultado?.real_meshes || inst.resultado.real_meshes.length === 0 || annotatedMeshes.length === 0) {
    return null;
  }

  const isModelCubierta = inst.definitionId.toLowerCase().includes("cubierta");
  const parentBoardGroupName = isModelCubierta ? "Cubierta" : "Tableros";
  const mainColor = inst.parametros.color_acabado || "#0088aa";

  const hasTexturedMeshes = annotatedMeshes.some((m: any) => {
    const n = m.name.toLowerCase();
    return n.includes("color") || n.includes("balance") || (n.includes("mdp") && !n.includes("nurbs"));
  });

  const hardwareMeshes = annotatedMeshes.filter((m: any) => {
    return isHardwareMeshName(m.name) || (m.instanciaKey && isHardwareMeshName(m.instanciaKey));
  });

  const boardMeshes = annotatedMeshes.filter((m: any) => {
    if (hardwareMeshes.includes(m)) return false;
    const n = m.name.toLowerCase();
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
    m.name.toLowerCase().includes("maquinados") || m.name.toLowerCase().includes("machining")
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

  return (
    <group 
      ref={meshRef} 
      position={posicionEfectiva} 
      rotation={rotacionEfectiva}
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

            // 💎 En modo cristal (semitransparente): Si la pieza cuenta con cuerpo sólido de MDP,
            // suprimir las láminas 2D redundantes (Cara B y Cara A) para evitar que se solapen 3 capas transparentes
            // en el mismo volumen físico, lo cual triplicaba la opacidad y oscurecía el fondo tornando la cuadrícula en un entramado negro.
            if (modoVisual === "semitransparente" && debeDelegarAristasAlMdp && (esBalance || !esMdpOMdf)) {
              return null;
            }

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
