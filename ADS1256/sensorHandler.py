import ADS1256
import numpy as np
import yaml

configFileName = "config.yaml"
with open(configFileName, 'r') as file:
    config = yaml.safe_load(file)

# load ADCs
ENABLED_ADCS = []
ADC1_ENABLED = config["ADC1"]["enabled"]
ADC2_ENABLED = config["ADC2"]["enabled"]
    
if not (ADC1_ENABLED or ADC2_ENABLED):
    print("---No ADC Enabled---")
    exit()

elif ADC1_ENABLED:
    ENABLED_ADCS.append(1)
elif ADC2_ENABLED:
    ENABLED_ADCS.append(2)

# gets a list of sensors and their associated ADC and channel from the .yaml file
def getSensors(sensorType: str):
    sensors = []

    for adc in ENABLED_ADCS:
        # check each channel of the adc
        for channel in config[f"ADC{adc}"]["channels"]:
            attached_device = config[f"ADC{adc}"]["channels"][channel]
            
            if config["devices"][sensorType] == None:
                print(f"Error: Invalid Sensor Type: {sensorType} --> Check config file {configFileName}")
                exit()

            # filter out sensors of sensor type
            if attached_device in config["devices"][sensorType]:
                sensorInfo = {"name":attached_device, "adc":adc, "channel":channel}
                sensors.append(sensorInfo)
    return sensors


class LoadCells:

    def __init__(self):
        self.cells = getSensors("load_cells")
        self.tares = []
        self.scales = []

        # get calibration values for each load cell values
        print(f"Load Cells:")
        for cell in self.cells:
            print(f" + {cell["name"]}")

            # get tare of load cell
            if (tare := config["devices"]["load_cells"][cell["name"]]["tare"]) == None:
                    print(f"\tWarning: <{cell["name"]}> No Tare Specified (using defualt=0)")
                    tare = 0
            cell["tare"] = tare
            self.tares.append(tare)

            # get scale of load cell
            if (scale := config["devices"]["load_cells"][cell["name"]]["scale"]) == None:
                    print(f"\tWarning: <{cell["name"]}> No Scale Specified (using defualt=1)")
                    scale = 1
            cell["scale"] = scale
            self.scales.append(scale)

            print(f"\tADC: {cell["adc"]:<5}\tChannel: {cell["channel"]:<5}\tTare: {cell["tare"]:<5}\tScale: {cell["scale"]:<5}")


    def getAllLoadCellVoltages():
        pass

    def getAllLoadCellValues(calibrated=False):
        pass


class PressureTransducers:
     
    def __init__(self):
        self.transducers = getSensors("pressure_transducers")

    def getAllTransucerVoltages():
        pass
    