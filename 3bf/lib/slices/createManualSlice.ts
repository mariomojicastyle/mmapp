// @ts-nocheck
import { createManualStepsSlice } from "./manual/manualStepsSlice";
import { createManualShowcaseSlice } from "./manual/manualShowcaseSlice";
import { createManualSubbloquesSlice } from "./manual/manualSubbloquesSlice";
import { createManualPickingSlice } from "./manual/manualPickingSlice";
import { createManualTimelineSlice } from "./manual/manualTimelineSlice";
import { createManualBloquesSlice } from "./manual/manualBloquesSlice";
import { createManualProyectosSlice } from "./manual/manualProyectosSlice";
import { createManualStudioSlice } from "./manual/manualStudioSlice";
import { createManualCameraSlice } from "./manual/manualCameraSlice";

/**
 * 🎬 Orquestador Canónico de Manual Studio para 3dBimFab
 * Compone los 9 sub-slices modulares preservando el 100% de compatibilidad
 * con use3BFStore y el ecosistema de componentes.
 */
export const createManualSlice = (set: any, get: any): any => ({
  ...createManualStepsSlice(set, get),
  ...createManualShowcaseSlice(set, get),
  ...createManualSubbloquesSlice(set, get),
  ...createManualPickingSlice(set, get),
  ...createManualTimelineSlice(set, get),
  ...createManualBloquesSlice(set, get),
  ...createManualProyectosSlice(set, get),
  ...createManualStudioSlice(set, get),
  ...createManualCameraSlice(set, get),
});
