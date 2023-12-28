
import Irys from "@irys/sdk";
import dotenv from "dotenv";
import { serialize } from 'borsh';
import lo from 'buffer-layout';
dotenv.config();

  
const CHAT_MESSAGE_ELEMENTS_COUNT = 20
const DUMMY_TX_ID = "0000000000000000000000000000000000000000000"
const DUMMY_CREATED_ON = "0000000000000000"
class ChatMessage {
  archive_id = DUMMY_TX_ID
  created_on = DUMMY_CREATED_ON // max milliseconds in date
  constructor(fields = undefined) {
    if (fields) {
      this.archive_id = fields.archive_id
      this.created_on = fields.created_on
    }
  }
}

const ChatMessageSchema = new Map([
  [
    ChatMessage,
    {
      kind: "struct",
      fields: [
        ["archive_id", "String"],
        ["created_on", "String"]
      ]
    }
  ]
])

class MessageService {
  CHAT_MESSAGES_SIZE = 0
  setChatMessagesDataSize() {
    const sampleChatMessages = this.getDefaultChatMessages()

    let length = 0
    for (let i = 0; i < sampleChatMessages.length; i++) {
      length += serialize(ChatMessageSchema, sampleChatMessages[i]).length
    }
    this.CHAT_MESSAGES_SIZE = length + 4 // plus 4 due to some data diffs between client and program
  }

  constructor() {
    this.setChatMessagesDataSize()
  }

  getDefaultChatMessages() {
    const chatMessages = []
    for (let i = 0; i < CHAT_MESSAGE_ELEMENTS_COUNT; i++) {
      chatMessages.push(new ChatMessage())
    }

    return chatMessages
  }

  async getAccountMessageHistory(connection, pubKeyStr) {
    const sentPubkey = new web3.PublicKey(pubKeyStr)
    const sentAccount = await connection.getAccountInfo(sentPubkey)
    // get and deserialize solana account data and receive txid
    // go to arweave and query using these txid
    // parse json and return ChatMessages
    if (!sentAccount) {
      throw Error(`Account ${pubKeyStr} does not exist`)
    }
    const archive_id = lo.cstr("archive_id")
    const created_on = lo.cstr("created_on")
    const dataStruct = lo.struct(
      [archive_id, lo.seq(lo.u8(), 2), created_on, lo.seq(lo.u8(), 2)],
      "ChatMessage"
    )
    const ds = lo.seq(dataStruct, CHAT_MESSAGE_ELEMENTS_COUNT)
    const messages = ds.decode(sentAccount.data)
    return messages
  }

  async sendMessage(connection, payer, smart_contract_Id, destPubkeyStr, txid) {
    console.log("start sendMessage")
    const destPubkey = new web3.PublicKey(destPubkeyStr)

    const messageObj = new ChatMessage()
    messageObj.archive_id = this.getTxIdFromArweave(txid)
    messageObj.created_on = this.getCreatedOn()

    const ix = new web3.TransactionInstruction({
      keys: [{ pubkey: destPubkey, isSigner: false, isWritable: true }],
      programId: smart_contract_Id,
      data: Buffer.from(serialize(ChatMessageSchema, messageObj))
    })
    // Send the contract through RPC
    //
    await web3.sendAndConfirmTransaction(
      connection,
      new web3.Transaction().add(ix),
      [payer]
    )
    console.log("end sendMessage", result)
    return result
  }

  getTxIdFromArweave(newTxId) {
    // save message to arweave and get back txid;
    let txid = newTxId
    const dummyLength = DUMMY_TX_ID.length - newTxId.length
    for (let i = 0; i < dummyLength; i++) {
      txid += "0"
    }
    txid += newTxId
    console.log("getTxIdFromArweave", txid)
    return txid
  }

  // get value and add dummy values
  getCreatedOn() {
    const now = Date.now().toString()
    console.log("now", now)
    const total = DUMMY_CREATED_ON.length
    const diff = total - now.length
    let prefix = ""
    for (let i = 0; i < diff; i++) {
      prefix += "0"
    }
    const created_on = prefix + now
    console.log("created_on", created_on)
    return created_on
  }
}


const messageService = new MessageService();


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
const web3 = require("@solana/web3.js");
const nacl = require("tweetnacl");

// Read and parse the local Keypair

function createKeypairFromFile(path: string): web3.Keypair {
    return web3.Keypair.fromSecretKey(
        Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8")))
    )
};

// Upload model and Get Arweave ID

const model_id = await uploadFile();

// Enstablish a connection to the preffered Cluster (Mainet, Devnet, localhost)

const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
//const connection = new Connection(`http://localhost:8899`, 'confirmed');

// We need a payer to pay for the smart contract execution and invoke the smart contract

const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');


// Read smart contract program Id from file: Change the program-keypair.json to the appropriate keypair 
//const smart_contract_Id = web3.createKeypairFromFile('./program/target/so/program-keypair.json');

// Insert the smart contract program id here
const smart_contract_Id = new web3.PublicKey(
	"8BwA9GkS6Qi8Lfob5uBN8LUYxwqu1J2hkNL1UAsBKPkR"
);
console.log(smart_contract_Id.toBase58());


function getTxIdFromArweave(newTxId: string): string {
  // save message to arweave and get back txid;
  let txid = "";
  const dummyLength = DUMMY_TX_ID.length - newTxId.length;
  for (let i = 0; i < dummyLength; i++) {
    txid += "0";
  }
  txid += newTxId;
  console.log("getTxIdFromArweave", txid);
  return txid;
}

// get value and add dummy values
function getCreatedOn(): string {
  const now = Date.now().toString();
  console.log("now", now);
  const total = DUMMY_CREATED_ON.length;
  const diff = total - now.length;
  let prefix = "";
  for (let i = 0; i < diff; i++) {
    prefix += "0";
  }
  const created_on = prefix + now;
  console.log("created_on", created_on);
  return created_on;
}

it("Send a message to the Smart contract", async () => {
	// We set up our instruction first.
	//
  console.log("start sendMessage");
  const messageObj = new ChatMessage();
  //messageObj.archive_id = getTxIdFromArweave(await uploadFile());
  messageObj.archive_id = getTxIdFromArweave(model_id);
  messageObj.created_on = getCreatedOn();

	let ix = new web3.TransactionInstruction({
		keys: [
			{pubkey: payer.publicKey, isSigner: true, isWritable: true},
		],
		programId: smart_contract_Id.publicKey,
		data: Buffer.from(serialize(ChatMessageSchema, messageObj)),
	});

	// Send the contract through RPC
	//
	await web3.sendAndConfirmTransaction(
		connection, 
		new web3.Transaction().add(ix),
		[payer]
	);
  console.log("end sendMessage");
});

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


