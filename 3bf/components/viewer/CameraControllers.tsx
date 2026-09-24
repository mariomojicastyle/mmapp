"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { use3BFStore } from "@/lib/store";

export function BlenderNavigationController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera, gl } = useThree();
  const { modoTransformacion } = use3BFStore();

  useEffect(() => {
    const domElement = gl.domElement;
    let isMiddleDragging = false;
    let isCtrlZooming = false;
    let isShiftPanning = false;
    let prevY = 0;
    let prevX = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 1) {
        isMiddleDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;

        if (e.ctrlKey || e.metaKey) {
          isCtrlZooming = true;
          isShiftPanning = false;
          if (controlsRef.current) controlsRef.current.enabled = false;
        } else if (e.shiftKey) {
          isShiftPanning = true;
          isCtrlZooming = false;
          if (controlsRef.current) controlsRef.current.enabled = false;
        } else {
          isCtrlZooming = false;
          isShiftPanning = false;
          if (controlsRef.current && modoTransformacion !== "grab") {
            controlsRef.current.enabled = true;
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isMiddleDragging) return;

      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      const controls = controlsRef.current;
      if (!controls) return;

      if (isCtrlZooming) {
        // Zoom in si deltaY < 0 (hacia arriba acerca), Zoom out si deltaY > 0 (hacia abajo aleja)
        const target = controls.target || new THREE.Vector3(0, 0, 0);
        const offset = camera.position.clone().sub(target);
        const currentDist = offset.length();

        const zoomSpeed = 0.007;
        const scaleFactor = Math.max(0.1, 1.0 + (deltaY * zoomSpeed));
        
        const minD = controls.minDistance || 0.2;
        const maxD = controls.maxDistance || 20.0;
        const newDist = Math.max(minD, Math.min(maxD, currentDist * scaleFactor));
        
        offset.setLength(newDist);
        camera.position.copy(target).add(offset);
        camera.updateProjectionMatrix();
        controls.update();
      } else if (isShiftPanning) {
        const target = controls.target || new THREE.Vector3(0, 0, 0);
        const offset = camera.position.clone().sub(target);
        const panSpeed = Math.max(0.0005, offset.length() * 0.0012);

        const vRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(-deltaX * panSpeed);
        const vUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(deltaY * panSpeed);

        camera.position.add(vRight).add(vUp);
        target.add(vRight).add(vUp);
        camera.updateProjectionMatrix();
        controls.update();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 1) {
        isMiddleDragging = false;
        isCtrlZooming = false;
        isShiftPanning = false;
        if (controlsRef.current && modoTransformacion !== "grab") {
          controlsRef.current.enabled = true;
        }
      }
    };

    domElement.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [camera, gl, controlsRef, modoTransformacion]);

  return null;
}

export function CameraRefBridge({ cameraRef }: { cameraRef: React.MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree();
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);
  return null;
}

