import bpy
import re
from mathutils import Vector

# ==========================================
# CONFIGURACIÓN DEL SCRIPT
# ==========================================

NUMERACION_AUTOMATICA = True
UMBRAL_CENTROS = 0.03 
PALABRAS_IGNORADAS = ["mdp", "balance"]
PREFIJO_PADRE = "Pieza "

HERRAJES_KEYWORDS = ["tarugo", "tornillo", "tuerca", "soporte", "puntilla", "grapa", "deslizador", "perfil", "corredera", "bisagra", "caja", "perno"]

# ==========================================
# FUNCIONES DE UTILIDAD
# ==========================================

def get_mesh_center(obj):
    if not obj or obj.type != 'MESH':
        return None
    bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center = sum(bbox_corners, Vector()) / 8.0
    return center

def get_dimensions(obj):
    if not obj or obj.type != 'MESH':
        return (0.0, 0.0, 0.0)
    dims = [round(d, 3) for d in obj.dimensions]
    dims.sort() 
    return tuple(dims)

def es_nombre_principal(nombre):
    nombre_lower = nombre.lower()
    for ignorar in PALABRAS_IGNORADAS:
        if ignorar in nombre_lower:
            return False
    return True

def es_herraje(nombre_base):
    nombre_lower = nombre_base.lower()
    for kw in HERRAJES_KEYWORDS:
        if kw in nombre_lower:
            return True
    return False

def determinar_nombre_base(nombres_en_grupo):
    herrajes = [n for n in nombres_en_grupo if es_herraje(n)]
    if herrajes:
        return min(herrajes, key=len)
        
    candidatos = [n for n in nombres_en_grupo if es_nombre_principal(n)]
    if candidatos:
        return min(candidatos, key=len)
        
    return "Pieza_Desconocida"

def bbox_overlap(obj1, obj2, margin=0.01):
    bb1 = [obj1.matrix_world @ Vector(corner) for corner in obj1.bound_box]
    bb2 = [obj2.matrix_world @ Vector(corner) for corner in obj2.bound_box]
    
    min1 = Vector((min(v.x for v in bb1), min(v.y for v in bb1), min(v.z for v in bb1)))
    max1 = Vector((max(v.x for v in bb1), max(v.y for v in bb1), max(v.z for v in bb1)))
    
    min2 = Vector((min(v.x for v in bb2), min(v.y for v in bb2), min(v.z for v in bb2)))
    max2 = Vector((max(v.x for v in bb2), max(v.y for v in bb2), max(v.z for v in bb2)))
    
    min1 -= Vector((margin, margin, margin))
    max1 += Vector((margin, margin, margin))
    
    return (min1.x <= max2.x and max1.x >= min2.x and
            min1.y <= max2.y and max1.y >= min2.y and
            min1.z <= max2.z and max1.z >= min2.z)

def bbox_contains(obj_main, obj_sub, margin=0.01):
    bb_main = [obj_main.matrix_world @ Vector(corner) for corner in obj_main.bound_box]
    bb_sub = [obj_sub.matrix_world @ Vector(corner) for corner in obj_sub.bound_box]
    
    min_m = Vector((min(v.x for v in bb_main), min(v.y for v in bb_main), min(v.z for v in bb_main)))
    max_m = Vector((max(v.x for v in bb_main), max(v.y for v in bb_main), max(v.z for v in bb_main)))
    
    min_s = Vector((min(v.x for v in bb_sub), min(v.y for v in bb_sub), min(v.z for v in bb_sub)))
    max_s = Vector((max(v.x for v in bb_sub), max(v.y for v in bb_sub), max(v.z for v in bb_sub)))
    
    min_m -= Vector((margin, margin, margin))
    max_m += Vector((margin, margin, margin))
    
    return (min_s.x >= min_m.x and max_s.x <= max_m.x and
            min_s.y >= min_m.y and max_s.y <= max_m.y and
            min_s.z >= min_m.z and max_s.z <= max_m.z)

def bbox_combined_dimensions(obj1, obj2):
    bb1 = [obj1.matrix_world @ Vector(corner) for corner in obj1.bound_box]
    bb2 = [obj2.matrix_world @ Vector(corner) for corner in obj2.bound_box]
    
    all_corners = bb1 + bb2
    min_v = Vector((min(v.x for v in all_corners), min(v.y for v in all_corners), min(v.z for v in all_corners)))
    max_v = Vector((max(v.x for v in all_corners), max(v.y for v in all_corners), max(v.z for v in all_corners)))
    
    dims = max_v - min_v
    return tuple(sorted([dims.x, dims.y, dims.z]))

