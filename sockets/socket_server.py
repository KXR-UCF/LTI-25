import RPi.GPIO as GPIO
from time import sleep
import json

from questdb.ingress import Sender, Protocol
from datetime import datetime

SWITCH_STATE_FILENAME = 'switch_states.json'

conf = (
    'http::addr=localhost:9000;'
    'username=admin;'
    'password=quest;'
    'auto_flush=on;'
    'auto_flush_rows=1;'
    # 'auto_flush_interval=1000;'
    )

pinRELAY = 5 #Nox Fill
pinRELAY2 = 6 #Nox Vent
pinRELAY3 = 13 #Nox Relief
pinRELAY4 = 16 #Nitrogen Fill
pinRELAY5 = 19 #Nitrogen Vent
pinRELAY6 = 20 #Continuity
pinRELAY7 = 21 #Fire Enable Key
pinRELAY8 = 26 #Fire 

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(pinRELAY, GPIO.OUT)
GPIO.setup(pinRELAY2, GPIO.OUT)
GPIO.setup(pinRELAY3, GPIO.OUT)
GPIO.setup(pinRELAY4, GPIO.OUT)
GPIO.setup(pinRELAY5, GPIO.OUT)
GPIO.setup(pinRELAY6, GPIO.OUT)
GPIO.setup(pinRELAY7, GPIO.OUT)
GPIO.setup(pinRELAY8, GPIO.OUT)

import socket

# Define the server's IP address and port
host = '0.0.0.0'  # Accept connections from any IP address
port = 9600        # Same port as in the client

# Create a TCP/IP socket
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)


# Bind the socket to the address and port
server_socket.bind((host, port))

# Enable the server to accept connections (max 1 connection in the backlog queue)
server_socket.listen(1)

print(f"Server listening on {host}:{port}...")

# Accept incoming client connections
client_socket, client_address = server_socket.accept()
print(f"Connection established with {client_address}")

switch_states = {}

with Sender.from_conf(conf) as sender:
    try:
        while True:
            # Receive data from the client (up to 1024 bytes at a time)
            msg = client_socket.recv(1024)

            # If there's no data, break the loop
            if not msg:
                print("No data received. Closing connection.")
                break

            # Decode the received data
            msg = msg.decode().strip()
            print(f"Received data: {msg}")
            if msg == "1 Open":
                GPIO.output(pinRELAY, GPIO.HIGH)
            elif msg == "1 Close":
                GPIO.output(pinRELAY, GPIO.LOW)
                
            if msg == "2 Open":
                GPIO.output(pinRELAY2, GPIO.HIGH)
            elif msg == "2 Close":
                GPIO.output(pinRELAY2, GPIO.LOW)
                
            if msg == "3 Open":
                GPIO.output(pinRELAY3, GPIO.HIGH)
            elif msg == "3 Close":
                GPIO.output(pinRELAY3, GPIO.LOW)
                
            if msg == "4 Open":
                GPIO.output(pinRELAY4, GPIO.HIGH)
            elif msg == "4 Close":
                GPIO.output(pinRELAY4, GPIO.LOW)
                
            if msg == "5 Open":
                GPIO.output(pinRELAY5, GPIO.HIGH)
            elif msg == "5 Close":
                GPIO.output(pinRELAY5, GPIO.LOW)
                
            if msg == "6 Open":
                GPIO.output(pinRELAY6, GPIO.HIGH)
            elif msg == "6 Close":
                GPIO.output(pinRELAY6, GPIO.LOW)
                
            if msg == "ENABLE FIRE":
                GPIO.output(pinRELAY7, GPIO.HIGH)
                GPIO.output(pinRELAY8, GPIO.LOW)
            elif msg == "DISABLE FIRE":
                GPIO.output(pinRELAY7, GPIO.LOW)
                
            if msg == "FIRE":
                GPIO.output(pinRELAY8, GPIO.HIGH)
            
            print(msg)
            # You can process or store the received data as needed here
            # For example, saving the data to a file:
            # with open("received_data.txt", "a") as file:
            #     file.write(received_data + "\n")

            try:

                # update sate file
                switch = None
                switch_open = None
                if msg[0].isdigit():
                    switch_info = msg.split(' ')
                    
                    if not switch_info[0].isnumeric():
                        raise ValueError(f"Switch id <{switch_info[0]}> not numeric")

                    switch = f"switch_{switch_info[0]}"
                    if switch_info[1] == "Open" or switch_info[1] == "Close":
                        switch_state = switch_info[1] == "Open"
                    else:
                        raise ValueError(f"{switch} not open or closed")

                elif msg == "ENABLE FIRE" or msg == "DISABLE FIRE":
                    switch = "enable_fire"
                    switch_state = (msg == "ENABLE FIRE")

                elif msg == "FIRE":
                    switch = "fire"
                    switch_state = True

                else:
                    raise ValueError(f"Unexpected Command")

                # send data and time to questDB
                switch_states[switch] = switch_state
                sender.row(
                    'telemetry_data',
                    columns = {
                        switch: switch_state
                    },
                    at=datetime.now()
                )

            except ValueError as e:
                print(f"{e} \n\n CMD: <{msg}>")

            # respond to client
            client_socket.send(f"ACK: {msg}".encode())


    except KeyboardInterrupt:
        print("Server interrupted by user.")

    finally:
        # Make sure all Relays are off, close the client socket and server socket
        print("Shutting off Relays...")
        GPIO.output(pinRELAY, GPIO.LOW)
        GPIO.output(pinRELAY2, GPIO.LOW)
        GPIO.output(pinRELAY3, GPIO.LOW)
        GPIO.output(pinRELAY4, GPIO.LOW)
        GPIO.output(pinRELAY5, GPIO.LOW)
        GPIO.output(pinRELAY6, GPIO.LOW)
        GPIO.output(pinRELAY7, GPIO.LOW)
        GPIO.output(pinRELAY8, GPIO.LOW)
        print("Closing connection...")
        client_socket.close()
        server_socket.close()

        # clear state file
        try:
            with open(SWITCH_STATE_FILENAME, 'r') as f:
                switch_states = json.load(f)


            for key in switch_states.keys():
                switch_states[key] = False

            with open(SWITCH_STATE_FILENAME, 'w') as f:
                switch_states = json.dump(f, indent=4, sort_keys=True)
        except:
            print("failed to clear switch state file")
