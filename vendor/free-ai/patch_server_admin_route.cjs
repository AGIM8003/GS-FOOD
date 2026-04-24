const fs = require('fs');
let code = fs.readFileSync('src/server.js', 'utf8');

code = code.replace(
  /if \(req\.method === 'GET' && \(req\.url === '\/' \|\| req\.url === '\/index\.html'\)\) \{/,
  "if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html' || req.url === '/admin-dashboard')) {"
);

code = code.replace(
  /const html = await readFile\(new URL\('\.\.\/web\/index\.html', import\.meta\.url\)\);/,
  "const fileToServe = req.url === '/admin-dashboard' ? '../web/admin-dashboard.html' : '../web/index.html';\n        const html = await readFile(new URL(fileToServe, import.meta.url));"
);

fs.writeFileSync('src/server.js', code);
console.log('Patched correctly.');
