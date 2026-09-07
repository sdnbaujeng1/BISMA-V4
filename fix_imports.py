import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

if 'recharts' not in content:
    content = "import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, Scatter, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';\n" + content

lucide_match = re.search(r"import \{([^}]+)\} from 'lucide-react';", content)
if lucide_match:
    imports = set([s.strip() for s in lucide_match.group(1).split(',')])
    imports.update(['Users', 'Clock', 'CheckCircle2'])
    new_lucide = f"import {{ {', '.join(imports)} }} from 'lucide-react';"
    content = content.replace(lucide_match.group(0), new_lucide)

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)
