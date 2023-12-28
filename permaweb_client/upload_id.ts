import {
    Connection,
    Keypair,
    PublicKey,
} from '@solana/web3.js';
//import Buffer from "buffer";
import  messageService from './new_message';
//import BN from 'bn.js';


function createKeypairFromFile(path: string): Keypair {
    return Keypair.fromSecretKey(
        Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8")))
    )
};


describe("Arweave_id_upload", async () => {

    // const connection = new Connection(`http://localhost:8899`, 'confirmed');
    const connection = new Connection(`https://api.devnet.solana.com/`, 'confirmed');
    // Or this:
    //const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
    
    const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
    
    const smart_contract = createKeypairFromFile('./program/chatappprogram-keypair.json');

    const smart_contract_Id = new PublicKey(
	    "Cfyh7qmWNNfakpPKScbZnnmfsixTBvDVq81vVDcyD1gQ"
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
        //getMessages();
        const res = await messageService.getAccountMessageHistory(connection,smart_contract_Id);

        console.log(res);
    });    
});