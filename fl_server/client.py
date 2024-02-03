import argparse
import warnings
from collections import OrderedDict
from typing import Dict, List, Optional, Tuple

import flwr as fl
from flwr_datasets import FederatedDataset
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torchvision.transforms import Compose, Normalize, ToTensor
from tqdm import tqdm

from io import BytesIO
import random
import numpy as np
import requests
import json
import pickle

from flwr.common import (
    Code,
    EvaluateIns,
    EvaluateRes,
    FitIns,
    FitRes,
    GetParametersIns,
    GetParametersRes,
    Status,
    ndarrays_to_parameters,
    parameters_to_ndarrays
)

from flwr.proto.transport_pb2 import (
    ClientMessage,
    Code,
    Parameters,
    Reason,
    Scalar,
    ServerMessage,
    Status,
)

from flwr.common.serde import (
    parameters_to_proto,
    parameters_from_proto
)

# Server configuration
host = '127.0.0.1'
port = 12345

# https://github.com/adap/flower/blob/main/doc/source/tutorial-series-use-a-federated-learning-strategy-pytorch.ipynb

# #############################################################################
# 1. Regular PyTorch pipeline: nn.Module, train, test, and DataLoader
# #############################################################################

warnings.filterwarnings("ignore", category=UserWarning)
#DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
DEVICE = torch.device("cpu")

class Net(nn.Module):
    """Model (simple CNN adapted from 'PyTorch: A 60 Minute Blitz')"""

    def __init__(self) -> None:
        super(Net, self).__init__()
        self.conv1 = nn.Conv2d(3, 6, 5)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(6, 16, 5)
        self.fc1 = nn.Linear(16 * 5 * 5, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = x.view(-1, 16 * 5 * 5)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x

def get_model_parameters(net) -> List[np.ndarray]:
    return [val.cpu().numpy() for _, val in net.state_dict().items()]

def set_model_parameters(net, parameters: List[np.ndarray]):
    params_dict = zip(net.state_dict().keys(), parameters)
    state_dict = OrderedDict({k: torch.Tensor(v) for k, v in params_dict})
    net.load_state_dict(state_dict, strict=True)

def train(net, trainloader, epochs):
    """Train the model on the training set."""
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.SGD(net.parameters(), lr=0.001, momentum=0.9)
    for _ in range(epochs):
        for batch in tqdm(trainloader, "Training"):
            images = batch["img"]
            labels = batch["label"]
            optimizer.zero_grad()
            criterion(net(images.to(DEVICE)), labels.to(DEVICE)).backward()
            optimizer.step()

def test(net, testloader):
    """Validate the model on the test set."""
    criterion = torch.nn.CrossEntropyLoss()
    correct, loss = 0, 0.0
    with torch.no_grad():
        for batch in tqdm(testloader, "Testing"):
            images = batch["img"].to(DEVICE)
            labels = batch["label"].to(DEVICE)
            outputs = net(images)
            loss += criterion(outputs, labels).item()
            correct += (torch.max(outputs.data, 1)[1] == labels).sum().item()
    accuracy = correct / len(testloader.dataset)
    return loss, accuracy

def load_data(node_id):
    """Load partition CIFAR10 data."""
    fds = FederatedDataset(dataset="cifar10", partitioners={"train": 3})
    partition = fds.load_partition(node_id)
    # Divide data on each node: 80% train, 20% test
    partition_train_test = partition.train_test_split(test_size=0.2)
    pytorch_transforms = Compose(
        [ToTensor(), Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))]
    )

    def apply_transforms(batch):
        """Apply transforms to the partition from FederatedDataset."""
        batch["img"] = [pytorch_transforms(img) for img in batch["img"]]
        return batch

    partition_train_test = partition_train_test.with_transform(apply_transforms)
    trainloader = DataLoader(partition_train_test["train"], batch_size=32, shuffle=True)
    testloader = DataLoader(partition_train_test["test"], batch_size=32)
    return trainloader, testloader

# #############################################################################
# 2. Federation of the pipeline with Flower
# #############################################################################

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

