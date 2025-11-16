"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UPlotChart from "@/components/UPlotChart";
import uPlot from "uplot";
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";

import Chart from "./Chart";

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

interface LiquidUIProps {
  telemetryData: TelemetryRow[];
  connectionStatus: "disconnected" | "connecting" | "connected";
  startTime: number | null;
  switchStates: {
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

export default function LiquidUI({
  telemetryData,
  connectionStatus,
  startTime,
  switchStates,
}: LiquidUIProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Peak value tracking
  const [peakNetForce, setPeakNetForce] = useState(0);

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

    telemetryData.forEach((row) => {
      const time = new Date(row.timestamp).getTime() / 1000;
      timestamps.push(time - startTime);
      cell1.push(row.cell1_force);
      cell2.push(row.cell2_force);
      cell3.push(row.cell3_force);
      netForce.push(row.net_force);
    });

    return [timestamps, cell1, cell2, cell3, netForce];
  }, [telemetryData, startTime]);

  // Convert telemetry data to uPlot format for thermal
  const thermalData = useMemo((): uPlot.AlignedData => {
    if (telemetryData.length === 0 || startTime === null) {
      return [[], [], []];
    }

    const timestamps: number[] = [];
    const chamber: (number | null)[] = [];
    const nozzle: (number | null)[] = [];

    telemetryData.forEach((row) => {
      const time = new Date(row.timestamp).getTime() / 1000;
      timestamps.push(time - startTime);
      chamber.push(row.chamber_temp);
      nozzle.push(row.nozzle_temp);
    });

    return [timestamps, chamber, nozzle];
  }, [telemetryData, startTime]);

  // Calculate latest data and update peaks incrementally
  const latestData = useMemo(() => {
    if (telemetryData.length === 0) {
      return {
        total: 0,
        peakNetForce: 0,
        weight: 0,
        pressure: 0,
        pt2: 0,
        pt3: 0,
        pt4: 0,
        pt5: 0,
        pt6: 0,
        chamber: 0,
        nozzle: 0,
      };
    }

    const latest = telemetryData[telemetryData.length - 1];
    const currentNetForce = latest.net_force || 0;

    // Update peak if we found a new maximum
    if (currentNetForce > peakNetForce) {
      setPeakNetForce(currentNetForce);
    }

    return {
      total: currentNetForce,
      peakNetForce,
      weight: latest.weight_load_cell || 0,
      pressure: latest.pressure_pt1 || 0,
      pt2: latest.pressure_pt2 || 0,
      pt3: latest.pressure_pt3 || 0,
      pt4: latest.pressure_pt4 || 0,
      pt5: latest.pressure_pt5 || 0,
      pt6: latest.pressure_pt6 || 0,
      chamber: latest.chamber_temp || 0,
      nozzle: latest.nozzle_temp || 0,
    };
  }, [telemetryData, peakNetForce]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Left Column - Charts */}
      <div className="lg:col-span-3 grid grid-rows-2 gap-4">
        {/* Load Cell Chart */}
        <Chart
          name={"LOAD CELL TELEMETRY "}
          isDark={isDark}
          chartClass={"load-cell-chart"}
          axisLabel={"Force (LBS)"}
          axisUnit={" LBS"}
          lines={[
            {
              label: "Load Cell 1",
              stroke: "#10B981",
              width: 2,
            },
            {
              label: "Load Cell 2",
              stroke: "#F59E0B",
              width: 2,
            },
            {
              label: "Load Cell 3",
              stroke: "#EF4444",
              width: 2,
            },
            {
              label: "Net Force",
              stroke: "#3B82F6",
              width: 2,
            },
          ]}
          telemetryData={telemetryData}
          data={loadCellData}
        />

