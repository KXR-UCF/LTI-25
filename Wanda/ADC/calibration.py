#!/usr/bin/python

#KXR DAQ - calibration file for 4-8 channels
import numpy as np
import RPi.GPIO as GPIO
import ADS1256
import sys
from collections import deque
import time

DIFFERENTIAL = False
ADC_ID = 1

VREF = 2.5
PGA = 1

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
history = [deque(maxlen=500) for _ in range(8)]
loop_time = deque(maxlen=10)

try:
    ADC = ADS1256.ADS1256(RST_PIN, CS_PIN, DRDY_PIN)
    ADC.init()
    ADC.configADC(0,0xF0)
    
    if not DIFFERENTIAL:
        ADC.setMode(0)

    while True:
        start_time = time.time()
        ADC_Value = ADC.getAll()
        # voltages = np.array(ADC_Value) * 5.0 / 0x7fffff
        voltages = np.array(ADC_Value) * (2*VREF/PGA) / 0x7fffff

        sys.stdout.write(f"\033[1;1H")
        sys.stdout.write("\033[K")
        sys.stdout.write(f"{'SPS:':<10} {len(loop_time)/np.sum(loop_time):.2f}")

        sys.stdout.write(f"\033[2;1H")
        sys.stdout.write("\033[K")
        sys.stdout.write(f"{f'Channel':<10} {'Voltage'}")
        for i, voltage in enumerate(voltages):
            if DIFFERENTIAL and i > 3:
                break
            history[i].append(voltage)
            avg_voltage = np.mean(history[i])
            output_line = f"{i:<10} {avg_voltage:.6f}"

            sys.stdout.write(f"\033[{i+3};1H")
            sys.stdout.write("\033[K")
            sys.stdout.write(output_line)
        sys.stdout.flush()

        loop_time.append(time.time() - start_time)


except Exception as e:
    GPIO.cleanup()
    print(e)
    print("\r\nProgram end     ")
    exit()
