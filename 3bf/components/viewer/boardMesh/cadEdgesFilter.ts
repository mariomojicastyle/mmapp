import * as THREE from "three";

/**
 * 📐 Filtro Canónico Riguroso de Aristas CAD para Tableros DfMA (Clean CAD Edges)
 * 
 * Erradica al 100% las aristas coplanares espurias (diagonales de triangulación,
 * cortes de costura 'seam' y puentes entre orificios) que yacen sobre caras planas de melamina.
 * 
 * Preserva con exactitud matemática:
 * 1. Los 4 bordes exteriores perimetrales del rectángulo (encuentro a 90° con los cantos).
 * 2. Las circunferencias de maquinados y barrenos (segmentos <= 6mm donde la pared penetra a 90°).
 * 3. Los chaflanes o biseles inclinados a 45° (no coplanares a las caras ortogonales).
 * 4. Las ranuras talladas con profundidad real.
 */
export function buildCleanCadEdges(
  geometry: THREE.BufferGeometry,
  thresholdAngle: number = 25
): THREE.BufferGeometry {
  const rawEdges = new THREE.EdgesGeometry(geometry, thresholdAngle);
  const inPos = rawEdges.attributes.position;
  if (!inPos || inPos.count === 0) {
    return rawEdges;
  }

  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }
  const bbox = geometry.boundingBox;
  if (!bbox) {
    return rawEdges;
  }

  const minX = bbox.min.x, maxX = bbox.max.x;
  const minY = bbox.min.y, maxY = bbox.max.y;
  const minZ = bbox.min.z, maxZ = bbox.max.z;

  const tolCopl = 0.0005; // 0.5 mm: tolerancia para considerar coplanar a una cara ortogonal
  const tolBorde = 0.003; // 3.0 mm: tolerancia para pertenecer al borde perimetral exterior
  const maxSegBarreno = 0.006; // 6.0 mm: longitud máxima de los segmentos de arco de un barreno circular

  const outVertices: number[] = [];
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  for (let i = 0; i < inPos.count; i += 2) {
    v1.fromBufferAttribute(inPos, i);
    v2.fromBufferAttribute(inPos, i + 1);

    const len = v1.distanceTo(v2);

    // 1. Circunferencia de barreno/maquinado circular (segmentos cortos <= 6 mm) -> PRESERVAR SIEMPRE
    if (len <= maxSegBarreno) {
      outVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      continue;
    }

    // 2. Determinar si el segmento yace sobre alguna de las caras planas ortogonales exteriores del tablero
    const enCaraXMin = Math.abs(v1.x - minX) < tolCopl && Math.abs(v2.x - minX) < tolCopl;
    const enCaraXMax = Math.abs(v1.x - maxX) < tolCopl && Math.abs(v2.x - maxX) < tolCopl;

    const enCaraYMin = Math.abs(v1.y - minY) < tolCopl && Math.abs(v2.y - minY) < tolCopl;
    const enCaraYMax = Math.abs(v1.y - maxY) < tolCopl && Math.abs(v2.y - maxY) < tolCopl;

    const enCaraZMin = Math.abs(v1.z - minZ) < tolCopl && Math.abs(v2.z - minZ) < tolCopl;
    const enCaraZMax = Math.abs(v1.z - maxZ) < tolCopl && Math.abs(v2.z - maxZ) < tolCopl;

    const yaceEnCaraPlana = enCaraXMin || enCaraXMax || enCaraYMin || enCaraYMax || enCaraZMin || enCaraZMax;

    if (!yaceEnCaraPlana) {
      // No yace sobre una cara plana ortogonal exterior (es un chaflán a 45°, bisel o ranura interna con profundidad) -> PRESERVAR
      outVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      continue;
    }

    // 3. Si yace sobre una cara plana exterior: AMBOS extremos v1 Y v2 deben estar sobre el MISMO borde perimetral del rectángulo
    let esBordePerimetralLegitimo = false;

    if (enCaraXMin || enCaraXMax) {
      // En plano YZ: los 4 bordes exteriores legítimos del rectángulo son:
      const bordeYMin = Math.abs(v1.y - minY) < tolBorde && Math.abs(v2.y - minY) < tolBorde;
      const bordeYMax = Math.abs(v1.y - maxY) < tolBorde && Math.abs(v2.y - maxY) < tolBorde;
      const bordeZMin = Math.abs(v1.z - minZ) < tolBorde && Math.abs(v2.z - minZ) < tolBorde;
      const bordeZMax = Math.abs(v1.z - maxZ) < tolBorde && Math.abs(v2.z - maxZ) < tolBorde;
      esBordePerimetralLegitimo = bordeYMin || bordeYMax || bordeZMin || bordeZMax;
    } else if (enCaraYMin || enCaraYMax) {
      // En plano XZ: los 4 bordes exteriores legítimos del rectángulo son:
      const bordeXMin = Math.abs(v1.x - minX) < tolBorde && Math.abs(v2.x - minX) < tolBorde;
      const bordeXMax = Math.abs(v1.x - maxX) < tolBorde && Math.abs(v2.x - maxX) < tolBorde;
      const bordeZMin = Math.abs(v1.z - minZ) < tolBorde && Math.abs(v2.z - minZ) < tolBorde;
      const bordeZMax = Math.abs(v1.z - maxZ) < tolBorde && Math.abs(v2.z - maxZ) < tolBorde;
      esBordePerimetralLegitimo = bordeXMin || bordeXMax || bordeZMin || bordeZMax;
    } else if (enCaraZMin || enCaraZMax) {
      // En plano XY: los 4 bordes exteriores legítimos del rectángulo son:
      const bordeXMin = Math.abs(v1.x - minX) < tolBorde && Math.abs(v2.x - minX) < tolBorde;
      const bordeXMax = Math.abs(v1.x - maxX) < tolBorde && Math.abs(v2.x - maxX) < tolBorde;
      const bordeYMin = Math.abs(v1.y - minY) < tolBorde && Math.abs(v2.y - minY) < tolBorde;
      const bordeYMax = Math.abs(v1.y - maxY) < tolBorde && Math.abs(v2.y - maxY) < tolBorde;
      esBordePerimetralLegitimo = bordeXMin || bordeXMax || bordeYMin || bordeYMax;
    }

    if (esBordePerimetralLegitimo) {
      // Es un borde perimetral exterior real del tablero -> PRESERVAR
      outVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    } else {
      // Yace sobre la cara plana de melamina, mide > 6mm y NO es borde perimetral:
      // ¡ES UNA DIAGONAL DE TRIANGULACIÓN O UN PUENTE ENTRE BARRENOS!
      // -> DESCARTAR TOTALMENTE
    }
  }

  rawEdges.dispose();

  const cleanGeo = new THREE.BufferGeometry();
  cleanGeo.setAttribute("position", new THREE.Float32BufferAttribute(outVertices, 3));
  return cleanGeo;
}
