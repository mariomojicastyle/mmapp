import { useMatcapTexture, useAnimations, useGLTF } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import useEnviroment from "../hooks/useEnviroment.js";
import Floor from "./Floor/Floor.jsx";
import { getAssetPath, resolveAlias, translateHerraje } from "../../../lib/assets.js";
import { isPieceName, extractPieceNumber, translatePieceLabel } from "../../../lib/pieceUtils.js";
import { obfuscateBuffer } from "../../../lib/crypto.js";

const glbCache = {}; // Cache local: Url original -> ObjectURL del Blob desencriptado

export async function getProtectedGLB(url) {
  if (glbCache[url]) return glbCache[url];
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error descargando modelo: ${response.status}`);
  const buffer = await response.arrayBuffer();
  
  // Revertir ofuscación en memoria
  obfuscateBuffer(buffer);
  
  const blob = new Blob([buffer], { type: "model/gltf-binary" });
  const objectUrl = URL.createObjectURL(blob);
  glbCache[url] = objectUrl;
  return objectUrl;
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

  // Referencia para el modelo 3D
  // 3D Model Instance Reference
  const modelRef = useRef();

  // original materials cache
  const materialsCache = useRef(new Map());
  
  const activeMeshRef = useRef(null);
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

  // Configuración inicial del modelo GLB, de la animación y de la cámara
  useEffect(() => {
    ChargeModel(scene); // Carga el modelo en la escena

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
      Object.values(actions).forEach((act) => {
        if (act) {
          act.reset(); // Reinicia siempre la animación al cambiar de modelo
          act.clampWhenFinished = true; // Detiene la animación cuando finaliza
          act.loop = THREE.LoopOnce;    // Ejecuta la animación una sola vez
          act.play(); // Iniciar la animación si la app ha comenzado
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
    const useOverride = posicionDeCamaraActual?.override;

    if (useOverride) {
      camera.position.set(
        posicionDeCamaraActual.position.x,
        posicionDeCamaraActual.position.y,
        posicionDeCamaraActual.position.z
      );

      // Si existe un target en alturas, hacer lookAt para evitar saltos
      if (alturas && alturas.length > 0) {
        const altData = alturas.find(a => a.paso === pasoActual);
        if (altData && altData.target) {
          camera.lookAt(new THREE.Vector3(altData.target[0], altData.target[1], altData.target[2]));
        }
      }
      
      camera.setFocalLength(posicionDeCamaraActual.fov || defaultFov);
    } else if (camarasCount > 0 && cameras && cameras.length > 0) {
      // Si la cámara está ubicada en el origen (0,0,0) del parent, se configura su posición
      if (
        cameras[0].parent.position.x === 0 &&
        cameras[0].parent.position.y === 0 &&
        cameras[0].parent.position.z === 0
      ) {
        camera.position.set(
          cameras[0].position.x,
          cameras[0].position.y,
          cameras[0].position.z
        );
      } else {
        if (posicionDeCamaraActual) {
          camera.position.set(
            posicionDeCamaraActual.position.x,
            posicionDeCamaraActual.position.y,
            posicionDeCamaraActual.position.z
          );
        }
      }

      // Se copia la distancia focal, rotación y quaternion de la cámara del GLB
      camera.setFocalLength(cameras[0].getFocalLength());
      camera.rotation.copy(cameras[0].rotation);
      camera.quaternion.copy(cameras[0].quaternion);

    } else {
      // Si no hay cámaras en el archivo GLB, se usa la posición por defecto
      camera.position.set(defaultCameraPosX, defaultCameraPosY, defaultCameraPosZ);
      camera.setFocalLength(defaultFov);
    }

    camera.updateProjectionMatrix();

    // Actualizar los controles si están disponibles
    if (props.orbitControlsRef && props.orbitControlsRef.current) {
      props.orbitControlsRef.current.update();
    }
  }, [scene, StartApp, actions, camera, CameraPosition, pasoActual, props.orbitControlsRef]);

  // Preload de pasos adyacentes para que las transiciones sean instantáneas y fluidas (Capa protegida)
  useEffect(() => {
    if (pasos && pasos.length > 0) {
      const idx = pasos.indexOf(pasoActual);
      if (idx !== -1) {
        // Preload del paso siguiente
        if (idx < pasos.length - 1) {
          const nextStep = pasos[idx + 1];
          const nextUrl = getAssetPath(`/${props.id}/models/P${nextStep}.glb`);
          getProtectedGLB(nextUrl)
            .then(objUrl => useGLTF.preload(objUrl))
            .catch(err => console.warn("[Preload] Error precargando paso siguiente:", err));
        }
        // Preload del paso anterior
        if (idx > 0) {
          const prevStep = pasos[idx - 1];
          const prevUrl = getAssetPath(`/${props.id}/models/P${prevStep}.glb`);
          getProtectedGLB(prevUrl)
            .then(objUrl => useGLTF.preload(objUrl))
            .catch(err => console.warn("[Preload] Error precargando paso anterior:", err));
        }
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
  const [decryptedUrl, setDecryptedUrl] = useState(null);
  const urlOriginal = getAssetPath(`/${props.id}/models/P${pasoActual}.glb`);

  useEffect(() => {
    let active = true;
    setDecryptedUrl(null); // Limpiar pantalla en cambio de paso
    
    getProtectedGLB(urlOriginal)
      .then(objUrl => {
        if (active) setDecryptedUrl(objUrl);
      })
      .catch(err => {
        console.error("Error al cargar y descifrar el modelo 3D:", err);
      });
      
    return () => { active = false; };
  }, [urlOriginal]);

  if (!decryptedUrl) return null; // Transición fluida durante la desencriptación

  return <ActualModel {...props} decryptedUrl={decryptedUrl} />;
}
