with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if i == 548: # 549 in 1-based, )}
        new_lines.append('                              </>\n')
    elif i == 549: # 550, </>
        pass
    elif i == 601: # 602
        new_lines.append('                  >\n')
    elif i == 625: # 626
        new_lines.append('                  />\n')
    else:
        new_lines.append(line)

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.writelines(new_lines)
