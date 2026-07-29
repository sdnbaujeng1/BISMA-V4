const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');
let count = 0;
const startIdx = lines.findIndex(l => l.includes('function DataMuridModal'));
for (let i = startIdx; i < startIdx + 560; i++) {
  const line = lines[i];
  if (line === undefined) break;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') count++;
    if (line[j] === '}') count--;
  }
  if (line.includes('return') || line.includes('=>') || line.includes('function')) {
    // console.log(`[${i+1}] count=${count} : ${line}`);
  }
}
console.log('Final count:', count);
