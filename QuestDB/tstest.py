from questdb.ingress import Sender
import time
from datetime import datetime

port = "http::addr=127.0.0.1:9000"

conf = f'{port};username=admin;password=quest;'

def query(sender, c1, c2, c3, p1, p2, p3, p4, p5, p6, weight, chamber, nozzle):
    total = c1 + c2 + c3
    sender.row (
            'telemetry_data',
            columns = 
            {
                'cell1_force': float(c1),
                'cell2_force': float(c2),
                'cell3_force': float(c3),
                'avg_force': float(total),
                'pressure_pt1': float(p1),
                'pressure_pt2': float(p2),
                'pressure_pt3': float(p3),
                'pressure_p4': float(p4),
                'pressure_pt5': float(p5),
                'pressure_pt6': float(p6),
                'weight_load_cell': float(weight),
                'chamber_temp': float(chamber),
                'nozzle_temp': float(nozzle)
            },
            at = datetime.now()
        )

    sender.flush()

    time.sleep(5)

c1 = 1
c2 = 2
c3 = 3
p1 = 1
p2 = 2
p3 = 3
p4 = 4
p5 = 5
p6 = 5
weight = 1
chamber = 1
nozzle = 1

with Sender.from_conf(conf) as sender:
    while True:
        query(sender, c1, c2, c3, p1, p2, p3, p4, p5, p6, weight, chamber, nozzle)

        c1 += 100
        c2 += 200
        c3 += 300
        p1 += 100
        p2 += 200
        p3 += 300
        p4 += 400
        p5 += 500
        p6 += 500
        weight += 100
        chamber += 100
        nozzle += 200