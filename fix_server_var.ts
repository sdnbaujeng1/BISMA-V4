import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// Fix the duplicate const declaration in /api/jurnal-siswa
content = content.replace(
  /const \{ start, end \} = await getTahunAjaranFilter\(\);\n      const \{ data: studentJournal \}/,
  `// const { start, end } = await getTahunAjaranFilter();
      const { data: studentJournal }`
);

// We need to make sure start and end are declared only once.
fs.writeFileSync('server.ts', content);
console.log('fixed var');
