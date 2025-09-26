# Rocket Telemetry System - Setup & Operation Guide

## System Overview

A unified real-time telemetry system that monitors rocket engine performance through:
- **QuestDB**: Time-series database storing all telemetry data
- **WebSocket Server**: Real-time data streaming at 60Hz
- **Frontend UIs**: Web interfaces for solid and liquid rocket monitoring

## Complete System Setup

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

### 4. Start WebSocket Server (Backend)
```bash
cd solid-ui/backend/
npm install ws pg
npm start
```
- Server runs on port 8080
- Polls database at 60Hz and broadcasts to clients

### 5. Start Frontend Interface
```bash
cd solid-ui/frontend/
npm install
npm run dev
```
- Interface available at http://localhost:3000
- Connects to WebSocket server automatically


## Shutting Down the System

### 1. Stop Frontend
```bash
# In frontend terminal, press:
Ctrl + C
```

### 2. Stop WebSocket Server
```bash
# In backend terminal, press:
Ctrl + C
```

### 3. Stop QuestDB
```bash
questdb stop
```

## File Locations
- **Database Setup**: QuestDB web console
- **Backend Server**: `solid-ui/backend/server.js`
- **Frontend**: `solid-ui/frontend/`
- **Documentation**: `application/README.md` (this file)