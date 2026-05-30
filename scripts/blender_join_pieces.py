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
# Un MDP correctamente sándwich tendrá ~0.8-1.0 de su volumen dentro.
UMBRAL_VOLUMEN = 0.3


# --- FUNCIONES ---

def es_herraje(nombre):
    return any(h in nombre.upper() for h in HERRAJES)


def es_generico(nombre):
    base = re.sub(r'\.\d{3}$', '', nombre).strip().upper()
    return any(base == g or base.startswith(g + ".") or base.startswith(g + "_") for g in GENERICOS)


def limpiar_nombre_base(nombre):
    limpio = re.sub(r'\.\d{3}$', '', nombre)
    for suf in SUFIJOS:
        patron = re.compile(r'\s+' + re.escape(suf) + r'$', re.IGNORECASE)
        limpio = patron.sub('', limpio)
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


def obtener_bbox_mundo_expandido_inteligente(obj, margen_espesor=0.02, margen_otros=-0.002):
    """
    Calcula las coordenadas min/max del bbox en el espacio del mundo.
    - Expande por un margen positivo (margen_espesor) en el eje más delgado (el espesor de la tabla).
    - Contrae por un margen negativo (margen_otros) en los otros dos ejes para garantizar que
      las piezas adyacentes no se toquen, aun si están muy cerca en los cajones o cubiertas.
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


def ratio_contencion(obj_mdp, obj_pieza):
    """
    Qué fracción del volumen del MDP/MDF está contenida dentro del bbox de la pieza.
    Utiliza el volumen expandido de forma inteligente (eje espesor) para soportar de forma
    robusta mallas ultra delgadas como MDF de fondo.
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
    log.append("   UNIFICACIÓN DE PIEZAS V5 - VOLUMEN 3D")
    log.append("=" * 60)

    todos = [o for o in bpy.data.objects if o.type == 'MESH']
    log.append(f"\nTotal meshes: {len(todos)}")

    herrajes, genericos, piezas = [], [], []
    for m in todos:
        if es_herraje(m.name):
            herrajes.append(m)
        elif es_generico(m.name):
            genericos.append(m)
        else:
            piezas.append(m)

    log.append(f"  Herrajes:  {len(herrajes)}")
    log.append(f"  MDP/MDF:   {len(genericos)}")
    log.append(f"  Madera:    {len(piezas)}")

    # ── AGRUPAR POR NOMBRE Y SUB-AGRUPAR GEOMÉTRICAMENTE POR PROXIMIDAD ──
    log.append(f"\n{'─' * 60}")
    log.append("AGRUPACIÓN POR NOMBRE Y SUB-AGRUPAMIENTO GEOMÉTRICO")
    log.append(f"{'─' * 60}")

    grupos_por_nombre = {}
    for p in piezas:
        base = limpiar_nombre_base(p.name)
        if base not in grupos_por_nombre:
            grupos_por_nombre[base] = []
        grupos_por_nombre[base].append(p)

    grupos_fisicos = {}
    for base, miembros in grupos_por_nombre.items():
        # subagrupar_por_superposicion ahora usa bounding boxes expandidos de forma inteligente:
        # - Expande 2 cm únicamente en el eje del espesor (delgadez) para colisionar de forma infalible la tapa y contracapa.
        # - Contrae 2 mm en los otros ejes para evitar de forma absoluta que cajones o cubiertas adyacentes se toquen.
        sub_grupos = subagrupar_por_superposicion(miembros)
        
        if len(sub_grupos) > 1:
            # Ordenar sub-grupos espacialmente:
            # 1. X redondeado (izquierda a derecha)
            # 2. Z redondeado descendente (arriba a abajo)
            # 3. Y para desambiguar
            centros = {id(sg): obtener_centro_subgrupo(sg) for sg in sub_grupos}
            sub_grupos.sort(key=lambda sg: (
                round(centros[id(sg)][0], 2),
                -round(centros[id(sg)][2], 2),
                round(centros[id(sg)][1], 2)
            ))
            
            log.append(f"\n  Base '{base}' detectó {len(sub_grupos)} piezas físicas independientes:")
            for idx, sg in enumerate(sub_grupos, 1):
                nombre_nuevo = generar_nombre_numerado(base, idx)
                grupos_fisicos[nombre_nuevo] = sg
                log.append(f"    · Instancia '{nombre_nuevo}': {[o.name for o in sg]}")
        else:
            grupos_fisicos[base] = sub_grupos[0]
            log.append(f"  Base '{base}': {[o.name for o in sub_grupos[0]]}")

    # ── ASIGNAR MDP POR VOLUMEN 3D ──
    log.append(f"\n{'─' * 60}")
    log.append("ASIGNACIÓN MDP POR SUPERPOSICIÓN VOLUMÉTRICA 3D")
    log.append(f"{'─' * 60}")

    asignados = 0
    sin_asignar = []

    for gen in genericos:
        vol_gen = volumen_bbox(gen)
        scores = []

        for nombre_fisico, miembros in grupos_fisicos.items():
            score = mejor_match_volumetrico(gen, miembros)
            scores.append((nombre_fisico, score))

        scores.sort(key=lambda x: x[1], reverse=True)
        mejor_nombre, mejor_score = scores[0] if scores else (None, 0)

        if mejor_nombre and mejor_score >= UMBRAL_VOLUMEN:
            grupos_fisicos[mejor_nombre].append(gen)
            asignados += 1
            log.append(f"  '{gen.name}' → '{mejor_nombre}' "
                        f"(contención: {mejor_score:.1%})")
        else:
            sin_asignar.append(gen)
            log.append(f"  '{gen.name}' → ⚠️ SIN ASIGNAR")
            for n, s in scores[:3]:
                log.append(f"      · '{n}': {s:.1%}")

    log.append(f"  Asignados: {asignados} | Sin asignar: {len(sin_asignar)}")

    # ── EJECUTAR UNIONES ──
    log.append(f"\n{'─' * 60}")
    log.append("EJECUTANDO UNIONES")
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

    # Limpieza
    emp = 0
    for obj in list(bpy.data.objects):
        if obj.type == 'EMPTY' and len(obj.children) == 0:
            bpy.data.objects.remove(obj, do_unlink=True)
            emp += 1

    # ── RESUMEN ──
    log.append(f"\n{'=' * 60}")
    log.append(f"  Grupos unidos:     {uniones}")
    log.append(f"  MDP asignados:     {asignados}")
    log.append(f"  MDP sin asignar:   {len(sin_asignar)}")
    log.append(f"  Empties limpiados: {emp}")
    log.append(f"{'=' * 60}")

    # Log en Blender
    if "JOIN_LOG" in bpy.data.texts:
        bpy.data.texts.remove(bpy.data.texts["JOIN_LOG"])
    bpy.data.texts.new("JOIN_LOG").write("\n".join(log))

    for l in log:
        print(l)

    n_sin = len(sin_asignar)
    def draw(self, context):
        c = self.layout.column()
        c.label(text=f"Grupos unidos: {uniones}", icon='CHECKMARK')
        c.label(text=f"MDP asignados (volumen 3D): {asignados}")
        if n_sin > 0:
            c.label(text=f"MDP sin asignar: {n_sin}", icon='ERROR')
        c.separator()
        c.label(text="Detalle: Text Editor → 'JOIN_LOG'", icon='TEXT')

    bpy.context.window_manager.popup_menu(draw, title="Unificación V6", icon='MESH_CUBE')


main()
