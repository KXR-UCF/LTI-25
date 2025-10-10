"use client";

import { useEffect, useState, useMemo, useRef } from "react";

import TelemetryReadings from "./TelemetryReadings";
import Graphs from "./Graphs"
import Controls from "./Controls"

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
    connectionStatus: "disconnected" | "connecting" | "connected";
}

export default function SolidUI({
    telemetryData,
    connectionStatus,
}: SolidUIProps) {
    const [graphData, setGraphData] = useState<DataPoint[]>([]);
    const [pressureData, setPressureData] = useState<PressureDataPoint[]>([]);

    const [peakNetForce, setPeakNetForce] = useState(0);
    const [peakPressure, setPeakPressure] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const lastProcessedLengthRef = useRef<number>(0);


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
    const [completePressureData, setCompletePressureData] = useState<
        PressureDataPoint[]
    >([]);

    // Process unified telemetry data
    const processTelemetryData = (rows: TelemetryRow[]) => {
        const processedRows = rows.filter(
            (row) =>
                row.cell1_force !== null &&
                row.cell2_force !== null &&
                row.cell3_force !== null
        );

        if (processedRows.length === 0) return;

        const newLoadCellData: DataPoint[] = [];
        const newPressureData: PressureDataPoint[] = [];

        // Set start time from first data point if not already set
        if (startTimeRef.current === null && processedRows.length > 0) {
            startTimeRef.current = new Date(
                processedRows[0].timestamp
            ).getTime();
            setStartTime(startTimeRef.current);
        }

        processedRows.forEach((row) => {
            // Calculate runtime in seconds from QuestDB timestamp
            const dataPointTime = new Date(row.timestamp).getTime();
            const runtimeSeconds =
                startTimeRef.current !== null
                    ? (dataPointTime - startTimeRef.current) / 1000
                    : 0;

            const loadCellPoint: DataPoint = {
                timestamp: runtimeSeconds,
                cell1: row.cell1_force || 0,
                cell2: row.cell2_force || 0,
                cell3: row.cell3_force || 0,
                total: row.net_force || 0,
            };

            const pressurePoint: PressureDataPoint = {
                timestamp: runtimeSeconds,
                pressure: row.pressure_pt1 || 0,
            };

            newLoadCellData.push(loadCellPoint);
            newPressureData.push(pressurePoint);
        });

        // Update complete datasets
        setCompleteGraphData((prev) => [...prev, ...newLoadCellData]);
        setCompletePressureData((prev) => [...prev, ...newPressureData]);

        // Update display datasets (last 30 points) - preserve original timestamps
        setGraphData((prev) => {
            const combined = [...prev, ...newLoadCellData];
            if (combined.length > 30) {
                // Keep the last 30 points but preserve their original timestamps
                return combined.slice(-30);
            }
            return combined;
        });

        setPressureData((prev) => {
            const combined = [...prev, ...newPressureData];
            if (combined.length > 30) {
                // Keep the last 30 points but preserve their original timestamps
                return combined.slice(-30);
            }
            return combined;
        });

        // Update peak values
        const maxNetForce = Math.max(...newLoadCellData.map((d) => d.total));
        const maxPressure = Math.max(...newPressureData.map((d) => d.pressure));

        if (maxNetForce > peakNetForce) setPeakNetForce(maxNetForce);
        if (maxPressure > peakPressure) setPeakPressure(maxPressure);
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
        if (
            telemetryData.length > 0 &&
            telemetryData.length !== lastProcessedLengthRef.current
        ) {
            processTelemetryData(telemetryData);
            lastProcessedLengthRef.current = telemetryData.length;
        }
    }, [telemetryData]);

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-auto">
            <div className="p-2">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 min-h-screen">
                    {/* Left Column - Graphs */}
                    <div className="lg:col-span-3 grid grid-rows-2 gap-2">
                        <Graphs
                            graphData = { graphData }
                            completeGraphData = { completeGraphData }
                            setGraphData = { setGraphData }

                            pressureData = { pressureData }
                            completePressureData = { completePressureData }
                            setPressureData = { setPressureData }
                        />
                    </div>

                    {/* Right Column - Telemetry and Controls */}
                    <div className="flex flex-col gap-2 h-full">
                        {/* Telemetry Readings */}
                        <TelemetryReadings
                            latestData={latestData}
                            peakNetForce={peakNetForce}
                            peakPressure={peakPressure}
                        />

                        <Controls

                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
