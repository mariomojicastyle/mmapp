"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { Crosshair, X, Eye, ArrowRight, RotateCcw, ArrowDown, ChevronLeft, ChevronRight, Sliders, Layers } from "lucide-react";
import { TableroCapaPlus, TableroKeyframePos, TableroKeyframeRot } from "@/lib/storeTypes";
import { use3BFStore } from "@/lib/store";
import { extraerPiezaMadre } from "@/lib/piezaMadreUtils";

/**
 * Calcula el offset vertical efectivo del contenedor del mueble (SingleFurnitureInstanceMesh)
 */
function calcularOffsetContenedorMueble(
  meshes: any[],
  paso: any,
  instPosicionY: number = 0
): number {
  if (!paso) return instPosicionY;

  const orientacionBanco = paso.orientacionBanco || paso.multiplePlus?.orientacionBanco;
  const apoyoEnPiso = orientacionBanco?.apoyoEnPiso ?? true;
  const alturaZCm = paso.multiplePlus?.alturaZCm ?? orientacionBanco?.alturaZCm ?? 0;
  const alturaZM = alturaZCm / 100;
  const rotBanco = orientacionBanco?.rotacion || [0, 0, 0];

  const rotX = rotBanco[0] || 0;
  const rotY = rotBanco[1] || 0;
  const rotZ = rotBanco[2] || 0;

  if (rotX === 0 && rotY === 0 && rotZ === 0 && !apoyoEnPiso && alturaZM === 0) {
    return instPosicionY;
  }

  const radThreeX = THREE.MathUtils.degToRad(rotX);
  const radThreeY = THREE.MathUtils.degToRad(rotZ);
  const radThreeZ = -THREE.MathUtils.degToRad(rotY);
  const euler = new THREE.Euler(radThreeX, radThreeY, radThreeZ, "XYZ");
  const rotMat = new THREE.Matrix4().makeRotationFromEuler(euler);

  const piezasTarget = paso.piezasAsignadas || [];
  const mallasCandidatas = piezasTarget.length > 0
    ? meshes.filter((m: any) => {
        const cn = (m.cleanName || m.name || "").toLowerCase().trim();
        const ik = (m.instanciaKey || "").toLowerCase().trim();
        return piezasTarget.some((p: string) => {
          const pLow = p.toLowerCase().trim();
          return cn === pLow || ik === pLow || cn.includes(pLow) || pLow.includes(cn);
        });
      })
    : meshes;

  const mallasTableros = mallasCandidatas.filter((m: any) => {
    const n = (m.name || "").toLowerCase();
    const ik = (m.instanciaKey || "").toLowerCase();
    return !n.includes("tornillo") && !n.includes("corre") && !n.includes("herraje") && !ik.includes("tornillo");
  });

  const meshesParaBox = mallasTableros.length > 0 ? mallasTableros : mallasCandidatas;
  if (meshesParaBox.length === 0) return instPosicionY + alturaZM;

  const localBox = new THREE.Box3();
  for (const m of meshesParaBox) {
    const [pX, pY, pZ] = m.position || [0, 0, 0];
    const [sx, sy, sz] = m.size || [0.4, 0.4, 0.015];
    localBox.expandByPoint(new THREE.Vector3(pX - sx / 2, pY - sy / 2, pZ - sz / 2));
    localBox.expandByPoint(new THREE.Vector3(pX + sx / 2, pY + sy / 2, pZ + sz / 2));
  }

  if (localBox.isEmpty()) return instPosicionY + alturaZM;

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
    if (cRot.y < minYRotado) minYRotado = cRot.y;
  }

  const unrotatedCenter = new THREE.Vector3();
  localBox.getCenter(unrotatedCenter);
  const offsetEjeCm = paso.multiplePlus?.offsetEjeRotacionCm ?? 30;
  const ejePivote = unrotatedCenter.clone();
  ejePivote.y += offsetEjeCm / 100;
  const rotatedPivot = ejePivote.clone().applyMatrix4(rotMat);

  const offsetY = (apoyoEnPiso ? -minYRotado : (ejePivote.y - rotatedPivot.y)) + alturaZM;
  return instPosicionY + offsetY;
}

/**
 * Calcula con precisión submilimétrica la distancia vertical (en cm) requerida para
 * que la cara inferior del tablero rotado descanse exactamente al ras del suelo (Y = 0).
 */
