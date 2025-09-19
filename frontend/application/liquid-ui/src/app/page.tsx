"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Graphs from "./components/graphs/Graphs";

import { DataPoint, PressureDataPoint, ThermalCoupleDataPoint } from "./interfaces";

// Function to generate realistic load cell data
const generateLoadCellData = () => {
    // Base values for each cell (in LBS) - covering mid-range of 0-800 scale
    const baseValues = {
        cell1: 80 + Math.random() * 60, // 80-140 LBS
        cell2: 100 + Math.random() * 80, // 100-180 LBS
        cell3: 90 + Math.random() * 70, // 90-160 LBS
    };

    // Add some noise and variation
    const noise = () => (Math.random() - 0.5) * 15; // ±7.5 LBS noise

    // Simulate some realistic variations with larger amplitude
    const variation = Math.sin(Date.now() / 1000) * 25; // Cyclic variation

    return {
        cell1: Math.max(0, baseValues.cell1 + noise() + variation),
        cell2: Math.max(0, baseValues.cell2 + noise() + variation),
        cell3: Math.max(0, baseValues.cell3 + noise() + variation),
    };
};

// Function to generate realistic pressure transducer data
const generatePressureData = () => {
    // Base pressure value (in PSI)
    const basePressure = 250 + Math.random() * 100; // 250-350 PSI

    // Add some noise and variation
    const noise = () => (Math.random() - 0.5) * 20; // ±10 PSI noise

    // Simulate realistic pressure variations
    const variation = Math.sin(Date.now() / 1500) * 30; // Cyclic variation

    return Math.max(0, basePressure + noise() + variation);
};

// Function to generate additional PT readings
const generateAdditionalPTData = () => {
    const noise = () => (Math.random() - 0.5) * 15; // ±7.5 PSI noise

    return {
        pt2: Math.max(
            0,
            180 +
                Math.random() * 80 +
                noise() +
                Math.sin(Date.now() / 1200) * 25
        ), // 180-260 PSI
        pt3: Math.max(
            0,
            320 +
                Math.random() * 60 +
                noise() +
                Math.sin(Date.now() / 1800) * 20
        ), // 320-380 PSI
        pt4: Math.max(
            0,
            150 +
                Math.random() * 100 +
                noise() +
                Math.sin(Date.now() / 2200) * 30
        ), // 150-250 PSI
        pt5: Math.max(
            0,
            280 +
                Math.random() * 70 +
                noise() +
                Math.sin(Date.now() / 1600) * 35
        ), // 280-350 PSI
        pt6: Math.max(
            0,
            200 +
                Math.random() * 90 +
                noise() +
                Math.sin(Date.now() / 2000) * 40
        ), // 200-290 PSI
    };
};

// Function to generate weight load cell data
const generateWeightLoadCellData = () => {
    // Base weight value (in LBS)
    const baseWeight = 450 + Math.random() * 200; // 450-650 LBS

    // Add some noise and variation
    const noise = () => (Math.random() - 0.5) * 20; // ±10 LBS noise

    // Simulate realistic weight variations
    const variation = Math.sin(Date.now() / 2500) * 30; // Cyclic variation

    return Math.max(0, baseWeight + noise() + variation);
};

// Function to generate realistic thermal couple temperature data
const generateThermalCoupleData = () => {
    // Base temperature values (in Celsius)
    const baseChamber = 400 + Math.random() * 200; // 400-600°C
    const baseNozzle = 350 + Math.random() * 150; // 350-500°C

    // Add some noise and variation
    const noise = () => (Math.random() - 0.5) * 20; // ±10°C noise

    // Simulate realistic temperature variations
    const variation = Math.sin(Date.now() / 2000) * 50; // Cyclic variation

    return {
        chamber: Math.max(0, baseChamber + noise() + variation),
        nozzle: Math.max(0, baseNozzle + noise() + variation * 0.8),
    };
};

