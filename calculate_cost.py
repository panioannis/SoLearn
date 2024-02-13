import argparse
# Get node id
parser = argparse.ArgumentParser(description="Flower")
parser.add_argument(
    "--rounds",
    required=True,
    type=int,
    help="Number of rounds of FL",
)
parser.add_argument(
    "--rounds-per-client",
    required=True,
    type=int,
    help="Number of rounds per client",
)
parser.add_argument(
    "--clients",
    required=True,
    type=int,
    help="Number of clients that participate in FL",
)
parser.add_argument(
    "--servers",
    required=True,
    type=int,
    help="Number of Aggregating server",
)
parser.add_argument(
    "--model_size",
    required=True,
    type=int,
    help="Model size in bytes",
)

rounds = parser.parse_args().rounds                                                      
clients = parser.parse_args().clients
servers = parser.parse_args().servers
model_size = parser.parse_args().model_size
rounds_per_client = parser.parse_args().rounds_per_client

#print(parser.parse_args())

LAMPORTS_PER_SOL = 1000000000

assert servers > 0
assert clients > 0
assert rounds > 0
assert model_size > 0
assert rounds_per_client > 0

if (servers != 1):
    servers = servers + 1 

res = (clients+servers+1)*(100/LAMPORTS_PER_SOL + (rounds/rounds_per_client*(90/LAMPORTS_PER_SOL + model_size/LAMPORTS_PER_SOL)))

print("Total cost is", res, "SOL\n")
print("Total cost is", res*100, "USD\n")
