import sys, re

def fix_mypy():
    with open('mypy_out.txt', 'r', encoding='utf-16') as f:
        lines = f.readlines()
    
    fixes = {}
    for line in lines:
        if 'Function is missing a return type annotation' in line:
            parts = line.split(':')
            if len(parts) >= 3:
                filename = parts[0].strip()
                lineno = int(parts[1].strip())
                if filename not in fixes:
                    fixes[filename] = []
                fixes[filename].append(lineno)
        elif 'Missing type arguments for generic type "dict"' in line:
            parts = line.split(':')
            if len(parts) >= 3:
                filename = parts[0].strip()
                with open(filename, 'r', encoding='utf-8') as src:
                    content = src.read()
                content = re.sub(r'-> dict:', r'-> dict[str, Any]:', content)
                with open(filename, 'w', encoding='utf-8') as src:
                    src.write(content)
                # also ensure Any is imported
                if filename not in fixes:
                    fixes[filename] = []

    for filename, lines_to_fix in fixes.items():
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                content_lines = f.readlines()
        except:
            continue
            
        for lineno in lines_to_fix:
            idx = lineno - 1
            # find the closing ):
            while idx < len(content_lines) and '):' not in content_lines[idx]:
                idx += 1
            if idx < len(content_lines):
                if content_lines[idx].rstrip().endswith('):'):
                    content_lines[idx] = content_lines[idx].replace('):', ') -> Any:')
        
        # also add from typing import Any
        if not any('import Any' in l for l in content_lines) and not any(', Any' in l for l in content_lines):
            for i, l in enumerate(content_lines):
                if l.startswith('from typing import'):
                    content_lines[i] = l.replace('\n', ', Any\n')
                    break
            else:
                content_lines.insert(0, 'from typing import Any\n')
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.writelines(content_lines)

fix_mypy()
