#!/usr/bin/python

#KXR DAQ - calibration file for 4-8 channels
import numpy as np
import RPi.GPIO as GPIO
import ADS1256
import sys
from collections import deque

DIFFERENTIAL = True
ADC_ID = 1

# Pin definition (GPIO)    
if ADC_ID == 1:
    RST_PIN  = 24
    CS_PIN   = 8
    DRDY_PIN = 22
else: 
    RST_PIN  = 25
    CS_PIN   = 7
    DRDY_PIN = 23

scale_factors = [1, 1, 1, 1, 1, 1, 1, 1]
history = [deque(maxlen=1000) for _ in range(8)]

try:
    ADC = ADS1256.ADS1256(RST_PIN, CS_PIN, DRDY_PIN)
    ADC.init()
    ADC.configADC(6,0xF0)
        
    if not DIFFERENTIAL:
        ADC.setMode(0)

    sys.stdout.write(f"\033[0;1H")
    sys.stdout.write("\033[K")
    sys.stdout.write(f"{f'Channel':<10} {'Voltage'}")
    while True:
        ADC_Value = ADC.getAll()
        voltages = np.array(ADC_Value) * 5.0 / 0x7fffff
        
        for i, voltage in enumerate(voltages):
            history[i].append(voltage)
            avg_voltage = np.mean(history[i])
            output_line = f"{i:<10} {avg_voltage:.6f}"

            sys.stdout.write(f"\033[{i+2};1H")
            sys.stdout.write("\033[K")
            sys.stdout.write(output_line)
        sys.stdout.flush()


except Exception as e:
    GPIO.cleanup()
    print(e)
    print("\r\nProgram end     ")
    exit()
