import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { dAppKit } from "./dApp-kit.ts";

const queryClient = new QueryClient();

import { WagmiProvider } from 'wagmi';
import { config } from './wagmi';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DAppKitProvider dAppKit={dAppKit}>
          <App />
        </DAppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
