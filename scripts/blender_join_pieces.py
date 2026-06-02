import bpy
import re
import mathutils

# ===================================================================
# SCRIPT V5: UNIFICACIÓN DE PIEZAS DE MADERA PARA MANUAL DINÁMICO 3D
# ===================================================================
# Usa SUPERPOSICIÓN VOLUMÉTRICA 3D para asignar MDP a su tablero.
# Dos piezas del mismo sándwich (lámina + MDP + balance) comparten
# volumen en las 3 dimensiones. Piezas de otros tableros ubicadas
# en otra posición del mueble tendrán volumen compartido = 0.
# ===================================================================

# --- CONFIGURACIÓN ---

HERRAJES = [
    "CORREDERA", "TORNILLO", "DESLIZADOR", "BISAGRA",
    "MANIJA", "CERRADURA", "TARUGO", "CLAVO", "PUNTILLA",
]
GENERICOS = ["MDP", "MDF"]
SUFIJOS = ["balance", "balanceo", "tapa", "canto", "laminado"]

# Umbral de superposición volumétrica: qué fracción del volumen del MDP
# debe estar contenida dentro del bbox de la pieza para considerarlo match.
# Lo bajamos a 0.01 (1%) para que fusione incluso si el área de contacto es pequeña,
# ya que el margen negativo de 2mm impide que se fusione con piezas vecinas.
UMBRAL_VOLUMEN = 0.1


# --- FUNCIONES ---

def es_herraje(nombre):
    nombre_upper = nombre.upper()
    # Limpiar sufijos de Blender (ej: .001) para evaluar nombre base
    base = re.sub(r'\.\d{3}$', '', nombre_upper).strip()
    
    if base.startswith("TAPALUZ"):
        return False
    elif base.startswith("CAJA") or base.startswith("PUNTILLA"):
        return True
    else:
        # Palabras clave robustas de herrajes
        palabras_herraje = [
            "TORNILLO", "PERNO", "TARUGO", "BISAGRA", "DESLIZADOR", 
            "CORREDERA", "SOPORTE", "CLAVO", "TAPA", "MINIFIX", 
            "CAMA", "PERFIL", "REGULA", "PATIN", "PIVOTE", "TUERCA", 
            "ARANDELA", "JALADERA", "TIRADOR", "PIJA", "ANGULO", 
            "UNION", "MENSULA", "MARIPOSA"
        ]
        return any(h in base for h in palabras_herraje)


def es_generico(nombre):
    base = re.sub(r'\.\d{3}$', '', nombre).strip().upper()
    return any(base == g or base.startswith(g + ".") or base.startswith(g + "_") for g in GENERICOS)


def limpiar_nombre_base(nombre):
    # 1. Eliminar sufijos de instancia típicos de Rhino/Blender (.001, _001, 001)
    limpio = re.sub(r'[._]?0\d\d$', '', nombre)
    limpio = re.sub(r'[\s_]+[1-9]\d*$', '', limpio) # remueve _1,  1, _2,  2 y variantes con espacio
    
    # 2. Eliminar palabras reservadas como balance, tapa, etc. (soporta espacios o guiones bajos)
    for suf in SUFIJOS:
        patron = re.compile(r'[\s_]+' + re.escape(suf) + r'$', re.IGNORECASE)
        limpio = patron.sub('', limpio)
        
    # Limpieza final de guiones bajos o espacios residuales
    limpio = re.sub(r'[\s_]+$', '', limpio)
    return limpio.strip()


def limpiar_para_subgrupo(nombre):
    # Conserva el sufijo .001 de Blender pero elimina "balance", etc.
    # Ejemplo: "Frente de cajon balance.001" -> "Frente de cajon.001"
    limpio = nombre
    sufijo_blender = ""
    match = re.search(r'\.\d{3}$', limpio)
    if match:
        sufijo_blender = match.group(0)
        limpio = limpio[:-4]
        
    for suf in SUFIJOS:
        patron = re.compile(r'\s+' + re.escape(suf) + r'$', re.IGNORECASE)
        limpio = patron.sub('', limpio)
        
    return limpio.strip() + sufijo_blender


