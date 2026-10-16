"""
=============================================================================
PROYECTO:      3dBimFab
COMPONENTE:    3dBimFab - Desglosador DfMA de Pieza Real NURBS (Materializer)
VERSIÓN:       3.4 DfMA Inteligencia Total (Simetría Dual + Cierre de Ranuras)
AUTOR:         Mario Mojica & Gamma (3dBimFab Digital Manufacturing Engine)
DESCRIPCIÓN:   Clasifica geométricamente las caras de piezas NURBS / Breps en:
               - Caras Principales (A = Exterior / B = Interior) con auto-detección
                 de simetría (por centroide relativo Xmid y por presencia de ranura).
               - Cantos Perimetrales (1 a 4) planos o chaflanes a 45°.
               - Mecanizados y Ranuras (SIEMPRE a MDP, sin descartar ninguna cara).
               - 100% compatible con Item Access o List Access en Grasshopper.
=============================================================================
"""

import Rhino

def parse_balance(val):
    s = str(val).lower().strip().replace('"', '').replace("'", "")
    if s in ["6", "d/d", "dyd", "doble", "ninguno", "ambas"] or "d/d" in s or "dyd" in s:
        return "DD"
    if s in ["5", "cara a", "a"] or (s.startswith("a") and len(s) <= 6):
        return "A"
    if s in ["4", "cara b", "b"] or (s.startswith("b") and len(s) <= 6):
        return "B"
    if "ambos" in s:
        return "AMBOS"
    return "B"

def parse_canto(val):
    s = str(val).lower().strip().replace('"', '').replace("'", "")
    if s in ["0", "0.0", "canto", "true", "si", "sí", "con canto"] or ("canto" in s and "sin" not in s):
        return True # Madera / Color
    if s in ["1", "1.0", "mdp", "false", "no", "sin canto"] or "mdp" in s or "sin" in s:
        return False # Crudo / MDP
    return True

