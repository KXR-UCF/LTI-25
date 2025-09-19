import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import { ThermalCoupleDataPoint } from "../../interfaces";

interface ThermalCoupleGraphProps { 
    thermalCoupleData: ThermalCoupleDataPoint[]; 
    completeThermalData: ThermalCoupleDataPoint[]; 
    exportCompleteChart: (data: any[], filename: string, isLoadCell: boolean) => Promise<void>; 
}

export default function ThermalCoupleGraph({
        thermalCoupleData, completeThermalData,
        exportCompleteChart
    }: ThermalCoupleGraphProps) {

    const exportThermalChart = () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        exportCompleteChart(
            completeThermalData,
            `thermal-complete-session-${timestamp}`,
            false
        );
    };

    return (
        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex flex-col">
            <div className="p-4 flex-none">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-white/90 tracking-wider">
                        THERMAL COUPLE TELEMETRY
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={exportThermalChart} // diff
                            disabled={completeThermalData.length === 0}
                            className="px-3 py-1 text-xs bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors" // diff
                            title="Download Complete Thermal Session as PNG" // diff
                        >
                            DOWNLOAD
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-1 p- pt-0">
                <div
                    id="thermal-chart" // diff
                    className="relative h-64 bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10"
                >
                    {thermalCoupleData.length === 0 ? ( // diff
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                <svg
                                    className="w-6 h-6 text-white/40"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-white/60">
                                No Data Detected
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                                Waiting for temperature data...
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={thermalCoupleData}
                                margin={{
                                    top: 10,
                                    right: 30,
                                    left: 0,
                                    bottom: 50,
                                }}
                            >
                                <defs> // 2 linear gradients instead of 4
                                    <linearGradient
                                        id="colorChamber"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#F97316" // diff
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#F97316" // diff
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="colorNozzle"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#DC2626" // diff
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#DC2626" // diff
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                    <filter id="glowChamber">
                                        <feGaussianBlur
                                            stdDeviation="1"
                                            result="coloredBlur"
                                        />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <filter id="glowNozzle">
                                        <feGaussianBlur
                                            stdDeviation="1"
                                            result="coloredBlur"
                                        />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255,255,255,0.05)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="timestamp"
                                    stroke="rgba(255,255,255,0.3)"
                                    tick={{
                                        fill: "rgba(255,255,255,0.5)",
                                        fontSize: 10,
                                    }}
                                    interval="preserveStartEnd"
                                    allowDataOverflow={true}
                                    domain={["dataMin", "dataMax"]}
                                    axisLine={{
                                        stroke: "rgba(255,255,255,0.1)",
                                    }}
                                    tickLine={{
                                        stroke: "rgba(255,255,255,0.1)",
                                    }}
                                    tickCount={3}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.3)"
                                    tick={{
                                        fill: "rgba(255,255,255,0.5)",
                                        fontSize: 10,
                                    }}
                                    domain={[0, 800]}
                                    interval={0}
                                    ticks={[
                                        0, 100, 200, 300, 400, 500, 600,
                                        700, 800,
                                    ]}
                                    tickFormatter={(value) =>
                                        `${value.toFixed(0)}°C`
                                    }
                                    axisLine={{
                                        stroke: "rgba(255,255,255,0.1)",
                                    }}
                                    tickLine={{
                                        stroke: "rgba(255,255,255,0.1)",
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor:
                                            "rgba(17, 24, 39, 0.95)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "0.375rem",
                                        color: "white",
                                        boxShadow:
                                            "0 0 20px rgba(0,0,0,0.5)",
                                        backdropFilter: "blur(10px)",
                                    }}
                                    formatter={(value: number) => [
                                        `${value.toFixed(2)}°C`,
                                        "",
                                    ]}
                                    labelFormatter={(label) =>
                                        `Time: ${label}`
                                    }
                                    cursor={{
                                        stroke: "rgba(255,255,255,0.1)",
                                        strokeWidth: 1,
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{
                                        paddingTop: "10px",
                                        color: "rgba(255,255,255,0.7)",
                                    }}
                                    formatter={(value) => (
                                        <span className="text-xs font-medium tracking-wider">
                                            {value}
                                        </span>
                                    )}
                                    iconType="circle"
                                    iconSize={8}
                                />
                                <Line
                                    type="linear"
                                    dataKey="chamber"
                                    name="Chamber Temperature"
                                    stroke="#F97316"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#F97316', stroke: 'white', strokeWidth: 1 }}
                                    activeDot={{
                                        r: 4,
                                        fill: "#F97316",
                                        stroke: "white",
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={0}
                                    connectNulls={false}
                                />
                                <Line
                                    type="linear"
                                    dataKey="nozzle"
                                    name="Nozzle Temperature"
                                    stroke="#DC2626"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#DC2626', stroke: 'white', strokeWidth: 1 }}
                                    activeDot={{
                                        r: 4,
                                        fill: "#DC2626",
                                        stroke: "white",
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={0}
                                    connectNulls={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    )
}