import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace('mb-[1px]', 'mb-[1.75px]')
content = content.replace('gap-[1px]', 'gap-[1.75px]')
content = content.replace('mt-[1px]', 'mt-[1.75px]')

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)
