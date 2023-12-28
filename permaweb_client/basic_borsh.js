"use strict";
// Include borsh functionality
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.mintKV = void 0;
var borsh_1 = require("borsh");
var buffer_1 = require("buffer");
// Get Solana
var web3_js_1 = require("@solana/web3.js");
// Flexible class that takes properties and imbues them
// to the object instance
var Assignable = /** @class */ (function () {
    function Assignable(properties) {
        var _this = this;
        Object.keys(properties).map(function (key) {
            return (_this[key] = properties[key]);
        });
    }
    return Assignable;
}());
// Our instruction payload vocabulary
var Payload = /** @class */ (function (_super) {
    __extends(Payload, _super);
    function Payload() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Payload;
}(Assignable));
// Borsh needs a schema describing the payload
var payloadSchema = new Map([
    [
        Payload,
        {
            kind: "struct",
            fields: [
                ["id", "u8"],
                ["key", "string"],
                ["value", "string"],
            ],
        },
    ],
]);
// Instruction variant indexes
var InstructionVariant;
(function (InstructionVariant) {
    InstructionVariant[InstructionVariant["InitializeAccount"] = 0] = "InitializeAccount";
    InstructionVariant[InstructionVariant["MintKeypair"] = 1] = "MintKeypair";
    InstructionVariant[InstructionVariant["TransferKeypair"] = 2] = "TransferKeypair";
    InstructionVariant[InstructionVariant["BurnKeypair"] = 3] = "BurnKeypair";
})(InstructionVariant || (InstructionVariant = {}));
/**
 * Mint a key value pair to account
 * @param {Connection} connection - Solana RPC connection
 * @param {PublicKey} progId - Sample Program public key
 * @param {PublicKey} account - Target program owned account for Mint
 * @param {Keypair} wallet - Wallet for signing and payment
 * @param {string} mintKey - The key being minted key
 * @param {string} mintValue - The value being minted
 * @return {Promise<Keypair>} - Keypair
 */
function mintKV(connection, progId, account, wallet, mintKey, mintValue) {
    return __awaiter(this, void 0, void 0, function () {
        var mint, mintSerBuf, instruction, transactionSignature;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mint = new Payload({
                        id: InstructionVariant.MintKeypair,
                        key: mintKey,
                        value: mintValue, // 'ts first value'
                    });
                    mintSerBuf = buffer_1.Buffer.from((0, borsh_1.serialize)(payloadSchema, mint));
                    instruction = new web3_js_1.TransactionInstruction({
                        data: mintSerBuf,
                        keys: [
                            { pubkey: account, isSigner: false, isWritable: true },
                            { pubkey: wallet.publicKey, isSigner: false, isWritable: false },
                        ],
                        programId: progId,
                    });
                    return [4 /*yield*/, (0, web3_js_1.sendAndConfirmTransaction)(connection, new web3_js_1.Transaction().add(instruction), [wallet], {
                            commitment: "singleGossip",
                            preflightCommitment: "singleGossip",
                        })];
                case 1:
                    transactionSignature = _a.sent();
                    console.log("Signature = ", transactionSignature);
                    return [2 /*return*/, transactionSignature];
            }
        });
    });
}
exports.mintKV = mintKV;