        {/* Thermal Chart */}
        <Chart
          name={"THERMAL COUPLE TELEMETRY"}
          isDark={isDark}
          chartClass={"thermal-couple-chart"}
          axisLabel={"Celcius (C)"}
          axisUnit={" C"}
          lines={[
            {
              label: "Chamber Temperature",
              stroke: "#F97316",
              width: 2,
            },
            {
              label: "Nozzle Temperature",
              stroke: "#DC2626",
              width: 2,
            },
          ]}
          telemetryData={telemetryData}
          data={thermalData}
        />
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
            {/* Load Cells & Net Force */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50 mb-2 uppercase tracking-wider">
                Force Sensors
              </p>
              <div className="grid grid-cols-3 gap-3 h-[calc(100%-1.75rem)]">
                {["total", "peakNetForce", "weight"].map((sensor) => (
                  <div
                    key={sensor}
                    className="bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-white/10 p-3 flex flex-col justify-center items-center space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white tracking-wide leading-tight">
                        {sensor === "total"
                          ? "NET"
                          : sensor === "peakNetForce"
                          ? "PEAK"
                          : "WEIGHT"}
                      </p>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          latestData[sensor as keyof typeof latestData] > 0
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {latestData[sensor as keyof typeof latestData].toFixed(
                          1
                        )}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                        LBS
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pressure Transducers */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50 mb-2 uppercase tracking-wider">
                Pressure
              </p>
              <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[calc(100%-1.75rem)]">
                {["pressure", "pt2", "pt3", "pt4", "pt5", "pt6"].map(
                  (sensor) => (
                    <div
                      key={sensor}
                      className="bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-white/10 p-3 flex flex-col justify-center items-center space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white tracking-wide leading-tight">
                          {sensor === "pressure"
                            ? "PT1"
                            : sensor === "pt2"
                            ? "PT2"
                            : sensor === "pt3"
                            ? "PT3"
                            : sensor === "pt4"
                            ? "PT4"
                            : sensor === "pt5"
                            ? "PT5"
                            : "PT6"}
                        </p>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            latestData[sensor as keyof typeof latestData] > 0
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          {latestData[
                            sensor as keyof typeof latestData
                          ].toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                          PSI
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Temperature */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50 mb-2 uppercase tracking-wider">
                Temperature
              </p>
              <div className="grid grid-cols-2 gap-3 h-[calc(100%-1.75rem)]">
                {["chamber", "nozzle"].map((sensor) => (
                  <div
                    key={sensor}
                    className="bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-white/10 p-3 flex flex-col justify-center items-center space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white tracking-wide leading-tight">
                        {sensor === "chamber" ? "CHAMBER" : "NOZZLE"}
                      </p>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          latestData[sensor as keyof typeof latestData] > 0
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {latestData[sensor as keyof typeof latestData].toFixed(
                          1
                        )}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                        °C
                      </p>
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
            {/* NOX Systems */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50 mb-2 uppercase tracking-wider">
                NOX Systems
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "switch1", label: "NOX FILL" },
                  { key: "switch2", label: "NOX VENT" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className={`flex flex-col p-3 rounded-lg border transition-all duration-300 justify-center items-center space-y-2 ${
                      switchStates[key as keyof typeof switchStates]
                        ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                        : "bg-red-100 dark:bg-red-900/30 border-red-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {label}
                      </p>
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          switchStates[key as keyof typeof switchStates]
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                      {switchStates[key as keyof typeof switchStates]
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3 mt-3">
                <div
                  className={`flex flex-col p-3 rounded-lg border transition-all duration-300 justify-center items-center space-y-2 ${
                    switchStates.switch3
                      ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                      : "bg-red-100 dark:bg-red-900/30 border-red-500/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      NOX RELIEF
                    </p>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        switchStates.switch3 ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                    {switchStates.switch3 ? "ACTIVE" : "INACTIVE"}
                  </p>
                </div>
              </div>
            </div>

            {/* N2 Systems */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50 mb-2 uppercase tracking-wider">
                N2 Systems
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "switch6", label: "N2 FILL" },
                  { key: "switch7", label: "N2 VENT" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className={`flex flex-col p-3 rounded-lg border transition-all duration-300 justify-center items-center space-y-2 ${
                      switchStates[key as keyof typeof switchStates]
                        ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                        : "bg-red-100 dark:bg-red-900/30 border-red-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {label}
                      </p>
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          switchStates[key as keyof typeof switchStates]
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                      {switchStates[key as keyof typeof switchStates]
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3 mt-3">
                <div
                  className={`flex flex-col p-3 rounded-lg border transition-all duration-300 justify-center items-center space-y-2 ${
                    switchStates.switch8
                      ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                      : "bg-red-100 dark:bg-red-900/30 border-red-500/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      N2 RELIEF
                    </p>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        switchStates.switch8 ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                    {switchStates.switch8 ? "ACTIVE" : "INACTIVE"}
                  </p>
                </div>
              </div>
            </div>

            {/* Control Systems */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50 mb-2 uppercase tracking-wider">
                Control Systems
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`flex flex-col p-3 rounded-lg border transition-all duration-300 justify-center items-center space-y-2 ${
                    switchStates.continuity
                      ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                      : "bg-red-100 dark:bg-red-900/30 border-red-500/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      CONTINUITY
                    </p>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        switchStates.continuity ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                    {switchStates.continuity ? "ACTIVE" : "INACTIVE"}
                  </p>
                </div>
                <div
                  className={`flex flex-col p-3 rounded-lg border transition-all duration-300 justify-center items-center space-y-2 ${
                    switchStates.launchKey
                      ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                      : "bg-red-100 dark:bg-red-900/30 border-red-500/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      LAUNCH KEY
                    </p>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        switchStates.launchKey ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                    {switchStates.launchKey ? "ACTIVE" : "INACTIVE"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 mt-3">
                <div className="flex flex-col p-3 rounded-lg border transition-all duration-300 bg-red-100 dark:bg-red-900/30 border-red-500/50 justify-center items-center space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      ABORT SYSTEM
                    </p>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-white/70 font-medium">
                    {switchStates.abort ? "ENGAGED" : "STANDBY"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
