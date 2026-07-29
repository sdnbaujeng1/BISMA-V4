const fs = require('fs');
let code = fs.readFileSync('src/pages/KasihIbuGuru.tsx', 'utf-8');

code = code.replace(/}<\/>/g, '');
code = code.replace(/{\/\* Modal Tukar Poin \*\//, ')} {/* Modal Tukar Poin */}');

fs.writeFileSync('src/pages/KasihIbuGuru.tsx', code);
