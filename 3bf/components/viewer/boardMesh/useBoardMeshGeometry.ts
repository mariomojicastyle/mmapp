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

  return { customGeometry, boxMeshGeometry };
}
