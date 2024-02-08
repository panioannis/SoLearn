#!/bin/bash

# Define the number of clients
N=$1

R=$2

cd ./onchain/js/ || exit

# Start the server.ts with N clients
ts-node server.ts $N | tee Global_model.out &

server_pid=$!

# Wait for 5 seconds
sleep 3

client_pids=()

# Execute main.ts for each client
for ((i = 0; i < N; i++)); do
    ts-node main.ts $i | tee Client_model"$i".out &
    client_pids+=($!)
done

cd ../../

# Wait for 2 seconds
sleep 2

# Start server.py
cd ./fl_server/ || exit

# Execute client.py for each client
for ((i = 0; i < N; i++)); do
    python client.py --node-id $i &
done

python server.py --rounds $R 

kill $server_pid "${client_pids[@]}"