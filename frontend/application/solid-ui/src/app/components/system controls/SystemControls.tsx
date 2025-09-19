import { useState, useMemo } from 'react';

import ContinuityTest from './ContinuityTest';
import LaunchKey from './LaunchKey';
import AbortSystem from './AbortSystem';
import LaunchButton from './LaunchButton';

export default function SystemControls() {

    const [switchStates, setSwitchStates] = useState({
        continuity: false,
        launchKey: false,
        abort: false
    });

    // Add toggle handler for switches
    const toggleSwitch = (switchName: keyof typeof switchStates) => {
        setSwitchStates(prev => ({
            ...prev,
            [switchName]: !prev[switchName]
        }));
    };
    
    return (
        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex-1">
            <div className="p-4 h-full flex flex-col">
                <div className="flex-none">
                    <h2 className="text-lg font-bold text-white/90 tracking-wider mb-4">SYSTEM CONTROLS</h2>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                    {/* Continuity Test */}
                    <ContinuityTest 
                        toggleSwitch = { toggleSwitch }
                        switchStatesContinuityTest = { switchStates.continuity }
                    />

                    {/* Launch Key */}
                    <LaunchKey
                        toggleSwitch = { toggleSwitch }
                        switchStatesLaunchKey = { switchStates.launchKey }
                    />

                    {/* Abort System */}
                    <AbortSystem
                        toggleSwitch = { toggleSwitch }
                        switchStatesAbortSystem = { switchStates.abort }
                    />

                    {/* Launch Button */}
                    <LaunchButton
                        switchStates = { switchStates }
                    />
                </div>
            </div>
        </div>
    )
}