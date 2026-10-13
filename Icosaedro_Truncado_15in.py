# -*- coding: utf-8 -*-
"""
Generador de Icosaedro Truncado (32 caras planas: 12 pentágonos y 20 hexágonos)
para Rhinoceros 3D (Rhino 7 / Rhino 8) - Python 2.7 / Python 3.
Diámetro exacto: 15 pulgadas (convertido automáticamente a las unidades del documento).

Autor: Mario Mojica Studio / Gamma
"""

import math
try:
    import rhinoscriptsyntax as rs
    import Rhino
    import System.Drawing.Color as Color
except ImportError:
    pass

def generate_truncated_icosahedron():
    # 1. Definir proporción áurea
    phi = (1.0 + math.sqrt(5.0)) / 2.0  # ~1.6180339887

    # 2. Las 60 coordenadas canónicas de un icosaedro truncado
    # Se obtienen mediante permutaciones pares y signos de:
    # (0, +-1, +-3*phi)
    # (+-1, +-(2+phi), +-2*phi)
    # (+-phi, +-2, +-(2*phi+1))
    
    verts = []
    
    # Conjunto A: Todas las permutaciones pares de (0, +-1, +-3*phi)
    # y variaciones de signos:
    for s1 in [-1.0, 1.0]:
        for s2 in [-1.0, 1.0]:
            # Permutaciones pares: (0, 1, 2), (1, 2, 0), (2, 0, 1)
            verts.append((0.0, s1 * 1.0, s2 * 3.0 * phi))
            verts.append((s2 * 3.0 * phi, 0.0, s1 * 1.0))
            verts.append((s1 * 1.0, s2 * 3.0 * phi, 0.0))

    # Conjunto B: Permutaciones pares de (+-1, +-(2+phi), +-2*phi)
    for s0 in [-1.0, 1.0]:
        for s1 in [-1.0, 1.0]:
            for s2 in [-1.0, 1.0]:
                v0 = s0 * 1.0
                v1 = s1 * (2.0 + phi)
                v2 = s2 * (2.0 * phi)
                verts.append((v0, v1, v2))
                verts.append((v2, v0, v1))
                verts.append((v1, v2, v0))

    # Conjunto C: Permutaciones pares de (+-phi, +-2, +-(2*phi+1))
    for s0 in [-1.0, 1.0]:
        for s1 in [-1.0, 1.0]:
            for s2 in [-1.0, 1.0]:
                v0 = s0 * phi
                v1 = s1 * 2.0
                v2 = s2 * (2.0 * phi + 1.0)
                verts.append((v0, v1, v2))
                verts.append((v2, v0, v1))
                verts.append((v1, v2, v0))

    # Eliminar duplicados si los hubiera por precisión numérica
    unique_verts = []
    eps = 1e-4
    for v in verts:
        exists = False
        for uv in unique_verts:
            dx = v[0] - uv[0]
            dy = v[1] - uv[1]
            dz = v[2] - uv[2]
            if (dx*dx + dy*dy + dz*dz) < eps:
                exists = True
                break
        if not exists:
            unique_verts.append(v)

    # 3. Calcular radio canónico actual y factor de escala a 15 pulgadas
    # En Rhino verificamos las unidades del documento actual:
    # 2 = Milímetros, 8 = Pulgadas, 9 = Pies, 3 = Centímetros, 4 = Metros
    unit_system = rs.UnitSystem()
    
    # Diámetro objetivo = 15 pulgadas -> Radio = 7.5 pulgadas
    target_radius_inches = 7.5
    
    if unit_system == 2:      # Millimeters
        target_radius = target_radius_inches * 25.4 # 190.5 mm
        unit_name = "Milímetros (mm)"
    elif unit_system == 3:    # Centimeters
        target_radius = target_radius_inches * 2.54 # 19.05 cm
        unit_name = "Centímetros (cm)"
    elif unit_system == 4:    # Meters
        target_radius = target_radius_inches * 0.0254 # 0.1905 m
        unit_name = "Metros (m)"
    elif unit_system == 8:    # Inches
        target_radius = target_radius_inches
        unit_name = "Pulgadas (in)"
    else:
        # Por defecto asumimos milímetros si no es estándar
        target_radius = target_radius_inches * 25.4
        unit_name = "Milímetros (15 pulgadas = 381 mm)"

    # Radio canónico desde el origen
    r0 = math.sqrt(unique_verts[0][0]**2 + unique_verts[0][1]**2 + unique_verts[0][2]**2)
    scale_factor = target_radius / r0

    # Escalar vértices
    scaled_verts = []
    for uv in unique_verts:
        scaled_verts.append(Rhino.Geometry.Point3d(
            uv[0] * scale_factor,
            uv[1] * scale_factor,
            uv[2] * scale_factor
        ))

    # Longitud de arista canónica escalada
    # En el icosaedro truncado todas las aristas miden exactamente igual: a = 2 * scale_factor
    edge_len = 2.0 * scale_factor

    # 4. Construir las 32 caras planas
    # Para cada vértice, encontramos sus 3 vecinos más cercanos (distancia ~ edge_len)
    neighbors = {}
    for i, p1 in enumerate(scaled_verts):
        neighbors[i] = []
        for j, p2 in enumerate(scaled_verts):
            if i != j:
                dist = p1.DistanceTo(p2)
                if abs(dist - edge_len) < (edge_len * 0.05):
                    neighbors[i].append(j)

    # Buscar caras de tamaño 5 (12 pentágonos) y tamaño 6 (20 hexágonos)
    # Una cara es un ciclo simple en el grafo de vecinos donde todos los vértices son coplanares
    faces_found = [] # Lista de listas de índices de vértices ordenados cíclicamente

    def find_cycles_from_edge(v1, v2):
        # Busca ciclos simples de longitud 5 o 6 que pasen por la arista (v1, v2)
        stack = [(v2, [v1, v2])]
        cycles = []
        while stack:
            curr, path = stack.pop()
            if len(path) > 6:
                continue
            for nxt in neighbors[curr]:
                if nxt == v1 and len(path) in [5, 6]:
                    # Ciclo cerrado
                    cycles.append(path)
                elif nxt not in path and len(path) < 6:
                    stack.append((nxt, path + [nxt]))
        return cycles

    # Recolectar todos los ciclos
    all_cycles = []
    for i in range(len(scaled_verts)):
        for j in neighbors[i]:
            if i < j:
                cycles = find_cycles_from_edge(i, j)
                all_cycles.extend(cycles)

    # Filtrar ciclos canónicos normalizados por conjunto de vértices
    unique_faces = []
    seen_face_sets = []

    for c in all_cycles:
        s = frozenset(c)
        if s not in seen_face_sets:
            # Verificar si los puntos del ciclo son coplanares
            pts = [scaled_verts[idx] for idx in c]
            # Normal promedio
            center = Rhino.Geometry.Point3d(0,0,0)
            for p in pts:
                center += p
            center /= len(pts)
            
            # Vector desde origen al centro es perpendicular al plano de la cara
            normal = Rhino.Geometry.Vector3d(center)
            normal.Unitize()
            
            # Verificar coplanaridad
            is_planar = True
            for p in pts:
                vec = p - center
                # Proyección en la normal debe ser prácticamente 0
                if abs(Rhino.Geometry.Vector3d.Multiply(vec, normal)) > (edge_len * 0.01):
                    is_planar = False
                    break
            
            if is_planar:
                seen_face_sets.append(s)
                unique_faces.append(c)

    # 5. Configurar capas en Rhino
    rs.EnableRedraw(False)
    
    layer_pent = "Icosaedro_15in::Pentagonos_12"
    layer_hex = "Icosaedro_15in::Hexagonos_20"
    
    if not rs.IsLayer("Icosaedro_15in"):
        rs.AddLayer("Icosaedro_15in", Color.FromArgb(40, 40, 40))
    if not rs.IsLayer(layer_pent):
        rs.AddLayer(layer_pent, Color.FromArgb(0, 136, 170)) # Azul Cyan Mario Mojica (#0088AA)
    if not rs.IsLayer(layer_hex):
        rs.AddLayer(layer_hex, Color.FromArgb(220, 225, 230)) # Blanco/Gris Claro Técnico

    # 6. Crear las superficies Brep planas
    doc = Rhino.RhinoDoc.ActiveDoc
    pent_count = 0
    hex_count = 0

    for face_indices in unique_faces:
        pts = [scaled_verts[idx] for idx in face_indices]
        pts.append(pts[0]) # Cerrar la curva
        
        poly = Rhino.Geometry.Polyline(pts)
        crv = poly.ToNurbsCurve()
        
        # Crear superficie plana
        breps = Rhino.Geometry.Brep.CreatePlanarBreps(crv, 0.001)
        if breps and len(breps) > 0:
            brep = breps[0]
            attribs = Rhino.DocObjects.ObjectAttributes()
            
            if len(face_indices) == 5:
                attribs.LayerIndex = doc.Layers.FindName("Pentagonos_12").Index
                pent_count += 1
            else:
                attribs.LayerIndex = doc.Layers.FindName("Hexagonos_20").Index
                hex_count += 1
                
            doc.Objects.AddBrep(brep, attribs)

    rs.EnableRedraw(True)
    
    # 7. Resumen en consola de Rhino
    print("==================================================")
    print(" [3dBimFab / Mario Mojica] BALÓN TRUNCADO 15 INCHES")
    print("==================================================")
    print(" - Sistema de Unidades Detectado: " + str(unit_name))
    print(" - Diámetro Exterior (Esfera Circunscrita): " + str(round(target_radius * 2.0, 2)))
    print(" - Longitud de Arista de cada Parche: " + str(round(edge_len, 2)))
    print(" - Caras Pentagonales creadas: " + str(pent_count) + " (Capa: " + str(layer_pent) + ")")
    print(" - Caras Hexagonales creadas: " + str(hex_count) + " (Capa: " + str(layer_hex) + ")")
    print(" - Todas las 32 caras son RIGUROSAMENTE PLANAS (Planar Breps).")
    print("==================================================")

if __name__ == "__main__":
    generate_truncated_icosahedron()
