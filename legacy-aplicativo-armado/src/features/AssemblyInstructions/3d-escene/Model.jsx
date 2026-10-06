import { useMatcapTexture, useAnimations, useGLTF, Html } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import useEnviroment from "../hooks/useEnviroment.js";
import Floor from "./Floor/Floor.jsx";
import { getAssetPath, resolveAlias, translateHerraje } from "../../../lib/assets.js";
import { isPieceName, extractPieceNumber, translatePieceLabel } from "../../../lib/pieceUtils.js";
import { decryptBuffer } from "../../../lib/cryptoAES.js";

// Configurar el decodificador de Draco directamente desde el origen verificado de Netlify
if (typeof window !== "undefined") {
  useGLTF.setDecoderPath("https://mario-mojica-armado.netlify.app/draco/gltf/");
}

const glbCache = {}; // Cache local: Url original -> ObjectURL del Blob desencriptado
const glbPromiseCache = {}; // Deduplicación de descargas y descifrados en vuelo

export async function getProtectedGLB(url, manualId) {
  if (glbCache[url]) return glbCache[url];
  if (glbPromiseCache[url]) return glbPromiseCache[url];
  
  glbPromiseCache[url] = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error descargando modelo: ${response.status}`);
      const buffer = await response.arrayBuffer();
      
      // Revertir cifrado AES-256 en memoria
      const decrypted = await decryptBuffer(buffer, manualId);
      
      const blob = new Blob([decrypted], { type: "model/gltf-binary" });
      const objectUrl = URL.createObjectURL(blob);
      glbCache[url] = objectUrl;
      return objectUrl;
    } finally {
      delete glbPromiseCache[url];
    }
  })();
  
  return glbPromiseCache[url];
}

function cleanMeshIdentifier(rawName) {
  if (!rawName) return "";
  
  // Immediate return guard for already cleaned Tornillo names
  const lowerRaw = rawName.toLowerCase().trim();
  if (lowerRaw === "tornillo_1" || lowerRaw === "tornillo_2") {
    return rawName.trim();
  }
  
  // GUARDIA: Si es un nombre de pieza (Pieza/Peça/Part + número),
  // retornarlo tal cual sin recortar el número legítimo
  const pieceData = extractPieceNumber(rawName);
  if (pieceData) {
    return rawName.trim();
  }
  // Si empieza con sinónimo de pieza pero sin número, pasar al flujo normal
  if (isPieceName(rawName)) {
    return rawName.trim();
  }
  
  // 1. Obtener la primera sección (antes de cualquier "-") y limpiar espacios
  let name = rawName.split("-")[0].trim();
  
  // 2. Curación definitiva de sufijos de Blender (ej. "PARAL_6A001" -> "PARAL_6A", "TORNILLO_0004705050" -> "TORNILLO_0004705")
  // El exportador quita el punto de los duplicados de Blender (.001, .050, etc.) convirtiéndolos en 001, 050 al final
  name = name.replace(/[._]?0\d\d$/i, "");
  name = name.replace(/_$/, "");
  
  // 3. Regla inteligente del guion bajo (no corta palabras, solo números/códigos redundantes)
  // ej: "CAJA_0002715_13" -> "CAJA_0002715" (conserva 'CAJA' y '0002715', corta el segundo código '13')
  // ej: "Frente_de_cajon_1" -> "Frente_de_cajon_1" (no corta 'de' ni 'cajon' porque son texto puro)
  const parts2 = name.split("_");
  const resultParts = [];
  let codeCount = 0;
  
  for (let i = 0; i < parts2.length; i++) {
    const part = parts2[i];
    const isPureText = !/\d/.test(part);
    
    if (isPureText) {
      resultParts.push(part);
    } else {
      if (codeCount === 0) {
        if (/^\d+$/.test(part)) {
          const num = parseInt(part, 10);
          const isEnsamblaje = lowerRaw.startsWith("ensamblaje");
          const isInstance = !isEnsamblaje && (num < 100 || (part.length === 4 && part.substring(1, 3) === "00"));
          if (isInstance) {
            // Es una instancia generada por Rhino/Blender, la omitimos
            continue;
          }
        }
        resultParts.push(part);
        codeCount++;
      } else {
        break;
      }
    }
  }
  name = resultParts.join("_");
  
  // 4. Limpieza de sufijos comunes de materiales (ej. Cubierta_balance -> Cubierta)
  const sufijosMat = ["_BALANCE", "_TAPA", "_CANTO", "_LAMINADO", " BALANCE", " TAPA", " CANTO", " LAMINADO"];
  let upperName = name.toUpperCase();
  for (const suf of sufijosMat) {
    if (upperName.endsWith(suf)) {
      name = name.substring(0, name.length - suf.length);
      upperName = name.toUpperCase();
    }
  }

  // Specific rule for two types of Tornillos (inverted to match P01 correct screw)
  const lowerName = name.toLowerCase();
  if (lowerName.startsWith("tornillo_0000152")) {
    name = "Tornillo_2";
  } else if (lowerName.startsWith("tornillo_0004705") || lowerName.startsWith("tornillo_000152")) {
    name = "Tornillo_1";
  } else {
    // Nueva regla: Quitar codificación numérica de herrajes españoles (todo lo que va desde el primer '_')
    const esHerrajeMaderkit = /tornillo|perno|tarugo|bisagra|deslizador|corredera|riel|soporte|clavo|tapa|minifix|cama|perfil|regula|patin|pivote|tuerca|arandela|jaladera|tirador|pija|angulo|union|mensula|mariposa/i.test(name);
    if (esHerrajeMaderkit && name.includes("_")) {
      name = name.split("_")[0];
    }
  }
  
  return name;
}

/**
 * Calcula en tiempo real el centro de gravedad (baricentro 3D) de las mallas
 * que están actualmente ACTIVAS y VISIBLES en pantalla (dentro del frustum de la cámara).
 * Permite que el zoom y la órbita manual se centren en la pieza en curso y no en el mueble final vacío.
 */
export function getActiveOnScreenCenter(scene, camera, fallback) {
  if (!scene || !camera) return fallback || new THREE.Vector3(0, 0.5, 0);

  const projScreenMatrix = new THREE.Matrix4();
  projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  const frustum = new THREE.Frustum();
  frustum.setFromProjectionMatrix(projScreenMatrix);

  const forwardDir = new THREE.Vector3();
  camera.getWorldDirection(forwardDir);

  const activeBox = new THREE.Box3();
  let meshesFound = 0;

  scene.traverse((node) => {
    if (node.isMesh && node.geometry && !node.isCamera) {
      const lowerName = (node.name || "").toLowerCase();
      const isAuxiliary = lowerName.includes("floor") || lowerName.includes("piso") || 
                          lowerName.includes("ground") || lowerName.includes("helper") || 
                          lowerName.includes("camera") || lowerName.includes("light");
      if (isAuxiliary) return;
      if (node.visible === false) return;

      // Descartar mallas que aún no nacen o tienen escala nula/colapsada
      const s = node.scale;
      if (Math.abs(s.x) < 0.005 || Math.abs(s.y) < 0.005 || Math.abs(s.z) < 0.005) {
        return;
      }

      node.updateWorldMatrix(true, false);

      if (!node.geometry.boundingBox) {
        node.geometry.computeBoundingBox();
      }
      if (!node.geometry.boundingBox) return;

      const meshBox = node.geometry.boundingBox.clone();
      meshBox.applyMatrix4(node.matrixWorld);

      // Comprobar si la malla intersecta el frustum de la cámara
      if (frustum.intersectsBox(meshBox)) {
        const meshCenter = new THREE.Vector3();
        meshBox.getCenter(meshCenter);
        // Debe estar delante del lente de la cámara
        if (meshCenter.clone().sub(camera.position).dot(forwardDir) > 0.01) {
          activeBox.union(meshBox);
          meshesFound++;
        }
      }
    }
  });

  if (meshesFound > 0 && !activeBox.isEmpty()) {
    const center = new THREE.Vector3();
    activeBox.getCenter(center);
    return center;
  }

  return fallback || new THREE.Vector3(0, 0.5, 0);
}

/**
 * Calcula un Target estrictamente COLINEAL con la dirección de visión actual de la cámara.
 * Proyecta un rayo hacia adelante (forwardDir) y toma la distancia hacia el centro de las
 * piezas visibles en pantalla. Al ser target = camera.position + forwardDir * dist,
 * el ángulo entre la cámara y el target es exactamente 0°, ERRADICANDO al 100%
 * cualquier salto, latigazo o descuadre angular en OrbitControls al hacer touch o zoom.
 */
export function calcularTargetColinealSuave(scene, camera, fallback) {
  if (!scene || !camera) return fallback || new THREE.Vector3(0, 0.5, 0);

  const forwardDir = new THREE.Vector3();
  camera.getWorldDirection(forwardDir);

  // Obtener el centro geométrico de lo que está visible actualmente en el visor
  const activeCenter = getActiveOnScreenCenter(scene, camera, fallback);

  // Proyectar el vector desde la cámara hacia el centro activo sobre la línea de visión forwardDir
  const camToCenter = activeCenter.clone().sub(camera.position);
  let dist = camToCenter.dot(forwardDir);

  // Seguridad: si la distancia proyectada es menor a 0.2m o negativa, usar distancia euclidiana o fallback seguro (1.2m)
  if (dist < 0.2) {
    dist = Math.max(0.5, camToCenter.length());
    if (dist < 0.2) dist = 1.2;
  }

  // El target resultante se encuentra EXACTAMENTE sobre la recta visual de la cámara
  return camera.position.clone().add(forwardDir.clone().multiplyScalar(dist));
}


function ActualModel(props) {
  // Obtiene los estados y funciones del contexto de uso
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const ChargeModel = useEnviroment((state) => state.ChargeModel);
  const pasos = useEnviroment((state) => state.pasos);
  const color = useEnviroment((state) => state.color);
  const phaseAudio = useEnviroment((state) => state.phaseAudio);
  const ActionFalse = useEnviroment((state) => state.ActionFalse);
  const AudioEnded = useEnviroment((state) => state.AudioEnded);
  const ResetBool = useEnviroment((state) => state.ResetBool);
  const ResetBoolFalse = useEnviroment((state) => state.ResetBoolFalse);
  const toolTip = useEnviroment((state) => state.toolTip);
  const onPointerMove = useEnviroment((state) => state.onPointerMove);
  const onPointerTrue = useEnviroment((state) => state.onPointerTrue);
  const onPointerFalse = useEnviroment((state) => state.onPointerFalse);
  const NameTooltipNull = useEnviroment((state) => state.NameTooltipNull);
  const StartApp = useEnviroment((state) => state.StartApp);
  const Cliente = useEnviroment((state) => state.Cliente);
  const PiezaHerraje = useEnviroment((state) => state.NamePieza);
  const SetComputedModelMinY = useEnviroment((state) => state.SetComputedModelMinY);
  const AnimationEndedTrue = useEnviroment((state) => state.AnimationEndedTrue);
  const AnimationEndedFalse = useEnviroment((state) => state.AnimationEndedFalse);
  const colorObjetoTocado = useEnviroment((state) => state.colorObjetoTocado);

  const CameraPosition = useEnviroment ((state) => state.cameraPositions)
  const alturas = useEnviroment((state) => state.alturas);
  const { camera } = useThree();

  // Scope: Verificar si el manual activo corresponde a la Cómoda Ravenna
  const isRavenna = Boolean(
    props.id === "Comoda_Ravenna" || 
    props.id?.toLowerCase()?.includes("ravenna") || 
    useEnviroment.getState().id === "Comoda_Ravenna" ||
    useEnviroment.getState().id?.toLowerCase()?.includes("ravenna")
  );

  // Referencia para el modelo 3D
  // 3D Model Instance Reference
  const modelRef = useRef();

  // original materials cache
  const materialsCache = useRef(new Map());
  
  const activeMeshRef = useRef(null);
  const activeCenterRef = useRef(new THREE.Vector3(0, 0.5, 0));
  const frameCountRef = useRef(0);
  const isTouchDevice = typeof window !== "undefined" && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const globalPiezaHerraje = useEnviroment((state) => state.PiezaHerraje);

  useEffect(() => {
    if (globalPiezaHerraje === "" && activeMeshRef.current) {
      const originalMat = materialsCache.current.get(activeMeshRef.current);
      if (originalMat) {
        activeMeshRef.current.material = originalMat;
      }
      activeMeshRef.current = null;
    }
  }, [globalPiezaHerraje]);


  // Pre-load highlights texture (Matcap) to prevent runtime compilation overhead
  const matcapTexture = useRef(null);
  const highlightMaterialRef = useRef(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(getAssetPath("/Matcaps/3.png"), (texture) => {
      matcapTexture.current = texture;
      highlightMaterialRef.current = new THREE.MeshMatcapMaterial({
        matcap: texture,
        color: new THREE.Color(useEnviroment.getState().colorObjetoTocado || "#ec4899"),
      });
    });
  }, []);

  useEffect(() => {
    if (highlightMaterialRef.current) {
      highlightMaterialRef.current.color.set(colorObjetoTocado || "#ec4899");
    }
  }, [colorObjetoTocado]);


  // Standard viewport defaults
  const defaultCameraPosX = -2,
    defaultCameraPosY = 1,
    defaultCameraPosZ = 5,
    defaultFov = 34;

  // Track active camera configurations derived from manual settings
  var activeCameraX = -2,
    activeCameraY = 1,
    activeCameraZ = 5,
    activeFov = 34;

  // Count of embedded GLB cameras parsed
  var embeddedCamerasCount = 0;


  // Carga del modelo GLB y sus animaciones - Local por paso (Capa protegida)
  const { scene, animations, cameras } = useGLTF(props.decryptedUrl);

  const sombras = useEnviroment((state) => state.sombras);

  // Asignar sombras a los objetos dinámicamente
  useEffect(() => {
    if (scene) {
      scene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = sombras;
          node.receiveShadow = sombras;
        }
      });
    }
  }, [scene, sombras]);





  

  // Cargador de texturas
  let textureLoader = new THREE.TextureLoader();
  let textMaterial, textMaterial2;

  // Desestructuración de las animaciones del modelo
  const { actions, mixer } = useAnimations(animations, scene);

  // Control de estado de animación finalizada
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      AnimationEndedTrue();
      return;
    }

    AnimationEndedFalse();

    if (!mixer) return;

    const handleFinished = (e) => {
      let anyRunning = false;
      Object.values(actions).forEach((act) => {
        if (act && act.isRunning()) {
          anyRunning = true;
        }
      });

      if (!anyRunning) {
        AnimationEndedTrue();
      }
    };

    mixer.addEventListener("finished", handleFinished);
    return () => {
      mixer.removeEventListener("finished", handleFinished);
    };
  }, [actions, mixer, AnimationEndedTrue, AnimationEndedFalse, pasoActual]);

  // Sincronizar duración del modelo 3D con el store global
  useEffect(() => {
    if (animations && animations.length > 0) {
      let maxDur = 0;
      animations.forEach((a) => {
        if (a.duration && a.duration > maxDur) maxDur = a.duration;
      });
      const isStep02 = isRavenna && (pasoActual === "02" || pasoActual === 2 || pasoActual === "2");
      const effectiveVisualDur = isStep02 ? maxDur * 2.0 : maxDur;
      useEnviroment.getState().SetAnimDuration(effectiveVisualDur);
    } else {
      useEnviroment.getState().SetAnimDuration(0);
    }
  }, [animations, pasoActual, isRavenna]);

  const animDuration = useEnviroment((state) => state.animDuration);
  const currentCamConfig = CameraPosition ? CameraPosition.find((item) => item.pasos == pasoActual) : null;
  const hasCameraAnimation = Boolean(
    ((cameras && cameras.length > 0) || scene?.getObjectByName("Camera")) &&
    animations?.some(clip => clip.tracks?.some(track => track.name.toLowerCase().includes("camera")))
  );
  const isGlbCamActive = Boolean(
    currentCamConfig?.useGlbCamera === true || 
    currentCamConfig?.cameraMode === "glb" || 
    hasCameraAnimation
  );

  // Sincronizar de forma inmediata con el store global si este paso tiene cámara guiada o animada
  useEffect(() => {
    useEnviroment.getState().SetHasGuidedCamera(isGlbCamActive);
  }, [isGlbCamActive, pasoActual]);


  // Exponer API de búsqueda interactiva (Scrubbing / Seek) para el Slider
  useEffect(() => {
    window.__seekAnimation = (targetTime) => {
      const isStep00 = isRavenna && (pasoActual === "00" || pasoActual === 0);
      const isStep02 = isRavenna && (pasoActual === "02" || pasoActual === 2 || pasoActual === "2");
      const validTime = Math.max(0, targetTime);
      const effectiveAnimDur = animDuration > 0 ? animDuration : validTime;
      
      let animTargetTime = Math.min(validTime, effectiveAnimDur);
      if (isStep00 && animDuration > 0) {
        animTargetTime = validTime % animDuration;
      } else if (isStep02) {
        animTargetTime = Math.min(validTime * 0.5, effectiveAnimDur);
      }

      if (actions) {
        Object.values(actions).forEach((act) => {
          if (act) {
            act.reset();
            act.play();
            act.paused = true;
            act.time = animTargetTime;
          }
        });
      }
      if (mixer) {
        mixer.update(0);
      }
      if (scene) {
        scene.updateMatrixWorld(true);
      }

      // Sincronización de la cámara durante el seek interactivo:
      // SOLO se sobreescribe la posición de la cámara si el usuario NO ha tomado el control de órbita manual.
      // Si el usuario rotó o hizo zoom libremente, su punto de vista se respeta al 100%,
      // permitiéndole avanzar y retroceder en el tiempo viendo el ensamble desde su ángulo preferido.
      if (isGlbCamActive && scene && !userInteractedWithCameraRef.current) {
        const glbCam = scene.getObjectByName("Camera") || (cameras && cameras.length > 0 ? cameras[0] : null);
        if (glbCam) {
          glbCam.updateWorldMatrix(true, false);
          const worldPos = new THREE.Vector3();
          const worldQuat = new THREE.Quaternion();
          glbCam.getWorldPosition(worldPos);
          glbCam.getWorldQuaternion(worldQuat);

          camera.position.copy(worldPos);
          camera.quaternion.copy(worldQuat);

          if (glbCam.fov && Math.abs(camera.fov - glbCam.fov) > 0.01) {
            camera.fov = glbCam.fov;
            camera.updateProjectionMatrix();
          }

          if (props.orbitControlsRef?.current) {
            const activeTarget = getActiveOnScreenCenter(scene, camera, modelCenter);
            props.orbitControlsRef.current.target.copy(activeTarget);
            activeCenterRef.current.copy(activeTarget);
            props.orbitControlsRef.current.update();
          }
        }
      }
    };

    window.__resumeAnimation = () => {
      const isStep00 = isRavenna && (pasoActual === "00" || pasoActual === 0);
      const isStep02 = isRavenna && (pasoActual === "02" || pasoActual === 2 || pasoActual === "2");
      const currentTime = useEnviroment.getState().animationCurrentTime || 0;
      const effectiveAnimDur = animDuration > 0 ? animDuration : currentTime;
      if (actions) {
        Object.values(actions).forEach((act) => {
          if (act) {
            if (isStep00) {
              act.paused = false;
              act.play();
            } else if (isStep02) {
              if (currentTime * 0.5 < effectiveAnimDur - 0.05) {
                act.paused = false;
                act.play();
              } else {
                act.paused = true;
              }
            } else {
              if (currentTime < effectiveAnimDur - 0.05) {
                act.paused = false;
                act.play();
              } else {
                act.paused = true;
              }
            }
          }
        });
      }
    };

    // Sincronizador llamado por el audio mientras avanza
    window.__syncAnimationToTime = (time) => {
      const isStep00 = isRavenna && (pasoActual === "00" || pasoActual === 0);
      const isStep02 = isRavenna && (pasoActual === "02" || pasoActual === 2 || pasoActual === "2");
      const effectiveAnimDur = animDuration > 0 ? animDuration : time;
      
      if (isStep00) {
        // En paso 00, no se detiene; se mantiene en bucle infinito
        return;
      }

      const evalTime = isStep02 ? time * 0.5 : time;
      if (evalTime >= effectiveAnimDur && actions) {
        Object.values(actions).forEach((act) => {
          if (act && !act.paused) {
            act.paused = true;
            act.time = effectiveAnimDur;
          }
        });
      }
    };

    return () => {
      delete window.__seekAnimation;
      delete window.__resumeAnimation;
      delete window.__syncAnimationToTime;
    };
  }, [mixer, actions, scene, camera, isGlbCamActive, cameras, props.orbitControlsRef, animDuration]);

  // Configuración inicial del modelo GLB, de la animación y de la cámara
  useEffect(() => {
    ChargeModel(scene); // Carga el modelo en la escena

    // Sincronizar escena de paso 00 para que PanelCantidades tenga acceso sin cargas duplicadas
    if (scene && (pasoActual === "00" || pasoActual === 0)) {
      useEnviroment.getState().CargarPasoInicial(scene);
    }

    // Auto-grounding: Calcular el punto más bajo del modelo (min.y) usando Box3
    // Esto permite al Floor.jsx y Experience.jsx posicionar el piso y skybox correctamente
    // sin depender de valores manuales hardcodeados
    if (scene) {
      scene.updateWorldMatrix(true, true);
      const box = new THREE.Box3();
      let hasMesh = false;
      scene.traverse((node) => {
        if (node.isMesh) {
          if (node.geometry) {
            if (!node.geometry.boundingBox) {
              node.geometry.computeBoundingBox();
            }
            const meshBox = node.geometry.boundingBox.clone();
            meshBox.applyMatrix4(node.matrixWorld);
            box.union(meshBox);
            hasMesh = true;
          }
        }
      });
      if (hasMesh && !box.isEmpty()) {
        SetComputedModelMinY(box.min.y);
      }
    }

    if (StartApp === true && actions) {
      const isStep00 = isRavenna && (pasoActual === "00" || pasoActual === 0);
      const isStep02 = isRavenna && (pasoActual === "02" || pasoActual === 2 || pasoActual === "2");

      Object.values(actions).forEach((act) => {
        if (act) {
          act.reset(); // Reinicia siempre la animación al cambiar de modelo
          if (isStep00) {
            act.clampWhenFinished = false;
            act.loop = THREE.LoopRepeat; // Bucle infinito en paso 00
            act.timeScale = 1.0;
          } else {
            act.clampWhenFinished = true; // Detiene la animación cuando finaliza
            act.loop = THREE.LoopOnce;    // Ejecuta la animación una sola vez
            act.timeScale = isStep02 ? 0.5 : 1.0; // 50% de velocidad (duración x2) en paso 02
          }
          act.paused = false;           // Asegura que arranque activa
          act.play();                   // Iniciar la animación si la app ha comenzado
        }
      });
    }

    let camarasCount = 0;
    scene.traverse(function (object) {
      if (object.isCamera) {
        camarasCount += 1;
      }
    });

    const posicionDeCamaraActual = CameraPosition ? CameraPosition.find((item) => item.pasos == pasoActual) : null;
    const hasCameraAnimation = Boolean(
      ((cameras && cameras.length > 0) || scene.getObjectByName("Camera")) &&
      animations?.some(clip => clip.tracks?.some(track => track.name.toLowerCase().includes("camera")))
    );
    const isGlbCamPreferred = Boolean(
      posicionDeCamaraActual?.useGlbCamera === true || 
      posicionDeCamaraActual?.cameraMode === "glb" || 
      hasCameraAnimation
    );
    useEnviroment.getState().SetHasGuidedCamera(isGlbCamPreferred);
    const useOverride = !isGlbCamPreferred && Boolean(posicionDeCamaraActual?.override && posicionDeCamaraActual?.position);

    // Buscar si existe un nodo de cámara en el GLB (configurada explícitamente o auto-detectada con animación)
    const glbCamNode = isGlbCamPreferred ? (scene.getObjectByName("Camera") || (cameras && cameras.length > 0 ? cameras[0] : null)) : null;

    // Calcular el centro geométrico y centro de gravedad real del mueble en su ESTADO FINAL ENSAMBLADO
    const effectiveAnimDur = animDuration > 0 ? animDuration : 0;

    if (mixer && effectiveAnimDur > 0) {
      mixer.setTime(effectiveAnimDur);
    }
    scene.updateWorldMatrix(true, true);

    const modelBox = new THREE.Box3();
    let hasMesh = false;
    scene.traverse((node) => {
      if (node.isMesh && node.geometry && !node.isCamera) {
        const lowerName = (node.name || "").toLowerCase();
        const isAuxiliary = lowerName.includes("floor") || lowerName.includes("piso") || lowerName.includes("ground") || lowerName.includes("helper") || lowerName.includes("camera") || lowerName.includes("light");
        if (!isAuxiliary) {
          if (!node.geometry.boundingBox) {
            node.geometry.computeBoundingBox();
          }
          if (node.geometry.boundingBox) {
            const meshBox = node.geometry.boundingBox.clone();
            meshBox.applyMatrix4(node.matrixWorld);
            modelBox.union(meshBox);
            hasMesh = true;
          }
        }
      }
    });

    const modelCenter = new THREE.Vector3(0, 0.5, 0);
    if (hasMesh && !modelBox.isEmpty()) {
      modelBox.getCenter(modelCenter);
    }

    // Restaurar el mixer al inicio para comenzar la animación desde t = 0
    if (mixer) {
      mixer.setTime(0);
    }
    scene.updateWorldMatrix(true, true);

    useEnviroment.getState().SetModelCenter([modelCenter.x, modelCenter.y, modelCenter.z]);

    if (useOverride && posicionDeCamaraActual?.position) {
      camera.position.set(
        posicionDeCamaraActual.position.x,
        posicionDeCamaraActual.position.y,
        posicionDeCamaraActual.position.z
      );

      // Usar centro de gravedad del mueble ensamblado como target de órbita
      let targetVec = modelCenter;
      if (alturas && alturas.length > 0) {
        const altData = alturas.find(a => a.paso === pasoActual);
        if (altData && altData.target && (altData.target[0] !== 0 || altData.target[1] !== 0 || altData.target[2] !== 0)) {
          targetVec = new THREE.Vector3(altData.target[0], altData.target[1], altData.target[2]);
        }
      }
      camera.lookAt(targetVec);
      if (props.orbitControlsRef && props.orbitControlsRef.current) {
        props.orbitControlsRef.current.target.copy(targetVec);
      }
      
      camera.setFocalLength(posicionDeCamaraActual.fov || defaultFov);
    } else if (glbCamNode) {
      // Usar cámara del GLB (3dBimFab animada o fija) SOLO si fue solicitada explícitamente
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      glbCamNode.getWorldPosition(worldPos);
      glbCamNode.getWorldQuaternion(worldQuat);

      camera.position.copy(worldPos);
      camera.quaternion.copy(worldQuat);

      if (typeof glbCamNode.getFocalLength === "function") {
        camera.setFocalLength(glbCamNode.getFocalLength());
      } else if (glbCamNode.fov) {
        camera.fov = glbCamNode.fov;
      }

      // Sincronizar el target de OrbitControls con el centro de gravedad de lo que está activo en pantalla
      const initialActiveCenter = getActiveOnScreenCenter(scene, camera, modelCenter);
      activeCenterRef.current.copy(initialActiveCenter);
      if (props.orbitControlsRef && props.orbitControlsRef.current) {
        props.orbitControlsRef.current.target.copy(initialActiveCenter);
      }
    } else if (posicionDeCamaraActual?.position) {
      camera.position.set(
        posicionDeCamaraActual.position.x,
        posicionDeCamaraActual.position.y,
        posicionDeCamaraActual.position.z
      );
      camera.lookAt(modelCenter);
      camera.setFocalLength(defaultFov);
      if (props.orbitControlsRef && props.orbitControlsRef.current) {
        props.orbitControlsRef.current.target.copy(modelCenter);
      }
    } else {
      // Si no hay configuración manual ni cámara GLB explícita, se usa la posición por defecto
      // y se enfoca exactamente al centro de gravedad del mueble del paso actual
      camera.position.set(defaultCameraPosX, defaultCameraPosY, defaultCameraPosZ);
      camera.lookAt(modelCenter);
      camera.setFocalLength(defaultFov);
      if (props.orbitControlsRef && props.orbitControlsRef.current) {
        props.orbitControlsRef.current.target.copy(modelCenter);
      }
    }

    camera.updateProjectionMatrix();

    // Actualizar los controles si están disponibles
    if (props.orbitControlsRef && props.orbitControlsRef.current) {
      props.orbitControlsRef.current.update();
    }
  }, [scene, StartApp, actions, camera, CameraPosition, pasoActual, props.orbitControlsRef, animDuration, mixer]);

  // Bandera para permitir órbita manual del usuario
  const userInteractedWithCameraRef = useRef(false);

  // Escuchar cuando el usuario interactúa manualmente con OrbitControls
  useEffect(() => {
    const controls = props.orbitControlsRef?.current;
    if (!controls) return;

    const onControlsStart = () => {
      // Si la cámara venía siendo guiada automáticamente por el GLB, sincronizar el target
      // exactamente a lo largo de la línea óptica de visión de la cámara hacia las piezas visibles.
      // Al ser colineal, el ángulo cámara-target es exactamente 0°, eliminando cualquier salto
      // o descuadre angular en OrbitControls al hacer touch o zoom (pinch-to-zoom).
      if (!userInteractedWithCameraRef.current) {
        const centerArr = useEnviroment.getState().modelCenter || [0, 0.5, 0];
        const furnitureCenter = new THREE.Vector3(centerArr[0], centerArr[1], centerArr[2]);
        const smoothColinearTarget = calcularTargetColinealSuave(scene, camera, furnitureCenter);
        if (controls && smoothColinearTarget) {
          controls.target.copy(smoothColinearTarget);
          activeCenterRef.current.copy(smoothColinearTarget);
          controls.update();
        }
      }
      userInteractedWithCameraRef.current = true;
      useEnviroment.getState().SetIsManualOrbit(true);
    };

    controls.addEventListener('start', onControlsStart);
    return () => {
      controls.removeEventListener('start', onControlsStart);
    };
  }, [props.orbitControlsRef?.current]);

  // Exponer API global para retomar la cámara guiada del GLB cuando se presiona Play
  useEffect(() => {
    window.__resumeGuidedCamera = () => {
      userInteractedWithCameraRef.current = false;
      useEnviroment.getState().SetIsManualOrbit(false);
    };
    return () => {
      delete window.__resumeGuidedCamera;
    };
  }, []);

  // Si cambia el paso o se resetea la animación, retomar la cinemática de la cámara
  useEffect(() => {
    userInteractedWithCameraRef.current = false;
    useEnviroment.getState().SetIsManualOrbit(false);
  }, [pasoActual, ResetBool]);

  // Sincronización continua en vivo cuadro a cuadro
  useFrame(() => {
    // 1. Sincronización unificada de tiempo para el Scrubber (P00 a P06)
    const isScrubbing = useEnviroment.getState().isScrubbing;
    const audioEl = typeof document !== "undefined" ? document.getElementById("audio") : null;
    const animDur = animDuration > 0 ? animDuration : 0;
    const audioDur = useEnviroment.getState().audioDuration || 0;
    const totalDur = Math.max(animDur, audioDur);

    if (!isScrubbing) {
      let masterTime = 0;
      const hasAudioTrack = audioEl && audioDur > 0 && !isNaN(audioEl.duration);
      const isStep00 = isRavenna && (pasoActual === "00" || pasoActual === 0);
      const isStep02 = isRavenna && (pasoActual === "02" || pasoActual === 2 || pasoActual === "2");
      const phase = useEnviroment.getState().phaseAudio;

      if (hasAudioTrack) {
        if (!audioEl.ended) {
          masterTime = audioEl.currentTime || 0;
        } else if (animDur > audioDur) {
          // El audio ya concluyó pero la animación 3D continúa su recorrido hasta animDur
          const activeAct = Object.values(actions || {}).find((a) => a && typeof a.time === "number");
          if (activeAct && typeof activeAct.time === "number") {
            // Si el paso opera a escala reducida (ej. P02 al 50%), convertimos el tiempo interno al tiempo visual real
            masterTime = isStep02 ? activeAct.time * 2.0 : activeAct.time;
          } else {
            masterTime = audioDur;
          }
        } else {
          masterTime = audioDur;
        }
      } else if (actions) {
        const activeAct = Object.values(actions).find((a) => a && a.isRunning()) || Object.values(actions)[0];
        if (activeAct && typeof activeAct.time === "number") {
          masterTime = isStep02 ? activeAct.time * 2.0 : activeAct.time;
        }
      }

      if (totalDur > 0 && typeof window.__updateScrubberUI === "function") {
        window.__updateScrubberUI(masterTime);
      }
      useEnviroment.getState().SetAnimationCurrentTime(masterTime);

      // Mantener acoplada la animación 3D cuando el audio es el reloj maestro
      if (hasAudioTrack && actions) {
        let isPlaying = false;
        if (phase === "playing") {
          if (!audioEl.paused) {
            isPlaying = true;
          } else if (audioEl.ended && animDur > audioDur) {
            isPlaying = true; // El audio terminó pero la animación sigue reproduciéndose
          }
        }
        
        let targetAnimTime = Math.min(masterTime, animDur);
        if (isStep00 && animDur > 0) {
          // Bucle continuo en Paso 00 durante toda la locución (Ravenna)
          targetAnimTime = masterTime % animDur;
        } else if (isStep02) {
          // 50% de velocidad (duración x2): el mixer interno llega a su clip original de duración a través del factor 0.5
          targetAnimTime = Math.min(masterTime * 0.5, animDur * 0.5);
        }

        const isFinished = !isStep00 && (masterTime >= totalDur);

        Object.values(actions).forEach((act) => {
          if (act) {
            if (isFinished) {
              act.time = isStep02 ? animDur * 0.5 : animDur;
              act.paused = true;
            } else {
              if (isPlaying) {
                act.paused = false;
                // Si el audio aún está reproduciéndose, sincronizamos al audio.
                // Si el audio terminó y la animación corre libremente por Three.js, dejamos que act.time avance naturalmente.
                if (!audioEl.ended && Math.abs(act.time - targetAnimTime) > 0.15) {
                  act.time = targetAnimTime;
                }
              } else {
                act.time = targetAnimTime;
                act.paused = true;
              }
            }
          }
        });

        // Si la animación o el paso ha alcanzado el final total definitivo:
        if (isFinished && phase === "playing") {
          const state = useEnviroment.getState();
          state.AudioEndedTrue();
          state.AnimationEndedTrue();
          state.ResetAudio();
          state.ActionTrue();
        }
      }
    }

    // 2. Cinemática de cámara animada del GLB y Órbita Libre
    const currentCamConfig = CameraPosition ? CameraPosition.find((item) => item.pasos == pasoActual) : null;
    const hasCameraAnimation = Boolean(
      ((cameras && cameras.length > 0) || scene.getObjectByName("Camera")) &&
      animations?.some(clip => clip.tracks?.some(track => track.name.toLowerCase().includes("camera")))
    );
    const isGlbCamActive = Boolean(
      currentCamConfig?.useGlbCamera === true || 
      currentCamConfig?.cameraMode === "glb" || 
      hasCameraAnimation
    );

    const controls = props.orbitControlsRef?.current;

    // Obtener centro de gravedad real del mueble
    const centerArr = useEnviroment.getState().modelCenter || [0, 0.5, 0];
    const furnitureCenter = new THREE.Vector3(centerArr[0], centerArr[1], centerArr[2]);

    // Garantizar que OrbitControls esté siempre habilitado para permitir toque en cualquier segundo
    if (controls && !controls.enabled) {
      controls.enabled = true;
    }

    if (!isGlbCamActive) {
      // Si el paso no tiene cámara animada en el GLB, OrbitControls opera con total libertad
      // (el target ya fue fijado al centro de gravedad al cargar el paso, permitiendo rotación, zoom y desplazamiento libre con 2 dedos).
      return;
    }

    const glbCamNode = scene.getObjectByName("Camera") || (cameras && cameras.length > 0 ? cameras[0] : null);
    if (!glbCamNode) return;

    // Si el usuario tomó el control para orbitar libremente:
    if (userInteractedWithCameraRef.current) {
      // Dejar que OrbitControls gestione la cámara de forma completamente libre
      // (rotación con 1 dedo, zoom y paneo/desplazamiento con 2 dedos).
      // NUNCA sobreescribir la posición ni el target de la cámara aquí para permitir reencuadre libre.
      // ¡Y la animación de las piezas y el audio de la locución continúan reproduciéndose fluidamente!
    } else {
      // MODO CÁMARA GUIADA AUTOMÁTICA DEL GLB:
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      glbCamNode.getWorldPosition(worldPos);
      glbCamNode.getWorldQuaternion(worldQuat);

      camera.position.copy(worldPos);
      camera.quaternion.copy(worldQuat);

      if (glbCamNode.fov && Math.abs(camera.fov - glbCamNode.fov) > 0.01) {
        camera.fov = glbCamNode.fov;
        camera.updateProjectionMatrix();
      }

      // Sincronizar target colineal con la recta visual de la cámara hacia las piezas activas
      if (controls) {
        frameCountRef.current++;
        if (frameCountRef.current % 6 === 0) {
          const smoothColinearTarget = calcularTargetColinealSuave(scene, camera, furnitureCenter);
          activeCenterRef.current.copy(smoothColinearTarget);
        }
        controls.target.copy(activeCenterRef.current);
      }
    }
  });

  // Preload inteligente solo del paso siguiente (hacia adelante) con respiro de CPU
  useEffect(() => {
    if (pasos && pasos.length > 0) {
      const idx = pasos.indexOf(pasoActual);
      if (idx !== -1 && idx < pasos.length - 1) {
        const nextStep = pasos[idx + 1];
        const nextUrl = getAssetPath(`/${props.id}/models/P${nextStep}.glb`);
        
        // Retardo de 1.5s para no competir con los primeros fotogramas de la animación en curso
        const timer = setTimeout(() => {
          getProtectedGLB(nextUrl, props.id)
            .then(objUrl => {
              useGLTF.preload(objUrl);
            })
            .catch(err => console.warn("[Preload] Paso siguiente omitido:", err));
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [pasoActual, pasos, props.id]);

  // para activar la animación cuando se de clic en el botón "repetir"
  useEffect(() => {
    if (ResetBool === true && actions) {
      AnimationEndedFalse();
      Object.values(actions).forEach((act) => {
        if (act) {
          act.paused = false;  // Asegura que la animación no esté pausada
          act.reset();  // Reinicia la animación
          act.play();  // Reproduce la animación después del reinicio
        }
      });
      ResetBoolFalse();  // Resetea el booleano para evitar múltiples reinicios
    } else if (ResetBool === true) {
      ResetBoolFalse();
    }
  }, [ResetBool, actions, ResetBoolFalse, AnimationEndedFalse]);

  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((act) => {
        if (act) {
          if (act.isRunning() && phaseAudio === 'paused') act.paused = true;
          else if (phaseAudio === 'playing') act.paused = false;
        }
      });
    }
  }, [phaseAudio, actions]);


  // Efecto para manejar la activación del ToolTip.
  useEffect(() => {
    if (toolTip !== "") {
      onPointerFalse(); // Desactiva el puntero para evitar interferencias

      scene.traverse((child) => {
        const cleanChildName = cleanMeshIdentifier(child.name);

        if (
          toolTip.includes(cleanChildName) &&
          child.name.includes(cleanChildName)
        ) {
          const name = toolTip.split("-");
          PiezaHerraje(name);
          Temporizador(child);
        } else if (toolTip === child.name) {
          PiezaHerraje([cleanChildName]);
          textMaterial2 = textureLoader.load(getAssetPath("/Matcaps/3.png"));
          if (!textMaterial2 || !textMaterial2.isMaterial) {
            console.error("Error: textMaterial2 is undefined or invalid");
            return;
          }
          child.material = textMaterial2;
        }
      });

      // Reactiva el puntero y limpia el estado del ToolTip después de 10 segundos
      setTimeout(() => {
        onPointerTrue();
        NameTooltipNull();
      }, 10000);
    }
  }, [toolTip]);

  function resolvePartDisplayName(object) {
    if (!object) return "";
    const idioma = useEnviroment.getState().idioma;
    
    // 1. Detectar si el nombre del mesh es directamente una pegatina de pieza
    //    (soporta "Pieza XX", "Peça XX", "Part XX", etc.)
    const rawName = object.name || "";
    const pieceMatch = extractPieceNumber(rawName);
    if (pieceMatch) {
      return translatePieceLabel(pieceMatch.number, idioma);
    }

    // 2. Detectar si el padre es un Empty de pegatina (retrocompatibilidad)
    const parentName = object.parent ? object.parent.name || "" : "";
    const parentPieceMatch = extractPieceNumber(parentName);
    if (parentPieceMatch) {
      return translatePieceLabel(parentPieceMatch.number, idioma);
    }

    const name = cleanMeshIdentifier(object.name);
    
    // 1. Obtener dimensiones físicas del mesh actual
    const worldBox = new THREE.Box3().setFromObject(object);
    const worldSize = new THREE.Vector3();
    worldBox.getSize(worldSize);
    
    let dimX = worldSize.x;
    let dimY = worldSize.y;
    let dimZ = worldSize.z;
    const minDim = Math.min(dimX, dimY, dimZ);
    
    if (minDim < 0.0001 && object.parent && object.parent.type !== 'Scene') {
      const parentBox = new THREE.Box3().setFromObject(object.parent);
      const parentSize = new THREE.Vector3();
      parentBox.getSize(parentSize);
      dimX = parentSize.x;
      dimY = parentSize.y;
      dimZ = parentSize.z;
    }
    
    const dims = [Math.abs(dimX), Math.abs(dimY), Math.abs(dimZ)].sort((a, b) => b - a);
    
    // 2. Autodetectar escala (metros vs milímetros)
    const scaleMult = dims[0] > 20 ? 1 : 1000;
    const l = Math.round(dims[0] * scaleMult);
    const w = Math.round(dims[1] * scaleMult);
    
    // Buscar la pieza en el despiece para obtener el número de sticker ("Pieza XX")
    let displayName = name;
    if (props.productData?.despiece) {
      // Encontrar por nombre y dimensiones físicas (tolerancia de 2mm por redondeos)
      const itemEncontrado = props.productData.despiece.find(
        (d) => 
          d.nombre && 
          cleanMeshIdentifier(d.nombre).toLowerCase() === name.toLowerCase() &&
          Math.abs((d.largo || 0) - l) <= 2 &&
          Math.abs((d.ancho || 0) - w) <= 2
      );
      
      if (itemEncontrado) {
        let numSticker = itemEncontrado.piezaNumeroStart;
        if (itemEncontrado.piezaNumeroRange && itemEncontrado.piezaNumeroStart !== undefined) {
          // Encontrar todos los meshes en la escena actual con este mismo nombre limpio y dimensiones similares
          const hermanos = [];
          scene.traverse((child) => {
            if (child.isMesh && cleanMeshIdentifier(child.name).toLowerCase() === name.toLowerCase()) {
              const hBox = new THREE.Box3().setFromObject(child);
              const hSize = new THREE.Vector3();
              hBox.getSize(hSize);
              
              let hX = hSize.x;
              let hY = hSize.y;
              let hZ = hSize.z;
              const hMin = Math.min(hX, hY, hZ);
              
              if (hMin < 0.0001 && child.parent && child.parent.type !== 'Scene') {
                const pBox = new THREE.Box3().setFromObject(child.parent);
                const pSize = new THREE.Vector3();
                pBox.getSize(pSize);
                hX = pSize.x;
                hY = pSize.y;
                hZ = pSize.z;
              }
              
              const hDims = [Math.abs(hX), Math.abs(hY), Math.abs(hZ)].sort((a, b) => b - a);
              const hl = Math.round(hDims[0] * scaleMult);
              const hw = Math.round(hDims[1] * scaleMult);
              
              if (Math.abs(hl - l) <= 2 && Math.abs(hw - w) <= 2) {
                hermanos.push(child);
              }
            }
          });
          // Encontrar el índice de nuestro mesh en la lista de hermanos
          const idx = hermanos.indexOf(object);
          if (idx !== -1 && idx < itemEncontrado.cantidad) {
            numSticker = itemEncontrado.piezaNumeroStart + idx;
          }
        }
        
        if (numSticker !== undefined) {
          displayName = translatePieceLabel(numSticker, useEnviroment.getState().idioma);
        } else {
          displayName = translateHerraje(displayName, props.productData?.glosarioTraduccion, useEnviroment.getState().idioma);
        }
      } else {
        displayName = translateHerraje(displayName, props.productData?.glosarioTraduccion, useEnviroment.getState().idioma);
      }
    } else {
      displayName = translateHerraje(displayName, props.productData?.glosarioTraduccion, useEnviroment.getState().idioma);
    }
    return displayName;
  }

  function handleTouchSelect(event) {
    event.stopPropagation();
    if (!highlightMaterialRef.current) return;

    const displayName = resolvePartDisplayName(event.object);
    const currentPieza = useEnviroment.getState().PiezaHerraje;

    if (currentPieza === displayName) {
      // Toggle off si se toca la misma pieza ya seleccionada
      PiezaHerraje([""]);
    } else {
      // Registrar material original si no existía
      if (!materialsCache.current.has(event.object)) {
        materialsCache.current.set(event.object, event.object.material);
      }

      // Desmarcar pieza anteriormente resaltada
      if (activeMeshRef.current && activeMeshRef.current !== event.object) {
        const originalMat = materialsCache.current.get(activeMeshRef.current);
        if (originalMat) {
          activeMeshRef.current.material = originalMat;
        }
      }

      // Resaltar pieza nueva
      event.object.material = highlightMaterialRef.current;
      activeMeshRef.current = event.object;
      PiezaHerraje([displayName]);
    }
  }

  function onPointerEnter(event) {
    event.stopPropagation();
    if (isTouchDevice) return;

    // Guarda el material original si no ha sido guardado antes, utilizando el material cacheado
    if (highlightMaterialRef.current) { 
      if (!materialsCache.current.has(event.object)) {
        materialsCache.current.set(event.object, event.object.material);
      }    

      event.object.material = highlightMaterialRef.current;
      activeMeshRef.current = event.object;
      document.body.style.cursor = "pointer";

      const displayName = resolvePartDisplayName(event.object);
      PiezaHerraje([displayName]);
    } else {
      console.log("Material de resaltado sin cargarse");
    }
  }

  function onPointerLeave(event) {
    event.stopPropagation();
    if (isTouchDevice) return;

    // Restaurar material original sincrónicamente (FIX para PC)
    const originalMaterial = materialsCache.current.get(event.object);
    if (originalMaterial) {
      event.object.material = originalMaterial;
    }
    
    if (activeMeshRef.current === event.object) {
      activeMeshRef.current = null;
    }

    document.body.style.cursor = "default";
    PiezaHerraje([""]);
  }

  function Temporizador(child) {
    if (!materialsCache.current.has(child)) {
      materialsCache.current.set(child, child.material);
    }

    const highlightMat = highlightMaterialRef.current;
    if (!highlightMat) {
      console.warn("Highlight material is not loaded yet");
      return;
    }

    const toggleMaterial = (material) => {
      child.material = material;
    };

    for (let i = 0; i <= 10; i++) {
      window.setTimeout(() => {
        toggleMaterial(i % 2 === 0 ? highlightMat : materialsCache.current.get(child));
      }, i * 500);
    }

    window.setTimeout(() => {
      const originalMaterial = materialsCache.current.get(child);
      if (originalMaterial) {
        child.material = originalMaterial; 
      }
    }, 10500); 
  }

  return (
    <group position={[0, 0, 0]}>
      <primitive
        ref={modelRef}
        object={scene}
        onClick={(event) => {
          event.stopPropagation();
          if (isTouchDevice) {
            handleTouchSelect(event);
          }
        }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      />
    </group>
  );
}

export default function Model(props) {
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const urlOriginal = getAssetPath(`/${props.id}/models/P${pasoActual}.glb`);
  const [currentUrl, setCurrentUrl] = useState(() => glbCache[urlOriginal] || null);
  const [loading, setLoading] = useState(!glbCache[urlOriginal]);

  useEffect(() => {
    let active = true;
    if (glbCache[urlOriginal]) {
      setCurrentUrl(glbCache[urlOriginal]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    getProtectedGLB(urlOriginal, props.id)
      .then(objUrl => {
        if (active) {
          setCurrentUrl(objUrl);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Error al cargar y descifrar el modelo 3D:", err);
        if (active) setLoading(false);
      });
      
    return () => { active = false; };
  }, [urlOriginal, props.id]);

  return (
    <>
      {currentUrl && (
        <ActualModel 
          key={`${props.id}_${pasoActual}_${currentUrl}`} 
          {...props} 
          decryptedUrl={currentUrl} 
        />
      )}
    </>
  );
}
