import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { dAppKit } from "./dApp-kit.ts";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IntroductionPage } from "./pages/IntroductionPage.tsx";

const queryClient = new QueryClient();

import { WagmiProvider } from "wagmi";
import { config } from "./wagmi";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DAppKitProvider dAppKit={dAppKit}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/intro" element={<IntroductionPage />} />
            </Routes>
          </BrowserRouter>
        </DAppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
