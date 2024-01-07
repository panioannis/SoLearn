
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
 
const fundNode = async () => {
	const irys = await getIrys();
	try {
		const fundTx = await irys.fund(irys.utils.toAtomic(0.5));
		console.log(`Successfully funded ${irys.utils.fromAtomic(fundTx.quantity)} ${irys.token}`);
	} catch (e) {
		console.log("Error uploading data ", e);
	}
};

// Runs the function
fundNode();
 


