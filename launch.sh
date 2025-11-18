#!/bin/bash

# Automates start of cosmo
# To run:
# Give script command priviledges: chmod +x launch.sh
# Run script: ./launch.sh

SESSION="cosmo"

# Paths
SOCKET_PATH="cosmo/command_client"
BACKEND_PATH="cosmo/ground_station/backend"
FRONTEND_PATH="cosmo/new_frontend/app"

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
tmux new-session -d -s "$SESSION"

tmux bind-key -t "$SESSION" C-c kill-session

# Start socket client in new window
echo "Starting socket client..."
tmux send-keys -t "$SESSION:0" \
    "cd $SOCKET_PATH" C-m \
    "python3 socket_client.py" C-m

# Start backend in new window
echo "Starting backend..."
tmux split-window -h -t "$SESSION"
tmux send-keys -t "$SESSION" \
    "cd $BACKEND_PATH" C-m \
    "npm start" C-m

# Start frontend in new window
echo "Starting frontend..."
tmux split-window -v -t "$SESSION"
tmux send-keys -t "$SESSION" \
    "cd $FRONTEND_PATH" C-m \
    "npm run dev" C-m

# Attach session
echo "Attaching to session..."
tmux attach-session -t "$SESSION"

cleanup