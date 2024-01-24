import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction,
  } from '@solana/web3.js';

import {
    createNameRegistry,
    deleteNameRegistry,
    getHashedName,
    getNameAccountKey,
    NameRegistryState,
    reallocNameAccount,
    transferNameOwnership,
    updateNameRegistryData,
  } from '.';


////////////////////////////////////////////////////////////
/**
 * Returns the namekey for the given name  
 *
 * @param name The name of the new account
 * @param space The space in bytes allocated to the account
 * @param nameClass The class of this new name
 * @param parentName The parent name of the new name. If specified its owner needs to sign
 * @returns
 */

const getNameKey = async (name: string,  nameClass?: PublicKey,  parentName?: PublicKey) => {
    const hashedName = await getHashedName(name);
    const nameAccountKey = await getNameAccountKey(
        hashedName,
        nameClass,
        parentName,
    );
    return nameAccountKey;
};

////////////////////////////////////////////////////////////
/**
 * Creates a Model Registry with the given rent budget, allocated space, owner and class.
 *
 * @param connection The solana connection object to the RPC node
 * @param name The name of the new account
 * @param space The space in bytes allocated to the account
 * @param payer The account that will pay for this transaction
 * @param owner The account that will be the owner of the new name account
 * @param lamports The budget to be set for the name account. If not specified, it'll be the minimum for rent exemption
 * @returns
 */

export const createModelRegistry = async (connection: Connection,name: string, space: number, payer: Keypair, owner: Keypair): Promise<void> =>{
    const lamports = await connection.getMinimumBalanceForRentExemption(
        space + NameRegistryState.HEADER_LEN
    );
    let inst = await createNameRegistry(connection,name,space,payer.publicKey,owner.publicKey,lamports);
    let tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer]);
}

////////////////////////////////////////////////////////////
/**
 * Upates the string data of a Model Registry
 *
 * @param connection The solana connection object to the RPC node
 * @param name The name of model registry account
 * @param payer The account that will pay for this transaction
 * @param owner The account that will be the owner of the new name account
 * @param modelChainId  The Irys Model Chain Id to be stored.
 * @returns
 */

export const updateModelRegistry = async (connection: Connection,name: string, payer: Keypair, owner: Keypair, modelChainId: string) =>{
    const data = Buffer.from(modelChainId);
    const inst = await updateNameRegistryData(connection, name, 0, data);
    const tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer, owner]);
}

////////////////////////////////////////////////////////////
/**
 * Retrieves the string data from the Model Registry
 *
 * @param connection The solana connection object to the RPC node
 * @param name The name of the new account
 * @param payer The account that will pay for this transaction
 * @param owner The account that will be the owner of the new name account
 * @param modelChainId  The Irys Model Chain Id to be stored.
 * @returns
 */

export const retrieveModelRegistry = async (connection: Connection,name: string): Promise<string> => {
    const nameKey = await getNameKey(name);
    const nameAccount = await NameRegistryState.retrieve(connection, nameKey);
    return nameAccount.data?.toString('utf8') ?? "0000000000000000000000000000000000000000000";
}

////////////////////////////////////////////////////////////
/**
 * Deletes a name account with the given rent budget, allocated space, owner and class.
 *
 * @param connection The solana connection object to the RPC node
 * @param name The name of the new account
 * @param payer The account that will pay for this transaction
 * @param owner The account that will be the owner of the new name account
 * @returns
 */

export const deleteModelRegistry = async (connection: Connection,name: string, payer: Keypair, owner: Keypair ) =>{
    const inst = await deleteNameRegistry(connection, name, payer.publicKey);
    const tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer, owner]);
}

////////////////////////////////////////////////////////////
/**
 * Reallocates a name account with the given rent budget, allocated space, owner and class.
 *
 * @param connection The solana connection object to the RPC node
 * @param name The name of the new account
 * @param space The space in bytes allocated to the account
 * @param payer The reallocation cost payer
 * @param owner The pubkey to be set as owner of the new name account
 * @param amount The amount to add or subtract to the account
 * @returns
 */

export const reallocateModelRegistry = async (connection: Connection,name: string, payer: Keypair, owner: Keypair, space: number, amount: number): Promise<void> => {
    const inst = await reallocNameAccount(
        connection,
        name,
        space + amount,
        payer.publicKey,
    );
    const tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer, owner]);
}

////////////////////////////////////////////////////////////
/**
 * Transfers a name account with the given rent budget, allocated space, owner and class.
 *
 * @param connection The solana connection object to the RPC node
 * @param name The name of the new account
 * @param space The space in bytes allocated to the account
 * @param payer The transfer cost payer
 * @param owner The previous owner
 * @param amount The amount to add or subtract to the account
 * @returns
 */


export const transferModelRegistry = async (connection: Connection,name: string, payer: Keypair, owner: Keypair, newOwner: Keypair, space: number) =>{
    const inst = await transferNameOwnership(
      connection,
      name,
      newOwner.publicKey,
    );
    const tx = new Transaction().add(inst);
    await sendAndConfirmTransaction(connection, tx, [payer, owner]);
}