import Irys from "@irys/sdk";
import fetch from "node-fetch";
import dotenv from "dotenv";
import Query from "@irys/query";
dotenv.config();

// https://docs.irys.xyz/hands-on/tutorials/provenance-chain

// Returns a reference to an Irys node
const getIrys = async () => {
	const url = "https://devnet.irys.xyz";
	// Devnet RPC URLs change often, use a recent one from https://chainlist.org/chain/80001
	const providerUrl = "";
	const token = "matic";
	const privateKey = process.env.PRIVATE_KEY;
 
	const irys = new Irys({
		url: url, // URL of the node you want to connect to
		token: token, // Token used for payment
		key: privateKey, // ETH or SOL private key
		config: { providerUrl: providerUrl }, // Optional provider URL, only required when using Devnet
	});
	return irys;
};

// Stores the root transaction and returns the transaction id
const storeRoot = async (myData) => {
	const irys = await getIrys();
	const tags = [{ name: "Content-Type", value: "text/plain" }];
 
	const tx = await irys.upload(myData, { tags });
	return tx.id;
};

// Stores an "update" to the root transaction by creating
// a new transaction and tying it back to the original using
// the "root-id" metatag.
const storeUpdate = async (rootTxId, myData) => {
	const irys = await getIrys();
 
	const tags = [
		{ name: "Content-Type", value: "text/plain" },
		{ name: "root-tx", value: rootTxId },
	];
 
	const tx = await irys.upload(myData, { tags });
	return tx.id;
};

// Print the full provenance chain in a table
const printProveanceChainSDK = async (rootTxId) => {
	const provenanceChainData = await getProveanceChainSDK(rootTxId);
	console.table(provenanceChainData);
};

const myQuery = new Query({ url: "https://devnet.irys.xyz/graphql" });
 
// First, get the root TX
const rootTx = await myQuery
	.search("irys:transactions")
	.ids([rootTxId]);