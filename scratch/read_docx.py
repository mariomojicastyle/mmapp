import zipfile
import xml.etree.ElementTree as ET

def read_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Find all text nodes
            paragraphs = []
            # ElementTree will have tags like {http://schemas.openxmlformats.org/wordprocessingml/2006/main}p
            # We can search recursively for tags ending with 'p' and 't'
            for p in root.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = []
                for t in p.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                    if t.text:
                        texts.append(t.text)
                if texts:
                    paragraphs.append("".join(texts))
            return "\n".join(paragraphs)
    except Exception as e:
        return f"Error reading docx: {str(e)}"

if __name__ == "__main__":
    path = r"C:\Desarrollo\mmapp\Temporales\Metricas_App_de_armado\Informe de experiencia con el nuevo manual digital.docx"
    print("--- DOCX CONTENT ---")
    print(read_docx(path))
