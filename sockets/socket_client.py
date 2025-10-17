import socket
import serial
import time
import os

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("192.168.1.7", 9600))
ser = serial.Serial("/dev/ttyACM0", 9600)

# Create named pipe for sharing switch states with server.js
PIPE_PATH = '/tmp/switch_pipe'
if not os.path.exists(PIPE_PATH):
    os.mkfifo(PIPE_PATH)
    print(f"Created named pipe: {PIPE_PATH}")

# Open pipe in non-blocking mode to avoid hanging if server.js isn't running
try:
    pipe_fd = os.open(PIPE_PATH, os.O_WRONLY | os.O_NONBLOCK)
    pipe = os.fdopen(pipe_fd, 'w')
    print(f"Opened named pipe for writing")
except OSError as e:
    print(f"Warning: Could not open pipe (server.js may not be running): {e}")
    pipe = None

try:
    while True:
        # receive data from the server and decoding to get the string.
        msg = ser.readline().decode().strip().encode()

        if len(msg) == 0:
            continue

        s.send(msg)
        send_time = time.time()
        attempts = 1

        # check for response
        response_ack = False
        while not response_ack:
            # if no response within a second, retry send message
            if time.time() - send_time >= 1:
                s.send(msg)
                send_time = time.time()
                attempts += 1

            # if no response after 5 attempts give up
            if attempts > 5:
                print(f"No response | msg:<{msg}>")
                break
            # check for response
            response_msg = s.recv(1024)
            response_msg = response_msg.decode().strip()
            response_ack = (response_msg == f"ACK: {msg.decode().strip()}")

        # do something after a successful response
        if response_ack:
            print(f"Received Response: {response_msg}")

            # Write switch state to named pipe for server.js
            if pipe:
                try:
                    pipe.write(msg.decode().strip() + '\n')
                    pipe.flush()
                except BrokenPipeError:
                    print("Warning: Pipe broken (server.js disconnected)")
                    pipe = None
                except Exception as e:
                    print(f"Warning: Error writing to pipe: {e}")

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
