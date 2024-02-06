import numpy as np
from io import BytesIO
import random
import numpy as np
import requests
import json
import pickle

import argparse
import warnings
from collections import OrderedDict
from typing import Dict, List, Optional, Tuple

# Get node id
parser = argparse.ArgumentParser(description="Flower")
parser.add_argument(
    "--node-id",
    choices=[0, 1, 2],
    required=True,
    type=int,
    help="Partition of the dataset divided into 3 iid partitions created artificially.",
)

node_id = parser.parse_args().node_id

# url = f"http://127.0.0.1:3001/api/post_get_latest_model"

# response = requests.post(url)

# if response.status_code == 200:
#     # Extracting the JSON body from the response

#     received_data = response.text
# else:
#     print("POST request failed with status code:", response.status_code)

# print(received_data)

received_data = f"https://gateway.irys.xyz/C4PJqg6fB0jRU6THcpx7VtIbWpbRpIe0RoqMrqUE738"

response = requests.get(received_data)

if response.status_code == 200:
    # Extracting the JSON body from the response

    received_data = response.text
else:
    print("POST request failed with status code:", response.status_code)

print(received_data)

split_receive = received_data.split(" || ")

print(split_receive[0])

new_url = "https://gateway.irys.xyz/" + split_receive[0]  

response = requests.get(new_url)

if response.status_code == 200:
    # Extracting the JSON body from the response

    loaded_model = response.content
else:
    print("POST request failed with status code:", response.status_code)

print(loaded_model)    