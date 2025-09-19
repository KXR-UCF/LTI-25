import { LatestData } from "../interfaces"

interface TelemetryReadingsProps {
    latestData: LatestData;
    peakNetForce: number;
    peakPressure: number;
    mode: 'liquid' | 'solid';
}

export default function TelemetryReadings({
        latestData, peakNetForce, peakPressure, mode
    }: TelemetryReadingsProps) {
    return (
        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex-1">
            <div className="p-1 h-full flex flex-col">
            <h2 className="text-xs font-bold text-white/90 tracking-wider mb-1">MEASUREMENTS</h2>
            <div className={`flex-1 grid gap-x-0 gap-y-1 w-full ${mode === 'liquid' ? 'grid-cols-4' : 'grid-cols-2'}`}>
                {(mode === 'liquid' 
                    ? ['total', 'peakNetForce', 'weight', 'pressure', 'pt2', 'pt3', 'pt4', 'pt5', 'pt6', 'chamber', 'nozzle']
                    : ['total', 'pressure', 'peakNetForce', 'peakPressure']
                ).map((sensor) => (
                <div key={sensor} className="bg-gradient-to-b from-gray-900/40 to-gray-900/20 rounded-lg border border-white/10 p-0.5 shadow-[0_0_10px_rgba(255,255,255,0.05)] flex flex-col justify-between h-12">
                    <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-white tracking-wider leading-tight">
                        {sensor === 'total' ? 'NET FORCE' : 
                        sensor === 'pressure' ? 'PT1' : 
                        sensor === 'peakNetForce' ? 'PEAK NET' : 
                        sensor === 'peakPressure' ? 'PEAK PRES' :
                        sensor === 'weight' ? 'WEIGHT' :
                        sensor === 'pt2' ? 'PT2' :
                        sensor === 'pt3' ? 'PT3' :
                        sensor === 'pt4' ? 'PT4' :
                        sensor === 'pt5' ? 'PT5' :
                        sensor === 'pt6' ? 'PT6' :
                        sensor === 'chamber' ? 'CHAMBER' :
                        sensor === 'nozzle' ? 'NOZZLE' :
                        'UNKNOWN'}
                    </p>
                    <div className={`w-2 h-2 rounded-full flex items-center justify-center ${
                        latestData[sensor] ? 'bg-green-500/20 shadow-[0_0_2px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_2px_rgba(239,68,68,0.5)]'
                    }`}>
                        <div className={`w-1 h-1 rounded-full ${
                        latestData[sensor] ? 'bg-green-500 shadow-[0_0_2px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_2px_rgba(239,68,68,0.8)]'
                        }`}></div>
                    </div>
                    </div>
                    <div className="flex items-center justify-center py-0">
                    <div className="text-center">
                        <p className="text-xs font-bold text-white">
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
                    <p className="text-xs text-white/70 text-center pb-0.5">
                    {latestData[sensor] ? 'ACTIVE' : 'INACTIVE'}
                    </p>
                </div>
                ))}
            </div>
            </div>
        </div>
    )
}