import { type TelemetryRow } from "../interfaces"


interface UIProps {
    telemetryData: TelemetryRow[];
    connectionStatus: "disconnected" | "connecting" | "connected";
}

export default function UI({
    telemetryData,
    connectionStatus,
}: UIProps) {
    return (
        <>
        
        </>
    )
}