def generar_nombre_numerado(base, idx):
    # Si la base termina en un espacio seguido de un número, reemplazamos ese número con el índice
    # Ejemplo: "Cubierta 1" con idx=2 -> "Cubierta 2"
    # Ejemplo: "Lateral derecho 1" con idx=3 -> "Lateral derecho 3"
    match = re.search(r'\s+(\d+)$', base)
    if match:
        numero_existente = match.group(1)
        return base[:-len(numero_existente)] + str(idx)
    else:
        # Si no tiene número, lo añadimos
        # Ejemplo: "Frente de cajon" con idx=1 -> "Frente de cajon 1"
        return f"{base} {idx}"


def obtener_bbox_mundo(obj):
    bbox = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    mins = mathutils.Vector((
        min(b[0] for b in bbox), min(b[1] for b in bbox), min(b[2] for b in bbox)
    ))
    maxs = mathutils.Vector((
        max(b[0] for b in bbox), max(b[1] for b in bbox), max(b[2] for b in bbox)
    ))
    return mins, maxs


def volumen_bbox(obj):
    """Volumen del bounding box de un objeto."""
    mn, mx = obtener_bbox_mundo(obj)
    return max(0, mx.x - mn.x) * max(0, mx.y - mn.y) * max(0, mx.z - mn.z)


def volumen_interseccion(obj_a, obj_b):
    """Volumen de la intersección de los bounding boxes de dos objetos."""
    min_a, max_a = obtener_bbox_mundo(obj_a)
    min_b, max_b = obtener_bbox_mundo(obj_b)

    # Intersección en cada eje
    ix = max(0, min(max_a.x, max_b.x) - max(min_a.x, min_b.x))
    iy = max(0, min(max_a.y, max_b.y) - max(min_a.y, min_b.y))
    iz = max(0, min(max_a.z, max_b.z) - max(min_a.z, min_b.z))

    return ix * iy * iz


def obtener_bbox_mundo_expandido_inteligente(obj, margen_espesor=0.04, margen_otros=0.005):
    """
    Calcula las coordenadas min/max del bbox en el espacio del mundo.
    - Expande por un margen positivo (margen_espesor) en el eje más delgado (el espesor de la tabla).
    - Aplica un margen positivo (margen_otros) en los otros dos ejes para garantizar que
      las piezas adyacentes y sus recubrimientos (cantos, laminados) se solapen adecuadamente.
    """
    bbox = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    mn = mathutils.Vector((min(b[0] for b in bbox), min(b[1] for b in bbox), min(b[2] for b in bbox)))
    mx = mathutils.Vector((max(b[0] for b in bbox), max(b[1] for b in bbox), max(b[2] for b in bbox)))
    
    # Tamaños en cada eje
    dx = mx.x - mn.x
    dy = mx.y - mn.y
    dz = mx.z - mn.z
    
    # Identificar el eje más delgado (espesor de la tabla)
    min_dim = min(dx, dy, dz)
    
    # Aplicar márgenes diferenciados
    mx_margen = mathutils.Vector((margen_otros, margen_otros, margen_otros))
    if dx == min_dim:
        mx_margen.x = margen_espesor
    elif dy == min_dim:
        mx_margen.y = margen_espesor
    else:
        mx_margen.z = margen_espesor
        
    mins = mathutils.Vector((mn.x - mx_margen.x, mn.y - mx_margen.y, mn.z - mx_margen.z))
    maxs = mathutils.Vector((mx.x + mx_margen.x, mx.y + mx_margen.y, mx.z + mx_margen.z))
    
    return mins, maxs


def volumen_interseccion_expandido_inteligente(obj_a, obj_b):
    """Calcula el volumen de intersección utilizando bounding boxes expandidos de forma inteligente."""
    min_a, max_a = obtener_bbox_mundo_expandido_inteligente(obj_a)
    min_b, max_b = obtener_bbox_mundo_expandido_inteligente(obj_b)

    ix = max(0, min(max_a.x, max_b.x) - max(min_a.x, min_b.x))
    iy = max(0, min(max_a.y, max_b.y) - max(min_a.y, min_b.y))
    iz = max(0, min(max_a.z, max_b.z) - max(min_a.z, min_b.z))

    return ix * iy * iz


