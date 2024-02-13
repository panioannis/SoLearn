# =======================================================================================
# ------------------------------ Start running tests ------------------------------------ 
# =======================================================================================

#!/bin/bash
mkdir -p ./experiments
# Outer loop for clients from 2 to 10
for clients in {10..100..10}; do
    # Inner loop for rounds from 10 to 1000
    for rounds in {100..1000..100}; do
        for i in {1..12} do
            # Start time
            start=$(date +%s.%N)
            # Run the command with current clients and rounds
            ./run.sh $clients $rounds
            # End time
            end=$(date +%s.%N)
            # Calculate elapsed time
            runtime=$(echo "$end - $start" | bc)
            # Print elapsed time
            echo "Total runtime: $runtime seconds" >> ./experiments/Experiment_${clients}_clients_${rounds}_rounds/time.out
        done
    done
done
