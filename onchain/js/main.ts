import {
    Connection,
    Keypair,
    PublicKey
  } from '@solana/web3.js'; 

import {
    airdropToPayer,
    createModelRegistry,
    deleteModelRegistry,
    updateModelRegistry,
    retrieveModelRegistry,
    reallocateModelRegistry,
    transferModelRegistry,
    getProvenanceModelChainList,
    printProvenanceChainSDK,
    checkAndPrintBalance,
    uploadModelUpdate
} from './src';

import dotenv from "dotenv";
import * as net from 'net';
import * as fs from 'fs';
//chai.use(chaiAsPromised);

// Dotenv configuration. Please provide .env file with SOL_PRIVATE_KEY = Solana private key here
// Url is set to Solana Devnet. If changed to mainet use a mainet funded Solana wallet to operate  

dotenv.config();
const url = "https://api.devnet.solana.com";


// ============================================================================
// https://docs.irys.xyz/hands-on/tutorials/provenance-chain
// https://docs.irys.xyz/developer-docs/querying/query-package
// ============================================================================

// ============================================================================
// https://github.com/adap/flower/blob/main/examples/flower-in-30-minutes/tutorial.ipynb
// https://flower.dev/docs/framework/tutorial-series-get-started-with-flower-pytorch.html
// ============================================================================

function createKeypairFromFile(path: string): Keypair {
  return Keypair.fromSecretKey(
      Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8")))
  )
};

async function readUntilExists(filePath: string, interval = 1000, maxAttempts = 10): Promise<string> {  
  let attempts = 0;
  return new Promise((resolve, reject) => {
      function checkFile() {
          fs.access(filePath, fs.constants.F_OK, (err) => {
              if (!err) {
                  // File exists, resolve the promise
                  resolve(filePath);
              } else {
                  attempts++;
                  if (attempts >= maxAttempts) {
                      // Max attempts reached, reject the promise
                      reject(new Error(`File not found after ${maxAttempts} attempts`));
                  } else {
                      // Retry after the specified interval
                      setTimeout(checkFile, interval);
                  }
              }
          });
      }

      // Start checking the file
      checkFile();
  });
}

async function main() {
//describe('Name Service Program', async () => {
  const args: string[] = process.argv;
  // Server configuration for Connection to server
  const host = '127.0.0.1';
  //const port = 12345;
  const port: number = parseInt(`${args[2]}2345`);
  const connection = new Connection(url, 'confirmed');
  // const payer = Keypair.generate();
  const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
  //const owner = Keypair.generate();
  const owner = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
  const space = 43;
  let name: string;
  
  //await airdropToPayer(connection,payer);
  await checkAndPrintBalance();
  
  name = Math.random().toString() + '.sol';
  
  await createModelRegistry(connection,name,space,payer,owner);

  // Handle data received from client
  //const receivedFilePath = 'model.txt';
  //const fileWriteStream = fs.createWriteStream(receivedFilePath);

  //  Socket Server Code.

  // Create a server
  const server = net.createServer((clientSocket) => {
  console.log(`Client connected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  let rootIdTx : string | null = "0000000000000000000000000000000000000000000"; 
  let prevIdTx : string | null = "0000000000000000000000000000000000000000000";
  let nameAccount : string;
  // Handle data received from the client
  clientSocket.on('data', async (data) => {
    console.log(`Received data: ${data.toString()}`);

    (async () => {
      try {
          const filePath = await readUntilExists(data.toString(),2000,20);
          console.log(`File found: ${filePath}`);
          nameAccount = await retrieveModelRegistry(connection, name);

          if (nameAccount==="0000000000000000000000000000000000000000000"){
            rootIdTx = await uploadModelUpdate(filePath,nameAccount,nameAccount);
            prevIdTx = rootIdTx; 
          } else {
            prevIdTx = await uploadModelUpdate(data.toString(),prevIdTx!,rootIdTx!);
          }
            await updateModelRegistry(connection,name,payer,owner,prevIdTx!);  
          // Send acknowledgment back to the client
          clientSocket.write('Data received and processed successfully. Ready for next input.');
      } catch (error) {
          console.error("Error");
          // Handle the error (e.g., log, notify, etc.)
      }
    })();
  });  

  clientSocket.on('end', async () => {
    console.log('Client disconnected');
    await getProvenanceModelChainList(await retrieveModelRegistry(connection, name));
    await deleteModelRegistry(connection,name,payer,owner);
  });
    
  });
    
  // Listen for incoming connections
  server.listen(port, host, async () => {
    console.log(`Server listening on ${host}:${port}`);
  });
    
}
  
main();

  
  
  