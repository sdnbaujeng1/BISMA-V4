import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, Scatter, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';",
    "import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, Scatter, PieChart, Pie, Cell, Tooltip, Legend, ZAxis } from 'recharts';"
)

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)
