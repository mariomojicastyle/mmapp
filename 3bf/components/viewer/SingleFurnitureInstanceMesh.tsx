"use client";

import React, { useRef, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { use3BFStore, ObjetoInstancia3BF } from "@/lib/store";
import { anotarInstanciasFisicas } from "@/lib/piezaMadreUtils";
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

    const cleanRealMeshes: any[] = [];
    if (rawMeshes.length <= 1) {
      cleanRealMeshes.push(...rawMeshes);
    } else {
      for (const m of rawMeshes) {
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
            return pLow === ik || pLow === cn || ik.startsWith(pLow);
          });
        })
      : annotatedMeshes;

    const meshesParaBox = piezasTarget.length > 0 ? piezasTarget : annotatedMeshes;

    const localBox = new THREE.Box3();
    for (const m of meshesParaBox) {
      if (m.vertices && m.vertices.length >= 3) {
        for (let i = 0; i < m.vertices.length; i += 3) {
          localBox.expandByPoint(new THREE.Vector3(m.vertices[i], m.vertices[i + 1], m.vertices[i + 2]));
        }
      } else if (m.position && m.size) {
        localBox.expandByPoint(new THREE.Vector3(
          m.position[0] - m.size[0] / 2,
          m.position[1] - m.size[1] / 2,
          m.position[2] - m.size[2] / 2
        ));
        localBox.expandByPoint(new THREE.Vector3(
          m.position[0] + m.size[0] / 2,
          m.position[1] + m.size[1] / 2,
          m.position[2] + m.size[2] / 2
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

  const boardMeshes = annotatedMeshes.filter((m: any) => {
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

  const hardwareMeshes = annotatedMeshes.filter((m: any) => {
    const n = m.name.toLowerCase();
    return (
      n.includes("perno") ||
      n.includes("caja") ||
      n.includes("tarugo") ||
      n.includes("cavilha") ||
      n.includes("clavilha") ||
      n.includes("tornillo") ||
      n.includes("parafuso") ||
      n.includes("soporte") ||
      n.includes("corredera") ||
      n.includes("corredi") ||
      n.includes("cantoneira") ||
      n.includes("angulo") ||
      n.includes("esquinero") ||
      n.includes("bisagra") ||
      n.includes("dobradiça") ||
      n.includes("puxador") ||
      n.includes("manija") ||
      n.includes("pes") ||
      n.includes("pés") ||
      n.includes("pata") ||
      n.includes("pie")
    ) && !n.includes("cajon") && !n.includes("cajón");
  });

  const machiningMeshes = annotatedMeshes.filter((m: any) => 
    m.name.toLowerCase().includes("maquinados") || m.name.toLowerCase().includes("machining")
  );

  const otherMeshes = annotatedMeshes.filter((m: any) => 
    !boardMeshes.includes(m) && !hardwareMeshes.includes(m) && !machiningMeshes.includes(m)
  );

  return (
    <group 
      ref={meshRef} 
      position={posicionEfectiva} 
      rotation={rotacionEfectiva}
      name={inst.nombreVisible}
    >
      {boardMeshes.length > 0 && (
        <group name={parentBoardGroupName}>
          {boardMeshes.map((m: any, idx: number) => (
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

      {machiningMeshes.length > 0 && (
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
