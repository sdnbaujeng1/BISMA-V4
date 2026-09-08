import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

# Replace the ts-ignore lines
content = content.replace('{/* @ts-ignore */}\\n                    <marquee', '<marquee')
content = content.replace('</marquee>\\n                    {/* @ts-ignore */}', '</marquee>')
content = content.replace('{/* @ts-ignore */}\n                    <marquee', '<marquee')
content = content.replace('</marquee>\n                    {/* @ts-ignore */}', '</marquee>')

# define Marquee at the top of the component
content = content.replace(
    'export default function PublicDashboard',
    'const Marquee = "marquee" as any;\n\nexport default function PublicDashboard'
)

content = content.replace('<marquee', '<Marquee')
content = content.replace('</marquee>', '</Marquee>')

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)

