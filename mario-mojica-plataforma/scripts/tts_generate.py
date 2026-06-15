"""
Script auxiliar para generar audios TTS con Edge-TTS.
Se invoca desde la API Route de Next.js via child_process.

Uso:
  python tts_generate.py --text "Hola mundo" --voice "es-CO-GonzaloNeural" --output "output.mp3"
  python tts_generate.py --file input.txt --voice "es-CO-GonzaloNeural" --output "output.mp3"
"""
import argparse
import asyncio
import sys
import os

async def generate(text: str, voice: str, output: str):
    try:
        import edge_tts
    except ImportError:
        print("ERROR: edge-tts no está instalado. Ejecuta: pip install edge-tts", file=sys.stderr)
        sys.exit(1)

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output)
    # Verificar que el archivo se creó y tiene contenido
    if os.path.exists(output) and os.path.getsize(output) > 0:
        print(f"OK:{os.path.getsize(output)}")
    else:
        print("ERROR: El archivo de audio no se generó correctamente.", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Generar audio TTS con Edge-TTS")
    parser.add_argument("--text", type=str, help="Texto a convertir en audio")
    parser.add_argument("--file", type=str, help="Archivo de texto a convertir en audio")
    parser.add_argument("--voice", type=str, required=True, help="Nombre de la voz Edge-TTS")
    parser.add_argument("--output", type=str, required=True, help="Ruta del archivo de salida .mp3")
    
    args = parser.parse_args()
    
    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            text = f.read().strip()
    elif args.text:
        text = args.text
    else:
        print("ERROR: Debes especificar --text o --file", file=sys.stderr)
        sys.exit(1)
    
    if not text:
        print("ERROR: El texto está vacío.", file=sys.stderr)
        sys.exit(1)
    
    asyncio.run(generate(text, args.voice, args.output))

if __name__ == "__main__":
    main()
