import {
  ConnectButton,
  useCurrentAccount,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { useStore } from "@nanostores/react";
import { useCallback, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { Link } from "react-router-dom";
import { StatsBar } from "./components/StatsBar";
import { FlashBetCard } from "./components/FlashBetCard";
import { CategoryTabs } from "./components/CategoryTabs";
import { RecentBets } from "./components/RecentBets";
import {
  BridgeModal,
  BridgeButton,
  useBridgeModal,
} from "./components/BridgeModal";
import { useFlashBets } from "./hooks/useFlashBets";
import {
  Zap,
  History,
  Sparkles,
  ArrowRight,
  Wallet,
  Info,
  TrendingUp,
  Flame,
} from "lucide-react";
import { BetCategory } from "./types/bet";
import { PositionsPanel } from "./components/PositionsPanel";
import { isContractConfigured } from "./lib/constants";

import { CreateEventModal } from "./components/CreateEventModal";

const MIST_PER_SUI = 1_000_000_000;
const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  const connection = useStore(dAppKit.stores.$connection);
  const bridgeModal = useBridgeModal();
  const packageId = import.meta.env.VITE_BLINK_PACKAGE_ID as string | undefined;
  const marketId = import.meta.env.VITE_BLINK_MARKET_ID as string | undefined;
  const treasuryId = import.meta.env.VITE_BLINK_TREASURY_ID as
    | string
    | undefined;
  const eventId = import.meta.env.VITE_BLINK_EVENT_ID as string | undefined;

  const activeAddress = account?.address ?? connection.account?.address;
  const isUserConnected = connection.isConnected && !!activeAddress;
  const isOnchainBetConfigured = Boolean(
    packageId && marketId && treasuryId && eventId,
  );

  const {
    activeBets,
    allActiveBets,
    recentBets,
    placeBet,
    selectedCategory,
    setSelectedCategory,
  } = useFlashBets();

  const totalVolume =
    allActiveBets.reduce((sum, bet) => sum + bet.totalPool, 0) +
    recentBets.reduce((sum, bet) => sum + bet.totalPool, 0);

  const totalParticipants = allActiveBets.reduce(
    (sum, bet) => sum + bet.participants,
    0,
  );

  // Count bets per category
  const categoryCounts = allActiveBets.reduce(
    (acc, bet) => {
      acc[bet.category] = (acc[bet.category] || 0) + 1;
      return acc;
    },
    {} as Record<BetCategory, number>,
  );

  const handlePlaceBet = useCallback(
    async (betId: string, choice: "A" | "B", amount: number) => {
      try {
        if (!isOnchainBetConfigured) {
          placeBet(betId, choice, amount);
          return;
        }
        if (!connection.account?.address) {
          throw new Error("Connect a wallet before placing an on-chain bet.");
        }

        const selectedBet = allActiveBets.find((bet) => bet.id === betId);
        const targetEventId = selectedBet?.onchain?.eventId || eventId;
        if (!targetEventId) {
          throw new Error("Missing event id for on-chain market.");
        }

        const outcomeIndex =
          choice === "A"
            ? (selectedBet?.onchain?.outcomeAIndex ?? 0)
            : (selectedBet?.onchain?.outcomeBIndex ?? 1);
        const amountInMist = BigInt(Math.round(amount * MIST_PER_SUI));
        if (amountInMist <= 0n) {
          throw new Error("Bet amount must be greater than 0.");
        }

        const client = dAppKit.getClient();
        const eventObject = await client.getObject({
          id: targetEventId,
          options: { showContent: true },
        });
        const eventJson =
          eventObject.data?.content?.dataType === "moveObject"
            ? (eventObject.data.content.fields as any)
            : null;
        const eventStatus = Number(eventJson?.status ?? -1);
        const bettingEnd = Number(eventJson?.betting_end_time ?? 0);
        if (eventStatus !== 1) {
          throw new Error("This event is not open for betting.");
        }
        if (Date.now() >= bettingEnd) {
          throw new Error(
            "This flash event already expired. Create/open a new event.",
          );
        }

        const balance = await client.getBalance({
          owner: connection.account.address,
          coinType: "0x2::sui::SUI",
        });
        const totalBalance = BigInt(balance.totalBalance);
        const reserveForGas = 50_000_000n; // 0.05 SUI safety margin for gas
        if (totalBalance < amountInMist + reserveForGas) {
          throw new Error(
            "Insufficient testnet SUI balance for this bet + gas.",
          );
        }

        const tx = new Transaction();
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);
        const [position] = tx.moveCall({
          target: `${packageId}::blink_position::place_bet`,
          arguments: [
            tx.object(targetEventId),
            tx.object(marketId!),
            tx.object(treasuryId!),
            tx.pure.u8(outcomeIndex),
            coin,
            tx.object("0x6"),
          ],
        });
        tx.transferObjects(
          [position],
          tx.pure.address(connection.account.address),
        );

        try {
          await dAppKit.signAndExecuteTransaction({ transaction: tx });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          if (
            !message.includes(
              "does not support signing and executing transactions",
            )
          ) {
            throw error;
          }

          // Fallback for wallets that support signTransaction but not signAndExecuteTransaction.
          const signed = await dAppKit.signTransaction({ transaction: tx });
          await client.executeTransactionBlock({
            transactionBlock: fromBase64(signed.bytes),
            signature: signed.signature,
            options: { showEffects: true },
          });
        }

        placeBet(betId, choice, amount);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Place bet failed:", error);
        window.alert(`Failed to place bet: ${message}`);
      }
    },
    [
      allActiveBets,
      connection.account,
      dAppKit,
      eventId,
      isOnchainBetConfigured,
      marketId,
      packageId,
      placeBet,
      treasuryId,
    ],
  );

  const handleOpenBet = useCallback(
    async (betId: string) => {
      try {
        if (!connection.account?.address) return;

        // Parse action from betId (e.g. "bet-123-resolve-0")
        let action = "open";
        let actualBetId = betId;
        let outcomeIndex = 0;

        if (betId.includes("-resolve-")) {
          const parts = betId.split("-resolve-");
          actualBetId = parts[0];
          outcomeIndex = parseInt(parts[1]);
          action = "resolve";
        } else if (betId.includes("-lock")) {
          // For now, let's assume if it is expired in UI, the button triggers this.
        }

        const selectedBet = allActiveBets.find((b) => b.id === actualBetId);
        const targetEventId = selectedBet?.onchain?.eventId;

        if (!targetEventId || !packageId || !marketId) {
          throw new Error("Missing configuration for event");
        }

        const client = dAppKit.getClient();

        // Fetch current event status to decide action (Open vs Lock)
        const eventObject = await client.getObject({
          id: targetEventId,
          options: { showContent: true },
        });
        const eventJson =
          eventObject.data?.content?.dataType === "moveObject"
            ? (eventObject.data.content.fields as any)
            : null;
        const eventStatus = Number(eventJson?.status ?? -1);

        // Prepare transaction
        const tx = new Transaction();

        if (action === "resolve") {
          // Resolve Event
          console.log(
            `Resolving event ${targetEventId} with outcome ${outcomeIndex}`,
          );

          tx.moveCall({
            target: `${packageId}::blink_event::resolve_event`,
            arguments: [
              tx.object(targetEventId),
              tx.object(marketId),
              tx.pure.u8(outcomeIndex),
              tx.object("0x6"), // Clock
            ],
          });
        } else {
          // Find MarketCreatorCap
          const ownedObjects = await client.getOwnedObjects({
            owner: connection.account.address,
            options: { showType: true },
          });

          const capObject = ownedObjects.data.find((obj) => {
            const type = obj.data?.type;
            return (
              type &&
              (type.includes("::blink_config::MarketCreatorCap") ||
                type.includes("::market::MarketCreatorCap") ||
                type.includes("::blink_event::MarketCreatorCap"))
            );
          });

          if (!capObject?.data?.objectId) {
            throw new Error("You need a MarketCreatorCap to manage events.");
          }

          if (eventStatus === 0) {
            // CREATED -> OPEN
            console.log(`Opening event ${targetEventId}`);
            tx.moveCall({
              target: `${packageId}::blink_event::open_event`,
              arguments: [
                tx.object(capObject.data.objectId),
                tx.object(targetEventId),
              ],
            });
          } else if (eventStatus === 1) {
            // OPEN -> LOCKED
            console.log(`Locking event ${targetEventId}`);
            tx.moveCall({
              target: `${packageId}::blink_event::lock_event`,
              arguments: [
                tx.object(capObject.data.objectId),
                tx.object(targetEventId),
              ],
            });
          } else {
            throw new Error("Event is already locked or resolved.");
          }
        }

        await dAppKit.signAndExecuteTransaction({ transaction: tx });
        window.alert(`Action completed successfully!`);
      } catch (e) {
        console.error("Failed to manage event:", e);
        window.alert(
          `Failed to manage event: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
    [allActiveBets, connection.account, dAppKit, marketId, packageId],
  );

  const placeBetLabel = isContractConfigured()
    ? "On-chain betting enabled"
    : "Demo betting mode";

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "oklch(13% 0.02 270)" }}
    >
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      {/* Header — dark exchange bar */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "oklch(16% 0.02 270 / 0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(25% 0.03 270)",
        }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="relative group">
              <img
                src="/logo.png"
                alt="Blink Market"
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Create Event Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                background: "transparent",
                border: "1px solid oklch(25% 0.03 270)",
                borderRadius: "4px",
                color: "oklch(78% 0.01 270)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "oklch(72% 0.19 195)";
                e.currentTarget.style.color = "oklch(72% 0.19 195)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "oklch(25% 0.03 270)";
                e.currentTarget.style.color = "oklch(78% 0.01 270)";
              }}
            >
              <Zap size={14} />
              Create Event
            </button>

            {/* Oracle Registration Button */}
            <button
              onClick={async () => {
                try {
                  if (!connection.account?.address || !packageId || !marketId)
                    return;
                  const client = dAppKit.getClient();
                  const ownedObjects = await client.getOwnedObjects({
                    owner: connection.account.address,
                    options: { showType: true },
                  });
                  const adminCap = ownedObjects.data.find((obj) =>
                    obj.data?.type?.includes("::blink_config::AdminCap"),
                  );
                  if (!adminCap?.data?.objectId) {
                    alert("AdminCap not found. You cannot register oracles.");
                    return;
                  }
                  const tx = new Transaction();
                  tx.moveCall({
                    target: `${packageId}::blink_config::add_oracle`,
                    arguments: [
                      tx.object(adminCap.data.objectId),
                      tx.object(marketId),
                      tx.pure.address(connection.account.address),
                    ],
                  });
                  await dAppKit.signAndExecuteTransaction({ transaction: tx });
                  alert("Successfully registered as Oracle!");
                } catch (e) {
                  console.error(e);
                  alert("Failed to register oracle: " + e);
                }
              }}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                background: "transparent",
                border: "1px solid oklch(25% 0.03 270)",
                borderRadius: "4px",
                color: "oklch(55% 0.02 270)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "oklch(72% 0.19 195)";
                e.currentTarget.style.color = "oklch(72% 0.19 195)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "oklch(25% 0.03 270)";
                e.currentTarget.style.color = "oklch(55% 0.02 270)";
              }}
            >
              Register Oracle
            </button>

            {/* Bridge Button */}
            <BridgeButton
              onClick={bridgeModal.open}
              className="hidden sm:flex"
            />

            <Link
              to="/intro"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
              style={{
                color: "oklch(78% 0.01 270)",
                textDecoration: "none",
                borderBottom: "1px solid oklch(72% 0.19 195)",
                paddingBottom: "1px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "oklch(72% 0.19 195)";
                e.currentTarget.style.borderBottomColor = "oklch(72% 0.19 195)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "oklch(78% 0.01 270)";
                e.currentTarget.style.borderBottomColor = "oklch(72% 0.19 195)";
              }}
            >
              <Info size={14} />
              How it works
              <ArrowRight size={12} />
            </Link>

            {isUserConnected && activeAddress && (
              <div
                className="hidden md:block px-3 py-1.5 text-xs font-mono"
                style={{
                  background: "oklch(72% 0.19 195 / 0.1)",
                  color: "oklch(72% 0.19 195)",
                  borderRadius: "4px",
                  border: "1px solid oklch(72% 0.19 195 / 0.25)",
                }}
              >
                {`${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`}
              </div>
            )}

            <div
              className="hidden lg:block text-xs"
              style={{ color: "oklch(55% 0.02 270)" }}
            >
              {placeBetLabel}
            </div>

            <ConnectButton />
          </div>
        </div>
      </header>

      <main
        className="container mx-auto px-6 pt-6 pb-8 relative z-10"
        style={{ maxWidth: "1400px" }}
      >
        {/* Stats Bar */}
        <div className="mb-6">
          <StatsBar
            activeBets={allActiveBets.length}
            totalVolume={totalVolume}
            totalParticipants={totalParticipants}
          />
        </div>

        {/* Popular Now — top bets by pool size, front and center */}
        {activeBets.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Flame size={20} style={{ color: "oklch(62% 0.22 25)" }} />
                <h2
                  className="text-xl font-display"
                  style={{ fontWeight: 400, color: "oklch(93% 0.01 270)" }}
                >
                  Popular Now
                </h2>
                <TrendingUp
                  size={16}
                  style={{ color: "oklch(72% 0.19 195)" }}
                />
              </div>
              <Link
                to="/intro"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium transition-colors duration-200"
                style={{
                  color: "oklch(55% 0.02 270)",
                  textDecoration: "none",
                  borderBottom: "1px solid oklch(55% 0.02 270)",
                  paddingBottom: "1px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(72% 0.19 195)";
                  e.currentTarget.style.borderBottomColor =
                    "oklch(72% 0.19 195)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(55% 0.02 270)";
                  e.currentTarget.style.borderBottomColor =
                    "oklch(55% 0.02 270)";
                }}
              >
                <Info size={12} />
                How it works
                <ArrowRight size={10} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...activeBets]
                .sort((a, b) => b.totalPool - a.totalPool)
                .slice(0, 3)
                .map((bet, index) => (
                  <div
                    key={bet.id}
                    className="card-entrance"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <FlashBetCard
                      bet={bet}
                      onPlaceBet={handlePlaceBet}
                      onOpenBet={handleOpenBet}
                      isConnected={isUserConnected}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="mb-5">
          <CategoryTabs
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            counts={categoryCounts}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Active Bets - 3 columns on xl screens */}
          <div className="xl:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="live-dot" />
                <h2
                  className="text-xl font-display"
                  style={{ fontWeight: 400, color: "oklch(93% 0.01 270)" }}
                >
                  Live Markets
                </h2>
              </div>
              {activeBets.length > 0 && (
                <span
                  className="px-2.5 py-1 text-xs font-semibold"
                  style={{
                    background: "oklch(72% 0.19 155 / 0.12)",
                    color: "oklch(72% 0.19 155)",
                    border: "1px solid oklch(72% 0.19 155 / 0.3)",
                    borderRadius: "4px",
                  }}
                >
                  {activeBets.length} active
                </span>
              )}
            </div>

            {activeBets.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-24"
                style={{
                  background: "oklch(16% 0.02 270)",
                  border: "1px dashed oklch(25% 0.03 270)",
                  borderRadius: "8px",
                }}
              >
                <div
                  className="relative w-16 h-16 flex items-center justify-center mb-5"
                  style={{
                    background: "oklch(72% 0.19 195 / 0.08)",
                    borderRadius: "8px",
                    border: "1px solid oklch(25% 0.03 270)",
                  }}
                >
                  <Sparkles
                    size={28}
                    style={{ color: "oklch(72% 0.19 195)" }}
                  />
                </div>
                <p
                  className="text-lg font-display mb-2"
                  style={{ fontWeight: 400, color: "oklch(78% 0.01 270)" }}
                >
                  {selectedCategory === "All"
                    ? "Waiting for markets..."
                    : `No ${selectedCategory} markets`}
                </p>
                <p className="text-sm" style={{ color: "oklch(55% 0.02 270)" }}>
                  New flash markets open every few seconds
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeBets.map((bet, index) => (
                  <div
                    key={bet.id}
                    className="card-entrance"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <FlashBetCard
                      bet={bet}
                      onPlaceBet={handlePlaceBet}
                      onOpenBet={handleOpenBet}
                      isConnected={isUserConnected}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Results Sidebar */}
          <div className="xl:col-span-1">
            <div className="xl:sticky xl:top-24">
              <div className="flex items-center gap-2.5 mb-5">
                <History size={18} style={{ color: "oklch(72% 0.19 195)" }} />
                <h2
                  className="text-lg font-display"
                  style={{ fontWeight: 400, color: "oklch(93% 0.01 270)" }}
                >
                  Recent Results
                </h2>
              </div>

              <div
                className="p-4 max-h-[640px] overflow-y-auto"
                style={{
                  background: "oklch(16% 0.02 270)",
                  border: "1px solid oklch(25% 0.03 270)",
                  borderRadius: "8px",
                }}
              >
                <RecentBets bets={recentBets} />
              </div>
            </div>
          </div>
        </div>

        {/* User Positions Section */}
        {isUserConnected && (
          <div
            className="mt-12"
            style={{
              borderTop: "1px solid oklch(25% 0.03 270)",
              paddingTop: "80px",
            }}
          >
            <div className="flex items-center gap-2.5 mb-6">
              <Wallet size={18} style={{ color: "oklch(72% 0.19 195)" }} />
              <h2
                className="text-xl font-display"
                style={{ fontWeight: 400, color: "oklch(93% 0.01 270)" }}
              >
                Your Positions
              </h2>
            </div>
            <PositionsPanel />
          </div>
        )}
      </main>

      {/* Footer — dark exchange */}
      <footer
        style={{
          borderTop: "1px solid oklch(25% 0.03 270)",
          background: "oklch(13% 0.02 270)",
        }}
      >
        <div
          className="container mx-auto px-6 py-10"
          style={{ maxWidth: "1400px" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Blink Market" className="h-10 w-auto" />
            </div>

            <p
              className="text-sm text-center flex items-center gap-2"
              style={{ color: "oklch(55% 0.02 270)" }}
            >
              Built on{" "}
              <span style={{ fontWeight: 600, color: "oklch(72% 0.19 195)" }}>
                Sui
              </span>
              {" · "}Powered by Flash Transactions{" · "}Bet Responsibly
            </p>

            <div
              className="flex items-center gap-5 text-sm"
              style={{ color: "oklch(55% 0.02 270)" }}
            >
              <a
                href="#"
                className="transition-colors duration-200"
                style={{ textDecoration: "none", color: "oklch(55% 0.02 270)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(72% 0.19 195)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(55% 0.02 270)";
                }}
              >
                Terms
              </a>
              <a
                href="#"
                className="transition-colors duration-200"
                style={{ textDecoration: "none", color: "oklch(55% 0.02 270)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(72% 0.19 195)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(55% 0.02 270)";
                }}
              >
                Privacy
              </a>
              <a
                href="#"
                className="transition-colors duration-200"
                style={{ textDecoration: "none", color: "oklch(55% 0.02 270)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(72% 0.19 195)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(55% 0.02 270)";
                }}
              >
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Bridge Modal */}
      <BridgeModal isOpen={bridgeModal.isOpen} onClose={bridgeModal.close} />
    </div>
  );
}

export default App;
