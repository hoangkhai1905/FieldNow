const config = require('./config');
const app = require('./app');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[FieldNow] Server running on port ${PORT} (${config.nodeEnv})`);
});
