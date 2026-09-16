/**
 * =========================================================================================
 * 🚀 3dBimFab Core Store — VERSIÓN 1.0.1 (Estable Oficial)
 * Hito 114: Cierre del Círculo de Vinculación Total GHX ⇄ Mueble (.3bf) ⇄ Manual (.3bm)
 * Persistencia en espejo y actualización automática tras recargar definición de Grasshopper.
 * Fecha de Certificación: 12 de Septiembre, 2026
 * =========================================================================================
 */

import { create } from "zustand";
import type { State3BF } from "./storeTypes";

export * from "./storeTypes";
export * from "./storeDefaults";

import { createEngineSlice } from "./slices/createEngineSlice";
import { createManualSlice } from "./slices/createManualSlice";
import { createCatalogSlice } from "./slices/createCatalogSlice";
import { createSceneInstanceSlice } from "./slices/createSceneInstanceSlice";
import { createHistorySlice } from "./slices/createHistorySlice";
import { createTransformSlice } from "./slices/createTransformSlice";
import { createCostosSlice } from "./slices/createCostosSlice";
import { createRenderIASlice } from "./slices/createRenderIASlice";

export const use3BFStore = create<State3BF>((set, get) => ({
  ...createEngineSlice(set, get),
  ...createManualSlice(set, get),
  ...createCatalogSlice(set, get),
  ...createSceneInstanceSlice(set, get),
  ...createHistorySlice(set, get),
  ...createTransformSlice(set, get),
  ...createCostosSlice(set, get),
  ...createRenderIASlice(set, get),
}));
