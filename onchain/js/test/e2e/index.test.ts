import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';



import {
  createNameRegistry,
  deleteNameRegistry,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
  reallocNameAccount,
  transferNameOwnership,
  updateNameRegistryData,
} from '../../src';

import Irys from "@irys/sdk";
import type BigNumber from "bignumber.js";
import type { UploadResponse } from "@irys/sdk/build/cjs/common/types";
// import dotenv from "dotenv";

// dotenv.config();

async function getIrys(): Promise<Irys> {
  const url = "https://devnet.irys.xyz";
  const providerUrl = "https://api.devnet.solana.com";
  const token = "solana";
  // const privateKey = process.env.SOL_PRIVATE_KEY;
  const privateKey =
    "5QHEzgMurPHzFJD46e5fCfTi3y1H9uFgN5CxZxy7booShAtBN3CTf6TzHZPN2oXqjPMYJLHRAL4DxJqcyMnoJGog";

  const irys = new Irys({
    url: url, // URL of the node you want to connect to
    token: token, // Token used for payment
    key: privateKey, // ETH or SOL private key
    config: { providerUrl: providerUrl }, // Optional provider URL, only required when using Devnet
  });

  return irys;
}

async function checkBalance(): Promise<BigNumber> {
  const irys: Irys = await getIrys();

  // Get loaded balance in atomic units
  
  const atomicBalance: BigNumber = await irys.getLoadedBalance();

  // Convert balance to standard units
  const convertedBalance: BigNumber = irys.utils.fromAtomic(atomicBalance);

  return convertedBalance;
}

const checkAndPrintBalance = async (): Promise<void> => {
  const balance: BigNumber = await checkBalance();
  const threshold: number = 0.1; // 10% threshold

  if (Math.abs(balance.toNumber()) <= threshold) {
    console.log(`Balance ${balance} is within 10% of 0, please fund.`);
  } else {
    console.log(`Balance ${balance} funding not yet needed.`);
  }
};

