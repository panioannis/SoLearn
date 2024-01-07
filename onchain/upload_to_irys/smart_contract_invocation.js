"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
function createKeypairFromFile(path) {
    return web3_js_1.Keypair.fromSecretKey(Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8"))));
}
;
describe("hello-solana", () => {
    // Loading these from local files for development
    //
    const connection = new web3_js_1.Connection(`http://localhost:8899`, 'confirmed');
    const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
    const program = createKeypairFromFile('./program/target/so/program-keypair.json');
    it("Say hello!", async () => {
        // We set up our instruction first.
        //
        let ix = new web3_js_1.TransactionInstruction({
            keys: [
                { pubkey: payer.publicKey, isSigner: true, isWritable: true }
            ],
            programId: program.publicKey,
            data: Buffer.alloc(0), // No data
        });
        // Now we send the transaction over RPC
        //
        await (0, web3_js_1.sendAndConfirmTransaction)(connection, new web3_js_1.Transaction().add(ix), // Add our instruction (you can add more than one)
        [payer]);
    });
});
