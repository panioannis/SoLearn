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
const solana_rpc_url = "https://api.devnet.solana.com";

async function postData(url: string, data: any): Promise<string | null | undefined> {
  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream', // Assuming JSON data, adjust as needed
          },
          body: JSON.stringify(data),
          //body: Buffer.from(data),
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const responseData = await response.text();
      console.log('Response:', responseData);
      return responseData!;
  } catch (error) {
      console.error('Error:', error);
  }
}

function createKeypairFromFile(path: string): Keypair {
  return Keypair.fromSecretKey(
      Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8")))
  )
};

async function main(){

  const app = express();
  const args: string[] = process.argv;
  const port: number = parseInt(`300${args[2]}`); 


  // Middleware to parse incoming JSON bodies
  app.use(express.json());

  // Middleware to parse incoming raw binary data
  app.use(bodyParser.raw({ limit: '50mb', type: 'application/octet-stream' }));

  //app.use(bodyParser.raw({ limit: '50mb', type: 'application/octet-stream' }));

  const connection = new Connection(solana_rpc_url, 'confirmed');

  const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');

  const owner = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');

  //let name = "SoLearn0000000000000000000000000000000000" + '.sol';

  //await airdropToPayer(connection,payer);
  checkAndPrintBalance();

  //let name: string;

  const url = 'http://127.0.0.1:13000/api/get_registry_name';
  const postid = { key: parseInt(`${args[2]}`)  }; // Your data to be sent in the POST request

  // let res = await postData(url, postid);

  // let name = res!;

  let name: string = "AAAAAAAAAASSSSSSSSSSSSSSSSSSSSSDDDDDDDDDDDDDDDD";

  await postData(url, postid).then((result) => {
    if (result !== null && result !== undefined) {
        name = result + '.sol';;
        console.log(name); // Output: This is a new string
    } else {
        throw new Error("The result is null or undefined");
    }
  }).catch((error) => {
      console.error(error);
  });

  console.log(name);

  const space = name.length;


  await createModelRegistry(connection,name,space,payer,owner);

  //createModelRegistry(connection,"SoLearnDev6121678814825717",space,payer,owner);
  

  await retrieveModelRegistry(connection, name);

  //await retrieveModelRegistry(connection, "SoLearnDev6121678814825717");

  let rootIdTx : string | null = "0000000000000000000000000000000000000000000"; 
  let prevIdTx : string | null = "0000000000000000000000000000000000000000000";
  let nameAccount : string | null;

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
      //await deleteModelRegistry(connection,name,payer,owner);
      
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
      console.log('Received POST request:', req);

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
      console.log('Client model provenance uploader'); 
  });
  //Handle server termination signals

  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, async () => {
        console.log(`Received ${signal}, Client model provenance uploader is shutting down...`);
        const res = await retrieveModelRegistry(connection, name);
        // if (res!== null){
        //   await getProvenanceModelChainList(res);
        // }
        await deleteModelRegistry(connection,name,payer,owner);
        
        server.close(() => {
            console.log('Client model provenance uploader has been gracefully shutdown');
            process.exit(0);
        });
    });
  });

}

main().catch(console.error);

