"""
============================================================================
ARCHIVO: bom_engine.py
UBICACIÓN: c:/Desarrollo/mmapp/3bf/worker/bom_engine.py
DESCRIPCIÓN:
Motor DfMA de Despiece (BOM), consolidación espacial coplanar de tableros,
filtrado de tiras de canto/chaflán, detección positiva de herrajes y cálculo
de costos para 3dBimFab.
============================================================================
"""

import json
import math
import re
from ghx_parser import find_user_param_value


def es_nombre_herraje(name_str: str, size: list = None) -> bool:
    nl = name_str.lower()
    if "maquinado" in nl or "perforad" in nl or "mdp" in nl or "balance" in nl:
        return False
    if re.search(r'[\s_]b$', nl):
        return False

    herrajes_keywords = [
        "tarugo", "cavilha", "tornillo", "parafuso", "minifix", "corredera", "corredi",
        "bisagra", "dobradi", "sapata", "pata", "pé", "perno", "puxador", "tirador",
        "manija", "cantoneira", "cantonera", "prego", "clavo", "tampa", "tapa adhesiva",
        "angulo", "escuadra", "soporte", "suporte", "porca", "tuerca"
    ]
    if any(k in nl for k in herrajes_keywords):
        if not any(t in nl for t in ["frente", "lateral", "cubierta", "repisa", "costado", "divis", "zocalo", "fondo", "posterior", "traser", "gaveta", "peça", "peca", "pk"]):
            return True

    if size and len(size) == 3:
        dims_mm = sorted([abs(size[0]) * 1000.0, abs(size[1]) * 1000.0, abs(size[2]) * 1000.0])
        if dims_mm[2] < 40.0 and dims_mm[0] >= 1.5:
            return True

    return False


def es_nombre_tablero(name_str: str, size: list = None) -> bool:
    nl = name_str.lower()
    if "maquinado" in nl or "perforad" in nl or "mdp" in nl or "mdf" in nl or "balance" in nl:
        return False
    if re.search(r'[\s_]b$', nl):
        return False
    if es_nombre_herraje(name_str, size):
        return False
    if size and len(size) == 3:
        dims_mm = sorted([abs(size[0]) * 1000.0, abs(size[1]) * 1000.0, abs(size[2]) * 1000.0])
        if dims_mm[2] >= 40.0 and dims_mm[1] >= 2.0:
            return True
    return True


def _norm_clave_pieza(clave: str) -> str:
    k = clave.strip().lower()
    k = re.sub(r'pe[çc]a\s*(\d+)', r'peca_\1', k)
    k = re.sub(r'pk\s*(\d+)', r'peca_\1', k)
    return k


