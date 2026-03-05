// src/services/telemetryProvider.ts
import sql from '../db/client';
import { RawTelemetryRow } from '../types/telemetry';

/**
 * Fetches the single most recent telemetry record from QuestDB.
 * Uses a bounded ASOF JOIN window for fast, time-aligned readings.
 */
export async function fetchLatestTelemetry(): Promise<RawTelemetryRow | null> {
  try {
    const result = await sql`
      SELECT
        w1.timestamp,
        w1.pt1, w1.pt2, w1.pt3, w1.pt4,
        w1.pt5, w1.pt6, w1.pt7, w1.pt8,
        w1.pt9, w1.pt25,
        w1.continuity_raw,
        w2.lc1, w2.lc2, w2.lc3, w2.lc4,
        w2.lc_net_force,
        w2.tc1, w2.tc2
      FROM wanda1 w1
      ASOF JOIN wanda2 w2
      WHERE w1.timestamp > dateadd('s', -1, now())
      ORDER BY w1.timestamp DESC
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0];

    return {
      timestamp: row.timestamp,
      pt1: row.pt1, pt2: row.pt2, pt3: row.pt3, pt4: row.pt4,
      pt5: row.pt5, pt6: row.pt6, pt7: row.pt7, pt8: row.pt8,
      pt9: row.pt9, pt25: row.pt25,
      continuity_raw: row.continuity_raw,
      lc1: row.lc1 ?? 0, lc2: row.lc2 ?? 0,
      lc3: row.lc3 ?? 0, lc4: row.lc4 ?? 0,
      lc_net_force: row.lc_net_force ?? 0,
      tc1: row.tc1 ?? 0, tc2: row.tc2 ?? 0,
    } as RawTelemetryRow;
  } catch (error) {
    console.error('QuestDB Query Error:', error);
    return null;
  }
}
