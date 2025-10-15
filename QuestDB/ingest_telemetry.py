#!/usr/bin/env python3
"""
QuestDB Telemetry Data Ingestion Script
Ingests telemetry data at 60 samples per second for a specified duration.
"""

import time
import random
import math
from datetime import datetime
from questdb.ingress import Sender
import argparse


# QuestDB connection configuration
QUESTDB_CONF = (
    'http::addr=localhost:9000;'
    'username=admin;'
    'password=quest;'
    'auto_flush=off;'  # Manual flush for better control at 60Hz
)

# Target sampling rate
SAMPLES_PER_SECOND = 60
SAMPLE_INTERVAL = 1.0 / SAMPLES_PER_SECOND  # ~16.67ms per sample

# Rocket burn profile parameters
IGNITION_TIME = 2.0      # Ramp up time (seconds)
BURN_TIME = 20.0         # Steady burn duration (seconds)
SHUTDOWN_TIME = 1.5      # Shutdown time (seconds)
TOTAL_BURN_TIME = IGNITION_TIME + BURN_TIME + SHUTDOWN_TIME

# Performance parameters
MAX_THRUST = 800.0       # Peak thrust in Newtons
MAX_PRESSURE = 2000.0    # Peak chamber pressure in PSI
MAX_CHAMBER_TEMP = 2800.0  # Peak chamber temp in °C
MAX_NOZZLE_TEMP = 1500.0   # Peak nozzle temp in °C

# Noise levels (to simulate real sensor noise)
FORCE_NOISE = 5.0        # ±5N
PRESSURE_NOISE = 20.0    # ±20 PSI
TEMP_NOISE = 10.0        # ±10°C


def rocket_burn_profile(t, duration_seconds):
    """
    Generate realistic rocket motor burn profile.

    Returns a value between 0 and 1 representing the burn intensity at time t.

    Phases:
    1. Ignition (0 to IGNITION_TIME): Rapid ramp up
    2. Steady burn (IGNITION_TIME to IGNITION_TIME+BURN_TIME): Steady with slight variations
    3. Shutdown (after BURN_TIME): Rapid decay
    4. Post-burn: Zero
    """
    if t < 0:
        return 0.0

    # Phase 1: Ignition - smooth S-curve ramp up
    if t < IGNITION_TIME:
        # Smooth sigmoid curve for ignition
        progress = t / IGNITION_TIME
        return 0.5 * (1 + math.tanh(8 * (progress - 0.5)))

    # Phase 2: Steady burn with slight oscillations
    elif t < IGNITION_TIME + BURN_TIME:
        burn_progress = (t - IGNITION_TIME) / BURN_TIME
        # 100% thrust with slight sinusoidal variations
        base = 1.0
        # Add some realistic oscillations (combustion instabilities)
        oscillation = 0.02 * math.sin(10 * t) + 0.01 * math.sin(23 * t)
        # Slight decay over time (propellant consumption)
        decay = 1.0 - 0.05 * burn_progress
        return (base + oscillation) * decay

    # Phase 3: Shutdown - rapid exponential decay
    elif t < IGNITION_TIME + BURN_TIME + SHUTDOWN_TIME:
        shutdown_progress = (t - IGNITION_TIME - BURN_TIME) / SHUTDOWN_TIME
        return math.exp(-5 * shutdown_progress)

    # Phase 4: Post-burn
    else:
        return 0.0


def generate_sample_data(elapsed_time, duration_seconds):
    """
    Generate realistic rocket motor telemetry data.
    Simulates a complete burn cycle with ignition, steady burn, and shutdown.
    """
    # Get burn profile intensity (0 to 1)
    intensity = rocket_burn_profile(elapsed_time, duration_seconds)

    # Add sensor noise
    def add_noise(value, noise_level):
        return max(0, value + random.uniform(-noise_level, noise_level))

    # Load cells: Simulate 3 cells measuring thrust
    # Cells have slight variations due to mounting position
    cell1_base = MAX_THRUST * intensity * 0.33
    cell2_base = MAX_THRUST * intensity * 0.35
    cell3_base = MAX_THRUST * intensity * 0.32

    cell1_force = add_noise(cell1_base, FORCE_NOISE)
    cell2_force = add_noise(cell2_base, FORCE_NOISE)
    cell3_force = add_noise(cell3_base, FORCE_NOISE)
    net_force = cell1_force + cell2_force + cell3_force

    # Chamber pressure: Correlates with thrust
    chamber_pressure = add_noise(MAX_PRESSURE * intensity, PRESSURE_NOISE)

    # Multiple pressure transducers with slight offsets
    pressure_pt1 = chamber_pressure
    pressure_pt2 = add_noise(chamber_pressure * 0.95, PRESSURE_NOISE * 0.5)
    pressure_pt3 = add_noise(chamber_pressure * 0.98, PRESSURE_NOISE * 0.5)
    pressure_pt4 = add_noise(chamber_pressure * 0.4, PRESSURE_NOISE * 0.3)  # Downstream
    pressure_pt5 = add_noise(chamber_pressure * 0.2, PRESSURE_NOISE * 0.2)  # Nozzle throat
    pressure_pt6 = add_noise(chamber_pressure * 0.05, PRESSURE_NOISE * 0.1) # Ambient

    # Temperatures: Lag behind thrust due to thermal mass
    # Temperature rises slower than thrust
    temp_lag_factor = min(1.0, elapsed_time / 5.0)  # Takes 5s to reach full temp
    chamber_temp = add_noise(MAX_CHAMBER_TEMP * intensity * temp_lag_factor, TEMP_NOISE)
    nozzle_temp = add_noise(MAX_NOZZLE_TEMP * intensity * temp_lag_factor, TEMP_NOISE)

    # Weight (propellant consumption): Decreases over time during burn
    if intensity > 0.1:
        consumed_weight = (elapsed_time / TOTAL_BURN_TIME) * 100  # 100g consumed
    else:
        consumed_weight = 0
    weight_load_cell = max(0, 500 - consumed_weight)

    return {
        'cell1_force': round(cell1_force, 2),
        'cell2_force': round(cell2_force, 2),
        'cell3_force': round(cell3_force, 2),
        'net_force': round(net_force, 2),
        'pressure_pt1': round(pressure_pt1, 2),
        'pressure_pt2': round(pressure_pt2, 2),
        'pressure_pt3': round(pressure_pt3, 2),
        'pressure_pt4': round(pressure_pt4, 2),
        'pressure_pt5': round(pressure_pt5, 2),
        'pressure_pt6': round(pressure_pt6, 2),
        'weight_load_cell': round(weight_load_cell, 2),
        'chamber_temp': round(chamber_temp, 2),
        'nozzle_temp': round(nozzle_temp, 2)
    }


