import os
import asyncio
import edge_tts

SCRIPTS = {
    "00": {
        "es": "¡Hola! Bienvenido a tu manual interactivo de armado. Antes de comenzar, asegúrate de tener a mano todas las herramientas necesarias indicadas en la caja. Te recomendamos realizar el ensamble sobre una alfombra o el mismo cartón del empaque para proteger las piezas. Comencemos con el armado de tu nuevo mueble.",
        "en": "Hello! Welcome to your interactive assembly manual. Before starting, make sure you have all the necessary tools indicated on the box. We recommend assembling the furniture on a carpet or the packaging cardboard itself to protect the pieces. Let's begin assembling your new furniture."
    },
    "01": {
        "es": "Paso uno. Toma la pieza número cuatro e inserta los cuatro tarugos de madera. A continuación, en las piezas número uno y número nueve, inserta dos tarugos en la parte inferior de cada una, y atornilla dos pernos minifix. Para finalizar este paso, ensambla las tres piezas utilizando cuatro tornillos largos. Recuerda que armaremos el mueble boca abajo, por lo que el borde sin acabado debe quedar mirando hacia arriba.",
        "en": "Step one. Take piece number four and insert the four wooden dowels. Next, in pieces number one and number nine, insert two dowels into the bottom of each, and screw in two minifix bolts. To finish this step, assemble the three pieces using four long screws. Remember that we will assemble the furniture upside down, so the unfinished edge must face upwards."
    },
    "02": {
        "es": "Paso dos. Inserta dos tarugos en la parte inferior de la pieza número diez y de la número doce. Atornilla también dos pernos en cada una. Luego, coloca cuatro tarugos en la pieza número veinte. Toma la pieza número tres y atorníllala a la pieza doce con dos tornillos largos. Ensambla la pieza diez usando dos cajas minifix, ubicando en medio la pieza veinte. Recuerda girar la caja minifix para asegurar el amarre. Finalmente, une la pieza número cinco al conjunto utilizando cuatro cajas minifix.",
        "en": "Step two. Insert two dowels into the bottom of piece number ten and number twelve. Also, screw two bolts into each. Next, place four dowels into piece number twenty. Take piece number three and screw it to piece twelve with two long screws. Assemble piece ten using two minifix cams, placing piece twenty in the middle. Remember to turn the minifix cam to lock the joint. Finally, join piece number five to the assembly using four minifix cams."
    },
    "03": {
        "es": "Paso tres. En la pieza número ocho, inserta dos tarugos en la parte inferior y atornilla dos pernos. En la pieza diecinueve, coloca cuatro tarugos. Ensambla la pieza seis a la pieza ocho con dos cajas minifix. Une esto al conjunto anterior, colocando en medio la pieza diecinueve y asegurándola con dos cajas minifix. A continuación, atornilla la pieza número dos a todo el conjunto usando diez tornillos largos e instala los ocho deslizadores. Por último, en la pieza número siete atornilla diez pernos, encájala al ensamble y asegura con las diez cajas minifix.",
        "en": "Step three. In piece number eight, insert two dowels into the bottom and screw in two bolts. In piece nineteen, place four dowels. Assemble piece six to piece eight using two minifix cams. Join this to the previous assembly, placing piece nineteen in the middle and securing it with two minifix cams. Next, screw piece number two to the entire assembly using ten long screws and install the eight floor glides. Finally, screw ten bolts into piece number seven, fit it into the assembly, and secure it with the ten minifix cams."
    },
    "04": {
        "es": "Paso cuatro. Es momento de colocar la pieza veinticuatro, que dará estabilidad al mueble. Fija inicialmente dos puntillas en esquinas opuestas para asegurar la escuadra. Verifica que esté recto y coloca otras dos puntillas en las esquinas restantes. Luego, usa las demás puntillas dejando aproximadamente diez centímetros entre cada una. Ahora sí, puedes poner el mueble de pie.",
        "en": "Step four. It is time to place piece twenty-four, which will give stability to the furniture. Initially fix two nails in opposite corners to ensure it is square. Verify that it is straight and place another two nails in the remaining corners. Then, use the other nails, leaving approximately ten centimeters between each. Now, you can stand the furniture upright."
    },
    "05": {
        "es": "Paso cinco. Toma las dos piezas veintiuno. En cada una de ellas, instala dos bisagras utilizando dos tornillos para cada bisagra.",
        "en": "Step five. Take the two pieces twenty-one. In each of them, install two hinges using two screws for each hinge."
    },
    "06": {
        "es": "Paso seis. Instala las puertas en el mueble, fijando cada una con cuatro tornillos. Ten en cuenta que las bisagras permiten hacer ajustes en el funcionamiento y la alineación. Si necesitas ayuda con esto, haz clic en el botón de información para ver el gráfico de ajuste de bisagras.",
        "en": "Step six. Install the doors onto the furniture, securing each with four screws. Note that the hinges allow adjustments for operation and alignment. If you need help with this, click the info button to view the hinge adjustment diagram."
    },
    "07": {
        "es": "Paso siete. Identifica el frente del cajón; es la pieza que tiene una ranura. Atornilla en él dos pernos e inserta dos tarugos. Ensambla los dos laterales usando dos cajas minifix, y fija la parte posterior con cuatro tornillos largos. Desliza el fondo por la ranura del frente, dejando la cara café hacia arriba. Sobre esta cara, instala las correderas asegurándolas con tres tornillos cada una. Coloca también tornillos en el borde opuesto al frente para fijar el fondo. Repite toda esta operación para tener armados los cuatro cajones.",
        "en": "Step seven. Identify the drawer front; it is the piece that has a groove. Screw two bolts into it and insert two dowels. Assemble the two drawer sides using two minifix cams, and secure the back with four long screws. Slide the bottom through the front groove, leaving the brown side facing up. On this side, install the drawer slides securing them with three screws each. Also, place screws on the edge opposite the front to secure the bottom. Repeat this entire operation to have the four drawers assembled."
    },
    "08": {
        "es": "Paso ocho. Introduce suavemente cada uno de los cuatro cajones en su lugar. ¡Enhorabuena! Has terminado de ensamblar tu mueble. Para un acabado más estético, te sugerimos usar las tapas adhesivas incluidas para ocultar los herrajes; sin embargo, evita usarlas si hay niños menores de tres años cerca. Gracias por confiar en los diseños de Mario Mojica Forma y Futuro.",
        "en": "Step eight. Gently insert each of the four drawers into place. Congratulations! You have finished assembling your furniture. For a more aesthetic finish, we suggest using the included adhesive screw covers to hide the hardware; however, avoid using them if there are children under three years old nearby. Thank you for trusting the designs of Mario Mojica Forma y Futuro."
    }
}

