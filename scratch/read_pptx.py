import os
import zipfile
import xml.etree.ElementTree as ET

def get_pptx_text(file_path):
    try:
        with zipfile.ZipFile(file_path) as pptx:
            slide_texts = []
            # slides are in ppt/slides/slide1.xml, slide2.xml...
            # We can find all slide files
            slide_files = sorted([f for f in pptx.namelist() if f.startswith("ppt/slides/slide") and f.endswith(".xml")])
            
            for slide_file in slide_files:
                xml_content = pptx.read(slide_file)
                root = ET.fromstring(xml_content)
                texts = []
                # Search recursively for tags ending with 't' which represent text runs in slides
                # Namespaces can be ignored by looking at local-name
                for node in root.iter():
                    if node.tag.endswith('t') and node.text:
                        texts.append(node.text)
                if texts:
                    slide_texts.append(f"### Slide {os.path.basename(slide_file)}:\n" + " ".join(texts))
            return "\n\n".join(slide_texts)
    except Exception as e:
        return f"Error reading pptx: {str(e)}"

if __name__ == "__main__":
    path = r"C:\Desarrollo\mmapp\Temporales\Metricas_App_de_armado\10_09_2023_Informe de experiencia con el nuevo manual digital.pptx"
    text = get_pptx_text(path)
    # Print first 2000 characters
    print(text[:4000])
    if len(text) > 4000:
        print("\n... (truncated)")
