import { createApp } from './app.js';
import { config } from './config/env.js';
import { initializeStorage } from './storage/jsonStore.js';

initializeStorage();
const server = createApp().listen(config.port, () => {
  console.log('Backend server running on http://localhost:' + config.port);
});
server.on('error', error => { console.error('Server could not start:', error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