function calcularSueloTablero(
  tableroId: string,
  rotacionGrados: [number, number, number],
  meshes: any[],
  paso?: any,
  instPosicionY: number = 0
): number {
  const tLow = tableroId.toLowerCase().trim();
  const tMadre = extraerPiezaMadre(tLow).toLowerCase().trim();

  const meshData = meshes.find((m: any) => {
    const cn = (m.cleanName || m.name || "").toLowerCase().trim();
    const pm = (m.piezaMadre || extraerPiezaMadre(cn)).toLowerCase().trim();
    const ik = (m.instanciaKey || "").toLowerCase().trim();
    return cn === tLow || pm === tLow || ik === tLow || (tMadre && (pm === tMadre || cn === tMadre));
  });

  if (!meshData || !meshData.position) return 0;

  const [, pY] = meshData.position;
  const size = meshData.size || [0.4, 0.4, 0.015];
  const [sx, sy, sz] = size;

  const radX = THREE.MathUtils.degToRad(rotacionGrados[0] || 0);
  const radY = THREE.MathUtils.degToRad(rotacionGrados[1] || 0);
  const radZ = THREE.MathUtils.degToRad(rotacionGrados[2] || 0);
  const rotMat = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(radX, radY, radZ, "XYZ"));

  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;

  const corners = [
    new THREE.Vector3(-hx, -hy, -hz),
    new THREE.Vector3(-hx, -hy, hz),
    new THREE.Vector3(-hx, hy, -hz),
    new THREE.Vector3(-hx, hy, hz),
    new THREE.Vector3(hx, -hy, -hz),
    new THREE.Vector3(hx, -hy, hz),
    new THREE.Vector3(hx, hy, -hz),
    new THREE.Vector3(hx, hy, hz),
  ];

  let minYRot = Infinity;
  for (const c of corners) {
    c.applyMatrix4(rotMat);
    if (c.y < minYRot) minYRot = c.y;
  }

  const containerWorldY = calcularOffsetContenedorMueble(meshes, paso, instPosicionY);
  const cotaInferiorM_World = containerWorldY + (pY + minYRot);
  return Math.round(-cotaInferiorM_World * 100 * 10) / 10;
}

/**
 * Evalúa la posición interpolada de un tablero en el tiempo t
 */
function evaluarPosEnTiempo(kfs: TableroKeyframePos[], t: number): { x: number; y: number; z: number } {
  if (!kfs || kfs.length === 0) return { x: 0, y: 0, z: 0 };
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  if (sorted.length === 1 || t <= sorted[0].t) {
    return { x: sorted[0].x, y: sorted[0].y, z: sorted[0].z };
  }
  const lastK = sorted[sorted.length - 1];
  if (t >= lastK.t) {
    return { x: lastK.x, y: lastK.y, z: lastK.z };
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const kA = sorted[i];
    const kB = sorted[i + 1];
    if (t >= kA.t && t <= kB.t) {
      const alpha = (t - kA.t) / Math.max(0.0001, kB.t - kA.t);
      return {
        x: Math.round((kA.x + (kB.x - kA.x) * alpha) * 10) / 10,
        y: Math.round((kA.y + (kB.y - kA.y) * alpha) * 10) / 10,
        z: Math.round((kA.z + (kB.z - kA.z) * alpha) * 10) / 10,
      };
    }
  }
  return { x: lastK.x, y: lastK.y, z: lastK.z };
}

/**
 * Evalúa la rotación interpolada de un tablero en el tiempo t
 */
function evaluarRotEnTiempo(kfs: TableroKeyframeRot[], t: number): { rx: number; ry: number; rz: number } {
  if (!kfs || kfs.length === 0) return { rx: 0, ry: 0, rz: 0 };
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  if (sorted.length === 1 || t <= sorted[0].t) {
    return { rx: sorted[0].rx, ry: sorted[0].ry, rz: sorted[0].rz };
  }
  const lastK = sorted[sorted.length - 1];
  if (t >= lastK.t) {
    return { rx: lastK.rx, ry: lastK.ry, rz: lastK.rz };
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const kA = sorted[i];
    const kB = sorted[i + 1];
    if (t >= kA.t && t <= kB.t) {
      const alpha = (t - kA.t) / Math.max(0.0001, kB.t - kA.t);
      return {
        rx: Math.round((kA.rx + (kB.rx - kA.rx) * alpha) * 10) / 10,
        ry: Math.round((kA.ry + (kB.ry - kA.ry) * alpha) * 10) / 10,
        rz: Math.round((kA.rz + (kB.rz - kA.rz) * alpha) * 10) / 10,
      };
    }
  }
  return { rx: lastK.rx, ry: lastK.ry, rz: lastK.rz };
}

interface CapsulaTableroPlusProps {
  tablero: TableroCapaPlus;
  capaId: string;
  pasoId: string;
  opcionesDestino: Array<{ id: string; label: string; esHeredado?: boolean }>;
  estaPosicionando: boolean;
  onHover: (mallas: string[] | null) => void;
  onActualizar: (tableroId: string, partial: Partial<TableroCapaPlus>) => void;
  onRemover: (tableroId: string) => void;
  onTogglePosicionar: (tableroId: string) => void;
}

