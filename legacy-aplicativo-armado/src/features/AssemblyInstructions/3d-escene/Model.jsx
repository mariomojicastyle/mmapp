import { useMatcapTexture, useAnimations, useGLTF } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import useEnviroment from "../hooks/useEnviroment.js";
import Floor from "./Floor/Floor.jsx";
import { getAssetPath } from "../../../lib/assets.js";

function obtenerNombreLimpioTooltip(rawName) {
  if (!rawName) return "";
  
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
        // Filtro para detectar números de instancia (ej. _1, _2 ... _99, _1001, _2001)
        if (/^\d+$/.test(part)) {
          const num = parseInt(part, 10);
          const isInstance = num < 100 || (part.length === 4 && part.substring(1, 3) === "00");
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

  // 5. Regla específica para PERNO_ con espacio
  if (name.toUpperCase().startsWith("PERNO_") && name.includes(" ")) {
    name = name.split(" ")[0];
  }
  
  return name;
}


export default function Model(props) {
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

  const CameraPosition = useEnviroment ((state) => state.cameraPositions)
  const alturas = useEnviroment((state) => state.alturas);
  const { camera } = useThree();

  // Referencia para el modelo 3D
  const useModel = useRef();

  //Inicializar Materialoriginal
  const originalMaterials = useRef(new Map());


  // Cargar la textura del Matcap y crear el material único al inicio para evitar re-compilaciones en GPU
  const matcapTexture = useRef(null);
  const highlightMaterialRef = useRef(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(getAssetPath("/Matcaps/3.png"), (texture) => {
      matcapTexture.current = texture;
      highlightMaterialRef.current = new THREE.MeshMatcapMaterial({
        matcap: texture,
      });
    });
  }, []);


  // Posiciones y configuraciones de cámara por defecto
  const camera_origin_x = -2,
    camera_origin_y = 1,
    camera_origin_z = 5,
    focalDistance_origin = 34;

  // Variables que guardarán la información de la cámara integrada en el GLB
  var cameraX = -2,
    cameraY = 1,
    cameraZ = 5,
    focalDistance = 34;

  // Contador del total de cámaras integradas en el GLB
  var camaras = 0;


  // Carga del modelo GLB y sus animaciones - Local por paso
  const { scene, animations, cameras } = useGLTF(
    getAssetPath(`/${props.id}/models/P${pasoActual}.glb`)
  );

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
  const { actions } = useAnimations(animations, scene);
  const action = actions.Animation || actions[Object.keys(actions)[0]]; // Fallback to first animation if named differently

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

    if (StartApp === true && action) {
      action.reset(); // Reinicia siempre la animación al cambiar de modelo
      action.clampWhenFinished = true; // Detiene la animación cuando finaliza
      action.loop = THREE.LoopOnce;    // Ejecuta la animación una sola vez
      action.play(); // Iniciar la animación si la app ha comenzado
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
      
      camera.setFocalLength(posicionDeCamaraActual.fov || focalDistance_origin);
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
      camera.position.set(camera_origin_x, camera_origin_y, camera_origin_z);
      camera.setFocalLength(focalDistance_origin);
    }

    camera.updateProjectionMatrix();

    // Actualizar los controles si están disponibles
    if (props.orbitControlsRef && props.orbitControlsRef.current) {
      props.orbitControlsRef.current.update();
    }
  }, [scene, StartApp, action, camera, CameraPosition, pasoActual, props.orbitControlsRef]);

  // para activar la animación cuando se de clic en el botón "repetir"
  useEffect(() => {
    if (ResetBool === true && action) {
      action.paused = false;  // Asegura que la animación no esté pausada
      action.reset();  // Reinicia la animación
      action.play();  // Reproduce la animación después del reinicio
      ResetBoolFalse();  // Resetea el booleano para evitar múltiples reinicios
    } else if (ResetBool === true) {
      ResetBoolFalse();
    }
}, [ResetBool, action]);

  useEffect(() => {
    if (action) {
      if (action.isRunning() && phaseAudio === 'paused') action.paused = true
      else if (phaseAudio === 'playing') action.paused = false
    }
  }, [phaseAudio, action])


  // Efecto para manejar la activación del ToolTip.
  useEffect(() => {
    if (toolTip !== "") {
      onPointerFalse(); // Desactiva el puntero para evitar interferencias

      scene.traverse((child) => {
        const cleanChildName = obtenerNombreLimpioTooltip(child.name);

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

  function onPointerEnter(event) {
    event.stopPropagation();

    // Guarda el material original si no ha sido guardado antes, utilizando el material cacheado
    if (highlightMaterialRef.current) { 
      if (!originalMaterials.current.has(event.object)) {
        originalMaterials.current.set(event.object, event.object.material);
      }    

      event.object.material = highlightMaterialRef.current;
      document.body.style.cursor = "pointer";

      // 1. Detectar si el nombre del mesh es directamente la pegatina "Pieza XX" (formato no redundante o combinado)
      const rawName = event.object.name || "";
      if (rawName.toUpperCase().startsWith("PIEZA")) {
        let clean = rawName.replace(/[._]?0\d\d$/i, "");
        const match = clean.match(/Pieza[_\s]*\d+/i);
        if (match) {
          PiezaHerraje([match[0].trim()]);
        } else {
          PiezaHerraje([clean.split(".")[0].trim()]);
        }
        return;
      }

      // 2. Detectar si el padre es un Empty de pegatina "Pieza XX" del GLB (para retrocompatibilidad)
      const parentName = event.object.parent ? event.object.parent.name || "" : "";
      if (parentName.toUpperCase().startsWith("PIEZA")) {
        let clean = parentName.replace(/[._]?0\d\d$/i, "");
        const match = clean.match(/Pieza[_\s]*\d+/i);
        if (match) {
          PiezaHerraje([match[0].trim()]);
        } else {
          PiezaHerraje([clean.split(".")[0].trim()]);
        }
        return;
      }

      const name = obtenerNombreLimpioTooltip(event.object.name);
      
      // 1. Obtener dimensiones físicas del mesh actual
      const worldBox = new THREE.Box3().setFromObject(event.object);
      const worldSize = new THREE.Vector3();
      worldBox.getSize(worldSize);
      
      let dimX = worldSize.x;
      let dimY = worldSize.y;
      let dimZ = worldSize.z;
      const minDim = Math.min(dimX, dimY, dimZ);
      
      if (minDim < 0.0001 && event.object.parent && event.object.parent.type !== 'Scene') {
        const parentBox = new THREE.Box3().setFromObject(event.object.parent);
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
            obtenerNombreLimpioTooltip(d.nombre).toLowerCase() === name.toLowerCase() &&
            Math.abs((d.largo || 0) - l) <= 2 &&
            Math.abs((d.ancho || 0) - w) <= 2
        );
        
        if (itemEncontrado) {
          let numSticker = itemEncontrado.piezaNumeroStart;
          if (itemEncontrado.piezaNumeroRange && itemEncontrado.piezaNumeroStart !== undefined) {
            // Encontrar todos los meshes en la escena actual con este mismo nombre limpio y dimensiones similares
            const hermanos = [];
            scene.traverse((child) => {
              if (child.isMesh && obtenerNombreLimpioTooltip(child.name).toLowerCase() === name.toLowerCase()) {
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
            const idx = hermanos.indexOf(event.object);
            if (idx !== -1 && idx < itemEncontrado.cantidad) {
              numSticker = itemEncontrado.piezaNumeroStart + idx;
            }
          }
          
          if (numSticker !== undefined) {
            displayName = `Pieza ${String(numSticker).padStart(2, "0")}`;
          }
        }
      }

      PiezaHerraje([displayName]);
    } else {
      console.log("Material de resaltado sin cargarse");
    }
  }

  function onPointerLeave(event) {
    event.stopPropagation();

    // Restaurar material original
    const originalMaterial = originalMaterials.current.get(event.object);
    if (originalMaterial) {
      event.object.material = originalMaterial;
    } else {
      console.error("Error: original material is undefined or not found");
    }

    document.body.style.cursor = "default";

    // Limpiar el estado de la pieza seleccionada para ocultar el tooltip
    PiezaHerraje([""]);
  }

  function Temporizador(child) {
    if (!originalMaterials.current.has(child)) {
      originalMaterials.current.set(child, child.material);
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
        toggleMaterial(i % 2 === 0 ? highlightMat : originalMaterials.current.get(child));
      }, i * 500);
    }

    window.setTimeout(() => {
      const originalMaterial = originalMaterials.current.get(child);
      if (originalMaterial) {
        child.material = originalMaterial; 
      }
    }, 10500); 
  }

  return (
    <group position={[0, 0, 0]}>
      <primitive
        ref={useModel}
        object={scene}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      />
    </group>
  );
}
