import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';


import {
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
} from '../../src';

import dotenv from "dotenv";
import * as net from 'net';

chai.use(chaiAsPromised);

// Dotenv configuration. Please provide .env file with SOL_PRIVATE_KEY = Solana private key here
// Url is set to Solana Devnet. If changed to mainet use a mainet funded Solana wallet to operate  

dotenv.config();
const url = "https://api.devnet.solana.com";

// Server configuration for Connection to server
const host = '127.0.0.1';
const port = 12345;

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

async function main() {
//describe('Name Service Program', async () => {
  const connection = new Connection(url, 'confirmed');
  // const payer = Keypair.generate();
  const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
  //const owner = Keypair.generate();
  const owner = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
  const space = 43;
  let nameKey: PublicKey;
  let name: string;

  checkAndPrintBalance();
  
  // Airdrop code in case it is ever necessary 
  // before(async () => {
  //   const airdropSignature = await connection.requestAirdrop(
  //     payer.publicKey,
  //     LAMPORTS_PER_SOL,
  //   );
  //   await connection.confirmTransaction({
  //     signature: airdropSignature,
  //     ...(await connection.getLatestBlockhash()),
  //   });
  // });
  // it('Create Name Registery', async () => {
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   nameAccount.owner.equals(owner.publicKey);
  //   expect(nameAccount.data?.length).to.eql(space);
  // });
  //it('Create Name Registery', async () => {  

    // ==================================================================================
    // ----------------------------- Allocate Name Registry -----------------------------
    // ==================================================================================

    name = Math.random().toString() + '.sol';
    
    await createModelRegistry(connection,name,space,payer,owner);

    //  Socket Server Code.

    // Create a server
    const server = net.createServer((clientSocket) => {
    console.log(`Client connected: ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

    let rootIdTx : string | null = "0000000000000000000000000000000000000000000"; 
    let prevIdTx : string | null = "0000000000000000000000000000000000000000000";

    // Handle data received from the client
    clientSocket.on('data', async (data) => {
      console.log(`Received data: ${data.toString()}`);
      
      let nameAccount = await retrieveModelRegistry(connection, name);

      if (nameAccount==="0000000000000000000000000000000000000000000"){

        rootIdTx = await uploadModelUpdate(data.toString(),nameAccount,nameAccount);
        prevIdTx = rootIdTx; 
      } else {
        prevIdTx = await uploadModelUpdate(data.toString(),prevIdTx!,rootIdTx!);
      }
      await updateModelRegistry(connection,name,payer,owner,prevIdTx!);  
    });  

    clientSocket.on('end', async () => {
      console.log('Client disconnected');
      await deleteModelRegistry(connection,name,payer,owner);
      await getProvenanceModelChainList(await retrieveModelRegistry(connection, name));
    });
    
  });
    
  // Listen for incoming connections
  server.listen(port, host, async () => {
    console.log(`Server listening on ${host}:${port}`);
  });
    
}

main();
 // }).timeout(100000000000000000000);


