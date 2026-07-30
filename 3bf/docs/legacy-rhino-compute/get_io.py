import requests
import base64
import json
import sys

# Import discover logic from test_final
sys.path.append(r"C:\Desarrollo\b2b-rhino-compute\scripts")
try:
    from test_final import discover_compute_url, API_KEY
except:
    API_KEY = "MarioSalen_2024_Security"
    def discover_compute_url(api_key):
        ports_to_try = [5000, 6004, 5001, 5002, 5003, 6005, 8081]
        for port in ports_to_try:
            url = f"http://localhost:{port}/"
            try:
                response = requests.get(f"{url}version", headers={"RhinoComputeKey": api_key}, timeout=30)
                if response.status_code in [200, 401]:
                    return url
            except:
                pass
        return None

FILE_PATH = r"C:\Desarrollo\b2b-rhino-compute\definitions\sphere_from_params.gh"

print("--- OBTENIENDO INPUTS/OUTPUTS DEL ARCHIVO GH ---")
compute_url = discover_compute_url(API_KEY)
if not compute_url:
    print("Servidor no encontrado!")
    sys.exit(1)

URL = f"{compute_url}io"
try:
    with open(FILE_PATH, "rb") as f:
        gh_data = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "algo": gh_data,
        "pointer": None
    }

    headers = {
        "RhinoComputeKey": API_KEY,
        "Content-Type": "application/json"
    }

    response = requests.post(URL, data=json.dumps(payload), headers=headers)
    
    if response.status_code == 200:
        print("EXITO! El archivo tiene la siguiente estructura:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"ERROR {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"Error: {e}")