def clasificar_brep_individual(brep_in, balance_mode="Cara B", c1="Canto", c2="Canto", c3="Canto", c4="Canto", is_left=None):
    if brep_in is None:
        return [], [], [], "Aviso: Brep nulo"

    bbox = brep_in.GetBoundingBox(True)
    x0, x1 = bbox.Min.X, bbox.Max.X
    y0, y1 = bbox.Min.Y, bbox.Max.Y
    z0, z1 = bbox.Min.Z, bbox.Max.Z

    sx = max(0.1, x1 - x0)
    sy = max(0.1, y1 - y0)
    sz = max(0.1, z1 - z0)
    min_dim = min(sx, sy, sz)

    # Tolerancia geométrica adaptativa (invariante a escala metros/milímetros)
    tol = max(0.0002, min_dim * 0.15)
    zona_bisel = min_dim * 2.2

    # Detección anatómica de simetría si is_left no vino definido externamente
    if is_left is None and min_dim == sx:
        count_x0 = 0
        count_x1 = 0
        for i in range(brep_in.Faces.Count):
            f = brep_in.Faces[i]
            if f.IsPlanar():
                u = (f.Domain(0).T0 + f.Domain(0).T1) * 0.5
                v = (f.Domain(1).T0 + f.Domain(1).T1) * 0.5
                pt = f.PointAt(u, v)
                n = f.NormalAt(u, v)
                n.Unitize()
                if n.X < -0.85 and abs(pt.X - x0) < tol:
                    count_x0 += 1
                elif n.X > 0.85 and abs(pt.X - x1) < tol:
                    count_x1 += 1
        
        # En un lateral de cajón, el lado interior tiene al menos 2 caras por la ranura (arriba y abajo)
        # mientras que el lado exterior es 1 sola cara continua.
        if count_x1 > count_x0:
            # Más caras en +X (ranura interior hacia +X) -> Lateral Izquierdo
            is_left = True
        elif count_x0 > count_x1:
            # Más caras en -X (ranura interior hacia -X) -> Lateral Derecho
            is_left = False
        else:
            xc = (x0 + x1) * 0.5
            is_left = (xc < 0)

    faces_A = []
    faces_B = []
    faces_cantos = {1: [], 2: [], 3: [], 4: []}
    faces_mecanizados = []

    for i in range(brep_in.Faces.Count):
        f = brep_in.Faces[i]
        nurbs_face = f.DuplicateFace(False)

        if not f.IsPlanar():
            faces_mecanizados.append(nurbs_face)
            continue

        u = (f.Domain(0).T0 + f.Domain(0).T1) * 0.5
        v = (f.Domain(1).T0 + f.Domain(1).T1) * 0.5
        pt = f.PointAt(u, v)
        n = f.NormalAt(u, v)
        n.Unitize()

        # -----------------------------------------------------------------
        # CASO 1: Tablero Horizontal (Cubiertas / Entrepaños / Fondos cajón - Espesor en Z)
        # -----------------------------------------------------------------
        if min_dim == sz:
            tipo_str = "Horizontal (Cubierta/Entrepaño/Fondo)"
            if n.Z > 0.85 and abs(pt.Z - z1) < tol:
                faces_A.append(nurbs_face)
            elif n.Z < -0.85 and abs(pt.Z - z0) < tol:
                faces_B.append(nurbs_face)
            # Canto 1: Frontal (-Y)
            elif (n.Y < -0.85 and abs(pt.Y - y0) < tol) or (-0.85 < n.Y < -0.30 and (pt.Y - y0) < zona_bisel and abs(pt.Z - ((z0+z1)*0.5)) < (sz * 0.6)):
                faces_cantos[1].append(nurbs_face)
            # Canto 2: Trasero (+Y)
            elif (n.Y > 0.85 and abs(pt.Y - y1) < tol) or (0.30 < n.Y < 0.85 and (y1 - pt.Y) < zona_bisel and abs(pt.Z - ((z0+z1)*0.5)) < (sz * 0.6)):
                faces_cantos[2].append(nurbs_face)
            # Canto 3: Izquierdo (-X)
            elif (n.X < -0.85 and abs(pt.X - x0) < tol) or (-0.85 < n.X < -0.30 and (pt.X - x0) < zona_bisel and abs(pt.Z - ((z0+z1)*0.5)) < (sz * 0.6)):
                faces_cantos[3].append(nurbs_face)
            # Canto 4: Derecho (+X)
            elif (n.X > 0.85 and abs(pt.X - x1) < tol) or (0.30 < n.X < 0.85 and (x1 - pt.X) < zona_bisel and abs(pt.Z - ((z0+z1)*0.5)) < (sz * 0.6)):
                faces_cantos[4].append(nurbs_face)
            else:
                faces_mecanizados.append(nurbs_face)

        # -----------------------------------------------------------------
        # CASO 2: Tablero Vertical Lateral (Costados / Laterales Cajón - Espesor en X)
        # -----------------------------------------------------------------
        elif min_dim == sx:
            tipo_str = "Vertical Lateral (Costado/Lateral Cajón {})".format("IZQ" if is_left else "DER")
            
            # Detectar caras límites exteriores en x0 (-X) y x1 (+X)
            # En un lateral con ranura, la cara interior está dividida por la ranura (>= 2 caras)
            # y la cara exterior es una sola cara continua (1 cara).
            faces_x0 = []
            faces_x1 = []
            
            # Cantos y mecanizados se van clasificando
            for f_idx in range(brep_in.Faces.Count):
                f_cur = brep_in.Faces[f_idx]
                n_face = f_cur.DuplicateFace(False)
                if not f_cur.IsPlanar():
                    faces_mecanizados.append(n_face)
                    continue
                u = (f_cur.Domain(0).T0 + f_cur.Domain(0).T1) * 0.5
                v = (f_cur.Domain(1).T0 + f_cur.Domain(1).T1) * 0.5
                pt = f_cur.PointAt(u, v)
                n = f_cur.NormalAt(u, v)
                n.Unitize()
                
                if n.X < -0.85 and abs(pt.X - x0) < tol:
                    faces_x0.append(n_face)
                elif n.X > 0.85 and abs(pt.X - x1) < tol:
                    faces_x1.append(n_face)
                elif (n.Y < -0.85 and abs(pt.Y - y0) < tol) or (-0.85 < n.Y < -0.30 and (pt.Y - y0) < zona_bisel and abs(pt.X - ((x0+x1)*0.5)) < (sx * 0.6)):
                    faces_cantos[1].append(n_face)
                elif (n.Y > 0.85 and abs(pt.Y - y1) < tol) or (0.30 < n.Y < 0.85 and (y1 - pt.Y) < zona_bisel and abs(pt.X - ((x0+x1)*0.5)) < (sx * 0.6)):
                    faces_cantos[2].append(n_face)
                elif (n.Z > 0.85 and abs(pt.Z - z1) < tol) or (0.30 < n.Z < 0.85 and (z1 - pt.Z) < zona_bisel and abs(pt.X - ((x0+x1)*0.5)) < (sx * 0.6)):
                    faces_cantos[3].append(n_face)
                elif (n.Z < -0.85 and abs(pt.Z - z0) < tol) or (-0.85 < n.Z < -0.30 and (pt.Z - z0) < zona_bisel and abs(pt.X - ((x0+x1)*0.5)) < (sx * 0.6)):
                    faces_cantos[4].append(n_face)
                else:
                    faces_mecanizados.append(n_face)
            
            # Asignación DfMA infalible:
            # Cara B = Siempre Interior (con ranura)
            # Cara A = Siempre Exterior (lisa continua)
            if len(faces_x1) > len(faces_x0):
                # Interior está en +X (Lateral Izquierdo)
                faces_A.extend(faces_x0)
                faces_B.extend(faces_x1)
            elif len(faces_x0) > len(faces_x1):
                # Interior está en -X (Lateral Derecho)
                faces_A.extend(faces_x1)
                faces_B.extend(faces_x0)
            else:
                # Si son iguales (sin ranura), usar is_left
                if is_left:
                    faces_A.extend(faces_x0)
                    faces_B.extend(faces_x1)
                else:
                    faces_A.extend(faces_x1)
                    faces_B.extend(faces_x0)
            
            # Saltamos el bucle individual ya que procesamos todas las caras de este Brep
            break

        # -----------------------------------------------------------------
        # CASO 3: Tablero Vertical Frontal (Frentes / Traseras Cajón / Puertas / Zócalos - Espesor en Y)
        # -----------------------------------------------------------------
        else:
            tipo_str = "Vertical Frontal (Frente/Trasera/Puerta)"
            if n.Y < -0.85 and abs(pt.Y - y0) < tol:
                faces_A.append(nurbs_face)
            elif n.Y > 0.85 and abs(pt.Y - y1) < tol:
                faces_B.append(nurbs_face)
            # Canto 1: Superior (+Z)
            elif (n.Z > 0.85 and abs(pt.Z - z1) < tol) or (0.30 < n.Z < 0.85 and (z1 - pt.Z) < zona_bisel and abs(pt.Y - ((y0+y1)*0.5)) < (sy * 0.6)):
                faces_cantos[1].append(nurbs_face)
            # Canto 2: Inferior (-Z)
            elif (n.Z < -0.85 and abs(pt.Z - z0) < tol) or (-0.85 < n.Z < -0.30 and (pt.Z - z0) < zona_bisel and abs(pt.Y - ((y0+y1)*0.5)) < (sy * 0.6)):
                faces_cantos[2].append(nurbs_face)
            # Canto 3: Izquierdo (-X)
            elif (n.X < -0.85 and abs(pt.X - x0) < tol) or (-0.85 < n.X < -0.30 and (pt.X - x0) < zona_bisel and abs(pt.Y - ((y0+y1)*0.5)) < (sy * 0.6)):
                faces_cantos[3].append(nurbs_face)
            # Canto 4: Derecho (+X)
            elif (n.X > 0.85 and abs(pt.X - x1) < tol) or (0.30 < n.X < 0.85 and (x1 - pt.X) < zona_bisel and abs(pt.Y - ((y0+y1)*0.5)) < (sy * 0.6)):
                faces_cantos[4].append(nurbs_face)
            else:
                faces_mecanizados.append(nurbs_face)

    # 3. Asignación de Caras Principales según Balance
    modo_b = parse_balance(balance_mode)
    nurbs_color = []
    nurbs_balance = []
    nurbs_mdp = []

    if modo_b == "DD":
        nurbs_color.extend(faces_A)
        nurbs_color.extend(faces_B)
        diag_bal = "D/D (Doble Cara Madera)"
    elif modo_b == "A":
        nurbs_balance.extend(faces_A)
        nurbs_color.extend(faces_B)
        diag_bal = "Balance en Cara A (Exterior)"
    elif modo_b == "B":
        nurbs_color.extend(faces_A)
        nurbs_balance.extend(faces_B)
        diag_bal = "Balance en Cara B (Interior)"
    else:
        nurbs_balance.extend(faces_A)
        nurbs_balance.extend(faces_B)
        diag_bal = "Ambas Caras Balance"

    # 4. Asignación de Cantos
    cantos_in = {
        1: parse_canto(c1),
        2: parse_canto(c2),
        3: parse_canto(c3),
        4: parse_canto(c4)
    }

    for num_canto, tiene_canto in cantos_in.items():
        if tiene_canto:
            nurbs_color.extend(faces_cantos[num_canto])
        else:
            nurbs_mdp.extend(faces_cantos[num_canto])

    # 5. Mecanizados y barrenos siempre van a MDP
    nurbs_mdp.extend(faces_mecanizados)

    diag = "{0} | {1} | Caras: {2} (A={3}, B={4}, Cantos={5}, Mec={6})".format(
        tipo_str, diag_bal, brep_in.Faces.Count,
        len(faces_A), len(faces_B), sum(len(v) for v in faces_cantos.values()), len(faces_mecanizados)
    )

    return nurbs_color, nurbs_balance, nurbs_mdp, diag

