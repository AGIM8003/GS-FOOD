const fs = require('fs');
let code = fs.readFileSync('src/server.js', 'utf8');
code = code.replace(
  "  const { DaemonCrawler } = await import('./improvement/daemonCrawler.js');\n  const crawler = new DaemonCrawler();\n  crawler.start();",
  `  if (process.env.FREEAI_DISABLE_CRAWLER !== '1') {
    const workerPath = new URL('./improvement/daemonWorker.js', import.meta.url);
    const worker = new Worker(workerPath);
    worker.on('error', (err) => console.error('[Worker Error] DaemonCrawler:', err));
    worker.on('exit', (code) => console.log(\`[Worker Exit] DaemonCrawler exited with code \${code}\`));
  }`
);
fs.writeFileSync('src/server.js', code);
console.log('Patched server.js successfully.');
