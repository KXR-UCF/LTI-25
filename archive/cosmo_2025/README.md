# COSMO - Ground Station System

Ground control station for real-time telemetry visualization and command sending.

## Components

- **ground-station**: Web interface for telemetry monitoring
- **command-client**: Socket client for sending commands to WANDA

## Prerequisites

- Node.js v16+
- Python 3.x
- QuestDB
- Running WANDA system

## Complete Setup

### 1. Install QuestDB
```bash
# macOS with Homebrew
brew install questdb

# Alternative: Download from https://questdb.io/get-questdb/
```

### 2. Start QuestDB Database
```bash
questdb start
```
- Database runs on port 8812 (PGWire protocol)
- Web console available at http://localhost:9000

### 3. Create Database Table
Open QuestDB web console (http://localhost:9000) and run:
```sql
CREATE TABLE telemetry_data (
  timestamp TIMESTAMP,
  cell1_force DOUBLE,
  cell2_force DOUBLE,
  cell3_force DOUBLE,
  net_force DOUBLE,
  pressure_pt1 DOUBLE,
  pressure_pt2 DOUBLE,
  pressure_pt3 DOUBLE,
  pressure_pt4 DOUBLE,
  pressure_pt5 DOUBLE,
  pressure_pt6 DOUBLE,
  weight_load_cell DOUBLE,
  chamber_temp DOUBLE,
  nozzle_temp DOUBLE
) TIMESTAMP(timestamp) PARTITION BY DAY;
```

### 4. Install Ground Station Dependencies
```bash
# Backend
cd ground_station/backend/
npm install

# Frontend
cd ground_station/new_frontend/my-app/
npm install
npm install uplot uplot-react
```

## Running COSMO

**Terminal 1 - Command Client:**
```bash
cd command_client/
python socket_client.py
```

**Terminal 2 - Backend WebSocket Server:**
```bash
cd ground_station/backend/
npm start
```
- Server runs on port 8080
- Polls database at 60Hz and broadcasts to clients

**Terminal 3 - Frontend Interface:**
```bash
cd ground_station/new_frontend/my-app/
npm run dev
```
- Interface available at http://localhost:3000
- Connects to WebSocket server automatically

## Shutting Down

### 1. Stop Frontend
```bash
# In frontend terminal:
Ctrl + C
```

### 2. Stop WebSocket Server
```bash
# In backend terminal:
Ctrl + C
```

### 3. Stop Command Client
```bash
# In command client terminal:
Ctrl + C
```

### 4. Stop QuestDB
```bash
questdb stop
```

## Side Note: Running Telemetry Data Ingestion

The `ingest_telemetry.py` script generates and ingests realistic rocket motor telemetry data into QuestDB for testing and visualization.

### Prerequisites for ingest_telemetry.py
- Python 3.x installed
- QuestDB running (`questdb start`)
- QuestDB Python client installed:
  ```bash
  pip install questdb
  ```

### Running the Script

**Basic usage (30 seconds of data at 60Hz):**
```bash
python3 ingest_telemetry.py 30
```

**Custom duration and batch size:**
```bash
python3 ingest_telemetry.py 60 --batch-size 20
```

### Parameters
- `duration` (required): How long to run the ingestion in seconds
- `--batch-size` (optional): Number of rows to batch before flushing to database (default: 10)

### What It Does
- Generates realistic rocket burn profile data with three phases: ignition, steady burn, and shutdown
- Simulates 6 pressure transducers, 3 load cells, temperature sensors, and weight measurements
- Ingests data at 60 samples per second with realistic sensor noise
- Progress is printed every second showing sample count and actual ingestion rate

### Example Output
```
Starting telemetry ingestion:
  - Duration: 30 seconds
  - Target rate: 60 samples/second
  - Total samples: 1800
  - Batch size: 10 rows
  - Sample interval: 16.67ms

Connected to QuestDB

Progress: 3.3% | Samples: 60/1800 | Rate: 59.9 samples/sec
Progress: 6.7% | Samples: 120/1800 | Rate: 60.1 samples/sec
...
============================================================
Ingestion Complete!
  - Total samples sent: 1800
  - Total time: 30.05 seconds
  - Actual rate: 59.98 samples/second
  - Target rate: 60 samples/second
  - Accuracy: 99.96%
============================================================
```