export function ThumbnailCapturer() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    (window as any).__capturarThumbnail3BF = () => {
      try {
        gl.render(scene, camera);
        const srcCanvas = gl.domElement;
        const width = srcCanvas.width;
        const height = srcCanvas.height;
        if (!width || !height) return null;

        // Recorte cuadrado exactamente centrado
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        const offscreen = document.createElement("canvas");
        offscreen.width = 360;
        offscreen.height = 360;
        const ctx = offscreen.getContext("2d");
        if (ctx) {
          ctx.drawImage(srcCanvas, startX, startY, size, size, 0, 0, 360, 360);
          return offscreen.toDataURL("image/webp", 0.92);
        }
        return srcCanvas.toDataURL("image/webp", 0.85);
      } catch (e) {
        console.error("Error al capturar thumbnail 3D centrado:", e);
        return null;
      }
    };

    // 📸 Captura limpia en alta resolución para Render IA (proporción exacta 1:1 sin deformación y fondo blanco puro)
    (window as any).__capturarEscenaRenderIA = (opts?: { width?: number; height?: number; aspectRatio?: string }) => {
      try {
        const targetW = opts?.width || 1024;
        const targetH = opts?.height || 1024;

        // Ocultar temporalmente ayudas visuales, grilla de suelo Drei, ejes y líneas de selección
        const hiddenObjects: { obj: THREE.Object3D; wasVisible: boolean }[] = [];
        scene.traverse((obj) => {
          const n = (obj.name || "").toLowerCase();
          const isHelper =
            n.includes("grid") ||
            n.includes("helper") ||
            n.includes("selection") ||
            n.includes("bbox") ||
            n.includes("snap") ||
            n.includes("axes") ||
            n.includes("ground") ||
            n.includes("silhouette") ||
            n.includes("gizmo") ||
            n.includes("transform") ||
            obj.type === "GridHelper" ||
            obj.type === "AxesHelper" ||
            (obj.type === "Mesh" && (obj.position.y <= 0 && obj.position.y >= -0.01) && !(obj as any).geometry?.attributes?.position?.count);

          if (isHelper) {
            if (obj.visible) {
              hiddenObjects.push({ obj, wasVisible: true });
              obj.visible = false;
            }
          }
        });

        // Forzar render limpio
        gl.render(scene, camera);
        const srcCanvas = gl.domElement;
        const width = srcCanvas.width;
        const height = srcCanvas.height;

        let resultBase64 = "";
        if (width && height) {
          const offscreen = document.createElement("canvas");
          offscreen.width = targetW;
          offscreen.height = targetH;
          const ctx = offscreen.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF"; // Fondo blanco puro de estudio comercial

            // CÁLCULO PROPORCIONAL EXACTO (Cero deformación / Aspect Ratio Matching)
            const targetRatio = targetW / targetH;
            const srcRatio = width / height;

            let cropW = width;
            let cropH = height;
            let startX = 0;
            let startY = 0;

            if (srcRatio > targetRatio) {
              // El canvas original es más ancho: recortar los lados para centrar perfectamente
              cropW = height * targetRatio;
              startX = (width - cropW) / 2;
            } else {
              // El canvas original es más alto: recortar arriba y abajo para centrar
              cropH = width / targetRatio;
              startY = (height - cropH) / 2;
            }

            ctx.fillRect(0, 0, targetW, targetH);
            ctx.drawImage(srcCanvas, startX, startY, cropW, cropH, 0, 0, targetW, targetH);
            resultBase64 = offscreen.toDataURL("image/png");
          } else {
            resultBase64 = srcCanvas.toDataURL("image/png");
          }
        }

        // Restaurar visibilidad
        hiddenObjects.forEach(({ obj, wasVisible }) => {
          obj.visible = wasVisible;
        });
        gl.render(scene, camera);

        return resultBase64;
      } catch (e) {
        console.error("Error capturando escena limpia para Render IA:", e);
        return null;
      }
    };

    return () => {
      delete (window as any).__capturarThumbnail3BF;
      delete (window as any).__capturarEscenaRenderIA;
    };
  }, [gl, scene, camera]);
  return null;
}

