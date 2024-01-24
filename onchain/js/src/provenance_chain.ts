import fetch from "node-fetch";
import Query from "@irys/query";
  
// ============================================================================
// https://docs.irys.xyz/hands-on/tutorials/provenance-chain
// https://docs.irys.xyz/developer-docs/querying/query-package
// ============================================================================

// Query for the selected model update chain
export const getProvenanceModelChainList = async(rootTxId: string): Promise<any[]> =>{
	const provenanceChainData: any[] = [];
 
	let  url = `https://gateway.irys.xyz/${rootTxId}`;
	let  response = await fetch(url);
	let  data = await response.text();
  
  console.log("The data retrieved is" + data + "\n");

  let resultArray: string[] = data.split(" || ");

  provenanceChainData.push(resultArray[0]);
  console.log("The Model retrieved is" + resultArray[0] + "\n");

  while (resultArray[1]!== "0000000000000000000000000000000000000000000") {

    url = `https://gateway.irys.xyz/${resultArray[1]}`;
    response = await fetch(url);
    const data = await response.text();
      
    console.log("The data retrieved is" + data + "\n");

    resultArray  = data.split(" || ");

    provenanceChainData.push(resultArray[0]);
    console.log("The Model retrieved is" + resultArray[0] + "\n");

  }
	return provenanceChainData;
};

// Query for all transactions tagged as having a root-tx matching ours
export const getProveanceChainSDK = async(rootTxId: string): Promise<any[]> =>{
	const provenanceChainData: any[] = [];
 
	// Connect to a Query object
	const myQuery = new Query({ url: "https://devnet.irys.xyz/graphql" });
 
	// First, get the root TX
	const rootTx = await myQuery
		.search("irys:transactions")
		.ids([rootTxId]);
  
  //console.log("Data retrieved from Irys = " + rootTx + "\n");

	// Extract the id and timestamp and download the data payload
	if (rootTx) {
		const unixTimestamp = rootTx[0].timestamp;
		const date = new Date(unixTimestamp);
		
    const humanReadable = dateToHumanReadable(date);
 
		const url = `https://gateway.irys.xyz/${rootTx[0].id}`;
		const response = await fetch(url);
		const data = await response.text();
 
		const provenanceEntry = { Date: humanReadable, Data: humanReadable };
    //const provenanceEntry = { Date: humanReadable, Data: data };
		provenanceChainData.push(provenanceEntry);
	}
 
	// Now, get the provenance chain
	const chain = await myQuery
		.search("irys:transactions")
		.tags([{ name: "root-tx", values: [rootTxId] }]);
  
  //console.log("Data retrieved from Irys = " + chain + "\n");

	// Iterate over entries
	for (const item of chain) {
		const unixTimestamp = item.timestamp;
		const date = new Date(unixTimestamp);
    
    const humanReadable = dateToHumanReadable(date);
 
		const url = `https://gateway.irys.xyz/${item.id}`;
		const response = await fetch(url);
		const data = await response.text();
 
		const provenanceEntry = { Date: humanReadable, Data: humanReadable };
    //const provenanceEntry = { Date: humanReadable, Data: data };
		provenanceChainData.push(provenanceEntry);
	}
	return provenanceChainData;
};

// Print the full provenance chain in a table
export const printProvenanceChainSDK = async(rootTxId: string): Promise<void> =>{
	const provenanceChainData = await getProveanceChainSDK(rootTxId);
	console.table(provenanceChainData);
};

// Takes date and produces a human readable string accurate to the milisecond
export const dateToHumanReadable = (date) => {
  const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3, // milliseconds
  };

  // Pass "undefined" to force the default local to be used for formatting
  return date.toLocaleString(undefined, options);
};
    
