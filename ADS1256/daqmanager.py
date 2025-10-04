#!/usr/bin/env python3
# Styling: PEP 8

"""KXR file for handling sensors/transducers connected to the KXR ADS1256 Pi hat"""

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


class AdcManager:
    """Manages sensors between multiple ADCs"""

    def __init__(self):
        """Sets pins of enabled ADCs and makes objects of them with the ADS1256 module"""

        self._ADCs = []
        for adc in ENABLED_ADCS:
            rst_pin = config[f"ADC{adc}"]["RST_PIN"]
            cs_pin = config[f"ADC{adc}"]["CS_PIN"]
            drdy_pin = config[f"ADC{adc}"]["DRDY_PIN"]

            gain = config[f"ADC{adc}"]["gain"]
            data_rate = config[f"ADC{adc}"]["data_rate"]

            new_ADC = ADS1256.ADS1256(rst_pin, cs_pin, drdy_pin)
            new_ADC.init()
            new_ADC.configADC(ADS1256.GAIN_E[gain], ADS1256.DRATE_E[data_rate])
            self._ADCs.append(new_ADC)

            print(f"ADC{adc} Initialized")

    def get_sensors(sensor_type: str):
        """Get a list of a specific sensor type

        Gets a list of sensors and their associated ADC and channel from the .yaml config file.
        
        Args:
            sensor_type (str): The name of the sensor type used in the .yaml config file
        
        Returns:
            list: A list of sensors (each type dict) with DAQ information
        """

        sensors = []
        # check for sensors on each enabled ADC
        for adc in ENABLED_ADCS:
            # check each channel of the adc
            for channel in config[f"ADC{adc}"]["channels"]:
                attached_device = config[f"ADC{adc}"]["channels"][channel]
                
                # check that the sensor type exists in the config file device type list
                if config["devices"][sensor_type] is None:
                    print(f"Error: Invalid Sensor Type: {sensor_type} --> Check config file {CONFIG_FILE_NAME}")
                    exit()

                # filter for sensors of sensor type and create a list of them
                if attached_device in config["devices"][sensor_type]:
                    sensor_info = {"name":attached_device, "adc":adc, "channel":channel}
                    sensors.append(sensor_info)
        return sensors

    def get_voltage(self, sensor):
        """Gets the voltages of a sensor
        
        This function recieves a sensor (a dict in the same form as returned in the list from get_sensors())
        then returns a voltage from that sensor
        
        Args:
            sensor (dict): A dict containing the sensor name, associated ADC/DAQ and the channel of that ADC

        Returns:
            sensor_voltage (float): the voltage (0-5) returned from the sensor
        """
        adc = self._ADCs[sensor["adc"]-1]
        channel = sensor["channel"]
        
        sensor_voltage = adc.getChannelValue(channel) * 5.0 / 0x7fffff  # converts the digital value to volts
        return sensor_voltage

# TODO: ensure tares and scales are applied to the right load cell by using it's name rather than array index
#       this is to allow a case where we may only want to pull the data from only some of the load cells at 
#       some instance 
#       (Note: this would only be needed for a function that pulls data from a specified set of load cells rather than all of them)
class LoadCells:
    """Uses the AdcManager to manage all the attached load cells"""

    def __init__(self, adc_manager: AdcManager):
        """Gets the calibration data for each load cell
        
        Gets a list of load cells from the AdcManager and gets the calibration data
        for each load cell. The calibration data is stored in lists with the index
        of data point matching the index of that load cell in the list of load cells
        
        Args:
            adc_manager (AdcManager): An initialized instance of the AdcManager
        """
        self.adc_manager = adc_manager
        self.load_cells = AdcManager.get_sensors("load_cells")
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

            print(f"\tADC: {load_cell['adc']:<5}\
                    \tChannel: {load_cell['channel']:<5}\
                    \tTare: {load_cell['tare']:<5}\
                    \tScale: {load_cell['scale']:<5}")

    def get_all_voltages(self):
        """Gets the voltages of each load cell
        
        Returns:
            voltages (list): A list of the voltages in order of the load cells
        """
        voltages = []
        for load_cell in self.load_cells:
            cell_voltage = self.adc_manager.get_voltage(load_cell)
            voltages.append(cell_voltage)
        return voltages

    def get_all_forces(self):
        """Gets all the forces on each load cell
        
        Returns:
            forces (ndarray): A list of the forces in order of the load cells
        """
        voltages = np.array(self.get_all_voltages())
        tares = np.array(self.tares)
        scales = np.array(self.scales)

        forces = (voltages + tares) * scales   # might convert this to a list of floats
        return forces

    def calibrate_tares(self): # WIP
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


class PressureTransducers: # WIP
     
    def __init__(self, adc_manager: AdcManager):
        self.adc_manager = adc_manager
        self.transducers = AdcManager.get_sensors("pressure_transducers")

    def get_all_transucer_voltages():
        pass