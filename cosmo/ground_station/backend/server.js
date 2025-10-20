const WebSocket = require('ws');
const { Pool } = require('pg');
const fs = require('fs');
const readline = require('readline');

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

// Current switch states - persisted in memory
const currentSwitchStates = {
  switch1: false,
  switch2: false,
  switch3: false,
  switch4: false,
  switch5: false,
  switch6: false,
  launchKey: false,
  abort: false
};

wss.on('connection', async (ws) => {
  console.log(`🔌 Client connected | Total clients: ${clients.size + 1}`);

  clients.add(ws);

  // Send initial data load to this specific client
  try {
    const query = 'SELECT * FROM telemetry_data ORDER BY timestamp ASC';
    const result = await pool.query(query);

    if (result.rows.length > 0) {
      const initialMessage = {
        type: 'telemetry_update',
        data: result.rows
      };

      ws.send(JSON.stringify(initialMessage));
      console.log(`📤 Sent initial ${result.rows.length} points to new client`);

      // Update global lastTimestamp if this is newer
      const lastRowTimestamp = result.rows[result.rows.length - 1].timestamp;
      if (!lastTimestamp || lastRowTimestamp > lastTimestamp) {
        lastTimestamp = lastRowTimestamp;
        console.log(`📌 Updated global lastTimestamp: ${lastTimestamp}`);
      }
    } else {
      console.log(`📭 No data in database to send to new client`);
    }
  } catch (error) {
    console.error('❌ Error sending initial data:', error);
  }

  // Send initial switch states to new client
  try {
    const initialSwitchMessage = {
      type: 'initial_switch_states',
      data: currentSwitchStates
    };
    ws.send(JSON.stringify(initialSwitchMessage));
    console.log(`🎚️  Sent initial switch states to new client:`, currentSwitchStates);
  } catch (error) {
    console.error('❌ Error sending initial switch states:', error);
  }

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🔌 Client disconnected | Remaining clients: ${clients.size}`);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
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
      console.log(`📤 Broadcasted ${result.rows.length} points to ${clients.size} clients | Last timestamp: ${lastTimestamp}`);
    } else {
      // Only log every 60 iterations (once per second) to avoid spam
      if (!broadcast.emptyCount) broadcast.emptyCount = 0;
      broadcast.emptyCount++;
      if (broadcast.emptyCount % 60 === 0) {
        console.log(`⏸️  No new data (${broadcast.emptyCount} empty polls)`);
      }
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

// Named pipe for receiving switch states from socket_client.py
const PIPE_PATH = '/tmp/switch_pipe';
let pipeStream = null;
let readlineInterface = null;

// Valid switch names for validation
const VALID_SWITCHES = ['switch1', 'switch2', 'switch3', 'switch4', 'switch5', 'switch6', 'launchKey', 'abort'];

// Parse switch message into state object
function parseSwitchMessage(msg) {
  const trimmed = msg.trim();

  // "1 Open" / "1 Close" → switches 1-6
  if (/^\d\s+(Open|Close)$/.test(trimmed)) {
    const switchNum = trimmed[0];
    const state = trimmed.includes('Open');
    const switchMap = {
      '1': 'switch1',  // NOX FILL
      '2': 'switch2',  // NOX VENT
      '3': 'switch3',  // NOX RELIEF
      '4': 'switch4',  // N2 FILL
      '5': 'switch5',  // N2 VENT
      '6': 'switch6',  // CONTINUITY
    };

    const switchName = switchMap[switchNum];
    if (!switchName) {
      console.warn(`⚠️  Invalid switch number: ${switchNum}`);
      return null;
    }

    return {
      switch: switchName,
      state: state,
      message: trimmed
    };
  }

  // "ENABLE FIRE" / "DISABLE FIRE"
  if (trimmed === 'ENABLE FIRE' || trimmed === 'DISABLE FIRE') {
    return {
      switch: 'launchKey',
      state: trimmed === 'ENABLE FIRE',
      message: trimmed
    };
  }

  // "FIRE" - can be both triggered and reset
  if (trimmed === 'FIRE') {
    return {
      switch: 'abort',
      state: true,
      message: trimmed
    };
  }

  // "ABORT OFF" or "FIRE OFF" - reset abort state
  if (trimmed === 'ABORT OFF' || trimmed === 'FIRE OFF') {
    return {
      switch: 'abort',
      state: false,
      message: trimmed
    };
  }

  console.warn(`⚠️  Unknown message format: ${trimmed}`);
  return null;
}

// Broadcast switch state to all WebSocket clients
function broadcastSwitchState(switchState) {
  if (!switchState) return;

  // Validate switch name
  if (!VALID_SWITCHES.includes(switchState.switch)) {
    console.warn(`⚠️  Invalid switch name: ${switchState.switch}`);
    return;
  }

  // Update current state in memory
  currentSwitchStates[switchState.switch] = switchState.state;
  console.log(`💾 Updated state: ${switchState.switch} = ${switchState.state}`);

  const message = {
    type: 'switch_state_update',
    data: switchState
  };

  const messageString = JSON.stringify(message);
  let broadcastCount = 0;

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
      broadcastCount++;
    }
  });

  if (broadcastCount > 0) {
    console.log(`🎚️  Switch Update: ${switchState.switch} = ${switchState.state} | Broadcasted to ${broadcastCount} clients`);
  }
}

// Read from named pipe
function setupNamedPipe() {
  console.log(`📡 Opening named pipe: ${PIPE_PATH}`);

  if (!fs.existsSync(PIPE_PATH)) {
    console.log(`⚠️  Pipe does not exist. Waiting for socket_client.py to create it...`);
    // Check every 2 seconds if pipe was created
    const checkInterval = setInterval(() => {
      if (fs.existsSync(PIPE_PATH)) {
        clearInterval(checkInterval);
        openPipe();
      }
    }, 2000);
  } else {
    openPipe();
  }
}

function openPipe() {
  try {
    pipeStream = fs.createReadStream(PIPE_PATH, { encoding: 'utf8' });
    readlineInterface = readline.createInterface({
      input: pipeStream,
      crlfDelay: Infinity
    });

    readlineInterface.on('line', (line) => {
      console.log(`📡 Pipe received: ${line}`);
      const switchState = parseSwitchMessage(line);
      broadcastSwitchState(switchState);
    });

    pipeStream.on('error', (error) => {
      console.error('❌ Pipe error:', error);
      // Clean up before reopening
      if (readlineInterface) {
        readlineInterface.close();
        readlineInterface = null;
      }
      if (pipeStream) {
        pipeStream.destroy();
        pipeStream = null;
      }
      // Try to reopen after a delay
      setTimeout(() => {
        console.log('🔄 Attempting to reopen pipe...');
        setupNamedPipe();
      }, 2000);
    });

    pipeStream.on('end', () => {
      console.log('📡 Pipe closed, reopening...');
      // Clean up before reopening
      if (readlineInterface) {
        readlineInterface.close();
        readlineInterface = null;
      }
      if (pipeStream) {
        pipeStream.destroy();
        pipeStream = null;
      }
      setTimeout(() => {
        setupNamedPipe();
      }, 1000);
    });

    console.log('✅ Named pipe opened successfully');
  } catch (error) {
    console.error('❌ Error opening pipe:', error);
    setTimeout(() => {
      setupNamedPipe();
    }, 2000);
  }
}

// Initialize named pipe reader
setupNamedPipe();

process.on('SIGINT', async () => {
  console.log('Shutting down...');

  // Close all WebSocket clients
  clients.forEach(client => client.close());

  // Close named pipe
  if (readlineInterface) {
    readlineInterface.close();
    console.log('✅ Closed readline interface');
  }
  if (pipeStream) {
    pipeStream.destroy();
    console.log('✅ Closed pipe stream');
  }

  // Close database pool
  await pool.end();
  console.log('✅ Closed database pool');

  process.exit(0);
});