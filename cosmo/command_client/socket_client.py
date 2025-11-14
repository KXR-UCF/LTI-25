import socket
import serial
import time
import os

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("192.168.1.30", 9600))
ser = serial.Serial("/dev/ttyACM0", 9600)

# Create named pipe for sharing switch states with server.js
PIPE_PATH = '/tmp/switch_pipe'
if not os.path.exists(PIPE_PATH):
    os.mkfifo(PIPE_PATH)
    print(f"Created named pipe: {PIPE_PATH}")

# Track current switch states to resend on reconnection
current_switch_states = {
    'switch1': False,
    'switch2': False,
    'switch3': False,
    'switch4': False,
    'switch5': False,
    'switch6': False,
    'launchKey': False,
    'abort': False
}

# Function to open/reopen pipe
def open_pipe():
    try:
        pipe_fd = os.open(PIPE_PATH, os.O_WRONLY | os.O_NONBLOCK)
        pipe = os.fdopen(pipe_fd, 'w')
        print(f"✅ Opened named pipe for writing")
        return pipe
    except OSError as e:
        print(f"⚠️  Could not open pipe (server.js may not be running): {e}")
        return None

# Function to parse and track switch state from message
def parse_and_track_state(msg_str):
    """Parse message and update current_switch_states. Returns True if it's a switch message."""
    # "1 Open" / "1 Close" → switches 1-6 (or multi-digit like "10 Open")
    if len(msg_str) >= 3 and (msg_str.endswith('Open') or msg_str.endswith('Close')):
        parts = msg_str.split()
        if len(parts) >= 2 and parts[0].isdigit():
            switch_num = parts[0]
            state = msg_str.endswith('Open')
            switch_map = {
                '1': 'switch1',
                '2': 'switch2',
                '3': 'switch3',
                '4': 'switch4',
                '5': 'switch5',
                '6': 'switch6',
            }
            if switch_num in switch_map:
                current_switch_states[switch_map[switch_num]] = state
                return True

    # "ENABLE FIRE" / "DISABLE FIRE"
    if msg_str == 'ENABLE FIRE' or msg_str == 'DISABLE FIRE':
        current_switch_states['launchKey'] = (msg_str == 'ENABLE FIRE')
        return True

    # "FIRE"
    if msg_str == 'FIRE':
        current_switch_states['abort'] = True
        return True

    # "ABORT OFF" / "FIRE OFF"
    if msg_str == 'ABORT OFF' or msg_str == 'FIRE OFF':
        current_switch_states['abort'] = False
        return True

    return False

# Function to resend all current switch states
def resend_all_states(pipe):
    """Send all current switch states to pipe after reconnection."""
    if not pipe:
        return

    print(f"📡 Resending current switch states to reconnected pipe...")

    # Map switch states back to hardware message format
    switch_to_num = {
        'switch1': '1',
        'switch2': '2',
        'switch3': '3',
        'switch4': '4',
        'switch5': '5',
        'switch6': '6',
    }

    try:
        # Send switch 1-6 states
        for switch_name in ['switch1', 'switch2', 'switch3', 'switch4', 'switch5', 'switch6']:
            switch_num = switch_name.replace('switch', '')
            state = current_switch_states[switch_name]
            msg = f"{switch_num} {'Open' if state else 'Close'}"
            pipe.write(msg + '\n')
            pipe.flush()
            print(f"  → {msg}")

        # Send launchKey state
        launch_msg = 'ENABLE FIRE' if current_switch_states['launchKey'] else 'DISABLE FIRE'
        pipe.write(launch_msg + '\n')
        pipe.flush()
        print(f"  → {launch_msg}")

        # Send abort state
        if current_switch_states['abort']:
            pipe.write('FIRE\n')
            pipe.flush()
            print(f"  → FIRE")
        else:
            pipe.write('FIRE OFF\n')
            pipe.flush()
            print(f"  → FIRE OFF")

        print(f"✅ All states resent successfully")
    except Exception as e:
        print(f"⚠️  Error resending states: {e}")
        return None

    return pipe

# Open pipe initially
pipe = open_pipe()
if pipe:
    # Resend current states on initial connection
    pipe = resend_all_states(pipe)

# set socket timeout
s.settimeout(0.1)
try:
    while True:
        # receive data from the server and decoding to get the string.
        msg = ser.readline().decode().strip().encode()

        if len(msg) == 0:
            continue

        # send until error or ack repsonse
        response_ack = False
        response_err = False
        attempts = 0
        while (not response_ack) and (not response_err):

            # if no response after 5 attempts give up
            if attempts > 5:
                print(f"No responses: <{msg}>")
                break

            s.send(msg)
            print(f"Sent: <{msg.decode()}>")
            attempts += 1

            # check for response
            try:
                response_msg = s.recv(1024)
                response_msg = response_msg.decode().strip()
                response_ack = (response_msg == f"ACK: {msg.decode().strip()}")
                response_err = (response_msg == f"ERR: {msg.decode().strip()}")
            except socket.timeout:
                print("No ACK")

        # error check
        if response_err:
            print(f"ERROR: {response_msg}")

        # do something after a successful response
        if response_ack:
            print(f"Received Response: {response_msg}")

            msg_str = msg.decode().strip()

            # Track switch state changes
            parse_and_track_state(msg_str)

            # Write switch state to named pipe for server.js
            if pipe:
                try:
                    pipe.write(msg_str + '\n')
                    pipe.flush()
                except BrokenPipeError:
                    print("⚠️  Pipe broken (server.js disconnected) - will attempt reconnection")
                    pipe = None
                except Exception as e:
                    print(f"⚠️  Error writing to pipe: {e}")
                    pipe = None
            else:
                # Try to reconnect pipe
                print(f"🔄 Attempting to reconnect pipe...")
                pipe = open_pipe()
                if pipe:
                    # Resend all current states after reconnection
                    pipe = resend_all_states(pipe)
                    # Try to send current message again
                    if pipe:
                        try:
                            pipe.write(msg_str + '\n')
                            pipe.flush()
                        except Exception as e:
                            print(f"⚠️  Error writing after reconnect: {e}")
                            pipe = None

except KeyboardInterrupt:
    print("Interrupted by user")

finally:
    # close the connection
    s.close()
    if pipe:
        pipe.close()

    # Remove named pipe file
    try:
        if os.path.exists(PIPE_PATH):
            os.unlink(PIPE_PATH)
            print(f"Removed named pipe: {PIPE_PATH}")
    except Exception as e:
        print(f"Warning: Could not remove pipe: {e}")

    print("Connections closed")
