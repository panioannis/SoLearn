
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
 
const checkPrice = async () => {
	const irys = await getIrys();
 
	const numBytes = 1048576; // Number of bytes to check
	const priceAtomic = await irys.getPrice(numBytes);
 
	// Convert from atomic units to standard units
	const priceConverted = irys.utils.fromAtomic(numBytes);
 
	console.log(`Uploading ${numBytes} bytes costs ${priceConverted}`);
};

// Runs the check price function
checkPrice();
 


