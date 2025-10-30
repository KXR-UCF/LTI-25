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
cd ground-station/backend/
npm install

# Frontend
cd ground-station/new_frontend/my-app/
npm install
npm install uplot uplot-react
```

## Running COSMO

**Terminal 1 - Backend WebSocket Server:**
```bash
cd ground-station/backend/
npm start
```
- Server runs on port 8080
- Polls database at 60Hz and broadcasts to clients

**Terminal 2 - Frontend Interface:**
```bash
cd ground-station/new_frontend/my-app/
npm run dev
```
- Interface available at http://localhost:3000
- Connects to WebSocket server automatically

**Terminal 3 - Command Client:**
```bash
cd command-client/
python socket_client.py
```

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
