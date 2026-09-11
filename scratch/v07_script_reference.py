"""
================================================================================
NOMBRE:      3BF Mecanizador
VERSIÓN:     0.7 (Multi-Tornillería & Ensamble Completo)
AUTOR:       Mario Mojica
SUITE:       3dBimFab
ENTORNO:     Rhino 8 / Grasshopper (Python 3 CPython)
DESCRIPCIÓN: Posicionamiento, orientación 3D, giro axial y generación de copias
             en espejo automáticas a través de planos de simetría (Plane_Mirror_X 
             y Plane_Mirror_Y). Soporta listas de geometrías en Herraje_Malla_2 
             para que múltiples tornillos por herraje se clonen completos.
================================================================================
"""

import Rhino.Geometry as rg
import math

# ==============================================================================
# 1. PARSEO DE GIRO AXIAL
# ==============================================================================
def parse_giro_axial(giro_val):
    if giro_val is None:
        return 0.0, "Frente (0°)"
    
    val_str = str(giro_val).strip().lower()
    
    if val_str in ["0", "0.0", "frente", "front"]:
        return 0.0, "Frente (0°)"
    elif val_str in ["90", "90.0", "posterior", "pesterior", "atras", "back"]:
        return math.radians(90.0), "Posterior (90°)"
    elif val_str in ["180", "180.0", "arriba", "up", "top"]:
        return math.radians(180.0), "Arriba (180°)"
    elif val_str in ["270", "270.0", "-90", "-90.0", "abajo", "down", "bottom"]:
        return math.radians(270.0), "Abajo (270°)"
    else:
        try:
            deg = float(val_str)
            return math.radians(deg), f"Personalizado ({deg}°)"
        except:
            return 0.0, "Frente (0°)"


# ==============================================================================
# 2. FUNCIÓN DE TRANSFORMACIÓN COMPUESTA (BASE -> DESTINO)
# ==============================================================================
def calcular_transformacion(pt_base, pt_destino, orientacion_val, giro_val):
    val_str = str(orientacion_val).strip().lower()
    
    # A. Giro axial sobre el eje X longitudinal del herraje
    angulo_rad, giro_label = parse_giro_axial(giro_val)
    if abs(angulo_rad) > 1e-6:
        rot_axial = rg.Transform.Rotation(angulo_rad, rg.Vector3d(1, 0, 0), pt_base)
    else:
        rot_axial = rg.Transform.Identity

    # B. Rotación principal según la orientación seleccionada
    if val_str in ["1", "x0,x1", "x0->x1", "x+"]:
        rot_orient = rg.Transform.Identity
        dir_label = "+X (Izquierda a Derecha)"
    elif val_str in ["2", "x1,x0", "x1->x0", "x-"]:
        rot_orient = rg.Transform.Rotation(math.pi, rg.Vector3d(0, 0, 1), pt_base)
        dir_label = "-X (Derecha a Izquierda)"
    elif val_str in ["3", "y0,y1", "y0->y1", "y+"]:
        rot_orient = rg.Transform.Rotation(math.pi / 2.0, rg.Vector3d(0, 0, 1), pt_base)
        dir_label = "+Y (Frente hacia Atrás)"
    elif val_str in ["4", "y1,y0", "y1->y0", "y-"]:
        rot_orient = rg.Transform.Rotation(-math.pi / 2.0, rg.Vector3d(0, 0, 1), pt_base)
        dir_label = "-Y (Atrás hacia el Frente)"
    elif val_str in ["5", "z0,z1", "z0->z1", "z+"]:
        rot_orient = rg.Transform.Rotation(-math.pi / 2.0, rg.Vector3d(0, 1, 0), pt_base)
        dir_label = "+Z (Abajo hacia Arriba)"
    elif val_str in ["6", "z1,z0", "z1->z0", "z-"]:
        rot_orient = rg.Transform.Rotation(math.pi / 2.0, rg.Vector3d(0, 1, 0), pt_base)
        dir_label = "-Z (Arriba hacia Abajo)"
    else:
        rot_orient = rg.Transform.Identity
        dir_label = "+X (Por defecto)"

    # C. Traslación desde pt_base hacia el punto destino
    vec_traslacion = pt_destino - pt_base
    trasl = rg.Transform.Translation(vec_traslacion)

    # Matriz total: Traslación * Rotación Orientación * Giro Axial
    xform_total = trasl * rot_orient * rot_axial
    return xform_total, dir_label, giro_label


