# Cosmo-Wanda Database

Work in progress QuestDB database implementation for Cosmo-Wanda system.

## Setup

  1. Ensure QuestDB database is setup and running through a container or natively installed software
  2. Run server first on one machine:
     ```bash
     python socket_server.py
  3. Run client next on the other machine:
     ```bash
     python socket_client.py

## Docker + QuestDB Setup

  1. Docker installation: https://docs.docker.com/get-docker/
     or run these commands in terminal
     ```bash
     curl -fsSL https://get.docker.com | sudo bash
     sudo usermod -aG docker $USER
     newgrp docker  # Or log out and back in
  3. Create the image for QuestDB (only done once)
     ```bash
     docker pull questdb/questdb
  4. Run the container whenever the database is needed
     ```bash
     docker run -d --name questdb -p 9000:9000 -p 9009:9009 -v /home/pi/questdb_data:/root/.questdb/db questdb/questdb # Change file directory to match machines' for the volume
  5. (If GUI accessible) Once QuestDB is running, go to http://localhost:9000/ and run the following SQL in the web console (only done once)
     ```SQL
     CREATE TABLE LTI_data (
     trial INT,
     f1 FLOAT,
     f2 FLOAT,
     f3 FLOAT,
     pressure FLOAT,
     avgForce FLOAT,
     timestamp TIMESTAMP
     ) TIMESTAMP(timestamp) PARTITION BY MONTH WAL;
  6. (If GUI inaccessible) Once QuestDB is running, run the following command (only done once)
     ```bash
     curl 'http://localhost:9000/exec' --data-urlencode "query=CREATE TABLE LTI_data(trial INT, f1 FLOAT, f2 FLOAT, f3 FLOAT, pressure FLOAT, avgForce FLOAT, timestamp TIMESTAMP) TIMESTAMP(timestamp) PARTITION BY MONTH WAL;"

## Changes to socket_server

  Changes line 57-62
  - Added dummy file reader and data packing + sending to client
  Changes line 115
  - Added unexpected error exception (Not sure if necessary)

## Changes to socket_client

  - Added constant variables for server information + data packet size
  - Added trial number query (Not sure if necessary)
  - Added QuestDB insertion and exceptions

## Requirements

  - QuestDB database set up and running
  - Two machines, one for Cosmo, one for Wanda. The capability to connect/communicate between them
  - Python 3 on both machines
  - telemetryData.txt installed on server machine in socket_server.py directory

## TO DO:

 - Ensure timezone is accurate and partition is valid
 - Set it up on pi's
 - Remove Wandas telemetry dummy file and link it with DAQ
