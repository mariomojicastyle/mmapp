import os
import json
import trimesh

base_dir = r"c:\Desarrollo\mmapp\legacy-aplicativo-armado\public"
model_id = "M01536"
data_json_path = os.path.join(base_dir, model_id, "data.json")

with open(data_json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

alturas = []

for paso in data.get('pasos', []):
    glb_path = os.path.join(base_dir, model_id, "models", f"P{paso}.glb")
    if not os.path.exists(glb_path):
        print(f"File not found: {glb_path}")
        continue
    
    try:
        # force='scene' ensures we get a trimesh.Scene which handles transforms
        scene = trimesh.load(glb_path, force='scene')
        
        # scene.bounds returns [[min_x, min_y, min_z], [max_x, max_y, max_z]]
        bounds = scene.bounds 
        
        # In glTF format, Y is the UP axis
        min_y = bounds[0][1]
        max_y = bounds[1][1]
        
        # El piso debe estar exactamente en el punto más bajo (min_y)
        plane = min_y
        
        # El skybox se mantiene a una distancia constante relativa al piso 
        # para que la habitacion entera suba o baje con el piso.
        # Basado en la escala visual, un offset de 1.5 desde el piso al centro del skybox es ideal.
        skybox = plane + 1.5
        
        # Centro absoluto de la pieza para enfocar la camara
        center_x = (bounds[1][0] + bounds[0][0]) / 2.0
        center_y = (bounds[1][1] + bounds[0][1]) / 2.0
        center_z = (bounds[1][2] + bounds[0][2]) / 2.0

        alturas.append({
            "paso": paso,
            "skyBox": round(float(skybox), 3),
            "plane": round(float(plane), 3),
            "target": [round(float(center_x), 3), round(float(center_y), 3), round(float(center_z), 3)]
        })
    except Exception as e:
        print(f"Error procesando {glb_path}: {e}")

data['alturas'] = alturas

with open(data_json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

print("Nuevos valores calculados:")
print(json.dumps(alturas, indent=4))
print("\n¡Archivo data.json actualizado exitosamente!")
