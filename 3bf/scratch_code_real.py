# -*- coding: utf-8 -*-
"""
=============================================================================
3BF Costas v0.1 - GENERADOR PARAMETRICO DE FONDOS Y ESPALDARES TRASEROS
=============================================================================
Generación paramétrica de fondos traseros (sólidos Brep 3mm) y herrajes 100% 
unificados en Mallas optimizadas (Prego, Parafuso, Grampo y Perfil H en Malla).

Mejoras Críticas v0.1.1:
1. Normalización tolerante de entradas: Soporta comillas de Value Lists ('"Parafuso"'),
   plurales ('parafusos', 'grampos', 'pregos'), mayúsculas y traducciones PT/ES.
2. Soporte universal de herrajes en todos los bordes: Prego, Parafuso y Grampo
   admitidos uniformemente en Borde_X, Borde_Y, Borde_A..E con offsets industriales.
3. Instanciación robusta de geometrías: Desenvolve GH_Goo (.Value), soporta
   listas de mallas/breps, valida puntos de referencia evitando derivas de Point3d.Unset,
   y calcula automáticamente centroides de cajas delimitadoras cuando se requiere.
4. Salida 'Perfil' en Malla limpia analítica (1 solo quad por cara plana).
5. Sincronización automática de Grapa + Puntilla (Grampo + Prego con offset +0.7mm en Y).
6. Diagnóstico y auditoría en tiempo real en la salida 'out'.
=============================================================================
"""

import math
import Rhino.Geometry as rg

# =============================================================================
# 1. FUNCIONES AUXILIARES DE NORMALIZACION Y VALIDACION
# =============================================================================

def normalizar_herraje(valor):
    """Normaliza el tipo de fijación tolerando comillas, mayúsculas, plurales y tipos GH_String."""
    if valor is None:
        return "ninguno"
    if hasattr(valor, "Value"):
        valor = valor.Value
    v = str(valor).strip().lower().replace('"', '').replace("'", "")
    
    if any(k in v for k in ["1", "prego", "puntilla", "clavo", "nail"]):
        return "prego"
    if any(k in v for k in ["2", "parafuso", "tornillo", "screw"]):
        return "parafuso"
    if any(k in v for k in ["3", "grampo", "grapa", "staple"]):
        return "grampo"
    if any(k in v for k in ["4", "perfil", "h_profile", "perfil_h", "perfil h"]):
        return "perfil"
    if any(k in v for k in ["nada", "ninguno", "nenhum", "none", "false", "0"]):
        return "ninguno"
    return "ninguno"

def es_punto_valido(pt):
    """Verifica si un punto es una instancia válida de Point3d con coordenadas finitas."""
    if pt is None:
        return False
    if hasattr(pt, "Value"):
        pt = pt.Value
    if not hasattr(pt, "X") or not hasattr(pt, "Y") or not hasattr(pt, "Z"):
        return False
    if hasattr(pt, "IsValid") and not pt.IsValid:
        return False
    try:
        x, y, z = float(pt.X), float(pt.Y), float(pt.Z)
        if math.isnan(x) or math.isnan(y) or math.isnan(z):
            return False
        # Descartar coordenadas infinitas de Point3d.Unset (-1.23e308)
        if abs(x) > 1e9 or abs(y) > 1e9 or abs(z) > 1e9:
            return False
        return True
    except:
        return False

def extraer_punto_puro(pt_in):
    """Extrae un rg.Point3d puro desde GH_Point, tuplas o estructuras .NET."""
    if not es_punto_valido(pt_in):
        return None
    if hasattr(pt_in, "Value"):
        pt_in = pt_in.Value
    if isinstance(pt_in, rg.Point3d):
        return pt_in
    try:
        return rg.Point3d(float(pt_in.X), float(pt_in.Y), float(pt_in.Z))
    except:
        return None

def obtener_geometrias_puras(geo_in):
    """Desenvolve recursivamente GH_Goo, listas y tuplas para extraer geometrías puras de Rhino."""
    if geo_in is None:
        return []
    if isinstance(geo_in, (list, tuple)):
        resultado = []
        for elem in geo_in:
            resultado.extend(obtener_geometrias_puras(elem))
        return resultado
    if hasattr(geo_in, "Value"):
        return obtener_geometrias_puras(geo_in.Value)
    return [geo_in]

