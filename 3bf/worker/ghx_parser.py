"""
============================================================================
ARCHIVO: ghx_parser.py
UBICACIÓN: c:/Desarrollo/mmapp/3bf/worker/ghx_parser.py
DESCRIPCIÓN:
Módulo de parseo XML de definiciones Grasshopper (.ghx), extracción de límites
de sliders, ValueLists, grupos de parámetros DfMA y resolución de valores de
parámetros de usuario para 3dBimFab.
============================================================================
"""

import os
import re
import xml.etree.ElementTree as ET

_SLIDER_LIMITS_CACHE = {}


def parse_ghx_slider_limits(ghx_path: str) -> dict:
    if not ghx_path or not os.path.exists(ghx_path):
        return {}

    try:
        cur_mtime = os.path.getmtime(ghx_path)
        if ghx_path in _SLIDER_LIMITS_CACHE:
            cached_mtime, cached_limits = _SLIDER_LIMITS_CACHE[ghx_path]
            if cached_mtime == cur_mtime:
                return cached_limits
    except Exception:
        cur_mtime = 0

    limits = {}
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

    if cur_mtime > 0:
        _SLIDER_LIMITS_CACHE[ghx_path] = (cur_mtime, limits)
    return limits


def parse_ghx_default_values(ghx_path: str) -> dict:
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
                                except Exception:
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
    # 1. Coincidencia exacta (ej. "RH_IN:08.1 Lado balance")
    if nick in combined and combined[nick] is not None:
        return combined[nick]

    # 2. Coincidencia normalizada conservando el identificador numérico (ej. "08.1_lado_balance")
    clean_with_num = nick.replace("RH_IN:", "").strip().lower().replace(' ', '_')
    if clean_with_num in combined and combined[clean_with_num] is not None:
        return combined[clean_with_num]

    # 🌟 PARÁMETROS GLOBALES ESTRUCTURALES (Ancho, Alto, Profundidad, Zócalo, Ritmo, Apertura):
    nick_lower = nick.lower()
    is_global_structural = any(w in nick_lower for w in ["ancho", "alto", "altura", "profundidad", "prof", "zocalo", "ritmo", "apertur"])
    if is_global_structural:
        pure_name = re.sub(r'^RH_IN:\s*', '', nick, flags=re.I)
        pure_name = re.sub(r'^[\d.]+[_\s]*', '', pure_name).strip().lower().replace(' ', '_')
        if pure_name in combined and combined[pure_name] is not None:
            return combined[pure_name]
        for k, v in combined.items():
            if not isinstance(k, str) or v is None or k == "parameters":
                continue
            k_pure = re.sub(r'^RH_IN:\s*', '', k, flags=re.I)
            k_pure = re.sub(r'^[\d.]+[_\s]*', '', k_pure).strip().lower().replace(' ', '_')
            if pure_name and k_pure == pure_name:
                return v

    # Verificar si el parámetro pertenece a una pieza numerada específica (ej. "08.1", "11.1", "Peça 8")
    num_match = re.search(r'(\d+[\.\d]*)', nick)
    if num_match and not is_global_structural:
        piece_id = num_match.group(1).lower()
        for k, v in combined.items():
            if not isinstance(k, str) or v is None or k == "parameters":
                continue
            k_lower = k.lower()
            if piece_id in k_lower:
                clean_k = k.replace("RH_IN:", "").strip().lower().replace(' ', '_')
                if clean_k == clean_with_num:
                    return v
        return default_val

    # 3. Solo para parámetros globales sin número de pieza (ej. Ancho, Alto, Profundidad, Apertura)
    clean_target = re.sub(r'^RH_IN:\s*', '', nick).strip().lower().replace(' ', '_')
    if clean_target in combined and combined[clean_target] is not None:
        return combined[clean_target]

    for k, v in combined.items():
        if not isinstance(k, str) or v is None or k == "parameters":
            continue
        clean_k = re.sub(r'^RH_IN:\s*', '', k).strip().lower().replace(' ', '_')
        if clean_k == clean_target:
            return v

    return default_val


def extract_parameter_groups(root, default_values: dict) -> list:
    rh_inputs = list(default_values.keys())

    # 1. Mapear TODOS los GUIDs de componentes reales a su NickName RH_IN:
    guid_to_nick = {}
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            name_item = chunk.find("items/item[@name='Name']")
            comp_name = str(name_item.text) if name_item is not None else ""
            if comp_name == "Group":
                continue
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

    for sdir in search_dirs:
        if not os.path.exists(sdir):
            continue
        for root_dir, _, files in os.walk(sdir):
            for f in files:
                f_lower = f.lower()
                for target in exact_targets:
                    if f_lower == target or f_lower == f"{target}.ghx":
                        return os.path.join(root_dir, f)

    fallbacks = ["cubierta.ghx", "cajon_experimento_3dbimfab.ghx"]
    for sdir in search_dirs:
        if not os.path.exists(sdir):
            continue
        for root_dir, _, files in os.walk(sdir):
            for f in files:
                if f.lower() in fallbacks:
                    return os.path.join(root_dir, f)
    return ""


