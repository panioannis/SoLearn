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
    uploadModelUpdate,
    uploadProvStringData
} from './src';

import express, { Request, Response } from 'express';


import dotenv from "dotenv";
import bodyParser from 'body-parser';
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

const app = express();
//const args: string[] = process.argv;
const port: number = parseInt(`4000`); 


app.use(bodyParser.raw({ limit: '50mb', type: 'application/octet-stream' }));

const connection = new Connection(url, 'confirmed');

const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');

const owner = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
const space = 43;
let name: string;

//await airdropToPayer(connection,payer);
checkAndPrintBalance();

name = Math.random().toString() + '.sol';

createModelRegistry(connection,name,space,payer,owner);

let rootIdTx : string | null = "0000000000000000000000000000000000000000000"; 
let prevIdTx : string | null = "0000000000000000000000000000000000000000000";
let nameAccount : string | null;

app.post('/api/post', async (req: Request, res: Response) => {
  try{
    const pickledModel = req.body;
    // const pickledModel = req.body;
    // req.on('close',async () => {
    //     console.log('Client disconnected during POST request');
    //     await getProvenanceModelChainList(await retrieveModelRegistry(connection, name));
    //     await deleteModelRegistry(connection,name,payer,owner);
    // });
    console.log(pickledModel.length);
    nameAccount = await retrieveModelRegistry(connection, name);

    if (nameAccount==="0000000000000000000000000000000000000000000"){
      rootIdTx = await uploadModelUpdate(pickledModel,nameAccount,nameAccount);
      prevIdTx = rootIdTx; 
    } else {
      prevIdTx = await uploadModelUpdate(pickledModel,prevIdTx!,rootIdTx!);
    }
    await updateModelRegistry(connection,name,payer,owner,prevIdTx!);  
    await getProvenanceModelChainList(await retrieveModelRegistry(connection, name));
    res.status(200).send(pickledModel);//prevIdTx);
  }catch (error){
    res.status(500).send("An error occurred while processing the request.");
  }
});


app.post('/api/postget',async (req: Request, res: Response) => {
  //const { body } = req;
  try{
    console.log('Received POST request:', req);

    await getProvenanceModelChainList(await retrieveModelRegistry(connection, name));
    //await deleteModelRegistry(connection,name,payer,owner);

    res.status(200).send("Success");
  }catch (error){
    res.status(500).send("An error occurred while processing the request.");
  }
});

app.post('/api/postgetlastmodel',async (req: Request, res: Response) => {
  //const { body } = req;
  try{
    console.log('Received POST request:', req);

    const latestid = await retrieveModelRegistry(connection, name);
    //await deleteModelRegistry(connection,name,payer,owner);

    res.status(200).send(latestid);
  }catch (error){
    res.status(500).send("An error occurred while processing the request.");
  }
});

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
  
  // Handle server exit
process.on('exit', () => {
    console.log('Server is exiting...');
    
});

// Handle server termination signals
['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, async () => {
        console.log(`Received ${signal}, Global model provenance uploader is shutting down...`);
        await getProvenanceModelChainList(await retrieveModelRegistry(connection, name));
        await deleteModelRegistry(connection,name,payer,owner);
        server.close(() => {
            console.log('Server has been gracefully shutdown');
            process.exit(0);
        });
    });
});
  