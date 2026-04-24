const fs = require('fs');
let content = fs.readFileSync('src/server.js', 'utf8');
content = content.replace('\\n  if (req.method', '\n  if (req.method');
content = content.replace('server.listen(port, listenHost, () => {', 'server.listen(port, listenHost, async () => {');
fs.writeFileSync('src/server.js', content);
console.log('Fixed syntax formatting.');