def es_covering(obj):
    """
    Identifica si un objeto es un recubrimiento (canto, laminado, balance, tapa).
    Se evalúa tanto por palabras clave en su nombre como por sus dimensiones físicas del mundo.
    """
    # 1. Por nombre
    nombre_upper = obj.name.upper()
    palabras_covering = ["CANTO", "LAMINADO", "BALANCE", "BALANCEO", "TAPA"]
    for word in palabras_covering:
        # Evitamos falsos positivos como TAPALUZ (que es herraje o madera)
        if word == "TAPA" and "TAPALUZ" in nombre_upper:
            continue
        if word in nombre_upper:
            return True
            
    # 2. Por espesor físico
    try:
        mn, mx = obtener_bbox_mundo(obj)
        dims = [mx.x - mn.x, mx.y - mn.y, mx.z - mn.z]
        dims.sort()
        # Si la dimensión mínima (espesor) es menor o igual a 3.5mm (0.0035m)
        if dims[0] <= 0.0035:
            return True
    except Exception:
        pass
        
    return False


def ratio_contencion(obj_mdp, obj_pieza):
    """
    Qué fracción del volumen del MDP/MDF o recubrimiento está contenida dentro del bbox de la pieza.
    Calculado de forma robusta y tolerante mediante bounding boxes expandidos de forma inteligente.
    """
    vol_mdp = volumen_bbox(obj_mdp)
    if vol_mdp < 1e-9:
        return 0.0
    vol_inter = volumen_interseccion_expandido_inteligente(obj_mdp, obj_pieza)
    return vol_inter / vol_mdp


def mejor_match_volumetrico(obj_mdp, grupo_objetos):
    """
    Calcula el mejor ratio de contención del MDP con cualquier
    miembro del grupo. Solo necesita encajar con UNA pieza del grupo.
    """
    mejor = 0.0
    for miembro in grupo_objetos:
        try:
            r = ratio_contencion(obj_mdp, miembro)
            if r > mejor:
                mejor = r
        except Exception:
            continue
    return mejor


def obtener_centro_subgrupo(subgrupo):
    """Calcula el centro promedio del bounding box del subgrupo de objetos."""
    total_x, total_y, total_z = 0.0, 0.0, 0.0
    for obj in subgrupo:
        mn, mx = obtener_bbox_mundo(obj)
        total_x += (mn.x + mx.x) / 2.0
        total_y += (mn.y + mx.y) / 2.0
        total_z += (mn.z + mx.z) / 2.0
    n = len(subgrupo)
    if n == 0:
        return 0.0, 0.0, 0.0
    return total_x / n, total_y / n, total_z / n


def subagrupar_por_superposicion(miembros):
    """
    Agrupa piezas que forman la misma tabla física usando superposición de bounding box orientada a espesores.
    Esto une perfectamente tapas y contracapas separadas por 1.5 cm sin tocar ni fusionar piezas vecinas
    en absoluto (evita fusiones de cajones o cubiertas adyacentes).
    """
    n = len(miembros)
    parent = list(range(n))

    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j

    # Encontrar solapamientos con margen inteligente
    for i in range(n):
        for j in range(i + 1, n):
            try:
                if volumen_interseccion_expandido_inteligente(miembros[i], miembros[j]) > 1e-9:
                    union(i, j)
            except Exception:
                continue

    # Agrupar por raíz de Union-Find
    sub_grupos = {}
    for i in range(n):
        root = find(i)
        if root not in sub_grupos:
            sub_grupos[root] = []
        sub_grupos[root].append(miembros[i])

    return list(sub_grupos.values())


def unir_grupo(objetos, nombre_final, log):
    objetos = [o for o in objetos if o.name in bpy.data.objects]
    if len(objetos) == 0:
        return False
    if len(objetos) == 1:
        if objetos[0].name != nombre_final:
            log.append(f"    Renombrando '{objetos[0].name}' → '{nombre_final}'")
            objetos[0].name = nombre_final
            if objetos[0].data:
                objetos[0].data.name = nombre_final
        return True

    activo = objetos[0]
    for obj in objetos:
        if obj.name == nombre_final:
            activo = obj
            break

    for obj in objetos:
        if obj.parent:
            mat = obj.matrix_world.copy()
            obj.parent = None
            obj.matrix_world = mat

    bpy.ops.object.select_all(action='DESELECT')
    for obj in objetos:
        obj.hide_viewport = False
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = activo

    try:
        bpy.ops.object.join()
        act_obj = bpy.context.active_object
        act_obj.name = nombre_final
        if act_obj.data:
            act_obj.data.name = nombre_final
        log.append(f"    ✅ Unido → '{nombre_final}'")
        return True
    except Exception as e:
        log.append(f"    ❌ Error: {e}")
        return False


