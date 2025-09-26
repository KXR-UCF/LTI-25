# KXR file for handling sensors connected to the ADC Pi hat
# Styling: PEP 8

import ADS1256
import numpy as np
import yaml

CONFIG_FILE_NAME = "config.yaml"
with open(CONFIG_FILE_NAME, 'r') as file:
    config = yaml.safe_load(file)

# load ADCs
ENABLED_ADCS = []
ADC1_ENABLED = config["ADC1"]["enabled"]
ADC2_ENABLED = config["ADC2"]["enabled"]
    
if not (ADC1_ENABLED or ADC2_ENABLED):
    print("---No ADC Enabled---")
    exit()

if ADC1_ENABLED:
    ENABLED_ADCS.append(1)
if ADC2_ENABLED:
    ENABLED_ADCS.append(2)


class AdcHandler:

    def __init__(self):
        self.ADCs = []
        for adc in ENABLED_ADCS:
            rst_pin = config[f"ADC{adc}"]["RST_PIN"]
            cs_pin = config[f"ADC{adc}"]["CS_PIN"]
            drdy_pin = config[f"ADC{adc}"]["DRDY_PIN"]

            gain = config[f"ADC{adc}"]["gain"]
            data_rate = config[f"ADC{adc}"]["data_rate"]

            new_ADC = ADS1256.ADS1256(rst_pin, cs_pin, drdy_pin)
            new_ADC.init()
            new_ADC.configADC(ADS1256.GAIN_E[gain], ADS1256.DRATE_E[data_rate])
            self.ADCs.append(new_ADC)

            print(f"ADC{adc} Initialized")


    # gets a list of sensors and their associated ADC and channel from the .yaml file
    def get_sensors(sensor_type: str):
        sensors = []

        for adc in ENABLED_ADCS:
            # check each channel of the adc
            for channel in config[f"ADC{adc}"]["channels"]:
                attached_device = config[f"ADC{adc}"]["channels"][channel]
                
                # check that the sensor class is in the config file
                if config["devices"][sensor_type] is None:
                    print(f"Error: Invalid Sensor Type: {sensor_type} --> Check config file {CONFIG_FILE_NAME}")
                    exit()

                # filter out sensors of sensor type
                if attached_device in config["devices"][sensor_type]:
                    sensor_info = {"name":attached_device, "adc":adc, "channel":channel}
                    sensors.append(sensor_info)
        return sensors
    

    def get_voltages(self, sensors):
        voltages = []
        for sensor in sensors:
            adc = self.ADCs[sensor["adc"]-1]
            sensor_voltage = adc.getChannelValue(sensor["channel"]) * 5.0 / 0x7fffff
            voltages.append(sensor_voltage)
        return voltages


class LoadCellHandler:

    def __init__(self, adc_handler: AdcHandler):
        self.adc_handler = adc_handler
        self.load_cells = AdcHandler.get_sensors("load_cells")
        self.tares = []
        self.scales = []

        # get calibration values for each load cell values
        print(f"Load Cells:")
        for load_cell in self.load_cells:
            print(f" + {load_cell['name']}")

            # get tare of load cell
            if (tare := config["devices"]["load_cells"][load_cell["name"]]["tare"]) is None:
                    print(f"\tWarning: <{load_cell['name']}> No Tare Specified (using defualt=0)")
                    tare = 0
            load_cell["tare"] = tare
            self.tares.append(tare)

            # get scale of load cell
            if (scale := config["devices"]["load_cells"][load_cell["name"]]["scale"]) is None:
                    print(f"\tWarning: <{load_cell['name']}> No Scale Specified (using defualt=1)")
                    scale = 1
            load_cell["scale"] = scale
            self.scales.append(scale)

            print(f"\tADC: {load_cell['adc']:<5}\tChannel: {load_cell['channel']:<5}\tTare: {load_cell['tare']:<5}\tScale: {load_cell['scale']:<5}")


    def get_all_voltages(self):
        voltages = self.adc_handler.get_voltages(self.load_cells)
        return voltages


    def get_all_values(self):
        voltages = np.array(self.get_all_voltages())
        tares = np.array(self.tares)
        scales = np.array(self.scales)

        values = (voltages + tares) * scales   
        return values


    def calibrate_tares(self):
        calibration_trials = 100
        trial_vals = np.array([])

        print(f"Calibrating Tares")
        for i in range(calibration_trials):
            trial = np.array(self.get_all_voltages())

            if len(trial_vals) == 0:
                trial_vals = trial.reshape(1,-1)
            else:
                np.append(trial_vals, trial.reshape(1, -2), axis=0)

        self.tares = np.mean(trial_vals, axis=0).flatten() * -1

        with open(CONFIG_FILE_NAME, 'w') as file:
            for i, load_cell in enumerate(self.load_cells):
                name = load_cell["name"]
                config["devices"]["load_cells"][name]["tare"] = float(self.tares[i])
            yaml.safe_dump(config, file, default_flow_style=False, sort_keys=False)
        print(f"Tares Calibrated")


class PressureTransducers:
     
    def __init__(self, adc_handler: AdcHandler):
        self.adc_handler = adc_handler
        self.transducers = AdcHandler.get_sensors("pressure_transducers")

    def get_all_transucer_voltages():
        pass
#
# adc_handler = AdcHandler()
# load_cell_object = LoadCells(adc_handler)
# load_cell_object.calibrate_tares()
