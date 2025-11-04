import RPi.GPIO as GPIO
import socket
import time

RELAY_PINS = [5, 6, 13, 16, 19, 20, 21, 26]

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
for pin in RELAY_PINS:
    GPIO.setup(pin, GPIO.OUT)

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("192.168.1.7", 9600))

try:
    while True:
        # Receive data from COSMO (up to 1024 bytes at a time)
        msg = s.recv(1024).decode()
        success = False

        # If there's no data, break the loop
        if not msg:
            print("No data received. Closing connection.")
            break

    
            



        





except KeyboardInterrupt:
    print("Interrupted by user")

finally:
    # close the connection 
    s.close()
