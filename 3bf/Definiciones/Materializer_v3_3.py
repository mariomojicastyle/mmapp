"""
=============================================================================
PROYECTO:      3dBimFab
COMPONENTE:    3dBimFab - Desglosador DfMA de Pieza Real NURBS (Materializer)
VERSIÓN:       3.3 DfMA Inteligencia de Pares Simétricos (Auto-Pairing Cajones)
AUTOR:         Mario Mojica & Gamma (3dBimFab Digital Manufacturing Engine)
DESCRIPCIÓN:   Clasifica geométricamente las caras de uno o varios Breps sólidos en:
               - Caras Principales (A / B) según balance, con auto-detección
                 de simetría para pares enfrentados (laterales de cajón / costados).
                 * Cara A = Siempre Exterior / Vista (hacia afuera).
                 * Cara B = Siempre Interior / Reverso (hacia el interior del cajón).
               - Cantos Perimetrales (1 a 4) planos exteriores o chaflanes a 45°.
               - Mecanizados (cilindros y fondos planos de barrenos -> siempre a MDP).
               - Reporte de auditoría detallado por la salida 'Out'.
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

    # 1. Medir BoundingBox de la envolvente exterior
    bbox = brep_in.GetBoundingBox(True)
    x0, x1 = bbox.Min.X, bbox.Max.X
    y0, y1 = bbox.Min.Y, bbox.Max.Y
    z0, z1 = bbox.Min.Z, bbox.Max.Z

    sx = max(0.1, x1 - x0)
    sy = max(0.1, y1 - y0)
    sz = max(0.1, z1 - z0)
    min_dim = min(sx, sy, sz)

    # Tolerancias geométricas
    tol = max(0.2, min_dim * 0.15)
    zona_bisel = max(tol * 2.5, min_dim * 2.2)

    faces_A = []
    faces_B = []
    faces_cantos = {1: [], 2: [], 3: [], 4: []}
    faces_mecanizados = []

    # Si no se definió is_left externamente, inferir por centroide respecto a X=0
    if is_left is None:
        xc = (x0 + x1) * 0.5
        is_left = (xc < 0)

    # 2. Clasificar cada cara real del Brep
    for i in range(brep_in.Faces.Count):
        f = brep_in.Faces[i]
        nurbs_face = f.DuplicateFace(False)

        # 🛡️ BLINDAJE 1: Cilindros y superficies curvas son mecanizados
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
            # Cara A = Superior (+Z)
            if n.Z > 0.85 and abs(pt.Z - z1) < tol:
                faces_A.append(nurbs_face)
            # Cara B = Inferior (-Z)
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
            
            # ⚡ DfMA INTELIGENCIA DE PARES SIMÉTRICOS:
            # - Cara A = SIEMPRE Exterior (hacia afuera del cajón/mueble)
            # - Cara B = SIEMPRE Interior (hacia el interior del cajón/mueble)
            if is_left:
                # Lateral Izquierdo: Exterior es -X, Interior es +X
                if n.X < -0.85 and abs(pt.X - x0) < tol:
                    faces_A.append(nurbs_face) # Exterior
                elif n.X > 0.85 and abs(pt.X - x1) < tol:
                    faces_B.append(nurbs_face) # Interior hacia centro del cajón
            else:
                # Lateral Derecho: Exterior es +X, Interior es -X
                if n.X > 0.85 and abs(pt.X - x1) < tol:
                    faces_A.append(nurbs_face) # Exterior
                elif n.X < -0.85 and abs(pt.X - x0) < tol:
                    faces_B.append(nurbs_face) # Interior hacia centro del cajón

            # Cantos perimetrales del lateral
            # Canto 1: Frontal (-Y)
            if (n.Y < -0.85 and abs(pt.Y - y0) < tol) or (-0.85 < n.Y < -0.30 and (pt.Y - y0) < zona_bisel and abs(pt.X - ((x0+x1)*0.5)) < (sx * 0.6)):
                faces_cantos[1].append(nurbs_face)
            # Canto 2: Trasero (+Y)
            elif (n.Y > 0.85 and abs(pt.Y - y1) < tol) or (0.30 < n.Y < 0.85 and (y1 - pt.Y) < zona_bisel and abs(pt.X - ((x0+x1)*0.5)) < (sx * 0.6)):
                faces_cantos[2].append(nurbs_face)
            # Canto 3: Superior (+Z)
            elif (n.Z > 0.85 and abs(pt.Z - z1) < tol) or (0.30 < n.Z < 0.85 and (z1 - pt.Z) < zona_bisel and abs(pt.X - ((x0+x1)*0.5)) < (sx * 0.6)):
                faces_cantos[3].append(nurbs_face)
            # Canto 4: Inferior (-Z)
            elif (n.Z < -0.85 and abs(pt.Z - z0) < tol) or (-0.85 < n.Z < -0.30 and (pt.Z - z0) < zona_bisel and abs(pt.X - ((x0+x1)*0.5)) < (sx * 0.6)):
                faces_cantos[4].append(nurbs_face)
            elif not faces_A and not faces_B:
                faces_mecanizados.append(nurbs_face)

        # -----------------------------------------------------------------
        # CASO 3: Tablero Vertical Frontal (Frentes / Traseras Cajón / Puertas / Zócalos - Espesor en Y)
        # -----------------------------------------------------------------
        else:
            tipo_str = "Vertical Frontal (Frente/Trasera/Puerta)"
            # Cara A = Frontal (-Y hacia usuario)
            if n.Y < -0.85 and abs(pt.Y - y0) < tol:
                faces_A.append(nurbs_face)
            # Cara B = Posterior (+Y hacia fondo del mueble)
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

    # Convertir a lista si es un Brep individual o una colección
    if hasattr(brep_input, "__iter__") and not hasattr(brep_input, "Faces"):
        breps = [b for b in brep_input if b is not None]
    else:
        breps = [brep_input]

    if not breps:
        return [], [], [], "Lista de Breps vacía"

    # Si hay 2 o más piezas, detectar parejas enfrentadas en X (mismo cajón: similar Y y Z)
    is_left_flags = [None] * len(breps)
    if len(breps) > 1:
        bboxes = []
        for b in breps:
            bb = b.GetBoundingBox(True)
            bboxes.append({
                "min": (bb.Min.X, bb.Min.Y, bb.Min.Z),
                "max": (bb.Max.X, bb.Max.Y, bb.Max.Z),
                "xc": (bb.Min.X + bb.Max.X) * 0.5,
                "yc": (bb.Min.Y + bb.Max.Y) * 0.5,
                "zc": (bb.Min.Z + bb.Max.Z) * 0.5,
                "sx": bb.Max.X - bb.Min.X,
                "sy": bb.Max.Y - bb.Min.Y,
                "sz": bb.Max.Z - bb.Min.Z
            })

        for i, info in enumerate(bboxes):
            # Solo aplica auto-pairing si es pieza vertical lateral (espesor en X)
            min_dim = min(info["sx"], info["sy"], info["sz"])
            if min_dim == info["sx"]:
                # Buscar pareja que comparta misma altura Z y profundidad Y (tolerancia ±25mm)
                partner_xc = None
                for j, other in enumerate(bboxes):
                    if j == i: continue
                    other_min_dim = min(other["sx"], other["sy"], other["sz"])
                    if other_min_dim == other["sx"]:
                        if abs(info["yc"] - other["yc"]) < 25.0 and abs(info["zc"] - other["zc"]) < 25.0:
                            partner_xc = other["xc"]
                            break
                if partner_xc is not None:
                    mid_x = (info["xc"] + partner_xc) * 0.5
                    is_left_flags[i] = (info["xc"] < mid_x)
                else:
                    is_left_flags[i] = (info["xc"] < 0)

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
        diag_lines.append(f"P{idx+1}: {diag}")

    res_diag = " | ".join(diag_lines) if len(diag_lines) <= 3 else f"{len(breps)} piezas procesadas DfMA. " + diag_lines[0]
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
