export interface DataPoint {
  timestamp: number | string;
  cell1: number;
  cell2: number;
  cell3: number;
  total: number;
}

export interface PressureDataPoint {
  timestamp: number | string;
  pressure: number;
}

export interface ThermalCoupleDataPoint {
  timestamp: number | string;
  chamber: number;
  nozzle: number;
}

export interface TelemetryRow {
  timestamp: string;
  cell1_force: number | null;
  cell2_force: number | null;
  cell3_force: number | null;
  net_force: number | null;
  pressure_pt1: number | null;
  pressure_pt2: number | null;
  pressure_pt3: number | null;
  pressure_pt4: number | null;
  pressure_pt5: number | null;
  pressure_pt6: number | null;
  weight_load_cell: number | null;
  chamber_temp: number | null;
  nozzle_temp: number | null;
}

export interface LatestData {
  cell1?: number;
  cell2?: number;
  cell3?: number;
  total?: number;
  pressure?: number;
  pt2?: number;
  pt3?: number;
  pt4?: number;
  pt5?: number;
  pt6?: number;
  chamber?: number;
  nozzle?: number;
  peakNetForce?: number;
  weight?: number;
  [key: string]: number | undefined;
}