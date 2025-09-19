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

export default function Graph() {
    return (
        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex flex-col">
            <div className="p-4 flex-none">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-white/90 tracking-wider">
                        {name}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={exportChart} // diff
                            disabled={completeData.length === 0}
                            className="px-3 py-1 text-xs bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors" // diff
                            title={`Download Complete ${name} Session as PNG`} // diff
                        >
                            DOWNLOAD
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 pt-0">
                <div
                    id={`${id}-chart`} // diff
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
    )
}