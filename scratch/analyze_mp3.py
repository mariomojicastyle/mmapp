import os

def analyze(filename):
    if not os.path.exists(filename):
        print(f"{filename} does not exist")
        return
    with open(filename, "rb") as f:
        data = f.read(100)
    print(f"File: {filename}")
    print("Hex:", " ".join(f"{b:02x}" for b in data[:30]))
    print("ASCII:", "".join(chr(b) if 32 <= b <= 126 else "." for b in data[:30]))
    
    # Let's search for the first sync word 0xFFF (MPEG frame sync)
    # Typically 0xFF 0xFB or 0xFF 0xF3
    with open(filename, "rb") as f:
        full_data = f.read()
    
    sync_index = -1
    for i in range(len(full_data) - 1):
        if full_data[i] == 0xFF and (full_data[i+1] & 0xE0) == 0xE0:
            sync_index = i
            break
    print("First sync word found at index:", sync_index)
    if sync_index != -1:
        print("Sync bytes:", " ".join(f"{b:02x}" for b in full_data[sync_index:sync_index+10]))

analyze("hola.mp3")
