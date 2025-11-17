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
  const containerRef = useRef<HTMLDivElement>(null);
  const plotInstance = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Measure container size and use 95% of it for breathing room
    const width = containerRef.current.offsetWidth * 0.95;
    const height = containerRef.current.offsetHeight * 0.95;

    // Don't create chart if container has no size
    if (width === 0 || height === 0) return;

    // Destroy existing instance if it exists
    if (plotInstance.current) {
      if (onDelete) {
        onDelete(plotInstance.current);
      }
      plotInstance.current.destroy();
    }

    // Create chart with 95% of container dimensions (override any width/height in options)
    const responsiveOptions = {
      ...options,
      width: Math.floor(width),
      height: Math.floor(height),
    };

    plotInstance.current = new uPlot(responsiveOptions, data, containerRef.current);

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
  }, [options]); // Recreate when options change (including theme)

  useEffect(() => {
    // Update data when it changes (without recreating chart)
    if (plotInstance.current && data) {
      plotInstance.current.setData(data);
    }
  }, [data]);

  useEffect(() => {
    // Handle window resize to dynamically resize charts
    const handleResize = () => {
      if (!containerRef.current || !plotInstance.current) return;

      const width = containerRef.current.offsetWidth * 0.95;
      const height = containerRef.current.offsetHeight * 0.95;

      if (width > 0 && height > 0) {
        plotInstance.current.setSize({
          width: Math.floor(width),
          height: Math.floor(height),
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full flex items-center justify-center" />;
}
