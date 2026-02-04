import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit-react";
import { Hero } from "./components/Hero";
import { StatsBar } from "./components/StatsBar";
import { FlashBetCard } from "./components/FlashBetCard";
import { RecentBets } from "./components/RecentBets";
import { useFlashBets } from "./hooks/useFlashBets";
import { Zap, History } from "lucide-react";

function App() {
  const account = useCurrentAccount();
  const { activeBets, recentBets, placeBet } = useFlashBets();

  const totalVolume = activeBets.reduce((sum, bet) => sum + bet.totalPool, 0) +
    recentBets.reduce((sum, bet) => sum + bet.totalPool, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Zap size={28} className="text-flash-green" fill="currentColor" />
            <span className="text-xl font-bold">
              <span className="gradient-text">Blink</span>Market
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <Hero />

        {/* Stats Bar */}
        <div className="mb-8">
          <StatsBar
            activeBets={activeBets.length}
            totalVolume={totalVolume}
            avgDuration={12}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Bets - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={24} className="text-flash-green" />
              <h2 className="text-2xl font-bold">Live Flash Bets</h2>
              <span className="px-2 py-0.5 rounded-full bg-flash-green/20 text-flash-green text-sm font-medium animate-pulse">
                {activeBets.length} Active
              </span>
            </div>

            {activeBets.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-border">
                <Zap size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg text-muted-foreground">Waiting for new flash bets...</p>
                <p className="text-sm text-muted-foreground mt-2">New markets open every few seconds</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBets.map((bet) => (
                  <FlashBetCard
                    key={bet.id}
                    bet={bet}
                    onPlaceBet={placeBet}
                    isConnected={!!account}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Results - 1 column sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <History size={24} className="text-muted-foreground" />
                <h2 className="text-xl font-bold">Recent Results</h2>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card/30 p-4">
                <RecentBets bets={recentBets} />
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <section className="mt-16 py-12 border-t border-border/50">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Choose Your Side',
                description: 'Pick your prediction for the next live event moment',
                icon: '🎯',
              },
              {
                step: '2',
                title: 'Bet Fast',
                description: 'You have ~10 seconds before the market closes',
                icon: '⚡',
              },
              {
                step: '3',
                title: 'Win Instantly',
                description: 'Results are resolved immediately, payouts are instant',
                icon: '💰',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="text-center p-6 rounded-2xl bg-card/30 border border-border/50"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Built on Sui • Powered by Flash Transactions</p>
          <p className="mt-2 text-xs">Bet responsibly. Gambling can be addictive.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
