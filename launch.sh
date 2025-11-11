#!/bin/bash
# Automates start of cosmo
# To run:
# Give script command priviledges: chmod +x launch.sh
# Run script: ./launch.sh

# Kills all program
cleanup()
{
    echo "Stopping system..."
    kill back_pid front_pid cmd_pid 2>/dev/null
    wait
    exit 0
}

cd cosmo

# Start command client
echo "Starting command client..."
cd ../../..
cd command_client/
python socket_client.py &
cmd_pid=$!

# Start backend websocket server
echo "Starting backend..."
cd ground_station/backend/
npm start &
back_pid=$!

# Start frontend interface
echo "Starting frontend..."
cd ..
cd new_frontend/my-app/
npm run dev &
front_pid=$!

echo "Cosmo is running - Press Ctrl+C to stop"
trap cleanup SIGINT SIGTERM