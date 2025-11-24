#!/usr/bin/python

from ADC import adcmanager

import numpy as np
from questdb.ingress import Sender, Protocol, TimestampNanos
from datetime import datetime

import json
import time
import socket
import subprocess
import re

def get_cpu_temp():
        temp_output = subprocess.check_output(["vcgencmd", "measure_temp"]).decode()
        match = re.search(r"temp=(\d+\.?\d*)'C", temp_output)
        if match:
            return float(match.group(1))
        return None


hostname = socket.gethostname()

conf = (
    'tcp::addr=localhost:9009;'  # Changed from http to tcp
    'auto_flush=on;'
    'auto_flush_rows=1;'
)

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

# SWITCH_STATE_FILENAME = "switch_states.json"
# CONFIG_FILE_NAME = adcmanager.CONFIG_FILE_NAME

# load_cell_group1 = adcmanager.LoadCellGroup()
# load_cell_group1.add_all_from_config()
# load_cell_group1.calibrate_tares(num_samples=1000)
# load_cell_group1.print_load_cells_information()

load_cells = []
for i in range(8):
     load_cells.append(adcmanager.LoadCell(f"lc{i+1}"))


row_count = 0
start_time = 0
last_report_time = time.time()

adc_times = []
questdb_times = []
loop_times = []

try:
    with Sender.from_conf(conf) as sender: # Allows for QuestDB insertion

        sender.row(table_name=hostname, at=datetime.now())

        # st = time.time()
        print("Connected to QuestDB")
        start_time = time.time()
        print("Sending Data")
        while True:
            loop_start = time.time()

            # cpu_temp = get_cpu_temp()

            # get load cell values
            adc_start = time.time()

            columns = {}
            for load_cell in load_cells:
                 columns[load_cell.name] = load_cell.get_force()

            adc_times.append(time.time() - adc_start)


            # send data and time to questDB
            questdb_start = time.time()
            sender.row(
                table_name=hostname,
                columns=columns,
                at=TimestampNanos.now()
            )
            row_count += 1
            questdb_times.append(time.time() - questdb_start)

            current_time = time.time()
            if current_time - last_report_time > 1:
                total_RPS = row_count / (current_time - start_time)
                print(f"Rate: {total_RPS:.1f} RPS")
                last_report_time = current_time
            
            loop_times.append(time.time() - loop_start)


except KeyboardInterrupt:
    print("Program interuppted by user")

except Exception as e:
    print(f"Unexpected error: {e}")
    import traceback
    traceback.print_exc()

finally:
     total_elapsed = time.time() - start_time
     if total_elapsed > 0 and row_count > 0:
         final_RPS = row_count / total_elapsed
         avg_adc = np.mean(adc_times)
         avg_questdb = np.mean(questdb_times)
         avg_loop = np.mean(loop_times)

         print(f"{'='*60}")
         print(f"{'Total Samples':<15} {row_count}")
         print(f"{'Total Time':<15} {total_elapsed:.0f} s")
         print(f"{'Total Rate:':<15} {final_RPS:.0f} RPS")
         print(f"{'='*60}")
         print(f"{'ADC overhead:':<15} {100*avg_adc/avg_loop:.0f}%")
         print(f"{'QuestDB overhead:':<15} {100*avg_questdb/avg_loop:.0f}%")
         print(f"{'My overhead:':<15} {100*(1-(avg_adc+avg_questdb)/avg_loop):.0f}%")
         print(f"{'='*60}")