def is_structural_param_name(k: str) -> bool:
    kl = str(k).lower()
    if any(w in kl for w in ["canto", "balance", "lado", "color", "sustrato", "mapeado", "borde", "textura", "acabado"]):
        return False
    return any(w in kl for w in [
        "ancho", "largura", "width",
        "alto", "altura", "height",
        "profundidad", "profundidade", "depth",
        "zocalo", "rodapé", "rodape",
        "ritmo",
        "posicion pata", "posiçao pé", "posicao pe",
        "abrir", "apertura", "abertura",
        "cant_cajones", "cajon", "cajones", "gaveta", "gavetas",
        "espessor", "espesor", "thickness"
    ])


def extract_ghx_aesthetic_mapping(ghx_path: str) -> dict:
    mapping = {}
    if not os.path.exists(ghx_path):
        return mapping
    try:
        tree = ET.parse(ghx_path)
        root = tree.getroot()
        guid_to_nick = {}
        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                container = chunk.find("chunks/chunk[@name='Container']")
                if container is not None:
                    nick = container.find("items/item[@name='NickName']")
                    if nick is not None and nick.text and nick.text.startswith("RH_IN:"):
                        for item in chunk.iter("item"):
                            if item.text and len(item.text) == 36 and item.text.count("-") == 4:
                                guid_to_nick[item.text] = nick.text

        gh_group_titles = {}
        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                name_item = chunk.find("items/item[@name='Name']")
                if name_item is not None and "Group" in str(name_item.text):
                    container = chunk.find("chunks/chunk[@name='Container']")
                    if container is not None:
                        g_nick = container.find("items/item[@name='NickName']")
                        g_title = g_nick.text if g_nick is not None and g_nick.text else ""
                        for item in container.iter("item"):
                            if item.text in guid_to_nick:
                                gh_group_titles[guid_to_nick[item.text]] = g_title

        for nick, g_title in gh_group_titles.items():
            match = re.search(r'Pe[çc\ufffd\?a]*\s+(\d+)', g_title, re.IGNORECASE) or re.search(r'Pe[çc\ufffd\?a]*\s+(\d+)', nick, re.IGNORECASE)
            if not match:
                continue
            p_num = int(match.group(1))
            nl = nick.lower()
            if "balance" in nl:
                mapping[nick] = (p_num, "balance")
            elif "frontal" in nl:
                mapping[nick] = (p_num, "canto_1")
            elif "trasero" in nl:
                mapping[nick] = (p_num, "canto_2")
            elif any(w in nl for w in ["izquierdo", "arriba", "superior"]):
                mapping[nick] = (p_num, "canto_3")
            elif any(w in nl for w in ["derecho", "abajo", "inferior"]):
                mapping[nick] = (p_num, "canto_4")
            elif "lado color" in nl:
                mapping[nick] = (p_num, "fondo_color")
            elif "sustrato" in nl:
                mapping[nick] = (p_num, "fondo_sustrato")
    except Exception as e:
        print(f"[3BF Worker] Error extrayendo mapeo estético GHX: {e}", flush=True)
    return mapping


def extract_all_user_params_flat(p: dict) -> dict:
    flat = {}
    if not isinstance(p, dict):
        return flat
    for k, v in p.items():
        if k in ["parameters", "timestamp", "client_time", "last_mtime", "ghx_content"]:
            continue
        if isinstance(v, (str, int, float, bool)):
            flat[str(k)] = str(v).strip()

    sub_p = p.get("parameters") or {}
    if isinstance(sub_p, dict):
        for k, v in sub_p.items():
            if isinstance(v, (str, int, float, bool)):
                flat[str(k)] = str(v).strip()
    return flat


def extract_dimension_smart(p_dict: dict, keywords: list, fallback: float) -> float:
    flat = extract_all_user_params_flat(p_dict)
    extra_prefixes = []
    if any("ancho" in kw for kw in keywords):
        extra_prefixes.append("01.0")
    if any("alto" in kw or "altura" in kw for kw in keywords):
        extra_prefixes.append("01.1")
    if any("prof" in kw for kw in keywords):
        extra_prefixes.append("01.2")

    for k, v in flat.items():
        k_lower = k.lower()
        if (any(kw in k_lower for kw in keywords) or any(pref in k_lower for pref in extra_prefixes)) and any(c.isdigit() for c in k):
            try:
                val = float(v)
                if val > 0:
                    return val
            except (ValueError, TypeError):
                pass
    for kw in keywords:
        val = find_user_param_value(p_dict, f"RH_IN:{kw.capitalize()}", find_user_param_value(p_dict, kw, None))
        if val is not None:
            try:
                f_val = float(val)
                if f_val > 0:
                    return f_val
            except (ValueError, TypeError):
                pass
    return float(fallback)
