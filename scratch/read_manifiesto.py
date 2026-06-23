import zipfile
import xml.etree.ElementTree as ET

def read_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            paragraphs = []
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
    path = r"c:\Desarrollo\mmapp\Temporales\Manifiesto_Negocio.docx"
    content = read_docx(path)
    # Let's save the extracted text to a text file in scratch to read it easily
    output_path = r"c:\Desarrollo\mmapp\scratch\manifiesto_extracted.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Extracted content length: {len(content)} characters. Saved to {output_path}")
