import Irys from "@irys/sdk";
//const Irys = require("@irys/sdk");
import dotenv from "dotenv";
//const dotenv = require("dotenv");
//import { serialize } from 'borsh';
//const borsh = require("borsh");
//import lo from 'buffer-layout';
//const lo = require("buffer-layout");

const web3 = require("@solana/web3.js");
dotenv.config();

const getIrys = async () => {
	const url = "https://devnet.irys.xyz";
	const providerUrl = "https://api.devnet.solana.com";
	const token = "solana";
	const privateKey = process.env.SOL_PRIVATE_KEY;
 
	const irys = new Irys({
		url: url, // URL of the node you want to connect to
		token: token, // Token used for payment
		key: privateKey, // ETH or SOL private key
		config: { providerUrl: providerUrl }, // Optional provider URL, only required when using Devnet
	});
	return irys;
};
 
const uploadFile = async () => {
	const irys = await getIrys();
	// Your file
	const fileToUpload = "./demo.png";
 
	const tags = [{ name: "Model", value: "1.0" }];
 
	try {
		const receipt = await irys.uploadFile(fileToUpload, { tags });
		console.log(`File uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
	} catch (e) {
		console.log("Error uploading file ", e);
	}

	return receipt.id
};
//==============================================================

// https://docs.solana.com/developing/clients/javascript-reference

//==============================================================

// Upload file function

// Read and parse the local Keypair

function createKeypairFromFile(path){
    return web3.Keypair.fromSecretKey(
        Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8")))
    )
};


async function main(){

    // Upload model and Get Arweave ID

    //const model_id = await uploadFile();

    const model_id = "QfKggutJliM2tWWvaIj5K-C4D_Ydg6Bc0kZokCba51E";

    // Enstablish a connection to the preffered Cluster (Mainet, Devnet, localhost)

    const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
    //const connection = new Connection(`http://localhost:8899`, 'confirmed');
    // We need a payer to pay for the smart contract execution and invoke the smart contract

    const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');

    // Read smart contract program Id from file: Change the program-keypair.json to the appropriate keypair 
    const smart_contract = web3.createKeypairFromFile('./program/chatappprogram-keypair.json');

    // Insert the smart contract program id here
    const smart_contract_Id = new web3.PublicKey(
	    "Cfyh7qmWNNfakpPKScbZnnmfsixTBvDVq81vVDcyD1gQ"
    );

    program_id = smart_contract.PublicKey;  

    console.log(smart_contract_Id.toBase58());

    const messageService = new MessageService();

    await messageService.sendMessage(connection,payer,smart_contract_Id,model_id);

    let res = await messageService.getAccountMessageHistory(connection,smart_contract_Id);

    console.log(res);
}
main();
// function getTxIdFromArweave(newTxId) {
//   // save message to arweave and get back txid;
//   let txid = "";
//   const dummyLength = DUMMY_TX_ID.length - newTxId.length;
//   for (let i = 0; i < dummyLength; i++) {
//     txid += "0";
//   }
//   txid += newTxId;
//   console.log("getTxIdFromArweave", txid);
//   return txid;
// }

// // get value and add dummy values
// function getCreatedOn() {
//   const now = Date.now().toString();
//   console.log("now", now);
//   const total = DUMMY_CREATED_ON.length;
//   const diff = total - now.length;
//   let prefix = "";
//   for (let i = 0; i < diff; i++) {
//     prefix += "0";
//   }
//   const created_on = prefix + now;
//   console.log("created_on", created_on);
//   return created_on;
// }

// it("Send a message to the Smart contract", async () => {
// 	// We set up our instruction first.
// 	//
//   console.log("start sendMessage");
//   const messageObj = new ChatMessage();
//   //messageObj.archive_id = getTxIdFromArweave(await uploadFile());
//   messageObj.archive_id = getTxIdFromArweave(model_id);
//   messageObj.created_on = getCreatedOn();

// 	let ix = new web3.TransactionInstruction({
// 		keys: [
// 			{pubkey: payer.publicKey, isSigner: true, isWritable: true},
// 		],
// 		programId: smart_contract_Id.publicKey,
// 		data: Buffer.from(serialize(ChatMessageSchema, messageObj)),
// 	});

// 	// Send the contract through RPC
// 	//
// 	await web3.sendAndConfirmTransaction(
// 		connection, 
// 		new web3.Transaction().add(ix),
// 		[payer]
// 	);
//   console.log("end sendMessage");
// });

// // Create Simple Transaction
// let tx = new web3.Transaction();

// // Add an instruction to execute
// tx.add(
//   web3.SystemProgram.transfer({
//     fromPubkey: payer.publicKey,
//     toPubkey: toAccount.publicKey,
//     lamports: 1000,
//   }),
// );

// // Send and confirm transaction
// // Note: feePayer is by default the first signer, or payer, if the parameter is not set
// await web3.sendAndConfirmTransaction(connection, tx, [payer]);


