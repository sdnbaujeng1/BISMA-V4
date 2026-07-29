const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');
let count = 0;
for (let i = 2968; i < 3508; i++) {
  const line = lines[i] || '';
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') count++;
    if (line[j] === '}') count--;
  }
}
console.log('Balance at 3508:', count);
