export interface DataPoint {
    timestamp: string;
    cell1: number;
    cell2: number;
    cell3: number;
    total: number;
}

export interface PressureDataPoint {
    timestamp: string;
    pressure: number;
}

export interface ThermalCoupleDataPoint {
    timestamp: string;
    chamber: number;
    nozzle: number;
}