def ejecutar_materializer_dfma(brep_input, b_mode, c1, c2, c3, c4):
    if brep_input is None:
        return [], [], [], "Brep nulo"

    if hasattr(brep_input, "__iter__") and not hasattr(brep_input, "Faces"):
        breps = [b for b in brep_input if b is not None]
    else:
        breps = [brep_input]

    if not breps:
        return [], [], [], "Lista de Breps vacía"

    is_left_flags = [None] * len(breps)
    if len(breps) > 1:
        bboxes = []
        for b in breps:
            bb = b.GetBoundingBox(True)
            bboxes.append({
                "xc": (bb.Min.X + bb.Max.X) * 0.5,
                "yc": (bb.Min.Y + bb.Max.Y) * 0.5,
                "zc": (bb.Min.Z + bb.Max.Z) * 0.5,
                "sx": bb.Max.X - bb.Min.X,
                "sy": bb.Max.Y - bb.Min.Y,
                "sz": bb.Max.Z - bb.Min.Z
            })

        # Calcular X_min y X_max global del grupo de laterales (funciona en metros y milímetros)
        xs = [info["xc"] for info in bboxes if min(info["sx"], info["sy"], info["sz"]) == info["sx"]]
        if len(xs) >= 2 and (max(xs) - min(xs)) > 0.05:
            mid_x_global = (min(xs) + max(xs)) * 0.5
            for i, info in enumerate(bboxes):
                if min(info["sx"], info["sy"], info["sz"]) == info["sx"]:
                    is_left_flags[i] = (info["xc"] < mid_x_global)

    all_col = []
    all_bal = []
    all_mdp = []
    diag_lines = []

    for idx, b in enumerate(breps):
        flag = is_left_flags[idx]
        col, bal, mdp, diag = clasificar_brep_individual(b, b_mode, c1, c2, c3, c4, is_left=flag)
        all_col.extend(col)
        all_bal.extend(bal)
        all_mdp.extend(mdp)
        diag_lines.append("P{0}: {1}".format(idx+1, diag))

    res_diag = " | ".join(diag_lines) if len(diag_lines) <= 3 else "{0} piezas procesadas DfMA. {1}".format(len(breps), diag_lines[0])
    return all_col, all_bal, all_mdp, res_diag

# =============================================================================
# EJECUCIÓN GRASSHOPPER
# =============================================================================
_b_mode = Balance_Mode if 'Balance_Mode' in locals() and Balance_Mode is not None else "Cara B"
_c1 = Canto_1 if 'Canto_1' in locals() and Canto_1 is not None else "Canto"
_c2 = Canto_2 if 'Canto_2' in locals() and Canto_2 is not None else "Canto"
_c3 = Canto_3 if 'Canto_3' in locals() and Canto_3 is not None else "Canto"
_c4 = Canto_4 if 'Canto_4' in locals() and Canto_4 is not None else "Canto"

NURBS_Color, NURBS_Balance, NURBS_MDP, Out = ejecutar_materializer_dfma(
    Brep_In, _b_mode, _c1, _c2, _c3, _c4
)

out = Out
a = Out
Info_Pieza = Out
print(Out)
