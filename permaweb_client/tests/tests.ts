import {
    Connection,
    Keypair,
    PublicKey,
} from '@solana/web3.js';
import Buffer from "buffer";
import  messageService from '../new_message';

import readFileSync from 'fs';
//import BN from 'bn.js';


// function createKeypairFromFile(path: string): Keypair {
//     return Keypair.fromSecretKey(
//         Buffer.from(JSON.parse(readFileSync(path, "utf-8")))
//     )
// };

function createKeypairFromFile(path: string): Keypair {
    return Keypair.fromSecretKey(
        Uint8Array.from([220,36,208,35,106,191,12,143,203,80,177,109,176,199,167,
            194,144,132,178,37,219,139,169,44,252,99,82,138,251,245,251,22,163,53,3,
            26,200,225,187,180,62,135,192,85,159,168,167,60,114,66,121,104,44,13,20,
            223,28,196,94,148,52,204,122,87])
    )
};


describe("Arweave_id_upload", async () => {

    const connection = new Connection(`http://localhost:8899`, 'confirmed');
    //const connection = new Connection(`https://api.devnet.solana.com/`, 'confirmed');
    // Or this:
    //const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
    console.log("OK \n");
    //console.log(connection);


    const payer = createKeypairFromFile('/home/stack' + '/.config/solana/id.json');
    
    console.log("OK \n");
    //console.log(payer);

    const smart_contract = createKeypairFromFile('./program/chatappprogram-keypair.json');

    // const smart_contract_Id = new PublicKey(
	//     "Cfyh7qmWNNfakpPKScbZnnmfsixTBvDVq81vVDcyD1gQ"
    // );

    const smart_contract_Id = new PublicKey(
	     "3NLvEA49eLrTwjqtjucP91u52JHXA4SnYeDhKc9xV1f4"
    );
    

    //const program = Keypair.fromSecretKey("QfKggutJliM2tWWvaIj5K-C4D_Ydg6Bc0kZokCba51E");

    // Insert the smart contract program id here
    // const smart_contract_Id = new web3.PublicKey(
	//     "Cfyh7qmWNNfakpPKScbZnnmfsixTBvDVq81vVDcyD1gQ"
    // );
    
    it("Upload a file hash", async () => {

        const model_id = "QfKggutJliM2tWWvaIj5K-C4D_Ydg6Bc0kZokCba51E";

        //const messageService = new MessageService();

        const result = await messageService.sendMessage(connection,payer,smart_contract_Id,model_id);
        //console.log(messageService.getMessages());
        console.log(result);

        const res = await messageService.getAccountMessageHistory(connection,smart_contract_Id);

        console.log(res);
    });    
});