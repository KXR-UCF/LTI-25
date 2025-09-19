import { useState, useMemo } from 'react';

import ContinuityTest from './ContinuityTest';
import LaunchKey from './LaunchKey';
import AbortSystem from './AbortSystem';
import LaunchButton from './LaunchButton';

interface SystemControlsProps {
    mode: 'liquid' | 'solid';
    switchStates?: any;
    toggleSwitch?: (switchName: string) => void;
    canLaunch?: boolean;
    handleLaunch?: () => void;
}

export default function SystemControls({ 
    mode, 
    switchStates: externalSwitchStates, 
    toggleSwitch: externalToggleSwitch, 
    canLaunch: externalCanLaunch, 
    handleLaunch: externalHandleLaunch 
}: SystemControlsProps) {

    const [internalSwitchStates, setInternalSwitchStates] = useState({
        continuity: false,
        launchKey: false,
        abort: false
    });

    // Use external state if provided (liquid mode), otherwise use internal state (solid mode)
    const switchStates = externalSwitchStates || internalSwitchStates;
    const toggleSwitch = externalToggleSwitch || ((switchName: string) => {
        setInternalSwitchStates(prev => ({
            ...prev,
            [switchName]: !prev[switchName]
        }));
    });
    const canLaunch = externalCanLaunch !== undefined ? externalCanLaunch : 
        (switchStates.continuity && switchStates.launchKey && !switchStates.abort);
    const handleLaunch = externalHandleLaunch || (() => console.log('Launch initiated'));
    
    return (
        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm flex-1">
            <div className="p-4 h-full flex flex-col">
                <div className="flex-none">
                    <h2 className="text-lg font-bold text-white/90 tracking-wider mb-4">SYSTEM CONTROLS</h2>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                    {mode === 'liquid' ? (
                        // Liquid mode controls - show all the switches from liquid-ui
                        <>
                            {/* System Switches */}
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                                {/* Switch 1 - NOX FILL */}
                                <div
                                    onClick={() => toggleSwitch("switch1")}
                                    className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                        switchStates.switch1
                                            ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-white tracking-wider">NOX FILL</p>
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                            switchStates.switch1 ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                switchStates.switch1 ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                            }`}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70">{switchStates.switch1 ? "ACTIVE" : "INACTIVE"}</p>
                                </div>

                                {/* Switch 2 - NOX VENT */}
                                <div
                                    onClick={() => toggleSwitch("switch2")}
                                    className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                        switchStates.switch2
                                            ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-white tracking-wider">NOX VENT</p>
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                            switchStates.switch2 ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                switchStates.switch2 ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                            }`}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70">{switchStates.switch2 ? "ACTIVE" : "INACTIVE"}</p>
                                </div>

                                {/* Switch 3 - NOX RELIEF */}
                                <div
                                    onClick={() => toggleSwitch("switch3")}
                                    className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                        switchStates.switch3
                                            ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-white tracking-wider">NOX RELIEF</p>
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                            switchStates.switch3 ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                switchStates.switch3 ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                            }`}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70">{switchStates.switch3 ? "ACTIVE" : "INACTIVE"}</p>
                                </div>

                                {/* Switch 4 - NITROGEN FILL */}
                                <div
                                    onClick={() => toggleSwitch("switch4")}
                                    className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                        switchStates.switch4
                                            ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-white tracking-wider">NITROGEN FILL</p>
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                            switchStates.switch4 ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                switchStates.switch4 ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                            }`}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70">{switchStates.switch4 ? "ACTIVE" : "INACTIVE"}</p>
                                </div>

                                {/* Switch 5 - NITROGEN VENT */}
                                <div
                                    onClick={() => toggleSwitch("switch5")}
                                    className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                        switchStates.switch5
                                            ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-white tracking-wider">NITROGEN VENT</p>
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                            switchStates.switch5 ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                switchStates.switch5 ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                            }`}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70">{switchStates.switch5 ? "ACTIVE" : "INACTIVE"}</p>
                                </div>

                                {/* Switch 6 - CONTINUITY TEST */}
                                <div
                                    onClick={() => toggleSwitch("switch6")}
                                    className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                        switchStates.switch6
                                            ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-white tracking-wider">CONTINUITY TEST</p>
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                            switchStates.switch6 ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                switchStates.switch6 ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                            }`}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70">{switchStates.switch6 ? "ACTIVE" : "INACTIVE"}</p>
                                </div>
                            </div>

                            {/* Launch Controls */}
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                                {/* Launch Key */}
                                <div
                                    onClick={() => toggleSwitch("launchKey")}
                                    className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                        switchStates.launchKey
                                            ? "bg-gradient-to-b from-green-900/40 to-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-white tracking-wider">LAUNCH KEY</p>
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                            switchStates.launchKey ? "bg-green-500/20 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                switchStates.launchKey ? "bg-green-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                            }`}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70">{switchStates.launchKey ? "ACTIVE" : "INACTIVE"}</p>
                                </div>

                                {/* Abort System */}
                                <div
                                    onClick={() => toggleSwitch("abort")}
                                    className={`flex flex-col p-3 rounded-lg transition-all duration-300 border cursor-pointer ${
                                        switchStates.abort
                                            ? "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            : "bg-gradient-to-b from-red-900/40 to-red-900/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-white tracking-wider">ABORT SYSTEM</p>
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                            switchStates.abort ? "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "bg-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                switchStates.abort ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                                            }`}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70">{switchStates.abort ? "ENGAGED" : "STANDBY"}</p>
                                </div>
                            </div>

                        </>
                    ) : (
                        // Solid mode controls - show original solid-ui controls
                        <>
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

                        </>
                    )}
                </div>
            </div>
        </div>
    )
}