import { useState } from 'react';
import { FlashBet, CATEGORY_ICONS, CATEGORY_COLORS } from '../types/bet';
import { useCountdown } from '../hooks/useCountdown';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { Zap, TrendingUp, Users } from 'lucide-react';

interface FlashBetCardProps {
    bet: FlashBet;
    onPlaceBet: (betId: string, choice: 'A' | 'B', amount: number) => void;
    isConnected: boolean;
}

const BET_AMOUNTS = [10, 50, 100, 500];

export function FlashBetCard({ bet, onPlaceBet, isConnected }: FlashBetCardProps) {
    const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);
    const [betAmount, setBetAmount] = useState<number>(50);
    const [isPlacing, setIsPlacing] = useState(false);

    const duration = bet.expiresAt - bet.createdAt;
    const { timeLeft, percentage, isUrgent, isCritical, isExpired, formattedTime } = useCountdown(
        bet.expiresAt,
        duration
    );

    const handlePlaceBet = async () => {
        if (!selectedChoice || isExpired || !isConnected) return;

        setIsPlacing(true);
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 300));
        onPlaceBet(bet.id, selectedChoice, betAmount);
        setIsPlacing(false);
        setSelectedChoice(null);
    };

    const totalBets = bet.optionA.totalBets + bet.optionB.totalBets;
    const oddsA = totalBets > 0 ? ((bet.optionB.totalBets / totalBets) * 2).toFixed(2) : bet.optionA.odds.toFixed(2);
    const oddsB = totalBets > 0 ? ((bet.optionA.totalBets / totalBets) * 2).toFixed(2) : bet.optionB.odds.toFixed(2);

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border transition-all duration-300',
                'bg-card/80 backdrop-blur-xl',
                isExpired ? 'opacity-60 grayscale' : '',
                isCritical && !isExpired && 'animate-[shake_0.3s_ease-in-out_infinite] border-flash-red',
                isUrgent && !isExpired && 'border-flash-orange',
                !isUrgent && !isCritical && !isExpired && 'border-border hover:border-primary/50'
            )}
        >
            {/* Countdown Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary">
                <div
                    className={cn(
                        'h-full transition-all duration-100 ease-linear',
                        percentage > 50 ? 'bg-flash-green' : percentage > 20 ? 'bg-flash-orange' : 'bg-flash-red'
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                'px-2 py-1 rounded-md text-xs font-medium border',
                                CATEGORY_COLORS[bet.category]
                            )}
                        >
                            {CATEGORY_ICONS[bet.category]} {bet.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users size={12} />
                            <span>{totalBets.toLocaleString()} bets</span>
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    <div
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-lg',
                            isExpired && 'bg-muted text-muted-foreground',
                            isCritical && !isExpired && 'bg-flash-red/20 text-flash-red countdown-critical',
                            isUrgent && !isExpired && 'bg-flash-orange/20 text-flash-orange countdown-urgent',
                            !isUrgent && !isCritical && !isExpired && 'bg-flash-green/20 text-flash-green'
                        )}
                    >
                        <Zap size={16} className={cn(!isExpired && 'animate-pulse')} />
                        <span>{isExpired ? 'ENDED' : `${formattedTime}s`}</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-4 text-foreground">{bet.title}</h3>

                {/* Betting Options */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Option A */}
                    <button
                        onClick={() => !isExpired && setSelectedChoice('A')}
                        disabled={isExpired}
                        className={cn(
                            'relative p-4 rounded-xl border-2 transition-all duration-200',
                            'hover:scale-[1.02] active:scale-[0.98]',
                            selectedChoice === 'A'
                                ? 'border-flash-green bg-flash-green/10 shadow-lg shadow-flash-green/20'
                                : 'border-border bg-secondary/50 hover:border-flash-green/50',
                            isExpired && 'hover:scale-100 cursor-not-allowed'
                        )}
                    >
                        <div className="text-lg font-bold mb-1">{bet.optionA.label}</div>
                        <div className="flex items-center justify-center gap-1 text-flash-green font-mono">
                            <TrendingUp size={14} />
                            <span>{oddsA}x</span>
                        </div>
                        {selectedChoice === 'A' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-flash-green rounded-full flex items-center justify-center">
                                <span className="text-xs">✓</span>
                            </div>
                        )}
                    </button>

                    {/* Option B */}
                    <button
                        onClick={() => !isExpired && setSelectedChoice('B')}
                        disabled={isExpired}
                        className={cn(
                            'relative p-4 rounded-xl border-2 transition-all duration-200',
                            'hover:scale-[1.02] active:scale-[0.98]',
                            selectedChoice === 'B'
                                ? 'border-flash-orange bg-flash-orange/10 shadow-lg shadow-flash-orange/20'
                                : 'border-border bg-secondary/50 hover:border-flash-orange/50',
                            isExpired && 'hover:scale-100 cursor-not-allowed'
                        )}
                    >
                        <div className="text-lg font-bold mb-1">{bet.optionB.label}</div>
                        <div className="flex items-center justify-center gap-1 text-flash-orange font-mono">
                            <TrendingUp size={14} />
                            <span>{oddsB}x</span>
                        </div>
                        {selectedChoice === 'B' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-flash-orange rounded-full flex items-center justify-center">
                                <span className="text-xs">✓</span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Bet Amount Selection */}
                {selectedChoice && !isExpired && (
                    <div className="animate-[slide-up_0.2s_ease-out] space-y-3">
                        <div className="flex gap-2">
                            {BET_AMOUNTS.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => setBetAmount(amount)}
                                    className={cn(
                                        'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                                        betAmount === amount
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary hover:bg-accent'
                                    )}
                                >
                                    {amount} SUI
                                </button>
                            ))}
                        </div>

                        <Button
                            variant={selectedChoice === 'A' ? 'bet-a' : 'bet-b'}
                            size="lg"
                            className="w-full"
                            onClick={handlePlaceBet}
                            disabled={!isConnected || isPlacing}
                        >
                            {!isConnected ? (
                                'Connect Wallet to Bet'
                            ) : isPlacing ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⟳</span> Placing Bet...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Zap size={18} />
                                    Place {betAmount} SUI on {selectedChoice === 'A' ? bet.optionA.label : bet.optionB.label}
                                </span>
                            )}
                        </Button>
                    </div>
                )}

                {/* Pool Info */}
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Pool Size</span>
                    <span className="font-mono font-bold text-foreground">
                        {bet.totalPool.toLocaleString()} SUI
                    </span>
                </div>
            </div>
        </div>
    );
}
