import { useState, useRef, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { TelemetryPacket, SwitchState } from '../types/telemetry';
import { ChartHandle } from '../components/TelemetryChart';
import { MedianFilter } from '../lib/filters';

const DEFAULT_SWITCHES: SwitchState = {
    switch1: false, switch2: false, switch3: false, switch4: false,
    switch5: false, switch6: false, switch7: false, switch8: false,
    switch9: false, switch10: false,
    continuity: false, launchKey: false, abort: false
  };

// Connect on load
const WS_URL = 'ws://localhost:3001';

export type RecordingState = 'idle' | 'recording' | 'stopped';

// Store telemetry data points with timestamps for freezing capability
export interface StoredDataPoint {
  timestamp: number;
  relativeTime: number;
  telemetryData: { id: string; value: number }[];
}

export function useTelemetry() {
  // --- STATE ---
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  // Stores the latest packet purely for the Switch UI (low frequency updates)
  const [latestPacket, setLatestPacket] = useState<TelemetryPacket | null>(null);
  const [runtimeStr, setRuntimeStr] = useState<string>('00:00.00');
  const [filterEnabled, setFilterEnabled] = useState<boolean>(true);

  // --- REFS (Performance Critical - No Re-renders) ---
  const startTimeRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const chartRegistry = useRef<Map<string, ChartHandle>>(new Map());
  // Only stores data when RECORDING (not during idle monitoring)
  const recordedDataRef = useRef<StoredDataPoint[]>([]);
  const recordingStateRef = useRef<RecordingState>('idle');
  const filtersRef = useRef<Map<string, MedianFilter>>(new Map());
  const filterEnabledRef = useRef<boolean>(true);

  // --- WEBSOCKET ENGINE ---
  const { readyState } = useWebSocket(WS_URL, {
    shouldReconnect: () => true, // Auto-reconnect
    onMessage: (event) => {
      try {
        const packet: TelemetryPacket = JSON.parse(event.data);

        // 1. Always update switches
        setLatestPacket(packet);

        // 2. Initialize start time on first packet (for relative time calculation)
        if (startTimeRef.current === null) {
          startTimeRef.current = packet.timestamp;
        }

        // 3. Calculate relative runtime (T+ seconds from first packet)
        const runtime = (packet.timestamp - startTimeRef.current) / 1000;

        // 4. Update mission clock ONLY when recording
        if (recordingStateRef.current === 'recording') {
          setRuntimeStr(runtime.toFixed(2));
        }

        // 5. Store telemetry data ONLY when recording (for export/review later)
        if (recordingStateRef.current === 'recording') {
          const dataPoint: StoredDataPoint = {
            timestamp: packet.timestamp,
            relativeTime: runtime,
            telemetryData: packet.telemetry
          };
          recordedDataRef.current.push(dataPoint);
        }

        // 6. UPDATE CHARTS - Only if NOT stopped (frozen)
        if (recordingStateRef.current !== 'stopped') {
          packet.telemetry.forEach((point) => {
            const chart = chartRegistry.current.get(point.id);
            if (chart) {
              let valueToPlot = point.value;

              // Apply filter only if enabled
              if (filterEnabledRef.current) {
                // Get or create filter
                let filter = filtersRef.current.get(point.id);
                if (!filter) {
                  filter = new MedianFilter(5); // Window size 5
                  filtersRef.current.set(point.id, filter);
                }
                // Smooth the value
                valueToPlot = filter.process(point.value);
              }

              // Send to Chart
              chart.addDataPoint(runtime, valueToPlot);
            }
          });
        }
      } catch (err) {
        console.error('Telemetry Parse Error:', err);
      }
    }
  });

  // Notify charts when recording state changes
  const notifyChartsOfState = useCallback((state: RecordingState) => {
    chartRegistry.current.forEach((chart) => {
      if ('setRecordingState' in chart) {
        (chart as any).setRecordingState(state);
      }
    });
  }, []);

  // --- CONTROLS ---
  const startRecording = useCallback(() => {
    // Clear all charts and reset to T+0
    chartRegistry.current.forEach((chart) => chart.reset());
    recordedDataRef.current = [];

    // Clear filters
    filtersRef.current.forEach(f => f.reset());
    filtersRef.current.clear();

    // Reset time reference - next packet will be T+0
    startTimeRef.current = null;
    recordingStartTimeRef.current = null;
    setRuntimeStr('00:00.00');

    const newState = 'recording';
    recordingStateRef.current = newState;
    setRecordingState(newState);
    notifyChartsOfState(newState);
    console.log('[Recording] 🔴 START - Recording started, charts reset to T+0');
  }, [notifyChartsOfState]);

  const stopRecording = useCallback(() => {
    const newState = 'stopped';
    recordingStateRef.current = newState;
    setRecordingState(newState);
    notifyChartsOfState(newState);
    console.log('[Recording] ⏹️ STOP - Recording stopped. Saved', recordedDataRef.current.length, 'data points');
  }, [notifyChartsOfState]);

  const resetRecording = useCallback(() => {
    const newState = 'idle';
    recordingStateRef.current = newState;
    setRecordingState(newState);
    setRuntimeStr('00:00.00');
    recordingStartTimeRef.current = null;
    startTimeRef.current = null;
    recordedDataRef.current = [];

    // Clear all uPlot instances
    chartRegistry.current.forEach((chart) => chart.reset());

    // Clear filters
    filtersRef.current.forEach(f => f.reset());
    filtersRef.current.clear();

    // Notify charts to resume rolling window mode
    notifyChartsOfState(newState);
    console.log('[Recording] 🔄 RESET - Reset to idle mode with rolling window');
  }, [notifyChartsOfState]);

  // --- REGISTRY ---
  // This function is passed to SensorGrid -> TelemetryChart
  // It allows the Child Chart to register itself with this Parent Hook
  const registerChart = useCallback((id: string, chart: ChartHandle | null) => {
    if (chart) {
      chartRegistry.current.set(id, chart);
    } else {
      chartRegistry.current.delete(id);
    }
  }, []);

  // --- FILTER CONTROL ---
  const toggleFilter = useCallback((enabled: boolean) => {
    setFilterEnabled(enabled);
    filterEnabledRef.current = enabled;

    // Clear filter state when toggling to ensure clean transition
    if (!enabled) {
      filtersRef.current.forEach(f => f.reset());
    }

    console.log('[Filter]', enabled ? '✅ ENABLED - Median filtering active' : '❌ DISABLED - Raw values');
  }, []);

 const switches: SwitchState = latestPacket ? latestPacket.switches : DEFAULT_SWITCHES;

  return {
    recordingState,
    connectionStatus: readyState === ReadyState.OPEN ? 'Connected' : 'Disconnected',
    switches,
    runtimeStr,
    controls: { startRecording, stopRecording, resetRecording },
    registerChart,
    filterEnabled,
    toggleFilter
  };
}