const config = require('./config');
const app = require('./app');
const { startWorkers } = require('./workers');

const PORT = config.port;

startWorkers();

app.listen(PORT, () => {
  console.log(`[FieldNow] Server running on port ${PORT} (${config.nodeEnv})`);
  console.log(`[FieldNow] API base: http://localhost:${PORT}/api/v1`);
  console.log(`[FieldNow] Health: http://localhost:${PORT}/health`);
  if (config.nodeEnv !== 'production') {
    console.log(`[FieldNow] API Docs: http://localhost:${PORT}/api-docs`);
  }
});
