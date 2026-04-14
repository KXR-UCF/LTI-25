import socket
import time

BROADCAST_IP = '255.255.255.255' # sends to all device on network
PORT = 9601 # Pis will be listening on this

MESSAGE = "Hello from UDP broadcast server!"
# Time interval between broadcasts (in seconds)
INTERVAL = 2

# Create socket instance
# family: AF_INET - IPv4 addressing
# type: SOCK_DGRAM - UDP (datagram-based, no connection)
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# set specified option in socket object to value
# level: SOL_SOCKET: required
# option: SO_BROADCAST: required, allows sending packets to a broadcast address
# value: should be 1 to turn on
sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

# SO_REUSEADDR: allows reuse of the port if the socket was recently closed
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

print(f"Broadcasting on port {PORT}...")

while True:
    try:
        # Sends data to socket
        # bytes: message converted to bytes
        # address: tuple (destination IP, destination port)
        sock.sendto(MESSAGE.encode('utf-8'), (BROADCAST_IP, PORT))

        print(MESSAGE)

        # Wait before sending again
        time.sleep(INTERVAL)

    except KeyboardInterrupt:
        print("\nServer stopped by user.")
        break

# Close connection
sock.close()