def send_weights(weights):
    url = f"http://127.0.0.1:300{node_id}/api/post"
    serialized_model = pickle.dumps(weights)
    response = requests.post(url, data=serialized_model, headers={'Content-Type': 'application/octet-stream'})

    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        # Extracting the JSON body from the response
        print("Ok \n")
        #loaded_data = pickle.loads(response.content)
    else:
        print("POST request failed with status code:", response.status_code)

    response = requests.get("https://gateway.irys.xyz/bI6hUhf9XP6YVXOJdvTdH-sSxfDeTaz9Un_Sjtvylcg")

    if response.status_code == 200:
        # Extracting the JSON body from the response

        loaded_data = pickle.loads(response.content)
    else:
        print("POST request failed with status code:", response.status_code)
    return loaded_data

class FlowerClient(fl.client.Client):
    def __init__(self, cid, net, trainloader, valloader):
        self.cid = cid
        self.net = net
        self.trainloader = trainloader
        self.valloader = valloader

    def get_parameters(self, ins: GetParametersIns) -> GetParametersRes:
        print(f"[Client {self.cid}] get_parameters")

        # Get parameters as a list of NumPy ndarray's

        ndarrays: List[np.ndarray] = get_model_parameters(self.net)

        # Serialize ndarray's into a Parameters object
        parameters = ndarrays_to_parameters(self.net)

        status = Status(code=Code.OK, message="Success")
        return GetParametersRes(
            status=status,
            parameters=parameters,
        )

    def fit(self, ins: FitIns) -> FitRes:
        print(f"[Client {self.cid}] fit, config: {ins.config}")

        # Deserialize parameters to NumPy ndarray's
        parameters_original = ins.parameters
        ndarrays_original = parameters_to_ndarrays(parameters_original)

        # Update local model, train, get updated parameters
        set_model_parameters(self.net, ndarrays_original)
        train(self.net, self.trainloader, epochs=1)
        
        # Get model parameters of the updated model.
        ndarrays_updated = get_model_parameters(self.net)
        # Serialize ndarray's into a Parameters object
        parameters_updated = ndarrays_to_parameters(ndarrays_updated)

        #-------------------------------------------------------------------
        # Start ADDED

        #name = f"model{self.cid}.pt"
        #torch.save(self.net.state_dict(), name)
        #torch.save(self.net.state_dict(), bytes_buffer)

        bytes_buffer = BytesIO()
        pickle.dump(parameters_updated, bytes_buffer)

        bytes_buffer.seek(0)

        url = f"http://127.0.0.1:300{self.cid}/api/post"
        response = requests.post(url, data=bytes_buffer, headers={'Content-Type': 'application/octet-stream'})

        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Extracting the JSON body from the response
            received_bytes_buffer = BytesIO(response.content)
            print(bytes_buffer.getbuffer().nbytes)
        else:
            print("POST request failed with status code:", response.status_code)

        bytes_buffer.seek(0)
    
        received_bytes_buffer.seek(0)
        
        parameters_updated = pickle.load(received_bytes_buffer)
        
        #self.net.load_state_dict(model_state_dict)

        bytes_buffer.close()
        received_bytes_buffer.close()


        # End ADDED
        #-------------------------------------------------------------------

        # Build and return response
        status = Status(code=Code.OK, message="Success")
        return FitRes(
            status=status,
            parameters=parameters_updated,
            num_examples=len(self.trainloader),
            metrics={},
        )

    def evaluate(self, ins: EvaluateIns) -> EvaluateRes:
        print(f"[Client {self.cid}] evaluate, config: {ins.config}")

        # Deserialize parameters to NumPy ndarray's
        parameters_original = ins.parameters
        ndarrays_original = parameters_to_ndarrays(parameters_original)

        set_model_parameters(self.net, ndarrays_original)
        loss, accuracy = test(self.net, self.valloader)
        # return float(loss), len(self.valloader), {"accuracy": float(accuracy)}

        # Build and return response
        status = Status(code=Code.OK, message="Success")
        return EvaluateRes(
            status=status,
            loss=float(loss),
            num_examples=len(self.valloader),
            metrics={"accuracy": float(accuracy)},
        )

def client_fn(cid) -> FlowerClient:
    # Load model and data (simple CNN, CIFAR-10)
    net = Net().to(DEVICE)
    trainloader, testloader = load_data(node_id=cid)
    return FlowerClient(cid, net, trainloader, testloader)



# Start Flower client
fl.client.start_client(
    server_address="127.0.0.1:5321",
    client=client_fn(node_id),
)