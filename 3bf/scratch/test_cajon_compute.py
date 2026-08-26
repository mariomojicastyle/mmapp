import sys
import os
import importlib.util

spec = importlib.util.spec_from_file_location("worker", r"C:\Desarrollo\mmapp\3BF\worker\3bf_worker.py")
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)

ghx_path = r"C:\Desarrollo\mmapp\3BF\Definiciones\Cajon_Experimento_3DBimFab.ghx"

with open(ghx_path, "r", encoding="utf-8") as f:
    ghx_content = f.read()

p = worker.ComputeParams(
    model_id="Cajon_Experimento_3DBimFab",
    custom_filename="Cajon_Experimento_3DBimFab.ghx",
    ghx_content=ghx_content,
    ancho=1200,
    alto=800,
    profundidad=400,
    cant_cajones=3,
    apertura_cajones=0,
    profundidad_cajon=351,
    altura_lateral_cajon=102,
    distancia_bajo_laterales=30,
    tipo_cajon="Corredera Estandar"
)

try:
    res = worker.compute_model(p)
    print("STATUS:", res.get("status"))
    print("NUM REAL MESHES:", len(res.get("real_meshes", [])))
    print("PIEZAS MADERA:", len(res.get("piezas_madera", [])))
except Exception as e:
    import traceback
    traceback.print_exc()
