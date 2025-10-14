"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import SolidUI from "@/components/SolidUI";
import LiquidUI from "@/components/LiquidUI";
import { useState, useEffect } from 'react';

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

export default function Home() {
  const [telemetryData, setTelemetryData] = useState<TelemetryRow[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Mock data for testing (remove this when connecting to real WebSocket)
  useEffect(() => {
    setConnectionStatus('connected');
    const interval = setInterval(() => {
      const now = Date.now();
      setTelemetryData(prev => {
        const newData = [...prev];
        if (newData.length > 100) newData.shift();
        newData.push({
          timestamp: new Date(now).toISOString(),
          cell1_force: Math.random() * 500,
          cell2_force: Math.random() * 500,
          cell3_force: Math.random() * 500,
          net_force: Math.random() * 1000,
          pressure_pt1: Math.random() * 2000,
          pressure_pt2: Math.random() * 2000,
          pressure_pt3: Math.random() * 2000,
          pressure_pt4: Math.random() * 2000,
          pressure_pt5: Math.random() * 2000,
          pressure_pt6: Math.random() * 2000,
          weight_load_cell: Math.random() * 300,
          chamber_temp: Math.random() * 600,
          nozzle_temp: Math.random() * 700,
        });
        return newData;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-4">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      <Tabs defaultValue="solid" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto mb-4 grid-cols-2">
          <TabsTrigger value="solid">Solid Motor</TabsTrigger>
          <TabsTrigger value="liquid">Liquid Motor</TabsTrigger>
        </TabsList>
        <TabsContent value="solid">
          <SolidUI telemetryData={telemetryData} connectionStatus={connectionStatus} />
        </TabsContent>
        <TabsContent value="liquid">
          <LiquidUI telemetryData={telemetryData} connectionStatus={connectionStatus} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
