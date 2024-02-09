#!/bin/bash

# Define the number of clients

set +m
N=$1
R=$2
cd ./onchain/js/ || exit
# =======================================================================================
# ------------------------------ Start running stuff ------------------------------------ 
# =======================================================================================

# ------------------------------ Start the server.ts with N clients ---------------------
ts-node server.ts $N | tee Global_model.out &
# ------------------------------ Store the server pid -----------------------------------
server_pid=$!
# ------------------------------ Wait for 3 seconds (to lower) --------------------------
sleep 3
# ------------------------------ Store the client pids ----------------------------------
client_pids=()
# ------------------------------ Execute main.ts for each client ------------------------
for ((i = 0; i < N; i++)); do
    ts-node main.ts $i | tee Client_model"$i".out &
    client_pids[$i]=$!
done
cd ../../
#echo  "${client_pids[@]}"
# ------------------------------ Wait for 2 seconds -------------------------------------
sleep 2
# ------------------------------ Start server.py ----------------------------------------
cd ./fl_server/ || exit
# ------------------------------ Execute client.py for each client ----------------------
for ((i = 0; i < N; i++)); do
    python client.py --node-id $i &
done
python server.py --rounds $R  
# ------------------------------ Wait for 2 seconds (to lower) --------------------------
sleep 2
# ------------------------------ Reduce pid by one for everyone -------------------------
# ------------------------------ Reduce pid by one for server   -------------------------
server_pid=$((server_pid - 1))
# ------------------------------ Reduce pid by one for clients  -------------------------
for (( i = 0; i < ${#client_pids[@]}; i++ )); do
    # Subtract one from each element and store the result back in the array
    client_pids[i]=$(( ${client_pids[i]} - 1 ))
done
echo " $server_pid ${client_pids[@]} " 
# =======================================================================================
# ------------------------------ Start killing stuff ------------------------------------ 
# =======================================================================================
# ------------------------------ kill the server with SIGINT ----------------------------
kill -SIGINT $server_pid
# ------------------------------ wait for server to die ---------------------------------
wait $server_pid
# ------------------------------ kill the clients with SIGINT ---------------------------
kill -SIGINT "${client_pids[@]}" 
# ------------------------------ wait for clients to die --------------------------------
for (( i = 0; i < ${#client_pids[@]}; i++ )); do
    wait ${client_pids[i]}
done

