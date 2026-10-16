"""
============================================================================
ARCHIVO: dxf_exporter.py
UBICACIÓN: c:/Desarrollo/mmapp/3bf/worker/dxf_exporter.py
DESCRIPCIÓN:
Módulo de mecanizado cruzado inter-componentes y exportación CAM DXF para
centros de mecanizado CNC Biesse Skipper (bSolid / BiesseWorks) en 3dBimFab.
============================================================================
"""

import io
import ezdxf


def procesar_mecanizado_intercomponentes(data: dict) -> dict:
    try:
        instancias = data.get("instancias", [])
        if not instancias or len(instancias) < 1:
            return {
                "status": "success",
                "mecanizados_cruzados": {},
                "total_perforaciones": 0,
                "resumen": ["Escenario sin componentes para mecanizar."]
            }

        mecanizados_por_instancia = {}
        total_perforaciones = 0
        mensajes_resumen = []

        instancias_procesadas = []
        for inst in instancias:
            inst_id = inst.get("id")
            inst_nombre = inst.get("nombreVisible") or inst.get("definitionId") or inst_id
            pos_inst = inst.get("posicion", [0.0, 0.0, 0.0])

            tableros = []
            resultado = inst.get("resultado", {})
            real_meshes = resultado.get("real_meshes", [])

            for m in real_meshes:
                m_name = m.get("name", "").lower()
                if any(k in m_name for k in ["cubierta", "tablero", "lateral", "base", "techo", "fondo", "division", "entrepaño", "entrepanio", "cajon", "frente", "board", "mdp"]):
                    sz = m.get("size", [0.5, 0.015, 0.5])
                    pos_loc = m.get("position", [0.0, 0.0, 0.0])

                    min_x = pos_inst[0] + pos_loc[0] - (sz[0] / 2.0)
                    max_x = pos_inst[0] + pos_loc[0] + (sz[0] / 2.0)
                    min_y = pos_inst[1] + pos_loc[1] - (sz[1] / 2.0)
                    max_y = pos_inst[1] + pos_loc[1] + (sz[1] / 2.0)
                    min_z = pos_inst[2] + pos_loc[2] - (sz[2] / 2.0)
                    max_z = pos_inst[2] + pos_loc[2] + (sz[2] / 2.0)

                    tableros.append({
                        "name": m.get("name", "Tablero"),
                        "size_m": sz,
                        "pos_local_m": pos_loc,
                        "bbox_world": [min_x, min_y, min_z, max_x, max_y, max_z],
                        "largo_mm": round(sz[0] * 1000.0, 1),
                        "ancho_mm": round(sz[2] * 1000.0, 1),
                        "espesor_mm": round(sz[1] * 1000.0, 1),
                    })

            if not tableros:
                desp = resultado.get("despiece", [])
                p0 = desp[0] if desp else None
                largo_m = (p0.get("largo", 498.0) if p0 else 0.498) / 1000.0
                ancho_m = (p0.get("ancho", 480.0) if p0 else 0.480) / 1000.0
                esp_m = 0.015

                min_x = pos_inst[0] - (largo_m / 2.0)
                max_x = pos_inst[0] + (largo_m / 2.0)
                min_y = pos_inst[1] - (esp_m / 2.0)
                max_y = pos_inst[1] + (esp_m / 2.0)
                min_z = pos_inst[2] - (ancho_m / 2.0)
                max_z = pos_inst[2] + (ancho_m / 2.0)

                tableros.append({
                    "name": inst_nombre,
                    "size_m": [largo_m, esp_m, ancho_m],
                    "pos_local_m": [0, 0, 0],
                    "bbox_world": [min_x, min_y, min_z, max_x, max_y, max_z],
                    "largo_mm": round(largo_m * 1000.0, 1),
                    "ancho_mm": round(ancho_m * 1000.0, 1),
                    "espesor_mm": 15.0,
                })

            perforaciones = resultado.get("perforaciones_nurbs", [])

            if not perforaciones and resultado.get("herrajes"):
                for h in resultado.get("herrajes", []):
                    h_nombre = h.get("nombre", "").lower()
                    cant = h.get("cantidad", 0)
                    tipo_h = "caja_d15" if "minifix" in h_nombre else ("tarugo_d8" if "tarugo" in h_nombre else "guia_d5")
                    diam_h = 15.0 if "minifix" in h_nombre else (8.0 if "tarugo" in h_nombre else 5.0)

                    largo_tab = tableros[0]["largo_mm"] / 1000.0 if tableros else 0.5
                    ancho_tab = tableros[0]["ancho_mm"] / 1000.0 if tableros else 0.48

                    for i in range(cant):
                        y_offset = (ancho_tab / 2.0 - 0.037) if i % 2 == 0 else (-ancho_tab / 2.0 + 0.037)
                        x_offset = (-largo_tab / 2.0) if i < (cant // 2) else (largo_tab / 2.0)

                        perforaciones.append({
                            "name": f"Perforacion {h.get('nombre', 'Herraje')} {i + 1}",
                            "size_mm": [diam_h, diam_h, 30.0],
                            "center_local_m": [x_offset, 0.0, y_offset],
                            "diametro_mm": diam_h,
                            "profundidad_mm": 30.0 if diam_h == 8.0 else 12.0,
                            "eje_principal": "X",
                            "tipo": tipo_h
                        })

            instancias_procesadas.append({
                "id": inst_id,
                "nombre": inst_nombre,
                "pos_m": pos_inst,
                "tableros": tableros,
                "perforaciones": perforaciones
            })

        for inst_receptora in instancias_procesadas:
            rec_id = inst_receptora["id"]
            mecanizados_por_instancia[rec_id] = []
            centros_vistos_rec = set()

            for tablero in inst_receptora["tableros"]:
                b_min_x, b_min_y, b_min_z, b_max_x, b_max_y, b_max_z = tablero["bbox_world"]
                tab_nombre = tablero["name"]
                tol = 0.025

                for inst_emisora in instancias_procesadas:
                    if inst_emisora["id"] == rec_id:
                        continue

                    em_pos = inst_emisora["pos_m"]
                    for perf in inst_emisora["perforaciones"]:
                        p_center_loc = perf.get("center_local_m", [0, 0, 0])
                        pw_x = em_pos[0] + p_center_loc[0]
                        pw_y = em_pos[1] + p_center_loc[1]
                        pw_z = em_pos[2] + p_center_loc[2]

                        if (b_min_x - tol <= pw_x <= b_max_x + tol and
                                b_min_y - tol <= pw_y <= b_max_y + tol and
                                b_min_z - tol <= pw_z <= b_max_z + tol):

                            diam = perf.get("diametro_mm", 5.0)
                            prof = perf.get("profundidad_mm", 12.0)
                            tipo = perf.get("tipo", "guia_d5")

                            u_mm = round((pw_x - (b_min_x + b_max_x) / 2.0) * 1000.0, 1)
                            v_mm = round((pw_z - (b_min_z + b_max_z) / 2.0) * 1000.0, 1)

                            dist_izq = abs(pw_x - b_min_x)
                            dist_der = abs(pw_x - b_max_x)
                            dist_inf = abs(pw_z - b_min_z)
                            dist_sup_z = abs(pw_z - b_max_z)

                            if dist_izq <= 0.025:
                                cara = "canto_izq"
                                capa_dxf = f"TCHW1B8D{int(prof * 100):04d}" if diam >= 7.0 else f"TCHW1B2D{int(prof * 100):04d}"
                            elif dist_der <= 0.025:
                                cara = "canto_der"
                                capa_dxf = f"TCHW3B8D{int(prof * 100):04d}" if diam >= 7.0 else f"TCHW3B2D{int(prof * 100):04d}"
                            elif dist_inf <= 0.025:
                                cara = "canto_inf"
                                capa_dxf = f"TCHW2B8D{int(prof * 100):04d}" if diam >= 7.0 else f"TCHW2B2D{int(prof * 100):04d}"
                            elif dist_sup_z <= 0.025:
                                cara = "canto_sup"
                                capa_dxf = f"TCHW4B8D{int(prof * 100):04d}" if diam >= 7.0 else f"TCHW4B2D{int(prof * 100):04d}"
                            else:
                                cara = "cara_superior"
                                capa_dxf = f"TCHW0B15D{int(prof * 100):04d}" if diam >= 14.0 else (f"TCHW0B2D{int(prof * 100):04d}" if diam <= 6.0 else f"TCHW0B8D{int(prof * 100):04d}")

                            geo_key = (round(u_mm / 4.0) * 4, round(v_mm / 4.0) * 4, cara)
                            if geo_key in centros_vistos_rec:
                                continue
                            centros_vistos_rec.add(geo_key)

                            mecanizado_item = {
                                "origen_instancia_id": inst_emisora["id"],
                                "origen_instancia_nombre": inst_emisora["nombre"],
                                "nombre_perforacion": perf.get("name", "Perforación"),
                                "tablero_destino": tab_nombre,
                                "tipo": tipo,
                                "diametro_mm": diam,
                                "profundidad_mm": prof,
                                "cara": cara,
                                "capa_dxf": capa_dxf,
                                "u_mm": u_mm,
                                "v_mm": v_mm,
                                "pos_mundial_m": [round(pw_x, 4), round(pw_y, 4), round(pw_z, 4)]
                            }

                            mecanizados_por_instancia[rec_id].append(mecanizado_item)
                            total_perforaciones += 1

            if len(mecanizados_por_instancia[rec_id]) > 0:
                mensajes_resumen.append(f"✓ {len(mecanizados_por_instancia[rec_id])} perforación(es) transferidas a '{inst_receptora['nombre']}'")

        if total_perforaciones == 0:
            mensajes_resumen.append("No se detectaron contactos o intersecciones entre los componentes actuales.")

        return {
            "status": "success",
            "total_perforaciones": total_perforaciones,
            "mecanizados_cruzados": mecanizados_por_instancia,
            "resumen": mensajes_resumen
        }
    except Exception as e:
        print(f"[3BF Worker Mecanizado Error]: {e}", flush=True)
        return {
            "status": "error",
            "message": str(e),
            "total_perforaciones": 0,
            "mecanizados_cruzados": {},
            "resumen": [f"Error: {e}"]
        }


def generar_dxf_biesse(data: dict) -> dict:
    try:
        model_id = data.get("model_id", "Cubierta")
        params = data.get("parameters", {})
        despiece = data.get("despiece", [])
        version = data.get("version", "BD 1.0")

        if data.get("pieza"):
            pieza = data.get("pieza")
        elif despiece and len(despiece) > 0:
            pieza = despiece[0]
        else:
            ancho_p = float(params.get("RH_IN:01.1 Ancho", params.get("ancho", 498.0)))
            prof_p = float(params.get("RH_IN:01.2 Profundidad", params.get("profundidad", 480.0)))
            pieza = {
                "nombre": model_id,
                "largo": ancho_p,
                "ancho": prof_p,
                "espesor": 15.0
            }

        nombre = pieza.get("descripcion") or pieza.get("nombre", model_id)
        descripcion = pieza.get("descripcion", nombre)
        largo = float(pieza.get("largo", 498.0))
        ancho = float(pieza.get("ancho", 480.0))
        espesor = float(pieza.get("espesor", 15.0))
        es_entrepanio = "entrepaño" in nombre.lower() or "entrepanio" in nombre.lower() or "entrepaño" in descripcion.lower() or "entrepanio" in descripcion.lower()

        doc = ezdxf.new(dxfversion="AC1021")
        msp = doc.modelspace()

        prof_corte_tag = f"D{int(espesor * 100):04d}"
        capa_contorno = f"TCHW0B8{prof_corte_tag}"

        doc.layers.new(name=capa_contorno, dxfattribs={"color": 18})
        doc.layers.new(name="TCHW1B8", dxfattribs={"color": 18})
        doc.layers.new(name="TCHW2B8", dxfattribs={"color": 18})
        doc.layers.new(name="TCHW3B8", dxfattribs={"color": 18})
        doc.layers.new(name="TCHW4B8", dxfattribs={"color": 18})
        doc.layers.new(name="TCHW0B2D1200", dxfattribs={"color": 18})
        doc.layers.new(name="TCHW0B15D1350", dxfattribs={"color": 18})
        doc.layers.new(name="TCHW1B8D2500", dxfattribs={"color": 18})
        doc.layers.new(name="TCHW3B8D2500", dxfattribs={"color": 18})

        hx = largo / 2.0
        hy = ancho / 2.0
        gap = 20.0

        puntos_central = [(-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy)]
        msp.add_lwpolyline(puntos_central, close=True, dxfattribs={"layer": capa_contorno})

        puntos_canto_izq = [(-hx - gap, -hy), (-hx - gap, hy), (-hx - gap - espesor, hy), (-hx - gap - espesor, -hy)]
        msp.add_lwpolyline(puntos_canto_izq, close=True, dxfattribs={"layer": "TCHW1B8"})

        puntos_canto_der = [(hx + gap, -hy), (hx + gap, hy), (hx + gap + espesor, hy), (hx + gap + espesor, -hy)]
        msp.add_lwpolyline(puntos_canto_der, close=True, dxfattribs={"layer": "TCHW3B8"})

        puntos_canto_sup = [(-hx, hy + gap), (hx, hy + gap), (hx, hy + gap + espesor), (-hx, hy + gap + espesor)]
        msp.add_lwpolyline(puntos_canto_sup, close=True, dxfattribs={"layer": "TCHW4B8"})

        puntos_canto_inf = [(-hx, -hy - gap), (hx, -hy - gap), (hx, -hy - gap - espesor), (-hx, -hy - gap - espesor)]
        msp.add_lwpolyline(puntos_canto_inf, close=True, dxfattribs={"layer": "TCHW2B8"})

        raw_perfs = data.get("perforaciones_nurbs") or pieza.get("perforaciones_nurbs") or []
        boolean_perfs = [p for p in raw_perfs if "nurbs" in p.get("name", "").lower() or "perforad" in p.get("name", "").lower() or "mecanizad" in p.get("name", "").lower()]
        perforaciones_propias = boolean_perfs if boolean_perfs else raw_perfs
        centros_vistos = set()
        perforaciones_dibujadas = 0

        for p_item in perforaciones_propias:
            if "center_cad_mm" in p_item:
                cx, cy, cz = p_item["center_cad_mm"]
                ux = round(cx - (largo / 2.0), 1)
                vy = round(cy - (ancho / 2.0), 1)
            elif "center_local_m" in p_item:
                ux = round(p_item["center_local_m"][0] * 1000.0, 1)
                vy = round(-p_item["center_local_m"][2] * 1000.0, 1)
            else:
                continue

            diam = float(p_item.get("diametro_mm", 8.0))
            prof = float(p_item.get("profundidad_mm", 25.0))

            c_key = (round(ux, 0), round(vy, 0), round(diam, 0))
            if c_key in centros_vistos:
                continue
            centros_vistos.add(c_key)

            if ux <= -hx + 25.0:
                x_pos = -hx - gap - (espesor / 2.0)
                capa = f"TCHW1B8D{int(prof * 100):04d}" if diam >= 7.0 else f"TCHW1B2D{int(prof * 100):04d}"
                if capa not in doc.layers:
                    doc.layers.new(name=capa, dxfattribs={"color": 18})
                msp.add_circle((x_pos, vy), radius=(diam / 2.0), dxfattribs={"layer": capa})
                perforaciones_dibujadas += 1
            elif ux >= hx - 25.0:
                x_pos = hx + gap + (espesor / 2.0)
                capa = f"TCHW3B8D{int(prof * 100):04d}" if diam >= 7.0 else f"TCHW3B2D{int(prof * 100):04d}"
                if capa not in doc.layers:
                    doc.layers.new(name=capa, dxfattribs={"color": 18})
                msp.add_circle((x_pos, vy), radius=(diam / 2.0), dxfattribs={"layer": capa})
                perforaciones_dibujadas += 1
            elif diam >= 14.0:
                capa = f"TCHW0B15D{int(prof * 100):04d}"
                if capa not in doc.layers:
                    doc.layers.new(name=capa, dxfattribs={"color": 18})
                msp.add_circle((ux, vy), radius=(diam / 2.0), dxfattribs={"layer": capa})
                perforaciones_dibujadas += 1
            else:
                capa = f"TCHW0B2D{int(prof * 100):04d}" if diam <= 6.0 else f"TCHW0B8D{int(prof * 100):04d}"
                if capa not in doc.layers:
                    doc.layers.new(name=capa, dxfattribs={"color": 18})
                msp.add_circle((ux, vy), radius=(diam / 2.0), dxfattribs={"layer": capa})
                perforaciones_dibujadas += 1

        if perforaciones_dibujadas == 0 and not es_entrepanio:
            union_izq = ""
            union_der = ""
            for k, v in params.items():
                kl = k.lower()
                if "union" in kl:
                    if "izq" in kl:
                        union_izq = str(v).lower()
                    elif "der" in kl:
                        union_der = str(v).lower()

            y_pos1 = hy - 48.0
            y_pos2 = -hy + 48.0
            y_pos_tornillo1 = hy - 80.0
            y_pos_tornillo2 = -hy + 80.0

            if "minifix" in union_izq:
                x_izq_caja = -hx + 34.0
                msp.add_circle((x_izq_caja, y_pos1), radius=7.5, dxfattribs={"layer": "TCHW0B15D1350"})
                msp.add_circle((x_izq_caja, y_pos2), radius=7.5, dxfattribs={"layer": "TCHW0B15D1350"})
                x_canto_izq_centro = -hx - gap - (espesor / 2.0)
                msp.add_circle((x_canto_izq_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
                msp.add_circle((x_canto_izq_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
            elif "tarugo" in union_izq and "tornillo" in union_izq:
                x_canto_izq_centro = -hx - gap - (espesor / 2.0)
                msp.add_circle((x_canto_izq_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
                msp.add_circle((x_canto_izq_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
                msp.add_circle((x_canto_izq_centro, y_pos_tornillo1), radius=2.5, dxfattribs={"layer": "TCHW1B2D3500"})
                msp.add_circle((x_canto_izq_centro, y_pos_tornillo2), radius=2.5, dxfattribs={"layer": "TCHW1B2D3500"})
            elif "tarugo" in union_izq or "tornillo" in union_izq:
                x_canto_izq_centro = -hx - gap - (espesor / 2.0)
                msp.add_circle((x_canto_izq_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})
                msp.add_circle((x_canto_izq_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW1B8D2500"})

            if "minifix" in union_der:
                x_der_caja = hx - 34.0
                msp.add_circle((x_der_caja, y_pos1), radius=7.5, dxfattribs={"layer": "TCHW0B15D1350"})
                msp.add_circle((x_der_caja, y_pos2), radius=7.5, dxfattribs={"layer": "TCHW0B15D1350"})
                x_canto_der_centro = hx + gap + (espesor / 2.0)
                msp.add_circle((x_canto_der_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
                msp.add_circle((x_canto_der_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
            elif "tarugo" in union_der and "tornillo" in union_der:
                x_canto_der_centro = hx + gap + (espesor / 2.0)
                msp.add_circle((x_canto_der_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
                msp.add_circle((x_canto_der_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
                msp.add_circle((x_canto_der_centro, y_pos_tornillo1), radius=2.5, dxfattribs={"layer": "TCHW3B2D3500"})
                msp.add_circle((x_canto_der_centro, y_pos_tornillo2), radius=2.5, dxfattribs={"layer": "TCHW3B2D3500"})
            elif "tarugo" in union_der or "tornillo" in union_der:
                x_canto_der_centro = hx + gap + (espesor / 2.0)
                msp.add_circle((x_canto_der_centro, y_pos1), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})
                msp.add_circle((x_canto_der_centro, y_pos2), radius=4.0, dxfattribs={"layer": "TCHW3B8D2500"})

        mecanizados_cruzados = data.get("mecanizados_cruzados", [])
        for mec in mecanizados_cruzados:
            u_x = float(mec.get("u_mm", 0.0))
            v_y = float(mec.get("v_mm", 0.0))
            diam = float(mec.get("diametro_mm", 5.0))
            capa = mec.get("capa_dxf", "TCHW0B2D1200")
            cara = mec.get("cara", "cara_superior")

            if capa not in doc.layers:
                doc.layers.new(name=capa, dxfattribs={"color": 18})

            if cara == "canto_izq" or u_x <= -hx + 20.0:
                x_pos = -hx - gap - (espesor / 2.0)
                msp.add_circle((x_pos, v_y), radius=(diam / 2.0), dxfattribs={"layer": capa})
            elif cara == "canto_der" or u_x >= hx - 20.0:
                x_pos = hx + gap + (espesor / 2.0)
                msp.add_circle((x_pos, v_y), radius=(diam / 2.0), dxfattribs={"layer": capa})
            elif cara == "canto_inf" or v_y <= -hy + 20.0:
                y_pos = -hy - gap - (espesor / 2.0)
                msp.add_circle((u_x, y_pos), radius=(diam / 2.0), dxfattribs={"layer": capa})
            elif cara == "canto_sup" or v_y >= hy - 20.0:
                y_pos = hy + gap + (espesor / 2.0)
                msp.add_circle((u_x, y_pos), radius=(diam / 2.0), dxfattribs={"layer": capa})
            else:
                if abs(u_x) <= (hx - 2.0) and abs(v_y) <= (hy - 2.0):
                    msp.add_circle((u_x, v_y), radius=(diam / 2.0), dxfattribs={"layer": capa})

        stream = io.StringIO()
        doc.write(stream)
        dxf_content = stream.getvalue()

        version_clean = version.replace(" ", "")
        filename = f"{nombre}_{int(largo)}x{int(ancho)}_{int(espesor)}mm_{version_clean}.dxf"

        return {
            "status": "success",
            "filename": filename,
            "dxf_content": dxf_content,
            "machine_profile": "Biesse Skipper (bSolid/BiesseWorks)",
            "dimensions": f"{largo} x {ancho} x {espesor} mm"
        }
    except Exception as e:
        print(f"[3BF Worker DXF Error]: {e}", flush=True)
        return {"status": "error", "message": str(e)}
