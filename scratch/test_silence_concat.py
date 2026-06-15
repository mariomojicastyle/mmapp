import base64
import os
import asyncio

SILENT_MP3_BASE64 = (
    "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA"
    "//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDA"
    "wMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV"
    "6urq6urq6urq6urq6urq6urq6urq6urq6v//////////////////////////"
    "//////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hv"
    "AAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAM"
    "AAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//M"
    "UZAkAAAGkAAAAAAAAA0gAAAAANVVV"
)

async def test():
    silent_bytes = base64.b64decode(SILENT_MP3_BASE64)
    print("Silent frame size:", len(silent_bytes))
    
    # Let's write 1 second, 2 seconds, 3 seconds to files
    with open("silence_1s.mp3", "wb") as f:
        f.write(silent_bytes)
        
    with open("silence_3s.mp3", "wb") as f:
        f.write(silent_bytes * 3)
        
    print("Written silence_1s.mp3 and silence_3s.mp3")
    
    # Try using edge-tts to generate a text segment
    try:
        import edge_tts
        communicate = edge_tts.Communicate("Hola Mario.", "es-CO-GonzaloNeural")
        await communicate.save("hola.mp3")
        print("Generated hola.mp3")
        
        # Concatenate: [hola.mp3] + [silence_3s.mp3] + [hola.mp3]
        with open("hola.mp3", "rb") as fh, open("silence_3s.mp3", "rb") as fs, open("concatenated.mp3", "wb") as out:
            out.write(fh.read())
            out.write(fs.read())
            out.write(fh.read())
            
        print("Concatenated to concatenated.mp3, size:", os.path.getsize("concatenated.mp3"))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
