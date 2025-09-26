#!/usr/bin/python
# -*- coding:utf-8 -*-

# import ADS1256
import numpy as np
import RPi.GPIO as GPIO
from questdb.ingress import Sender
import pandas as pd
from datetime import datetime

import sensorHandler


rows = [
    "cell1_force",
    "cell2_force",
    "cell3_force",
    "net_force",
    "pressure_pt1",
    "pressure_pt2",
    "pressure_pt3",
    "pressure_pt4",
    "pressure_pt5",
    "pressure_pt6",
    "weight_load_cell",
    "chamber_temp",
    "nozzle_temp"
]

conf = 'http::addr=localhost:9000;'



# try:

adc_handler = sensorHandler.AdcHandler()
load_cell_handler = sensorHandler.LoadCellHandler(adc_handler)
load_cell_handler.calibrate_tares()


with Sender.from_conf(conf) as sender: # Allows for QuestDB insertion
    print("Connected to QuestDB")
    while True:

        # get load cell values
        load_cell_values = load_cell_handler.get_all_values()
        netForce = np.mean(load_cell_values)

        # send data and time to questDB
        sender.row(
            'telemetry_data',
            columns = {
                'cell1_force': float(load_cell_values[0]),
                'cell2_force': float(load_cell_values[1]),
                'cell3_force': float(load_cell_values[2]),
                'net_force': float(netForce*100)
            },
            at=datetime.now()
        )
        sender.flush()

            # print('sent')
# except Exception as e:
#     print(f"Unexpected error: {e}")
#     GPIO.cleanup()
#     print("\r\nProgram end     ")


