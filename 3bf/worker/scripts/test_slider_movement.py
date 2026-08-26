import requests

def test_ancho(ancho_val):
    res = requests.post('http://localhost:3005/api/compute', json={
        'model_id': 'Cajon_Experimento_Viktor',
        'parameters': {
            'model_id': 'Cajon_Experimento_Viktor',
            'ancho': ancho_val,
            'alto': 900,
            'profundidad': 500,
            'cant_cajones': 3
        }
    })
    data = res.json()
    print(f"\n--- Probando Ancho = {ancho_val} mm ---")
    for m in data.get('real_meshes', []):
        print(f"  • {m['name']} -> Tamaño X: {m['size'][0]:.3f} m | Posición X: {m['position'][0]:.3f} m")

if __name__ == "__main__":
    test_ancho(950)
    test_ancho(1500)
