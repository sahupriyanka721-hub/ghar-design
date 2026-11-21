with open(r'C:\Users\HP\.gemini\antigravity\scratch\ghar-design\scratch\arch_doc_text.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in lines:
    lower = line.lower()
    if 'sidebar' in lower or 'complete sidebar' in lower or 'section 5' in lower or '5. architect' in lower or 'dashboard design' in lower:
        print(line[:100].strip())
