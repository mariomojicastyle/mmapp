import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { use3BFStore } from "@/lib/store";

interface SelectionSilhouetteOutlineProps {
  furnitureGroup: THREE.Group | null;
}

/**
 * 🎨 Silueta Perimetral de Selección en Tiempo Real (Estilo Blender 3D Viewport)
 * 
 * Arquitectura Direct-Overlay:
 * 1. La escena 3D (mueble, textura de madera, iluminación, sombras y fondo #F3F4F6)
 *    se renderiza de forma 100% nativa con gl.render(scene, camera).
 *    -> Cero alteración de color de la textura (madera natural intacta).
 *    -> Cero alteración del brillo del escenario (fondo claro original intacto).
 * 2. OutlinePass se ejecuta en overlay directo sobre el canvas (renderToScreen = false, target = null)
 *    utilizando Premultiplied Alpha Blending para trazar ÚNICAMENTE la silueta naranja exacta de Blender.
 * 3. Color oficial de selección Blender RGBA: e35716ff (#e35716).
 * 4. Contacto flush sin separación: Resolución 1:1 (downSampleRatio = 1) y eliminación
 *    del recorte de máscara para que la línea toque directamente la geometría del mueble sin espacio vacío.
 */
export function SelectionSilhouetteOutline({ furnitureGroup }: SelectionSilhouetteOutlineProps) {
  const { gl, scene, camera, size } = useThree();
  const { coloresApariencia } = use3BFStore();

  const outlinePass = useMemo(() => {
    const pixelRatio = gl.getPixelRatio();
    const pass = new OutlinePass(
      new THREE.Vector2(size.width * pixelRatio, size.height * pixelRatio),
      scene,
      camera
    );

    pass.renderToScreen = false; // Overlay directo sobre el canvas ya renderizado

    // 🎯 RESOLUCIÓN NATIVA 1:1 (Sin submuestreo):
    // Evita el desfase espacial de medio píxel que generaba separación/vacío respecto a la geometría
    pass.downSampleRatio = 1;

    // Parámetros de precisión estética Blender (Línea nítida, compacta y en contacto)
    pass.edgeStrength = 3.5;
    pass.edgeGlow = 0.0;
    pass.edgeThickness = 1.0;
    pass.pulsePeriod = 0;

    // 🎯 CONTACTO FÍSICO DIRECTO CON EL MUEBLE (Eliminación de la brecha de vacío):
    // El shader por defecto de Three.js multiplica por `maskColor.r`, recortando la porción interna
    // del trazo y generando una separación visible. Al eliminar ese recorte, la silueta abraza y toca
    // directamente el perímetro del objeto como en Blender.
    pass.overlayMaterial.fragmentShader = pass.overlayMaterial.fragmentShader.replace(
      "maskColor.r * edgeValue",
      "edgeValue"
    );
    pass.overlayMaterial.needsUpdate = true;

    // Alpha blending premultiplicado para overlay limpio sin quemar a blanco ni saturar a rojo
    pass.overlayMaterial.blending = THREE.CustomBlending;
    pass.overlayMaterial.blendSrc = THREE.OneFactor;
    pass.overlayMaterial.blendDst = THREE.OneMinusSrcAlphaFactor;
    pass.overlayMaterial.blendEquation = THREE.AddEquation;

    // 🎨 Color oficial de selección Blender: RGBA e35716ff (#e35716)
    const baseColor = new THREE.Color(coloresApariencia.objetosSeleccionados || "#e35716");
    pass.visibleEdgeColor.copy(baseColor);
    pass.hiddenEdgeColor.copy(baseColor);

    pass.setSize(size.width * pixelRatio, size.height * pixelRatio);

    return pass;
  }, [gl, scene, camera, coloresApariencia.objetosSeleccionados]);

  // Actualizar resolución ante cambios del viewport
  useEffect(() => {
    if (outlinePass) {
      const pixelRatio = gl.getPixelRatio();
      outlinePass.setSize(size.width * pixelRatio, size.height * pixelRatio);
    }
  }, [size, gl, outlinePass]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      outlinePass.dispose();
    };
  }, [outlinePass]);

  // Render loop a 60 FPS con prioridad 1
  useFrame((state, delta) => {
    // 1. Renderizado 100% NATIVO y puro de la escena (fondo y texturas completamente intactos)
    state.gl.render(state.scene, state.camera);

    const storeState = use3BFStore.getState();
    const isSelected = storeState.objetoSeleccionado;
    const activeId = storeState.objetoActivoId;

    // Si no está seleccionado o no hay instancia activa, la silueta no se dibuja
    if (!isSelected || !activeId) {
      if (outlinePass.selectedObjects.length > 0) {
        outlinePass.selectedObjects = [];
      }
      return;
    }

    // Obtener el grupo 3D exacto de la instancia activa
    const groupsMap = typeof window !== "undefined" ? (window as any).__3bfInstanceGroups : null;
    const targetGroup: THREE.Group | null =
      (groupsMap && activeId && groupsMap.get(activeId)) || furnitureGroup;

    if (!targetGroup) {
      if (outlinePass.selectedObjects.length > 0) {
        outlinePass.selectedObjects = [];
      }
      return;
    }

    // 2. Sincronizar cámara
    outlinePass.renderCamera = state.camera;

    // Color oficial según modo
    if (storeState.modoTransformacion === "grab") {
      outlinePass.visibleEdgeColor.set(coloresApariencia.objetosBloqueados || "#111827");
      outlinePass.hiddenEdgeColor.set(coloresApariencia.objetosBloqueados || "#111827");
    } else {
      // 🎨 Color Blender oficial: #e35716
      const colorSeleccion = coloresApariencia.objetosSeleccionados || "#e35716";
      outlinePass.visibleEdgeColor.set(colorSeleccion);
      outlinePass.hiddenEdgeColor.set(colorSeleccion);
    }

    // Recolectar mallas sólidas de la instancia
    const targetMeshes: THREE.Mesh[] = [];
    targetGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.visible) {
        if (!(child as any).isLineSegments && !(child as any).isLine) {
          targetMeshes.push(child as THREE.Mesh);
        }
      }
    });

    if (targetMeshes.length === 0) {
      if (outlinePass.selectedObjects.length > 0) {
        outlinePass.selectedObjects = [];
      }
      return;
    }

    outlinePass.selectedObjects = targetMeshes;

    // 3. Trazar ÚNICAMENTE la silueta directamente sobre el canvas existente
    outlinePass.render(state.gl, null as any, null as any, delta, false);
  }, 1);

  return null;
}

export default SelectionSilhouetteOutline;
