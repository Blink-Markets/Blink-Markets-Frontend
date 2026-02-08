import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

const RPC_URLS = {
  mainnet: "https://fullnode.mainnet.sui.io:443",
  testnet: "https://fullnode.testnet.sui.io:443",
  devnet: "https://fullnode.devnet.sui.io:443",
};

const defaultNetwork = (import.meta.env.VITE_SUI_NETWORK || "testnet") as
  | "mainnet"
  | "testnet"
  | "devnet";

export const dAppKit = createDAppKit({
  enableBurnerWallet: import.meta.env.DEV,
  networks: ["mainnet", "testnet", "devnet"],
  defaultNetwork,
  createClient(network) {
    return new SuiJsonRpcClient({
      network,
      url: RPC_URLS[network]
    });
  },
});

// global type registration necessary for the hooks to work correctly
declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
