"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { use3BFStore } from "@/lib/store";
import { extraerPiezaMadre } from "@/lib/piezaMadreUtils";
import { obtenerColorSubbloque } from "@/components/manual/StepManagerPanel";

export function SubbloqueSingleTooltip({
  sub,
  sIdx,
  pasoId,
  furnitureGroup,
}: {
  sub: any;
  sIdx: number;
  pasoId: string;
  furnitureGroup: THREE.Group;
}) {
  const [centerPos, setCenterPos] = useState<[number, number, number] | null>(null);
  const colorSub = obtenerColorSubbloque(sIdx);
  const letraSub = sub.letra || String.fromCharCode(65 + sIdx);
  const codigoSub = sub.codigo || `${pasoId}${letraSub}`;

  // useFrame para actualizar dinámicamente la posición en tiempo real anclada al centro de gravedad de la MADERA
  useFrame(() => {
    // 🪵 FILTRADO ESTRICTO: Para evitar que las cápsulas oscilen cuando las correderas o tornillos se mueven,
    // el centro de gravedad debe calcularse EXCLUSIVAMENTE a partir de la pieza de madera (tablero estructural).
    const piezasMaderaDelSub = [
      sub.piezaMaster,
      ...(sub.piezas || [])
    ].filter(Boolean) as string[];

    if (piezasMaderaDelSub.length === 0) {
      if (centerPos !== null) setCenterPos(null);
      return;
    }

    const boxMadera = new THREE.Box3();
    const boxMaster = new THREE.Box3();
    let count = 0;
    let tieneMaster = false;
    const pMasterTarget = (sub.piezaMaster || "").toLowerCase().trim();

    furnitureGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const u = (obj as any).userData;
        const cleanName = u?.cleanName || obj.name || "";
        const pm = u?.piezaMadre || extraerPiezaMadre(cleanName);
        const rawName = u?.rawName || "";
        const instKey = u?.instanciaKey || "";
        const cnLow = cleanName.toLowerCase();
        const rnLow = rawName.toLowerCase();
        const nLow = (obj.name || "").toLowerCase();

        // 🛡️ REGLA: Excluir explícitamente cualquier herraje o corredera del cálculo del centro de la cápsula
        const esHerraje = (
          u?.isHardware ||
          u?.isMachining ||
          cnLow.includes("corredi") ||
          cnLow.includes("trilho") ||
          cnLow.includes("parafuso") ||
          cnLow.includes("tornillo") ||
          cnLow.includes("perno") ||
          rnLow.includes("corredi") ||
          rnLow.includes("trilho") ||
          rnLow.includes("parafuso") ||
          nLow.includes("corredi") ||
          nLow.includes("trilho")
        );
        if (esHerraje) return;

        const match = piezasMaderaDelSub.some((target) => {
          if (!target) return false;
          const tClean = target.replace(/^RH_OUT:\s*/i, "").replace(/^RH_IN:\s*/i, "").trim().toLowerCase();
          const tPM = extraerPiezaMadre(tClean).toLowerCase();
          const ikLow = instKey.toLowerCase();
          const pmLow = pm.toLowerCase();

          return (
            tClean === cnLow ||
            tClean === rnLow ||
            tClean === ikLow ||
            (tPM && tPM === pmLow) ||
            cnLow.includes(tClean) ||
            ikLow.includes(tClean)
          );
        });

        if (match) {
          const esMaster = pMasterTarget && (
            cnLow.includes(pMasterTarget) ||
            pm.toLowerCase().includes(pMasterTarget) ||
            instKey.toLowerCase().includes(pMasterTarget) ||
            rnLow.includes(pMasterTarget)
          );

          // Si es pieza master o si tiene escala válida, expandir la caja de madera
          if (esMaster) {
            obj.updateWorldMatrix(true, false);
            boxMaster.expandByObject(obj);
            tieneMaster = true;
            count++;
          } else if (obj.visible && Math.abs(obj.scale.x) > 0.01) {
            obj.updateWorldMatrix(true, false);
            boxMadera.expandByObject(obj);
            count++;
          }
        }
      }
    });

    if (count > 0 && (!boxMaster.isEmpty() || !boxMadera.isEmpty())) {
      const c = new THREE.Vector3();
      const targetBox = (tieneMaster && !boxMaster.isEmpty()) ? boxMaster : boxMadera;
      targetBox.getCenter(c);
      c.y = targetBox.max.y + 0.04;

      if (
        !centerPos ||
        Math.abs(centerPos[0] - c.x) > 0.001 ||
        Math.abs(centerPos[1] - c.y) > 0.001 ||
        Math.abs(centerPos[2] - c.z) > 0.001
      ) {
        setCenterPos([c.x, c.y, c.z]);
      }
    } else if (centerPos !== null && (!tieneMaster || boxMaster.isEmpty())) {
      setCenterPos(null);
    }
  });

  if (!centerPos) return null;

  return (
    <Html
      position={centerPos}
      center
      zIndexRange={[100, 0]}
      style={{
        pointerEvents: "auto",
        userSelect: "none",
        transition: "all 0.15s ease-out",
      }}
    >
      <div
        className="px-2.5 py-1 rounded-full text-white font-black text-[11px] border-2 border-white flex items-center justify-center cursor-pointer select-none transition-transform hover:scale-115 active:scale-95 whitespace-nowrap"
        style={{
          backgroundColor: colorSub.bg,
          boxShadow: `0 4px 14px ${colorSub.bg}70, 0 2px 4px rgba(0,0,0,0.35)`,
        }}
        title={`${sub.nombre || `Sub-Bloque ${pasoId}-${letraSub}`} (${sub.piezas?.length || 0} tableros, ${sub.herrajes?.length || 0} herrajes)`}
      >
        <span>{codigoSub}</span>
      </div>
    </Html>
  );
}

export function SubbloquesTooltipsBillboard({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { pestanaActiva, pasosManual, pasoActivoManualId } = use3BFStore();
  const pasoActivoManual = pasosManual.find((p) => p.id === pasoActivoManualId);

  // 🛡️ REGLA: Tooltip permanente del subbloque en su centro de gravedad.
  // Únicamente visible cuando estamos en el paso que contiene esos subbloques.
  if (
    pestanaActiva !== "manual" ||
    !pasoActivoManual ||
    pasoActivoManual.tipo === "showcase" ||
    !pasoActivoManual.subbloques ||
    pasoActivoManual.subbloques.length === 0 ||
    !furnitureGroup
  ) {
    return null;
  }

  return (
    <group name="subbloques_tooltips_billboard">
      {pasoActivoManual.subbloques.map((sub, sIdx) => (
        <SubbloqueSingleTooltip
          key={sub.id}
          sub={sub}
          sIdx={sIdx}
          pasoId={pasoActivoManual.id}
          furnitureGroup={furnitureGroup}
        />
      ))}
    </group>
  );
}

export default SubbloquesTooltipsBillboard;
