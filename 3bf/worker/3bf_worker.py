"""
============================================================================
ARCHIVO: 3bf_worker.py
UBICACIÓN: c:/Desarrollo/mmapp/3BF/worker/3bf_worker.py
VERSIÓN: v2.5.0 (Hito 119 - Suite 3dBimFab)
AUTOR: Mario Mojica (3dBimFab Digital Manufacturing Engine)
============================================================================
DESCRIPCIÓN & FUNCIONALIDAD:

Microservicio backend desarrollado sobre FastAPI que actúa como motor de
manufactura digital paramétrica e intermediario de alta velocidad entre
RhinoCompute 8 (Hops/Grasshopper C++) y la plataforma Web 3dBimFab (Next.js / Three.js).

RESPONSABILIDADES CLAVE:
1. ORQUESTACIÓN PARAMÉTRICA & RHINOCOMPUTE:
   - Recibe parámetros dimensionales (ancho, alto, profundidad, configuraciones de cajones,
     acabados, espesores de melamina) y los inyecta en árboles GHX de Grasshopper.
   - Ejecuta el solver en RhinoCompute 8 (puerto 5000), gestiona pools de reintentos,
     cacheo inteligente de geometrías estáticas y normalización de esquemas.

2. PROCESAMIENTO Y NORMALIZACIÓN DE GEOMETRÍAS B2B:
   - Convierte el sistema de coordenadas de Rhino (Z-Up, milímetros) al estándar
     gráfico de Three.js (Y-Up, metros con inversión de profundidad).
   - Extrae mallas poligonales nativas (rhino3dm.Mesh) y decodifica sólidos Brep OpenNURBS.
   - Identificación analítica de mecanizados y herrajes (tarugos d8, minifix d15, guías d5,
     bisagras d35) con posición, orientación vectorial, diámetro y profundidad exacta.

3. OPTIMIZACIÓN Y SOLDADURA TOPOLÓGICA DE MALLAS CAD:
   - Aplica unificación de vértices coincidentes (`Vertices.CombineIdentical(True, True)`),
     eliminación de caras degeneradas (`Faces.CullDegenerateFaces`), compactación de índices
     y recálculo de normales analíticas (`Normals.ComputeNormals`).
   - Elimina las costuras abiertas de corte de puente (bridge seams) generadas por la
     teselación de superficies planas con perforaciones, permitiendo un renderizado
     de aristas limpio en Three.js sin rayas falsas coplanares.

4. SISTEMA DE DESPIECE, CAPAS & COSTOS:
   - Reconstruye y segrega mallas de tableros según su cara (Cara A Color, Cara B Balance,
     cantos de PVC/melamina en los 4 bordes y canto MDF/MDP expuesto).
   - Detección automática y purga de piezas duplicadas de Grasshopper (`deduplicate_real_meshes`).
   - Provisión de endpoints de salud (`/health`), mecanizado analítico (`/mecanizar`)
     y metadata técnica paramétrica.
============================================================================
"""

import os
import sys
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass
import json
import re
import base64
import time
import math
import requests
import uvicorn
import rhino3dm
import hashlib
import copy
import xml.etree.ElementTree as ET
from collections import defaultdict, deque
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

from ghx_parser import (
    _SLIDER_LIMITS_CACHE,
    parse_ghx_slider_limits,
    parse_ghx_default_values,
    parse_num_prefix,
    find_user_param_value,
    extract_parameter_groups,
    find_ghx_in_system,
    is_structural_param_name,
    extract_ghx_aesthetic_mapping,
    extract_all_user_params_flat,
    extract_dimension_smart,
)
from mesh_builder import (
    split_mesh_dict_into_islands,
    extract_tris_from_mesh,
    build_mesh_from_tris,
    rebuild_fondos_meshes,
    classify_instance_tris,
    rebuild_piece_meshes,
    deduplicate_real_meshes,
)
from bom_engine import (
    es_nombre_herraje,
    es_nombre_tablero,
    calcular_bom_y_despiece,
)
from dxf_exporter import (
    procesar_mecanizado_intercomponentes,
    generar_dxf_biesse,
)

app = FastAPI(title="3BF Worker Python Engine", version="2.5.0")

CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)


class MetadataParams(BaseModel):
    model_id: str
    custom_filename: str = ""
    ghx_content: str = ""


@app.post("/metadata")
async def get_model_metadata(request: Request):
    p = await request.json()
    model_id = p.get("model_id", "Cubierta")
    raw_ghx_content = p.get("ghx_content", "")
    custom_filename = p.get("custom_filename", "")

    root = None
    ghx_file = ""

    if raw_ghx_content:
        try:
            root = ET.fromstring(raw_ghx_content)
            temp_dir = r"C:\Desarrollo\mmapp\temporal"
            os.makedirs(temp_dir, exist_ok=True)
            custom_path = os.path.join(temp_dir, "uploaded_custom.ghx")
            if os.path.exists(custom_path):
                try:
                    os.remove(custom_path)
                except Exception:
                    pass
            with open(custom_path, "w", encoding="utf-8") as f:
                f.write(raw_ghx_content)
            ghx_file = custom_path
        except Exception as err:
            print(f"[3BF Worker /metadata] Error guardando XML subido: {err}", flush=True)

    if root is None:
        ghx_file = find_ghx_in_system(model_id, custom_filename)

    if root is None and (ghx_file and os.path.exists(ghx_file)):
        try:
            tree = ET.parse(ghx_file)
            root = tree.getroot()
        except Exception:
            pass

    slider_limits = {}
    default_values = {}

    if root is not None:
        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                name_item = chunk.find("items/item[@name='Name']")
                if name_item is not None and "Number Slider" in str(name_item.text):
                    container = chunk.find("chunks/chunk[@name='Container']")
                    if container is not None:
                        nick_item = container.find("items/item[@name='NickName']")
                        slider_chunk = container.find("chunks/chunk[@name='Slider']")
                        if nick_item is not None and slider_chunk is not None:
                            nick = nick_item.text or ""
                            min_item = slider_chunk.find("items/item[@name='Min']")
                            max_item = slider_chunk.find("items/item[@name='Max']")
                            val_item = slider_chunk.find("items/item[@name='Value']")
                            if min_item is not None and max_item is not None:
                                slider_limits[nick] = {
                                    "min": float(min_item.text),
                                    "max": float(max_item.text),
                                    "default": float(val_item.text) if val_item is not None else float(min_item.text)
                                }
                                if nick.startswith("RH_IN:"):
                                    default_values[nick] = slider_limits[nick]["default"]

            if chunk.attrib.get("name") == "Container":
                nick = ""
                for it in chunk.findall("items/item"):
                    if it.attrib.get("name") == "NickName":
                        nick = it.text or ""
                if nick.startswith("RH_IN:"):
                    vl_options = []
                    vl_selected = None
                    for sub in chunk.iter("chunk"):
                        if sub.attrib.get("name") == "ListItem":
                            name_item = sub.find("items/item[@name='Name']")
                            sel_item = sub.find("items/item[@name='Selected']")
                            if name_item is not None and name_item.text:
                                opt_text = name_item.text.strip()
                                vl_options.append(opt_text)
                                if sel_item is not None and sel_item.text == "true":
                                    vl_selected = opt_text
                    if vl_options:
                        selected_final = vl_selected or vl_options[0]
                        slider_limits[nick] = {
                            "type": "valuelist",
                            "options": vl_options,
                            "default": selected_final
                        }
                        default_values[nick] = selected_final

    declared_outputs = []
    if root is not None:
        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                c = chunk.find("chunks/chunk[@name='Container']")
                if c is not None:
                    name_item = c.find("items/item[@name='Name']")
                    nick_item = c.find("items/item[@name='NickName']")
                    name_t = (name_item.text or "").strip() if name_item is not None else ""
                    nick_t = (nick_item.text or "").strip() if nick_item is not None else ""
                    if nick_t.startswith("RH_OUT:") and name_t != "Group":
                        if nick_t not in declared_outputs:
                            declared_outputs.append(nick_t)

    parameter_groups = extract_parameter_groups(root, default_values) if root is not None else []

    return {
        "status": "success",
        "model_id": model_id,
        "slider_limits": slider_limits,
        "default_values": default_values,
        "parameter_groups": parameter_groups,
        "declared_outputs": declared_outputs
    }


