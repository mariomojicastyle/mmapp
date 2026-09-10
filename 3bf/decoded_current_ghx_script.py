# -*- coding: utf-8 -*-
"""
=============================================================================
3BF Costas v0.1 - GENERADOR PARAMETRICO DE FONDOS Y ESPALDARES TRASEROS
=============================================================================
Generación paramétrica de fondos traseros (1, 2 o 4 piezas) como sólidos NURBS 
con espesor de 3 mm y perfiles H extruidos en un único tramo continuo (sin cortes).

Mejora en esta versión:
- Extrusión Monolítica del Perfil H: Utiliza un barrido lineal de grado 1 
  (Sweep de tramo único) y fusión de caras coplanares (MergeCoplanarFaces) 
  eliminando al 100% las divisiones horizontales intermedias.
- Fondos sólidos Brep de 3 mm de espesor a cota completa.
- Recorte exacto por Deslocamento_Superior y Deslocamento_Inferior.
- Grapas sincronizadas con puntillas (+0.7 mm en Y).
"""

import math
import Rhino.Geometry as rg

# =============================================================================
# 1. FUNCIONES AUXILIARES
# =============================================================================

def normalizar_herraje(valor):
    """Normaliza el nombre del herraje en español o portugués."""
    if not valor:
        return "ninguno"
    v = str(valor).strip().lower()
    if v in ["prego", "puntilla", "clavo"]:
        return "prego"
    if v in ["parafuso", "tornillo"]:
        return "parafuso"
    if v in ["grampo", "grapa"]:
        return "grampo"
    if v in ["perfil", "perfil_h", "perfil h"]:
        return "perfil"
    return "ninguno"

def calcular_puntos_equidistantes(p_ini, p_fin, paso_nominal=100.0, min_paso=80.0, max_paso=120.0):
    """Distribuye puntos de esquina a esquina con tolerancia de 80 a 120 mm."""
    vector_linea = rg.Vector3d(p_fin - p_ini)
    longitud = vector_linea.Length
    
    if longitud < 1.0:
        return [p_ini]
    
    num_div = int(round(longitud / paso_nominal))
    if num_div < 1:
        num_div = 1
        
    paso = longitud / float(num_div)
    while paso > max_paso:
        num_div += 1
        paso = longitud / float(num_div)
        
    while paso < min_paso and num_div > 1:
        nuevo_paso = longitud / float(num_div - 1)
        if nuevo_paso <= max_paso:
            num_div -= 1
            paso = nuevo_paso
        else:
            break
            
    puntos = []
    vector_unitario = rg.Vector3d(vector_linea)
    vector_unitario.Unitize()
    
    for i in range(num_div + 1):
        dist = i * paso
        pt = p_ini + (vector_unitario * dist)
        puntos.append(pt)
        
    return puntos

def instanciar_geometria(geometria, pt_origen, pt_destino):
    """Clona y traslada una malla o brep hacia el punto destino."""
    if not geometria or not pt_destino:
        return None
    if not pt_origen:
        bbox = geometria.GetBoundingBox(True)
        pt_origen = bbox.Center
    vector_traslacion = rg.Vector3d(pt_destino - pt_origen)
    transformacion = rg.Transform.Translation(vector_traslacion)
    geo_copia = geometria.Duplicate()
    geo_copia.Transform(transformacion)
    return geo_copia

