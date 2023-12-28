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
exports.ChatMessageSchema = exports.ChatMessage = exports.DUMMY_CREATED_ON = exports.DUMMY_TX_ID = void 0;
var borsh_1 = require("borsh");
//import * as borsh from "borsh";
// @ts-ignore
var buffer_layout_1 = require("buffer-layout");
//import { Buffer } from "buffer";
var web3_js_1 = require("@solana/web3.js");
var CHAT_MESSAGE_ELEMENTS_COUNT = 20;
exports.DUMMY_TX_ID = "0000000000000000000000000000000000000000000";
exports.DUMMY_CREATED_ON = "0000000000000000";
var ChatMessage = /** @class */ (function () {
    function ChatMessage(fields) {
        if (fields === void 0) { fields = undefined; }
        this.archive_id = exports.DUMMY_TX_ID;
        this.created_on = exports.DUMMY_CREATED_ON; // max milliseconds in date
        if (fields) {
            this.archive_id = fields.archive_id;
            this.created_on = fields.created_on;
        }
    }
    return ChatMessage;
}());
exports.ChatMessage = ChatMessage;
exports.ChatMessageSchema = new Map([
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
            length += (0, borsh_1.serialize)(exports.ChatMessageSchema, sampleChatMessages[i]).length;
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
                        sentPubkey = new web3_js_1.PublicKey(pubKeyStr);
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
    //   async getMessageSentHistory(
    //     connection: Connection,
    //     sentChatPubkeyStr: string
    //   ): Promise<Array<ChatMessage>> {
    //     const messages = await this.getAccountMessageHistory(
    //       connection,
    //       sentChatPubkeyStr
    //     );
    //     console.log("getMessageSentHistory", messages);
    //     return messages;
    //   }
    //   async getMessageReceivedHistory(
    //     connection: Connection,
    //     walletChatPubkeyStr: string
    //   ): Promise<Array<ChatMessage>> {
    //     const messages = await this.getAccountMessageHistory(
    //       connection,
    //       walletChatPubkeyStr
    //     );
    //     console.log("getMessageReceivedHistory", messages);
    //     return messages;
    //   }
    MessageService.prototype.sendMessage = function (connection, payer, smart_contract_id, arweaveid
    // This promise must be ommited.
    ) {
        return __awaiter(this, void 0, void 0, function () {
            var scontractPubkey, messageObj, ix, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("start sendMessage");
                        scontractPubkey = new web3_js_1.PublicKey(smart_contract_id);
                        messageObj = new ChatMessage({
                            archive_id: this.getTxIdFromArweave(arweaveid),
                            created_on: this.getCreatedOn(), // 'ts key'
                        });
                        ix = new web3_js_1.TransactionInstruction({
                            //      keys: [{ pubkey: destPubkey, isSigner: false, isWritable: true }],
                            keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
                            programId: scontractPubkey,
                            data: Buffer.from((0, borsh_1.serialize)(exports.ChatMessageSchema, messageObj)),
                        });
                        return [4 /*yield*/, (0, web3_js_1.sendAndConfirmTransaction)(connection, new web3_js_1.Transaction().add(ix), [payer])];
                    case 1:
                        result = _a.sent();
                        console.log("end sendMessage", result);
                        return [2 /*return*/];
                }
            });
        });
    };
    MessageService.prototype.getTxIdFromArweave = function (newTxId) {
        // save message to arweave and get back txid;
        var txid = "";
        var dummyLength = exports.DUMMY_TX_ID.length - newTxId.length;
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
        var total = exports.DUMMY_CREATED_ON.length;
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
exports.default = messageService;
