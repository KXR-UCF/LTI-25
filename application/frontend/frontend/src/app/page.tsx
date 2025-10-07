"use client";

import { useState, useEffect, useRef } from "react";

import LiquidUI from "./components/LiquidUI";
import SolidUI from "./components/SolidUI";

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

export default function Home() {
  const [solid, setSolid] = useState(true);
  const [telemetryData, setTelemetryData] = useState<TelemetryRow[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const telemetryUpdateCounterRef = useRef<number>(0);

  const switchUI = () => {
    setSolid(!solid);
  };

  // Single WebSocket connection for the entire app
  useEffect(() => {
    const connectWebSocket = () => {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      setConnectionStatus('connecting');
      const websocket = new WebSocket('ws://localhost:8080');

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        wsRef.current = websocket;
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'telemetry_update' && message.data && message.data.length > 0) {
            console.log('Received telemetry update:', message.data.length, 'rows');
            telemetryUpdateCounterRef.current++;
            setTelemetryData(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

      wsRef.current = websocket;
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <button onClick={switchUI}>Switch UI</button>
      {solid ? (
        <SolidUI telemetryData={telemetryData} connectionStatus={connectionStatus} />
      ) : (
        <LiquidUI telemetryData={telemetryData} connectionStatus={connectionStatus} />
      )}
    </>
  )
}
