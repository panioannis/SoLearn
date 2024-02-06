from collections import OrderedDict
from typing import Callable, Dict, List, Optional, Tuple, Union

import flwr as fl

from flwr.common import (
    EvaluateIns,
    EvaluateRes,
    FitIns,
    FitRes,
    MetricsAggregationFn,
    NDArrays,
    Parameters,
    Scalar,
    ndarrays_to_parameters,
    parameters_to_ndarrays,
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

import numpy as np
from io import BytesIO
import random
import numpy as np
import requests
import json
import pickle

import flwr as fl
from flwr_datasets import FederatedDataset
import torch
import torch.nn as nn
import torch.nn.functional as F

DEVICE = torch.device("cpu")  # Try "cuda" to train on GPU
print(
    f"Training on {DEVICE} using PyTorch {torch.__version__} and Flower {fl.__version__}"
)

from flwr.server.client_manager import ClientManager
from flwr.server.client_proxy import ClientProxy
from flwr.server.strategy.aggregate import aggregate, weighted_loss_avg

# Server configuration
# host = '127.0.0.1'
# port = 23456
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

def get_parameters(net) -> List[np.ndarray]:
    return [val.cpu().numpy() for _, val in net.state_dict().items()]

def set_parameters(net, parameters: List[np.ndarray]):
    params_dict = zip(net.state_dict().keys(), parameters)
    state_dict = OrderedDict({k: torch.Tensor(v) for k, v in params_dict})
    net.load_state_dict(state_dict, strict=True)


from typing import Callable, Union

from flwr.common import (
    EvaluateIns,
    EvaluateRes,
    FitIns,
    FitRes,
    MetricsAggregationFn,
    NDArrays,
    Parameters,
    Scalar,
    ndarrays_to_parameters,
    parameters_to_ndarrays,
)
from flwr.server.client_manager import ClientManager
from flwr.server.client_proxy import ClientProxy
from flwr.server.strategy.aggregate import aggregate, weighted_loss_avg

def send_model(weights):
    url = f"http://127.0.0.1:5000/api/post"
    serialized_model = pickle.dumps(weights)
    response = requests.post(url, data=serialized_model, headers={'Content-Type': 'application/octet-stream'})

    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        # Extracting the JSON body from the response
        print("Ok \n")
        loaded_data = pickle.loads(response.content)
        print(loaded_data)
    else:
        print("POST request failed with status code:", response.status_code)

    #loaded_data = pickle.loads(response.content)
    return loaded_data


def receive_weights(node_id):
    url = f"http://127.0.0.1:300{node_id}/api/post_get_latest_model"

    response = requests.post(url)

    if response.status_code == 200:
        # Extracting the JSON body from the response

        received_data = response.text
    else:
        print("POST request failed with status code:", response.status_code)

    print(received_data)

    node_url = "https://gateway.irys.xyz/" + received_data

    # received_data = f"https://gateway.irys.xyz/C4PJqg6fB0jRU6THcpx7VtIbWpbRpIe0RoqMrqUE738"

    response = requests.get(node_url)

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

    #print(loaded_model)
    return loaded_model  



class FedCustom(fl.server.strategy.Strategy):
    def __init__(
        self,
        fraction_fit: float = 1.0,
        fraction_evaluate: float = 1.0,
        min_fit_clients: int = 2,
        min_evaluate_clients: int = 2,
        min_available_clients: int = 2,
    ) -> None:
        super().__init__()
        self.fraction_fit = fraction_fit
        self.fraction_evaluate = fraction_evaluate
        self.min_fit_clients = min_fit_clients
        self.min_evaluate_clients = min_evaluate_clients
        self.min_available_clients = min_available_clients

    def __repr__(self) -> str:
        return "FedCustom"

    def initialize_parameters(
        self, client_manager: ClientManager
    ) -> Optional[Parameters]:
        """Initialize global model parameters."""
        net = Net()
        ndarrays = get_parameters(net)
        return fl.common.ndarrays_to_parameters(ndarrays)

    def configure_fit(
        self, server_round: int, parameters: Parameters, client_manager: ClientManager
    ) -> List[Tuple[ClientProxy, FitIns]]:
        """Configure the next round of training."""

        # Sample clients
        sample_size, min_num_clients = self.num_fit_clients(
            client_manager.num_available()
        )
        clients = client_manager.sample(
            num_clients=sample_size, min_num_clients=min_num_clients
        )

        # Create custom configs
        n_clients = len(clients)
        half_clients = n_clients // 2
        standard_config = {"lr": 0.001}
        higher_lr_config = {"lr": 0.003}
        fit_configurations = []
        for idx, client in enumerate(clients):
            if idx < half_clients:
                fit_configurations.append((client, FitIns(parameters, standard_config)))
            else:
                fit_configurations.append(
                    (client, FitIns(parameters, higher_lr_config))
                )
        return fit_configurations

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        """Aggregate fit results using weighted average."""

        #-------------------------------------------------------------------
        # Start ADDED

        # ------------------------ Sample Code -----------------------------
        # weights_loa_1 = pickle.loads(receive_weights(0))
        # weights_loa_2 = pickle.loads(receive_weights(1))
        
        # weights_loaded = [weights_loa_1,weights_loa_2]

        weights_loaded = []

        for i in range(0,len(results)):
            weights_loaded.append(receive_weights(i))

        # End ADDED
        #-------------------------------------------------------------------

        weights_results = [
            (parameters_to_ndarrays(fit_res.parameters), fit_res.num_examples)
            for _, fit_res in results
        ]
        
        #-------------------------------------------------------------------
        # Start ADDED

        updated_weights_results = []

        for loaded_params, (_, fit_res) in zip(weights_loaded, results):
            updated_weights_results.append((parameters_to_ndarrays(loaded_params), fit_res.num_examples))

        # Now 'updated_weights_results' contains the updated first elements
        weights_results = updated_weights_results

        # End ADDED
        #-------------------------------------------------------------------

        to_send = aggregate(updated_weights_results)

        loaded_weights = send_model(to_send)
        #send_model(to_send)

        parameters_aggregated = ndarrays_to_parameters(loaded_weights)
        #parameters_aggregated = ndarrays_to_parameters(to_send)
        metrics_aggregated = {}
        return parameters_aggregated, metrics_aggregated

    def configure_evaluate(
        self, server_round: int, parameters: Parameters, client_manager: ClientManager
    ) -> List[Tuple[ClientProxy, EvaluateIns]]:
        """Configure the next round of evaluation."""
        if self.fraction_evaluate == 0.0:
            return []
        config = {}
        evaluate_ins = EvaluateIns(parameters, config)

        # Sample clients
        sample_size, min_num_clients = self.num_evaluation_clients(
            client_manager.num_available()
        )
        clients = client_manager.sample(
            num_clients=sample_size, min_num_clients=min_num_clients
        )

        # Return client/config pairs
        return [(client, evaluate_ins) for client in clients]

    def aggregate_evaluate(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, EvaluateRes]],
        failures: List[Union[Tuple[ClientProxy, EvaluateRes], BaseException]],
    ) -> Tuple[Optional[float], Dict[str, Scalar]]:
        """Aggregate evaluation losses using weighted average."""

        if not results:
            return None, {}

        loss_aggregated = weighted_loss_avg(
            [
                (evaluate_res.num_examples, evaluate_res.loss)
                for _, evaluate_res in results
            ]
        )
        metrics_aggregated = {}
        return loss_aggregated, metrics_aggregated

    def evaluate(
        self, server_round: int, parameters: Parameters
    ) -> Optional[Tuple[float, Dict[str, Scalar]]]:
        """Evaluate global model parameters using an evaluation function."""

        # Let's assume we won't perform the global model evaluation on the server side.
        return None

    def num_fit_clients(self, num_available_clients: int) -> Tuple[int, int]:
        """Return sample size and required number of clients."""
        num_clients = int(num_available_clients * self.fraction_fit)
        return max(num_clients, self.min_fit_clients), self.min_available_clients

    def num_evaluation_clients(self, num_available_clients: int) -> Tuple[int, int]:
        """Use a fraction of available clients for evaluation."""
        num_clients = int(num_available_clients * self.fraction_evaluate)
        return max(num_clients, self.min_evaluate_clients), self.min_available_clients

# # Define metric aggregation function
# def weighted_average(metrics: List[Tuple[int, Metrics]]) -> Metrics:
#     # Multiply accuracy of each client by number of examples used
#     accuracies = [num_examples * m["accuracy"] for num_examples, m in metrics]
#     examples = [num_examples for num_examples, _ in metrics]

#     # Aggregate and return custom metric (weighted average)
#     return {"accuracy": sum(accuracies) / sum(examples)}


# Define strategy
#strategy = fl.server.strategy.FedAvg(evaluate_metrics_aggregation_fn=weighted_average)
strategy=FedCustom()#evaluate_metrics_aggregation_fn=weighted_average)

# Start Flower server
fl.server.start_server(
    server_address="127.0.0.1:5321",
    config=fl.server.ServerConfig(num_rounds=2),
    strategy=strategy,
)