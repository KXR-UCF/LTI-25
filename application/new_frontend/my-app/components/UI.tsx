"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UPlotChart from "@/components/UPlotChart";
import uPlot from "uplot";
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";

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

interface SolidUIProps {
    telemetryData: TelemetryRow[];
    connectionStatus: "disconnected" | "connecting" | "connected";
    startTime: number | null;
    switchStates: {
        switch6: boolean;
        launchKey: boolean;
        abort: boolean;
    };
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
        launchKey: boolean;
        abort: boolean;
    };
}

export default function UI({
    telemetryData,
    connectionStatus,
    startTime,
    switchStates,
}: LiquidUIProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Peak value tracking
    const [peakNetForce, setPeakNetForce] = useState(0);
    const [peakPressure, setPeakPressure] = useState(0);

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

    // Convert telemetry data to uPlot format for pressure
    const pressureData = useMemo((): uPlot.AlignedData => {
        if (telemetryData.length === 0 || startTime === null) {
            return [[], []];
        }

        const timestamps: number[] = [];
        const pressure: (number | null)[] = [];

        telemetryData.forEach((row) => {
            const time = new Date(row.timestamp).getTime() / 1000;
            timestamps.push(time - startTime);
            pressure.push(row.pressure_pt1);
        });

        return [timestamps, pressure];
    }, [telemetryData, startTime]);

    // Calculate latest data and update peaks incrementally
    const latestData = useMemo(() => {
        if (telemetryData.length === 0) {
            return {
                total: 0,
                peakNetForce: 0,
                pressure: 0,
                peakPressure: 0,
            };
        }

        const latest = telemetryData[telemetryData.length - 1];
        const currentNetForce = latest.net_force || 0;
        const currentPressure = latest.pressure_pt1 || 0;

        // Update peaks if we found a new maximum
        if (currentNetForce > peakNetForce) {
            setPeakNetForce(currentNetForce);
        }
        if (currentPressure > peakPressure) {
            setPeakPressure(currentPressure);
        }

        return {
            total: currentNetForce,
            peakNetForce,
            pressure: currentPressure,
            peakPressure,
        };
    }, [telemetryData, peakNetForce, peakPressure]);
}
