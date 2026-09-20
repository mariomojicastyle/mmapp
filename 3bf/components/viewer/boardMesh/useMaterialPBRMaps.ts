import * as THREE from 'three';
import React from 'react';
import { MaterialPBRDef } from '@/lib/store';

// 🌐 Pool de Texturas Global Compartido (Singleton en memoria WebGL)
// Evita decodificar la misma imagen 374 veces en la GPU.
// Una sola instancia de THREE.Texture en VRAM compartida por todas las mallas.
const textureCache = new Map<string, Promise<THREE.Texture>>();
const sharedLoader = typeof window !== 'undefined' ? new THREE.TextureLoader() : null;
if (sharedLoader) sharedLoader.setCrossOrigin('anonymous');

function getSharedTexture(url: string, isColor: boolean, isTraversada: boolean): Promise<THREE.Texture> {
  const cacheKey = `${url}_${isColor ? 'srgb' : 'linear'}_${isTraversada ? '90' : '0'}`;

  if (!textureCache.has(cacheKey)) {
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      if (!sharedLoader) return;
      sharedLoader.load(
        url,
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(1.0, 1.0);
          tex.center.set(0.5, 0.5);
          tex.rotation = isTraversada ? Math.PI / 2 : 0;
          if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;
          resolve(tex);
        },
        undefined,
        (err) => {
          textureCache.delete(cacheKey);
          reject(err);
        }
      );
    });
    textureCache.set(cacheKey, promise);
  }

  return textureCache.get(cacheKey)!;
}

export function useMaterialPBRMaps(
  materialPBR?: MaterialPBRDef | null, 
  fallbackUrl?: string | null, 
  tipoMapeado?: string, 
  hasGrasshopperUvs?: boolean
) {
  const [maps, setMaps] = React.useState<{
    diffuse: THREE.Texture | null;
    normal: THREE.Texture | null;
    roughness: THREE.Texture | null;
    ao: THREE.Texture | null;
  }>({ diffuse: null, normal: null, roughness: null, ao: null });

  const isTraversada = !hasGrasshopperUvs && (tipoMapeado === 'Cubierta Atravesada' || tipoMapeado === 'Entrepaño Atravesado');

  // 🛡️ Si el material PBR es explícitamente no-madera o sustrato crudo (Plástico, Metal, Pintura, PBR, Blanco liso, MDP o MDF),
  // NUNCA debe heredar texturas de melamina por fallback; solo cargará mapa si el material tiene texturaUrl propia.
  const esMaterialSinTexturaMadera = Boolean(
    materialPBR && (
      materialPBR.tipo === 'Plastico' || 
      materialPBR.tipo === 'Metal' || 
      materialPBR.tipo === 'Pintura' || 
      materialPBR.tipo === 'PBR' ||
      materialPBR.id === 'mat_blanco' ||
      materialPBR.id === 'mat_mdp' ||
      materialPBR.id === 'mat_mdf' ||
      materialPBR.nombre.toLowerCase() === 'mdp' ||
      materialPBR.nombre.toLowerCase() === 'mdf'
    )
  );

  const targetDiffuse = materialPBR?.texturaUrl 
    ? materialPBR.texturaUrl 
    : (esMaterialSinTexturaMadera ? null : fallbackUrl);

  const targetNormal = materialPBR?.normalMapUrl || null;
  const targetRoughness = materialPBR?.roughnessMapUrl || null;
  const targetAO = materialPBR?.aoMapUrl || null;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelado = false;

    if (!targetDiffuse && !targetNormal && !targetRoughness && !targetAO) {
      setMaps({ diffuse: null, normal: null, roughness: null, ao: null });
      return;
    }

    if (targetDiffuse) {
      getSharedTexture(targetDiffuse, true, isTraversada)
        .then((tex) => {
          if (!cancelado) setMaps((prev) => ({ ...prev, diffuse: tex }));
        })
        .catch(() => {
          if (!cancelado) setMaps((prev) => ({ ...prev, diffuse: null }));
        });
    } else {
      setMaps((prev) => ({ ...prev, diffuse: null }));
    }

    if (targetNormal) {
      getSharedTexture(targetNormal, false, isTraversada)
        .then((tex) => {
          if (!cancelado) setMaps((prev) => ({ ...prev, normal: tex }));
        })
        .catch(() => {
          if (!cancelado) setMaps((prev) => ({ ...prev, normal: null }));
        });
    } else {
      setMaps((prev) => ({ ...prev, normal: null }));
    }

    if (targetRoughness) {
      getSharedTexture(targetRoughness, false, isTraversada)
        .then((tex) => {
          if (!cancelado) setMaps((prev) => ({ ...prev, roughness: tex }));
        })
        .catch(() => {
          if (!cancelado) setMaps((prev) => ({ ...prev, roughness: null }));
        });
    } else {
      setMaps((prev) => ({ ...prev, roughness: null }));
    }

    if (targetAO) {
      getSharedTexture(targetAO, false, isTraversada)
        .then((tex) => {
          if (!cancelado) setMaps((prev) => ({ ...prev, ao: tex }));
        })
        .catch(() => {
          if (!cancelado) setMaps((prev) => ({ ...prev, ao: null }));
        });
    } else {
      setMaps((prev) => ({ ...prev, ao: null }));
    }

    return () => {
      cancelado = true;
    };
  }, [targetDiffuse, targetNormal, targetRoughness, targetAO, isTraversada]);

  return maps;
}

