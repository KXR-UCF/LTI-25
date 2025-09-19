const WebSocket = require('ws');
const { Pool } = require('pg');

process.env.TZ = 'UTC';

const pool = new Pool({
  host: '127.0.0.1',
  port: 8812,
  user: 'admin',
  password: 'quest',
  database: 'qdb',
  max: 10,
  idleTimeoutMillis: 30000
});

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Set();
let lastTimestamp = null;

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);
  lastTimestamp = null;

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

const broadcast = async () => {
  if (clients.size === 0) return;

  try {
    const query = lastTimestamp ?
      'SELECT * FROM telemetry_data WHERE timestamp > $1 ORDER BY timestamp ASC' :
      'SELECT * FROM telemetry_data ORDER BY timestamp ASC';

    const params = lastTimestamp ? [lastTimestamp] : [];
    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      const message = {
        type: 'telemetry_update',
        data: result.rows
      };

      const messageString = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });

      lastTimestamp = result.rows[result.rows.length - 1].timestamp;
      console.log(`Broadcasted ${result.rows.length} data points to ${clients.size} clients`);
    }
  } catch (error) {
    console.error('Broadcast error:', error);
  }
};

setInterval(broadcast, 16.67);

wss.on('listening', () => {
  console.log('WebSocket server listening on port 8080');
  console.log('Polling at 60Hz');
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  clients.forEach(client => client.close());
  await pool.end();
  process.exit(0);
});