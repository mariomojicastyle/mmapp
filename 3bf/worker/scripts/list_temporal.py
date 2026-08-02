import os

def list_temporal():
    folder = r"C:\Desarrollo\mmapp\temporal"
    print("=== ARCHIVOS EN TEMPORAL ===")
    for f in os.listdir(folder):
        print("  •", f)

if __name__ == "__main__":
    list_temporal()
