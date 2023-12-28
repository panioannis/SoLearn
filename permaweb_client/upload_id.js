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
var web3_js_1 = require("@solana/web3.js");
//import Buffer from "buffer";
var new_message_1 = require("./new_message");
//import BN from 'bn.js';
function createKeypairFromFile(path) {
    return web3_js_1.Keypair.fromSecretKey(Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8"))));
}
;
describe("Arweave_id_upload", function () { return __awaiter(void 0, void 0, void 0, function () {
    var connection, payer, smart_contract, smart_contract_Id;
    return __generator(this, function (_a) {
        connection = new web3_js_1.Connection("https://api.devnet.solana.com/", 'confirmed');
        payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');
        smart_contract = createKeypairFromFile('./program/chatappprogram-keypair.json');
        smart_contract_Id = new web3_js_1.PublicKey("Cfyh7qmWNNfakpPKScbZnnmfsixTBvDVq81vVDcyD1gQ");
        //const program = Keypair.fromSecretKey("QfKggutJliM2tWWvaIj5K-C4D_Ydg6Bc0kZokCba51E");
        // Insert the smart contract program id here
        // const smart_contract_Id = new web3.PublicKey(
        //     "Cfyh7qmWNNfakpPKScbZnnmfsixTBvDVq81vVDcyD1gQ"
        // );
        it("Upload a file hash", function () { return __awaiter(void 0, void 0, void 0, function () {
            var model_id, result, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        model_id = "QfKggutJliM2tWWvaIj5K-C4D_Ydg6Bc0kZokCba51E";
                        return [4 /*yield*/, new_message_1.default.sendMessage(connection, payer, smart_contract_Id, model_id)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, new_message_1.default.getAccountMessageHistory(connection, smart_contract_Id)];
                    case 2:
                        res = _a.sent();
                        console.log(res);
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