def ingest_telemetry(duration_seconds, batch_size=10):
    """
    Ingest telemetry data at 60 samples per second.

    Args:
        duration_seconds: How long to run the ingestion (seconds)
        batch_size: Number of rows to batch before flushing (default: 10, i.e., ~167ms)
    """
    total_samples = duration_seconds * SAMPLES_PER_SECOND
    samples_sent = 0

    print(f"Starting telemetry ingestion:")
    print(f"  - Duration: {duration_seconds} seconds")
    print(f"  - Target rate: {SAMPLES_PER_SECOND} samples/second")
    print(f"  - Total samples: {total_samples}")
    print(f"  - Batch size: {batch_size} rows")
    print(f"  - Sample interval: {SAMPLE_INTERVAL*1000:.2f}ms\n")

    try:
        with Sender.from_conf(QUESTDB_CONF) as sender:
            print("Connected to QuestDB\n")

            start_time = time.time()
            next_sample_time = start_time
            last_report_time = start_time

            while samples_sent < total_samples:
                # Calculate elapsed time for this sample
                elapsed_time = samples_sent / SAMPLES_PER_SECOND

                # Generate and send sample
                data = generate_sample_data(elapsed_time, duration_seconds)

                sender.row(
                    'telemetry_data',
                    columns=data,
                    at=datetime.now()
                )

                samples_sent += 1

                # Flush batch periodically
                if samples_sent % batch_size == 0:
                    sender.flush()

                # Progress reporting every second
                current_time = time.time()
                if current_time - last_report_time >= 1.0:
                    elapsed = current_time - start_time
                    actual_rate = samples_sent / elapsed
                    progress = (samples_sent / total_samples) * 100
                    print(f"Progress: {progress:.1f}% | "
                          f"Samples: {samples_sent}/{total_samples} | "
                          f"Rate: {actual_rate:.1f} samples/sec")
                    last_report_time = current_time

                # Precise timing control
                next_sample_time += SAMPLE_INTERVAL
                sleep_time = next_sample_time - time.time()

                if sleep_time > 0:
                    time.sleep(sleep_time)
                elif sleep_time < -SAMPLE_INTERVAL:
                    # If we're falling behind by more than one interval, resync
                    print(f"Warning: Falling behind schedule by {-sleep_time*1000:.1f}ms")
                    next_sample_time = time.time()

            # Final flush
            sender.flush()

            # Final statistics
            total_time = time.time() - start_time
            actual_rate = samples_sent / total_time

            print(f"\n{'='*60}")
            print(f"Ingestion Complete!")
            print(f"  - Total samples sent: {samples_sent}")
            print(f"  - Total time: {total_time:.2f} seconds")
            print(f"  - Actual rate: {actual_rate:.2f} samples/second")
            print(f"  - Target rate: {SAMPLES_PER_SECOND} samples/second")
            print(f"  - Accuracy: {(actual_rate/SAMPLES_PER_SECOND)*100:.2f}%")
            print(f"{'='*60}\n")

    except KeyboardInterrupt:
        print(f"\n\nInterrupted by user after {samples_sent} samples")
    except Exception as e:
        print(f"\nError during ingestion: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(
        description='Ingest telemetry data into QuestDB at 60 samples per second'
    )
    parser.add_argument(
        'duration',
        type=int,
        help='Duration to run ingestion in seconds'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=10,
        help='Number of rows to batch before flushing (default: 10)'
    )

    args = parser.parse_args()

    if args.duration <= 0:
        print("Error: Duration must be positive")
        return

    ingest_telemetry(args.duration, args.batch_size)


if __name__ == '__main__':
    main()
