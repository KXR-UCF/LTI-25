#!/bin/bash
# Automates start of cosmo
# To run:
# Give script command priviledges: chmod +x launch.sh
# Run script: ./launch.sh

# Kills all program
cleanup()
{
    echo "Stopping system..."
    kill cmd_pid back_pid front_pid 2>/dev/null
    wait
    exit 0
}

# Start command client
echo "Starting command client..."
cd cosmo/command_client
python3 socket_client.py &
cmd_pid=$!

# Start backend websocket server
echo "Starting backend..."
cd ..
cd ground_station/backend/
npm start &
back_pid=$!

# Start frontend interface
echo "Starting frontend..."
cd ..
cd new_frontend/my-app/
npm run dev &
front_pid=$!

trap cleanup SIGINT SIGTERM
echo "Cosmo is running - Press Ctrl+C to stop"
wait