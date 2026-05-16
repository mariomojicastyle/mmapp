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


  // Referencia para el modelo 3D
  const useModel = useRef();

  //Inicializar Materialoriginal
  const originalMaterials = useRef(new Map());


  // Cargar la textura del Matcap al inicio para que esté disponible antes de que el usuario interactúe
const matcapTexture = useRef(null);

useEffect(() => {
  const loader = new THREE.TextureLoader();
  loader.load("/Matcaps/3.png", (texture) => {
    matcapTexture.current = texture;
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


  // Carga del modelo GLB y sus animaciones
  //Carga en local
  const { scene, animations, materials, cameras } = useGLTF(
    `/${props.id}/models/P${pasoActual}.glb`
  );
    /* Carga en produccion  */
    // const { scene, animations, cameras } = useGLTF(
    //   `https://3dymedios.com/Prueba/AP/${Cliente}/${props.id}/models/P${pasoActual}.glb`
    // );

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




  // Actualizacion de la cámara
  const { camera } = useThree();
  useFrame((state, delta) => {
    camera.updateProjectionMatrix();
  
// Obten la posición actual de la cámara
  const { x, y, z } = camera.position;
  
  // Importante: para ver la posicion de la camara, descomentar momentaneamente el siguiente pedazo de codigo 
  // setTimeout(() => {
  //   console.log(`Esta es la posición x: ${x}, y: ${y}, z: ${z}`);
  // }, 3000);   

// Define la distancia máxima permitida (por ejemplo, 10 unidades)
  const maxDistance = 7;

// Calcula la distancia actual desde el origen (o desde un punto de referencia)
  const distance = Math.sqrt(x * x + y * y + z * z);

   // Si la distancia supera el límite, ajusta suavemente la posición de la cámara
   if (distance > maxDistance) {
    const scale = maxDistance / distance;
    
    // Interpolación suave para evitar el movimiento brusco
    const newX = THREE.MathUtils.lerp(x, x * scale, 0.1);
    const newY = THREE.MathUtils.lerp(y, y * scale, 0.1);
    const newZ = THREE.MathUtils.lerp(z, z * scale, 0.1);

    camera.position.set(newX, newY, newZ);
   
  }
});
  

  // Cargador de texturas
  let textureLoader = new THREE.TextureLoader();
  let textMaterial, textMaterial2;

  // Desestructuración de las animaciones del modelo
  const { actions } = useAnimations(animations, scene);
  const action = actions.Animation;



  // Configuración inicial del modelo GLB y de la cámara.
  useEffect(() => {
    ChargeModel(scene); // Carga el modelo en la escena

    if (StartApp === true) {
      
      action.clampWhenFinished = true; // Detiene la animación cuando finaliza
      action.loop = THREE.LoopOnce;    // Ejecuta la animación una sola vez
      action.play(); // Iniciar la animación si la app ha comenzado
      
    }

    camaras = 0;
    scene.traverse(function (object) {
      if (object.isCamera) {
        camaras += 1;
      }
    });


    // Si hay cámaras en el archivo GLB, configurarlas
  if (camaras > 0 && cameras.length > 0) {
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
      // Si la cámara tiene una posición diferente, se utiliza esa posición
      // camera.position.set(
      //   cameras[0].parent.position.x,
      //   cameras[0].parent.position.y,
      //   cameras[0].parent.position.z
      // );
      CameraPosition.filter;
        console.log(CameraPosition);
      // camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
      const posicionDeCamaraActual = CameraPosition.filter((item) => {
        return item.pasos  == pasoActual
    })
    console.log("estos son los pasos y posicion de camara", posicionDeCamaraActual)
    camera.position.set(posicionDeCamaraActual[0].position.x, 
      posicionDeCamaraActual[0].position.y, 
      posicionDeCamaraActual[0].position.z);
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

  
  }, [scene, StartApp]);

  // para activar la animación cuando se de clic en el botón "repetir"
  useEffect(() => {
    if (ResetBool === true) {
      action.paused = false;  // Asegura que la animación no esté pausada
      action.reset();  // Reinicia la animación
      action.play();  // Reproduce la animación después del reinicio
      ResetBoolFalse();  // Resetea el booleano para evitar múltiples reinicios
    }
}, [ResetBool]);

  useEffect(() => {
    if (action.isRunning() && phaseAudio === 'paused') action.paused = true
    else if (phaseAudio === 'playing') action.paused = false
  }, [phaseAudio])


  // Efecto para manejar la activación del ToolTip.
  useEffect(() => {
    if (toolTip !== "") {
      onPointerFalse(); // Desactiva el puntero para evitar interferencias

      scene.traverse((child) => {
        let characters = "";
        if (child.name.includes("-")) {
          characters = child.name.split("-");
        }

        // Si el nombre del herraje coincide con el seleccionado, se resalta

        if (
          toolTip.includes(characters[0]) &&
          child.name.includes(characters[0])
        ) {
          const name = toolTip.split("-");
          PiezaHerraje(name);
          //Se llama a la función Temporizador, la cual se encarga de resaltar el herraje en la vista 3D por un tiempo determinado de 10 segundos, 
          //hay un bug en esta parte, ya que si se da click en otro herraje, y si aun no ha termido el tiempo de 10 segundos, 
          //se resaltara el herraje anterior, y el nuevo a la vez.
          Temporizador(child);
        } else if (toolTip === child.name) {
          PiezaHerraje(characters[0]);
          //textMaterial2 =textureLoader.load("https://3dymedios.com/AA/Recursos/Imagenes/Matcaps/2.png");

          // textMaterial2 = textureLoader.load("./Matcaps/2.png"),
          //   child.material = textMaterial2;

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

    // Guarda el material original si no ha sido guardado antes, ademas se asegura que la textura del matcap cargue con anticipación
    if (matcapTexture.current){ 
      if (!originalMaterials.current.has(event.object)) {
        originalMaterials.current.set(event.object, event.object.material);
      }    

    // Carga y aplica el material de resaltado
    let highlightMaterial = new THREE.MeshMatcapMaterial({
      matcap: textureLoader.load("/Matcaps/3.png"),
    });
    // event.object.material = highlightMaterial;
    // document.body.style.cursor = "pointer";
    // const name = event.object.name.split("-");
    // PiezaHerraje(name);
    if (!highlightMaterial || !highlightMaterial.isMaterial) {
      console.error("Error: highlight material is undefined or invalid");
      return;
    }

    event.object.material = highlightMaterial;
    document.body.style.cursor = "pointer";

    const name = event.object.name.split("-");
    PiezaHerraje(name);
  } else {
    console.log("matcap sin cargarse")
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
  }

  function Temporizador(child) {
    //Produccion
    // textMaterial2 =textureLoader.load("https://3dymedios.com/Prueba/AP/Recursos/Imagenes/Matcaps/3.png");

    //Local
    // textMaterial2 = textureLoader.load("./Matcaps/1.png");

    // Guardar material original si no ha sido guardado
    if (!originalMaterials.current.has(child)) {
      originalMaterials.current.set(child, child.material);
    }

    const highlightMaterial = new THREE.MeshMatcapMaterial({
      matcap: textureLoader.load("/Matcaps/3.png"),
    });

    // Validar que el material de resaltado es válido
    if (!highlightMaterial || !highlightMaterial.isMaterial) {
      console.error("Highlight material is invalid or undefined");
      return;
    }

    // Alterna entre los materiales de resaltado y el original
    const toggleMaterial = (material) => {
      child.material = material;
    };

    // Alternancia de titilar por 10 segundos (500ms intervalos)
    for (let i = 0; i <= 10; i++) {
      window.setTimeout(() => {
        toggleMaterial(i % 2 === 0 ? highlightMaterial : originalMaterials.current.get(child));
      }, i * 500);
    }

    // Asegurarse de restaurar el material original después de 10 segundos
    window.setTimeout(() => {
      const originalMaterial = originalMaterials.current.get(child);
      if (originalMaterial) {
        child.material = originalMaterial; // Restaurar el material original
      } else {
        console.error("Error: could not restore original material after highlight");
      }
    }, 10500); // Aseguramos que al final del titilar, regrese al material original
  }



  return (
    <group position={[0, 1, 0]}>
      <primitive
        ref={useModel}
        object={scene}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      />
      {console.log(scene)}
      {/* <mesh geometry={scene} material={materials}/> */}

      {/* <shadowMaterial /> */}
    </group>
  );
}
