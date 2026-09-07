const http = require('http');

http.get('http://127.0.0.1:3000/api/kasih-ibu?kelas=Kelas 6', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    const parsed = JSON.parse(data);
    console.log("Success:", parsed.success);
    console.log("Length:", parsed.data ? parsed.data.length : 0);
  });
});