def instanciar_geometrias(geometria_in, pt_ref_in, pt_destino_in):
    """
    Clona y traslada una o múltiples geometrías hacia el punto destino.
    Si pt_ref_in es None o inválido, calcula automáticamente el centroide de la caja englobante.
    """
    if geometria_in is None or pt_destino_in is None:
        return []
    
    geos = obtener_geometrias_puras(geometria_in)
    if not geos:
        return []
        
    pt_dst = extraer_punto_puro(pt_destino_in)
    if not pt_dst:
        return []
        
    pt_orig = extraer_punto_puro(pt_ref_in)
    if not pt_orig:
        bbox_total = rg.BoundingBox.Empty
        for g in geos:
            try:
                b = g.GetBoundingBox(True)
                if b.IsValid:
                    bbox_total.Union(b)
            except:
                pass
        if bbox_total.IsValid:
            pt_orig = bbox_total.Center
        else:
            pt_orig = rg.Point3d.Origin

    vec_traslacion = rg.Vector3d(pt_dst - pt_orig)
    xform = rg.Transform.Translation(vec_traslacion)
    
    instancias = []
    for g in geos:
        try:
            copia = g.Duplicate()
            copia.Transform(xform)
            instancias.append(copia)
        except:
            pass
    return instancias

def calcular_puntos_equidistantes(p_ini, p_fin, paso_nominal=100.0, min_paso=80.0, max_paso=120.0):
    """Distribuye puntos de esquina a esquina con paso garantizado entre 80 y 120 mm."""
    vector_linea = rg.Vector3d(p_fin - p_ini)
    longitud = vector_linea.Length
    
    if longitud < 1.0:
        return [p_ini]
    
    num_div = max(1, int(round(longitud / paso_nominal)))
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

def extruir_perfil_malla_limpia(curva_base, pt_ref, pt_inicio, pt_fin):
    """
    Extruye la sección 2D con la API analítica de '_ExtrudeCrv' y genera
    directamente una Malla 100% limpia sin divisiones intermedias.
    """
    if not curva_base or not pt_inicio or not pt_fin:
        return None
        
    curvas = obtener_geometrias_puras(curva_base)
    if not curvas:
        return None
        
    if len(curvas) > 1:
        curvas_unidas = rg.Curve.JoinCurves(curvas)
        c_work = curvas_unidas[0] if curvas_unidas and len(curvas_unidas) > 0 else curvas[0]
    else:
        c_work = curvas[0]

    pt_ref_puro = extraer_punto_puro(pt_ref)
    if not pt_ref_puro:
        bbox = c_work.GetBoundingBox(True)
        pt_ref_puro = bbox.Center if bbox.IsValid else rg.Point3d.Origin

    pt_ini_puro = extraer_punto_puro(pt_inicio)
    pt_fin_puro = extraer_punto_puro(pt_fin)
    if not pt_ini_puro or not pt_fin_puro:
        return None

    vec_ext = rg.Vector3d(pt_fin_puro - pt_ini_puro)
    longitud = vec_ext.Length
    if longitud < 1.0:
        return None

    # Trasladar curva al punto inicial superior
    vec_pos = rg.Vector3d(pt_ini_puro - pt_ref_puro)
    c_pos = c_work.DuplicateCurve()
    c_pos.Transform(rg.Transform.Translation(vec_pos))

    solido_brep = None
    try:
        exito, plano_curva = c_pos.TryGetPlane()
        if exito:
            dot = rg.Vector3d.Multiply(vec_ext, plano_curva.Normal)
            altura_firmada = -longitud if dot < 0.0 else longitud
            ext_geom = rg.Extrusion.Create(c_pos, altura_firmada, True)
            if ext_geom:
                solido_brep = ext_geom.ToBrep()
    except:
        pass

    if not solido_brep:
        carril = rg.Line(pt_ini_puro, pt_fin_puro).ToNurbsCurve()
        try:
            barridos = rg.Brep.CreateFromSweep(carril, [c_pos], True, 0.01)
            if barridos and len(barridos) > 0:
                solido_brep = barridos[0]
                if not solido_brep.IsSolid:
                    solido_brep = solido_brep.CapPlanarHoles(0.01)
        except:
            pass

    if solido_brep:
        solido_brep.MergeCoplanarFaces(0.01)
        solido_brep.Compact()

        # Configuración de mallado analítico mínimo (1 quad por cara plana)
        mp = rg.MeshingParameters()
        mp.SimplePlanes = True
        mp.RefineGrid = False
        mp.GridMinCount = 1
        mp.GridMaxCount = 0
        mp.GridAspectRatio = 0.0
        mp.MinimumEdgeLength = 0.0
        mp.MaximumEdgeLength = 0.0

        mallas = rg.Mesh.CreateFromBrep(solido_brep, mp)
        if mallas and len(mallas) > 0:
            malla_final = rg.Mesh()
            for m in mallas:
                malla_final.Append(m)
            malla_final.Weld(math.radians(35.0))
            malla_final.Compact()
            return malla_final

    return None