async function uploadRootFile(fileToUpload: string, commit_name: string, ref_value: string): Promise<String | null> {
  const irys = await getIrys();
  let receipt: UploadResponse | null = null;
  let retval: String | null = null;
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

async function uploadRootModel(fileToUpload: string, commit_name: string, ref_value: string): Promise<String | null> {
	const irys = await getIrys();
  let receipt: UploadResponse | null = null;
  let retval: String | null = null;


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

async function uploadRootStringData(dataToUpload: string, commit_name: string, ref_value: string): Promise<String | null> {
	const irys = await getIrys();
  let receipt: UploadResponse | null = null;
	let retval: String | null = null;
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

async function uploadProvFile(fileToUpload: string, rootTxId: string, commit_name: string, ref_value: string): Promise<String | null> {
  const irys = await getIrys();
  let receipt: UploadResponse | null = null;
  let retval: String | null = null;
  const tags = [
		{ name: commit_name, value: ref_value },
		{ name: "root-tx", value: rootTxId },
	];

  try {
    receipt = await irys.uploadFile(fileToUpload, { tags });
    console.log(`File uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
    retval = receipt.id; 
  } catch (e) {
    console.log("Error uploading file ", e);
  }

  return retval;
};

async function uploadProvModel(modelToUpload: string, rootTxId: string,  commit_name: string, ref_value: string): Promise<String | null> {
	const irys = await getIrys();
  let receipt: UploadResponse | null = null;
  let retval: String | null = null;

  const tags = [
		{ name: commit_name, value: ref_value },
		{ name: "root-tx", value: rootTxId },
	];
 
	try {
		receipt = await irys.uploadFile(modelToUpload, { tags });
		console.log(`File uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
    retval = receipt.id; 
	} catch (e) {
		console.log("Error uploading file ", e);
	}

	return retval;
};

async function uploadProvStringData(dataToUpload: string, rootTxId: string,  commit_name: string, ref_value: string): Promise<String | null> {
	const irys = await getIrys();
  let receipt: UploadResponse | null = null;
	let retval: String | null = null;
  
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


chai.use(chaiAsPromised);
const url = "https://api.devnet.solana.com";

function createKeypairFromFile(path: string): Keypair {
  return Keypair.fromSecretKey(
      Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8")))
  )
};

const getNameKey = async (  name: string,  nameClass?: PublicKey,  parentName?: PublicKey,) => {
  const hashedName = await getHashedName(name);
  const nameAccountKey = await getNameAccountKey(
    hashedName,
    nameClass,
    parentName,
  );
  return nameAccountKey;
};


describe('Name Service Program', async () => {
  const connection = new Connection(url, 'confirmed');
  // const payer = Keypair.generate();
  const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
  //const owner = Keypair.generate();
  const owner = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
  const space = 43;
  let nameKey: PublicKey;
  let name: string;

  checkAndPrintBalance();
  
  // before(async () => {
  //   const airdropSignature = await connection.requestAirdrop(
  //     payer.publicKey,
  //     LAMPORTS_PER_SOL,
  //   );
  //   await connection.confirmTransaction({
  //     signature: airdropSignature,
  //     ...(await connection.getLatestBlockhash()),
  //   });
  // });
  // it('Create Name Registery', async () => {
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   nameAccount.owner.equals(owner.publicKey);
  //   expect(nameAccount.data?.length).to.eql(space);
  // });
  it('Create Name Registery', async () => {  
    
    // ==================================================================================
    // ----------------------------- Allocate Name Registry -----------------------------
    // ==================================================================================

    const name = Math.random().toString() + '.sol';
    const nameKey = await getNameKey(name);
    const lamports = await connection.getMinimumBalanceForRentExemption(
      space + NameRegistryState.HEADER_LEN,
    );
    let inst = await createNameRegistry(connection,name,space,payer.publicKey,owner.publicKey,lamports);
    let tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer]);

    // ==================================================================================
    // ------------------------------- Place Root Node ----------------------------------
    // ==================================================================================

    let prev_id = "0000000000000000000000000000000000000000000";
    
    console.log("Arweave Id to be stored: \n" + prev_id + '\n');

    let IRYS_ID = await uploadProvStringData("1st Upload",prev_id,"Round","1");
    
    let data = Buffer.from("Nothing",'utf-8');
    if (IRYS_ID == null) {
      console.log("The string is null or undefined.");
    } else {
      console.log("The string is neither null nor undefined.");
      data = Buffer.from(IRYS_ID,'utf-8');
    }

    console.log("Arweave Id to be stored: \n" + data + '\n');
    
    inst = await updateNameRegistryData(connection, name, 0, data);
    tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer, owner]);
    
    let nameAccount = await NameRegistryState.retrieve(connection, nameKey);

    // ==================================================================================
    // -------------------------- Retrieve Name Registry --------------------------------
    // ==================================================================================

    nameAccount = await NameRegistryState.retrieve(connection, nameKey);
    console.log("Arweave Id retrieved from on-chain storage: \n" + nameAccount.data?.toString('utf8') + '\n');
    nameAccount.data?.equals(data);

    // ==================================================================================
    // ------------------------------- Place Additional Nodes ---------------------------
    // ==================================================================================

    nameAccount = await NameRegistryState.retrieve(connection, nameKey);
    prev_id = nameAccount.data?.toString('utf8') ?? "0000000000000000000000000000000000000000000";

    IRYS_ID = await uploadProvStringData("2nd Upload",prev_id!,"Round","2");
    
    data = Buffer.from("Nothing",'utf-8');
    if (IRYS_ID == null) {
      console.log("The string is null or undefined.");
    } else {                                                                                                                                                                                           
      console.log("The string is neither null nor undefined.");
      data = Buffer.from(IRYS_ID,'utf-8');
    }

    console.log("Arweave Id to be stored: \n" + data + '\n');
    
    inst = await updateNameRegistryData(connection, name, 0, data);
    tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer, owner]);

    // ==================================================================================
    // -------------------------- Retrieve Name Registry --------------------------------
    // ==================================================================================

    nameAccount = await NameRegistryState.retrieve(connection, nameKey);
    console.log("Arweave Id retrieved from on-chain storage: \n" + nameAccount.data?.toString('utf8') + '\n');
    nameAccount.data?.equals(data);

    // ==================================================================================
    // ------------------------------- Place Additional Nodes ---------------------------
    // ==================================================================================

    nameAccount = await NameRegistryState.retrieve(connection, nameKey);
    prev_id = nameAccount.data?.toString('utf8') ?? "0000000000000000000000000000000000000000000";

    IRYS_ID = await uploadProvStringData("2nd Upload",prev_id!,"Round","2");
    
    data = Buffer.from("Nothing",'utf-8');
    if (IRYS_ID == null) {
      console.log("The string is null or undefined.");
    } else {                                                                                                                                                                                           
      console.log("The string is neither null nor undefined.");
      data = Buffer.from(IRYS_ID,'utf-8');
    }

    console.log("Arweave Id to be stored: \n" + data + '\n');
    
    inst = await updateNameRegistryData(connection, name, 0, data);
    tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer, owner]);

    // ==================================================================================
    // -------------------------- Retrieve Name Registry --------------------------------
    // ==================================================================================

    nameAccount = await NameRegistryState.retrieve(connection, nameKey);
    console.log("Arweave Id retrieved from on-chain storage: \n" + nameAccount.data?.toString('utf8') + '\n');
    nameAccount.data?.equals(data);

    // ==================================================================================
    // -------------------------- Delete Name Registry ----------------------------------
    // ==================================================================================

    inst = await deleteNameRegistry(connection, name, payer.publicKey);
    tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer, owner]);
    let nullAccount = await connection.getAccountInfo(nameKey);
    expect(nullAccount).to.be.null;

  }).timeout(100000);

  // it('Update Name Registery Model 2', async () => {
  //   console.log("Connection \n" + connection + '  ' + nameKey + '\n');
  //   const readAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   const prev_id = readAccount.data?.toString('utf8') ?? "0000000000000000000000000000000000000000000";;
    
  //   console.log("Arweave Id to be stored: \n" + prev_id + '\n');

  //   const IRYS_ID = await uploadProvStringData("2nd Upload",prev_id!,"Round","2");
    
  //   let data = Buffer.from("Nothing",'utf-8');
  //   if (IRYS_ID == null) {
  //     console.log("The string is null or undefined.");
  //   } else {
  //     console.log("The string is neither null nor undefined.");
  //     data = Buffer.from(IRYS_ID,'utf-8');
  //   }

  //   console.log("Arweave Id to be stored: \n" + data + '\n');
    
    
  //   const inst = await updateNameRegistryData(connection, name, 0, data);
  //   const tx = new Transaction().add(inst);
  //   await sendAndConfirmTransaction(connection, tx, [payer, owner]);
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   // console.log(nameAccount);
  //   //console.log(JSON.stringify(nameAccount.data));
  //   console.log("Arweave Id retrieved from on-chain storage: \n" + nameAccount.data?.toString('utf8') + '\n');
  //   nameAccount.data?.equals(data);
    
  // }).timeout(100000);

  // it('Update Name Registery Model 2', async () => {
  //   const readAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   const prev_id = readAccount.data?.toString('utf8') ?? "0000000000000000000000000000000000000000000";;
    
  //   console.log("Arweave Id to be stored: \n" + prev_id + '\n');

  //   const IRYS_ID = await uploadProvStringData("2nd Upload",prev_id!,"Round","2");
    
  //   let data = Buffer.from("Nothing",'utf-8');
  //   if (IRYS_ID == null) {
  //     console.log("The string is null or undefined.");
  //   } else {
  //     console.log("The string is neither null nor undefined.");
  //     data = Buffer.from(IRYS_ID,'utf-8');
  //   }

  //   console.log("Arweave Id to be stored: \n" + data + '\n');
    
    
  //   const inst = await updateNameRegistryData(connection, name, 0, data);
  //   const tx = new Transaction().add(inst);
  //   await sendAndConfirmTransaction(connection, tx, [payer, owner]);
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   // console.log(nameAccount);
  //   //console.log(JSON.stringify(nameAccount.data));
  //   console.log("Arweave Id retrieved from on-chain storage: \n" + nameAccount.data?.toString('utf8') + '\n');
  //   nameAccount.data?.equals(data);

    
  // });

  // it('Update Name Registery Model 3', async () => {
  //   const readAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   const prev_id = readAccount.data?.toString('utf8');
    
  //   const IRYS_ID = await uploadProvStringData("3rd Upload",prev_id || "0000000000000000000000000000000000000000000","Round","3");
    
  //   let data = Buffer.from("Nothing",'utf-8');
  //   if (IRYS_ID == null) {
  //     console.log("The string is null or undefined.");
  //   } else {
  //     console.log("The string is neither null nor undefined.");
  //     data = Buffer.from(IRYS_ID,'utf-8');
  //   }

  //   console.log("Arweave Id to be stored: \n" + data + '\n');
    
    
  //   const inst = await updateNameRegistryData(connection, name, 0, data);
  //   const tx = new Transaction().add(inst);
  //   await sendAndConfirmTransaction(connection, tx, [payer, owner]);
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   // console.log(nameAccount);
  //   //console.log(JSON.stringify(nameAccount.data));
  //   console.log("Arweave Id retrieved from on-chain storage: \n" + nameAccount.data?.toString('utf8') + '\n');
  //   nameAccount.data?.equals(data);
  // });
 
  // it('Update Name Registery Model 4', async () => {
  //   const readAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   const prev_id = readAccount.data?.toString('utf8');
    
  //   const IRYS_ID = await uploadProvStringData("4th Upload",prev_id || "0000000000000000000000000000000000000000000","Round","4");
    
  //   let data = Buffer.from("Nothing",'utf-8');
  //   if (IRYS_ID == null) {
  //     console.log("The string is null or undefined.");
  //   } else {
  //     console.log("The string is neither null nor undefined.");
  //     data = Buffer.from(IRYS_ID,'utf-8');
  //   }

  //   console.log("Arweave Id to be stored: \n" + data + '\n');
    
    
  //   const inst = await updateNameRegistryData(connection, name, 0, data);
  //   const tx = new Transaction().add(inst);
  //   await sendAndConfirmTransaction(connection, tx, [payer, owner]);
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   // console.log(nameAccount);
  //   //console.log(JSON.stringify(nameAccount.data));
  //   console.log("Arweave Id retrieved from on-chain storage: \n" + nameAccount.data?.toString('utf8') + '\n');
  //   nameAccount.data?.equals(data);
  // });

  // it('Update Name Registery Model 5', async () => {
  //   const readAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   const prev_id = readAccount.data?.toString('utf8');
    
  //   const IRYS_ID = await uploadProvStringData("5th Upload",prev_id || "0000000000000000000000000000000000000000000","Round","5");
    
  //   let data = Buffer.from("Nothing",'utf-8');
  //   if (IRYS_ID == null) {
  //     console.log("The string is null or undefined.");
  //   } else {
  //     console.log("The string is neither null nor undefined.");
  //     data = Buffer.from(IRYS_ID,'utf-8');
  //   }

  //   console.log("Arweave Id to be stored: \n" + data + '\n');
    
    
  //   const inst = await updateNameRegistryData(connection, name, 0, data);
  //   const tx = new Transaction().add(inst);
  //   await sendAndConfirmTransaction(connection, tx, [payer, owner]);
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   // console.log(nameAccount);
  //   //console.log(JSON.stringify(nameAccount.data));
  //   console.log("Arweave Id retrieved from on-chain storage: \n" + nameAccount.data?.toString('utf8') + '\n');
  //   nameAccount.data?.equals(data);
  // });

  // it('Transfer Name Ownership', async () => {
  //   const newOwner = Keypair.generate();
  //   const inst = await transferNameOwnership(
  //     connection,
  //     name,
  //     newOwner.publicKey,
  //   );
  //   const tx = new Transaction().add(inst);
  //   await sendAndConfirmTransaction(connection, tx, [payer, owner]);
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   nameAccount.owner.equals(newOwner.publicKey);
  // });
  // it('Realloc Name Account to bigger space', async () => {
  //   const inst = await reallocNameAccount(
  //     connection,
  //     name,
  //     space + 10,
  //     payer.publicKey,
  //   );
  //   const tx = new Transaction().add(inst);
  //   await sendAndConfirmTransaction(connection, tx, [payer, owner]);
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   expect(nameAccount.data?.length).to.eql(space + 10);
  // });
  // it('Realloc Name Account to smaller space', async () => {
  //   const inst = await reallocNameAccount(
  //     connection,
  //     name,
  //     space - 10,
  //     payer.publicKey,
  //   );
  //   const tx = new Transaction().add(inst);
  //   await sendAndConfirmTransaction(connection, tx, [payer, owner]);
  //   const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
  //   expect(nameAccount.data?.length).to.eql(space - 10);
  // });
  // it('Delete Name Registry', async () => {
    
  // });
});

