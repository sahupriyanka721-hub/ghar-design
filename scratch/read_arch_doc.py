import zipfile, xml.etree.ElementTree as ET

with zipfile.ZipFile(r'C:\Users\HP\.gemini\antigravity\brain\a0e0509d-46b3-495d-ac7b-d7336660cb47\.user_uploaded\media_1793422872159_90cbfb3f.docx') as z:
    tree = ET.fromstring(z.read('word/document.xml'))
    namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = []
    for p in tree.iterfind('.//w:p', namespaces):
        texts = [node.text for node in p.iterfind('.//w:t', namespaces) if node.text]
        if texts:
            paragraphs.append(''.join(texts))

with open(r'C:\Users\HP\.gemini\antigravity\scratch\ghar-design\scratch\arch_doc_text.txt', 'w', encoding='utf-8') as out:
    for i, p in enumerate(paragraphs):
        out.write(f"{i}: {p}\n")

print(f"Total paragraphs written: {len(paragraphs)}")