def obtener_variable(nombre, default=None):
    """Obtiene una variable buscando en globals, locals y con fallback seguro."""
    if nombre in globals() and globals()[nombre] is not None:
        return globals()[nombre]
    try:
        val = eval(nombre)
        if val is not None:
            return val
    except:
        pass
    return default

# =============================================================================
# 2. INICIALIZACION DE SALIDAS (HERRAJES 100% EN MALLA)
# =============================================================================

Fondos = []
Prego = []
Parafuso = []
Grampo = []
Perfil = []  # Malla analítica limpia

# =============================================================================
# 3. PROCESAMIENTO GEOMETRICO
# =============================================================================

pt_A = extraer_punto_puro(obtener_variable('Point_A'))
pt_B = extraer_punto_puro(obtener_variable('Point_B'))
pt_C = extraer_punto_puro(obtener_variable('Point_C'))

if not pt_A or not pt_B or not pt_C:
    print("ERROR [3BF Costas v0.1]: Se requieren Point_A, Point_B y Point_C válidos para ejecutar.")
else:
    # 1. Medidas estructurales del vano del mueble
    ancho_vano = pt_A.DistanceTo(pt_B)
    alto_vano = pt_B.DistanceTo(pt_C)
    espesor_fondo = 3.0

    # 2. Desplazamientos exclusivos para el Perfil H
    raw_sup = obtener_variable('Deslocamento_Superior', 0.0)
    raw_inf = obtener_variable('Deslocamento_Inferior', 0.0)
    despl_sup = float(raw_sup) if raw_sup is not None else 0.0
    despl_inf = float(raw_inf) if raw_inf is not None else 0.0

    raw_esp = obtener_variable('Espaciado', 100.0)
    val_esp = float(raw_esp) if raw_esp is not None else 100.0
    paso_nom = 100.0 if val_esp < 50.0 else val_esp

    # 3. Clasificación de cantidad de fondos
    if ancho_vano <= 475.0:
        num_fondos = 1
    elif ancho_vano <= 950.0:
        num_fondos = 2
    else:
        num_fondos = 4

    vec_X = rg.Vector3d(pt_B - pt_A); vec_X.Unitize()
    vec_Y = rg.Vector3d(pt_B - pt_C); vec_Y.Unitize()
    vec_Z = rg.Vector3d.CrossProduct(vec_X, vec_Y); vec_Z.Unitize()

    # 4. Creación de los Fondos como Sólidos NURBS (Brep) de 3 mm
    ancho_fondo = ancho_vano / float(num_fondos)
    alto_fondo = alto_vano

    datos_fondos = []
    for i in range(num_fondos):
        x_ini = i * ancho_fondo
        x_fin = (i + 1) * ancho_fondo

        p_TL = pt_A + (vec_X * x_ini)
        p_TR = pt_A + (vec_X * x_fin)
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
    tipo_X = normalizar_herraje(obtener_variable('Borde_X')) # Superior
    tipo_Y = normalizar_herraje(obtener_variable('Borde_Y')) # Inferior
    tipo_A = normalizar_herraje(obtener_variable('Borde_A')) # Izquierdo exterior
    tipo_B = normalizar_herraje(obtener_variable('Borde_B'))
    tipo_C = normalizar_herraje(obtener_variable('Borde_C'))
    tipo_D = normalizar_herraje(obtener_variable('Borde_D'))
    tipo_E = normalizar_herraje(obtener_variable('Borde_E')) # Derecho exterior

    curva_perfil_in = obtener_variable('Curva_Perfil') or obtener_variable('Malla_Perfil')
    ref_pt_perfil = obtener_variable('Point_Perfil')

    def obtener_offset_perimetro(tipo):
        """Offsets estandarizados para el borde perimetral del tablero."""
        if tipo == "prego":
            return 3.0
        elif tipo == "parafuso":
            return 7.5
        elif tipo == "grampo":
            return 3.0
        return 0.0

    lineas_distribucion = []

    # --- BORDE SUPERIOR (Borde_X) ---
    if tipo_X in ["prego", "parafuso", "grampo"]:
        off = obtener_offset_perimetro(tipo_X)
        p_ini = p_TL_global + (vec_X * off) - (vec_Y * off)
        p_fin = p_TR_global - (vec_X * off) - (vec_Y * off)
        lineas_distribucion.append((p_ini, p_fin, tipo_X))

    # --- BORDE INFERIOR (Borde_Y) ---
    if tipo_Y in ["prego", "parafuso", "grampo"]:
        off = obtener_offset_perimetro(tipo_Y)
        p_ini = p_BL_global + (vec_X * off) + (vec_Y * off)
        p_fin = p_BR_global - (vec_X * off) + (vec_Y * off)
        lineas_distribucion.append((p_ini, p_fin, tipo_Y))

    # --- BORDES VERTICALES SEGUN CANTIDAD DE FONDOS ---
    if num_fondos == 1:
        if tipo_A in ["prego", "parafuso", "grampo"]:
            off = obtener_offset_perimetro(tipo_A)
            p_ini = p_BL_global + (vec_X * off) + (vec_Y * off)
            p_fin = p_TL_global + (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_A))
        if tipo_B in ["prego", "parafuso", "grampo"]:
            off = obtener_offset_perimetro(tipo_B)
            p_ini = p_BR_global - (vec_X * off) + (vec_Y * off)
            p_fin = p_TR_global - (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_B))

    elif num_fondos == 2:
        if tipo_A in ["prego", "parafuso", "grampo"]:
            off = obtener_offset_perimetro(tipo_A)
            p_ini = p_BL_global + (vec_X * off) + (vec_Y * off)
            p_fin = p_TL_global + (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_A))
            
        j_top = pt_A + (vec_X * ancho_fondo)
        j_bot = j_top - (vec_Y * alto_fondo)
        
        if tipo_B == "perfil":
            if curva_perfil_in:
                p_perfil_ini = j_top - (vec_Y * despl_sup)
                p_perfil_fin = j_bot + (vec_Y * despl_inf)
                malla_perfil = extruir_perfil_malla_limpia(curva_perfil_in, ref_pt_perfil, p_perfil_ini, p_perfil_fin)
                if malla_perfil:
                    Perfil.append(malla_perfil)
        elif tipo_B in ["grampo", "prego", "parafuso"]:
            # Juntura central vertical (offset 20mm de extremos para seguridad de fijación)
            p_ini = j_bot + (vec_Y * 20.0)
            p_fin = j_top - (vec_Y * 20.0)
            lineas_distribucion.append((p_ini, p_fin, tipo_B))
            
        if tipo_C in ["prego", "parafuso", "grampo"]:
            off = obtener_offset_perimetro(tipo_C)
            p_ini = p_BR_global - (vec_X * off) + (vec_Y * off)
            p_fin = p_TR_global - (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_C))

    elif num_fondos == 4:
        if tipo_A in ["prego", "parafuso", "grampo"]:
            off = obtener_offset_perimetro(tipo_A)
            p_ini = p_BL_global + (vec_X * off) + (vec_Y * off)
            p_fin = p_TL_global + (vec_X * off) - (vec_Y * off)
            lineas_distribucion.append((p_ini, p_fin, tipo_A))
            
        tipos_junturas = [tipo_B, tipo_C, tipo_D]
        for idx_j, t_junt in enumerate(tipos_junturas, start=1):
            j_top = pt_A + (vec_X * (idx_j * ancho_fondo))
            j_bot = j_top - (vec_Y * alto_fondo)
            
            if t_junt == "perfil":
                if curva_perfil_in:
                    p_perfil_ini = j_top - (vec_Y * despl_sup)
                    p_perfil_fin = j_bot + (vec_Y * despl_inf)
                    malla_perfil = extruir_perfil_malla_limpia(curva_perfil_in, ref_pt_perfil, p_perfil_ini, p_perfil_fin)
                    if malla_perfil:
                        Perfil.append(malla_perfil)
            elif t_junt in ["grampo", "prego", "parafuso"]:
                p_ini = j_bot + (vec_Y * 20.0)
                p_fin = j_top - (vec_Y * 20.0)
                lineas_distribucion.append((p_ini, p_fin, t_junt))
                
        if tipo_E in ["prego", "parafuso", "grampo"]:
            off = obtener_offset_perimetro(tipo_E)
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

    # Conteo de puntos calculados por categoría
    puntos_calculados = {"prego": 0, "parafuso": 0, "grampo": 0}
    for _, t in puntos_con_tipo:
        if t in puntos_calculados:
            puntos_calculados[t] += 1

    # =========================================================================
    # 7. ASIGNACION E INSTANCIACION ROBUSTA DE HERRAJES
    # =========================================================================
    puntillas_en_grapas = 0
    raw_despl_grampo = obtener_variable('Deslocamento_Grampo_Y', 0.7)
    despl_grampo_y = float(raw_despl_grampo) if raw_despl_grampo is not None else 0.7
    vector_ajuste_y = rg.Vector3d(0.0, despl_grampo_y, 0.0)

    # Ingesta segura de mallas/geometrías de herrajes
    geo_prego = obtener_variable('Malla_Prego')
    pt_ref_prego = obtener_variable('Point_Prego')

    geo_parafuso = obtener_variable('Malla_Parafuso')
    pt_ref_parafuso = obtener_variable('Point_Parafuso')

    geo_grampo = obtener_variable('Malla_Grampo')
    pt_ref_grampo = obtener_variable('Point_Grampo')

    for pt, tipo in puntos_con_tipo:
        if tipo == "prego":
            if geo_prego:
                insts = instanciar_geometrias(geo_prego, pt_ref_prego, pt)
                Prego.extend(insts)
                
        elif tipo == "parafuso":
            if geo_parafuso:
                insts = instanciar_geometrias(geo_parafuso, pt_ref_parafuso, pt)
                Parafuso.extend(insts)
                
        elif tipo == "grampo":
            if geo_grampo:
                insts = instanciar_geometrias(geo_grampo, pt_ref_grampo, pt)
                Grampo.extend(insts)
                    
            # Inyección automática de puntilla asociada a la grapa
            if geo_prego:
                pt_puntilla = pt + vector_ajuste_y
                insts_p = instanciar_geometrias(geo_prego, pt_ref_prego, pt_puntilla)
                Prego.extend(insts_p)
                puntillas_en_grapas += len(insts_p)

    alt_perfil = alto_fondo - despl_sup - despl_inf

    # =========================================================================
    # 8. DIAGNOSTICO Y AUDITORIA EN SALIDA 'out'
    # =========================================================================
    print("3BF Costas v0.1 | Estado: OK")
    print("Vano: {:.1f} x {:.1f} mm | Fondos: {} sólidos NURBS (3mm)".format(ancho_vano, alto_vano, len(Fondos)))
    print("Bordes -> Sup(X): {} | Inf(Y): {} | Izq(A): {} | Junturas(B,C,D): {}, {}, {} | Der(E): {}".format(
        tipo_X, tipo_Y, tipo_A, tipo_B, tipo_C, tipo_D, tipo_E
    ))
    print("Puntos Calculados -> Parafuso: {} | Prego: {} | Grampo: {}".format(
        puntos_calculados["parafuso"], puntos_calculados["prego"], puntos_calculados["grampo"]
    ))
    print("Herrajes Generados -> Parafusos: {} | Pregos: {} (incluye {} en grapas) | Grampos: {} | Perfiles: {} MALLA LIMPIA".format(
        len(Parafuso), len(Prego), puntillas_en_grapas, len(Grampo), len(Perfil)
    ))

    # Alertas proactivas si se configuraron bordes pero faltan mallas
    if puntos_calculados["parafuso"] > 0 and len(Parafuso) == 0:
        print("[ALERTA] Hay {} puntos de Parafuso pero 'Malla_Parafuso' no entrego geometría. Verifica el cable de 'Malla_Parafuso'.".format(puntos_calculados["parafuso"]))
    if puntos_calculados["grampo"] > 0 and len(Grampo) == 0:
        print("[ALERTA] Hay {} puntos de Grampo pero 'Malla_Grampo' no entrego geometría. Verifica el cable de 'Malla_Grampo'.".format(puntos_calculados["grampo"]))
    if puntos_calculados["prego"] > 0 and len(Prego) == 0:
        print("[ALERTA] Hay {} puntos de Prego pero 'Malla_Prego' no entrego geometría. Verifica el cable de 'Malla_Prego'.".format(puntos_calculados["prego"]))
