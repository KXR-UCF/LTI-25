import { Dispatch, SetStateAction } from "react"

import { DataPoint, ThermalCoupleDataPoint } from "../../interfaces";

import LoadCellGraph from "./LoadCellGraph";
import ThermalCoupleGraph from "./ThermalCoupleGraph"

interface GraphsProps { 
    graphData: DataPoint[];
    setGraphData: Dispatch<SetStateAction<DataPoint[]>>;
    completeGraphData: DataPoint[];
    
    thermalCoupleData: ThermalCoupleDataPoint[];
    setThermalCoupleData: Dispatch<ThermalCoupleDataPoint[]>; 
    completeThermalData: ThermalCoupleDataPoint[]; 
}

export default function Graphs({
        graphData, setGraphData, completeGraphData,
        thermalCoupleData, setThermalCoupleData, completeThermalData
    }: GraphsProps) {

    // Chart export function - captures complete chart including legends using SVG method
    const exportCompleteChart = async (
        data: any[],
        filename: string,
        isLoadCell: boolean
    ) => {
        try {
            if (data.length === 0) return;

            if (isLoadCell) {
                const originalData = graphData;
                setGraphData(completeGraphData);

                setTimeout(() => {
                    const chartContainer =
                        document.getElementById("load-cell-chart");
                    if (!chartContainer) return;

                    const svgElement = chartContainer.querySelector("svg");
                    const legendElement = chartContainer.querySelector(
                        ".recharts-legend-wrapper"
                    );

                    if (svgElement) {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");

                        if (ctx) {
                            canvas.width = 1200 * 2;
                            canvas.height = 650 * 2;
                            ctx.scale(2, 2);
                            ctx.fillStyle = "#111827";
                            ctx.fillRect(0, 0, 1200, 650);

                            const svgData =
                                new XMLSerializer().serializeToString(
                                    svgElement
                                );
                            const svgBlob = new Blob([svgData], {
                                type: "image/svg+xml;charset=utf-8",
                            });
                            const svgUrl = URL.createObjectURL(svgBlob);

                            const img = document.createElement(
                                "img"
                            ) as HTMLImageElement;
                            img.onload = () => {
                                ctx.drawImage(img, 0, 0, 1200, 600);

                                // Add load cell legends manually
                                if (legendElement) {
                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.font = "12px Arial";
                                    ctx.fillText("Load Cell 1", 50, 620);
                                    ctx.fillStyle = "#10B981";
                                    ctx.beginPath();
                                    ctx.arc(40, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();

                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.fillText("Load Cell 2", 150, 620);
                                    ctx.fillStyle = "#F59E0B";
                                    ctx.beginPath();
                                    ctx.arc(140, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();

                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.fillText("Load Cell 3", 250, 620);
                                    ctx.fillStyle = "#EF4444";
                                    ctx.beginPath();
                                    ctx.arc(240, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();

                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.fillText("Net Force", 350, 620);
                                    ctx.fillStyle = "#3B82F6";
                                    ctx.beginPath();
                                    ctx.arc(340, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();
                                }

                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        const url = URL.createObjectURL(blob);
                                        const link =
                                            document.createElement("a");
                                        link.href = url;
                                        link.download = `${filename}.png`;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                    }
                                });

                                URL.revokeObjectURL(svgUrl);
                                setGraphData(originalData);
                            };
                            img.src = svgUrl;
                        }
                    }
                }, 500);
            } else {
                const originalData = thermalCoupleData;
                setThermalCoupleData(completeThermalData);

                setTimeout(() => {
                    const chartContainer =
                        document.getElementById("thermal-chart");
                    if (!chartContainer) return;

                    const svgElement = chartContainer.querySelector("svg");
                    const legendElement = chartContainer.querySelector(
                        ".recharts-legend-wrapper"
                    );

                    if (svgElement) {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");

                        if (ctx) {
                            canvas.width = 1200 * 2;
                            canvas.height = 650 * 2;
                            ctx.scale(2, 2);
                            ctx.fillStyle = "#111827";
                            ctx.fillRect(0, 0, 1200, 650);

                            const svgData =
                                new XMLSerializer().serializeToString(
                                    svgElement
                                );
                            const svgBlob = new Blob([svgData], {
                                type: "image/svg+xml;charset=utf-8",
                            });
                            const svgUrl = URL.createObjectURL(svgBlob);

                            const img = document.createElement(
                                "img"
                            ) as HTMLImageElement;
                            img.onload = () => {
                                ctx.drawImage(img, 0, 0, 1200, 600);

                                // Add thermal legends manually
                                if (legendElement) {
                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.font = "12px Arial";
                                    ctx.fillText(
                                        "Chamber Temperature",
                                        50,
                                        620
                                    );
                                    ctx.fillStyle = "#F97316";
                                    ctx.beginPath();
                                    ctx.arc(40, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();

                                    ctx.fillStyle = "rgba(255,255,255,0.7)";
                                    ctx.fillText(
                                        "Nozzle Temperature",
                                        200,
                                        620
                                    );
                                    ctx.fillStyle = "#DC2626";
                                    ctx.beginPath();
                                    ctx.arc(190, 616, 4, 0, 2 * Math.PI);
                                    ctx.fill();
                                }

                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        const url = URL.createObjectURL(blob);
                                        const link =
                                            document.createElement("a");
                                        link.href = url;
                                        link.download = `${filename}.png`;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                    }
                                });

                                URL.revokeObjectURL(svgUrl);
                                setThermalCoupleData(originalData);
                            };
                            img.src = svgUrl;
                        }
                    }
                }, 500);
            }
        } catch (error) {
            console.error("Error exporting complete chart:", error);
        }
    };

    return (
        <div className="lg:col-span-3 grid grid-rows-2 gap-2">
            {/* Load Cell Graph */}
            <LoadCellGraph 
                graphData = { graphData }
                completeGraphData = { completeGraphData }
                exportCompleteChart = { exportCompleteChart }
            />

            {/* Thermal Couple Graph */}
            
            <ThermalCoupleGraph
                thermalCoupleData = { thermalCoupleData }
                completeThermalData = { completeThermalData }
                exportCompleteChart = { exportCompleteChart }
            />
        </div>
    );
}
