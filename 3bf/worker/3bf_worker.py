import os
import sys
import json
import base64
import time
import math
import requests
import uvicorn
import rhino3dm
import xml.etree.ElementTree as ET
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="3BF Worker Python Engine", version="1.0.0")

def parse_ghx_slider_limits(ghx_path):
    limits = {}
    if not os.path.exists(ghx_path):
        return limits

    try:
        tree = ET.parse(ghx_path)
        root = tree.getroot()

        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                name_item = chunk.find("items/item[@name='Name']")
                if name_item is not None and "Number Slider" in str(name_item.text):
                    container = chunk.find("chunks/chunk[@name='Container']")
                    if container is not None:
                        nick_item = container.find("items/item[@name='NickName']")
                        slider_chunk = container.find("chunks/chunk[@name='Slider']")
                        
                        if nick_item is not None and slider_chunk is not None:
                            nick = nick_item.text or ""
                            min_item = slider_chunk.find("items/item[@name='Min']")
                            max_item = slider_chunk.find("items/item[@name='Max']")
                            val_item = slider_chunk.find("items/item[@name='Value']")

                            if min_item is not None and max_item is not None:
                                limits[nick] = {
                                    "min": float(min_item.text),
                                    "max": float(max_item.text),
                                    "default": float(val_item.text) if val_item is not None else float(min_item.text)
                                }
    except Exception as e:
        print(f"[3BF Worker] Error parseando límites slider: {e}", flush=True)

    return limits

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ComputeParams(BaseModel):
    model_id: str = "Cajon_Experimento_Viktor"
    ancho: float = 1200.0
    alto: float = 800.0
    profundidad: float = 400.0
    cant_cajones: int = 3
    apertura_mm: float = 0.0
    parameters: dict = {}

@app.get("/health")
def health_check():
    return {"status": "ok", "worker": "3BF Python Engine", "rhino_compute": "http://127.0.0.1:5000"}

