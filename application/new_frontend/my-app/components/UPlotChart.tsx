"use client";

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

interface UPlotChartProps {
  data: uPlot.AlignedData;
  options: uPlot.Options;
  onCreate?: (chart: uPlot) => void;
  onDelete?: (chart: uPlot) => void;
}

export default function UPlotChart({ data, options, onCreate, onDelete }: UPlotChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotInstance = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Create new chart instance
    plotInstance.current = new uPlot(options, data, chartRef.current);

    if (onCreate) {
      onCreate(plotInstance.current);
    }

    return () => {
      if (plotInstance.current) {
        if (onDelete) {
          onDelete(plotInstance.current);
        }
        plotInstance.current.destroy();
        plotInstance.current = null;
      }
    };
  }, []); // Only create once on mount

  useEffect(() => {
    // Update data when it changes
    if (plotInstance.current && data) {
      plotInstance.current.setData(data);
    }
  }, [data]);

  return <div ref={chartRef} className="w-full h-full" />;
}