# ==============================================================================
# 3. HELPER PARA APLICAR ESPEJO A GEOMETRÍAS (BREPS Y MESHES)
# ==============================================================================
def reflejar_geometrias(lista_breps, lista_meshes_1, lista_meshes_2, plano_espejo):
    if plano_espejo is None:
        return [], [], []
    
    xform_mirror = rg.Transform.Mirror(plano_espejo)
    
    breps_mirror = []
    m1_mirror = []
    m2_mirror = []

    for b in lista_breps:
        copia = b.DuplicateBrep() if hasattr(b, "DuplicateBrep") else b.Duplicate()
        copia.Transform(xform_mirror)
        breps_mirror.append(copia)

    for m in lista_meshes_1:
        copia = m.DuplicateMesh() if hasattr(m, "DuplicateMesh") else m.Duplicate()
        copia.Transform(xform_mirror)
        m1_mirror.append(copia)

    for m in lista_meshes_2:
        copia = m.DuplicateMesh() if hasattr(m, "DuplicateMesh") else m.Duplicate()
        copia.Transform(xform_mirror)
        m2_mirror.append(copia)

    return breps_mirror, m1_mirror, m2_mirror


def tiene_geometria(val):
    if val is None:
        return False
    if isinstance(val, list) and len(val) == 0:
        return False
    return True


# ==============================================================================
# 4. EJECUCIÓN DEL ALGORITMO PRINCIPAL
# ==============================================================================
mecanizados_base = []
herrajes_1_base = []
herrajes_2_base = []

mecanizados_out = []
herrajes_1_out = []
herrajes_2_out = []

puntos_destino = Point if isinstance(Point, list) else [Point] if Point is not None else []

hay_mecanizado = tiene_geometria(Mecanizado_Nurbs)
hay_malla_1 = tiene_geometria(Herraje_Malla_1)
hay_malla_2 = tiene_geometria(Herraje_Malla_2)

if not puntos_destino:
    print("⚠️ [3BF Mecanizador v0.7] Esperando punto(s) de inserción en 'Point'...")
elif not hay_mecanizado and not hay_malla_1 and not hay_malla_2:
    print("⚠️ [3BF Mecanizador v0.7] No se ha conectado BRep ni Mallas para orientar.")
