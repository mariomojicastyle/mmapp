import requests
import json

ghx_path = r"C:\Desarrollo\mmapp\3BF\Definiciones\Cajon_Experimento_3DBimFab.ghx"
with open(ghx_path, "r", encoding="utf-8") as f:
    ghx_content = f.read()

payload = {
    "model_id": "Cajon_Experimento_3DBimFab",
    "custom_filename": "Cajon_Experimento_3DBimFab.ghx",
    "ghx_content": ghx_content,
    "ancho": 1200,
    "alto": 800,
    "profundidad": 400,
    "cant_cajones": 3,
    "apertura_cajones": 0,
    "profundidad_cajon": 351,
    "altura_lateral_cajon": 102,
    "distancia_bajo_laterales": 30,
    "tipo_cajon": "Corredera Estandar"
}

res = requests.post("http://127.0.0.1:8005/compute", json=payload)
print("HTTP STATUS:", res.status_code)
data = res.json()
print("STATUS IN JSON:", data.get("status"))
print("REAL MESHES COUNT:", len(data.get("real_meshes", [])))
