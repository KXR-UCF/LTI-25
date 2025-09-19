# LTI 25

A comprehensive telemetry and data visualization system with multiple UI interfaces and data processing capabilities.

## Project Structure

### Frontend Applications
- **liquid-ui**: Next.js application for liquid propellant monitoring
- **solid-ui**: Next.js application for solid propellant monitoring
- **backend**: Node.js server for API endpoints

### Data Processing
- **questdb**: QuestDB integration for time-series data storage and processing
- **sockets**: Socket communication for real-time data streaming

## Features

- Real-time telemetry data visualization
- Load cell monitoring and graphing
- Thermal couple data tracking
- Pressure transducer readings
- System controls and launch management
- Continuity testing capabilities

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python 3.x
- QuestDB

### Installation

1. Clone the repository
2. Install dependencies for each frontend application:
   ```bash
   cd frontend/application/liquid-ui
   npm install
   
   cd ../solid-ui
   npm install
   
   cd ../backend
   npm install
   ```

3. Install Python dependencies:
   ```bash
   cd questdb
   pip install -r requirements.txt
   ```

### Running the Applications

1. Start QuestDB
2. Run the socket server:
   ```bash
   cd questdb
   python socket_server.py
   ```
3. Start the backend API:
   ```bash
   cd frontend/application/backend
   npm start
   ```
4. Start the frontend applications:
   ```bash
   cd frontend/application/liquid-ui
   npm run dev
   
   # In another terminal
   cd frontend/application/solid-ui
   npm run dev
   ```

## Data Format

Telemetry data is stored in a space-separated format with four columns representing different sensor readings.

## License

This project is part of the LTI 25 mission.
