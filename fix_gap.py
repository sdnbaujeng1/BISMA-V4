import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-8">',
    '<main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-[1px]">'
)

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)
