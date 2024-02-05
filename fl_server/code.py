# def receive_latest_model_url(url):

#     response = requests.get(url)

#     if response.status_code == 200:
#         # Extracting the JSON body from the response

#         received_data = response.content
#     else:
#         print("POST request failed with status code:", response.status_code)

#     split_receive = received_data.split(" || ")

#     new_url = "https://gateway.irys.xyz/" + split_receive[0]  

#     response = requests.get(new_url)

#     if response.status_code == 200:
#         # Extracting the JSON body from the response

#         loaded_model = response.content
#     else:
#         print("POST request failed with status code:", response.status_code)

#     return loaded_model

# def receive_weights():
#     url2 = "https://gateway.irys.xyz/7lsTAsS8hV97y1ZzZkkFl14ombmHFbOpFq1M30mrPTI"
#     url1 = "https://gateway.irys.xyz/IEekbufkSja4LVhDrwL141MIejJ_ByxOz1nhwCqgtOg"
    
#     weights = []
    
#     response = requests.get(url1)

#     if response.status_code == 200:
#         # Extracting the JSON body from the response

#         loaded_data1 = pickle.loads(response.content)
#     else:
#         print("POST request failed with status code:", response.status_code)
    
#     response = requests.get(url2)

#     if response.status_code == 200:
#         # Extracting the JSON body from the response

#         loaded_data2 = pickle.loads(response.content)
#     else:
#         print("POST request failed with status code:", response.status_code)

#     weights = [loaded_data1,loaded_data2]
#     return weights