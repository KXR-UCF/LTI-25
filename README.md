<div align="center">
  <img src="https://github.com/user-attachments/assets/dfb9ba20-90f2-4d87-a80b-ac4135f498d7" alt="LTI Logo" width="300"/>
  
  <h1>LTI - Launch & Test Infrastructure</h1>
  
  <p>Ground support software for KXR static fires. This repository contains all code running on the DAQ & Controls system (WANDA) and the control station (COSMO).</p>
</div>

## System Overview

| System | Location | Description |
|--------|----------|-------------|
| **WANDA** | [`Wanda/`](/Wanda/) | Runs downrange on three Raspberry Pis. Handles actuator controls, data aquisiton, and the database. |
| **COSMO** | [`Cosmo/`](/Cosmo/) | Run on the uprange control station. Handles live data visualization, and sends control states to WANDA for actuation. |

---

## Repository Structure

```
├── Wanda/
│   ├── DataIngestion/       # Data ingestion from ADC to QuestDB
│   ├── Controls/            # Raspberry Pi Socket server
│   ├── Systemd/             # Service files for all Wanda processes
│   ├── Questdb/             # QuestDB server setup
│   ├── status_server.py     # Wanda Dashboards for system management
│   └── requirements.txt     # Python requirements
│
├── Cosmo/
│   ├── socket_client.py     # Command socket client
│   ├── Telemetry_visualization/
│   │   ├── Backend/         
│   │   └── Frontend/        
│   └── Systemd/             # Service files for all Cosmo processes
│
└── archive/
```

---

## Architecture Flow

The LTI system is built on a split-network architecture:


### Controls
1. **Commands:** COSMO sends socket commands over the local network.
2. **Actuation:** WANDA receives these commands and switches on/off the appropriate relays.

### Data Acquisition
1. **Data Ingestion:** WANDA reads sensor data from the KXR ADC hats and sends it to the locally hosted QuestDB container.
2. **Visualization:** COSMO queries that database to render real-time graphs.

---

## Helpful Resources
+ See [`Wanda/`](Wanda/README.md) for all setup instructions related to the WANDA system. 
+ See [`Cosmo/`](Cosmo/README.md) for all setup instructions related to the COSMO system.
+ The test stand uses custom KXR Raspberry Pi hats built around the ADS1256 24-bit ADC. Hardware design files (KiCad schematics, gerbers, BOM) are located in [`Wanda/DataIngestion/ADC/Pi Hat/`](Wanda/DataIngestion/ADC/Pi%20Hat/).
