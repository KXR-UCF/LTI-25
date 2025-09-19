import socket
import serial
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("192.168.1.9", 9600))
ser = serial.Serial("/dev/ttyACM0", 9600)

while True:
# receive data from the server and decoding to get the string.
  s.send(ser.readline().decode().strip().encode())
# close the connection 
s.close()
