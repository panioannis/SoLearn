#!/bin/bash

# Define the number of clients

set +m

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
    client_pids[$i]=$!
done

cd ../../

echo  "${client_pids[@]}"

# Wait for 2 seconds
sleep 2

# Start server.py
cd ./fl_server/ || exit

# Execute client.py for each client
for ((i = 0; i < N; i++)); do
    python client.py --node-id $i &
done

python server.py --rounds $R  

sleep 2

echo " Geia sou ! "

# Define an array
# my_array=(10 20 30 40 50)

server_pid=$((server_pid - 1))

# Iterate over the elements of the array
for (( i = 0; i < ${#client_pids[@]}; i++ )); do
    # Subtract one from each element and store the result back in the array
    client_pids[i]=$(( ${client_pids[i]} - 1 ))
done

echo " $server_pid ${client_pids[@]} " 

# trap "kill $server_pid ${client_pids[@]}; exit 1" INT
# wait

kill -SIGINT $server_pid

echo Waiting for server to finish
wait $server_pid

kill -SIGINT "${client_pids[@]}" 

for (( i = 0; i < ${#client_pids[@]}; i++ )); do
    # Subtract one from each element and store the result back in the array
    wait ${client_pids[i]}
done

