import { ConnectButton, useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { useStore } from "@nanostores/react";
import { useCallback, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { Hero } from "./components/Hero";
import { StatsBar } from "./components/StatsBar";
import { FlashBetCard } from "./components/FlashBetCard";
import { CategoryTabs } from "./components/CategoryTabs";
import { RecentBets } from "./components/RecentBets";
import { BridgeModal, BridgeButton, useBridgeModal } from "./components/BridgeModal";
import { useFlashBets } from "./hooks/useFlashBets";
import { Zap, History, Sparkles, ArrowRight, ExternalLink, Wallet } from "lucide-react";
import { BetCategory } from "./types/bet";
import { PositionsPanel } from "./components/PositionsPanel";
import { isContractConfigured } from "./lib/constants";


import { CreateEventModal } from "./components/CreateEventModal";

const MIST_PER_SUI = 1_000_000_000;
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));


function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  const connection = useStore(dAppKit.stores.$connection);
  const bridgeModal = useBridgeModal();
  const packageId = import.meta.env.VITE_BLINK_PACKAGE_ID as string | undefined;
  const marketId = import.meta.env.VITE_BLINK_MARKET_ID as string | undefined;
  const treasuryId = import.meta.env.VITE_BLINK_TREASURY_ID as string | undefined;
  const eventId = import.meta.env.VITE_BLINK_EVENT_ID as string | undefined;

  const activeAddress = account?.address ?? connection.account?.address;
  const isUserConnected = connection.isConnected && !!activeAddress;
  const isOnchainBetConfigured = Boolean(packageId && marketId && treasuryId && eventId);

  const {
    activeBets,
    allActiveBets,
    recentBets,
    placeBet,
    selectedCategory,
    setSelectedCategory
  } = useFlashBets();

  const totalVolume = allActiveBets.reduce((sum, bet) => sum + bet.totalPool, 0) +
    recentBets.reduce((sum, bet) => sum + bet.totalPool, 0);

  const totalParticipants = allActiveBets.reduce((sum, bet) => sum + bet.participants, 0);

  // Count bets per category
  const categoryCounts = allActiveBets.reduce((acc, bet) => {
    acc[bet.category] = (acc[bet.category] || 0) + 1;
    return acc;
  }, {} as Record<BetCategory, number>);

  const handlePlaceBet = useCallback(async (betId: string, choice: "A" | "B", amount: number) => {
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
        choice === "A" ? (selectedBet?.onchain?.outcomeAIndex ?? 0) : (selectedBet?.onchain?.outcomeBIndex ?? 1);
      const amountInMist = BigInt(Math.round(amount * MIST_PER_SUI));
      if (amountInMist <= 0n) {
        throw new Error("Bet amount must be greater than 0.");
      }

      const client = dAppKit.getClient();
      const eventObject = await client.getObject({
        id: targetEventId,
        options: { showContent: true },
      });
      const eventJson = eventObject.data?.content?.dataType === 'moveObject' 
        ? (eventObject.data.content.fields as any) 
        : null;
      const eventStatus = Number(eventJson?.status ?? -1);
      const bettingEnd = Number(eventJson?.betting_end_time ?? 0);
      if (eventStatus !== 1) {
        throw new Error("This event is not open for betting.");
      }
      if (Date.now() >= bettingEnd) {
        throw new Error("This flash event already expired. Create/open a new event.");
      }

      const balance = await client.getBalance({
        owner: connection.account.address,
        coinType: "0x2::sui::SUI",
      });
      const totalBalance = BigInt(balance.totalBalance);
      const reserveForGas = 50_000_000n; // 0.05 SUI safety margin for gas
      if (totalBalance < amountInMist + reserveForGas) {
        throw new Error("Insufficient testnet SUI balance for this bet + gas.");
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
      tx.transferObjects([position], tx.pure.address(connection.account.address));

      try {
        await dAppKit.signAndExecuteTransaction({ transaction: tx });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("does not support signing and executing transactions")) {
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
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Place bet failed:", error);
      window.alert(`Failed to place bet: ${message}`);
    }
  }, [allActiveBets, connection.account, dAppKit, eventId, isOnchainBetConfigured, marketId, packageId, placeBet, treasuryId]);

  const handleOpenBet = useCallback(async (betId: string) => {
    try {
      if (!connection.account?.address) return;
      
      const selectedBet = allActiveBets.find(b => b.id === betId);
      const targetEventId = selectedBet?.onchain?.eventId;
      
      if (!targetEventId || !packageId || !marketId) {
        throw new Error("Missing configuration for opening event");
      }

      const client = dAppKit.getClient();
      
      // Find MarketCreatorCap
      const ownedObjects = await client.getOwnedObjects({
        owner: connection.account.address,
        options: { showType: true }
      });
      
      const capObject = ownedObjects.data.find(obj => {
        const type = obj.data?.type;
        return type && (
          type.includes('::blink_config::MarketCreatorCap') || 
          type.includes('::market::MarketCreatorCap') || 
          type.includes('::blink_event::MarketCreatorCap')
        );
      });

      if (!capObject?.data?.objectId) {
         throw new Error("You need a MarketCreatorCap to open events.");
      }

      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::blink_event::open_event`,
        arguments: [
          tx.object(capObject.data.objectId),
          tx.object(targetEventId),
        ]
      });

      await dAppKit.signAndExecuteTransaction({ transaction: tx });
      window.alert("Event opened successfully! Betting is now live.");
      
    } catch (e) {
      console.error("Failed to open event:", e);
      window.alert(`Failed to open event: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [allActiveBets, connection.account, dAppKit, marketId, packageId]);

  const placeBetLabel = isContractConfigured() ? "On-chain betting enabled" : "Demo betting mode";


  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#050B15' }}>
      {/* Sui-style Background Glow Effects */}
      <div className="sui-bg-glow sui-bg-glow-1" />
      <div className="sui-bg-glow sui-bg-glow-2" />
      <div className="sui-bg-glow sui-bg-glow-3" />

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-darker">
        <div className="container mx-auto flex h-18 items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div
                className="absolute inset-0 rounded-xl blur-lg opacity-60"
                style={{ background: 'linear-gradient(135deg, #4DA2FF, #00D4FF)' }}
              />
              <div
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #4DA2FF, #00D4FF, #00E5A0)' }}
              >
                <Zap size={22} className="text-white" fill="currentColor" />
              </div>
            </div>
            <span className="font-display text-xl font-bold">
              <span className="gradient-text-animated">Blink</span>
              <span className="text-foreground">Market</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Create Event Button */}
            <button
               onClick={() => setIsCreateModalOpen(true)}
               className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <Zap size={16} />
              Create Event
            </button>

            {/* Bridge Button */}
            <BridgeButton onClick={bridgeModal.open} className="hidden sm:flex" />

            <a
              href="#how-it-works"
              className="hidden md:flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-[#4DA2FF] transition-colors duration-200"
            >
              How it works
              <ArrowRight size={14} />
            </a>

            {isUserConnected && activeAddress && (
              <div
                className="hidden md:block px-3 py-2 rounded-lg text-xs font-mono"
                style={{ background: "rgba(77, 162, 255, 0.12)", color: "#A8D0FF" }}
              >
                {`${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`}
              </div>
            )}

            <div className="hidden lg:block text-xs text-foreground-tertiary">{placeBetLabel}</div>

            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <Hero />

        {/* Stats Bar */}
        <div className="mb-10">
          <StatsBar
            activeBets={allActiveBets.length}
            totalVolume={totalVolume}
            totalParticipants={totalParticipants}
          />
        </div>

        {/* Category Filters */}
        <div className="mb-8">
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
                <h2 className="text-xl font-bold text-foreground">Live Markets</h2>
              </div>
              {activeBets.length > 0 && (
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: 'rgba(0, 229, 160, 0.12)',
                    color: '#00E5A0',
                    border: '1px solid rgba(0, 229, 160, 0.25)'
                  }}
                >
                  {activeBets.length} active
                </span>
              )}
            </div>

            {activeBets.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-24 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.6) 0%, rgba(15, 31, 56, 0.4) 100%)',
                  border: '1px dashed rgba(77, 162, 255, 0.2)'
                }}
              >
                <div
                  className="relative w-18 h-18 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(77, 162, 255, 0.1), rgba(0, 212, 255, 0.08))',
                    width: '72px',
                    height: '72px'
                  }}
                >
                  <Sparkles className="text-[#4DA2FF]" size={32} />
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                    style={{ background: 'rgba(77, 162, 255, 0.3)' }}
                  />
                </div>
                <p className="text-lg font-semibold text-foreground-secondary mb-2">
                  {selectedCategory === 'All' ? 'Waiting for markets...' : `No ${selectedCategory} markets`}
                </p>
                <p className="text-sm text-foreground-tertiary">
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
                <History size={20} className="text-[#4DA2FF]" />
                <h2 className="text-lg font-bold text-foreground">Recent Results</h2>
              </div>

              <div
                className="rounded-2xl p-4 max-h-[640px] overflow-y-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.7) 0%, rgba(15, 31, 56, 0.5) 100%)',
                  border: '1px solid rgba(77, 162, 255, 0.1)'
                }}
              >
                <RecentBets bets={recentBets} />
              </div>
            </div>
          </div>
        </div>

        {/* User Positions Section */}
        {isUserConnected && (
          <div className="mt-12">
            <div className="flex items-center gap-2.5 mb-6">
              <Wallet size={20} className="text-[#4DA2FF]" />
              <h2 className="text-xl font-bold text-foreground">Your Positions</h2>
            </div>
            <PositionsPanel />
          </div>
        )}

        {/* How It Works Section */}

        <section id="how-it-works" className="mt-24 py-20 scroll-mt-20">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full"
              style={{
                background: 'rgba(77, 162, 255, 0.08)',
                border: '1px solid rgba(77, 162, 255, 0.2)'
              }}
            >
              <Sparkles size={14} className="text-[#4DA2FF]" />
              <span className="text-sm font-medium text-[#4DA2FF]">Simple & Fast</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-display">
              How It Works
            </h2>
            <p className="text-lg text-foreground-secondary max-w-xl mx-auto">
              Flash betting made simple. Three steps to place your prediction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Pick Your Side',
                description: 'Choose your prediction for the next live event moment. Will it be Team A or Team B?',
                icon: '🎯',
                gradient: 'from-[#00E5A0]/15 to-[#00D4FF]/10',
                borderColor: 'rgba(0, 229, 160, 0.2)',
                stepGradient: 'linear-gradient(135deg, #00E5A0, #00D4FF)',
              },
              {
                step: '02',
                title: 'Bet Fast',
                description: 'You have ~10 seconds before the market closes. Select your amount and confirm instantly.',
                icon: '⚡',
                gradient: 'from-[#4DA2FF]/15 to-[#00D4FF]/10',
                borderColor: 'rgba(77, 162, 255, 0.2)',
                stepGradient: 'linear-gradient(135deg, #4DA2FF, #00D4FF)',
              },
              {
                step: '03',
                title: 'Win Instantly',
                description: 'Results are determined immediately. Winnings are paid out automatically to your wallet.',
                icon: '💰',
                gradient: 'from-[#FFB84D]/15 to-[#FFC870]/10',
                borderColor: 'rgba(255, 184, 77, 0.2)',
                stepGradient: 'linear-gradient(135deg, #FFB84D, #FFC870)',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative group p-7 rounded-2xl transition-all duration-300 hover:translate-y-[-4px]"
                style={{
                  background: `linear-gradient(135deg, rgba(13, 27, 42, 0.9) 0%, rgba(15, 31, 56, 0.7) 100%)`,
                  border: `1px solid ${item.borderColor}`,
                }}
              >
                {/* Animated top border */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-60"
                  style={{ background: item.stepGradient }}
                />

                {/* Step number */}
                <div
                  className="absolute -top-4 -left-4 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
                  style={{
                    background: item.stepGradient,
                    boxShadow: `0 8px 24px ${item.borderColor}`
                  }}
                >
                  {item.step}
                </div>

                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-3xl mb-5`}
                  style={{ border: `1px solid ${item.borderColor}` }}
                >
                  {item.icon}
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-foreground-tertiary leading-relaxed">{item.description}</p>

                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${item.borderColor}, transparent 60%)`
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 mb-10 py-16 px-10 rounded-3xl relative overflow-hidden">
          {/* Background */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(77, 162, 255, 0.08) 0%, rgba(0, 212, 255, 0.05) 50%, rgba(0, 229, 160, 0.08) 100%)',
              border: '1px solid rgba(77, 162, 255, 0.15)'
            }}
          />

          {/* Animated glow orbs */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{
              background: 'rgba(77, 162, 255, 0.4)',
              animation: 'blob 15s ease-in-out infinite'
            }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{
              background: 'rgba(0, 229, 160, 0.4)',
              animation: 'blob 20s ease-in-out infinite reverse'
            }}
          />

          <div className="text-center max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 font-display">
              Ready to make your first flash bet?
            </h2>
            <p className="text-lg text-foreground-secondary mb-8">
              Connect your Sui wallet and start betting on live events with sub-second finality.
            </p>
            <div className="flex justify-center gap-4">
              <ConnectButton />
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:translate-y-[-2px]"
                style={{
                  background: 'rgba(77, 162, 255, 0.1)',
                  border: '1px solid rgba(77, 162, 255, 0.3)',
                  color: '#4DA2FF'
                }}
              >
                Learn More
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="py-10 mt-8 relative z-10"
        style={{ borderTop: '1px solid rgba(77, 162, 255, 0.1)' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4DA2FF, #00D4FF)' }}
              >
                <Zap size={14} className="text-white" fill="currentColor" />
              </div>
              <span className="font-display font-semibold text-foreground-secondary">
                BlinkMarket
              </span>
            </div>

            <p className="text-sm text-foreground-tertiary text-center flex items-center gap-2">
              Built on{' '}
              <span
                className="font-semibold"
                style={{
                  background: 'linear-gradient(90deg, #4DA2FF, #00D4FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Sui
              </span>
              · Powered by Flash Transactions · Bet Responsibly
            </p>

            <div className="flex items-center gap-5 text-sm text-foreground-tertiary">
              <a href="#" className="hover:text-[#4DA2FF] transition-colors duration-200">Terms</a>
              <a href="#" className="hover:text-[#4DA2FF] transition-colors duration-200">Privacy</a>
              <a href="#" className="hover:text-[#4DA2FF] transition-colors duration-200">Docs</a>
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
