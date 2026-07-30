import requests
import json
import base64
import os

try:
    import rhino3dm
except ImportError:
    print("ERROR: Falta la libreria rhino3dm. Por favor instálala ejecutando: pip install rhino3dm")
    exit(1)

# Configuracion para el PC de Fadi
API_KEY = "MarioSalen_2024_Security"
GH_FILE_PATH = r"C:\Desarrollo\b2b-rhino-compute\definitions\sphere_from_params.gh"
OUTPUT_DIR = r"C:\Desarrollo\b2b-rhino-compute\output"

def discover_compute_url(api_key):
    print("Buscando automaticamente el puerto activo de Rhino Compute...")
    ports_to_try = [5000, 6004, 5001, 5002, 5003, 6005, 8081]
    headers = {"RhinoComputeKey": api_key}
    for port in ports_to_try:
        url = f"http://localhost:{port}/"
        try:
            print(f"Probando conexion en: {url}version ...")
            response = requests.get(f"{url}version", headers=headers, timeout=30)
            if response.status_code in [200, 401]:
                print(f"✅ ¡Servidor sano encontrado en el puerto {port}! (Status: {response.status_code})")
                return url
            else:
                print(f"❌ El servidor respondio pero con status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"Error conectando a {port}")
            pass
    return None

def test_final():
    print("--- PRUEBA FINAL EN EL PC DE FADI ---")
    
    compute_url = discover_compute_url(API_KEY)
    if not compute_url:
        print("ERROR: No se pudo encontrar ningun servidor de Rhino Compute sano corriendo.")
        print("Por favor, asegurate de que la consola del servidor dice 'Application started'.")
        return
    
    if not os.path.exists(GH_FILE_PATH):
        print(f"ERROR: No encuentro el archivo .gh en: {GH_FILE_PATH}")
        return

    try:
        with open(GH_FILE_PATH, "rb") as f:
            gh_data = base64.b64encode(f.read()).decode("utf-8")

        # --- NEW: Check IO first ---
        print("\n--- CONSULTANDO ESTRUCTURA /io DEL ARCHIVO ---")
        io_payload = {"algo": gh_data, "pointer": None}
        io_headers = {"RhinoComputeKey": API_KEY, "Content-Type": "application/json"}
        io_response = requests.post(f"{compute_url}io", data=json.dumps(io_payload), headers=io_headers)
        if io_response.status_code == 200:
            print("Estructura de parametros que espera Grasshopper:")
            print(json.dumps(io_response.json(), indent=2))
        else:
            print(f"Advertencia: No se pudo obtener /io (Status {io_response.status_code})")
        print("----------------------------------------------\n")


        # Usamos base64 para evitar el crash de 'pointer' con rutas locales
        payload = {
            "algo": gh_data,
            "pointer": None,
            "values": [
                {
                    "ParamName": "RH_IN:radius",
                    "InnerTree": {
                        "{0}": [
                            {
                                "type": "System.Double",
                                "data": "50.0"
                            }
                        ]
                    }
                },
                {
                    "ParamName": "radius",
                    "InnerTree": {
                        "{0}": [
                            {
                                "type": "System.Double",
                                "data": "50.0"
                            }
                        ]
                    }
                },
                {
                    "ParamName": "RH_IN:origin",
                    "InnerTree": {
                        "{0}": [
                            {
                                "type": "Rhino.Geometry.Point3d",
                                "data": json.dumps({"X": 0.0, "Y": 0.0, "Z": 0.0})
                            }
                        ]
                    }
                },
                {
                    "ParamName": "origin",
                    "InnerTree": {
                        "{0}": [
                            {
                                "type": "Rhino.Geometry.Point3d",
                                "data": json.dumps({"X": 0.0, "Y": 0.0, "Z": 0.0})
                            }
                        ]
                    }
                }
            ]
        }

        headers = {"RhinoComputeKey": API_KEY, "Content-Type": "application/json"}
        
        print("--- PRUEBA CON NOMBRES ESTANDAR (RH_IN) ---")
        print("Enviando datos usando 'algo' en base64...")
        response = requests.post(f"{compute_url}grasshopper", data=json.dumps(payload), headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print("¡EXITO TOTAL! El servidor respondio 200 OK.")
            
            print("Parametros devueltos por Rhino Compute:")
            for val in result.get("values", []):
                print(f" -> {val['ParamName']}")
                
                if "RH_OUT:geometry" in val["ParamName"] or "RH_OUT" in val["ParamName"] or "geometry" in val["ParamName"].lower():
                    print("¡Encontramos la geometria!")
                    geom_json = val["InnerTree"]["{0}"][0]["data"]
                    
                    print("Decodificando la geometria JSON...")
                    obj = rhino3dm.CommonObject.Decode(json.loads(geom_json))
                    
                    doc = rhino3dm.File3dm()
                    doc.Objects.Add(obj)
                    
                    if not os.path.exists(OUTPUT_DIR):
                        os.makedirs(OUTPUT_DIR)
                        
                    output_file = os.path.join(OUTPUT_DIR, "esfera_final.3dm")
                    doc.Write(output_file, 8)
                    print(f"✅ ¡Archivo 3DM guardado exitosamente en: {output_file}!")
                    break
            else:
                print("❌ No se encontro la geometria de salida en la respuesta.")
                
        else:
            print(f"\nError 500: El servidor respondio pero fallo en el endpoint /grasshopper.")
            
            if not os.path.exists(OUTPUT_DIR):
                os.makedirs(OUTPUT_DIR)
            error_file = os.path.join(OUTPUT_DIR, "error.txt")
            with open(error_file, "w", encoding="utf-8") as f:
                f.write(response.text)
            
            print("==================================================")
            print(f"🔥 EXCEPCION DE RHINO COMPUTE:")
            print(response.text[:2000])  # Imprimimos parte del error directo en consola
            if len(response.text) > 2000:
                print(f"\n... (El error era mas largo, lo he guardado completo en {error_file})")
            print("==================================================")

    except Exception as e:
        print(f"Error general en el script: {e}")

if __name__ == "__main__":
    test_final()
