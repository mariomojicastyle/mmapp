import bpy
import re
from mathutils import Vector

# ==========================================
# CONFIGURACIÓN DEL SCRIPT
# ==========================================

NUMERACION_AUTOMATICA = True
UMBRAL_CENTROS = 0.02 
PALABRAS_IGNORADAS = ["mdp", "balance"]

# ==========================================
# FUNCIONES DE UTILIDAD
# ==========================================

def get_mesh_center(obj):
    if not obj or obj.type != 'MESH':
        return None
    bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center = sum(bbox_corners, Vector()) / 8.0
    return center

def es_nombre_principal(nombre):
    nombre_lower = nombre.lower()
    for ignorar in PALABRAS_IGNORADAS:
        if ignorar in nombre_lower:
            return False
    return True

def determinar_nombre_base(nombres_en_grupo):
    candidatos = [n for n in nombres_en_grupo if es_nombre_principal(n)]
    if candidatos:
        return min(candidatos, key=len)
    return "Pieza_Desconocida"

# ==========================================
# LÓGICA PRINCIPAL
# ==========================================

def ejecutar_cohesion():
    print("\n--- INICIANDO COHESIÓN ESPACIAL OPTIMIZADA V11 ---")
    
    mallas = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.hide_get()]
    bpy.ops.object.select_all(action='DESELECT')
    
    if not mallas:
        print("No se encontraron mallas para procesar.")
        return

    grupos_fisicos = []
    mallas_pendientes = set(mallas)
    
    print(f"Calculando proximidad para {len(mallas)} mallas...")
    while mallas_pendientes:
        actual = mallas_pendientes.pop()
        centro_actual = get_mesh_center(actual)
        
        grupo = [actual]
        vecinos_a_remover = []
        for otra in mallas_pendientes:
            centro_otra = get_mesh_center(otra)
            if centro_actual and centro_otra:
                distancia = (centro_actual - centro_otra).length
                if distancia <= UMBRAL_CENTROS:
                    grupo.append(otra)
                    vecinos_a_remover.append(otra)
        
        for vecino in vecinos_a_remover:
            mallas_pendientes.remove(vecino)
            
        grupos_fisicos.append(grupo)

    print(f"Se identificaron {len(grupos_fisicos)} piezas físicas distintas en el espacio.")

    piezas_finales_dict = {}

    for idx, grupo in enumerate(grupos_fisicos):
        nombres_capas = [obj.name.split('.')[0] for obj in grupo]
        nombre_base = determinar_nombre_base(nombres_capas)
        
        # CORRECCIÓN DE LÓGICA V11:
        # Si NO tiene el indicador "_", limpiamos cualquier número residual que Grasshopper haya dejado al final
        # (Ej: "Cubierta 1" pasa a ser "Cubierta"). Así todas las cubiertas se agrupan juntas y se numeran secuencialmente.
        es_identica = nombre_base.startswith("_")
        if not es_identica:
            nombre_base = re.sub(r'[\s\-]*\d+$', '', nombre_base).strip()
        else:
            # Si es idéntica, solo le quitamos el guion bajo inicial
            nombre_base = nombre_base[1:].strip()
            
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
        centro_final = get_mesh_center(obj_unido)
        
        if nombre_base not in piezas_finales_dict:
            piezas_finales_dict[nombre_base] = []
        piezas_finales_dict[nombre_base].append({"obj": obj_unido, "centro": centro_final, "identica": es_identica})

    print("Unión de mallas completada.")

    print("\n--- APLICANDO NOMENCLATURA ---")
    
    for nombre_base, lista_piezas in piezas_finales_dict.items():
        lista_piezas.sort(key=lambda item: item["centro"].z if item["centro"] else 0)
        
        # Como todas las piezas en esta lista comparten si son idénticas o no (por el nombre_base)
        es_identica = lista_piezas[0]["identica"]
        
        for i, info in enumerate(lista_piezas):
            obj = info["obj"]
            
            if NUMERACION_AUTOMATICA and not es_identica:
                nuevo_nombre = f"{nombre_base}-{i+1}"
            else:
                nuevo_nombre = nombre_base
                
            obj.name = nuevo_nombre
            obj.data.name = nuevo_nombre
            print(f"✅ Pieza final nombrada: {nuevo_nombre} (Malla: {obj.name})")

    print("\n✅ SCRIPT V11 FINALIZADO CON ÉXITO.")
    bpy.ops.object.select_all(action='DESELECT')

ejecutar_cohesion()
