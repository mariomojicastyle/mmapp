import os
with open("test_silence_vol.mp3", "rb") as f:
    data = f.read(100)
print("Hex:", " ".join(f"{b:02x}" for b in data[:30]))
print("ASCII:", "".join(chr(b) if 32 <= b <= 126 else "." for b in data[:30]))
print("Size:", os.path.getsize("test_silence_vol.mp3"))
