import os
import sys
import json
import re
import base64
import time
import math
import requests
import uvicorn
import rhino3dm
import xml.etree.ElementTree as ET
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

app = FastAPI(title="3BF Worker Python Engine", version="1.0.0")

def parse_ghx_slider_limits(ghx_path):
    limits = {}
    if not os.path.exists(ghx_path):
        return limits

    try:
        tree = ET.parse(ghx_path)
        root = tree.getroot()

        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                name_item = chunk.find("items/item[@name='Name']")
                comp_name = str(name_item.text) if name_item is not None else ""
                if comp_name == "Group":
                    continue
                container = chunk.find("chunks/chunk[@name='Container']")
                if container is not None:
                    nick_item = container.find("items/item[@name='NickName']")
                    nick = nick_item.text or "" if nick_item is not None else ""
                    
                    if nick.startswith("RH_IN:"):
                        # 1. Slider
                        slider_chunk = container.find("chunks/chunk[@name='Slider']")
                        if slider_chunk is not None or "Slider" in comp_name:
                            min_item = slider_chunk.find("items/item[@name='Min']") if slider_chunk is not None else None
                            max_item = slider_chunk.find("items/item[@name='Max']") if slider_chunk is not None else None
                            val_item = slider_chunk.find("items/item[@name='Value']") if slider_chunk is not None else None

                            if min_item is not None and max_item is not None:
                                limits[nick] = {
                                    "type": "slider",
                                    "min": float(min_item.text),
                                    "max": float(max_item.text),
                                    "default": float(val_item.text) if val_item is not None else float(min_item.text)
                                }
                        
                        # 2. Value List
                        val_options = []
                        val_selected = None
                        for sub in chunk.iter("chunk"):
                            if sub.attrib.get("name") == "ListItem":
                                n_item = sub.find("items/item[@name='Name']")
                                s_item = sub.find("items/item[@name='Selected']")
                                if n_item is not None and n_item.text:
                                    val_options.append(n_item.text)
                                    if s_item is not None and s_item.text == "true":
                                        val_selected = n_item.text
                        if val_options:
                            limits[nick] = {
                                "type": "valuelist",
                                "options": val_options,
                                "default": val_selected or val_options[0]
                            }
    except Exception as e:
        print(f"[3BF Worker] Error parseando límites slider: {e}", flush=True)

    return limits

def parse_ghx_default_values(ghx_path):
    defaults = {}
    if not os.path.exists(ghx_path):
        return defaults

    try:
        tree = ET.parse(ghx_path)
        root = tree.getroot()

        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                name_item = chunk.find("items/item[@name='Name']")
                comp_name = str(name_item.text) if name_item is not None else ""
                if comp_name == "Group":
                    continue
                container = chunk.find("chunks/chunk[@name='Container']")
                if container is not None:
                    nick_item = container.find("items/item[@name='NickName']")
                    nick = nick_item.text or "" if nick_item is not None else ""
                    if nick.startswith("RH_IN:"):
                        slider_chunk = container.find("chunks/chunk[@name='Slider']")
                        if slider_chunk is not None:
                            val_item = slider_chunk.find("items/item[@name='Value']")
                            if val_item is not None:
                                try:
                                    defaults[nick] = float(val_item.text)
                                except:
                                    defaults[nick] = val_item.text
                        
                        # Value List
                        first_opt = None
                        sel_opt = None
                        for sub in chunk.iter("chunk"):
                            if sub.attrib.get("name") == "ListItem":
                                name_item = sub.find("items/item[@name='Name']")
                                sel_item = sub.find("items/item[@name='Selected']")
                                if name_item is not None and name_item.text:
                                    if first_opt is None:
                                        first_opt = name_item.text
                                    if sel_item is not None and sel_item.text == "true":
                                        sel_opt = name_item.text
                        if first_opt is not None:
                            defaults[nick] = sel_opt or first_opt
    except Exception as e:
        print(f"[3BF Worker] Error parseando valores por defecto del GHX: {e}", flush=True)

    return defaults

class MetadataParams(BaseModel):
    model_id: str
    custom_filename: str = ""
    ghx_content: str = ""

def parse_num_prefix(text: str):
    clean = text.replace("RH_IN:", "").strip()
    match = re.search(r'^(\d+)(?:\.(\d+))?', clean)
    if match:
        major = int(match.group(1))
        minor = int(match.group(2)) if match.group(2) is not None else 0
        return (major, minor, clean.lower())
    return (999, 999, clean.lower())

def find_user_param_value(p_dict: dict, nick: str, default_val):
    if not isinstance(p_dict, dict):
        return default_val
    sub_p = p_dict.get("parameters", {})
    if not isinstance(sub_p, dict):
        sub_p = {}
        
    combined = {**p_dict, **sub_p}
    if nick in combined and combined[nick] is not None:
        return combined[nick]
        
    clean_target = re.sub(r'^RH_IN:\s*[\d.]*[_\s]*', '', nick).strip().lower().replace(' ', '_')
    
    # Priorizar claves exactas RH_IN: antes que fallbacks genéricos como ancho: 1200
    best_val = None
    best_priority = -1

    for k, v in combined.items():
        if not isinstance(k, str) or v is None or k == "parameters":
            continue
        clean_k = re.sub(r'^RH_IN:\s*[\d.]*[_\s]*', '', k).strip().lower().replace(' ', '_')
        if clean_k and (clean_k == clean_target or clean_k in clean_target or clean_target in clean_k):
            priority = 0
            if k == nick:
                priority = 3
            elif k.startswith("RH_IN:"):
                priority = 2
            elif clean_k == clean_target:
                priority = 1
            
            if priority > best_priority:
                best_priority = priority
                best_val = v
                
    if best_val is not None:
        return best_val
        
    return default_val