@app.post("/check-mtime")
async def check_definitions_mtime(request: Request):
    payload = await request.json()
    items = payload.get("items", [])
    results = []
    for it in items:
        model_id = it.get("model_id", "")
        custom_filename = it.get("custom_filename", "")
        last_mtime = float(it.get("last_mtime", 0))

        ghx_path = find_ghx_in_system(model_id, custom_filename)
        current_mtime = 0.0
        exists = False
        if ghx_path and os.path.exists(ghx_path):
            exists = True
            try:
                current_mtime = os.path.getmtime(ghx_path)
            except Exception:
                pass

        changed = False
        if exists and last_mtime > 0 and current_mtime > (last_mtime + 0.1):
            changed = True

        results.append({
            "id": it.get("id"),
            "model_id": model_id,
            "filepath": ghx_path,
            "exists": exists,
            "current_mtime": current_mtime,
            "changed": changed
        })

    return {"status": "success", "results": results}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComputeParams(BaseModel):
    model_config = ConfigDict(extra="allow")

    model_id: str = "Cajon_Experimento_Viktor"
    ancho: float = 1200.0
    alto: float = 800.0
    profundidad: float = 400.0
    cant_cajones: int = 3
    apertura_mm: float = 0.0
    parameters: dict = {}

    apertura_cajones: float = 0.0
    profundidad_cajon: float = 351.0
    altura_lateral_cajon: float = 102.0
    distancia_bajo_laterales: float = 30.0
    tipo_cajon: str = "Corredera Estandar"

    union_izquierda: str = "Minifix"
    union_derecha: str = "Tornillo tarugo"
    orientacion_maquinado_minifix: str = "abajo"
    orientacion_minifix: str = "abajo"
    posicion_tarugo: str = "1"
    posicion_tornillo: str = "1"
    borde_izquierdo: str = "MDP"
    borde_derecho: str = "MDP"
    lado_balance_cubierta: str = "Cara B"
    tipo_mapeado_cubierta: str = "Cubierta"
    lado_balance_entrepanio: str = "Cara B"
    tipo_mapeado_entrepanio: str = "Cubierta"
    recedido_izquierdo: float = 0.0
    ghx_content: str = ""
    custom_filename: str = ""


@app.get("/health")
def health_check():
    rhino_ok = False
    active_children = 0
    try:
        r = requests.get("http://127.0.0.1:5000/activechildren", timeout=2)
        if r.status_code == 200:
            rhino_ok = True
            active_children = int(r.text.strip()) if r.text.strip().isdigit() else 0
    except Exception:
        rhino_ok = False

    return {
        "status": "ok" if rhino_ok else "degraded",
        "worker": "3BF Python Engine",
        "rhino_compute": "http://127.0.0.1:5000",
        "rhino_ok": rhino_ok,
        "rhino_active_children": active_children
    }


# =============================================================================
# ⚡ 3BF MEMORY BYPASS & GEOMETRY STATE CACHE (Sub-Second Execution Engine)
# =============================================================================
_GEOMETRY_CACHE = {}
_FULL_RESPONSE_CACHE = {}
_GHX_TEMPLATE_CACHE = {}
_RAW_GHX_STRING_CACHE = {}

