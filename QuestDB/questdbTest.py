#!/usr/bin/python

# import ADS1256
import numpy as np
# import RPi.GPIO as GPIO
from questdb.ingress import Sender, Protocol
# import pandas as pd
from datetime import datetime

import daqmanager


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

conf = (
    'http::addr=localhost:9000;'
    'username=admin;'
    'password=quest;'
    'auto_flush=on'
    'auto_flush_rows=100;'
    'auto_flush_interval=1000;'
    )



# try:

adc_manager = daqmanager.AdcManager()
load_cell_manager = daqmanager.LoadCells(adc_manager)
load_cell_manager.calibrate_tares()

# with Sender(Protocol.Http, 'localhost', 9000, username='admin', password='quest', auto_flush=True, auto_flush_rows=60) as sender:

with Sender.from_conf(conf) as sender: # Allows for QuestDB insertion
    print("Connected to QuestDB")
    while True:

        # get load cell values
        load_cell_values = load_cell_manager.get_all_forces()
        netForce = np.sum(load_cell_values)

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
        # sender.flush()

            # print('sent')
# except Exception as e:
#     print(f"Unexpected error: {e}")
#     GPIO.cleanup()
#     print("\r\nProgram end     ")


