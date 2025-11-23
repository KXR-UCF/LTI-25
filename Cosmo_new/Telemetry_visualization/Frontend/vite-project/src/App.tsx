import { useState, useMemo, useEffect } from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import { DASHBOARD_CONFIG } from './config/maps';
import { SensorGrid } from './components/SensorGrid';
import { SwitchPanel } from './components/SwitchPanel';
import { ThemeToggle } from './components/theme-toggle';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { Play, Square, RotateCcw, Filter } from 'lucide-react';
import { Toggle } from './components/ui/toggle';

type FilterMode = 'all' | 'pressure' | 'thrust' | 'temp';

const FILTER_MODE_KEY = 'cosmo-filter-mode';

export default function App() {
  const {
    recordingState,
    connectionStatus,
    switches,
    runtimeStr,
    controls,
    registerChart,
    filterEnabled,
    toggleFilter
  } = useTelemetry();

  // Filter State (All, Pressure, Load Cells, Temperature) - Load from localStorage
  const [filterMode, setFilterMode] = useState<FilterMode>(() => {
    const saved = localStorage.getItem(FILTER_MODE_KEY);
    return (saved as FilterMode) || 'all';
  });

  // Persist filter mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(FILTER_MODE_KEY, filterMode);
  }, [filterMode]);

  // Filter sensors based on selected mode
  const filteredSensors = useMemo(() => {
    if (filterMode === 'all') {
      return DASHBOARD_CONFIG.sensors;
    }
    return DASHBOARD_CONFIG.sensors.filter(sensor => sensor.group === filterMode);
  }, [filterMode]);

  // Create filtered config
  const currentConfig = useMemo(() => ({
    sensors: filteredSensors,
    switches: DASHBOARD_CONFIG.switches,
  }), [filteredSensors]);

  // Determine if we should allow scrolling (for All Sensors view)
  const isAllSensorsView = filterMode === 'all';

  return (
    <div className="h-screen w-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col overflow-hidden font-sans selection:bg-emerald-500/30">

      {/* --- HEADER --- */}
      <header className="min-h-14 flex-none border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2 z-50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* LEFT: Status & Title */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="COSMO Logo"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                COSMO WANDA <span className="text-slate-400 dark:text-slate-500 font-normal hidden sm:inline">TELEMETRY</span>
              </h1>
            </div>

            <Badge
              variant={connectionStatus === 'Connected' ? 'default' : 'destructive'}
              className={`text-[10px] px-2 h-5 uppercase tracking-wider flex-shrink-0 ${
                connectionStatus === 'Connected' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : ''
              }`}
            >
              {connectionStatus === 'Connected' ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* CENTER: Mission Clock - Hide on very small screens */}
          <div className="hidden lg:flex flex-col items-center flex-shrink-0">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-[0.2em] uppercase">
              Mission Clock
            </div>
            <div className={`font-mono text-2xl font-bold tabular-nums tracking-widest ${
              recordingState === 'recording' ? 'text-emerald-500 dark:text-emerald-400' :
              recordingState === 'stopped' ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-600'
            }`}>
              T+ {runtimeStr}
            </div>
          </div>

          {/* RIGHT: Controls */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Filter Selector */}
          <Select
            value={filterMode}
            onValueChange={(v) => setFilterMode(v as FilterMode)}
          >
            <SelectTrigger className="w-[140px] md:w-[160px] h-8 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200">
              <SelectItem value="all">All Sensors (15)</SelectItem>
              <SelectItem value="pressure">Pressure (8)</SelectItem>
              <SelectItem value="thrust">Load Cells (5)</SelectItem>
              <SelectItem value="temp">Temperature (2)</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden md:block w-px h-6 bg-slate-300 dark:bg-slate-800 mx-2" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Median Filter Toggle */}
          <Toggle
            pressed={filterEnabled}
            onPressedChange={toggleFilter}
            aria-label="Toggle median filter"
            className="h-8 px-2 data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-500 data-[state=on]:border-emerald-500/50"
          >
            <Filter className="w-4 h-4" />
          </Toggle>

          <div className="hidden md:block w-px h-6 bg-slate-300 dark:bg-slate-800 mx-2" />

          {/* Flight Recorder */}
          <div className="flex items-center gap-0.5 md:gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-md border border-slate-300 dark:border-slate-800">
            <Button
              size="sm"
              variant={recordingState === 'recording' ? 'destructive' : 'ghost'}
              className={`h-7 px-2 md:px-3 text-xs gap-1 md:gap-2 ${recordingState === 'recording' ? 'animate-pulse' : ''}`}
              onClick={controls.startRecording}
              disabled={recordingState === 'recording' || connectionStatus !== 'Connected'}
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">REC</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 md:px-3 text-xs gap-1 md:gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-500 hover:text-amber-400"
              onClick={controls.stopRecording}
              disabled={recordingState !== 'recording'}
            >
              <Square className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">STOP</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 md:px-3 text-xs gap-1 md:gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              onClick={controls.resetRecording}
              disabled={recordingState === 'idle'}
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">RST</span>
            </Button>
          </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT (Charts) --- */}
      <main className={`flex-1 relative bg-slate-50 dark:bg-slate-950/50 ${isAllSensorsView ? 'overflow-auto' : 'overflow-hidden'}`}>
        <SensorGrid
          config={currentConfig}
          registry={registerChart}
        />
      </main>

      {/* --- FOOTER (Switches) --- */}
      <footer className="flex-none z-10">
        <SwitchPanel
          config={currentConfig.switches}
          values={switches}
        />
      </footer>
    </div>
  );
}