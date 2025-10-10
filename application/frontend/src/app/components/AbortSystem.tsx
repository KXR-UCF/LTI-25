interface Components{
	toggleSwitch: (switchName: "launchKey" | "continuity" | "abort") => void;
    switchStates: {
        continuity: boolean;
        launchKey: boolean;
        abort: boolean;
    };
}

export default function AbortSystem({toggleSwitch, switchStates}: Components){
	return(
        <div 
            onClick={() => toggleSwitch('abort')}
            className={`col-span-2 flex flex-col p-4 rounded-lg transition-all duration-300 border cursor-pointer ${
                switchStates.abort 
                ? 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
            }`}
            >
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-white tracking-wider">ABORT SYSTEM</p>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    switchStates.abort ? 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                    }`}>
                <div className={`w-2 h-2 rounded-full ${
                    switchStates.abort ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                    }`}>
                </div>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <p className="text-lg font-bold text-white">
                {switchStates.abort ? 'ENGAGED' : 'STANDBY'}
                </p>
            </div>
        </div>
	)
}