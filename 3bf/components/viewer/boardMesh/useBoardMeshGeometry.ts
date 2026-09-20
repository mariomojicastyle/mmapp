import React from 'react';
import * as THREE from 'three';

export function useBoardMeshGeometry(
  vertices?: number[],
  indices?: number[],
  grasshopperUvs?: number[],
  size?: [number, number, number],
  tipoMapeado?: string
) {
  const customGeometry = React.useMemo(() => {
    if (vertices && indices && vertices.length > 0 && indices.length > 0) {
      const indexedGeo = new THREE.BufferGeometry();
      indexedGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      indexedGeo.setIndex(indices);
      indexedGeo.computeVertexNormals();

      if (grasshopperUvs && grasshopperUvs.length > 0) {
        indexedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(grasshopperUvs, 2));
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
      const UV_SCALE = 1.0 / 0.60;

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
            if (tipoMapeado === 'Cubierta Atravesada' || tipoMapeado === 'Entrepaño Atravesado') {
              uvs[idx * 2] = z * UV_SCALE;
              uvs[idx * 2 + 1] = x * UV_SCALE;
            } else {
              uvs[idx * 2] = x * UV_SCALE;
              uvs[idx * 2 + 1] = z * UV_SCALE;
            }
          } else if (absX >= absY && absX >= absZ) {
            if (size && size[1] >= size[2]) {
              uvs[idx * 2] = y * UV_SCALE;
              uvs[idx * 2 + 1] = z * UV_SCALE;
            } else {
              uvs[idx * 2] = z * UV_SCALE;
              uvs[idx * 2 + 1] = y * UV_SCALE;
            }
          } else {
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

      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      return geo;
    }
    return null;
  }, [vertices, indices, grasshopperUvs, size?.[0], size?.[1], size?.[2], tipoMapeado]);

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

  // 🛡️ Detección geométrica de bisel / chaflán exterior en frentes de cajón o piezas con perfil diagonal
  const tieneBiselDiagonal = React.useMemo(() => {
    if (!vertices || !indices || vertices.length === 0 || indices.length === 0) return false;
    if (!size || size.length < 3) return false;
    const maxDim = Math.max(size[0], size[1], size[2]);

    for (let t = 0; t < indices.length; t += 3) {
      const ia = indices[t] * 3;
      const ib = indices[t + 1] * 3;
      const ic = indices[t + 2] * 3;

      const ax = vertices[ia], ay = vertices[ia + 1], az = vertices[ia + 2];
      const bx = vertices[ib], by = vertices[ib + 1], bz = vertices[ib + 2];
      const cx = vertices[ic], cy = vertices[ic + 1], cz = vertices[ic + 2];

      const ux = bx - ax, uy = by - ay, uz = bz - az;
      const wx = cx - ax, wy = cy - ay, wz = cz - az;

      let nx = uy * wz - uz * wy;
      let ny = uz * wx - ux * wz;
      let nz = ux * wy - uy * wx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 1e-6) {
        nx /= len;
        ny /= len;
        nz /= len;
        // Si la cara tiene normal diagonal (no ortogonal a los 3 ejes cartesianos)
        if (Math.abs(nx) < 0.95 && Math.abs(ny) < 0.95 && Math.abs(nz) < 0.95) {
          const spanX = Math.max(ax, bx, cx) - Math.min(ax, bx, cx);
          const spanY = Math.max(ay, by, cy) - Math.min(ay, by, cy);
          const spanZ = Math.max(az, bz, cz) - Math.min(az, bz, cz);
          const maxSpan = Math.max(spanX, spanY, spanZ);
          // Si el bisel abarca más de 50 mm o más del 20% de la longitud mayor de la pieza
          if (maxSpan > 0.05 && maxSpan > maxDim * 0.2) {
            return true;
          }
        }
      }
    }
    return false;
  }, [vertices, indices, size?.[0], size?.[1], size?.[2]]);

  return { customGeometry, boxMeshGeometry, tieneBiselDiagonal };
}

