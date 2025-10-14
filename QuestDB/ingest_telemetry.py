#!/usr/bin/env python3
"""
QuestDB Telemetry Data Ingestion Script
Ingests telemetry data at 60 samples per second for a specified duration.
"""

import time
import random
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


def generate_sample_data():
    """
    Generate random telemetry data for testing.
    Replace this with your actual sensor readings.
    """
    return {
        'cell1_force': random.uniform(0, 1000),
        'cell2_force': random.uniform(0, 1000),
        'cell3_force': random.uniform(0, 1000),
        'net_force': random.uniform(0, 3000),
        'pressure_pt1': random.uniform(0, 100),
        'pressure_pt2': random.uniform(0, 100),
        'pressure_pt3': random.uniform(0, 100),
        'pressure_pt4': random.uniform(0, 100),
        'pressure_pt5': random.uniform(0, 100),
        'pressure_pt6': random.uniform(0, 100),
        'weight_load_cell': random.uniform(0, 500),
        'chamber_temp': random.uniform(20, 100),
        'nozzle_temp': random.uniform(20, 150)
    }


def ingest_telemetry(duration_seconds, batch_size=60):
    """
    Ingest telemetry data at 60 samples per second.

    Args:
        duration_seconds: How long to run the ingestion (seconds)
        batch_size: Number of rows to batch before flushing (default: 60, i.e., 1 second)
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
                # Generate and send sample
                data = generate_sample_data()

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
        default=60,
        help='Number of rows to batch before flushing (default: 60)'
    )

    args = parser.parse_args()

    if args.duration <= 0:
        print("Error: Duration must be positive")
        return

    ingest_telemetry(args.duration, args.batch_size)


if __name__ == '__main__':
    main()
