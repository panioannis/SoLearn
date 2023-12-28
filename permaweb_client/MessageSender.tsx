import { Connection } from "@solana/web3.js";
import messageService from "./messages";

interface MessageSenderProps {
  connection?: Connection;
  destPubkeyStr: string;
  getMessages: () => void;
  walletAdapter: WalletAdapter;
  tx: string; // Add a tx argument to pass the transaction ID
}

const MessageSender = ({
  connection,
  destPubkeyStr,
  getMessages,
  walletAdapter,
  tx, // Add tx argument
}: MessageSenderProps) => {
  const onClickSubmit = async () => {
    if (!connection || !walletAdapter) {
      return;
    }

    // 2. Save arweave txid to Solana (Use the provided tx argument)
    const result = await messageService.sendMessage(
      connection,
      walletAdapter,
      destPubkeyStr,
      tx // Use the provided tx argument
    );
    console.log("onClickSubmit message sent successfully", result);
    getMessages();
  };

  return getMessages;
};

export default MessageSender;
