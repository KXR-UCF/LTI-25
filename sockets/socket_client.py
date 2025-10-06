import socket
import serial
import time

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("192.168.1.7", 9600))
ser = serial.Serial("/dev/ttyACM0", 9600)

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

except KeyboardInterrupt:
    print("Interrupted by user")

finally:
    # close the connection 
    s.close()
