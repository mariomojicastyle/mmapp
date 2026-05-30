/* eslint-disable */
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";


//Como state management se utilizo zustand para este proyecto, con el proposito 
//de utilizar estados globales y funciones que pudieran ser manejados en todos los componentes

//La documentación de como funciona zustand se encuentra aqui https://zustand-demo.pmnd.rs/

//Se crea un middleware, el cual contendra todos los estados usados en el aplicativo de manera global
export default create(
  subscribeWithSelector((set) => {
    return {

      pasos: [],//Pasos de armado

      //Ya no se utiliza este
      PositionFloor: [], //posicion de suelo

      alturas:[], //Posicion de  skybox y planeGeometry

      computedModelMinY: null, // Punto Y más bajo del bounding box del GLB actual (auto-calculado)

      cameraPositions: [], //la posicion de la camara

      pasoActual: "00",//Se incializa en 00

      color: "rgb(158, 108, 108)",//Color del background
      // color original "rgb(172,172,172)"

      panelTips: false,//Activa el panel de los tips

      btnCerrar: false,//Variable para activar y desactivar el boton de cerrar

      PiezaHerraje: "",//Texto del herraje seleccionado

      show: true,//Variable que modifica en cada paso, el panel de herrajes, y cambia el modelo 3D

      phaseAudio: "playing",//Fases del audio

      resetAction: false,//Variable que se activa cuando es posible resetear la animación

      ResetBool: false,//Variable para reiniciar el audio

      id: "",//Referencia del mueble

      model: {},//informacion del glb

      pasoInicial: {},//informacion glb paso 00.

      PanelShow: false,//Variable que activa el panel de herrajes

      PanelCantidades: false,//Activa el panel de los tips

      toolTip: "",//Nombre del herraje seleccionado

      onPointerMove: true,//Activa y desactiva los eventos de onPointerEnter y onPointerLeave

      ReadyToPlay: false,//Variable que se activa cuando es posible activar la animación

      StartApp: false,//Variable que se activa cuando es posible iniciar el aplicativo

      icono: "",//url del icono (Practimac o Maderkit)

      AudioEnded: false,//Variable de audio finalizado

      CloudOneTime: true,//Valida que los tootlips de los paneles solo se activen una vez.

      HandToolExist: false,//Valida que ya tengo un tooltip de la mano, para no agregar una cada vez se cambia de paso

      PanelAyudas: false,//Activa el panel de ayudas


      // environmentMap: null,
      // loadEnvironmentMap: (texture) => set(() => ({ environmentMap: texture })),


      // backgroundTexture: null,
      // setBackgroundTexture: (texture) => set(() => ({ backgroundTexture: texture })),

      // loadBackgroundTexture: (texture) => set(() => ({ backgroundTexture: texture })),

      //Global state de cada una de las ayudas que se activan
      ayuda1: false,
      // ayuda2: false,
      ayuda3: false,
      ayuda3ArrowLeft: false,
      ayuda3ArrowCenter: false,
      ayuda3ArrowRight: false,
      ayuda4: false,
      ayuda5: false,
      ayuda6: false,

      Parpadeo: false,//Variable para activar el parpadeo de cambio de paso

      EncuestaMitad: false,//Activa el panel que redirige a la encuesta, en mitad de los pasos de armado

      EncuestaFinal:false, ///Activa el panel que redirige a la encuesta, al final de los pasos de armado

      ActivarEncuesta:false,//Variable que activa el panel donde se encuentra la encuesta.

      EncuestaCompletada:false,

      Cliente: '',//Guarda el dato si el mueble es Maderkit o Practimac.


      //A continuación estan todas las funciones que pueden realizar cambios a estos estados globales.
      color1: () => {set(() => {return { color: "rgb(252, 250, 250)" };});},
      // color inicial -> gris : "rgb(172,172,172)"
      color2: () => {set(() => {return { color: "#ffffff" };});},
      // color inicial -> gris : #dcdcdc

      PanelTipsTrue: () => {
        set(() => {
          return {
            panelTips: true,
            PanelShow: false,
            PanelCantidades: false,
            PanelAyudas: false
          };
        });
      },
      PanelTipsFalse: () => {set(() => {return { panelTips: false };});},
      
      NamePieza: (name) => {set((state) => {return { PiezaHerraje: name[0] };});},
      NuevosPasos: (pasos) => {set((state) => {return { pasos: pasos };});},
      CambiarModelo: (paso) => {set((state) => {return { pasoActual: paso };});},
      CargarPasoInicial: (paso) => {set((state) => {return { pasoInicial: paso };});},

      CargarPasoInicial: (paso) => {set((state) => {return { pasoInicial: paso };});},



      CheckReadyToPlay: (progress) => {set((state) => {if (progress != 100) {return { ReadyToPlay: false };} else {return { ReadyToPlay: true };}});},
      
      
      toggleShow: () => set((state) => ({ show: !state.show })),
      NegativeShow: () => set((state) => ({ show: false })),
      PositiveShow: () => set((state) => ({ show: true })),
      
      
      StartAudio: () => set(() => ({ phaseAudio: "start" })),
    PlayingAudio: () => set(() => ({ phaseAudio: "playing" })),
      ResetAudio: () => set(() => ({ phaseAudio: "reset" })),
      PausedAudio: () => set(() => ({ phaseAudio: "paused" })),


      ChangeId: (id) => set(() => ({ id: id })),


      ActionTrue: () => set(() => ({ resetAction: true })),
      ActionFalse: () => set(() => ({ resetAction: false })),


      ResetBoolTrue: () => set(() => ({ ResetBool: true })),
      ResetBoolFalse: () => set(() => ({ ResetBool: false })),


      ChargeModel: (model) => set(() => ({ model: model })),


      NegativePanel: () => set((state) => ({ PanelShow: false })),
      PositivePanel: () => set((state) => ({
        PanelShow: true,
        panelTips: false,
        PanelCantidades: false,
        PanelAyudas: false
      })),


      PanelCantidadesTrue: () => set((state) => ({
        PanelCantidades: true,
        panelTips: false,
        PanelShow: false,
        PanelAyudas: false
      })),
      PanelCantidadesFalse: () => set((state) => ({ PanelCantidades: false })),


      btnCerrarTrue: () => set((state) => ({ btnCerrar: true })),
      btnCerrarFalse: () => set((state) => ({ btnCerrar: false })),

      NameTooltip: (name) => set((state) => ({ toolTip: name })),
      NameTooltipNull: () => set((state) => ({ toolTip: "" })),


      onPointerTrue: () => set((state) => ({ onPointerMove: true })),
      onPointerFalse: () => set((state) => ({ onPointerMove: false })),


      StartAppTrue: () => set((state) => ({ StartApp: true })),
      ChargerIcon: (icon) => set((state) => ({ icono: icon })),


      AudioEndedFalse: (icon) => set((state) => ({ AudioEnded: false })),
      AudioEndedTrue: (icon) => set((state) => ({ AudioEnded: true })),


      CloudOneTimeFalse: () => set((state) => ({ CloudOneTime: false })),
      HandExistTrue: () => set((state) => ({ HandToolExist: true })),


      ChargerPositionFloor: (pasos) =>set((state) => ({ PositionFloor: pasos })),

      ChargerAlturas: (alturas) => set((state) => ({ alturas: alturas })),

      SetComputedModelMinY: (minY) => set(() => ({ computedModelMinY: minY })),

      ChargerCameraPositions: (cameraPositions) => set((state) => ({ cameraPositions: cameraPositions })),

      PanelAyudasTrue: () => set((state) => ({
        PanelAyudas: true,
        panelTips: false,
        PanelShow: false,
        PanelCantidades: false
      })),
      PanelAyudasFalse: () => set((state) => ({ PanelAyudas: false, btnCerrar: false })),


      ActivarAyuda1: () => set((state) => ({ ayuda1: true })),
      // quitar ayuda2 - tooltip de los colores
      // ActivarAyuda2: () => set((state) => ({ ayuda2: true })),
      ActivarAyuda3: () => set((state) => ({ ayuda3: true })),
      SetAyuda3ArrowLeft: (val) => set(() => ({ ayuda3ArrowLeft: val })),
      SetAyuda3ArrowCenter: (val) => set(() => ({ ayuda3ArrowCenter: val })),
      SetAyuda3ArrowRight: (val) => set(() => ({ ayuda3ArrowRight: val })),
      ActivarAyuda4: () => set((state) => ({ ayuda4: true })),
      ActivarAyuda5: () => set((state) => ({ ayuda5: true })),
      ActivarAyuda6: () => set((state) => ({ ayuda6: true })),
      ActivarParpadeo: () => set((state) => ({ Parpadeo: true })),
      DesactivarParpadeo: () => set((state) => ({ Parpadeo: false })),
      AyudasActivadas: () => set((state) => ({ ayuda1: true, ayuda3: true, ayuda4: true, ayuda5: true, ayuda6: true })),
      ResetAyudas: () => set((state) => ({
        ayuda1: false,
        ayuda3: false,
        ayuda3ArrowLeft: false,
        ayuda3ArrowCenter: false,
        ayuda3ArrowRight: false,
        ayuda4: false,
        ayuda5: false,
        ayuda6: false
      })),

      EncuestaMitadTrue: () => set((state) => ({ EncuestaMitad: true })),
      EncuestaFinalTrue: (x) => set((state) => ({ EncuestaFinal: true })),

      ToogleEncuesta: (x) => set((state) => ({ ActivarEncuesta: x })),

      EncuestaCompletadaTrue:(cliente) => set((state) => ({ EncuestaCompletada: true })),
      
      ActualizarCliente: (cliente) => set((state) => ({ Cliente: cliente })),

      sombras: false,
      toggleSombras: () => set((state) => ({ sombras: !state.sombras })),
    };
  })
);
