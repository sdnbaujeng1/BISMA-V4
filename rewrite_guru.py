import re

with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    # Remove standalone )} if they are messed up
    if line.strip() == ')}':
        continue
    if line.strip() == '}</>':
        continue
    
    if '{activeTab === "validasi" {activeTab === "validasi" && ({activeTab === "validasi" && ( (' in line:
        new_lines.append('      {activeTab === "validasi" && (\n')
        new_lines.append('      <>\n')
        continue

    if line.strip() == '{/* Modal Tukar Poin */}':
        new_lines.append('      </>\n')
        new_lines.append('      )}\n')
        new_lines.append(line)
        continue
        
    if line.strip() == '{/* Toast Notification */}':
        new_lines.append('      </AnimatePresence>\n')
        new_lines.append(line)
        continue

    if line.strip() == '{/* Confirm Modal */}':
        new_lines.append('      </AnimatePresence>\n')
        new_lines.append(line)
        continue

    if line.strip() == '</div>' and new_lines and new_lines[-1].strip() == '</AnimatePresence>':
        # wait, we need to close the component
        pass

    new_lines.append(line)

with open('src/pages/KasihIbuGuru_clean.tsx', 'w') as f:
    f.writelines(new_lines)
