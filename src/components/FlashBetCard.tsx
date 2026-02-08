import { useState } from 'react';
import { FlashBet } from '../types/bet';
import { useCountdown } from '../hooks/useCountdown';
import { cn } from '../lib/utils';
import { Zap, Users, ChevronRight, Sparkles } from 'lucide-react';

interface FlashBetCardProps {
    bet: FlashBet;
    onPlaceBet: (betId: string, choice: 'A' | 'B', amount: number) => Promise<void>;
    onOpenBet?: (betId: string) => Promise<void>;
    isConnected: boolean;
}

const BET_AMOUNTS = [0.01, 0.05, 0.1, 0.25];

export function FlashBetCard({ bet, onPlaceBet, onOpenBet, isConnected }: FlashBetCardProps) {
    const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);
    const [betAmount, setBetAmount] = useState<number>(0.05);
    const [isPlacing, setIsPlacing] = useState(false);
    const [isOpening, setIsOpening] = useState(false);

    const duration = bet.expiresAt - bet.createdAt;
    const { isUrgent, isCritical, isExpired, formattedTime } = useCountdown(
        bet.expiresAt,
        duration
    );

    const handlePlaceBet = async () => {
        if (!selectedChoice || isExpired || !isConnected) return;

        setIsPlacing(true);
        try {
            await onPlaceBet(bet.id, selectedChoice, betAmount);
            setSelectedChoice(null);
        } finally {
            setIsPlacing(false);
        }
    };

    const handleOpenBet = async () => {
        if (!onOpenBet || !isConnected) return;
        setIsOpening(true);
        try {
            await onOpenBet(bet.id);
        } finally {
            setIsOpening(false);
        }
    };

    const isCreated = bet.status === 'created';

    return (
        <div
            className={cn(
                'group relative flex flex-col rounded-2xl transition-all duration-300 ease-out',
                'backdrop-blur-sm overflow-hidden',
                (isExpired || isCreated) && 'opacity-90',
                isCritical && !isExpired && !isCreated && 'animate-[shake_0.4s_ease-in-out_infinite]',
            )}
            style={{
                background: isCreated
                    ? 'rgba(77, 162, 255, 0.12)'
                    : isExpired
                        ? 'rgba(107, 124, 149, 0.1)'
                        : isCritical
                            ? 'rgba(255, 77, 106, 0.12)'
                            : isUrgent
                                ? 'rgba(255, 184, 77, 0.12)'
                                : 'rgba(0, 229, 160, 0.12)',
                borderColor: isCreated
                    ? 'rgba(77, 162, 255, 0.3)'
                    : isExpired
                        ? 'rgba(107, 124, 149, 0.2)'
                        : isCritical
                            ? 'rgba(255, 77, 106, 0.3)'
                            : isUrgent
                                ? 'rgba(255, 184, 77, 0.3)'
                                : 'rgba(0, 229, 160, 0.3)',
                boxShadow: isCritical && !isExpired
                    ? '0 0 30px rgba(255, 77, 106, 0.15)'
                    : isUrgent && !isExpired
                        ? '0 0 25px rgba(255, 184, 77, 0.1)'
                        : '0 8px 32px rgba(0, 0, 0, 0.3)',
                color: isCreated
                    ? '#4DA2FF'
                    : isExpired
                        ? '#6B7C95'
                        : isCritical
                            ? '#FF4D6A'
                            : isUrgent
                                ? '#FFB84D'
                                : '#00E5A0',
            }}
        >
            {!isExpired && !isCreated && <div className="live-dot" />}
            <span className={cn(
                isCritical && !isExpired && !isCreated && 'animate-[countdown-tick_1s_ease-in-out_infinite]'
            )}>
                {isCreated ? 'NOT OPEN' : isExpired ? 'CLOSED' : `${formattedTime}s`}
            </span>
            <div className="p-5 flex flex-col h-full relative z-10">

                {/* Title & Description */}
                <h3 className="text-lg font-bold mb-1.5 text-foreground leading-tight">
                    {bet.title}
                </h3>
                {bet.description && (
                    <p className="text-sm text-foreground-tertiary mb-5 line-clamp-2 leading-relaxed">
                        {bet.description}
                    </p>
                )}

                {/* Open Event Action */}
                {isCreated ? (
                    <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <p className="text-sm text-blue-300 mb-3">Event created. Waiting to open for betting.</p>
                        {onOpenBet && isConnected && (
                            <button
                                onClick={handleOpenBet}
                                disabled={isOpening}
                                className={cn(
                                    "w-full py-2 rounded-lg text-sm font-semibold transition-colors",
                                    "bg-blue-500 hover:bg-blue-600 text-white",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {isOpening ? 'Opening...' : 'Open Event for Betting'}
                            </button>
                        )}
                    </div>
                ) : (
                    /* Outcome Buttons */
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
                )}

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
