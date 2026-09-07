const fs = require('fs');
let content = fs.readFileSync('src/pages/PublicDashboard.tsx', 'utf8');

if (!content.includes('from "recharts"')) {
    content = "import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, Scatter, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';\n" + content;
}

const lucideMatch = content.match(/import \{([^}]+)\} from 'lucide-react';/);
if (lucideMatch) {
    const imports = new Set(lucideMatch[1].split(',').map(s => s.trim()));
    ['Users', 'Clock', 'CheckCircle2'].forEach(i => imports.add(i));
    content = content.replace(lucideMatch[0], `import { ${Array.from(imports).join(', ')} } from 'lucide-react';`);
}

fs.writeFileSync('src/pages/PublicDashboard.tsx', content);
