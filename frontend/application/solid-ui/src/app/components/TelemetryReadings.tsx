import { LatestData } from "../interfaces"

interface TelemetryReadingsProps {
    latestData: LatestData;
    peakNetForce: number;
    peakPressure: number;
}

export default function TelemetryReadings({
        latestData, peakNetForce, peakPressure
    }: TelemetryReadingsProps) {
    return (
        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex-1">
            <div className="p-2 h-full flex flex-col">
            <h2 className="text-lg font-bold text-white/90 tracking-wider mb-2">MEASUREMENTS</h2>
            <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                {['total', 'pressure', 'peakNetForce', 'peakPressure'].map((sensor) => (
                <div key={sensor} className="bg-gradient-to-b from-gray-900/40 to-gray-900/20 rounded-lg border border-white/10 p-2 shadow-[0_0_10px_rgba(255,255,255,0.05)] flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-white tracking-wider leading-tight">
                        {sensor === 'total' ? 'NET FORCE' : 
                        sensor === 'pressure' ? 'PRES' : 
                        sensor === 'peakNetForce' ? 'PEAK NET' : 
                        'PEAK PRES'}
                    </p>
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                        latestData[sensor] ? 'bg-green-500/20 shadow-[0_0_3px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_3px_rgba(239,68,68,0.5)]'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                        latestData[sensor] ? 'bg-green-500 shadow-[0_0_3px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_3px_rgba(239,68,68,0.8)]'
                        }`}></div>
                    </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm font-bold text-white">
                        {sensor === 'peakNetForce' ? peakNetForce.toFixed(2) :
                            sensor === 'peakPressure' ? peakPressure.toFixed(2) :
                            latestData[sensor] ? 
                            `${latestData[sensor].toFixed(2)}` : 
                            '--'}
                        </p>
                        <p className="text-xs text-white/70">
                        {sensor === 'pressure' || sensor === 'peakPressure' ? 'PSI' : 'N'}
                        </p>
                    </div>
                    </div>
                    <p className="text-xs text-white/70 text-center">
                    {latestData[sensor] ? 'ACTIVE' : 'INACTIVE'}
                    </p>
                </div>
                ))}
            </div>
            </div>
        </div>
    )
}