def calcular_bom_y_despiece(
    real_meshes: list,
    root,
    text_outputs: dict,
    ghx_file: str,
    p: dict,
    model_id: str,
    custom_filename: str,
    cant_cajones: int,
    tipo_cajon_param: str,
    ancho: float,
    prof: float
) -> tuple[list, list, dict]:
    """
    Calcula el listado de herrajes, el despiece consolidado de tableros de madera
    y el resumen de área/costos DfMA a partir de la geometría 3D evaluada.
    """
    conteo_mallas_herrajes = {}
    for m in real_meshes:
        if m.get("es_duplicado_ghx"):
            continue
        raw_name = m.get("name", "").strip()
        if es_nombre_herraje(raw_name, m.get("size")):
            nombre_herraje_ghx = raw_name.replace("RH_OUT:", "").strip()
            if nombre_herraje_ghx:
                conteo_mallas_herrajes[nombre_herraje_ghx] = conteo_mallas_herrajes.get(nombre_herraje_ghx, 0) + 1

    herrajes_final = []
    costo_herrajes_calc = 0.0

    for nombre_ghx, m_count in conteo_mallas_herrajes.items():
        nh_l = nombre_ghx.lower()
        if "corredi" in nh_l or "corredera" in nh_l:
            mallas_por_herraje = 7
            unidad_str = "pares"
            costo_unit = 8.22
        elif "perno" in nh_l or "bisagra" in nh_l or "dobradi" in nh_l:
            mallas_por_herraje = 2
            unidad_str = "piezas"
            costo_unit = 0.28 if "perno" in nh_l else 1.20
        else:
            mallas_por_herraje = 1
            unidad_str = "piezas"
            costo_unit = 0.08
        cant_real = math.ceil(m_count / mallas_por_herraje)

        if "pes" in nh_l or "pata" in nh_l or "pie" in nh_l or "sapata" in nh_l:
            costo_unit = 0.85
            unidad_str = "piezas"
        elif "caja" in nh_l or "minifix" in nh_l:
            costo_unit = 0.35
            unidad_str = "piezas"
        elif "perno" in nh_l:
            costo_unit = 0.28
            unidad_str = "piezas"
        elif "corredi" in nh_l or "corredera" in nh_l:
            pass
        elif "bisagra" in nh_l or "dobradi" in nh_l:
            costo_unit = 1.20
            unidad_str = "piezas"
        elif "cantoneira" in nh_l or "angulo" in nh_l or "escuadra" in nh_l:
            costo_unit = 0.15
            unidad_str = "piezas"
        elif "cavilha" in nh_l or "tarugo" in nh_l:
            costo_unit = 0.03
            unidad_str = "piezas"
        elif "parafuso" in nh_l or "tornillo" in nh_l:
            costo_unit = 0.05
            unidad_str = "piezas"
        elif "puxador" in nh_l or "tirador" in nh_l or "manija" in nh_l:
            costo_unit = 1.50
            unidad_str = "piezas"

        costo_herrajes_calc += cant_real * costo_unit
        herrajes_final.append({
            "nombre": nombre_ghx,
            "cantidad": cant_real,
            "mallas_count": m_count,
            "unidad": unidad_str
        })

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

    mapa_descripciones_ghx = {}
    if root is not None:
        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                c = chunk.find("chunks/chunk[@name='Container']")
                if c is not None:
                    nick_item = c.find("items/item[@name='NickName']")
                    nick_t = (nick_item.text or "").strip() if nick_item is not None else ""
                    if any(w in nick_t.lower() for w in ["descrip", "bom", "nombres"]):
                        user_text_item = c.find("items/item[@name='UserText']")
                        if user_text_item is not None and user_text_item.text:
                            text_outputs[nick_t] = user_text_item.text.strip()

    for k_out, v_out in text_outputs.items():
        k_lower = k_out.lower()
        if any(w in k_lower for w in ["descrip", "bom", "nombres", "piezas_nombres"]):
            texto_raw = str(v_out).strip()
            if texto_raw.startswith("{"):
                try:
                    parsed_json = json.loads(texto_raw)
                    if isinstance(parsed_json, dict):
                        for pk, pv in parsed_json.items():
                            mapa_descripciones_ghx[_norm_clave_pieza(pk)] = str(pv).strip()
                except Exception:
                    pass
            else:
                for line in texto_raw.splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    if "=" in line:
                        pk, pv = line.split("=", 1)
                        mapa_descripciones_ghx[_norm_clave_pieza(pk)] = pv.strip()
                    elif ":" in line:
                        pk, pv = line.split(":", 1)
                        mapa_descripciones_ghx[_norm_clave_pieza(pk)] = pv.strip()
                    else:
                        match_sp = re.match(r'^(pe[çc]a\s*\d+|pk\s*\d+)\s+(.+)$', line, flags=re.IGNORECASE)
                        if match_sp:
                            pk, pv = match_sp.group(1), match_sp.group(2)
                            mapa_descripciones_ghx[_norm_clave_pieza(pk)] = pv.strip()

    def _extraer_nombre_y_desc_pieza(m_item):
        desc_ext = ""
        custom_n = None
        for k_out, v_out in text_outputs.items():
            if any(k in k_out.lower() for k in ["nombre", "pieza", "piecename"]):
                custom_n = v_out
                break
        if custom_n:
            nom_limpio = custom_n
        else:
            raw_m_name = m_item.get("name", "").replace("RH_OUT:", "").strip()
            nombre_temp = raw_m_name
            for prefix in ["MDF ", "MDP ", "Color ", "Balance ", "Nurbs ", "Brep ", "MDF", "MDP", "Color", "Balance"]:
                if nombre_temp.upper().startswith(prefix.upper()):
                    nombre_temp = nombre_temp[len(prefix):].strip()

            if " - " in nombre_temp:
                partes = nombre_temp.split(" - ", 1)
                nombre_temp, desc_ext = partes[0].strip(), partes[1].strip()
            elif " : " in nombre_temp or (":" in nombre_temp and not nombre_temp.startswith("RH_OUT")):
                partes = nombre_temp.split(":", 1)
                nombre_temp, desc_ext = partes[0].strip(), partes[1].strip()
            elif "(" in nombre_temp and nombre_temp.endswith(")"):
                partes = nombre_temp.split("(", 1)
                nombre_temp = partes[0].strip()
                desc_ext = partes[1].rstrip(")").strip()

            match_peca = re.search(r'pe[çc]a\s*(\d+)', nombre_temp, flags=re.IGNORECASE)
            if match_peca:
                nom_limpio = f"Peça {match_peca.group(1)}"
            else:
                match_pk = re.search(r'pk\s*(\d+)', nombre_temp, flags=re.IGNORECASE)
                if match_pk:
                    nom_limpio = f"PK {match_pk.group(1)}"
                else:
                    nombre_temp = re.sub(r'[\s_]b$', '', nombre_temp, flags=re.IGNORECASE).strip()
                    nombre_temp = nombre_temp.capitalize()
                    nl_check = m_item.get("name", "").strip().lower()
                    if not nombre_temp or nombre_temp in ["Cubierta2", "Entrepaño2", "Pieza", "Mdp", "Mdf", "Tablero"]:
                        nom_limpio = "Cubierta" if "cubierta" in nl_check else ("Entrepaño" if "entrepaño" in nl_check else "Tablero")
                    else:
                        nom_limpio = nombre_temp

        c_norm = _norm_clave_pieza(nom_limpio)
        desc_fin = desc_ext or mapa_descripciones_ghx.get(c_norm, "") or mapa_descripciones_ghx.get(nom_limpio.lower(), "") or nom_limpio
        return nom_limpio, desc_fin

    # Pre-pase DfMA: Recolectar Caras A principales, Caras B (Balance) y canales MDP por familia de pieza
    caras_a_principales = {}
    caras_b_por_pieza = {}
    mapa_espesor_mdp = {}
    familia_stats = {}

    for m in real_meshes:
        if m.get("es_duplicado_ghx"):
            continue
        raw_name = m.get("name", "").strip()
        name_lower = raw_name.lower()
        size = m.get("size", [0, 0, 0])
        pos = m.get("position", [0, 0, 0])
        if "maquinado" in name_lower or "perforad" in name_lower or es_nombre_herraje(raw_name, size):
            continue

        dims_xyz = [round(size[0] * 1000.0, 1), round(size[1] * 1000.0, 1), round(size[2] * 1000.0, 1)]
        axis_order = sorted(range(3), key=lambda i: dims_xyz[i])
        ax_norm, ax_anc, ax_lar = axis_order[0], axis_order[1], axis_order[2]
        esp_m, anc_m, lar_m = dims_xyz[ax_norm], dims_xyz[ax_anc], dims_xyz[ax_lar]

        nom_limpio_pre, _ = _extraer_nombre_y_desc_pieza(m)
        key_fam = nom_limpio_pre.lower()

        if "mdp" in name_lower or "mdf" in name_lower:
            min_calibre_sustrato = 2.0 if ("mdf" in name_lower or any(w in key_fam for w in ["fondo", "fundo", "traser", "espaldar", "costa"])) else 10.0
            for d in sorted(dims_xyz):
                if min_calibre_sustrato <= d <= 36.0:
                    mapa_espesor_mdp[key_fam] = d
                    break
            continue

        if re.search(r'[\s_]b$|balance', name_lower):
            if lar_m >= 40.0 and anc_m >= 25.0:
                caras_b_por_pieza.setdefault(key_fam, []).append({
                    "pos": pos, "esp": esp_m, "anc": anc_m, "lar": lar_m,
                    "ax_norm": ax_norm, "ax_anc": ax_anc, "ax_lar": ax_lar
                })
            continue

        if lar_m >= 40.0 and anc_m >= 8.0:
            st = familia_stats.setdefault(key_fam, {"max_anc": 0.0, "min_esp": 999.0})
            st["max_anc"] = max(st["max_anc"], anc_m)
            st["min_esp"] = min(st["min_esp"], esp_m)
            if anc_m >= 30.0 and esp_m <= 1.5:
                caras_a_principales.setdefault(key_fam, []).append({
                    "pos": pos, "esp": esp_m, "anc": anc_m, "lar": lar_m,
                    "ax_norm": ax_norm, "ax_anc": ax_anc, "ax_lar": ax_lar
                })

    # Calcular espesor nominal exacto por familia midiendo separación perpendicular (eje normal) entre Cara A y Cara B
    espesor_por_familia = {}
    todas_familias = set(list(familia_stats.keys()) + list(caras_b_por_pieza.keys()) + list(mapa_espesor_mdp.keys()))
    for key_fam in todas_familias:
        if "peça 5" in key_fam or "peca 5" in key_fam or "frente" in key_fam or "peça 2" in key_fam or "peca 2" in key_fam:
            espesor_por_familia[key_fam] = 15.0
            continue
        esp_calc = None
        if key_fam in caras_a_principales and key_fam in caras_b_por_pieza:
            for ca in caras_a_principales[key_fam]:
                ax_n, ax_a, ax_l = ca["ax_norm"], ca["ax_anc"], ca["ax_lar"]
                for cb in caras_b_por_pieza[key_fam]:
                    if cb["ax_norm"] == ax_n:
                        if abs(ca["pos"][ax_l] - cb["pos"][ax_l]) * 1000.0 < 25.0 and abs(ca["pos"][ax_a] - cb["pos"][ax_a]) * 1000.0 < 85.0:
                            dist_perp = round(abs(ca["pos"][ax_n] - cb["pos"][ax_n]) * 1000.0, 1)
                            if 2.0 <= dist_perp <= 36.0:
                                esp_calc = dist_perp
                                break
                if esp_calc is not None:
                    break
        if esp_calc is None and key_fam in mapa_espesor_mdp:
            esp_calc = mapa_espesor_mdp[key_fam]
        if esp_calc is None:
            if any(w in key_fam for w in ["fondo", "fundo", "traser", "espaldar", "costa"]):
                esp_calc = 3.0
            elif any(w in key_fam for w in ["cajon", "cajón", "posterior", "gaveta"]):
                esp_calc = 12.0
            else:
                esp_calc = 15.0
        espesor_por_familia[key_fam] = esp_calc

    tableros_consolidados = []
    for m in real_meshes:
        raw_name = m.get("name", "").strip()
        name_lower = raw_name.lower()
        size = m.get("size", [0, 0, 0])
        pos = m.get("position", [0, 0, 0])

        if not es_nombre_tablero(raw_name, size):
            continue
        if "mdp" in name_lower or "mdf" in name_lower:
            continue
        if re.search(r'[\s_]b$|balance', name_lower):
            continue

        dims_xyz = [round(size[0] * 1000.0, 1), round(size[1] * 1000.0, 1), round(size[2] * 1000.0, 1)]
        axis_order = sorted(range(3), key=lambda i: dims_xyz[i])
        ax_norm, ax_anc, ax_lar = axis_order[0], axis_order[1], axis_order[2]
        esp_malla, anc_malla, lar_malla = dims_xyz[ax_norm], dims_xyz[ax_anc], dims_xyz[ax_lar]

        if lar_malla >= 40.0 and anc_malla >= 8.0:
            nombre_limpio, descripcion_final = _extraer_nombre_y_desc_pieza(m)
            key_fam = nombre_limpio.lower()
            esp_fam = espesor_por_familia.get(key_fam, 15.0)
            st_fam = familia_stats.get(key_fam, {"max_anc": anc_malla, "min_esp": esp_malla})

            # Descartar chaflanes/biseles 3D cuando la pieza es de caras planas
            if st_fam["min_esp"] <= 0.5 and st_fam["max_anc"] >= 30.0 and esp_malla > 1.5 and anc_malla < 35.0:
                continue

            # Descartar tiras de canto (anc_malla <= esp_fam + 2.0) que NO sean coplanares con una cara principal de la misma pieza
            if st_fam["max_anc"] >= 30.0 and anc_malla <= esp_fam + 2.0:
                es_ranura_coplanar = False
                for ca in caras_a_principales.get(key_fam, []):
                    if ca["ax_norm"] == ax_norm and ca["ax_lar"] == ax_lar:
                        dist_norm = abs(ca["pos"][ax_norm] - pos[ax_norm]) * 1000.0
                        dist_lar = abs(ca["pos"][ax_lar] - pos[ax_lar]) * 1000.0
                        dist_anc = abs(ca["pos"][ax_anc] - pos[ax_anc]) * 1000.0
                        diff_lar = abs(ca["lar"] - lar_malla)
                        if dist_norm < 2.0 and dist_lar < 15.0 and diff_lar < 15.0 and dist_anc < 85.0:
                            es_ranura_coplanar = True
                            break
                if not es_ranura_coplanar:
                    continue

            # COHESIÓN ESPACIAL ESTRICTA POR PIEZA Y PLANO
            encontrado = False
            for t in tableros_consolidados:
                if t["nombre"].lower() != key_fam:
                    continue
                if t.get("ax_norm") == ax_norm and t.get("ax_lar") == ax_lar:
                    dist_norm = abs(t["pos"][ax_norm] - pos[ax_norm]) * 1000.0
                    dist_lar = abs(t["pos"][ax_lar] - pos[ax_lar]) * 1000.0
                    dist_anc = abs(t["pos"][ax_anc] - pos[ax_anc]) * 1000.0
                    diff_lar = abs(t["largo"] - lar_malla)
                    if dist_norm < 2.0 and dist_lar < 15.0 and diff_lar < 15.0 and dist_anc < 85.0:
                        encontrado = True
                        w_min = min(t["pos"][ax_anc] * 1000.0 - t["ancho"] / 2.0, pos[ax_anc] * 1000.0 - anc_malla / 2.0)
                        w_max = max(t["pos"][ax_anc] * 1000.0 + t["ancho"] / 2.0, pos[ax_anc] * 1000.0 + anc_malla / 2.0)
                        t["ancho"] = round(w_max - w_min, 1)
                        t["largo"] = max(t["largo"], lar_malla)
                        t["pos"][ax_anc] = (w_min + w_max) / 2000.0
                        if descripcion_final and descripcion_final != nombre_limpio:
                            t["descripcion"] = descripcion_final
                        break

            if not encontrado:
                tableros_consolidados.append({
                    "nombre": nombre_limpio,
                    "descripcion": descripcion_final,
                    "largo": lar_malla,
                    "ancho": anc_malla,
                    "espesor": esp_fam if esp_malla <= 1.5 else esp_malla,
                    "cantidad": 1,
                    "tipo": "Estructura DfMA",
                    "pos": list(pos),
                    "ax_norm": ax_norm,
                    "ax_anc": ax_anc,
                    "ax_lar": ax_lar
                })

    if tableros_consolidados:
        piezas_consolidadas = []
        for tab in tableros_consolidados:
            encontrado = False
            for p_exist in piezas_consolidadas:
                if p_exist["nombre"].lower() == tab["nombre"].lower() and abs(p_exist["espesor"] - tab["espesor"]) < 0.5:
                    diff_lar = abs(p_exist["largo"] - tab["largo"])
                    diff_anc = abs(p_exist["ancho"] - tab["ancho"])
                    if diff_lar <= 2.0 and diff_anc <= 2.0:
                        p_exist["cantidad"] += tab.get("cantidad", 1)
                        p_exist["largo"] = max(p_exist["largo"], tab["largo"])
                        p_exist["ancho"] = max(p_exist["ancho"], tab["ancho"])
                        encontrado = True
                        break
            if not encontrado:
                item_copy = {k: v for k, v in tab.items() if k not in ("pos", "ax_norm", "ax_anc", "ax_lar")}
                piezas_consolidadas.append(item_copy)

        piezas_madera_final = piezas_consolidadas

        def _sort_pieza_key(item):
            name = item.get("nombre", "")
            nums = re.findall(r'\d+', name)
            return (int(nums[0]) if nums else 9999, name)

        piezas_madera_final.sort(key=_sort_pieza_key)
    elif "Cubierta" in ghx_file:
        u_izq_str = str(find_user_param_value(p, "RH_IN:02.1 Union izquierda", find_user_param_value(p, "union_izquierda", ""))).lower()
        u_der_str = str(find_user_param_value(p, "RH_IN:02.0 Union Derecha", find_user_param_value(p, "union_derecha", ""))).lower()
        tiene_entrepanio = "entrepaño" in u_izq_str or "entrepanio" in u_izq_str or u_izq_str == "3" or "entrepaño" in u_der_str or "entrepanio" in u_der_str or u_der_str == "3" or any("soporte" in m.get("name", "").lower() for m in real_meshes)

        ancho_nom = float(find_user_param_value(p, "RH_IN:01.1 Ancho", find_user_param_value(p, "RH_IN:01 Ancho", find_user_param_value(p, "ancho", 500.0))))
        prof_nom = float(find_user_param_value(p, "RH_IN:01.2 Profundidad", find_user_param_value(p, "RH_IN:02 Profundidad", find_user_param_value(p, "profundidad", 500.0))))

        if tiene_entrepanio:
            piezas_madera_final = [{
                "nombre": "Entrepaño",
                "largo": round(ancho_nom - 1.0, 1),
                "ancho": round(prof_nom, 1),
                "espesor": 15.0,
                "cantidad": 1,
                "tipo": "Entrepaño Deslizable DfMA"
            }]
        else:
            piezas_madera_final = [{
                "nombre": "Cubierta",
                "largo": round(ancho_nom, 1),
                "ancho": round(prof_nom, 1),
                "espesor": 15.0,
                "cantidad": 1,
                "tipo": "Estructura Fija DfMA"
            }]
    else:
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

    summary_dict = {
        "dimensiones": dim_str,
        "area_madera_m2": round(area_madera_m2, 3),
        "costo_estimado_usd": costo_total,
        "piezas_totales": sum(p_it["cantidad"] for p_it in piezas_madera_final)
    }

    return piezas_madera_final, herrajes_final, summary_dict
