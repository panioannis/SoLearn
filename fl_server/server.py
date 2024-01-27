from typing import List, Tuple

import flwr as fl
from flwr.common import Metrics

import socket
import requests

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

# Server configuration
# host = '127.0.0.1'
# port = 23456


# class FedCustom(fl.server.strategy.Strategy):
#     def __init__(
#         self,
#         fraction_fit: float = 1.0,
#         fraction_evaluate: float = 1.0,
#         min_fit_clients: int = 2,
#         min_evaluate_clients: int = 2,
#         min_available_clients: int = 2,
#     ) -> None:
#         super().__init__()
#         self.fraction_fit = fraction_fit
#         self.fraction_evaluate = fraction_evaluate
#         self.min_fit_clients = min_fit_clients
#         self.min_evaluate_clients = min_evaluate_clients
#         self.min_available_clients = min_available_clients

#     def __repr__(self) -> str:
#         return "FedCustom"

#     def initialize_parameters(
#         self, client_manager: ClientManager
#     ) -> Optional[Parameters]:
#         """Initialize global model parameters."""
#         net = Net()
#         ndarrays = get_parameters(net)
#         return fl.common.ndarrays_to_parameters(ndarrays)

#     def configure_fit(
#         self, server_round: int, parameters: Parameters, client_manager: ClientManager
#     ) -> List[Tuple[ClientProxy, FitIns]]:
#         """Configure the next round of training."""

#         # Sample clients
#         sample_size, min_num_clients = self.num_fit_clients(
#             client_manager.num_available()
#         )
#         clients = client_manager.sample(
#             num_clients=sample_size, min_num_clients=min_num_clients
#         )

#         # Create custom configs
#         n_clients = len(clients)
#         half_clients = n_clients // 2
#         standard_config = {"lr": 0.001}
#         higher_lr_config = {"lr": 0.003}
#         fit_configurations = []
#         for idx, client in enumerate(clients):
#             if idx < half_clients:
#                 fit_configurations.append((client, FitIns(parameters, standard_config)))
#             else:
#                 fit_configurations.append(
#                     (client, FitIns(parameters, higher_lr_config))
#                 )
#         return fit_configurations

#     def aggregate_fit(
#         self,
#         server_round: int,
#         results: List[Tuple[ClientProxy, FitRes]],
#         failures: List[Union[Tuple[ClientProxy, FitRes], BaseException]],
#     ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
#         """Aggregate fit results using weighted average."""

#         """Client to receive Account data from the smart contract"""

#         # Create a socket object
#         client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#         # Server configuration
#         host = '127.0.0.1'
#         port = 12345
#         # Connect to the server
#         client_socket.connect((host, port))

#         """
        
        
#         Client to receive Account data from the smart contract
        
        
        
#         """

#         """
        
        
#         Client to receive Client model updates from Irys
        
        
        
#         """

#         try:
#             url = 'https://gateway.irys.xyz/'+ReceivedId
#             response = requests.get(url)

#             if response.status_code == 200:
#                 data = response.json()  # Parse JSON response
#                 print(data)
#             else:
#                 print(f"Request failed with status code: {response.status_code}")

#             random_number = random.randint(1, 10000)  # Adjust the range as needed
#             name = f"../onchain/models/CIFAR_10_{random_number}.npy"
#             np.save(name, np.array(weights, dtype=object), allow_pickle=True)
#             # Send data to the server
#             message = f"./models/CIFAR_10_{random_number}.npy"
#             with open('./models/CIFAR_10_{random_number}.npy', 'rb') as file:
#                 # Read the file content
#                 file_data = file.read()

#                 # Send the file data over the socket
#                 client_socket.sendall(file_data)

#             # Receive acknowledgment from the server
#             acknowledgment = client_socket.recv(1024)
#             print("Acknowledgment from server:", acknowledgment.decode())

#         finally:
#             # Close the connection
#             client_socket.close()

#         weights_results = [
#             (parameters_to_ndarrays(fit_res.parameters), fit_res.num_examples)
#             for _, fit_res in results
#         ]
#         parameters_aggregated = ndarrays_to_parameters(aggregate(weights_results))
#         metrics_aggregated = {}
#         return parameters_aggregated, metrics_aggregated

#     def configure_evaluate(
#         self, server_round: int, parameters: Parameters, client_manager: ClientManager
#     ) -> List[Tuple[ClientProxy, EvaluateIns]]:
#         """Configure the next round of evaluation."""
#         if self.fraction_evaluate == 0.0:
#             return []
#         config = {}
#         evaluate_ins = EvaluateIns(parameters, config)

#         # Sample clients
#         sample_size, min_num_clients = self.num_evaluation_clients(
#             client_manager.num_available()
#         )
#         clients = client_manager.sample(
#             num_clients=sample_size, min_num_clients=min_num_clients
#         )

#         # Return client/config pairs
#         return [(client, evaluate_ins) for client in clients]

#     def aggregate_evaluate(
#         self,
#         server_round: int,
#         results: List[Tuple[ClientProxy, EvaluateRes]],
#         failures: List[Union[Tuple[ClientProxy, EvaluateRes], BaseException]],
#     ) -> Tuple[Optional[float], Dict[str, Scalar]]:
#         """Aggregate evaluation losses using weighted average."""

#         if not results:
#             return None, {}

#         loss_aggregated = weighted_loss_avg(
#             [
#                 (evaluate_res.num_examples, evaluate_res.loss)
#                 for _, evaluate_res in results
#             ]
#         )
#         metrics_aggregated = {}
#         return loss_aggregated, metrics_aggregated

#     def evaluate(
#         self, server_round: int, parameters: Parameters
#     ) -> Optional[Tuple[float, Dict[str, Scalar]]]:
#         """Evaluate global model parameters using an evaluation function."""

#         # Let's assume we won't perform the global model evaluation on the server side.
#         return None

#     def num_fit_clients(self, num_available_clients: int) -> Tuple[int, int]:
#         """Return sample size and required number of clients."""
#         num_clients = int(num_available_clients * self.fraction_fit)
#         return max(num_clients, self.min_fit_clients), self.min_available_clients

#     def num_evaluation_clients(self, num_available_clients: int) -> Tuple[int, int]:
#         """Use a fraction of available clients for evaluation."""
#         num_clients = int(num_available_clients * self.fraction_evaluate)
#         return max(num_clients, self.min_evaluate_clients), self.min_available_clients


# Define metric aggregation function
def weighted_average(metrics: List[Tuple[int, Metrics]]) -> Metrics:
    # Multiply accuracy of each client by number of examples used
    accuracies = [num_examples * m["accuracy"] for num_examples, m in metrics]
    examples = [num_examples for num_examples, _ in metrics]

    # Aggregate and return custom metric (weighted average)
    return {"accuracy": sum(accuracies) / sum(examples)}


# Define strategy
strategy = fl.server.strategy.FedAvg(evaluate_metrics_aggregation_fn=weighted_average)
#strategy=FedCustom(evaluate_metrics_aggregation_fn=weighted_average)

# Start Flower server
fl.server.start_server(
    server_address="127.0.0.1:5321",
    config=fl.server.ServerConfig(num_rounds=10),
    strategy=strategy,
)