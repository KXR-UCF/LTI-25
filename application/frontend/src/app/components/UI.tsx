"use client";

import { useEffect, useState, useMemo, useRef } from "react";

import { 
    type TelemetryRow,
    type DataPoint,
    type LoadCellData,
    createEmptyLoadCellInterface,
    type PressureDataPoint, 
    type PressureData,
    createEmptyPressureInterface,
    type LatestData,
} from "../interfaces"

import TelemetryReadings from "./TelemetryReadings";
import Graph from "./Graph"
import Controls from "./Controls"


interface SolidUIProps {
    telemetryData: TelemetryRow[];
    connectionStatus: "disconnected" | "connecting" | "connected";
}

function UI({
    telemetryData,
    connectionStatus,
}: SolidUIProps) {
    const [loadCellData, setLoadCellData] = useState<LoadCellData>(createEmptyLoadCellInterface());
    const [pressureData, setPressureData] = useState<PressureData>(createEmptyPressureInterface());

    const [startTime, setStartTime] = useState<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const lastProcessedLengthRef = useRef<number>(0);


    // Calculate latest data for each cell and pressure
    const latestData = useMemo<LatestData>(() => {
        const result: LatestData = {};
        if (loadCellData.data.length > 0) {
            const lastPoint = loadCellData.data[loadCellData.data.length - 1];
            result.cell1 = lastPoint.cell1;
            result.cell2 = lastPoint.cell2;
            result.cell3 = lastPoint.cell3;
            result.total = lastPoint.total;
        }
        if (pressureData.data.length > 0) {
            const lastPressurePoint = pressureData[pressureData.data.length - 1];
            result.pressure = lastPressurePoint.pressure;
        }
        return result;
    }, [loadCellData, pressureData]);

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
        setLoadCellData((prev) => {
            let next: LoadCellData = createEmptyLoadCellInterface()
            
            next.data = [...prev.data, ...newLoadCellData]

            const maxNetForce = Math.max(...newLoadCellData.map((d) => d.total)); // Will be sum for liquid
            if (maxNetForce > prev.peakNet) {
                next.peakNet = maxNetForce;
            } else {
                next.peakNet = prev.peakNet
            }

            return next
        });

        setPressureData((prev) => {
            let next: PressureData = createEmptyPressureInterface()
            
            next.data = [...prev.data, ...newPressureData]

            const maxNetForce = Math.max(...newPressureData.map((d) => d.pressure));
            if (maxNetForce > prev.peakNet) {
                next.peakNet = maxNetForce;
            } else {
                next.peakNet = prev.peakNet
            }

            return next
        });
    };

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
        <main className="min-h-screen overflow-auto">
            <div className="p-2">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 min-h-screen">
                    {/* Left Column - Graphs */}
                    <div className="lg:col-span-3 grid grid-rows-2 gap-2">
                        <Graph 
                            data = { loadCellData } 
                        />

                        <Graph 
                            data = { pressureData } 
                        />
                    </div>

                    {/* Right Column - Telemetry and Controls */}
                    <div className="flex flex-col gap-2 h-full">
                        {/* Telemetry Readings */}
                        <TelemetryReadings
                            latestData={latestData}
                            peakNetForce={loadCellData.peakNet}
                            peakPressure={pressureData.peakNet}
                        />

                        <Controls />
                    </div>
                </div>
            </div>
        </main>
    );
}

export default UI