export function CameraViewController({ 
  furnitureGroup, 
  controlsRef 
}: { 
  furnitureGroup: THREE.Group | null;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const centrarCamaraTrigger = use3BFStore((s) => s.centrarCamaraTrigger);
  const campoDeVisionFov = use3BFStore((s) => s.calibracion.campoDeVisionFov || 45);

  useEffect(() => {
    if (camera && "fov" in camera) {
      (camera as THREE.PerspectiveCamera).fov = campoDeVisionFov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }, [camera, campoDeVisionFov]);

  useEffect(() => {
    if (centrarCamaraTrigger > 0 && controlsRef.current && camera) {
      let targetGroup: THREE.Object3D | null = furnitureGroup;

      if (!targetGroup || targetGroup.children.length === 0) {
        if (typeof window !== "undefined") {
          const s = use3BFStore.getState();
          const groupsMap = (window as any).__3bfInstanceGroups as Map<string, THREE.Group> | undefined;
          if (groupsMap && groupsMap.size > 0) {
            if (s.objetoActivoId && groupsMap.has(s.objetoActivoId)) {
              targetGroup = groupsMap.get(s.objetoActivoId)!;
            } else {
              targetGroup = groupsMap.values().next().value || null;
            }
          } else if ((window as any).__threeScene3BF) {
            targetGroup = (window as any).__threeScene3BF;
          }
        }
      }

      if (targetGroup && targetGroup.children.length > 0) {
        const box = new THREE.Box3().setFromObject(targetGroup);
        if (!box.isEmpty()) {
          const center = new THREE.Vector3();
          const size = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(size);

          const maxDim = Math.max(size.x, size.y, size.z, 0.4);
          const fov = ((camera as THREE.PerspectiveCamera).fov || 45) * (Math.PI / 180);
          let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
          cameraDistance = Math.max(cameraDistance, 0.8);

          controlsRef.current.target.set(center.x, center.y, center.z);
          camera.position.set(
            center.x + cameraDistance * 0.7,
            center.y + cameraDistance * 0.6,
            center.z + cameraDistance * 0.9
          );
          camera.lookAt(center);
          controlsRef.current.update();
          return;
        }
      }

      // Default fallback
      controlsRef.current.target.set(0.25, 0.3, -0.24);
      camera.position.set(0.6, 0.9, 1.1);
      camera.lookAt(0.25, 0.3, -0.24);
      controlsRef.current.update();
    }
  }, [centrarCamaraTrigger, furnitureGroup, controlsRef, camera]);

  const pasoActivoManualId = use3BFStore((s) => s.pasoActivoManualId);
  const pestanaActiva = use3BFStore((s) => s.pestanaActiva);
  const ultimoPasoBloqueConfiguradoRef = useRef<string | null>(null);

  useEffect(() => {
    if (pestanaActiva === "manual" && controlsRef.current && camera) {
      const pasos = use3BFStore.getState().pasosManual;
      const p = pasos.find((step) => step.id === pasoActivoManualId);
      if (p?.tipo === "bloque_estandar") {
        // Solo encuadrar la cámara al ENTRAR por primera vez a este bloque estándar,
        // permitiendo que el usuario mueva libremente la cámara sin que se reinicie al guardar el thumbnail
        if (ultimoPasoBloqueConfiguradoRef.current !== pasoActivoManualId) {
          ultimoPasoBloqueConfiguradoRef.current = pasoActivoManualId;
          controlsRef.current.target.set(0, 0.1, 0);
          camera.position.set(0.32, 0.28, 0.38);
          camera.lookAt(0, 0.1, 0);
          controlsRef.current.update();
        }
      } else {
        ultimoPasoBloqueConfiguradoRef.current = null;
      }
    } else {
      ultimoPasoBloqueConfiguradoRef.current = null;
    }
  }, [pestanaActiva, pasoActivoManualId, controlsRef, camera]);

  return null;
}

/**
 * 🎥 CameraPersistenceController
 * 
 * Gestiona la memoria fotográfica de la cámara 3D:
 * 1. Restaura las coordenadas de posición y target guardadas en el mueble activo o en sesión local.
 * 2. Escucha el final de cada órbita/paneo/zoom del usuario para persistir la posición en tiempo real.
 * 3. Garantiza que cambiar entre pestañas o recargar mantenga la vista exacta elegida por el usuario.
 */
export function CameraPersistenceController({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  const { camera } = useThree();
  const setCamaraEscena = use3BFStore((s) => s.setCamaraEscena);
  const muebleActivoGuardado = use3BFStore((s) => s.muebleActivoGuardado);
  const camaraEscenaStore = use3BFStore((s) => s.camaraEscena);
  const muebleId = muebleActivoGuardado?.id;
  const ultimoMuebleRestauradoRef = useRef<string | null>(null);

  // 1. Restaurar cámara cuando se abre o cambia el mueble activo
  useEffect(() => {
    if (!controlsRef.current || !camera || !muebleId) return;

    if (ultimoMuebleRestauradoRef.current !== muebleId) {
      ultimoMuebleRestauradoRef.current = muebleId;

      // 🛡️ Si estamos en la pestaña manual y el paso activo tiene keyframes cinematográficos,
      // NO restauramos la cámara genérica para no competir con el director de animación
      const estadoStore = use3BFStore.getState();
      if (estadoStore.pestanaActiva === "manual") {
        const pasoActual = estadoStore.pasosManual.find((p) => p.id === estadoStore.pasoActivoManualId);
        if (pasoActual && (pasoActual.keyframesCamara?.length || 0) > 0 && pasoActual.camaraCinematicaActiva !== false) {
          return;
        }
      }

      // A) Buscar en mueble guardado (.3bf.json)
      const camaraItem = muebleActivoGuardado?.camara || camaraEscenaStore;
      if (camaraItem && Array.isArray(camaraItem.position) && Array.isArray(camaraItem.target)) {
        camera.position.set(camaraItem.position[0], camaraItem.position[1], camaraItem.position[2]);
        controlsRef.current.target.set(camaraItem.target[0], camaraItem.target[1], camaraItem.target[2]);
        camera.lookAt(camaraItem.target[0], camaraItem.target[1], camaraItem.target[2]);
        if (camaraItem.fov && "fov" in camera) {
          (camera as THREE.PerspectiveCamera).fov = camaraItem.fov;
          (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
        controlsRef.current.update();
        return;
      }

      // B) Buscar en caché local de sesión de este mueble
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`3bf_camara_${muebleId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed?.position) && Array.isArray(parsed?.target)) {
              camera.position.set(parsed.position[0], parsed.position[1], parsed.position[2]);
              controlsRef.current.target.set(parsed.target[0], parsed.target[1], parsed.target[2]);
              camera.lookAt(parsed.target[0], parsed.target[1], parsed.target[2]);
              controlsRef.current.update();
              return;
            }
          }
        } catch (_) {}
      }
    }
  }, [muebleId, muebleActivoGuardado?.camara, camaraEscenaStore, camera, controlsRef]);

  // 2. Escuchar cuando el usuario termina de orbitar, panear o hacer zoom
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const alTerminarMovimiento = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!camera || !controls) return;

        const pos = camera.position;
        const tgt = controls.target;

        const camPayload = {
          position: [
            Number(pos.x.toFixed(4)),
            Number(pos.y.toFixed(4)),
            Number(pos.z.toFixed(4)),
          ] as [number, number, number],
          target: [
            Number(tgt.x.toFixed(4)),
            Number(tgt.y.toFixed(4)),
            Number(tgt.z.toFixed(4)),
          ] as [number, number, number],
          fov: (camera as THREE.PerspectiveCamera).fov || 45,
        };

        setCamaraEscena(camPayload);

        // Guardar en sesión de navegador para persistencia ultrarrápida entre recargas
        const currentMuebleId = use3BFStore.getState().muebleActivoGuardado?.id;
        if (currentMuebleId && typeof window !== "undefined") {
          try {
            localStorage.setItem(`3bf_camara_${currentMuebleId}`, JSON.stringify(camPayload));
            localStorage.setItem(`3bf_camara_ultima_global`, JSON.stringify(camPayload));
          } catch (_) {}
        }
      }, 100);
    };

    controls.addEventListener("end", alTerminarMovimiento);

    return () => {
      controls.removeEventListener("end", alTerminarMovimiento);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [controlsRef, camera, setCamaraEscena]);

  return null;
}
