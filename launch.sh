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

cleanup() {
    echo "Stopping system..."
    tmux kill-session -t "$SESSION" 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting Cosmo..."

# Kill old session
tmux kill-session -t "$SESSION" 2>/dev/null

# Create new session and first window
tmux new-session -d -s "$SESSION" -n socket

# Start socket client in new window
echo "Starting socket client..."
tmux send-keys -t "$SESSION:0" \
    "cd $SOCKET_PATH" C-m \
    "python3 socket_client.py" C-m

# Start backend in new window
echo "Starting backend..."
tmux new-window -t "$SESSION:1" -n backend
tmux send-keys -t "$SESSION:1" \
    "cd $BACKEND_PATH" C-m \
    "npm start" C-m

# Start frontend in new window
echo "Starting frontend..."
tmux new-window -t "$SESSION:2" -n frontend
tmux send-keys -t "$SESSION:2" \
    "cd $FRONTEND_PATH" C-m \
    "npm run dev" C-m

echo "Attaching to session..."

tmux attach-session -t "$SESSION"