export function CapsulaTableroPlus({
  tablero,
  capaId,
  pasoId,
  opcionesDestino,
  estaPosicionando,
  onHover,
  onActualizar,
  onRemover,
  onTogglePosicionar,
}: CapsulaTableroPlusProps) {
  const { resultado, instancias, objetoActivoId, pasosManual, timelineCurrentTime, setTimelineCurrentTime } = use3BFStore();
  const [mostrarPanelGizmo, setMostrarPanelGizmo] = useState(false);

  // Redondear el tiempo actual del visor 3D para evaluar fotogramas clave
  const tActual = useMemo(() => Math.round((timelineCurrentTime || 0) * 10) / 10, [timelineCurrentTime]);

  // Fotogramas clave existentes
  const keyframesPos = useMemo<TableroKeyframePos[]>(() => {
    if (tablero.keyframesPos && tablero.keyframesPos.length > 0) {
      return [...tablero.keyframesPos].sort((a, b) => a.t - b.t);
    }
    // Estado inicial por defecto si aún no hay lista explícita
    return [
      {
        t: 0.0,
        x: tablero.offsetXCm || 0,
        y: tablero.elevacionZCm ?? tablero.offsetYCm ?? 0,
        z: tablero.offsetZCm || 0,
      },
    ];
  }, [tablero.keyframesPos, tablero.offsetXCm, tablero.elevacionZCm, tablero.offsetYCm, tablero.offsetZCm]);

  const keyframesRot = useMemo<TableroKeyframeRot[]>(() => {
    if (tablero.keyframesRot && tablero.keyframesRot.length > 0) {
      return [...tablero.keyframesRot].sort((a, b) => a.t - b.t);
    }
    return [
      {
        t: 0.0,
        rx: 0,
        ry: 0,
        rz: 0,
      },
    ];
  }, [tablero.keyframesRot]);

  // Buscar si hay un fotograma activo exactamente en tActual (tolerancia +/- 0.2s)
  const kfPosActivo = useMemo(() => {
    return keyframesPos.find((k) => Math.abs(k.t - tActual) <= 0.2);
  }, [keyframesPos, tActual]);

  const kfRotActivo = useMemo(() => {
    return keyframesRot.find((k) => Math.abs(k.t - tActual) <= 0.2);
  }, [keyframesRot, tActual]);

  // Valores de los inputs según el fotograma activo o la pose en reposo
  const [inputX, setInputX] = useState<number>(0);
  const [inputY, setInputY] = useState<number>(0);
  const [inputZ, setInputZ] = useState<number>(0);

  const [inputRotX, setInputRotX] = useState<number>(0);
  const [inputRotY, setInputRotY] = useState<number>(0);
  const [inputRotZ, setInputRotZ] = useState<number>(0);

  // Sincronizar inputs al cambiar de fotograma o de tiempo interpolado
  useEffect(() => {
    if (kfPosActivo) {
      setInputX(kfPosActivo.x);
      setInputY(kfPosActivo.y);
      setInputZ(kfPosActivo.z);
    } else {
      const p = evaluarPosEnTiempo(keyframesPos, tActual);
      setInputX(p.x);
      setInputY(p.y);
      setInputZ(p.z);
    }
  }, [kfPosActivo, keyframesPos, tActual]);

  useEffect(() => {
    if (kfRotActivo) {
      setInputRotX(kfRotActivo.rx);
      setInputRotY(kfRotActivo.ry);
      setInputRotZ(kfRotActivo.rz);
    } else {
      const r = evaluarRotEnTiempo(keyframesRot, tActual);
      setInputRotX(r.rx);
      setInputRotY(r.ry);
      setInputRotZ(r.rz);
    }
  }, [kfRotActivo, keyframesRot, tActual]);

  // Al desmontar, limpiar hover
  useEffect(() => {
    return () => {
      onHover(null);
    };
  }, [onHover]);

  // ── TOGGLE FOTOGRAMA DE DESPLAZAMIENTO (CapCut Diamond) ──
  const toggleKeyframePos = useCallback(() => {
    const lista = [...keyframesPos];
    const idx = lista.findIndex((k) => Math.abs(k.t - tActual) <= 0.25);

    if (idx >= 0) {
      if (lista[idx].t !== 0.0) {
        lista.splice(idx, 1);
        const p = evaluarPosEnTiempo(lista, tActual);
        setInputX(p.x);
        setInputY(p.y);
        setInputZ(p.z);
      }
    } else {
      lista.push({
        t: tActual,
        x: inputX,
        y: inputY,
        z: inputZ,
      });
      lista.sort((a, b) => a.t - b.t);
    }

    onActualizar(tablero.id, {
      keyframesPos: lista,
    });
  }, [keyframesPos, tActual, inputX, inputY, inputZ, tablero.id, onActualizar]);

  // ── TOGGLE FOTOGRAMA DE ROTACIÓN (CapCut Diamond) ──
  const toggleKeyframeRot = useCallback(() => {
    const lista = [...keyframesRot];
    const idx = lista.findIndex((k) => Math.abs(k.t - tActual) <= 0.25);

    if (idx >= 0) {
      if (lista[idx].t !== 0.0) {
        lista.splice(idx, 1);
        const r = evaluarRotEnTiempo(lista, tActual);
        setInputRotX(r.rx);
        setInputRotY(r.ry);
        setInputRotZ(r.rz);
      }
    } else {
      lista.push({
        t: tActual,
        rx: inputRotX,
        ry: inputRotY,
        rz: inputRotZ,
      });
      lista.sort((a, b) => a.t - b.t);
    }

    onActualizar(tablero.id, {
      keyframesRot: lista,
    });
  }, [keyframesRot, tActual, inputRotX, inputRotY, inputRotZ, tablero.id, onActualizar]);

  // ── ELIMINAR FOTOGRAMA CLAVE ESPECÍFICO (Desde la píldora) ──
  const eliminarFotogramaEnTiempo = useCallback(
    (tAEliminar: number) => {
      if (tAEliminar === 0.0) return;
      const nuevasPos = keyframesPos.filter((k) => Math.abs(k.t - tAEliminar) > 0.15);
      const nuevasRot = keyframesRot.filter((k) => Math.abs(k.t - tAEliminar) > 0.15);

      onActualizar(tablero.id, {
        keyframesPos: nuevasPos,
        keyframesRot: nuevasRot,
      });

      if (Math.abs(tActual - tAEliminar) <= 0.25) {
        const p = evaluarPosEnTiempo(nuevasPos, tActual);
        setInputX(p.x);
        setInputY(p.y);
        setInputZ(p.z);
        const r = evaluarRotEnTiempo(nuevasRot, tActual);
        setInputRotX(r.rx);
        setInputRotY(r.ry);
        setInputRotZ(r.rz);
      }
    },
    [keyframesPos, keyframesRot, tActual, tablero.id, onActualizar]
  );

  // ── SALTAR ENTRE FOTOGRAMAS (Anterior ‹ / Siguiente ›) ──
  const saltarKeyframe = useCallback(
    (tipo: "pos" | "rot", dir: 1 | -1) => {
      const lista = tipo === "pos" ? keyframesPos : keyframesRot;
      if (dir > 0) {
        const next = lista.find((k) => k.t > tActual + 0.1);
        if (next) setTimelineCurrentTime(next.t);
      } else {
        const prev = [...lista].reverse().find((k) => k.t < tActual - 0.1);
        if (prev) setTimelineCurrentTime(prev.t);
      }
    },
    [keyframesPos, keyframesRot, tActual, setTimelineCurrentTime]
  );

  // ── ACTUALIZAR POSE DE BANCO RELATIVO (Orientación de reposo acostada) ──
  const handleActualizarPoseBancoRel = useCallback(
    (ejeIndex: 0 | 1 | 2, val: number) => {
      const cur = [...(tablero.rotacionGrados || [0, 0, 0])] as [number, number, number];
      cur[ejeIndex] = val;
      onActualizar(tablero.id, {
        rotacionGrados: cur,
      });
    },
    [tablero.id, tablero.rotacionGrados, onActualizar]
  );

  const aplicarGiroRapidoBancoRel = useCallback(
    (ejeIndex: 0 | 1 | 2, delta: number) => {
      const cur = [...(tablero.rotacionGrados || [0, 0, 0])] as [number, number, number];
      cur[ejeIndex] = (cur[ejeIndex] + delta) % 360;
      onActualizar(tablero.id, {
        rotacionGrados: cur,
      });
    },
    [tablero.id, tablero.rotacionGrados, onActualizar]
  );

  // ── APLICAR GIRO RÁPIDO (+180°Y) ──
  const aplicarGiroRapido = useCallback(
    (eje: "X" | "Y" | "Z", anguloDeg: number) => {
      let nuevoRx = inputRotX;
      let nuevoRy = inputRotY;
      let nuevoRz = inputRotZ;

      if (eje === "X") nuevoRx += anguloDeg;
      if (eje === "Y") nuevoRy += anguloDeg;
      if (eje === "Z") nuevoRz += anguloDeg;

      setInputRotX(nuevoRx);
      setInputRotY(nuevoRy);
      setInputRotZ(nuevoRz);

      const lista = [...keyframesRot];
      const idx = lista.findIndex((k) => Math.abs(k.t - tActual) <= 0.25);
      if (idx >= 0) {
        lista[idx] = { t: lista[idx].t, rx: nuevoRx, ry: nuevoRy, rz: nuevoRz };
      } else {
        lista.push({ t: tActual, rx: nuevoRx, ry: nuevoRy, rz: nuevoRz });
        lista.sort((a, b) => a.t - b.t);
      }

      onActualizar(tablero.id, {
        keyframesRot: lista,
      });
    },
    [inputRotX, inputRotY, inputRotZ, keyframesRot, tActual, tablero.id, onActualizar]
  );

  // ── ACTUALIZAR INPUT NUMÉRICO Y PERSISTIR SÓLO SI HAY FOTOGRAMA ACTIVO ──
  const handleActualizarInputPos = useCallback(
    (eje: "x" | "y" | "z", val: number) => {
      let nx = inputX;
      let ny = inputY;
      let nz = inputZ;
      if (eje === "x") nx = val;
      if (eje === "y") ny = val;
      if (eje === "z") nz = val;

      setInputX(nx);
      setInputY(ny);
      setInputZ(nz);

      const lista = [...keyframesPos];
      const idx = lista.findIndex((k) => Math.abs(k.t - tActual) <= 0.25);
      if (idx >= 0) {
        lista[idx] = { t: lista[idx].t, x: nx, y: ny, z: nz };
      } else {
        lista.push({ t: tActual, x: nx, y: ny, z: nz });
        lista.sort((a, b) => a.t - b.t);
      }
      onActualizar(tablero.id, {
        keyframesPos: lista,
      });
    },
    [inputX, inputY, inputZ, keyframesPos, tActual, tablero.id, onActualizar]
  );

  const handleActualizarInputRot = useCallback(
    (eje: "rx" | "ry" | "rz", val: number) => {
      let nrx = inputRotX;
      let nry = inputRotY;
      let nrz = inputRotZ;
      if (eje === "rx") nrx = val;
      if (eje === "ry") nry = val;
      if (eje === "rz") nrz = val;

      setInputRotX(nrx);
      setInputRotY(nry);
      setInputRotZ(nrz);

      const lista = [...keyframesRot];
      const idx = lista.findIndex((k) => Math.abs(k.t - tActual) <= 0.25);
      if (idx >= 0) {
        lista[idx] = { t: lista[idx].t, rx: nrx, ry: nry, rz: nrz };
      } else {
        lista.push({ t: tActual, rx: nrx, ry: nry, rz: nrz });
        lista.sort((a, b) => a.t - b.t);
      }

      const patch: any = { keyframesRot: lista };
      if (Math.abs(tActual) <= 0.25) {
        patch.rotacionGrados = [nrx, nry, nrz];
      }
      onActualizar(tablero.id, patch);
    },
    [inputRotX, inputRotY, inputRotZ, keyframesRot, tActual, tablero.id, onActualizar]
  );

  // ── FIJAR POSE DE BANCO INDIVIDUAL A t = 0.0s ──
  const fijarPoseBancoIndividual = useCallback(() => {
    setTimelineCurrentTime(0.0);
    const pos0: TableroKeyframePos = {
      t: 0.0,
      x: tablero.offsetXCm || 0,
      y: tablero.elevacionZCm ?? tablero.offsetYCm ?? 0,
      z: tablero.offsetZCm || 0,
    };
    const rot0: TableroKeyframeRot = {
      t: 0.0,
      rx: tablero.rotacionGrados?.[0] || 0,
      ry: tablero.rotacionGrados?.[1] || 0,
      rz: tablero.rotacionGrados?.[2] || 0,
    };
    onActualizar(tablero.id, {
      keyframesPos: [pos0],
      keyframesRot: [rot0],
    });
  }, [tablero, setTimelineCurrentTime, onActualizar]);

  // Lista unificada de tiempos con fotogramas
  const tiemposFotogramas = useMemo(() => {
    const todos = Array.from(
      new Set([...keyframesPos.map((k) => k.t), ...keyframesRot.map((k) => k.t)])
    ).sort((a, b) => a - b);
    return todos;
  }, [keyframesPos, keyframesRot]);

  // Modo de Gizmo actual
  const gizmoPivote = tablero.gizmoPivote || { modo: "cdg", offsetCm: [0, 0, 0], mostrarGizmo: false };
  const labelGizmo = useMemo(() => {
    if (gizmoPivote.modo === "canto") return "🎯 Pivote: Canto Apoyado";
    if (gizmoPivote.modo === "personalizado") return "🎯 Pivote: Personalizado";
    return "🎯 Pivote: CDG";
  }, [gizmoPivote.modo]);

  return (
    <div
      onMouseEnter={() => onHover([tablero.id])}
      onMouseLeave={() => onHover(null)}
      className="w-full p-2.5 rounded-2xl border-2 border-cyan-400/80 dark:border-cyan-700/80 bg-white/90 dark:bg-slate-900/90 shadow-2xs space-y-2 select-none transition-all hover:border-cyan-500 hover:ring-1 hover:ring-cyan-400/40"
    >
      {/* ── FILA 1: CABECERA DEL TABLERO (Identidad, Destino, Gizmo, Pose Banco, Estado, Herramientas) ── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Nombre nativo Grasshopper */}
          <span className="font-extrabold text-xs text-cyan-950 dark:text-cyan-100 flex items-center gap-1" title={tablero.id}>
            {tablero.id}
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          </span>

          {/* Dropdown Destino Hacia: */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-[8.5px] shadow-2xs"
            title="Pieza de destino hacia la que se orienta o acopla"
          >
            <span className="font-bold text-slate-400 dark:text-slate-500 text-[7.5px]">Hacia:</span>
            <select
              value={tablero.destinoId || "base_master"}
              onChange={(e) => onActualizar(tablero.id, { destinoId: e.target.value })}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[120px] truncate text-[8.5px]"
            >
              <option value="base_master">👑 Base Master</option>
              {opcionesDestino
                .filter((op) => op.id !== tablero.id)
                .map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.esHeredado ? `🧩 ${op.label}` : op.label}
                  </option>
                ))}
            </select>
          </div>

          {/* 🎯 Botón Gizmo de Pivote (CDG / Canto / Personalizado) */}
          <button
            type="button"
            onClick={() => setMostrarPanelGizmo(!mostrarPanelGizmo)}
            title="Abrir calibrador del eje y centro de rotación (Gizmo 3D)"
            className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-bold border transition cursor-pointer flex items-center gap-1 shadow-2xs ${
              mostrarPanelGizmo || gizmoPivote.mostrarGizmo
                ? "bg-cyan-500 text-white border-cyan-500"
                : "border-cyan-300 dark:border-cyan-700 bg-white dark:bg-slate-800 text-cyan-800 dark:text-cyan-200 hover:border-cyan-500"
            }`}
          >
            <span>{labelGizmo}</span>
            <Sliders className="w-2.5 h-2.5 shrink-0" />
          </button>

          
        </div>

        {/* Resumen de estado y acciones rápidas */}
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-mono text-slate-400">
            {keyframesPos.length} pos / {keyframesRot.length} giros
          </span>

          {/* 🎯 Crosshair posicionamiento 3D */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePosicionar(tablero.id);
            }}
            title="Mover interactivamente en el piso 3D"
            className={`w-4 h-4 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              estaPosicionando
                ? "bg-cyan-500 text-white shadow-2xs animate-pulse ring-1 ring-cyan-400/50"
                : "text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
            }`}
          >
            <Crosshair className="w-2.5 h-2.5" />
          </button>

          {/* 🔄 Resetear a origen */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onActualizar(tablero.id, {
                offsetXCm: 0,
                offsetYCm: 0,
                offsetZCm: 0,
                elevacionZCm: 0,
                rotacionGrados: [0, 0, 0],
                keyframesPos: [{ t: 0.0, x: 0, y: 0, z: 0 }],
                keyframesRot: [{ t: 0.0, rx: 0, ry: 0, rz: 0 }],
              });
            }}
            title="Resetear desplazamientos y rotaciones a 0"
            className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer shrink-0"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>

          {/* ❌ Eliminar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHover(null);
              onRemover(tablero.id);
            }}
            title={`Eliminar ${tablero.id} de esta capa`}
            className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* ── DESPLEGABLE: CALIBRADOR DEL EJE Y GIZMO DE GIRO ── */}
      {mostrarPanelGizmo && (
        <div className="p-2 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 space-y-1.5 text-[8.5px]">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-extrabold text-cyan-900 dark:text-cyan-200 flex items-center gap-1">
              🎯 Calibrador del Eje y Pivote de Giro (Gizmo 3D):
            </span>
            <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(gizmoPivote.mostrarGizmo)}
                onChange={(e) =>
                  onActualizar(tablero.id, {
                    gizmoPivote: { ...gizmoPivote, mostrarGizmo: e.target.checked },
                  })
                }
                className="rounded-full accent-[#0088AA] cursor-pointer"
              />
              <span>Mostrar Gizmo 3D en el Visor</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Ubicación rápida:</span>
              <button
                type="button"
                onClick={() =>
                  onActualizar(tablero.id, {
                    gizmoPivote: { modo: "cdg", offsetCm: [0, 0, 0], mostrarGizmo: gizmoPivote.mostrarGizmo },
                  })
                }
                className={`px-2 py-0.5 rounded-full border text-[8px] font-bold cursor-pointer transition ${
                  gizmoPivote.modo === "cdg"
                    ? "bg-[#0088AA] text-white border-[#0088AA]"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                Centro de Gravedad (CDG)
              </button>
              <button
                type="button"
                onClick={() =>
                  onActualizar(tablero.id, {
                    gizmoPivote: { modo: "canto", offsetCm: [0, -25, 0], mostrarGizmo: gizmoPivote.mostrarGizmo },
                  })
                }
                className={`px-2 py-0.5 rounded-full border text-[8px] font-bold cursor-pointer transition ${
                  gizmoPivote.modo === "canto"
                    ? "bg-[#0088AA] text-white border-[#0088AA]"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                Canto Apoyado (Bisagra)
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500">Offset Pivote (cm):</span>
              <span className="font-mono text-rose-500 font-bold">X</span>
              <input
                type="number"
                value={gizmoPivote.offsetCm?.[0] || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onActualizar(tablero.id, {
                    gizmoPivote: {
                      modo: "personalizado",
                      offsetCm: [val, gizmoPivote.offsetCm?.[1] || 0, gizmoPivote.offsetCm?.[2] || 0],
                      mostrarGizmo: gizmoPivote.mostrarGizmo,
                    },
                  });
                }}
                className="w-8 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-mono text-[8px] outline-none"
              />
              <span className="font-mono text-emerald-500 font-bold">Y</span>
              <input
                type="number"
                value={gizmoPivote.offsetCm?.[1] || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onActualizar(tablero.id, {
                    gizmoPivote: {
                      modo: "personalizado",
                      offsetCm: [gizmoPivote.offsetCm?.[0] || 0, val, gizmoPivote.offsetCm?.[2] || 0],
                      mostrarGizmo: gizmoPivote.mostrarGizmo,
                    },
                  });
                }}
                className="w-8 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-mono text-[8px] outline-none"
              />
              <span className="font-mono text-blue-500 font-bold">Z</span>
              <input
                type="number"
                value={gizmoPivote.offsetCm?.[2] || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onActualizar(tablero.id, {
                    gizmoPivote: {
                      modo: "personalizado",
                      offsetCm: [gizmoPivote.offsetCm?.[0] || 0, gizmoPivote.offsetCm?.[1] || 0, val],
                      mostrarGizmo: gizmoPivote.mostrarGizmo,
                    },
                  });
                }}
                className="w-8 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-mono text-[8px] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── FILA 2: ESENCIA CAPCUT PURA (SUB-BLOQUES DESPLAZAR Y GIRAR INDEPENDIENTES) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-0.5">
        
        {/* ── SUB-BLOQUE A: DESPLAZAMIENTO (X, Y, Z en cm) + ROMBO CAPCUT ── */}
        <div className="flex items-center justify-between gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 px-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 min-w-[65px]">
              Desplazar (cm):
            </span>

            {/* Input X */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.2 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-[7.5px] font-bold text-rose-500 font-mono">X</span>
              <input
                type="number"
                value={inputX}
                onFocus={(e) => e.currentTarget.select()}
                onMouseUp={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                onChange={(e) => handleActualizarInputPos("x", parseFloat(e.target.value) || 0)}
                className="w-7 text-center font-mono font-bold text-[8.5px] bg-transparent outline-none"
              />
            </div>

            {/* Input Y (Longitudinal Mesa) */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.2 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-[7.5px] font-bold text-emerald-500 font-mono">Y</span>
              <input
                type="number"
                value={inputY}
                onFocus={(e) => e.currentTarget.select()}
                onMouseUp={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                onChange={(e) => handleActualizarInputPos("y", parseFloat(e.target.value) || 0)}
                className="w-7 text-center font-mono font-bold text-[8.5px] bg-transparent outline-none"
              />
            </div>

            {/* Input Z (Altura Vertical) */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.2 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-[7.5px] font-bold text-blue-500 font-mono">Z</span>
              <input
                type="number"
                value={inputZ}
                onFocus={(e) => e.currentTarget.select()}
                onMouseUp={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                onChange={(e) => handleActualizarInputPos("z", parseFloat(e.target.value) || 0)}
                className="w-8 text-center font-mono font-bold text-[8.5px] bg-transparent outline-none"
              />
            </div>
          </div>

          {/* 💎 ROMBO CAPCUT DE DESPLAZAMIENTO 💎 */}
          <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1.5">
            <button
              type="button"
              onClick={() => saltarKeyframe("pos", -1)}
              title="Fotograma de posición anterior"
              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-600 cursor-pointer text-xs"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={toggleKeyframePos}
              title={
                kfPosActivo
                  ? `Eliminar fotograma de posición en ${tActual.toFixed(1)}s`
                  : `Crear fotograma de posición en ${tActual.toFixed(1)}s`
              }
              className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition active:scale-90 ${
                kfPosActivo
                  ? "text-[#0088AA] dark:text-[#38BDF8]"
                  : "text-slate-300 dark:text-slate-600 hover:text-cyan-500"
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${kfPosActivo ? "fill-current" : ""}`} viewBox="0 0 24 24" fill={kfPosActivo ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2L2 12l10 10 10-10L12 2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => saltarKeyframe("pos", 1)}
              title="Fotograma de posición siguiente"
              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-600 cursor-pointer text-xs"
            >
              ›
            </button>
          </div>
        </div>

        {/* ── SUB-BLOQUE B: GIRO GLOBAL DE ANIMACIÓN (X, Y, Z en ° respecto a la mesa) + ROMBO CAPCUT ── */}
        <div className="flex items-center justify-between gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 px-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 min-w-[55px]" title="Giro Global de Animación respecto a los ejes fijos de la mesa de trabajo">
              Giro Global:
            </span>

            {/* Input Rot X Global */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.2 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-[7.5px] font-bold text-rose-500 font-mono" title="Eje Transversal de la mesa">X</span>
              <input
                type="number"
                value={inputRotX}
                onFocus={(e) => e.currentTarget.select()}
                onMouseUp={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                onChange={(e) => handleActualizarInputRot("rx", parseFloat(e.target.value) || 0)}
                className="w-7 text-center font-mono font-bold text-[8.5px] bg-transparent outline-none"
              />
            </div>

            {/* Input Rot Y Global */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.2 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-[7.5px] font-bold text-emerald-500 font-mono" title="Eje Longitudinal de la mesa (Volteo lateral)">Y</span>
              <input
                type="number"
                value={inputRotY}
                onFocus={(e) => e.currentTarget.select()}
                onMouseUp={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                onChange={(e) => handleActualizarInputRot("ry", parseFloat(e.target.value) || 0)}
                className="w-7 text-center font-mono font-bold text-[8.5px] bg-transparent outline-none"
              />
            </div>

            {/* Input Rot Z Global */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.2 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-[7.5px] font-bold text-blue-500 font-mono" title="Eje Vertical de la mesa (Tornamesa / Giro plano)">Z</span>
              <input
                type="number"
                value={inputRotZ}
                onFocus={(e) => e.currentTarget.select()}
                onMouseUp={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                onChange={(e) => handleActualizarInputRot("rz", parseFloat(e.target.value) || 0)}
                className="w-7 text-center font-mono font-bold text-[8.5px] bg-transparent outline-none"
              />
            </div>
          </div>

          {/* 💎 ROMBO CAPCUT DE ROTACIÓN GLOBAL 💎 */}
          <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1.5">
            <button
              type="button"
              onClick={() => saltarKeyframe("rot", -1)}
              title="Fotograma de rotación anterior"
              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-600 cursor-pointer text-xs"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={toggleKeyframeRot}
              title={
                kfRotActivo
                  ? `Eliminar fotograma de giro global en ${tActual.toFixed(1)}s`
                  : `Crear fotograma de giro global en ${tActual.toFixed(1)}s`
              }
              className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition active:scale-90 ${
                kfRotActivo
                  ? "text-[#0088AA] dark:text-[#38BDF8]"
                  : "text-slate-300 dark:text-slate-600 hover:text-cyan-500"
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${kfRotActivo ? "fill-current" : ""}`} viewBox="0 0 24 24" fill={kfRotActivo ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2L2 12l10 10 10-10L12 2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => saltarKeyframe("rot", 1)}
              title="Fotograma de rotación siguiente"
              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-600 cursor-pointer text-xs"
            >
              ›
            </button>
          </div>
        </div>

        {/* ── SUB-BLOQUE C: POSE BANCO RELATIVO (X, Y, Z en °) PARA ACOSTAR LA PIEZA ── */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 px-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 min-w-[70px]" title="Orientación fija de reposo para acostar la pieza sobre la mesa de trabajo">
            Giro Relativo:
          </span>

          {/* Input Pose Rel X */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.2 rounded-full border border-slate-200 dark:border-slate-700">
            <span className="text-[7.5px] font-bold text-rose-500 font-mono">X</span>
            <input
              type="number"
              value={tablero.rotacionGrados?.[0] || 0}
              onFocus={(e) => e.currentTarget.select()}
              onMouseUp={(e) => e.currentTarget.select()}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              onChange={(e) => handleActualizarPoseBancoRel(0, parseFloat(e.target.value) || 0)}
              className="w-7 text-center font-mono font-bold text-[8.5px] bg-transparent outline-none"
            />
          </div>

          {/* Input Pose Rel Y */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.2 rounded-full border border-slate-200 dark:border-slate-700">
            <span className="text-[7.5px] font-bold text-emerald-500 font-mono">Y</span>
            <input
              type="number"
              value={tablero.rotacionGrados?.[1] || 0}
              onFocus={(e) => e.currentTarget.select()}
              onMouseUp={(e) => e.currentTarget.select()}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              onChange={(e) => handleActualizarPoseBancoRel(1, parseFloat(e.target.value) || 0)}
              className="w-7 text-center font-mono font-bold text-[8.5px] bg-transparent outline-none"
            />
          </div>

          {/* Input Pose Rel Z */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.2 rounded-full border border-slate-200 dark:border-slate-700">
            <span className="text-[7.5px] font-bold text-blue-500 font-mono">Z</span>
            <input
              type="number"
              value={tablero.rotacionGrados?.[2] || 0}
              onFocus={(e) => e.currentTarget.select()}
              onMouseUp={(e) => e.currentTarget.select()}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              onChange={(e) => handleActualizarPoseBancoRel(2, parseFloat(e.target.value) || 0)}
              className="w-7 text-center font-mono font-bold text-[8.5px] bg-transparent outline-none"
            />
          </div>

          {/* Botón rápido +180°Y para Pose Banco Relativa */}
          <button
            type="button"
            onClick={() => aplicarGiroRapidoBancoRel(1, 180)}
            title="Voltear 180° la pose de banco en eje Y"
            className="px-1.5 py-0.5 rounded-full bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/60 dark:hover:bg-cyan-800 text-[8px] font-extrabold text-[#0088AA] dark:text-[#38BDF8] cursor-pointer"
          >
            +180°Y
          </button>
        </div>

      </div>

      {/* ── FILA 3: TIRA DE PÍLDORAS DE FOTOGRAMAS CLAVE (1 Clic salta al tiempo en el visor 3D) ── */}
      {tiemposFotogramas.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">Fotogramas:</span>
          {tiemposFotogramas.map((t) => {
            const esActivo = Math.abs(t - tActual) <= 0.2;
            const tienePos = keyframesPos.some((k) => Math.abs(k.t - t) <= 0.2);
            const tieneRot = keyframesRot.some((k) => Math.abs(k.t - t) <= 0.2);
            return (
              <div
                key={t}
                className={`inline-flex items-center rounded-full text-[8px] font-mono font-bold transition ${
                  esActivo
                    ? "bg-[#0088AA] text-white shadow-2xs border border-[#0088AA]"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-400"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setTimelineCurrentTime(t)}
                  title={`Saltar a ${Math.round(t)}s en la línea de tiempo`}
                  className="px-1.5 py-0.5 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{Math.round(t)}s</span>
                  {tienePos && <span className={esActivo ? "text-emerald-200" : "text-emerald-500 font-extrabold"}>◆Pos</span>}
                  {tieneRot && <span className={esActivo ? "text-cyan-200" : "text-cyan-500 font-extrabold"}>◆Rot</span>}
                </button>
                {t !== 0.0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarFotogramaEnTiempo(t);
                    }}
                    title={`Eliminar fotograma de ${Math.round(t)}s`}
                    className={`pr-1.5 pl-0.5 py-0.5 cursor-pointer transition ${
                      esActivo ? "text-white/80 hover:text-white hover:scale-125" : "text-slate-400 hover:text-rose-500 hover:scale-125"
                    }`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
