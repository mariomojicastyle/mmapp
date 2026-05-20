import { useMatcapTexture, useAnimations, useGLTF } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import useEnviroment from "../hooks/useEnviroment.js";
import Floor from "./Floor/Floor.jsx";

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
    loader.load("/Matcaps/3.png", (texture) => {
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
    `/${props.id}/models/P${pasoActual}.glb`
  );

  // Asignar sombras a los objetos
  // scene.castShadow = true;
  // scene.children.forEach((child) => {
  //   child.castShadow = true;
  //   if (child.children) {
  //     child.children.forEach((grandChild) => {
  //       grandChild.castShadow = true;
  //     });
  //   }
  // });





  

  // Cargador de texturas
  let textureLoader = new THREE.TextureLoader();
  let textMaterial, textMaterial2;

  // Desestructuración de las animaciones del modelo
  const { actions } = useAnimations(animations, scene);
  const action = actions.Animation || actions[Object.keys(actions)[0]]; // Fallback to first animation if named differently

  // Configuración inicial del modelo GLB, de la animación y de la cámara
  useEffect(() => {
    ChargeModel(scene); // Carga el modelo en la escena

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
        let characters = "";
        if (child.name.includes("-")) {
          characters = child.name.split("-");
        }

        if (
          toolTip.includes(characters[0]) &&
          child.name.includes(characters[0])
        ) {
          const name = toolTip.split("-");
          PiezaHerraje(name);
          Temporizador(child);
        } else if (toolTip === child.name) {
          PiezaHerraje(characters[0]);
          textMaterial2 = textureLoader.load("/Matcaps/3.png");
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

      const name = event.object.name.split("-");
      PiezaHerraje(name);
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
