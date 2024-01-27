import Irys from "@irys/sdk";
import type BigNumber from "bignumber.js";
import type { UploadResponse } from "@irys/sdk/build/cjs/common/types";
import fs from "fs";


export const getIrys = async(): Promise<Irys> => {
    const url = "https://devnet.irys.xyz";
    const providerUrl = "https://api.devnet.solana.com";
    const token = "solana";
    const privateKey = process.env.SOL_PRIVATE_KEY;
    //console.log("Solana privateKey: \n" + privateKey + '\n');

    const irys = new Irys({
        url: url, // URL of the node you want to connect to
        token: token, // Token used for payment
        key: privateKey, // ETH or SOL private key
    config: { providerUrl: providerUrl }, // Optional provider URL, only required when using Devnet
});

return irys;
};

export const checkBalance = async(): Promise<BigNumber> => {
    const irys: Irys = await getIrys();

    // Get loaded balance in atomic units
    const atomicBalance: BigNumber = await irys.getLoadedBalance();

    // Convert balance to standard units
    const convertedBalance: BigNumber = irys.utils.fromAtomic(atomicBalance);

    return convertedBalance;
};

export const checkAndPrintBalance = async (): Promise<void> => {
    const balance: BigNumber = await checkBalance();
    const threshold: number = 0.1; // 10% threshold

    if (Math.abs(balance.toNumber()) <= threshold) {
        console.log(`Balance ${balance} is within 10% of 0, please fund.`);
    } else {
        console.log(`Balance ${balance} funding not yet needed.`);
    }
};

