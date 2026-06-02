Created At: 2026-06-01T17:08:13Z
Completed At: 2026-06-01T17:08:13Z
File Path: `file:///c:/Desarrollo/mmapp/scripts/blender_join_pieces.py`
Total Lines: 440
Total Bytes: 15984
Showing lines 1 to 440
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: import bpy
2: import re
3: import mathutils
4: 
5: # ===================================================================
6: # SCRIPT V5: UNIFICACIÓN DE PIEZAS DE MADERA PARA MANUAL DINÁMICO 3D
7: # ===================================================================
8: # Usa SUPERPOSICIÓN VOLUMÉTRICA 3D para asignar MDP a su tablero.
9: # Dos piezas del mismo sándwich (lámina + MDP + balance) comparten
10: # volumen en las 3 dimensiones. Piezas de otros tableros ubicadas
11: # en otra posición del mueble tendrán volumen compartido = 0.
12: # ===================================================================
13: 
14: # --- CONFIGURACIÓN ---
15: 
16: HERRAJES = [
17:     "CORREDERA", "TORNILLO", "DESLIZADOR", "BISAGRA",
18:     "MANIJA", "CERRADURA", "TARUGO", "CLAVO", "PUNTILLA",
19: ]
20: GENERICOS = ["MDP", "MDF"]
21: SUFIJOS = ["balance", "balanceo", "tapa", "canto", "laminado"]
22: 
23: # Umbral de superposición volumétrica: qué fracción del volumen del MDP
24: # debe estar contenida dentro del bbox de la pieza para considerarlo match.
25: # Un MDP correctamente sándwich tendrá ~0.8-1.0 de su volumen dentro.
26: UMBRAL_VOLUMEN = 0.3
27: 
28: 
29: # --- FUNCIONES ---
30: 
31: def es_herraje(nombre):
32:     return any(h in nombre.upper() for h in HERRAJES)
33: 
34: 
35: def es_generico(nombre):
36:     base = re.sub(r'\.\d{3}$', '', nombre).strip().upper()
37:     return any(base == g or base.startswith(g + ".") or base.startswith(g + "_") for g in GENERICOS)
38: 
39: 
40: def limpiar_nombre_base(nombre):
41:     limpio =
<truncated 14504 bytes>
n miembros:
393:                 log.append(f"    · {m.name}")
394:             if unir_grupo(miembros, nombre_fisico, log):
395:                 uniones += 1
396:         elif len(miembros) == 1 and miembros[0].name != nombre_fisico:
397:             old = miembros[0].name
398:             miembros[0].name = nombre_fisico
399:             if miembros[0].data:
400:                 miembros[0].data.name = nombre_fisico
401:             log.append(f"  Renombrado: '{old}' → '{nombre_fisico}'")
402: 
403:     # Limpieza
404:     emp = 0
405:     for obj in list(bpy.data.objects):
406:         if obj.type == 'EMPTY' and len(obj.children) == 0:
407:             bpy.data.objects.remove(obj, do_unlink=True)
408:             emp += 1
409: 
410:     # ── RESUMEN ──
411:     log.append(f"\n{'=' * 60}")
412:     log.append(f"  Grupos unidos:     {uniones}")
413:     log.append(f"  MDP asignados:     {asignados}")
414:     log.append(f"  MDP sin asignar:   {len(sin_asignar)}")
415:     log.append(f"  Empties limpiados: {emp}")
416:     log.append(f"{'=' * 60}")
417: 
418:     # Log en Blender
419:     if "JOIN_LOG" in bpy.data.texts:
420:         bpy.data.texts.remove(bpy.data.texts["JOIN_LOG"])
421:     bpy.data.texts.new("JOIN_LOG").write("\n".join(log))
422: 
423:     for l in log:
424:         print(l)
425: 
426:     n_sin = len(sin_asignar)
427:     def draw(self, context):
428:         c = self.layout.column()
429:         c.label(text=f"Grupos unidos: {uniones}", icon='CHECKMARK')
430:         c.label(text=f"MDP asignados (volumen 3D): {asignados}")
431:         if n_sin > 0:
432:             c.label(text=f"MDP sin asignar: {n_sin}", icon='ERROR')
433:         c.separator()
434:         c.label(text="Detalle: Text Editor → 'JOIN_LOG'", icon='TEXT')
435: 
436:     bpy.context.window_manager.popup_menu(draw, title="Unificación V6", icon='MESH_CUBE')
437: 
438: 
439: main()
440: 
The above content shows the entire, complete file contents of the requested file.