def extract_parameter_groups(root, default_values):
    rh_inputs = list(default_values.keys())
    
    # 1. Mapear TODOS los GUIDs de componentes reales a su NickName RH_IN:
    guid_to_nick = {}
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            name_item = chunk.find("items/item[@name='Name']")
            comp_name = str(name_item.text) if name_item is not None else ""
            if comp_name == "Group":
                continue # IGNORAR marcos visuales Group
            container = chunk.find("chunks/chunk[@name='Container']")
            if container is not None:
                nick_item = container.find("items/item[@name='NickName']")
                if nick_item is not None and nick_item.text and nick_item.text.startswith("RH_IN:"):
                    nick = nick_item.text
                    for item in chunk.iter("item"):
                        if item.text and (len(item.text) == 36 and item.text.count("-") == 4):
                            guid_to_nick[item.text] = nick

    # 2. Mapear Grupos explícitos de Grasshopper (marcos grandes)
    gh_groups = {}
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            name_item = chunk.find("items/item[@name='Name']")
            if name_item is not None and "Group" in str(name_item.text):
                container = chunk.find("chunks/chunk[@name='Container']")
                if container is not None:
                    g_nick = container.find("items/item[@name='NickName']")
                    g_title = g_nick.text if g_nick is not None and g_nick.text else ""
                    if g_title and not g_title.startswith("RH_"):
                        for item in container.iter("item"):
                            if item.text and item.text in guid_to_nick:
                                nick = guid_to_nick[item.text]
                                if nick.startswith("RH_IN:"):
                                    if g_title not in gh_groups:
                                        gh_groups[g_title] = []
                                    if nick not in gh_groups[g_title]:
                                        gh_groups[g_title].append(nick)

    grouped_results = []
    assigned_nicks = set()

    for g_title, nicks in gh_groups.items():
        if len(nicks) >= 1:
            sorted_nicks = sorted(nicks, key=parse_num_prefix)
            min_rank = min((parse_num_prefix(n) for n in sorted_nicks), default=(999, 999, ""))
            grouped_results.append({
                "title": g_title,
                "parameters": sorted_nicks,
                "_rank": min_rank
            })
            assigned_nicks.update(nicks)

    # Ordenar las tarjetas por el estándar VisualARQ (el número de sus miembros 01.x, 02.x, 05.x)
    grouped_results.sort(key=lambda g: g["_rank"])
    for g in grouped_results:
        g.pop("_rank", None)

    # 3. Categorización DfMA únicamente para los parámetros huérfanos que NO estén agrupados en GH
    remaining = [p for p in rh_inputs if p not in assigned_nicks]
    
    cat_dim = []
    cat_reced = []
    cat_uniones = []
    cat_cantos = []
    cat_otros = []

    for p in remaining:
        pl = p.lower()
        if any(k in pl for k in ["ancho", "alto", "profundidad"]):
            cat_dim.append(p)
        elif any(k in pl for k in ["recedido"]):
            cat_reced.append(p)
        elif any(k in pl for k in ["union", "orientacion", "tarugo", "tornillo", "minifix", "cajon", "cajón"]):
            cat_uniones.append(p)
        elif any(k in pl for k in ["borde", "balance", "mapeado", "textura", "acabado"]):
            cat_cantos.append(p)
        else:
            cat_otros.append(p)

    final_groups = list(grouped_results)

    if cat_dim:
        final_groups.append({"title": "📏 Dimensiones Principales", "parameters": sorted(cat_dim, key=parse_num_prefix)})
    if cat_reced:
        final_groups.append({"title": "📐 Recedidos y Ajustes", "parameters": sorted(cat_reced, key=parse_num_prefix)})
    if cat_uniones:
        final_groups.append({"title": "🔩 Uniones y Herrajes DfMA", "parameters": sorted(cat_uniones, key=parse_num_prefix)})
    if cat_cantos:
        final_groups.append({"title": "🪵 Cantos y Mapeado de Texturas", "parameters": sorted(cat_cantos, key=parse_num_prefix)})
    if cat_otros:
        final_groups.append({"title": "⚙️ Otros Parámetros", "parameters": sorted(cat_otros, key=parse_num_prefix)})

    return final_groups

def find_ghx_in_system(model_id: str, custom_filename: str = "") -> str:
    search_dirs = [
        r"C:\Desarrollo\mmapp\3BF\Definiciones",
        r"C:\Desarrollo\mmapp\temporal"
    ]
    
    # 1. Lista priorizada de objetivos exactos
    exact_targets = []
    if custom_filename:
        c_clean = custom_filename.replace("/", "\\").split("\\")[-1].lower()
        exact_targets.append(c_clean)
        if not c_clean.endswith(".ghx") and not c_clean.endswith(".gh"):
            exact_targets.append(f"{c_clean}.ghx")
    if model_id:
        m_clean = model_id.replace("/", "\\").split("\\")[-1].lower()
        if not m_clean.endswith(".ghx") and not m_clean.endswith(".gh"):
            exact_targets.append(f"{m_clean}.ghx")
        exact_targets.append(m_clean)

    # Buscar coincidencia exacta primero
    for sdir in search_dirs:
        if not os.path.exists(sdir):
            continue
        for root_dir, _, files in os.walk(sdir):
            for f in files:
                f_lower = f.lower()
                for target in exact_targets:
                    if f_lower == target or f_lower == f"{target}.ghx":
                        return os.path.join(root_dir, f)

    # 2. Fallbacks si no se encontró coincidencia exacta
    fallbacks = ["cubierta.ghx", "cajon_experimento_3dbimfab.ghx"]
    for sdir in search_dirs:
        if not os.path.exists(sdir):
            continue
        for root_dir, _, files in os.walk(sdir):
            for f in files:
                if f.lower() in fallbacks:
                    return os.path.join(root_dir, f)
    return ""

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
        except:
            pass
            
    slider_limits = {}
    default_values = {}
    
    if root is not None:
        # Extraer slider limits
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

            # Extraer value list defaults y sus opciones reales
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

from pydantic import BaseModel, ConfigDict