def extruir_perfil_nurbs(curva_base, pt_ref, pt_inicio, pt_fin):
    """
    Extruye la sección 2D a lo largo de un carril directo de grado 1, garantizando
    que el sólido Brep sea de una sola sección monolítica sin cortes horizontales.
    """
    if not curva_base or not pt_inicio or not pt_fin:
        return None
        
    # 1. Unificar curvas si entra como lista o segmentos separados
    if isinstance(curva_base, (list, tuple)):
        curvas_unidas = rg.Curve.JoinCurves(curva_base)
        c_work = curvas_unidas[0] if curvas_unidas and len(curvas_unidas) > 0 else curva_base[0]
    else:
        c_work = curva_base

    if not pt_ref:
        bbox = c_work.GetBoundingBox(True)
        pt_ref = bbox.Center

    # 2. Trasladar curva al punto inicial superior del perfil
    vec_tras = rg.Vector3d(pt_inicio - pt_ref)
    xform = rg.Transform.Translation(vec_tras)
    curva_pos = c_work.DuplicateCurve()
    curva_pos.Transform(xform)

    # 3. Vector y carril lineal directo de grado 1 (1 tramo único de punta a punta)
    vec_ext = rg.Vector3d(pt_fin - pt_inicio)
    if vec_ext.Length < 1.0:
        return None

    linea_carril = rg.Line(pt_inicio, pt_fin).ToNurbsCurve()
    
    solido = None
    # Intento 1: Barrido de 1 tramo único (CreateFromSweep)
    try:
        barridos = rg.Brep.CreateFromSweep(linea_carril, curva_pos, True, 0.01)
        if barridos and len(barridos) > 0:
            solido = barridos[0]
    except:
        pass

    # Intento 2: Si el sweep no se ejecutó, usar extrusión directa
    if not solido:
        srf_ext = rg.Surface.CreateExtrusion(curva_pos, vec_ext)
        if srf_ext:
            solido = srf_ext.ToBrep()

    if solido:
        # Tapar los extremos si están abiertos
        if not solido.IsSolid:
            solido_cerrado = solido.CapPlanarHoles(0.01)
            if solido_cerrado and solido_cerrado.IsValid:
                solido = solido_cerrado
                
        # Fusión estricta de caras coplanares para eliminar cualquier subdivisión residual
        solido.MergeCoplanarFaces(0.01)
        solido.Compact()
        return solido

    return None

# =============================================================================
# 2. INICIALIZACION DE SALIDAS
# =============================================================================

Fondos = []
Prego = []
Parafuso = []
Grampo = []
Perfil = []

# =============================================================================
# 3. PROCESAMIENTO GEOMETRICO
# =============================================================================

if not Point_A or not Point_B or not Point_C:
    print("ERROR: Se requieren Point_A, Point_B y Point_C para ejecutar 3BF Costas v0.1.")
