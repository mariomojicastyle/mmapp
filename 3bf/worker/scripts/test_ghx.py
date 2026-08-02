import requests

def test_ghx():
    payload = {
        "algo": r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx",
        "pointer": None,
        "values": []
    }

    res = requests.post("http://localhost:5000/grasshopper", json=payload)
    print("STATUS:", res.status_code)
    print("OUTPUT:", res.text[:1000])

if __name__ == "__main__":
    test_ghx()
