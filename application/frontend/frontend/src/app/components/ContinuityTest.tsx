interface Components{
	toggleSwitch: (switchName: "launchKey" | "continuity" | "abort") => void;
    switchStates: {
        continuity: boolean;
        launchKey: boolean;
        abort: boolean;
    };
}

export default function ContinuityTest({toggleSwitch, switchStates}: Components){
	return(
    <div 
        onClick={() => toggleSwitch('continuity')}
        className={`flex flex-col p-4 rounded-lg transition-all duration-300 border cursor-pointer ${
            switchStates.continuity 
            ? 'bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
            : 'bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
        }`}
        >
        <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-white tracking-wider">CONTINUITY</p>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
            switchStates.continuity ? 'bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
            }`}>
            <div className={`w-2 h-2 rounded-full ${
                switchStates.continuity ? 'bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]'
            }`}></div>
            </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
            <p className="text-lg font-bold text-white">
            {switchStates.continuity ? 'ACTIVE' : 'INACTIVE'}
            </p>
        </div>
    </div>

	)
}