"use client";

import { useEffect, useState, useMemo } from 'react';

import { DataPoint, PressureDataPoint, TelemetryRow, LatestData, ThermalCoupleDataPoint } from "./interfaces"

import Graphs from "./components/graphs/Graphs"
import TelemetryReadings from "./components/TelemetryReadings";
import SystemControls from "./components/system controls/SystemControls";


export default function Home() {
  // Mode toggle state
  const [mode, setMode] = useState<'liquid' | 'solid'>('solid');
  
  // Data states
  const [pressureData, setPressureData] = useState<PressureDataPoint[]>([]);
  const [thermalCoupleData, setThermalCoupleData] = useState<ThermalCoupleDataPoint[]>([]);
  const [additionalPTData, setAdditionalPTData] = useState<{
    pt2: number;
    pt3: number;
    pt4: number;
    pt5: number;
    pt6: number;
  }>({ pt2: 0, pt3: 0, pt4: 0, pt5: 0, pt6: 0 });

  const [peakNetForce, setPeakNetForce] = useState(0);
  const [peakPressure, setPeakPressure] = useState(0);
  const [dataPointCounter, setDataPointCounter] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Liquid mode specific states
  const [switchStates, setSwitchStates] = useState({
    switch1: false,
    switch2: false,
    switch3: false,
    switch4: false,
    switch5: false,
    switch6: false,
    launchKey: false,
    abort: false,
  });

  // Calculate latest data for pressure and thermal
  const latestData = useMemo<LatestData>(() => {
    const result: LatestData = {};
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
    return result;
  }, [pressureData, thermalCoupleData, additionalPTData, peakNetForce]);

  // Store complete datasets for export
  const [completePressureData, setCompletePressureData] = useState<PressureDataPoint[]>([]);
  const [completeThermalData, setCompleteThermalData] = useState<ThermalCoupleDataPoint[]>([]);

  // Add toggle handler for switches (liquid mode only)
  const toggleSwitch = (switchName: keyof typeof switchStates) => {
    if (mode === 'liquid') {
      setSwitchStates((prev) => ({
        ...prev,
        [switchName]: !prev[switchName],
      }));
    }
  };


  // Process unified telemetry data (solid mode)
  const processTelemetryData = (rows: TelemetryRow[]) => {
    if (mode !== 'solid') return;
    
    const processedRows = rows.filter(row =>
      row.cell1_force !== null && row.cell2_force !== null && row.cell3_force !== null
    );

    if (processedRows.length === 0) return;

    const newPressureData: PressureDataPoint[] = [];

    processedRows.forEach(row => {
      const discreteTimestamp = dataPointCounter + newPressureData.length;

      const pressurePoint: PressureDataPoint = {
        timestamp: discreteTimestamp,
        pressure: row.pressure_pt1 || 0
      };

      newPressureData.push(pressurePoint);
    });

    setDataPointCounter(prev => prev + newPressureData.length);

    // Update complete datasets
    setCompletePressureData(prev => [...prev, ...newPressureData]);

    // Update display datasets (last 30 points)
    setPressureData(prev => {
      const combined = [...prev, ...newPressureData];
      if (combined.length > 30) {
        return combined.slice(-30);
      }
      return combined;
    });

    // Update peak values
    const maxPressure = Math.max(...newPressureData.map(d => d.pressure));

    if (maxPressure > peakPressure) setPeakPressure(maxPressure);
  };

  // Liquid mode data generation - removed dummy data generation
  // This will be replaced with real data from the backend

  // WebSocket connection setup (solid mode)
  useEffect(() => {
    if (mode !== 'solid') {
      // Close existing connection if switching away from solid mode
      if (ws) {
        ws.close();
        setWs(null);
        setConnectionStatus('disconnected');
      }
      return;
    }

    let websocket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      
      try {
        websocket = new WebSocket('ws://localhost:8080');

        websocket.onopen = () => {
          console.log('WebSocket connected');
          setConnectionStatus('connected');
          setWs(websocket);
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'telemetry_update' && message.data) {
              console.log('Received telemetry update:', message.data.length, 'rows');
              processTelemetryData(message.data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        websocket.onclose = () => {
          console.log('WebSocket disconnected');
          setConnectionStatus('disconnected');
          setWs(null);

          // Only attempt to reconnect if we're still in solid mode
          if (mode === 'solid') {
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, 3000);
          }
        };

        websocket.onerror = (error) => {
          console.log('WebSocket connection failed - no server running on port 8080');
          setConnectionStatus('disconnected');
          // Don't attempt to reconnect immediately on error
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionStatus('disconnected');
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (websocket) {
        websocket.close();
      }
    };
  }, [mode]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-auto">
      <div className="p-2">
        {/* Mode Toggle */}
        <div className="mb-4 flex justify-center">
          <div className="bg-gray-800/50 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setMode('solid')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                mode === 'solid'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Solid
            </button>
            <button
              onClick={() => setMode('liquid')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                mode === 'liquid'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Liquid
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 min-h-screen">
          {/* Left Column - Graphs */}
          <Graphs 
            pressureData={pressureData}
            setPressureData={setPressureData}
            completePressureData={completePressureData}
            thermalCoupleData={thermalCoupleData}
            setThermalCoupleData={setThermalCoupleData}
            completeThermalData={completeThermalData}
            mode={mode}
          />

          {/* Right Column - Telemetry and Controls */}
          <div className="flex flex-col gap-2 h-full">
            <TelemetryReadings
              latestData={latestData}
              peakNetForce={peakNetForce}
              peakPressure={peakPressure}
              mode={mode}
            />

            <SystemControls
              mode={mode}
              switchStates={switchStates}
              toggleSwitch={toggleSwitch}
            />
          </div>
        </div>
      </div>
    </main>
  );
}