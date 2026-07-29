with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if '></div>' in line and '</div>' in lines[i-3] and 'style' in lines[i-4]:
        continue
    if '</div>' in line and 'style' in lines[i-5]:
        continue
    new_lines.append(line)

code = "".join(new_lines)
code = code.replace('              ></div>\n            </div>\n             \n', '')
code = code.replace('              ></div>\n            </div>\n', '')

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.write(code)
