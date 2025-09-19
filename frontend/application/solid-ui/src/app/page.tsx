"use client";

import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';

import { DataPoint, PressureDataPoint, TelemetryRow, LatestData } from "./interfaces"

import Graphs from "./components/graphs/Graphs"
import TelemetryReadings from "./components/TelemetryReadings";
import SystemControls from "./components/system controls/SystemControls";

export default function Home() {
  const [graphData, setGraphData] = useState<DataPoint[]>([]);
  const [pressureData, setPressureData] = useState<PressureDataPoint[]>([]);

  const [peakNetForce, setPeakNetForce] = useState(0);
  const [peakPressure, setPeakPressure] = useState(0);
  const [dataPointCounter, setDataPointCounter] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

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

    processedRows.forEach(row => {
      const discreteTimestamp = dataPointCounter + newLoadCellData.length;

      const loadCellPoint: DataPoint = {
        timestamp: discreteTimestamp,
        cell1: row.cell1_force || 0,
        cell2: row.cell2_force || 0,
        cell3: row.cell3_force || 0,
        total: row.net_force || 0
      };

      const pressurePoint: PressureDataPoint = {
        timestamp: discreteTimestamp,
        pressure: row.pressure_pt1 || 0
      };

      newLoadCellData.push(loadCellPoint);
      newPressureData.push(pressurePoint);
    });

    setDataPointCounter(prev => prev + newLoadCellData.length);

    // Update complete datasets
    setCompleteGraphData(prev => [...prev, ...newLoadCellData]);
    setCompletePressureData(prev => [...prev, ...newPressureData]);

    // Update display datasets (last 30 points) - preserve original timestamps
    setGraphData(prev => {
      const combined = [...prev, ...newLoadCellData];
      if (combined.length > 30) {
        // Keep the last 30 points but preserve their original timestamps
        return combined.slice(-30);
      }
      return combined;
    });

    setPressureData(prev => {
      const combined = [...prev, ...newPressureData];
      if (combined.length > 30) {
        // Keep the last 30 points but preserve their original timestamps
        return combined.slice(-30);
      }
      return combined;
    });

    // Update peak values
    const maxNetForce = Math.max(...newLoadCellData.map(d => d.total));
    const maxPressure = Math.max(...newPressureData.map(d => d.pressure));

    if (maxNetForce > peakNetForce) setPeakNetForce(maxNetForce);
    if (maxPressure > peakPressure) setPeakPressure(maxPressure);
  };

  // WebSocket connection setup
  useEffect(() => {
    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      const websocket = new WebSocket('ws://localhost:8080');

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

        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (websocket.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);


  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-auto">
      <div className="p-2">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 min-h-screen">
          {/* Left Column - Graphs */}
            <Graphs 
              graphData = { graphData }
              setGraphData = { setGraphData }
              completeGraphData = { completeGraphData }

              pressureData = { pressureData }
              setPressureData = { setPressureData }
              completePressureData = { completePressureData }
            />

          {/* Right Column - Telemetry and Controls */}
          <div className="flex flex-col gap-2 h-full">
            <TelemetryReadings
              latestData = { latestData }
              peakNetForce = { peakNetForce }
              peakPressure = { peakPressure }
            />

            <SystemControls/>
          </div>
        </div>
      </div>
    </main>
  );
}
