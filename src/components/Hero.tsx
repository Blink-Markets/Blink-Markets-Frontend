import { Zap, Timer, Gauge } from 'lucide-react';

export function Hero() {
    return (
        <div className="text-center py-12 mb-8">
            {/* Logo/Title */}
            <div className="inline-flex items-center gap-3 mb-4">
                <div className="relative">
                    <Zap
                        size={48}
                        className="text-flash-green"
                        fill="currentColor"
                    />
                    <div className="absolute inset-0 blur-xl bg-flash-green/30" />
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight">
                    <span className="gradient-text">Blink</span>
                    <span className="text-foreground">Market</span>
                </h1>
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Ultra-fast flash bets on live events.
                <span className="text-flash-orange font-semibold"> 10 seconds</span> to bet.
                <span className="text-flash-green font-semibold"> Instant payouts.</span>
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-flash-green/10 border border-flash-green/30 text-flash-green">
                    <Timer size={16} />
                    <span className="text-sm font-medium">10s Markets</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-flash-blue/10 border border-flash-blue/30 text-flash-blue">
                    <Gauge size={16} />
                    <span className="text-sm font-medium">Sui Speed</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-flash-purple/10 border border-flash-purple/30 text-flash-purple">
                    <Zap size={16} />
                    <span className="text-sm font-medium">Live Events</span>
                </div>
            </div>
        </div>
    );
}
