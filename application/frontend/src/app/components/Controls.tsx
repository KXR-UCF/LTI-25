import LaunchKey from "./LaunchKey";
import AbortSystem from "./AbortSystem";
import LaunchButton from "./LaunchButton";
import ContinuityTest from "./ContinuityTest";
import { useState } from "react";

function Controls() {
    const [switchStates, setSwitchStates] = useState({
        continuity: false,
        launchKey: false,
        abort: false,
    });

    const toggleSwitch = (switchName: keyof typeof switchStates) => {
        setSwitchStates((prev) => ({
            ...prev,
            [switchName]: !prev[switchName],
        }));
    };

    return (
        <>
            {/* Continuity Test */}
            <ContinuityTest
                toggleSwitch={toggleSwitch}
                switchStates={switchStates}
            />

            {/* Launch Key */}
            <LaunchKey
                toggleSwitch={toggleSwitch}
                switchStates={switchStates}
            />

            {/* Abort System */}
            <AbortSystem
                toggleSwitch={toggleSwitch}
                switchStates={switchStates}
            />

            {/* Launch Button */}
            <LaunchButton 
                switchStates = { switchStates }
            />
        </>
    );
}

export default Controls