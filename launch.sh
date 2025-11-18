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

# Start new tmux session with socket client
echo "Starting socket client..."
tmux new-session -s "$SESSION" -n "$SESSION"
tmux send-keys -t  "cd $SOCKET_PATH && python3 socket_client.py" Enter

# Split into right pane for backend
echo "Starting backend..."
tmux split-window -h -t "$SESSION"
tmux send-keys -t "cd $BACKEND_PATH && npm start" Enter

# Split bottom pane for frontend
echo "Starting frontend..."
tmux split-window -v -t "$SESSION"
tmux send-keys -t "cd $FRONTEND_PATH && npm run dev" Enter

# Attach so user sees all 3 processes
#tmux attach-session -t "$SESSION"

trap cleanup SIGINT SIGTERM
echo "Cosmo is running - Press Ctrl+C to stop"
wait