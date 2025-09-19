# ADS1256 Library

This library is a modified version of the library from [this repo for Waveshare boards](https://github.com/waveshareteam/High-Precision-AD-DA-Board/tree/master/RaspberryPI/ADS1256/python3).


The primary change is the scan mode now being a variable of the ADS1256 class rather than a global variable of the library. This allows the `setmode()` function to change the mode from single channel (mode 0) to differential (mode 1). The default mode is now set to differential (mode 1) which has 4 channels per hat.

Additionally, spelling mistakes and general naming conventions are fixed.

## How to Use

Declare the ADS and initialize it with the `init()` function. All 4 ADC reading can be retrieved as a list from the `getAll()` function. To get the associated voltage from those values multiply each one by `5.0 / 0x7fffff`. This can be easily done using numpy.

To change the data rate or gain use the `configADC(gain, dataRate)` function. Acceptable parameters can be found at the top of [ADS1256.py](/ADS1256.py).

## Useful Resources

[KXR ADS1256 Pi-hat Repo](https://github.com/KXR-UCF/ADS1256-Pi-Hat/)