@app.post("/compute")
async def compute_model(request: Request):
    start_time = time.time()
    
    p = await request.json()
    model_id = str(p.get("model_id", "Cajon_Experimento_Viktor"))
    custom_filename = str(p.get("custom_filename", ""))
    ghx_file_path = find_ghx_in_system(model_id, custom_filename)
    ghx_mtime = int(os.path.getmtime(ghx_file_path)) if (ghx_file_path and os.path.exists(ghx_file_path)) else 0
    ghx_hash = hashlib.md5(p["ghx_content"].encode("utf-8")).hexdigest()[:8] if p.get("ghx_content") else ""
    model_key = f"{model_id}_{custom_filename}_{ghx_mtime}_{ghx_hash}"

    force_reload = bool(p.get("force_reload", False))
    if force_reload:
        # Purgar cachés en RAM
        for k in list(_FULL_RESPONSE_CACHE.keys()):
            if (model_id and model_id.lower() in k.lower()) or (custom_filename and custom_filename.lower() in k.lower()):
                _FULL_RESPONSE_CACHE.pop(k, None)
        for k in list(_GEOMETRY_CACHE.keys()):
            if (model_id and model_id.lower() in k.lower()) or (custom_filename and custom_filename.lower() in k.lower()):
                _GEOMETRY_CACHE.pop(k, None)
        if ghx_file_path:
            _RAW_GHX_STRING_CACHE.pop(ghx_file_path, None)
            _GHX_TEMPLATE_CACHE.pop(ghx_file_path, None)
            
        # Purgar cachés en disco asociadas a este modelo
        for f in os.listdir(CACHE_DIR):
            if (model_id and model_id.lower() in f.lower()) or (custom_filename and custom_filename.lower() in f.lower()):
                try:
                    os.remove(os.path.join(CACHE_DIR, f))
                except Exception:
                    pass
        # Al forzar recarga, ignorar cualquier ghx_content cacheado en el cliente para leer el GHX fresco del disco
        p["ghx_content"] = None
        print(f"[3BF Worker] [FORCE RELOAD] Caché total (RAM y Disco) purgada para '{model_id}' / '{custom_filename}'. Leyendo GHX fresco desde disco...", flush=True)

    # 1. ⚡ Chequeo de Caché Total Exacto (RAM y Disco)
    hash_p = {k: v for k, v in p.items() if k not in ["timestamp", "client_time", "last_mtime"]}
    full_cache_key = f"{model_key}_" + hashlib.md5(json.dumps(hash_p, sort_keys=True, default=str).encode("utf-8")).hexdigest()
    disk_cache_file = os.path.join(CACHE_DIR, f"{full_cache_key}.json")
    if ghx_mtime > 0:
        if os.path.exists(disk_cache_file) and os.path.getmtime(disk_cache_file) < ghx_mtime:
            try:
                os.remove(disk_cache_file)
            except Exception:
                pass

    if not force_reload:
        # A) RAM Cache (0 ms)
        if full_cache_key in _FULL_RESPONSE_CACHE:
            cached_resp = dict(_FULL_RESPONSE_CACHE[full_cache_key])
            exec_ms = round((time.time() - start_time) * 1000, 2)
            cached_resp["execution_time_ms"] = exec_ms
            print(f"[3BF Worker] [CACHE RAM] CACHE TOTAL EXACTO ACTIVADO: Recalculo en {exec_ms} ms", flush=True)
            return cached_resp

        # B) Disco Cache por Hash Exacto (~30-50 ms)
        if os.path.exists(disk_cache_file):
            try:
                with open(disk_cache_file, "r", encoding="utf-8") as f:
                    cached_resp = json.load(f)
                exec_ms = round((time.time() - start_time) * 1000, 2)
                cached_resp["execution_time_ms"] = exec_ms
                _FULL_RESPONSE_CACHE[full_cache_key] = cached_resp
                print(f"[3BF Worker] [CACHE DISCO] Carga desde archivo JSON en {exec_ms} ms ({disk_cache_file})", flush=True)
                return cached_resp
            except Exception as disk_err:
                print(f"[3BF Worker Disk Cache Read Warning]: {disk_err}", flush=True)

        # 🛡️ NORMA OBLIGATORIA: Prohibido cargar estados inventados o congelados en _default.json.
        # Al abrir cualquier modelo en 3dBimFab debe resolverse siempre el GHX real.
        # Los puntos de caché se capturan exclusivamente en las 5 esferas de memoria (Poser).

    ancho = extract_dimension_smart(p, ["ancho"], 1200.0)
    alto = extract_dimension_smart(p, ["alto", "altura"], 800.0)
    prof = extract_dimension_smart(p, ["profundidad", "prof"], 400.0)

    # 🛡️ Blindaje mecánico contra dimensiones degeneradas (evitar colapsos a < 100mm en Grasshopper)
    if "comoda" in (model_id + custom_filename).lower() or "ravenna" in (model_id + custom_filename).lower():
        ancho = max(300.0, min(1600.0, ancho))
        alto = max(400.0, min(1200.0, alto))
        prof = max(300.0, min(650.0, prof))
    else:
        ancho = max(100.0, ancho)
        alto = max(100.0, alto)
        prof = max(100.0, prof)
    cant_cajones = int(p.get("cant_cajones", 3))
    apertura_mm = float(find_user_param_value(p, "RH_IN:02.5 Abrir Cajones", find_user_param_value(p, "RH_IN:Abrir Cajones", find_user_param_value(p, "abrir_cajones", find_user_param_value(p, "apertura_cajones", find_user_param_value(p, "apertura_mm", 0.0))))))
    prof_cajon_param = float(p.get("profundidad_cajon", 351.0))
    alt_lat_cajon_param = float(p.get("altura_lateral_cajon", 102.0))
    dist_bajo_lat_param = float(p.get("distancia_bajo_laterales", 30.0))
    tipo_cajon_param = str(p.get("tipo_cajon", "Corredera Estandar"))

    # 2. Chequeo de Bypass Estructural (Sub-Second Memory Bypass)
    structural_params = {
        "ancho": ancho,
        "alto": alto,
        "prof": prof,
        "cant_cajones": cant_cajones,
        "apertura_mm": apertura_mm,
        "prof_cajon_param": prof_cajon_param,
        "alt_lat_cajon_param": alt_lat_cajon_param,
        "dist_bajo_lat_param": dist_bajo_lat_param,
        "tipo_cajon_param": tipo_cajon_param,
    }
    user_p_dict = {**p, **(p.get("parameters") or {})}
    for k, v in user_p_dict.items():
        if is_structural_param_name(k):
            structural_params[k] = v
            
    structural_hash = hashlib.md5(json.dumps(structural_params, sort_keys=True, default=str).encode("utf-8")).hexdigest()

    current_flat_params = extract_all_user_params_flat(p)

    if not force_reload and model_key in _GEOMETRY_CACHE:
        cached_geom = _GEOMETRY_CACHE[model_key]
        last_flat_params = cached_geom.get("user_params_snapshot", {})
        
        all_keys = set(current_flat_params.keys()) | set(last_flat_params.keys())
        changed_keys = {
            k for k in all_keys 
            if current_flat_params.get(k, "") != last_flat_params.get(k, "")
            and k not in ["timestamp", "client_time", "last_mtime"]
        }
        
        # ¿Solo cambiaron parámetros estéticos (cantos, balances, acabados, fondos)?
        only_aesthetic_changed = len(changed_keys) > 0 and not any(is_structural_param_name(k) for k in changed_keys)
        no_params_changed = (len(changed_keys) == 0)

        # 🛡️ BLINDAJE DE SOBERANÍA: El bypass en RAM solo se puede usar si TODOS los parámetros
        # estéticos modificados tienen soporte nativo de reconstrucción en memoria RAM (piezas_clasificadas o fondos).
        # Si un parámetro pertenece a una pieza no clasificada en RAM (ej: Frente de Cajón con chaflán/bocelado),
        # DEBE enviarse obligatoriamente a RhinoCompute para garantizar la verdad matemática NURBS de Grasshopper.
        aes_map = cached_geom.get("aesthetic_mapping", {})
        pieces_classified = cached_geom.get("pieces_classified", {})

        can_bypass_in_ram = True
        if only_aesthetic_changed:
            for k in changed_keys:
                if "21.1" in k or "21.2" in k or "fondo" in k.lower() or "sustrato" in k.lower():
                    if not cached_geom.get("fondos_data_list"):
                        can_bypass_in_ram = False
                        break
                elif k in aes_map:
                    p_n, _ = aes_map[k]
                    if p_n not in pieces_classified:
                        can_bypass_in_ram = False
                        break
                else:
                    # Parámetro no mapeado en RAM -> requerir RhinoCompute
                    can_bypass_in_ram = False
                    break

        if cached_geom.get("structural_hash") == structural_hash and (no_params_changed or (only_aesthetic_changed and can_bypass_in_ram)):
            # 🚀 BYPASS GENERALIZADO ESTÉTICO EN MEMORIA RAM (< 2 ms)
            rebuilt_real_meshes = list(cached_geom.get("static_other_meshes", []))
            
            # 1. Reconstruir Fondos (Peça 18)
            if cached_geom.get("fondos_data_list"):
                lado_color = find_user_param_value(p, "RH_IN:21.1 Lado Color", find_user_param_value(p, "lado_color", "Cara A"))
                sustrato = find_user_param_value(p, "RH_IN:21.2 Sustrato", find_user_param_value(p, "sustrato", "MDF 1 Cara"))
                new_p18, new_mdf18 = rebuild_fondos_meshes(cached_geom["fondos_data_list"], lado_color, sustrato)
                rebuilt_real_meshes.extend(new_p18)
                rebuilt_real_meshes.extend(new_mdf18)

            # 2. Reconstruir Piezas Tablero Granularmente (Solo piezas modificadas)
            aes_map = cached_geom.get("aesthetic_mapping", {})
            pieces_classified = cached_geom.get("pieces_classified", {})
            pieces_current_meshes = cached_geom.setdefault("pieces_current_meshes", {})
            
            # Invertir mapeo para obtener nicks por pieza
            p_to_params = {}
            for nick, (p_n, p_type) in aes_map.items():
                if p_n not in p_to_params:
                    p_to_params[p_n] = {}
                p_to_params[p_n][p_type] = nick

            for p_n, inst_list in pieces_classified.items():
                types_dict = p_to_params.get(p_n, {})
                piece_nicks = set(types_dict.values())
                piece_has_changes = any(k in changed_keys for k in piece_nicks) or (p_n not in pieces_current_meshes)

                if piece_has_changes:
                    nick_bal = types_dict.get("balance")
                    nick_c1 = types_dict.get("canto_1")
                    nick_c2 = types_dict.get("canto_2")
                    nick_c3 = types_dict.get("canto_3")
                    nick_c4 = types_dict.get("canto_4")

                    val_bal = find_user_param_value(p, nick_bal, "Cara B") if nick_bal else "Cara B"
                    val_c1 = find_user_param_value(p, nick_c1, "Canto") if nick_c1 else "Canto"
                    val_c2 = find_user_param_value(p, nick_c2, "Canto") if nick_c2 else "Canto"
                    val_c3 = find_user_param_value(p, nick_c3, "Canto") if nick_c3 else "Canto"
                    val_c4 = find_user_param_value(p, nick_c4, "Canto") if nick_c4 else "Canto"

                    new_col, new_bal, new_mdp = rebuild_piece_meshes(inst_list, p_n, val_bal, val_c1, val_c2, val_c3, val_c4)
                    piece_m = new_col + new_bal + new_mdp
                    pieces_current_meshes[p_n] = piece_m
                
                rebuilt_real_meshes.extend(pieces_current_meshes.get(p_n, []))

            exec_ms = round((time.time() - start_time) * 1000, 2)
            resp = dict(cached_geom["base_response"])
            resp["real_meshes"] = rebuilt_real_meshes
            resp["execution_time_ms"] = exec_ms
            
            cached_geom["user_params_snapshot"] = dict(current_flat_params)
            _FULL_RESPONSE_CACHE[full_cache_key] = resp
            print(f"[3BF Worker] [BYPASS GENERALIZADO] BYPASS ESTÉTICO COMPLETO EN MEMORIA: Recalculo en {exec_ms} ms (Cambiaron parámetros estéticos: {changed_keys})", flush=True)
            return resp
        elif not no_params_changed:
            print(f"[3BF Worker] [BYPASS] DESVÍO A RHINOCOMPUTE: Cambiaron parámetros estructurales: {changed_keys}", flush=True)

    print(f"[3BF Worker v1.1] Parámetros extraídos -> Ancho:{ancho}, Alto:{alto}, Profundidad:{prof}, Cajones:{cant_cajones}, Apertura:{apertura_mm}, ProfCajon:{prof_cajon_param}, AltLatCajon:{alt_lat_cajon_param}, DistBajoLat:{dist_bajo_lat_param}, TipoCajon:{tipo_cajon_param}", flush=True)

    
    esp = 15.0  # Espesor estándar MDP 15mm
    
    # 1. Despiece estructural sintético
    anc_interior = ancho - (esp * 2)
    alt_interior = alto - (esp * 2)
    anc_frente_cajon = anc_interior - 4
    alt_frente_cajon = (alt_interior - ((cant_cajones + 1) * 3)) / max(1, cant_cajones)
    prof_cajon = prof - 50
    alt_lateral_cajon = max(80.0, alt_frente_cajon - 30)
    
    piezas_madera = [
        {"nombre": "Lateral Izquierdo", "ancho": prof, "largo": alto, "espesor": esp, "cantidad": 1, "tipo": "Estructura"},
        {"nombre": "Lateral Derecho", "ancho": prof, "largo": alto, "espesor": esp, "cantidad": 1, "tipo": "Estructura"},
        {"nombre": "Cubierta Superior", "ancho": prof, "largo": anc_interior, "espesor": esp, "cantidad": 1, "tipo": "Estructura"},
        {"nombre": "Cubierta Inferior", "ancho": prof, "largo": anc_interior, "espesor": esp, "cantidad": 1, "tipo": "Estructura"},
    ]
    
    for i in range(cant_cajones):
        idx = i + 1
        piezas_madera.append({"nombre": f"Frente Cajón {idx}", "ancho": prof_cajon, "largo": anc_frente_cajon, "espesor": esp, "cantidad": 1, "tipo": "Frente Cajón"})
        piezas_madera.append({"nombre": f"Lateral Izq Cajón {idx}", "ancho": prof_cajon, "largo": alt_lateral_cajon, "espesor": esp, "cantidad": 1, "tipo": "Cajón"})
        piezas_madera.append({"nombre": f"Lateral Der Cajón {idx}", "ancho": prof_cajon, "largo": alt_lateral_cajon, "espesor": esp, "cantidad": 1, "tipo": "Cajón"})
        piezas_madera.append({"nombre": f"Posterior Cajón {idx}", "ancho": anc_frente_cajon - (esp * 2), "largo": alt_lateral_cajon, "espesor": esp, "cantidad": 1, "tipo": "Cajón"})
    
    minifix_count = 16 + (cant_cajones * 8)
    tarugos_count = cant_cajones * 12
    correderas_count = cant_cajones
    
    herrajes = [
        {"nombre": "Caja Minifix 15mm", "cantidad": minifix_count, "unidad": "piezas"},
        {"nombre": "Perno Minifix 34mm", "cantidad": minifix_count, "unidad": "piezas"},
        {"nombre": "Tarugo Madera 8x30mm", "cantidad": tarugos_count, "unidad": "piezas"},
        {"nombre": f"Par Correderas ({tipo_cajon_param})", "cantidad": correderas_count, "unidad": "pares"}
    ]
    
    area_madera_m2 = sum((p["ancho"] * p["largo"] * p["cantidad"]) for p in piezas_madera if p["espesor"] > 3) / 1_000_000.0
    costo_total = math.ceil(((area_madera_m2 * 48.0) + (correderas_count * 4.50) + 20.0) * 100) / 100
    
    # 2. Selección de Algoritmo NATIVO (.ghx)
    model_id = str(p.get("model_id", "Cajon_Experimento_Viktor"))
    raw_ghx_content = p.get("ghx_content") or ""
    custom_filename = str(p.get("custom_filename", ""))
    
    root = None
    ghx_file = ""

    if raw_ghx_content and raw_ghx_content.strip():
        try:
            root = ET.fromstring(raw_ghx_content)
            temp_dir = r"C:\Desarrollo\mmapp\temporal"
            os.makedirs(temp_dir, exist_ok=True)
            custom_path = os.path.join(temp_dir, "uploaded_custom.ghx")
            if os.path.exists(custom_path):
                try:
                    os.remove(custom_path)
                except Exception:
                    pass
            with open(custom_path, "w", encoding="utf-8") as f:
                f.write(raw_ghx_content)
            ghx_file = custom_path
        except Exception as err:
            print(f"[3BF Worker /compute] Error guardando XML subido: {err}", flush=True)

    if root is None:
        ghx_file = find_ghx_in_system(model_id, custom_filename)

    real_meshes = []
    mallas_duplicadas_detectadas = {}
    perforaciones_nurbs = []
    default_values = {}
    rhino_compute_success = False
    rhino_outputs_count = 0
    b64_algo = None
    
    try:
        if root is not None or (ghx_file and os.path.exists(ghx_file)):
            if root is None and ghx_file and os.path.exists(ghx_file):
                ghx_mtime_disk = int(os.path.getmtime(ghx_file))
                raw_xml_str = None
                if ghx_file in _RAW_GHX_STRING_CACHE:
                    cached_mtime, cached_str = _RAW_GHX_STRING_CACHE[ghx_file]
                    if cached_mtime == ghx_mtime_disk:
                        raw_xml_str = cached_str
                if raw_xml_str is None:
                    with open(ghx_file, "r", encoding="utf-8-sig") as f:
                        raw_xml_str = f.read()
                    _RAW_GHX_STRING_CACHE[ghx_file] = (ghx_mtime_disk, raw_xml_str)
                root = ET.fromstring(raw_xml_str)

            # 1. Extraer valores por defecto ORIGINALES de sliders y value lists
            default_values = {}
            for chunk in root.iter("chunk"):
                if chunk.attrib.get("name") == "Object":
                    name_item = chunk.find("items/item[@name='Name']")
                    if name_item is not None and "Number Slider" in str(name_item.text):
                        container = chunk.find("chunks/chunk[@name='Container']")
                        if container is not None:
                            nick_item = container.find("items/item[@name='NickName']")
                            slider_chunk = container.find("chunks/chunk[@name='Slider']")
                            if nick_item is not None and slider_chunk is not None:
                                nick = nick_item.text or ""
                                val_item = slider_chunk.find("items/item[@name='Value']")
                                if val_item is not None and nick.startswith("RH_IN:"):
                                    try:
                                        default_values[nick] = float(val_item.text)
                                    except:
                                        default_values[nick] = val_item.text

                if chunk.attrib.get("name") == "Container":
                    nick = ""
                    for it in chunk.findall("items/item"):
                        if it.attrib.get("name") == "NickName":
                            nick = it.text or ""
                    if nick.startswith("RH_IN:"):
                        for sub in chunk.iter("chunk"):
                            if sub.attrib.get("name") == "ListItem":
                                name_item = sub.find("items/item[@name='Name']")
                                sel_item = sub.find("items/item[@name='Selected']")
                                if name_item is not None and sel_item is not None and sel_item.text == "true":
                                    default_values[nick] = name_item.text

            # 2. ⚡ ACTUALIZACIÓN EN CALIENTE DE NUMBER SLIDERS EN EL XML
            # En Grasshopper/RhinoCompute, los Number Sliders leen su valor directamente del XML del archivo .ghx
            for chunk in root.iter("chunk"):
                if chunk.attrib.get("name") == "Object":
                    container = chunk.find("chunks/chunk[@name='Container']")
                    if container is not None:
                        nick_item = container.find("items/item[@name='NickName']")
                        slider_chunk = container.find("chunks/chunk[@name='Slider']")
                        if nick_item is not None and slider_chunk is not None:
                            nick = nick_item.text or ""
                            if nick.startswith("RH_IN:"):
                                val_item = slider_chunk.find("items/item[@name='Value']")
                                min_item = slider_chunk.find("items/item[@name='Min']")
                                max_item = slider_chunk.find("items/item[@name='Max']")
                                if val_item is not None:
                                    def_v = default_values.get(nick, 0.0)
                                    user_v = find_user_param_value(p, nick, def_v)
                                    try:
                                        f_user = float(user_v)
                                        # 🛡️ BLINDAJE ANTI-COLAPSO GRASSHOPPER:
                                        # Clamping estricto contra Min y Max del propio Slider GHX para impedir
                                        # que dimensiones degeneradas (ej. Alto = 9mm) bloqueen el solver C++ de RhinoCompute
                                        if min_item is not None and min_item.text:
                                            try:
                                                f_user = max(float(min_item.text), f_user)
                                            except Exception:
                                                pass
                                        if max_item is not None and max_item.text:
                                            try:
                                                f_user = min(float(max_item.text), f_user)
                                            except Exception:
                                                pass
                                        val_item.text = str(f_user)
                                    except Exception:
                                        val_item.text = str(user_v)

            # 3. ⚡ ACTUALIZACIÓN EN CALIENTE DE VALUE LISTS (SELECTORES) EN EL XML
            for chunk in root.iter("chunk"):
                if chunk.attrib.get("name") == "Object":
                    container = chunk.find("chunks/chunk[@name='Container']")
                    if container is not None:
                        nick_item = container.find("items/item[@name='NickName']")
                        nick = nick_item.text or "" if nick_item is not None else ""
                        if nick.startswith("RH_IN:"):
                            def_v = default_values.get(nick, "")
                            user_v = find_user_param_value(p, nick, def_v)
                            target_val = str(user_v).strip()
                            
                            list_items = [sub for sub in chunk.iter("chunk") if sub.attrib.get("name") == "ListItem"]
                            if list_items:
                                matched_index = None

                                # 1. Coincidencia exacta de string o número
                                for idx, sub in enumerate(list_items):
                                    name_item = sub.find("items/item[@name='Name']")
                                    expr_item = sub.find("items/item[@name='Expression']")
                                    item_name = (name_item.text if name_item is not None else "").strip()
                                    item_expr = (expr_item.text if expr_item is not None else "").strip()
                                    
                                    if target_val.lower() == item_name.lower() or target_val.lower() == item_expr.lower():
                                        matched_index = idx
                                        break
                                    try:
                                        if float(target_val) == float(item_name) or float(target_val) == float(item_expr):
                                            matched_index = idx
                                            break
                                    except (ValueError, TypeError):
                                        pass

                                # 2. Si no hubo match directo, coincidencia semántica
                                if matched_index is None:
                                    tv_norm = re.sub(r'[^a-z0-9\-]', '', target_val.lower())
                                    for idx, sub in enumerate(list_items):
                                        name_item = sub.find("items/item[@name='Name']")
                                        expr_item = sub.find("items/item[@name='Expression']")
                                        item_name = (name_item.text if name_item is not None else "").strip()
                                        item_expr = (expr_item.text if expr_item is not None else "").strip()
                                        in_norm = re.sub(r'[^a-z0-9\-]', '', item_name.lower())
                                        expr_norm = re.sub(r'[^a-z0-9\-]', '', item_expr.lower())
                                        
                                        if tv_norm and (tv_norm == in_norm or tv_norm == expr_norm):
                                            matched_index = idx
                                            break

                                # Aplicar exactamente al único ítem seleccionado
                                if matched_index is not None:
                                    for idx, sub in enumerate(list_items):
                                        for it in sub.findall("items/item"):
                                            if it.attrib.get("name") == "Selected":
                                                it.text = "true" if idx == matched_index else "false"

            xml_bytes = ET.tostring(root, encoding="utf-8")
            b64_algo = base64.b64encode(xml_bytes).decode("utf-8")

            print(f"[3BF Worker] Solucionando modelo {model_id} ({ghx_file}) en RhinoCompute (Grafo Optimizado)", flush=True)

            # Armar payload_values 100% DINÁMICO para Sliders y Parámetros en RhinoCompute
            payload_values = []
            for nick, def_val in default_values.items():
                user_val = find_user_param_value(p, nick, def_val)
                if isinstance(def_val, (int, float)):
                    try:
                        num_v = float(user_val)
                        payload_values.append({
                            "ParamName": nick,
                            "InnerTree": {"{0}": [{"type": "System.Double", "data": str(num_v)}]}
                        })
                    except:
                        pass
                elif isinstance(def_val, str) and user_val:
                    payload_values.append({
                        "ParamName": nick,
                        "InnerTree": {"{0}": [{"type": "System.String", "data": str(user_val)}]}
                    })

            payload_rc = {
                "algo": b64_algo,
                "pointer": None,
                "values": payload_values
            }
            
            text_outputs = {}
            perforaciones_nurbs = []

            res_rc = requests.post("http://127.0.0.1:5000/grasshopper", json=payload_rc, timeout=60)
            if res_rc.status_code == 200:
                rhino_compute_success = True
                data_rc = res_rc.json()
                rhino_outputs_count = len(data_rc.get("values", []))
                for val in data_rc.get("values", []):
                    p_name = val.get("ParamName", "Pieza GH")
                    p_name_lower = p_name.lower()
                    inner_tree = val.get("InnerTree", {})
                    for path_key, items in inner_tree.items():
                        for item in items:
                            raw_data = item.get("data")
                            if not raw_data:
                                continue
                            if isinstance(raw_data, str) and not raw_data.strip().startswith("{") and not raw_data.strip().startswith("["):
                                text_outputs[p_name] = raw_data.strip('"').strip()
                            try:
                                obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                                if isinstance(obj, dict):
                                    if "X" in obj and "Y" in obj and "Z" in obj:
                                        x_sz = abs(obj["X"]["T1"] - obj["X"]["T0"]) / 1000.0
                                        y_sz = abs(obj["Y"]["T1"] - obj["Y"]["T0"]) / 1000.0
                                        z_sz = abs(obj["Z"]["T1"] - obj["Z"]["T0"]) / 1000.0
                                        center = obj.get("Center", {"X": 0, "Y": 0, "Z": 0})
                                        
                                        min_x, max_x = obj["X"]["T0"] / 1000.0, obj["X"]["T1"] / 1000.0
                                        min_y, max_y = -obj["Y"]["T1"] / 1000.0, -obj["Y"]["T0"] / 1000.0
                                        min_z, max_z = obj["Z"]["T0"] / 1000.0, obj["Z"]["T1"] / 1000.0
                                        
                                        real_meshes.append({
                                            "name": p_name,
                                            "size": [x_sz, z_sz, y_sz],
                                            "position": [center["X"]/1000.0, center["Z"]/1000.0, -center["Y"]/1000.0],
                                            "vertices": [
                                                min_x, min_z, min_y,  min_x, max_z, min_y,  max_x, max_z, min_y,  max_x, min_z, min_y,
                                                min_x, min_z, max_y,  min_x, max_z, max_y,  max_x, max_z, max_y,  max_x, min_z, max_y,
                                            ],
                                            "indices": [
                                                0, 1, 2,  0, 2, 3,
                                                4, 6, 5,  4, 7, 6,
                                                0, 5, 1,  0, 4, 5,
                                                2, 7, 3,  2, 6, 7,
                                                0, 7, 4,  0, 3, 7,
                                                1, 5, 6,  1, 6, 2
                                            ]
                                        })
                                    elif "archive3dm" in obj or "opennurbs" in obj:
                                        decoded_geom = rhino3dm.CommonObject.Decode(obj)
                                        if decoded_geom:
                                            bbox = decoded_geom.GetBoundingBox()
                                            x_sz = abs(bbox.Max.X - bbox.Min.X) / 1000.0
                                            y_sz = abs(bbox.Max.Y - bbox.Min.Y) / 1000.0
                                            z_sz = abs(bbox.Max.Z - bbox.Min.Z) / 1000.0
                                            center_x = (bbox.Min.X + bbox.Max.X) / 2.0 / 1000.0
                                            center_y = (bbox.Min.Y + bbox.Max.Y) / 2.0 / 1000.0
                                            center_z = (bbox.Min.Z + bbox.Max.Z) / 2.0 / 1000.0
                                            
                                            user_str_name = ""
                                            if hasattr(decoded_geom, "GetUserString"):
                                                try:
                                                    user_str_name = decoded_geom.GetUserString("Name") or decoded_geom.GetUserString("PieceName") or ""
                                                except Exception:
                                                    pass
                                            if not user_str_name and hasattr(decoded_geom, "Name") and decoded_geom.Name:
                                                user_str_name = decoded_geom.Name

                                            effective_name = user_str_name.strip() if user_str_name and user_str_name.strip() else p_name

                                            mesh_dict = {
                                                "name": effective_name,
                                                "size": [x_sz, z_sz, y_sz],
                                                "position": [center_x, center_z, -center_y]
                                            }

                                            # Extraer perforaciones analíticas OpenNURBS / BRep / Cilindros
                                            es_perf = any(k in p_name_lower for k in ["perforad", "perforacion", "perforaciones", "mecanizado", "drill", "tarugo", "tornillo", "minifix", "guia", "corredera", "perno", "caja", "herraje"])
                                            dx_mm = round(x_sz * 1000.0, 1)
                                            dy_mm = round(y_sz * 1000.0, 1)
                                            dz_mm = round(z_sz * 1000.0, 1)
                                            
                                            dims = [dx_mm, dy_mm, dz_mm]
                                            max_dim = max(dims)
                                            min_dims = [d for d in dims if d < max_dim]
                                            diam_calc = min(dims) if not min_dims else sum(min_dims) / len(min_dims)
                                            
                                            if dx_mm >= dz_mm and dx_mm >= dy_mm:
                                                eje_calc = "X"
                                            elif dz_mm >= dx_mm and dz_mm >= dy_mm:
                                                eje_calc = "Z"
                                            else:
                                                eje_calc = "Y"
                                                
                                            if diam_calc <= 6.5:
                                                tipo_calc = "guia_d5"
                                            elif diam_calc <= 11.0:
                                                tipo_calc = "tarugo_d8"
                                            elif diam_calc <= 22.0:
                                                tipo_calc = "caja_d15"
                                            elif diam_calc <= 45.0:
                                                tipo_calc = "bisagra_d35"
                                            else:
                                                tipo_calc = "otro"

                                            # Solo agregar si es un Brep o Mesh de perforación (máxima dimensión <= 150mm para evitar que un tablero entero se catalogue como perforación)
                                            if (es_perf or isinstance(decoded_geom, rhino3dm.Brep)) and max_dim <= 150.0 and diam_calc <= 50.0:
                                                perforaciones_nurbs.append({
                                                    "name": p_name,
                                                    "size_mm": [dx_mm, dy_mm, dz_mm],
                                                    "center_cad_mm": [round((bbox.Min.X + bbox.Max.X) / 2.0, 1), round((bbox.Min.Y + bbox.Max.Y) / 2.0, 1), round((bbox.Min.Z + bbox.Max.Z) / 2.0, 1)],
                                                    "center_local_m": [round(center_x, 4), round(center_z, 4), round(-center_y, 4)],
                                                    "diametro_mm": round(diam_calc, 1),
                                                    "profundidad_mm": round(max_dim, 1),
                                                    "eje_principal": eje_calc,
                                                    "tipo": tipo_calc
                                                })
                                            
                                            # Si el objeto es una Malla Poligonal real, extraer vértices e índices de triángulos
                                            if isinstance(decoded_geom, rhino3dm.Mesh):
                                                verts = []
                                                uvs = []
                                                has_tex_coords = hasattr(decoded_geom, "TextureCoordinates") and len(decoded_geom.TextureCoordinates) == len(decoded_geom.Vertices)
                                                for idx, v in enumerate(decoded_geom.Vertices):
                                                    local_x = (v.X - (center_x * 1000.0)) / 1000.0
                                                    local_y = (v.Y - (center_y * 1000.0)) / 1000.0
                                                    local_z = (v.Z - (center_z * 1000.0)) / 1000.0
                                                    verts.extend([round(local_x, 4), round(local_z, 4), round(-local_y, 4)])
                                                    if has_tex_coords:
                                                        tc = decoded_geom.TextureCoordinates[idx]
                                                        uvs.extend([round(tc.X, 4), round(tc.Y, 4)])
                                                indices = []
                                                for i in range(len(decoded_geom.Faces)):
                                                    f = decoded_geom.Faces[i]
                                                    indices.extend([f[0], f[1], f[2]])
                                                    if f[2] != f[3]:
                                                        indices.extend([f[0], f[2], f[3]])
                                                if verts and indices:
                                                    mesh_dict["vertices"] = verts
                                                    mesh_dict["indices"] = indices
                                                    if uvs and len(uvs) == len(verts) * 2 // 3:
                                                        mesh_dict["uvs"] = uvs
                                                    # 🏝️ DfMA Multi-Body Mesh Decomposition: Separar componentes disjuntos SOLO para piezas de madera unidas por Mesh Join (ej: Tapaluces).
                                                    # Los herrajes (patas, tornillos, correderas, etc.) se preservan íntegros como una sola pieza física.
                                                    if es_nombre_herraje(mesh_dict.get("name", ""), mesh_dict.get("size")):
                                                        real_meshes.append(mesh_dict)
                                                    else:
                                                        islas = split_mesh_dict_into_islands(mesh_dict)
                                                        for isl in islas:
                                                            real_meshes.append(isl)
                                            elif isinstance(decoded_geom, rhino3dm.Brep) or "nurbs" in p_name.lower():
                                                mesh_dict["is_nurbs_solid"] = True
                                                pass
                            except Exception as ex:
                                print(f"[3BF Worker Error]: Error en decodificacion/extraccion de malla {p_name}: {ex}", flush=True)
                                
                # Garantía 100% Estructural: Si la sustracción booleana de un herraje hizo colapsar la salida del tablero, inyectar el tablero base automáticamente
                if "Cubierta" in ghx_file:
                    u_izq_str = str(find_user_param_value(p, "RH_IN:02.1 Union izquierda", find_user_param_value(p, "union_izquierda", ""))).lower()
                    u_der_str = str(find_user_param_value(p, "RH_IN:02.0 Union Derecha", find_user_param_value(p, "union_derecha", ""))).lower()
                    tiene_entrepanio = "entrepaño" in u_izq_str or "entrepanio" in u_izq_str or u_izq_str == "3" or "entrepaño" in u_der_str or "entrepanio" in u_der_str or u_der_str == "3"
                    
                    if not tiene_entrepanio:
                        real_meshes = [m for m in real_meshes if "entrepaño" not in m.get("name", "").lower() and "entrepanio" not in m.get("name", "").lower() and "soporte" not in m.get("name", "").lower()]

                    has_main_board = any("cubierta" in m.get("name", "").lower() or ("entrepaño" in m.get("name", "").lower() and tiene_entrepanio) for m in real_meshes)
                    if not has_main_board:
                        print(f"[3BF Worker Reactivador] Inyectando Tablero Base Estructural Cubierta ({ancho}mm x {prof}mm)", flush=True)
                        real_meshes.append({
                            "name": "RH_OUT:Nurbs Cubierta (Reactivador DfMA)",
                            "size": [float(ancho) / 1000.0, 0.015, float(prof) / 1000.0],
                            "position": [0, 0.0075, 0]
                        })

                # 🪵 DfMA Board Dimension Repair: Informar el calibre estructural real en el BOM/metadata
                # sin sobreescribir destructivamente la geometría real de las caras superficiales de apariencia.
                mapa_mdp = {}
                for m in real_meshes:
                    n_raw = m.get("name", "").strip()
                    if "mdp" in n_raw.lower():
                        clean_tag = re.sub(r'RH_OUT:\s*', '', n_raw, flags=re.IGNORECASE)
                        clean_tag = re.sub(r'MDP\s+', '', clean_tag, flags=re.IGNORECASE).strip().lower()
                        mapa_mdp[clean_tag] = m

                for m in real_meshes:
                    n_raw = m.get("name", "").strip()
                    n_low = n_raw.lower()
                    if "mdp" not in n_low and "balance" not in n_low and not n_low.endswith(" b"):
                        clean_tag = re.sub(r'RH_OUT:\s*', '', n_raw, flags=re.IGNORECASE).strip().lower()
                        if clean_tag in mapa_mdp:
                            mdp_m = mapa_mdp[clean_tag]
                            m_sz = m.get("size", [0, 0, 0])
                            mdp_sz = mdp_m.get("size", [0, 0, 0])
                            min_m = min(m_sz) if m_sz else 0
                            min_mdp = min(mdp_sz) if mdp_sz else 0
                            if min_m < 0.008 and min_mdp >= 0.010:
                                # Preservar fielmente los vértices originales de la Cara A
                                m["espesor_nominal"] = min_mdp

                # 🪵 DfMA Grooved Board Strip Alignment (Alineación Anatómica de Franja Inferior Bajo Ranura):
                # Cuando Grasshopper corta una superficie frontal/posterior con ranura (ej: Posterior de Cajón),
                # la franja inferior (< 40mm) puede quedar centrada en el origen local del Brep (mitad del tablero)
                # en lugar de alinearse rasante al borde inferior físico del tablero. Reubicamos la franja en su cota real.
                caras_b_list = [m for m in real_meshes if m.get("name", "").endswith(" B")]
                print(f"[DEBUG STRIP ALIGNMENT] Caras B encontradas: {len(caras_b_list)}", flush=True)
                for cb in caras_b_list:
                    cb_pos = cb.get("position", [0, 0, 0])
                    cb_sz = cb.get("size", [0, 0, 0])
                    if len(cb_pos) >= 3 and len(cb_sz) >= 2:
                        h_board = cb_sz[1]
                        y_center = cb_pos[1]
                        y_bottom = y_center - (h_board / 2.0)
                        base_name = cb.get("name", "")[:-2].strip()

                        for m in real_meshes:
                            if m.get("name", "").strip() == base_name:
                                m_pos = m.get("position", [0, 0, 0])
                                m_sz = m.get("size", [0, 0, 0])
                                if len(m_pos) >= 3 and len(m_sz) >= 2:
                                    cond_xz = (abs(m_pos[0] - cb_pos[0]) < 0.01 and abs(m_pos[2] - cb_pos[2]) < 0.03)
                                    cond_sz = (m_sz[1] < h_board * 0.4)
                                    cond_y = (abs(m_pos[1] - y_center) < 0.01)

                                    if cond_xz and cond_sz and cond_y:
                                        y_target = round(y_bottom + (m_sz[1] / 2.0), 4)
                                        print(f"[DEBUG ALIGNING] {base_name}: {m['position'][1]} -> {y_target}", flush=True)
                                        m["position"] = [m_pos[0], y_target, m_pos[2]]

                # 🛡️ Aplicar Deduplicador DfMA de Mallas (marca duplicados para resaltado en rojo y limpia BOM)
                unique_meshes, all_annotated_meshes, mallas_duplicadas_detectadas = deduplicate_real_meshes(real_meshes)
                real_meshes = all_annotated_meshes

                print(f"[3BF Worker] RhinoCompute respondió HTTP 200 | Mallas: {len(real_meshes)} | Perforaciones NURBS: {len(perforaciones_nurbs)}", flush=True)
            else:
                print(f"[3BF Worker Error] RhinoCompute respondió HTTP {res_rc.status_code}: {res_rc.text[:300]}", flush=True)
    except Exception as err:
        print(f"[RhinoCompute Notice]: {err}", flush=True)
        
    execution_time_ms = round((time.time() - start_time) * 1000, 2)
    slider_limits = parse_ghx_slider_limits(ghx_file)

    # =========================================================================
    # 🔩 DETECCIÓN POSITIVA DE HERRAJES & TABLEROS POR GEOMETRÍA REAL (DfMA)
    # =========================================================================
    piezas_madera_final, herrajes_final, summary_dict = calcular_bom_y_despiece(
        real_meshes=real_meshes,
        root=root,
        text_outputs=text_outputs,
        ghx_file=ghx_file,
        p=p,
        model_id=model_id,
        custom_filename=custom_filename,
        cant_cajones=cant_cajones,
        tipo_cajon_param=tipo_cajon_param,
        ancho=ancho,
        prof=prof,
    )

    declared_outputs = []
    if root is not None:
        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                c = chunk.find("chunks/chunk[@name='Container']")
                if c is not None:
                    name_item = c.find("items/item[@name='Name']")
                    nick_item = c.find("items/item[@name='NickName']")
                    name_t = (name_item.text or "").strip() if name_item is not None else ""
                    nick_t = (nick_item.text or "").strip() if nick_item is not None else ""
                    if nick_t.startswith("RH_OUT:") and name_t != "Group":
                        if nick_t not in declared_outputs:
                            declared_outputs.append(nick_t)

    response_payload = {
        "status": "success",
        "model_id": model_id,
        "source_gh": ghx_file,
        "rhino8_compute": {
            "active": rhino_compute_success,
            "server": "http://localhost:5000",
            "outputs_evaluated": rhino_outputs_count,
            "real_meshes_extracted": len(real_meshes)
        },
        "real_meshes": real_meshes,
        "perforaciones_nurbs": perforaciones_nurbs,
        "declared_outputs": declared_outputs,
        "execution_time_ms": execution_time_ms,
        "slider_limits": slider_limits,
        "default_values": default_values,
        "parameter_groups": extract_parameter_groups(root, default_values) if root is not None else [],
        "summary": summary_dict,
        "despiece": piezas_madera_final,
        "herrajes": herrajes_final,
        "mallas_duplicadas_detectadas": mallas_duplicadas_detectadas
    }

    # 💾 Guardar en memoria RAM para Bypasses ultrarrápidos (< 2 ms)
    if rhino_compute_success and len(real_meshes) > 0:
        try:
            # 1. Mapeo estético de parámetros dinámicos del GHX
            aes_map = extract_ghx_aesthetic_mapping(ghx_file) if ghx_file and os.path.exists(ghx_file) else {}

            # 2. Fondos Peça 18
            fondos_data_list = []
            p18_items = [m for m in real_meshes if m.get("name") == "RH_OUT:Peça 18"]
            mdf18_items = [m for m in real_meshes if m.get("name") == "RH_OUT:MDF Peça 18"]
            if p18_items and mdf18_items:
                for idx in range(min(len(p18_items), len(mdf18_items))):
                    all_t = extract_tris_from_mesh(p18_items[idx]) + extract_tris_from_mesh(mdf18_items[idx])
                    cara_a = [t for t in all_t if t["ny"] > 0.7]
                    cara_b = [t for t in all_t if t["ny"] < -0.7]
                    cantos = [t for t in all_t if abs(t["ny"]) <= 0.7]
                    if cara_a and cara_b:
                        fondos_data_list.append({
                            "cara_a": cara_a,
                            "cara_b": cara_b,
                            "cantos": cantos,
                            "template": p18_items[idx]
                        })

            # 3. Clasificación Universal de Piezas Tablero (1, 2, 4, 5, 6, 7, 8, 10, 11, 13, 16, 17, 19)
            from collections import defaultdict
            piece_items = defaultdict(lambda: {"col": [], "bal": [], "mdp": []})
            static_other_meshes = []

            for m in real_meshes:
                if m.get("es_duplicado_ghx"):
                    continue
                m_name = m.get("name", "")
                match = re.search(r'Pe[çc\ufffd\?a]*\s+(\d+)', m_name, re.IGNORECASE)
                if match:
                    p_num = int(match.group(1))
                    if p_num == 18:
                        continue # Ya procesado en fondos_data_list
                    nl = m_name.lower()
                    if "mdp" in nl or "mdf" in nl:
                        piece_items[p_num]["mdp"].append(m)
                    elif " b" in nl or "_b" in nl or "balance" in nl:
                        piece_items[p_num]["bal"].append(m)
                    else:
                        piece_items[p_num]["col"].append(m)
                else:
                    static_other_meshes.append(m)

            pieces_classified = {}
            for p_num in sorted(piece_items.keys()):
                cols = piece_items[p_num]["col"]
                bals = piece_items[p_num]["bal"]
                mdps = piece_items[p_num]["mdp"]
                n_inst = max(len(cols), len(bals), len(mdps))
                raw_inst_tris = []
                for idx in range(n_inst):
                    inst_tris = []
                    if idx < len(cols):
                        inst_tris.extend(extract_tris_from_mesh(cols[idx]))
                    if idx < len(bals):
                        inst_tris.extend(extract_tris_from_mesh(bals[idx]))
                    if idx < len(mdps):
                        inst_tris.extend(extract_tris_from_mesh(mdps[idx]))
                    raw_inst_tris.append(inst_tris)

                # Calcular centro global del par simétrico
                mid_x = None
                if n_inst >= 2:
                    c_xs = []
                    for t_list in raw_inst_tris:
                        if t_list:
                            c_xs.append(sum(t["c"][0] for t in t_list) / float(len(t_list)))
                    if len(c_xs) >= 2 and (max(c_xs) - min(c_xs)) > 0.05:
                        mid_x = sum(c_xs) / float(len(c_xs))

                inst_list = []
                for idx, inst_tris in enumerate(raw_inst_tris):
                    if inst_tris:
                        inst_cx = sum(t["c"][0] for t in inst_tris) / float(len(inst_tris))
                        is_left = (mid_x is not None and inst_cx < mid_x)
                        c_res = classify_instance_tris(inst_tris, is_left=is_left)
                        if c_res:
                            inst_list.append(c_res)
                if inst_list:
                    pieces_classified[p_num] = inst_list

            _GEOMETRY_CACHE[model_key] = {
                "structural_hash": structural_hash,
                "fondos_data_list": fondos_data_list,
                "pieces_classified": pieces_classified,
                "static_other_meshes": static_other_meshes,
                "aesthetic_mapping": aes_map,
                "base_response": dict(response_payload),
                "user_params_snapshot": dict(current_flat_params)
            }
            _FULL_RESPONSE_CACHE[full_cache_key] = dict(response_payload)
            print(f"[3BF Worker] [RAM CACHE] Estado generalizado guardado en RAM: {len(pieces_classified)} piezas clasificadas + {len(static_other_meshes)} mallas estáticas + {len(fondos_data_list)} fondos", flush=True)

            # Persistencia en Disco para carga en 0.05 segundos
            try:
                with open(disk_cache_file, "w", encoding="utf-8") as f_out:
                    json.dump(response_payload, f_out)
                
                # 🛡️ NORMA OBLIGATORIA: Prohibido escribir o sobrescribir _default.json. Los snapshots se capturan en las esferas.
                pass
            except Exception as disk_write_err:
                print(f"[3BF Worker Disk Write Warning]: {disk_write_err}", flush=True)
        except Exception as cache_err:
            print(f"[3BF Worker Cache Warning]: {cache_err}", flush=True)

    return response_payload