def forman_paralelepipedo(obj1, obj2):
    dim_comb = bbox_combined_dimensions(obj1, obj2)
    dim1 = tuple(sorted(obj1.dimensions))
    dim2 = tuple(sorted(obj2.dimensions))
    
    max_grosor_original = max(dim1[0], dim2[0])
    if dim_comb[0] > max_grosor_original + 0.005: 
        return False
        
    def match_2_largest(d_main, d_test):
        return (abs(d_main[1] - d_test[1]) <= 0.02 and 
                abs(d_main[2] - d_test[2]) <= 0.02)
                
    return match_2_largest(dim_comb, dim1) or match_2_largest(dim_comb, dim2)

def hacer_doble_cara(obj):
    if not obj or obj.type != 'MESH':
        return
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
        
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    try:
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.duplicate()
        bpy.ops.mesh.flip_normals()
        bpy.ops.object.mode_set(mode='OBJECT')
    except Exception as e:
        print(f"No se pudo hacer doble cara a {obj.name}: {e}")
        if bpy.context.object.mode != 'OBJECT':
            bpy.ops.object.mode_set(mode='OBJECT')

def desactivar_backface_culling():
    print("--- DESACTIVANDO BACKFACE CULLING EN MATERIALES ---")
    for mat in bpy.data.materials:
        try:
            mat.use_backface_culling = False
        except:
            pass
        try:
            # En Blender >= 4.2 el flag específico de cámara es este
            mat.use_backface_culling_camera = False
        except:
            pass

# ==========================================
# LÓGICA PRINCIPAL
# ==========================================

