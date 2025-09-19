import { useMemo } from 'react'

interface LaunchButtonProps {
    switchStates: { continuity: boolean; launchKey: boolean; abort: boolean; };
}

export default function LaunchButton({
        switchStates
    }: LaunchButtonProps) {

    // Add toggle handler for switches
    const handleLaunch = () => {
        if (canLaunch) {
            console.log('Launch sequence initiated');
        }
    };

    // Calculate if launch is possible
    const canLaunch = useMemo(() => {
        return (
            switchStates.continuity &&
            switchStates.launchKey &&
            !switchStates.abort
        );
    }, [switchStates]);

    return (
        <button
            onClick={handleLaunch}
            disabled={!canLaunch}
            className={`col-span-2 w-full py-6 px-6 rounded-lg transition-all duration-300 ${
                canLaunch
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)]'
                : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-400 cursor-not-allowed'
            }`}
        >
            <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-bold tracking-wider">FIRE</span>
                {canLaunch && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                )}
            </div>
            <p className="text-sm text-center mt-3 opacity-75">
                {canLaunch ? 'All systems ready for launch' : 'Systems not ready'}
            </p>
        </button>       
    )
}