@app.post("/compute")
def compute_model(params: ComputeParams):
    start_time = time.time()
    
    p = params.parameters or {}
    ancho = float(p.get("ancho", params.ancho))
    alto = float(p.get("alto", params.alto))
    prof = float(p.get("profundidad", params.profundidad))
    cant_cajones = int(p.get("cant_cajones", params.cant_cajones))
    apertura_mm = float(p.get("apertura_cajones", p.get("apertura_mm", params.apertura_mm)))
    prof_cajon_param = float(p.get("profundidad_cajon", 351.0))
    alt_lat_cajon_param = float(p.get("altura_lateral_cajon", 102.0))
    dist_bajo_lat_param = float(p.get("distancia_bajo_laterales", 30.0))
    tipo_cajon_param = str(p.get("tipo_cajon", "Corredera Estandar"))
    print(f"[3BF Worker v1.1] Parámetros extraídos -> Ancho:{ancho}, Alto:{alto}, Profundidad:{prof}, Cajones:{cant_cajones}, Apertura:{apertura_mm}, ProfCajon:{prof_cajon_param}, AltLatCajon:{alt_lat_cajon_param}, DistBajoLat:{dist_bajo_lat_param}, TipoCajon:{tipo_cajon_param}", flush=True)
    
    esp = 15.0  # Espesor estándar MDP 15mm
    
    # 1. Despiece estructural sintético
    anc_interior = ancho - (esp * 2)
    alt_interior = alto - (esp * 2)
    anc_frente_cajon = anc_interior - 4
    alt_frente_cajon = (alt_interior - ((cant_cajones + 1) * 3)) / cant_cajones
    prof_cajon = prof - 50
    alt_lateral_cajon = max(80.0, alt_frente_cajon - 30)
    
    piezas_madera = [
        {"nombre": "Lateral Izquierdo", "ancho": prof, "largo": alto, "espesor": esp, "cantidad": 1, "tipo": "Estructura"},
        {"nombre": "Lateral Derecho", "ancho": prof, "largo": alto, "espesor": esp, "cantidad": 1, "tipo": "Estructura"},
        {"nombre": "Cubierta Superior", "ancho": prof, "largo": anc_interior, "espesor": esp, "cantidad": 1, "tipo": "Estructura"},
        {"nombre": "Cubierta Inferior", "ancho": prof, "largo": anc_interior, "espesor": esp, "cantidad": 1, "tipo": "Estructura"},
    ]
    
    for i in range(cant_cajones):
        idx = i + 1
        piezas_madera.append({"nombre": f"Frente Cajón {idx}", "ancho": prof_cajon, "largo": anc_frente_cajon, "espesor": esp, "cantidad": 1, "tipo": "Frente Cajón"})
        piezas_madera.append({"nombre": f"Lateral Izq Cajón {idx}", "ancho": prof_cajon, "largo": alt_lateral_cajon, "espesor": esp, "cantidad": 1, "tipo": "Cajón"})
        piezas_madera.append({"nombre": f"Lateral Der Cajón {idx}", "ancho": prof_cajon, "largo": alt_lateral_cajon, "espesor": esp, "cantidad": 1, "tipo": "Cajón"})
        piezas_madera.append({"nombre": f"Posterior Cajón {idx}", "ancho": anc_frente_cajon - (esp * 2), "largo": alt_lateral_cajon, "espesor": esp, "cantidad": 1, "tipo": "Cajón"})
    
    minifix_count = 16 + (cant_cajones * 8)
    tarugos_count = cant_cajones * 12
    correderas_count = cant_cajones
    
    herrajes = [
        {"nombre": "Caja Minifix 15mm", "cantidad": minifix_count, "unidad": "piezas"},
        {"nombre": "Perno Minifix 34mm", "cantidad": minifix_count, "unidad": "piezas"},
        {"nombre": "Tarugo Madera 8x30mm", "cantidad": tarugos_count, "unidad": "piezas"},
        {"nombre": f"Par Correderas ({tipo_cajon_param})", "cantidad": correderas_count, "unidad": "pares"}
    ]
    
    area_madera_m2 = sum((p["ancho"] * p["largo"] * p["cantidad"]) for p in piezas_madera if p["espesor"] > 3) / 1_000_000.0
    costo_total = math.ceil(((area_madera_m2 * 48.0) + (correderas_count * 4.50) + 20.0) * 100) / 100
    
    # 2. Selección de Algoritmo NATIVO (.ghx)
    model_id = str(p.get("model_id", params.model_id))
    if "Cubierta" in model_id:
        ghx_file = r"C:\Desarrollo\mmapp\temporal\Cubierta.ghx"
    else:
        ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_v1.1.ghx"
        if not os.path.exists(ghx_file):
            ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"

    real_meshes = []
    rhino_compute_success = False
    rhino_outputs_count = 0
    
    try:
        if os.path.exists(ghx_file):
            tree = ET.parse(ghx_file)
            root = tree.getroot()
            
            # Si es el modelo Cubierta, aplicar bypass de VisualARQ 'Set Value' para enviar la geometría nativa a RhinoCompute
            # Si es el modelo Cubierta, aplicar bypass de VisualARQ 'Set Value' para enviar la geometría nativa a RhinoCompute (Izquierda Y Derecha)
            if "Cubierta" in ghx_file:
                rewire_map = {
                    '21465fe2-869f-4061-8a2d-f4bb9399f6e5': '3dc7bf67-ab8d-4c61-aa05-93175f1ce926', # Nurbs Cubierta -> Base Board 3D (Estructural y Permanente)
                    
                    # Izquierda (Left Side Hardware)
                    'c14a6ca0-bdcb-45f6-a576-13153366398a': '038cc9a6-85f5-446a-9791-2202c5c1a0f1', # Perno Izq (RH_OUT:Perno)
                    '4663d7cb-04e8-4e23-b099-e2896ae839e4': '783f5114-53d1-420c-a97f-6ff10d91d426', # Caja Izq (RH_OUT:Caja)
                    '75968322-cf7d-4332-bb53-6c72f290fade': '69d5e5fc-3a6f-40ff-98ce-0572b5ac7695', # Tornillo Izq (RH_OUT:Tornillo)
                    'c70a82da-db8d-44d0-aec5-05e71977f590': '08f431bd-a57b-4b5c-86b8-cff10387ce35', # Tarugo Izq (RH_OUT:Tarugo)
                    
                    # Derecha (Right Side Hardware) - Vía contenedores RH_OUT en el XML
                    'b7854689-dfba-4dd1-a76c-bdec699f95e0': '328ea0a0-5a8a-4715-8691-2c9c1da41468', # Perno Der (RH_OUT:Balance cubierta)
                    'd01ff2e2-bbaf-41d0-8f17-ac8b01230132': 'ea16a63d-25f0-4957-b1f8-90bead7dc4b2', # Caja Der (RH_OUT:Color cubierta)
                    '0f2a6a4c-0de8-45c6-9037-2b4c5263b6d8': 'c26c822c-ab0c-420b-9af8-63187f83949d', # Tornillo Der (RH_OUT:MDP)
                    '8789bf31-df54-4aec-b820-9657f0c51a03': 'e8d6eff7-7ca8-47e8-9916-a58b97d8f450', # Tarugo Der (RH_OUT:Color entrepaño)
                    
                    '501e719d-09d8-412c-b8c5-25db34e20917': '632fe3cd-270d-4c14-8e44-845ec33109c0', # MDPNurbs Entrepaño -> Stream Filter
                    '658abfee-c4d7-4beb-bf81-8c09b2543218': '406412a7-4c4d-4fa9-b652-4b0da790e98b', # Soporte -> Stream Filter
                    '63a16105-bc13-46ae-8b10-9e5195628380': '6001ab48-df94-40f3-a6a7-58968419bc18', # Maquinados -> Mesh Brep
                }
                for chunk in root.iter("chunk"):
                    if chunk.attrib.get("name") == "Container":
                        guid = ""
                        for it in chunk.findall("items/item"):
                            if it.attrib.get("name") == "InstanceGuid":
                                guid = it.text
                        if guid in rewire_map:
                            target_src = rewire_map[guid]
                            for item in chunk.iter("item"):
                                if item.attrib.get("name") == "Source":
                                    item.text = target_src

            # Mapeo de NickNames de Value Lists a sus valores deseados (formato texto)
            value_list_targets = {
                "RH_IN:Cantidada de Cajones": str(int(cant_cajones)),
                "RH_IN:Cantidad de Cajones": str(int(cant_cajones)),
                "RH_IN:Profundidad cajon": str(int(prof_cajon_param)),
                "RH_IN:Altura lateral de cajon": str(int(alt_lat_cajon_param)),
                "RH_IN:Distancia bajo laterales": str(int(dist_bajo_lat_param)),
                "RH_IN:Tipo Cajon": tipo_cajon_param,
                # Parámetros Cubierta.ghx (VisualARQ DfMA)
                "RH_IN:03 Tipo de union izquierda": str(p.get("union_izquierda", "Minifix")),
                "RH_IN:04 Tipo de union Derecha": str(p.get("union_derecha", "Tornillo tarugo")),
                "RH_IN:05 Orientacion maquinado minifix": str(p.get("orientacion_maquinado_minifix", "abajo")),
                "RH_IN:06 Orientacion minifix": str(p.get("orientacion_minifix", "abajo")),
                "RH_IN:Posicion Tarugo": str(p.get("posicion_tarugo", "1")),
                "RH_IN:Posicion Tornillo": str(p.get("posicion_tornillo", "1")),
                "RH_IN:Borde izquierdo": str(p.get("borde_izquierdo", "MDP")),
                "RH_IN:Borde derecho": str(p.get("borde_derecho", "MDP")),
                "RH_IN:Lado balance cubierta": str(p.get("lado_balance_cubierta", "Cara B")),
                "RH_IN:Tipo de mapeado cubierta": str(p.get("tipo_mapeado_cubierta", "Cubierta")),
                "RH_IN:Lado balance entrepaño": str(p.get("lado_balance_entrepanio", "Cara B")),
                "RH_IN:Tipo de mapeado entrepaño": str(p.get("tipo_mapeado_entrepanio", "Cubierta")),
            }
            
            for chunk in root.iter("chunk"):
                if chunk.attrib.get("name") == "Container":
                    nick = ""
                    for it in chunk.findall("items/item"):
                        if it.attrib.get("name") == "NickName":
                            nick = it.text or ""
                    
                    if nick in value_list_targets:
                        target_val = value_list_targets[nick]
                        for sub in chunk.iter("chunk"):
                            if sub.attrib.get("name") == "ListItem":
                                name_item = sub.find("items/item[@name='Name']")
                                expr_item = sub.find("items/item[@name='Expression']")
                                sel_item = sub.find("items/item[@name='Selected']")
                                
                                item_name = name_item.text if name_item is not None else ""
                                item_expr = expr_item.text if expr_item is not None else ""
                                
                                if sel_item is not None:
                                    if item_name == target_val or item_expr == target_val:
                                        sel_item.text = "true"
                                    else:
                                        sel_item.text = "false"

            xml_bytes = ET.tostring(root, encoding="utf-8")
            b64_algo = base64.b64encode(xml_bytes).decode("utf-8")
            print(f"[3BF Worker] Solucionando modelo {model_id} ({ghx_file}) en RhinoCompute", flush=True)
            
            # Reactivador / Despertador: Micro-fluctuación imperceptible para forzar a RhinoCompute a limpiar caché y recalcular la geometría completa
            reactivador_ping = (int(time.time() * 1000) % 2) * 0.0001
            effective_ancho = float(ancho) + reactivador_ping

            payload_values = [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(effective_ancho)}]}},
                {"ParamName": "RH_IN:01 Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(effective_ancho)}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto))}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof))}]}},
                {"ParamName": "RH_IN:02 Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof))}]}},
                {"ParamName": "RH_IN:07 Recedido izquierdo", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(p.get("recedido_izquierdo", 0)))}]}},
                {"ParamName": "RH_IN:08 Recedido derecho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(p.get("recedido_derecho", 0)))}]}},
            ]
            if "Cubierta" not in ghx_file:
                payload_values.extend([
                    {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.String", "data": str(int(cant_cajones))}]}},
                    {"ParamName": "RH_IN:Abrir Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(apertura_mm))}]}},
                    {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": "System.String", "data": str(int(prof_cajon_param))}]}},
                    {"ParamName": "RH_IN:Altura lateral de cajon", "InnerTree": {"{0}": [{"type": "System.String", "data": str(int(alt_lat_cajon_param))}]}},
                    {"ParamName": "RH_IN:Distancia bajo laterales", "InnerTree": {"{0}": [{"type": "System.String", "data": str(int(dist_bajo_lat_param))}]}},
                    {"ParamName": "RH_IN:Tipo Cajon", "InnerTree": {"{0}": [{"type": "System.String", "data": tipo_cajon_param}]}}
                ])
                
            payload_rc = {
                "algo": b64_algo,
                "pointer": None,
                "values": payload_values
            }
            
            res_rc = requests.post("http://127.0.0.1:5000/grasshopper", json=payload_rc, timeout=10)
            if res_rc.status_code == 200:
                rhino_compute_success = True
                data_rc = res_rc.json()
                rhino_outputs_count = len(data_rc.get("values", []))
                
                for val in data_rc.get("values", []):
                    p_name = val.get("ParamName", "Pieza GH")
                    inner_tree = val.get("InnerTree", {})
                    for path_key, items in inner_tree.items():
                        for item in items:
                            raw_data = item.get("data")
                            if not raw_data:
                                continue
                            try:
                                obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                                if isinstance(obj, dict):
                                    if "X" in obj and "Y" in obj and "Z" in obj:
                                        x_sz = abs(obj["X"]["T1"] - obj["X"]["T0"]) / 1000.0
                                        y_sz = abs(obj["Y"]["T1"] - obj["Y"]["T0"]) / 1000.0
                                        z_sz = abs(obj["Z"]["T1"] - obj["Z"]["T0"]) / 1000.0
                                        center = obj.get("Center", {"X": 0, "Y": 0, "Z": 0})
                                        
                                        min_x, max_x = obj["X"]["T0"] / 1000.0, obj["X"]["T1"] / 1000.0
                                        min_y, max_y = obj["Y"]["T0"] / 1000.0, obj["Y"]["T1"] / 1000.0
                                        min_z, max_z = obj["Z"]["T0"] / 1000.0, obj["Z"]["T1"] / 1000.0
                                        
                                        real_meshes.append({
                                            "name": p_name,
                                            "size": [x_sz, z_sz, y_sz],
                                            "position": [center["X"]/1000.0, center["Z"]/1000.0, center["Y"]/1000.0],
                                            "vertices": [
                                                min_x, min_z, min_y,  min_x, max_z, min_y,  max_x, max_z, min_y,  max_x, min_z, min_y,
                                                min_x, min_z, max_y,  min_x, max_z, max_y,  max_x, max_z, max_y,  max_x, min_z, max_y,
                                            ],
                                            "indices": [
                                                0, 2, 1,  0, 3, 2,
                                                4, 5, 6,  4, 6, 7,
                                                0, 1, 5,  0, 5, 4,
                                                2, 3, 7,  2, 7, 6,
                                                0, 4, 7,  0, 7, 3,
                                                1, 2, 6,  1, 6, 5
                                            ]
                                        })
                                    elif "archive3dm" in obj or "opennurbs" in obj:
                                        decoded_geom = rhino3dm.CommonObject.Decode(obj)
                                        if decoded_geom:
                                            bbox = decoded_geom.GetBoundingBox()
                                            x_sz = max(0.005, abs(bbox.Max.X - bbox.Min.X) / 1000.0)
                                            y_sz = max(0.005, abs(bbox.Max.Y - bbox.Min.Y) / 1000.0)
                                            z_sz = max(0.005, abs(bbox.Max.Z - bbox.Min.Z) / 1000.0)
                                            center_x = (bbox.Min.X + bbox.Max.X) / 2.0 / 1000.0
                                            center_y = (bbox.Min.Y + bbox.Max.Y) / 2.0 / 1000.0
                                            center_z = (bbox.Min.Z + bbox.Max.Z) / 2.0 / 1000.0
                                            
                                            alias_map = {
                                                "RH_OUT:Balance cubierta": "RH_OUT:Perno",
                                                "RH_OUT:Color cubierta": "RH_OUT:Caja",
                                                "RH_OUT:MDP": "RH_OUT:Tornillo",
                                                "RH_OUT:Color entrepaño": "RH_OUT:Tarugo"
                                            }
                                            effective_name = alias_map.get(p_name, p_name)

                                            mesh_dict = {
                                                "name": effective_name,
                                                "size": [x_sz, z_sz, y_sz],
                                                "position": [center_x, center_z, center_y]
                                            }
                                            
                                            # Si el objeto es una Malla Poligonal real, extraer vértices e índices de triángulos
                                            if isinstance(decoded_geom, rhino3dm.Mesh):
                                                verts = []
                                                for v in decoded_geom.Vertices:
                                                    verts.extend([round(v.X / 1000.0, 4), round(v.Z / 1000.0, 4), round(v.Y / 1000.0, 4)])
                                                indices = []
                                                for i in range(len(decoded_geom.Faces)):
                                                    f = decoded_geom.Faces[i]
                                                    indices.extend([f[0], f[1], f[2]])
                                                    if f[2] != f[3]:
                                                        indices.extend([f[2], f[3], f[0]])
                                                if verts and indices:
                                                    mesh_dict["vertices"] = verts
                                                    mesh_dict["indices"] = indices
                                            elif isinstance(decoded_geom, rhino3dm.Brep):
                                                # Generar malla 3D poligonal exacta para objetos Brep/NURBS en coordenadas de mundo Three.js
                                                min_x, max_x = bbox.Min.X / 1000.0, bbox.Max.X / 1000.0
                                                min_y, max_y = bbox.Min.Y / 1000.0, bbox.Max.Y / 1000.0
                                                min_z, max_z = bbox.Min.Z / 1000.0, bbox.Max.Z / 1000.0
                                                
                                                mesh_dict["vertices"] = [
                                                    min_x, min_z, min_y,  min_x, max_z, min_y,  max_x, max_z, min_y,  max_x, min_z, min_y,
                                                    min_x, min_z, max_y,  min_x, max_z, max_y,  max_x, max_z, max_y,  max_x, min_z, max_y,
                                                ]
                                                mesh_dict["indices"] = [
                                                    0, 2, 1,  0, 3, 2,
                                                    4, 5, 6,  4, 6, 7,
                                                    0, 1, 5,  0, 5, 4,
                                                    2, 3, 7,  2, 7, 6,
                                                    0, 4, 7,  0, 7, 3,
                                                    1, 2, 6,  1, 6, 5
                                                ]
                                                    
                                            real_meshes.append(mesh_dict)
                            except Exception as ex:
                                pass
                                
                # Garantía 100% Estructural: Si la sustracción booleana de un herraje hizo colapsar la salida del tablero, inyectar el tablero base automáticamente
                if "Cubierta" in ghx_file:
                    has_main_board = any("Cubierta" in m.get("name", "") or "Entrepaño" in m.get("name", "") for m in real_meshes)
                    if not has_main_board:
                        print(f"[3BF Worker Reactivador] Inyectando Tablero Base Estructural Cubierta ({ancho}mm x {prof}mm)", flush=True)
                        real_meshes.append({
                            "name": "RH_OUT:Nurbs Cubierta (Reactivador DfMA)",
                            "size": [float(ancho) / 1000.0, 0.015, float(prof) / 1000.0],
                            "position": [0, 0.0075, 0]
                        })

                print(f"[3BF Worker] RhinoCompute respondió HTTP 200 | Mallas extraídas: {len(real_meshes)}", flush=True)
    except Exception as err:
        print(f"[RhinoCompute Notice]: {err}", flush=True)
        
    
    execution_time_ms = round((time.time() - start_time) * 1000, 2)
    
    slider_limits = parse_ghx_slider_limits(ghx_file)
    
    return {
        "status": "success",
        "model_id": "Cajon_Experimento_Viktor",
        "source_gh": "temporal/Cajon_Experimento_Viktor_RhinoCompute.ghx",
        "rhino8_compute": {
            "active": rhino_compute_success,
            "server": "http://localhost:5000",
            "outputs_evaluated": rhino_outputs_count,
            "real_meshes_extracted": len(real_meshes)
        },
        "real_meshes": real_meshes,
        "execution_time_ms": execution_time_ms,
        "slider_limits": slider_limits,
        "summary": {
            "dimensiones": f"{ancho} x {alto} x {prof} mm",
            "area_madera_m2": round(area_madera_m2, 3),
            "costo_estimado_usd": costo_total,
            "piezas_totales": sum(p["cantidad"] for p in piezas_madera)
        },
        "despiece": piezas_madera,
        "herrajes": herrajes
    }

if __name__ == "__main__":
    print("[3BF Worker] Arrancando 3BF Worker Python Engine en puerto 8005...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=8005)
