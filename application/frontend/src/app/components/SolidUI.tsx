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
  pressure?: number;
  [key: string]: number | undefined;
}

interface SolidUIProps {
  telemetryData: TelemetryRow[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
}

export default function SolidUI({ telemetryData, connectionStatus }: SolidUIProps) {
  const [graphData, setGraphData] = useState<DataPoint[]>([]);
  const [pressureData, setPressureData] = useState<PressureDataPoint[]>([]);
  const [switchStates, setSwitchStates] = useState({
    continuity: false,
    launchKey: false,
    abort: false
  });

  const [peakNetForce, setPeakNetForce] = useState(0);
  const [peakPressure, setPeakPressure] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

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
    return result;
  }, [graphData, pressureData]);

  // Calculate if launch is possible
  const canLaunch = useMemo(() => {
    return (
      switchStates.continuity &&
      switchStates.launchKey &&
      !switchStates.abort
    );
  }, [switchStates]);

  // Handle launch button click
  const handleLaunch = () => {
    if (canLaunch) {
      console.log('Launch sequence initiated');
    }
  };

  // Store complete datasets for export
  const [completeGraphData, setCompleteGraphData] = useState<DataPoint[]>([]);
  const [completePressureData, setCompletePressureData] = useState<PressureDataPoint[]>([]);

  // Process unified telemetry data
  const processTelemetryData = (rows: TelemetryRow[]) => {
    const processedRows = rows.filter(row =>
      row.cell1_force !== null && row.cell2_force !== null && row.cell3_force !== null
    );

    if (processedRows.length === 0) return;

    const newLoadCellData: DataPoint[] = [];
    const newPressureData: PressureDataPoint[] = [];

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

      newLoadCellData.push(loadCellPoint);
      newPressureData.push(pressurePoint);
    });

    // Update complete datasets (replace with full dataset from backend)
    setCompleteGraphData(newLoadCellData);
    setCompletePressureData(newPressureData);

    // Update display datasets (last 30 points) - preserve original timestamps
    if (newLoadCellData.length > 30) {
      setGraphData(newLoadCellData.slice(-30));
    } else {
      setGraphData(newLoadCellData);
    }

    if (newPressureData.length > 30) {
      setPressureData(newPressureData.slice(-30));
    } else {
      setPressureData(newPressureData);
    }

    // Update peak values
    const maxNetForce = Math.max(...newLoadCellData.map(d => d.total));
    const maxPressure = Math.max(...newPressureData.map(d => d.pressure));

    if (maxNetForce > peakNetForce) setPeakNetForce(maxNetForce);
    if (maxPressure > peakPressure) setPeakPressure(maxPressure);
  };

  // Chart export function - captures complete chart including legends using SVG method
  const exportCompleteChart = async (data: any[], filename: string, isLoadCell: boolean) => {
    try {
      if (data.length === 0) return;

      // Store original data and update with complete data
      if (isLoadCell) {
        const originalData = graphData;
        setGraphData(completeGraphData);

        setTimeout(() => {
          const chartContainer = document.getElementById('load-cell-chart');
          if (!chartContainer) return;

          // Get both the SVG and the legend
          const svgElement = chartContainer.querySelector('svg');
          const legendElement = chartContainer.querySelector('.recharts-legend-wrapper');

          if (svgElement) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              canvas.width = 1200 * 2;
              canvas.height = 650 * 2; // Increased height for legend
              ctx.scale(2, 2);
              ctx.fillStyle = '#111827';
              ctx.fillRect(0, 0, 1200, 650);

              // First draw the main chart SVG
              const svgData = new XMLSerializer().serializeToString(svgElement);
              const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
              const svgUrl = URL.createObjectURL(svgBlob);

              const img = document.createElement('img') as HTMLImageElement;
              img.onload = () => {
                ctx.drawImage(img, 0, 0, 1200, 600);

                // Add legend text manually
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
        const originalData = pressureData;
        setPressureData(completePressureData);

        setTimeout(() => {
          const chartContainer = document.getElementById('pressure-chart');
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

                // Add pressure legend manually
                if (legendElement) {
                  ctx.fillStyle = 'rgba(255,255,255,0.7)';
                  ctx.font = '12px Arial';
                  ctx.fillText('Pressure Transducer', 50, 620);
                  ctx.fillStyle = '#8B5CF6';
                  ctx.beginPath();
                  ctx.arc(40, 616, 4, 0, 2 * Math.PI);
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
                setPressureData(originalData);
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

  const exportPressureChart = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportCompleteChart(completePressureData, `pressure-complete-session-${timestamp}`, false);
  };

  // Reset state when component mounts
  useEffect(() => {
    setGraphData([]);
    setPressureData([]);
    setCompleteGraphData([]);
    setCompletePressureData([]);
    setPeakNetForce(0);
    setPeakPressure(0);
    setStartTime(null);
    startTimeRef.current = null;
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
            <div className="flex-1 p-2 pt-0">
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
                        allowDecimals={true}
                        tickFormatter={(value) => `${value.toFixed(1)}s`}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                        domain={[0, 1000]}
                        ticks={[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]}
                        tickFormatter={(value) => `${value.toFixed(0)} N`}
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
                        formatter={(value: number) => [`${value.toFixed(2)} N`, '']}
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

            {/* Pressure Transducer Graph */}
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex flex-col">
              <div className="p-4 flex-none">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold text-white/90 tracking-wider">PRESSURE TRANSDUCER TELEMETRY</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={exportPressureChart}
                      disabled={completePressureData.length === 0}
                      className="px-3 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Download Complete Pressure Session as PNG"
                    >
                      DOWNLOAD
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-1 pt-0">
                <div id="pressure-chart" className="relative h-full bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10">
                  {pressureData.length === 0 ? (
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-white/60">No Data Detected</p>
                      <p className="text-xs text-white/40 mt-1">Waiting for pressure data...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pressureData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                        <defs>
                          <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                          </linearGradient>
                          <filter id="glowPressure">
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
                          allowDecimals={true}
                          tickFormatter={(value) => `${value.toFixed(1)}s`}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.3)"
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                          domain={[0, 2400]}
                          interval={0}
                          ticks={[0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400]}
                          tickFormatter={(value) => `${value.toFixed(0)} PSI`}
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
                          formatter={(value: number) => [`${value.toFixed(2)} PSI`, '']}
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
                          dataKey="pressure"
                          name="Pressure Transducer"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: '#8B5CF6', stroke: 'white', strokeWidth: 2 }}
                          animationDuration={0}
                          connectNulls={true}
                          filter="url(#glowPressure)"
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
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex-1">
              <div className="p-2 h-full flex flex-col">
                <h2 className="text-lg font-bold text-white/90 tracking-wider mb-2">MEASUREMENTS</h2>
                <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                  {['total', 'pressure', 'peakNetForce', 'peakPressure'].map((sensor) => (
                    <div key={sensor} className="bg-gradient-to-b from-gray-900/40 to-gray-900/20 rounded-lg border border-white/10 p-2 shadow-[0_0_10px_rgba(255,255,255,0.05)] flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-medium text-white tracking-wider leading-tight">
                          {sensor === 'total' ? 'NET FORCE' :
                           sensor === 'pressure' ? 'PRES' :
                           sensor === 'peakNetForce' ? 'PEAK NET' :
                           'PEAK PRES'}
                        </p>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          latestData[sensor] ? 'bg-green-500/20 shadow-[0_0_3px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_3px_rgba(239,68,68,0.5)]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            latestData[sensor] ? 'bg-green-500 shadow-[0_0_3px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_3px_rgba(239,68,68,0.8)]'
                          }`}></div>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-sm font-bold text-white">
                            {sensor === 'peakNetForce' ? peakNetForce.toFixed(2) :
                             sensor === 'peakPressure' ? peakPressure.toFixed(2) :
                             latestData[sensor] ?
                              `${latestData[sensor].toFixed(2)}` :
                              '--'}
                          </p>
                          <p className="text-xs text-white/70">
                            {sensor === 'pressure' || sensor === 'peakPressure' ? 'PSI' : 'N'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-white/70 text-center">
                        {latestData[sensor] ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Controls */}
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex-1">
              <div className="p-4 h-full flex flex-col">
                <div className="flex-none">
                  <h2 className="text-lg font-bold text-white/90 tracking-wider mb-4">SYSTEM CONTROLS</h2>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {/* Continuity Test */}
                  <div
                    onClick={() => toggleSwitch('continuity')}
                    className={`flex flex-col p-4 rounded-lg transition-all duration-300 border cursor-pointer ${
                      switchStates.continuity
                        ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm font-medium text-white tracking-wider">CONTINUITY</p>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        switchStates.continuity ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          switchStates.continuity ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                        }`}></div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-lg font-bold text-white">
                        {switchStates.continuity ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>
                  </div>

                  {/* Launch Key */}
                  <div
                    onClick={() => toggleSwitch('launchKey')}
                    className={`flex flex-col p-4 rounded-lg transition-all duration-300 border cursor-pointer ${
                      switchStates.launchKey
                        ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm font-medium text-white tracking-wider">LAUNCH KEY</p>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        switchStates.launchKey ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          switchStates.launchKey ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                        }`}></div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-lg font-bold text-white">
                        {switchStates.launchKey ? 'ACTIVE' : 'INACTIVE'}
                      </p>
                    </div>
                  </div>

                  {/* Abort System */}
                  <div
                    onClick={() => toggleSwitch('abort')}
                    className={`col-span-2 flex flex-col p-4 rounded-lg transition-all duration-300 border cursor-pointer ${
                      switchStates.abort
                        ? 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                        : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm font-medium text-white tracking-wider">ABORT SYSTEM</p>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        switchStates.abort ? 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          switchStates.abort ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                        }`}></div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-lg font-bold text-white">
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