else:
    # 1. Medidas estructurales del vano del mueble
    ancho_vano = Point_A.DistanceTo(Point_B)
    alto_vano = Point_B.DistanceTo(Point_C)
    espesor_fondo = 3.0  # Espesor estándar de 3 mm para fondos HDF/MDF

    # 2. Desplazamientos exclusivos para el Perfil H
    despl_sup = float(Deslocamento_Superior) if 'Deslocamento_Superior' in globals() and Deslocamento_Superior is not None else 0.0
    despl_inf = float(Deslocamento_Inferior) if 'Deslocamento_Inferior' in globals() and Deslocamento_Inferior is not None else 0.0

    val_esp = float(Espaciado) if 'Espaciado' in globals() and Espaciado is not None else 100.0
    paso_nom = 100.0 if val_esp < 50.0 else val_esp

    # 3. Clasificación de cantidad de fondos
    if ancho_vano <= 475.0:
        num_fondos = 1
    elif ancho_vano <= 950.0:
        num_fondos = 2
    else:
        num_fondos = 4

    # Vectores directores locales del espaldar
    vec_X = rg.Vector3d(Point_B - Point_A)
    vec_X.Unitize()
    vec_Y = rg.Vector3d(Point_B - Point_C)
    vec_Y.Unitize()  # Apunta hacia arriba (desde C hacia B)
    vec_Z = rg.Vector3d.CrossProduct(vec_X, vec_Y)
    vec_Z.Unitize()  # Normal perpendicular

    # 4. Creación de los Fondos como Sólidos NURBS (Brep) de 3 mm
    ancho_fondo = ancho_vano / float(num_fondos)
    alto_fondo = alto_vano

    datos_fondos = []
    for i in range(num_fondos):
        x_ini = i * ancho_fondo
        x_fin = (i + 1) * ancho_fondo

        p_TL = Point_A + (vec_X * x_ini)
        p_TR = Point_A + (vec_X * x_fin)
        p_BR = p_TR - (vec_Y * alto_fondo)
        p_BL = p_TL - (vec_Y * alto_fondo)

        plano_local = rg.Plane(p_BL, vec_X, vec_Y)
        caja = rg.Box(
            plano_local,
            rg.Interval(0.0, ancho_fondo),
            rg.Interval(0.0, alto_fondo),
            rg.Interval(0.0, espesor_fondo)
        )
        brep_solido = caja.ToBrep()
        if brep_solido and brep_solido.IsValid:
            Fondos.append(brep_solido)

        datos_fondos.append({
            "TL": p_TL, "TR": p_TR, "BR": p_BR, "BL": p_BL
        })

    p_TL_global = datos_fondos[0]["TL"]
    p_TR_global = datos_fondos[-1]["TR"]
    p_BR_global = datos_fondos[-1]["BR"]
    p_BL_global = datos_fondos[0]["BL"]

    # 5. Mapeo de Herrajes y Tipos de Borde
    tipo_X = normalizar_herraje(Borde_X if 'Borde_X' in globals() else None) # Superior
    tipo_Y = normalizar_herraje(Borde_Y if 'Borde_Y' in globals() else None) # Inferior
    tipo_A = normalizar_herraje(Borde_A if 'Borde_A' in globals() else None)
    tipo_B = normalizar_herraje(Borde_B if 'Borde_B' in globals() else None)
    tipo_C = normalizar_herraje(Borde_C if 'Borde_C' in globals() else None)
    tipo_D = normalizar_herraje(Borde_D if 'Borde_D' in globals() else None)
    tipo_E = normalizar_herraje(Borde_E if 'Borde_E' in globals() else None)

    curva_perfil_in = globals().get('Curva_Perfil') or globals().get('Malla_Perfil')
    ref_pt_perfil = globals().get('Point_Perfil')

    def obtener_offset(tipo):
        if tipo == "prego":
            return 3.0
        elif tipo == "parafuso":
            return 7.5
        return 0.0

    lineas_distribucion = []

    # --- BORDE SUPERIOR (Borde_X) ---
    if tipo_X in ["prego", "parafuso"]:
        off = obtener_offset(tipo_X)
        p_ini = p_TL_global + (vec_X * off) - (vec_Y * off)
        p_fin = p_TR_global - (vec_X * off) - (vec_Y * off)
        lineas_distribucion.append((p_ini, p_fin, tipo_X))

    # --- BORDE INFERIOR (Borde_Y) ---
    if tipo_Y in ["prego", "parafuso"]:
        off = obtener_offset(tipo_Y)
        p_ini = p_BL_global + (vec_X * off) + (vec_Y * off)
        p_fin = p_BR_global - (vec_X * off) + (vec_Y * off)
        lineas_distribucion.append((p_ini, p_fin, tipo_Y))

    # --- BORDES VERTICALES SEGUN CANTIDAD DE FONDOS ---
    if num_fondos == 1:
        if tipo_A in ["prego", "parafuso"]:
            off = obtener_offset(tipo_A)
            p_ini = p_BL_global + (vec_X * off) + (vec_Y * off)
            p_fin = p_TL_global + (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_A))
        if tipo_B in ["prego", "parafuso"]:
            off = obtener_offset(tipo_B)
            p_ini = p_BR_global - (vec_X * off) + (vec_Y * off)
            p_fin = p_TR_global - (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_B))

    elif num_fondos == 2:
        if tipo_A in ["prego", "parafuso"]:
            off = obtener_offset(tipo_A)
            p_ini = p_BL_global + (vec_X * off) + (vec_Y * off)
            p_fin = p_TL_global + (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_A))
            
        j_top = Point_A + (vec_X * ancho_fondo)
        j_bot = j_top - (vec_Y * alto_fondo)
        
        if tipo_B == "perfil":
            if curva_perfil_in:
                p_perfil_ini = j_top - (vec_Y * despl_sup)
                p_perfil_fin = j_bot + (vec_Y * despl_inf)
                solido_nurbs = extruir_perfil_nurbs(curva_perfil_in, ref_pt_perfil, p_perfil_ini, p_perfil_fin)
                if solido_nurbs:
                    Perfil.append(solido_nurbs)
        elif tipo_B in ["grampo", "prego", "parafuso"]:
            off = obtener_offset(tipo_B)
            p_ini = j_bot + (vec_Y * (off if off > 0 else 20.0))
            p_fin = j_top - (vec_Y * (off if off > 0 else 20.0))
            lineas_distribucion.append((p_ini, p_fin, tipo_B))
            
        if tipo_C in ["prego", "parafuso"]:
            off = obtener_offset(tipo_C)
            p_ini = p_BR_global - (vec_X * off) + (vec_Y * off)
            p_fin = p_TR_global - (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_C))

    elif num_fondos == 4:
        if tipo_A in ["prego", "parafuso"]:
            off = obtener_offset(tipo_A)
            p_ini = p_BL_global + (vec_X * off) + (vec_Y * off)
            p_fin = p_TL_global + (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_A))
            
        tipos_junturas = [tipo_B, tipo_C, tipo_D]
        for idx_j, t_junt in enumerate(tipos_junturas, start=1):
            j_top = Point_A + (vec_X * (idx_j * ancho_fondo))
            j_bot = j_top - (vec_Y * alto_fondo)
            
            if t_junt == "perfil":
                if curva_perfil_in:
                    p_perfil_ini = j_top - (vec_Y * despl_sup)
                    p_perfil_fin = j_bot + (vec_Y * despl_inf)
                    solido_nurbs = extruir_perfil_nurbs(curva_perfil_in, ref_pt_perfil, p_perfil_ini, p_perfil_fin)
                    if solido_nurbs:
                        Perfil.append(solido_nurbs)
            elif t_junt in ["grampo", "prego", "parafuso"]:
                off = obtener_offset(t_junt)
                p_ini = j_bot + (vec_Y * (off if off > 0 else 20.0))
                p_fin = j_top - (vec_Y * (off if off > 0 else 20.0))
                lineas_distribucion.append((p_ini, p_fin, t_junt))
                
        if tipo_E in ["prego", "parafuso"]:
            off = obtener_offset(tipo_E)
            p_ini = p_BR_global - (vec_X * off) + (vec_Y * off)
            p_fin = p_TR_global - (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_E))

    # =========================================================================
    # 6. DISTRIBUCION Y FILTRO ANTI-DUPLICIDAD EN ESQUINAS
    # =========================================================================
    puntos_con_tipo = []
    for p_ini, p_fin, tipo in lineas_distribucion:
        pts = calcular_puntos_equidistantes(p_ini, p_fin, paso_nominal=paso_nom, min_paso=80.0, max_paso=120.0)
        for p in pts:
            duplicado = False
            for p_existente, _ in puntos_con_tipo:
                if p.DistanceTo(p_existente) < 15.0:
                    duplicado = True
                    break
            if not duplicado:
                puntos_con_tipo.append((p, tipo))

    # =========================================================================
    # 7. ASIGNACION DIRECTA A LAS SALIDAS
    # =========================================================================
    puntillas_en_grapas = 0
    despl_grampo_y = float(Deslocamento_Grampo_Y) if 'Deslocamento_Grampo_Y' in globals() and Deslocamento_Grampo_Y is not None else 0.7
    vector_ajuste_y = rg.Vector3d(0.0, despl_grampo_y, 0.0)

    for pt, tipo in puntos_con_tipo:
        if tipo == "prego" and 'Malla_Prego' in globals() and Malla_Prego:
            pt_ref = Point_Prego if 'Point_Prego' in globals() and Point_Prego else None
            inst = instanciar_geometria(Malla_Prego, pt_ref, pt)
            if inst:
                Prego.append(inst)
                
        elif tipo == "parafuso" and 'Malla_Parafuso' in globals() and Malla_Parafuso:
            pt_ref = Point_Parafuso if 'Point_Parafuso' in globals() and Point_Parafuso else None
            inst = instanciar_geometria(Malla_Parafuso, pt_ref, pt)
            if inst:
                Parafuso.append(inst)
                
        elif tipo == "grampo":
            if 'Malla_Grampo' in globals() and Malla_Grampo:
                pt_ref_g = Point_Grampo if 'Point_Grampo' in globals() and Point_Grampo else None
                inst_g = instanciar_geometria(Malla_Grampo, pt_ref_g, pt)
                if inst_g:
                    Grampo.append(inst_g)
                    
            if 'Malla_Prego' in globals() and Malla_Prego:
                pt_ref_p = Point_Prego if 'Point_Prego' in globals() and Point_Prego else None
                pt_puntilla_grapa = pt + vector_ajuste_y
                inst_p = instanciar_geometria(Malla_Prego, pt_ref_p, pt_puntilla_grapa)
                if inst_p:
                    Prego.append(inst_p)
                    puntillas_en_grapas += 1

    alt_perfil = alto_fondo - despl_sup - despl_inf
    print("3BF Costas v0.1 | Exito")
    print("Vano: {:.1f} x {:.1f} mm | Fondos: {} sólidos NURBS (3mm)".format(ancho_vano, alto_vano, len(Fondos)))
    print("Perfil H -> Longitud: {:.1f} mm (Offset Sup: {:.1f} mm | Inf: {:.1f} mm)".format(alt_perfil, despl_sup, despl_inf))
    print("Herrajes -> Pregos: {} (incluye {} en grapas) | Parafusos: {} | Grampos: {} | Perfiles: {} NURBS Monolítico".format(
        len(Prego), puntillas_en_grapas, len(Parafuso), len(Grampo), len(Perfil)
    ))