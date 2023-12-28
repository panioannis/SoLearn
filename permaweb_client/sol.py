import solana
import base58
from solders.keypair import Keypair

import os
#print(os.path.expanduser('~'))

text_file = open("/home/stack"+"/.config/solana/id.json", "r")

lines = text_file.read().split(',')
text_file.close()

#print(lines[0].replace('[', ''))
#print(lines[-1].replace(']', ''))

lines[0] = lines[0].replace('[', '')
lines[-1] = lines[-1].replace(']', '')

#print(lines)
#print(len(lines))


key_array = []

for char in lines:
    key_array.append(int(char))


#print(key_array)

#print(key_array[0:31])

#print(len(key_array[0:31]))

#print(key_array[32:64])

#print(len(key_array[32:63]))

generated_keypair = Keypair.from_bytes(bytes(key_array))

# Print Public Key
print(generated_keypair.pubkey()) 


#print(len(lines))
#print(generated_keypair.secret())

#print(base58.b58encode(generated_keypair.secret()))

# Print Secret key
print (str(base58.b58encode(generated_keypair.secret())).replace('\'', '').replace('b', '',1)) 