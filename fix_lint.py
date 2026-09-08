import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

# Add ts-ignore for marquee
content = content.replace(
    '<marquee className=',
    '{/* @ts-ignore */}\n                    <marquee className='
)
content = content.replace(
    '</marquee>',
    '</marquee>\n                    {/* @ts-ignore */}'
)

# Fix ZAxis
content = content.replace(
    'import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";',
    'import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ZAxis } from "recharts";'
)

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)