else:
    pt_base = Dual_Point if Dual_Point is not None else rg.Point3d(0, 0, 0)
    
    dir_info = ""
    giro_info = ""

    # Normalizar prototipos como listas de geometrías
    lista_mec = Mecanizado_Nurbs if isinstance(Mecanizado_Nurbs, list) else ([Mecanizado_Nurbs] if Mecanizado_Nurbs is not None else [])
    lista_m1 = Herraje_Malla_1 if isinstance(Herraje_Malla_1, list) else ([Herraje_Malla_1] if Herraje_Malla_1 is not None else [])
    lista_m2 = Herraje_Malla_2 if isinstance(Herraje_Malla_2, list) else ([Herraje_Malla_2] if Herraje_Malla_2 is not None else [])

    # --- FASE 1: Generar elementos Base en los puntos destino ---
    for pt in puntos_destino:
        if pt is None:
            continue
        
        pt_dest = rg.Point3d(pt)
        xform, dir_info, giro_info = calcular_transformacion(pt_base, pt_dest, Orientacion, Giro)

        # 1. Mecanizado
        if hay_mecanizado:
            for geom_mec in lista_mec:
                if geom_mec is not None:
                    brep_copia = geom_mec.DuplicateBrep() if hasattr(geom_mec, "DuplicateBrep") else geom_mec.Duplicate()
                    brep_copia.Transform(xform)
                    mecanizados_base.append(brep_copia)

        # 2. Malla 1 (Cantonera)
        if hay_malla_1:
            for geom_m1 in lista_m1:
                if geom_m1 is not None:
                    m1_copia = geom_m1.DuplicateMesh() if hasattr(geom_m1, "DuplicateMesh") else geom_m1.Duplicate()
                    m1_copia.Transform(xform)
                    herrajes_1_base.append(m1_copia)

        # 3. Malla 2 (Tornillos: clona TODOS los tornillos presentes en lista_m2 para este punto)
        if hay_malla_2:
            for geom_m2 in lista_m2:
                if geom_m2 is not None:
                    m2_copia = geom_m2.DuplicateMesh() if hasattr(geom_m2, "DuplicateMesh") else geom_m2.Duplicate()
                    m2_copia.Transform(xform)
                    herrajes_2_base.append(m2_copia)

    # --- FASE 2: Aplicar Espejos (Plane_Mirror_X y Plane_Mirror_Y) ---
    mecanizados_out = list(mecanizados_base)
    herrajes_1_out = list(herrajes_1_base)
    herrajes_2_out = list(herrajes_2_base)

    # Espejo en X
    if Plane_Mirror_X is not None:
        mb_x, m1_x, m2_x = reflejar_geometrias(mecanizados_base, herrajes_1_base, herrajes_2_base, Plane_Mirror_X)
        mecanizados_out.extend(mb_x)
        herrajes_1_out.extend(m1_x)
        herrajes_2_out.extend(m2_x)

    # Espejo en Y (Aplica sobre todo el conjunto actual para permitir 4 esquinas si ambos están activos)
    if Plane_Mirror_Y is not None:
        mb_y, m1_y, m2_y = reflejar_geometrias(mecanizados_out, herrajes_1_out, herrajes_2_out, Plane_Mirror_Y)
        mecanizados_out.extend(mb_y)
        herrajes_1_out.extend(m1_y)
        herrajes_2_out.extend(m2_y)

    # Diagnóstico en la consola 'out'
    espejo_info = []
    if Plane_Mirror_X is not None: espejo_info.append("Espejo X Activo")
    if Plane_Mirror_Y is not None: espejo_info.append("Espejo Y Activo")
    if not espejo_info: espejo_info.append("Sin Espejo")

    print(f"✅ [3BF Mecanizador v0.7] {len(puntos_destino)} punto(s) origen ➔ Total generados: {len(herrajes_1_out)} cantonera(s), {len(herrajes_2_out)} tornillo(s).")
    print(f"   • Orientación : {Orientacion} [{dir_info}]")
    print(f"   • Giro Axial  : {Giro} [{giro_info}]")
    print(f"   • Simetría    : {', '.join(espejo_info)}")
    print(f"   • BReps       : {len(mecanizados_out)} generados")
    print(f"   • Cantoneras  : {len(herrajes_1_out)} generadas")
    print(f"   • Tornillos   : {len(herrajes_2_out)} generados")

# ==============================================================================
# 5. SALIDAS DE GRASSHOPPER
# ==============================================================================
Mecanizado_Out = mecanizados_out if len(mecanizados_out) > 1 else (mecanizados_out[0] if mecanizados_out else None)
Herraje_Out_1 = herrajes_1_out if len(herrajes_1_out) > 1 else (herrajes_1_out[0] if herrajes_1_out else None)
Herraje_Out_2 = herrajes_2_out if len(herrajes_2_out) > 1 else (herrajes_2_out[0] if herrajes_2_out else None)