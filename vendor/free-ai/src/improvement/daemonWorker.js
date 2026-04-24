import { parentPort, isMainThread } from 'worker_threads';
import { DaemonCrawler } from './daemonCrawler.js';

if (!isMainThread) {
  try {
    const crawler = new DaemonCrawler();
    crawler.start();
    console.log('[Worker] DaemonCrawler isolated successfully.');
    parentPort.on('message', (msg) => {
      if (msg === 'shutdown') {
        crawler.stop();
        parentPort.postMessage('shutdown_complete');
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('[Worker] DaemonCrawler failed:', error);
  }
}
