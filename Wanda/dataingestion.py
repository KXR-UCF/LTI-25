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

# Target sampling rate for smooth 60 Hz frontend updates
SAMPLES_PER_SECOND = 60
SAMPLE_INTERVAL = 1.0 / SAMPLES_PER_SECOND  # ~16.67ms per sample

def get_cpu_temp():
        temp_output = subprocess.check_output(["vcgencmd", "measure_temp"]).decode()
        match = re.search(r"temp=(\d+\.?\d*)'C", temp_output)
        if match:
            return float(match.group(1))
        return None


hostname = socket.gethostname()

conf = (
    'tcp::addr=localhost:9009;'  # Changed from http to tcp
    'auto_flush=off;'  # Manual flush for better control at 60Hz
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

load_cells = []
for i in range(4):
     load_cells.append(adcmanager.LoadCell(f"lc{i+1}"))

pts = []
for i in range(8):
     pts.append(adcmanager.PressureTransducer(f"pt{i+1}"))

row_count = 0
start_time = 0
last_report_time = time.time()

adc_times = []
questdb_times = []
loop_times = []

try:
    with Sender.from_conf(conf) as sender:

        sender.row(table_name=hostname, at=datetime.now())
        sender.flush()

        print("Connected to QuestDB")
        print(f"Target: {SAMPLES_PER_SECOND} SPS | Interval: {SAMPLE_INTERVAL*1000:.2f}ms")
        start_time = time.time()
        next_sample_time = start_time
        print("Sending Data")

        while True:
            loop_start = time.time()

            # get sensor values
            adc_start = time.time()

            columns = {}
            for load_cell in load_cells:
                 columns[load_cell.name] = load_cell.get_force()
            for pt in pts:
                 columns[pt.name] = pt.get_pressure()

            if len(load_cells) > 0:
                 columns['lc_net_force'] = columns['lc1'] + columns['lc2'] + columns['lc3']

            adc_times.append(time.time() - adc_start)

            # send to questDB
            questdb_start = time.time()
            sender.row(
                table_name=hostname,
                columns=columns,
                at=TimestampNanos.now()
            )
            sender.flush()
            row_count += 1
            questdb_times.append(time.time() - questdb_start)

            # report every second
            current_time = time.time()
            if current_time - last_report_time >= 1.0:
                total_RPS = row_count / (current_time - start_time)
                print(f"Rate: {total_RPS:.1f} SPS")
                last_report_time = current_time

            loop_times.append(time.time() - loop_start)

            # 60Hz timing control
            next_sample_time += SAMPLE_INTERVAL
            sleep_time = next_sample_time - time.time()

            if sleep_time > 0:
                time.sleep(sleep_time)
            elif sleep_time < -SAMPLE_INTERVAL:
                # falling behind, resync
                print(f"Warning: Behind by {-sleep_time*1000:.1f}ms")
                next_sample_time = time.time()


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


