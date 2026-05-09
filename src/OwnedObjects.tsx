import { useCurrentAccount, useCurrentClient } from "@mysten/dapp-kit-react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Package, Loader2 } from "lucide-react";

export function OwnedObjects() {
  const account = useCurrentAccount();
  const client = useCurrentClient();

  const { data, isPending, error } = useQuery({
    queryKey: ["ownedObjects", account?.address],
    queryFn: async () => {
      if (!account) return null;

      const response = await client.getOwnedObjects({
        owner: account.address,
      });
      return response.data ?? [];
    },
    enabled: !!account,
  });

  if (!account) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package
            className="h-5 w-5"
            style={{ color: "oklch(72% 0.19 195)" }}
          />
          Owned Objects
        </CardTitle>
        <CardDescription>Objects owned by the connected wallet</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p style={{ color: "oklch(62% 0.22 25)" }}>
            Error: {(error as Error)?.message || "Unknown error"}
          </p>
        ) : isPending || !data ? (
          <div
            className="flex items-center gap-2"
            style={{ color: "oklch(55% 0.02 270)" }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading objects...
          </div>
        ) : data.length === 0 ? (
          <p style={{ color: "oklch(55% 0.02 270)" }}>No objects found</p>
        ) : (
          <div className="space-y-2">
            {data.map((object) => (
              <div
                key={object.data?.objectId}
                className="border p-3"
                style={{
                  borderRadius: "2px",
                  background: "oklch(20% 0.02 270)",
                  borderColor: "oklch(25% 0.03 270)",
                }}
              >
                <p
                  className="text-xs break-all"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    color: "oklch(78% 0.01 270)",
                  }}
                >
                  {object.data?.objectId}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
