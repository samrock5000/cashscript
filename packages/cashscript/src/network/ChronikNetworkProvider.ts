import { ChronikClient } from "chronik-client";
import {
  binToHex,
  cashAddressToLockingBytecode,
  // hexToBin,
  lockingBytecodeToAddressContents,
  // KnownAddressTypeContents,
} from "@bitauth/libauth";
import { Utxo, Network } from "../interfaces.js";
import NetworkProvider from "./NetworkProvider.js";

export default class ChronikNetworkProvider implements NetworkProvider {
  constructor(public network: Network, private chronik: ChronikClient) {}

  async getUtxos(address: string): Promise<Utxo[]> {
    const addr: any = cashAddressToLockingBytecode(address);
    const addressBytecode: any = addr.bytecode;
    const addrContent = lockingBytecodeToAddressContents(addressBytecode);
    const addrType: any = addrContent.type;

    // const addrScriptType = addrType//addrContent.type === 'P2SH' ? "p2sh" : "p2pkh"
    // const payload = binToHex(addrContent.payload)
    const chronikUtxoResult = await this.chronik
      .script(addrType.toLowerCase().toString(), binToHex(addrContent.payload))
      .utxos();
    if (chronikUtxoResult[0] === undefined) {
      // @ts-ignore
      const utxos = [null].map((utxo) => ({
        txid: "",
        vout: 0,
        // @ts-ignore
        satoshis: parseInt("0"),
      }));
      // @ts-ignore
      return utxos;
    }
    const utxos = chronikUtxoResult[0].utxos.map((utxo) => ({
      txid: utxo.outpoint.txid,
      vout: utxo.outpoint.outIdx,
      satoshis: parseInt(utxo.value, 10),
      //
    }));
    return utxos;
  }

  async getBlockHeight(): Promise<number> {
    const height = this.chronik.blockchainInfo();
    return (await height).tipHeight;
  }

  async getRawTransaction(txid: string): Promise<string> {
    const tx = this.chronik.tx(txid);

    return JSON.stringify(tx);
  }

  async sendRawTransaction(txHex: string): Promise<string> {
    const rawTx = this.chronik.broadcastTx(txHex, true);
    return (await rawTx).txid;
  }
}
