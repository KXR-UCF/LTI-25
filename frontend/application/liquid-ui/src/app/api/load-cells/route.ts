import { NextResponse } from 'next/server';

// Simulated load cell data with continuous values
function getLoadCellData() {
  return {
    cell1: 0,
    cell2: 0,
    cell3: 0,
    pressure: 0,
    timestamp: new Date().toLocaleTimeString()
  };
}

export async function GET() {
  return NextResponse.json(getLoadCellData());
} 