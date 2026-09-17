"use client";

import React from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { use3BFStore } from "@/lib/store";
import { extraerPiezaMadre } from "@/lib/piezaMadreUtils";
import { useMaterialPBRMaps } from "./boardMesh/useMaterialPBRMaps";
import { useBoardMeshGeometry } from "./boardMesh/useBoardMeshGeometry";
import { resolverPropiedadesMaterial } from "./boardMesh/boardMaterialResolver";
import { resolverVisibilidadBoard } from "./boardMesh/boardVisibilityRules";

export { useMaterialPBRMaps };

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

  // 1. Geometría optimizada y aristas de caja limpias
  const { customGeometry, boxMeshGeometry } = useBoardMeshGeometry(vertices, indices, grasshopperUvs, size, tipoMapeado);

  // 2. Paso activo manual
  const pasoActivoManual = React.useMemo(() => {
    return pasosManual.find((p) => p.id === pasoActivoManualId) || null;
  }, [pasosManual, pasoActivoManualId]);

  const cleanName = name.replace(/^RH_OUT:/i, "").trim();
  const piezaMadre = instanciaKey || extraerPiezaMadre(cleanName || name);

  // En modo Invertir (ocultarNoAsignadas activo), las piezas se muestran en su color y material normal
  const estaSeleccionadaEnPicking = Boolean(
    !pasoActivoManual?.ocultarNoAsignadas &&
    modoPickingManual.activo && 
    piezaMadre && 
    modoPickingManual.piezasTemporalmenteSeleccionadas.includes(piezaMadre)
  );

  const asignacionParte = asignacionesPartes[name] || asignacionesPartes[cleanName] || asignacionesPartes[`RH_OUT:${cleanName}`];
  let materialRef = asignacionParte?.materialId && asignacionParte.materialId !== "por_capa"
    ? materialesPBR.find((m) => m.id === asignacionParte.materialId)
    : null;

  const pbrMaps = useMaterialPBRMaps(
    materialRef,
    calibracion.customTextureUrl || (name.toLowerCase().includes("mdf") ? null : "/textures/Marfil_diffuse.jpg"),
    tipoMapeado,
    Boolean(grasshopperUvs && grasshopperUvs.length > 0)
  );

  const matProps = React.useMemo(() => {
    return resolverPropiedadesMaterial({
      name,
      cleanName,
      instanciaKey,
      size,
      mainColor,
      modoVisual,
      capas,
      materialesPBR,
      asignacionesPartes,
      calibracion,
      coloresApariencia,
      hasMap: pbrMaps.diffuse !== null,
      esDuplicado,
      estaSeleccionadaEnPicking,
    });
  }, [
    name,
    cleanName,
    instanciaKey,
    size,
    mainColor,
    modoVisual,
    capas,
    materialesPBR,
    asignacionesPartes,
    calibracion,
    coloresApariencia,
    pbrMaps.diffuse,
    esDuplicado,
    estaSeleccionadaEnPicking,
  ]);

  // 4. Evaluación Pura de Visibilidad y Reglas del Paso (Delegado al motor de reglas)
  const visibilidad = React.useMemo(() => {
    return resolverVisibilidadBoard({
      name,
      cleanName,
      instanciaKey,
      piezaMadre,
      pestanaActiva,
      pasoActivoManual,
      pasosManual,
      modoPickingManual,
      asignacionVisible: asignacionParte ? asignacionParte.visible !== false : true,
      capaVisible: matProps.capaAsignada ? matProps.capaAsignada.visible !== false : true,
    });
  }, [
    name,
    cleanName,
    instanciaKey,
    piezaMadre,
    pestanaActiva,
    pasoActivoManual,
    pasosManual,
    modoPickingManual,
    asignacionParte,
    matProps.capaAsignada,
  ]);

  // Si está oculta por reglas del paso, subbloque, cinemática o capa: retorno temprano limpio
  if (!visibilidad.isMeshVisible) {
    return null;
  }

  // 5. Configuración de Aristas Técnicas CAD
  const {
    finalMeshColor,
    opacity,
    transparent,
    depthWrite,
    roughness,
    metalness,
    isWireframe,
    nombreMaterialEfectivo,
    normalScaleVal,
    envMapIntensityEfectivo,
    materialPBR,
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
    esParalelepipedo,
  } = matProps;

  const debeMostrarAristas = calibracion.mostrarAristas !== false && (isWoodBoard || isHardware);
  const debeOmitirAristasPorDuplicidadCapa = isWoodBoard && (isBalance || isMdpExpuesto);
  const mostrarAristasEnEsteMesh = (debeMostrarAristas && !debeOmitirAristasPorDuplicidadCapa) || estaSeleccionadaEnPicking;
  const edgeGeometryToUse = (esParalelepipedo && boxMeshGeometry) ? boxMeshGeometry : (customGeometry || undefined);

  const activeMap = modoVisual === "renderizado" ? pbrMaps.diffuse : null;
  const activeNormal = modoVisual === "renderizado" ? pbrMaps.normal : null;
  const activeRoughness = modoVisual === "renderizado" ? pbrMaps.roughness : null;
  const activeAO = modoVisual === "renderizado" ? pbrMaps.ao : null;

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
