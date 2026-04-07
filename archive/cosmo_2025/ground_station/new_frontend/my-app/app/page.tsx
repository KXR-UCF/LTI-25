"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import SolidUI from "@/components/SolidUI";
import LiquidUI from "@/components/LiquidUI";
import { useState, useEffect, useRef } from 'react';

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

interface TelemetryMessage {
  type: 'telemetry_update';
  data: TelemetryRow[];
}

interface SwitchStateMessage {
  type: 'switch_state_update';
  data: { switch: string; state: boolean };
}

interface InitialSwitchStatesMessage {
  type: 'initial_switch_states';
  data: {
    switch1: boolean;
    switch2: boolean;
    switch3: boolean;
    switch4: boolean;
    switch5: boolean;
    switch6: boolean;
    switch7: boolean;
    switch8: boolean;
    switch9: boolean;
    switch10: boolean;
    continuity: boolean;
    launchKey: boolean;
    abort: boolean;
  };
}

type WebSocketMessage = TelemetryMessage | SwitchStateMessage | InitialSwitchStatesMessage;

const WEBSOCKET_URL = 'ws://localhost:8080';
const RECONNECT_DELAY = 2000; // 2 seconds

export default function Home() {
  const [telemetryData, setTelemetryData] = useState<TelemetryRow[]>([]);
  const [frozenData, setFrozenData] = useState<TelemetryRow[]>([]);  // Data frozen when STOP is clicked
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopped'>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const isFirstMessageRef = useRef(true);
  const startTimeRef = useRef<number | null>(null);  // Store the initial start time
  const recordingStartTimeRef = useRef<number | null>(null);  // Timestamp when START was clicked

  // Switch states received from socket_client via server.js
  const [switchStates, setSwitchStates] = useState({
    switch1: false,
    switch2: false,
    switch3: false,
    switch4: false,
    switch5: false,
    switch6: false,
    switch7: false,
    switch8: false,
    switch9: false,
    switch10: false,
    continuity: false,
    launchKey: false,
    abort: false
  });

  // Handle START button click
  const handleStart = () => {
    if (telemetryData.length > 0) {
      // Capture current latest timestamp as recording start
      const latestTimestamp = new Date(telemetryData[telemetryData.length - 1].timestamp).getTime() / 1000;
      recordingStartTimeRef.current = latestTimestamp;
      startTimeRef.current = latestTimestamp;
      setRecordingState('recording');
      console.log('[Recording] 🔴 START - Recording started at', latestTimestamp);
    }
  };

  // Handle STOP button click
  const handleStop = () => {
    // Freeze the current telemetry data
    setFrozenData([...telemetryData]);
    setRecordingState('stopped');
    console.log('[Recording] ⏹️ STOP - Recording stopped. Frozen', telemetryData.length, 'data points');
  };

  // Handle RESET button click
  const handleReset = () => {
    recordingStartTimeRef.current = null;
    startTimeRef.current = null;
    isFirstMessageRef.current = true;
    setFrozenData([]);
    setRecordingState('idle');
    console.log('[Recording] 🔄 RESET - Reset to idle mode');
  };

  // WebSocket connection for live 60Hz telemetry updates
  useEffect(() => {
    isUnmountedRef.current = false;

    const connect = () => {
      if (isUnmountedRef.current) return;

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log(`[WebSocket] Connecting to ${WEBSOCKET_URL}...`);
      setConnectionStatus('connecting');

      try {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
          if (isUnmountedRef.current) {
            ws.close();
            return;
          }
          console.log('[WebSocket] Connected successfully - receiving 60Hz updates');
          setConnectionStatus('connected');
          isFirstMessageRef.current = true; // Reset on new connection
          startTimeRef.current = null; // Reset start time on new connection
        };

        ws.onmessage = (event) => {
          if (isUnmountedRef.current) return;

          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            if (message.type === 'telemetry_update' && Array.isArray(message.data)) {
              console.log(`[WebSocket] 📥 Received ${message.data.length} points`);

              setTelemetryData(prev => {
                // First message after connection: Replace with initial data from backend
                if (isFirstMessageRef.current) {
                  isFirstMessageRef.current = false;
                  // Store the start time from the first data point
                  if (message.data.length > 0) {
                    startTimeRef.current = new Date(message.data[0].timestamp).getTime() / 1000;
                  }
                  console.log(`[WebSocket] 🔄 INITIAL LOAD: ${message.data.length} points | Total: ${message.data.length}`);
                  return message.data;
                }

                // Subsequent messages: Append incremental updates with deduplication
                // Get the last timestamp from existing data
                const lastExistingTimestamp = prev.length > 0 ? prev[prev.length - 1].timestamp : null;

                // Filter out any data that we already have (deduplication)
                const newData = message.data.filter(row =>
                  !lastExistingTimestamp || row.timestamp > lastExistingTimestamp
                );

                if (newData.length === 0) {
                  console.log(`[WebSocket] ⏭️  SKIPPED: All ${message.data.length} points already exist | Total: ${prev.length}`);
                  return prev;
                }

                const combined = [...prev, ...newData];
                console.log(`[WebSocket] ➕ APPEND: ${newData.length} new points (filtered from ${message.data.length}) | Previous: ${prev.length} | New Total: ${combined.length}`);
                return combined;
              });
            } else if (message.type === 'initial_switch_states') {
              // Handle initial switch states on connection
              console.log(`[WebSocket] 🎚️  Initial Switch States:`, message.data);
              setSwitchStates(message.data);
            } else if (message.type === 'switch_state_update') {
              // Handle live switch state updates from socket_client
              const { switch: switchName, state } = message.data;

              // Validate switch name to prevent injection
              const validSwitches = ['switch1', 'switch2', 'switch3', 'switch4', 'switch5', 'switch6', 'switch7', 'switch8', 'switch9', 'switch10', 'continuity', 'launchKey', 'abort'];
              if (!validSwitches.includes(switchName)) {
                console.warn(`[WebSocket] ⚠️  Invalid switch name: ${switchName}`);
                return;
              }

              console.log(`[WebSocket] 🎚️  Switch Update: ${switchName} = ${state}`);

              setSwitchStates(prev => ({
                ...prev,
                [switchName]: state
              }));
            }
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
        };

        ws.onclose = (event) => {
          if (isUnmountedRef.current) return;

          console.log(`[WebSocket] Disconnected (code: ${event.code})`);
          setConnectionStatus('disconnected');
          wsRef.current = null;

          // Auto-reconnect after delay
          console.log(`[WebSocket] Reconnecting in ${RECONNECT_DELAY}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
              connect();
            }
          }, RECONNECT_DELAY);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        setConnectionStatus('disconnected');

        // Retry connection
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            connect();
          }
        }, RECONNECT_DELAY);
      }
    };

    connect();

    return () => {
      isUnmountedRef.current = true;

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket connection
      if (wsRef.current) {
        console.log('[WebSocket] Closing connection...');
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-xs font-medium text-gray-700 dark:text-white/80">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Disconnected'}
            </span>
            <div className="h-3 w-px bg-gray-300 dark:bg-gray-700"></div>
            <span className="text-xs text-gray-500 dark:text-white/50">
              {telemetryData.length} pts
            </span>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStart}
              disabled={recordingState !== 'idle' || telemetryData.length === 0}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition-colors"
            >
              START
            </button>
            <button
              onClick={handleStop}
              disabled={recordingState !== 'recording'}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition-colors"
            >
              STOP
            </button>
            <button
              onClick={handleReset}
              disabled={recordingState === 'idle'}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition-colors"
            >
              RESET
            </button>
            {recordingState !== 'idle' && (
              <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white/80">
                {recordingState === 'recording' ? '🔴 Recording' : '⏹️ Stopped'}
              </span>
            )}
          </div>
        </div>
        <ThemeToggle />
      </div>
      <Tabs defaultValue="solid" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto mb-4 grid-cols-2">
          <TabsTrigger value="solid">Solid Motor</TabsTrigger>
          <TabsTrigger value="liquid">Liquid Motor</TabsTrigger>
        </TabsList>
        <TabsContent value="solid">
          <SolidUI telemetryData={recordingState === 'stopped' ? frozenData : telemetryData} connectionStatus={connectionStatus} startTime={startTimeRef.current} switchStates={switchStates} recordingState={recordingState} />
        </TabsContent>
        <TabsContent value="liquid">
          <LiquidUI telemetryData={recordingState === 'stopped' ? frozenData : telemetryData} connectionStatus={connectionStatus} startTime={startTimeRef.current} switchStates={switchStates} recordingState={recordingState} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
