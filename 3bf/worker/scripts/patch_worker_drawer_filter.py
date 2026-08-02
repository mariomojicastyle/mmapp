import re

def patch_worker_drawers():
    worker_path = r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py"
    with open(worker_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Lógica de filtrado inteligente por cantidad de cajones (1, 2, 3) sobre las mallas devueltas de Grasshopper
    drawer_filter_logic = """
    # Filtrar mallas de cajón según la cantidad de cajones seleccionada (1, 2, 3)
    if cant_cajones in [1, 2]:
        filtered_meshes = []
        
        # Clasificar mallas por tipo
        frentes = [m for m in real_meshes if "Frente" in m["name"]]
        posteriores = [m for m in real_meshes if "Posterior" in m["name"]]
        tapas_luz = [m for m in real_meshes if "Tapa Luz" in m["name"]]
        lat_izq = [m for m in real_meshes if "Lateral Izq" in m["name"]]
        lat_der = [m for m in real_meshes if "Lateral Der" in m["name"]]
        estructurales = [m for m in real_meshes if not any(k in m["name"] for k in ["Frente", "Posterior", "Tapa Luz", "Lateral Izq", "Lateral Der"])]

        # Ordenar por posición Y (de arriba a abajo)
        frentes.sort(key=lambda x: x["position"][1], reverse=True)
        posteriores.sort(key=lambda x: x["position"][1], reverse=True)
        tapas_luz.sort(key=lambda x: x["position"][1], reverse=True)
        lat_izq.sort(key=lambda x: x["position"][1], reverse=True)
        lat_der.sort(key=lambda x: x["position"][1], reverse=True)

        alt_interior_m = (alto - 30.0) / 1000.0
        y_center_cabinet = alto / 2.0 / 1000.0

        if cant_cajones == 1:
            # 1 Cajón: 1 Frente gigante de arriba a abajo, 1 posterior, 1 tapa luz, 2 laterales
            if frentes:
                f1 = dict(frentes[0])
                f1["size"] = [f1["size"][0], f1["size"][1], alt_interior_m - 0.006]
                f1["position"] = [f1["position"][0], y_center_cabinet, f1["position"][2]]
                filtered_meshes.append(f1)

            if posteriores:
                p1 = dict(posteriores[0])
                p1["position"] = [p1["position"][0], y_center_cabinet, p1["position"][2]]
                filtered_meshes.append(p1)

            if tapas_luz:
                t1 = dict(tapas_luz[0])
                t1["position"] = [t1["position"][0], y_center_cabinet + (alt_interior_m/2.0) - 0.03, t1["position"][2]]
                filtered_meshes.append(t1)

            if lat_izq:
                l1 = dict(lat_izq[0])
                l1["position"] = [l1["position"][0], y_center_cabinet, l1["position"][2]]
                filtered_meshes.append(l1)

            if lat_der:
                r1 = dict(lat_der[0])
                r1["position"] = [r1["position"][0], y_center_cabinet, r1["position"][2]]
                filtered_meshes.append(r1)

        elif cant_cajones == 2:
            # 2 Cajones: 2 Frentes medianos, 2 posteriores, 2 tapas luz, 4 laterales
            h_drawer = (alt_interior_m - 0.006) / 2.0
            y_top = y_center_cabinet + h_drawer / 2.0
            y_bot = y_center_cabinet - h_drawer / 2.0

            for idx, y_p in enumerate([y_top, y_bot]):
                if idx < len(frentes):
                    f_m = dict(frentes[idx])
                    f_m["size"] = [f_m["size"][0], f_m["size"][1], h_drawer - 0.003]
                    f_m["position"] = [f_m["position"][0], y_p, f_m["position"][2]]
                    filtered_meshes.append(f_m)

                if idx < len(posteriores):
                    p_m = dict(posteriores[idx])
                    p_m["position"] = [p_m["position"][0], y_p, p_m["position"][2]]
                    filtered_meshes.append(p_m)

                if idx < len(tapas_luz):
                    t_m = dict(tapas_luz[idx])
                    t_m["position"] = [t_m["position"][0], y_p + h_drawer/2.0 - 0.02, t_m["position"][2]]
                    filtered_meshes.append(t_m)

                if idx < len(lat_izq):
                    l_m = dict(lat_izq[idx])
                    l_m["position"] = [l_m["position"][0], y_p, l_m["position"][2]]
                    filtered_meshes.append(l_m)

                if idx < len(lat_der):
                    r_m = dict(lat_der[idx])
                    r_m["position"] = [r_m["position"][0], y_p, r_m["position"][2]]
                    filtered_meshes.append(r_m)

        real_meshes = estructurales + filtered_meshes
"""

    if "Filtrar mallas de cajón según la cantidad" not in code:
        code = code.replace("execution_time_ms = round((time.time() - start_time) * 1000, 2)", drawer_filter_logic + "\n    execution_time_ms = round((time.time() - start_time) * 1000, 2)")
        with open(worker_path, "w", encoding="utf-8") as f:
            f.write(code)
        print("  [OK] 3bf_worker.py actualizado con filtro de 1, 2 y 3 cajones.")

if __name__ == "__main__":
    patch_worker_drawers()
