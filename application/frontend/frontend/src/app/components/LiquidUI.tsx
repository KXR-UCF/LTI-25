"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';

interface DataPoint {
  timestamp: number;
  cell1: number;
  cell2: number;
  cell3: number;
  total: number;
}

interface PressureDataPoint {
  timestamp: number;
  pressure: number;
}

interface ThermalCoupleDataPoint {
  timestamp: number;
  chamber: number;
  nozzle: number;
}

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

interface LatestData {
  cell1?: number;
  cell2?: number;
  cell3?: number;
  total?: number;
  peakNetForce?: number;
  weight?: number;
  pressure?: number;
  pt2?: number;
  pt3?: number;
  pt4?: number;
  pt5?: number;
  pt6?: number;
  chamber?: number;
  nozzle?: number;
  [key: string]: number | undefined;
}

interface LiquidUIProps {
  telemetryData: TelemetryRow[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
}

export default function LiquidUI({ telemetryData, connectionStatus }: LiquidUIProps) {
  const [graphData, setGraphData] = useState<DataPoint[]>([]);
  const [pressureData, setPressureData] = useState<PressureDataPoint[]>([]);
  const [thermalCoupleData, setThermalCoupleData] = useState<ThermalCoupleDataPoint[]>([]);
  const [additionalPTData, setAdditionalPTData] = useState<{pt2: number, pt3: number, pt4: number, pt5: number, pt6: number}>({pt2: 0, pt3: 0, pt4: 0, pt5: 0, pt6: 0});
  const [peakNetForce, setPeakNetForce] = useState<number>(0);
  const [weightLoadCell, setWeightLoadCell] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [completeGraphData, setCompleteGraphData] = useState<DataPoint[]>([]);
  const [completePressureData, setCompletePressureData] = useState<PressureDataPoint[]>([]);
  const [completeThermalData, setCompleteThermalData] = useState<ThermalCoupleDataPoint[]>([]);
  const [switchStates, setSwitchStates] = useState({
    switch1: false,
    switch2: false,
    switch3: false,
    switch4: false,
    switch5: false,
    switch6: false,
    launchKey: false,
    abort: false
  });

  // Add toggle handler for switches
  const toggleSwitch = (switchName: keyof typeof switchStates) => {
    setSwitchStates(prev => ({
      ...prev,
      [switchName]: !prev[switchName]
    }));
  };

  // Calculate latest data for each cell and pressure
  const latestData = useMemo<LatestData>(() => {
    const result: LatestData = {};
    if (graphData.length > 0) {
      const lastPoint = graphData[graphData.length - 1];
      result.cell1 = lastPoint.cell1;
      result.cell2 = lastPoint.cell2;
      result.cell3 = lastPoint.cell3;
      result.total = lastPoint.total;
    }
    if (pressureData.length > 0) {
      const lastPressurePoint = pressureData[pressureData.length - 1];
      result.pressure = lastPressurePoint.pressure;
    }
    if (thermalCoupleData.length > 0) {
      const lastThermalPoint = thermalCoupleData[thermalCoupleData.length - 1];
      result.chamber = lastThermalPoint.chamber;
      result.nozzle = lastThermalPoint.nozzle;
    }
    // Add additional PT data
    result.pt2 = additionalPTData.pt2;
    result.pt3 = additionalPTData.pt3;
    result.pt4 = additionalPTData.pt4;
    result.pt5 = additionalPTData.pt5;
    result.pt6 = additionalPTData.pt6;
    // Add peak net force
    result.peakNetForce = peakNetForce;
    // Add weight load cell
    result.weight = weightLoadCell;
    return result;
  }, [graphData, pressureData, thermalCoupleData, additionalPTData, peakNetForce, weightLoadCell]);

  // Calculate if launch is possible
  const canLaunch = useMemo(() => {
    return (
      switchStates.switch1 &&
      switchStates.switch2 &&
      switchStates.switch3 &&
      switchStates.switch4 &&
      switchStates.switch5 &&
      switchStates.switch6 &&
      switchStates.launchKey &&
      !switchStates.abort
    );
  }, [switchStates]);

  // Process unified telemetry data
  const processTelemetryData = (rows: TelemetryRow[]) => {
    const processedRows = rows.filter(row =>
      row.cell1_force !== null && row.cell2_force !== null && row.cell3_force !== null
    );

    if (processedRows.length === 0) return;

    const newLoadCellData: DataPoint[] = [];
    const newPressureData: PressureDataPoint[] = [];
    const newThermalData: ThermalCoupleDataPoint[] = [];

    // Set start time from first data point if not already set
    if (startTimeRef.current === null && processedRows.length > 0) {
      startTimeRef.current = new Date(processedRows[0].timestamp).getTime();
      setStartTime(startTimeRef.current);
    }

    processedRows.forEach(row => {
      // Calculate runtime in seconds from QuestDB timestamp
      const dataPointTime = new Date(row.timestamp).getTime();
      const runtimeSeconds = startTimeRef.current !== null
        ? (dataPointTime - startTimeRef.current) / 1000
        : 0;

      const loadCellPoint: DataPoint = {
        timestamp: runtimeSeconds,
        cell1: row.cell1_force || 0,
        cell2: row.cell2_force || 0,
        cell3: row.cell3_force || 0,
        total: row.net_force || 0
      };

      const pressurePoint: PressureDataPoint = {
        timestamp: runtimeSeconds,
        pressure: row.pressure_pt1 || 0
      };

      const thermalPoint: ThermalCoupleDataPoint = {
        timestamp: runtimeSeconds,
        chamber: row.chamber_temp || 0,
        nozzle: row.nozzle_temp || 0
      };

      newLoadCellData.push(loadCellPoint);
      newPressureData.push(pressurePoint);
      newThermalData.push(thermalPoint);

      // Update additional PT data from latest row
      if (row === processedRows[processedRows.length - 1]) {
        setAdditionalPTData({
          pt2: row.pressure_pt2 || 0,
          pt3: row.pressure_pt3 || 0,
          pt4: row.pressure_pt4 || 0,
          pt5: row.pressure_pt5 || 0,
          pt6: row.pressure_pt6 || 0
        });
        setWeightLoadCell(row.weight_load_cell || 0);
      }
    });

    // Update complete datasets
    setCompleteGraphData(prev => [...prev, ...newLoadCellData]);
    setCompletePressureData(prev => [...prev, ...newPressureData]);
    setCompleteThermalData(prev => [...prev, ...newThermalData]);

    // Update display datasets (last 30 points) - preserve original timestamps
    setGraphData(prev => {
      const combined = [...prev, ...newLoadCellData];
      if (combined.length > 30) {
        return combined.slice(-30);
      }
      return combined;
    });

    setPressureData(prev => {
      const combined = [...prev, ...newPressureData];
      if (combined.length > 30) {
        return combined.slice(-30);
      }
      return combined;
    });

    setThermalCoupleData(prev => {
      const combined = [...prev, ...newThermalData];
      if (combined.length > 30) {
        return combined.slice(-30);
      }
      return combined;
    });

    // Update peak values
    const maxNetForce = Math.max(...newLoadCellData.map(d => d.total));
    if (maxNetForce > peakNetForce) setPeakNetForce(maxNetForce);
  };

  // Chart export function - captures complete chart including legends using SVG method
  const exportCompleteChart = async (data: any[], filename: string, isLoadCell: boolean) => {
    try {
      if (data.length === 0) return;

      if (isLoadCell) {
        const originalData = graphData;
        setGraphData(completeGraphData);

        setTimeout(() => {
          const chartContainer = document.getElementById('load-cell-chart');
          if (!chartContainer) return;

          const svgElement = chartContainer.querySelector('svg');
          const legendElement = chartContainer.querySelector('.recharts-legend-wrapper');

          if (svgElement) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              canvas.width = 1200 * 2;
              canvas.height = 650 * 2;
              ctx.scale(2, 2);
              ctx.fillStyle = '#111827';
              ctx.fillRect(0, 0, 1200, 650);

              const svgData = new XMLSerializer().serializeToString(svgElement);
              const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
              const svgUrl = URL.createObjectURL(svgBlob);

              const img = document.createElement('img') as HTMLImageElement;
              img.onload = () => {
                ctx.drawImage(img, 0, 0, 1200, 600);

                // Add load cell legends manually
                if (legendElement) {
                  ctx.fillStyle = 'rgba(255,255,255,0.7)';
                  ctx.font = '12px Arial';
                  ctx.fillText('Load Cell 1', 50, 620);
                  ctx.fillStyle = '#10B981';
                  ctx.beginPath();
                  ctx.arc(40, 616, 4, 0, 2 * Math.PI);
                  ctx.fill();

                  ctx.fillStyle = 'rgba(255,255,255,0.7)';
                  ctx.fillText('Load Cell 2', 150, 620);
                  ctx.fillStyle = '#F59E0B';
                  ctx.beginPath();
                  ctx.arc(140, 616, 4, 0, 2 * Math.PI);
                  ctx.fill();

                  ctx.fillStyle = 'rgba(255,255,255,0.7)';
                  ctx.fillText('Load Cell 3', 250, 620);
                  ctx.fillStyle = '#EF4444';
                  ctx.beginPath();
                  ctx.arc(240, 616, 4, 0, 2 * Math.PI);
                  ctx.fill();

                  ctx.fillStyle = 'rgba(255,255,255,0.7)';
                  ctx.fillText('Net Force', 350, 620);
                  ctx.fillStyle = '#3B82F6';
                  ctx.beginPath();
                  ctx.arc(340, 616, 4, 0, 2 * Math.PI);
                  ctx.fill();
                }

                canvas.toBlob((blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${filename}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }
                });

                URL.revokeObjectURL(svgUrl);
                setGraphData(originalData);
              };
              img.src = svgUrl;
            }
          }
        }, 500);
      } else {
        const originalData = thermalCoupleData;
        setThermalCoupleData(completeThermalData);

        setTimeout(() => {
          const chartContainer = document.getElementById('thermal-chart');
          if (!chartContainer) return;

          const svgElement = chartContainer.querySelector('svg');
          const legendElement = chartContainer.querySelector('.recharts-legend-wrapper');

          if (svgElement) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              canvas.width = 1200 * 2;
              canvas.height = 650 * 2;
              ctx.scale(2, 2);
              ctx.fillStyle = '#111827';
              ctx.fillRect(0, 0, 1200, 650);

              const svgData = new XMLSerializer().serializeToString(svgElement);
              const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
              const svgUrl = URL.createObjectURL(svgBlob);

              const img = document.createElement('img') as HTMLImageElement;
              img.onload = () => {
                ctx.drawImage(img, 0, 0, 1200, 600);

                // Add thermal legends manually
                if (legendElement) {
                  ctx.fillStyle = 'rgba(255,255,255,0.7)';
                  ctx.font = '12px Arial';
                  ctx.fillText('Chamber Temperature', 50, 620);
                  ctx.fillStyle = '#F97316';
                  ctx.beginPath();
                  ctx.arc(40, 616, 4, 0, 2 * Math.PI);
                  ctx.fill();

                  ctx.fillStyle = 'rgba(255,255,255,0.7)';
                  ctx.fillText('Nozzle Temperature', 200, 620);
                  ctx.fillStyle = '#DC2626';
                  ctx.beginPath();
                  ctx.arc(190, 616, 4, 0, 2 * Math.PI);
                  ctx.fill();
                }

                canvas.toBlob((blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${filename}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }
                });

                URL.revokeObjectURL(svgUrl);
                setThermalCoupleData(originalData);
              };
              img.src = svgUrl;
            }
          }
        }, 500);
      }

    } catch (error) {
      console.error('Error exporting complete chart:', error);
    }
  };

  const exportLoadCellChart = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportCompleteChart(completeGraphData, `load-cell-complete-session-${timestamp}`, true);
  };

  const exportThermalChart = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportCompleteChart(completeThermalData, `thermal-complete-session-${timestamp}`, false);
  };

  // Reset state when component mounts
  useEffect(() => {
    setGraphData([]);
    setPressureData([]);
    setThermalCoupleData([]);
    setCompleteGraphData([]);
    setCompletePressureData([]);
    setCompleteThermalData([]);
    setPeakNetForce(0);
    setWeightLoadCell(0);
    setStartTime(null);
    startTimeRef.current = null;
    setAdditionalPTData({pt2: 0, pt3: 0, pt4: 0, pt5: 0, pt6: 0});
  }, []);

  // Process telemetry data when received from parent
  useEffect(() => {
    if (telemetryData.length > 0) {
      processTelemetryData(telemetryData);
    }
  }, [telemetryData]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-auto">
      <div className="p-2">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 min-h-screen">
          {/* Left Column - Graphs */}
          <div className="lg:col-span-3 grid grid-rows-2 gap-2">
            {/* Load Cell Graph */}
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex flex-col">
            <div className="p-4 flex-none">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-white/90 tracking-wider">LOAD CELL TELEMETRY</h2>
                <div className="flex gap-2">
                  <button
                    onClick={exportLoadCellChart}
                    disabled={completeGraphData.length === 0}
                    className="px-3 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Download Complete Load Cell Session as PNG"
                  >
                    DOWNLOAD
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 pt-0">
              <div id="load-cell-chart" className="relative h-full bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10">
                {graphData.length === 0 ? (
                  <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-white/60">No Data Detected</p>
                    <p className="text-xs text-white/40 mt-1">Waiting for telemetry data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorCell1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorCell2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorCell3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                        </linearGradient>
                        <filter id="glowTotal">
                          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="glowCell1">
                          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="glowCell2">
                          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="glowCell3">
                          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="timestamp"
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        allowDecimals={false}
                        interval={0}
                        ticks={graphData.length > 0 ? Array.from(
                          { length: Math.floor(graphData[graphData.length - 1].timestamp) - Math.floor(graphData[0].timestamp) + 1 },
                          (_, i) => Math.floor(graphData[0].timestamp) + i
                        ) : undefined}
                        tickFormatter={(value) => `${value}s`}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                        domain={[0, 800]}
                        ticks={[0, 100, 200, 300, 400, 500, 600, 700, 800]}
                        tickFormatter={(value) => `${value.toFixed(0)} LBS`}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '0.375rem',
                          color: 'white',
                          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(10px)'
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)} LBS`, '']}
                        labelFormatter={(label) => `Runtime: ${label}s`}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                      />
                      <Legend
                        wrapperStyle={{
                          paddingTop: '10px',
                          color: 'rgba(255,255,255,0.7)'
                        }}
                        formatter={(value) => (
                          <span className="text-xs font-medium tracking-wider">{value}</span>
                        )}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Line
                        type="linear"
                        dataKey="cell1"
                        name="Load Cell 1"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#10B981', stroke: 'white', strokeWidth: 2 }}
                        animationDuration={0}
                        connectNulls={true}
                        filter="url(#glowCell1)"
                      />
                      <Line
                        type="linear"
                        dataKey="cell2"
                        name="Load Cell 2"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#F59E0B', stroke: 'white', strokeWidth: 2 }}
                        animationDuration={0}
                        connectNulls={true}
                        filter="url(#glowCell2)"
                      />
                      <Line
                        type="linear"
                        dataKey="cell3"
                        name="Load Cell 3"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#EF4444', stroke: 'white', strokeWidth: 2 }}
                        animationDuration={0}
                        connectNulls={true}
                        filter="url(#glowCell3)"
                      />
                      <Line
                        type="linear"
                        dataKey="total"
                        name="Net Force"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#3B82F6', stroke: 'white', strokeWidth: 2 }}
                        animationDuration={0}
                        connectNulls={true}
                        filter="url(#glowTotal)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

            {/* Thermal Couple Graph */}
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex flex-col">
              <div className="p-4 flex-none">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold text-white/90 tracking-wider">THERMAL COUPLE TELEMETRY</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={exportThermalChart}
                      disabled={completeThermalData.length === 0}
                      className="px-3 py-1 text-xs bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Download Complete Thermal Session as PNG"
                    >
                      DOWNLOAD
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 pt-0">
                <div id="thermal-chart" className="relative h-full bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10">
                  {thermalCoupleData.length === 0 ? (
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-white/60">No Data Detected</p>
                      <p className="text-xs text-white/40 mt-1">Waiting for temperature data...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={thermalCoupleData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                        <defs>
                          <linearGradient id="colorChamber" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#F97316" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorNozzle" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#DC2626" stopOpacity={0.1}/>
                          </linearGradient>
                          <filter id="glowChamber">
                            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="glowNozzle">
                            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="timestamp"
                          stroke="rgba(255,255,255,0.3)"
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                          type="number"
                          domain={['dataMin', 'dataMax']}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          allowDecimals={false}
                          interval={0}
                          ticks={thermalCoupleData.length > 0 ? Array.from(
                            { length: Math.floor(thermalCoupleData[thermalCoupleData.length - 1].timestamp) - Math.floor(thermalCoupleData[0].timestamp) + 1 },
                            (_, i) => Math.floor(thermalCoupleData[0].timestamp) + i
                          ) : undefined}
                          tickFormatter={(value) => `${value}s`}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.3)"
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                          domain={[0, 800]}
                          interval={0}
                          ticks={[0, 100, 200, 300, 400, 500, 600, 700, 800]}
                          tickFormatter={(value) => `${value.toFixed(0)}°C`}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '0.375rem',
                            color: 'white',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(10px)'
                          }}
                          formatter={(value: number) => [`${value.toFixed(2)}°C`, '']}
                          labelFormatter={(label) => `Runtime: ${label}s`}
                          cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />
                        <Legend
                          wrapperStyle={{
                            paddingTop: '10px',
                            color: 'rgba(255,255,255,0.7)'
                          }}
                          formatter={(value) => (
                            <span className="text-xs font-medium tracking-wider">{value}</span>
                          )}
                          iconType="circle"
                          iconSize={8}
                        />
                        <Line
                          type="linear"
                          dataKey="chamber"
                          name="Chamber Temperature"
                          stroke="#F97316"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: '#F97316', stroke: 'white', strokeWidth: 2 }}
                          animationDuration={0}
                          connectNulls={true}
                          filter="url(#glowChamber)"
                        />
                        <Line
                          type="linear"
                          dataKey="nozzle"
                          name="Nozzle Temperature"
                          stroke="#DC2626"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: '#DC2626', stroke: 'white', strokeWidth: 2 }}
                          animationDuration={0}
                          connectNulls={true}
                          filter="url(#glowNozzle)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Telemetry and Controls */}
          <div className="flex flex-col gap-2 h-full">
            {/* Telemetry Readings */}
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex-shrink-0">
              <div className="p-3">
                <h2 className="text-lg font-bold text-white/90 tracking-wider mb-3">MEASUREMENTS</h2>
                <div className="grid grid-cols-4 gap-2 w-full">
                  {['total', 'peakNetForce', 'weight', 'pressure', 'pt2', 'pt3', 'pt4', 'pt5', 'pt6', 'chamber', 'nozzle'].map((sensor) => (
                    <div key={sensor} className="h-28 w-full bg-gradient-to-b from-gray-900/40 to-gray-900/20 rounded-lg border border-white/10 p-3 shadow-[0_0_10px_rgba(255,255,255,0.05)] flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-semibold text-white tracking-wide leading-tight">
                          {sensor === 'total' ? 'NET FORCE' :
                           sensor === 'peakNetForce' ? 'PEAK NET' :
                           sensor === 'weight' ? 'WEIGHT' :
                           sensor === 'pressure' ? 'PT1' :
                           sensor === 'pt2' ? 'PT2' :
                           sensor === 'pt3' ? 'PT3' :
                           sensor === 'pt4' ? 'PT4' :
                           sensor === 'pt5' ? 'PT5' :
                           sensor === 'pt6' ? 'PT6' :
                           sensor === 'chamber' ? 'CHAMBER' :
                           'NOZZLE'}
                        </p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          latestData[sensor] ? 'bg-green-500/20 shadow-[0_0_3px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_3px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            latestData[sensor] ? 'bg-green-500 shadow-[0_0_3px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_3px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="text-base font-bold text-white text-center mb-1">
                          {latestData[sensor] ?
                            `${latestData[sensor].toFixed(1)}` :
                            '--'}
                        </p>
                        <p className="text-xs text-white/80 text-center font-medium">
                          {sensor === 'pressure' || sensor === 'pt2' || sensor === 'pt3' || sensor === 'pt4' || sensor === 'pt5' || sensor === 'pt6' ? 'PSI' :
                           sensor === 'chamber' || sensor === 'nozzle' ? '°C' :
                           sensor === 'total' || sensor === 'peakNetForce' || sensor === 'weight' ? 'LBS' : 'LBS'}
                        </p>
                      </div>
                      <p className="text-xs text-white/60 text-center font-medium">
                        {latestData[sensor] ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Controls */}
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm h-full">
              <div className="p-4 h-full flex flex-col">
                <div className="flex-none">
                  <h2 className="text-lg font-bold text-white/90 tracking-wider mb-4">SYSTEM CONTROLS</h2>
                </div>
                <div className="flex-1 grid grid-cols-1 gap-4">
                  {/* System Switches */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Switch 1 */}
                    <div
                      onClick={() => toggleSwitch('switch1')}
                      className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                        switchStates.switch1
                          ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-white tracking-wider">NOX FILL</p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          switchStates.switch1 ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            switchStates.switch1 ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70">
                        {switchStates.switch1 ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>

                    {/* Switch 2 */}
                    <div
                      onClick={() => toggleSwitch('switch2')}
                      className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                        switchStates.switch2
                          ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-white tracking-wider">NOX VENT</p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          switchStates.switch2 ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            switchStates.switch2 ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70">
                        {switchStates.switch2 ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>

                    {/* Switch 3 */}
                    <div
                      onClick={() => toggleSwitch('switch3')}
                      className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                        switchStates.switch3
                          ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-white tracking-wider">NOX RELIEF</p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          switchStates.switch3 ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            switchStates.switch3 ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70">
                        {switchStates.switch3 ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>

                    {/* Switch 4 */}
                    <div
                      onClick={() => toggleSwitch('switch4')}
                      className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                        switchStates.switch4
                          ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-white tracking-wider">NITROGEN FILL</p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          switchStates.switch4 ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            switchStates.switch4 ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70">
                        {switchStates.switch4 ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>

                    {/* Switch 5 */}
                    <div
                      onClick={() => toggleSwitch('switch5')}
                      className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                        switchStates.switch5
                          ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-white tracking-wider">NITROGEN VENT</p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          switchStates.switch5 ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            switchStates.switch5 ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70">
                        {switchStates.switch5 ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>

                    {/* Switch 6 */}
                    <div
                      onClick={() => toggleSwitch('switch6')}
                      className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                        switchStates.switch6
                          ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-white tracking-wider">CONTINUITY TEST</p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          switchStates.switch6 ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            switchStates.switch6 ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70">
                        {switchStates.switch6 ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>
                  </div>

                  {/* Launch Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Launch Key */}
                    <div
                      onClick={() => toggleSwitch('launchKey')}
                      className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                        switchStates.launchKey
                          ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-white tracking-wider">LAUNCH KEY</p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          switchStates.launchKey ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            switchStates.launchKey ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70">
                        {switchStates.launchKey ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>

                    {/* Abort System */}
                    <div
                      onClick={() => toggleSwitch('abort')}
                      className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                        switchStates.abort
                          ? 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-white tracking-wider">ABORT SYSTEM</p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          switchStates.abort ? 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            switchStates.abort ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70">
                        {switchStates.abort ? 'ENGAGED' : 'STANDBY'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
