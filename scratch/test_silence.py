import asyncio
import os
import sys

async def main():
    try:
        import edge_tts
    except ImportError:
        print("edge-tts not installed")
        return

    # Let's generate a normal segment, a pause segment, and another normal segment
    voice = "es-CO-GonzaloNeural"
    
    # 1. Text segment 1
    c1 = edge_tts.Communicate("Hola mundo", voice)
    await c1.save("c1.mp3")
    
    # 2. Text segment 2
    c2 = edge_tts.Communicate("Adiós mundo", voice)
    await c2.save("c2.mp3")
    
    # Let's try to generate "silence" by using ellipses or space
    c_pause = edge_tts.Communicate("...", voice)
    await c_pause.save("pause.mp3")
    
    print(f"c1.mp3 size: {os.path.getsize('c1.mp3')}")
    print(f"c2.mp3 size: {os.path.getsize('c2.mp3')}")
    print(f"pause.mp3 size: {os.path.getsize('pause.mp3')}")

    # Concatenate by bytes
    with open("c1.mp3", "rb") as f1, open("pause.mp3", "rb") as fp, open("c2.mp3", "rb") as f2, open("joined.mp3", "wb") as out:
        out.write(f1.read())
        out.write(fp.read())
        out.write(f2.read())
    print(f"joined.mp3 size: {os.path.getsize('joined.mp3')}")

if __name__ == "__main__":
    asyncio.run(main())