def ejecutar_cohesion():
    print("\n--- INICIANDO COHESIÓN ESPACIAL V30 (DETECCIÓN ROBUSTA DE GRUPOS) ---")
    
    mallas = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.hide_get()]
    bpy.ops.object.select_all(action='DESELECT')
    
    if not mallas:
        print("No se encontraron mallas para procesar.")
        return

    grupos_fisicos = []
    mallas_pendientes = set(mallas)
    
    # ---------------------------------------------------------
    # FASE 1: RECONSTRUCCIÓN DE HERRAJES
    # ---------------------------------------------------------
    herrajes_iniciales = [m for m in mallas_pendientes if es_herraje(m.name.split('.')[0])]
    for actual in herrajes_iniciales:
        if actual not in mallas_pendientes:
            continue
            
        mallas_pendientes.remove(actual)
        grupo = [actual]
        vecinos_a_remover = []
        nombre_base_actual = actual.name.split('.')[0].strip()
        
        for otra in mallas_pendientes:
            nombre_otra = otra.name.split('.')[0].strip().lower()
            if nombre_otra.startswith("mesh") or otra.name.split('.')[0].strip() == nombre_base_actual:
                if bbox_overlap(actual, otra, margin=0.02):
                    grupo.append(otra)
                    vecinos_a_remover.append(otra)
                    
        for v in vecinos_a_remover:
            mallas_pendientes.remove(v)
            
        grupos_fisicos.append(grupo)

    # ---------------------------------------------------------
    # FASE 2: COHESIÓN DE LÁMINAS POR CENTRO + FILTRO GEOMÉTRICO
    # ---------------------------------------------------------
    while mallas_pendientes:
        actual = mallas_pendientes.pop()
        grupo = [actual]
        vecinos_a_remover = []
        
        for otra in mallas_pendientes:
            c1 = get_mesh_center(actual)
            c2 = get_mesh_center(otra)
            if c1 and c2 and (c1 - c2).length <= UMBRAL_CENTROS:
                if forman_paralelepipedo(actual, otra):
                    grupo.append(otra)
                    vecinos_a_remover.append(otra)
                
        for v in vecinos_a_remover:
            mallas_pendientes.remove(v)
            
        grupos_fisicos.append(grupo)

    # ---------------------------------------------------------
    # FASE 3: ABSORCIÓN INTELIGENTE DE RECORTES Y PARCHES
    # ---------------------------------------------------------
    grupos_finales = []
    huerfanos = []
    
    for g in grupos_fisicos:
        nombre_g = g[0].name.split('.')[0]
        dims_g = get_dimensions(g[0])
        es_parche_2d = dims_g[0] <= 0.002 
        es_plano_cero = dims_g[0] <= 0.0001
        
        if len(g) == 1 and (not es_nombre_principal(nombre_g) or es_parche_2d) and not es_herraje(nombre_g):
            if es_plano_cero:
                hacer_doble_cara(g[0])
            huerfanos.append(g[0])
        else:
            grupos_finales.append(g)
            
    for h in huerfanos:
        c_h = get_mesh_center(h)
        nombre_base_h = h.name.split('.')[0].strip()
        candidatos = []
        
        for g in grupos_finales:
            nombre_grupo = determinar_nombre_base([obj.name.split('.')[0] for obj in g])
            
            if es_herraje(nombre_grupo):
                continue
                
            # ¡CLAVE! Seleccionar la malla más gruesa del grupo para hacer el bounding box.
            # Evita probar contra una "Cara" 2D que daría falsos negativos en bbox_contains.
            principal = max(g, key=lambda obj: get_dimensions(obj)[0])
            
            # Solo aplicamos overlap tolerante si los nombres coinciden Y son nombres principales
            if es_nombre_principal(nombre_base_h) and nombre_grupo == nombre_base_h:
                toca = bbox_overlap(principal, h, margin=0.015)
            else:
                # Si el huérfano es anónimo (ej. "MDP") usamos contains con margen de 10mm.
                # 10mm atrapa desfaces leves pero evita invadir el Paral (que está a ~13mm)
                toca = bbox_contains(principal, h, margin=0.01)
                
            if toca:
                c_g = get_mesh_center(principal)
                dist = (c_h - c_g).length if c_h and c_g else 999
                candidatos.append({"grupo": g, "nombre_base": nombre_grupo, "distancia": dist})
                
        if candidatos:
            coincidencias_nombre = [c for c in candidatos if c["nombre_base"] == nombre_base_h]
            if coincidencias_nombre:
                mejor = min(coincidencias_nombre, key=lambda x: x["distancia"])
                mejor["grupo"].append(h)
            else:
                mejor = min(candidatos, key=lambda x: x["distancia"])
                mejor["grupo"].append(h)
        else:
            grupos_finales.append([h])

    # ---------------------------------------------------------
    # FASE 4: FUSIÓN Y NOMENCLATURA
    # ---------------------------------------------------------
    piezas_finales_dict = {}

    for idx, grupo in enumerate(grupos_finales):
        nombres_capas = [obj.name.split('.')[0] for obj in grupo]
        nombre_base = determinar_nombre_base(nombres_capas)
        
        es_identica = nombre_base.startswith("_")
        if not es_identica:
            nombre_base = re.sub(r'[\s\-]*\d+$', '', nombre_base).strip()
        else:
            nombre_base = nombre_base.strip() # Preservar el guion bajo
            
        bpy.ops.object.select_all(action='DESELECT')
        activo = grupo[0]
        for obj in grupo:
            obj.select_set(True)
            if es_nombre_principal(obj.name):
                activo = obj
                
        bpy.context.view_layer.objects.active = activo
        
        if len(grupo) > 1:
            try:
                bpy.ops.object.join()
            except RuntimeError as e:
                print(f"Error uniendo grupo {nombre_base}: {e}")
                continue
        
        obj_unido = bpy.context.view_layer.objects.active
        
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
        
        centro_final = get_mesh_center(obj_unido)
        dims_finales = get_dimensions(obj_unido)
        
        if nombre_base not in piezas_finales_dict:
            piezas_finales_dict[nombre_base] = []
        piezas_finales_dict[nombre_base].append({"obj": obj_unido, "centro": centro_final, "identica": es_identica, "dims": dims_finales})

    print("\n--- APLICANDO NOMENCLATURA INTELIGENTE ---")
    
    contador_global = 1
    
    for nombre_base, lista_piezas in piezas_finales_dict.items():
        lista_piezas.sort(key=lambda item: item["centro"].z if item["centro"] else 0)
        es_identica = lista_piezas[0]["identica"]
        
        modo_herraje = es_herraje(nombre_base)
        
        if not modo_herraje and es_identica:
            nombre_padre_identicas = f"{PREFIJO_PADRE}{contador_global:02d}"
            contador_global += 1
            
        for i, info in enumerate(lista_piezas):
            obj = info["obj"]
            
            nombre_limpio_hijo = nombre_base[1:] if es_identica else nombre_base
            
            if NUMERACION_AUTOMATICA and not es_identica:
                nombre_logico = f"{nombre_limpio_hijo}-{i+1}"
            else:
                nombre_logico = nombre_limpio_hijo
                
            if modo_herraje:
                obj.name = nombre_logico
                obj.data.name = nombre_logico
                print(f"🔩 Herraje - Padre: {obj.name} | Hijo: {obj.data.name}")
            else:
                if es_identica:
                    obj.name = nombre_padre_identicas
                else:
                    obj.name = f"{PREFIJO_PADRE}{contador_global:02d}"
                    contador_global += 1
                    
                obj.data.name = nombre_logico
                print(f"🪵 Lámina  - Padre: {obj.name} | Hijo: {obj.data.name}")

    desactivar_backface_culling()

    print("\n✅ SCRIPT V34 FINALIZADO.")
    bpy.ops.object.select_all(action='DESELECT')

ejecutar_cohesion()
