import os
import time

def list_temporal_files():
    folder = r"C:\Desarrollo\mmapp\temporal"
    print(f"=== Archivos en {folder} ===")
    for fname in os.listdir(folder):
        fpath = os.path.join(folder, fname)
        if os.path.isfile(fpath):
            mtime = os.path.getmtime(fpath)
            time_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime))
            size_kb = os.path.getsize(fpath) / 1024.0
            print(f"  • File: '{fname}' | Modificado: {time_str} | Tamaño: {size_kb:.1f} KB")

if __name__ == "__main__":
    list_temporal_files()