export const uploadRootFile = async (fileToUpload: string, commit_name: string, ref_value: string): Promise<string | null> => {
    const irys = await getIrys();
    let receipt: UploadResponse | null = null;
    let retval: string | null = null;
    const tags = [{ name: commit_name, value: ref_value }];

    try {
        receipt = await irys.uploadFile(fileToUpload, { tags });
        console.log(`File uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
        retval = receipt.id; 
    } catch (e) {
        console.log("Error uploading file ", e);
    }

    return retval;
}

export const uploadRootModel = async (fileToUpload: string, commit_name: string, ref_value: string): Promise<string | null> => {
    const irys = await getIrys();
    let receipt: UploadResponse | null = null;
    let retval: string | null = null;


    const tags = [{ name: commit_name, value: ref_value }];

    try {
        receipt = await irys.uploadFile(fileToUpload, { tags });
        console.log(`File uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
    retval = receipt.id; 
    } catch (e) {
        console.log("Error uploading file ", e);
    }

    return retval;
};

export const uploadRootStringData = async (dataToUpload: string, commit_name: string, ref_value: string): Promise<string | null> => {
    const irys = await getIrys();
    let receipt: UploadResponse | null = null;
    let retval: string | null = null;
    const tags = [{ name: commit_name, value: ref_value }];
    
    try {
        receipt = await irys.upload(dataToUpload, { tags });
        console.log(`Data uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
    retval = receipt.id; 
    } catch (e) {
        console.log("Error uploading data ", e);
    }
    return retval;
};

export const uploadProvFile = async (fileToUpload: string, rootTxId: string, commit_name: string, ref_value: string): Promise<string | null> => {
    const irys = await getIrys();
    let receipt: UploadResponse | null = null;
    let retval: string | null = null;

    const { size } = await fs.promises.stat(fileToUpload);
    const price = await irys.getPrice(size);

    const balance: BigNumber = await checkBalance();
    const threshold: number = 0.1; // 10% threshold

    if (Math.abs(balance.toNumber()) <= threshold) {
        await irys.fund(price);
    } 

    const priceConverted = irys.utils.fromAtomic(size);
    console.log(`Uploading ${size} bytes costs ${priceConverted}`);
    // Write tags to file ( might remove later as they are only relevant in queries)

    const tags = [
            { name: commit_name, value: ref_value },
            { name: "root-tx", value: rootTxId },
        ];

    // Upload the file and return Irys id.

    try {
        receipt = await irys.uploadFile(fileToUpload, { tags });
        console.log(`File uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
        retval = receipt.id; 
    } catch (e) {
        console.log("Error uploading file ", e);
    }

return retval;
};

export const uploadProvModel = async (modelToUpload: string, rootTxId: string,  commit_name: string, ref_value: string): Promise<string | null> => {
    const irys = await getIrys();
    let receipt: UploadResponse | null = null;
    let retval: string | null = null;

    // Get number of bytes to print predicted price! 

    // let filesManager = new FilesManager();
    // const numBytes = filesManager.getFileSize(fileToUpload);
    // const priceConverted = irys.utils.fromAtomic(numBytes);
    // console.log(`Uploading ${numBytes} bytes costs ${priceConverted}`);

    const { size } = await fs.promises.stat(modelToUpload);
    const price = await irys.getPrice(size);

    const balance: BigNumber = await checkBalance();
    const threshold: number = 0.1; // 10% threshold

    if (Math.abs(balance.toNumber()) <= threshold) {
        await irys.fund(price);
    } 

    const priceConverted = irys.utils.fromAtomic(size);
    console.log(`Uploading ${size} bytes costs ${priceConverted}`);
    // Write tags to file ( might remove later as they are only relevant in queries)

    const tags = [
            { name: commit_name, value: ref_value },
            { name: "root-tx", value: rootTxId },
    ];

    // Upload the file and return Irys id.

    try {
        receipt = await irys.uploadFile(modelToUpload, { tags });
        console.log(`File uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
    retval = receipt.id; 
    } catch (e) {
        console.log("Error uploading file ", e);
    }

    return retval;
};

export const uploadProvListNode = async (storedModelId: string, prevNodeId: string, rootTxId : string, commit_name: string, ref_value: string): Promise<string | null> => {
    const irys = await getIrys();
    let receipt: UploadResponse | null = null;
    let retval: string | null = null;

    const dataToUpload = storedModelId + " || " + prevNodeId;

    const size = dataToUpload.length; 
    const price = await irys.getPrice(size);

    const balance: BigNumber = await checkBalance();
    const threshold: number = 0.1; // 10% threshold

    if (Math.abs(balance.toNumber()) <= threshold) {
        await irys.fund(price);
    } 

    const priceConverted = irys.utils.fromAtomic(size);
    console.log(`Uploading ${size} bytes costs ${priceConverted}`);

    // Write tags to file ( might remove later as they are only relevant in queries)

    const tags = [
            { name: commit_name, value: ref_value },
            { name: "root-tx", value: rootTxId },
        ];
        
    try {
            receipt = await irys.upload(dataToUpload, { tags });
            console.log(`Data uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
        retval = receipt.id; 
        } catch (e) {
            console.log("Error uploading data ", e);
        }
    return retval;
};

export const uploadProvStringData = async (dataToUpload: string, rootTxId: string,  commit_name: string, ref_value: string): Promise<string | null> => {
    const irys = await getIrys();
    let receipt: UploadResponse | null = null;
    let retval: string | null = null;

    const size = dataToUpload.length; 
    const price = await irys.getPrice(size);

    const balance: BigNumber = await checkBalance();
    const threshold: number = 0.1; // 10% threshold

    if (Math.abs(balance.toNumber()) <= threshold) {
        await irys.fund(price);
    } 

    const priceConverted = irys.utils.fromAtomic(size);
    console.log(`Uploading ${size} bytes costs ${priceConverted}`);

    // Write tags to file ( might remove later as they are only relevant in queries)

    const tags = [
            { name: commit_name, value: ref_value },
            { name: "root-tx", value: rootTxId },
        ];
        
    try {
            receipt = await irys.upload(dataToUpload, { tags });
            console.log(`Data uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
        retval = receipt.id; 
        } catch (e) {
            console.log("Error uploading data ", e);
        }
    return retval;
};

export const uploadModelUpdate = async (modelPath: string,prevId: string,rootTxId: string): Promise<string | null> => {
    console.log("Arweave Id to be stored: \n" + prevId + '\n');
    
//    let modelId = await uploadProvModel(modelPath,rootTxId,"Content-Type","text/plain");

    let modelId = await uploadProvModel(modelPath, rootTxId,"Content-Type","text/plain");

    let nodeId = await uploadProvListNode(modelId as string, prevId, rootTxId,"Content-Type","text/plain");

    

    return nodeId
}