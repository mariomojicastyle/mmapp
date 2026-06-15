import os
import asyncio
import edge_tts

# Directorio de salida
OUTPUT_DIR = r"c:\Desarrollo\mmapp\legacy-aplicativo-armado\public\M00001\sounds\previews"

# Texto de prueba personalizado solicitado por el usuario
TEXTO_ES = """¡Hola! ¡Comencemos a armar tu mueble!
Pero antes, te mostraré lo fácil que funciona nuestra herramienta interactiva tridimensional.
Al presionar con el clic izquierdo en tu PC o el dedo sobre tu pantalla, el mueble rotará como si estuvieras volando con un dron a su alrededor.
Incluso es posible realizar acercamientos con la rueda del ratón, o con los 2 dedos en la pantalla como lo harías con una imagen.
Puedes practicarlo en este momento.
Si utilizas el clic derecho en tu PC o los dos dedos simultáneamente en tu pantalla, podrás desplazar el punto de vista, como si estuvieras caminando de un lado a otro."""

# Traducción profesional al inglés para las pruebas en inglés
TEXTO_EN = """Hello! Let's start assembling your furniture!
But first, I will show you how easy our three-dimensional interactive tool works.
By pressing with the left click on your PC or your finger on your screen, the furniture will rotate as if you were flying a drone around it.
It is even possible to zoom in and out with the mouse wheel, or with two fingers on the screen as you would do with an image.
You can practice it right now.
If you use the right click on your PC or two fingers simultaneously on your screen, you can pan the point of view, as if you were walking from one side to the other."""

# Lista ampliada de voces a probar (incluyendo las nuevas solicitadas)
VOCES_MUESTRA = {
    # --- VOCES EN ESPAÑOL (Muestras de varios acentos y géneros) ---
    "es": {
        "Voz_01_es-CO-Gonzalo_Hombre": {
            "voice": "es-CO-GonzaloNeural",
            "text": TEXTO_ES
        },
        "Voz_02_es-CO-Salome_Mujer": {
            "voice": "es-CO-SalomeNeural",
            "text": TEXTO_ES
        },
        "Voz_03_es-MX-Jorge_Hombre": {
            "voice": "es-MX-JorgeNeural",
            "text": TEXTO_ES
        },
        "Voz_04_es-MX-Dalia_Mujer": {
            "voice": "es-MX-DaliaNeural",
            "text": TEXTO_ES
        },
        "Voz_05_es-ES-Alvaro_Hombre": {
            "voice": "es-ES-AlvaroNeural",
            "text": TEXTO_ES
        },
        "Voz_06_es-ES-Elvira_Mujer": {
            "voice": "es-ES-ElviraNeural",
            "text": TEXTO_ES
        },
        "Voz_07_es-ES-Ximena_Mujer": {
            "voice": "es-ES-XimenaNeural",
            "text": TEXTO_ES
        },
        "Voz_08_es-US-Alonso_Hombre": {
            "voice": "es-US-AlonsoNeural",
            "text": TEXTO_ES
        },
        "Voz_09_es-US-Paloma_Mujer": {
            "voice": "es-US-PalomaNeural",
            "text": TEXTO_ES
        },
        "Voz_10_es-CL-Lorenzo_Hombre": {
            "voice": "es-CL-LorenzoNeural",
            "text": TEXTO_ES
        },
        "Voz_11_es-CL-Catalina_Mujer": {
            "voice": "es-CL-CatalinaNeural",
            "text": TEXTO_ES
        },
        "Voz_12_es-PE-Alex_Hombre": {
            "voice": "es-PE-AlexNeural",
            "text": TEXTO_ES
        },
        "Voz_13_es-PE-Camila_Mujer": {
            "voice": "es-PE-CamilaNeural",
            "text": TEXTO_ES
        },
        "Voz_14_es-VE-Sebastian_Hombre": {
            "voice": "es-VE-SebastianNeural",
            "text": TEXTO_ES
        },
        "Voz_15_es-VE-Paola_Mujer": {
            "voice": "es-VE-PaolaNeural",
            "text": TEXTO_ES
        }
    },
    # --- VOCES EN INGLÉS ---
    "en": {
        "Voz_16_en-US-Guy_Hombre": {
            "voice": "en-US-GuyNeural",
            "text": TEXTO_EN
        },
        "Voz_17_en-US-Aria_Mujer": {
            "voice": "en-US-AriaNeural",
            "text": TEXTO_EN
        },
        "Voz_18_en-US-Jenny_Mujer": {
            "voice": "en-US-JennyNeural",
            "text": TEXTO_EN
        },
        "Voz_19_en-US-Christopher_Hombre": {
            "voice": "en-US-ChristopherNeural",
            "text": TEXTO_EN
        },
        "Voz_20_en-GB-Ryan_Hombre": {
            "voice": "en-GB-RyanNeural",
            "text": TEXTO_EN
        },
        "Voz_21_en-GB-Sonia_Mujer": {
            "voice": "en-GB-SoniaNeural",
            "text": TEXTO_EN
        }
    }
}

async def generate_preview(name, details, folder):
    output_path = os.path.join(OUTPUT_DIR, folder, f"{name}.mp3")
    communicate = edge_tts.Communicate(details["text"], details["voice"])
    try:
        await communicate.save(output_path)
        print(f"  [Creado] {name}.mp3 con voz '{details['voice']}'")
    except Exception as e:
        print(f"  [Error] No se pudo crear {name}.mp3: {e}")

async def main():
    print("=" * 60)
    print("=== GENERANDO NUEVO CATÁLOGO DE MUESTRAS (TEXTO DE INTRODUCCIÓN) ===")
    print("=" * 60)
    
    # Crear directorios y limpiar archivos anteriores para evitar confusiones
    import shutil
    if os.path.exists(OUTPUT_DIR):
        try:
            shutil.rmtree(OUTPUT_DIR)
        except Exception as e:
            print(f"Advertencia al limpiar directorio: {e}")
            
    os.makedirs(os.path.join(OUTPUT_DIR, "es"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "en"), exist_ok=True)
    
    tasks = []
    
    print("\nProgramando generación en Español (es)...")
    for name, details in VOCES_MUESTRA["es"].items():
        tasks.append(generate_preview(name, details, "es"))
        
    print("Programando generación en Inglés (en)...")
    for name, details in VOCES_MUESTRA["en"].items():
        tasks.append(generate_preview(name, details, "en"))
        
    print("\nGenerando audios asíncronamente...")
    await asyncio.gather(*tasks)
    
    print("\n" + "=" * 60)
    print("=== PROCESO COMPLETADO EXPOSITAMENTE ===")
    print(f"Nuevas muestras de voz guardadas en: {os.path.abspath(OUTPUT_DIR)}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
