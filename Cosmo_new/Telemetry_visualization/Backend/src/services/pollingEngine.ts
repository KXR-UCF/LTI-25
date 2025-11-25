import fs from 'fs';
import { fetchLatestTelemetry } from './telemetryProvider';
import { SwitchStateManager } from './switchState';
import { TelemetryPacket } from '../types/telemetry';

const PIPE_PATH = '/tmp/switch_pipe';
// Continuity voltage threshold - if voltage exceeds this, circuit is complete
const CONTINUITY_THRESHOLD = 2.5; // Volts (adjust based on your ignition circuit)

export class PollingEngine {
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private switchManager: SwitchStateManager;
  private pipeFd: number | null = null;

  // Callback function to send data
  private onDataCallback: (packet: TelemetryPacket) => void;

  // Deduplication state tracking
  private lastBroadcastTimestamp: number = 0;
  private lastSwitchStateHash: string = '';
  private totalDuplicatesSkipped: number = 0;
  private totalBroadcasts: number = 0;

  constructor(onData: (packet: TelemetryPacket) => void) {
    this.onDataCallback = onData;
    this.switchManager = new SwitchStateManager();
    this.tryOpenPipe();
  }

  /**
   * Attempts to open the named pipe in NON-BLOCKING mode
   * If it fails (Python script not running), it just logs and continues.
   */
  private tryOpenPipe() {
    try {
      if (fs.existsSync(PIPE_PATH)) {
        // O_RDONLY | O_NONBLOCK is critical for NFR-P2
        this.pipeFd = fs.openSync(PIPE_PATH, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
        console.log('Connected to Switch Pipe');
      }
    } catch (err) {
      console.warn('Failed to open pipe (will retry):', err);
    }
  }

  /**
   * Read switch messages without blocking the loop.
   */
  private readPipe() {
    if (this.pipeFd === null) {
      // Try to reconnect periodically if pipe was missing
      this.tryOpenPipe();
      return;
    }

    try {
      const buffer = Buffer.alloc(1024); // Small buffer for speed
      const bytesRead = fs.readSync(this.pipeFd, buffer, 0, 1024, null);
      
      if (bytesRead > 0) {
        const data = buffer.toString('utf8', 0, bytesRead);
        // Pipe might send multiple messages separated by newline
        const messages = data.split('\n');
        messages.forEach(msg => this.switchManager.parseAndUpdate(msg));
      }
    } catch (err: any) {
      // Handle EAGAIN (Resource temporarily unavailable) - means no data waiting
      if (err.code === 'EAGAIN' || err.code === 'EWOULDBLOCK') {
        return; 
      }
      console.error('Pipe Read Error:', err.message);
      // If pipe broke, close fd so we try to reopen next time
      try { fs.closeSync(this.pipeFd!); } catch {}
      this.pipeFd = null;
    }
  }

  /**
   * The Self-Correcting 60Hz Loop
   */
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('Polling Engine Started (60Hz Target)');
    this.tick();
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.pipeFd) fs.closeSync(this.pipeFd);
  }

  /**
   * Get deduplication statistics for monitoring
   */
  public getStats() {
    return {
      broadcastCount: this.totalBroadcasts,
      duplicateCount: this.totalDuplicatesSkipped,
      lastTimestamp: this.lastBroadcastTimestamp,
    };
  }

  private async tick() {
    if (!this.isRunning) return;

    const startTime = performance.now();

    // 1. Read Switches (Fast, Synchronous, Non-blocking)
    this.readPipe();

    // 2. Fetch Telemetry (Async DB Query)
    const telemetryRow = await fetchLatestTelemetry();

    // 3. Merge & Emit (with deduplication)
    if (telemetryRow) {
      const currentTimestamp = telemetryRow.timestamp.getTime();
      const currentSwitches = this.switchManager.getState();

      // Override continuity based on telemetry voltage threshold
      // continuity_raw is analog voltage - if above threshold, circuit is complete
      currentSwitches.continuity = telemetryRow.continuity_raw > CONTINUITY_THRESHOLD;

      const currentSwitchHash = JSON.stringify(currentSwitches);

      // Check if either telemetry OR switches have changed
      const telemetryChanged = currentTimestamp !== this.lastBroadcastTimestamp;
      const switchesChanged = currentSwitchHash !== this.lastSwitchStateHash;

      if (telemetryChanged || switchesChanged) {
        // Update tracking state
        this.lastBroadcastTimestamp = currentTimestamp;
        this.lastSwitchStateHash = currentSwitchHash;

        // Build and broadcast packet
        const packet: TelemetryPacket = {
          timestamp: currentTimestamp,
          telemetry: [
            // IDs mirror database column names exactly
            { id: 'pt1', value: telemetryRow.pt1 },
            { id: 'pt2', value: telemetryRow.pt2 },
            { id: 'pt3', value: telemetryRow.pt3 },
            { id: 'pt4', value: telemetryRow.pt4 },
            { id: 'pt5', value: telemetryRow.pt5 },
            { id: 'pt6', value: telemetryRow.pt6 },
            { id: 'pt7', value: telemetryRow.pt7 },
            { id: 'pt8', value: telemetryRow.pt8 },
            { id: 'lc1', value: telemetryRow.lc1 },
            { id: 'lc2', value: telemetryRow.lc2 },
            { id: 'lc3', value: telemetryRow.lc3 },
            { id: 'lc4', value: telemetryRow.lc4 },
            { id: 'lc_net_force', value: telemetryRow.lc_net_force },
            { id: 'tc1', value: telemetryRow.tc1 },
            { id: 'tc2', value: telemetryRow.tc2 },
          ],
          switches: currentSwitches,
        };

        this.onDataCallback(packet);
        this.totalBroadcasts++;
      } else {
        // Skip duplicate - neither telemetry nor switches changed
        this.totalDuplicatesSkipped++;
      }
    }

    // 4. Calculate Drift & Schedule Next
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    const targetInterval = 16.67; // 60Hz
    
    // If we took 5ms, wait 11.67ms. If we took 20ms, wait 0ms (run immediately).
    const nextDelay = Math.max(0, targetInterval - executionTime);

    this.timer = setTimeout(() => this.tick(), nextDelay);
  }
}