#!/bin/bash

# Automates start of cosmo
# To run:
# Give script command priviledges: chmod +x launch.sh
# Run script: ./launch.sh

SESSION="cosmo"

cleanup()
{
    echo "Stopping system..."
    tmux kill-session -t "$SESSION" 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting Cosmo..."

# Kill old session if exists
tmux kill-session -t "$SESSION" 2>/dev/null

# Start new tmux session with socket client
tmux new-session -d -s "$SESSION" \
    "cd cosmo/command_client && python3 socket_client.py"

# Split into right pane for backend
tmux split-window -h -t "$SESSION" \
    "cd cosmo/ground_station/backend && npm start"

# Split bottom pane for frontend
tmux split-window -v -t "$SESSION:0.0" \
    "cd cosmo/new_frontend/my-app && npm run dev"

# Attach so user sees all 3 processes
tmux attach-session -t "$SESSION"