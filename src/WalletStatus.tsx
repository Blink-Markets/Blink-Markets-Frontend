import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { OwnedObjects } from "./OwnedObjects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Wallet, CheckCircle2 } from "lucide-react";

export function WalletStatus() {
  const account = useCurrentAccount();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet
              className="h-5 w-5"
              style={{ color: "oklch(72% 0.19 195)" }}
            />
            Wallet Status
          </CardTitle>
          <CardDescription>
            {account
              ? "Your wallet is connected"
              : "Connect your wallet to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {account ? (
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="h-4 w-4"
                style={{ color: "oklch(72% 0.19 155)" }}
              />
              <span
                className="text-sm break-all"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  color: "oklch(78% 0.01 270)",
                }}
              >
                {account.address}
              </span>
            </div>
          ) : (
            <p style={{ color: "oklch(55% 0.02 270)" }}>
              Click the connect button above to link your Sui wallet.
            </p>
          )}
        </CardContent>
      </Card>

      <OwnedObjects />
    </div>
  );
}
