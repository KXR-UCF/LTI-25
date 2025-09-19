import socket
import serial
import struct
from questdb.ingress import Sender
from datetime import datetime

SERVER_IP = "192.168.1.7"
SERVER_PORT = 9600
DATA_BUFFER_SIZE = 16
conf = 'http::addr=localhost:9009;'

# Connect to server
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect((SERVER_IP, SERVER_PORT))
ser = serial.Serial("/dev/ttyACM0", SERVER_PORT)

while True: # Ensures valid trial data type
    try:
        trial = int(input("Enter trial number: "))
        if trial > 0:
            break
        else: 
            print("Trial number must be an integer greater than 0")
    except ValueError:
        print("Invalid trial value")

with Sender.from_conf(conf) as sender: # Allows for QuestDB insertion
    try:
        while True:
            data = s.recv(DATA_BUFFER_SIZE) # Receiving data from server (Wanda)
            if not data:
                break
            f1, f2, f3, pressure = struct.unpack('ffff', data)
            avgForce = f1 + f2 + f3 / 3

            sender.row( # Sending data and time to database
                'LTI_data',
                columns = {
                    'trial': trial,
                    'f1': f1,
                    'f2': f2,
                    'f3': f3,
                    'pressure': pressure,
                    'avgForce': avgForce,
                },
                at=datetime.now()
            )
            sender.flush()

        while True: # I have no idea what this does - Daryl
            # receive data from the server and decoding to get the string.
            s.send(ser.readline().decode().strip().encode())

    except Exception as e:
        print(f"Unexpected error: {e}")

    finally: # Close the connection
        s.close()
        print("Connection closed\nTerminating")