# =============================================================================
# ⚡ ENDPOINT DE MECANIZADO INTER-COMPONENTES DfMA (Detección Espacial de Perforaciones)
# =============================================================================
@app.post("/mecanizar-intercomponentes")
async def mecanizar_intercomponentes(request: Request):
    data = await request.json()
    return procesar_mecanizado_intercomponentes(data)


# =============================================================================
# 📐 ENDPOINT DE EXPORTACIÓN CAM DXF PARA SECCIONADORA / CENTRO BIESSE SKIPPER
# =============================================================================
@app.post("/export-dxf")
async def export_dxf_biesse(request: Request):
    data = await request.json()
    return generar_dxf_biesse(data)


# =============================================================================
# ⚡ ENDPOINTS DE GESTIÓN DE CACHÉ EN DISCO (Apertura Instantánea 0.05s)
# =============================================================================
@app.get("/cache/list")
async def list_disk_caches():
    try:
        files = [f for f in os.listdir(CACHE_DIR) if f.endswith(".json")]
        items = []
        for f in files:
            fp = os.path.join(CACHE_DIR, f)
            size_kb = round(os.path.getsize(fp) / 1024.0, 1)
            mtime = os.path.getmtime(fp)
            items.append({
                "filename": f,
                "size_kb": size_kb,
                "mtime": mtime,
                "is_default": "_default" in f
            })
        return {"status": "success", "count": len(items), "files": items}
    except Exception as err:
        return {"status": "error", "message": str(err)}


