import { useState } from "react";
import { useDAppKit, useCurrentAccount } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { X, Plus, Clock } from "lucide-react";
import { PACKAGE_ID, MARKET_ID } from "../lib/constants";
import { useCurrentClient } from "@mysten/dapp-kit-react";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEventModal = ({
  isOpen,
  onClose,
}: CreateEventModalProps) => {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const [description, setDescription] = useState("");
  const [outcomeA, setOutcomeA] = useState("Yes");
  const [outcomeB, setOutcomeB] = useState("No");
  const [duration, setDuration] = useState("5"); // minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const now = Date.now();
      const startTime = now;
      const endTime = now + parseInt(duration) * 60 * 1000;

      console.log("Searching for MarketCreatorCap for:", account.address);
      console.log("Package ID:", PACKAGE_ID);

      // 1. Fetch the MarketCreatorCap from the user's wallet
      const ownedObjects = await client.getOwnedObjects({
        owner: account.address,
        options: {
          showType: true,
        },
      });

      console.log("Objects found:", ownedObjects.data.length);
      console.log(
        "Object Types:",
        JSON.stringify(
          ownedObjects.data.map((o) => o.data?.type),
          null,
          2,
        ),
      );

      const capObject = ownedObjects.data.find((obj) => {
        const type = obj.data?.type;
        return (
          type &&
          (type.includes("::blink_config::MarketCreatorCap") ||
            type.includes("::market::MarketCreatorCap") ||
            type.includes("::blink_event::MarketCreatorCap"))
        );
      });

      const creatorCapId = capObject?.data?.objectId;

      if (!creatorCapId) {
        throw new Error(
          `MarketCreatorCap not found. Checked ${ownedObjects.data.length} objects.`,
        );
      }

      console.log("Found MarketCreatorCap:", creatorCapId);

      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::blink_event::create_event`,
        arguments: [
          tx.object(creatorCapId),
          tx.object(MARKET_ID!),
          tx.pure.string(description),
          tx.pure.vector("string", [outcomeA, outcomeB]),
          tx.pure.u64(startTime),
          tx.pure.u64(endTime),
        ],
      });

      await dAppKit.signAndExecuteTransaction({
        transaction: tx,
      });

      onClose();
    } catch (err) {
      console.error("Failed to create event:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes("ETooManyOutcomes")) {
        setError("Too many outcomes specified.");
      } else if (errorMessage.includes("MarketCreatorCap not found")) {
        setError(errorMessage);
      } else {
        setError(`Failed to create event: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dark exchange input styles
  const inputStyle: React.CSSProperties = {
    borderRadius: "0px",
    background: "oklch(20% 0.02 270)",
    border: "1px solid oklch(25% 0.03 270)",
    color: "oklch(93% 0.01 270)",
    fontFamily: '"Inter", system-ui, sans-serif',
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    color: "oklch(65% 0.01 270)",
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: "0.7rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "oklch(5% 0 0 / 0.7)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="w-full max-w-md p-6 relative border"
        style={{
          borderRadius: "4px",
          background: "oklch(16% 0.02 270)",
          borderColor: "oklch(25% 0.03 270)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        <button
          onClick={onClose}
          title="Close"
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1 transition-colors"
          style={{ color: "oklch(55% 0.02 270)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "oklch(93% 0.01 270)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "oklch(55% 0.02 270)")
          }
        >
          <X size={20} />
        </button>

        <h2
          className="text-xl font-display font-medium mb-6 flex items-center gap-2"
          style={{ color: "oklch(93% 0.01 270)" }}
        >
          <Plus size={20} style={{ color: "oklch(72% 0.19 195)" }} />
          Create New Event
        </h2>

        {error && (
          <div
            className="mb-4 p-3 border text-sm"
            style={{
              borderRadius: "2px",
              background: "oklch(20% 0.03 25)",
              borderColor: "oklch(30% 0.04 25)",
              color: "oklch(62% 0.04 25)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="event-description"
              className="block text-sm font-medium mb-1"
              style={labelStyle}
            >
              Event Description
            </label>
            <input
              id="event-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. BTC > $100k by 2025?"
              className="w-full px-4 py-2.5"
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "oklch(72% 0.19 195)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "oklch(25% 0.03 270)")
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="outcome-a"
                className="block text-sm font-medium mb-1"
                style={labelStyle}
              >
                Outcome A
              </label>
              <input
                id="outcome-a"
                type="text"
                value={outcomeA}
                onChange={(e) => setOutcomeA(e.target.value)}
                placeholder="Yes"
                className="w-full px-4 py-2.5"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(72% 0.19 195)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(25% 0.03 270)")
                }
                required
              />
            </div>
            <div>
              <label
                htmlFor="outcome-b"
                className="block text-sm font-medium mb-1"
                style={labelStyle}
              >
                Outcome B
              </label>
              <input
                id="outcome-b"
                type="text"
                value={outcomeB}
                onChange={(e) => setOutcomeB(e.target.value)}
                placeholder="No"
                className="w-full px-4 py-2.5"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(72% 0.19 195)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(25% 0.03 270)")
                }
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="event-duration"
              className="block text-sm font-medium mb-1"
              style={labelStyle}
            >
              Duration (minutes)
            </label>
            <div className="relative">
              <input
                id="event-duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="5"
                className="w-full px-4 py-2.5 pl-10"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(72% 0.19 195)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(25% 0.03 270)")
                }
                required
              />
              <Clock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "oklch(55% 0.02 270)" }}
              />
            </div>
          </div>

          <p
            className="text-xs italic"
            style={{ color: "oklch(55% 0.02 270)" }}
          >
            * You must have the MarketCreatorCap to create events.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !account}
            className="w-full mt-2 font-semibold py-3 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderRadius: "0px",
              background: "oklch(72% 0.19 195)",
              color: "oklch(10% 0.02 270)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "0.75rem",
              cursor: isSubmitting || !account ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && account) {
                e.currentTarget.style.boxShadow =
                  "0 0 20px oklch(72% 0.19 195 / 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isSubmitting ? "Creating..." : "Create On-Chain Event"}
          </button>
        </form>
      </div>
    </div>
  );
};
