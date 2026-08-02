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
    print(f"[3BF Worker] Parámetros extraídos -> Ancho:{ancho}, Alto:{alto}, Profundidad:{prof}, Cajones:{cant_cajones}, Apertura:{apertura_mm}, ProfCajon:{prof_cajon_param}, AltLatCajon:{alt_lat_cajon_param}", flush=True)
    
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
        {"nombre": "Par Correderas Telescópicas", "cantidad": correderas_count, "unidad": "pares"}
    ]
    
    area_madera_m2 = sum((p["ancho"] * p["largo"] * p["cantidad"]) for p in piezas_madera if p["espesor"] > 3) / 1_000_000.0
    costo_total = math.ceil(((area_madera_m2 * 48.0) + (correderas_count * 4.50) + 20.0) * 100) / 100
    
    # 2. Evaluación REAL en Rhino 8 RhinoCompute
    ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    variant_file = f"C:\\Desarrollo\\mmapp\\temporal\\Cajon_Experimento_Viktor_{cant_cajones}cajon{'es' if cant_cajones > 1 else ''}.ghx"
    if os.path.exists(variant_file):
        ghx_file = variant_file
        print(f"[3BF Worker] Usando archivo .ghx variante para {cant_cajones} cajón(es): {variant_file}", flush=True)

    real_meshes = []
    rhino_compute_success = False
    rhino_outputs_count = 0
    
    try:
        if os.path.exists(ghx_file):
            with open(ghx_file, "r", encoding="utf-8") as f:
                xml_str = f.read()
            b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
            
            payload_rc = {
                "algo": b64_algo,
                "pointer": None,
                "values": [
                    {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(ancho))}]}},
                    {"ParamName": "Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(ancho))}]}},
                    {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto))}]}},
                    {"ParamName": "Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto))}]}},
                    {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof))}]}},
                    {"ParamName": "Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof))}]}},
                    {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(cant_cajones))}]}},
                    {"ParamName": "RH_IN:Cantidad de Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(cant_cajones))}]}},
                    {"ParamName": "RH_IN:Abrir Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(apertura_mm))}]}},
                    {"ParamName": "RH_IN:Abrir cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(apertura_mm))}]}},
                    {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": "System.Int32", "data": str(int(prof_cajon_param))}]}},
                    {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": "System.String", "data": str(int(prof_cajon_param))}]}},
                    {"ParamName": "RH_IN:Altura lateral de cajon", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alt_lat_cajon_param))}]}},
                    {"ParamName": "RH_IN:Altura lateral de cajon", "InnerTree": {"{0}": [{"type": "System.Int32", "data": str(int(alt_lat_cajon_param))}]}}
                ]
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
                                        real_meshes.append({
                                            "name": p_name,
                                            "size": [x_sz, z_sz, y_sz],
                                            "position": [center["X"]/1000.0, center["Z"]/1000.0, center["Y"]/1000.0]
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
                                            real_meshes.append({
                                                "name": p_name,
                                                "size": [x_sz, z_sz, y_sz],
                                                "position": [center_x, center_z, center_y]
                                            })
                            except Exception as ex:
                                pass
                                
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
