#KXR DAQ - example file for 4 differential channels

#!/usr/bin/python
# -*- coding:utf-8 -*-

import ADS1256
import numpy as np
import RPi.GPIO as GPIO

try:
    ADC = ADS1256.ADS1256()
    ADC.init()
    ADC.configADC(6,0xF0)

    while (1):
        ADC_Value = ADC.getAll()
        voltage = np.array(ADC_Value) * 5.0 / 0x7fffff

        print("0 ADC = %lf" % (voltage[0]), end='\t')
        print("1 ADC = %lf" % (voltage[1]), end='\t')
        print("2 ADC = %lf" % (voltage[2]), end='\t')
        print("3 ADC = %lf" % (voltage[3]))

except:
    GPIO.cleanup()
    print("\r\nProgram end     ")
    exit()
