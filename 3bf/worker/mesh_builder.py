"""
============================================================================
ARCHIVO: mesh_builder.py
UBICACIÓN: c:/Desarrollo/mmapp/3bf/worker/mesh_builder.py
DESCRIPCIÓN:
Módulo de geometría poligonal 3D para 3dBimFab: separación topológica de islas
conexas, clasificación de caras y cantos por normal (Cara A, Cara B, 4 cantos),
reconstrucción instantánea de mallas y deduplicación espacial DfMA.
============================================================================
"""

import math
from collections import defaultdict, deque


def split_mesh_dict_into_islands(mesh_dict: dict) -> list:
    """
    Descompone una malla poligonal con múltiples componentes disjuntos (ej: piezas unidas por Mesh Join
    en Grasshopper como múltiples Tapaluces o travesaños) en mallas independientes.
    Preserva coordenadas UV, calcula Bounding Box y centros locales independientes para cada isla.
    """
    verts = mesh_dict.get("vertices", [])
    indices = mesh_dict.get("indices", [])
    uvs = mesh_dict.get("uvs", [])

    n_faces = len(indices) // 3
    if n_faces <= 1 or not verts:
        return [mesh_dict]

    # 🌐 Soldado espacial virtual (tolerancia de 1.5mm = 0.0015m)
    # Permite que mallas con aristas duras (unwelded) donde cada cara duplica sus vértices
    # se mantengan como 1 sola pieza continua, aislando ÚNICAMENTE cuerpos físicamente separados en el espacio.
    def v_key(v_idx):
        return (
            round(verts[v_idx * 3] / 0.0015),
            round(verts[v_idx * 3 + 1] / 0.0015),
            round(verts[v_idx * 3 + 2] / 0.0015)
        )

    v_to_faces = defaultdict(list)
    for f_idx in range(n_faces):
        a, b, c = indices[f_idx * 3], indices[f_idx * 3 + 1], indices[f_idx * 3 + 2]
        v_to_faces[v_key(a)].append(f_idx)
        v_to_faces[v_key(b)].append(f_idx)
        v_to_faces[v_key(c)].append(f_idx)

    visited_faces = set()
    components = []
    for f_start in range(n_faces):
        if f_start in visited_faces:
            continue
        comp_faces = []
        queue = deque([f_start])
        visited_faces.add(f_start)
        while queue:
            f = queue.popleft()
            comp_faces.append(f)
            a, b, c = indices[f * 3], indices[f * 3 + 1], indices[f * 3 + 2]
            for v in (a, b, c):
                for neighbor in v_to_faces[v_key(v)]:
                    if neighbor not in visited_faces:
                        visited_faces.add(neighbor)
                        queue.append(neighbor)
        components.append(comp_faces)

    if len(components) <= 1:
        return [mesh_dict]

    has_uvs = bool(uvs and len(uvs) == len(verts) * 2 // 3)
    sub_meshes = []
    base_pos = mesh_dict.get("position", [0, 0, 0])

    for comp in components:
        old_to_new = {}
        new_verts = []
        new_indices = []
        new_uvs = []

        for f in comp:
            for i in range(3):
                old_v = indices[f * 3 + i]
                if old_v not in old_to_new:
                    new_idx = len(new_verts) // 3
                    old_to_new[old_v] = new_idx
                    vx = verts[old_v * 3]
                    vy = verts[old_v * 3 + 1]
                    vz = verts[old_v * 3 + 2]
                    new_verts.extend([vx, vy, vz])
                    if has_uvs:
                        new_uvs.extend([uvs[old_v * 2], uvs[old_v * 2 + 1]])
                new_indices.append(old_to_new[old_v])

        xs = new_verts[0::3]
        ys = new_verts[1::3]
        zs = new_verts[2::3]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        min_z, max_z = min(zs), max(zs)

        island_size = [round(max_x - min_x, 4), round(max_y - min_y, 4), round(max_z - min_z, 4)]
        center_x = (min_x + max_x) / 2.0
        center_y = (min_y + max_y) / 2.0
        center_z = (min_z + max_z) / 2.0

        centered_verts = []
        for i in range(len(new_verts) // 3):
            centered_verts.extend([
                round(new_verts[i * 3] - center_x, 4),
                round(new_verts[i * 3 + 1] - center_y, 4),
                round(new_verts[i * 3 + 2] - center_z, 4)
            ])

        island_pos = [
            round(base_pos[0] + center_x, 4),
            round(base_pos[1] + center_y, 4),
            round(base_pos[2] + center_z, 4)
        ]

        sub_m = dict(mesh_dict)
        sub_m["size"] = island_size
        sub_m["position"] = island_pos
        sub_m["vertices"] = centered_verts
        sub_m["indices"] = new_indices
        if has_uvs:
            sub_m["uvs"] = new_uvs
        elif "uvs" in sub_m:
            del sub_m["uvs"]
        sub_meshes.append(sub_m)

    return sub_meshes


def extract_tris_from_mesh(mesh: dict) -> list:
    verts = mesh.get("vertices", [])
    indices = mesh.get("indices", [])
    uvs = mesh.get("uvs", [])
    pos = mesh.get("position", [0.0, 0.0, 0.0])
    px, py, pz = float(pos[0]), float(pos[1]), float(pos[2])

    tris = []
    has_uv = (len(uvs) == len(verts) * 2 // 3)
    for t in range(0, len(indices), 3):
        if t + 2 >= len(indices):
            break
        i0, i1, i2 = indices[t], indices[t + 1], indices[t + 2]
        p0 = (verts[i0 * 3] + px, verts[i0 * 3 + 1] + py, verts[i0 * 3 + 2] + pz)
        p1 = (verts[i1 * 3] + px, verts[i1 * 3 + 1] + py, verts[i1 * 3 + 2] + pz)
        p2 = (verts[i2 * 3] + px, verts[i2 * 3 + 1] + py, verts[i2 * 3 + 2] + pz)

        uv0 = (uvs[i0 * 2], uvs[i0 * 2 + 1]) if has_uv else (0.0, 0.0)
        uv1 = (uvs[i1 * 2], uvs[i1 * 2 + 1]) if has_uv else (0.0, 0.0)
        uv2 = (uvs[i2 * 2], uvs[i2 * 2 + 1]) if has_uv else (0.0, 0.0)

        v1 = (p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])
        v2 = (p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2])
        nx = v1[1] * v2[2] - v1[2] * v2[1]
        ny = v1[2] * v2[0] - v1[0] * v2[2]
        nz = v1[0] * v2[1] - v1[1] * v2[0]
        l = (nx ** 2 + ny ** 2 + nz ** 2) ** 0.5
        if l > 0:
            nx, ny, nz = nx / l, ny / l, nz / l

        cx = (p0[0] + p1[0] + p2[0]) / 3.0
        cy = (p0[1] + p1[1] + p2[1]) / 3.0
        cz = (p0[2] + p1[2] + p2[2]) / 3.0

        tris.append({
            "p0": p0, "p1": p1, "p2": p2,
            "uv0": uv0, "uv1": uv1, "uv2": uv2,
            "normal": (nx, ny, nz),
            "ny": ny,
            "n": (nx, ny, nz),
            "c": (cx, cy, cz)
        })
    return tris


def build_mesh_from_tris(name: str, template_mesh_or_tris, tris=None):
    if tris is None and isinstance(template_mesh_or_tris, list):
        target_tris = template_mesh_or_tris
    else:
        target_tris = tris if tris is not None else []

    if not target_tris:
        return None

    all_pts = []
    for tri in target_tris:
        all_pts.append(tri["p0"])
        all_pts.append(tri["p1"])
        all_pts.append(tri["p2"])

    xs = [p[0] for p in all_pts]
    ys = [p[1] for p in all_pts]
    zs = [p[2] for p in all_pts]

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    min_z, max_z = min(zs), max(zs)

    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0
    center_z = (min_z + max_z) / 2.0

    size_x = max(0.0001, max_x - min_x)
    size_y = max(0.0001, max_y - min_y)
    size_z = max(0.0001, max_z - min_z)

    new_verts = []
    new_indices = []
    new_uvs = []

    idx = 0
    for tri in target_tris:
        for p_world, uv in [(tri["p0"], tri["uv0"]), (tri["p1"], tri["uv1"]), (tri["p2"], tri["uv2"])]:
            lx = round(p_world[0] - center_x, 4)
            ly = round(p_world[1] - center_y, 4)
            lz = round(p_world[2] - center_z, 4)
            new_verts.extend([lx, ly, lz])
            new_uvs.extend([round(uv[0], 4), round(uv[1], 4)])
        new_indices.extend([idx, idx + 1, idx + 2])
        idx += 3

    return {
        "name": name,
        "size": [round(size_x, 4), round(size_y, 4), round(size_z, 4)],
        "position": [round(center_x, 4), round(center_y, 4), round(center_z, 4)],
        "vertices": new_verts,
        "indices": new_indices,
        "uvs": new_uvs
    }


def rebuild_fondos_meshes(fondos_data_list, lado_color="Cara A", sustrato="MDF 1 Cara"):
    new_p18_list = []
    new_mdf18_list = []

    lc_norm = str(lado_color).strip().lower()
    es_cara_b = ("cara b" in lc_norm or "lado 2" in lc_norm or "inferior" in lc_norm)
    sust_norm = str(sustrato).strip().lower()

    for item in fondos_data_list:
        cara_a = item["cara_a"]
        cara_b = item["cara_b"]
        cantos = item["cantos"]

        if "crudo" in sust_norm:
            color_tris = []
            mdf_tris = cara_a + cara_b + cantos
        elif "dd" in sust_norm:
            color_tris = cara_a + cara_b
            mdf_tris = cantos
        else:
            if es_cara_b:
                color_tris = cara_b
                mdf_tris = cara_a + cantos
            else:
                color_tris = cara_a
                mdf_tris = cara_b + cantos

        p18_mesh = build_mesh_from_tris("RH_OUT:Peça 18", color_tris)
        mdf18_mesh = build_mesh_from_tris("RH_OUT:MDF Peça 18", mdf_tris)

        if p18_mesh:
            new_p18_list.append(p18_mesh)
        if mdf18_mesh:
            new_mdf18_list.append(mdf18_mesh)

    return new_p18_list, new_mdf18_list


def classify_instance_tris(all_tris: list, is_left: bool = False):
    if not all_tris:
        return None
    xs = [t["c"][0] for t in all_tris]
    ys = [t["c"][1] for t in all_tris]
    zs = [t["c"][2] for t in all_tris]
    x0, x1 = min(xs), max(xs)
    y0, y1 = min(ys), max(ys)
    z0, z1 = min(zs), max(zs)
    sx = max(0.001, x1 - x0)
    sy = max(0.001, y1 - y0)
    sz = max(0.001, z1 - z0)
    min_dim = min(sx, sy, sz)
    tol = max(0.001, min_dim * 0.35)

    ca, cb = [], []
    cantos = {1: [], 2: [], 3: [], 4: []}
    mec = []

    for t in all_tris:
        nx, ny, nz = t["n"]
        cx, cy, cz = t["c"]
        if min_dim == sy:
            if ny > 0.6 and abs(cy - y1) < tol:
                ca.append(t)
            elif ny < -0.6 and abs(cy - y0) < tol:
                cb.append(t)
            elif nz > 0.6 and abs(cz - z1) < tol:
                cantos[1].append(t)
            elif nz < -0.6 and abs(cz - z0) < tol:
                cantos[2].append(t)
            elif nx < -0.6 and abs(cx - x0) < tol:
                cantos[3].append(t)
            elif nx > 0.6 and abs(cx - x1) < tol:
                cantos[4].append(t)
            else:
                mec.append(t)
        elif min_dim == sx:
            if is_left and nx < -0.6 and abs(cx - x0) < tol:
                ca.append(t)
            elif is_left and nx > 0.6 and abs(cx - x1) < tol:
                cb.append(t)
            elif not is_left and nx > 0.6 and abs(cx - x1) < tol:
                ca.append(t)
            elif not is_left and nx < -0.6 and abs(cx - x0) < tol:
                cb.append(t)
            elif nz > 0.6 and abs(cz - z1) < tol:
                cantos[1].append(t)
            elif nz < -0.6 and abs(cz - z0) < tol:
                cantos[2].append(t)
            elif ny > 0.6 and abs(cy - y1) < tol:
                cantos[3].append(t)
            elif ny < -0.6 and abs(cy - y0) < tol:
                cantos[4].append(t)
            else:
                mec.append(t)
        else:
            if nz > 0.6 and abs(cz - z1) < tol:
                ca.append(t)
            elif nz < -0.6 and abs(cz - z0) < tol:
                cb.append(t)
            elif ny > 0.6 and abs(cy - y1) < tol:
                cantos[1].append(t)
            elif ny < -0.6 and abs(cy - y0) < tol:
                cantos[2].append(t)
            elif nx < -0.6 and abs(cx - x0) < tol:
                cantos[3].append(t)
            elif nx > 0.6 and abs(cx - x1) < tol:
                cantos[4].append(t)
            else:
                mec.append(t)

    return {"ca": ca, "cb": cb, "cantos": cantos, "mec": mec}


def rebuild_piece_meshes(inst_list: list, p_num: int, lado_balance="Cara B", c1="Canto", c2="Canto", c3="Canto", c4="Canto"):
    bal_s = str(lado_balance).lower().strip().replace('"', '').replace("'", "")
    if bal_s in ["6", "d/d", "dyd", "doble", "ninguno", "ambas"] or "d/d" in bal_s or "dyd" in bal_s:
        modo_b = "DD"
    elif bal_s in ["5", "cara a", "a"] or (bal_s.startswith("a") and len(bal_s) <= 6):
        modo_b = "A"
    elif bal_s in ["4", "cara b", "b"] or (bal_s.startswith("b") and len(bal_s) <= 6):
        modo_b = "B"
    else:
        modo_b = "B"

    def is_canto_wood(val):
        s = str(val).lower().strip().replace('"', '').replace("'", "")
        if s in ["0", "0.0", "canto", "true", "si", "con canto"] or ("canto" in s and "sin" not in s):
            return True
        return False

    c_flags = {
        1: is_canto_wood(c1),
        2: is_canto_wood(c2),
        3: is_canto_wood(c3),
        4: is_canto_wood(c4),
    }

    new_col, new_bal, new_mdp = [], [], []

    for inst in inst_list:
        ca = inst["ca"]
        cb = inst["cb"]
        cantos = inst["cantos"]
        mec = inst["mec"]

        color_tris = []
        balance_tris = []
        mdp_tris = list(mec)

        if modo_b == "DD":
            color_tris.extend(ca)
            color_tris.extend(cb)
        elif modo_b == "A":
            balance_tris.extend(ca)
            color_tris.extend(cb)
        elif modo_b == "B":
            color_tris.extend(ca)
            balance_tris.extend(cb)
        else:
            balance_tris.extend(ca)
            balance_tris.extend(cb)

        for c_idx in range(1, 5):
            if c_flags[c_idx]:
                color_tris.extend(cantos[c_idx])
            else:
                mdp_tris.extend(cantos[c_idx])

        m_c = build_mesh_from_tris(f"RH_OUT:Peça {p_num}", color_tris)
        m_b = build_mesh_from_tris(f"RH_OUT:Peça {p_num} B", balance_tris)
        m_m = build_mesh_from_tris(f"RH_OUT:MDP Peça {p_num}", mdp_tris)

        if m_c:
            new_col.append(m_c)
        if m_b:
            new_bal.append(m_b)
        if m_m:
            new_mdp.append(m_m)

    return new_col, new_bal, new_mdp


def deduplicate_real_meshes(meshes: list) -> tuple[list, list, dict]:
    """
    🛡️ DETECTOR Y PURGADOR DE MALLAS DUPLICADAS (3dBimFab DfMA Shield)
    Identifica y marca mallas que tengan el mismo nombre (normalizado) y ocupen
    exactamente el mismo espacio 3D (centro y dimensiones idénticas dentro de una tolerancia de 0.5 mm = 0.0005 m).
    """
    if not meshes or len(meshes) <= 1:
        return meshes, meshes, {}

    unique_meshes = []
    unique_by_name = defaultdict(list)
    all_annotated_meshes = []
    duplicates_count = 0
    discarded_summary = {}

    for m in meshes:
        raw_n = m.get("name", "").strip()
        m_name = raw_n.lower().replace("rh_out:", "").strip()
        m_pos = m.get("position", [0, 0, 0])
        m_size = m.get("size", [0, 0, 0])
        m_verts_count = len(m.get("vertices", []))

        is_dup = False
        candidates = unique_by_name.get(m_name, [])
        for u in candidates:
            u_pos = u.get("position", [0, 0, 0])
            u_size = u.get("size", [0, 0, 0])
            u_verts_count = len(u.get("vertices", []))

            dist_pos = math.sqrt(sum((float(a) - float(b)) ** 2 for a, b in zip(m_pos, u_pos)))
            dist_size = math.sqrt(sum((float(a) - float(b)) ** 2 for a, b in zip(m_size, u_size)))

            if dist_pos < 0.0005 and dist_size < 0.0005:
                if m_verts_count == 0 or u_verts_count == 0 or m_verts_count == u_verts_count:
                    is_dup = True
                    duplicates_count += 1
                    display_name = raw_n.replace("RH_OUT:", "").strip()
                    discarded_summary[display_name] = discarded_summary.get(display_name, 0) + 1
                    break

        if is_dup:
            m_dup = dict(m)
            m_dup["es_duplicado_ghx"] = True
            all_annotated_meshes.append(m_dup)
        else:
            unique_meshes.append(m)
            unique_by_name[m_name].append(m)
            all_annotated_meshes.append(m)

    if duplicates_count > 0:
        print(f"🛡️ [3dBimFab DfMA Shield] Se detectaron y aislaron {duplicates_count} mallas duplicadas en el GHX: {discarded_summary}", flush=True)

    return unique_meshes, all_annotated_meshes, discarded_summary
