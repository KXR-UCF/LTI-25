"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UPlotChart from "@/components/UPlotChart";
import uPlot from 'uplot';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';

interface TelemetryRow {
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

interface SolidUIProps {
  telemetryData: TelemetryRow[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
}

export default function SolidUI({ telemetryData, connectionStatus }: SolidUIProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Convert telemetry data to uPlot format for load cells
  const loadCellData = useMemo((): uPlot.AlignedData => {
    if (telemetryData.length === 0) {
      return [[], [], [], [], []];
    }

    const timestamps: number[] = [];
    const cell1: (number | null)[] = [];
    const cell2: (number | null)[] = [];
    const cell3: (number | null)[] = [];
    const netForce: (number | null)[] = [];

    const startTime = new Date(telemetryData[0].timestamp).getTime() / 1000;

    telemetryData.forEach(row => {
      const time = new Date(row.timestamp).getTime() / 1000;
      timestamps.push(time - startTime);
      cell1.push(row.cell1_force);
      cell2.push(row.cell2_force);
      cell3.push(row.cell3_force);
      netForce.push(row.net_force);
    });

    return [timestamps, cell1, cell2, cell3, netForce];
  }, [telemetryData]);

  // Convert telemetry data to uPlot format for pressure
  const pressureData = useMemo((): uPlot.AlignedData => {
    if (telemetryData.length === 0) {
      return [[], []];
    }

    const timestamps: number[] = [];
    const pressure: (number | null)[] = [];

    const startTime = new Date(telemetryData[0].timestamp).getTime() / 1000;

    telemetryData.forEach(row => {
      const time = new Date(row.timestamp).getTime() / 1000;
      timestamps.push(time - startTime);
      pressure.push(row.pressure_pt1);
    });

    return [timestamps, pressure];
  }, [telemetryData]);

  // Load cell chart options
  const loadCellOptions = useMemo((): uPlot.Options => ({
    width: 800,
    height: 400,
    class: 'load-cell-chart',
    scales: {
      x: {
        time: false,
      },
      y: {
        auto: false,
        range: [0, 1000],
      },
    },
    axes: [
      {
        label: 'Runtime (s)',
        stroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)',
        grid: { stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)', width: 1 },
      },
      {
        label: 'Force (N)',
        stroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)',
        grid: { stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)', width: 1 },
        values: (u, vals) => vals.map(v => v + ' N'),
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
  }), [isDark]);

  // Pressure chart options
  const pressureOptions = useMemo((): uPlot.Options => ({
    width: 800,
    height: 400,
    class: 'pressure-chart',
    scales: {
      x: {
        time: false,
      },
      y: {
        auto: false,
        range: [0, 2400],
      },
    },
    axes: [
      {
        label: 'Runtime (s)',
        stroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)',
        grid: { stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)', width: 1 },
      },
      {
        label: 'Pressure (PSI)',
        stroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)',
        grid: { stroke: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)', width: 1 },
        values: (u, vals) => vals.map(v => v + ' PSI'),
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
  }), [isDark]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Left Column - Charts */}
      <div className="lg:col-span-3 grid grid-rows-2 gap-4">
        {/* Load Cell Chart */}
        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-white/10 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-wider">
              LOAD CELL TELEMETRY
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/50"
            >
              DOWNLOAD
            </Button>
          </CardHeader>
          <CardContent className="h-[calc(100%-5rem)]">
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
              <UPlotChart data={loadCellData} options={loadCellOptions} />
            )}
          </CardContent>
        </Card>

        {/* Pressure Chart */}
        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-white/10 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-wider">
              PRESSURE TRANSDUCER TELEMETRY
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/50"
            >
              DOWNLOAD
            </Button>
          </CardHeader>
          <CardContent className="h-[calc(100%-5rem)]">
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
              <UPlotChart data={pressureData} options={pressureOptions} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Measurements and controls */}
      <div className="flex flex-col gap-4">
        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-white/10 shadow-lg flex-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-wider">
              MEASUREMENTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-white/60">Coming next...</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-white/10 shadow-lg flex-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-wider">
              SYSTEM CONTROLS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-white/60">Coming next...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
