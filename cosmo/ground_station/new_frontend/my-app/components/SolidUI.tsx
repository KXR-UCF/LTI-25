"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UPlotChart from "@/components/UPlotChart";
import uPlot from 'uplot';
import { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';

interface TelemetryRow {
  timestamp: string;
  cell1_force: number | null;
  cell2_force: number | null;
  cell3_force: number | null;
  net_force: number | null;
  pressure_pt1: number | null;
}

interface SolidUIProps {
  telemetryData: TelemetryRow[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  startTime: number | null;
  switchStates: {
    continuity: boolean;
    launchKey: boolean;
    abort: boolean;
  };
  recordingState: 'idle' | 'recording' | 'stopped';
}

export default function SolidUI({ telemetryData, connectionStatus, startTime, switchStates, recordingState }: SolidUIProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Peak value tracking
  const [peakNetForce, setPeakNetForce] = useState(0);
  const [peakPressure, setPeakPressure] = useState(0);

  // Convert telemetry data to uPlot format for load cells
  const loadCellData = useMemo((): uPlot.AlignedData => {
    if (telemetryData.length === 0 || startTime === null) {
      return [[], [], [], [], []];
    }

    const timestamps: number[] = [];
    const cell1: (number | null)[] = [];
    const cell2: (number | null)[] = [];
    const cell3: (number | null)[] = [];
    const netForce: (number | null)[] = [];

    telemetryData.forEach(row => {
      const time = new Date(row.timestamp).getTime() / 1000;

      // If recording or stopped, only show data from START onward
      if (recordingState !== 'idle' && time < startTime) {
        return; // Skip this data point
      }

      timestamps.push(time - startTime);
      cell1.push(row.cell1_force);
      cell2.push(row.cell2_force);
      cell3.push(row.cell3_force);
      netForce.push(row.net_force);
    });

    return [timestamps, cell1, cell2, cell3, netForce];
  }, [telemetryData, startTime, recordingState]);

  // Convert telemetry data to uPlot format for pressure
  const pressureData = useMemo((): uPlot.AlignedData => {
    if (telemetryData.length === 0 || startTime === null) {
      return [[], []];
    }

    const timestamps: number[] = [];
    const pressure: (number | null)[] = [];

    telemetryData.forEach(row => {
      const time = new Date(row.timestamp).getTime() / 1000;

      // If recording or stopped, only show data from START onward
      if (recordingState !== 'idle' && time < startTime) {
        return; // Skip this data point
      }

      timestamps.push(time - startTime);
      pressure.push(row.pressure_pt1);
    });

    return [timestamps, pressure];
  }, [telemetryData, startTime, recordingState]);

  // Calculate latest data and update peaks incrementally
  const latestData = useMemo(() => {
    if (telemetryData.length === 0) {
      return {
        total: 0,
        peakNetForce: 0,
        pressure: 0,
        peakPressure: 0
      };
    }

    const latest = telemetryData[telemetryData.length - 1];
    const currentNetForce = latest.net_force || 0;
    const currentPressure = latest.pressure_pt1 || 0;

    // Update peaks if we found a new maximum
    if (currentNetForce > peakNetForce) {
      setPeakNetForce(currentNetForce);
    }
    if (currentPressure > peakPressure) {
      setPeakPressure(currentPressure);
    }

    return {
      total: currentNetForce,
      peakNetForce,
      pressure: currentPressure,
      peakPressure
    };
  }, [telemetryData, peakNetForce, peakPressure]);

  // Load cell chart options
  const loadCellOptions = useMemo((): uPlot.Options => {
    return {
      width: 1000,
      height: 400,
      class: 'load-cell-chart',
      cursor: {
        drag: {
          x: true,
          y: true,
          uni: 50,
        },
      },
      scales: {
        x: recordingState === 'stopped'
          ? {
              time: false,
              // No range function - allows free panning/zooming
            }
          : {
              time: false,
              range: (u, min, max) => {
                // 30-second sliding window for idle and recording
                if (max <= 30) {
                  return [0, 30];
                } else {
                  return [max - 30, max];
                }
              },
            },
        y: {
          range: [0, 5000],
        },
      },
    axes: [
      {
        label: 'Runtime (s)',
        stroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)',
        grid: { stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)', width: 1 },
        splits: (u) => {
          const min = Math.floor(u.scales.x.min || 0);
          const max = Math.ceil(u.scales.x.max || 30);

          // Always use 1-second intervals
          const splits = [];
          for (let i = min; i <= max; i += 1) {
            splits.push(i);
          }
          return splits;
        },
      },
      {
        label: 'Force (N)',
        stroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)',
        grid: { stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)', width: 1 },
        values: (u, vals) => vals.map(v => v + ' N'),
        labelGap: 10,
      },
    ],
    series: [
      { label: 'Time' },
      {
        label: 'Load Cell 1',
        stroke: '#10B981',
        width: 2,
      },
      {
        label: 'Load Cell 2',
        stroke: '#F59E0B',
        width: 2,
      },
      {
        label: 'Load Cell 3',
        stroke: '#EF4444',
        width: 2,
      },
      {
        label: 'Net Force',
        stroke: '#3B82F6',
        width: 2,
      },
    ],
      legend: {
        show: true,
      },
    };
  }, [isDark, recordingState]);

  // Pressure chart options
  const pressureOptions = useMemo((): uPlot.Options => {
    return {
      width: 1000,
      height: 400,
      class: 'pressure-chart',
      cursor: {
        drag: {
          x: true,
          y: true,
          uni: 50,
        },
      },
      scales: {
        x: recordingState === 'stopped'
          ? {
              time: false,
              // No range function - allows free panning/zooming
            }
          : {
              time: false,
              range: (u, min, max) => {
                // 30-second sliding window for idle and recording
                if (max <= 30) {
                  return [0, 30];
                } else {
                  return [max - 30, max];
                }
              },
            },
        y: {
          range: [0, 1000],
        },
      },
    axes: [
      {
        label: 'Runtime (s)',
        stroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)',
        grid: { stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)', width: 1 },
        splits: (u) => {
          const min = Math.floor(u.scales.x.min || 0);
          const max = Math.ceil(u.scales.x.max || 30);

          // Always use 1-second intervals
          const splits = [];
          for (let i = min; i <= max; i += 1) {
            splits.push(i);
          }
          return splits;
        },
      },
      {
        label: 'Pressure (PSI)',
        stroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)',
        grid: { stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)', width: 1 },
        values: (u, vals) => vals.map(v => v + ' PSI'),
        labelGap: 10,
      },
    ],
    series: [
      { label: 'Time' },
      {
        label: 'Pressure Transducer',
        stroke: '#8B5CF6',
        width: 2,
      },
    ],
      legend: {
        show: true,
      },
    };
  }, [isDark, recordingState]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column - Charts */}
        <div className="lg:col-span-3 grid grid-rows-2 gap-4">
        {/* Load Cell Chart */}
        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-wider">
              LOAD CELL TELEMETRY
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px] 2xl:h-[550px]">
            {telemetryData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-white/60">No Data Detected</p>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Waiting for telemetry data...</p>
              </div>
            ) : (
              <UPlotChart
                data={loadCellData}
                options={loadCellOptions}
              />
            )}
          </CardContent>
        </Card>

        {/* Pressure Chart */}
        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-wider">
              PRESSURE TRANSDUCER TELEMETRY
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px] 2xl:h-[550px]">
            {telemetryData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-white/60">No Data Detected</p>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Waiting for pressure data...</p>
              </div>
            ) : (
              <UPlotChart
                data={pressureData}
                options={pressureOptions}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Measurements and controls */}
      <div className="flex flex-col gap-4">
        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-white/10 shadow-lg flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold tracking-wider">
              MEASUREMENTS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 h-full flex flex-col">
            {/* Force Sensors */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50 mb-2 uppercase tracking-wider">Force</p>
              <div className="grid grid-cols-2 gap-3 h-[calc(100%-1.75rem)]">
                {['total', 'peakNetForce'].map((sensor) => (
                  <div key={sensor} className="bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-white/10 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white tracking-wide leading-tight">
                        {sensor === 'total' ? 'NET' : 'PEAK'}
                      </p>
                      <div className={`w-2 h-2 rounded-full ${
                        latestData[sensor as keyof typeof latestData] > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {latestData[sensor as keyof typeof latestData].toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-white/70 font-medium">N</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pressure Sensors */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50 mb-2 uppercase tracking-wider">Pressure</p>
              <div className="grid grid-cols-2 gap-3 h-[calc(100%-1.75rem)]">
                {['pressure', 'peakPressure'].map((sensor) => (
                  <div key={sensor} className="bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-white/10 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white tracking-wide leading-tight">
                        {sensor === 'pressure' ? 'CURRENT' : 'PEAK'}
                      </p>
                      <div className={`w-2 h-2 rounded-full ${
                        latestData[sensor as keyof typeof latestData] > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {latestData[sensor as keyof typeof latestData].toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-white/70 font-medium">PSI</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-white/10 shadow-lg flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold tracking-wider">
              SYSTEM CONTROLS
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 flex-1">
              <div
                className={`flex flex-col p-4 rounded-lg border transition-all duration-300 justify-center items-center space-y-3 ${
                  switchStates.continuity
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500/50'
                    : 'bg-red-100 dark:bg-red-900/30 border-red-500/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">CONTINUITY</p>
                  <div className={`w-3 h-3 rounded-full ${
                    switchStates.continuity ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-white/70 font-medium">
                  {switchStates.continuity ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
              <div
                className={`flex flex-col p-4 rounded-lg border transition-all duration-300 justify-center items-center space-y-3 ${
                  switchStates.launchKey
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500/50'
                    : 'bg-red-100 dark:bg-red-900/30 border-red-500/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">LAUNCH KEY</p>
                  <div className={`w-3 h-3 rounded-full ${
                    switchStates.launchKey ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-white/70 font-medium">
                  {switchStates.launchKey ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
            </div>
            <div
              className={`flex flex-col p-4 rounded-lg border transition-all duration-300 justify-center items-center space-y-3 flex-1 ${
                switchStates.abort
                  ? 'bg-red-100 dark:bg-red-900/30 border-red-500/50 animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-gray-900 dark:text-white">ABORT SYSTEM</p>
                <div className={`w-3 h-3 rounded-full ${
                  switchStates.abort ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-white/70 font-medium">
                {switchStates.abort ? 'ENGAGED' : 'STANDBY'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
