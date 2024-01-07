
import Irys from "@irys/sdk";
import dotenv from "dotenv";
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
 
const uploadFolder = async () => {
	const irys = await getIrys();
 
	// Upload an entire folder
	const folderToUpload = "./my-images/"; // Path to folder
	try {
		const receipt = await irys.uploadFolder("./" + folderToUpload, {
			indexFile: "", // optional index file (file the user will load when accessing the manifest)
			batchSize: 50, //number of items to upload at once
			keepDeleted: false, // whether to keep now deleted items from previous uploads
		}); //returns the manifest ID
 
		console.log(`Files uploaded. Manifest Id ${receipt.id}`);
	} catch (e) {
		console.log("Error uploading file ", e);
	}
};
await uploadFolder();
 


