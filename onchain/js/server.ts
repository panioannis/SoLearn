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

// Dotenv configuration. Please provide .env file with SOL_PRIVATE_KEY = Solana private key here
// Url is set to Solana Devnet. If changed to mainet use a mainet funded Solana wallet to operate  

dotenv.config();
const url = "https://api.devnet.solana.com";

function createKeypairFromFile(path: string): Keypair {
  return Keypair.fromSecretKey(
      Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8")))
  )
};

async function main() {

  const app = express();
  // Middleware to parse incoming JSON bodies
  app.use(express.json());

  // Middleware to parse incoming raw binary data
  app.use(bodyParser.raw({ limit: '50mb', type: 'application/octet-stream' }));
  //app.use(express.raw({ limit: '50mb', type: 'application/octet-stream' }));
  //const args: string[] = process.argv;
  const port: number = parseInt(`5000`); 

  const args: string[] = process.argv;

  const number_of_clients: number = parseInt(args[2]); 

  const randomStrings: string[] = [];

  for (let i = 0; i < number_of_clients; i++) {
      randomStrings.push("SoLearnDev"+((Math.random()).toString().slice(2)));
  }

  console.log(randomStrings);

  //let prefix = Math.random().toString() 

  const connection = new Connection(url, 'confirmed');

  const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');

  const owner = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');

  checkAndPrintBalance();

  //console.log('Name length: %d', name.length);
  const prefix = ((Math.random()).toString().slice(2)); 
  const name = "SoLearnDev"+prefix;
  console.log(name);
  const space = 43;
  await createModelRegistry(connection,name,space,payer,owner);

  const irys_null = "0000000000000000000000000000000000000000000";

  // const irys_nill = "yBIpKXy5jg22Ic7UIr679jOujnKu1Is27O2yCfbzxI8";

  await updateModelRegistry(connection,name,payer,owner,irys_null);

  //createModelRegistry(connection,"SoLearnDev6121678814825717",space,payer,owner);
  
  console.log(await retrieveModelRegistry(connection, name))

  let rootIdTx : string | null = "0000000000000000000000000000000000000000000"; 
  let prevIdTx : string | null = "0000000000000000000000000000000000000000000";
  let nameAccount : string | null;


  app.post('/api/get_registry_name', async (req: Request, res: Response) => {
    try{
      console.log((req.body)['key']);

      const name_to_send = randomStrings[parseInt((req.body)['key'])];

      console.log("Node requested " + " that " + name_to_send);
      
      res.status(200).send(name_to_send);  

    }catch (error){
      res.status(500).send("An error occurred while processing the request.");
    }
  });

  app.post('/api/post', async (req: Request, res: Response) => {
    try{
      const pickledModel = req.body;
      console.log(pickledModel.length);
      nameAccount = await retrieveModelRegistry(connection, name);

      if (nameAccount==="0000000000000000000000000000000000000000000"){
        rootIdTx = await uploadModelUpdate(pickledModel,nameAccount,nameAccount);
        prevIdTx = rootIdTx; 
      } else {
        prevIdTx = await uploadModelUpdate(pickledModel,prevIdTx!,rootIdTx!);
      }
      await updateModelRegistry(connection,name,payer,owner,prevIdTx!);  
      //await getProvenanceModelChainList(await retrieveModelRegistry(connection, name));
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

  app.post('/api/post_get_latest_model',async (req: Request, res: Response) => {
    //const { body } = req;
    try{
     // console.log('Received POST request:', req);

      const latestid = await retrieveModelRegistry(connection, name);
      
      //await deleteModelRegistry(connection,name,payer,owner);
      console.log('Received POST request:', latestid);
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
          //await getProvenanceModelChainList(await retrieveModelRegistry(connection, name));
          await deleteModelRegistry(connection,name,payer,owner);
          server.close(() => {
              console.log('Server has been gracefully shutdown');
              process.exit(0);
          });
      });
});
}

main().catch(console.error);

  
