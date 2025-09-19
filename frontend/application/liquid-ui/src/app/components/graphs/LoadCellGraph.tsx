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

import { DataPoint } from "../../interfaces"

interface LoadCellGraphProps { 
    graphData: DataPoint[];
    completeGraphData: DataPoint[];
    exportCompleteChart: (data: any[], filename: string, isLoadCell: boolean) => Promise<void>;
}

export default function LoadCellGraph({
        graphData, completeGraphData, 
        exportCompleteChart
    }: LoadCellGraphProps) {

    const exportLoadCellChart = () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        exportCompleteChart(
            completeGraphData,
            `load-cell-complete-session-${timestamp}`,
            true
        );
    };

    return (
        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex flex-col">
            <div className="p-4 flex-none">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-white/90 tracking-wider">
                        LOAD CELL TELEMETRY
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={exportLoadCellChart} // diff
                            disabled={completeGraphData.length === 0}
                            className="px-3 py-1 text-xs bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors" // diff
                            title="Download Complete Load Cell Session as PNG" // diff
                        >
                            DOWNLOAD
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 pt-0">
                <div
                    id="load-cell-chart" // diff
                    className="relative h-full bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10"
                >
                    {graphData.length === 0 ? ( // diff
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
                                Waiting for telemetry data...
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={graphData}
                                margin={{
                                    top: 10,
                                    right: 30,
                                    left: 0,
                                    bottom: 50,
                                }}
                            >
                                <defs> // 4 linear gradients instead of 2
                                    <linearGradient
                                        id="colorTotal"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#3B82F6" // diff
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#3B82F6" // diff
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="colorCell1"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#10B981" // diff
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#10B981" // diff
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="colorCell2"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#F59E0B" // diff
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#F59E0B" // diff
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="colorCell3"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#EF4444" // diff
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#EF4444" // diff
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                    <filter id="glowTotal">
                                        <feGaussianBlur
                                            stdDeviation="1"
                                            result="coloredBlur"
                                        />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <filter id="glowCell1">
                                        <feGaussianBlur
                                            stdDeviation="1"
                                            result="coloredBlur"
                                        />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <filter id="glowCell2">
                                        <feGaussianBlur
                                            stdDeviation="1"
                                            result="coloredBlur"
                                        />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <filter id="glowCell3">
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
                                    ticks={[
                                        0, 100, 200, 300, 400, 500, 600,
                                        700, 800,
                                    ]}
                                    tickFormatter={(value) =>
                                        `${value.toFixed(0)} LBS`
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
                                        `${value.toFixed(2)} LBS`,
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
                                    type="basis"
                                    dataKey="cell1"
                                    name="Load Cell 1"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{
                                        r: 4,
                                        fill: "#10B981",
                                        stroke: "white",
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={0}
                                    connectNulls={true}
                                    filter="url(#glowCell1)"
                                />
                                <Line
                                    type="basis"
                                    dataKey="cell2"
                                    name="Load Cell 2"
                                    stroke="#F59E0B"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{
                                        r: 4,
                                        fill: "#F59E0B",
                                        stroke: "white",
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={0}
                                    connectNulls={true}
                                    filter="url(#glowCell2)"
                                />
                                <Line
                                    type="basis"
                                    dataKey="cell3"
                                    name="Load Cell 3"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{
                                        r: 4,
                                        fill: "#EF4444",
                                        stroke: "white",
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={0}
                                    connectNulls={true}
                                    filter="url(#glowCell3)"
                                />
                                <Line
                                    type="basis"
                                    dataKey="total"
                                    name="Net Force"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{
                                        r: 4,
                                        fill: "#3B82F6",
                                        stroke: "white",
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={0}
                                    connectNulls={true}
                                    filter="url(#glowTotal)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    )
}