interface LatestData {
    cell1?: number;
    cell2?: number;
    cell3?: number;
    total?: number;
    peakNetForce?: number;
    weight?: number;
    pressure?: number;
    pt2?: number;
    pt3?: number;
    pt4?: number;
    pt5?: number;
    pt6?: number;
    chamber?: number;
    nozzle?: number;
    [key: string]: number | undefined;
}

export default function Home() {
    const [graphData, setGraphData] = useState<DataPoint[]>([]);
    const [pressureData, setPressureData] = useState<PressureDataPoint[]>([]);
    const [thermalCoupleData, setThermalCoupleData] = useState<
        ThermalCoupleDataPoint[]
    >([]);
    const [additionalPTData, setAdditionalPTData] = useState<{
        pt2: number;
        pt3: number;
        pt4: number;
        pt5: number;
        pt6: number;
    }>({ pt2: 0, pt3: 0, pt4: 0, pt5: 0, pt6: 0 });
    const [peakNetForce, setPeakNetForce] = useState<number>(0);
    const [weightLoadCell, setWeightLoadCell] = useState<number>(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const isTestActiveRef = useRef(true);
    const [completeGraphData, setCompleteGraphData] = useState<DataPoint[]>([]);
    const [completePressureData, setCompletePressureData] = useState<
        PressureDataPoint[]
    >([]);
    const [completeThermalData, setCompleteThermalData] = useState<
        ThermalCoupleDataPoint[]
    >([]);
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

    // Add toggle handler for switches
    const toggleSwitch = (switchName: keyof typeof switchStates) => {
        setSwitchStates((prev) => ({
            ...prev,
            [switchName]: !prev[switchName],
        }));
    };

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
        if (thermalCoupleData.length > 0) {
            const lastThermalPoint =
                thermalCoupleData[thermalCoupleData.length - 1];
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
        // Add weight load cell
        result.weight = weightLoadCell;
        return result;
    }, [
        graphData,
        pressureData,
        thermalCoupleData,
        additionalPTData,
        peakNetForce,
        weightLoadCell,
    ]);

    // Calculate if launch is possible
    const canLaunch = useMemo(() => {
        return (
            switchStates.switch1 &&
            switchStates.switch2 &&
            switchStates.switch3 &&
            switchStates.switch4 &&
            switchStates.switch5 &&
            switchStates.switch6 &&
            switchStates.launchKey &&
            !switchStates.abort
        );
    }, [switchStates]);

    // Handle launch button click
    const handleLaunch = () => {
        if (canLaunch) {
            console.log("Launch sequence initiated");
        }
    };

    // Chart export function - captures complete chart including legends using SVG method
    const exportCompleteChart = async (
        data: any[],
        filename: string,
        isLoadCell: boolean
    ) => {
        try {
            if (data.length === 0) return;

            if (isLoadCell) {
                const originalData = graphData;
                setGraphData(completeGraphData);

                setTimeout(() => {
                    const chartContainer =
                        document.getElementById("load-cell-chart");
                    if (!chartContainer) return;

                    const svgElement = chartContainer.querySelector("svg");
                    const legendElement = chartContainer.querySelector(
                        ".recharts-legend-wrapper"
                    );

                    if (svgElement) {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");

                        if (ctx) {
                            canvas.width = 1200 * 2;
                            canvas.height = 650 * 2;
                            ctx.scale(2, 2);
                            ctx.fillStyle = "#111827";
                            ctx.fillRect(0, 0, 1200, 650);

                            const svgData =
                                new XMLSerializer().serializeToString(
                                    svgElement
                                );
                            const svgBlob = new Blob([svgData], {
                                type: "image/svg+xml;charset=utf-8",
                            });
                            const svgUrl = URL.createObjectURL(svgBlob);

                            const img = document.createElement(
                                "img"
                            ) as HTMLImageElement;
                            img.onload = () => {
                                ctx.drawImage(img, 0, 0, 1200, 600);

                                // Add load cell legends manually
                                if (legendElement) {
                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.font = "12px Arial";
                                    ctx.fillText("Load Cell 1", 50, 620);
                                    ctx.fillStyle = "#10B981";
                                    ctx.beginPath();
                                    ctx.arc(40, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();

                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.fillText("Load Cell 2", 150, 620);
                                    ctx.fillStyle = "#F59E0B";
                                    ctx.beginPath();
                                    ctx.arc(140, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();

                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.fillText("Load Cell 3", 250, 620);
                                    ctx.fillStyle = "#EF4444";
                                    ctx.beginPath();
                                    ctx.arc(240, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();

                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.fillText("Net Force", 350, 620);
                                    ctx.fillStyle = "#3B82F6";
                                    ctx.beginPath();
                                    ctx.arc(340, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();
                                }

                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        const url = URL.createObjectURL(blob);
                                        const link =
                                            document.createElement("a");
                                        link.href = url;
                                        link.download = `${filename}.png`;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                    }
                                });

                                URL.revokeObjectURL(svgUrl);
                                setGraphData(originalData);
                            };
                            img.src = svgUrl;
                        }
                    }
                }, 500);
            } else {
                const originalData = thermalCoupleData;
                setThermalCoupleData(completeThermalData);

                setTimeout(() => {
                    const chartContainer =
                        document.getElementById("thermal-chart");
                    if (!chartContainer) return;

                    const svgElement = chartContainer.querySelector("svg");
                    const legendElement = chartContainer.querySelector(
                        ".recharts-legend-wrapper"
                    );

                    if (svgElement) {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");

                        if (ctx) {
                            canvas.width = 1200 * 2;
                            canvas.height = 650 * 2;
                            ctx.scale(2, 2);
                            ctx.fillStyle = "#111827";
                            ctx.fillRect(0, 0, 1200, 650);

                            const svgData =
                                new XMLSerializer().serializeToString(
                                    svgElement
                                );
                            const svgBlob = new Blob([svgData], {
                                type: "image/svg+xml;charset=utf-8",
                            });
                            const svgUrl = URL.createObjectURL(svgBlob);

                            const img = document.createElement(
                                "img"
                            ) as HTMLImageElement;
                            img.onload = () => {
                                ctx.drawImage(img, 0, 0, 1200, 600);

                                // Add thermal legends manually
                                if (legendElement) {
                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.font = "12px Arial";
                                    ctx.fillText(
                                        "Chamber Temperature",
                                        50,
                                        620
                                    );
                                    ctx.fillStyle = "#F97316";
                                    ctx.beginPath();
                                    ctx.arc(40, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();

                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.fillText(
                                        "Nozzle Temperature",
                                        200,
                                        620
                                    );
                                    ctx.fillStyle = "#DC2626";
                                    ctx.beginPath();
                                    ctx.arc(190, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();
                                }

                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        const url = URL.createObjectURL(blob);
                                        const link =
                                            document.createElement("a");
                                        link.href = url;
                                        link.download = `${filename}.png`;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                    }
                                });

                                URL.revokeObjectURL(svgUrl);
                                setThermalCoupleData(originalData);
                            };
                            img.src = svgUrl;
                        }
                    }
                }, 500);
            }
        } catch (error) {
            console.error("Error exporting complete chart:", error);
        }
    };

    // Fetch load cell and pressure data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Initialize start time on first run
                const now = Date.now();
                if (startTime === null) {
                    setStartTime(now);
                }

                // Calculate runtime in seconds
                const runtimeSeconds = startTime
                    ? Math.floor((now - startTime) / 1000)
                    : 0;

                // Stop generating data after 8 seconds (static fire test duration)
                if (runtimeSeconds >= 8) {
                    isTestActiveRef.current = false;
                    return;
                }

                // Generate dummy data instead of fetching from API
                const loadCellData = generateLoadCellData();
                const pressureValue = generatePressureData();
                const thermalData = generateThermalCoupleData();
                const additionalPTValues = generateAdditionalPTData();
                const weightValue = generateWeightLoadCellData();
                const minutes = Math.floor(runtimeSeconds / 60);
                const seconds = runtimeSeconds % 60;
                const runtimeDisplay = `${minutes
                    .toString()
                    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

                // Calculate total force and create data point outside of setState
                const totalForce =
                    loadCellData.cell1 +
                    loadCellData.cell2 +
                    loadCellData.cell3;
                const newDataPoint = {
                    timestamp: runtimeDisplay,
                    cell1: loadCellData.cell1,
                    cell2: loadCellData.cell2,
                    cell3: loadCellData.cell3,
                    total: totalForce,
                };

                setGraphData((prev) => {
                    const newData = [...prev];
                    if (newData.length > 30) {
                        // Reduced number of points for better performance
                        newData.shift();
                    }

                    // Add new data point with runtime timestamp
                    newData.push(newDataPoint);

                    // Update peak net force if current total is higher
                    setPeakNetForce((prev) => Math.max(prev, totalForce));

                    return newData;
                });

                // Store complete dataset for export
                setCompleteGraphData((prev) => [...prev, newDataPoint]);

                // Create pressure data point outside of setState
                const newPressurePoint = {
                    timestamp: runtimeDisplay,
                    pressure: pressureValue,
                };

                setPressureData((prev) => {
                    const newData = [...prev];
                    if (newData.length > 30) {
                        // Keep same number of points as load cell data
                        newData.shift();
                    }

                    // Add new pressure data point
                    newData.push(newPressurePoint);

                    return newData;
                });

                // Store complete pressure dataset for export
                setCompletePressureData((prev) => [...prev, newPressurePoint]);

                // Create thermal data point outside of setState
                const newThermalPoint = {
                    timestamp: runtimeDisplay,
                    chamber: thermalData.chamber,
                    nozzle: thermalData.nozzle,
                };

                setThermalCoupleData((prev) => {
                    const newData = [...prev];
                    if (newData.length > 30) {
                        // Keep same number of points as other data
                        newData.shift();
                    }

                    // Add new thermal couple data point
                    newData.push(newThermalPoint);

                    return newData;
                });

                // Store complete thermal dataset for export
                setCompleteThermalData((prev) => [...prev, newThermalPoint]);

                // Update additional PT readings
                setAdditionalPTData(additionalPTValues);

                // Update weight load cell
                setWeightLoadCell(weightValue);
            } catch (error) {
                console.error("Error generating telemetry data:", error);
            }
        };

        const interval = setInterval(() => {
            if (isTestActiveRef.current) {
                fetchData();
            }
        }, 500); // Update every 500ms for smoother visualization
        return () => clearInterval(interval);
    }, [peakNetForce, startTime]);

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-auto">
            <div className="p-2">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 min-h-screen">
                    {/* Left Column - Graphs */}
                    <Graphs
                      graphData = { graphData }
                      setGraphData = { setGraphData }
                      completeGraphData = { completeGraphData }

                      thermalCoupleData = { thermalCoupleData }
                      setThermalCoupleData = { setThermalCoupleData }
                      completeThermalData = { completeThermalData }
                    />

                    {/* Right Column - Telemetry and Controls */}
                    <div className="flex flex-col gap-2 h-full">
                        {/* Telemetry Readings */}
                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex-shrink-0">
                            <div className="p-3">
                                <h2 className="text-lg font-bold text-white/90 tracking-wider mb-3">
                                    MEASUREMENTS
                                </h2>
                                <div className="grid grid-cols-4 gap-2 w-full">
                                    {[
                                        "total",
                                        "peakNetForce",
                                        "weight",
                                        "pressure",
                                        "pt2",
                                        "pt3",
                                        "pt4",
                                        "pt5",
                                        "pt6",
                                        "chamber",
                                        "nozzle",
                                    ].map((sensor) => (
                                        <div
                                            key={sensor}
                                            className="h-28 w-full bg-gradient-to-b from-gray-900/40 to-gray-900/20 rounded-lg border border-white/10 p-3 shadow-[0_0_10px_rgba(255,255,255,0.05)] flex flex-col justify-between"
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="text-xs font-semibold text-white tracking-wide leading-tight">
                                                    {sensor === "total"
                                                        ? "NET FORCE"
                                                        : sensor ===
                                                          "peakNetForce"
                                                        ? "PEAK NET"
                                                        : sensor === "weight"
                                                        ? "WEIGHT"
                                                        : sensor === "pressure"
                                                        ? "PT1"
                                                        : sensor === "pt2"
                                                        ? "PT2"
                                                        : sensor === "pt3"
                                                        ? "PT3"
                                                        : sensor === "pt4"
                                                        ? "PT4"
                                                        : sensor === "pt5"
                                                        ? "PT5"
                                                        : sensor === "pt6"
                                                        ? "PT6"
                                                        : sensor === "chamber"
                                                        ? "CHAMBER"
                                                        : "NOZZLE"}
                                                </p>
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                        latestData[sensor]
                                                            ? "bg-green-500/20 shadow-[0_0_3px_rgba(16,185,129,0.5)]"
                                                            : "bg-red-500/20 shadow-[0_0_3px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            latestData[sensor]
                                                                ? "bg-green-500 shadow-[0_0_3px_rgba(16,185,129,0.8)]"
                                                                : "bg-red-500 shadow-[0_0_3px_rgba(239,68,68,0.8)]"
                                                        }`}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <p className="text-base font-bold text-white text-center mb-1">
                                                    {latestData[sensor]
                                                        ? `${latestData[
                                                              sensor
                                                          ].toFixed(1)}`
                                                        : "--"}
                                                </p>
                                                <p className="text-xs text-white/80 text-center font-medium">
                                                    {sensor === "pressure" ||
                                                    sensor === "pt2" ||
                                                    sensor === "pt3" ||
                                                    sensor === "pt4" ||
                                                    sensor === "pt5" ||
                                                    sensor === "pt6"
                                                        ? "PSI"
                                                        : sensor ===
                                                              "chamber" ||
                                                          sensor === "nozzle"
                                                        ? "°C"
                                                        : sensor === "total" ||
                                                          sensor ===
                                                              "peakNetForce" ||
                                                          sensor === "weight"
                                                        ? "LBS"
                                                        : "LBS"}
                                                </p>
                                            </div>
                                            <p className="text-xs text-white/60 text-center font-medium">
                                                {latestData[sensor]
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* System Controls */}
                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm h-full">
                            <div className="p-4 h-full flex flex-col">
                                <div className="flex-none">
                                    <h2 className="text-lg font-bold text-white/90 tracking-wider mb-4">
                                        SYSTEM CONTROLS
                                    </h2>
                                </div>
                                <div className="flex-1 grid grid-cols-1 gap-4">
                                    {/* System Switches */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Switch 1 */}
                                        <div
                                            onClick={() =>
                                                toggleSwitch("switch1")
                                            }
                                            className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                                switchStates.switch1
                                                    ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                    : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-medium text-white tracking-wider">
                                                    NOX FILL
                                                </p>
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                        switchStates.switch1
                                                            ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                                            : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            switchStates.switch1
                                                                ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                                                                : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                                        }`}
                                                    ></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/70">
                                                {switchStates.switch1
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </p>
                                        </div>

                                        {/* Switch 2 */}
                                        <div
                                            onClick={() =>
                                                toggleSwitch("switch2")
                                            }
                                            className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                                switchStates.switch2
                                                    ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                    : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-medium text-white tracking-wider">
                                                    NOX VENT
                                                </p>
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                        switchStates.switch2
                                                            ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                                            : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            switchStates.switch2
                                                                ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                                                                : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                                        }`}
                                                    ></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/70">
                                                {switchStates.switch2
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </p>
                                        </div>

                                        {/* Switch 3 */}
                                        <div
                                            onClick={() =>
                                                toggleSwitch("switch3")
                                            }
                                            className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                                switchStates.switch3
                                                    ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                    : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-medium text-white tracking-wider">
                                                    NOX RELIEF
                                                </p>
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                        switchStates.switch3
                                                            ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                                            : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            switchStates.switch3
                                                                ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                                                                : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                                        }`}
                                                    ></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/70">
                                                {switchStates.switch3
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </p>
                                        </div>

                                        {/* Switch 4 */}
                                        <div
                                            onClick={() =>
                                                toggleSwitch("switch4")
                                            }
                                            className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                                switchStates.switch4
                                                    ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                    : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-medium text-white tracking-wider">
                                                    NITROGEN FILL
                                                </p>
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                        switchStates.switch4
                                                            ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                                            : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            switchStates.switch4
                                                                ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                                                                : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                                        }`}
                                                    ></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/70">
                                                {switchStates.switch4
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </p>
                                        </div>

                                        {/* Switch 5 */}
                                        <div
                                            onClick={() =>
                                                toggleSwitch("switch5")
                                            }
                                            className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                                switchStates.switch5
                                                    ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                    : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-medium text-white tracking-wider">
                                                    NITROGEN VENT
                                                </p>
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                        switchStates.switch5
                                                            ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                                            : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            switchStates.switch5
                                                                ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                                                                : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                                        }`}
                                                    ></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/70">
                                                {switchStates.switch5
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </p>
                                        </div>

                                        {/* Switch 6 */}
                                        <div
                                            onClick={() =>
                                                toggleSwitch("switch6")
                                            }
                                            className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                                switchStates.switch6
                                                    ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                    : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-medium text-white tracking-wider">
                                                    CONTINUITY TEST
                                                </p>
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                        switchStates.switch6
                                                            ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                                            : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            switchStates.switch6
                                                                ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                                                                : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                                        }`}
                                                    ></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/70">
                                                {switchStates.switch6
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Launch Controls */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Launch Key */}
                                        <div
                                            onClick={() =>
                                                toggleSwitch("launchKey")
                                            }
                                            className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                                switchStates.launchKey
                                                    ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                    : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-medium text-white tracking-wider">
                                                    LAUNCH KEY
                                                </p>
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                        switchStates.launchKey
                                                            ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                                            : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            switchStates.launchKey
                                                                ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                                                                : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                                        }`}
                                                    ></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/70">
                                                {switchStates.launchKey
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}
                                            </p>
                                        </div>

                                        {/* Abort System */}
                                        <div
                                            onClick={() =>
                                                toggleSwitch("abort")
                                            }
                                            className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                                switchStates.abort
                                                    ? "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                                    : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-medium text-white tracking-wider">
                                                    ABORT SYSTEM
                                                </p>
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                        switchStates.abort
                                                            ? "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                                            : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            switchStates.abort
                                                                ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                                                : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                                        }`}
                                                    ></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/70">
                                                {switchStates.abort
                                                    ? "ENGAGED"
                                                    : "STANDBY"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Launch Button */}
                                    <button
                                        onClick={handleLaunch}
                                        disabled={!canLaunch}
                                        className={`w-full py-4 px-6 rounded-lg transition-all duration-300 ${
                                            canLaunch
                                                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)]"
                                                : "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-400 cursor-not-allowed"
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="text-xl font-bold tracking-wider">
                                                FIRE
                                            </span>
                                            {canLaunch && (
                                                <svg
                                                    className="w-6 h-6"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <p className="text-sm text-center mt-2 opacity-75">
                                            {canLaunch
                                                ? "All systems ready for launch"
                                                : "Systems not ready"}
                                        </p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
