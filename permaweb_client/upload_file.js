"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var sdk_1 = require("@irys/sdk");
var dotenv_1 = require("dotenv");
var borsh_1 = require("borsh");
var buffer_layout_1 = require("buffer-layout");
dotenv_1.default.config();
var CHAT_MESSAGE_ELEMENTS_COUNT = 20;
var DUMMY_TX_ID = "0000000000000000000000000000000000000000000";
var DUMMY_CREATED_ON = "0000000000000000";
var ChatMessage = /** @class */ (function () {
    function ChatMessage(fields) {
        if (fields === void 0) { fields = undefined; }
        this.archive_id = DUMMY_TX_ID;
        this.created_on = DUMMY_CREATED_ON; // max milliseconds in date
        if (fields) {
            this.archive_id = fields.archive_id;
            this.created_on = fields.created_on;
        }
    }
    return ChatMessage;
}());
var ChatMessageSchema = new Map([
    [
        ChatMessage,
        {
            kind: "struct",
            fields: [
                ["archive_id", "String"],
                ["created_on", "String"],
            ],
        },
    ],
]);
var MessageService = /** @class */ (function () {
    function MessageService() {
        this.CHAT_MESSAGES_SIZE = 0;
        this.setChatMessagesDataSize();
    }
    MessageService.prototype.setChatMessagesDataSize = function () {
        var sampleChatMessages = this.getDefaultChatMessages();
        var length = 0;
        for (var i = 0; i < sampleChatMessages.length; i++) {
            length += (0, borsh_1.serialize)(ChatMessageSchema, sampleChatMessages[i]).length;
        }
        this.CHAT_MESSAGES_SIZE = length + 4; // plus 4 due to some data diffs between client and program
    };
    MessageService.prototype.getDefaultChatMessages = function () {
        var chatMessages = [];
        for (var i = 0; i < CHAT_MESSAGE_ELEMENTS_COUNT; i++) {
            chatMessages.push(new ChatMessage());
        }
        return chatMessages;
    };
    MessageService.prototype.getAccountMessageHistory = function (connection, pubKeyStr) {
        return __awaiter(this, void 0, void 0, function () {
            var sentPubkey, sentAccount, archive_id, created_on, dataStruct, ds, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sentPubkey = new web3.PublicKey(pubKeyStr);
                        return [4 /*yield*/, connection.getAccountInfo(sentPubkey)];
                    case 1:
                        sentAccount = _a.sent();
                        // get and deserialize solana account data and receive txid
                        // go to arweave and query using these txid
                        // parse json and return ChatMessages
                        if (!sentAccount) {
                            throw Error("Account ".concat(pubKeyStr, " does not exist"));
                        }
                        archive_id = buffer_layout_1.default.cstr("archive_id");
                        created_on = buffer_layout_1.default.cstr("created_on");
                        dataStruct = buffer_layout_1.default.struct([archive_id, buffer_layout_1.default.seq(buffer_layout_1.default.u8(), 2), created_on, buffer_layout_1.default.seq(buffer_layout_1.default.u8(), 2)], "ChatMessage");
                        ds = buffer_layout_1.default.seq(dataStruct, CHAT_MESSAGE_ELEMENTS_COUNT);
                        messages = ds.decode(sentAccount.data);
                        return [2 /*return*/, messages];
                }
            });
        });
    };
    MessageService.prototype.sendMessage = function (connection, payer, smart_contract_Id, destPubkeyStr, txid) {
        return __awaiter(this, void 0, void 0, function () {
            var destPubkey, messageObj, ix;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("start sendMessage");
                        destPubkey = new web3.PublicKey(destPubkeyStr);
                        messageObj = new ChatMessage();
                        messageObj.archive_id = this.getTxIdFromArweave(txid);
                        messageObj.created_on = this.getCreatedOn();
                        ix = new web3.TransactionInstruction({
                            keys: [
                                { pubkey: destPubkey, isSigner: false, isWritable: true }
                            ],
                            programId: smart_contract_Id,
                            data: Buffer.from((0, borsh_1.serialize)(ChatMessageSchema, messageObj)),
                        });
                        // Send the contract through RPC
                        //
                        return [4 /*yield*/, web3.sendAndConfirmTransaction(connection, new web3.Transaction().add(ix), [payer])];
                    case 1:
                        // Send the contract through RPC
                        //
                        _a.sent();
                        console.log("end sendMessage", result);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    MessageService.prototype.getTxIdFromArweave = function (newTxId) {
        // save message to arweave and get back txid;
        var txid = newTxId;
        var dummyLength = DUMMY_TX_ID.length - newTxId.length;
        for (var i = 0; i < dummyLength; i++) {
            txid += "0";
        }
        txid += newTxId;
        console.log("getTxIdFromArweave", txid);
        return txid;
    };
    // get value and add dummy values
    MessageService.prototype.getCreatedOn = function () {
        var now = Date.now().toString();
        console.log("now", now);
        var total = DUMMY_CREATED_ON.length;
        var diff = total - now.length;
        var prefix = "";
        for (var i = 0; i < diff; i++) {
            prefix += "0";
        }
        var created_on = prefix + now;
        console.log("created_on", created_on);
        return created_on;
    };
    return MessageService;
}());
var messageService = new MessageService();
var getIrys = function () { return __awaiter(void 0, void 0, void 0, function () {
    var url, providerUrl, token, privateKey, irys;
    return __generator(this, function (_a) {
        url = "https://devnet.irys.xyz";
        providerUrl = "https://api.devnet.solana.com";
        token = "solana";
        privateKey = process.env.SOL_PRIVATE_KEY;
        irys = new sdk_1.default({
            url: url,
            token: token,
            key: privateKey,
            config: { providerUrl: providerUrl }, // Optional provider URL, only required when using Devnet
        });
        return [2 /*return*/, irys];
    });
}); };
var uploadFile = function () { return __awaiter(void 0, void 0, void 0, function () {
    var irys, fileToUpload, tags, receipt, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getIrys()];
            case 1:
                irys = _a.sent();
                fileToUpload = "./demo.png";
                tags = [{ name: "Model", value: "1.0" }];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, irys.uploadFile(fileToUpload, { tags: tags })];
            case 3:
                receipt = _a.sent();
                console.log("File uploaded ==> https://gateway.irys.xyz/".concat(receipt.id));
                return [3 /*break*/, 5];
            case 4:
                e_1 = _a.sent();
                console.log("Error uploading file ", e_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/, receipt.id];
        }
    });
}); };
//==============================================================
// https://docs.solana.com/developing/clients/javascript-reference
//==============================================================
// Upload file function
var web3 = require("@solana/web3.js");
var nacl = require("tweetnacl");
// Read and parse the local Keypair
function createKeypairFromFile(path) {
    return web3.Keypair.fromSecretKey(Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8"))));
}
;
// Upload model and Get Arweave ID
var model_id = await uploadFile();
// Enstablish a connection to the preffered Cluster (Mainet, Devnet, localhost)
var connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
//const connection = new Connection(`http://localhost:8899`, 'confirmed');
// We need a payer to pay for the smart contract execution and invoke the smart contract
var payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
// Read smart contract program Id from file: Change the program-keypair.json to the appropriate keypair 
//const smart_contract_Id = web3.createKeypairFromFile('./program/target/so/program-keypair.json');
// Insert the smart contract program id here
var smart_contract_Id = new web3.PublicKey("8BwA9GkS6Qi8Lfob5uBN8LUYxwqu1J2hkNL1UAsBKPkR");
console.log(smart_contract_Id.toBase58());
function getTxIdFromArweave(newTxId) {
    // save message to arweave and get back txid;
    var txid = "";
    var dummyLength = DUMMY_TX_ID.length - newTxId.length;
    for (var i = 0; i < dummyLength; i++) {
        txid += "0";
    }
    txid += newTxId;
    console.log("getTxIdFromArweave", txid);
    return txid;
}
// get value and add dummy values
function getCreatedOn() {
    var now = Date.now().toString();
    console.log("now", now);
    var total = DUMMY_CREATED_ON.length;
    var diff = total - now.length;
    var prefix = "";
    for (var i = 0; i < diff; i++) {
        prefix += "0";
    }
    var created_on = prefix + now;
    console.log("created_on", created_on);
    return created_on;
}
it("Send a message to the Smart contract", function () { return __awaiter(void 0, void 0, void 0, function () {
    var messageObj, ix;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // We set up our instruction first.
                //
                console.log("start sendMessage");
                messageObj = new ChatMessage();
                //messageObj.archive_id = getTxIdFromArweave(await uploadFile());
                messageObj.archive_id = getTxIdFromArweave(model_id);
                messageObj.created_on = getCreatedOn();
                ix = new web3.TransactionInstruction({
                    keys: [
                        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
                    ],
                    programId: smart_contract_Id.publicKey,
                    data: Buffer.from((0, borsh_1.serialize)(ChatMessageSchema, messageObj)),
                });
                // Send the contract through RPC
                //
                return [4 /*yield*/, web3.sendAndConfirmTransaction(connection, new web3.Transaction().add(ix), [payer])];
            case 1:
                // Send the contract through RPC
                //
                _a.sent();
                console.log("end sendMessage");
                return [2 /*return*/];
        }
    });
}); });
// // Create Simple Transaction
// let tx = new web3.Transaction();
// // Add an instruction to execute
// tx.add(
//   web3.SystemProgram.transfer({
//     fromPubkey: payer.publicKey,
//     toPubkey: toAccount.publicKey,
//     lamports: 1000,
//   }),
// );
// // Send and confirm transaction
// // Note: feePayer is by default the first signer, or payer, if the parameter is not set
// await web3.sendAndConfirmTransaction(connection, tx, [payer]);
