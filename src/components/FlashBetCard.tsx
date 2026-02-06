import { useState } from 'react';
import { FlashBet, CATEGORIES } from '../types/bet';
import { useCountdown } from '../hooks/useCountdown';
import { cn } from '../lib/utils';
import { Zap, Users, ChevronRight, Sparkles } from 'lucide-react';

interface FlashBetCardProps {
    bet: FlashBet;
    onPlaceBet: (betId: string, choice: 'A' | 'B', amount: number) => void;
    isConnected: boolean;
}

const BET_AMOUNTS = [10, 25, 50, 100];

export function FlashBetCard({ bet, onPlaceBet, isConnected }: FlashBetCardProps) {
    const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);
    const [betAmount, setBetAmount] = useState<number>(25);
    const [isPlacing, setIsPlacing] = useState(false);

    const duration = bet.expiresAt - bet.createdAt;
    const { percentage, isUrgent, isCritical, isExpired, formattedTime } = useCountdown(
        bet.expiresAt,
        duration
    );

    const handlePlaceBet = async () => {
        if (!selectedChoice || isExpired || !isConnected) return;

        setIsPlacing(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        onPlaceBet(bet.id, selectedChoice, betAmount);
        setIsPlacing(false);
        setSelectedChoice(null);
    };

    const category = CATEGORIES.find(c => c.id === bet.category);

    // Determine progress bar color
    const progressColor = percentage > 50
        ? 'linear-gradient(90deg, #00E5A0, #00F5B8)'
        : percentage > 20
            ? 'linear-gradient(90deg, #FFB84D, #FFC870)'
            : 'linear-gradient(90deg, #FF4D6A, #FF6B81)';

    const progressGlow = percentage > 50
        ? 'rgba(0, 229, 160, 0.5)'
        : percentage > 20
            ? 'rgba(255, 184, 77, 0.5)'
            : 'rgba(255, 77, 106, 0.5)';

    return (
        <div
            className={cn(
                'group relative flex flex-col rounded-2xl transition-all duration-300 ease-out',
                'backdrop-blur-sm overflow-hidden',
                isExpired && 'opacity-50 pointer-events-none',
                isCritical && !isExpired && 'animate-[shake_0.4s_ease-in-out_infinite]',
            )}
            style={{
                background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.95) 0%, rgba(15, 31, 56, 0.9) 100%)',
                border: isCritical && !isExpired
                    ? '1px solid rgba(255, 77, 106, 0.5)'
                    : isUrgent && !isExpired
                        ? '1px solid rgba(255, 184, 77, 0.4)'
                        : '1px solid rgba(77, 162, 255, 0.15)',
                boxShadow: isCritical && !isExpired
                    ? '0 0 30px rgba(255, 77, 106, 0.15)'
                    : isUrgent && !isExpired
                        ? '0 0 25px rgba(255, 184, 77, 0.1)'
                        : '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
        >
            {/* Animated top border */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-70"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(77, 162, 255, 0.6), rgba(0, 212, 255, 0.6), transparent)',
                }}
            />

            {/* Progress bar at top */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden bg-[#1A2D45]/50">
                <div
                    className="h-full transition-all duration-100 ease-linear rounded-full"
                    style={{
                        width: `${percentage}%`,
                        background: progressColor,
                        boxShadow: `0 0 10px ${progressGlow}`
                    }}
                />
            </div>

            {/* Card Content */}
            <div className="p-5 pt-6 flex-1 flex flex-col">
                {/* Header with category and timer */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Market Image */}
                        {bet.imageUrl && (
                            <div className="relative">
                                <div
                                    className="absolute inset-0 rounded-xl blur-lg opacity-40"
                                    style={{ background: 'rgba(77, 162, 255, 0.3)' }}
                                />
                                <div className="relative w-11 h-11 rounded-xl overflow-hidden ring-2 ring-[#4DA2FF]/30 flex-shrink-0">
                                    <img
                                        src={bet.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border backdrop-blur-sm"
                                style={{
                                    background: 'rgba(77, 162, 255, 0.08)',
                                    borderColor: 'rgba(77, 162, 255, 0.2)',
                                    color: '#4DA2FF'
                                }}
                            >
                                <span>{category?.icon}</span>
                                <span>{category?.label}</span>
                            </span>
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    <div
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-xl font-mono font-bold text-base',
                            'border transition-all duration-200'
                        )}
                        style={{
                            background: isExpired
                                ? 'rgba(107, 124, 149, 0.1)'
                                : isCritical
                                    ? 'rgba(255, 77, 106, 0.12)'
                                    : isUrgent
                                        ? 'rgba(255, 184, 77, 0.12)'
                                        : 'rgba(0, 229, 160, 0.12)',
                            borderColor: isExpired
                                ? 'rgba(107, 124, 149, 0.2)'
                                : isCritical
                                    ? 'rgba(255, 77, 106, 0.3)'
                                    : isUrgent
                                        ? 'rgba(255, 184, 77, 0.3)'
                                        : 'rgba(0, 229, 160, 0.3)',
                            color: isExpired
                                ? '#6B7C95'
                                : isCritical
                                    ? '#FF4D6A'
                                    : isUrgent
                                        ? '#FFB84D'
                                        : '#00E5A0',
                        }}
                    >
                        {!isExpired && <div className="live-dot" />}
                        <span className={cn(
                            isCritical && !isExpired && 'animate-[countdown-tick_1s_ease-in-out_infinite]'
                        )}>
                            {isExpired ? 'CLOSED' : `${formattedTime}s`}
                        </span>
                    </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold mb-1.5 text-foreground leading-tight">
                    {bet.title}
                </h3>
                {bet.description && (
                    <p className="text-sm text-foreground-tertiary mb-5 line-clamp-2 leading-relaxed">
                        {bet.description}
                    </p>
                )}

                {/* Outcome Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Option A */}
                    <button
                        onClick={() => !isExpired && setSelectedChoice('A')}
                        disabled={isExpired}
                        className={cn(
                            'outcome-btn outcome-btn-a relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                            selectedChoice === 'A' ? 'selected' : 'hover:border-[#00E5A0]/40',
                            isExpired && 'cursor-not-allowed'
                        )}
                        style={{
                            background: selectedChoice === 'A'
                                ? 'rgba(0, 229, 160, 0.12)'
                                : 'rgba(26, 45, 69, 0.5)',
                            borderColor: selectedChoice === 'A'
                                ? '#00E5A0'
                                : 'rgba(77, 162, 255, 0.15)',
                            boxShadow: selectedChoice === 'A'
                                ? '0 0 30px rgba(0, 229, 160, 0.2), inset 0 0 20px rgba(0, 229, 160, 0.05)'
                                : 'none'
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-foreground truncate">
                                {bet.optionA.shortLabel || bet.optionA.label}
                            </span>
                            <span
                                className="font-bold text-lg"
                                style={{ color: '#00E5A0' }}
                            >
                                {bet.optionA.odds.toFixed(2)}x
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div className="progress-track h-1.5 mb-1.5">
                            <div
                                className="progress-bar-a h-full rounded-full transition-all duration-300"
                                style={{ width: `${bet.optionA.percentage}%` }}
                            />
                        </div>
                        <span className="text-xs text-foreground-tertiary">
                            {bet.optionA.percentage}% · {bet.optionA.totalBets.toLocaleString()} SUI
                        </span>
                    </button>

                    {/* Option B */}
                    <button
                        onClick={() => !isExpired && setSelectedChoice('B')}
                        disabled={isExpired}
                        className={cn(
                            'outcome-btn outcome-btn-b relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                            selectedChoice === 'B' ? 'selected' : 'hover:border-[#FFB84D]/40',
                            isExpired && 'cursor-not-allowed'
                        )}
                        style={{
                            background: selectedChoice === 'B'
                                ? 'rgba(255, 184, 77, 0.12)'
                                : 'rgba(26, 45, 69, 0.5)',
                            borderColor: selectedChoice === 'B'
                                ? '#FFB84D'
                                : 'rgba(77, 162, 255, 0.15)',
                            boxShadow: selectedChoice === 'B'
                                ? '0 0 30px rgba(255, 184, 77, 0.2), inset 0 0 20px rgba(255, 184, 77, 0.05)'
                                : 'none'
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-foreground truncate">
                                {bet.optionB.shortLabel || bet.optionB.label}
                            </span>
                            <span
                                className="font-bold text-lg"
                                style={{ color: '#FFB84D' }}
                            >
                                {bet.optionB.odds.toFixed(2)}x
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div className="progress-track h-1.5 mb-1.5">
                            <div
                                className="progress-bar-b h-full rounded-full transition-all duration-300"
                                style={{ width: `${bet.optionB.percentage}%` }}
                            />
                        </div>
                        <span className="text-xs text-foreground-tertiary">
                            {bet.optionB.percentage}% · {bet.optionB.totalBets.toLocaleString()} SUI
                        </span>
                    </button>
                </div>

                {/* Bet Amount Selection - Shows when an option is selected */}
                {selectedChoice && !isExpired && (
                    <div className="animate-[slide-up_0.3s_ease-out] space-y-3 mt-auto">
                        <div className="flex gap-2">
                            {BET_AMOUNTS.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => setBetAmount(amount)}
                                    className={cn(
                                        'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                                        'border'
                                    )}
                                    style={{
                                        background: betAmount === amount
                                            ? 'linear-gradient(135deg, rgba(77, 162, 255, 0.2), rgba(0, 212, 255, 0.15))'
                                            : 'rgba(26, 45, 69, 0.5)',
                                        borderColor: betAmount === amount
                                            ? 'rgba(77, 162, 255, 0.4)'
                                            : 'rgba(77, 162, 255, 0.1)',
                                        color: betAmount === amount ? '#4DA2FF' : '#A3B8D5',
                                        boxShadow: betAmount === amount
                                            ? '0 4px 15px rgba(77, 162, 255, 0.2)'
                                            : 'none'
                                    }}
                                >
                                    {amount}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handlePlaceBet}
                            disabled={!isConnected || isPlacing}
                            className={cn(
                                'bet-button w-full py-3.5 rounded-xl font-semibold transition-all duration-200',
                                'flex items-center justify-center gap-2',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                            style={{
                                background: selectedChoice === 'A'
                                    ? 'linear-gradient(135deg, #00E5A0 0%, #00F5B8 50%, #00D4FF 100%)'
                                    : 'linear-gradient(135deg, #FFB84D 0%, #FFC870 50%, #FF9F43 100%)',
                                color: '#050B15',
                                boxShadow: selectedChoice === 'A'
                                    ? '0 8px 30px rgba(0, 229, 160, 0.35)'
                                    : '0 8px 30px rgba(255, 184, 77, 0.35)'
                            }}
                        >
                            {!isConnected ? (
                                'Connect Wallet'
                            ) : isPlacing ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles size={18} className="animate-spin" /> Placing...
                                </span>
                            ) : (
                                <>
                                    <Zap size={18} />
                                    Place {betAmount} SUI
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Footer Stats */}
                <div className={cn(
                    'flex items-center justify-between pt-4 mt-auto text-sm',
                    selectedChoice && !isExpired && 'mt-3'
                )}
                    style={{
                        borderTop: '1px solid rgba(77, 162, 255, 0.1)'
                    }}
                >
                    <div className="flex items-center gap-1.5 text-foreground-tertiary">
                        <Users size={14} />
                        <span>{bet.participants} bettors</span>
                    </div>
                    <div
                        className="font-mono font-semibold"
                        style={{
                            background: 'linear-gradient(90deg, #4DA2FF, #00D4FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        {bet.totalPool.toLocaleString()} SUI
                    </div>
                </div>
            </div>

            {/* Hover glow effect */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 50% 0%, rgba(77, 162, 255, 0.08), transparent 60%)'
                }}
            />
        </div>
    );
}