class ComputeParams(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    model_id: str = "Cajon_Experimento_Viktor"
    ancho: float = 1200.0
    alto: float = 800.0
    profundidad: float = 400.0
    cant_cajones: int = 3
    apertura_mm: float = 0.0
    parameters: dict = {}
    
    # Parámetros del Cajón
    apertura_cajones: float = 0.0
    profundidad_cajon: float = 351.0
    altura_lateral_cajon: float = 102.0
    distancia_bajo_laterales: float = 30.0
    tipo_cajon: str = "Corredera Estandar"
    
    # Parámetros de la Cubierta / DfMA
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
    # Cargar contenido XML directo si se subió un archivo desde el cliente
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

from fastapi import FastAPI, HTTPException, Request

@app.post("/compute")
async def compute_model(request: Request):
    start_time = time.time()
    
    p = await request.json()
    ancho = float(find_user_param_value(p, "RH_IN:Ancho", find_user_param_value(p, "ancho", 1200.0)))
    alto = float(find_user_param_value(p, "RH_IN:Alto", find_user_param_value(p, "alto", 800.0)))
    prof = float(find_user_param_value(p, "RH_IN:Profundidad", find_user_param_value(p, "profundidad", 400.0)))
    cant_cajones = int(p.get("cant_cajones", 3))
    apertura_mm = float(find_user_param_value(p, "RH_IN:02.5 Abrir Cajones", find_user_param_value(p, "RH_IN:Abrir Cajones", find_user_param_value(p, "abrir_cajones", find_user_param_value(p, "apertura_cajones", find_user_param_value(p, "apertura_mm", 0.0))))))
    prof_cajon_param = float(p.get("profundidad_cajon", 351.0))
    alt_lat_cajon_param = float(p.get("altura_lateral_cajon", 102.0))
    dist_bajo_lat_param = float(p.get("distancia_bajo_laterales", 30.0))
    tipo_cajon_param = str(p.get("tipo_cajon", "Corredera Estandar"))
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
    raw_ghx_content = str(p.get("ghx_content", ""))
    custom_filename = str(p.get("custom_filename", ""))
    
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
            print(f"[3BF Worker /compute] Error guardando XML subido: {err}", flush=True)

    if root is None:
        ghx_file = find_ghx_in_system(model_id, custom_filename)

    real_meshes = []
    default_values = {}
    rhino_compute_success = False
    rhino_outputs_count = 0
    
    try:
        if root is not None or (ghx_file and os.path.exists(ghx_file)):
            if root is None:
                tree = ET.parse(ghx_file)
                root = tree.getroot()
            
            # Extraer valores por defecto ORIGINALES antes de hacer cualquier reescritura en caliente
            default_values = {}
            for chunk in root.iter("chunk"):
                # 1. Sliders (Números)
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

                # 2. Value Lists (Selectores)
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

            # 1. Actualizar Number Sliders en caliente en el XML
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
                                if val_item is not None:
                                    def_v = default_values.get(nick, 0.0)
                                    user_v = find_user_param_value(p, nick, def_v)
                                    try:
                                        val_item.text = str(float(user_v))
                                    except:
                                        val_item.text = str(user_v)

            # 2. Actualizar Value Lists en caliente en el XML
            for chunk in root.iter("chunk"):
                if chunk.attrib.get("name") == "Container":
                    nick = ""
                    for it in chunk.findall("items/item"):
                        if it.attrib.get("name") == "NickName":
                            nick = it.text or ""
                    
                    if nick.startswith("RH_IN:"):
                        def_v = default_values.get(nick, "")
                        user_v = find_user_param_value(p, nick, def_v)
                        target_val = str(user_v).strip()
                        
                        for sub in chunk.iter("chunk"):
                            if sub.attrib.get("name") == "ListItem":
                                name_item = sub.find("items/item[@name='Name']")
                                expr_item = sub.find("items/item[@name='Expression']")
                                sel_item = sub.find("items/item[@name='Selected']")
                                
                                item_name = (name_item.text if name_item is not None else "").strip()
                                item_expr = (expr_item.text if expr_item is not None else "").strip()
                                
                                if sel_item is not None:
                                    tv_clean = re.sub(r'[^a-z0-9]', '', target_val.lower())
                                    in_clean = re.sub(r'[^a-z0-9]', '', item_name.lower())
                                    expr_clean = re.sub(r'[^a-z0-9]', '', item_expr.lower())
                                    
                                    # Coincidencia exacta o semántica robusta
                                    if (tv_clean == in_clean or 
                                        tv_clean == expr_clean or 
                                        ("tornillo" in tv_clean and "tarugo" in tv_clean and "tornillo" in in_clean and "tarugo" in in_clean) or
                                        (tv_clean == "minifix" and "minifix" in in_clean)):
                                        sel_item.text = "true"
                                    else:
                                        sel_item.text = "false"

            xml_bytes = ET.tostring(root, encoding="utf-8")
            xml_str = xml_bytes.decode("utf-8") + f"\n<!-- 3BF_CACHE_BUST: {int(time.time() * 1000)} -->"
            xml_bytes = xml_str.encode("utf-8")
            
            b64_algo = base64.b64encode(xml_bytes).decode("utf-8")
            print(f"[3BF Worker] Solucionando modelo {model_id} ({ghx_file}) en RhinoCompute (Bust Cache Activo)", flush=True)
            
            reactivador_ping = (int(time.time() * 1000) % 2) * 0.0001

            # Armar payload_values 100% DINÁMICO para RhinoCompute a partir de los RH_IN: del XML
            payload_values = []
            for nick, def_val in default_values.items():
                user_val = find_user_param_value(p, nick, def_val)
                if isinstance(def_val, (int, float)):
                    try:
                        num_v = float(user_val)
                        if "ancho" in nick.lower():
                            num_v += reactivador_ping
                        payload_values.append({
                            "ParamName": nick,
                            "InnerTree": {"{0}": [{"type": "System.Double", "data": str(num_v)}]}
                        })
                    except:
                        pass
                else:
                    payload_values.append({
                        "ParamName": nick,
                        "InnerTree": {"{0}": [{"type": "System.String", "data": str(user_val)}]}
                    })

            payload_rc = {
                "algo": b64_algo,
                "pointer": None,
                "values": payload_values
            }
            
            res_rc = requests.post("http://127.0.0.1:5000/grasshopper", json=payload_rc, timeout=10)
            if res_rc.status_code == 200:
                rhino_compute_success = True
                data_rc = res_rc.json()
                rhino_outputs_count = len(data_rc.get("values", []))
                
                text_outputs = {}
                perforaciones_nurbs = []
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
                                            x_sz = max(0.005, abs(bbox.Max.X - bbox.Min.X) / 1000.0)
                                            y_sz = max(0.005, abs(bbox.Max.Y - bbox.Min.Y) / 1000.0)
                                            z_sz = max(0.005, abs(bbox.Max.Z - bbox.Min.Z) / 1000.0)
                                            center_x = (bbox.Min.X + bbox.Max.X) / 2.0 / 1000.0
                                            center_y = (bbox.Min.Y + bbox.Max.Y) / 2.0 / 1000.0
                                            center_z = (bbox.Min.Z + bbox.Max.Z) / 2.0 / 1000.0
                                            
                                            effective_name = p_name

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
                                                    real_meshes.append(mesh_dict)
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

                print(f"[3BF Worker] RhinoCompute respondió HTTP 200 | Mallas: {len(real_meshes)} | Perforaciones NURBS: {len(perforaciones_nurbs)}", flush=True)
    except Exception as err:
        print(f"[RhinoCompute Notice]: {err}", flush=True)
        
    execution_time_ms = round((time.time() - start_time) * 1000, 2)
    slider_limits = parse_ghx_slider_limits(ghx_file)

    # =========================================================================
    # 📊 CÓMPUTO DINÁMICO DE DESPIECE (BOM) E INVENTARIO DE HERRAJES VIVO (DfMA)
    # =========================================================================
    # =========================================================================
    # 🔩 CÓMPUTO DINÁMICO DE HERRAJES 100% FIEL AL GHX
    # =========================================================================
    PALABRAS_CLAVE_HERRAJES = ["perno", "caja", "tarugo", "tornillo", "soporte", "corredera", "bisagra", "pata", "manija", "tirador", "nivelador", "acople", "tuerca", "arandela", "minifix"]
    
    conteo_mallas_herrajes = {}
    for m in real_meshes:
        raw_name = m.get("name", "").strip()
        name_lower = raw_name.lower()
        
        # Descartar maquinados o geometrías de sustracción
        if "maquinado" in name_lower:
            continue
            
        # Detectar si es un herraje por palabras clave
        es_herraje = any(k in name_lower for k in PALABRAS_CLAVE_HERRAJES)
        if es_herraje:
            # Respetar 100% el nombre definido por el usuario/diseñador en Grasshopper (limpiando solo el prefijo RH_OUT:)
            nombre_herraje_ghx = raw_name.replace("RH_OUT:", "").strip()
            if nombre_herraje_ghx:
                conteo_mallas_herrajes[nombre_herraje_ghx] = conteo_mallas_herrajes.get(nombre_herraje_ghx, 0) + 1

    herrajes_final = []
    costo_herrajes_calc = 0.0

    for nombre_ghx, m_count in conteo_mallas_herrajes.items():
        # Regla DfMA para herrajes compuestos (ej: Perno Minifix taquete + espiga = 2 mallas / unidad)
        mallas_por_herraje = 2 if "perno" in nombre_ghx.lower() else 1
        cant_real = math.ceil(m_count / mallas_por_herraje)
        
        # Costeo paramétrico base (se conectará a Supabase por nombre/referencia)
        costo_unit = 0.35 if "caja" in nombre_ghx.lower() else (0.28 if "perno" in nombre_ghx.lower() else 0.08)
        costo_herrajes_calc += cant_real * costo_unit
        
        herrajes_final.append({
            "nombre": nombre_ghx,
            "cantidad": cant_real,
            "unidad": "pares" if "corredera" in nombre_ghx.lower() else "piezas"
        })

    # Fallback si es un modelo sin mallas explícitas de herrajes
    if not herrajes_final and "cajon" in (model_id + custom_filename).lower():
        minifix_cant = 16 + (cant_cajones * 8)
        tarugos_cant = cant_cajones * 12
        herrajes_final = [
            {"nombre": "Caja Minifix 15mm", "cantidad": minifix_cant, "unidad": "piezas"},
            {"nombre": "Perno Minifix 34mm", "cantidad": minifix_cant, "unidad": "piezas"},
            {"nombre": "Tarugo Madera 8x30mm", "cantidad": tarugos_cant, "unidad": "piezas"},
            {"nombre": f"Par Correderas ({tipo_cajon_param})", "cantidad": cant_cajones, "unidad": "pares"}
        ]
        costo_herrajes_calc = (minifix_cant * 0.63) + (tarugos_cant * 0.05) + (cant_cajones * 4.50)

    # =========================================================================
    # 🪵 ESCANEO GEOMÉTRICO 3D DIRECTO DE TABLEROS (BOM REAL DfMA CONSOLIDADO)
    # =========================================================================
    tableros_consolidados = []
    for m in real_meshes:
        name_lower = m.get("name", "").lower()
        if any(h in name_lower for h in ["perno", "caja", "tarugo", "tornillo", "soporte", "corredera", "maquinado"]):
            continue
            
        size = m.get("size", [0, 0, 0])
        pos = m.get("position", [0, 0, 0])
        
        # Dimensiones físicas en milímetros
        dims_mm = sorted([round(size[0] * 1000.0, 1), round(size[1] * 1000.0, 1), round(size[2] * 1000.0, 1)])
        esp_malla = dims_mm[0]
        anc_malla = dims_mm[1]
        lar_malla = dims_mm[2]
        
        # Filtrar solo elementos que califiquen como tableros (ancho y largo >= 40mm)
        if lar_malla >= 40.0 and anc_malla >= 40.0:
            if esp_malla < 5.0:
                esp_malla = 15.0
                
            # Nombre de la pieza
            custom_name = None
            for k_out, v_out in text_outputs.items():
                if any(k in k_out.lower() for k in ["nombre", "pieza", "piecename"]):
                    custom_name = v_out
                    break
                    
            if custom_name:
                nombre_limpio = custom_name
            else:
                nombre_limpio = m.get("name", "").replace("RH_OUT:", "").strip()
                for prefix in ["MDP ", "Color ", "Balance ", "Nurbs ", "Brep ", "MDP", "Color", "Balance"]:
                    if nombre_limpio.startswith(prefix):
                        nombre_limpio = nombre_limpio[len(prefix):].strip()
                nombre_limpio = nombre_limpio.capitalize()
                if not nombre_limpio or nombre_limpio in ["Cubierta2", "Entrepaño2", "Pieza", "Mdp", "Tablero"]:
                    nombre_limpio = "Cubierta" if "cubierta" in name_lower else ("Entrepaño" if "entrepaño" in name_lower else "Tablero")

            # Buscar si ya existe un tablero en la misma zona espacial (Tolerancia 60mm en centros X/Y/Z)
            encontrado = False
            for t in tableros_consolidados:
                dist_x = abs(t["pos"][0] - pos[0]) * 1000.0
                dist_y = abs(t["pos"][1] - pos[1]) * 1000.0
                dist_z = abs(t["pos"][2] - pos[2]) * 1000.0
                
                if dist_x < 60.0 and dist_y < 60.0 and dist_z < 60.0:
                    encontrado = True
                    # Consolidar tomando la cota máxima del tablero físico real y el nombre más específico
                    t["largo"] = max(t["largo"], lar_malla)
                    t["ancho"] = max(t["ancho"], anc_malla)
                    t["espesor"] = max(t["espesor"], esp_malla)
                    if t["nombre"] in ["Tablero", "Mdp", "Balance"] and nombre_limpio not in ["Tablero", "Mdp", "Balance"]:
                        t["nombre"] = nombre_limpio
                    break
                    
            if not encontrado:
                tableros_consolidados.append({
                    "nombre": nombre_limpio,
                    "largo": lar_malla,
                    "ancho": anc_malla,
                    "espesor": esp_malla,
                    "cantidad": 1,
                    "tipo": "Estructura DfMA",
                    "pos": pos
                })

    # Limpiar campo de posición interno y agrupar piezas idénticas
    if "Cubierta" in ghx_file:
        u_izq_str = str(find_user_param_value(p, "RH_IN:02.1 Union izquierda", find_user_param_value(p, "union_izquierda", ""))).lower()
        u_der_str = str(find_user_param_value(p, "RH_IN:02.0 Union Derecha", find_user_param_value(p, "union_derecha", ""))).lower()
        tiene_entrepanio = "entrepaño" in u_izq_str or "entrepanio" in u_izq_str or u_izq_str == "3" or "entrepaño" in u_der_str or "entrepanio" in u_der_str or u_der_str == "3" or any("soporte" in m.get("name", "").lower() for m in real_meshes)
        
        ancho_nom = float(find_user_param_value(p, "RH_IN:01.1 Ancho", find_user_param_value(p, "RH_IN:01 Ancho", find_user_param_value(p, "ancho", 500.0))))
        prof_nom = float(find_user_param_value(p, "RH_IN:01.2 Profundidad", find_user_param_value(p, "RH_IN:02 Profundidad", find_user_param_value(p, "profundidad", 500.0))))

        if tiene_entrepanio:
            piezas_madera_final = [
                {
                    "nombre": "Entrepaño",
                    "largo": round(ancho_nom - 1.0, 1),  # Pierde 0.5mm por lado para entrar y salir fácilmente del nicho
                    "ancho": round(prof_nom, 1),
                    "espesor": 15.0,
                    "cantidad": 1,
                    "tipo": "Entrepaño Deslizable DfMA"
                }
            ]
        else:
            piezas_madera_final = [
                {
                    "nombre": "Cubierta",
                    "largo": round(ancho_nom, 1),  # Cota nominal precisa que gobierna desde el configurador
                    "ancho": round(prof_nom, 1),
                    "espesor": 15.0,
                    "cantidad": 1,
                    "tipo": "Estructura Fija DfMA"
                }
            ]
    elif tableros_consolidados:
        agrupados = {}
        for tab in tableros_consolidados:
            k_dim = f"{tab['nombre']}_{tab['largo']}_{tab['ancho']}_{tab['espesor']}"
            if k_dim in agrupados:
                agrupados[k_dim]["cantidad"] += 1
            else:
                item_copy = {k: v for k, v in tab.items() if k != "pos"}
                agrupados[k_dim] = item_copy
        piezas_madera_final = list(agrupados.values())
    else:
        # Fallback sintético solo si no se extrajeron mallas de tableros
        piezas_madera_final = [
            {"nombre": "Cubierta", "ancho": float(prof), "largo": float(ancho), "espesor": 15.0, "cantidad": 1, "tipo": "Estructura DfMA"}
        ]

    area_madera_m2 = sum((item["ancho"] * item["largo"] * item["cantidad"]) for item in piezas_madera_final) / 1_000_000.0
    costo_madera = area_madera_m2 * 28.50
    costo_herrajes_calc = sum(h["cantidad"] * 0.45 for h in herrajes_final)
    costo_total = round(costo_madera + costo_herrajes_calc + 8.50, 2)

    dim_str = f"{ancho} x {prof} x 15 mm"
    if piezas_madera_final:
        p0 = piezas_madera_final[0]
        dim_str = f"{p0['largo']} x {p0['ancho']} x {p0['espesor']} mm"

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

    return {
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
        "summary": {
            "dimensiones": dim_str,
            "area_madera_m2": round(area_madera_m2, 3),
            "costo_estimado_usd": costo_total,
            "piezas_totales": sum(p["cantidad"] for p in piezas_madera_final)
        },
        "despiece": piezas_madera_final,
        "herrajes": herrajes_final
    }


# =============================================================================
# ⚡ ENDPOINT DE MECANIZADO INTER-COMPONENTES DfMA (Detección Espacial de Perforaciones)
# =============================================================================
@app.post("/mecanizar-intercomponentes")
async def mecanizar_intercomponentes(request: Request):
    try:
        data = await request.json()
        instancias = data.get("instancias", [])
        if not instancias or len(instancias) < 1:
            return {
                "status": "success", 
                "mecanizados_cruzados": {}, 
                "total_perforaciones": 0, 
                "resumen": ["Escenario sin componentes para mecanizar."]
            }

        mecanizados_por_instancia = {}
        total_perforaciones = 0
        mensajes_resumen = []

        # Estructurar las instancias con sus tableros y perforaciones en coordenadas mundiales
        instancias_procesadas = []
        for inst in instancias:
            inst_id = inst.get("id")
            inst_nombre = inst.get("nombreVisible") or inst.get("definitionId") or inst_id
            pos_inst = inst.get("posicion", [0.0, 0.0, 0.0]) # [X, Y, Z] en metros Three.js
            
            # Recolectar tableros de esta instancia
            tableros = []
            resultado = inst.get("resultado", {})
            real_meshes = resultado.get("real_meshes", [])
            
            for m in real_meshes:
                m_name = m.get("name", "").lower()
                # Tableros de madera
                if any(k in m_name for k in ["cubierta", "tablero", "lateral", "base", "techo", "fondo", "division", "entrepaño", "entrepanio", "cajon", "frente", "board", "mdp"]):
                    sz = m.get("size", [0.5, 0.015, 0.5]) # [X, Y, Z] en metros
                    pos_loc = m.get("position", [0.0, 0.0, 0.0])
                    
                    min_x = pos_inst[0] + pos_loc[0] - (sz[0] / 2.0)
                    max_x = pos_inst[0] + pos_loc[0] + (sz[0] / 2.0)
                    min_y = pos_inst[1] + pos_loc[1] - (sz[1] / 2.0)
                    max_y = pos_inst[1] + pos_loc[1] + (sz[1] / 2.0)
                    min_z = pos_inst[2] + pos_loc[2] - (sz[2] / 2.0)
                    max_z = pos_inst[2] + pos_loc[2] + (sz[2] / 2.0)
                    
                    tableros.append({
                        "name": m.get("name", "Tablero"),
                        "size_m": sz,
                        "pos_local_m": pos_loc,
                        "bbox_world": [min_x, min_y, min_z, max_x, max_y, max_z],
                        "largo_mm": round(sz[0] * 1000.0, 1),
                        "ancho_mm": round(sz[2] * 1000.0, 1),
                        "espesor_mm": round(sz[1] * 1000.0, 1),
                    })
            
            # Si no hay mallas pero hay despiece o parámetros, crear tablero base sintético
            if not tableros:
                desp = resultado.get("despiece", [])
                p0 = desp[0] if desp else None
                largo_m = (p0.get("largo", 498.0) if p0 else 0.498) / 1000.0
                ancho_m = (p0.get("ancho", 480.0) if p0 else 0.480) / 1000.0
                esp_m = 0.015
                
                min_x = pos_inst[0] - (largo_m / 2.0)
                max_x = pos_inst[0] + (largo_m / 2.0)
                min_y = pos_inst[1] - (esp_m / 2.0)
                max_y = pos_inst[1] + (esp_m / 2.0)
                min_z = pos_inst[2] - (ancho_m / 2.0)
                max_z = pos_inst[2] + (ancho_m / 2.0)
                
                tableros.append({
                    "name": inst_nombre,
                    "size_m": [largo_m, esp_m, ancho_m],
                    "pos_local_m": [0, 0, 0],
                    "bbox_world": [min_x, min_y, min_z, max_x, max_y, max_z],
                    "largo_mm": round(largo_m * 1000.0, 1),
                    "ancho_mm": round(ancho_m * 1000.0, 1),
                    "espesor_mm": 15.0,
                })
            
            # Recolectar perforaciones analíticas NURBS de esta instancia
            perforaciones = resultado.get("perforaciones_nurbs", [])
            
            # Si no hay perforaciones explícitas en el JSON, buscar si hay herrajes para deducir perforaciones
            if not perforaciones and resultado.get("herrajes"):
                for h in resultado.get("herrajes", []):
                    h_nombre = h.get("nombre", "").lower()
                    cant = h.get("cantidad", 0)
                    tipo_h = "caja_d15" if "minifix" in h_nombre else ("tarugo_d8" if "tarugo" in h_nombre else "guia_d5")
                    diam_h = 15.0 if "minifix" in h_nombre else (8.0 if "tarugo" in h_nombre else 5.0)
                    
                    # Generar perforaciones en cantos
                    largo_tab = tableros[0]["largo_mm"] / 1000.0 if tableros else 0.5
                    ancho_tab = tableros[0]["ancho_mm"] / 1000.0 if tableros else 0.48
                    
                    for i in range(cant):
                        y_offset = (ancho_tab / 2.0 - 0.037) if i % 2 == 0 else (-ancho_tab / 2.0 + 0.037)
                        x_offset = (-largo_tab / 2.0) if i < (cant // 2) else (largo_tab / 2.0)
                        
                        perforaciones.append({
                            "name": f"Perforacion {h.get('nombre', 'Herraje')} {i+1}",
                            "size_mm": [diam_h, diam_h, 30.0],
                            "center_local_m": [x_offset, 0.0, y_offset],
                            "diametro_mm": diam_h,
                            "profundidad_mm": 30.0 if diam_h == 8.0 else 12.0,
                            "eje_principal": "X",
                            "tipo": tipo_h
                        })

            instancias_procesadas.append({
                "id": inst_id,
                "nombre": inst_nombre,
                "pos_m": pos_inst,
                "tableros": tableros,
                "perforaciones": perforaciones
            })

        # Evaluar cruces espaciales inter-componentes
        for inst_receptora in instancias_procesadas:
            rec_id = inst_receptora["id"]
            mecanizados_por_instancia[rec_id] = []
            centros_vistos_rec = set()
            
            for tablero in inst_receptora["tableros"]:
                b_min_x, b_min_y, b_min_z, b_max_x, b_max_y, b_max_z = tablero["bbox_world"]
                tab_nombre = tablero["name"]
                
                # Margen de tolerancia de contacto (25mm)
                tol = 0.025
                
                for inst_emisora in instancias_procesadas:
                    if inst_emisora["id"] == rec_id:
                        continue # Solo perforaciones inter-componentes
                    
                    em_pos = inst_emisora["pos_m"]
                    for perf in inst_emisora["perforaciones"]:
                        p_center_loc = perf.get("center_local_m", [0, 0, 0])
                        # Posición mundial del cilindro
                        pw_x = em_pos[0] + p_center_loc[0]
                        pw_y = em_pos[1] + p_center_loc[1]
                        pw_z = em_pos[2] + p_center_loc[2]
                        
                        # Test de proximidad e intersección
                        if (b_min_x - tol <= pw_x <= b_max_x + tol and
                            b_min_y - tol <= pw_y <= b_max_y + tol and
                            b_min_z - tol <= pw_z <= b_max_z + tol):
                            
                            diam = perf.get("diametro_mm", 5.0)
                            prof = perf.get("profundidad_mm", 12.0)
                            tipo = perf.get("tipo", "guia_d5")
                            
                            # Coordenadas locales en milímetros respecto al centro de corte del tablero
                            u_mm = round((pw_x - (b_min_x + b_max_x) / 2.0) * 1000.0, 1)
                            v_mm = round((pw_z - (b_min_z + b_max_z) / 2.0) * 1000.0, 1)
                            
                            # Determinar cara y proyección según cercanía a cantos
                            dist_izq = abs(pw_x - b_min_x)
                            dist_der = abs(pw_x - b_max_x)
                            dist_inf = abs(pw_z - b_min_z)
                            dist_sup_z = abs(pw_z - b_max_z)
                            
                            # Si está en el borde lateral/frontal/posterior (a menos de 25mm del canto)
                            if dist_izq <= 0.025:
                                cara = "canto_izq"
                                capa_dxf = f"TCHW1B8D{int(prof*100):04d}" if diam >= 7.0 else f"TCHW1B2D{int(prof*100):04d}"
                            elif dist_der <= 0.025:
                                cara = "canto_der"
                                capa_dxf = f"TCHW3B8D{int(prof*100):04d}" if diam >= 7.0 else f"TCHW3B2D{int(prof*100):04d}"
                            elif dist_inf <= 0.025:
                                cara = "canto_inf"
                                capa_dxf = f"TCHW2B8D{int(prof*100):04d}" if diam >= 7.0 else f"TCHW2B2D{int(prof*100):04d}"
                            elif dist_sup_z <= 0.025:
                                cara = "canto_sup"
                                capa_dxf = f"TCHW4B8D{int(prof*100):04d}" if diam >= 7.0 else f"TCHW4B2D{int(prof*100):04d}"
                            else:
                                cara = "cara_superior"
                                capa_dxf = f"TCHW0B15D{int(prof*100):04d}" if diam >= 14.0 else (f"TCHW0B2D{int(prof*100):04d}" if diam <= 6.0 else f"TCHW0B8D{int(prof*100):04d}")
                            
                            # Deduplicar perforaciones en la misma posición geométrica
                            geo_key = (round(u_mm / 4.0) * 4, round(v_mm / 4.0) * 4, cara)
                            if geo_key in centros_vistos_rec:
                                continue
                            centros_vistos_rec.add(geo_key)
                            
                            mecanizado_item = {
                                "origen_instancia_id": inst_emisora["id"],
                                "origen_instancia_nombre": inst_emisora["nombre"],
                                "nombre_perforacion": perf.get("name", "Perforación"),
                                "tablero_destino": tab_nombre,
                                "tipo": tipo,
                                "diametro_mm": diam,
                                "profundidad_mm": prof,
                                "cara": cara,
                                "capa_dxf": capa_dxf,
                                "u_mm": u_mm,
                                "v_mm": v_mm,
                                "pos_mundial_m": [round(pw_x, 4), round(pw_y, 4), round(pw_z, 4)]
                            }
                            
                            mecanizados_por_instancia[rec_id].append(mecanizado_item)
                            total_perforaciones += 1
            
            if len(mecanizados_por_instancia[rec_id]) > 0:
                mensajes_resumen.append(f"✓ {len(mecanizados_por_instancia[rec_id])} perforación(es) transferidas a '{inst_receptora['nombre']}'")

        if total_perforaciones == 0:
            mensajes_resumen.append("No se detectaron contactos o intersecciones entre los componentes actuales.")

        return {
            "status": "success",
            "total_perforaciones": total_perforaciones,
            "mecanizados_cruzados": mecanizados_por_instancia,
            "resumen": mensajes_resumen
        }
    except Exception as e:
        print(f"[3BF Worker Mecanizado Error]: {e}", flush=True)
        return {
            "status": "error", 
            "message": str(e), 
            "total_perforaciones": 0, 
            "mecanizados_cruzados": {}, 
            "resumen": [f"Error: {e}"]
        }


# =============================================================================
# 📐 ENDPOINT DE EXPORTACIÓN CAM DXF PARA SECCIONADORA / CENTRO BIESSE SKIPPER
# =============================================================================
@app.post("/export-dxf")
async def export_dxf_biesse(request: Request):
    try:
        import io
        import ezdxf
        
        data = await request.json()
        model_id = data.get("model_id", "Cubierta")
        params = data.get("parameters", {})
        despiece = data.get("despiece", [])
        version = data.get("version", "BD 1.0")

        # Seleccionar la pieza principal a mecanizar
        if data.get("pieza"):
            pieza = data.get("pieza")
        elif despiece and len(despiece) > 0:
            pieza = despiece[0]
        else:
            ancho_p = float(params.get("RH_IN:01.1 Ancho", params.get("ancho", 498.0)))
            prof_p = float(params.get("RH_IN:01.2 Profundidad", params.get("profundidad", 480.0)))
            pieza = {
                "nombre": model_id,
                "largo": ancho_p,
                "ancho": prof_p,
                "espesor": 15.0
            }

        nombre = pieza.get("descripcion") or pieza.get("nombre", model_id)
        descripcion = pieza.get("descripcion", nombre)
        largo = float(pieza.get("largo", 498.0))
        ancho = float(pieza.get("ancho", 480.0))
        espesor = float(pieza.get("espesor", 15.0))
        es_entrepanio = "entrepaño" in nombre.lower() or "entrepanio" in nombre.lower() or "entrepaño" in descripcion.lower() or "entrepanio" in descripcion.lower()

        # Crear documento DXF con versión AC1021 (AutoCAD 2007, estándar oficial Biesse)
        doc = ezdxf.new(dxfversion="AC1021")
        msp = doc.modelspace()

        # Profundidad de corte en centésimas de milímetro (ej: 15.0mm -> D1500)
        prof_corte_tag = f"D{int(espesor * 100):04d}"
        capa_contorno = f"TCHW0B8{prof_corte_tag}"

        # Registrar capas CAM estándar Biesse Skipper
        doc.layers.new(name=capa_contorno, dxfattribs={"color": 18})
        doc.layers.new(name="TCHW1B8", dxfattribs={"color": 18})       # Canto Izquierdo (W1)
        doc.layers.new(name="TCHW2B8", dxfattribs={"color": 18})       # Canto Inferior / Trasero (W2)
        doc.layers.new(name="TCHW3B8", dxfattribs={"color": 18})       # Canto Derecho (W3)
        doc.layers.new(name="TCHW4B8", dxfattribs={"color": 18})       # Canto Superior / Frontal (W4)
        doc.layers.new(name="TCHW0B2D1200", dxfattribs={"color": 18})  # Taladros Ø5mm Cara Superior a 12mm
        doc.layers.new(name="TCHW0B15D1350", dxfattribs={"color": 18}) # Cajas Minifix Ø15mm a 13.5mm
        doc.layers.new(name="TCHW1B8D2500", dxfattribs={"color": 18})  # Perforación Canto Izquierdo Ø8mm a 25mm
        doc.layers.new(name="TCHW3B8D2500", dxfattribs={"color": 18})  # Perforación Canto Derecho Ø8mm a 25mm

        # Geometría de la Pieza Central (Cara Superior W0)
        hx = largo / 2.0
        hy = ancho / 2.0
        gap = 20.0  # Separación estándar ortogonal entre la pieza central y las vistas de cantos

        # 1. Contorno de Pieza Central (Cara Superior W0)
        puntos_central = [
            (-hx, -hy),
            (hx, -hy),
            (hx, hy),
            (-hx, hy)
        ]
        msp.add_lwpolyline(puntos_central, close=True, dxfattribs={"layer": capa_contorno})

        # 2. Vistas Desplegadas de los 4 Cantos (W1: Izq, W2: Inf, W3: Der, W4: Sup)
        # Canto Izquierdo (W1) - Vista Lateral Izquierda
        puntos_canto_izq = [
            (-hx - gap, -hy),
            (-hx - gap, hy),
            (-hx - gap - espesor, hy),
            (-hx - gap - espesor, -hy)
        ]
        msp.add_lwpolyline(puntos_canto_izq, close=True, dxfattribs={"layer": "TCHW1B8"})

        # Canto Derecho (W3) - Vista Lateral Derecha
        puntos_canto_der = [
            (hx + gap, -hy),
            (hx + gap, hy),
            (hx + gap + espesor, hy),
            (hx + gap + espesor, -hy)
        ]
        msp.add_lwpolyline(puntos_canto_der, close=True, dxfattribs={"layer": "TCHW3B8"})

        # Canto Superior (W4) - Vista Frontal / Superior
        puntos_canto_sup = [
            (-hx, hy + gap),
            (hx, hy + gap),
            (hx, hy + gap + espesor),
            (-hx, hy + gap + espesor)
        ]
        msp.add_lwpolyline(puntos_canto_sup, close=True, dxfattribs={"layer": "TCHW4B8"})

        # Canto Inferior (W2) - Vista Posterior / Inferior
        puntos_canto_inf = [
            (-hx, -hy - gap),
            (hx, -hy - gap),
            (hx, -hy - gap - espesor),
            (-hx, -hy - gap - espesor)
        ]
        msp.add_lwpolyline(puntos_canto_inf, close=True, dxfattribs={"layer": "TCHW2B8"})

        # 3. Incorporar perforaciones analíticas OpenNURBS de la propia pieza (Tornillos, Tarugos, Minifix, Guías)
        raw_perfs = data.get("perforaciones_nurbs") or pieza.get("perforaciones_nurbs") or []
        boolean_perfs = [p for p in raw_perfs if "nurbs" in p.get("name", "").lower() or "perforad" in p.get("name", "").lower() or "mecanizad" in p.get("name", "").lower()]
        perforaciones_propias = boolean_perfs if boolean_perfs else raw_perfs
        centros_vistos = set()
        perforaciones_dibujadas = 0

        for p_item in perforaciones_propias:
            if "center_cad_mm" in p_item:
                cx, cy, cz = p_item["center_cad_mm"]
                ux = round(cx - (largo / 2.0), 1)
                vy = round(cy - (ancho / 2.0), 1)
            elif "center_local_m" in p_item:
                ux = round(p_item["center_local_m"][0] * 1000.0, 1)
                vy = round(-p_item["center_local_m"][2] * 1000.0, 1)
            else:
                continue

            diam = float(p_item.get("diametro_mm", 8.0))
            prof = float(p_item.get("profundidad_mm", 25.0))
            
            c_key = (round(ux, 0), round(vy, 0), round(diam, 0))
            if c_key in centros_vistos:
                continue
            centros_vistos.add(c_key)

            if ux <= -hx + 25.0:
                # Canto Izquierdo (W1)
                x_pos = -hx - gap - (espesor / 2.0)
                capa = f"TCHW1B8D{int(prof*100):04d}" if diam >= 7.0 else f"TCHW1B2D{int(prof*100):04d}"
                if capa not in doc.layers: doc.layers.new(name=capa, dxfattribs={"color": 18})
                msp.add_circle((x_pos, vy), radius=(diam / 2.0), dxfattribs={"layer": capa})
                perforaciones_dibujadas += 1
            elif ux >= hx - 25.0:
                # Canto Derecho (W3)
                x_pos = hx + gap + (espesor / 2.0)
                capa = f"TCHW3B8D{int(prof*100):04d}" if diam >= 7.0 else f"TCHW3B2D{int(prof*100):04d}"
                if capa not in doc.layers: doc.layers.new(name=capa, dxfattribs={"color": 18})
                msp.add_circle((x_pos, vy), radius=(diam / 2.0), dxfattribs={"layer": capa})
                perforaciones_dibujadas += 1
            elif diam >= 14.0:
                # Cajas Minifix en Cara Superior (W0)
                capa = f"TCHW0B15D{int(prof*100):04d}"
                if capa not in doc.layers: doc.layers.new(name=capa, dxfattribs={"color": 18})
                msp.add_circle((ux, vy), radius=(diam / 2.0), dxfattribs={"layer": capa})
                perforaciones_dibujadas += 1
            else:
                # Perforaciones / Guías en Cara Superior (W0)
                capa = f"TCHW0B2D{int(prof*100):04d}" if diam <= 6.0 else f"TCHW0B8D{int(prof*100):04d}"
                if capa not in doc.layers: doc.layers.new(name=capa, dxfattribs={"color": 18})
                msp.add_circle((ux, vy), radius=(diam / 2.0), dxfattribs={"layer": capa})
                perforaciones_dibujadas += 1

        # Fallback si no vinieron perforaciones_nurbs explícitas
        if perforaciones_dibujadas == 0 and not es_entrepanio:
            union_izq = ""
            union_der = ""
            for k, v in params.items():
                kl = k.lower()
                if "union" in kl:
                    if "izq" in kl:
                        union_izq = str(v).lower()
                    elif "der" in kl:
                        union_der = str(v).lower()

            y_pos1 = hy - 48.0
            y_pos2 = -hy + 48.0
            y_pos_tornillo1 = hy - 80.0
            y_pos_tornillo2 = -hy + 80.0

            # Mecanizado Lado Izquierdo
            if "minifix" in union_izq:
                x_izq_caja = -hx + 34.0
                msp.add_circle((x_izq_caja, y_pos1), radius=7.5, dxfattribs={"layer": "TCHW0B15D1350"})
                msp.add_circle((x_izq_caja, y_pos2), radius=7.5, dxfattribs={"layer": "TCHW0B15D1350"})
                x_canto_izq_centro = -hx - gap - (espesor / 2.0)
                msp.add_circle((x_canto_izq_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
                msp.add_circle((x_canto_izq_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
            elif "tarugo" in union_izq and "tornillo" in union_izq:
                x_canto_izq_centro = -hx - gap - (espesor / 2.0)
                # 2 Tarugos Ø8mm
                msp.add_circle((x_canto_izq_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
                msp.add_circle((x_canto_izq_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
                # 2 Tornillos Ø5mm
                msp.add_circle((x_canto_izq_centro, y_pos_tornillo1), radius=2.5, dxfattribs={"layer": "TCHW1B2D3500"})
                msp.add_circle((x_canto_izq_centro, y_pos_tornillo2), radius=2.5, dxfattribs={"layer": "TCHW1B2D3500"})
            elif "tarugo" in union_izq or "tornillo" in union_izq:
                x_canto_izq_centro = -hx - gap - (espesor / 2.0)
                msp.add_circle((x_canto_izq_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
                msp.add_circle((x_canto_izq_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})

            # Mecanizado Lado Derecho
            if "minifix" in union_der:
                x_der_caja = hx - 34.0
                msp.add_circle((x_der_caja, y_pos1), radius=7.5, dxfattribs={"layer": "TCHW0B15D1350"})
                msp.add_circle((x_der_caja, y_pos2), radius=7.5, dxfattribs={"layer": "TCHW0B15D1350"})
                x_canto_der_centro = hx + gap + (espesor / 2.0)
                msp.add_circle((x_canto_der_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
                msp.add_circle((x_canto_der_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
            elif "tarugo" in union_der and "tornillo" in union_der:
                x_canto_der_centro = hx + gap + (espesor / 2.0)
                # 2 Tarugos Ø8mm
                msp.add_circle((x_canto_der_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
                msp.add_circle((x_canto_der_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
                # 2 Tornillos Ø5mm
                msp.add_circle((x_canto_der_centro, y_pos_tornillo1), radius=2.5, dxfattribs={"layer": "TCHW3B2D3500"})
                msp.add_circle((x_canto_der_centro, y_pos_tornillo2), radius=2.5, dxfattribs={"layer": "TCHW3B2D3500"})
            elif "tarugo" in union_der or "tornillo" in union_der:
                x_canto_der_centro = hx + gap + (espesor / 2.0)
                msp.add_circle((x_canto_der_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
                msp.add_circle((x_canto_der_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})

        # 3. Incorporar mecanizados cruzados inter-componentes en el DXF
        mecanizados_cruzados = data.get("mecanizados_cruzados", [])
        for mec in mecanizados_cruzados:
            u_x = float(mec.get("u_mm", 0.0))
            v_y = float(mec.get("v_mm", 0.0))
            diam = float(mec.get("diametro_mm", 5.0))
            capa = mec.get("capa_dxf", "TCHW0B2D1200")
            cara = mec.get("cara", "cara_superior")
            
            if capa not in doc.layers:
                doc.layers.new(name=capa, dxfattribs={"color": 18})
                
            # Clasificar y colocar estrictamente en el canto correspondiente o en el interior del tablero (cero círculos flotantes)
            if cara == "canto_izq" or u_x <= -hx + 20.0:
                x_pos = -hx - gap - (espesor / 2.0)
                msp.add_circle((x_pos, v_y), radius=(diam / 2.0), dxfattribs={"layer": capa})
            elif cara == "canto_der" or u_x >= hx - 20.0:
                x_pos = hx + gap + (espesor / 2.0)
                msp.add_circle((x_pos, v_y), radius=(diam / 2.0), dxfattribs={"layer": capa})
            elif cara == "canto_inf" or v_y <= -hy + 20.0:
                y_pos = -hy - gap - (espesor / 2.0)
                msp.add_circle((u_x, y_pos), radius=(diam / 2.0), dxfattribs={"layer": capa})
            elif cara == "canto_sup" or v_y >= hy - 20.0:
                y_pos = hy + gap + (espesor / 2.0)
                msp.add_circle((u_x, y_pos), radius=(diam / 2.0), dxfattribs={"layer": capa})
            else:
                # Cara Superior W0: Solo si se encuentra rigurosamente dentro del perímetro
                if abs(u_x) <= (hx - 2.0) and abs(v_y) <= (hy - 2.0):
                    msp.add_circle((u_x, v_y), radius=(diam / 2.0), dxfattribs={"layer": capa})

        # Serializar DXF a texto
        stream = io.StringIO()
        doc.write(stream)
        dxf_content = stream.getvalue()

        version_clean = version.replace(" ", "")
        filename = f"{nombre}_{int(largo)}x{int(ancho)}_{int(espesor)}mm_{version_clean}.dxf"

        return {
            "status": "success",
            "filename": filename,
            "dxf_content": dxf_content,
            "machine_profile": "Biesse Skipper (bSolid/BiesseWorks)",
            "dimensions": f"{largo} x {ancho} x {espesor} mm"
        }
    except Exception as e:
        print(f"[3BF Worker DXF Error]: {e}", flush=True)
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    print("[3BF Worker] Arrancando 3BF Worker Python Engine en puerto 8005...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=8005)
