import { DashboardConfig, SensorConfig, SwitchConfig } from '../types/config';

// ========== UNIFIED SENSOR CONFIGURATION ==========
// All available sensors - filtered dynamically by view

export const ALL_SENSORS: SensorConfig[] = [
  // PRESSURE SENSORS (8 total)
  { id: 'PT-01', label: 'N2 Inlet', unit: 'psi', color: '#06b6d4', group: 'pressure', domain: [0, 2000], showStats: true },
  { id: 'PT-02', label: 'Nox Inlet', unit: 'psi', color: '#06b6d4', group: 'pressure', domain: [0, 1500], showStats: true },
  { id: 'PT-03', label: 'Dome Reg', unit: 'psi', color: '#06b6d4', group: 'pressure', domain: [0, 1000], showStats: true },
  { id: 'PT-04', label: 'N2 Tank', unit: 'psi', color: '#06b6d4', group: 'pressure', domain: [0, 3500], showStats: true },
  { id: 'PT-05', label: 'Fuel Tank', unit: 'psi', color: '#06b6d4', group: 'pressure', domain: [0, 1000], showStats: true },
  { id: 'PT-06', label: 'Chamber A', unit: 'psi', color: '#06b6d4', group: 'pressure', domain: [0, 1000], showStats: true },
  { id: 'PT-07', label: 'Chamber B', unit: 'psi', color: '#06b6d4', group: 'pressure', domain: [0, 1000], showStats: true },
  { id: 'PT-08', label: 'Fuel Feed', unit: 'psi', color: '#06b6d4', group: 'pressure', domain: [0, 1000], showStats: true },

  // LOAD CELLS / THRUST (5 total)
  { id: 'LC-Net', label: 'NET FORCE', unit: 'lbs', color: '#ef4444', group: 'thrust', domain: [0, 5000], showStats: true },
  { id: 'LC-2', label: 'Thrust 1', unit: 'lbs', color: '#b91c1c', group: 'thrust', domain: [0, 2000], showStats: true },
  { id: 'LC-3', label: 'Thrust 2', unit: 'lbs', color: '#b91c1c', group: 'thrust', domain: [0, 2000], showStats: true },
  { id: 'LC-4', label: 'Thrust 3', unit: 'lbs', color: '#b91c1c', group: 'thrust', domain: [0, 2000], showStats: true },
  { id: 'LC-1', label: 'Nox Tank Wt', unit: 'lbs', color: '#f97316', group: 'thrust', domain: [0, 200], showStats: true },

  // TEMPERATURE SENSORS (2 total)
  { id: 'TC-2', label: 'Chamber', unit: '°C', color: '#a855f7', group: 'temp', domain: [0, 1000], showStats: true },
  { id: 'TC-1', label: 'Nox Feed', unit: '°C', color: '#a855f7', group: 'temp', domain: [-50, 50], showStats: true },
];

// All available switches - matches backend SwitchState interface
// Order: N2O group, Nitrogen group, Safety, then unused
const ALL_SWITCHES: SwitchConfig[] = [
  // Safety & Control (shown first)
  { id: 'continuity', label: 'CONTINUITY', group: 'safety', type: 'safety' },
  { id: 'launchKey', label: 'LAUNCH KEY', group: 'safety', type: 'safety' },
  { id: 'abort', label: 'ABORT', group: 'safety', type: 'safety' },

  // N2O System
  { id: 'switch1', label: 'N2O FILL', group: 'nox', type: 'valve' },
  { id: 'switch2', label: 'N2O VENT', group: 'nox', type: 'valve' },
  { id: 'switch3', label: 'N2O RELIEF', group: 'nox', type: 'valve' },

  // Nitrogen System
  { id: 'switch6', label: 'N2 FILL', group: 'n2', type: 'valve' },
  { id: 'switch7', label: 'N2 VENT', group: 'n2', type: 'valve' },
  { id: 'switch8', label: 'N2 RELIEF', group: 'n2', type: 'valve' },

  // Unused (hidden in UI)
  { id: 'switch4', label: 'UNUSED 4', group: 'unused', type: 'valve' },
  { id: 'switch5', label: 'UNUSED 5', group: 'unused', type: 'valve' },
  { id: 'switch9', label: 'UNUSED 9', group: 'unused', type: 'valve' },
  { id: 'switch10', label: 'UNUSED 10', group: 'unused', type: 'valve' },
];

// Default dashboard config with all sensors
export const DASHBOARD_CONFIG: DashboardConfig = {
  sensors: ALL_SENSORS,
  switches: ALL_SWITCHES,
};