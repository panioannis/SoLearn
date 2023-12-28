
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
 
const checkBalance = async () => {
	const irys = await getIrys();
 
	// Get loaded balance in atomic units
	const atomicBalance = await irys.getLoadedBalance();
	// Convert balance to standard units
	const convertedBalance = irys.utils.fromAtomic(atomicBalance);
	return convertedBalance;
};
 
const checkAndPrintBalance = async () => {
	const balance = await checkBalance();
	const threshold = 0.1; // 10% threshold
 
	if (Math.abs(balance) <= threshold) {
		console.log(`Balance ${balance} is within 10% of 0, please fund.`);
	} else {
		console.log(`Balance ${balance} funding not yet needed.`);
	}
};
 
// Call the function immediately
checkAndPrintBalance();
 


