#!/bin/bash

# Automates start of cosmo
# To run:
# Give script command priviledges: chmod +x launch.sh
# Run script: ./launch.sh

SESSION="cosmo"

# Paths
SOCKET_PATH="cosmo/command_client"
BACKEND_PATH="cosmo/ground_station/backend"
FRONTEND_PATH="cosmo/new_frontend/my-app"

cleanup()
{
    echo "Stopping system..."
    tmux kill-session -t "$SESSION" 2>/dev/null
    exit 0
}

echo "Starting Cosmo..."

# Kill old session if exists
tmux kill-session -t "$SESSION" 2>/dev/null

tmux new-session -s -d $SESSION

# Start new tmux session with socket client
echo "Starting socket client..."
tmux rename-window -t 0 "socket"
tmux send-keys -t 'cd $SOCKET_PATH' C-m 'python3 socket_client.py' C-m

# Split into right pane for backend
echo "Starting backend..."
tmux new-window -t $SESSION:1 -n "backend"
tmux send-keys -t 'cd $BACKEND_PATH' C-m 'npm start' C-m

# Split bottom pane for frontend
echo "Starting frontend..."
tmux new-window -t $SESSION:2 -n "frontend"
tmux send-keys -t 'cd $FRONTEND_PATH' C-m 'npm run dev' C-m

# Attach so user sees all 3 processes
tmux attach-session -t "$SESSION"

trap cleanup SIGINT SIGTERM
echo "Cosmo is running - Press Ctrl+C to stop"
wait