# --- EJECUCIÓN ---

def main():
    if bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode='OBJECT')

    log = []
    log.append("=" * 60)
    log.append("   UNIFICACIÓN DE PIEZAS V6 - COHESIÓN ESPACIAL EN 3D")
    log.append("=" * 60)

    todos = [o for o in bpy.data.objects if o.type == 'MESH']
    
    herrajes = []
    genericos = []
    coverings = []
    huerfanos = []
    piezas_madera = []
    
    for m in todos:
        if es_herraje(m.name):
            herrajes.append(m)
        elif es_generico(m.name):
            genericos.append(m)
        elif es_covering(m):
            coverings.append(m)
        elif re.match(r'^mesh', m.name, re.IGNORECASE):
            huerfanos.append(m)
        else:
            piezas_madera.append(m)

    # REGLA DE ORO: Desocultar todo ANTES de los cálculos matemáticos para que Blender
    # actualice sus coordenadas reales (matrix_world). Los objetos ocultos tienen 
    # coordenadas congeladas/obsoletas.
    for obj in piezas_madera + genericos + coverings + huerfanos:
        try:
            obj.hide_viewport = False
            obj.hide_set(False)
        except:
            pass
    
    # Forzar actualización de la escena
    bpy.context.view_layer.update()

    log.append(f"  Herrajes:  {len(herrajes)}")
    log.append(f"  MDP/MDF iniciales: {len(genericos)}")
    log.append(f"  Recubrimientos (canto/laminado): {len(coverings)}")
    log.append(f"  Madera base inicial: {len(piezas_madera)}")
    log.append(f"  Huérfanos (Mesh_...): {len(huerfanos)}")

    # ── PROMOVER GENÉRICOS INDEPENDIENTES A NÚCLEOS DE MADERA ──
    # Si un MDP/MDF no se solapa con ninguna madera base, constituye su propia tabla.
    nuclei_promocionados = []
    genericos_restantes = []
    for gen in genericos:
        es_independiente = True
        for p in piezas_madera:
            try:
                # Si la contención es mayor a 5%, ya no es independiente
                if ratio_contencion(gen, p) > 0.05:
                    es_independiente = False
                    break
            except Exception:
                continue
        if es_independiente:
            nuclei_promocionados.append(gen)
        else:
            genericos_restantes.append(gen)
            
    if len(nuclei_promocionados) > 0:
        log.append(f"\n  Promocionados a Núcleos (MDP independientes): {len(nuclei_promocionados)}")
        for np in nuclei_promocionados:
            log.append(f"    · '{np.name}'")
        piezas_madera.extend(nuclei_promocionados)
        genericos = genericos_restantes

    # ── AGRUPAR POR NOMBRE Y SUB-AGRUPAR GEOMÉTRICAMENTE POR PROXIMIDAD DE NÚCLEOS ──
    log.append(f"\n{'─' * 60}")
    log.append("AGRUPACIÓN POR NOMBRE Y SUB-AGRUPAMIENTO GEOMÉTRICO DE NÚCLEOS")
    log.append(f"{'─' * 60}")

    grupos_por_nombre = {}
    for p in piezas_madera:
        base = limpiar_nombre_base(p.name)
        if base not in grupos_por_nombre:
            grupos_por_nombre[base] = []
        grupos_por_nombre[base].append(p)

    # Recolectar TODOS los subgrupos de núcleos con sus centros
    todos_subgrupos = []
    for base, miembros in grupos_por_nombre.items():
        sub_grupos = subagrupar_por_superposicion(miembros)
        # Familia = nombre sin número final. Ej: "Cubierta 1" → "Cubierta"
        familia = re.sub(r'\s+\d+$', '', base).strip()
        
        if len(sub_grupos) > 1:
            log.append(f"\n  Base '{base}' detectó {len(sub_grupos)} piezas físicas independientes:")
            for sg in sub_grupos:
                centro = obtener_centro_subgrupo(sg)
                todos_subgrupos.append((familia, base, sg, centro))
                log.append(f"    · {[o.name for o in sg]}")
        else:
            centro = obtener_centro_subgrupo(sub_grupos[0])
            todos_subgrupos.append((familia, base, sub_grupos[0], centro))
            log.append(f"  Base '{base}': {[o.name for o in sub_grupos[0]]}")

    # Agrupar por familia y asignar nombres ÚNICOS
    familias = {}
    for familia, base, sg, centro in todos_subgrupos:
        if familia not in familias:
            familias[familia] = []
        familias[familia].append((base, sg, centro))

    grupos_fisicos = {}
    for familia, items in familias.items():
        if len(items) == 1:
            base, sg, centro = items[0]
            grupos_fisicos[base] = sg
        else:
            items.sort(key=lambda x: (
                round(x[2][0], 2),
                -round(x[2][2], 2),
                round(x[2][1], 2)
            ))
            log.append(f"\n  Familia '{familia}' → {len(items)} piezas físicas, numerando secuencialmente:")
            for idx, (base, sg, centro) in enumerate(items, 1):
                nombre_nuevo = f"{familia} {idx}"
                grupos_fisicos[nombre_nuevo] = sg
                log.append(f"    · '{nombre_nuevo}': {[o.name for o in sg]}")

    # ── ASIGNAR COMPONENTES ESPACIALES (MDP, COVERINGS, HUÉRFANOS) POR VOLUMEN 3D ──
    log.append(f"\n{'─' * 60}")
    log.append("ASIGNACIÓN DE COMPONENTES ESPACIALES POR SUPERPOSICIÓN VOLUMÉTRICA 3D")
    log.append(f"{'─' * 60}")

    total_asignados = 0
    total_sin_asignar = []

    # Todos los elementos a asignar espacialmente
    items_a_asignar = [("MDP/MDF", genericos), ("Recubrimiento", coverings), ("Huérfano", huerfanos)]

    for tipo, items in items_a_asignar:
        if len(items) == 0:
            continue
        log.append(f"\nAsignando {tipo} ({len(items)}):")
        for item in items:
            scores = []
            for nombre_fisico, miembros in grupos_fisicos.items():
                score = mejor_match_volumetrico(item, miembros)
                scores.append((nombre_fisico, score))
            
            scores.sort(key=lambda x: x[1], reverse=True)
            mejor_nombre, mejor_score = scores[0] if scores else (None, 0)
            
            # Umbral de contención mínimo: 0.1 (10%) para solapamiento
            if mejor_nombre and mejor_score >= 0.1:
                grupos_fisicos[mejor_nombre].append(item)
                total_asignados += 1
                log.append(f"  · '{item.name}' ({tipo}) ➔ '{mejor_nombre}' (contención: {mejor_score:.1%})")
            else:
                total_sin_asignar.append((item, tipo, scores[:3] if scores else []))
                log.append(f"  · ⚠️ '{item.name}' ({tipo}) ➔ SIN ASIGNAR (Max: {mejor_score:.1%})")

    # Diagnóstico detallado para elementos sin asignar
    if len(total_sin_asignar) > 0:
        log.append(f"\n{'─' * 40}")
        log.append(f"DIAGNÓSTICO DETALLADO DE NO ASIGNADOS ({len(total_sin_asignar)})")
        log.append(f"{'─' * 40}")
        for item, tipo, top_scores in total_sin_asignar:
            try:
                min_g, max_g = obtener_bbox_mundo(item)
                dims_g = [max_g.x - min_g.x, max_g.y - min_g.y, max_g.z - min_g.z]
                log.append(f"  ⚠️ '{item.name}' ({tipo})")
                log.append(f"      dims: X={dims_g[0]*1000:.1f}mm Y={dims_g[1]*1000:.1f}mm Z={dims_g[2]*1000:.1f}mm")
                log.append(f"      Top Candidatos:")
                for n, s in top_scores:
                    log.append(f"          · '{n}': {s:.1%}")
            except Exception as e:
                log.append(f"  ⚠️ Error en diagnóstico de '{item.name}': {e}")

    # ── EJECUTAR UNIONES ──
    log.append(f"\n{'─' * 60}")
    log.append("EJECUTANDO UNIONES FÍSICAS")
    log.append(f"{'─' * 60}")

    uniones = 0
    for nombre_fisico in sorted(grupos_fisicos.keys()):
        miembros = grupos_fisicos[nombre_fisico]
        if len(miembros) > 1:
            log.append(f"\n  Grupo físico '{nombre_fisico}' ({len(miembros)}):")
            for m in miembros:
                log.append(f"    · {m.name}")
            if unir_grupo(miembros, nombre_fisico, log):
                uniones += 1
        elif len(miembros) == 1 and miembros[0].name != nombre_fisico:
            old = miembros[0].name
            miembros[0].name = nombre_fisico
            if miembros[0].data:
                miembros[0].data.name = nombre_fisico
            log.append(f"  Renombrado: '{old}' → '{nombre_fisico}'")

    # ── FASE DE ESTRUCTURACIÓN JERÁRQUICA Y NUMERACIÓN SECUENCIAL (PIEZA XX) ──
    log.append(f"\n{'─' * 60}")
    log.append("FASE DE ESTRUCTURACIÓN JERÁRQUICA (PIEZA XX)")
    log.append(f"{'─' * 60}")

    # Forzar actualización de coordenadas del mundo en Blender antes de medir
    bpy.context.view_layer.update()

    # Todos los objetos Mesh resultantes legítimos de maderas (los nombres de grupos_fisicos existentes)
    maderas_finales = []
    for nombre_fisico in grupos_fisicos.keys():
        if nombre_fisico in bpy.data.objects:
            obj = bpy.data.objects[nombre_fisico]
            if obj.type == 'MESH':
                maderas_finales.append(obj)

    maderas_piezas = []
    fondos_piezas = []

    for obj in maderas_finales:
        try:
            mn, mx = obtener_bbox_mundo(obj)
            dims = [mx.x - mn.x, mx.y - mn.y, mx.z - mn.z]
            dims.sort(reverse=True)
            espesor = dims[2] if len(dims) > 2 else 0

            # Espesor <= 4mm o nombres clave
            es_fondo = (espesor <= 0.004) or ("fondo" in obj.name.lower()) or ("trasera" in obj.name.lower())

            if es_fondo:
                fondos_piezas.append((obj, mn, mx))
            else:
                maderas_piezas.append((obj, mn, mx))
        except Exception as e:
            log.append(f"  ⚠️ Error al medir pieza '{obj.name}': {e}")
            maderas_piezas.append((obj, mathutils.Vector((0,0,0)), mathutils.Vector((0,0,0))))

    # 1. Agrupar maderas comunes por familia
    familias_maderas = {}
    for obj, mn, mx in maderas_piezas:
        familia = limpiar_nombre_base(obj.name)
        if familia not in familias_maderas:
            familias_maderas[familia] = []
        familias_maderas[familia].append((obj, mn, mx))

    familias_ordenadas = sorted(familias_maderas.keys(), key=lambda f: f[1:] if f.startswith("_") else f)

    pieza_counter = 1
    maderas_a_estructurar = []

    for familia in familias_ordenadas:
        miembros = familias_maderas[familia]
        es_identica = familia.startswith("_")
        nombre_mesh_limpio = familia[1:] if es_identica else familia

        miembros.sort(key=lambda x: (
            round((x[1].x + x[2].x) / 2.0, 2),
            -round((x[1].z + x[2].z) / 2.0, 2),
            round((x[1].y + x[2].y) / 2.0, 2)
        ))

        if es_identica:
            num_sticker = pieza_counter
            pieza_counter += 1
            for idx, (obj, mn, mx) in enumerate(miembros, 1):
                nombre_parent = f"Pieza {num_sticker:02d}.{idx:03d}"
                maderas_a_estructurar.append((obj, nombre_parent, nombre_mesh_limpio))
        else:
            for (obj, mn, mx) in miembros:
                num_sticker = pieza_counter
                pieza_counter += 1
                nombre_parent = f"Pieza {num_sticker:02d}"
                maderas_a_estructurar.append((obj, nombre_parent, nombre_mesh_limpio))

    # 2. Agrupar fondos
    familias_fondos = {}
    for obj, mn, mx in fondos_piezas:
        familia_base = limpiar_nombre_base(obj.name)
        dims = [mx.x - mn.x, mx.y - mn.y, mx.z - mn.z]
        dims.sort(reverse=True)
        mult_dim = 1000.0 if dims[0] < 20.0 else 1.0
        l_mm = int(round(dims[0] * mult_dim))
        w_mm = int(round(dims[1] * mult_dim))
        
        clave = (familia_base, l_mm, w_mm)
        if clave not in familias_fondos:
            familias_fondos[clave] = []
        familias_fondos[clave].append((obj, mn, mx))

    claves_fondos_ordenadas = sorted(familias_fondos.keys(), key=lambda k: k[0][1:] if k[0].startswith("_") else k[0])

    for clave in claves_fondos_ordenadas:
        miembros = familias_fondos[clave]
        familia_base, l_mm, w_mm = clave
        nombre_mesh_limpio = familia_base[1:] if familia_base.startswith("_") else familia_base

        miembros.sort(key=lambda x: (
            round((x[1].x + x[2].x) / 2.0, 2),
            -round((x[1].z + x[2].z) / 2.0, 2),
            round((x[1].y + x[2].y) / 2.0, 2)
        ))

        num_sticker = pieza_counter
        pieza_counter += 1
        for idx, (obj, mn, mx) in enumerate(miembros, 1):
            nombre_parent = f"Pieza {num_sticker:02d}.{idx:03d}"
            maderas_a_estructurar.append((obj, nombre_parent, nombre_mesh_limpio))

    # 3. Renombrar
    for obj, nombre_parent, nombre_mesh_limpio in maderas_a_estructurar:
        try:
            obj.name = nombre_parent
            if obj.data:
                obj.data.name = nombre_mesh_limpio
            log.append(f"  ✅ Renombrado: '{nombre_parent}' ➔ Malla: '{nombre_mesh_limpio}'")
        except Exception as e:
            log.append(f"  ❌ Error al renombrar '{obj.name}': {e}")

    # Limpieza
    emp = 0
    for obj in list(bpy.data.objects):
        if obj.type == 'EMPTY' and len(obj.children) == 0:
            bpy.data.objects.remove(obj, do_unlink=True)
            emp += 1

    # Sincronización
    sincronizados = 0
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and obj.data:
            if es_herraje(obj.name) or es_generico(obj.name):
                nombre_limpio_data = limpiar_nombre_base(obj.name)
                if obj.data.name != nombre_limpio_data:
                    obj.data.name = nombre_limpio_data
                    sincronizados += 1

    # ── RESUMEN ──
    log.append(f"\n{'=' * 60}")
    log.append(f"  Grupos unidos:     {uniones}")
    log.append(f"  Componentes asignados (MDP/Recubrimientos): {total_asignados}")
    log.append(f"  Sin asignar:       {len(total_sin_asignar)}")
    log.append(f"  Empties limpiados: {emp}")
    log.append(f"  Mallas (data) renombradas: {sincronizados}")
    log.append(f"{'=' * 60}")

    # Log en Blender
    if "JOIN_LOG" in bpy.data.texts:
        bpy.data.texts.remove(bpy.data.texts["JOIN_LOG"])
    bpy.data.texts.new("JOIN_LOG").write("\n".join(log))

    for l in log:
        print(l)

    n_sin = len(total_sin_asignar)
    def draw(self, context):
        c = self.layout.column()
        c.label(text=f"Grupos unidos: {uniones}", icon='CHECKMARK')
        c.label(text=f"Asignados (3D): {total_asignados}")
        if n_sin > 0:
            c.label(text=f"Sin asignar: {n_sin}", icon='ERROR')
        c.separator()
        c.label(text="Detalle: Text Editor → 'JOIN_LOG'", icon='TEXT')

main()
