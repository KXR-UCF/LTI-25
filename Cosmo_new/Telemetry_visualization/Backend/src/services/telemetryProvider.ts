// src/services/telemetryProvider.ts
import sql from '../db/client';
import { RawTelemetryRow } from '../types/telemetry';

/**
 * Fetches the single most recent telemetry record from QuestDB.
 * Uses ASOF JOIN to combine data from wanda1 and wanda2 tables.
 */
export async function fetchLatestTelemetry(): Promise<RawTelemetryRow | null> {
  try {
    // ASOF JOIN matches rows with closest timestamps from both tables
    const result = await sql<RawTelemetryRow[]>`
      SELECT
        w1.timestamp,
        w1.pt1, w1.pt2, w1.pt3, w1.pt4,
        w1.pt5, w1.pt6, w1.pt7, w1.pt8, w1.pt9, w1.pt25,
        w1.continuity_raw,
        w2.lc1, w2.lc2, w2.lc3, w2.lc4,
        w2.lc_net_force,
        w2.tc1, w2.tc2
      FROM wanda1 w1
      ASOF JOIN wanda2 w2
      ORDER BY w1.timestamp DESC
      LIMIT 1
    `;

    // If no data exists yet (fresh DB), return null
    if (!result || result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('QuestDB Query Error:', error);
    return null;
  }
}