@app.post("/cache/save")
async def save_disk_cache(request: Request):
    try:
        data = await request.json()
        filename = data.get("filename", "").strip()
        payload = data.get("payload")
        if not filename or not payload:
            raise HTTPException(status_code=400, detail="Se requiere filename y payload")
        if not filename.endswith(".json"):
            filename += ".json"
        
        # Sanitizar nombre
        filename = re.sub(r'[\\/*?:"<>|]', "_", filename)
        target_path = os.path.join(CACHE_DIR, filename)
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(payload, f)
        
        size_kb = round(os.path.getsize(target_path) / 1024.0, 1)
        print(f"[3BF Worker] Caché guardado exitosamente: {filename} ({size_kb} KB)", flush=True)
        return {"status": "success", "filename": filename, "size_kb": size_kb}
    except Exception as err:
        return {"status": "error", "message": str(err)}


@app.post("/cache/load")
async def load_disk_cache(request: Request):
    try:
        data = await request.json()
        filename = data.get("filename", "").strip()
        if not filename:
            raise HTTPException(status_code=400, detail="Se requiere filename")
        if not filename.endswith(".json"):
            filename += ".json"
        
        target_path = os.path.join(CACHE_DIR, filename)
        if not os.path.exists(target_path):
            raise HTTPException(status_code=404, detail="Archivo de caché no encontrado")
        
        t0 = time.time()
        with open(target_path, "r", encoding="utf-8") as f:
            loaded_data = json.load(f)
        elapsed_ms = round((time.time() - t0) * 1000, 2)
        loaded_data["execution_time_ms"] = elapsed_ms
        
        print(f"[3BF Worker] Caché cargado en {elapsed_ms} ms: {filename}", flush=True)
        return {"status": "success", "elapsed_ms": elapsed_ms, "data": loaded_data}
    except Exception as err:
        return {"status": "error", "message": str(err)}


if __name__ == "__main__":
    print("[3BF Worker] Arrancando 3BF Worker Python Engine en puerto 8005...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=8005)
