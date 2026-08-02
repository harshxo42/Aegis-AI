import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    if not lines: return

    # Check if first line is an import and second line is a docstring
    if (lines[0].startswith('from typing import') or lines[0].startswith('import ')) and (lines[1].startswith('"""') or (len(lines)>2 and lines[1]=='\n' and lines[2].startswith('"""'))):
        # We need to find the end of the docstring
        import_lines = []
        i = 0
        while i < len(lines) and (lines[i].startswith('from ') or lines[i].startswith('import ') or lines[i].strip() == ''):
            if lines[i].startswith('"""'):
                break
            import_lines.append(lines[i])
            i += 1
            
        if i < len(lines) and lines[i].startswith('"""'):
            docstring_start = i
            docstring_end = -1
            # find end of docstring
            if lines[i].strip() == '"""':
                for j in range(i + 1, len(lines)):
                    if lines[j].strip().endswith('"""'):
                        docstring_end = j
                        break
            elif lines[i].strip().endswith('"""') and len(lines[i].strip()) > 3:
                docstring_end = i
                
            if docstring_end != -1:
                # Swap docstring and imports
                docstring_lines = lines[docstring_start:docstring_end+1]
                new_lines = docstring_lines + ['\n'] + import_lines + lines[docstring_end+1:]
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                print(f"Fixed {filepath}")

for root, _, files in os.walk('app'):
    for file in files:
        if file.endswith('.py'):
            fix_file(os.path.join(root, file))
