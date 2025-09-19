export interface DataPoint {
  timestamp: number;
  cell1: number;
  cell2: number;
  cell3: number;
  total: number;
}

export interface PressureDataPoint {
  timestamp: number;
  pressure: number;
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
  [key: string]: number | undefined;
}