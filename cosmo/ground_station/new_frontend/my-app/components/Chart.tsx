import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import UPlotChart from "./UPlotChart";

interface TelemetryRow {
  timestamp: string;
  cell1_force: number | null;
  cell2_force: number | null;
  cell3_force: number | null;
  net_force: number | null;
  pressure_pt1: number | null;
  pressure_pt2: number | null;
  pressure_pt3: number | null;
  pressure_pt4: number | null;
  pressure_pt5: number | null;
  pressure_pt6: number | null;
  weight_load_cell: number | null;
  chamber_temp: number | null;
  nozzle_temp: number | null;
}

interface ChartProps {
  name: string;
  isDark: boolean;
  chartClass: string;
  axisLabel: string;
  axisUnit: string;
  yMin: number;
  yMax: number;
  recordingState: 'idle' | 'recording' | 'stopped';
  lines: {
    label: string;
    stroke: string;
    width: number;
  }[];
  telemetryData: TelemetryRow[];
  data: uPlot.AlignedData;
}

const Chart = ({
  name,
  isDark,
  chartClass,
  axisLabel,
  axisUnit,
  yMin,
  yMax,
  recordingState,
  lines,
  telemetryData,
  data,
}: ChartProps) => {
  const options = useMemo((): uPlot.Options => {
    return {
      width: 1000,
      height: 400,
      class: chartClass,
      cursor: {
        drag: {
          x: true,
          y: true,
          uni: 50,
        },
        sync: {
          key: "telemetry",
        },
      },
      scales: {
        x: {
          time: false,
          range: (u, min, max) => {
            if (recordingState === 'idle' || recordingState === 'recording') {
              // 30-second sliding window for both idle and recording
              if (max <= 30) {
                return [0, 30];
              } else {
                return [max - 30, max];
              }
            } else {
              // recordingState === 'stopped': show full range
              return [0, max];
            }
          },
        },
        y: {
          range: [yMin, yMax],
        },
      },
      axes: [
        {
          label: "Runtime (s)",
          stroke: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.6)",
          grid: {
            stroke: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)",
            width: 1,
          },
          splits: (u) => {
            const min = Math.floor(u.scales.x.min || 0);
            const max = Math.ceil(u.scales.x.max || 10);
            const range = max - min;

            // Dynamically adjust interval based on range to prevent overcrowding
            let interval = 1;
            if (range > 30) interval = 2;
            if (range > 60) interval = 5;
            if (range > 120) interval = 10;

            const splits = [];
            const start = Math.floor(min / interval) * interval;
            for (let i = start; i <= max; i += interval) {
              splits.push(i);
            }
            return splits;
          },
        },
        {
          label: axisLabel,
          stroke: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.6)",
          grid: {
            stroke: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)",
            width: 1,
          },
          values: (u, vals) => vals.map((v) => v + axisUnit),
          labelGap: 10,
        },
      ],
      series: [{ label: "Time" }, ...lines],
      legend: {
        show: true,
      },
    };
  }, [isDark, recordingState]);

  return (
    <>
      <Card className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold tracking-wider">
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px] 2xl:h-[550px]">
          {telemetryData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-gray-400 dark:text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-white/60">
                No Data Detected
              </p>
              <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                Waiting for telemetry data...
              </p>
            </div>
          ) : (
            <UPlotChart data={data} options={options} />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Chart;
