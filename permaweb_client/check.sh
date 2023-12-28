#!/bin/bash
 
# Define your variables
address="Bz6LfABXbPcJNfcm7XfjFv6heriLcEvK5jQ8K3wgzJwY" # Public wallet address
provider_url="https://api.devnet.solana.com"
node_address="https://devnet.irys.xyz"
token="solana"
balance_output="";
 
# Check if node_address contains "devnet"
# When using devnet, you must also include a provider-url
if [[ $node_address == *"devnet"* ]]; then
   balance_output=$(irys balance -t $token --provider-url $provider_url -h $node_address $address)
else
   balance_output=$(irys balance -w $address -h $node_address -t $token $address)
fi
 
# Use regex to parse the output and assign the parsed value to a variable
parsed_balance=$(echo $balance_output | awk -F'[()]' '{split($2,a," "); print a[1]}')
 # Define your threshold
threshold=0.1
 
# Check if parsed_balance is within threshold of 0
is_close_to_zero=$(echo "$parsed_balance < $threshold" | bc -l)
 
if [ $is_close_to_zero -eq 1 ]; then
   echo "Balance ${parsed_balance} is within $(echo "$threshold*100" | bc -l)% of 0, please fund."
else
   echo "Balance ${parsed_balance} funding not yet needed"
fi