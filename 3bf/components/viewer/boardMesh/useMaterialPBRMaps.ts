import * as THREE from 'three';

/**
 * Hook de carga y cacheo de texturas PBR (difuso, normal, rugosidad, oclusión ambiental).
 */
import React from 'react';
import { MaterialPBRDef } from '@/lib/store';

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
  const targetDiffuse = materialPBR?.texturaUrl || fallbackUrl;
  const targetNormal = materialPBR?.normalMapUrl || null;
  const targetRoughness = materialPBR?.roughnessMapUrl || null;
  const targetAO = materialPBR?.aoMapUrl || null;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!targetDiffuse && !targetNormal && !targetRoughness && !targetAO) {
      setMaps({ diffuse: null, normal: null, roughness: null, ao: null });
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const setupTex = (tex: THREE.Texture, isColor = false) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.0, 1.0);
      tex.center.set(0.5, 0.5);
      tex.rotation = isTraversada ? Math.PI / 2 : 0;
      if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    };

    if (targetDiffuse) {
      loader.load(targetDiffuse, (t) => {
        setMaps((prev) => ({ ...prev, diffuse: setupTex(t, true) }));
      });
    } else {
      setMaps((prev) => ({ ...prev, diffuse: null }));
    }

    if (targetNormal) {
      loader.load(targetNormal, (t) => {
        setMaps((prev) => ({ ...prev, normal: setupTex(t, false) }));
      });
    } else {
      setMaps((prev) => ({ ...prev, normal: null }));
    }

    if (targetRoughness) {
      loader.load(targetRoughness, (t) => {
        setMaps((prev) => ({ ...prev, roughness: setupTex(t, false) }));
      });
    } else {
      setMaps((prev) => ({ ...prev, roughness: null }));
    }

    if (targetAO) {
      loader.load(targetAO, (t) => {
        setMaps((prev) => ({ ...prev, ao: setupTex(t, false) }));
      });
    } else {
      setMaps((prev) => ({ ...prev, ao: null }));
    }
  }, [targetDiffuse, targetNormal, targetRoughness, targetAO, isTraversada]);

  return maps;
}