# Configuración de Voces
VOICES = {
    "es": "es-CO-GonzaloNeural", # Voz colombiana masculina natural
    "en": "en-US-GuyNeural"      # Voz estadounidense masculina natural
}

OUTPUT_DIR = r"c:\Desarrollo\mmapp\legacy-aplicativo-armado\public\M00001\sounds"

async def generate_tts(text, voice, output_path):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    print(f"Generado: {output_path}")

async def main():
    # Crear carpetas si no existen
    os.makedirs(os.path.join(OUTPUT_DIR, "es"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "en"), exist_ok=True)
    
    tasks = []
    for step, langs in SCRIPTS.items():
        for lang, text in langs.items():
            voice = VOICES[lang]
            # Determinar el nombre del archivo según el estándar
            if lang == "es":
                # Guardamos como XX_es.mp3 en sounds/es/
                filename = f"{step}_es.mp3"
                path = os.path.join(OUTPUT_DIR, "es", filename)
            else:
                # Guardamos como XX_en.mp3 en sounds/en/
                filename = f"{step}_en.mp3"
                path = os.path.join(OUTPUT_DIR, "en", filename)
                
            tasks.append(generate_tts(text, voice, path))
            
            # Para retrocompatibilidad con el cargador local que busca /{id}/sounds/{step}.mp3
            # Guardamos una copia directa de la voz en español en el directorio raíz de sounds/
            if lang == "es":
                compat_path = os.path.join(OUTPUT_DIR, f"{step}.mp3")
                tasks.append(generate_tts(text, voice, compat_path))

    await asyncio.gather(*tasks)
    print("¡Todos los audios bilingües generados exitosamente!")

if __name__ == "__main__":
    asyncio.run(main())
